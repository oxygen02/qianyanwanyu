const fs = require('fs')
const filePath = '/Users/ouyangguoqing/Documents/trae_projects/qianyanwanyu/miniprogram/utils/constants.js'
let content = fs.readFileSync(filePath, 'utf8')

content = content.replace(
  /brandStamp: \{ enabled: true, position: 'bottomRight' \}\s*stamp:\s*(null|\{[^}]+\}),?\s*\},\s*pageNumber:\s*(true|false)\s*\}/g,
  'brandStamp: { enabled: true, position: \'bottomRight\' },\n      pageNumber: $2\n    }'
)

fs.writeFileSync(filePath, content)
console.log('Fixed!')
