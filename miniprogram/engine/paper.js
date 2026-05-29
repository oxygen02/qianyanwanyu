// engine/paper.js
// 纸张纹理生成器 - 离屏Canvas + multiply叠加
// 生成：底色 + 纤维纹理 + 老化感 + 污渍

/**
 * Perlin Noise 简化实现（用于生成自然纤维纹理）
 */
class SimplexNoise {
  constructor(seed = Math.random()) {
    this._seed = seed
    this._perm = this._buildPermutation()
  }

  _buildPermutation() {
    const p = []
    for (let i = 0; i < 256; i++) p[i] = i
    // 用seed做简单shuffle
    let s = this._seed * 2147483647
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647
      const j = Math.floor((s / 2147483647) * (i + 1))
      ;[p[i], p[j]] = [p[j], p[i]]
    }
    const perm = new Uint8Array(512)
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255]
    return perm
  }

  _fade(t) { return t * t * t * (t * (t * 6 - 15) + 10) }
  _lerp(a, b, t) { return a + t * (b - a) }

  _grad(hash, x, y) {
    const h = hash & 3
    const u = h < 2 ? x : y
    const v = h < 2 ? y : x
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v)
  }

  noise2D(x, y) {
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    x -= Math.floor(x)
    y -= Math.floor(y)
    const u = this._fade(x)
    const v = this._fade(y)
    const p = this._perm
    const a = p[X] + Y, aa = p[a], ab = p[a + 1]
    const b = p[X + 1] + Y, ba = p[b], bb = p[b + 1]
    return this._lerp(
      this._lerp(this._grad(p[aa], x, y), this._grad(p[ba], x - 1, y), u),
      this._lerp(this._grad(p[ab], x, y - 1), this._grad(p[bb], x - 1, y - 1), u),
      v
    )
  }
}

/**
 * 简单的字符串哈希函数（用于生成固定种子）
 */
function _hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash) / 0x7FFFFFFF
}

/**
 * 解析颜色字符串为 {r,g,b}
 */
function parseColor(hex) {
  const h = hex.replace('#', '')
  if (h.length === 6) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16)
    }
  }
  return { r: 250, g: 247, b: 242 }
}

/**
 * 生成纸张纹理到离屏Canvas
 * @param {object} params
 * @param {number} params.width - 画布宽度（物理像素）
 * @param {number} params.height - 画布高度（物理像素）
 * @param {object} params.paperConfig - 纸张配置（来自 constants.js TEMPLATES[x].paper）
 * @param {Canvas} params.offscreenCanvas - 微信小程序离屏Canvas对象
 * @returns {CanvasRenderingContext2D} - 填充好纹理的离屏ctx
 */
function generatePaperTexture(params) {
  const { width, height, paperConfig, offscreenCanvas } = params
  const ctx = offscreenCanvas.getContext('2d')

  const baseColor = parseColor(paperConfig.baseColor)
  const fiberOpacity = paperConfig.fiberOpacity || 0.06
  const ageOpacity = paperConfig.ageOpacity || 0.04
  const grain = paperConfig.grain || 'medium'
  
  // 使用固定种子确保纹理一致性（基于模板配置的哈希值）
  const seed = paperConfig.seed || _hashString(JSON.stringify(paperConfig))

  // 噪声频率映射
  const grainFreq = { none: 0, fine: 0.08, medium: 0.04, coarse: 0.02 }
  const freq = grainFreq[grain] || 0.04

  // 第一层：底色填充
  ctx.fillStyle = paperConfig.baseColor
  ctx.fillRect(0, 0, width, height)

  if (grain === 'none' && fiberOpacity < 0.02) {
    // 极简模板，不生成纹理
    return ctx
  }

  // 第二层：纤维纹理（降采样 stride=2，性能提升 4x）
  // 高 DPR 设备上采样率自动调整，避免主线程长时间阻塞
  const noise = new SimplexNoise(seed)
  const imageData = ctx.createImageData(width, height)
  const data = imageData.data

  // 自适应步长：DPR≥3 时 stride=3，否则 stride=2
  const dpr = wx.getWindowInfo ? (wx.getWindowInfo().pixelRatio || 2) : 2
  const stride = dpr >= 3 ? 3 : 2

  for (let y = 0; y < height; y += stride) {
    for (let x = 0; x < width; x += stride) {
      const idx = (y * width + x) * 4
      // 多层噪声叠加，模拟纸张纤维
      const n1 = noise.noise2D(x * freq, y * freq)                // 粗纤维
      const n2 = noise.noise2D(x * freq * 3, y * freq * 3) * 0.5  // 细纤维
      const n3 = noise.noise2D(x * freq * 8, y * freq * 8) * 0.25 // 微纹理
      const n = (n1 + n2 + n3) / 1.75

      // 映射到纸色范围
      const brightness = n * 55
      const r = Math.max(0, Math.min(255, baseColor.r + brightness))
      const g = Math.max(0, Math.min(255, baseColor.g + brightness * 0.95))
      const b = Math.max(0, Math.min(255, baseColor.b + brightness * 0.9))
      const a = Math.floor(fiberOpacity * 255)

      // 填充整个 stride 块为同一颜色
      for (let dy = 0; dy < stride && y + dy < height; dy++) {
        for (let dx = 0; dx < stride && x + dx < width; dx++) {
          const bidx = ((y + dy) * width + (x + dx)) * 4
          data[bidx] = r
          data[bidx + 1] = g
          data[bidx + 2] = b
          data[bidx + 3] = a
        }
      }
    }
  }

  // 将纤维层以 source-over 叠加到底色上
  // 注意：不能用 putImageData（会覆盖底色alpha），要创建临时Canvas叠加
  const fiberCanvas = wx.createOffscreenCanvas({ type: '2d', width, height })
  const fiberCtx = fiberCanvas.getContext('2d')
  fiberCtx.putImageData(imageData, 0, 0)

  // 用 multiply 将纤维叠加到底色上
  ctx.globalCompositeOperation = 'multiply'
  ctx.globalAlpha = 1.0
  ctx.drawImage(fiberCanvas, 0, 0)
  ctx.globalCompositeOperation = 'source-over'

  // 第三层：老化渐变（四角略深，模拟纸张受光不均）
  if (ageOpacity > 0.01) {
    const gradient = ctx.createRadialGradient(
      width * 0.5, height * 0.5, height * 0.2,
      width * 0.5, height * 0.5, height * 0.75
    )
    gradient.addColorStop(0, 'rgba(0,0,0,0)')
    gradient.addColorStop(1, `rgba(80,50,20,${ageOpacity})`)
    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
    ctx.globalCompositeOperation = 'source-over'
  }

  // 第四层：光照渐变（若模板有light配置）
  if (paperConfig.light && paperConfig.light.enabled) {
    const light = paperConfig.light
    const lg = ctx.createRadialGradient(
      width * light.centerX, height * light.centerY, 0,
      width * light.centerX, height * light.centerY, Math.max(width, height) * light.radius
    )
    const lightColor = parseColor(light.color)
    lg.addColorStop(0, `rgba(${lightColor.r},${lightColor.g},${lightColor.b},${light.opacity})`)
    lg.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = lg
    ctx.fillRect(0, 0, width, height)
    ctx.globalCompositeOperation = 'source-over'
  }

  // 第五层：程序化解理纹理（grooves）
  // 模拟纸张表面的细微解理纹理，增强真实感
  if (paperConfig.grooves !== false) {
    _drawGrooves(ctx, width, height, paperConfig)
  }

  // 第六层：微颗粒噪声（micro grain）
  // 模拟纸张表面的微小颗粒感
  if (paperConfig.grain !== 'none') {
    _drawMicroGrain(ctx, width, height, paperConfig)
  }

  // 第七层：边缘暗角（vignette）
  // 模拟纸张边缘因光照不均产生的自然暗角
  if (paperConfig.vignette !== false) {
    _drawVignette(ctx, width, height, paperConfig)
  }

  // 第八层：不规则边缘（毛边效果）
  // 模拟真实纸张的粗糙边缘
  if (paperConfig.edges && paperConfig.edges.enabled) {
    _drawRoughEdges(ctx, width, height, paperConfig)
  }

  // 第九层：页面卷曲效果
  // 模拟书本翻开时的自然卷曲
  if (paperConfig.curl && paperConfig.curl.enabled) {
    _drawPageCurl(ctx, width, height, paperConfig)
  }

  // 第十层：污渍/茶渍（若模板有stain配置）
  if (paperConfig.stain && paperConfig.stain.enabled) {
    _drawStains(ctx, width, height, paperConfig.stain)
  }

  return ctx
}

/**
 * 使用固定种子生成伪随机数
 */
function _pseudoRandom(seed, index) {
  const x = Math.sin(seed * 9999 + index * 7777) * 10000
  return x - Math.floor(x)
}

/**
 * 绘制污渍效果
 */
function _drawStains(ctx, width, height, stainConfig) {
  const count = stainConfig.count || 2
  const opacity = stainConfig.opacity || 0.08
  const seed = stainConfig.seed || 0.42

  for (let i = 0; i < count; i++) {
    const cx = width * (0.2 + _pseudoRandom(seed, i * 3) * 0.6)
    const cy = height * (0.2 + _pseudoRandom(seed, i * 3 + 1) * 0.6)
    const r = Math.min(width, height) * (0.05 + _pseudoRandom(seed, i * 3 + 2) * 0.08)

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    gradient.addColorStop(0, `rgba(120,80,20,${opacity})`)
    gradient.addColorStop(0.5, `rgba(100,60,10,${opacity * 0.5})`)
    gradient.addColorStop(1, 'rgba(0,0,0,0)')

    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = gradient
    ctx.beginPath()
    // 用椭圆+随机变形模拟不规则污渍
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(1 + _pseudoRandom(seed, i * 3 + 3) * 0.4, 0.6 + _pseudoRandom(seed, i * 3 + 4) * 0.4)
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.restore()
    ctx.fill()
  }

  ctx.globalCompositeOperation = 'source-over'
}

/**
 * 绘制边框装饰
 * @param {CanvasRenderingContext2D} ctx - 主Canvas ctx
 * @param {number} width
 * @param {number} height
 * @param {object} borderConfig - 来自 paperConfig.border
 */
function drawBorder(ctx, width, height, borderConfig) {
  if (!borderConfig) return

  const margin = borderConfig.margin || 24
  const color = borderConfig.color || '#8B6914'

  ctx.strokeStyle = color
  ctx.lineCap = 'square'

  if (borderConfig.type === 'double') {
    // 双线边框
    const [innerW, outerW] = borderConfig.width || [1, 3]
    const gap = borderConfig.gap || 6

    // 外线
    ctx.lineWidth = outerW
    ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2)
    // 内线
    ctx.lineWidth = innerW
    ctx.strokeRect(margin + gap + outerW, margin + gap + outerW,
      width - (margin + gap + outerW) * 2, height - (margin + gap + outerW) * 2)

  } else if (borderConfig.type === 'single' || borderConfig.type === 'thin') {
    const lw = (borderConfig.width && borderConfig.width[0]) || 1
    ctx.lineWidth = lw
    ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2)
  }
}

/**
 * 绘制界格（竖排方格或横线）
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {object} gridConfig
 * @param {object} layoutConfig
 */
function drawGrid(ctx, width, height, gridConfig, layoutConfig) {
  if (!gridConfig || !gridConfig.enabled) return

  const color = gridConfig.color || '#C4A060'
  const opacity = gridConfig.opacity || 0.3

  ctx.strokeStyle = color
  ctx.globalAlpha = opacity
  ctx.lineWidth = 0.5

  const ml = layoutConfig.marginLeft || 60
  const mr = layoutConfig.marginRight || 60
  const mt = layoutConfig.marginTop || 80
  const mb = layoutConfig.marginBottom || 80
  const fontSize = layoutConfig.fontSize || 32
  const lineH = fontSize * (layoutConfig.lineHeight || 2.0)

  if (gridConfig.type === 'square') {
    // 稿纸方格
    for (let x = ml; x <= width - mr; x += fontSize) {
      ctx.beginPath()
      ctx.moveTo(x, mt)
      ctx.lineTo(x, height - mb)
      ctx.stroke()
    }
    for (let y = mt; y <= height - mb; y += lineH) {
      ctx.beginPath()
      ctx.moveTo(ml, y)
      ctx.lineTo(width - mr, y)
      ctx.stroke()
    }
  } else {
    // 竖排界格（竖线）
    const colW = fontSize * 1.5
    for (let x = ml; x <= width - mr; x += colW) {
      ctx.beginPath()
      ctx.moveTo(x, mt)
      ctx.lineTo(x, height - mb)
      ctx.stroke()
    }
  }

  ctx.globalAlpha = 1.0
}

/**
 * 绘制横线底纹（信纸格）
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {object} lineGuideConfig
 * @param {object} layoutConfig
 */
function drawLineGuide(ctx, width, height, lineGuideConfig, layoutConfig) {
  if (!lineGuideConfig || !lineGuideConfig.enabled) return

  const color = lineGuideConfig.color || '#E8DEC8'
  const spacing = lineGuideConfig.spacing || 56
  const opacity = lineGuideConfig.opacity || 0.6
  const mt = layoutConfig.marginTop || 60
  const ml = layoutConfig.marginLeft || 52
  const mr = layoutConfig.marginRight || 52

  ctx.strokeStyle = color
  ctx.globalAlpha = opacity
  ctx.lineWidth = 0.8

  for (let y = mt + spacing; y < height - (layoutConfig.marginBottom || 60); y += spacing) {
    ctx.beginPath()
    ctx.moveTo(ml, y)
    ctx.lineTo(width - mr, y)
    ctx.stroke()
  }

  ctx.globalAlpha = 1.0
}

/**
 * 绘制程序化解理纹理（grooves）
 * 模拟纸张表面的细微纤维解理纹理
 */
function _drawGrooves(ctx, width, height, paperConfig) {
  const noise = new SimplexNoise(0.73)
  const grooveOpacity = (paperConfig.fiberOpacity || 0.06) * 0.4
  const baseColor = parseColor(paperConfig.baseColor)

  // 创建解理纹理层
  const grooveCanvas = wx.createOffscreenCanvas({ type: '2d', width, height })
  const grooveCtx = grooveCanvas.getContext('2d')

  // 使用极细的随机线条模拟纤维解理
  grooveCtx.strokeStyle = `rgba(${baseColor.r - 30},${baseColor.g - 25},${baseColor.b - 20},${grooveOpacity})`
  grooveCtx.lineWidth = 0.3

  const numGrooves = Math.floor((width * height) / 8000)
  for (let i = 0; i < numGrooves; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const length = 20 + Math.random() * 80
    const angle = (Math.random() - 0.5) * 0.3  // 接近水平，略有倾斜

    grooveCtx.beginPath()
    grooveCtx.moveTo(x, y)
    // 使用噪声控制弯曲
    for (let t = 0; t < length; t += 2) {
      const nx = x + t * Math.cos(angle)
      const ny = y + t * Math.sin(angle) + noise.noise2D(nx * 0.02, ny * 0.02) * 3
      grooveCtx.lineTo(nx, ny)
    }
    grooveCtx.stroke()
  }

  // 用 multiply 叠加
  ctx.globalCompositeOperation = 'multiply'
  ctx.globalAlpha = 0.6
  ctx.drawImage(grooveCanvas, 0, 0)
  ctx.globalAlpha = 1.0
  ctx.globalCompositeOperation = 'source-over'
}

/**
 * 绘制微颗粒噪声（micro grain）
 * 模拟纸张表面的微小颗粒质感
 */
function _drawMicroGrain(ctx, width, height, paperConfig) {
  const grainIntensity = (paperConfig.fiberOpacity || 0.06) * 0.5
  const baseColor = parseColor(paperConfig.baseColor)

  // 创建颗粒纹理
  const grainCanvas = wx.createOffscreenCanvas({ type: '2d', width, height })
  const grainCtx = grainCanvas.getContext('2d')

  const imageData = grainCtx.createImageData(width, height)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 30 * grainIntensity
    data[i] = Math.max(0, Math.min(255, baseColor.r + grain))
    data[i + 1] = Math.max(0, Math.min(255, baseColor.g + grain * 0.95))
    data[i + 2] = Math.max(0, Math.min(255, baseColor.b + grain * 0.9))
    data[i + 3] = Math.floor(grainIntensity * 255 * 0.3)
  }

  grainCtx.putImageData(imageData, 0, 0)

  // 用 overlay 叠加
  ctx.globalCompositeOperation = 'overlay'
  ctx.globalAlpha = 0.4
  ctx.drawImage(grainCanvas, 0, 0)
  ctx.globalAlpha = 1.0
  ctx.globalCompositeOperation = 'source-over'
}

/**
 * 绘制边缘暗角（vignette）
 * 模拟纸张边缘因光照不均产生的自然暗角
 */
function _drawVignette(ctx, width, height, paperConfig) {
  const vignetteIntensity = (paperConfig.ageOpacity || 0.04) * 0.8
  const baseColor = parseColor(paperConfig.baseColor)

  // 创建径向渐变暗角
  const gradient = ctx.createRadialGradient(
    width * 0.5, height * 0.5, Math.min(width, height) * 0.35,
    width * 0.5, height * 0.5, Math.max(width, height) * 0.85
  )

  // 中心透明，边缘略暗
  gradient.addColorStop(0, 'rgba(0,0,0,0)')
  gradient.addColorStop(0.6, `rgba(${baseColor.r - 40},${baseColor.g - 35},${baseColor.b - 30},0)`)
  gradient.addColorStop(1, `rgba(${baseColor.r - 60},${baseColor.g - 50},${baseColor.b - 40},${vignetteIntensity})`)

  ctx.globalCompositeOperation = 'multiply'
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  ctx.globalCompositeOperation = 'source-over'
}

/**
 * 绘制不规则边缘（毛边效果）
 * 模拟真实纸张的粗糙边缘
 */
function _drawRoughEdges(ctx, width, height, paperConfig) {
  const edges = paperConfig.edges || {}
  if (!edges.enabled) return

  const roughness = edges.roughness || 0.3
  const darkenEdges = edges.darkenEdges || 0.15
  const noise = new SimplexNoise(0.87)

  // 创建裁剪路径
  ctx.save()
  ctx.beginPath()

  // 左上角
  ctx.moveTo(width * 0.02, height * 0.02)
  
  // 上边缘
  for (let x = 0; x <= width; x += width * 0.02) {
    const y = height * 0.02 + noise.noise2D(x * 0.01, 0) * height * roughness * 0.5
    ctx.lineTo(x, Math.max(0, y))
  }
  
  // 右上角
  ctx.lineTo(width - width * 0.02, height * 0.02)
  
  // 右边缘
  for (let y = 0; y <= height; y += height * 0.02) {
    const x = width - width * 0.02 + noise.noise2D(width * 0.01, y * 0.01) * width * roughness * 0.5
    ctx.lineTo(Math.min(width, x), y)
  }
  
  // 右下角
  ctx.lineTo(width - width * 0.02, height - height * 0.02)
  
  // 下边缘
  for (let x = width; x >= 0; x -= width * 0.02) {
    const y = height - height * 0.02 + noise.noise2D(x * 0.01, height * 0.01) * height * roughness * 0.5
    ctx.lineTo(x, Math.min(height, y))
  }
  
  // 左下角
  ctx.lineTo(width * 0.02, height - height * 0.02)
  
  // 左边缘
  for (let y = height; y >= 0; y -= height * 0.02) {
    const x = width * 0.02 + noise.noise2D(0, y * 0.01) * width * roughness * 0.5
    ctx.lineTo(Math.max(0, x), y)
  }
  
  ctx.closePath()
  ctx.clip()

  // 边缘暗化效果
  if (darkenEdges > 0) {
    const edgeGradient = ctx.createRadialGradient(
      width * 0.5, height * 0.5, Math.min(width, height) * 0.4,
      width * 0.5, height * 0.5, Math.max(width, height) * 0.95
    )
    edgeGradient.addColorStop(0, 'rgba(0,0,0,0)')
    edgeGradient.addColorStop(0.7, 'rgba(0,0,0,0)')
    edgeGradient.addColorStop(1, `rgba(0,0,0,${darkenEdges})`)
    
    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = edgeGradient
    ctx.fillRect(0, 0, width, height)
    ctx.globalCompositeOperation = 'source-over'
  }

  ctx.restore()
}

/**
 * 绘制页面卷曲效果
 * 模拟书本翻开时的自然卷曲
 */
function _drawPageCurl(ctx, width, height, paperConfig) {
  if (!paperConfig.curl) return

  const curl = paperConfig.curl
  const intensity = curl.intensity || 0.3
  
  // 创建卷曲阴影
  const shadowCanvas = wx.createOffscreenCanvas({ type: '2d', width, height })
  const shadowCtx = shadowCanvas.getContext('2d')

  // 右下角卷曲阴影
  const gradient = shadowCtx.createRadialGradient(
    width * 0.95, height * 0.95, 0,
    width * 0.8, height * 0.8, Math.min(width, height) * 0.4
  )
  gradient.addColorStop(0, `rgba(0,0,0,${intensity * 0.6})`)
  gradient.addColorStop(0.5, `rgba(0,0,0,${intensity * 0.3})`)
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  
  shadowCtx.fillStyle = gradient
  shadowCtx.fillRect(0, 0, width, height)

  ctx.globalCompositeOperation = 'multiply'
  ctx.drawImage(shadowCanvas, 0, 0)
  ctx.globalCompositeOperation = 'source-over'
}

module.exports = {
  generatePaperTexture,
  drawBorder,
  drawGrid,
  drawLineGuide,
  SimplexNoise
}
