const fs = require('fs')
const filePath = '/Users/ouyangguoqing/Documents/trae_projects/qianyanwanyu/miniprogram/utils/constants.js'
let content = fs.readFileSync(filePath, 'utf8')

content = content.replace(
  /stamp:\s*null,\s*pageNumber:\s*true,\s*brandStamp:\s*\{[^}]+\},\s*pageNumber:\s*true\s*\}/g,
  'stamp: null,\n      pageNumber: true,\n      brandStamp: { enabled: true, position: \'bottomRight\' }\n    }'
)

content = content.replace(
  /brandStamp:\s*\{[^}]+\}\s*stamp:\s*null,*\s*/g,
  'brandStamp: { enabled: true, position: \'bottomRight\' }\n    }'
)

fs.writeFileSync(filePath, content)
console.log('Fixed again!')
