// pages/shiwen/shiwen.js
// 拾文页 - 文章转书页（重构版）
// 支持：粘贴网址自动提取、粘贴文字智能清洗、图片单独插画页

const { renderPage } = require('../../engine/renderer')
const { renderImagePage } = require('../../engine/image-page-renderer')
const { cleanContent, cleanText, blocksToText, buildPageSequence } = require('../../utils/content-cleaner')
const { exportFlow, generateId } = require('../../utils/export')
const { loadActiveTemplate, saveActiveTemplate, addHistory } = require('../../utils/storage')
const { TEMPLATES, TEMPLATE_ORDER, DEFAULT_TEMPLATE_ID } = require('../../utils/constants')
const { loadFont } = require('../../utils/font-loader')

Page({
  data: {
    // 阶段：input / loading / preview / done
    stage: 'input',

    // 原始输入
    rawInput: '',

    // 提取结果
    articleTitle: '',
    articleAuthor: '',
    wordCount: 0,
    removedAds: [],

    // 页面序列（文字页 + 图片插画页）
    allPages: [],
    currentPageIndex: 0,
    totalPages: 0,

    // 模板
    activeTemplateId: DEFAULT_TEMPLATE_ID,
    templateList: [],

    // Canvas 尺寸
    canvasWidth: 1,
    canvasHeight: 1,

    // 状态
    isRendering: false,
    isExporting: false,
    statusBarHeight: 0,

    // 触摸翻页
    touchStartX: 0,
    touchStartY: 0,
    isSwiping: false
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

    // Canvas 使用 A4 比例
    const screenWidth = app.globalData.screenWidth || 375
    const canvasWidth = screenWidth - 48
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

  // ============ 输入处理 ============

  onInputChange(e) {
    this.setData({ rawInput: e.detail.value })
  },

  async onPasteFromClipboard() {
    try {
      const res = await wx.getClipboardData()
      if (res.data) {
        this.setData({ rawInput: res.data })
        wx.showToast({ title: '已粘贴', icon: 'none', duration: 1000 })
      } else {
        wx.showToast({ title: '剪贴板为空', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '读取剪贴板失败', icon: 'none' })
    }
  },

  // ============ 内容提取 ============

  async onExtract() {
    const input = this.data.rawInput.trim()
    if (!input) {
      wx.showToast({ title: '请输入内容或网址', icon: 'none' })
      return
    }

    this.setData({ stage: 'loading', isRendering: true })

    try {
      const contentType = cleanContent(input)
      let result

      if (contentType.type === 'url') {
        // 网址：优先调用云函数提取，失败自动降级到文本清洗
        try {
          result = await this._fetchFromUrl(contentType.url || input)
        } catch (urlErr) {
          console.warn('[shiwen] URL提取失败，降级文本清洗:', urlErr)
          wx.showToast({ title: '链接抓取失败，已按文本清洗', icon: 'none', duration: 1500 })
          result = cleanText(input)
        }
      } else {
        // 纯文本：前端清洗
        result = cleanText(input)
      }

      // 构建页面序列
      const pages = buildPageSequence(result.blocks)

      if (pages.length === 0) {
        wx.showToast({ title: '未能提取到有效内容', icon: 'none' })
        this.setData({ stage: 'input', isRendering: false })
        return
      }

      this.setData({
        stage: 'preview',
        articleTitle: result.title || '',
        articleAuthor: result.author || '',
        wordCount: result.wordCount || 0,
        removedAds: result.removedAds || [],
        allPages: pages,
        currentPageIndex: 0,
        totalPages: pages.length,
        isRendering: false
      })

      // 延迟渲染第一页，确保Canvas已就绪
      setTimeout(() => {
        this._renderCurrentPage()
      }, 100)

    } catch (err) {
      console.error('[shiwen] 提取失败:', err)
      wx.showToast({
        title: err.message || '内容提取失败',
        icon: 'none',
        duration: 2000
      })
      this.setData({ stage: 'input', isRendering: false })
    }
  },

  async _fetchFromUrl(url) {
    wx.showLoading({ title: '正在抓取文章...', mask: true })

    let timeoutTimer = null
    try {
      const callPromise = wx.cloud.callFunction({
        name: 'fetchArticle',
        data: { url }
      })
      const timeoutPromise = new Promise((_, reject) => {
        timeoutTimer = setTimeout(() => {
          reject(new Error('链接抓取超时，请稍后重试或直接粘贴正文'))
        }, 12000)
      })
      const { result } = await Promise.race([callPromise, timeoutPromise])

      if (result.code !== 0) {
        throw new Error(result.message || '抓取失败')
      }

      const data = result.data || {}

      // 将云函数结构化结果重建为“可清洗文本”
      const rebuiltParts = []
      if (data.title && data.title !== '未命名文章') {
        rebuiltParts.push(data.title)
      }
      if (Array.isArray(data.content) && data.content.length > 0) {
        data.content.forEach((block) => {
          if (!block) return
          if (block.type === 'img' && block.url) {
            rebuiltParts.push(`![插图](${block.url})`)
          } else if (block.text && block.text.trim()) {
            rebuiltParts.push(block.text.trim())
          }
        })
      } else if (data.textContent) {
        rebuiltParts.push(data.textContent)
      }

      const rebuiltText = rebuiltParts.join('\n\n')
      const cleaned = cleanText(rebuiltText)

      // 云端元信息兜底
      return {
        ...cleaned,
        title: cleaned.title || (data.title && data.title !== '未命名文章' ? data.title : ''),
        author: data.author || '',
        wordCount: cleaned.wordCount || data.wordCount || 0
      }

    } catch (err) {
      throw err
    } finally {
      if (timeoutTimer) clearTimeout(timeoutTimer)
      wx.hideLoading()
    }
  },

  // ============ 渲染 ============

  async _renderCurrentPage() {
    const { allPages, currentPageIndex, activeTemplateId } = this.data
    const page = allPages[currentPageIndex]

    if (!page || !this._canvas) {
      console.warn('[shiwen] Canvas未就绪或页面为空')
      return
    }

    this.setData({ isRendering: true })

    try {
      const template = TEMPLATES[activeTemplateId]
      if (!template) {
        throw new Error('模板不存在: ' + activeTemplateId)
      }

      // 加载字体
      if (template.font && template.font.family) {
        const isSystemFont = ['serif', 'sans-serif', 'monospace'].includes(template.font.family)
        if (!isSystemFont) {
          try {
            await loadFont(template.font.id || template.font.family)
          } catch (fontErr) {
            console.warn('[shiwen] 字体加载失败，使用fallback:', fontErr)
          }
        }
      }

      const dateStr = this._getDateStr()

      if (page.type === 'text') {
        const text = blocksToText(page.blocks)
        if (!text.trim()) {
          console.warn('[shiwen] 文字页内容为空')
          return
        }

        await renderPage({
          canvas: this._canvas,
          width: this._canvasWidth,
          height: this._canvasHeight,
          text,
          templateId: activeTemplateId,
          pageIndex: currentPageIndex,
          totalPages: allPages.length,
          dateStr
        })
      } else if (page.type === 'image') {
        await renderImagePage({
          canvas: this._canvas,
          width: this._canvasWidth,
          height: this._canvasHeight,
          imageUrl: page.url,
          templateId: activeTemplateId,
          caption: page.caption,
          pageIndex: currentPageIndex,
          totalPages: allPages.length
        })
      }

    } catch (err) {
      console.error('[shiwen] 渲染失败:', err)
      wx.showToast({ title: '渲染失败', icon: 'none' })
    } finally {
      this.setData({ isRendering: false })
    }
  },

  // ============ 翻页交互 ============

  onTouchStart(e) {
    this.setData({
      touchStartX: e.touches[0].clientX,
      touchStartY: e.touches[0].clientY,
      isSwiping: false
    })
  },

  onTouchMove(e) {
    // 可选：添加跟随手指的动画效果
  },

  onTouchEnd(e) {
    const { touchStartX, touchStartY, currentPageIndex, totalPages, isRendering } = this.data
    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    const diffX = endX - touchStartX
    const diffY = endY - touchStartY

    // 判断是否为横向滑动（忽略纵向滑动）
    if (Math.abs(diffX) < Math.abs(diffY) * 1.5) {
      return // 主要是纵向滑动，不翻页
    }

    // 滑动阈值
    if (Math.abs(diffX) > 50) {
      if (diffX > 0 && currentPageIndex > 0) {
        // 向右滑 -> 上一页
        this._goToPage(currentPageIndex - 1)
      } else if (diffX < 0 && currentPageIndex < totalPages - 1) {
        // 向左滑 -> 下一页
        this._goToPage(currentPageIndex + 1)
      }
    }
  },

  onTapPage(e) {
    const { clientX } = e.detail
    const { windowWidth } = wx.getWindowInfo()
    const { currentPageIndex, totalPages, isRendering } = this.data

    if (isRendering) return

    const third = windowWidth / 3

    if (clientX < third && currentPageIndex > 0) {
      // 点击左1/3 -> 上一页
      this._goToPage(currentPageIndex - 1)
    } else if (clientX > third * 2 && currentPageIndex < totalPages - 1) {
      // 点击右1/3 -> 下一页
      this._goToPage(currentPageIndex + 1)
    }
  },

  async _goToPage(pageIndex) {
    if (pageIndex < 0 || pageIndex >= this.data.totalPages) return
    if (this.data.isRendering) return

    this.setData({ currentPageIndex: pageIndex })
    await this._renderCurrentPage()
  },

  onPrevPage() {
    this._goToPage(this.data.currentPageIndex - 1)
  },

  onNextPage() {
    this._goToPage(this.data.currentPageIndex + 1)
  },

  // ============ 模板选择 ============

  onSelectTemplate(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ activeTemplateId: id })
    saveActiveTemplate(id)

    // 重新渲染当前页
    if (this.data.stage === 'preview') {
      this._renderCurrentPage()
    }
  },

  // ============ 导出 ============

  async onExport() {
    const { allPages, isExporting } = this.data
    if (isExporting || allPages.length === 0) return

    this.setData({ isExporting: true })
    wx.showLoading({ title: '导出中...', mask: true })

    try {
      const exportedPaths = []

      for (let i = 0; i < allPages.length; i++) {
        // 更新当前页索引并渲染
        this.setData({ currentPageIndex: i })
        await this._renderCurrentPage()

        // 导出当前页
        const tempPath = await exportFlow({
          canvas: this._canvas,
          canvasId: 'shiwenCanvas',
          pageInstance: this,
          canvasSize: { width: this._canvasWidth, height: this._canvasHeight }
        })

        exportedPaths.push(tempPath)

        // 添加到历史记录（只记录第一页作为缩略图）
        if (i === 0) {
          addHistory({
            id: generateId(),
            text: this.data.articleTitle || allPages[i].type === 'text'
              ? '拾文 - ' + this.data.wordCount + '字'
              : '拾文 - 插图',
            templateId: this.data.activeTemplateId,
            exportedAt: Date.now(),
            thumbnailPath: tempPath
          })
        }
      }

      wx.hideLoading()
      this.setData({ stage: 'done', isExporting: false })

    } catch (err) {
      wx.hideLoading()
      console.error('[shiwen] 导出失败:', err)

      if (err.code === 'AUTH_DENY') {
        wx.showModal({
          title: '需要相册权限',
          content: '请在设置中开启相册权限以保存图片',
          showCancel: false
        })
      } else {
        wx.showToast({ title: '导出失败，请重试', icon: 'none' })
      }

      this.setData({ isExporting: false })
    }
  },

  // ============ 页面控制 ============

  onBackToInput() {
    this.setData({
      stage: 'input',
      rawInput: '',
      allPages: [],
      currentPageIndex: 0,
      totalPages: 0,
      articleTitle: '',
      articleAuthor: '',
      wordCount: 0,
      removedAds: []
    })
  },

  onReset() {
    this.onBackToInput()
  },

  onGoToLuomo() {
    wx.switchTab({ url: '/pages/luomo/luomo' })
  },

  // ============ 工具方法 ============

  _getDateStr() {
    const now = new Date()
    return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`
  }
})
