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
    // 排版
    layout: {
      direction: 'horizontal',  // 横排
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      fontSize: 40,             // 正文字号（基于750rpx）
      lineHeight: 0.6,
      letterSpacing: -0.21,      // em
      paragraphSpacing: 0.3,    // em，段间额外空白
      indent: 2,                // 首行缩进字符数
      textAlign: 'justify',
      compactness: 32           // 排版松紧度
    },
    // 字体
    font: {
      family: '上古宋体-Regular',
      fallback: 'serif',
      weight: '400'
    },
    // 油墨
    ink: {
      color: '#1A1008',         // 墨色
      opacity: 0.35,            // 墨色浓度默认35%
      variation: 0.12,          // 笔画粗细变化程度提高
      blurRadius: 0.5,          // 模糊半径增大
      misRegistration: 0.15,    // 套印不准程度提高
      damage: 0.08,             // 破损程度增加
      inkSpread: true,          // 启用墨色浸染
      inkSpreadIntensity: 0.6,  // 浸染强度
      weathering: true,         // 启用字风化
      weatheringIntensity: 0.3  // 风化强度
    },
    // 装饰
    decoration: {
      stamp: null,               // 印章
      watermark: {
        enabled: true,
        text: '铅言万语',
        fontSize: 40,
        opacity: 0.15,
        position: 'bottom-right'
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
      marginTop: 60,
      marginBottom: 60,
      marginLeft: 55,
      marginRight: 55,
      fontSize: 40,
      lineHeight: 1.8,
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
      opacity: 0.35,
      variation: 0.12,
      blurRadius: 0.5,
      misRegistration: 0.05,
      damage: 0.08
    },
    decoration: {
      stamp: {
        type: 'circle',
        text: '墨',
        color: '#8B4513',
        opacity: 0.6
      },
      watermark: {
        enabled: true,
        text: '墨宝',
        fontSize: 40,
        opacity: 0.12,
        position: 'bottom-center'
      },
      pageNumber: true
    }
  },

  // 3. 古籍雕版
  'ancient-block': {
    id: 'ancient-block',
    name: '古籍雕版',
    desc: '黄麻纸 · 宋体 · 行距1.8',
    category: 'horizontal',
    paper: {
      baseColor: '#F4E4C1',
      fiberOpacity: 0.32,
      ageOpacity: 0.45,
      grain: 'coarse',
      shadow: true,
      border: {
        enabled: true,
        style: 'double',
        width: 2,
        color: '#8B7355',
        margin: 20,
        gap: 8
      }
    },
    layout: {
      direction: 'horizontal',
      marginTop: 70,
      marginBottom: 70,
      marginLeft: 60,
      marginRight: 60,
      fontSize: 40,
      lineHeight: 1.8,
      letterSpacing: 0.04,
      paragraphSpacing: 0.6,
      indent: 2,
      textAlign: 'justify'
    },
    font: {
      family: '源流明体-Regular',
      fallback: 'serif',
      weight: '400'
    },
    ink: {
      color: '#1A1008',
      opacity: 0.35,
      variation: 0.08,
      blurRadius: 0.6,
      misRegistration: 0.12,
      damage: 0.05
    },
    decoration: {
      stamp: {
        type: 'square',
        text: '珍藏',
        color: '#A0522D',
        opacity: 0.5
      },
      watermark: {
        enabled: true,
        text: '善本',
        fontSize: 40,
        opacity: 0.10,
        position: 'top-center'
      },
      pageNumber: true
    }
  },

  // 4. 民国报纸
  'republic-newspaper': {
    id: 'republic-newspaper',
    name: '民国报纸',
    desc: '新闻纸 · 黑体 · 分两栏',
    category: 'horizontal',
    paper: {
      baseColor: '#E8E4DF',
      fiberOpacity: 0.20,
      ageOpacity: 0.30,
      grain: 'medium',
      shadow: false,
      border: null
    },
    layout: {
      direction: 'horizontal',
      columns: 2,
      columnGap: 30,
      marginTop: 40,
      marginBottom: 40,
      marginLeft: 45,
      marginRight: 45,
      fontSize: 40,
      lineHeight: 1.5,
      letterSpacing: 0.02,
      paragraphSpacing: 0.4,
      indent: 0,
      textAlign: 'justify'
    },
    font: {
      family: '思源宋体-Regular',
      fallback: 'serif',
      weight: '400'
    },
    ink: {
      color: '#1A1008',
      opacity: 0.35,
      variation: 0.03,
      blurRadius: 0.2,
      misRegistration: 0.03,
      damage: 0.03
    },
    decoration: {
      stamp: null,
      watermark: {
        enabled: true,
        text: '民国十年',
        fontSize: 40,
        opacity: 0.08,
        position: 'bottom-right'
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
      fontSize: 40,
      lineHeight: 1.7,
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
      opacity: 0.35,
      variation: 0.02,
      blurRadius: 0.1,
      misRegistration: 0.01,
      damage: 0
    },
    decoration: {
      stamp: null,
      watermark: {
        enabled: false
      },
      pageNumber: true
    }
  },

  // 6. 复古书信
  'vintage-letter': {
    id: 'vintage-letter',
    name: '复古书信',
    desc: '信纸 · 行书 · 温馨',
    category: 'horizontal',
    paper: {
      baseColor: '#FEF9E7',
      fiberOpacity: 0.15,
      ageOpacity: 0.15,
      grain: 'fine',
      shadow: true,
      border: {
        enabled: true,
        style: 'single',
        width: 1,
        color: '#D4C4A8',
        margin: 25,
        gap: 0
      }
    },
    layout: {
      direction: 'horizontal',
      marginTop: 65,
      marginBottom: 65,
      marginLeft: 55,
      marginRight: 55,
      fontSize: 40,
      lineHeight: 1.9,
      letterSpacing: 0.02,
      paragraphSpacing: 0.8,
      indent: 2,
      textAlign: 'left'
    },
    font: {
      family: '霞鹜文楷-Regular',
      fallback: 'serif',
      weight: '400'
    },
    ink: {
      color: '#3D2914',
      opacity: 0.35,
      variation: 0.15,
      blurRadius: 0.4,
      misRegistration: 0.04,
      damage: 0.02
    },
    decoration: {
      stamp: {
        type: 'circle',
        text: '手札',
        color: '#CD5C5C',
        opacity: 0.4
      },
      watermark: {
        enabled: true,
        text: '手札',
        fontSize: 40,
        opacity: 0.08,
        position: 'bottom-center'
      },
      pageNumber: false
    }
  },

  // 7. 佛经抄本
  'buddhist-scripture': {
    id: 'buddhist-scripture',
    name: '佛经抄本',
    desc: '黄纸 · 楷书 · 竖排',
    category: 'vertical',
    paper: {
      baseColor: '#F9E4B7',
      fiberOpacity: 0.22,
      ageOpacity: 0.40,
      grain: 'medium',
      shadow: true,
      border: {
        enabled: true,
        style: 'single',
        width: 1,
        color: '#B8860B',
        margin: 30,
        gap: 0
      }
    },
    layout: {
      direction: 'vertical',
      marginTop: 70,
      marginBottom: 70,
      marginLeft: 60,
      marginRight: 60,
      fontSize: 40,
      lineHeight: 2.0,
      letterSpacing: 0.05,
      paragraphSpacing: 1.0,
      indent: 0,
      textAlign: 'justify'
    },
    font: {
      family: '源流明体-Regular',
      fallback: 'serif',
      weight: '400'
    },
    ink: {
      color: '#1A1008',
      opacity: 0.35,
      variation: 0.06,
      blurRadius: 0.5,
      misRegistration: 0.06,
      damage: 0.04
    },
    decoration: {
      stamp: {
        type: 'circle',
        text: '佛',
        color: '#8B4513',
        opacity: 0.5
      },
      watermark: {
        enabled: true,
        text: '般若波罗蜜',
        fontSize: 40,
        opacity: 0.06,
        position: 'center'
      },
      pageNumber: true
    }
  },

  // 8. 打字机风格
  'typewriter': {
    id: 'typewriter',
    name: '打字机',
    desc: '白纸 · 等宽 · 机械感',
    category: 'horizontal',
    paper: {
      baseColor: '#FFFFFF',
      fiberOpacity: 0.05,
      ageOpacity: 0.08,
      grain: 'fine',
      shadow: false,
      border: null
    },
    layout: {
      direction: 'horizontal',
      marginTop: 45,
      marginBottom: 45,
      marginLeft: 50,
      marginRight: 50,
      fontSize: 40,
      lineHeight: 1.6,
      letterSpacing: 0.03,
      paragraphSpacing: 0.5,
      indent: 0,
      textAlign: 'left'
    },
    font: {
      family: '朝華打字機-Regular',
      fallback: 'monospace',
      weight: '400'
    },
    ink: {
      color: '#1A1008',
      opacity: 0.35,
      variation: 0.02,
      blurRadius: 0.1,
      misRegistration: 0.02,
      damage: 0.05
    },
    decoration: {
      stamp: null,
      watermark: {
        enabled: true,
        text: 'TYPEWRITER',
        fontSize: 40,
        opacity: 0.05,
        position: 'bottom-right'
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
      fontSize: 40,
      lineHeight: 1.8,
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
      opacity: 0.35,
      variation: 0.08,
      blurRadius: 0.3,
      misRegistration: 0.04,
      damage: 0.03
    },
    decoration: {
      stamp: {
        type: 'square',
        text: '印',
        color: '#8B4513',
        opacity: 0.4
      },
      watermark: {
        enabled: true,
        text: '和',
        fontSize: 40,
        opacity: 0.08,
        position: 'top-right'
      },
      pageNumber: true
    }
  },

  // 10. 极简白纸
  'minimal-white': {
    id: 'minimal-white',
    name: '极简白纸',
    desc: '纯白 · 无装饰',
    category: 'horizontal',
    paper: {
      baseColor: '#FFFFFF',
      fiberOpacity: 0,
      ageOpacity: 0,
      grain: 'fine',
      shadow: false,
      border: null
    },
    layout: {
      direction: 'horizontal',
      marginTop: 40,
      marginBottom: 40,
      marginLeft: 45,
      marginRight: 45,
      fontSize: 40,
      lineHeight: 1.6,
      letterSpacing: 0.01,
      paragraphSpacing: 0.5,
      indent: 2,
      textAlign: 'justify'
    },
    font: {
      family: '思源宋体-Regular',
      fallback: 'serif',
      weight: '400'
    },
    ink: {
      color: '#1A1008',
      opacity: 1.0,
      variation: 0,
      blurRadius: 0,
      misRegistration: 0,
      damage: 0
    },
    decoration: {
      stamp: null,
      watermark: {
        enabled: false
      },
      pageNumber: false
    }
  },

  // 11. 仿古宣纸
  'ancient-xuan': {
    id: 'ancient-xuan',
    name: '仿古宣纸',
    desc: '宣纸 · 淡墨 · 古风',
    category: 'horizontal',
    paper: {
      baseColor: '#F5F0E6',
      fiberOpacity: 0.28,
      ageOpacity: 0.25,
      grain: 'medium',
      shadow: true,
      border: {
        enabled: true,
        style: 'single',
        width: 1,
        color: '#D4C4A8',
        margin: 35,
        gap: 0
      }
    },
    layout: {
      direction: 'horizontal',
      marginTop: 60,
      marginBottom: 60,
      marginLeft: 55,
      marginRight: 55,
      fontSize: 40,
      lineHeight: 1.8,
      letterSpacing: 0.03,
      paragraphSpacing: 0.6,
      indent: 2,
      textAlign: 'justify'
    },
    font: {
      family: '霞鹜文楷-Regular',
      fallback: 'serif',
      weight: '400'
    },
    ink: {
      color: '#2D1F14',
      opacity: 0.35,
      variation: 0.10,
      blurRadius: 0.45,
      misRegistration: 0.06,
      damage: 0.04
    },
    decoration: {
      stamp: {
        type: 'circle',
        text: '墨',
        color: '#8B4513',
        opacity: 0.45
      },
      watermark: {
        enabled: true,
        text: '宣纸',
        fontSize: 40,
        opacity: 0.08,
        position: 'bottom-center'
      },
      pageNumber: true
    }
  },

  // 12. 牛皮信纸
  'kraft-paper': {
    id: 'kraft-paper',
    name: '牛皮信纸',
    desc: '牛皮纸 · 复古 · 书信',
    category: 'horizontal',
    paper: {
      baseColor: '#D4B896',
      fiberOpacity: 0.22,
      ageOpacity: 0.30,
      grain: 'coarse',
      shadow: true,
      border: null
    },
    layout: {
      direction: 'horizontal',
      marginTop: 70,
      marginBottom: 70,
      marginLeft: 60,
      marginRight: 60,
      fontSize: 40,
      lineHeight: 1.75,
      letterSpacing: 0.04,
      paragraphSpacing: 0.7,
      indent: 2,
      textAlign: 'justify'
    },
    font: {
      family: '方正书宋-Regular',
      fallback: 'serif',
      weight: '400'
    },
    ink: {
      color: '#1A0A00',
      opacity: 0.35,
      variation: 0.08,
      blurRadius: 0.5,
      misRegistration: 0.08,
      damage: 0.06
    },
    decoration: {
      stamp: {
        type: 'square',
        text: '手札',
        color: '#8B4513',
        opacity: 0.35
      },
      watermark: {
        enabled: true,
        text: 'KRAFT',
        fontSize: 40,
        opacity: 0.06,
        position: 'bottom-right'
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
      fontSize: 40,
      lineHeight: 1.65,
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
      opacity: 0.35,
      variation: 0.03,
      blurRadius: 0.15,
      misRegistration: 0.02,
      damage: 0.02
    },
    decoration: {
      stamp: null,
      watermark: {
        enabled: false
      },
      pageNumber: false
    }
  },

  // 14. 羊皮纸
  'parchment': {
    id: 'parchment',
    name: '羊皮纸',
    desc: '羊皮纸 · 古典 · 珍贵',
    category: 'horizontal',
    paper: {
      baseColor: '#F4E4BC',
      fiberOpacity: 0.35,
      ageOpacity: 0.45,
      grain: 'medium',
      shadow: true,
      border: {
        enabled: true,
        style: 'double',
        width: 2,
        color: '#A08060',
        margin: 25,
        gap: 6
      }
    },
    layout: {
      direction: 'horizontal',
      marginTop: 75,
      marginBottom: 75,
      marginLeft: 65,
      marginRight: 65,
      fontSize: 40,
      lineHeight: 1.9,
      letterSpacing: 0.05,
      paragraphSpacing: 0.8,
      indent: 2,
      textAlign: 'justify'
    },
    font: {
      family: '源流明体-Regular',
      fallback: 'serif',
      weight: '400'
    },
    ink: {
      color: '#150A00',
      opacity: 0.35,
      variation: 0.07,
      blurRadius: 0.55,
      misRegistration: 0.10,
      damage: 0.05
    },
    decoration: {
      stamp: {
        type: 'circle',
        text: '御',
        color: '#8B4513',
        opacity: 0.5
      },
      watermark: {
        enabled: true,
        text: 'Imperial',
        fontSize: 40,
        opacity: 0.06,
        position: 'top-center'
      },
      pageNumber: true
    }
  },

  // 15. 复古日记
  'vintage-diary': {
    id: 'vintage-diary',
    name: '复古日记',
    desc: '日记本 · 温馨 · 怀旧',
    category: 'horizontal',
    paper: {
      baseColor: '#FAF3E0',
      fiberOpacity: 0.18,
      ageOpacity: 0.18,
      grain: 'fine',
      shadow: true,
      border: {
        enabled: true,
        style: 'single',
        width: 1,
        color: '#C4B5A0',
        margin: 20,
        gap: 0
      }
    },
    layout: {
      direction: 'horizontal',
      marginTop: 80,
      marginBottom: 80,
      marginLeft: 50,
      marginRight: 50,
      fontSize: 40,
      lineHeight: 1.85,
      letterSpacing: 0.02,
      paragraphSpacing: 0.7,
      indent: 2,
      textAlign: 'left'
    },
    font: {
      family: '寒蝉锦书宋-Regular',
      fallback: 'serif',
      weight: '400'
    },
    ink: {
      color: '#3D2914',
      opacity: 0.35,
      variation: 0.12,
      blurRadius: 0.35,
      misRegistration: 0.04,
      damage: 0.03
    },
    decoration: {
      stamp: {
        type: 'circle',
        text: '忆',
        color: '#CD5C5C',
        opacity: 0.35
      },
      watermark: {
        enabled: true,
        text: 'Diary',
        fontSize: 40,
        opacity: 0.05,
        position: 'bottom-right'
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
      marginLeft: 55,
      marginRight: 55,
      fontSize: 40,
      lineHeight: 1.7,
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
      opacity: 0.35,
      variation: 0.02,
      blurRadius: 0.1,
      misRegistration: 0.01,
      damage: 0
    },
    decoration: {
      stamp: null,
      watermark: {
        enabled: false
      },
      pageNumber: true
    }
  },

  // 17. 书法宣纸
  'calligraphy-xuan': {
    id: 'calligraphy-xuan',
    name: '书法宣纸',
    desc: '宣纸 · 毛笔 · 竖排',
    category: 'vertical',
    paper: {
      baseColor: '#F0E6D6',
      fiberOpacity: 0.30,
      ageOpacity: 0.20,
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
      fontSize: 40,
      lineHeight: 1.9,
      letterSpacing: 0.04,
      paragraphSpacing: 0.8,
      indent: 0,
      textAlign: 'justify'
    },
    font: {
      family: '霞鹜文楷-Regular',
      fallback: 'serif',
      weight: '400'
    },
    ink: {
      color: '#1A1008',
      opacity: 0.35,
      variation: 0.15,
      blurRadius: 0.6,
      misRegistration: 0.05,
      damage: 0.06
    },
    decoration: {
      stamp: {
        type: 'square',
        text: '书',
        color: '#8B4513',
        opacity: 0.4
      },
      watermark: {
        enabled: true,
        text: '墨香',
        fontSize: 40,
        opacity: 0.10,
        position: 'center'
      },
      pageNumber: true
    }
  },

  // 18. 复古印刷
  'vintage-print': {
    id: 'vintage-print',
    name: '复古印刷',
    desc: '老旧印刷 · 斑驳 · 年代感',
    category: 'horizontal',
    paper: {
      baseColor: '#E8E0D0',
      fiberOpacity: 0.25,
      ageOpacity: 0.35,
      grain: 'coarse',
      shadow: true,
      border: null
    },
    layout: {
      direction: 'horizontal',
      marginTop: 55,
      marginBottom: 55,
      marginLeft: 50,
      marginRight: 50,
      fontSize: 40,
      lineHeight: 1.75,
      letterSpacing: 0.03,
      paragraphSpacing: 0.5,
      indent: 2,
      textAlign: 'justify'
    },
    font: {
      family: '朝華打字機-Regular',
      fallback: 'monospace',
      weight: '400'
    },
    ink: {
      color: '#1A1008',
      opacity: 0.35,
      variation: 0.10,
      blurRadius: 0.4,
      misRegistration: 0.12,
      damage: 0.08
    },
    decoration: {
      stamp: null,
      watermark: {
        enabled: true,
        text: 'VINTAGE',
        fontSize: 40,
        opacity: 0.06,
        position: 'bottom-left'
      },
      pageNumber: true
    }
  }
}

// 合并 moban 模板
for (const key of MOBAN_ORDER) {
  if (MOBAN_TEMPLATES[key]) {
    TEMPLATES[key] = MOBAN_TEMPLATES[key]
  }
}

// 模板顺序（内置 + moban）
const TEMPLATE_ORDER = [
  'modern-prose',
  'ancient-manuscript',
  'ancient-block',
  'republic-newspaper',
  'modern-magazine',
  'vintage-letter',
  'buddhist-scripture',
  'typewriter',
  'japanese-washi',
  'minimal-white',
  'ancient-xuan',
  'kraft-paper',
  'draft-paper',
  'parchment',
  'vintage-diary',
  'modern-minimal',
  'calligraphy-xuan',
  'vintage-print',
  ...MOBAN_ORDER
]

// 默认模板ID
const DEFAULT_TEMPLATE_ID = 'modern-prose'

/**
 * 校验模板配置是否有效
 * @param {string} templateId - 模板ID
 * @returns {object|null} 有效模板配置或null
 */
function validateTemplate(templateId) {
  const template = TEMPLATES[templateId]
  if (!template) {
    console.warn('[template] 模板不存在:', templateId)
    return null
  }
  
  const errors = []
  
  if (!template.id || !template.name) {
    errors.push('缺少必要的 id 或 name 字段')
  }
  
  if (template.paper) {
    if (!template.paper.baseColor) {
      errors.push('纸张配置缺少 baseColor')
    }
  } else {
    errors.push('缺少 paper 配置')
  }
  
  if (template.layout) {
    if (template.layout.fontSize == null || template.layout.fontSize <= 0) {
      errors.push('排版配置缺少有效 fontSize')
    }
  } else {
    errors.push('缺少 layout 配置')
  }
  
  if (template.font) {
    if (!template.font.family) {
      errors.push('字体配置缺少 family')
    }
  } else {
    errors.push('缺少 font 配置')
  }
  
  if (template.ink) {
    if (!template.ink.color) {
      errors.push('油墨配置缺少 color')
    }
    if (template.ink.opacity == null || template.ink.opacity < 0 || template.ink.opacity > 1) {
      errors.push('油墨配置的 opacity 无效')
    }
  } else {
    errors.push('缺少 ink 配置')
  }
  
  if (errors.length > 0) {
    console.warn('[template] 模板配置错误:', templateId, errors)
    return null
  }
  
  return template
}

/**
 * 获取所有可用模板列表（已过滤无效模板）
 * @returns {Array} 模板列表
 */
function getValidTemplates() {
  const validTemplates = []
  for (const key of TEMPLATE_ORDER) {
    const template = validateTemplate(key)
    if (template) {
      validTemplates.push({
        id: template.id,
        name: template.name,
        desc: template.desc,
        category: template.category
      })
    }
  }
  return validTemplates
}

// ============================================================
// 纸张尺寸预设（单位：mm）
// ============================================================
const PAPER_SIZES = {
  'a4': { id: 'a4', name: 'A4', width: 210, height: 297, unit: 'mm', desc: '210 × 297 mm' },
  'a5': { id: 'a5', name: 'A5', width: 148, height: 210, unit: 'mm', desc: '148 × 210 mm' },
  'a3': { id: 'a3', name: 'A3', width: 297, height: 420, unit: 'mm', desc: '297 × 420 mm' },
  'b4': { id: 'b4', name: 'B4', width: 250, height: 353, unit: 'mm', desc: '250 × 353 mm' },
  'b5': { id: 'b5', name: 'B5', width: 176, height: 250, unit: 'mm', desc: '176 × 250 mm' },
  'letter': { id: 'letter', name: 'Letter', width: 215.9, height: 279.4, unit: 'mm', desc: '8.5 × 11 in' },
  'legal': { id: 'legal', name: 'Legal', width: 215.9, height: 355.6, unit: 'mm', desc: '8.5 × 14 in' },
  'tabloid': { id: 'tabloid', name: 'Tabloid', width: 279.4, height: 431.8, unit: 'mm', desc: '11 × 17 in' },
  'executive': { id: 'executive', name: 'Executive', width: 184.15, height: 266.7, unit: 'mm', desc: '7.25 × 10.5 in' }
}

// 云存储: 需在微信开发者工具云存储上传对应文件后填入 fileID

//
// fontId 命名规范：{家族}-{字重}（中间用英文连字符）
// displayName：用户可见名称（不含字重后缀）
// fileSize：字节数（用于展示"下载此字体可能产生流量"警告）
// ============================================================
// 云环境ID（短ID用于fileID第一段，完整ID用于第二段）
const CLOUD_ENV_SHORT = 'cloud1-d6g9rv89829bcd240'
const CLOUD_ENV_FULL = '636c-cloud1-d6g9rv89829bcd240-1434021718'
const FONTS_BASE_PATH = 'fonts_full'

function makeFileID(folder, filename) {
  // 注意：fileID 中的中文字符不需要 encodeURIComponent
  // 云存储控制台显示的 fileID 就是原始中文字符路径
  return `cloud://${CLOUD_ENV_SHORT}.${CLOUD_ENV_FULL}/fonts_full/${folder}/${filename}`
}

const BUILT_IN_FONTS = [
  // ---- 字体文件直接放在 fonts_full/ 根目录下 ----
  { id: '上古宋体-Regular', name: '上古宋体', family: '上古宋体-Regular', fileID: `cloud://${CLOUD_ENV_SHORT}.${CLOUD_ENV_FULL}/fonts_full/上古宋体-Regular.ttf`, weight: '400', style: 'normal', fileSize: 23646152 },
  { id: '思源宋体-Regular', name: '思源宋体', family: '思源宋体-Regular', fileID: `cloud://${CLOUD_ENV_SHORT}.${CLOUD_ENV_FULL}/fonts_full/思源宋体-Regular.otf`, weight: '400', style: 'normal', fileSize: 24543332 },
  { id: '文源宋体-Regular', name: '文源宋体', family: '文源宋体-Regular', fileID: `cloud://${CLOUD_ENV_SHORT}.${CLOUD_ENV_FULL}/fonts_full/文源宋体-Regular.ttf`, weight: '400', style: 'normal', fileSize: 14800000 },
  { id: '霞鹜文楷-Regular', name: '霞鹜文楷', family: '霞鹜文楷-Regular', fileID: `cloud://${CLOUD_ENV_SHORT}.${CLOUD_ENV_FULL}/fonts_full/霞鹜文楷-Regular.ttf`, weight: '400', style: 'normal', fileSize: 24300000 },
  { id: '源流明体-Regular', name: '源流明体', family: '源流明体-Regular', fileID: `cloud://${CLOUD_ENV_SHORT}.${CLOUD_ENV_FULL}/fonts_full/源流明体-Regular.otf`, weight: '400', style: 'normal', fileSize: 16600000 },
  { id: '源起明体-Regular', name: '源起明体', family: '源起明体-Regular', fileID: `cloud://${CLOUD_ENV_SHORT}.${CLOUD_ENV_FULL}/fonts_full/源起明体-Regular.ttc`, weight: '400', style: 'normal', fileSize: 15800000 },
  { id: '昭源宋体-Regular', name: '昭源宋体', family: '昭源宋体-Regular', fileID: `cloud://${CLOUD_ENV_SHORT}.${CLOUD_ENV_FULL}/fonts_full/昭源宋体-Regular.ttf`, weight: '400', style: 'normal', fileSize: 23600000 },
  { id: '汇文明朝体-Regular', name: '汇文明朝体', family: '汇文明朝体-Regular', fileID: `cloud://${CLOUD_ENV_SHORT}.${CLOUD_ENV_FULL}/fonts_full/汇文明朝体-Regular.otf`, weight: '400', style: 'normal', fileSize: 23900000 },
  { id: '空心晴宋体-Regular', name: '空心晴宋体', family: '空心晴宋体-Regular', fileID: `cloud://${CLOUD_ENV_SHORT}.${CLOUD_ENV_FULL}/fonts_full/空心晴宋体-Regular.ttf`, weight: '400', style: 'normal', fileSize: 40300000 },
  { id: '梦源宋体-Regular', name: '梦源宋体', family: '梦源宋体-Regular', fileID: `cloud://${CLOUD_ENV_SHORT}.${CLOUD_ENV_FULL}/fonts_full/梦源宋体-Regular.ttf`, weight: '400', style: 'normal', fileSize: 15000000 },
  { id: '屏显臻宋-Regular', name: '屏显臻宋', family: '屏显臻宋-Regular', fileID: `cloud://${CLOUD_ENV_SHORT}.${CLOUD_ENV_FULL}/fonts_full/屏显臻宋-Regular.ttf`, weight: '400', style: 'normal', fileSize: 13600000 },
  { id: '迫真打字油印体-Regular', name: '迫真打字油印体', family: '迫真打字油印体-Regular', fileID: `cloud://${CLOUD_ENV_SHORT}.${CLOUD_ENV_FULL}/fonts_full/迫真打字油印体-Regular.ttf`, weight: '400', style: 'normal', fileSize: 35000000 },
  { id: '朝華打字機-Regular', name: '朝華打字機', family: '朝華打字機-Regular', fileID: `cloud://${CLOUD_ENV_SHORT}.${CLOUD_ENV_FULL}/fonts_full/朝華打字機-Regular.ttf`, weight: '400', style: 'normal', fileSize: 26200000 },
  { id: '初夏宋体-Regular', name: '初夏宋体', family: '初夏宋体-Regular', fileID: `cloud://${CLOUD_ENV_SHORT}.${CLOUD_ENV_FULL}/fonts_full/初夏宋体-Regular.ttf`, weight: '400', style: 'normal', fileSize: 16600000 },
  { id: '繁媛明朝-Regular', name: '繁媛明朝', family: '繁媛明朝-Regular', fileID: `cloud://${CLOUD_ENV_SHORT}.${CLOUD_ENV_FULL}/fonts_full/繁媛明朝-Regular.ttf`, weight: '400', style: 'normal', fileSize: 6400000 },
  { id: '方正书宋-Regular', name: '方正书宋', family: '方正书宋-Regular', fileID: `cloud://${CLOUD_ENV_SHORT}.${CLOUD_ENV_FULL}/fonts_full/方正书宋-Regular.ttf`, weight: '400', style: 'normal', fileSize: 2940000 },
  { id: '寒蝉锦书宋-Regular', name: '寒蝉锦书宋', family: '寒蝉锦书宋-Regular', fileID: `cloud://${CLOUD_ENV_SHORT}.${CLOUD_ENV_FULL}/fonts_full/寒蝉锦书宋-Regular.otf`, weight: '400', style: 'normal', fileSize: 24600000 }
]

module.exports = {
  TEMPLATES,
  TEMPLATE_ORDER,
  DEFAULT_TEMPLATE_ID,
  PAPER_SIZES,
  BUILT_IN_FONTS,
  makeFileID,
  CLOUD_ENV_SHORT,
  CLOUD_ENV_FULL,
  validateTemplate,
  getValidTemplates
}