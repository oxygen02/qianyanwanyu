// utils/poem-service.js
// 诗词数据服务 - 封装云函数调用，支持本地缓存

const CLOUD_FUNCTION_NAME = 'fetchPoems'

// 本地缓存
const cache = new Map()
const CACHE_DURATION = 1000 * 60 * 30 // 30分钟缓存

/**
 * 调用云函数
 */
async function callCloudFunction(action, params = {}) {
  try {
    const res = await wx.cloud.callFunction({
      name: CLOUD_FUNCTION_NAME,
      data: { action, ...params }
    })

    if (res.result && res.result.code === 0) {
      return res.result.data
    }

    throw new Error(res.result?.message || '请求失败')
  } catch (err) {
    console.error(`[poem-service] ${action} 失败:`, err)
    throw err
  }
}

/**
 * 获取缓存key
 */
function getCacheKey(action, params) {
  return `${action}_${JSON.stringify(params)}`
}

/**
 * 设置缓存
 */
function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  })
}

/**
 * 获取缓存
 */
function getCache(key) {
  const cached = cache.get(key)
  if (!cached) return null

  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    cache.delete(key)
    return null
  }

  return cached.data
}

/**
 * 获取诗词列表
 */
async function getList(limit = 20, offset = 0) {
  const cacheKey = getCacheKey('getList', { limit, offset })
  const cached = getCache(cacheKey)
  if (cached) return cached

  const data = await callCloudFunction('getList', { limit, offset })
  setCache(cacheKey, data)
  return data
}

/**
 * 根据ID获取诗词
 */
async function getById(id) {
  const cacheKey = getCacheKey('getById', { id })
  const cached = getCache(cacheKey)
  if (cached) return cached

  const data = await callCloudFunction('getById', { id })
  setCache(cacheKey, data)
  return data
}

/**
 * 按分类获取诗词
 */
async function getByCategory(category, limit = 20, offset = 0) {
  const cacheKey = getCacheKey('getByCategory', { category, limit, offset })
  const cached = getCache(cacheKey)
  if (cached) return cached

  const data = await callCloudFunction('getByCategory', { category, limit, offset })
  setCache(cacheKey, data)
  return data
}

/**
 * 搜索诗词
 */
async function search(keyword, limit = 20, offset = 0) {
  // 搜索不缓存，保证实时性
  return await callCloudFunction('search', { keyword, limit, offset })
}

/**
 * 随机获取一首诗词
 */
async function getRandom() {
  return await callCloudFunction('getRandom')
}

/**
 * 获取分类列表
 */
function getCategories() {
  return [
    { id: 'all', name: '全部' },
    { id: 'tangshi', name: '唐诗' },
    { id: 'songci', name: '宋词' },
    { id: 'mingju', name: '名句' },
    { id: 'jingdian', name: '经典' },
    { id: 'duilian', name: '对联' }
  ]
}

/**
 * 清空缓存
 */
function clearCache() {
  cache.clear()
}

module.exports = {
  getList,
  getById,
  getByCategory,
  search,
  getRandom,
  getCategories,
  clearCache
}
