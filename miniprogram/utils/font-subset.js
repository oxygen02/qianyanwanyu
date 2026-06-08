// utils/font-subset.js
// 字体子集化工具 — 为微信小程序环境优化
// 功能：使用 opentype.js 从已缓存的完整字体中提取用户文字所需的字形，
// 生成小的子集字体文件，供 wx.loadFontFace 快速加载。

const opentype = require('./opentype.min.js')

const FONT_CACHE_DIR = `${wx.env.USER_DATA_PATH}/font_cache`

function getFS() {
  return wx.getFileSystemManager()
}

/**
 * 读取本地缓存中的完整字体文件，返回 ArrayBuffer
 * 自动尝试 .ttf / .otf 扩展名
 */
function readFontFile(fontId) {
  const fs = getFS()
  const extensions = ['.ttf', '.otf', '.ttc']
  return _tryReadFont(fs, fontId, extensions, 0)
}

function _tryReadFont(fs, fontId, exts, i) {
  if (i >= exts.length) return Promise.reject(new Error(`未找到本地字体缓存: ${fontId}`))
  const fp = `${FONT_CACHE_DIR}/${fontId}${exts[i]}`
  return new Promise((resolve, reject) => {
    try {
      fs.accessSync(fp)
      fs.readFile({ filePath: fp, success: (res) => resolve(res.data), fail: reject })
    } catch (_) {
      resolve(_tryReadFont(fs, fontId, exts, i + 1))
    }
  })
}

/**
 * 将 ArrayBuffer 写入本地子集缓存文件
 */
function writeSubsetFile(fontId, arrayBuffer) {
  return new Promise((resolve, reject) => {
    const fs = getFS()
    const filePath = `${FONT_CACHE_DIR}/${fontId}_subset.ttf`
    fs.writeFile({ filePath, data: arrayBuffer, success: () => resolve(filePath), fail: reject })
  })
}

function hasSubsetFont(fontId) {
  try {
    getFS().accessSync(`${FONT_CACHE_DIR}/${fontId}_subset.ttf`)
    return true
  } catch (_) { return false }
}

function getSubsetFontPath(fontId) {
  return `${FONT_CACHE_DIR}/${fontId}_subset.ttf`
}

/**
 * 为指定文字内容创建字体子集
 */
async function createFontSubset(fontId, text) {
  if (!text || text.trim().length === 0) throw new Error('text 为空')

  const uniqueChars = [...new Set(text)].filter(c => c > ' ' && c !== '\u200B')
  if (uniqueChars.length > 2000) throw new Error('chars_limit_exceeded')
  if (uniqueChars.length < 3) throw new Error('chars_too_few')

  try {
    const fontData = await readFontFile(fontId)
    const font = opentype.parse(fontData)

    // 安全获取 familyName：有些 .otf 字体的 familyName 在 names.fontFamily.en 中
    const familyName = font.familyName
      || (font.names && font.names.fontFamily && font.names.fontFamily.en)
      || (font.names && font.names.postScriptName && font.names.postScriptName.en)
      || fontId

    const glyphSet = new Set()
    glyphSet.add(0) // .notdef

    // 保留常用标点
    const puncChars = '，。！？；：、…—·（）【】《》""\'\' '
    for (const ch of puncChars) {
      const idx = font.charToGlyphIndex(ch)
      if (idx > 0) glyphSet.add(idx)
    }
    for (const ch of uniqueChars) {
      const idx = font.charToGlyphIndex(ch)
      if (idx > 0) glyphSet.add(idx)
    }

    const glyphs = [...glyphSet].sort((a, b) => a - b).map(idx => font.glyphs.get(idx) || font.glyphs.get(0))

    const subsetFont = new opentype.Font({
      familyName,
      styleName: font.styleName || 'Regular',
      unitsPerEm: font.unitsPerEm || 1000,
      ascender: font.ascender || 800,
      descender: font.descender || -200,
      glyphs
    })

    const subsetBuffer = subsetFont.toArrayBuffer()
    const filePath = await writeSubsetFile(fontId, subsetBuffer)

    console.log(`[font-subset] 子集创建成功: ${fontId}, ` +
      `字形 ${font.glyphs.length}→${glyphs.length}, ` +
      `大小 ~${(subsetBuffer.byteLength / 1024).toFixed(1)}KB`)

    return filePath
  } catch (err) {
    if (['chars_limit_exceeded', 'chars_too_few'].includes(err.message)) throw err
    console.error('[font-subset] 创建失败:', err.message || err)
    throw err
  }
}

function clearSubset(fontId) {
  try {
    const fs = getFS()
    const path = `${FONT_CACHE_DIR}/${fontId}_subset.ttf`
    fs.accessSync(path)
    fs.unlinkSync(path)
    return true
  } catch (_) { return false }
}

async function loadOrCreateSubset(fontId, text) {
  if (hasSubsetFont(fontId)) return getSubsetFontPath(fontId)
  return await createFontSubset(fontId, text)
}

module.exports = {
  createFontSubset,
  loadOrCreateSubset,
  hasSubsetFont,
  getSubsetFontPath,
  clearSubset
}
