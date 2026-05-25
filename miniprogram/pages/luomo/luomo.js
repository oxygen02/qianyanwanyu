// pages/luomo/luomo.js
// 落墨页 - 主书写页核心逻辑

const { renderPage, estimatePageCount, clearRenderCache } = require('../../engine/renderer')
const { saveDraft, loadDraft, clearDraft, saveActiveTemplate, loadActiveTemplate, addHistory, loadSettings, hasVisited, markVisited } = require('../../utils/storage')
const { exportFlow, generateId } = require('../../utils/export')
const { TEMPLATES, TEMPLATE_ORDER, DEFAULT_TEMPLATE_ID, BUILT_IN_FONTS, PAPER_SIZES } = require('../../utils/constants')
const { loadFont, getFontStatus, formatFileSize } = require('../../utils/font-loader')

// 防抖计时器
let _draftSaveTimer = null
let _renderDebounceTimer = null
let _zoomTimer = null
// 工具栏自动消散定时器
let _toolbarDismissTimer = null
// 键盘高度监听回调引用
let _keyboardChangeCallback = null
// 定时自动保存定时器（每5秒）
let _autoSaveTimer = null

// 工具栏自动消散延迟（毫秒）
const TOOLBAR_DISMISS_DELAY = 4000
// 自动保存间隔（毫秒）
const AUTO_SAVE_INTERVAL = 5000

// 字体预览样本文字
const FONT_PREVIEW_TEXT = '让文字回到纸上'

Page({
  data: {
    // 文字内容
    text: '',
    // 当前页码（0-based）
    currentPage: 0,
    // 总页数
    totalPages: 1,
    // 页码点数组（用于渲染dots）
    pageDots: [0],
    // 正在渲染中
    isRendering: false,
    // 模板面板
    templatePanelVisible: false,
    // 字体选择面板
    fontPanelVisible: false,
    // 当前模板ID
    activeTemplateId: DEFAULT_TEMPLATE_ID,
    // 模板列表（用于面板渲染）
    templateList: [],
    // 字体列表（用于字体选择面板）
    fontList: [],
    // 当前选中字体ID
    activeFontId: '',
    // 当前选中字体下载状态 'idle' | 'loading' | 'loaded' | 'failed'
    activeFontDownloadStatus: 'idle',
    // 水印开关
    watermarkEnabled: true,
    // 设置面板
    settingsPanelVisible: false,
    // 设置面板当前 Tab（text | paper | layout）
    settingsTab: 'text',
    // 运行时设置覆盖（文字 / 纸张 / 排版）
    settings: {
      // === 字体选择 ===
      fontId: '思源宋体-Regular',

      // === 基础排版 ===
      fontSize: 32,
      fontSizeMode: 'px',
      fontSizeDisplay: '32px',
      lineHeight: null,
      lineHeightVal: 140,
      letterSpacing: null,
      letterSpacingVal: 0,
      direction: null,
      fontWeight: '400',
      textAlign: 'left',
      firstLineIndent: 2,

      // === 墨色质感 ===
      inkColor: '#1A1008',
      inkOpacity: 0.35,
      inkOpacityVal: 35,
      variation: null,
      variationVal: 12,
      blurRadius: null,
      blurRadiusVal: 8,

      // === 印刷工艺 ===
      misRegistration: null,
      misRegistrationVal: 8,
      damage: null,
      damageVal: 2,

      // === 基础纸张 ===
      paperBaseColor: '#F5F0E6',
      marginTopVal: 30,
      marginBottomVal: 30,
      marginLeftVal: 20,
      marginRightVal: 20,

      // === 质感效果 ===
      aging: null,
      agingVal: 0,
      fiberOpacity: null,
      fiberOpacityVal: 0,
      shadowIntensity: null,
      shadowIntensityVal: 0,
      lightIntensity: null,
      lightIntensityVal: 0,

      // 装饰元素 ===
      stampEnabled: null,
      watermarkPosition: 'bottomRight',

      // === 纸张尺寸 ===
      paperSizeId: 'a4',

      // === 文字新增设置 ===
      strokeEnabled: false,
      strokeWidth: 1,
      textScript: 'sc',
      preserveLineBreaks: true,
      textSkew: 0,
      watermarkType: 'none',

      // === 排版新增设置 ===
      paragraphSpacing: 25,
      emptyLineHandling: 'preserve',
      compactness: 50,
      pageNumberEnabled: false,
      headerFooterEnabled: false,
      headerText: '',
      footerText: '',
      weatheringEnabled: false,
      weatheringIntensity: 50,
      inkSpreadEnabled: false,
      inkSpreadIntensity: 50,
      layoutModeIndex: 0
    },
    // 纸张尺寸列表（用于选择面板）
    paperSizeList: [],
    // Canvas 放大预览状态
    canvasZoomed: false,
    // 状态栏高度（用于Canvas安全区域留白）
    safeAreaTop: 0,

    // ===== 键盘适配 =====
    // 输入区高度（用于热区避让）
    inputAreaHeight: 210,
    // 键盘是否可见
    keyboardVisible: false,
    // 自动保存指示（用于UI提示）
    autoSaveIndicator: false,

    // ===== 文字设置页面数据 =====
    textSettings: {
      fontOptions: BUILT_IN_FONTS.map(font => ({ id: font.id, name: font.name })),
      fontIndex: 1,
      fontSize: 40,
      fontSizeMode: 'px',
      fontSizeDisplay: '40px',
      weightOptions: ['纤细', '常规', '中等', '加粗'],
      weightIndex: 1,
      inkColorOptions: [
        { id: 'black', name: '纯黑', color: '#0D0D0D' },
        { id: 'songyan', name: '松烟墨黑', color: '#1A1008' },
        { id: 'tanhui', name: '炭灰墨', color: '#3D3530' },
        { id: 'qianqing', name: '浅青墨', color: '#2D3A32' },
        { id: 'fugu', name: '复古浓墨', color: '#2C1810' }
      ],
      inkColorIndex: 0,
      inkOpacity: 35,
      textAlign: 'left',
      watermarkEnabled: false,
      watermarkOptions: ['无水印', '浅纹暗水印', '自定义文字水印', '书页暗纹水印'],
      watermarkIndex: 0,
      traditionalChinese: false,
      strokeEnabled: false,
      strokeWidth: 1,
      preserveLineBreaks: true,
      textSkew: 0,
      textSkewDisplay: '0°'
    },

    // ===== 纸张设置页面数据 =====
    paperSettings: {
      templateOptions: [
        { id: 'modern-prose', name: '现代散文', paperColor: '#FAF7F2', hasFiber: true, fiberOpacity: 0.18, hasWatermark: true, watermarkText: '纸' },
        { id: 'vintage-letter', name: '复古书信', paperColor: '#FEF9E7', hasFiber: true, fiberOpacity: 0.15, hasWatermark: true, watermarkText: '古' },
        { id: 'ancient-manuscript', name: '仿古手抄', paperColor: '#F5EFE6', hasFiber: true, fiberOpacity: 0.25, hasBorder: true, hasWatermark: true, watermarkText: '墨' },
        { id: 'minimal-white', name: '极简白纸', paperColor: '#FFFFFF', hasLines: false },
        { id: 'ancient-xuan', name: '仿古宣纸', paperColor: '#F5F0E6', hasFiber: true, fiberOpacity: 0.28, hasBorder: true, hasWatermark: true, watermarkText: '宣' },
        { id: 'kraft-paper', name: '牛皮信纸', paperColor: '#D4B896', hasFiber: true, fiberOpacity: 0.22, hasLines: true },
        { id: 'typewriter', name: '打字机', paperColor: '#FFFFFF', hasFiber: true, fiberOpacity: 0.05, hasWatermark: true, watermarkText: 'TYPE' },
        { id: 'japanese-washi', name: '日式和纸', paperColor: '#FAF8F5', hasFiber: true, fiberOpacity: 0.20, hasWatermark: true, watermarkText: '和' },
        { id: 'ancient-book', name: '古籍雕版', paperColor: '#F2E8D8', hasFiber: true, fiberOpacity: 0.22, hasBorder: true, hasWatermark: true, watermarkText: '典' },
        { id: 'republic-paper', name: '民国报纸', paperColor: '#E8E0D0', hasFiber: true, fiberOpacity: 0.18, hasLines: true, hasWatermark: true, watermarkText: '报' },
        { id: 'magazine', name: '当代杂志', paperColor: '#FCFCFC', hasFiber: false },
        { id: 'buddhist-script', name: '佛经抄本', paperColor: '#F8F4EC', hasFiber: true, fiberOpacity: 0.20, hasBorder: true, hasWatermark: true, watermarkText: '经' },
        { id: 'grid-paper', name: '方格草稿', paperColor: '#FFFFFF', hasFiber: false, hasGrid: true },
        { id: 'parchment', name: '羊皮纸', paperColor: '#F4E4C1', hasFiber: true, fiberOpacity: 0.25, hasBorder: true, hasWatermark: true, watermarkText: '羊皮' },
        { id: 'retro-diary', name: '复古日记', paperColor: '#FDF8F0', hasFiber: true, fiberOpacity: 0.15, hasLines: true }
      ],
      templateIndex: 0,
      templateExpanded: false,
      templateSwiperItems: [],
      currentSwiperIndex: 0,
      colorOptions: [
        { id: 'cream', name: '米黄旧书色', color: '#F5F0E6' },
        { id: 'ivory', name: '象牙白', color: '#FFFEF7' },
        { id: 'lightblue', name: '浅青宣纸', color: '#F0F5F5' },
        { id: 'lightbrown', name: '浅褐古纸', color: '#EAE5DD' },
        { id: 'white', name: '素白新书', color: '#FFFFFF' }
      ],
      colorIndex: 0,
      agingOptions: ['崭新无尘', '轻微泛黄', '中度做旧', '重度复古泛黄'],
      agingIndex: 1,
      textureOptions: ['无纹理', '书本细纹路', '宣纸纤维纹', '毛边纸纹理', '粗糙复古纸纹'],
      textureIndex: 0,
      shadowEnabled: false,
      shadowIntensity: 50,
      marginVertical: 50,
      marginHorizontal: 50,
      formOptions: ['薄纸质感', '厚卡纸质感', '绵软宣纸质感'],
      formIndex: 0,
      foldOptions: ['无折痕', '居中竖折痕', '侧边翻阅折痕'],
      foldIndex: 0,
      curlOptions: ['无卷边', '四角微卷', '单边卷边'],
      curlIndex: 0,
      imperfectionEnabled: false,
      imperfectionTypeOptions: ['黄斑斑点', '细微墨点', '尘土杂点', '老旧水渍'],
      imperfectionTypeIndex: 0,
      imperfectionIntensity: 50,
      sizeOptions: ['竖版书页720*1080', '横版书页', '方形书页', '朋友圈适配尺寸'],
      sizeIndex: 0,
      stitchEnabled: false,
      stitchTypeOptions: ['线装孔', '书脊压痕'],
      stitchTypeIndex: 0,
      tearOptions: ['平整切边', '自然毛边', '不规则撕边'],
      tearIndex: 0
    },

    // ===== 排版设置页面数据 =====
    layoutSettings: {
      directionOptions: ['横排书写', '古籍竖排'],
      directionIndex: 0,
      verticalDir: 'rtl',
      textAlign: 'left',
      lineHeight: 160,
      lineHeightDisplay: '1.6倍',
      letterSpacing: 2,
      indentOptions: ['无缩进', '2字符缩进', '4字符缩进'],
      indentIndex: 0,
      layoutModeOptions: ['默认模式', '诗词模式', '书信模式', '散文模式', '小说模式'],
      layoutModeIndex: 0,
      weatheringEnabled: false,
      weatheringIntensity: 50,
      inkSpreadEnabled: false,
      inkSpreadIntensity: 50,
      misregistrationEnabled: false,
      misregistrationOffset: 1,
      damageEnabled: false,
      damageTypeOptions: ['边角残缺', '虫蛀小洞', '书页裂口'],
      damageTypeIndex: 0,
      damageIntensity: 50,
      paragraphSpacing: 25,
      emptyLineHandling: 'preserve',
      pageNumberEnabled: false,
      pageNumberPositionOptions: ['底部居中'],
      pageNumberPositionIndex: 0,
      headerFooterEnabled: false,
      headerText: '',
      footerText: '',
      compactness: 50
    }
  },

  // Canvas 对象引用
  _canvas: null,
  _canvasWidth: 0,
  _canvasHeight: 0,
  _canvasReady: false,
  // 触摸起始坐标（用于翻页检测）
  _touchStartX: 0,
  _touchStartY: 0,

  // 字体加载缓存（避免重复加载）
  _loadedFontCache: {},
  
  // 当前有效文本（防抖缓存）
  _pendingText: '',
  // 光标闪烁定时器
  _cursorTimer: null,
  // 光标是否可见（闪烁状态）
  _cursorVisible: false,

  onLoad() {
    // 读取系统信息（状态栏高度用于Canvas安全区域）
    const windowInfo = wx.getWindowInfo()
    this.setData({ safeAreaTop: windowInfo.statusBarHeight || 0 })

    // 恢复上次模板选择
    const activeTemplateId = loadActiveTemplate()

    // 构建模板列表
    const templateList = TEMPLATE_ORDER.map(id => {
      const t = TEMPLATES[id]
      return {
        id: t.id,
        name: t.name,
        desc: t.desc,
        paper: { baseColor: t.paper.baseColor }
      }
    })

    // 构建纸张尺寸列表
    const paperSizeList = Object.values(PAPER_SIZES)

    // 构建字体列表（纯信息展示，标记已下载状态）
    const weightMap = { '200': '极细', '300': '细体', '400': '常规', '500': '中等', '600': '半粗', '700': '粗体', '900': '特粗' }
    const fontList = BUILT_IN_FONTS.map(f => ({
      id: f.id,
      name: f.name,
      displayName: f.name + '-' + (weightMap[f.weight] || f.weight),
      weight: f.weight,
      weightLabel: weightMap[f.weight] || f.weight,
      family: f.family,
      fileSize: f.fileSize,
      fileSizeLabel: formatFileSize(f.fileSize),
      isLoaded: getFontStatus(f.id) === 'loaded'
    }))

    // 读取用户设置
    const userSettings = loadSettings()

    const template = TEMPLATES[activeTemplateId] || TEMPLATES['modern-prose']
    // 当前字体ID = 模板中的 family
    const currentFontId = template.font && template.font.family ? template.font.family : '上古宋体-Regular'

    // 判断当前字体的下载状态
    const currentFontStatus = getFontStatus(currentFontId)

    const templateOptions = [
      { id: 'modern-prose', name: '现代散文', paperColor: '#FAF7F2', hasFiber: true, fiberOpacity: 0.18, hasWatermark: true, watermarkText: '纸' },
      { id: 'vintage-letter', name: '复古书信', paperColor: '#FEF9E7', hasFiber: true, fiberOpacity: 0.15, hasWatermark: true, watermarkText: '古' },
      { id: 'ancient-manuscript', name: '仿古手抄', paperColor: '#F5EFE6', hasFiber: true, fiberOpacity: 0.25, hasBorder: true, hasWatermark: true, watermarkText: '墨' },
      { id: 'minimal-white', name: '极简白纸', paperColor: '#FFFFFF', hasLines: false },
      { id: 'ancient-xuan', name: '仿古宣纸', paperColor: '#F5F0E6', hasFiber: true, fiberOpacity: 0.28, hasBorder: true, hasWatermark: true, watermarkText: '宣' },
      { id: 'kraft-paper', name: '牛皮信纸', paperColor: '#D4B896', hasFiber: true, fiberOpacity: 0.22, hasLines: true },
      { id: 'typewriter', name: '打字机', paperColor: '#FFFFFF', hasFiber: true, fiberOpacity: 0.05, hasWatermark: true, watermarkText: 'TYPE' },
      { id: 'japanese-washi', name: '日式和纸', paperColor: '#FAF8F5', hasFiber: true, fiberOpacity: 0.20, hasWatermark: true, watermarkText: '和' }
    ]
    
    let idx = 0
    const templateSwiperItems = []
    for (let i = 0; i < templateOptions.length; i += 4) {
      templateSwiperItems.push({
        pageIndex: Math.floor(i / 4),
        templates: templateOptions.slice(i, i + 4).map(item => ({ ...item, globalIndex: idx++ }))
      })
    }

    // 构建设置并同步 textSettings
    const initialSettings = this._buildSettingsFromTemplate(template, currentFontId)
    
    this.setData({
      activeTemplateId,
      activeTemplateName: template.name,
      templateList,
      fontList,
      paperSizeList,
      activeFontId: currentFontId,
      activeFontDownloadStatus: currentFontStatus === 'loaded' ? 'loaded' : 'idle',
      watermarkEnabled: userSettings.watermarkEnabled !== false,
      settings: initialSettings,
      // 同步 textSettings
      'textSettings.fontSize': initialSettings.fontSize,
      'textSettings.fontSizeDisplay': initialSettings.fontSizeDisplay,
      'textSettings.inkOpacity': initialSettings.inkOpacityVal,
      // 同步 paperSettings
      'paperSettings.templateOptions': templateOptions,
      'paperSettings.templateSwiperItems': templateSwiperItems,
      'paperSettings.currentSwiperIndex': 0,
      'paperSettings.marginVertical': initialSettings.marginTopVal,
      'paperSettings.marginHorizontal': initialSettings.marginLeftVal,
      // 同步 layoutSettings
      'layoutSettings.lineHeight': initialSettings.lineHeightVal,
      'layoutSettings.lineHeightDisplay': initialSettings.lineHeightDisplay,
      'layoutSettings.letterSpacing': initialSettings.letterSpacingVal,
      'layoutSettings.textAlign': initialSettings.textAlign,
      'layoutSettings.firstLineIndent': initialSettings.firstLineIndent
    })

    // 恢复草稿
    const draft = loadDraft()
    if (draft && draft.text) {
      this._pendingText = draft.text
      this.setData({ text: draft.text })
    }

    // 预加载当前模板字体（提前初始化，避免首次渲染等待）
    if (template.font && template.font.family) {
      loadFont(template.font.family).catch(err => {
        console.warn('[luomo] 预加载字体失败:', err)
      })
    }

    // 注册键盘高度变化监听
    this._registerKeyboardListener()

    // 启动定时自动保存（每5秒）
    this._startAutoSave()
  },

  onReady() {
    // 等待Canvas节点就绪后初始化
    this._initCanvas()

  },

  onShow() {
    // 同步 tabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
    // 每次显示重渲染（模板可能已变更）
    if (this._canvasReady && this.data.text) {
      this._triggerRender()
    }
  },

  onUnload() {
    this._clearAllTimers()
    this._stopCursorBlink()
    // 取消键盘监听
    this._unregisterKeyboardListener()
    // 停止自动保存定时器
    this._stopAutoSave()
  },

  // ============ Canvas 初始化 ============

  _initCanvas() {
    const query = this.createSelectorQuery()
    query.select('#bookCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          console.error('[luomo] Canvas节点获取失败')
          return
        }
        const canvas = res[0].node
        const rawDpr = wx.getWindowInfo().pixelRatio || 2
        // 限制 DPR 最大为 2，平衡清晰度与内存占用
        const dpr = Math.min(rawDpr, 2)

        // 物理像素尺寸
        const cssWidth = res[0].width
        const cssHeight = res[0].height
        const physW = Math.floor(cssWidth * dpr)
        const physH = Math.floor(cssHeight * dpr)

        canvas.width = physW
        canvas.height = physH

        this._canvas = canvas
        this._canvasWidth = physW
        this._canvasHeight = physH
        this._canvasReady = true

        // Canvas就绪，若有文字则渲染，无文字则启动光标闪烁
        if (this.data.text) {
          this._triggerRender()
        } else {
          this._startCursorBlink()
        }
      })
  },

  // ============ 文字输入 ============

  onTextInput(e) {
    const text = e.detail.value
    this._pendingText = text
    this.setData({ text })

    // 有文字时停止光标闪烁，无文字时启动
    if (text && text.length > 0) {
      this._stopCursorBlink()
    } else {
      this._startCursorBlink()
    }

    // 防抖保存草稿（800ms）
    clearTimeout(_draftSaveTimer)
    _draftSaveTimer = setTimeout(() => {
      saveDraft(text)
    }, 800)

    // 防抖渲染（300ms，输入停止后渲染）
    clearTimeout(_renderDebounceTimer)
    _renderDebounceTimer = setTimeout(() => {
      this._doRender(text)
    }, 300)
  },

  onClearDraft() {
    wx.showModal({
      title: '清空文字',
      content: '确认清空所有文字？',
      confirmColor: '#3D2B1F',
      success: (res) => {
        if (res.confirm) {
          this.setData({ text: '', currentPage: 0, totalPages: 1, pageDots: [0] })
          clearDraft()
          this._clearCanvas()
          this._startCursorBlink()
        }
      }
    })
  },

  // ============ 渲染触发 ============

  _triggerRender() {
    if (!this.data.text) {
      this._clearCanvas()
      return
    }
    this._doRender(this.data.text)
  },

  async _doRender(text) {
    if (!this._canvasReady || !text) return

    this.setData({ isRendering: true, renderError: null })

    try {
      // 获取生效模板（含设置覆盖）
      const template = this._getEffectiveTemplate()

      // 验证模板有效性
      if (!template || !template.layout || !template.paper) {
        throw new Error('模板配置无效')
      }

      // 加载字体（并把实际生效的 font-family 写回模板，失败时自动回退到系统字体）
      if (template.font && template.font.family) {
        try {
          const fontFamily = template.font.family
          // 使用缓存避免重复加载
          if (this._loadedFontCache[fontFamily]) {
            template.font.family = this._loadedFontCache[fontFamily]
          } else {
            const loadedFamily = await loadFont(fontFamily)
            this._loadedFontCache[fontFamily] = loadedFamily
            template.font.family = loadedFamily
          }
        } catch (fontErr) {
          console.warn('[luomo] 字体加载失败，使用回退字体:', fontErr.message)
          template.font.family = template.font.fallback || 'serif'
        }
      }

      // 估算总页数
      const total = estimatePageCount(
        text,
        this.data.activeTemplateId,
        this._canvasWidth,
        this._canvasHeight,
        template
      )

      const pageDots = Array.from({ length: total }, (_, i) => i)
      this.setData({ totalPages: total, pageDots })

      // 渲染当前页（带超时保护）
      const renderPromise = renderPage({
        canvas: this._canvas,
        width: this._canvasWidth,
        height: this._canvasHeight,
        text,
        template,
        pageIndex: this.data.currentPage,
        totalPages: total,
        dateStr: this.data.watermarkEnabled ? this._getDateStr() : null
      })

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('渲染超时')), 60000)  // 延长到60秒
      })

      await Promise.race([renderPromise, timeoutPromise])

    } catch (err) {
      console.error('[luomo] 渲染失败', err)
      this.setData({ renderError: err.message || '渲染失败' })
      // 显示错误提示
      wx.showToast({
        title: '渲染失败，请重试',
        icon: 'none',
        duration: 2000
      })
    } finally {
      this.setData({ isRendering: false })
    }
  },

  _clearCanvas() {
    if (!this._canvasReady) return
    // 无文字时渲染空模板背景（保持已选模板显示）
    this._renderEmptyTemplate()
  },

  /**
   * 渲染空模板背景（无文字时显示纸张样式）
   */
  async _renderEmptyTemplate() {
    if (!this._canvasReady) return

    try {
      const template = this._getEffectiveTemplate()
      const ctx = this._canvas.getContext('2d')

      // 清空画布
      ctx.clearRect(0, 0, this._canvasWidth, this._canvasHeight)

      // 渲染纸张背景
      let bgReady = false
      if (template.paper && template.paper.backgroundImage && template.paper.backgroundImage.fileID) {
        try {
          const { loadImageFromFileID } = require('../../utils/image-loader')
          const bgImg = await loadImageFromFileID(template.paper.backgroundImage.fileID)
          ctx.drawImage(bgImg, 0, 0, this._canvasWidth, this._canvasHeight)
          bgReady = true
        } catch (err) {
          console.warn('[luomo] 空模板背景图加载失败', err)
        }
      }

      if (!bgReady) {
        // 使用 paper.js 生成纸张纹理
        const { generatePaperTexture } = require('../../engine/paper')
        const paperOffscreen = wx.createOffscreenCanvas({ type: '2d', width: this._canvasWidth, height: this._canvasHeight })
        generatePaperTexture({
          width: this._canvasWidth,
          height: this._canvasHeight,
          paperConfig: template.paper,
          offscreenCanvas: paperOffscreen
        })
        ctx.drawImage(paperOffscreen, 0, 0)
      }

      // 渲染边框
      const { drawBorder } = require('../../engine/paper')
      drawBorder(ctx, this._canvasWidth, this._canvasHeight, template.paper.border)

    } catch (err) {
      console.error('[luomo] 渲染空模板失败', err)
      // 回退：清空画布
      const ctx = this._canvas.getContext('2d')
      ctx.clearRect(0, 0, this._canvasWidth, this._canvasHeight)
    }
  },

  // ============ 光标闪烁 ============

  /**
   * 启动光标闪烁（无文字时，在Canvas上显示闪烁光标）
   */
  _startCursorBlink() {
    this._stopCursorBlink()
    this._cursorVisible = true
    this._drawCursor()
    this._cursorTimer = setInterval(() => {
      this._cursorVisible = !this._cursorVisible
      if (this._cursorVisible) {
        this._drawCursor()
      } else {
        this._clearCursor()
      }
    }, 600)
  },

  /**
   * 停止光标闪烁
   */
  _stopCursorBlink() {
    if (this._cursorTimer) {
      clearInterval(this._cursorTimer)
      this._cursorTimer = null
    }
    this._cursorVisible = false
    this._clearCursor()
  },

  /**
   * 在Canvas上绘制光标（竖线，位于版心左上角起始位置）
   */
  _drawCursor() {
    if (!this._canvasReady) return
    const template = this._getEffectiveTemplate()
    const dpr = wx.getWindowInfo().pixelRatio || 2
    const layout = template.layout
    // 注意：_getEffectiveTemplate 返回的 layout 值已经是 CSS 像素
    // fontSize 保持 CSS 像素（Canvas 会自动按 DPR 缩放）
    const fontSize = layout.fontSize || 32
    // 边距：如果已经被 _scaleTemplateForDPR 缩放过（在 renderPage 中），
    // 但 _drawCursor 直接读原始 template，所以这里需要乘 DPR
    const marginTop = (layout.marginTop || 60) * dpr
    const marginLeft = (layout.marginLeft || 50) * dpr
    const marginRight = (layout.marginRight || 50) * dpr
    const direction = layout.direction || 'horizontal'
    const lineHeight = (layout.lineHeight || 2.0) * fontSize
    const letterSpacing = (layout.letterSpacing || 0.05) * fontSize

    const ctx = this._canvas.getContext('2d')
    const canvasWidth = this._canvas.width
    const canvasHeight = this._canvas.height
    const contentWidth = canvasWidth - marginLeft - marginRight

    // 计算文字位置
    const text = this.data.text || ''
    let cursorX = marginLeft
    let cursorY = marginTop + fontSize * 0.85  // 基线位置

    if (text.length > 0) {
      if (direction === 'horizontal') {
        // 横排：计算最后一行文字末尾位置（考虑半角字符宽度）
        let currentLineWidth = 0
        let lines = ['']
        for (let i = 0; i < text.length; i++) {
          const ch = text[i]
          const charWidth = fontSize * (ch.charCodeAt(0) >= 0x20 && ch.charCodeAt(0) <= 0x7E ? 0.5 : 1) + letterSpacing
          if (currentLineWidth + charWidth > contentWidth && lines[lines.length - 1].length > 0) {
            lines.push('')
            currentLineWidth = 0
          }
          lines[lines.length - 1] += ch
          currentLineWidth += charWidth
        }
        const lastLine = lines[lines.length - 1] || ''
        // 计算最后一行实际宽度
        let lastLineWidth = 0
        for (let i = 0; i < lastLine.length; i++) {
          const ch = lastLine[i]
          lastLineWidth += fontSize * (ch.charCodeAt(0) >= 0x20 && ch.charCodeAt(0) <= 0x7E ? 0.5 : 1) + letterSpacing
        }
        cursorX = marginLeft + lastLineWidth
        cursorY = marginTop + fontSize * 0.85 + (lines.length - 1) * lineHeight
      } else {
        // 竖排
        const charsPerCol = Math.max(1, Math.floor((canvasHeight - marginTop - marginTop) / (fontSize + letterSpacing)))
        const cols = []
        for (let i = 0; i < text.length; i += charsPerCol) {
          cols.push(text.slice(i, i + charsPerCol))
        }
        const lastCol = cols[cols.length - 1] || ''
        cursorX = marginLeft + (cols.length - 1) * lineHeight
        cursorY = marginTop + fontSize * 0.85 + lastCol.length * (fontSize + letterSpacing)
      }
    }

    // 绘制光标（随字体大小缩放，细短竖线）
    ctx.save()
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = 'rgba(61, 43, 31, 0.40)'
    // 线宽为原来的三分之一（约 fontSize * 0.02）
    ctx.lineWidth = Math.max(1, Math.round(fontSize * 0.02))
    ctx.beginPath()
    // 光标长度为字高的三分之一，居中于基线
    const cursorHeight = fontSize * 0.33
    const cursorTop = cursorY - fontSize * 0.5 - cursorHeight * 0.5
    ctx.moveTo(cursorX, cursorTop)
    ctx.lineTo(cursorX, cursorTop + cursorHeight)
    ctx.stroke()
    ctx.restore()
  },

  /**
   * 清除光标（重绘当前页内容来覆盖光标）
   */
  _clearCursor() {
    if (!this._canvasReady) return
    // 有文字时，光标不应该在Canvas上显示，所以不需要处理
    // 无文字时才需要清除光标
    if (!this.data.text) {
      this._clearCanvas()
    }
  },

  // ============ 翻页交互 ============

  onCanvasTouchStart(e) {
    this._touchStartX = e.touches[0].clientX
    this._touchStartY = e.touches[0].clientY
  },

  onCanvasTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - this._touchStartX
    const dy = e.changedTouches[0].clientY - this._touchStartY

    // 水平滑动 > 60px，且垂直位移 < 水平的一半：翻页
    if (Math.abs(dx) > 60 && Math.abs(dy) < Math.abs(dx) * 0.5) {
      if (dx < 0 && this.data.currentPage < this.data.totalPages - 1) {
        // 左滑翻下一页
        this.setData({ currentPage: this.data.currentPage + 1 }, () => {
          this._triggerRender()
        })
      } else if (dx > 0 && this.data.currentPage > 0) {
        // 右滑翻上一页
        this.setData({ currentPage: this.data.currentPage - 1 }, () => {
          this._triggerRender()
        })
      }
    }
  },

  // ============ 键盘适配 ============

  /**
   * 注册键盘高度变化监听
   * 键盘弹起时：输入区缩小为单行高度，工具栏保持可见
   */
  _registerKeyboardListener() {
    _keyboardChangeCallback = (res) => {
      const keyboardHeight = res.height
      // 工具栏固定高度 80rpx = 40px
      const toolbarHeight = 40
      // 键盘弹出时：输入框单行高度 60rpx + 工具栏 40rpx = 100rpx ≈ 50px
      const collapsedInputHeight = 50
      // 正常状态：输入区约 420rpx ≈ 210px
      const expandedInputHeight = 210

      if (keyboardHeight > 0) {
        // 键盘弹出：输入区收缩，只保留单行输入+工具栏
        this.setData({
          inputAreaHeight: keyboardHeight + collapsedInputHeight,
          keyboardVisible: true
        })
      } else {
        // 键盘收起：恢复完整输入区
        this.setData({
          inputAreaHeight: expandedInputHeight,
          keyboardVisible: false
        })
      }
    }

    wx.onKeyboardHeightChange(_keyboardChangeCallback)
  },

  /**
   * 取消键盘监听
   */
  _unregisterKeyboardListener() {
    if (_keyboardChangeCallback) {
      wx.offKeyboardHeightChange(_keyboardChangeCallback)
      _keyboardChangeCallback = null
    }
  },

  // ============ 模板操作 ============

  // 纸张设置中点击"纸张模板"设置项，切换展开/收起状态
  onTogglePaperTemplates() {
    console.log('[DEBUG] onTogglePaperTemplates called')
    console.log('[DEBUG] current templateExpanded:', this.data.paperSettings.templateExpanded)
    console.log('[DEBUG] templateOptions length:', this.data.paperSettings.templateOptions.length)
    console.log('[DEBUG] templateOptions:', JSON.stringify(this.data.paperSettings.templateOptions))
    const newValue = !this.data.paperSettings.templateExpanded
    this.setData({
      'paperSettings.templateExpanded': newValue
    })
    console.log('[DEBUG] set templateExpanded to:', newValue)
  },

  // 纸张设置中点击"纸张模板"设置项，打开模板选择弹窗（保留向后兼容）
  onShowPaperTemplates() {
    this.setData({ templatePanelVisible: true })
  },

  onOpenTemplates() {
    this.setData({ templatePanelVisible: true })
  },

  onCloseTemplates() {
    this.setData({ templatePanelVisible: false })
  },

  onCloseTemplatesBg() {
    this.setData({ templatePanelVisible: false })
  },

  _stopProp() {
    // catch:tap 阻止冒泡，此函数为空
  },

  onSelectTemplate(e) {
    const id = e.currentTarget.dataset.id
    if (id === this.data.activeTemplateId) {
      this.setData({ templatePanelVisible: false })
      return
    }
    const template = TEMPLATES[id]
    // 同步 paperSettings.templateIndex
    const templateIndex = this.data.paperSettings.templateOptions.findIndex(t => t.id === id)
    const newSettings = this._buildSettingsFromTemplate(template, this.data.activeFontId)
    this.setData({
      activeTemplateId: id,
      activeTemplateName: template.name,
      templatePanelVisible: false,
      currentPage: 0,
      'paperSettings.templateIndex': templateIndex >= 0 ? templateIndex : 0,
      settings: newSettings,
      'textSettings.fontSize': newSettings.fontSize,
      'textSettings.fontSizeDisplay': newSettings.fontSizeDisplay,
      'textSettings.inkOpacity': newSettings.inkOpacityVal
    })
    saveActiveTemplate(id)
    clearRenderCache()
    this._triggerRender()
  },

  onSwitchTemplate(e) {
    const dir = e.currentTarget.dataset.dir
    const order = TEMPLATE_ORDER
    const currentIdx = order.indexOf(this.data.activeTemplateId)
    let nextIdx = currentIdx

    if (dir === 'next') {
      nextIdx = (currentIdx + 1) % order.length
    } else {
      nextIdx = (currentIdx - 1 + order.length) % order.length
    }

    const newId = order[nextIdx]
    const template = TEMPLATES[newId]
    const newSettings = this._buildSettingsFromTemplate(template, this.data.activeFontId)
    this.setData({
      activeTemplateId: newId,
      activeTemplateName: template.name,
      currentPage: 0,
      settings: newSettings,
      'textSettings.fontSize': newSettings.fontSize,
      'textSettings.fontSizeDisplay': newSettings.fontSizeDisplay,
      'textSettings.inkOpacity': newSettings.inkOpacityVal
    })
    saveActiveTemplate(newId)
    // 模板变化时清理缓存
    clearRenderCache()
    this._triggerRender()
  },

  // ============ 设置面板 ============

  /**
   * 切换设置区域（工具栏按钮点击）
   * - 同一Tab再次点击 → 关闭
   * - 不同Tab → 切换到该Tab
   * - 未打开 → 打开并定位到该Tab
   */
  onToggleSettings(e) {
    const tab = e.currentTarget.dataset.tab
    const { settingsPanelVisible, settingsTab } = this.data

    if (settingsPanelVisible) {
      if (settingsTab === tab) {
        this.setData({ settingsPanelVisible: false })
      } else {
        this.setData({ settingsTab: tab })
      }
    } else {
      this._openSettingsPanel(tab)
    }
  },

  /**
   * 在设置区域已打开时切换 Tab
   */
  onSwitchSettingsTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ settingsTab: tab })
  },

  /**
   * 关闭设置区域（完成按钮）
   */
  onCloseSettings() {
    this.setData({ settingsPanelVisible: false })
  },

  /**
   * 打开文字设置面板（兼容旧调用）
   */
  onOpenTextSettings() {
    const { settingsPanelVisible, settingsTab } = this.data
    if (settingsPanelVisible && settingsTab === 'text') {
      this.setData({ settingsPanelVisible: false })
      return
    }
    this._openSettingsPanel('text')
  },

  onOpenPaperSettings() {
    const { settingsPanelVisible, settingsTab } = this.data
    if (settingsPanelVisible && settingsTab === 'paper') {
      this.setData({ settingsPanelVisible: false })
      return
    }
    this._openSettingsPanel('paper')
  },

  onOpenLayoutSettings() {
    const { settingsPanelVisible, settingsTab } = this.data
    if (settingsPanelVisible && settingsTab === 'layout') {
      this.setData({ settingsPanelVisible: false })
      return
    }
    this._openSettingsPanel('layout')
  },

  /**
   * 统一打开设置面板的内部方法
   */
  _openSettingsPanel(tab) {
    const template = TEMPLATES[this.data.activeTemplateId] || TEMPLATES['modern-prose']
    let fontList = null

    if (tab === 'text') {
      const weightMap = { '200': '极细', '300': '细体', '400': '常规', '500': '中等', '600': '半粗', '700': '粗体', '900': '特粗' }
      fontList = BUILT_IN_FONTS.map(f => ({
        id: f.id,
        name: f.name,
        displayName: f.name + '-' + (weightMap[f.weight] || f.weight),
        weight: f.weight,
        weightLabel: weightMap[f.weight] || f.weight,
        family: f.family,
        fileSize: f.fileSize,
        fileSizeLabel: formatFileSize(f.fileSize),
        isLoaded: getFontStatus(f.id) === 'loaded'
      }))
    }

    // 只更新面板显示状态，不重新构建完整settings（避免闪烁）
    this.setData({
      settingsPanelVisible: true,
      settingsTab: tab,
      fontList: fontList || this.data.fontList
    })
    this.setData({ fontPanelVisible: false })
  },

  /**
   * 切换设置面板 Tab（兼容旧调用）
   */
  onSettingsTabChange(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ settingsTab: tab })
  },

  onCloseSettingsBg() {
    this.setData({ settingsPanelVisible: false, fontPanelVisible: false })
  },

  // ============ 字体选择面板 ============

  /**
   * 打开字体选择面板
   * 自动加载当前已选中的字体（用户已同意过），确保预览正确渲染
   */
  onOpenFontPanel() {
    const { activeFontId, fontList } = this.data

    // 先打开面板展示列表
    this.setData({ fontPanelVisible: true })

    // 检查当前选中字体是否已加载
    const currentStatus = getFontStatus(activeFontId)
    if (currentStatus !== 'loaded') {
      // 当前字体未加载 → 静默加载（用户已经在使用这个字体，视为已授权）
      const font = BUILT_IN_FONTS.find(f => f.id === activeFontId)
      if (font && font.fileID) {
        this.setData({ activeFontDownloadStatus: 'loading' })
        loadFont(activeFontId)
          .then(() => {
            // 加载成功：更新列表中该字体的 isLoaded 状态
            const updatedList = this.data.fontList.map(f => {
              if (f.id === activeFontId) return { ...f, isLoaded: true }
              return f
            })
            this.setData({
              activeFontDownloadStatus: 'loaded',
              fontList: updatedList
            })
          })
          .catch(() => {
            this.setData({ activeFontDownloadStatus: 'failed' })
          })
      }
    }
  },

  /**
   * 关闭字体选择面板
   */
  onCloseFontPanel() {
    this.setData({ fontPanelVisible: false })
  },

  /**
   * 选择字体 - 弹出流量确认，用户同意后才下载
   */
  onSelectFont(e) {
    const fontId = e.currentTarget.dataset.id
    const font = BUILT_IN_FONTS.find(f => f.id === fontId)
    if (!font) return

    const currentStatus = getFontStatus(fontId)

    // 已加载完成的字体，直接切换
    if (currentStatus === 'loaded') {
      this._applyFontSelection(fontId, font, 'loaded')
      return
    }

    // 系统字体，直接切换
    if (fontId === 'HeitiSC' || fontId === 'SongtiSC') {
      this._applyFontSelection(fontId, font, 'loaded')
      return
    }

    // 未加载的字体 → 弹出流量确认
    const sizeLabel = formatFileSize(font.fileSize || 0)

    wx.showModal({
      title: '下载字体',
      content: `「${font.name}」字体约 ${sizeLabel}，下载将产生额外流量。是否继续？`,
      confirmText: '下载',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this._applyFontSelection(fontId, font, 'loading')
          this._downloadFont(fontId, font)
        }
        // 取消则不做任何操作
      }
    })
  },

  /**
   * 应用字体选择（更新UI状态）
   */
  _applyFontSelection(fontId, font, downloadStatus) {
    this.setData({
      activeFontId: fontId,
      activeFontDownloadStatus: downloadStatus,
      'settings.fontId': fontId
    })

    if (downloadStatus === 'loaded') {
      this._triggerRender()
    }
  },

  /**
   * 执行字体下载
   */
  _downloadFont(fontId, font) {
    this.setData({ activeFontDownloadStatus: 'loading' })

    loadFont(fontId)
      .then(family => {
        // 下载成功：更新下载状态 + 标记该字体为已加载
        const fontList = this.data.fontList.map(f => {
          if (f.id === fontId) {
            return { ...f, isLoaded: true }
          }
          return f
        })
        this.setData({
          activeFontDownloadStatus: 'loaded',
          fontList
        })
        this._triggerRender()
      })
      .catch(() => {
        this.setData({ activeFontDownloadStatus: 'failed' })
      })
  },

  // --- 基础排版 ---

  onFontSizeChange(e) {
    const val = e.detail.value
    let display
    if (this.data.settings.fontSizeMode === 'px') {
      display = `${val}px`
    } else {
      // 简单的号数转换
      const haoMap = { 72: '初号', 56: '小初', 48: '一号', 44: '小一', 36: '二号', 32: '小二', 28: '三号', 24: '小三', 21: '四号', 18: '小四', 16: '五号', 14: '小五', 12: '六号' }
      display = haoMap[val] || `${val}px`
    }
    this.setData({
      'settings.fontSize': val,
      'settings.fontSizeDisplay': display
    })
    this._triggerRender()
  },

  onFontSizeModeChange(e) {
    const mode = e.currentTarget.dataset.mode
    const val = this.data.settings.fontSize
    let display
    if (mode === 'px') {
      display = `${val}px`
    } else {
      const haoMap = { 72: '初号', 56: '小初', 48: '一号', 44: '小一', 36: '二号', 32: '小二', 28: '三号', 24: '小三', 21: '四号', 18: '小四', 16: '五号', 14: '小五', 12: '六号' }
      display = haoMap[val] || `${val}px`
    }
    this.setData({
      'settings.fontSizeMode': mode,
      'settings.fontSizeDisplay': display
    })
  },

  onInkColorCustom() {
    // 自定义取色功能，这里留空或用微信 API
    wx.showToast({ title: '自定义取色开发中', icon: 'none' })
  },

  onStrokeToggle(e) {
    const val = e.detail.value
    this.setData({
      'settings.strokeEnabled': val,
      'textSettings.strokeEnabled': val
    })
    this._triggerRender()
  },

  onStrokeWidthChange(e) {
    const val = e.detail.value
    this.setData({
      'settings.strokeWidth': val,
      'textSettings.strokeWidth': val,
      'textSettings.strokeDisplay': `${val}px`
    })
    this._triggerRender()
  },

  onTextScriptChange(e) {
    const val = e.currentTarget.dataset.script
    this.setData({
      'settings.textScript': val,
      'textSettings.traditionalChinese': val === 'tc'
    })
    this._triggerRender()
  },

  onLineBreakToggle() {
    const newValue = !this.data.settings.preserveLineBreaks;
    this.setData({
      'settings.preserveLineBreaks': newValue,
      'textSettings.preserveLineBreaks': newValue
    });
    this._triggerRender();
  },

  onTextSkewChange(e) {
    const val = e.detail.value
    this.setData({
      'settings.textSkew': val,
      'textSettings.textSkew': val,
      'textSettings.textSkewDisplay': `${val}°`
    })
    this._triggerRender()
  },

  onAutoFilterToggle(e) {
    this.setData({ 'settings.autoFilter': e.detail.value })
    this._triggerRender()
  },

  onWatermarkTypeChange(e) {
    this.setData({ 'settings.watermarkType': e.currentTarget.dataset.type })
    this._triggerRender()
  },

  onLineHeightChange(e) {
    const val = e.detail.value
    this.setData({
      'settings.lineHeight': val / 100,
      'settings.lineHeightVal': val,
      'settings.lineHeightDisplay': (val / 100).toFixed(1)
    })
    this._triggerRender()

  },

  onLetterSpacingChange(e) {
    const val = e.detail.value
    this.setData({
      'settings.letterSpacing': val / 100,
      'settings.letterSpacingVal': val
    })
    this._triggerRender()

  },

  onDirectionChange(e) {
    this.setData({ 'settings.direction': e.currentTarget.dataset.dir })
    this._triggerRender()

  },

  onFontWeightChange(e) {
    this.setData({ 'settings.fontWeight': e.currentTarget.dataset.w })
    this._triggerRender()

  },

  onTextAlignChange(e) {
    this.setData({ 'settings.textAlign': e.currentTarget.dataset.align })
    this._triggerRender()

  },

  onFirstLineIndentChange(e) {
    this.setData({ 'settings.firstLineIndent': e.detail.value })
    this._triggerRender()

  },

  // --- 墨色质感 ---

  onInkColorChange(e) {
    this.setData({ 'settings.inkColor': e.currentTarget.dataset.color })
    this._triggerRender()

  },

  onInkOpacityChange(e) {
    const val = e.detail.value
    this.setData({
      'settings.inkOpacity': val / 100,
      'settings.inkOpacityVal': val
    })
    this._triggerRender()

  },

  onVariationChange(e) {
    const val = e.detail.value
    this.setData({
      'settings.variation': val / 100,
      'settings.variationVal': val
    })
    this._triggerRender()

  },

  onBlurRadiusChange(e) {
    const val = e.detail.value
    this.setData({
      'settings.blurRadius': val / 10,
      'settings.blurRadiusVal': val
    })
    this._triggerRender()

  },

  // --- 印刷工艺 ---

  onMisRegistrationChange(e) {
    const val = e.detail.value
    this.setData({
      'settings.misRegistration': val / 100,
      'settings.misRegistrationVal': val
    })
    this._triggerRender()

  },

  onDamageChange(e) {
    const val = e.detail.value
    this.setData({
      'settings.damage': val / 100,
      'settings.damageVal': val
    })
    this._triggerRender()

  },

  // --- 基础纸张 ---

  onPaperColorChange(e) {
    this.setData({ 'settings.paperBaseColor': e.currentTarget.dataset.color })
    this._triggerRender()

  },

  onMarginTopChange(e) {
    this.setData({ 'settings.marginTopVal': e.detail.value })
    this._triggerRender()

  },

  onMarginBottomChange(e) {
    this.setData({ 'settings.marginBottomVal': e.detail.value })
    this._triggerRender()

  },

  onMarginLeftChange(e) {
    this.setData({ 'settings.marginLeftVal': e.detail.value })
    this._triggerRender()

  },

  onMarginRightChange(e) {
    this.setData({ 'settings.marginRightVal': e.detail.value })
    this._triggerRender()

  },

  // --- 质感效果 ---

  onAgingChange(e) {
    const val = e.detail.value
    this.setData({
      'settings.aging': val / 100,
      'settings.agingVal': val
    })
    this._triggerRender()

  },

  onFiberOpacityChange(e) {
    const val = e.detail.value
    this.setData({
      'settings.fiberOpacity': val / 100,
      'settings.fiberOpacityVal': val
    })
    this._triggerRender()

  },

  onShadowIntensityChange(e) {
    const val = e.detail.value
    this.setData({
      'settings.shadowIntensity': val / 100,
      'settings.shadowIntensityVal': val
    })
    this._triggerRender()

  },

  onLightIntensityChange(e) {
    const val = e.detail.value
    this.setData({
      'settings.lightIntensity': val / 100,
      'settings.lightIntensityVal': val
    })
    this._triggerRender()

  },

  // --- 装饰元素 ---

  onStampToggle() {
    this.setData({ 'settings.stampEnabled': !this.data.settings.stampEnabled })
    this._triggerRender()

  },

  onWatermarkPositionChange(e) {
    this.setData({ 'settings.watermarkPosition': e.currentTarget.dataset.pos })
    this._triggerRender()

  },

  /**
   * 重置当前 tab 设置
   */
  onResetTab() {
    const tab = this.data.settingsTab
    if (tab === 'text') this.onTextSettingsReset()
    else if (tab === 'paper') this.onPaperSettingsReset()
    else if (tab === 'layout') this.onLayoutSettingsReset()
  },

  onResetSettings() {
    const template = TEMPLATES[this.data.activeTemplateId] || TEMPLATES['modern-prose']
    const newSettings = this._buildSettingsFromTemplate(template, this.data.activeFontId)
    this.setData({ 
      settings: newSettings,
      'textSettings.fontSize': newSettings.fontSize,
      'textSettings.fontSizeDisplay': newSettings.fontSizeDisplay,
      'textSettings.inkOpacity': newSettings.inkOpacityVal
    })
    this._triggerRender()

  },

  // --- 纸张尺寸 ---

  onPaperSizeChange(e) {
    const sizeId = e.currentTarget.dataset.sizeId
    this.setData({ 'settings.paperSizeId': sizeId })
    this._triggerRender()
  },

  // ========== Stepper 处理函数（用于 cover-view 面板）==========

  _clamp(val, min, max) {
    return Math.max(min, Math.min(max, val))
  },

  onFontSizeStep(e) {
    const delta = parseInt(e.currentTarget.dataset.delta)
    const newVal = this._clamp(this.data.settings.fontSize + delta, 10, 100)
    const mode = this.data.textSettings.fontSizeMode
    const display = mode === 'px' ? `${newVal}px` : `${newVal}号`
    this.setData({
      'settings.fontSize': newVal,
      'settings.fontSizeDisplay': display,
      'textSettings.fontSize': newVal,
      'textSettings.fontSizeDisplay': display
    })
    this._triggerRender()
  },

  onInkOpacityStep(e) {
    const delta = parseInt(e.currentTarget.dataset.delta)
    const newVal = this._clamp(this.data.settings.inkOpacityVal + delta, 40, 100)
    this.setData({
      'settings.inkOpacity': newVal / 100,
      'settings.inkOpacityVal': newVal,
      'textSettings.inkOpacity': newVal
    })
    this._triggerRender()
  },

  onMarginTopStep(e) {
    const delta = parseInt(e.currentTarget.dataset.delta)
    const newVal = this._clamp(this.data.settings.marginTopVal + delta, 0, 300)
    this.setData({ 'settings.marginTopVal': newVal })
    this._triggerRender()
  },

  onMarginBottomStep(e) {
    const delta = parseInt(e.currentTarget.dataset.delta)
    const newVal = this._clamp(this.data.settings.marginBottomVal + delta, 0, 300)
    this.setData({ 'settings.marginBottomVal': newVal })
    this._triggerRender()
  },

  onMarginLeftStep(e) {
    const delta = parseInt(e.currentTarget.dataset.delta)
    const newVal = this._clamp(this.data.settings.marginLeftVal + delta, 0, 300)
    this.setData({ 'settings.marginLeftVal': newVal })
    this._triggerRender()
  },

  onMarginRightStep(e) {
    const delta = parseInt(e.currentTarget.dataset.delta)
    const newVal = this._clamp(this.data.settings.marginRightVal + delta, 0, 300)
    this.setData({ 'settings.marginRightVal': newVal })
    this._triggerRender()
  },

  onAgingStep(e) {
    const delta = parseInt(e.currentTarget.dataset.delta)
    const newVal = this._clamp(this.data.settings.agingVal + delta, 10, 100)
    this.setData({
      'settings.aging': newVal / 100,
      'settings.agingVal': newVal
    })
    this._triggerRender()
  },

  onFiberOpacityStep(e) {
    const delta = parseInt(e.currentTarget.dataset.delta)
    const newVal = this._clamp(this.data.settings.fiberOpacityVal + delta, 20, 100)
    this.setData({
      'settings.fiberOpacity': newVal / 100,
      'settings.fiberOpacityVal': newVal
    })
    this._triggerRender()
  },

  onShadowIntensityStep(e) {
    const delta = parseInt(e.currentTarget.dataset.delta)
    const newVal = this._clamp(this.data.settings.shadowIntensityVal + delta, 0, 100)
    this.setData({
      'settings.shadowIntensity': newVal / 100,
      'settings.shadowIntensityVal': newVal
    })
    this._triggerRender()
  },

  onLightIntensityStep(e) {
    const delta = parseInt(e.currentTarget.dataset.delta)
    const newVal = this._clamp(this.data.settings.lightIntensityVal + delta, 0, 100)
    this.setData({
      'settings.lightIntensity': newVal / 100,
      'settings.lightIntensityVal': newVal
    })
    this._triggerRender()
  },

  onLineHeightStep(e) {
    const delta = parseInt(e.currentTarget.dataset.delta)
    const newVal = this._clamp(this.data.settings.lineHeightVal + delta, 50, 600)
    this.setData({
      'settings.lineHeight': newVal / 100,
      'settings.lineHeightVal': newVal,
      'settings.lineHeightDisplay': (newVal / 100).toFixed(1)
    })
    this._triggerRender()
  },

  onLetterSpacingStep(e) {
    const delta = parseInt(e.currentTarget.dataset.delta)
    const newVal = this._clamp(this.data.settings.letterSpacingVal + delta, -100, 100)
    this.setData({
      'settings.letterSpacingVal': newVal,
      'settings.letterSpacing': newVal / 100
    })
    this._triggerRender()
  },

  onVariationStep(e) {
    const delta = parseInt(e.currentTarget.dataset.delta)
    const newVal = this._clamp(this.data.settings.variationVal + delta, 0, 30)
    this.setData({
      'settings.variation': newVal / 100,
      'settings.variationVal': newVal
    })
    this._triggerRender()
  },

  onBlurRadiusStep(e) {
    const delta = parseInt(e.currentTarget.dataset.delta)
    const newVal = this._clamp(this.data.settings.blurRadiusVal + delta, 0, 20)
    this.setData({
      'settings.blurRadius': newVal / 100,
      'settings.blurRadiusVal': newVal
    })
    this._triggerRender()
  },

  onMisRegistrationStep(e) {
    const delta = parseInt(e.currentTarget.dataset.delta)
    const newVal = this._clamp(this.data.settings.misRegistrationVal + delta, 0, 30)
    this.setData({
      'settings.misRegistration': newVal / 100,
      'settings.misRegistrationVal': newVal
    })
    this._triggerRender()
  },

  onDamageStep(e) {
    const delta = parseInt(e.currentTarget.dataset.delta)
    const newVal = this._clamp(this.data.settings.damageVal + delta, 0, 20)
    this.setData({
      'settings.damage': newVal / 100,
      'settings.damageVal': newVal
    })
    this._triggerRender()
  },

  /**
   * 从模板构建完整的 settings 对象
   * @param {object} template
   * @param {string} fontId - 当前选中的字体ID
   */
  _buildSettingsFromTemplate(template, fontId) {
    const t = template || TEMPLATES['modern-prose']
    // 使用模板默认值，确保与模板设计一致
    const templateFontSize = t.layout.fontSize || 40
    const templateLineHeight = t.layout.lineHeight || 1.6
    const templateLetterSpacing = t.layout.letterSpacing || 0.02
    const templateMarginTop = t.layout.marginTop || 50
    const templateMarginBottom = t.layout.marginBottom || 50
    const templateMarginLeft = t.layout.marginLeft || 50
    const templateMarginRight = t.layout.marginRight || 50
    const lineHeightVal = Math.round(templateLineHeight * 100)
    return {
      // 字体选择
      fontId: fontId || (t.font && t.font.family) || '思源宋体-Regular',

      // 基础排版 - 使用模板默认值
      fontSize: templateFontSize,
      fontSizeMode: 'px',
      fontSizeDisplay: `${templateFontSize}px`,
      lineHeight: templateLineHeight,
      lineHeightVal: lineHeightVal,
      lineHeightDisplay: templateLineHeight.toFixed(1),
      letterSpacing: templateLetterSpacing,
      letterSpacingVal: Math.round(templateLetterSpacing * 100),
      direction: t.layout.direction,
      fontWeight: t.font.weight || '400',
      textAlign: t.layout.textAlign || 'left',
      firstLineIndent: t.layout.indent || 2,

      // 墨色质感
      inkColor: t.ink.color || '#1A1008',
      inkOpacity: t.ink.opacity,
      inkOpacityVal: Math.round(t.ink.opacity * 100),
      variation: t.ink.variation,
      variationVal: Math.round(t.ink.variation * 100),
      blurRadius: t.ink.blurRadius,
      blurRadiusVal: Math.round(t.ink.blurRadius * 10),

      // 印刷工艺
      misRegistration: t.ink.misRegistration,
      misRegistrationVal: Math.round(t.ink.misRegistration * 100),
      damage: t.ink.damage,
      damageVal: Math.round(t.ink.damage * 100),

      // 文字设置新增
      strokeEnabled: false,
      strokeWidth: 1,
      strokeDisplay: '1px',
      textScript: 'sc', // sc=简体, tc=繁体
      preserveLineBreaks: true,
      textSkew: 0,
      textSkewDisplay: '0°',
      autoFilter: false,
      watermarkType: 'none', // none, light, custom, page

      // 排版设置新增
      paragraphSpacing: Math.round((t.layout.paragraphSpacing || 0.5) * 50),
      emptyLineHandling: 'preserve',
      compactness: 50,
      pageNumberEnabled: false,
      headerFooterEnabled: false,
      headerText: '',
      footerText: '',
      weatheringEnabled: false,
      weatheringIntensity: 50,
      inkSpreadEnabled: false,
      inkSpreadIntensity: 50,
      layoutModeIndex: 0,

      // 基础纸张 - 使用模板默认值
      paperBaseColor: t.paper.baseColor || '#F5F0E6',
      marginTopVal: templateMarginTop,
      marginBottomVal: templateMarginBottom,
      marginLeftVal: templateMarginLeft,
      marginRightVal: templateMarginRight,

      // 质感效果
      aging: t.paper.ageOpacity || 0,
      agingVal: Math.round((t.paper.ageOpacity || 0) * 100),
      fiberOpacity: t.paper.fiberOpacity || 0,
      fiberOpacityVal: Math.round((t.paper.fiberOpacity || 0) * 100),
      shadowIntensity: t.paper.shadow ? 0.5 : 0,
      shadowIntensityVal: t.paper.shadow ? 50 : 0,
      lightIntensity: (t.paper.light && t.paper.light.enabled) ? (t.paper.light.opacity || 0.2) : 0,
      lightIntensityVal: (t.paper.light && t.paper.light.enabled) ? Math.round((t.paper.light.opacity || 0.2) * 100) : 0,

      // 装饰元素
      stampEnabled: !!(t.decoration && t.decoration.stamp),
      watermarkPosition: (t.decoration && t.decoration.watermark && t.decoration.watermark.position) || 'bottomRight',

      // 纸张尺寸
      paperSizeId: 'a4'
    }
  },

  // 工具栏相关方法已移除

  /**
   * 根据布局模式索引应用推荐参数到模板
   */
  _applyLayoutMode(tpl, modeIndex) {
    const indentMap = { 0: 0, 1: 2, 2: 4 }
    // paragraphSpacing：UI 值 0-100 -> 行数 0-4（除以100乘以4）
    const toLines = (uiVal) => (uiVal / 100) * 4
    switch (modeIndex) {
      case 1: // 诗词模式
        tpl.layout.textAlign = 'center'
        tpl.layout.lineHeight = 2.2
        tpl.layout.paragraphSpacing = toLines(35)
        tpl.layout.indent = indentMap[0]
        break
      case 2: // 书信模式
        tpl.layout.textAlign = 'left'
        tpl.layout.lineHeight = 2.0
        tpl.layout.paragraphSpacing = toLines(20)
        tpl.layout.indent = indentMap[1]
        break
      case 3: // 散文模式
        tpl.layout.textAlign = 'left'
        tpl.layout.lineHeight = 1.9
        tpl.layout.paragraphSpacing = toLines(25)
        tpl.layout.indent = indentMap[1]
        break
      case 4: // 小说模式
        tpl.layout.textAlign = 'left'
        tpl.layout.lineHeight = 1.85
        tpl.layout.paragraphSpacing = toLines(15)
        tpl.layout.indent = indentMap[2]
        break
      default: // 默认模式
        tpl.layout.textAlign = 'left'
        tpl.layout.lineHeight = 1.4
        tpl.layout.paragraphSpacing = toLines(25)
        tpl.layout.indent = indentMap[0]
    }
  },

  /**
   * 获取当前生效的模板（含设置覆盖）
   */
  _getEffectiveTemplate() {
    const base = TEMPLATES[this.data.activeTemplateId] || TEMPLATES['modern-prose']
    const tpl = JSON.parse(JSON.stringify(base))
    const s = this.data.settings

    // === 基础排版（不受布局模式影响的）===
    if (s.fontSize != null) tpl.layout.fontSize = s.fontSize
    if (s.direction != null) tpl.layout.direction = s.direction
    // 字体：优先用 settings.fontId，其次用模板的 family
    if (s.fontId != null) {
      tpl.font.family = s.fontId
    }
    if (s.fontWeight != null) {
      tpl.font.weight = s.fontWeight
    }

    // === 墨色质感 ===
    if (s.inkColor != null) tpl.ink.color = s.inkColor
    if (s.inkOpacity != null) tpl.ink.opacity = s.inkOpacity
    if (s.variation != null) tpl.ink.variation = s.variation
    if (s.blurRadius != null) tpl.ink.blurRadius = s.blurRadius
    if (s.misRegistration != null) tpl.ink.misRegistration = s.misRegistration
    if (s.damage != null) tpl.ink.damage = s.damage

    // === 基础纸张 ===
    if (s.paperBaseColor != null) tpl.paper.baseColor = s.paperBaseColor
    // 边距：滑块值直接作为像素值（不再基于模板默认值的百分比）
    if (s.marginTopVal != null) {
      tpl.layout.marginTop = s.marginTopVal
    }
    if (s.marginBottomVal != null) {
      tpl.layout.marginBottom = s.marginBottomVal
    }
    if (s.marginLeftVal != null) {
      tpl.layout.marginLeft = s.marginLeftVal
    }
    if (s.marginRightVal != null) {
      tpl.layout.marginRight = s.marginRightVal
    }

    // === 质感效果 ===
    if (s.aging != null) tpl.paper.ageOpacity = s.aging
    if (s.fiberOpacity != null) tpl.paper.fiberOpacity = s.fiberOpacity
    if (s.shadowIntensity != null) {
      tpl.paper.shadow = s.shadowIntensity > 0.05
    }
    if (s.lightIntensity != null) {
      if (s.lightIntensity > 0.05) {
        if (!tpl.paper.light) {
          tpl.paper.light = {
            enabled: true,
            centerX: 0.5,
            centerY: 0.35,
            radius: 0.6,
            color: '#FFF8E1',
            opacity: s.lightIntensity
          }
        } else {
          tpl.paper.light.enabled = true
          tpl.paper.light.opacity = s.lightIntensity
        }
      } else if (tpl.paper.light) {
        tpl.paper.light.enabled = false
      }
    }

    // === 装饰元素 ===
    if (s.stampEnabled != null) {
      if (s.stampEnabled) {
        if (!tpl.decoration.stamp) {
          tpl.decoration.stamp = base.decoration.stamp || { text: '记', color: '#C41E3A', position: 'bottomLeft', opacity: 0.7 }
        }
      } else {
        tpl.decoration.stamp = null
      }
    }
    if (s.watermarkPosition != null) {
      if (s.watermarkPosition === 'none') {
        tpl.watermark = null
      } else {
        tpl.watermark = tpl.watermark || { text: '铅言万语', position: 'bottomRight', opacity: 0.15, fontSize: 20 }
        tpl.watermark.position = s.watermarkPosition
      }
    }

    // === 文字新增设置 ===
    // 文字描边
    if (s.strokeEnabled != null) {
      tpl.font.stroke = s.strokeEnabled
    }
    if (s.strokeWidth != null) {
      tpl.font.strokeWidth = s.strokeWidth
    }
    // 繁简转换
    if (s.textScript != null) {
      tpl.layout.textScript = s.textScript // 'sc' = 简体, 'tc' = 繁体
    }
    // 原生换行
    if (s.preserveLineBreaks != null) {
      tpl.layout.preserveLineBreaks = s.preserveLineBreaks
    }
    // 文字倾斜
    if (s.textSkew != null) {
      tpl.layout.textSkew = s.textSkew
    }
    // 水印类型
    if (s.watermarkType != null) {
      tpl.layout.watermarkType = s.watermarkType
    }

    // === 排版新增设置 ===
    // 空行处理
    if (s.emptyLineHandling != null) {
      tpl.layout.emptyLineHandling = s.emptyLineHandling // 'preserve' or 'merge'
    }
    // 排版松紧
    if (s.compactness != null) {
      tpl.layout.compactness = s.compactness // 0-100
    }
    // 页码显示
    if (s.pageNumberEnabled != null) {
      tpl.layout.pageNumberEnabled = s.pageNumberEnabled
    }
    // 页眉页脚
    if (s.headerFooterEnabled != null) {
      tpl.layout.headerFooterEnabled = s.headerFooterEnabled
      tpl.layout.headerText = s.headerText || ''
      tpl.layout.footerText = s.footerText || ''
    }
    // 字体风化
    if (s.weatheringEnabled != null) {
      tpl.ink.weathering = s.weatheringEnabled
      if (s.weatheringIntensity != null) {
        tpl.ink.weatheringIntensity = s.weatheringIntensity / 100
      }
    }
    // 墨色浸染
    if (s.inkSpreadEnabled != null) {
      tpl.ink.inkSpread = s.inkSpreadEnabled
      if (s.inkSpreadIntensity != null) {
        tpl.ink.inkSpreadIntensity = s.inkSpreadIntensity / 100
      }
    }

    // === 布局模式（先应用，后面 s.xxx 可覆盖）===
    if (s.layoutModeIndex != null) {
      this._applyLayoutMode(tpl, s.layoutModeIndex)
    }

    // === 用户排版覆盖（优先级最高，放 _applyLayoutMode 之后）===
    if (s.lineHeight != null) tpl.layout.lineHeight = s.lineHeight
    if (s.letterSpacing != null) tpl.layout.letterSpacing = s.letterSpacing
    if (s.textAlign != null) tpl.layout.textAlign = s.textAlign
    if (s.firstLineIndent != null) tpl.layout.indent = s.firstLineIndent
    // 段落间距：UI 值 0-100，换算为行数（0-4行），放在最后确保优先级最高
    if (s.paragraphSpacing != null) {
      tpl.layout.paragraphSpacing = (s.paragraphSpacing / 100) * 4
    }

    return tpl
  },

  // ============ 水印 ============

  onToggleWatermark() {
    const enabled = !this.data.watermarkEnabled
    this.setData({ watermarkEnabled: enabled })
    this._triggerRender()
  },

  // ============ 导出 ============

  async onExport() {
    if (!this.data.text || !this._canvasReady) {
      wx.showToast({ title: '暂无内容可保存', icon: 'none' })
      return
    }

    this.setData({ isRendering: true })

    try {
      const tempPath = await exportFlow({
        canvas: this._canvas,
        pageInstance: this,
        canvasSize: { width: this._canvasWidth, height: this._canvasHeight }
      })

      // 保存到历史记录
      addHistory({
        id: generateId(),
        text: this.data.text.slice(0, 100),
        templateId: this.data.activeTemplateId,
        exportedAt: Date.now(),
        thumbnailPath: tempPath
      })

      wx.showToast({ title: '已保存到相册', icon: 'success' })
    } catch (err) {
      if (err.code === 'AUTH_DENY') {
        wx.showModal({
          title: '需要相册权限',
          content: '请在设置中开启相册权限',
          showCancel: false
        })
      } else {
        wx.showToast({ title: '保存失败，请重试', icon: 'none' })
      }
    } finally {
      this.setData({ isRendering: false })
    }
  },

  onSharePage() {
    if (!this.data.text) {
      wx.showToast({ title: '暂无内容可分享', icon: 'none' })
      return
    }
    // 分享当前页截图
    this.onExport()
  },

  // ============ 工具方法 ============

  _getDateStr() {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}.${m}.${d}`
  },

  _clearAllTimers() {
    clearTimeout(_draftSaveTimer)
    clearTimeout(_renderDebounceTimer)
    clearTimeout(_zoomTimer)
    clearTimeout(_toolbarDismissTimer)
    if (this._cursorTimer) {
      clearInterval(this._cursorTimer)
      this._cursorTimer = null
    }
    _draftSaveTimer = null
    _renderDebounceTimer = null
    _zoomTimer = null
    _toolbarDismissTimer = null
  },

  // ============ 定时自动保存（每5秒） ============

  /**
   * 启动定时自动保存
   */
  _startAutoSave() {
    this._stopAutoSave()
    _autoSaveTimer = setInterval(() => {
      this._doAutoSave()
    }, AUTO_SAVE_INTERVAL)
  },

  /**
   * 停止定时自动保存
   */
  _stopAutoSave() {
    if (_autoSaveTimer) {
      clearInterval(_autoSaveTimer)
      _autoSaveTimer = null
    }
  },

  /**
   * 执行自动保存（仅当内容有变化时保存）
   */
  _doAutoSave() {
    const currentText = this.data.text
    // 仅在有内容且内容有变化时保存
    if (currentText && currentText.length > 0) {
      // 读取当前草稿内容，对比是否有变化
      const draft = loadDraft()
      const lastSavedText = draft ? draft.text : ''

      if (currentText !== lastSavedText) {
        saveDraft(currentText)
        console.log('[luomo] 自动保存草稿:', currentText.length, '字')
      }
    }
  },

  // ============ 文字设置页面事件处理 ============

  onTextFontChange(e) {
    const index = e.detail.value
    const fontOptions = this.data.textSettings.fontOptions
    const fontId = fontOptions[index].id
    const fontConfig = require('../../utils/constants').BUILT_IN_FONTS.find(f => f.id === fontId)
    const fileSizeMB = fontConfig ? (fontConfig.fileSize / 1024 / 1024).toFixed(1) : '20'
    
    wx.getNetworkType({
      success: (res) => {
        const networkType = res.networkType
        if (networkType !== 'wifi') {
          wx.showModal({
            title: '温馨提示',
            content: `当前为${networkType.toUpperCase()}网络\n该字体大小约${fileSizeMB}MB，首次加载后将自动缓存到本地，后续使用无需重新下载。\n建议在Wi-Fi环境下首次加载以节省流量。\n\n是否继续加载？`,
            confirmText: '继续加载',
            cancelText: '取消',
            success: (modalRes) => {
              if (modalRes.confirm) {
                this._setFontAndRender(fontId, index)
              }
            }
          })
        } else {
          wx.showToast({
            title: `正在加载字体（${fileSizeMB}MB）`,
            icon: 'loading',
            duration: 1000
          })
          setTimeout(() => {
            this._setFontAndRender(fontId, index)
          }, 500)
        }
      },
      fail: () => {
        this._setFontAndRender(fontId, index)
      }
    })
  },
  
  _setFontAndRender(fontId, index) {
    this.setData({
      'textSettings.fontIndex': index,
      'settings.fontId': fontId
    }, () => {
      this._triggerRender()
    })
  },

  onFontSizeChange(e) {
    const val = e.detail.value
    const mode = this.data.textSettings.fontSizeMode
    let display = mode === 'px' ? `${val}px` : `${val}号`
    this.setData({
      'textSettings.fontSize': val,
      'textSettings.fontSizeDisplay': display,
      'settings.fontSize': val
    }, () => {
      this._triggerRender()
    })
  },

  onFontSizeModeChange(e) {
    const mode = e.currentTarget.dataset.mode
    const val = this.data.textSettings.fontSize
    let display = mode === 'px' ? `${val}px` : `${val}号`
    this.setData({
      'textSettings.fontSizeMode': mode,
      'textSettings.fontSizeDisplay': display,
      'settings.fontSizeMode': mode,
      'settings.fontSizeDisplay': display
    })
  },

  onTextWeightChange(e) {
    const index = e.detail.value
    const weights = ['300', '400', '500', '700']
    this.setData({
      'textSettings.weightIndex': index,
      'settings.fontWeight': weights[index]
    }, () => {
      this._triggerRender()
    })
  },

  onTextInkColorChange(e) {
    const index = e.detail.value
    const color = this.data.textSettings.inkColorOptions[index].color
    this.setData({
      'textSettings.inkColorIndex': index,
      'settings.inkColor': color
    }, () => {
      this._triggerRender()
    })
  },

  onTextInkOpacityChange(e) {
    const val = e.detail.value
    this.setData({
      'textSettings.inkOpacity': val,
      'settings.inkOpacity': val / 100,
      'settings.inkOpacityVal': val
    }, () => {
      this._triggerRender()
    })
  },

  onTextAlignChange(e) {
    const align = e.detail.value
    this.setData({
      'textSettings.textAlign': align,
      'settings.textAlign': align
    }, () => {
      this._triggerRender()
    })
  },

  onTextAlignTap(e) {
    const align = e.currentTarget.dataset.align
    this.setData({
      'textSettings.textAlign': align,
      'settings.textAlign': align
    }, () => {
      this._triggerRender()
    })
  },

  onWatermarkToggle(e) {
    const enabled = e.detail.value
    this.setData({
      'textSettings.watermarkEnabled': enabled,
      'settings.watermarkType': enabled ? 'light' : 'none'
    }, () => {
      this._triggerRender()
    })
  },

  onTraditionalChineseToggle(e) {
    const enabled = e.detail.value
    this.setData({
      'textSettings.traditionalChinese': enabled,
      'settings.textScript': enabled ? 'tc' : 'sc'
    }, () => {
      this._triggerRender()
    })
  },

  onWatermarkTypeChange(e) {
    const index = e.detail.value
    const typeMap = ['none', 'light', 'custom', 'page']
    this.setData({
      'textSettings.watermarkIndex': index,
      'settings.watermarkType': typeMap[index] || 'none'
    }, () => {
      this._triggerRender()
    })
  },

  onStrokeToggle(e) {
    const enabled = e.detail.value
    this.setData({
      'textSettings.strokeEnabled': enabled,
      'settings.strokeEnabled': enabled
    }, () => {
      this._triggerRender()
    })
  },

  onStrokeWidthChange(e) {
    const val = e.detail.value
    this.setData({
      'textSettings.strokeWidth': val,
      'settings.strokeWidth': val,
      'textSettings.strokeDisplay': `${val}px`
    }, () => {
      this._triggerRender()
    })
  },

  onLineBreakToggle() {
    const newValue = !this.data.textSettings.preserveLineBreaks
    this.setData({
      'textSettings.preserveLineBreaks': newValue,
      'settings.preserveLineBreaks': newValue
    }, () => {
      this._triggerRender()
    })
  },

  onTextSkewChange(e) {
    const val = e.detail.value
    this.setData({
      'textSettings.textSkew': val,
      'settings.textSkew': val,
      'textSettings.textSkewDisplay': `${val}°`
    }, () => {
      this._triggerRender()
    })
  },

  onTextSettingsReset() {
    this.setData({
      textSettings: {
        fontOptions: BUILT_IN_FONTS.map(font => ({ id: font.id, name: font.name })),
        fontIndex: 1,
        fontSize: 32,
        fontSizeMode: 'px',
        fontSizeDisplay: '32px',
        weightOptions: ['纤细', '常规', '中等', '加粗'],
        weightIndex: 1,
        inkColorOptions: [
          { id: 'black', name: '纯黑', color: '#0D0D0D' },
          { id: 'songyan', name: '松烟墨黑', color: '#1A1008' },
          { id: 'tanhui', name: '炭灰墨', color: '#3D3530' },
          { id: 'qianqing', name: '浅青墨', color: '#2D3A32' },
          { id: 'fugu', name: '复古浓墨', color: '#2C1810' }
        ],
        inkColorIndex: 0,
        inkOpacity: 35,
        textAlign: 'left',
        watermarkEnabled: false,
        watermarkOptions: ['无水印', '浅纹暗水印', '自定义文字水印', '书页暗纹水印'],
        watermarkIndex: 0,
        traditionalChinese: false,
        strokeEnabled: false,
        strokeWidth: 1,
        preserveLineBreaks: true,
        textSkew: 0,
        textSkewDisplay: '0°'
      }
    })
    this.setData({
      'settings.fontWeight': '400',
      'settings.inkColor': '#0D0D0D',
      'settings.inkOpacity': 0.35,
      'settings.inkOpacityVal': 35,
      'settings.fontSize': 32,
      'settings.fontSizeDisplay': '32px'
    })
    this._triggerRender()
    wx.showToast({ title: '已重置文字设置', icon: 'success' })
  },

  // ============ 纸张设置页面事件处理 ============

  _buildTemplateSwiperItems() {
    const options = this.data.paperSettings.templateOptions
    const items = []
    let globalIndex = 0
    for (let i = 0; i < options.length; i += 4) {
      const group = options.slice(i, i + 4).map(item => ({
        ...item,
        globalIndex: globalIndex++
      }))
      items.push({
        pageIndex: Math.floor(i / 4),
        templates: group
      })
    }
    return items
  },

  getTemplateGlobalIndex(swiperIndex, itemIndex) {
    return swiperIndex * 4 + itemIndex
  },

  onTemplateSwiperChange(e) {
    this.setData({ 'paperSettings.currentSwiperIndex': e.detail.current })
  },

  onPaperTemplateChange(e) {
    this.setData({ 'paperSettings.templateIndex': e.detail.value })
    this._triggerRender()
  },

  onPaperTemplateChangeDirect(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    const templateOption = this.data.paperSettings.templateOptions[index]
    const templateId = templateOption.id
    const template = TEMPLATES[templateId]
    
    if (template) {
      const newSettings = this._buildSettingsFromTemplate(template, this.data.activeFontId)
      this.setData({
        'paperSettings.templateIndex': index,
        'paperSettings.templateExpanded': false,
        activeTemplateId: templateId,
        activeTemplateName: template.name,
        currentPage: 0,
        settings: newSettings,
        'textSettings.fontSize': newSettings.fontSize,
        'textSettings.fontSizeDisplay': newSettings.fontSizeDisplay,
        'textSettings.inkOpacity': newSettings.inkOpacityVal,
        isRendering: true
      })
      saveActiveTemplate(templateId)
      clearRenderCache()
      this._clearCanvas()
      setTimeout(() => {
        this._triggerRender()
      }, 100)
    }
  },

  onPaperColorChange(e) {
    const index = e.detail.value
    const color = this.data.paperSettings.colorOptions[index].color
    this.setData({
      'paperSettings.colorIndex': index,
      'settings.paperBaseColor': color
    })
    this._triggerRender()
  },

  onPaperAgingChange(e) {
    const index = e.detail.value
    const agingVals = [0, 25, 50, 80]
    this.setData({
      'paperSettings.agingIndex': index,
      'settings.agingVal': agingVals[index],
      'settings.aging': agingVals[index] / 100
    })
    this._triggerRender()
  },

  onPaperTextureChange(e) {
    this.setData({ 'paperSettings.textureIndex': e.detail.value })
    this._triggerRender()
  },

  onPaperShadowToggle(e) {
    this.setData({ 'paperSettings.shadowEnabled': e.detail.value })
    this._triggerRender()
  },

  onPaperShadowIntensityChange(e) {
    const val = e.detail.value
    this.setData({
      'paperSettings.shadowIntensity': val,
      'settings.shadowIntensityVal': val,
      'settings.shadowIntensity': val / 100
    })
    this._triggerRender()
  },

  onPaperMarginVerticalChange(e) {
    const val = e.detail.value
    this.setData({
      'paperSettings.marginVertical': val,
      'settings.marginTopVal': val,
      'settings.marginBottomVal': val
    })
    this._triggerRender()
  },

  onPaperMarginHorizontalChange(e) {
    const val = e.detail.value
    this.setData({
      'paperSettings.marginHorizontal': val,
      'settings.marginLeftVal': val,
      'settings.marginRightVal': val
    })
    this._triggerRender()
  },

  onPaperFormChange(e) {
    this.setData({ 'paperSettings.formIndex': e.detail.value })
    this._triggerRender()
  },

  onPaperFoldChange(e) {
    this.setData({ 'paperSettings.foldIndex': e.detail.value })
    this._triggerRender()
  },

  onPaperCurlChange(e) {
    this.setData({ 'paperSettings.curlIndex': e.detail.value })
    this._triggerRender()
  },

  onPaperImperfectionToggle(e) {
    this.setData({ 'paperSettings.imperfectionEnabled': e.detail.value })
    this._triggerRender()
  },

  onPaperImperfectionTypeChange(e) {
    this.setData({ 'paperSettings.imperfectionTypeIndex': e.detail.value })
    this._triggerRender()
  },

  onPaperImperfectionIntensityChange(e) {
    this.setData({ 'paperSettings.imperfectionIntensity': e.detail.value })
    this._triggerRender()
  },

  onPaperSizeChange(e) {
    this.setData({ 'paperSettings.sizeIndex': e.detail.value })
    this._triggerRender()
  },

  onPaperStitchToggle(e) {
    this.setData({ 'paperSettings.stitchEnabled': e.detail.value })
    this._triggerRender()
  },

  onPaperStitchTypeChange(e) {
    this.setData({ 'paperSettings.stitchTypeIndex': e.detail.value })
    this._triggerRender()
  },

  onPaperTearChange(e) {
    this.setData({ 'paperSettings.tearIndex': e.detail.value })
    this._triggerRender()
  },

  onPaperSettingsReset() {
    this.setData({
      paperSettings: {
        templateOptions: [
          { id: 'modern-prose', name: '现代散文', paperColor: '#FAF7F2', hasFiber: true, fiberOpacity: 0.18, hasWatermark: true, watermarkText: '纸' },
          { id: 'vintage-letter', name: '复古书信', paperColor: '#FEF9E7', hasFiber: true, fiberOpacity: 0.15, hasWatermark: true, watermarkText: '古' },
          { id: 'ancient-manuscript', name: '仿古手抄', paperColor: '#F5EFE6', hasFiber: true, fiberOpacity: 0.25, hasBorder: true, hasWatermark: true, watermarkText: '墨' },
          { id: 'minimal-white', name: '极简白纸', paperColor: '#FFFFFF', hasLines: false },
          { id: 'ancient-xuan', name: '仿古宣纸', paperColor: '#F5F0E6', hasFiber: true, fiberOpacity: 0.28, hasBorder: true, hasWatermark: true, watermarkText: '宣' },
          { id: 'kraft-paper', name: '牛皮信纸', paperColor: '#D4B896', hasFiber: true, fiberOpacity: 0.22, hasLines: true },
          { id: 'typewriter', name: '打字机', paperColor: '#FFFFFF', hasFiber: true, fiberOpacity: 0.05, hasWatermark: true, watermarkText: 'TYPE' },
          { id: 'japanese-washi', name: '日式和纸', paperColor: '#FAF8F5', hasFiber: true, fiberOpacity: 0.20, hasWatermark: true, watermarkText: '和' }
        ],
        templateIndex: 0,
        templateExpanded: false,
        templateSwiperItems: (() => {
          const opts = [
            { id: 'modern-prose', name: '现代散文', paperColor: '#FAF7F2', hasFiber: true, fiberOpacity: 0.18, hasWatermark: true, watermarkText: '纸' },
            { id: 'vintage-letter', name: '复古书信', paperColor: '#FEF9E7', hasFiber: true, fiberOpacity: 0.15, hasWatermark: true, watermarkText: '古' },
            { id: 'ancient-manuscript', name: '仿古手抄', paperColor: '#F5EFE6', hasFiber: true, fiberOpacity: 0.25, hasBorder: true, hasWatermark: true, watermarkText: '墨' },
            { id: 'minimal-white', name: '极简白纸', paperColor: '#FFFFFF', hasLines: false },
            { id: 'ancient-xuan', name: '仿古宣纸', paperColor: '#F5F0E6', hasFiber: true, fiberOpacity: 0.28, hasBorder: true, hasWatermark: true, watermarkText: '宣' },
            { id: 'kraft-paper', name: '牛皮信纸', paperColor: '#D4B896', hasFiber: true, fiberOpacity: 0.22, hasLines: true },
            { id: 'typewriter', name: '打字机', paperColor: '#FFFFFF', hasFiber: true, fiberOpacity: 0.05, hasWatermark: true, watermarkText: 'TYPE' },
            { id: 'japanese-washi', name: '日式和纸', paperColor: '#FAF8F5', hasFiber: true, fiberOpacity: 0.20, hasWatermark: true, watermarkText: '和' }
          ]
          const items = []
          let idx = 0
          for (let i = 0; i < opts.length; i += 4) {
            items.push({
              pageIndex: Math.floor(i / 4),
              templates: opts.slice(i, i + 4).map(item => ({ ...item, globalIndex: idx++ }))
            })
          }
          return items
        })(),
        currentSwiperIndex: 0,
        colorOptions: [
          { id: 'cream', name: '米黄旧书色', color: '#F5F0E6' },
          { id: 'ivory', name: '象牙白', color: '#FFFEF7' },
          { id: 'lightblue', name: '浅青宣纸', color: '#F0F5F5' },
          { id: 'lightbrown', name: '浅褐古纸', color: '#EAE5DD' },
          { id: 'white', name: '素白新书', color: '#FFFFFF' }
        ],
        colorIndex: 0,
        agingOptions: ['崭新无尘', '轻微泛黄', '中度做旧', '重度复古泛黄'],
        agingIndex: 1,
        textureOptions: ['无纹理', '书本细纹路', '宣纸纤维纹', '毛边纸纹理', '粗糙复古纸纹'],
        textureIndex: 0,
        shadowEnabled: false,
        shadowIntensity: 50,
        marginVertical: 30,
        marginHorizontal: 20,
        formOptions: ['薄纸质感', '厚卡纸质感', '绵软宣纸质感'],
        formIndex: 0,
        foldOptions: ['无折痕', '居中竖折痕', '侧边翻阅折痕'],
        foldIndex: 0,
        curlOptions: ['无卷边', '四角微卷', '单边卷边'],
        curlIndex: 0,
        imperfectionEnabled: false,
        imperfectionTypeOptions: ['黄斑斑点', '细微墨点', '尘土杂点', '老旧水渍'],
        imperfectionTypeIndex: 0,
        imperfectionIntensity: 50,
        sizeOptions: ['竖版书页720*1080', '横版书页', '方形书页', '朋友圈适配尺寸'],
        sizeIndex: 0,
        stitchEnabled: false,
        stitchTypeOptions: ['线装孔', '书脊压痕'],
        stitchTypeIndex: 0,
        tearOptions: ['平整切边', '自然毛边', '不规则撕边'],
        tearIndex: 0
      }
    })
    this.setData({
      'settings.paperBaseColor': '#F5F0E6',
      'settings.agingVal': 25,
      'settings.aging': 0.25,
      'settings.shadowIntensityVal': 0,
      'settings.shadowIntensity': 0,
      'settings.marginTopVal': 30,
      'settings.marginBottomVal': 30,
      'settings.marginLeftVal': 20,
      'settings.marginRightVal': 20
    })
    this._triggerRender()
    wx.showToast({ title: '已重置纸张设置', icon: 'success' })
  },

  // ============ 排版设置页面事件处理 ============

  onLayoutDirectionChange(e) {
    this.setData({ 'layoutSettings.directionIndex': e.detail.value })
    this._triggerRender()
  },

  onLayoutVerticalDirChange(e) {
    this.setData({ 'layoutSettings.verticalDir': e.detail.value })
    this._triggerRender()
  },

  onLayoutAlignChange(e) {
    this.setData({ 'layoutSettings.textAlign': e.detail.value })
    this.setData({ 'settings.textAlign': e.detail.value })
    this._triggerRender()
  },

  onLayoutLineHeightChange(e) {
    const val = e.detail.value
    this.setData({
      'layoutSettings.lineHeight': val,
      'layoutSettings.lineHeightDisplay': (val / 100).toFixed(1) + '倍',
      'settings.lineHeightVal': val,
      'settings.lineHeight': val / 100,
      'settings.lineHeightDisplay': (val / 100).toFixed(1)
    })
    this._triggerRender()
  },

  onLayoutLetterSpacingChange(e) {
    const val = e.detail.value
    this.setData({
      'layoutSettings.letterSpacing': val,
      'settings.letterSpacingVal': val,
      'settings.letterSpacing': val / 100
    })
    this._triggerRender()
  },

  onLayoutIndentChange(e) {
    const index = e.detail.value
    const indents = [0, 2, 4]
    this.setData({
      'layoutSettings.indentIndex': index,
      'settings.firstLineIndent': indents[index]
    })
    this._triggerRender()
  },

  onLayoutWeatheringToggle(e) {
    const enabled = e.detail.value
    this.setData({ 'layoutSettings.weatheringEnabled': enabled, 'settings.weatheringEnabled': enabled })
    this._triggerRender()
  },

  onLayoutWeatheringIntensityChange(e) {
    const val = e.detail.value
    this.setData({ 'layoutSettings.weatheringIntensity': val, 'settings.weatheringIntensity': val })
    this._triggerRender()
  },

  onLayoutInkSpreadToggle(e) {
    const enabled = e.detail.value
    this.setData({ 'layoutSettings.inkSpreadEnabled': enabled, 'settings.inkSpreadEnabled': enabled })
    this._triggerRender()
  },

  onLayoutInkSpreadIntensityChange(e) {
    const val = e.detail.value
    this.setData({ 'layoutSettings.inkSpreadIntensity': val, 'settings.inkSpreadIntensity': val })
    this._triggerRender()
  },

  onLayoutMisregistrationToggle(e) {
    this.setData({ 'layoutSettings.misregistrationEnabled': e.detail.value })
    this._triggerRender()
  },

  onLayoutMisregistrationOffsetChange(e) {
    this.setData({ 'layoutSettings.misregistrationOffset': e.detail.value })
    this._triggerRender()
  },

  onLayoutDamageToggle(e) {
    this.setData({ 'layoutSettings.damageEnabled': e.detail.value })
    this._triggerRender()
  },

  onLayoutDamageTypeChange(e) {
    this.setData({ 'layoutSettings.damageTypeIndex': e.detail.value })
    this._triggerRender()
  },

  onLayoutDamageIntensityChange(e) {
    this.setData({ 'layoutSettings.damageIntensity': e.detail.value })
    this._triggerRender()
  },

  onLayoutParagraphSpacingChange(e) {
    const val = e.detail.value
    this.setData({ 'layoutSettings.paragraphSpacing': val, 'settings.paragraphSpacing': val })
    this._triggerRender()
  },

  onLayoutEmptyLineChange(e) {
    const val = e.detail.value
    this.setData({ 'layoutSettings.emptyLineHandling': val, 'settings.emptyLineHandling': val })
    this._triggerRender()
  },

  onLayoutPageNumberToggle(e) {
    const enabled = e.detail.value
    this.setData({ 'layoutSettings.pageNumberEnabled': enabled, 'settings.pageNumberEnabled': enabled })
    this._triggerRender()
  },

  onLayoutPageNumberPositionChange(e) {
    this.setData({ 'layoutSettings.pageNumberPositionIndex': e.detail.value })
    this._triggerRender()
  },

  onLayoutHeaderFooterToggle(e) {
    const enabled = e.detail.value
    this.setData({ 'layoutSettings.headerFooterEnabled': enabled, 'settings.headerFooterEnabled': enabled })
    this._triggerRender()
  },

  onLayoutHeaderTextChange(e) {
    const val = e.detail.value
    this.setData({ 'layoutSettings.headerText': val, 'settings.headerText': val })
    this._triggerRender()
  },

  onLayoutFooterTextChange(e) {
    const val = e.detail.value
    this.setData({ 'layoutSettings.footerText': val, 'settings.footerText': val })
    this._triggerRender()
  },

  onLayoutCompactnessChange(e) {
    const val = e.detail.value
    this.setData({ 'layoutSettings.compactness': val, 'settings.compactness': val })
    this._triggerRender()
  },

  onLayoutModeChange(e) {
    const index = parseInt(e.detail.value)
    this.setData({ 'layoutSettings.layoutModeIndex': index })
    
    let config
    switch (index) {
      case 1: // 诗词模式
        config = {
          textAlign: 'center',
          lineHeight: 220,
          lineHeightDisplay: '2.2倍',
          paragraphSpacing: 35,
          indentIndex: 0
        }
        break
      case 2: // 书信模式
        config = {
          textAlign: 'left',
          lineHeight: 200,
          lineHeightDisplay: '2.0倍',
          paragraphSpacing: 20,
          indentIndex: 1
        }
        break
      case 3: // 散文模式
        config = {
          textAlign: 'left',
          lineHeight: 190,
          lineHeightDisplay: '1.9倍',
          paragraphSpacing: 25,
          indentIndex: 1
        }
        break
      case 4: // 小说模式
        config = {
          textAlign: 'left',
          lineHeight: 185,
          lineHeightDisplay: '1.85倍',
          paragraphSpacing: 15,
          indentIndex: 2
        }
        break
      default: // 默认模式
        config = {
          textAlign: 'left',
          lineHeight: 140,
          lineHeightDisplay: '1.4倍',
          paragraphSpacing: 25,
          indentIndex: 0
        }
    }
    
    this.setData({
      'layoutSettings.textAlign': config.textAlign,
      'layoutSettings.lineHeight': config.lineHeight,
      'layoutSettings.lineHeightDisplay': config.lineHeightDisplay,
      'layoutSettings.paragraphSpacing': config.paragraphSpacing,
      'layoutSettings.indentIndex': config.indentIndex
    })
    
    this.setData({
      'settings.textAlign': config.textAlign,
      'settings.lineHeightVal': config.lineHeight,
      'settings.lineHeight': config.lineHeight / 100,
      'settings.lineHeightDisplay': (config.lineHeight / 100).toFixed(1),
      'settings.paragraphSpacing': config.paragraphSpacing
    })
    
    this._triggerRender()
    const modeNames = ['默认模式', '诗词模式', '书信模式', '散文模式', '小说模式']
    wx.showToast({ title: `已切换到${modeNames[index]}`, icon: 'success' })
  },

  onLayoutSettingsReset() {
    this.setData({
      layoutSettings: {
        directionOptions: ['横排书写', '古籍竖排'],
        directionIndex: 0,
        verticalDir: 'rtl',
        textAlign: 'left',
        lineHeight: 140,
        lineHeightDisplay: '1.4倍',
        letterSpacing: 0,
        indentOptions: ['无缩进', '2字符缩进', '4字符缩进'],
        indentIndex: 0,
        layoutModeOptions: ['默认模式', '诗词模式', '书信模式', '散文模式', '小说模式'],
        layoutModeIndex: 0,
        weatheringEnabled: false,
        weatheringIntensity: 50,
        inkSpreadEnabled: false,
        inkSpreadIntensity: 50,
        misregistrationEnabled: false,
        misregistrationOffset: 1,
        damageEnabled: false,
        damageTypeOptions: ['边角残缺', '虫蛀小洞', '书页裂口'],
        damageTypeIndex: 0,
        damageIntensity: 50,
        paragraphSpacing: 25,
        emptyLineHandling: 'preserve',
        pageNumberEnabled: false,
        pageNumberPositionOptions: ['底部居中'],
        pageNumberPositionIndex: 0,
        headerFooterEnabled: false,
        headerText: '',
        footerText: '',
        compactness: 50
      }
    })
    this.setData({
      'settings.textAlign': 'left',
      'settings.lineHeightVal': 140,
      'settings.lineHeight': 1.4,
      'settings.lineHeightDisplay': '1.4',
      'settings.letterSpacingVal': 0,
      'settings.letterSpacing': 0,
      'settings.firstLineIndent': 0,
      'settings.paragraphSpacing': 25
    })
    this._triggerRender()
    wx.showToast({ title: '已重置排版设置', icon: 'success' })
  }
})
