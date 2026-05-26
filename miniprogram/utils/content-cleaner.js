// utils/content-cleaner.js
// 智能内容清洗与结构化 - 拾文功能核心

/**
 * 广告/推广内容识别模式
 * 按优先级排序，越具体的模式越靠前
 */
const AD_PATTERNS = [
  // 微信公众号推广（高置信度）
  /[\s\S]*?(点击关注|长按识别|扫码关注|关注公众号|关注.+公众号|↓点击|阅读原文)[\s\S]*$/i,
  // 二维码/图片推广
  /[\s\S]*?(二维码|QR码|qrcode|扫码进群|添加微信|客服微信)[\s\S]*$/i,
  // 社交互动推广
  /[\s\S]*?(欢迎转发|转发给朋友|分享到朋友圈|点赞|在看|收藏|分享|赞赏|打赏)[\s\S]*$/i,
  // 广告标记
  /[\s\S]*?(广告|推广|赞助商|SPONSORED|ADVERTISEMENT)[\s\S]*$/i,
  // 版权/声明尾部
  /[\s\S]*?(版权声明|版权所有|未经授权|转载声明|免责声明|法律顾问)[\s\S]*$/i,
  // 社群引流
  /[\s\S]*?(关注我们|加入社群|扫码进群|添加微信|客服微信|免费咨询)[\s\S]*$/i,
  // 推荐阅读/更多内容
  /[\s\S]*?(更多精彩|推荐阅读|相关阅读|延伸阅读|往期回顾)[\s\S]*$/i
]

/**
 * 图片URL匹配模式
 */
const IMAGE_URL_PATTERN = /(https?:\/\/[^\s"'<>]+?\.(?:jpg|jpeg|png|gif|webp|bmp))(?:\?[^\s"'<>]*)?/gi

/**
 * 判断是否为URL
 */
function isUrl(str) {
  return /^https?:\/\/[^\s]+/.test(str.trim())
}

/**
 * 主入口：清洗原始输入
 * @param {string} rawInput - 用户粘贴的内容
 * @returns {{type: 'url'|'text', url?: string, blocks?: Array}}
 */
function cleanContent(rawInput) {
  const trimmed = rawInput.trim()

  if (isUrl(trimmed)) {
    return { type: 'url', url: trimmed }
  }

  return cleanText(trimmed)
}

/**
 * 文本清洗与结构化
 * @param {string} rawText
 * @returns {{type: 'text', blocks: Array, title: string, wordCount: number, removedAds: Array}}
 */
function cleanText(rawText) {
  let text = rawText.trim()

  // 1. 提取图片URL（在清洗前提取，避免误删）
  const images = extractImagesFromText(text)

  // 2. 去除HTML标签（如果有）
  text = text.replace(/<[^>]+>/g, '\n')

  // 3. 合并多余空行（超过2个换行合并为2个）
  text = text.replace(/\n{3,}/g, '\n\n')

  // 4. 去除行首行尾空格
  text = text.split('\n').map(line => line.trim()).join('\n')

  // 5. 识别并去除广告
  const { cleanedText, removedAds } = removeAds(text)

  // 6. 结构化分块
  const blocks = structureContent(cleanedText, images)

  // 7. 提取标题
  const titleBlock = blocks.find(b => b.type === 'h1')

  return {
    type: 'text',
    blocks,
    title: titleBlock ? titleBlock.text : '',
    wordCount: cleanedText.length,
    removedAds,
    images
  }
}

/**
 * 从文本中提取图片URL
 * @param {string} text
 * @returns {Array<{url: string, position: number}>}
 */
function extractImagesFromText(text) {
  const matches = []
  let match

  while ((match = IMAGE_URL_PATTERN.exec(text)) !== null) {
    matches.push({
      url: match[1],
      position: match.index
    })
  }

  // 重置正则lastIndex
  IMAGE_URL_PATTERN.lastIndex = 0

  return matches
}

/**
 * 广告识别与去除
 * @param {string} text
 * @returns {{cleanedText: string, removedAds: Array<string>}}
 */
function removeAds(text) {
  let cleaned = text
  const removedAds = []

  for (const pattern of AD_PATTERNS) {
    const match = cleaned.match(pattern)
    if (match && match.index > cleaned.length * 0.4) {
      // 只去掉后60%才出现的推广内容（避免误删正文）
      const adText = cleaned.slice(match.index)
      // 记录被删除的内容摘要（前50字）
      const summary = adText.replace(/\n/g, ' ').slice(0, 50)
      if (summary.length > 5) {
        removedAds.push(summary + (adText.length > 50 ? '...' : ''))
      }
      cleaned = cleaned.slice(0, match.index).trim()
    }
  }

  // 去除纯符号行（保留空行作为段落分隔）
  cleaned = cleaned.split('\n').filter(line => {
    if (!line.trim()) return true
    const meaningfulChars = line.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '')
    return meaningfulChars.length > 0
  }).join('\n')

  return { cleanedText: cleaned, removedAds }
}

/**
 * 内容结构化分块
 * @param {string} text
 * @param {Array} images
 * @returns {Array<{type: 'h1'|'p'|'img', text?: string, url?: string}>}
 */
function structureContent(text, images) {
  const blocks = []
  const lines = text.split('\n')
  let currentPara = []
  let isFirstLine = true
  let titleFound = false
  let currentPos = 0

  // 记录每行在原文中的位置
  const linePositions = []
  let pos = 0
  for (const line of lines) {
    linePositions.push(pos)
    pos += line.length + 1 // +1 for \n
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    currentPos = linePositions[i]

    if (!line) {
      // 空行：段落结束
      if (currentPara.length > 0) {
        blocks.push({
          type: 'p',
          text: currentPara.join('\n')
        })
        currentPara = []
      }
      continue
    }

    // 标题识别规则
    const isTitle = isFirstLine && line.length < 60 && line.length > 0 && !titleFound
    const isMarkdownHeader = line.startsWith('#')
    const isBracketTitle = line.startsWith('【') && line.endsWith('】') && line.length < 40

    if (isTitle || isMarkdownHeader || isBracketTitle) {
      // 先结束当前段落
      if (currentPara.length > 0) {
        blocks.push({ type: 'p', text: currentPara.join('\n') })
        currentPara = []
      }

      const titleText = line.replace(/^#+\s*/, '').replace(/[【】]/g, '')
      blocks.push({ type: 'h1', text: titleText })
      titleFound = true
      isFirstLine = false
      continue
    }

    isFirstLine = false
    currentPara.push(line)
  }

  // 处理最后一段
  if (currentPara.length > 0) {
    blocks.push({ type: 'p', text: currentPara.join('\n') })
  }

  // 插入图片块（按位置排序）
  const sortedImages = [...images].sort((a, b) => a.position - b.position)
  for (const img of sortedImages) {
    const insertIndex = findInsertIndex(blocks, img.position, text)
    blocks.splice(insertIndex, 0, {
      type: 'img',
      url: img.url
    })
  }

  return blocks
}

/**
 * 根据图片在原文中的位置，找到合适的插入点
 */
function findInsertIndex(blocks, position, originalText) {
  let currentPos = 0

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    if (block.text) {
      currentPos += block.text.length + 2 // +2 for \n\n
    }
    if (currentPos >= position) {
      return i + 1
    }
  }

  return blocks.length
}

/**
 * 将结构化内容块转换为纯文本（用于排版引擎）
 * @param {Array} blocks
 * @returns {string}
 */
function blocksToText(blocks) {
  return blocks
    .filter(b => b.type === 'h1' || b.type === 'p')
    .map(b => b.text)
    .join('\n\n')
}

/**
 * 提取图片块
 * @param {Array} blocks
 * @returns {Array}
 */
function extractImageBlocks(blocks) {
  return blocks.filter(b => b.type === 'img')
}

/**
 * 构建页面序列（文字页和图片页交错）
 * @param {Array} blocks
 * @returns {Array<{type: 'text'|'image', blocks?: Array, url?: string, caption?: string}>}
 */
function buildPageSequence(blocks) {
  const pages = []
  let currentTextBlocks = []

  for (const block of blocks) {
    if (block.type === 'img') {
      // 先输出累积的文字页
      if (currentTextBlocks.length > 0) {
        pages.push({
          type: 'text',
          blocks: [...currentTextBlocks]
        })
        currentTextBlocks = []
      }
      // 图片单独一页
      pages.push({
        type: 'image',
        url: block.url,
        caption: block.alt || ''
      })
    } else {
      currentTextBlocks.push(block)
    }
  }

  // 最后一批文字
  if (currentTextBlocks.length > 0) {
    pages.push({
      type: 'text',
      blocks: [...currentTextBlocks]
    })
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
