// pages/wujuan/wujuan.js
// 吾卷页 - 个人中心：历史、模板、设置

const { loadHistory, deleteHistory, loadActiveTemplate, saveActiveTemplate, loadCustomTemplates, loadSettings, saveSettings } = require('../../utils/storage')
const { TEMPLATES, TEMPLATE_ORDER } = require('../../utils/constants')

Page({
  data: {
    activeTab: 'history',
    // 历史记录
    historyList: [],
    // 系统模板列表
    systemTemplates: [],
    // 自定义模板列表
    customTemplates: [],
    // 当前激活模板
    activeTemplateId: 'modern-prose',
    // 设置
    settings: {
      watermarkEnabled: true,
      exportQuality: 'high'
    },
    statusBarHeight: 0
  },

  onLoad() {
    const app = getApp()
    const statusBarHeight = app.globalData.navBarHeight || app.globalData.statusBarHeight || 0
    this.setData({ statusBarHeight })
  },

  onShow() {
    // 同步 tabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
    // 每次显示时刷新数据
    this._loadData()
  },

  _loadData() {
    const rawHistory = loadHistory()
    // 格式化历史记录，补充模板名称和日期字符串
    const historyList = rawHistory.map(item => {
      const template = TEMPLATES[item.templateId]
      const date = new Date(item.exportedAt)
      const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
      return {
        ...item,
        templateName: template ? template.name : item.templateId,
        dateStr
      }
    })

    const systemTemplates = TEMPLATE_ORDER.map(id => ({
      id,
      name: TEMPLATES[id].name,
      desc: TEMPLATES[id].desc,
      paper: { baseColor: TEMPLATES[id].paper.baseColor }
    }))

    const customTemplates = loadCustomTemplates()
    const activeTemplateId = loadActiveTemplate()
    const settings = loadSettings()

    this.setData({
      historyList,
      systemTemplates,
      customTemplates,
      activeTemplateId,
      settings
    })
  },

  // ============ Tab 切换 ============

  onSwitchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  // ============ 历史记录 ============

  onHistoryItemTap(e) {
    // 预留：点击历史记录项目可以在落墨页中重新加载
    // 暂时不做跳转，后续版本实现
  },

  onDeleteHistory(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除记录',
      content: '确认删除此历史记录？',
      confirmColor: '#3D2B1F',
      success: (res) => {
        if (res.confirm) {
          deleteHistory(id)
          this._loadData()
        }
      }
    })
  },

  _noop() {},

  // ============ 模板 ============

  onApplyTemplate(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ activeTemplateId: id })
    saveActiveTemplate(id)
    wx.showToast({ title: `已切换：${TEMPLATES[id].name}`, icon: 'none', duration: 1200 })
  },

  // ============ 设置 ============

  onToggleWatermark(e) {
    const enabled = e.detail.value
    const settings = { ...this.data.settings, watermarkEnabled: enabled }
    this.setData({ settings })
    saveSettings(settings)
  },

  onAbout() {
    wx.showModal({
      title: '铅言万语',
      content: '为文字造一页纸，写一本书\n让阅读回到阅读\n\nv1.0',
      showCancel: false,
      confirmText: '好'
    })
  }
})
