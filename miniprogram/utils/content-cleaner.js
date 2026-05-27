// utils/content-cleaner.js
// 拾文内容清洗与结构化（正文优先、广告剔除、图片抽离）

const URL_PATTERN = /https?:\/\/[^\s]+/i
const URL_GLOBAL_PATTERN = /https?:\/\/[^\s]+/gi
const RAW_IMAGE_URL_PATTERN = /(https?:\/\/[^\s"'<>]+?\.(?:jpg|jpeg|png|gif|webp|bmp))(?:\?[^\s"'<>]*)?/gi
const MARKDOWN_IMAGE_PATTERN = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/gi
const HTML_IMAGE_PATTERN = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi

const AD_KEYWORDS = [
  '广告', '推广', '赞助', '商务合作', '投放',
  '点击关注', '长按识别', '扫码关注', '关注公众号',
  '阅读原文', '点赞', '在看', '转发', '分享', '打赏', '赞赏',
  '扫码进群', '添加微信', '客服微信', '私信',
  '免责声明', '版权声明', '未经授权', '转载',
  '相关推荐', '推荐阅读', '更多精彩', '往期回顾'
]

const NOISE_LINE_PATTERNS = [
  /^来源[：:]/,
  /^作者[：:]/,
  /^编辑[：:]/,
  /^责任编辑[：:]/,
  /^发布时间[：:]/,
  /^发表于/,
  /^阅读\s*\d+/,
  /^点赞\s*\d+/,
  /^本文/, 
  /^原标题[：:]/,
  /^http[s]?:\/\//i,
  /^微信号[：:]/,
  /^公众号[：:]/
]

const SECTION_CUT_PATTERNS = [
  /^推荐阅读[：:]?/,
  /^相关阅读[：:]?/,
  /^更多精彩[：:]?/,
  /^往期回顾[：:]?/,
  /^延伸阅读[：:]?/,
  /^你可能还想看[：:]?/,
  /^本文完[。！!]?$/,
  /^-{3,}$/,
  /^\*{3,}$/
]

function isUrl(str) {
  return /^https?:\/\/[^\s]+$/i.test((str || '').trim())
}

function extractFirstUrl(input) {
  const match = String(input || '').match(URL_PATTERN)
  return match ? match[0] : ''
}

function cleanContent(rawInput) {
  const text = normalizeInput(rawInput)
  if (!text) return { type: 'text' }

  if (isUrl(text)) {
    return { type: 'url', url: text }
  }

  const url = extractFirstUrl(text)
  if (url) {
    const noUrlText = text.replace(URL_GLOBAL_PATTERN, '').trim()
    // 只要正文文本非常短，优先按网址抓取
    if (noUrlText.length <= 40) {
      return { type: 'url', url }
    }
  }

  return { type: 'text' }
}

function cleanText(rawText) {
  let text = normalizeInput(rawText)

  const images = extractImagesFromText(text)
  text = stripHtmlAndImageTokens(text)

  const lines = text
    .split('\n')
    .map(normalizeLine)
    .filter(Boolean)

  // 先按行去噪
  const denoisedLines = lines.filter((line) => !isNoiseLine(line))

  // 合并为段落（空行已在 normalize 中压缩，按句长进行智能合并）
  const paragraphs = buildParagraphs(denoisedLines)

  // 广告与尾部推荐区清洗
  const { cleanedParagraphs, removedAds } = filterParagraphs(paragraphs)

  // 标题提取
  const { title, bodyParagraphs } = extractTitleAndBody(cleanedParagraphs)

  // 结构化
  const blocks = []
  if (title) blocks.push({ type: 'h1', text: title })

  const textBlocks = bodyParagraphs
    .map((p) => ({ type: 'p', text: p }))
    .filter((b) => b.text && b.text.length >= 2)

  const mergedBlocks = mergeShortParagraphBlocks(textBlocks)

  // 图片插入：按数量均匀分布到段落之间，避免全挤在开头/末尾
  const contentBlocks = injectImagesBetweenBlocks(mergedBlocks, images)
  blocks.push(...contentBlocks)

  const textOnly = blocksToText(blocks)

  return {
    type: 'text',
    blocks,
    title,
    wordCount: textOnly.replace(/\s+/g, '').length,
    removedAds,
    images
  }
}

function normalizeInput(raw) {
  return String(raw || '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function stripHtmlAndImageTokens(text) {
  let out = String(text || '')
  out = out.replace(/<script[\s\S]*?<\/script>/gi, '\n')
  out = out.replace(/<style[\s\S]*?<\/style>/gi, '\n')
  out = out.replace(/<!--([\s\S]*?)-->/g, '\n')
  out = out.replace(HTML_IMAGE_PATTERN, '\n')
  out = out.replace(MARKDOWN_IMAGE_PATTERN, '\n')
  out = out.replace(/<\s*br\s*\/?>/gi, '\n')
  out = out.replace(/<\/(p|div|h[1-6]|li|section|article)>/gi, '\n')
  out = out.replace(/<(p|div|h[1-6]|li|section|article)[^>]*>/gi, '')
  out = out.replace(/<[^>]+>/g, '')
  out = out.replace(RAW_IMAGE_URL_PATTERN, '\n')
  out = out.replace(/\n{3,}/g, '\n\n')
  return out
}

function normalizeLine(line) {
  return String(line || '')
    .replace(/\s+/g, ' ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim()
}

function isNoiseLine(line) {
  if (!line) return true
  if (line.length === 1 && /[，。！？、；：,.!?;:'"“”‘’（）()【】\-—]/.test(line)) return true

  for (const p of NOISE_LINE_PATTERNS) {
    if (p.test(line)) return true
  }

  // 纯链接行
  if (/^https?:\/\//i.test(line)) return true

  // 有效字符过少
  const meaningful = line.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '')
  if (meaningful.length <= 1 && line.length <= 8) return true

  return false
}

function buildParagraphs(lines) {
  const paragraphs = []
  let buf = ''

  for (const line of lines) {
    const isLikelyStandalone = line.length >= 28 || /[。！？!?；;]$/.test(line)

    if (!buf) {
      buf = line
      if (isLikelyStandalone) {
        paragraphs.push(buf)
        buf = ''
      }
      continue
    }

    // 诗词/短句：保持句读边界
    const canAppend = !/[。！？!?；;]$/.test(buf) && line.length <= 22

    if (canAppend) {
      buf = `${buf}${line}`
    } else {
      paragraphs.push(buf)
      buf = line
      if (isLikelyStandalone) {
        paragraphs.push(buf)
        buf = ''
      }
    }
  }

  if (buf) paragraphs.push(buf)

  return paragraphs.map((p) => p.trim()).filter(Boolean)
}

function filterParagraphs(paragraphs) {
  const kept = []
  const removedAds = []

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i]

    if (shouldCutFromHere(p) && i >= Math.max(2, Math.floor(paragraphs.length * 0.4))) {
      const tail = paragraphs.slice(i)
      const summary = tail.join(' ').slice(0, 80)
      removedAds.push(summary + (tail.join(' ').length > 80 ? '...' : ''))
      break
    }

    if (isAdParagraph(p, i, paragraphs.length)) {
      removedAds.push(p.slice(0, 80) + (p.length > 80 ? '...' : ''))
      continue
    }

    kept.push(p)
  }

  return { cleanedParagraphs: kept, removedAds }
}

function shouldCutFromHere(paragraph) {
  return SECTION_CUT_PATTERNS.some((p) => p.test(paragraph))
}

function isAdParagraph(paragraph, index, total) {
  const lower = paragraph.toLowerCase()
  let hit = 0
  for (const k of AD_KEYWORDS) {
    if (lower.includes(k.toLowerCase())) hit++
  }

  const atTail = index >= Math.floor(total * 0.5)
  const veryLinky = (paragraph.match(/https?:\/\//g) || []).length >= 1
  const socialCTA = /关注|点赞|在看|转发|分享|扫码|添加微信|阅读原文/.test(paragraph)

  if (hit >= 2 && atTail) return true
  if (veryLinky && atTail) return true
  if (socialCTA && atTail) return true

  return false
}

function extractTitleAndBody(paragraphs) {
  if (!paragraphs.length) return { title: '', bodyParagraphs: [] }

  const first = paragraphs[0]
  const second = paragraphs[1] || ''

  const firstLikeTitle = first.length >= 4 && first.length <= 36 && !/[。！？!?]/.test(first)
  const secondLooksBody = second.length >= 12 || /[。！？!?]/.test(second)

  if (firstLikeTitle && secondLooksBody) {
    return { title: first, bodyParagraphs: paragraphs.slice(1) }
  }

  return { title: '', bodyParagraphs: paragraphs }
}

function mergeShortParagraphBlocks(blocks) {
  const merged = []

  for (const block of blocks) {
    if (!merged.length) {
      merged.push(block)
      continue
    }

    const prev = merged[merged.length - 1]
    const shortPrev = prev.type === 'p' && prev.text.length <= 14
    const shortCurr = block.type === 'p' && block.text.length <= 14

    if (shortPrev && shortCurr) {
      prev.text = `${prev.text}\n${block.text}`
    } else {
      merged.push(block)
    }
  }

  return merged
}

function injectImagesBetweenBlocks(textBlocks, images) {
  if (!images || images.length === 0) return textBlocks
  if (!textBlocks || textBlocks.length === 0) {
    return images.map((img) => ({ type: 'img', url: img.url, alt: img.alt || '' }))
  }

  const blocks = [...textBlocks]
  const cleanImages = dedupeImages(images)
  const slots = blocks.length + 1

  cleanImages.forEach((img, idx) => {
    // 均匀分布插图位置，避免集中
    const ratio = (idx + 1) / (cleanImages.length + 1)
    const insertPos = Math.max(1, Math.min(blocks.length, Math.round(ratio * slots)))
    blocks.splice(insertPos, 0, {
      type: 'img',
      url: img.url,
      alt: img.alt || ''
    })
  })

  return blocks
}

function dedupeImages(images) {
  const seen = new Set()
  const out = []

  for (const img of images) {
    const url = (img.url || '').trim()
    if (!url || seen.has(url)) continue
    seen.add(url)

    // 过滤疑似广告/图标
    const lower = url.toLowerCase()
    if (lower.includes('logo') || lower.includes('icon') || lower.includes('avatar')) continue

    out.push({ url, alt: img.alt || '' })
  }

  return out
}

function extractImagesFromText(text) {
  const images = []

  const pushImg = (url, position, alt = '') => {
    if (!url) return
    images.push({ url, position: Math.max(0, position || 0), alt })
  }

  let m
  while ((m = MARKDOWN_IMAGE_PATTERN.exec(text)) !== null) {
    pushImg(m[2], m.index, m[1] || '')
  }
  MARKDOWN_IMAGE_PATTERN.lastIndex = 0

  while ((m = HTML_IMAGE_PATTERN.exec(text)) !== null) {
    const fullTag = m[0]
    const altMatch = fullTag.match(/alt=["']([^"']*)["']/i)
    pushImg(m[1], m.index, altMatch ? altMatch[1] : '')
  }
  HTML_IMAGE_PATTERN.lastIndex = 0

  while ((m = RAW_IMAGE_URL_PATTERN.exec(text)) !== null) {
    pushImg(m[1], m.index, '')
  }
  RAW_IMAGE_URL_PATTERN.lastIndex = 0

  return dedupeImages(images)
}

function blocksToText(blocks) {
  return (blocks || [])
    .filter((b) => b.type === 'h1' || b.type === 'p')
    .map((b) => b.text)
    .join('\n\n')
}

function extractImageBlocks(blocks) {
  return (blocks || []).filter((b) => b.type === 'img')
}

function buildPageSequence(blocks) {
  const pages = []
  let currentTextBlocks = []

  for (const block of blocks || []) {
    if (block.type === 'img') {
      if (currentTextBlocks.length > 0) {
        pages.push({ type: 'text', blocks: [...currentTextBlocks] })
        currentTextBlocks = []
      }
      pages.push({ type: 'image', url: block.url, caption: block.alt || '' })
      continue
    }
    currentTextBlocks.push(block)
  }

  if (currentTextBlocks.length > 0) {
    pages.push({ type: 'text', blocks: [...currentTextBlocks] })
  }

  return pages
}

module.exports = {
  isUrl,
  cleanContent,
  cleanText,
  blocksToText,
  extractImageBlocks,
  buildPageSequence
}
