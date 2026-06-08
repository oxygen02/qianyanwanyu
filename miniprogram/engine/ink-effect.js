// engine/ink-effect.js
// 油墨渗透效果渲染器
// 核心：主Canvas直接分层绘制（source-over），通过 shadowBlur + 逐字墨色变化 + 错位重影 + 飞白破损
// 实现"字迹印在纸上"的印刷质感。
// 2025-05-18 关键修正：multiply 在浅色纸张上会把深色墨迹压成灰色（26*232/255=23），
// 因此全部改为 source-over，确保墨迹在米色纸上清晰可见。
// 2025-05-18 重构：加大各层参数，新增纤维渗透层、飞白层，让印刷感肉眼可见。
// 2025-05-21 新增：支持使用 opentype.js 直接渲染字形，避免 wx.loadFontFace 的限制

const opentype = require('../utils/opentype.min.js')

const FONT_CACHE_DIR = `${wx.env.USER_DATA_PATH}/font_cache`
const FONT_CACHE_INFO_KEY = 'font_cache_info'

function getFS() {
  return wx.getFileSystemManager()
}

let _cachedFonts = {}
const _opentypeDisabledFonts = {}
let _isSimulatorEnvironment = null

// 早期模拟器检测：在模块加载时立即检测，避免首次渲染时才触发OpenType失败
// 检测方法：尝试读取一个已知的小文件，检查返回的数据类型
;(function _earlySimulatorDetect() {
  try {
    const fs = getFS()
    // 尝试读取 font_cache 目录下的任意文件来检测环境
    // 如果 fs.readFile 返回的是 opaque native object 而非 ArrayBuffer，则是模拟器
    const testPath = `${wx.env.USER_DATA_PATH}/_sim_detect_test`
    fs.writeFile({
      filePath: testPath,
      data: 'SIM',
      encoding: 'ascii',
      success: () => {
        fs.readFile({
          filePath: testPath,
          success: (res) => {
            try {
              toArrayBuffer(res.data)
              // 如果 toArrayBuffer 成功说明是真机
              _isSimulatorEnvironment = false
            } catch (e) {
              if (e && e.message && e.message.includes('opaque native object')) {
                _isSimulatorEnvironment = true
                console.log('[ink-effect] 早期检测到模拟器环境，跳过OpenType渲染路径')
              }
            }
            // 清理测试文件
            try { fs.unlinkSync(testPath) } catch (_) {}
          },
          fail: () => {
            // 文件读取失败不影响，保持 null（延迟检测）
            try { fs.unlinkSync(testPath) } catch (_) {}
          }
        })
      },
      fail: () => {
        // 写入失败也不影响
      }
    })
  } catch (e) {
    // 检测异常不影响正常流程
  }
})()

function getPixelRatio() {
  try {
    if (wx.getWindowInfo) {
      return wx.getWindowInfo().pixelRatio || 2
    }
    if (wx.getDeviceInfo) {
      return wx.getDeviceInfo().pixelRatio || 2
    }
    if (wx.getSystemInfoSync) {
      return wx.getSystemInfoSync().pixelRatio || 2
    }
  } catch (e) {}
  return 2
}

function toArrayBuffer(data) {
  if (!data) {
    throw new Error('字体数据为空')
  }

  // 快速可用性检测：如果是 opaque 原生对象（模拟器特有），提前拒绝
  const type = typeof data
  if (type === 'object' && data !== null) {
    const hasBuffer = data.buffer instanceof ArrayBuffer
    const hasData = data.data != null && data.data !== data
    const hasLength = typeof data.length === 'number'
    const hasKeys = Object.keys(data).length > 0
    const isArray = Array.isArray(data)
    const hasTypeBuf = data.type === 'Buffer'

    if (!hasBuffer && !hasData && !hasLength && !hasKeys && !isArray && !hasTypeBuf) {
      _isSimulatorEnvironment = true
      throw new Error(`不支持的字体数据类型: opaque native object (模拟器环境)`)
    }
  }

  if (data instanceof ArrayBuffer) {
    return data
  }

  if (ArrayBuffer.isView(data)) {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
  }

  if (typeof data === 'string') {
    const str = unescape(encodeURIComponent(data))
    const bytes = new Uint8Array(str.length)
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i) & 0xff
    }
    return bytes.buffer
  }

  if (Array.isArray(data)) {
    return new Uint8Array(data).buffer
  }

  if (typeof data === 'object') {
    const hasBuffer = data.buffer instanceof ArrayBuffer
    const hasData = data.data != null && data.data !== data
    const hasLength = typeof data.length === 'number'
    const hasKeys = Object.keys(data).length > 0
    const isArray = Array.isArray(data)
    const hasTypeBuf = data.type === 'Buffer'
    if (!hasBuffer && !hasData && !hasLength && !hasKeys && !isArray && !hasTypeBuf) {
      throw new Error(`不支持的字体数据类型: opaque native object (模拟器环境)`)
    }

    if (data.type === 'Buffer' && Array.isArray(data.data)) {
      return new Uint8Array(data.data).buffer
    }

    if (data.data != null && data.data !== data) {
      try {
        return toArrayBuffer(data.data)
      } catch (e) {}
    }

    if (data.buffer instanceof ArrayBuffer) {
      return data.buffer
    }

    if (typeof data.length === 'number' && data.length >= 0 && data.length < 100000000) {
      try {
        return new Uint8Array(data).buffer
      } catch (e) {}
    }

    const numericKeys = Object.keys(data).filter((k) => /^\d+$/.test(k))
    if (numericKeys.length > 0) {
      const maxIdx = Math.max(...numericKeys.map((k) => Number(k)))
      if (maxIdx > 100 && maxIdx < 100000000) {
        const bytes = new Uint8Array(maxIdx + 1)
        for (const k of numericKeys) {
          bytes[Number(k)] = Number(data[k]) & 0xff
        }
        return bytes.buffer
      }
    }

    const forInKeys = []
    for (const key in data) {
      forInKeys.push(key)
    }
    if (forInKeys.length > 0) {
      const numericForIn = forInKeys.filter((k) => /^\d+$/.test(k))
      if (numericForIn.length > 10) {
        const maxIdx = Math.max(...numericForIn.map((k) => Number(k)))
        if (maxIdx > 100 && maxIdx < 100000000) {
          const bytes = new Uint8Array(maxIdx + 1)
          for (const k of numericForIn) {
            bytes[Number(k)] = Number(data[k]) & 0xff
          }
          return bytes.buffer
        }
      }
    }

    try {
      const jsonStr = JSON.stringify(data)
      if (jsonStr && jsonStr.startsWith('[') && jsonStr.length > 100) {
        const arr = JSON.parse(jsonStr)
        return new Uint8Array(arr).buffer
      }
    } catch (e) {}
  }

  throw new Error(`不支持的字体数据类型: ${type}, keys: ${type === 'object' ? Object.keys(data).slice(0,5).join(',') : 'N/A'}, hasLength: ${type === 'object' ? !!data.length : 'N/A'}`)
}

async function loadFontFromCache(fontId) {
  if (_cachedFonts[fontId]) {
    return _cachedFonts[fontId]
  }
  if (_isSimulatorEnvironment === true) {
    throw new Error('opentype_disabled: simulator_environment')
  }
  
  return new Promise((resolve, reject) => {
    const fs = getFS()
    let filePath = null
    try {
      const cacheInfo = wx.getStorageSync(FONT_CACHE_INFO_KEY) || {}
      if (cacheInfo[fontId] && cacheInfo[fontId].path) {
        filePath = cacheInfo[fontId].path
        console.log('[ink-effect] 从storage找到字体路径:', fontId, '→', filePath)
      } else {
        console.log('[ink-effect] opentype缓存未命中(正常):', fontId)
      }
    } catch (e) {
      console.warn('[ink-effect] 读取font cache storage异常:', e)
    }
    if (!filePath) {
      const candidates = [
        `${FONT_CACHE_DIR}/${fontId}.ttf`,
        `${FONT_CACHE_DIR}/${fontId}.otf`,
        `${FONT_CACHE_DIR}/${fontId}.ttc`
      ]
      for (const p of candidates) {
        try {
          fs.accessSync(p)
          filePath = p
          console.log('[ink-effect] 通过路径猜测找到字体:', p)
          break
        } catch (e) {}
      }
    }
    if (!filePath) {
      reject(new Error(`本地未找到字体缓存: ${fontId}`))
      return
    }
    
    fs.readFile({
      filePath: filePath,
      success: (res) => {
        try {
          const fontBuffer = toArrayBuffer(res.data)
          console.log('[ink-effect] 字体文件读取成功:', fontId, '大小:', fontBuffer.byteLength, 'bytes')
          const font = opentype.parse(fontBuffer)
          _cachedFonts[fontId] = font
          resolve(font)
        } catch (err) {
          console.warn('[ink-effect] opentype.parse解析失败:', fontId, '（模拟器已知问题，真机不影响）')
          reject(err)
        }
      },
      fail: (err) => {
        console.error('[ink-effect] 读取字体文件失败:', filePath, err)
        reject(err)
      }
    })
  })
}

async function getGlyphPaths(font, glyphs, fontSize) {
  const paths = []
  const scale = fontSize / font.unitsPerEm
  
  for (const g of glyphs) {
    if (!g.text || g.text === ' ') continue
    
    const glyph = font.charToGlyph(g.text)
    if (glyph) {
      const path = glyph.getPath(g.x, g.y, fontSize)
      paths.push({
        path: path,
        x: g.x,
        y: g.y,
        text: g.text,
        advanceWidth: glyph.advanceWidth * scale
      })
    }
  }
  
  return paths
}

/**
 * 解析颜色字符串为 {r,g,b}
 */
function parseColor(hex) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16)
  }
}

/**
 * 从 font-family 字符串中提取第一个有效字体名
 * 微信小程序 Canvas 2D 不支持 CSS 字体回退列表（逗号分隔），
 * 如果 family 含逗号，Canvas 会把它当成一个整体字体名来查找，找不到就回退到系统默认字体。
 */
function sanitizeFontFamily(family) {
  if (!family) return 'serif'
  let f = family.trim().replace(/^["']|["']$/g, '')
  if (f.includes(',')) {
    f = f.split(',')[0].trim().replace(/^["']|["']$/g, '')
  }
  return f || 'serif'
}

/**
 * 多道渲染绘制单个文字（保留，供外部调用）
 */
function drawInkChar(ctx, char, x, y, inkConfig, fontConfig, fontSize) {
  const inkColor = parseColor(inkConfig.color || '#1A1008')
  const variation = inkConfig.variation || 0.05
  const blurRadius = inkConfig.blurRadius || 0.3
  const opacity = inkConfig.opacity || 0.88

  const vr = (Math.random() - 0.5) * variation * 55
  const vg = (Math.random() - 0.5) * variation * 35
  const vb = (Math.random() - 0.5) * variation * 22

  const r = Math.max(0, Math.min(255, inkColor.r + vr))
  const gVal = Math.max(0, Math.min(255, inkColor.g + vg))
  const bVal = Math.max(0, Math.min(255, inkColor.b + vb))

  const family = sanitizeFontFamily(fontConfig.family)
  const fontStr = `${fontConfig.weight || '400'} ${fontSize}px ${family}`

  ctx.save()

  // 第0道：铅字压痕阴影
  ctx.font = fontStr
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = `rgba(${r},${gVal},${bVal},${opacity * 0.45})`
  ctx.shadowColor = 'rgba(60,40,10,0.55)'
  ctx.shadowBlur = fontSize * 0.30
  ctx.shadowOffsetX = fontSize * 0.02
  ctx.shadowOffsetY = fontSize * 0.05
  ctx.fillText(char, x, y)
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  // 第1道：纤维渗透（大范围羽化）
  if (blurRadius > 0.05) {
    ctx.globalCompositeOperation = 'source-over'
    ctx.font = fontStr
    ctx.shadowColor = `rgba(${r},${gVal},${bVal},0.50)`
    ctx.shadowBlur = blurRadius * fontSize * 1.6
    ctx.fillStyle = `rgba(${r},${gVal},${bVal},${opacity * 0.35})`
    ctx.fillText(char, x, y)
    ctx.shadowBlur = 0
  }

  // 第2道：主体实墨层
  ctx.globalCompositeOperation = 'source-over'
  ctx.font = fontStr
  ctx.fillStyle = `rgba(${r},${gVal},${bVal},${Math.min(0.995, opacity * 1.08)})`
  ctx.fillText(char, x, y)

  // 第3道：边缘略淡层
  ctx.globalCompositeOperation = 'source-over'
  ctx.font = fontStr
  ctx.fillStyle = `rgba(255,255,255,0.05)`
  ctx.fillText(char, x, y)

  ctx.restore()
}

/**
 * 绘制品牌印章（铅言万语）
 * 可选配置项：默认开启，右下角显示
 * 使用真实印章图片 qianyanwanyu.png
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width - Canvas宽度
 * @param {number} height - Canvas高度
 * @param {string} fontFamily - 用户选择的字体
 * @param {object} config - 配置选项 { enabled: true, position: 'bottomRight' }
 */
async function drawBrandStamp(ctx, width, height, fontFamily, config) {
  if (!config || !config.enabled) return

  const dpr = getPixelRatio()
  const margin = 2 * dpr
  const sealSize = 21 * dpr

  let startX, startY
  const position = config.position || 'bottomCenter'

  if (position === 'bottomRight') {
    startX = width - margin - sealSize
    startY = height - margin
  } else if (position === 'bottomLeft') {
    startX = margin
    startY = height - margin
  } else if (position === 'bottomCenter') {
    startX = (width - sealSize) / 2
    startY = height - margin
  } else if (position === 'topRight') {
    startX = width - margin - sealSize
    startY = margin + sealSize / 2
  } else if (position === 'topLeft') {
    startX = margin
    startY = margin + sealSize / 2
  } else {
    startX = (width - sealSize) / 2
    startY = height - margin
  }

  try {
    const sealImg = await _loadSealImage()
    if (sealImg) {
      ctx.save()
      ctx.globalAlpha = 0.5
      ctx.drawImage(sealImg, startX, startY - sealSize, sealSize, sealSize)
      ctx.restore()
    }
  } catch (e) {
    console.warn('[ink-effect] 品牌印章图片加载失败:', e)
  }
}

/**
 * 加载品牌印章图片（缓存）
 * 路径：/qianyanwanyu.png
 */
let _sealImageCache = null
let _sealImageLoading = false
function _loadSealImage() {
  return new Promise((resolve) => {
    if (_sealImageCache) {
      resolve(_sealImageCache)
      return
    }
    if (_sealImageLoading) {
      resolve(null)
      return
    }
    _sealImageLoading = true
    try {
      const canvas = wx.createOffscreenCanvas({ type: '2d', width: 1, height: 1 })
      const img = canvas.createImage()
      img.onload = () => {
        _sealImageCache = img
        _sealImageLoading = false
        resolve(img)
      }
      img.onerror = () => {
        _sealImageLoading = false
        resolve(null)
      }
      img.src = '/images/qianyanwanyu.png'
    } catch (e) {
      _sealImageLoading = false
      resolve(null)
    }
  })
}

/**
 * 绘制一行文字（多字符）
 */
function drawInkLine(ctx, text, x, y, charWidth, letterSpacing, inkConfig, fontConfig, fontSize, direction) {
  const spacing = letterSpacing * fontSize

  if (direction === 'vertical') {
    for (let i = 0; i < text.length; i++) {
      drawInkChar(ctx, text[i], x, y + i * (charWidth + spacing), inkConfig, fontConfig, fontSize)
    }
  } else {
    for (let i = 0; i < text.length; i++) {
      drawInkChar(ctx, text[i], x + i * (charWidth + spacing), y, inkConfig, fontConfig, fontSize)
    }
  }
}

/**
 * 批量绘制文字块（整页渲染）
 * 2025-05-18 重构：采用整文字块离屏分层渲染，效果从"几乎不可见"提升为"明显印刷感"
 *
 * 渲染层级（在主Canvas上直接叠加）：
 *   第0层：铅字压痕 - shadowBlur 大，低透明度，模拟铅字按压纸张的凹陷阴影
 *   第1层：纤维渗透 - 超大 shadowBlur，极低透明度，模拟墨水沿纸张纤维向四周扩散的羽化
 *   第2层：表层晕染 - 中等 shadowBlur，低透明度，模拟墨水在纸面表层的自然扩散
 *   第3层：主体实墨层 - 无阴影，逐字墨色随机变化（variation），模拟活字印刷墨色不均
 *   第4层：错位重影 - 偏移复制，极低透明度，模拟印刷套印时的微小偏差
 *   第5层：飞白破损 - 白色细线叠加，模拟缺墨或纸张纤维凸起造成的笔画缺损
 *   第6层：纸张凸起高光 - 极淡白色偏移覆盖，模拟纸张纤维凸起处墨迹被顶起的反光
 *
 * @param {CanvasRenderingContext2D} ctx - 主Canvas上下文
 * @param {Array} glyphs - 排版后的字符位置列表
 * @param {object} inkConfig - 油墨配置
 * @param {object} fontConfig - 字体配置
 * @param {number} fontSize - 字号（物理像素）
 * @param {boolean} [previewMode] - 预览模式（效果强度翻倍）
 */
function drawInkBlock(ctx, glyphs, inkConfig, fontConfig, fontSize, layoutConfig, simpleMode, previewMode) {
  if (!glyphs || glyphs.length === 0) return

  // simpleMode: 简洁渲染模式（与 OpenType 路径视觉一致）
  // 当字体切换导致 OpenType 回退到传统路径时启用，避免多层阴影导致的"彩色"异常
  simpleMode = !!simpleMode

  // 确保 fontConfig 不为空
  if (!fontConfig) {
    fontConfig = { family: 'serif' }
  }

  const previewMul = previewMode ? 1.8 : 1.0  // 预览模式下加强效果
  const inkColor = parseColor(inkConfig.color || '#1A1008')
  const opacity = inkConfig.opacity ?? 0.88
  const variation = (inkConfig.variation ?? 0.05) * previewMul
  const blurRadius = (inkConfig.blurRadius ?? 0.3) * previewMul
  // 使用 ?? 而非 ||：misRegistration 可能为 0（关闭），|| 会把 0 当 falsy 回退到默认值
  const misReg = Math.min(0.5, (inkConfig.misRegistration ?? 0) * previewMul)
  // damage 同理，使用 ??
  const damage = Math.min(0.4, (inkConfig.damage ?? 0) * (previewMode ? 2.5 : 1.0))

  // 新增：文字描边配置
  const strokeEnabled = fontConfig.stroke || false
  const strokeWidth = fontConfig.strokeWidth || 1

  // 新增：排版配置（倾斜）
  const textSkew = (layoutConfig && layoutConfig.textSkew) || 0

  // 新增：墨色浸染配置
  const inkSpreadEnabled = !!inkConfig.inkSpread
  const inkSpreadIntensity = inkConfig.inkSpreadIntensity ?? 0

  // 新增：字体风化配置（独立效果，不依赖damage）
  const weatheringEnabled = !!inkConfig.weathering
  const weatheringIntensity = inkConfig.weatheringIntensity ?? 0

  // 字体族（清理非法字符）
  const family = sanitizeFontFamily(fontConfig.family)
  // 统一使用传入的 fontSize，不做 DPR 转换
  // 原因：renderer.js 的 _scaleTemplateForDPR 已不再对 fontSize 做 DPR 缩放
  //       typesetter.js 的 sizeScale 已在排版时处理了字号调整
  //       此处直接使用与 OpenType 路径相同的 fontSize，确保两条路径显示一致
  const fontStr = `${fontConfig.weight || '400'} ${fontSize}px ${family}`

  console.log('[ink-effect] drawInkBlock fontStr:', fontStr, 'glyphs:', glyphs.length,
    'opacity:', opacity.toFixed(2), 'variation:', variation.toFixed(2),
    'blur:', blurRadius.toFixed(2), 'misReg:', misReg.toFixed(2),
    'weathering:', weatheringEnabled, 'weatherInt:', weatheringIntensity.toFixed(2),
    'spread:', inkSpreadEnabled, 'spreadInt:', inkSpreadIntensity.toFixed(2),
    '(damage已移至纸张层)')

  ctx.save()
  ctx.font = fontStr
  ctx.textBaseline = 'alphabetic'

  // 应用文字倾斜
  if (textSkew !== 0) {
    const skewAngle = (textSkew * Math.PI) / 180
    ctx.transform(1, 0, Math.tan(skewAngle), 1, 0, 0)
  }

  // ===== [优化合并] 渲染策略：将原有的10层合并为3层 =====
  // 原10层：铅字压痕/纤维渗透/表层晕染/实墨/边缘浸润/渗色/错位/浸染/破损/压痕
  // 合并为3层：①墨迹渗透层(融合阴影+羽化) ②主体实墨+错位重影 ③飞白破损
  // 模拟墨水被纸张纤维吸收后的底层扩散——比文字略大、极淡、高度羽化
  // simpleMode下跳过此层，保持与OpenType路径一致的视觉效果
  if (!simpleMode) {
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = `rgba(${inkColor.r},${inkColor.g},${inkColor.b},${opacity * 0.25})`
    ctx.shadowColor = `rgba(${inkColor.r},${inkColor.g},${inkColor.b},0.35)`
    ctx.shadowBlur = fontSize * 0.50
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = fontSize * 0.02
    for (const g of glyphs) {
      if (!g.text || g.text === ' ') continue
      ctx.fillText(g.text, g.x, g.y)
    }
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }

  // ===== 第1层：纤维渗透（墨水沿纸张纤维间隙扩散）=====
  // 超大 shadowBlur 产生明显的边缘羽化，这是"印在纸上"感的关键
  if (!simpleMode && blurRadius > 0.05) {
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = `rgba(${inkColor.r},${inkColor.g},${inkColor.b},${opacity * 0.45})`
    ctx.shadowColor = `rgba(${inkColor.r},${inkColor.g},${inkColor.b},0.60)`
    ctx.shadowBlur = blurRadius * fontSize * 2.2
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    for (const g of glyphs) {
      if (!g.text || g.text === ' ') continue
      ctx.fillText(g.text, g.x, g.y)
    }
    ctx.shadowBlur = 0
  }

  // ===== 第2层：表层晕染（纸面表层的自然扩散）=====
  if (!simpleMode && blurRadius > 0.1) {
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = `rgba(${inkColor.r},${inkColor.g},${inkColor.b},${opacity * 0.60})`
    ctx.shadowColor = `rgba(${inkColor.r},${inkColor.g},${inkColor.b},0.45)`
    ctx.shadowBlur = blurRadius * fontSize * 1.0
    for (const g of glyphs) {
      if (!g.text || g.text === ' ') continue
      ctx.fillText(g.text, g.x, g.y)
    }
    ctx.shadowBlur = 0
  }

  // ===== 第3层：主体实墨层（核心——必须够深够实）=====
  // 使用 source-over 确保在浅色纸张上墨迹清晰可见
  ctx.globalCompositeOperation = 'source-over'
  if (simpleMode) {
    // simpleMode: 纯色实心填充，与 OpenType 路径的视觉效果完全一致
    // 不做 variation 随机变化，不做任何 shadow
    ctx.fillStyle = `rgba(${inkColor.r},${inkColor.g},${inkColor.b},${opacity})`
    for (const g of glyphs) {
      if (!g.text || g.text === ' ') continue
      ctx.fillText(g.text, g.x, g.y)
    }

    // 描边效果（simpleMode 也支持）
    if (strokeEnabled && strokeWidth > 0) {
      const sc = parseColor(inkConfig.color || '#1A1008')
      const actualStrokeWidth = Math.max(0.5, strokeWidth * ((layoutConfig && layoutConfig._dpr) || 2))
      console.log('[ink-effect] simpleMode描边: width=', strokeWidth, 'actual=', actualStrokeWidth.toFixed(1))
      ctx.save()
      ctx.strokeStyle = `rgba(${sc.r},${sc.g},${sc.b},${opacity * 0.6})`
      ctx.lineWidth = actualStrokeWidth
      ctx.lineJoin = 'round'
      ctx.miterLimit = 2
      for (const g of glyphs) {
        if (!g.text || g.text === ' ') continue
        ctx.strokeText(g.text, g.x, g.y)
      }
      ctx.restore()
    }
  } else {
    // 完整模式：带 variation 活字印刷效果 + stroke 描边
    for (let i = 0; i < glyphs.length; i++) {
      const g = glyphs[i]
      if (!g.text || g.text === ' ') continue

      const hash1 = ((i * 37 + (g.text.charCodeAt(0) || 0)) % 1000) / 1000
      const hash2 = (((hash1 * 7919) % 1000) / 1000)
      const hash3 = (((hash1 * 104729) % 1000) / 1000)

      const rnd = hash1 * 2 - 1
      const vr = rnd * variation * 220
      const vg = (hash2 * 2 - 1) * variation * 150
      const vb = (hash3 * 2 - 1) * variation * 100

      const r = Math.max(0, Math.min(255, inkColor.r + vr))
      const gVal = Math.max(0, Math.min(255, inkColor.g + vg))
      const bVal = Math.max(0, Math.min(255, inkColor.b + vb))

      const minOp = opacity * 0.90
      const maxOp = Math.min(0.995, opacity * 1.05)
      const charOpacity = minOp + (maxOp - minOp) * hash2

      ctx.fillStyle = `rgba(${r},${gVal},${bVal},${charOpacity})`
      ctx.fillText(g.text, g.x, g.y)

      if (strokeEnabled && strokeWidth > 0) {
        const strokeColor = inkConfig.strokeColor || inkConfig.color || '#1A1008'
        const sc = parseColor(strokeColor)
        const strokeOpacity = charOpacity * 0.6
        ctx.strokeStyle = `rgba(${sc.r},${sc.g},${sc.b},${strokeOpacity})`
        ctx.lineWidth = strokeWidth
        ctx.strokeText(g.text, g.x, g.y)
      }
    }
  }

  // ===== 第3.5层：边缘微浸润（让字迹边缘与纸张自然过渡）=====
  // 叠加一个极微模糊的副本，模拟墨水沿纸张纤维的细微扩散
  if (!simpleMode && blurRadius > 0.05) {
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = `rgba(${inkColor.r},${inkColor.g},${inkColor.b},${opacity * 0.22})`
    ctx.shadowColor = `rgba(${inkColor.r},${inkColor.g},${inkColor.b},0.30)`
    ctx.shadowBlur = fontSize * 0.08
    for (const g of glyphs) {
      if (!g.text || g.text === ' ') continue
      ctx.fillText(g.text, g.x, g.y)
    }
    ctx.shadowBlur = 0
  }

  // ===== 第4层：颜色渗色（chromatic bleed / 印刷套色偏差）=====
  // 模拟传统印刷中不同颜色通道的微小偏移，产生边缘彩色光晕
  const bleedLevel = Math.min(1, Math.max(0, misReg))
  if (!simpleMode && bleedLevel > 0.05) {
    const bleedOffset = fontSize * 0.06 * bleedLevel
    const bleedAlpha = opacity * 0.25 * bleedLevel

    // 红色通道偏移（向左上）
    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = `rgba(${Math.min(255, inkColor.r + 40)},${inkColor.g},${inkColor.b},${bleedAlpha})`
    ctx.shadowColor = `rgba(${Math.min(255, inkColor.r + 40)},${inkColor.g},${inkColor.b},0.3)`
    ctx.shadowBlur = fontSize * 0.1
    for (const g of glyphs) {
      if (!g.text || g.text === ' ') continue
      ctx.fillText(g.text, g.x - bleedOffset, g.y - bleedOffset)
    }
    ctx.shadowBlur = 0

    // 蓝色通道偏移（向右下）
    ctx.fillStyle = `rgba(${inkColor.r},${inkColor.g},${Math.min(255, inkColor.b + 30)},${bleedAlpha})`
    ctx.shadowColor = `rgba(${inkColor.r},${inkColor.g},${Math.min(255, inkColor.b + 30)},0.3)`
    ctx.shadowBlur = fontSize * 0.1
    for (const g of glyphs) {
      if (!g.text || g.text === ' ') continue
      ctx.fillText(g.text, g.x + bleedOffset, g.y + bleedOffset)
    }
    ctx.shadowBlur = 0
    ctx.globalCompositeOperation = 'source-over'
  }

  // ===== 第4.5层：错位重影（套印偏差）=====
  const misLevel = Math.min(1, Math.max(0, misReg))
  if (misLevel > 0.01) {
    const misOffsets = [
      { ox: fontSize * 0.08 * misLevel, oy: fontSize * 0.03 * misLevel },
      { ox: -fontSize * 0.05 * misLevel, oy: fontSize * 0.06 * misLevel }
    ]
    for (const off of misOffsets) {
      ctx.fillStyle = `rgba(${inkColor.r},${inkColor.g},${inkColor.b},${opacity * 0.30 * misLevel})`
      for (const g of glyphs) {
        if (!g.text || g.text === ' ') continue
        ctx.fillText(g.text, g.x + off.ox, g.y + off.oy)
      }
    }
  }

  // ===== 新增：墨色浸染效果（模拟复古印刷晕墨）=====
  if (inkSpreadEnabled && inkSpreadIntensity > 0.01) {
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = `rgba(${inkColor.r},${inkColor.g},${inkColor.b},${opacity * inkSpreadIntensity * 0.35})`
    ctx.shadowColor = `rgba(${inkColor.r},${inkColor.g},${inkColor.b},${inkSpreadIntensity * 0.7})`
    ctx.shadowBlur = fontSize * inkSpreadIntensity * 0.8
    for (const g of glyphs) {
      if (!g.text || g.text === ' ') continue
      ctx.fillText(g.text, g.x, g.y)
    }
    ctx.shadowBlur = 0
  }

  // ===== 第5层：字体风化（独立效果，模拟老旧印刷品笔画残缺）=====
  // 随机降低部分笔画的透明度 + 轻微位置抖动，产生"墨迹褪色/磨损"感
  // 不依赖damage，单独开关控制
  if (weatheringEnabled && weatheringIntensity > 0.01) {
    ctx.globalCompositeOperation = 'source-over'
    const weatherAlphaBase = Math.min(0.6, weatheringIntensity * 0.8)
    for (let i = 0; i < glyphs.length; i++) {
      const g = glyphs[i]
      if (!g.text || g.text === ' ') continue
      const hash = (((i * 37 + (g.text.charCodeAt(0) || 0) + 777) % 1000) / 1000)
      if (hash < weatheringIntensity * 0.7) {
        // 风化程度随 hash 变化，部分笔画更严重
        const fadeAlpha = weatherAlphaBase * (0.3 + hash * 0.7)
        const jitterX = fontSize * (hash - 0.5) * weatheringIntensity * 0.03
        const jitterY = fontSize * (hash * 0.7 - 0.35) * weatheringIntensity * 0.02
        ctx.globalAlpha = Math.max(0.15, 1 - fadeAlpha)
        ctx.fillStyle = `rgba(${inkColor.r},${inkColor.g},${inkColor.b},${Math.max(0.1, opacity * (1 - fadeAlpha))})`
        ctx.fillText(g.text, g.x + jitterX, g.y + jitterY)
      }
    }
    ctx.globalAlpha = 1.0
  }

  // ===== 第6层：纸张压痕微凹（模拟铅字按压的物理凹陷）=====
  // 在文字下方添加极淡的阴影，模拟纸张被按压后的微小凹陷
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = `rgba(20,12,5,${opacity * 0.08})`
  ctx.shadowColor = 'rgba(20,12,5,0.20)'
  ctx.shadowBlur = fontSize * 0.15
  ctx.shadowOffsetX = fontSize * 0.01
  ctx.shadowOffsetY = fontSize * 0.02
  for (const g of glyphs) {
    if (!g.text || g.text === ' ') continue
    ctx.fillText(g.text, g.x, g.y)
  }
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  ctx.restore()
}

/**
 * 绘制页码
 */
function drawPageNumber(ctx, width, height, pageNum, totalPages, decorationConfig) {
  if (!decorationConfig || !decorationConfig.pageNumber) return
  if (totalPages <= 1) return

  const fontSize = 18
  const margin = 28
  const text = totalPages > 1 ? `${pageNum} / ${totalPages}` : `${pageNum}`

  ctx.save()
  ctx.globalAlpha = 0.4
  ctx.font = `${fontSize}px serif`
  ctx.fillStyle = '#3D2B1F'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText(text, width / 2, height - margin * 0.6)
  ctx.restore()
}

/**
 * 使用 opentype.js 直接渲染字形（绕过 wx.loadFontFace 限制）
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {Array} glyphs - 排版后的字符位置列表
 * @param {object} inkConfig - 油墨配置
 * @param {string} fontId - 字体ID
 * @param {number} fontSize - 字号
 * @param {object} layoutConfig - 排版配置
 * @returns {Promise}
 */
async function drawInkBlockWithOpenType(ctx, glyphs, inkConfig, fontConfig, fontId, fontSize, layoutConfig) {
  if (!glyphs || glyphs.length === 0) return
  if (fontId && _opentypeDisabledFonts[fontId]) {
    throw new Error(`opentype_disabled:${fontId}`)
  }

  try {
    const font = await loadFontFromCache(fontId)

    // 使用 ?? 而非 ||：避免 0 被 falsy 回退（与 drawInkBlock 保持一致）
    const inkColor = parseColor(inkConfig.color || '#1A1008')
    const opacity = inkConfig.opacity ?? 0.88
    const variation = (inkConfig.variation ?? 0.05)
    const blurRadius = (inkConfig.blurRadius ?? 0.3)
    const misReg = Math.min(0.5, (inkConfig.misRegistration ?? 0))
    const strokeEnabled = (fontConfig && fontConfig.stroke) || (inkConfig && inkConfig.stroke) || false
    const strokeWidth = (fontConfig && fontConfig.strokeWidth) || (inkConfig && inkConfig.strokeWidth) || 1
    const textSkew = (layoutConfig && layoutConfig.textSkew) || 0

    // 文字特效配置（与 drawInkBlock 保持一致）
    const inkSpreadEnabled = !!inkConfig.inkSpread
    const inkSpreadIntensity = inkConfig.inkSpreadIntensity ?? 0
    const weatheringEnabled = !!inkConfig.weathering
    const weatheringIntensity = inkConfig.weatheringIntensity ?? 0

    console.log('[ink-effect] OpenType渲染:', 'glyphs:', glyphs.length,
      'opacity:', opacity.toFixed(2), 'blur:', blurRadius.toFixed(2),
      'misReg:', misReg.toFixed(2), 'spread:', inkSpreadEnabled, 'weathering:', weatheringEnabled)

    const paths = await getGlyphPaths(font, glyphs, fontSize)

    ctx.save()

    if (textSkew !== 0) {
      const skewAngle = (textSkew * Math.PI) / 180
      ctx.transform(1, 0, Math.tan(skewAngle), 1, 0, 0)
    }

    // ===== 第0层：墨迹底层扩散 =====
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = `rgba(${inkColor.r},${inkColor.g},${inkColor.b},${opacity * 0.25})`
    ctx.shadowColor = `rgba(${inkColor.r},${inkColor.g},${inkColor.b},0.35)`
    ctx.shadowBlur = fontSize * 0.50
    for (const p of paths) { p.path.draw(ctx) }
    ctx.shadowBlur = 0

    // ===== 第1层：纤维渗透（blur效果）=====
    if (blurRadius > 0.05) {
      ctx.fillStyle = `rgba(${inkColor.r},${inkColor.g},${inkColor.b},${opacity * 0.45})`
      ctx.shadowColor = `rgba(${inkColor.r},${inkColor.g},${inkColor.b},0.60)`
      ctx.shadowBlur = blurRadius * fontSize * 2.2
      for (const p of paths) { p.path.draw(ctx) }
      ctx.shadowBlur = 0
    }

    // ===== 第2层：主体实墨 =====
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = `rgba(${inkColor.r},${inkColor.g},${inkColor.b},${opacity})`
    for (const p of paths) { p.path.draw(ctx) }

    // ===== 第3层：套印错位重影（misRegistration）=====
    if (misReg > 0.01) {
      const misOffsets = [
        { ox: fontSize * 0.08 * misReg, oy: fontSize * 0.03 * misReg },
        { ox: -fontSize * 0.05 * misReg, oy: fontSize * 0.06 * misReg }
      ]
      for (const off of misOffsets) {
        ctx.save()
        ctx.translate(off.ox, off.oy)
        ctx.fillStyle = `rgba(${inkColor.r},${inkColor.g},${inkColor.b},${opacity * 0.30 * misReg})`
        for (const p of paths) { p.path.draw(ctx) }
        ctx.restore()
      }
    }

    // ===== 第4层：颜色渗色（chromatic bleed）=====
    if (misReg > 0.05) {
      const bleedOffset = fontSize * 0.06 * misReg
      const bleedAlpha = opacity * 0.25 * misReg

      // 红色通道偏移
      ctx.save()
      ctx.translate(-bleedOffset, -bleedOffset)
      ctx.globalCompositeOperation = 'screen'
      ctx.fillStyle = `rgba(${Math.min(255, inkColor.r + 40)},${inkColor.g},${inkColor.b},${bleedAlpha})`
      for (const p of paths) { p.path.draw(ctx) }
      ctx.restore()

      // 蓝色通道偏移
      ctx.save()
      ctx.translate(bleedOffset, bleedOffset)
      ctx.fillStyle = `rgba(${inkColor.r},${inkColor.g},${Math.min(255, inkColor.b + 30)},${bleedAlpha})`
      for (const p of paths) { p.path.draw(ctx) }
      ctx.restore()
      ctx.globalCompositeOperation = 'source-over'
    }

    // ===== 第5层：墨色浸染（inkSpread）=====
    if (inkSpreadEnabled && inkSpreadIntensity > 0.01) {
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = `rgba(${inkColor.r},${inkColor.g},${inkColor.b},${opacity * inkSpreadIntensity * 0.35})`
      ctx.shadowColor = `rgba(${inkColor.r},${inkColor.g},${inkColor.b},${inkSpreadIntensity * 0.7})`
      ctx.shadowBlur = fontSize * inkSpreadIntensity * 0.8
      for (const p of paths) { p.path.draw(ctx) }
      ctx.shadowBlur = 0
    }

    // ===== 第6层：字体风化（独立效果）=====
    if (weatheringEnabled && weatheringIntensity > 0.01) {
      ctx.globalCompositeOperation = 'source-over'
      const weatherAlphaBase = Math.min(0.6, weatheringIntensity * 0.8)
      for (let i = 0; i < paths.length; i++) {
        const hash = (((i * 37 + (glyphs[i].text.charCodeAt(0) || 0) + 777) % 1000) / 1000)
        if (hash < weatheringIntensity * 0.7) {
          const fadeAlpha = weatherAlphaBase * (0.3 + hash * 0.7)
          const jitterX = fontSize * (hash - 0.5) * weatheringIntensity * 0.03
          const jitterY = fontSize * (hash * 0.7 - 0.35) * weatheringIntensity * 0.02
          ctx.save()
          ctx.translate(jitterX, jitterY)
          ctx.globalAlpha = Math.max(0.15, 1 - fadeAlpha)
          ctx.fillStyle = `rgba(${inkColor.r},${inkColor.g},${inkColor.b},${Math.max(0.1, opacity * (1 - fadeAlpha))})`
          paths[i].path.draw(ctx)
          ctx.restore()
        }
      }
      ctx.globalAlpha = 1.0
    }

    // ===== 描边 =====
    if (strokeEnabled && strokeWidth > 0) {
      const actualStrokeWidth = Math.max(0.5, strokeWidth * ((layoutConfig && layoutConfig._dpr) || 2))
      ctx.strokeStyle = `rgba(${inkColor.r},${inkColor.g},${inkColor.b},${opacity * 0.6})`
      ctx.lineWidth = actualStrokeWidth
      ctx.lineJoin = 'round'
      ctx.miterLimit = 2
      for (const p of paths) { p.path.draw(ctx, null, true) }
    }

    // ===== 压痕微凹 =====
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = `rgba(20,12,5,${opacity * 0.08})`
    ctx.shadowColor = 'rgba(20,12,5,0.20)'
    ctx.shadowBlur = fontSize * 0.15
    for (const p of paths) { p.path.draw(ctx) }
    ctx.shadowBlur = 0

    ctx.restore()

    console.log('[ink-effect] OpenType渲染完成，字符数:', paths.length)

  } catch (err) {
    if (fontId && !_opentypeDisabledFonts[fontId]) {
      _opentypeDisabledFonts[fontId] = true
      console.warn('[ink-effect] opentype.js 渲染失败，已对该字体停用并回退:', fontId, err && err.message ? err.message : err)
    }
    throw err
  }
}

function canUseOpenTypeFont(fontId) {
  if (!fontId) return false
  // 模拟器环境不支持 OpenType（fs.readFile 返回 opaque native object）
  if (_isSimulatorEnvironment === true) return false
  return !_opentypeDisabledFonts[fontId]
}

/**
 * 清除指定字体的OpenType禁用标记
 * 当字体下载成功后应调用此函数，让该字体可以重新尝试OpenType渲染路径
 * @param {string} fontId - 字体ID（如 '上古宋体-Regular'）
 */
function resetOpenTypeDisabledFont(fontId) {
  if (fontId && _opentypeDisabledFonts[fontId]) {
    delete _opentypeDisabledFonts[fontId]
    console.log('[ink-effect] 已重置字体 OpenType 状态:', fontId)
  }
}

function markOpenTypeIncompatible(fontId) {
  if (fontId) {
    _opentypeDisabledFonts[fontId] = true
    if (_cachedFonts[fontId]) {
      delete _cachedFonts[fontId]
    }
    console.log('[ink-effect] 已标记字体为 OpenType 不兼容（使用传统渲染）:', fontId)
  }
}

/**
 * 清除所有字体的OpenType禁用标记
 * 用于全局重置，如用户手动触发刷新等场景
 */
function resetAllOpenTypeDisabledFonts() {
  const count = Object.keys(_opentypeDisabledFonts).length
  _opentypeDisabledFonts = {}
  if (count > 0) {
    console.log('[ink-effect] 已重置所有字体的 OpenType 禁用状态, 共', count, '个')
  }
}

module.exports = {
  drawInkChar,
  drawInkLine,
  drawInkBlock,
  drawInkBlockWithOpenType,
  drawBrandStamp,
  drawPageNumber,
  loadFontFromCache,
  canUseOpenTypeFont,
  resetOpenTypeDisabledFont,
  markOpenTypeIncompatible,
  resetAllOpenTypeDisabledFonts,
  isSimulatorDetected: () => _isSimulatorEnvironment === true
}
