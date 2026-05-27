// pages/wendian/wendian.js
// 问典页 - 经典诗词名句素材库

const { contentDB, categories, getAllTags } = require('../../utils/content-data')

Page({
  data: {
    statusBarHeight: 0,
    activeCategory: 'all',
    searchKeyword: '',
    activeTag: '',
    contentList: [],
    filteredList: [],
    categories: categories,
    tags: [],
    showTagsPanel: false,
    copiedId: null
  },

  onLoad() {
    const app = getApp()
    const statusBarHeight = app.globalData.statusBarHeight || 0
    
    this.setData({
      statusBarHeight,
      contentList: contentDB,
      filteredList: contentDB,
      tags: getAllTags()
    })
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  onCategoryTap(e) {
    const category = e.currentTarget.dataset.cat
    this.setData({ 
      activeCategory: category,
      showTagsPanel: false
    })
    this._filterContent()
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
    this._filterContent()
  },

  onClearSearch() {
    this.setData({ searchKeyword: '' })
    this._filterContent()
  },

  onToggleTags() {
    this.setData({ showTagsPanel: !this.data.showTagsPanel })
  },

  onTagTap(e) {
    const tag = e.currentTarget.dataset.tag
    if (this.data.activeTag === tag) {
      this.setData({ activeTag: '', showTagsPanel: false })
    } else {
      this.setData({ activeTag: tag, showTagsPanel: false })
    }
    this._filterContent()
  },

  onClearTag() {
    this.setData({ activeTag: '' })
    this._filterContent()
  },

  _filterContent() {
    let list = [...this.data.contentList]
    
    const cat = this.data.activeCategory
    if (cat && cat !== 'all') {
      list = list.filter(item => item.category === cat)
    }

    const tag = this.data.activeTag
    if (tag) {
      list = list.filter(item => item.tags && item.tags.includes(tag))
    }

    const keyword = this.data.searchKeyword.trim()
    if (keyword) {
      const kw = keyword.toLowerCase()
      list = list.filter(item => 
        (item.title && item.title.toLowerCase().includes(kw)) ||
        (item.author && item.author.toLowerCase().includes(kw)) ||
        (item.content && item.content.toLowerCase().includes(kw)) ||
        (item.tags && item.tags.some(t => t.toLowerCase().includes(kw)))
      )
    }

    this.setData({ filteredList: list })
  },

  onCopyContent(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.contentList.find(c => c.id === id)
    if (!item) return

    const text = item.content.replace(/\n/g, '\n')
    wx.setClipboardData({
      data: text,
      success: () => {
        this.setData({ copiedId: id })
        wx.showToast({ title: '已复制', icon: 'none' })
        setTimeout(() => {
          this.setData({ copiedId: null })
        }, 1500)
      }
    })
  },

  onGoToLuomo(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.contentList.find(c => c.id === id)
    if (!item) return

    wx.setStorageSync('wendian_pending_text', item.content)
    wx.switchTab({
      url: '/pages/luomo/luomo'
    })
  },

  onItemTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/poem-detail/poem-detail?id=${id}`
    })
  },

  onShareContent(item) {
    // 预留：后续可实现生成卡片后分享
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  onShareAppMessage() {
    return {
      title: '问典 - 向经典发问，寻文字之典',
      path: '/pages/wendian/wendian'
    }
  }
})
