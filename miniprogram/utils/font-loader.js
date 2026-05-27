// utils/font-loader.js
// 字体加载管理器 - 支持云存储加载 + 本地文件系统缓存
// 优先使用本地缓存，避免重复下载

const { BUILT_IN_FONTS } = require('./constants')

// 已加载字体缓存：{ fontId: 'loaded'|'loading'|'failed' }
const _loadedFonts = {}
// 临时链接缓存：{ fontId: { url: string, timestamp: number } }
const _tempUrls = {}
// 字体加载失败时间戳（用于防止短时间内重复尝试）
const _fontFailTimes = {}

// 临时链接有效期（毫秒），保守估计5分钟（微信实际有效期通常为2小时）
const TEMP_URL_MAX_AGE = 5 * 60 * 1000
// 本地缓存目录
const FONT_CACHE_DIR = `${wx.env.USER_DATA_PATH}/font_cache`
// 缓存信息存储键
const FONT_CACHE_INFO_KEY = 'font_cache_info'

/**
 * 获取文件系统管理器
 */
function getFS() {
  return wx.getFileSystemManager()
}

/**
 * 确保缓存目录存在
 */
function ensureCacheDir() {
  return new Promise((resolve) => {
    const fs = getFS()
    try {
      fs.accessSync(FONT_CACHE_DIR)
      resolve(true)
    } catch (e) {
      try {
        fs.mkdirSync(FONT_CACHE_DIR, true)
        console.log('[font-loader] 创建字体缓存目录:', FONT_CACHE_DIR)
        resolve(true)
      } catch (err) {
        console.warn('[font-loader] 创建缓存目录失败:', err)
        resolve(false)
      }
    }
  })
}

/**
 * 获取缓存信息（从本地存储）
 * @returns {object} { fontId: { path: string, version: string, timestamp: number } }
 */
function getCacheInfo() {
  try {
    const info = wx.getStorageSync(FONT_CACHE_INFO_KEY)
    return info || {}
  } catch (e) {
    return {}
  }
}

/**
 * 保存缓存信息到本地存储
 */
function saveCacheInfo(info) {
  try {
    wx.setStorageSync(FONT_CACHE_INFO_KEY, info)
  } catch (e) {
    console.warn('[font-loader] 保存缓存信息失败:', e)
  }
}

/**
 * 检查本地是否有缓存的字体文件
 * @param {string} fontId
 * @returns {string|null} 本地文件路径或 null
 */
function getLocalFontPath(fontId) {
  const cacheInfo = getCacheInfo()
  const info = cacheInfo[fontId]
  if (!info || !info.path) return null

  const fs = getFS()
  try {
    fs.accessSync(info.path)
    return info.path
  } catch (e) {
    // 文件不存在，清理过期记录
    delete cacheInfo[fontId]
    saveCacheInfo(cacheInfo)
    return null
  }
}

/**
 * 下载字体文件到本地缓存
 * @param {string} fontUrl - 字体下载链接
 * @param {string} fontId - 字体ID
 * @returns {Promise<string>} 本地文件路径
 */
function downloadFontToCache(fontUrl, fontId) {
  return new Promise((resolve, reject) => {
    const localPath = `${FONT_CACHE_DIR}/${fontId}.ttf`

    wx.downloadFile({
      url: fontUrl,
      filePath: localPath,
      success: (res) => {
        if (res.statusCode === 200) {
          // 保存缓存信息
          const cacheInfo = getCacheInfo()
          cacheInfo[fontId] = {
            path: localPath,
            timestamp: Date.now(),
            size: res.fileSize || 0
          }
          saveCacheInfo(cacheInfo)
          console.log('[font-loader] 字体已缓存到本地:', fontId, '路径:', localPath)
          resolve(localPath)
        } else {
          reject(new Error(`下载失败，状态码: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

/**
 * 清理所有本地字体缓存
 */
function clearLocalCache() {
  return new Promise((resolve) => {
    const fs = getFS()
    try {
      // 读取缓存目录下的所有文件
      const files = fs.readdirSync(FONT_CACHE_DIR)
      files.forEach(file => {
        try {
          fs.unlinkSync(`${FONT_CACHE_DIR}/${file}`)
        } catch (e) {
          // 忽略删除失败
        }
      })
      // 清空缓存信息
      wx.removeStorageSync(FONT_CACHE_INFO_KEY)
      console.log('[font-loader] 已清理所有本地字体缓存')
      resolve(true)
    } catch (e) {
      console.warn('[font-loader] 清理缓存失败:', e)
      resolve(false)
    }
  })
}

/**
 * 获取字体的临时下载链接（通过云存储 fileID）
 * @param {string} fileID - 云存储 fileID
 * @returns {Promise<string>} 临时下载链接
 */
function getTempFileURL(fileID) {
  return new Promise((resolve, reject) => {
    if (!fileID) {
      reject(new Error('fileID 为空'))
      return
    }

    wx.cloud.getTempFileURL({
      fileList: [fileID],
      success: (res) => {
        const file = res.fileList && res.fileList[0]
        if (file && file.tempFileURL) {
          resolve(file.tempFileURL)
        } else {
          reject(new Error('获取临时链接失败: ' + (file && file.errMsg) || '未知错误'))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

/**
 * 获取字体的加载 URL（使用云存储临时链接）
 * 注意：微信小程序 wx.loadFontFace 不支持本地文件路径，必须使用网络 URL
 * 本地缓存仅用于记录已下载状态，避免重复获取临时链接
 * @param {object} fontConfig - 字体配置对象
 * @returns {Promise<string>} 可用于 wx.loadFontFace 的 URL
 */
async function resolveFontURL(fontConfig) {
  // 完整 URL 直接用
  if (fontConfig.url && fontConfig.url.startsWith('http')) {
    return fontConfig.url
  }

  if (fontConfig.fileID) {
    // 检查临时链接缓存
    const cached = _tempUrls[fontConfig.id]
    const now = Date.now()

    if (cached && (now - cached.timestamp) < TEMP_URL_MAX_AGE) {
      return cached.url
    }

    // 重新获取临时链接
    const tempURL = await getTempFileURL(fontConfig.fileID)
    _tempUrls[fontConfig.id] = {
      url: tempURL,
      timestamp: now
    }
    return tempURL
  }

  throw new Error('字体未配置 url 或 fileID: ' + fontConfig.id)
}

/**
 * 强制 Canvas 刷新字体缓存
 * wx.loadFontFace 加载后，Canvas 2D 可能需要一次实际绘制才能真正识别新字体。
 * 此方法在 offscreen canvas 上执行一次 dummy draw，强制字体就绪。
 * @param {string} fontFamily
 * @returns {Promise<void>}
 */
function ensureCanvasFontReady(fontFamily) {
  return new Promise((resolve) => {
    try {
      const offscreen = wx.createOffscreenCanvas({ type: '2d', width: 20, height: 20 })
      const ctx = offscreen.getContext('2d')
      ctx.font = `16px "${fontFamily}"`
      ctx.fillText('字', 5, 15)
      // 给 Canvas 引擎一帧时间真正加载字形
      setTimeout(resolve, 60)
    } catch (e) {
      console.warn('[font-loader] ensureCanvasFontReady 失败:', e)
      resolve()
    }
  })
}

/**
 * 字体大小格式化（用于展示"下载此字体可能产生流量"警告）
 * @param {number} bytes
 * @returns {string} 如 "2.4MB"
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
}

/**
 * 系统字体回退（单一字体名，不含逗号）
 * 关键：微信小程序 Canvas 2D 的 ctx.font 不支持 CSS 字体回退列表。
 * 如果 family 含逗号（如 "A, B, serif"），Canvas 会把它当成一个整体字体名来查找，
 * 找不到就回退到系统默认无衬线体。
 */
function getFallbackFont() {
  try {
    const deviceInfo = wx.getDeviceInfo()
    const platform = deviceInfo.platform
    if (platform === 'ios' || platform === 'mac') return 'STSong'
    if (platform === 'android') return 'Noto Serif CJK SC'
    if (platform === 'devtools') return 'Songti SC'
    return 'serif'
  } catch (e) {
    return 'serif'
  }
}

/**
 * 尝试使用 wx.loadFontFace 加载字体，带重试机制
 * @param {object} fontConfig - 字体配置
 * @param {string} fontUrl - 字体 URL
 * @param {number} maxRetries - 最大重试次数
 * @returns {Promise<string>} 加载成功的 fontFamily 或回退字体
 */
function tryLoadFontFace(fontConfig, fontUrl, maxRetries = 2) {
  return new Promise((resolve) => {
    const FALLBACK_FONT = getFallbackFont()
    let retryCount = 0
    
    const attemptLoad = () => {
      // 设置加载超时（大字体文件需要更长时间）
      const loadTimeout = Math.max(30000, (fontConfig.fileSize || 0) * 2)
      let loadTimer = null
      let isResolved = false

      const safeResolve = (result) => {
        if (!isResolved) {
          isResolved = true
          if (loadTimer) clearTimeout(loadTimer)
          resolve(result)
        }
      }

      loadTimer = setTimeout(() => {
        console.warn('[font-loader] 字体加载超时:', fontConfig.name)
        if (retryCount < maxRetries) {
          retryCount++
          console.log('[font-loader] 重试加载字体:', fontConfig.name, `第${retryCount}次`)
          // 清除临时链接缓存，强制重新获取
          delete _tempUrls[fontConfig.id]
          attemptLoad()
        } else {
          _loadedFonts[fontConfig.id] = 'failed'
          _loadedFonts[fontConfig.id + '_failed'] = true
          safeResolve(FALLBACK_FONT)
        }
      }, loadTimeout)

      wx.loadFontFace({
        family: fontConfig.family,
        source: `url("${fontUrl}")`,
        desc: {
          weight: fontConfig.weight || '400',
          style: fontConfig.style || 'normal'
        },
        success: async () => {
          console.log('[font-loader] wx.loadFontFace 成功:', fontConfig.name)
          await ensureCanvasFontReady(fontConfig.family)
          _loadedFonts[fontConfig.id] = 'loaded'
          console.log('[font-loader] 字体完全就绪:', fontConfig.name)
          safeResolve(fontConfig.family)
        },
        fail: (err) => {
          console.error('[font-loader] wx.loadFontFace 失败:', fontConfig.name, err)
          
          // 检查是否是缓存相关错误
          const errMsg = (err && err.errMsg) || ''
          const isCacheError = errMsg.includes('CACHE_MISS') || errMsg.includes('cache')
          
          if (isCacheError) {
            console.warn('[font-loader] 检测到缓存错误，清除临时链接缓存后重试')
            delete _tempUrls[fontConfig.id]
          }
          
          if (retryCount < maxRetries) {
            retryCount++
            console.log('[font-loader] 重试加载字体:', fontConfig.name, `第${retryCount}次`)
            if (loadTimer) clearTimeout(loadTimer)
            // 延迟后重试
            setTimeout(attemptLoad, 500)
          } else {
            _loadedFonts[fontConfig.id] = 'failed'
            _loadedFonts[fontConfig.id + '_failed'] = true
            _fontFailTimes[fontConfig.id] = Date.now()
            console.warn('[font-loader] 回退到系统字体:', FALLBACK_FONT)
            safeResolve(FALLBACK_FONT)
          }
        }
      })
    }
    
    attemptLoad()
  })
}

/**
 * 加载字体（优先从本地缓存加载，没有则下载并缓存）
 * @param {string} fontId - 字体ID，对应 BUILT_IN_FONTS 的 id
 * @returns {Promise<string>} 返回实际可用的 font-family 名称
 */
function loadFont(fontId) {
  // 已加载，直接返回
  if (_loadedFonts[fontId] === 'loaded') {
    return Promise.resolve(fontId)
  }

  // 系统字体无需加载
  if (fontId === 'HeitiSC') {
    return Promise.resolve('sans-serif')
  }
  if (fontId === 'SongtiSC') {
    return Promise.resolve('serif')
  }

  const FALLBACK_FONT = getFallbackFont()

  const fontConfig = BUILT_IN_FONTS.find(f => f.id === fontId)
  if (!fontConfig) {
    console.warn('[font-loader] 未找到字体配置:', fontId, '，使用系统宋体回退:', FALLBACK_FONT)
    return Promise.resolve(FALLBACK_FONT)
  }

  // 未配置 fileID 或 fileID 为空，直接降级
  if (!fontConfig.fileID) {
    console.warn('[font-loader] 字体未配置 fileID:', fontConfig.name, '，使用系统字体回退:', FALLBACK_FONT)
    return Promise.resolve(FALLBACK_FONT)
  }

  // 检查失败冷却期：如果网络持续失败，1分钟内不重试
  const now = Date.now()
  const failTime = _fontFailTimes[fontId]
  if (failTime && (now - failTime) < 60000) {
    console.warn('[font-loader] 字体', fontConfig.name, '网络失败不久，跳过重试，使用系统字体:', FALLBACK_FONT)
    return Promise.resolve(FALLBACK_FONT)
  }

  // 标记为加载中，防止重复请求
  _loadedFonts[fontId] = 'loading'

  return new Promise((resolve) => {
    // 快速失败：如果之前已经失败过，不再重试（但允许一次刷新重试机会）
    if (_loadedFonts[fontId + '_failed']) {
      // fileID 格式修复后，给一次重新尝试的机会
      const fileID = fontConfig.fileID || ''
      if (fileID.includes('cloud://cloud1-')) {
        console.log('[font-loader] 字体', fontConfig.name, 'fileID格式已更新，允许重新尝试')
        delete _loadedFonts[fontId + '_failed']
      } else {
        console.warn('[font-loader] 字体', fontConfig.name, '之前加载失败，跳过重试')
        resolve(FALLBACK_FONT)
        return
      }
    }

    // 确保缓存目录存在
    ensureCacheDir().then(() => {
      resolveFontURL(fontConfig)
        .then(async (fontUrl) => {
          // 判断是否是本地路径
          const isLocalPath = fontUrl.startsWith(wx.env.USER_DATA_PATH)

          if (!isLocalPath) {
            // 是在线链接，下载到本地缓存（仅用于记录，不用于加载）
            try {
              console.log('[font-loader] 开始下载字体到本地缓存:', fontConfig.name, '(', fontConfig.id, ')', formatFileSize(fontConfig.fileSize || 0))
              await downloadFontToCache(fontUrl, fontConfig.id)
              // 注意：不使用本地路径，因为 wx.loadFontFace 不支持本地文件路径
            } catch (err) {
              console.warn('[font-loader] 下载到本地缓存失败，继续使用在线链接:', err.message)
              // 继续使用在线链接
            }
          } else {
            console.log('[font-loader] 使用本地缓存字体:', fontConfig.name)
          }

          // 使用带重试的字体加载
          const result = await tryLoadFontFace(fontConfig, fontUrl, 2)
          resolve(result)
        })
        .catch((err) => {
          console.error('[font-loader] 获取临时链接失败:', fontConfig.name, err)
          console.error('[font-loader] 云存储权限错误，请检查：')
          console.error('  1. 微信开发者工具 → 云开发 → 存储 → 权限设置 → 改为"所有用户可读"')
          console.error('  2. 或检查 fileID 是否正确（环境ID是否已变更）')
          console.error('  3. 确认 project.config.json 中的 appid 不是 touristappid')
          _loadedFonts[fontId] = 'failed'
          _loadedFonts[fontId + '_failed'] = true
          _fontFailTimes[fontId] = Date.now()
          
          if (typeof wx !== 'undefined' && wx.showToast) {
            wx.showToast({
              title: `${fontConfig.name}加载失败`,
              icon: 'none',
              duration: 2000
            })
          }
          
          const fallbackFont = BUILT_IN_FONTS.find(f => f.id.endsWith('-Regular') && f.id !== fontId && !_loadedFonts[f.id + '_failed'])
          if (fallbackFont) {
            console.warn('[font-loader] 尝试回退到备用字体:', fallbackFont.name)
            if (typeof wx !== 'undefined' && wx.showToast) {
              setTimeout(() => {
                wx.showToast({
                  title: `已切换到${fallbackFont.name}`,
                  icon: 'none',
                  duration: 2000
                })
              }, 2100)
            }
            // 确保回退字体也是真正可用（已加载）
            loadFont(fallbackFont.id)
              .then((loadedFallbackFamily) => resolve(loadedFallbackFamily))
              .catch(() => resolve(FALLBACK_FONT))
          } else {
            console.warn('[font-loader] 回退到系统字体:', FALLBACK_FONT)
            resolve(FALLBACK_FONT)
          }
        })
    })
  })
}

/**
 * 批量预加载字体（在页面渲染前调用）
 * @param {string[]} fontIds - 需要预加载的字体ID列表，不传则加载全部
 */
function preloadFonts(fontIds) {
  const ids = fontIds || BUILT_IN_FONTS.map(f => f.id)
  return Promise.allSettled(ids.map(id => loadFont(id)))
}

/**
 * 查询字体加载状态
 * @param {string} fontId
 * @returns {'loaded'|'loading'|'failed'|'unloaded'}
 */
function getFontStatus(fontId) {
  return _loadedFonts[fontId] || 'unloaded'
}

/**
 * 清空临时链接缓存
 */
function clearTempUrlCache() {
  Object.keys(_tempUrls).forEach(key => delete _tempUrls[key])
}

/**
 * 获取缓存统计信息
 * @returns {object} 缓存统计
 */
function getCacheStats() {
  const cacheInfo = getCacheInfo()
  const stats = {
    cachedFonts: Object.keys(cacheInfo),
    totalCount: 0,
    totalSize: 0
  }

  Object.values(cacheInfo).forEach(info => {
    stats.totalCount++
    stats.totalSize += info.size || 0
  })

  return stats
}

module.exports = {
  loadFont,
  preloadFonts,
  getFontStatus,
  clearTempUrlCache,
  clearLocalCache,
  formatFileSize,
  getCacheStats
}
