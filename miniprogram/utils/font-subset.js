const opentype = require('./opentype.min.js')

const FONT_CACHE_DIR = `${wx.env.USER_DATA_PATH}/font_cache`

function getFS() {
  return wx.getFileSystemManager()
}

function ensureCacheDir() {
  return new Promise((resolve) => {
    const fs = getFS()
    try {
      fs.accessSync(FONT_CACHE_DIR)
    } catch (e) {
      fs.mkdirSync(FONT_CACHE_DIR, true)
    }
    resolve()
  })
}

async function readFontFromLocal(fontId) {
  return new Promise((resolve, reject) => {
    const fs = getFS()
    const filePath = `${FONT_CACHE_DIR}/${fontId}.ttf`
    fs.readFile({
      filePath: filePath,
      encoding: 'binary',
      success: (res) => {
        const buffer = Buffer.from(res.data, 'binary')
        resolve(buffer)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

async function writeFontToLocal(fontId, fontBuffer) {
  return new Promise((resolve, reject) => {
    const fs = getFS()
    const filePath = `${FONT_CACHE_DIR}/${fontId}_subset.ttf`
    fs.writeFile({
      filePath: filePath,
      data: fontBuffer,
      encoding: 'binary',
      success: () => {
        resolve(filePath)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

async function createFontSubset(fontId, text) {
  try {
    const fontBuffer = await readFontFromLocal(fontId)
    
    const font = opentype.parse(fontBuffer)
    
    const uniqueChars = [...new Set(text)].filter(c => c !== '\n' && c !== '\r')
    
    const subsetFont = new opentype.Font({
      familyName: font.familyName + ' Subset',
      styleName: font.styleName,
      unitsPerEm: font.unitsPerEm,
      ascender: font.ascender,
      descender: font.descender,
      glyphs: []
    })
    
    subsetFont.glyphs.push(font.glyphs.get(0))
    
    const missingGlyph = font.glyphs.get('.notdef') || font.glyphs.get(0)
    
    for (const char of uniqueChars) {
      const glyphIndex = font.charToGlyphIndex(char)
      if (glyphIndex !== 0) {
        const glyph = font.glyphs.get(glyphIndex)
        if (glyph) {
          subsetFont.glyphs.push(glyph)
        } else {
          subsetFont.glyphs.push(missingGlyph)
        }
      } else {
        subsetFont.glyphs.push(missingGlyph)
      }
    }
    
    subsetFont.glyphs.forEach((glyph, index) => {
      glyph.index = index
    })
    
    const subsetBuffer = subsetFont.toArrayBuffer()
    const filePath = await writeFontToLocal(fontId, Buffer.from(subsetBuffer))
    
    console.log(`[font-subset] 已创建字体子集: ${fontId}_subset.ttf, 字符数: ${uniqueChars.length}`)
    return filePath
    
  } catch (err) {
    console.error('[font-subset] 创建字体子集失败:', err)
    throw err
  }
}

async function loadFontAndGetPath(fontId, text) {
  try {
    const fontBuffer = await readFontFromLocal(fontId)
    const font = opentype.parse(fontBuffer)
    
    const paths = []
    let x = 0
    const fontSize = 32
    const scale = fontSize / font.unitsPerEm
    
    for (const char of text) {
      if (char === '\n' || char === '\r') {
        x = 0
        continue
      }
      
      const glyph = font.charToGlyph(char)
      if (glyph) {
        const path = glyph.getPath(x, 0, fontSize)
        paths.push({
          path: path,
          x: x,
          char: char
        })
        x += glyph.advanceWidth * scale
      }
    }
    
    return { font, paths }
    
  } catch (err) {
    console.error('[font-subset] 加载字体并获取路径失败:', err)
    throw err
  }
}

module.exports = {
  createFontSubset,
  loadFontAndGetPath,
  readFontFromLocal
}