// utils/moban-templates.js
// moban 文件夹图片模板配置（26套）
// 背景图通过云存储 fileID 加载，需替换下方占位符为实际 fileID

// ============================================================
// 【重要】请替换以下占位符为实际云存储 fileID
// 获取方式：微信开发者工具 → 云开发 → 存储 → 点击文件 → 复制 fileID
// fileID 格式：cloud://cloud1-xxx.636c-cloud1-xxx/moban/文件名.jpg
// ============================================================

const CLOUD_ENV_PATH = 'cloud://cloud1-d6g9rv89829bcd240.636c-cloud1-d6g9rv89829bcd240-1434021718/moban/'

function makeImageFileID(filename) {
  return CLOUD_ENV_PATH + filename
}

// 通用纸张背景图模板基型
function makeImageTemplate(params) {
  const {
    id,
    name,
    desc,
    filename,
    direction = 'horizontal',
    marginTop = 100,
    marginBottom = 100,
    marginLeft = 72,
    marginRight = 72,
    fontSize = 30,
    lineHeight = 1.9,
    letterSpacing = 0.04,
    inkColor = '#1A1008',
    inkOpacity = 0.78,
    blurRadius = 0.3,
    fontWeight = '400',
    fontFamily = '上古宋体-Regular'
  } = params

  return {
    id,
    name,
    desc,
    category: direction,
    paper: {
      baseColor: '#FAF7F2',
      fiberOpacity: 0.02,
      ageOpacity: 0.02,
      grain: 'none',
      shadow: true,
      border: null,
      backgroundImage: {
        fileID: makeImageFileID(filename),
        mode: 'aspectFill' // 等比填充
      }
    },
    layout: {
      direction,
      marginTop,
      marginBottom,
      marginLeft,
      marginRight,
      fontSize,
      lineHeight,
      letterSpacing,
      paragraphSpacing: 0.7,
      indent: direction === 'horizontal' ? 2 : 0,
      textAlign: 'justify'
    },
    font: {
      family: fontFamily,
      fallback: 'serif',
      weight: fontWeight
    },
    ink: {
      color: inkColor,
      opacity: inkOpacity,
      blurRadius,
      multiplyStrength: 0.72,
      variation: 0.05
    },
    watermark: {
      text: '铅言万语',
      position: 'bottomRight',
      opacity: 0.12,
      fontSize: 18
    },
    decoration: {
      pageNumber: true,
      pageLine: false,
      stamp: null
    }
  }
}

// 本子系列（3套）
const MOBAN_BZB = {
  'moban-bzb-bianqian': makeImageTemplate({
    id: 'moban-bzb-bianqian',
    name: '便签本',
    desc: '方格便签纸',
    filename: 'bzb_bianqian.jpg',
    marginTop: 120,
    marginBottom: 80,
    marginLeft: 80,
    marginRight: 80,
    fontSize: 28,
    lineHeight: 1.8
  }),
  'moban-bzb-fangge': makeImageTemplate({
    id: 'moban-bzb-fangge',
    name: '方格本',
    desc: '软木方格线圈本',
    filename: 'bzb_fangge.jpg',
    marginTop: 100,
    marginBottom: 100,
    marginLeft: 72,
    marginRight: 72,
    fontSize: 28,
    lineHeight: 1.8,
    letterSpacing: 0.02
  }),
  'moban-bzb-hengxian': makeImageTemplate({
    id: 'moban-bzb-hengxian',
    name: '横线本',
    desc: '白色横线笔记本',
    filename: 'bzb_hengxian.jpg',
    marginTop: 110,
    marginBottom: 90,
    marginLeft: 72,
    marginRight: 72,
    fontSize: 28,
    lineHeight: 1.9,
    letterSpacing: 0.02
  })
}

// 古本系列（4套）
const MOBAN_GB = {
  'moban-gb-fanye': makeImageTemplate({
    id: 'moban-gb-fanye',
    name: '翻页古书',
    desc: '翻页双页古书',
    filename: 'gb_fanye.jpg',
    marginTop: 90,
    marginBottom: 90,
    marginLeft: 80,
    marginRight: 80,
    fontSize: 26,
    lineHeight: 1.75,
    inkColor: '#1A0A00',
    inkOpacity: 0.72,
    blurRadius: 0.5
  }),
  'moban-gb-niupizhi': makeImageTemplate({
    id: 'moban-gb-niupizhi',
    name: '牛皮古书',
    desc: '卷边牛皮纸古页',
    filename: 'gb_niupizhi.jpg',
    marginTop: 100,
    marginBottom: 100,
    marginLeft: 72,
    marginRight: 72,
    fontSize: 28,
    inkColor: '#1A0A00',
    inkOpacity: 0.70,
    blurRadius: 0.5
  }),
  'moban-gb-shuangye': makeImageTemplate({
    id: 'moban-gb-shuangye',
    name: '双页古书',
    desc: '左右双页排版',
    filename: 'gb_shuangye.jpg',
    marginTop: 80,
    marginBottom: 80,
    marginLeft: 60,
    marginRight: 60,
    fontSize: 26,
    lineHeight: 1.7
  }),
  'moban-gb-xianzhuang': makeImageTemplate({
    id: 'moban-gb-xianzhuang',
    name: '线装古籍',
    desc: '线装双页古籍',
    filename: 'gb_xianzhuang.jpg',
    marginTop: 90,
    marginBottom: 90,
    marginLeft: 80,
    marginRight: 80,
    fontSize: 28,
    inkColor: '#150A00',
    inkOpacity: 0.74,
    blurRadius: 0.4
  })
}

// 信纸系列（3套）
const MOBAN_XZ = {
  'moban-xz-huangxin': makeImageTemplate({
    id: 'moban-xz-huangxin',
    name: '泛黄信纸',
    desc: '泛黄底黑框信纸',
    filename: 'xz_huangxin.jpg',
    marginTop: 120,
    marginBottom: 100,
    marginLeft: 80,
    marginRight: 80,
    fontSize: 28,
    lineHeight: 1.9,
    inkColor: '#1C1008',
    inkOpacity: 0.76
  }),
  'moban-xz-keai': makeImageTemplate({
    id: 'moban-xz-keai',
    name: '可爱信纸',
    desc: '卷草花纹小动物',
    filename: 'xz_keai.jpg',
    marginTop: 110,
    marginBottom: 100,
    marginLeft: 80,
    marginRight: 80,
    fontSize: 28,
    lineHeight: 1.85,
    inkColor: '#1A1008',
    inkOpacity: 0.78
  }),
  'moban-xz-zhuye': makeImageTemplate({
    id: 'moban-xz-zhuye',
    name: '竹叶信纸',
    desc: '粉色底竹叶边框',
    filename: 'xz_zhuye.jpg',
    marginTop: 120,
    marginBottom: 100,
    marginLeft: 80,
    marginRight: 80,
    fontSize: 28,
    inkColor: '#1A1008',
    inkOpacity: 0.76
  })
}

// 纸张系列（16套）
const MOBAN_ZZ = {
  'moban-zz-baizhi': makeImageTemplate({
    id: 'moban-zz-baizhi',
    name: '白色卷边纸',
    desc: '白色卷边新纸',
    filename: 'zz_baizhi.jpg',
    marginTop: 90,
    marginBottom: 90,
    marginLeft: 64,
    marginRight: 64
  }),
  'moban-zz-banbo': makeImageTemplate({
    id: 'moban-zz-banbo',
    name: '斑驳旧纸',
    desc: '斑驳灰绿旧纸',
    filename: 'zz_banbo.jpg',
    marginTop: 100,
    marginBottom: 100,
    marginLeft: 72,
    marginRight: 72,
    fontSize: 28,
    inkColor: '#1A0A00',
    inkOpacity: 0.72
  }),
  'moban-zz-fanhuang': makeImageTemplate({
    id: 'moban-zz-fanhuang',
    name: '泛黄旧纸',
    desc: '泛黄旧纸边缘',
    filename: 'zz_fanhuang.jpg',
    marginTop: 100,
    marginBottom: 100,
    marginLeft: 72,
    marginRight: 72,
    fontSize: 28,
    inkColor: '#1A0A00',
    inkOpacity: 0.74
  }),
  'moban-zz-fankuang': makeImageTemplate({
    id: 'moban-zz-fankuang',
    name: '方框旧纸',
    desc: '泛黄旧纸+黑框',
    filename: 'zz_fankuang.jpg',
    marginTop: 90,
    marginBottom: 90,
    marginLeft: 64,
    marginRight: 64,
    fontSize: 28,
    inkColor: '#1A0A00',
    inkOpacity: 0.74
  }),
  'moban-zz-gucao': makeImageTemplate({
    id: 'moban-zz-gucao',
    name: '古糙纤维纸',
    desc: '古糙纤维纹理',
    filename: 'zz_gucao.jpg',
    marginTop: 100,
    marginBottom: 100,
    marginLeft: 72,
    marginRight: 72,
    fontSize: 28,
    inkColor: '#1A0A00',
    inkOpacity: 0.72
  }),
  'moban-zz-heizhi': makeImageTemplate({
    id: 'moban-zz-heizhi',
    name: '黑色纹理纸',
    desc: '黑色暗色纹理',
    filename: 'zz_heizhi.jpg',
    marginTop: 100,
    marginBottom: 100,
    marginLeft: 72,
    marginRight: 72,
    fontSize: 28,
    inkColor: '#E8E0D0',
    inkOpacity: 0.85,
    blurRadius: 0.2
  }),
  'moban-zz-huangheng': makeImageTemplate({
    id: 'moban-zz-huangheng',
    name: '黄色横线纸',
    desc: '黄色横线活页纸',
    filename: 'zz_huangheng.jpg',
    marginTop: 110,
    marginBottom: 90,
    marginLeft: 72,
    marginRight: 72,
    fontSize: 28,
    lineHeight: 1.9,
    inkColor: '#1A1008',
    inkOpacity: 0.78
  }),
  'moban-zz-huizhi': makeImageTemplate({
    id: 'moban-zz-huizhi',
    name: '灰色粗糙纸',
    desc: '灰色粗糙纸+黑框',
    filename: 'zz_huizhi.png',
    marginTop: 100,
    marginBottom: 100,
    marginLeft: 72,
    marginRight: 72,
    fontSize: 28,
    inkColor: '#1A0A00',
    inkOpacity: 0.76
  }),
  'moban-zz-jiuzhi': makeImageTemplate({
    id: 'moban-zz-jiuzhi',
    name: '十字折痕旧纸',
    desc: '泛黄十字折痕',
    filename: 'zz_jiuzhi.jpg',
    marginTop: 100,
    marginBottom: 100,
    marginLeft: 72,
    marginRight: 72,
    fontSize: 28,
    inkColor: '#1A0A00',
    inkOpacity: 0.74
  }),
  'moban-zz-muzhi': makeImageTemplate({
    id: 'moban-zz-muzhi',
    name: '木桌白纸',
    desc: '木桌+白纸+光影',
    filename: 'zz_muzhi.jpg',
    marginTop: 100,
    marginBottom: 100,
    marginLeft: 72,
    marginRight: 72,
    fontSize: 28,
    inkColor: '#1A1008',
    inkOpacity: 0.78
  }),
  'moban-zz-niupizhi': makeImageTemplate({
    id: 'moban-zz-niupizhi',
    name: '方形牛皮纸',
    desc: '方形牛皮纸纹理',
    filename: 'zz_niupizhi.jpg',
    marginTop: 100,
    marginBottom: 100,
    marginLeft: 72,
    marginRight: 72,
    fontSize: 28,
    inkColor: '#1A0A00',
    inkOpacity: 0.72
  }),
  'moban-zz-qinglv': makeImageTemplate({
    id: 'moban-zz-qinglv',
    name: '青绿宣纸',
    desc: '浅青绿渐变宣纸',
    filename: 'zz_qinglv.jpg',
    marginTop: 100,
    marginBottom: 100,
    marginLeft: 72,
    marginRight: 72,
    fontSize: 28,
    inkColor: '#1A0A00',
    inkOpacity: 0.74
  }),
  'moban-zz-shenlan': makeImageTemplate({
    id: 'moban-zz-shenlan',
    name: '深蓝暗纸',
    desc: '深蓝灰渐变暗色',
    filename: 'zz_shenlan.jpg',
    marginTop: 100,
    marginBottom: 100,
    marginLeft: 72,
    marginRight: 72,
    fontSize: 28,
    inkColor: '#E8E0D0',
    inkOpacity: 0.85,
    blurRadius: 0.2
  }),
  'moban-zz-xianwei': makeImageTemplate({
    id: 'moban-zz-xianwei',
    name: '纤维褶纸',
    desc: '灰蓝纤维褶皱',
    filename: 'zz_xianwei.jpg',
    marginTop: 100,
    marginBottom: 100,
    marginLeft: 72,
    marginRight: 72,
    fontSize: 28,
    inkColor: '#1A0A00',
    inkOpacity: 0.74
  }),
  'moban-zz-xinxuanzhi': makeImageTemplate({
    id: 'moban-zz-xinxuanzhi',
    name: '新宣纸',
    desc: '极浅蓝白宣纸',
    filename: 'zz_xinxuanzhi.jpg',
    marginTop: 100,
    marginBottom: 100,
    marginLeft: 72,
    marginRight: 72,
    fontSize: 30,
    inkColor: '#1A1008',
    inkOpacity: 0.78
  }),
  'moban-zz-xuanzhi': makeImageTemplate({
    id: 'moban-zz-xuanzhi',
    name: '淡蓝宣纸',
    desc: '淡蓝宣纸渐变',
    filename: 'zz_xuanzhi.jpg',
    marginTop: 100,
    marginBottom: 100,
    marginLeft: 72,
    marginRight: 72,
    fontSize: 30,
    inkColor: '#1A1008',
    inkOpacity: 0.78
  }),
  'moban-zz-zhehen': makeImageTemplate({
    id: 'moban-zz-zhehen',
    name: '折痕旧纸',
    desc: '泛黄折痕旧纸',
    filename: 'zz_zhehen.jpg',
    marginTop: 100,
    marginBottom: 100,
    marginLeft: 72,
    marginRight: 72,
    fontSize: 28,
    inkColor: '#1A0A00',
    inkOpacity: 0.74
  })
}

// 合并所有 moban 模板
const MOBAN_TEMPLATES = {
  ...MOBAN_BZB,
  ...MOBAN_GB,
  ...MOBAN_XZ,
  ...MOBAN_ZZ
}

// moban 模板顺序（按系列分组）
const MOBAN_ORDER = [
  // 本子
  'moban-bzb-bianqian',
  'moban-bzb-fangge',
  'moban-bzb-hengxian',
  // 古本
  'moban-gb-fanye',
  'moban-gb-niupizhi',
  'moban-gb-shuangye',
  'moban-gb-xianzhuang',
  // 信纸
  'moban-xz-huangxin',
  'moban-xz-keai',
  'moban-xz-zhuye',
  // 纸张
  'moban-zz-baizhi',
  'moban-zz-banbo',
  'moban-zz-fanhuang',
  'moban-zz-fankuang',
  'moban-zz-gucao',
  'moban-zz-heizhi',
  'moban-zz-huangheng',
  'moban-zz-huizhi',
  'moban-zz-jiuzhi',
  'moban-zz-muzhi',
  'moban-zz-niupizhi',
  'moban-zz-qinglv',
  'moban-zz-shenlan',
  'moban-zz-xianwei',
  'moban-zz-xinxuanzhi',
  'moban-zz-xuanzhi',
  'moban-zz-zhehen'
]

module.exports = {
  MOBAN_TEMPLATES,
  MOBAN_ORDER,
  makeImageFileID
}
