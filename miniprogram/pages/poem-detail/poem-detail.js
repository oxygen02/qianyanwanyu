// pages/poem-detail/poem-detail.js
const poemService = require('../../utils/poem-service')

Page({
  data: {
    poem: null,
    currentIndex: 0,
    totalCount: 0,
    activeTab: 'wendian',
    isLoading: false
  },

  async onLoad(options) {
    if (options.id) {
      await this._loadPoemById(options.id)
    } else {
      // 如果没有ID，随机加载一首
      await this._loadRandomPoem()
    }
  },

  async _loadPoemById(id) {
    this.setData({ isLoading: true })
    try {
      const poem = await poemService.getById(id)
      this.setData({
        poem,
        isLoading: false
      })
    } catch (err) {
      this.setData({ isLoading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  async _loadRandomPoem() {
    this.setData({ isLoading: true })
    try {
      const poem = await poemService.getRandom()
      this.setData({
        poem,
        isLoading: false
      })
    } catch (err) {
      this.setData({ isLoading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  async onPrevPoem() {
    this.setData({ isLoading: true })
    try {
      // 获取当前分类的上一首
      const poem = await poemService.getRandom() // 临时用随机，后续可优化为获取上一首
      this.setData({
        poem,
        isLoading: false
      })
      wx.pageScrollTo({ scrollTop: 0, duration: 300 })
    } catch (err) {
      this.setData({ isLoading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  async onRandomPoem() {
    this.setData({ isLoading: true })
    try {
      const poem = await poemService.getRandom()
      this.setData({
        poem,
        isLoading: false
      })
      wx.pageScrollTo({ scrollTop: 0, duration: 300 })
    } catch (err) {
      this.setData({ isLoading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  async onNextPoem() {
    this.setData({ isLoading: true })
    try {
      // 获取当前分类的下一首
      const poem = await poemService.getRandom() // 临时用随机，后续可优化为获取下一首
      this.setData({
        poem,
        isLoading: false
      })
      wx.pageScrollTo({ scrollTop: 0, duration: 300 })
    } catch (err) {
      this.setData({ isLoading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  onGoLuomo() {
    wx.switchTab({ url: '/pages/luomo/luomo' })
  },

  onGoWendian() {
    wx.switchTab({ url: '/pages/wendian/wendian' })
  },

  onGoWujuan() {
    wx.switchTab({ url: '/pages/wujuan/wujuan' })
  },

  onCopyPoem() {
    const poem = this.data.poem
    if (!poem) return

    const text = poem.lines.join('\n')
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: '诗词已复制', icon: 'none' })
      }
    })
  },

  onShareAppMessage() {
    const poem = this.data.poem
    return {
      title: `${poem.title} · ${poem.author}`,
      path: `/pages/poem-detail/poem-detail?id=${poem.id}`
    }
  },

  // 阻止触摸事件冒泡
  preventTouchMove() {
    return false
  }
})
