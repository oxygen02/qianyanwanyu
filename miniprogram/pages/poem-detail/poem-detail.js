// pages/poem-detail/poem-detail.js
const { contentDB } = require('../../utils/content-data')

Page({
  data: {
    poem: null,
    showTranslation: false,
    showAppreciation: false,
    showAnnotations: false,
    copied: false
  },

  onLoad(options) {
    const id = options.id
    const poem = contentDB.find(item => item.id === id)
    if (!poem) {
      wx.showToast({ title: '诗词未找到', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    this.setData({ poem })
  },

  onToggleTranslation() {
    this.setData({ showTranslation: !this.data.showTranslation })
  },

  onToggleAppreciation() {
    this.setData({ showAppreciation: !this.data.showAppreciation })
  },

  onToggleAnnotations() {
    this.setData({ showAnnotations: !this.data.showAnnotations })
  },

  onCopyContent() {
    const poem = this.data.poem
    if (!poem) return
    wx.setClipboardData({
      data: poem.content,
      success: () => {
        this.setData({ copied: true })
        wx.showToast({ title: '已复制原文', icon: 'none' })
        setTimeout(() => this.setData({ copied: false }), 1500)
      }
    })
  },

  onGoToLuomo() {
    const poem = this.data.poem
    if (!poem) return
    wx.setStorageSync('wendian_pending_text', poem.content)
    wx.switchTab({ url: '/pages/luomo/luomo' })
  },

  onShareAppMessage() {
    const poem = this.data.poem
    return {
      title: `${poem.title} · ${poem.author}`,
      path: `/pages/poem-detail/poem-detail?id=${poem.id}`
    }
  }
})
