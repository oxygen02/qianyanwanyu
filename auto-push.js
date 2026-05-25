#!/usr/bin/env node
/**
 * 铅言万语小程序 - 自动推送到 Gitee
 * 仓库: https://gitee.com/oxygen02/qianyanwanyu
 * 触发条件: 每90分钟自动检查 / 有重大变更时
 *
 * 使用方法:
 *   node auto-push.js           # 手动执行一次
 *   node auto-push.js --daemon  # 后台守护模式（每90分钟检查）
 *   node auto-push.js --watch   # 监听文件变化，有变更立即推送
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const PROJECT_DIR = path.dirname(__filename)
const LOG_FILE = path.join(PROJECT_DIR, 'push.log')
const GITEE_URL = 'https://gitee.com/oxygen02/qianyanwanyu'
const INTERVAL_MS = 90 * 60 * 1000 // 90分钟

/**
 * 记录日志
 */
function log(message) {
  const timestamp = new Date().toLocaleString('zh-CN')
  const line = `[${timestamp}] ${message}`
  console.log(line)
  fs.appendFileSync(LOG_FILE, line + '\n')
}

/**
 * 执行命令并返回输出
 */
function exec(cmd, options = {}) {
  try {
    return execSync(cmd, {
      cwd: PROJECT_DIR,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options
    })
  } catch (err) {
    return err.stdout || err.message || ''
  }
}

/**
 * 检查是否有变更
 */
function hasChanges() {
  const output = exec('git status --porcelain')
  return output.trim().length > 0
}

/**
 * 获取变更文件列表
 */
function getChangeSummary() {
  return exec('git status --short').trim()
}

/**
 * 执行推送
 */
function push() {
  log('========================================')
  log('开始检查...')

  const branch = exec('git rev-parse --abbrev-ref HEAD').trim() || 'master'
  log(`当前分支: ${branch}`)

  if (!hasChanges()) {
    log('[-] 无变更，跳过推送')
    return false
  }

  log('检测到变更，开始提交...')
  log('变更文件:')
  const changes = getChangeSummary()
  changes.split('\n').forEach(line => log('  ' + line))

  // 添加所有变更
  exec('git add .')

  // 提交
  const commitMsg = `Auto push: ${new Date().toLocaleString('zh-CN')}\n\n变更概要:\n${changes}\n\n推送至: ${GITEE_URL}`
  const commitOutput = exec(`git commit -m "${commitMsg}"`)
  log('提交结果:')
  commitOutput.split('\n').forEach(line => line && log('  ' + line))

  // 推送到 Gitee
  const pushOutput = exec(`git push origin ${branch}`)
  log('推送结果:')
  pushOutput.split('\n').forEach(line => line && log('  ' + line))

  if (pushOutput.includes('error') || pushOutput.includes('fatal')) {
    log('[✗] 推送失败')
    // 尝试强制推送
    log('尝试强制推送...')
    const forceOutput = exec(`git push -f origin ${branch}`)
    forceOutput.split('\n').forEach(line => line && log('  ' + line))
    return !forceOutput.includes('error')
  }

  log('[✓] 推送成功')
  return true
}

/**
 * 守护模式：定时检查
 */
function startDaemon() {
  log('========================================')
  log('启动自动推送守护进程')
  log(`检查间隔: ${INTERVAL_MS / 60000} 分钟`)
  log('按 Ctrl+C 停止')
  log('========================================')

  // 立即执行一次
  push()

  // 定时执行
  setInterval(() => {
    push()
  }, INTERVAL_MS)
}

/**
 * 监听模式：使用 fs.watch 监听文件变化
 */
function startWatch() {
  log('========================================')
  log('启动文件监听模式')
  log('有文件变更时将自动推送')
  log('按 Ctrl+C 停止')
  log('========================================')

  // 忽略的文件和目录
  const ignoreList = [
    'node_modules',
    '.git',
    'push.log',
    'auto-push.js',
    'auto_push.sh'
  ]

  let debounceTimer = null
  const DEBOUNCE_MS = 5000 // 5秒防抖

  function watchDir(dir) {
    fs.watch(dir, { recursive: false }, (eventType, filename) => {
      if (!filename) return
      if (ignoreList.some(ignore => filename.includes(ignore))) return

      // 防抖：避免频繁推送
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        log(`检测到文件变更: ${filename}`)
        push()
      }, DEBOUNCE_MS)
    })

    // 递归监听子目录
    const items = fs.readdirSync(dir)
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory() && !ignoreList.includes(item)) {
        watchDir(fullPath)
      }
    }
  }

  watchDir(PROJECT_DIR)
}

// 主程序
const args = process.argv.slice(2)

if (args.includes('--daemon')) {
  startDaemon()
} else if (args.includes('--watch')) {
  startWatch()
} else {
  // 默认：手动执行一次
  push()
}
