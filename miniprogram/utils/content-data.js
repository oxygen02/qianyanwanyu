// utils/content-data.js
// 问典页面数据源 - 经典诗词名句素材库

const categories = [
  { id: 'all', name: '全部' },
  { id: 'tangshi', name: '唐诗' },
  { id: 'songci', name: '宋词' },
  { id: 'mingju', name: '名句' },
  { id: 'jingdian', name: '经典' },
  { id: 'duilian', name: '对联' }
]

const contentDB = [
  // 唐诗
  {
    id: 'ts_001',
    category: 'tangshi',
    title: '静夜思',
    author: '李白',
    dynasty: '唐',
    content: '床前明月光，疑是地上霜。\n举头望明月，低头思故乡。',
    annotations: {
      '床': '井栏，一说为睡床',
      '疑': '怀疑，以为',
      '举头': '抬头'
    },
    translation: '明亮的月光洒在床前的窗户纸上，好像地上泛起了一层霜。我禁不住抬起头来，看那天窗外空中的一轮明月，不由得低头沉思，想起远方的家乡。',
    appreciation: '这首诗写的是在寂静的月夜思念家乡的感受。诗的前两句，是写诗人在作客他乡的特定环境中一刹那间所产生的错觉。一个独处他乡的人，白天奔波忙碌，倒还能冲淡离愁，然而一到夜深人静的时候，心头就难免泛起阵阵思念故乡的波澜。',
    backgroundStory: '李白于唐玄宗开元十四年（726年）旧历九月十五日夜，在扬州旅舍所作。',
    tags: ['思乡', '月亮', '经典', '五言绝句'],
    popularity: 98
  },
  {
    id: 'ts_002',
    category: 'tangshi',
    title: '春晓',
    author: '孟浩然',
    dynasty: '唐',
    content: '春眠不觉晓，处处闻啼鸟。\n夜来风雨声，花落知多少。',
    annotations: {
      '晓': '天亮',
      '闻': '听见',
      '啼鸟': '鸟叫'
    },
    tags: ['春天', '自然', '经典', '五言绝句'],
    popularity: 96
  },
  {
    id: 'ts_003',
    category: 'tangshi',
    title: '登鹳雀楼',
    author: '王之涣',
    dynasty: '唐',
    content: '白日依山尽，黄河入海流。\n欲穷千里目，更上一层楼。',
    annotations: {
      '白日': '太阳',
      '穷': '尽，使达到极点'
    },
    tags: ['励志', '登高', '哲理', '五言绝句'],
    popularity: 97
  },
  {
    id: 'ts_004',
    category: 'tangshi',
    title: '望庐山瀑布',
    author: '李白',
    dynasty: '唐',
    content: '日照香炉生紫烟，遥看瀑布挂前川。\n飞流直下三千尺，疑是银河落九天。',
    annotations: {
      '香炉': '香炉峰',
      '九天': '天的最高处'
    },
    tags: ['山水', '壮丽', '七言绝句'],
    popularity: 95
  },
  {
    id: 'ts_005',
    category: 'tangshi',
    title: '早发白帝城',
    author: '李白',
    dynasty: '唐',
    content: '朝辞白帝彩云间，千里江陵一日还。\n两岸猿声啼不住，轻舟已过万重山。',
    annotations: {
      '白帝': '白帝城',
      '江陵': '今湖北荆州',
      '猿声': '猿猴的叫声'
    },
    tags: ['山水', '行旅', '七言绝句'],
    popularity: 94
  },
  {
    id: 'ts_006',
    category: 'tangshi',
    title: '送元二使安西',
    author: '王维',
    dynasty: '唐',
    content: '渭城朝雨浥轻尘，客舍青青柳色新。\n劝君更尽一杯酒，西出阳关无故人。',
    annotations: {
      '浥': '湿润',
      '阳关': '今甘肃敦煌西南'
    },
    tags: ['送别', '友情', '七言绝句'],
    popularity: 93
  },
  {
    id: 'ts_007',
    category: 'tangshi',
    title: '相思',
    author: '王维',
    dynasty: '唐',
    content: '红豆生南国，春来发几枝。\n愿君多采撷，此物最相思。',
    annotations: {
      '红豆': '相思子',
      '采撷': '采摘'
    },
    tags: ['爱情', '相思', '五言绝句'],
    popularity: 95
  },
  {
    id: 'ts_008',
    category: 'tangshi',
    title: '江雪',
    author: '柳宗元',
    dynasty: '唐',
    content: '千山鸟飞绝，万径人踪灭。\n孤舟蓑笠翁，独钓寒江雪。',
    annotations: {
      '绝': '无，没有',
      '蓑笠': '蓑衣和斗笠'
    },
    tags: ['孤独', '冬雪', '意境', '五言绝句'],
    popularity: 92
  },

  // 宋词
  {
    id: 'sc_001',
    category: 'songci',
    title: '水调歌头·明月几时有',
    author: '苏轼',
    dynasty: '宋',
    content: '明月几时有？把酒问青天。\n不知天上宫阙，今夕是何年。\n我欲乘风归去，又恐琼楼玉宇，高处不胜寒。\n起舞弄清影，何似在人间。\n\n转朱阁，低绮户，照无眠。\n不应有恨，何事长向别时圆？\n人有悲欢离合，月有阴晴圆缺，此事古难全。\n但愿人长久，千里共婵娟。',
    annotations: {
      '宫阙': '宫殿',
      '婵娟': '月亮'
    },
    tags: ['中秋', '月亮', '哲理', '豪放'],
    popularity: 99
  },
  {
    id: 'sc_002',
    category: 'songci',
    title: '念奴娇·赤壁怀古',
    author: '苏轼',
    dynasty: '宋',
    content: '大江东去，浪淘尽，千古风流人物。\n故垒西边，人道是，三国周郎赤壁。\n乱石穿空，惊涛拍岸，卷起千堆雪。\n江山如画，一时多少豪杰。\n\n遥想公瑾当年，小乔初嫁了，雄姿英发。\n羽扇纶巾，谈笑间，樯橹灰飞烟灭。\n故国神游，多情应笑我，早生华发。\n人生如梦，一尊还酹江月。',
    annotations: {
      '周郎': '周瑜',
      '纶巾': '青丝带头巾',
      '酹': '洒酒祭奠'
    },
    tags: ['怀古', '豪放', '赤壁'],
    popularity: 97
  },
  {
    id: 'sc_003',
    category: 'songci',
    title: '声声慢·寻寻觅觅',
    author: '李清照',
    dynasty: '宋',
    content: '寻寻觅觅，冷冷清清，凄凄惨惨戚戚。\n乍暖还寒时候，最难将息。\n三杯两盏淡酒，怎敌他、晚来风急？\n雁过也，正伤心，却是旧时相识。\n\n满地黄花堆积。憔悴损，如今有谁堪摘？\n守着窗儿，独自怎生得黑？\n梧桐更兼细雨，到黄昏、点点滴滴。\n这次第，怎一个愁字了得！',
    annotations: {
      '戚戚': '忧愁的样子',
      '将息': '调养休息',
      '次第': '光景，情形'
    },
    tags: ['婉约', '愁绪', '秋思'],
    popularity: 95
  },
  {
    id: 'sc_004',
    category: 'songci',
    title: '雨霖铃·寒蝉凄切',
    author: '柳永',
    dynasty: '宋',
    content: '寒蝉凄切，对长亭晚，骤雨初歇。\n都门帐饮无绪，留恋处，兰舟催发。\n执手相看泪眼，竟无语凝噎。\n念去去，千里烟波，暮霭沉沉楚天阔。\n\n多情自古伤离别，更那堪，冷落清秋节！\n今宵酒醒何处？杨柳岸，晓风残月。\n此去经年，应是良辰好景虚设。\n便纵有千种风情，更与何人说？',
    annotations: {
      '长亭': '古代送别之地',
      '凝噎': '喉咙哽塞说不出话'
    },
    tags: ['送别', '婉约', '离别'],
    popularity: 94
  },

  // 名句
  {
    id: 'mj_001',
    category: 'mingju',
    title: '天行健',
    author: '《周易》',
    dynasty: '先秦',
    content: '天行健，君子以自强不息。\n地势坤，君子以厚德载物。',
    annotations: {
      '行': '运行',
      '健': '刚健'
    },
    tags: ['励志', '哲理', '经典'],
    popularity: 99
  },
  {
    id: 'mj_002',
    category: 'mingju',
    title: '上善若水',
    author: '《道德经》',
    dynasty: '先秦',
    content: '上善若水。水善利万物而不争，处众人之所恶，故几于道。',
    annotations: {
      '上善': '最高的善',
      '几': '接近'
    },
    tags: ['哲理', '修身', '道家'],
    popularity: 96
  },
  {
    id: 'mj_003',
    category: 'mingju',
    title: '路漫漫其修远兮',
    author: '屈原',
    dynasty: '先秦',
    content: '路漫漫其修远兮，吾将上下而求索。',
    annotations: {
      '修远': '长远'
    },
    tags: ['励志', '求索', '楚辞'],
    popularity: 95
  },
  {
    id: 'mj_004',
    category: 'mingju',
    title: '不以物喜，不以己悲',
    author: '范仲淹',
    dynasty: '宋',
    content: '不以物喜，不以己悲。\n居庙堂之高则忧其民，处江湖之远则忧其君。',
    tags: ['修身', '哲理', '胸怀'],
    popularity: 93
  },
  {
    id: 'mj_005',
    category: 'mingju',
    title: '海纳百川',
    author: '林则徐',
    dynasty: '清',
    content: '海纳百川，有容乃大；\n壁立千仞，无欲则刚。',
    tags: ['修身', '格局', '励志'],
    popularity: 94
  },
  {
    id: 'mj_006',
    category: 'mingju',
    title: '勿以恶小而为之',
    author: '刘备',
    dynasty: '三国',
    content: '勿以恶小而为之，勿以善小而不为。',
    tags: ['修身', '劝诫', '哲理'],
    popularity: 92
  },

  // 经典
  {
    id: 'jd_001',
    category: 'jingdian',
    title: '论语·学而篇',
    author: '孔子及其弟子',
    dynasty: '先秦',
    content: '学而时习之，不亦说乎？\n有朋自远方来，不亦乐乎？\n人不知而不愠，不亦君子乎？',
    annotations: {
      '说': '通"悦"，愉快',
      '愠': '怨恨'
    },
    tags: ['论语', '修身', '经典'],
    popularity: 98
  },
  {
    id: 'jd_002',
    category: 'jingdian',
    title: '论语·为政篇',
    author: '孔子及其弟子',
    dynasty: '先秦',
    content: '吾十有五而志于学，三十而立，四十而不惑，五十而知天命，六十而耳顺，七十而从心所欲，不逾矩。',
    tags: ['论语', '人生', '经典'],
    popularity: 96
  },
  {
    id: 'jd_003',
    category: 'jingdian',
    title: '道德经·第一章',
    author: '老子',
    dynasty: '先秦',
    content: '道可道，非常道；名可名，非常名。\n无名，天地之始；有名，万物之母。',
    tags: ['道家', '哲理', '经典'],
    popularity: 95
  },
  {
    id: 'jd_004',
    category: 'jingdian',
    title: '诗经·关雎',
    author: '佚名',
    dynasty: '先秦',
    content: '关关雎鸠，在河之洲。\n窈窕淑女，君子好逑。\n\n参差荇菜，左右流之。\n窈窕淑女，寤寐求之。',
    annotations: {
      '雎鸠': '一种水鸟',
      '窈窕': '美好的样子',
      '寤寐': '醒时和睡时'
    },
    tags: ['诗经', '爱情', '经典'],
    popularity: 94
  },

  // 对联
  {
    id: 'dl_001',
    category: 'duilian',
    title: '通用春联',
    author: '佚名',
    dynasty: '传统',
    content: '上联：一元复始春回地\n下联：万象更新福满门\n横批：万象更新',
    tags: ['春联', '吉祥', '通用'],
    popularity: 90
  },
  {
    id: 'dl_002',
    category: 'duilian',
    title: '书房联',
    author: '郑板桥',
    dynasty: '清',
    content: '上联：删繁就简三秋树\n下联：领异标新二月花\n横批：独树一帜',
    tags: ['书房', '艺术', '创新'],
    popularity: 88
  },
  {
    id: 'dl_003',
    category: 'duilian',
    title: '励志联',
    author: '佚名',
    dynasty: '传统',
    content: '上联：书山有路勤为径\n下联：学海无涯苦作舟\n横批：学无止境',
    tags: ['励志', '学习', '经典'],
    popularity: 92
  },
  {
    id: 'dl_004',
    category: 'duilian',
    title: '修身联',
    author: '佚名',
    dynasty: '传统',
    content: '上联：静坐常思己过\n下联：闲谈莫论人非\n横批：慎独',
    tags: ['修身', '劝诫', '哲理'],
    popularity: 89
  }
]

function getAllTags() {
  const tagSet = new Set()
  contentDB.forEach(item => {
    if (item.tags) {
      item.tags.forEach(tag => tagSet.add(tag))
    }
  })
  return Array.from(tagSet).sort()
}

function getByCategory(categoryId) {
  if (!categoryId || categoryId === 'all') return contentDB
  return contentDB.filter(item => item.category === categoryId)
}

function search(keyword) {
  if (!keyword) return contentDB
  const kw = keyword.toLowerCase()
  return contentDB.filter(item =>
    (item.title && item.title.toLowerCase().includes(kw)) ||
    (item.author && item.author.toLowerCase().includes(kw)) ||
    (item.content && item.content.toLowerCase().includes(kw)) ||
    (item.tags && item.tags.some(t => t.toLowerCase().includes(kw)))
  )
}

module.exports = {
  categories,
  contentDB,
  getAllTags,
  getByCategory,
  search
}
