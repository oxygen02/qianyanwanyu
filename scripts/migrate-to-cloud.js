// scripts/migrate-to-cloud.js
// 将本地诗词数据导入微信云数据库
// 使用方法：在微信开发者工具云控制台中运行

const contentData = require('../miniprogram/utils/content-data.js')

async function migrate() {
  const db = wx.cloud.database()
  const poems = db.collection('poems')

  const contentDB = contentData.contentDB

  console.log(`准备导入 ${contentDB.length} 首诗词...`)

  for (let i = 0; i < contentDB.length; i++) {
    const poem = contentDB[i]

    try {
      // 检查是否已存在
      const existRes = await poems.where({ id: poem.id }).get()

      if (existRes.data.length > 0) {
        // 更新已有数据
        await poems.doc(existRes.data[0]._id).update({
          data: poem
        })
        console.log(`[${i + 1}/${contentDB.length}] 更新: ${poem.title}`)
      } else {
        // 新增数据
        await poems.add({ data: poem })
        console.log(`[${i + 1}/${contentDB.length}] 新增: ${poem.title}`)
      }
    } catch (err) {
      console.error(`[${i + 1}/${contentDB.length}] 失败: ${poem.title}`, err)
    }
  }

  console.log('导入完成！')
}

// 导出函数供云控制台使用
module.exports = { migrate }
