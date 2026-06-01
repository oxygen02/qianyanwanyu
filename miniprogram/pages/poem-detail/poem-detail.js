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
    this.setData({ totalCount: poemService.getTotalCount() })
    
    if (options.id) {
      await this._loadPoemById(options.id)
    } else {
      await this._loadRandomPoem()
    }
  },

  async _loadPoemById(id) {
    this.setData({ isLoading: true })
    try {
      const poem = await poemService.getById(id)
      const idx = poemService.getCurrentIndex(id)
      this.setData({
        poem,
        currentIndex: idx >= 0 ? idx : 0,
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
      const idx = poemService.getCurrentIndex(poem.id)
      this.setData({
        poem,
        currentIndex: idx >= 0 ? idx : 0,
        isLoading: false
      })
    } catch (err) {
      this.setData({ isLoading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  async onPrevPoem() {
    if (this.data.isLoading) return
    const { currentIndex } = this.data
    
    if (currentIndex <= 0) {
      wx.showToast({ title: '已经是第一篇了', icon: 'none' })
      return
    }

    this.setData({ isLoading: true })
    try {
      const prevIndex = currentIndex - 1
      const poem = poemService.getByIndex(prevIndex)
      if (poem) {
        this.setData({
          poem,
          currentIndex: prevIndex,
          isLoading: false
        })
        wx.pageScrollTo({ scrollTop: 0, duration: 300 })
      } else {
        this.setData({ isLoading: false })
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    } catch (err) {
      this.setData({ isLoading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  async onRandomPoem() {
    if (this.data.isLoading) return
    await this._loadRandomPoem()
    wx.pageScrollTo({ scrollTop: 0, duration: 300 })
  },

  async onNextPoem() {
    if (this.data.isLoading) return
    const { currentIndex, totalCount } = this.data

    if (currentIndex >= totalCount - 1) {
      wx.showToast({ title: '已经是最后一篇了', icon: 'none' })
      return
    }

    this.setData({ isLoading: true })
    try {
      const nextIndex = currentIndex + 1
      const poem = poemService.getByIndex(nextIndex)
      if (poem) {
        this.setData({
          poem,
          currentIndex: nextIndex,
          isLoading: false
        })
        wx.pageScrollTo({ scrollTop: 0, duration: 300 })
      } else {
        this.setData({ isLoading: false })
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
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

  preventTouchMove() {
    return false
  }
})
