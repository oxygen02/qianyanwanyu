// cloud/functions/fetchArticle/index.js
// 文章抓取云函数 - 从URL提取正文和图片

const cloud = require('wx-server-sdk')

// 云函数初始化
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 用户代理池
const USER_AGENTS = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
]

/**
 * 主入口
 */
exports.main = async (event, context) => {
  const { url } = event

  // 参数校验
  if (!url || typeof url !== 'string') {
    return { code: -1, message: '缺少URL参数' }
  }

  if (!/^https?:\/\//.test(url)) {
    return { code: -1, message: '无效的URL格式' }
  }

  try {
    // 1. 获取网页HTML
    const html = await fetchHtml(url)

    if (!html || html.length < 100) {
      return { code: -2, message: '网页内容为空或无法访问' }
    }

    // 2. 提取文章正文
    const article = extractArticle(html, url)

    if (!article || article.textLength < 50) {
      return { code: -3, message: '未能提取到有效正文内容' }
    }

    // 3. 提取图片
    const images = extractImages(html, url, article.contentHtml)

    return {
      code: 0,
      message: 'success',
      data: {
        title: article.title,
        author: article.author || '',
        publishTime: article.publishTime || '',
        source: url,
        textContent: article.textContent,
        content: article.content,
        images: images,
        wordCount: article.textLength
      }
    }

  } catch (err) {
    console.error('[fetchArticle] 抓取失败:', err)
    return {
      code: -9,
      message: '文章抓取失败: ' + (err.message || '未知错误')
    }
  }
}

/**
 * 获取网页HTML内容
 */
async function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const https = require('https')
    const http = require('http')
    const client = url.startsWith('https') ? https : http

    const urlObj = new URL(url)

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'identity',
        'Connection': 'close'
      },
      timeout: 15000
    }

    const req = client.request(options, (res) => {
      // 处理重定向
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = resolveUrl(res.headers.location, url)
        fetchHtml(redirectUrl).then(resolve).catch(reject)
        return
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }

      // 处理编码
      const contentType = res.headers['content-type'] || ''
      let charset = 'utf-8'
      const charsetMatch = contentType.match(/charset=([^;]+)/i)
      if (charsetMatch) {
        charset = charsetMatch[1].trim().toLowerCase()
      }

      let data = []
      res.on('data', chunk => data.push(chunk))
      res.on('end', () => {
        const buffer = Buffer.concat(data)

        // 如果charset不是utf-8，尝试转换
        let html = buffer.toString('utf-8')

        // 从meta标签检测charset
        const metaCharsetMatch = html.match(/<meta[^>]*charset=["']?([^"'>\s]+)/i)
        if (metaCharsetMatch) {
          const metaCharset = metaCharsetMatch[1].toLowerCase()
          if (metaCharset !== 'utf-8' && metaCharset !== 'utf8') {
            try {
              const iconv = require('iconv-lite')
              html = iconv.decode(buffer, metaCharset)
            } catch (e) {
              // 忽略编码转换错误，使用原始utf-8
            }
          }
        }

        resolve(html)
      })
    })

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('请求超时'))
    })

    req.end()
  })
}

/**
 * 提取文章正文（基于文本密度的算法）
 */
function extractArticle(html, baseUrl) {
  // 预处理：移除script/style等标签
  let cleanHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')

  // 提取标题
  const title = extractTitle(cleanHtml, baseUrl)

  // 提取作者
  const author = extractAuthor(cleanHtml)

  // 提取发布时间
  const publishTime = extractPublishTime(cleanHtml)

  // 使用文本密度算法提取正文
  const content = extractByTextDensity(cleanHtml)

  // 转换为结构化数据
  const rawBlocks = htmlToBlocks(content.html, baseUrl)
  const blocks = cleanExtractedBlocks(rawBlocks)

  // 提取纯文本
  const textContent = blocks
    .filter(b => b.type === 'h1' || b.type === 'p')
    .map(b => b.text)
    .join('\n\n')

  return {
    title,
    author,
    publishTime,
    textContent,
    textLength: textContent.length,
    content: blocks,
    contentHtml: content.html
  }
}

/**
 * 基于内容块评分的正文提取算法
 */
function extractByTextDensity(html) {
  const blockPattern = /<(article|main|section|div)[^>]*>([\s\S]*?)<\/\1>/gi
  const candidates = []
  let match

  while ((match = blockPattern.exec(html)) !== null) {
    const full = match[0]
    const inner = match[2] || ''
    const plain = inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (plain.length < 80) continue

    const linkCount = (inner.match(/<a\s/gi) || []).length
    const punctuationCount = (plain.match(/[，。！？；：,.!?;:]/g) || []).length
    const classId = (full.match(/(?:class|id)=['\"]([^'\"]+)['\"]/gi) || []).join(' ').toLowerCase()
    const adLike = /(nav|menu|footer|comment|related|recommend|advert|banner|copyright)/.test(classId)
    const contentLike = /(article|content|post|entry|detail|main)/.test(classId)
    const linkDensity = plain.length > 0 ? linkCount / plain.length : 1

    let score = plain.length * 0.7 + punctuationCount * 10 - linkCount * 5 - linkDensity * 180
    if (contentLike) score += 120
    if (adLike) score -= 200

    candidates.push({ score, html: full, text: plain })
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score)
    const best = candidates[0]
    if (best.score > 60) {
      return { html: best.html, text: best.text }
    }
  }

  // 兜底：按行密度提取
  const lines = html.split('\n')
  let bestStart = 0
  let bestScore = -Infinity
  const win = 8
  for (let i = 0; i < lines.length; i++) {
    const slice = lines.slice(i, i + win).join('\n')
    const plain = slice.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (plain.length < 40) continue
    const linkCount = (slice.match(/<a\s/gi) || []).length
    const punct = (plain.match(/[，。！？；：,.!?;:]/g) || []).length
    const score = plain.length + punct * 8 - linkCount * 10
    if (score > bestScore) {
      bestScore = score
      bestStart = i
    }
  }
  const fallbackLines = lines.slice(bestStart, Math.min(lines.length, bestStart + win * 6))
  return {
    html: fallbackLines.join('\n'),
    text: fallbackLines.map(l => l.replace(/<[^>]+>/g, '')).join('\n')
  }
}

function cleanExtractedBlocks(blocks) {
  const adKeywords = ['广告', '推广', '赞助', '阅读原文', '点赞', '在看', '分享', '扫码', '关注', '推荐阅读', '更多精彩']
  const cutKeywords = ['推荐阅读', '相关阅读', '更多精彩', '往期回顾', '延伸阅读', '免责声明', '版权声明']
  const out = []

  for (let i = 0; i < (blocks || []).length; i++) {
    const b = blocks[i]
    if (!b) continue
    if (b.type === 'img') {
      out.push(b)
      continue
    }

    const text = (b.text || '').replace(/\s+/g, ' ').trim()
    if (!text) continue
    if (text.length < 2) continue

    if (cutKeywords.some((k) => text.includes(k))) break
    if (adKeywords.filter((k) => text.includes(k)).length >= 2) continue
    if (/^https?:\/\//i.test(text)) continue
    if (/^(来源|作者|编辑|责任编辑|发布时间)[：:]/.test(text)) continue

    out.push({ ...b, text })
  }

  return out
}

/**
 * 将HTML转换为结构化块
 */
function htmlToBlocks(html, baseUrl) {
  const blocks = []

  // 简单的标签解析（不依赖cheerio，减少依赖）
  // 匹配p, div, h1-h6, img标签
  const tagPattern = /<(p|div|h[1-6]|img)([^>]*)>([\s\S]*?)<\/\1>|<(img)([^>]*)\/?>/gi

  let match
  while ((match = tagPattern.exec(html)) !== null) {
    const tag = match[1] || match[4]
    const attrs = match[2] || match[5] || ''
    const content = match[3] || ''

    if (tag === 'img') {
      const srcMatch = attrs.match(/src=["']([^"']+)["']/i)
      if (srcMatch) {
        const resolvedUrl = resolveUrl(srcMatch[1], baseUrl)
        blocks.push({
          type: 'img',
          url: resolvedUrl
        })
      }
    } else {
      // 去除内部标签，获取纯文本
      const text = content.replace(/<[^>]+>/g, '').trim()
      if (text.length > 0) {
        if (tag.match(/^h[1-6]$/)) {
          blocks.push({ type: 'h1', text })
        } else {
          blocks.push({ type: 'p', text })
        }
      }
    }
  }

  // 如果没有解析到任何块，将整个文本作为一个段落
  if (blocks.length === 0) {
    const plainText = html.replace(/<[^>]+>/g, '').trim()
    if (plainText.length > 0) {
      blocks.push({ type: 'p', text: plainText })
    }
  }

  return blocks
}

/**
 * 提取图片
 */
function extractImages(html, baseUrl, contentHtml) {
  const images = []
  const seenUrls = new Set()

  // 从整个HTML中提取图片
  const imgPattern = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi
  let match

  while ((match = imgPattern.exec(html)) !== null) {
    let src = match[1]
    if (!src || src.startsWith('data:')) continue

    src = resolveUrl(src, baseUrl)

    // 去重
    if (seenUrls.has(src)) continue
    seenUrls.add(src)

    // 提取图片尺寸
    const imgTag = match[0]
    const widthMatch = imgTag.match(/width=["']?(\d+)/i)
    const heightMatch = imgTag.match(/height=["']?(\d+)/i)
    const altMatch = imgTag.match(/alt=["']([^"']*)["']/i)

    const width = widthMatch ? parseInt(widthMatch[1]) : 0
    const height = heightMatch ? parseInt(heightMatch[1]) : 0

    // 过滤条件
    if (width > 0 && width < 80) continue
    if (height > 0 && height < 80) continue

    // 跳过广告相关
    const lowerSrc = src.toLowerCase()
    if (lowerSrc.includes('ad.') || lowerSrc.includes('ads.') ||
        lowerSrc.includes('banner') || lowerSrc.includes('logo') ||
        lowerSrc.includes('icon')) continue

    // 判断图片是否在正文区域
    const isInArticle = contentHtml && contentHtml.includes(match[0])

    images.push({
      url: src,
      alt: altMatch ? altMatch[1] : '',
      width,
      height,
      isInArticle
    })
  }

  return images
}

/**
 * 提取标题
 */
function extractTitle(html, url) {
  // 尝试多种方式提取标题
  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i)
  if (ogTitle && ogTitle[1]) return ogTitle[1].trim()

  const twitterTitle = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']*)["']/i)
  if (twitterTitle && twitterTitle[1]) return twitterTitle[1].trim()

  const h1Title = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  if (h1Title) {
    const text = h1Title[1].replace(/<[^>]+>/g, '').trim()
    if (text.length > 0) return text
  }

  const titleTag = html.match(/<title>([\s\S]*?)<\/title>/i)
  if (titleTag) {
    const text = titleTag[1].trim()
    // 去除常见的网站后缀
    return text.replace(/[\-_\|].*$/, '').trim()
  }

  return '未命名文章'
}

/**
 * 提取作者
 */
function extractAuthor(html) {
  const patterns = [
    /<meta[^>]*name=["']author["'][^>]*content=["']([^"']*)["']/i,
    /<span[^>]*class=["'][^"']*author[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
    /<a[^>]*class=["'][^"']*author[^"']*["'][^>]*>([\s\S]*?)<\/a>/i,
    /作者[：:]\s*([^\n<]+)/i
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      const text = match[1].replace(/<[^>]+>/g, '').trim()
      if (text.length > 0 && text.length < 50) return text
    }
  }

  return ''
}

/**
 * 提取发布时间
 */
function extractPublishTime(html) {
  const patterns = [
    /<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']*)["']/i,
    /<meta[^>]*name=["']publishdate["'][^>]*content=["']([^"']*)["']/i,
    /<time[^>]*datetime=["']([^"']*)["']/i,
    /(\d{4}[年/-]\d{1,2}[月/-]\d{1,2}[日]?)/
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return ''
}

/**
 * 解析相对URL为绝对URL
 */
function resolveUrl(url, base) {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('//')) return 'https:' + url

  try {
    const baseObj = new URL(base)
    if (url.startsWith('/')) {
      return baseObj.origin + url
    }
    const basePath = baseObj.pathname.replace(/\/[^\/]*$/, '/')
    return baseObj.origin + basePath + url
  } catch (e) {
    return url
  }
}
