// engine/typesetter.js
// 排版引擎 - 文字分行分页

/**
 * 简繁转换（简体->繁体）
 * 使用常见字符映射表
 */
const TRADITIONAL_MAP = {
  '的': '的', '一': '一', '是': '是', '了': '了', '我': '我', '不': '不', '人': '人',
  '在': '在', '他': '他', '有': '有', '这': '這', '个': '個', '们': '們', '中': '中',
  '来': '來', '上': '上', '大': '大', '为': '為', '和': '和', '国': '國', '地': '地',
  '到': '到', '以': '以', '说': '說', '时': '時', '要': '要', '就': '就', '出': '出',
  '会': '會', '可': '可', '也': '也', '你': '你', '对': '對', '生': '生', '能': '能',
  '而': '而', '子': '子', '那': '那', '得': '得', '于': '於', '着': '著', '下': '下',
  '自': '自', '之': '之', '年': '年', '过': '過', '发': '發', '后': '後', '作': '作',
  '里': '裡', '用': '用', '道': '道', '行': '行', '所': '所', '然': '然', '家': '家',
  '种': '種', '事': '事', '成': '成', '方': '方', '多': '多', '经': '經', '么': '麼',
  '去': '去', '法': '法', '学': '學', '如': '如', '都': '都', '同': '同', '现': '現',
  '当': '當', '没': '沒', '动': '動', '面': '面', '起': '起', '看': '看', '定': '定',
  '天': '天', '分': '分', '还': '還', '进': '進', '好': '好', '小': '小', '部': '部',
  '其': '其', '些': '些', '主': '主', '样': '樣', '理': '理', '心': '心', '她': '她',
  '本': '本', '前': '前', '开': '開', '但': '但', '因': '因', '只': '只', '从': '從',
  '想': '想', '实': '實', '日': '日', '体': '體', '长': '長', '儿': '兒', '老': '老',
  '头': '頭', '机': '機', '音': '音', '合': '合', '资': '資', '意': '意', '发': '發',
  '现': '現', '高': '高', '书': '書', '无': '無', '如': '如', '己': '己', '所': '所',
  '应': '應', '该': '該', '几': '幾', '已': '已', '力': '力', '之': '之', '于': '於',
  '与': '與', '让': '讓', '们': '們', '给': '給', '将': '將', '对': '對', '于': '於',
  '产': '產', '成': '成', '华': '華', '龙': '龍', '风': '風', '车': '車', '马': '馬',
  '东': '東', '门': '門', '鱼': '魚', '鸟': '鳥', '见': '見', '问': '問', '语': '語',
  '关': '關', '兴': '興', '乐': '樂', '听': '聽', '写': '寫', '读': '讀', '记': '記',
  '讲': '講', '认': '認', '识': '識', '课': '課', '谁': '誰', '调': '調', '谈': '談',
  '论': '論', '请': '請', '许': '許', '诺': '諾', '谢': '謝', '谣': '謠', '谎': '謊',
  '谋': '謀', '谍': '', '谓': '謂', '谢': '謝', '谣': '謠', '谦': '謙', '谨': '謹',
  '电': '電', '脑': '腦', '软': '軟', '件': '件', '网': '網', '页': '頁', '码': '碼',
  '术': '術', '处': '處', '复': '復', '杂': '雜', '务': '務', '团': '團', '队': '隊',
  '员': '員', '组': '組', '织': '織', '统': '統', '领': '領', '导': '導', '备': '備',
  '类': '類', '级': '級', '极': '極', '权': '權', '术': '術', '术': '術', '称': '稱',
  '划': '劃', '制': '制', '别': '別', '划': '劃', '则': '則', '刚': '剛', '创': '創',
  '删': '刪', '判': '判', '利': '利', '到': '到', '则': '則', '刚': '剛', '别': '別',
  '删': '刪', '判': '判', '制': '制', '刻': '刻', '前': '前', '剑': '劍', '剧': '劇',
  '剩': '剩', '剪': '剪', '副': '副', '割': '割', '剧': '劇', '剩': '剩', '剑': '劍',
  '剧': '劇', '剪': '剪', '副': '副', '割': '割', '剧': '劇', '剑': '劍', '剧': '劇',
  '剪': '剪', '副': '副', '割': '割', '剧': '劇', '剑': '劍', '剧': '劇', '剪': '剪',
  '广': '廣', '庆': '慶', '庐': '', '庞': '龐', '废': '廢', '底': '底', '庄': '莊',
  '库': '庫', '应': '應', '庙': '廟', '府': '府', '度': '度', '座': '座', '庭': '庭',
  '康': '康', '庸': '庸', '庶': '庶', '廊': '廊', '廉': '廉', '庞': '龐', '废': '廢',
  '广': '廣', '庄': '莊', '庆': '慶', '庐': '廬', '庞': '龐', '底': '底', '废': '廢',
  '府': '府', '度': '度', '座': '座', '庭': '庭', '康': '康', '庸': '庸', '庶': '庶',
  '廊': '廊', '廉': '廉', '庞': '龐', '废': '廢', '庄': '莊', '庆': '慶', '庐': '廬',
  '庞': '龐', '底': '底', '废': '廢', '府': '府', '度': '度', '座': '座', '庭': '庭',
  '康': '康', '庸': '庸', '庶': '庶', '廊': '廊', '廉': '廉', '库': '庫', '应': '應',
  '庙': '廟', '庄': '莊', '庆': '慶', '庐': '廬', '庞': '龐', '底': '底', '废': '廢',
  '府': '府', '度': '度', '座': '座', '庭': '庭', '康': '康', '庸': '庸', '庶': '庶',
  '廊': '廊', '廉': '廉', '庞': '龐', '废': '廢', '庄': '莊', '庆': '慶', '庐': '廬',
  '庞': '龐', '底': '底', '废': '廢', '府': '府', '度': '度', '座': '座', '庭': '庭',
  '康': '康', '庸': '庸', '庶': '庶', '廊': '廊', '廉': '廉', '庞': '龐', '废': '廢',
  '库': '庫', '应': '應', '庙': '廟'
}

function simplifyToTraditional(text) {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    result += TRADITIONAL_MAP[ch] || ch
  }
  return result
}

/**
 * 判断是否为标点符号（不能出现在行首）
 */
const LINE_START_FORBIDDEN = '，。！？；：、…—）》】」\'\"'
/**
 * 不能出现在行尾的标点
 */
const LINE_END_FORBIDDEN = '（《【「\'\""'

function isLineStartForbidden(char) {
  return LINE_START_FORBIDDEN.includes(char)
}
function isLineEndForbidden(char) {
  return LINE_END_FORBIDDEN.includes(char)
}

/**
 * ASCII 半角字符 → 全角 CJK 字符转换
 * 在中文排版中，英文/数字应占据全角单元格，否则 fillText 渲染时
 * 半角字符实际宽度只有 fontSize/2，而排版分配的间距是 fontSize，造成空隙
 */
function toFullWidth(text) {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const code = ch.charCodeAt(0)
    if (code >= 0x30 && code <= 0x39) {
      // 数字 0-9 → ０-９ (U+FF10-U+FF19)
      result += String.fromCharCode(code - 0x30 + 0xFF10)
    } else if (code >= 0x41 && code <= 0x5A) {
      // 大写字母 A-Z → Ａ-Ｚ (U+FF21-U+FF3A)
      result += String.fromCharCode(code - 0x41 + 0xFF21)
    } else if (code >= 0x61 && code <= 0x7A) {
      // 小写字母 a-z → ａ-ｚ (U+FF41-U+FF5A)
      result += String.fromCharCode(code - 0x61 + 0xFF41)
    } else {
      result += ch
    }
  }
  return result
}

/**
 * 排版单页文字
 * 输入：文字字符串 + 布局参数
 * 输出：glyph列表（每个字的坐标）+ 剩余未排版文字
 *
 * @param {object} params
 * @param {string} params.text - 待排版文字
 * @param {number} params.canvasWidth - Canvas物理宽度
 * @param {number} params.canvasHeight - Canvas物理宽度
 * @param {object} params.layout - 布局配置（来自constants）
 * @param {number} params.dpr - 设备像素比（用于rpx->px换算已完成，此处直接用px）
 * @returns {{ glyphs: Array, remainder: string, pagesFull: boolean }}
 */
function typesetPage(params) {
  const { text, canvasWidth, canvasHeight, layout } = params

  // 排版松紧度：调整字号、行距、字距
  const compactness = layout.compactness != null ? layout.compactness : 50
  const compactFactor = compactness / 100 // 0.0 ~ 1.0
  const sizeScale = 0.85 + compactFactor * 0.30 // 0.85 ~ 1.15
  const lineHeightScale = 0.80 + compactFactor * 0.40 // 0.80 ~ 1.20

  let fontSize = layout.fontSize * sizeScale
  let lineHeight = fontSize * (layout.lineHeight * lineHeightScale)
  // 字距：em -> px，上限放宽到 0.35em 以适应更宽的字距范围
  const letterSpacing = Math.min(layout.letterSpacing * fontSize, fontSize * 0.35)
  const direction = layout.direction || 'horizontal'

  // 段落间距（单位：行数，合理范围 0~5，防止异常大值导致换页）
  const paragraphSpacing = Math.min(layout.paragraphSpacing || 0, 5)
  // 空行处理
  const emptyLineHandling = layout.emptyLineHandling || 'preserve'

  // 繁简转换
  let processedText = text
  const textScript = layout.textScript || 'sc'
  if (textScript === 'tc') {
    processedText = simplifyToTraditional(text)
  }

  // 半角→全角转换（数字/英文字母在中文排版中应占全角单元格）
  processedText = toFullWidth(processedText)

  const marginTop = layout.marginTop
  const marginBottom = layout.marginBottom
  const marginLeft = layout.marginLeft
  const marginRight = layout.marginRight

  const contentWidth = canvasWidth - marginLeft - marginRight
  const contentHeight = canvasHeight - marginTop - marginBottom

  const glyphs = []
  let remainder = ''
  let charIndex = 0

  if (direction === 'horizontal') {
    // 横排分行逻辑
    const columns = layout.columns || 1
    const columnGap = layout.columnGap || 0
    const colWidth = (contentWidth - columnGap * (columns - 1)) / columns

    const charsPerLine = Math.floor(colWidth / (fontSize + letterSpacing))
    const linesPerColumn = Math.floor(contentHeight / lineHeight)

    // 分段
    let paragraphs = processedText.split('\n')

    // 空行处理：合并连续空行
    if (emptyLineHandling === 'merge') {
      const merged = []
      let prevEmpty = false
      for (const p of paragraphs) {
        const isEmpty = p.trim().length === 0
        if (isEmpty) {
          if (!prevEmpty) {
            merged.push(p)
            prevEmpty = true
          }
          // 连续空行跳过
        } else {
          merged.push(p)
          prevEmpty = false
        }
      }
      paragraphs = merged
    }

    let col = 0
    let lineInCol = 0
    let pIdx = 0

    while (pIdx < paragraphs.length) {
      const para = paragraphs[pIdx]
      let pos = 0
      let isFirstLineOfPara = true

      while (pos < para.length) {
        // 计算本行可容纳字数
        // 当每行容量较小时，禁用首行缩进避免第一行只能放极少字符
        const shouldIndent = isFirstLineOfPara && (layout.indent || 0) > 0 && charsPerLine >= 8
        const indent = shouldIndent ? (layout.indent || 0) : 0
        const lineCapacity = charsPerLine - indent

        if (lineCapacity <= 0) {
          // 边距过大，容纳不了字
          break
        }

        // 取本行字符（先取满）
        let lineChars = para.slice(pos, pos + lineCapacity)

        // 标点禁则处理：若下一字是行首禁用标点，前移一个
        if (lineChars.length === lineCapacity && pos + lineCapacity < para.length) {
          const nextChar = para[pos + lineCapacity]
          if (isLineStartForbidden(nextChar)) {
            lineChars = para.slice(pos, pos + lineCapacity - 1)
          }
          // 若行尾是禁用标点，也后移一个
          const lastChar = lineChars[lineChars.length - 1]
          if (isLineEndForbidden(lastChar)) {
            lineChars = para.slice(pos, pos + lineCapacity + 1)
          }
        }

        // 计算本行起始坐标
        const colStartX = marginLeft + col * (colWidth + columnGap)
        const lineStartX = colStartX + indent * (fontSize + letterSpacing)
        const lineY = marginTop + lineInCol * lineHeight + fontSize  // 基线

        // 判断是否为段落最后一行（不强制两端对齐）
        const isLastLineOfPara = pos + lineChars.length >= para.length

        // 生成字形
        if (layout.textAlign === 'center') {
          // 居中对齐
          const totalW = lineChars.length * (fontSize + letterSpacing)
          const startX = colStartX + (colWidth - totalW) / 2
          for (let i = 0; i < lineChars.length; i++) {
            glyphs.push({
              text: lineChars[i],
              x: startX + i * (fontSize + letterSpacing),
              y: lineY
            })
          }
        } else if (layout.textAlign === 'justify' && lineChars.length === lineCapacity && !isLastLineOfPara) {
          // 两端对齐：先算出 gap，只有当 gap <= letterSpacing + fontSize*0.1 才真正两端对齐
          // 否则说明行内字符太少，被过度撑开，回退到左对齐
          const gap = lineChars.length > 1
            ? (colWidth - indent * (fontSize + letterSpacing) - lineChars.length * fontSize) / (lineChars.length - 1)
            : 0
          // gap 合理区间：不超过 letterSpacing + 10% 字宽（即接近左对齐时才启用）
          const maxAcceptableGap = letterSpacing + fontSize * 0.12
          if (gap <= maxAcceptableGap) {
            for (let i = 0; i < lineChars.length; i++) {
              glyphs.push({
                text: lineChars[i],
                x: lineStartX + i * (fontSize + gap),
                y: lineY
              })
            }
          } else {
            // gap 过大，回退左对齐
            for (let i = 0; i < lineChars.length; i++) {
              glyphs.push({
                text: lineChars[i],
                x: lineStartX + i * (fontSize + letterSpacing),
                y: lineY
              })
            }
          }
        } else {
          // 左对齐 / 最后一行
          for (let i = 0; i < lineChars.length; i++) {
            glyphs.push({
              text: lineChars[i],
              x: lineStartX + i * (fontSize + letterSpacing),
              y: lineY
            })
          }
        }

        pos += lineChars.length
        isFirstLineOfPara = false
        lineInCol++

        // 换列
        if (lineInCol >= linesPerColumn) {
          lineInCol = 0
          col++
          if (col >= columns) {
            // 当前页已满，记录剩余文字
            // 如果当前段落还有剩余
            const remainPara = para.slice(pos)
            const remainParas = [remainPara, ...paragraphs.slice(pIdx + 1)].filter((_, i) => i === 0 || true)
            remainder = [remainPara, ...paragraphs.slice(pIdx + 1)].join('\n')
            return { glyphs, remainder, pagesFull: true }
          }
        }
      }

      // 段间空白
      if (pIdx < paragraphs.length - 1 && paragraphSpacing > 0) {
        lineInCol += paragraphSpacing
        if (lineInCol >= linesPerColumn) {
          lineInCol = 0
          col++
          if (col >= columns) {
            remainder = paragraphs.slice(pIdx + 1).join('\n')
            return { glyphs, remainder, pagesFull: true }
          }
        }
      }

      pIdx++
      charIndex = 0
    }

    return { glyphs, remainder: '', pagesFull: false }

  } else {
    // 竖排（从右到左）
    const charHeight = fontSize + letterSpacing
    const charsPerColumn = Math.floor(contentHeight / charHeight)
    const totalColumns = Math.floor(contentWidth / (fontSize * 1.5))

    let col = 0
    let charInCol = 0
    let textIdx = 0
    const chars = text.replace(/\n/g, '　')  // 换行改为全角空格（竖排段落）

    while (textIdx < chars.length) {
      if (col >= totalColumns) {
        remainder = chars.slice(textIdx)
        return { glyphs, remainder, pagesFull: true }
      }

      const x = marginLeft + (totalColumns - 1 - col) * fontSize * 1.5 + fontSize * 0.5 // 从右往左
      const y = marginTop + charInCol * charHeight + fontSize

      glyphs.push({
        text: chars[textIdx],
        x,
        y
      })

      charInCol++
      textIdx++

      if (charInCol >= charsPerColumn) {
        charInCol = 0
        col++
      }
    }

    return { glyphs, remainder: '', pagesFull: false }
  }
}

/**
 * 将长文本分割为多页
 * @param {string} text
 * @param {object} layoutParams - { canvasWidth, canvasHeight, layout }
 * @returns {Array<{glyphs: Array, pageIndex: number}>}
 */
function typesetAllPages(text, layoutParams) {
  const pages = []
  let remainingText = text
  let pageIndex = 0
  const maxPages = 100  // 防无限循环

  while (remainingText.length > 0 && pageIndex < maxPages) {
    const result = typesetPage({
      text: remainingText,
      ...layoutParams
    })
    pages.push({ glyphs: result.glyphs, pageIndex })
    pageIndex++

    if (!result.pagesFull || result.remainder === remainingText) {
      break
    }
    remainingText = result.remainder
  }

  return pages
}

module.exports = { typesetPage, typesetAllPages }
