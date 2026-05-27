// app.js
// 微信云开发环境ID（从云存储控制台复制）
const CLOUD_ENV = '636c-cloud1-d6g9rv89829bcd240-1434021718'

App({
  globalData: {
    // 云开发环境ID
    cloudEnv: CLOUD_ENV,
    // 当前激活模板
    activeTemplate: 'modern-prose',
    // 系统信息
    systemInfo: null,
    // 状态栏高度
    statusBarHeight: 0,
    // 底部安全区高度
    safeAreaBottom: 0,
    // 屏幕宽度
    screenWidth: 375,
    // 屏幕高度
    screenHeight: 667,
    // 字体加载状态
    fontLoaded: false,
    // 字体名称（实际加载成功的）
    activeFontFamily: 'serif'
  },

  onLaunch() {
    // 初始化云开发
    wx.cloud.init({
      env: CLOUD_ENV,
      traceUser: true
    })

    // 使用新版 API（getSystemInfoSync / getSystemInfo 已废弃）
    const windowInfo = wx.getWindowInfo()
    const deviceInfo = wx.getDeviceInfo()
    const appBaseInfo = wx.getAppBaseInfo()

    // 组合为兼容对象（用于需要完整 systemInfo 的地方）
    this.globalData.systemInfo = {
      ...windowInfo,
      ...deviceInfo,
      ...appBaseInfo
    }
    this.globalData.statusBarHeight = windowInfo.statusBarHeight || 0
    this.globalData.screenWidth = windowInfo.screenWidth || 375
    this.globalData.screenHeight = windowInfo.screenHeight || 667

    // 底部安全区
    this.globalData.safeAreaBottom = windowInfo.screenHeight - (windowInfo.safeArea ? windowInfo.safeArea.bottom : windowInfo.screenHeight)

    // 计算导航栏总高度（状态栏 + 胶囊按钮 + 间距）
    let navBarHeight = (windowInfo.statusBarHeight || 0) + 44 // 默认值
    try {
      const menuButton = wx.getMenuButtonBoundingClientRect()
      if (menuButton && menuButton.top > 0) {
        // 导航栏高度 = 胶囊按钮底部 + 8px间距
        navBarHeight = menuButton.bottom + 8
      }
    } catch (e) {
      console.warn('[app] 获取胶囊按钮位置失败，使用默认导航栏高度')
    }
    this.globalData.navBarHeight = navBarHeight
    console.log('[app] 导航栏总高度:', navBarHeight, '状态栏:', windowInfo.statusBarHeight)
  }
})
