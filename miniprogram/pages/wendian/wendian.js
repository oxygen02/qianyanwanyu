// pages/wendian/wendian.js
// 问典页 - 经典诗词名句素材库（云端加载版）

const poemService = require('../../utils/poem-service.js')

Page({
  data: {
    statusBarHeight: 0,
    activeCategory: 'all',
    searchKeyword: '',
    activeTag: '',
    contentList: [],
    filteredList: [],
    categories: [],
    tags: [],
    showTagsPanel: false,
    isLoading: false,
    hasMore: true,
    offset: 0,
    limit: 20
  },

  async onLoad() {
    const app = getApp()
    const statusBarHeight = app.globalData.statusBarHeight || 0

    this.setData({
      statusBarHeight,
      categories: poemService.getCategories()
    })

    await this._loadPoems()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  async _loadPoems(reset = false) {
    if (this.data.isLoading) return

    const offset = reset ? 0 : this.data.offset

    this.setData({ isLoading: true })

    try {
      let result

      if (this.data.searchKeyword) {
        result = await poemService.search(this.data.searchKeyword, this.data.limit, offset)
      } else if (this.data.activeCategory !== 'all') {
        result = await poemService.getByCategory(this.data.activeCategory, this.data.limit, offset)
      } else {
        result = await poemService.getList(this.data.limit, offset)
      }

      // 为每条数据生成摘要（如果没有的话）
      const processedList = result.list.map(item => {
        if (!item.excerpt && item.content) {
          // 取前30个字作为摘要
          const excerpt = item.content.replace(/\n/g, ' ').substring(0, 30) + (item.content.length > 30 ? '...' : '')
          return { ...item, excerpt }
        }
        return item
      })

      const newList = reset ? processedList : [...this.data.contentList, ...processedList]

      this.setData({
        contentList: newList,
        filteredList: newList,
        hasMore: result.hasMore,
        offset: offset + result.list.length,
        isLoading: false
      })

      // 提取标签
      this._extractTags(newList)
    } catch (err) {
      console.error('[wendian] 加载失败:', err)
      this.setData({ isLoading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  _extractTags(list) {
    const tagSet = new Set()
    list.forEach(item => {
      if (item.tags) {
        item.tags.forEach(tag => tagSet.add(tag))
      }
    })
    this.setData({ tags: Array.from(tagSet).sort() })
  },

  async onCategoryTap(e) {
    const category = e.currentTarget.dataset.cat
    this.setData({
      activeCategory: category,
      showTagsPanel: false,
      offset: 0
    })
    await this._loadPoems(true)
  },

  async onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value,
      offset: 0
    })
    await this._loadPoems(true)
  },

  async onClearSearch() {
    this.setData({
      searchKeyword: '',
      offset: 0
    })
    await this._loadPoems(true)
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
    this._filterByTag()
  },

  onClearTag() {
    this.setData({ activeTag: '', showTagsPanel: false })
    this._filterByTag()
  },

  _filterByTag() {
    const tag = this.data.activeTag
    if (!tag) {
      this.setData({ filteredList: this.data.contentList })
      return
    }

    const filtered = this.data.contentList.filter(item =>
      item.tags && item.tags.includes(tag)
    )
    this.setData({ filteredList: filtered })
  },

  async onLoadMore() {
    if (!this.data.hasMore || this.data.isLoading) return
    await this._loadPoems()
  },

  onItemTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/poem-detail/poem-detail?id=${id}`
    })
  },

  onShareContent(item) {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  onShareAppMessage() {
    return {
      title: '问典 - 向经典发问，寻文字之典',
      path: '/pages/wendian/wendian'
    }
  }
})
