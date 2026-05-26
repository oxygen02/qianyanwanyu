// engine/renderer.js
// 主渲染器 - 协调 paper.js + ink-effect.js + typesetter.js

const { generatePaperTexture, drawBorder, drawGrid, drawLineGuide } = require('./paper')
const { drawInkBlock, drawInkBlockWithOpenType, drawStamp, drawWatermarkWithLogo, drawPageNumber } = require('./ink-effect')
const { typesetAllPages } = require('./typesetter')
const { TEMPLATES } = require('../utils/constants')
const { loadImageFromFileID } = require('../utils/image-loader')

// ============ 渲染缓存（避免重复计算）============
// 纸张纹理缓存：key = paperConfig哈希，value = ImageData
const _paperTextureCache = new Map()
// 排版结果缓存：key = text+layout哈希，value = pages数组
const _glyphCache = new Map()
// 最大缓存条目数（防止内存无限增长）
const MAX_CACHE_SIZE = 10

/**
 * 生成缓存key（简单的哈希）
 */
function _makeCacheKey(...args) {
  return args.join('|')
}

/**
 * 获取缓存的纸张纹理
 * @returns {ImageData|null} - 缓存的ImageData或null
 */
function _getCachedPaperTexture(key) {
  const entry = _paperTextureCache.get(key)
  if (entry) {
    entry.lastUsed = Date.now()
    return entry.data
  }
  return null
}

/**
 * 缓存纸张纹理
 */
function _cachePaperTexture(key, imageData) {
  // 清理过期缓存
  if (_paperTextureCache.size >= MAX_CACHE_SIZE) {
    let oldestKey = null
    let oldestTime = Infinity
    for (const [k, v] of _paperTextureCache) {
      if (v.lastUsed < oldestTime) {
        oldestTime = v.lastUsed
        oldestKey = k
      }
    }
    if (oldestKey) {
      _paperTextureCache.delete(oldestKey)
    }
  }
  _paperTextureCache.set(key, { data: imageData, lastUsed: Date.now() })
}

/**
 * 获取缓存的排版结果
 * @returns {Array|null} - 缓存的pages数组或null
 */
function _getCachedGlyphs(key) {
  const entry = _glyphCache.get(key)
  if (entry) {
    entry.lastUsed = Date.now()
    return entry.pages
  }
  return null
}

/**
 * 缓存排版结果
 */
function _cacheGlyphs(key, pages) {
  // 清理过期缓存
  if (_glyphCache.size >= MAX_CACHE_SIZE) {
    let oldestKey = null
    let oldestTime = Infinity
    for (const [k, v] of _glyphCache) {
      if (v.lastUsed < oldestTime) {
        oldestTime = v.lastUsed
        oldestKey = k
      }
    }
    if (oldestKey) {
      _glyphCache.delete(oldestKey)
    }
  }
  _glyphCache.set(key, { pages, lastUsed: Date.now() })
}

/**
 * 清理所有缓存
 */
function clearRenderCache() {
  _paperTextureCache.clear()
  _glyphCache.clear()
}

/**
 * 完整渲染一页书页到 Canvas
 *
 * @param {object} params
 * @param {Canvas} params.canvas - 微信小程序 Canvas 对象（type:'2d'）
 * @param {number} params.width - Canvas 物理宽度（px）
 * @param {number} params.height - Canvas 物理高度（px）
 * @param {string} params.text - 要渲染的文字内容
 * @param {string} params.templateId - 模板ID
 * @param {number} params.pageIndex - 当前页码（0-based）
 * @param {number} params.totalPages - 总页数
 * @param {string} params.dateStr - 创作时间字符串（用于水印）
 * @returns {Promise<void>}
 */
async function renderPage(params) {
  const { canvas, width, height, text, templateId, template: tplOverride, pageIndex, totalPages, dateStr } = params
  let template = tplOverride || TEMPLATES[templateId] || TEMPLATES['modern-prose']

  // 根据设备像素比缩放模板参数，确保文字在物理像素Canvas上显示正确大小
  const dpr = wx.getWindowInfo().pixelRatio || 2
  template = _scaleTemplateForDPR(template, dpr)
  // 将 DPR 保存到 layout 中，供 ink-effect.js 使用
  if (template.layout) {
    template.layout._dpr = dpr
  }

  const ctx = canvas.getContext('2d')

  // 清空画布
  ctx.clearRect(0, 0, width, height)

  // ============ 第一层：纸张底色 + 纹理 / 背景图 ============
  let bgReady = false
  if (template.paper && template.paper.backgroundImage && template.paper.backgroundImage.fileID) {
    try {
      const bgImg = await loadImageFromFileID(template.paper.backgroundImage.fileID)
      ctx.drawImage(bgImg, 0, 0, width, height)
      bgReady = true
    } catch (err) {
      console.warn('[renderer] 背景图加载失败，回退到纸张纹理', err)
    }
  }

  if (!bgReady) {
    // 检查缓存：基于纸张配置生成缓存key
    const paperCacheKey = _makeCacheKey(
      'paper',
      width, height,
      JSON.stringify(template.paper)
    )
    let cachedTexture = _getCachedPaperTexture(paperCacheKey)

    if (cachedTexture) {
      // 使用缓存的纹理
      ctx.putImageData(cachedTexture, 0, 0)
    } else {
      // 创建离屏Canvas生成纸张纹理
      const paperOffscreen = wx.createOffscreenCanvas({ type: '2d', width, height })
      generatePaperTexture({
        width,
        height,
        paperConfig: template.paper,
        offscreenCanvas: paperOffscreen
      })
      // 将纸张纹理绘制到主Canvas（source-over，作为底层）
      ctx.drawImage(paperOffscreen, 0, 0)

      // 缓存ImageData（从主Canvas获取）
      try {
        const imageData = ctx.getImageData(0, 0, width, height)
        _cachePaperTexture(paperCacheKey, imageData)
      } catch (e) {
        // getImageData可能跨域失败，静默跳过
      }
    }
  }

  // ============ 第二层：装饰元素（底部，在文字之下）============
  // 界格 / 横线
  if (template.paper.grid) {
    drawGrid(ctx, width, height, template.paper.grid, template.layout)
  }
  if (template.paper.lineGuide) {
    drawLineGuide(ctx, width, height, template.paper.lineGuide, template.layout)
  }

  // 边框
  drawBorder(ctx, width, height, template.paper.border)

  // ============ 第三层：文字排版 + 油墨渲染 ============
  // 使用缓存的排版结果（避免每次翻页都完整重新排版）
  const glyphCacheKey = _makeCacheKey(
    'glyphs',
    text,
    width, height,
    JSON.stringify(template.layout)
  )
  let pages = _getCachedGlyphs(glyphCacheKey)

  if (!pages) {
    pages = typesetAllPages(text, {
      canvasWidth: width,
      canvasHeight: height,
      layout: template.layout
    })
    _cacheGlyphs(glyphCacheKey, pages)
  }

  const currentPage = pages[pageIndex]
  if (currentPage && currentPage.glyphs.length > 0) {
    const fontId = template.font && template.font.family
    const isSystemFont = !fontId || ['serif', 'sans-serif', 'monospace'].includes(fontId)
    const useOpenType = !isSystemFont && currentPage.glyphs.length <= 1500
    if (useOpenType) {
      try {
        await drawInkBlockWithOpenType(ctx, currentPage.glyphs, template.ink, fontId, template.layout.fontSize, template.layout)
      } catch (e) {
        drawInkBlock(ctx, currentPage.glyphs, template.ink, template.font, template.layout.fontSize, template.layout)
      }
    } else {
      drawInkBlock(ctx, currentPage.glyphs, template.ink, template.font, template.layout.fontSize, template.layout)
    }
  }

  // ============ 第四层：表面装饰（文字之上）============
  // 印章
  if (template.decoration && template.decoration.stamp) {
    drawStamp(ctx, width, height, template.decoration.stamp)
  }

  // 水印和Logo（传入 layout 确保位于页脚区域，不贴边）
  await drawWatermarkWithLogo(ctx, width, height, template.watermark, dateStr, template.layout)

  // 页码
  if (template.layout.pageNumberEnabled && totalPages > 1) {
    drawPageNumber(ctx, width, height, pageIndex + 1, totalPages, template.decoration)
  }

  // 页眉页脚
  if (template.layout.headerFooterEnabled) {
    const headerText = template.layout.headerText || ''
    const footerText = template.layout.footerText || ''
    const fontSize = 16
    const margin = 24
    const inkColor = template.ink.color || '#1A1008'
    const opacity = template.ink.opacity || 0.88

    ctx.save()
    ctx.font = `${fontSize}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = `rgba(${parseInt(inkColor.slice(1, 3), 16)},${parseInt(inkColor.slice(3, 5), 16)},${parseInt(inkColor.slice(5, 7), 16)},${opacity * 0.5})`

    if (headerText) {
      ctx.fillText(headerText, width / 2, margin * 0.6)
    }
    if (footerText) {
      ctx.textBaseline = 'bottom'
      ctx.fillText(footerText, width / 2, height - margin * 0.6)
    }
    ctx.restore()
  }

  // ============ 第五层：书页投影（最顶层，营造立体感）============
  if (template.paper.shadow) {
    const intensity = (template.paper.shadowIntensity != null) ? template.paper.shadowIntensity : 0.5
    _drawPageShadow(ctx, width, height, intensity)
  }
}

/**
 * 书页四周阴影（增加纸张立体感）
 * @param {number} intensity - 阴影强度 0~1
 */
function _drawPageShadow(ctx, width, height, intensity) {
  const bottomAlpha = 0.12 * intensity
  const rightAlpha = 0.08 * intensity

  // 底部阴影（模拟书页厚度）
  const shadowGrad = ctx.createLinearGradient(0, height - 24, 0, height)
  shadowGrad.addColorStop(0, 'rgba(0,0,0,0)')
  shadowGrad.addColorStop(1, `rgba(0,0,0,${bottomAlpha})`)
  ctx.fillStyle = shadowGrad
  ctx.fillRect(0, height - 24, width, 24)

  // 右侧阴影
  const rightGrad = ctx.createLinearGradient(width - 20, 0, width, 0)
  rightGrad.addColorStop(0, 'rgba(0,0,0,0)')
  rightGrad.addColorStop(1, `rgba(0,0,0,${rightAlpha})`)
  ctx.fillStyle = rightGrad
  ctx.fillRect(width - 20, 0, 20, height)

  // 左上角微高光（纸张受光面）
  const topLeftGrad = ctx.createLinearGradient(0, 0, 40, 40)
  topLeftGrad.addColorStop(0, `rgba(255,255,255,${0.06 * intensity})`)
  topLeftGrad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = topLeftGrad
  ctx.fillRect(0, 0, 40, 40)
}

/**
 * 计算总页数（使用缓存）
 * @param {string} text
 * @param {string} templateId
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @returns {number}
 */
function estimatePageCount(text, templateId, canvasWidth, canvasHeight, tplOverride) {
  let template = tplOverride || TEMPLATES[templateId] || TEMPLATES['modern-prose']
  const dpr = wx.getWindowInfo().pixelRatio || 2
  template = _scaleTemplateForDPR(template, dpr)

  // 尝试从缓存获取（避免重复排版）
  const glyphCacheKey = _makeCacheKey(
    'glyphs',
    text,
    canvasWidth, canvasHeight,
    JSON.stringify(template.layout)
  )
  let pages = _getCachedGlyphs(glyphCacheKey)

  if (!pages) {
    pages = typesetAllPages(text, {
      canvasWidth,
      canvasHeight,
      layout: template.layout
    })
    _cacheGlyphs(glyphCacheKey, pages)
  }

  return Math.max(1, pages.length)
}

/**
 * 渲染所有页（用于导出多页图片）
 * @param {object} baseParams - 同 renderPage 的 params，除 pageIndex 外
 * @returns {Promise<number>} - 总页数
 */
async function renderAllPages(baseParams) {
  const { text, templateId, template: tplOverride, canvas, width, height } = baseParams
  let template = tplOverride || TEMPLATES[templateId] || TEMPLATES['modern-prose']
  const dpr = wx.getWindowInfo().pixelRatio || 2
  template = _scaleTemplateForDPR(template, dpr)

  // 尝试从缓存获取排版结果
  const glyphCacheKey = _makeCacheKey(
    'glyphs',
    text,
    width, height,
    JSON.stringify(template.layout)
  )
  let pages = _getCachedGlyphs(glyphCacheKey)

  if (!pages) {
    pages = typesetAllPages(text, {
      canvasWidth: width,
      canvasHeight: height,
      layout: template.layout
    })
    _cacheGlyphs(glyphCacheKey, pages)
  }

  // 逐页渲染（调用方需要在每页渲染后自行导出）
  for (let i = 0; i < pages.length; i++) {
    await renderPage({ ...baseParams, pageIndex: i, totalPages: pages.length })
    // 通知调用方当前页已渲染完成
    if (baseParams.onPageRendered) {
      await baseParams.onPageRendered(i, pages.length)
    }
  }

  return pages.length
}

/**
 * 根据 DPR 缩放模板参数
 * Canvas 2D 的 backing store 使用物理像素，但模板参数基于 CSS 像素设计。
 * 需要将像素相关参数乘以 DPR，确保文字在屏幕上显示为正确大小。
 *
 * @param {object} template - 原始模板
 * @param {number} dpr - 设备像素比
 * @returns {object} 缩放后的模板副本
 */
function _scaleTemplateForDPR(template, dpr) {
  const t = JSON.parse(JSON.stringify(template))
  const d = dpr || 2

  // 防止重复缩放：如果模板已经被 DPR 缩放过了，直接返回
  if (t.layout && t.layout._dprScaled) {
    return t
  }

  // 排版参数（px 单位）
  // Canvas 2D 的 backing store 使用物理像素，但 ctx.font 使用 CSS 像素
  // 为了确保排版计算和实际绘制一致，我们将所有空间参数统一为物理像素
  if (t.layout) {
    // fontSize 需要乘以 DPR，因为 Canvas 绘制时字体大小是 CSS 像素
    // 但我们的排版计算使用物理像素坐标
    t.layout.fontSize = (t.layout.fontSize || 32) * d

    // 边距：统一乘 DPR，确保在物理像素 Canvas 上显示正确大小
    // 模板默认值基于 750rpx 设计稿，用户设置值也是 CSS 像素单位
    const scaleMargin = (val) => {
      if (val == null) return 60 * d  // 默认 60px * DPR
      return val * d
    }

    t.layout.marginTop = scaleMargin(t.layout.marginTop)
    t.layout.marginBottom = scaleMargin(t.layout.marginBottom)
    t.layout.marginLeft = scaleMargin(t.layout.marginLeft)
    t.layout.marginRight = scaleMargin(t.layout.marginRight)
    if (t.layout.columnGap) t.layout.columnGap *= d
    if (t.layout.letterSpacing != null) t.layout.letterSpacing *= d

    // 标记已缩放，防止重复缩放
    t.layout._dprScaled = true
  }

  // 水印字号保持 CSS 像素
  // 水印位置计算使用已缩放的 marginBottom

  // 边框相关
  if (t.paper && t.paper.border) {
    if (t.paper.border.margin) t.paper.border.margin *= d
    if (t.paper.border.gap) t.paper.border.gap *= d
  }

  // 界格/横线间距
  if (t.paper && t.paper.lineGuide && t.paper.lineGuide.spacing) {
    t.paper.lineGuide.spacing *= d
  }

  return t
}

module.exports = { renderPage, renderAllPages, estimatePageCount, clearRenderCache }
