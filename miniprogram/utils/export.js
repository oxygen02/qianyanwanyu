// utils/export.js
// 图片导出工具

function exportCanvasToImage(canvas, pageInstance, canvasSize, quality) {
  const scale = quality === 'ultra' ? 3 : quality === 'standard' ? 1 : 2
  return new Promise((resolve, reject) => {
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
      success: (res) => { resolve(res.tempFilePath) },
      fail: (err) => { console.error('[export] canvasToTempFilePath 失败', err); reject(err) }
    }, pageInstance)
  })
}

function saveToAlbum(tempFilePath) {
  return new Promise((resolve, reject) => {
    wx.saveImageToPhotosAlbum({
      filePath: tempFilePath,
      success: () => { resolve() },
      fail: (err) => {
        if (err.errMsg && err.errMsg.includes('auth deny')) {
          reject({ code: 'AUTH_DENY', message: '需要相册权限才能保存图片' })
        } else { reject(err) }
      }
    })
  })
}

function generateId() {
  return 'qy_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

async function exportFlow(params) {
  const tempPath = await exportCanvasToImage(params.canvas, params.pageInstance, params.canvasSize, params.quality || 'high')
  await saveToAlbum(tempPath)
  return tempPath
}

module.exports = { exportCanvasToImage, saveToAlbum, generateId, exportFlow }
