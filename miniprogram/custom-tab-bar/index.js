Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: '/pages/luomo/luomo',
        text: '落墨'
      },
      {
        pagePath: '/pages/shiwen/shiwen',
        text: '拾文'
      },
      {
        pagePath: '/pages/wujuan/wujuan',
        text: '吾卷'
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