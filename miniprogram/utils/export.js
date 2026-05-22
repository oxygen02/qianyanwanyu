// utils/export.js
// 图片导出工具

/**
 * 将 Canvas 内容导出为图片并保存到相册
 * @param {CanvasContext} canvas - Canvas 2D context
 * @param {string} canvasId - Canvas 组件ID
 * @param {object} pageInstance - 页面实例（this）
 * @param {{ width: number, height: number }} canvasSize
 * @returns {Promise<string>} - 导出图片的临时路径
 */
function exportCanvasToImage(canvas, pageInstance, canvasSize) {
  return new Promise((resolve, reject) => {
    wx.canvasToTempFilePath({
      canvas,
      x: 0,
      y: 0,
      width: canvasSize.width,
      height: canvasSize.height,
      destWidth: canvasSize.width * 2,
      destHeight: canvasSize.height * 2,
      fileType: 'jpg',
      quality: 0.95,
      success: (res) => {
        resolve(res.tempFilePath)
      },
      fail: (err) => {
        console.error('[export] canvasToTempFilePath 失败', err)
        reject(err)
      }
    }, pageInstance)
  })
}

/**
 * 保存图片到相册（带权限申请）
 * @param {string} tempFilePath
 * @returns {Promise<void>}
 */
function saveToAlbum(tempFilePath) {
  return new Promise((resolve, reject) => {
    wx.saveImageToPhotosAlbum({
      filePath: tempFilePath,
      success: () => {
        resolve()
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.includes('auth deny')) {
          // 引导用户开启权限
          reject({ code: 'AUTH_DENY', message: '需要相册权限才能保存图片' })
        } else {
          reject(err)
        }
      }
    })
  })
}

/**
 * 生成唯一ID（用于历史记录）
 * @returns {string}
 */
function generateId() {
  return `qy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * 完整导出流程：Canvas -> 临时文件 -> 保存相册
 * @param {object} params
 * @param {CanvasContext} params.canvas
 * @param {object} params.pageInstance
 * @param {{ width: number, height: number }} params.canvasSize
 * @returns {Promise<string>} 临时路径
 */
async function exportFlow(params) {
  const tempPath = await exportCanvasToImage(
    params.canvas,
    params.pageInstance,
    params.canvasSize
  )
  await saveToAlbum(tempPath)
  return tempPath
}

module.exports = {
  exportCanvasToImage,
  saveToAlbum,
  generateId,
  exportFlow
}

