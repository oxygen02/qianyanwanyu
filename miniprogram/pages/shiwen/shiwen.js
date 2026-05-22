// pages/shiwen/shiwen.js
// 拾文页 - 文章转书页

const { renderPage } = require('../../engine/renderer')
const { exportFlow, generateId } = require('../../utils/export')
const { loadActiveTemplate, saveActiveTemplate, addHistory } = require('../../utils/storage')
const { TEMPLATES, TEMPLATE_ORDER, DEFAULT_TEMPLATE_ID } = require('../../utils/constants')
const { loadFont } = require('../../utils/font-loader')

Page({
  data: {
    // 阶段：input / preview / done
    stage: 'input',
    // 原始粘贴文字
    rawText: '',
    // 清洗后文字
    cleanedText: '',
    // 当前模板
    activeTemplateId: DEFAULT_TEMPLATE_ID,
    templateList: [],
    // 渲染状态
    isRendering: false,
    // Canvas 尺寸（CSS像素）
    canvasWidth: 1,
    canvasHeight: 1,
    // 状态栏高度
    statusBarHeight: 0
  },

  _canvas: null,
  _canvasWidth: 0,
  _canvasHeight: 0,

  onLoad() {
    const app = getApp()
    const windowInfo = app.globalData.windowInfo || wx.getWindowInfo()
    const statusBarHeight = windowInfo.statusBarHeight || 0

    const activeTemplateId = loadActiveTemplate()
    const templateList = TEMPLATE_ORDER.map(id => ({
      id,
      name: TEMPLATES[id].name,
      paper: { baseColor: TEMPLATES[id].paper.baseColor }
    }))

    // Canvas 使用 A4 比例（宽:高 ≈ 3:4），宽度取屏幕宽度减边距
    const screenWidth = app.globalData.screenWidth || 375
    const canvasWidth = screenWidth - 48  // 两侧各24px边距
    const canvasHeight = Math.round(canvasWidth * 4 / 3)

    this.setData({
      statusBarHeight,
      activeTemplateId,
      templateList,
      canvasWidth,
      canvasHeight
    })
  },

  onReady() {
    this._initCanvas()
  },

  onShow() {
    // 同步 tabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  _initCanvas() {
    const query = this.createSelectorQuery()
    query.select('#shiwenCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) return
        const canvas = res[0].node
        const dpr = wx.getWindowInfo().pixelRatio || 2
        const physW = Math.floor(res[0].width * dpr)
        const physH = Math.floor(res[0].height * dpr)
        canvas.width = physW
        canvas.height = physH
        this._canvas = canvas
        this._canvasWidth = physW
        this._canvasHeight = physH
      })
  },

  // ============ 粘贴输入 ============

  onPasteInput(e) {
    this.setData({ rawText: e.detail.value })
  },

  onPasteFromClipboard() {
    wx.getClipboardData({
      success: (res) => {
        if (res.data) {
          this.setData({ rawText: res.data })
          wx.showToast({ title: '已粘贴', icon: 'none', duration: 1000 })
        } else {
          wx.showToast({ title: '剪贴板为空', icon: 'none' })
        }
      }
    })
  },

  // ============ 生成（清洗文本） ============

  onGenerate() {
    const raw = this.data.rawText.trim()
    if (!raw) {
      wx.showToast({ title: '请先粘贴文字', icon: 'none' })
      return
    }

    const cleaned = this._cleanText(raw)
    if (cleaned.length < 10) {
      wx.showToast({ title: '有效文字太少，请重新粘贴正文', icon: 'none' })
      return
    }

    this.setData({ cleanedText: cleaned, stage: 'preview' })
  },

  /**
   * 文本清洗：去除广告语、多余空行、特殊符号
   */
  _cleanText(raw) {
    let text = raw

    // 1. 去除多余空白行（超过2个换行合并为2个）
    text = text.replace(/\n{3,}/g, '\n\n')

    // 2. 去除行首行尾空格（保留缩进结构但不过度清洗）
    text = text.split('\n').map(line => line.trim()).join('\n')

    // 3. 去除常见微信公众号推广尾部（简单规则）
    const adPatterns = [
      /\n?[\s\S]*?(点击关注|长按识别|扫码关注|关注公众号|更多精彩|欢迎转发|转发给朋友|↓点击)[\s\S]*$/i,
      /\n?[\s\S]*?(广告|赞赏|打赏|在看|分享|收藏)[\s\S]*$/
    ]
    for (const pattern of adPatterns) {
      const match = text.match(pattern)
      if (match && match.index > text.length * 0.6) {
        // 只去掉后40%才出现的推广内容
        text = text.slice(0, match.index)
      }
    }

    // 4. 去除纯符号行
    text = text.split('\n').filter(line => {
      if (!line.trim()) return true  // 保留空行（段落分隔）
      const meaningfulChars = line.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '')
      return meaningfulChars.length > 0
    }).join('\n')

    return text.trim()
  },

  onCleanedTextEdit(e) {
    this.setData({ cleanedText: e.detail.value })
  },

  onBackToInput() {
    this.setData({ stage: 'input' })
  },

  onSelectTemplate(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ activeTemplateId: id })
    saveActiveTemplate(id)
  },

  // ============ 渲染并导出 ============

  async onRenderAndExport() {
    if (this.data.isRendering) return
    if (!this._canvas) {
      wx.showToast({ title: '渲染组件未就绪，请稍后重试', icon: 'none' })
      return
    }

    this.setData({ isRendering: true })

    try {
      const template = TEMPLATES[this.data.activeTemplateId]
      if (template.font.file) {
        await loadFont(template.font.id || template.font.family)
      }

      const now = new Date()
      const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`

      await renderPage({
        canvas: this._canvas,
        width: this._canvasWidth,
        height: this._canvasHeight,
        text: this.data.cleanedText,
        templateId: this.data.activeTemplateId,
        pageIndex: 0,
        totalPages: 1,
        dateStr
      })

      const tempPath = await exportFlow({
        canvas: this._canvas,
        canvasId: 'shiwenCanvas',
        pageInstance: this,
        canvasSize: { width: this._canvasWidth, height: this._canvasHeight }
      })

      addHistory({
        id: generateId(),
        text: this.data.cleanedText.slice(0, 100),
        templateId: this.data.activeTemplateId,
        exportedAt: Date.now(),
        thumbnailPath: tempPath
      })

      this.setData({ stage: 'done' })
    } catch (err) {
      console.error('[shiwen] 导出失败', err)
      if (err.code === 'AUTH_DENY') {
        wx.showModal({ title: '需要相册权限', content: '请在设置中开启相册权限', showCancel: false })
      } else {
        wx.showToast({ title: '生成失败，请重试', icon: 'none' })
      }
    } finally {
      this.setData({ isRendering: false })
    }
  },

  onReset() {
    this.setData({ stage: 'input', rawText: '', cleanedText: '' })
  },

  onGoToLuomo() {
    wx.switchTab({ url: '/pages/luomo/luomo' })
  }
})
