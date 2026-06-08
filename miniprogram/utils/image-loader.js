// utils/image-loader.js
// 图片背景加载器 - 从云存储 fileID 获取临时链接并加载为 Canvas Image

// 临时链接缓存：{ fileID: { url: string, timestamp: number } }
const _tempUrls = {}
const TEMP_URL_MAX_AGE = 2 * 60 * 60 * 1000

/**
 * 获取图片的临时下载链接
 * @param {string} fileID
 * @returns {Promise<string>}
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
          // 诊断：打印完整的返回结果以便排查
          const diag = JSON.stringify({
            fileID,
            status: file ? file.status : 'NO_FILE',
            errMsg: file ? file.errMsg : 'null'
          }).slice(0, 200)
          console.warn('[image-loader] 获取图片临时链接失败, 诊断:', diag)
          reject(new Error('获取图片临时链接失败: ' + (file && file.errMsg) || 'tempFileURL为空'))
        }
      },
      fail: (err) => {
        console.error('[image-loader] getTempFileURL 失败:', fileID, err)
        reject(err)
      }
    })
  })
}

/**
 * 获取图片加载 URL（带缓存）
 * @param {string} fileID
 * @returns {Promise<string>}
 */
async function resolveImageURL(fileID) {
  const cached = _tempUrls[fileID]
  const now = Date.now()
  if (cached && (now - cached.timestamp) < TEMP_URL_MAX_AGE) {
    return cached.url
  }
  const url = await getTempFileURL(fileID)
  _tempUrls[fileID] = { url, timestamp: now }
  return url
}

/**
 * 加载图片为 Canvas Image 对象
 * @param {string} url
 * @returns {Promise<Image>}
 */
function loadCanvasImage(url) {
  return new Promise((resolve, reject) => {
    const img = wx.createOffscreenCanvas({ type: '2d', width: 1, height: 1 }).createImage()
    img.onload = () => resolve(img)
    img.onerror = (err) => reject(err)
    img.src = url
  })
}

/**
 * 从 fileID 加载图片（完整流程）
 * @param {string} fileID
 * @returns {Promise<Image>}
 */
async function loadImageFromFileID(fileID) {
  const url = await resolveImageURL(fileID)
  return loadCanvasImage(url)
}

/**
 * 预加载多张背景图
 * @param {string[]} fileIDs
 */
function preloadImages(fileIDs) {
  return Promise.allSettled(fileIDs.map(id => loadImageFromFileID(id)))
}

module.exports = {
  getTempFileURL,
  resolveImageURL,
  loadCanvasImage,
  loadImageFromFileID,
  preloadImages
}
