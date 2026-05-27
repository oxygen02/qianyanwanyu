// utils/poem-service.js
// 诗词数据服务 - 优先使用本地数据，云端作为扩展

const { contentDB, getAllTags, getByCategory: getLocalByCategory, search: localSearch } = require('./content-data.js')

const CLOUD_FUNCTION_NAME = 'fetchPoems'

// 本地缓存
const cache = new Map()
const CACHE_DURATION = 1000 * 60 * 30 // 30分钟缓存

// 是否启用云端（需要配置好云开发环境）
let cloudEnabled = false

/**
 * 初始化云开发环境
 */
function initCloud() {
  try {
    if (wx.cloud) {
      wx.cloud.init({
        env: 'your-env-id', // 替换为你的云开发环境ID
        traceUser: true
      })
      cloudEnabled = true
    }
  } catch (err) {
    console.log('[poem-service] 云开发未启用，使用本地数据')
    cloudEnabled = false
  }
}

/**
 * 调用云函数
 */
async function callCloudFunction(action, params = {}) {
  if (!cloudEnabled) {
    throw new Error('云开发未启用')
  }

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
 * 将本地数据格式化为云端格式
 */
function formatLocalData(list, total, offset, limit) {
  return {
    list: list.map(item => ({
      ...item,
      lines: item.content ? item.content.split('\n').filter(line => line.trim()) : [],
      alignClass: getAlignClass(item)
    })),
    total,
    hasMore: offset + list.length < total
  }
}

function getAlignClass(item) {
  if (!item.content) return 'poem-left'
  const lines = item.content.split('\n').filter(line => line.trim())
  if (lines.length < 2) return 'poem-left'
  
  // 计算每行的字数（去除标点）
  const charCounts = lines.map(line => {
    return line.replace(/[，。！？、；：""''（）【】《》]/g, '').trim().length
  })
  
  // 如果所有行字数相同，认为是工整的对仗诗词，居中显示
  const firstCount = charCounts[0]
  const allSame = charCounts.every(count => count === firstCount)
  
  return allSame ? 'poem-center' : 'poem-left'
}

/**
 * 获取诗词列表
 */
async function getList(limit = 20, offset = 0) {
  const cacheKey = getCacheKey('getList', { limit, offset })
  const cached = getCache(cacheKey)
  if (cached) return cached

  // 优先使用本地数据
  const list = contentDB.slice(offset, offset + limit)
  const data = formatLocalData(list, contentDB.length, offset, limit)
  
  // 为列表结果添加 alignClass
  data.list = data.list.map(item => ({
    ...item,
    alignClass: getAlignClass(item)
  }))

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

  // 优先使用本地数据
  const poem = contentDB.find(item => item.id === id)
  if (poem) {
    const data = {
      ...poem,
      lines: poem.content ? poem.content.split('\n').filter(line => line.trim()) : [],
      alignClass: getAlignClass(poem)
    }
    setCache(cacheKey, data)
    return data
  }

  // 本地找不到且云端启用时，尝试云端
  if (cloudEnabled) {
    const data = await callCloudFunction('getById', { id })
    setCache(cacheKey, data)
    return data
  }

  throw new Error('诗词未找到')
}

/**
 * 按分类获取诗词
 */
async function getByCategory(category, limit = 20, offset = 0) {
  const cacheKey = getCacheKey('getByCategory', { category, limit, offset })
  const cached = getCache(cacheKey)
  if (cached) return cached

  // 优先使用本地数据
  const filtered = category === 'all' ? contentDB : contentDB.filter(item => item.category === category)
  const list = filtered.slice(offset, offset + limit)
  const data = formatLocalData(list, filtered.length, offset, limit)
  
  // 为分类结果添加 alignClass
  data.list = data.list.map(item => ({
    ...item,
    alignClass: getAlignClass(item)
  }))

  setCache(cacheKey, data)
  return data
}

/**
 * 搜索诗词
 */
async function searchPoems(keyword, limit = 20, offset = 0) {
  // 搜索不缓存，保证实时性

  // 优先使用本地数据
  if (!keyword || keyword.trim() === '') {
    return getList(limit, offset)
  }

  const kw = keyword.trim().toLowerCase()
  const filtered = contentDB.filter(item =>
    (item.title && item.title.toLowerCase().includes(kw)) ||
    (item.author && item.author.toLowerCase().includes(kw)) ||
    (item.content && item.content.toLowerCase().includes(kw)) ||
    (item.tags && item.tags.some(t => t.toLowerCase().includes(kw)))
  )

  const list = filtered.slice(offset, offset + limit)
  const result = formatLocalData(list, filtered.length, offset, limit)
  
  // 为搜索结果添加 alignClass
  result.list = result.list.map(item => ({
    ...item,
    alignClass: getAlignClass(item)
  }))
  
  return result
}

/**
 * 随机获取一首诗词
 */
async function getRandom() {
  const cacheKey = getCacheKey('getRandom', {})
  const cached = getCache(cacheKey)
  if (cached) return cached

  // 优先使用本地数据
  if (contentDB.length > 0) {
    const randomIndex = Math.floor(Math.random() * contentDB.length)
    const poem = contentDB[randomIndex]
    const data = {
      ...poem,
      lines: poem.content ? poem.content.split('\n').filter(line => line.trim()) : [],
      alignClass: getAlignClass(poem)
    }
    setCache(cacheKey, data)
    return data
  }

  throw new Error('暂无诗词数据')
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

// 初始化
initCloud()

module.exports = {
  getList,
  getById,
  getByCategory,
  search: searchPoems,
  getRandom,
  getCategories,
  clearCache
}
