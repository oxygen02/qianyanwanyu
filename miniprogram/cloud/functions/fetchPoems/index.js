// cloud/functions/fetchPoems/index.js
// 诗词数据云函数 - 从云数据库获取诗词内容

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const MAX_LIMIT = 100

/**
 * 主入口
 * @param {Object} event - 调用参数
 *   - action: 'getList' | 'getById' | 'getByCategory' | 'search' | 'getRandom'
 *   - id: 诗词ID (getById时使用)
 *   - category: 分类ID (getByCategory时使用)
 *   - keyword: 搜索关键词 (search时使用)
 *   - limit: 返回数量限制
 *   - offset: 偏移量
 */
exports.main = async (event, context) => {
  const { action = 'getList', id, category, keyword, limit = 20, offset = 0 } = event

  try {
    switch (action) {
      case 'getById':
        return await getById(id)
      case 'getByCategory':
        return await getByCategory(category, limit, offset)
      case 'search':
        return await searchPoems(keyword, limit, offset)
      case 'getRandom':
        return await getRandomPoem()
      case 'getList':
      default:
        return await getList(limit, offset)
    }
  } catch (err) {
    console.error('[fetchPoems] 错误:', err)
    return {
      code: -1,
      message: '获取诗词失败: ' + (err.message || '未知错误'),
      data: null
    }
  }
}

/**
 * 根据ID获取单首诗词
 */
async function getById(id) {
  if (!id) {
    return { code: -1, message: '缺少诗词ID', data: null }
  }

  const res = await db.collection('poems').doc(id).get()

  if (!res.data) {
    return { code: -1, message: '诗词未找到', data: null }
  }

  return {
    code: 0,
    message: 'success',
    data: formatPoem(res.data)
  }
}

/**
 * 获取诗词列表
 */
async function getList(limit, offset) {
  const countRes = await db.collection('poems').count()
  const total = countRes.total

  const res = await db.collection('poems')
    .orderBy('popularity', 'desc')
    .skip(offset)
    .limit(Math.min(limit, MAX_LIMIT))
    .get()

  return {
    code: 0,
    message: 'success',
    data: {
      list: res.data.map(formatPoem),
      total,
      hasMore: offset + res.data.length < total
    }
  }
}

/**
 * 按分类获取诗词
 */
async function getByCategory(category, limit, offset) {
  const countRes = await db.collection('poems')
    .where({ category })
    .count()
  const total = countRes.total

  const res = await db.collection('poems')
    .where({ category })
    .orderBy('popularity', 'desc')
    .skip(offset)
    .limit(Math.min(limit, MAX_LIMIT))
    .get()

  return {
    code: 0,
    message: 'success',
    data: {
      list: res.data.map(formatPoem),
      total,
      hasMore: offset + res.data.length < total
    }
  }
}

/**
 * 搜索诗词
 */
async function searchPoems(keyword, limit, offset) {
  if (!keyword || keyword.trim() === '') {
    return await getList(limit, offset)
  }

  const kw = keyword.trim()

  // 使用正则进行模糊搜索
  const res = await db.collection('poems')
    .where(
      db.command.or([
        { title: db.RegExp({ regexp: kw, options: 'i' }) },
        { author: db.RegExp({ regexp: kw, options: 'i' }) },
        { content: db.RegExp({ regexp: kw, options: 'i' }) },
        { tags: db.RegExp({ regexp: kw, options: 'i' }) }
      ])
    )
    .orderBy('popularity', 'desc')
    .skip(offset)
    .limit(Math.min(limit, MAX_LIMIT))
    .get()

  return {
    code: 0,
    message: 'success',
    data: {
      list: res.data.map(formatPoem),
      total: res.data.length,
      hasMore: false
    }
  }
}

/**
 * 随机获取一首诗词
 */
async function getRandomPoem() {
  const countRes = await db.collection('poems').count()
  const total = countRes.total

  if (total === 0) {
    return { code: -1, message: '暂无诗词数据', data: null }
  }

  const randomIndex = Math.floor(Math.random() * total)

  const res = await db.collection('poems')
    .skip(randomIndex)
    .limit(1)
    .get()

  if (res.data.length === 0) {
    return { code: -1, message: '获取失败', data: null }
  }

  return {
    code: 0,
    message: 'success',
    data: formatPoem(res.data[0])
  }
}

/**
 * 格式化诗词数据
 */
function formatPoem(poem) {
  if (!poem) return null

  // 将content转换为lines数组
  const lines = poem.content ? poem.content.split('\n').filter(line => line.trim()) : []

  return {
    ...poem,
    lines
  }
}
