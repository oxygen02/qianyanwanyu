// engine/image-page-renderer.js
// 图片插画页渲染器 - 像图书插图一样展示图片

const { generatePaperTexture } = require('./paper')
const { TEMPLATES } = require('../utils/constants')

/**
 * 渲染图片插画页
 * @param {object} params
 * @param {Canvas} params.canvas - Canvas对象
 * @param {number} params.width - Canvas物理宽度
 * @param {number} params.height - Canvas物理高度
 * @param {string} params.imageUrl - 图片URL或临时路径
 * @param {string} params.templateId - 模板ID
 * @param {string} params.caption - 图片说明文字（可选）
 * @param {number} params.pageIndex - 当前页码
 * @param {number} params.totalPages - 总页数
 */
async function renderImagePage(params) {
  const { canvas, width, height, imageUrl, templateId, caption, pageIndex, totalPages } = params
  const template = TEMPLATES[templateId] || TEMPLATES['modern-prose']

  const ctx = canvas.getContext('2d')
  const dpr = wx.getWindowInfo().pixelRatio || 2

  // 清空画布
  ctx.clearRect(0, 0, width, height)

  // 1. 纸张纹理背景
  await renderPaperBackground(ctx, width, height, template)

  // 2. 计算图片显示区域（留边距）
  const margin = Math.min(width, height) * 0.08
  const maxImgWidth = width - margin * 2
  const maxImgHeight = height - margin * 2 - (caption ? 80 * dpr : 0)

  // 3. 加载并绘制图片
  try {
    const img = await loadImage(imageUrl)

    // 计算缩放比例（保持比例，不裁剪，不放大超过原图）
    const scale = Math.min(
      maxImgWidth / img.width,
      maxImgHeight / img.height,
      1.0 // 不放大超过原图尺寸
    )

    const drawWidth = img.width * scale
    const drawHeight = img.height * scale
    const x = (width - drawWidth) / 2
    const y = (height - drawHeight - (caption ? 60 * dpr : 0)) / 2

    // 绘制图片阴影（增加立体感，像贴在书页上的照片）
    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.12)'
    ctx.shadowBlur = 16 * dpr
    ctx.shadowOffsetX = 4 * dpr
    ctx.shadowOffsetY = 6 * dpr
    ctx.drawImage(img, x, y, drawWidth, drawHeight)
    ctx.restore()

    // 绘制图片边框（模拟照片/插画框）
    ctx.strokeStyle = 'rgba(61, 43, 31, 0.15)'
    ctx.lineWidth = Math.max(1, dpr)
    ctx.strokeRect(x, y, drawWidth, drawHeight)

    // 内边框（双线效果）
    ctx.strokeStyle = 'rgba(61, 43, 31, 0.08)'
    ctx.lineWidth = Math.max(1, dpr * 0.5)
    const innerOffset = 3 * dpr
    ctx.strokeRect(
      x + innerOffset,
      y + innerOffset,
      drawWidth - innerOffset * 2,
      drawHeight - innerOffset * 2
    )

    // 4. 绘制说明文字
    if (caption) {
      const captionY = y + drawHeight + 24 * dpr
      ctx.font = `${Math.round(13 * dpr)}px ${template.font?.fallback || 'serif'}`
      ctx.fillStyle = 'rgba(61, 43, 31, 0.55)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'

      // 文字阴影（轻微，增加可读性）
      ctx.save()
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)'
      ctx.shadowBlur = 2 * dpr
      ctx.fillText(caption, width / 2, captionY)
      ctx.restore()
    }

  } catch (err) {
    console.error('[image-page] 图片加载失败:', err)
    renderImagePlaceholder(ctx, width, height, dpr)
  }

  // 5. 书页投影
  if (template.paper?.shadow) {
    _drawPageShadow(ctx, width, height, template.paper.shadowIntensity || 0.5)
  }

  // 6. 页码
  if (totalPages > 1) {
    renderPageNumber(ctx, width, height, pageIndex, totalPages, margin, dpr)
  }
}

/**
 * 渲染纸张背景
 */
async function renderPaperBackground(ctx, width, height, template) {
  const paperOffscreen = wx.createOffscreenCanvas({ type: '2d', width, height })
  generatePaperTexture({
    width,
    height,
    paperConfig: template.paper,
    offscreenCanvas: paperOffscreen
  })
  ctx.drawImage(paperOffscreen, 0, 0)
}

/**
 * 加载图片
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    try {
      const offscreen = wx.createOffscreenCanvas({ type: '2d', width: 1, height: 1 })
      const img = offscreen.createImage()

      img.onload = () => resolve(img)
      img.onerror = (err) => reject(new Error('图片加载失败: ' + src))

      // 设置跨域（如果是网络图片）
      img.crossOrigin = 'anonymous'
      img.src = src
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * 图片加载失败时的占位图
 */
function renderImagePlaceholder(ctx, width, height, dpr) {
  const centerX = width / 2
  const centerY = height / 2

  // 绘制虚线框
  const boxSize = Math.min(width, height) * 0.3
  ctx.strokeStyle = 'rgba(61, 43, 31, 0.2)'
  ctx.lineWidth = Math.max(1, dpr)
  ctx.setLineDash([6 * dpr, 4 * dpr])
  ctx.strokeRect(centerX - boxSize / 2, centerY - boxSize / 2, boxSize, boxSize)
  ctx.setLineDash([])

  // 绘制提示文字
  ctx.font = `${Math.round(14 * dpr)}px serif`
  ctx.fillStyle = 'rgba(61, 43, 31, 0.4)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('[图片加载失败]', centerX, centerY)

  ctx.font = `${Math.round(11 * dpr)}px serif`
  ctx.fillStyle = 'rgba(61, 43, 31, 0.25)'
  ctx.fillText('请检查网络连接', centerX, centerY + 20 * dpr)
}

/**
 * 绘制页码
 */
function renderPageNumber(ctx, width, height, pageIndex, totalPages, margin, dpr) {
  ctx.font = `${Math.round(11 * dpr)}px serif`
  ctx.fillStyle = 'rgba(61, 43, 31, 0.35)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText(`${pageIndex + 1} / ${totalPages}`, width / 2, height - margin * 0.4)
}

/**
 * 书页阴影效果
 */
function _drawPageShadow(ctx, width, height, intensity) {
  const bottomAlpha = 0.10 * intensity
  const rightAlpha = 0.06 * intensity

  // 底部阴影
  const shadowGrad = ctx.createLinearGradient(0, height - 20, 0, height)
  shadowGrad.addColorStop(0, 'rgba(0,0,0,0)')
  shadowGrad.addColorStop(1, `rgba(0,0,0,${bottomAlpha})`)
  ctx.fillStyle = shadowGrad
  ctx.fillRect(0, height - 20, width, 20)

  // 右侧阴影
  const rightGrad = ctx.createLinearGradient(width - 16, 0, width, 0)
  rightGrad.addColorStop(0, 'rgba(0,0,0,0)')
  rightGrad.addColorStop(1, `rgba(0,0,0,${rightAlpha})`)
  ctx.fillStyle = rightGrad
  ctx.fillRect(width - 16, 0, 16, height)
}

module.exports = {
  renderImagePage
}
