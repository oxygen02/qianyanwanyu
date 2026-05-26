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

async function loadFontFromCache(fontId) {
  if (_cachedFonts[fontId]) {
    return _cachedFonts[fontId]
  }
  
  return new Promise((resolve, reject) => {
    const fs = getFS()
    let filePath = null
    try {
      const cacheInfo = wx.getStorageSync(FONT_CACHE_INFO_KEY) || {}
      if (cacheInfo[fontId] && cacheInfo[fontId].path) {
        filePath = cacheInfo[fontId].path
      }
    } catch (e) {
      // 忽略 storage 异常，继续回退到猜测路径
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
      encoding: 'binary',
      success: (res) => {
        try {
          const buffer = Buffer.from(res.data, 'binary')
          const font = opentype.parse(buffer)
          _cachedFonts[fontId] = font
          resolve(font)
        } catch (err) {
          reject(err)
        }
      },
      fail: (err) => {
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
 */
function drawInkBlock(ctx, glyphs, inkConfig, fontConfig, fontSize, layoutConfig) {
  if (!glyphs || glyphs.length === 0) return

  const inkColor = parseColor(inkConfig.color || '#1A1008')
  const opacity = inkConfig.opacity || 0.88
  const variation = inkConfig.variation || 0.05
  const blurRadius = inkConfig.blurRadius || 0.3
  const misReg = inkConfig.misRegistration || 0.08
  const damage = inkConfig.damage || 0

  // 新增：文字描边配置
  const strokeEnabled = fontConfig.stroke || false
  const strokeWidth = fontConfig.strokeWidth || 1

  // 新增：排版配置（倾斜）
  const textSkew = (layoutConfig && layoutConfig.textSkew) || 0

  // 新增：墨色浸染配置
  const inkSpreadEnabled = inkConfig.inkSpread || false
  const inkSpreadIntensity = inkConfig.inkSpreadIntensity || 0

  // 新增：字体风化配置
  const weatheringEnabled = inkConfig.weathering || false
  const weatheringIntensity = inkConfig.weatheringIntensity || 0

  // DPR：用于将物理像素转换为 CSS 像素
  const dpr = (layoutConfig && layoutConfig._dpr) || 2

  const family = sanitizeFontFamily(fontConfig.family)
  // Canvas 2D 的 ctx.font 使用 CSS 像素，所以将物理像素 fontSize 转换回 CSS 像素
  const cssFontSize = fontSize / dpr
  const fontStr = `${fontConfig.weight || '400'} ${cssFontSize}px ${family}`

  console.log('[ink-effect] drawInkBlock fontStr:', fontStr, 'glyphs:', glyphs.length,
    'opacity:', opacity.toFixed(2), 'variation:', variation.toFixed(2),
    'blur:', blurRadius.toFixed(2), 'misReg:', misReg.toFixed(2), 'damage:', damage.toFixed(2),
    'stroke:', strokeEnabled, 'skew:', textSkew, 'spread:', inkSpreadEnabled)

  ctx.save()
  ctx.font = fontStr
  ctx.textBaseline = 'alphabetic'

  // 应用文字倾斜
  if (textSkew !== 0) {
    const skewAngle = (textSkew * Math.PI) / 180
    ctx.transform(1, 0, Math.tan(skewAngle), 1, 0, 0)
  }

  // ===== 第0层：纸张纤维吸附底层（让墨迹"陷入"纸张）=====
  // 模拟墨水被纸张纤维吸收后的底层扩散——比文字略大、极淡、高度羽化
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

  // ===== 第1层：纤维渗透（墨水沿纸张纤维间隙扩散）=====
  // 超大 shadowBlur 产生明显的边缘羽化，这是"印在纸上"感的关键
  if (blurRadius > 0.05) {
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
  if (blurRadius > 0.1) {
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
  for (let i = 0; i < glyphs.length; i++) {
    const g = glyphs[i]
    if (!g.text || g.text === ' ') continue

    // 确定性哈希（避免重绘闪烁）
    const hash1 = ((i * 37 + (g.text.charCodeAt(0) || 0)) % 1000) / 1000
    const hash2 = (((hash1 * 7919) % 1000) / 1000)
    const hash3 = (((hash1 * 104729) % 1000) / 1000)

    const rnd = hash1 * 2 - 1  // -1 ~ 1

    // 墨色随机变化（variation 控制幅度，越大越像活字印刷）
    const vr = rnd * variation * 220
    const vg = (hash2 * 2 - 1) * variation * 150
    const vb = (hash3 * 2 - 1) * variation * 100

    const r = Math.max(0, Math.min(255, inkColor.r + vr))
    const gVal = Math.max(0, Math.min(255, inkColor.g + vg))
    const bVal = Math.max(0, Math.min(255, inkColor.b + vb))

    // 不透明度范围：opacity * 0.90 到 min(0.995, opacity * 1.05)
    const minOp = opacity * 0.90
    const maxOp = Math.min(0.995, opacity * 1.05)
    const charOpacity = minOp + (maxOp - minOp) * hash2

    ctx.fillStyle = `rgba(${r},${gVal},${bVal},${charOpacity})`
    ctx.fillText(g.text, g.x, g.y)

    // 文字描边效果（模拟老式印刷字迹的墨边）
    if (strokeEnabled && strokeWidth > 0) {
      const strokeColor = inkConfig.strokeColor || inkConfig.color || '#1A1008'
      const sc = parseColor(strokeColor)
      const strokeOpacity = charOpacity * 0.6
      ctx.strokeStyle = `rgba(${sc.r},${sc.g},${sc.b},${strokeOpacity})`
      ctx.lineWidth = strokeWidth
      ctx.strokeText(g.text, g.x, g.y)
    }
  }

  // ===== 第3.5层：边缘微浸润（让字迹边缘与纸张自然过渡）=====
  // 叠加一个极微模糊的副本，模拟墨水沿纸张纤维的细微扩散
  if (blurRadius > 0.05) {
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
  if (bleedLevel > 0.05) {
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

  // ===== 第5层：飞白破损（缺墨 / 纸张纤维遮挡）=====
  const damageLevel = Math.min(1, Math.max(0, damage))
  if (damageLevel > 0.01) {
    ctx.globalCompositeOperation = 'source-over'
    for (let i = 0; i < glyphs.length; i++) {
      const g = glyphs[i]
      if (!g.text || g.text === ' ') continue

      const hash = (((i * 37 + (g.text.charCodeAt(0) || 0) + 777) % 1000) / 1000)

      // 字体风化效果：增加笔画残缺感
      const effectiveDamage = weatheringEnabled ? Math.min(1, damageLevel + weatheringIntensity * 0.5) : damageLevel
      if (hash < effectiveDamage) {
        const numStreaks = 1 + Math.floor(hash * 3)
        const streakAlpha = 0.55 + hash * 0.35
        // 使用纸张底色而非纯白，让破损更自然
        ctx.fillStyle = `rgba(250,247,242,${streakAlpha})`

        for (let s = 0; s < numStreaks; s++) {
          const sx = g.x + fontSize * ((hash * 0.5 + s * 0.22) % 0.75)
          const sy = g.y - fontSize * (0.15 + (hash * 0.4 + s * 0.18) % 0.5)
          const sw = fontSize * (0.012 + hash * 0.035)
          const sh = fontSize * (0.25 + hash * 0.35)
          ctx.fillRect(sx, sy, sw, sh)
        }
      }
    }
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
 * 绘制印章
 * 固定印章大小为36rpx，默认位置在右下角
 */
function drawStamp(ctx, width, height, stampConfig) {
  if (!stampConfig) return

  const text = stampConfig.text || '记'
  const color = stampConfig.color || '#C41E3A'
  const opacity = stampConfig.opacity || 0.7
  
  const dpr = wx.getSystemInfoSync().pixelRatio || 2
  const size = 36 / 2 * dpr

  let sx, sy
  const margin = 28

  switch (stampConfig.position) {
    case 'topRight':
      sx = width - margin - size / 2
      sy = margin + size / 2
      break
    case 'topLeft':
      sx = margin + size / 2
      sy = margin + size / 2
      break
    case 'bottomLeft':
      sx = margin + size / 2
      sy = height - margin - size / 2
      break
    default:
      sx = width - margin - size / 2
      sy = height - margin - size / 2
  }

  ctx.save()
  ctx.globalAlpha = opacity
  ctx.globalCompositeOperation = 'source-over'

  ctx.strokeStyle = color
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.rect(sx - size / 2, sy - size / 2, size, size)
  ctx.stroke()

  ctx.fillStyle = color
  ctx.font = `bold ${size * 0.6}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, sx, sy)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  ctx.restore()
}

/**
 * 绘制水印
 * 2025-05-18 修复：从硬编码 28px 改为基于版心下边距（marginBottom）定位
 * 固定水印文字大小为36rpx，默认位置在右下角
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {object} watermarkConfig
 * @param {string} dateStr
 * @param {object} layoutConfig - 排版配置，用于计算水印在页脚区域的位置
 */
function drawWatermark(ctx, width, height, watermarkConfig, dateStr, layoutConfig) {
  if (!watermarkConfig) return

  const text = watermarkConfig.text || '铅言万语'
  const opacity = watermarkConfig.opacity || 0.15
  
  const dpr = wx.getSystemInfoSync().pixelRatio || 2
  const defaultFontSize = 36 / 2 * dpr
  const fontSize = watermarkConfig.userSetFontSize ? ((watermarkConfig.fontSize || 36) / 2 * dpr) : defaultFontSize
  const position = watermarkConfig.userSetPosition ? (watermarkConfig.position || 'bottomRight') : 'bottomRight'

  const fixedRight = 36
  const fixedLeft = 36
  const fixedBottomCenter = 46

  ctx.save()
  ctx.globalAlpha = opacity
  ctx.font = `${fontSize}px serif`
  ctx.fillStyle = '#3D2B1F'
  ctx.textBaseline = 'middle'

  const displayText = dateStr ? `${text}  ${dateStr}` : text

  switch (position) {
    case 'bottomCenter':
      ctx.textAlign = 'center'
      ctx.fillText(displayText, width / 2, height - fixedBottomCenter)
      break
    case 'bottomLeft':
      ctx.textAlign = 'left'
      ctx.fillText(displayText, fixedLeft, height - fixedBottomCenter)
      break
    default:
      ctx.textAlign = 'right'
      ctx.fillText(displayText, width - fixedRight, height - fixedBottomCenter)
  }

  ctx.restore()
}

/**
 * 绘制水印 + Logo（并列显示在页面底部）
 * 固定水印文字大小为36rpx，默认位置在右下角
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {object} watermarkConfig
 * @param {string} dateStr
 * @param {object} layoutConfig
 */
async function drawWatermarkWithLogo(ctx, width, height, watermarkConfig, dateStr, layoutConfig) {
  if (!watermarkConfig) return

  const text = watermarkConfig.text || '铅言万语'
  const opacity = Math.min((watermarkConfig.opacity || 0.15) * 2, 0.4)
  
  const dpr = wx.getSystemInfoSync().pixelRatio || 2
  const defaultFontSize = 36 / 2 * dpr
  const fontSize = watermarkConfig.userSetFontSize ? ((watermarkConfig.fontSize || 36) / 2 * dpr) : defaultFontSize
  const position = watermarkConfig.userSetPosition ? (watermarkConfig.position || 'bottomRight') : 'bottomRight'

  const fixedRight = 36
  const fixedLeft = 36
  const footerCenterY = height - 46

  const logoSize = 36 / 2 * dpr
  const logoGap = 8

  ctx.save()
  ctx.globalAlpha = opacity
  ctx.textBaseline = 'middle'

  let logoDrawn = false
  try {
    const logoImg = await _loadLogoImage()
    if (logoImg) {
      const logoY = footerCenterY - logoSize / 2

      if (position === 'bottomLeft') {
        ctx.drawImage(logoImg, width - fixedRight - logoSize, logoY, logoSize, logoSize)
        ctx.font = `${fontSize}px serif`
        ctx.fillStyle = '#3D2B1F'
        ctx.textAlign = 'left'
        const displayText = dateStr ? `${text}  ${dateStr}` : text
        ctx.fillText(displayText, fixedLeft, footerCenterY)
      } else if (position === 'bottomCenter') {
        const displayText = dateStr ? `${text}  ${dateStr}` : text
        ctx.font = `${fontSize}px serif`
        ctx.fillStyle = '#3D2B1F'
        ctx.textAlign = 'left'
        const textWidth = ctx.measureText(displayText).width
        const totalWidth = logoSize + 12 + textWidth
        const startX = (width - totalWidth) / 2
        ctx.drawImage(logoImg, startX, logoY, logoSize, logoSize)
        ctx.fillText(displayText, startX + logoSize + 12, footerCenterY)
      } else {
        ctx.font = `${fontSize}px serif`
        ctx.fillStyle = '#3D2B1F'
        ctx.textAlign = 'right'
        const displayText = dateStr ? `${text}  ${dateStr}` : text
        const textWidth = ctx.measureText(displayText).width
        const logoX = width - fixedRight - textWidth - logoGap - logoSize
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
        ctx.fillText(displayText, width - fixedRight, footerCenterY)
      }
      logoDrawn = true
    }
  } catch (e) {
    console.warn('[ink-effect] Logo 加载失败:', e)
  }

  if (!logoDrawn) {
    ctx.font = `${fontSize}px serif`
    ctx.fillStyle = '#3D2B1F'
    const displayText = dateStr ? `${text}  ${dateStr}` : text
    switch (position) {
      case 'bottomCenter':
        ctx.textAlign = 'center'
        ctx.fillText(displayText, width / 2, footerCenterY)
        break
      case 'bottomLeft':
        ctx.textAlign = 'left'
        ctx.fillText(displayText, fixedLeft, footerCenterY)
        break
      default:
        ctx.textAlign = 'right'
        ctx.fillText(displayText, width - fixedRight, footerCenterY)
    }
  }

  ctx.restore()
}

/**
 * 加载 Logo 图片（缓存）
 * 注：images/logo.png 为可选资源，不存在时静默跳过，不阻塞渲染
 */
let _logoImageCache = null
let _logoImageLoading = false
function _loadLogoImage() {
  return new Promise((resolve) => {
    if (_logoImageCache) {
      resolve(_logoImageCache)
      return
    }
    // 如果正在加载中，快速返回 null 避免阻塞渲染
    if (_logoImageLoading) {
      resolve(null)
      return
    }
    _logoImageLoading = true
    try {
      const canvas = wx.createOffscreenCanvas({ type: '2d', width: 1, height: 1 })
      const img = canvas.createImage()
      img.onload = () => {
        _logoImageCache = img
        _logoImageLoading = false
        resolve(img)
      }
      img.onerror = () => {
        // Logo 图片不存在，静默处理（不等待超时）
        _logoImageLoading = false
        resolve(null)
      }
      img.src = '/images/logo.png'
    } catch (e) {
      _logoImageLoading = false
      resolve(null)
    }
  })
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
async function drawInkBlockWithOpenType(ctx, glyphs, inkConfig, fontId, fontSize, layoutConfig) {
  if (!glyphs || glyphs.length === 0) return
  
  try {
    const font = await loadFontFromCache(fontId)
    
    const inkColor = parseColor(inkConfig.color || '#1A1008')
    const opacity = inkConfig.opacity || 0.88
    const variation = inkConfig.variation || 0.05
    const blurRadius = inkConfig.blurRadius || 0.3
    const misReg = inkConfig.misRegistration || 0.08
    const damage = inkConfig.damage || 0
    const strokeEnabled = inkConfig.stroke || false
    const strokeWidth = inkConfig.strokeWidth || 1
    const textSkew = (layoutConfig && layoutConfig.textSkew) || 0
    
    const paths = await getGlyphPaths(font, glyphs, fontSize)
    
    ctx.save()
    
    if (textSkew !== 0) {
      const skewAngle = (textSkew * Math.PI) / 180
      ctx.transform(1, 0, Math.tan(skewAngle), 1, 0, 0)
    }
    
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = `rgba(${inkColor.r},${inkColor.g},${inkColor.b},${opacity})`
    
    for (const p of paths) {
      p.path.draw(ctx)
    }
    
    if (strokeEnabled && strokeWidth > 0) {
      ctx.strokeStyle = `rgba(${inkColor.r},${inkColor.g},${inkColor.b},${opacity * 0.6})`
      ctx.lineWidth = strokeWidth
      for (const p of paths) {
        p.path.draw(ctx, null, true)
      }
    }
    
    ctx.restore()
    
    console.log('[ink-effect] 使用 opentype.js 渲染完成，字符数:', paths.length)
    
  } catch (err) {
    console.error('[ink-effect] opentype.js 渲染失败:', err)
    drawInkBlock(ctx, glyphs, inkConfig, { family: 'serif', weight: '400' }, fontSize, layoutConfig)
  }
}

module.exports = {
  drawInkChar,
  drawInkLine,
  drawInkBlock,
  drawInkBlockWithOpenType,
  drawStamp,
  drawWatermark,
  drawWatermarkWithLogo,
  drawPageNumber,
  loadFontFromCache
}
