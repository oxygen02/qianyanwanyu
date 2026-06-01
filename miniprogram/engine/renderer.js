// engine/renderer.js
// 主渲染器 - 协调 paper.js + ink-effect.js + typesetter.js

const { generatePaperTexture, drawBorder, drawGrid, drawLineGuide, drawImperfection, drawStitch } = require('./paper')
const { drawInkBlock, drawInkBlockWithOpenType, drawBrandStamp, drawPageNumber, canUseOpenTypeFont } = require('./ink-effect')
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
  const ctx = canvas.getContext('2d')
  let currentPage = null

  console.log('[renderPage] 开始渲染:', { width, height, textLen: text ? text.length : 0, textPreview: text ? text.slice(0, 20) : 'EMPTY', pageIndex })

  try {
    const rawDpr = wx.getWindowInfo().pixelRatio || 2
    const dpr = Math.min(rawDpr, 2)
    template = _scaleTemplateForDPR(template, dpr)
    if (template.layout) {
      template.layout._dpr = dpr
    }

    ctx.clearRect(0, 0, width, height)

    const safeBgColor = (template.paper && template.paper.baseColor) || '#FAF7F2'
    ctx.fillStyle = safeBgColor
    ctx.fillRect(0, 0, width, height)

    // ============ 第一层：纸张纹理 ============
    try {
      let bgReady = false
      if (template.paper && template.paper.backgroundImage && template.paper.backgroundImage.fileID) {
        try {
          const bgImg = await loadImageFromFileID(template.paper.backgroundImage.fileID)
          ctx.drawImage(bgImg, 0, 0, width, height)
          bgReady = true
        } catch (err) {
          console.warn('[renderer] 背景图加载失败', err.message || err)
        }
      }

      if (!bgReady) {
        const paperCacheKey = _makeCacheKey('paper', width, height, JSON.stringify(template.paper))
        let cachedTexture = _getCachedPaperTexture(paperCacheKey)

        if (cachedTexture) {
          ctx.putImageData(cachedTexture, 0, 0)
        } else {
          const paperOffscreen = wx.createOffscreenCanvas({ type: '2d', width, height })
          generatePaperTexture({ width, height, paperConfig: template.paper, offscreenCanvas: paperOffscreen })
          ctx.drawImage(paperOffscreen, 0, 0)
          try {
            const imageData = ctx.getImageData(0, 0, width, height)
            _cachePaperTexture(paperCacheKey, imageData)
          } catch (_) {}
        }
      }
    } catch (e) {
      console.warn('[renderer] 纸张纹理生成跳过:', e.message || e)
    }

    // ============ 第二层：装饰元素 ============
    try {
      if (template.paper.grid) drawGrid(ctx, width, height, template.paper.grid, template.layout)
      if (template.paper.lineGuide) drawLineGuide(ctx, width, height, template.paper.lineGuide, template.layout)
      drawBorder(ctx, width, height, template.paper.border)
      if (template.paper.imperfection) {
        drawImperfection(ctx, width, height, {
          type: template.paper.imperfectionType || 'stain',
          intensity: template.paper.imperfectionIntensity || 0.5
        })
      }
      if (template.paper.stitch) {
        drawStitch(ctx, width, height, { type: template.paper.stitchType || 'thread-hole' })
      }
    } catch (e) {
      console.warn('[renderer] 装饰元素渲染跳过:', e.message || e)
    }

    // ============ 第三层：文字排版 + 油墨渲染 ============
    const glyphCacheKey = _makeCacheKey('glyphs', text, width, height, JSON.stringify(template.layout))
    let pages = _getCachedGlyphs(glyphCacheKey)

    if (!pages) {
      try {
        console.log('[renderPage] 开始排版, fontSize:', template.layout.fontSize, 'fontFamily:', template.font && template.font.family)
        pages = typesetAllPages(text, { canvasWidth: width, canvasHeight: height, layout: template.layout })
        console.log('[renderPage] 排版完成, 页数:', pages ? pages.length : 'NULL', '首页glyphs数:', (pages && pages[0]) ? pages[0].glyphs.length : 'N/A')
      } catch (e) {
        console.error('[renderer] 排版失败:', e.message || e, e.stack || '')
        pages = [{ glyphs: [] }]
      }
      _cacheGlyphs(glyphCacheKey, pages)
    }

    currentPage = pages[pageIndex]
    const glyphCount = (currentPage && currentPage.glyphs) ? currentPage.glyphs.length : 0
    console.log('[renderPage] 当前页glyphs数量:', glyphCount)

    if (currentPage && currentPage.glyphs.length > 0) {
      const fontId = template.font && template.font.family
      const isSystemFont = !fontId || ['serif', 'sans-serif', 'monospace'].includes(fontId)
      const useOpenType = !isSystemFont && currentPage.glyphs.length <= 1500 && canUseOpenTypeFont(fontId)
      let inkRendered = false

      if (useOpenType) {
        try {
          await drawInkBlockWithOpenType(ctx, currentPage.glyphs, template.ink, template.font, fontId, template.layout.fontSize, template.layout)
          inkRendered = true
          console.log('[renderPage] OpenType渲染成功')
        } catch (e) {
          console.warn('[renderer] OpenType回退:', e.message || e)
        }
      }
      if (!inkRendered) {
        try {
          drawInkBlock(ctx, currentPage.glyphs, template.ink, template.font, template.layout.fontSize, template.layout, !isSystemFont)
          inkRendered = true
          console.log('[renderPage] drawInkBlock渲染成功')
        } catch (e) {
          console.warn('[renderer] drawInkBlock回退:', e.message || e)
        }
      }
      if (!inkRendered) {
        try {
          const family = (template.font && template.font.family) || 'serif'
          const fontSize = template.layout.fontSize || 24
          ctx.save()
          ctx.font = `${template.font && template.font.weight || '400'} ${fontSize}px ${family}`
          ctx.fillStyle = (template.ink && template.ink.color) || '#1A1008'
          ctx.globalAlpha = (template.ink && template.ink.opacity) || 0.88
          ctx.textBaseline = 'alphabetic'
          for (const g of currentPage.glyphs) {
            if (g.text && g.text !== ' ') ctx.fillText(g.text, g.x, g.y)
          }
          ctx.restore()
          console.log('[renderPage] 兜底fillText渲染成功')
        } catch (e) {
          console.error('[renderer] 兜底fillText也失败:', e.message || e)
        }
      }
    } else {
      // glyphs为空时，使用模板参数在内容区域绘制原始文本作为最终兜底
      console.warn('[renderPage] glyphs为空，使用终极兜底：直接绘制文本')
      ctx.save()
      const fallbackFontSize = Math.max(16, Math.min(48, (template.layout && template.layout.fontSize) || 27))
      const fallbackFamily = (template.font && template.font.family) || 'serif'
      const fallbackMT = (template.layout && template.layout.marginTop) || (height * 0.08)
      const fallbackMB = (template.layout && template.layout.marginBottom) || (height * 0.08)
      const fallbackML = (template.layout && template.layout.marginLeft) || (width * 0.05)
      const fallbackMR = (template.layout && template.layout.marginRight) || (width * 0.05)

      ctx.font = `${(template.font && template.font.weight) || '400'} ${fallbackFontSize}px ${fallbackFamily}`
      ctx.fillStyle = (template.ink && template.ink.color) || '#1A1008'
      ctx.globalAlpha = (template.ink && template.ink.opacity) || 0.88
      ctx.textBaseline = 'alphabetic'
      const displayText = text || '(无文字)'
      const lines = displayText.split('\n')
      const fallbackLineH = fallbackFontSize * ((template.layout && template.layout.lineHeight) || 1.6)
      const contentTop = fallbackMT + fallbackFontSize
      lines.forEach((line, i) => {
        ctx.fillText(line, fallbackML, contentTop + i * fallbackLineH)
      })
      ctx.restore()
    }

    // ============ 第四层：品牌印章 + 页码 ============
    try {
      await drawBrandStamp(ctx, width, height,
        (template.font && template.font.family) || 'serif',
        { enabled: template.brandStamp !== false, position: (template.brandStamp && template.brandStamp.position) || 'bottomRight' })
    } catch (e) {
      console.warn('[renderer] 品牌印章跳过:', e.message || e)
    }
    try {
      if (template.layout.pageNumberEnabled && totalPages > 1) {
        drawPageNumber(ctx, width, height, pageIndex + 1, totalPages, template.decoration)
      }
    } catch (e) {
      console.warn('[renderer] 页码跳过:', e.message || e)
    }

    // ============ 第五层：投影 ============
    try {
      if (template.paper.shadow) {
        const intensity = (template.paper.shadowIntensity != null) ? template.paper.shadowIntensity : 0.5
        const bA = 0.12 * intensity, rA = 0.08 * intensity
        const sg = ctx.createLinearGradient(0, height - 24, 0, height)
        sg.addColorStop(0, 'rgba(0,0,0,0)')
        sg.addColorStop(1, `rgba(0,0,0,${bA})`)
        ctx.fillStyle = sg
        ctx.fillRect(0, height - 24, width, 24)
        const rg = ctx.createLinearGradient(width - 20, 0, width, 0)
        rg.addColorStop(0, 'rgba(0,0,0,0)')
        rg.addColorStop(1, `rgba(0,0,0,${rA})`)
        ctx.fillStyle = rg
        ctx.fillRect(width - 20, 0, 20, height)
      }
    } catch (e) {
      console.warn('[renderer] 投影跳过:', e.message || e)
    }

    console.log('[renderPage] 渲染完成')

  } catch (fatalErr) {
    console.error('[renderPage] 致命错误（已捕获）:', fatalErr.message || fatalErr, fatalErr.stack || '')
    ctx.fillStyle = safeBgColor || '#FAF7F2'
    ctx.fillRect(0, 0, width, height)
    ctx.save()
    ctx.font = 'bold 28px serif'
    ctx.fillStyle = '#CC0000'
    ctx.globalAlpha = 1
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('渲染错误: ' + (fatalErr.message || 'unknown'), width / 2, height / 2)
    ctx.restore()
  }

  return { currentPage, template }
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
  // 性能优化：浅拷贝替代 JSON.parse(JSON.stringify())，约 50x 更快
  const t = {
    id: template.id, name: template.name, desc: template.desc, category: template.category,
    layout: { ...template.layout },
    paper: {
      ...template.paper,
      light: template.paper.light ? { ...template.paper.light } : undefined,
      border: template.paper.border ? { ...template.paper.border } : undefined,
      stain: template.paper.stain ? { ...template.paper.stain } : undefined,
      edges: template.paper.edges ? { ...template.paper.edges } : undefined
    },
    font: { ...template.font },
    ink: { ...template.ink },
    decoration: template.decoration ? {
      ...template.decoration,
      stamp: template.decoration.stamp ? { ...template.decoration.stamp } : null,
      watermark: template.decoration.watermark ? { ...template.decoration.watermark } : null
    } : null
  }
  const d = dpr || 2

  // 防止重复缩放：如果模板已经被 DPR 缩放过了，直接返回
  // 注意：检查原始模板是否有标记，而不是深拷贝后的对象
  if (template.layout && template.layout._dprScaled) {
    return t
  }

  // 排版参数（px 单位）
  // Canvas 2D 的 backing store 使用物理像素，但 ctx.font 使用 CSS 像素
  // 为了确保排版计算和实际绘制一致，我们将所有空间参数统一为物理像素
  if (t.layout) {
    // fontSize: 不在此处缩放！
    // typesetter.js 中已有 compactness/sizeScale 机制处理字号调整
    // 如果此处再乘以 fontScale，会导致双重缩放，使实际显示远小于用户设置值
    // 用户设置的 fontSize 直接传递给 typesetter，由 sizeScale(0.85~1.15) 做唯一缩放
    if (t.layout.fontSize == null) {
      t.layout.fontSize = 24
    }

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
    // 注意：letterSpacing 是 em 单位，不需要乘 DPR
    // typesetter.js 中会将其乘以 fontSize 转换为 px

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
