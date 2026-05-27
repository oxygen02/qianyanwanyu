Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: '/pages/luomo/luomo',
        text: '落墨',
        iconPath: '/images/tab-luomo.png',
        selectedIconPath: '/images/tab-luomo-active.png'
      },
      {
        pagePath: '/pages/wendian/wendian',
        text: '问典',
        iconPath: '/images/tab-wendian.png',
        selectedIconPath: '/images/tab-wendian-active.png'
      },
      {
        pagePath: '/pages/wujuan/wujuan',
        text: '吾卷',
        iconPath: '/images/tab-wujuan.png',
        selectedIconPath: '/images/tab-wujuan-active.png'
      }
    ]
  },

  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.pagePath || data.path
      console.log('[tabBar] 切换到:', url)
      wx.switchTab({
        url,
        fail: (err) => {
          console.error('[tabBar] 切换失败:', err)
        }
      })
    }
  }
})
