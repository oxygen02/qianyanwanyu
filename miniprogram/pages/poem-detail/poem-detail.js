// pages/poem-detail/poem-detail.js
const { contentDB } = require('../../utils/content-data')

Page({
  data: {
    poem: null,
    currentIndex: 0,
    totalCount: contentDB.length,
    activeTab: 'wendian'
  },

  onLoad(options) {
    this._loadPoemById(options.id)
  },

  _loadPoemById(id) {
    const index = contentDB.findIndex(item => item.id === id)
    if (index === -1) {
      wx.showToast({ title: '诗词未找到', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    this._loadPoemByIndex(index)
  },

  _loadPoemByIndex(index) {
    const poem = contentDB[index]
    const lines = poem.content.split('\n')
    this.setData({
      poem: { ...poem, lines },
      currentIndex: index,
      totalCount: contentDB.length
    })
  },

  onPrevPoem() {
    const newIndex = this.data.currentIndex > 0 ? this.data.currentIndex - 1 : contentDB.length - 1
    this._loadPoemByIndex(newIndex)
    wx.pageScrollTo({ scrollTop: 0, duration: 300 })
  },

  onRandomPoem() {
    let newIndex
    do {
      newIndex = Math.floor(Math.random() * contentDB.length)
    } while (newIndex === this.data.currentIndex && contentDB.length > 1)
    this._loadPoemByIndex(newIndex)
    wx.pageScrollTo({ scrollTop: 0, duration: 300 })
  },

  onNextPoem() {
    const newIndex = this.data.currentIndex < contentDB.length - 1 ? this.data.currentIndex + 1 : 0
    this._loadPoemByIndex(newIndex)
    wx.pageScrollTo({ scrollTop: 0, duration: 300 })
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

  onShareAppMessage() {
    const poem = this.data.poem
    return {
      title: `${poem.title} · ${poem.author}`,
      path: `/pages/poem-detail/poem-detail?id=${poem.id}`
    }
  }
})
