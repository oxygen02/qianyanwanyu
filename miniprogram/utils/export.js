// utils/export.js
// 图片导出工具
//
// 重要：本项目使用 Canvas 2D API（new-canvas），必须用 canvas.toTempFilePath() 实例方法
//       不能使用 wx.canvasToTempFilePath() 全局方法，否则真机上会失败！

function exportCanvasToImage(canvas, pageInstance, canvasSize, quality) {
  const scale = quality === 'ultra' ? 3 : quality === 'standard' ? 1 : 2
  const TIMEOUT_MS = 30000  // 大文本需要更长时间

  // ============ 诊断日志：打印 canvas 状态 ============
  const canvasInfo = {
    isNull: !canvas,
    hasToTempFilePath: !!(canvas && typeof canvas.toTempFilePath === 'function'),
    canvasType: canvas ? (canvas.constructor ? canvas.constructor.name : 'unknown') : 'null',
    canvasWidth: canvas ? canvas.width : 'N/A',
    canvasHeight: canvas ? canvas.height : 'N/A',
    paramWidth: canvasSize ? canvasSize.width : 'N/A',
    paramHeight: canvasSize ? canvasSize.height : 'N/A'
  }
  console.log('[export] 开始导出, canvas状态:', JSON.stringify(canvasInfo), 'quality:', quality)

  // 前置校验：canvas 无效时立即拒绝
  if (!canvas) {
    return Promise.reject(new Error('Canvas对象为空，请等待页面加载完成后重试'))
  }
  if (!canvas.width || !canvas.height || canvas.width <= 0 || canvas.height <= 0) {
    return Promise.reject(new Error('Canvas尺寸无效(w=' + canvas.width + ',h=' + canvas.height + ')，请重试'))
  }

  return new Promise((resolve, reject) => {
    const timeoutTimer = setTimeout(() => {
      console.error('[export] canvas.toTempFilePath 超时 (', TIMEOUT_MS, 'ms)')
      reject(new Error('图片生成超时，请重试或减少文字内容'))
    }, TIMEOUT_MS)

    // Canvas 2D 必须使用实例方法 canvas.toTempFilePath()
    // 不能使用 wx.canvasToTempFilePath() 全局方法
    if (canvas && typeof canvas.toTempFilePath === 'function') {
      // 新版 Canvas 2D API
      canvas.toTempFilePath({
        x: 0,
        y: 0,
        width: canvasSize.width,
        height: canvasSize.height,
        destWidth: canvasSize.width * scale,
        destHeight: canvasSize.height * scale,
        fileType: 'jpg',
        quality: 0.95,
        success: (res) => {
          clearTimeout(timeoutTimer)
          console.log('[export] canvas.toTempFilePath 成功')
          resolve(res.tempFilePath)
        },
        fail: (err) => {
          clearTimeout(timeoutTimer)
          // 打印完整错误信息用于诊断
          const errDetail = {
            errMsg: err.errMsg || 'unknown',
            errCode: err.errCode || 'N/A',
            message: err.message || '',
            fullError: JSON.stringify(err).slice(0, 500)
          }
          console.error('[export] canvas.toTempFilePath 失败, 详情:', JSON.stringify(errDetail))
          reject(err)
        }
      })
    } else {
      // 降级：尝试旧版 wx.canvasToTempFilePath
      console.warn('[export] canvas.toTempFilePath 不可用，降级到 wx.canvasToTempFilePath')
      wx.canvasToTempFilePath({
        canvas,
        x: 0,
        y: 0,
        width: canvasSize.width,
        height: canvasSize.height,
        destWidth: canvasSize.width * scale,
        destHeight: canvasSize.height * scale,
        fileType: 'jpg',
        quality: 0.95,
        success: (res) => {
          clearTimeout(timeoutTimer)
          resolve(res.tempFilePath)
        },
        fail: (err) => {
          clearTimeout(timeoutTimer)
          reject(err)
        }
      }, pageInstance)
    }
  })
}

function saveToAlbum(tempFilePath, retryCount = 0) {
  const MAX_RETRY = 1
  return new Promise((resolve, reject) => {
    wx.saveImageToPhotosAlbum({
      filePath: tempFilePath,
      success: () => { resolve() },
      fail: (err) => {
        const errMsg = err.errMsg || ''
        console.error('[export] saveImageToPhotosAlbum 失败:', errMsg, '重试次数:', retryCount)

        if (errMsg.includes('auth deny') || errMsg.includes('authorize')) {
          reject({ code: 'AUTH_DENY', message: '需要相册权限才能保存图片', errMsg })
          return
        }

        // 网络或临时性错误，自动重试1次
        if (retryCount < MAX_RETRY && (errMsg.includes('fail') || errMsg.includes('error'))) {
          setTimeout(() => {
            saveToAlbum(tempFilePath, retryCount + 1).then(resolve).catch(reject)
          }, 500)
          return
        }

        reject(err)
      }
    })
  })
}

function generateId() {
  return 'qy_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

async function exportFlow(params) {
  // 步骤1：Canvas转临时文件（Canvas 2D 使用实例方法）
  const tempPath = await exportCanvasToImage(params.canvas, params.pageInstance, params.canvasSize, params.quality || 'high')

  // 步骤2：保存到相册（带重试）
  try {
    await saveToAlbum(tempPath)
  } catch (err) {
    // 如果是权限问题，先尝试主动申请权限再保存一次
    if (err.code === 'AUTH_DENY' || (err.errMsg && err.errMsg.includes('auth'))) {
      try {
        await new Promise((resolve, reject) => {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: resolve,
            fail: reject
          })
        })
        // 授权成功，重新保存
        await saveToAlbum(tempPath)
      } catch (authErr) {
        // 授权也失败，抛出原始错误
        throw err
      }
    } else {
      throw err
    }
  }

  return tempPath
}

module.exports = { exportCanvasToImage, saveToAlbum, generateId, exportFlow }
