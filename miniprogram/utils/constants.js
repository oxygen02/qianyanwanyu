// utils/constants.js
// 书页模板参数 - 完整配置（内置10套 + moban 26套）

const { MOBAN_TEMPLATES, MOBAN_ORDER } = require('./moban-templates')

/**
 * 版心参数说明（单位：px，基于750rpx设计稿）
 * marginTop: 天头（上边距）
 * marginBottom: 地脚（下边距）
 * marginOuter: 切口（外边距，远离装订侧）
 * marginInner: 订口（内边距，靠近装订侧）
 */

const TEMPLATES = {
  // 1. 现代散文（默认模板）
  'modern-prose': {
    id: 'modern-prose',
    name: '现代散文',
    desc: '轻型纸 · 宋体 · 行距2.0',
    category: 'horizontal',
    // 纸张
    paper: {
      baseColor: '#FAF7F2',     // 轻型纸米白
      fiberOpacity: 0.22,       // 纤维纹理强度提高
      ageOpacity: 0.25,         // 老化程度加深
      grain: 'fine',            // 纹理粗细: fine/medium/coarse
      shadow: true,             // 书页投影
      shadowIntensity: 0.6,     // 投影强度
      border: null,             // 无边框
      light: {
        enabled: true,
        centerX: 0.35,
        centerY: 0.25,
        radius: 0.6,
        color: '#FFFFFF',
        opacity: 0.12
      },
      stain: {
        enabled: true,
        count: 3,
        opacity: 0.06
      },
      edges: {
        enabled: true,
        roughness: 0.3,
        darkenEdges: 0.15
      }
    },
    // 排版 - 默认参数经真机视觉验证优化
    layout: {
      direction: 'horizontal',  // 横排
      marginTop: 20,            // 天头（上边距）
      marginBottom: 20,         // 地脚（下边距）
      marginLeft: 10,           // 订口（左/内边距）
      marginRight: 10,          // 切口（右/外边距）
      fontSize: 27,             // 正文字号（优化后的移动端默认值）
      lineHeight: 1.0,          // 行间距倍率，1.0x字号
      letterSpacing: 0,         // 字间距 em，默认无额外间距由用户自行调节
      paragraphSpacing: 0.5,    // em，段间额外空白
      indent: 2,                // 首行缩进字符数
      textAlign: 'justify',
      compactness: 50           // 排版松紧度（默认中间值，不额外缩放）
    },
    // 字体
    font: {
      family: '上古宋体-Regular',
      fallback: 'serif',
      weight: '400'
    },
    // 油墨 - 默认参数经真机视觉验证
    ink: {
      color: '#1A1008',         // 墨色
      opacity: 0.65,            // 墨色浓度默认65%
      variation: 0.12,          // 笔画粗细变化程度
      blurRadius: 0.5,          // 模糊半径
      misRegistration: 0.02,    // 套印不准（降低到视觉不可见的程度）
      damage: 0.08,             // 破损程度
      inkSpread: true,          // 启用墨色浸染
      inkSpreadIntensity: 0.6,  // 浸染强度
      weathering: true,         // 启用字风化
      weatheringIntensity: 0.3  // 风化强度
    },
    // 装饰
    decoration: {
      stamp: null,
      pageNumber: true,
      brandStamp: { enabled: true, position: 'bottomRight' }
      stamp: null
      },
      pageNumber: true
    }
  },

  // 2. 仿古手抄
  'ancient-manuscript': {
    id: 'ancient-manuscript',
    name: '仿古手抄',
    desc: '宣纸 · 楷书 · 竖排',
    category: 'vertical',
    paper: {
      baseColor: '#F5EFE6',
      fiberOpacity: 0.25,
      ageOpacity: 0.35,
      grain: 'medium',
      shadow: true,
      border: null
    },
    layout: {
      direction: 'vertical',
      marginTop: 20,
      marginBottom: 20,
      marginLeft: 10,
      marginRight: 10,
      fontSize: 27,
      lineHeight: 1.0,
      letterSpacing: 0.03,
      paragraphSpacing: 0.8,
      indent: 0,
      textAlign: 'justify'
    },
    font: {
      family: '上古宋体-Regular',
      fallback: 'serif',
      weight: '400'
    },
    ink: {
      color: '#2D1F14',
      opacity: 0.65,
      variation: 0.12,
      blurRadius: 0.5,
      misRegistration: 0.05,
      damage: 0.08
    },
    decoration: {
      stamp: null,
      pageNumber: true,
      brandStamp: { enabled: true, position: 'bottomRight' }
      stamp: {
        type: 'circle',
        text: '墨',
        color: '#8B4513',
        opacity: 0.6
      },
      },
      pageNumber: true
    }
  },

  // 5. 当代杂志
  'modern-magazine': {
    id: 'modern-magazine',
    name: '当代杂志',
    desc: '光面纸 · 无衬线 · 简洁',
    category: 'horizontal',
    paper: {
      baseColor: '#FFFFFF',
      fiberOpacity: 0.02,
      ageOpacity: 0.02,
      grain: 'fine',
      shadow: true,
      border: null
    },
    layout: {
      direction: 'horizontal',
      marginTop: 55,
      marginBottom: 55,
      marginLeft: 50,
      marginRight: 50,
      fontSize: 27,
      lineHeight: 1.0,
      letterSpacing: 0.01,
      paragraphSpacing: 0.6,
      indent: 0,
      textAlign: 'justify'
    },
    font: {
      family: '思源宋体-Regular',
      fallback: 'sans-serif',
      weight: '400'
    },
    ink: {
      color: '#2D2D2D',
      opacity: 0.65,
      variation: 0.02,
      blurRadius: 0.1,
      misRegistration: 0.01,
      damage: 0
    },
    decoration: {
      stamp: null,
      pageNumber: true,
      brandStamp: { enabled: true, position: 'bottomRight' }
      stamp: null,
      },
      pageNumber: true
    }
  },

  // 9. 日式和纸
  'japanese-washi': {
    id: 'japanese-washi',
    name: '日式和纸',
    desc: '和纸 · 明朝体 · 竖排',
    category: 'vertical',
    paper: {
      baseColor: '#FAF8F5',
      fiberOpacity: 0.20,
      ageOpacity: 0.15,
      grain: 'medium',
      shadow: true,
      border: null
    },
    layout: {
      direction: 'vertical',
      marginTop: 55,
      marginBottom: 55,
      marginLeft: 50,
      marginRight: 50,
      fontSize: 27,
      lineHeight: 1.0,
      letterSpacing: 0.04,
      paragraphSpacing: 0.7,
      indent: 0,
      textAlign: 'justify'
    },
    font: {
      family: '源起明体-Regular',
      fallback: 'serif',
      weight: '400'
    },
    ink: {
      color: '#2D1F14',
      opacity: 0.65,
      variation: 0.08,
      blurRadius: 0.3,
      misRegistration: 0.04,
      damage: 0.03
    },
    decoration: {
      stamp: null,
      pageNumber: true,
      brandStamp: { enabled: true, position: 'bottomRight' }
      stamp: {
        type: 'square',
        text: '印',
        color: '#8B4513',
        opacity: 0.4
      },
      },
      pageNumber: true
    }
  },

  // 13. 草稿纸
  'draft-paper': {
    id: 'draft-paper',
    name: '方格草稿',
    desc: '方格纸 · 笔记 · 草稿',
    category: 'horizontal',
    paper: {
      baseColor: '#FDFBF7',
      fiberOpacity: 0.10,
      ageOpacity: 0.08,
      grain: 'fine',
      shadow: false,
      border: null,
      grid: {
        enabled: true,
        size: 24,
        color: '#E0D8CF',
        opacity: 0.4
      }
    },
    layout: {
      direction: 'horizontal',
      marginTop: 45,
      marginBottom: 45,
      marginLeft: 50,
      marginRight: 50,
      fontSize: 27,
      lineHeight: 1.0,
      letterSpacing: 0.02,
      paragraphSpacing: 0.5,
      indent: 0,
      textAlign: 'left'
    },
    font: {
      family: '思源宋体-Regular',
      fallback: 'sans-serif',
      weight: '400'
    },
    ink: {
      color: '#2D2D2D',
      opacity: 0.65,
      variation: 0.03,
      blurRadius: 0.15,
      misRegistration: 0.02,
      damage: 0.02
    },
    decoration: {
      stamp: null,
      pageNumber: true,
      brandStamp: { enabled: true, position: 'bottomRight' }
      stamp: null,
      },
      pageNumber: false
    }
  },

  // 16. 现代简约
  'modern-minimal': {
    id: 'modern-minimal',
    name: '现代简约',
    desc: '纯白 · 极简 · 清晰',
    category: 'horizontal',
    paper: {
      baseColor: '#FFFFFF',
      fiberOpacity: 0.02,
      ageOpacity: 0.02,
      grain: 'fine',
      shadow: false,
      border: null
    },
    layout: {
      direction: 'horizontal',
      marginTop: 50,
      marginBottom: 50,
      marginLeft: 10,
      marginRight: 10,
      fontSize: 27,
      lineHeight: 1.0,
      letterSpacing: 0.01,
      paragraphSpacing: 0.6,
      indent: 0,
      textAlign: 'justify'
    },
    font: {
      family: '思源宋体-Regular',
      fallback: 'serif',
      weight: '400'
    },
    ink: {
      color: '#2D2D2D',
      opacity: 0.65,
      variation: 0.02,
      blurRadius: 0.1,
      misRegistration: 0.01,
      damage: 0
    },
    decoration: {
      stamp: null,
      pageNumber: true,
      brandStamp: { enabled: true, position: 'bottomRight' }
      stamp: null,
