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
      const url = data.path
      wx.switchTab({ url })
    }
  }
})
