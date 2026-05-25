#!/bin/bash
# ============================================
# 铅言万语小程序 - 启动自动推送服务
# ============================================

PROJECT_DIR="/Users/ouyangguoqing/Documents/trae_projects/qianyanwanyu"
LOG_FILE="$PROJECT_DIR/push.log"

cd "$PROJECT_DIR" || exit 1

echo "========================================"
echo "铅言万语 - 自动推送服务"
echo "仓库: https://gitee.com/oxygen02/qianyanwanyu"
echo "========================================"
echo ""
echo "请选择模式:"
echo "  1) 守护模式 - 每90分钟自动检查并推送"
echo "  2) 监听模式 - 文件变更时立即推送"
echo "  3) 单次推送 - 立即执行一次推送"
echo ""
read -p "请输入选项 (1/2/3): " choice

case $choice in
  1)
    echo "启动守护模式..."
    echo "日志文件: $LOG_FILE"
    echo "按 Ctrl+C 停止"
    echo ""
    nohup node "$PROJECT_DIR/auto-push.js" --daemon >> "$LOG_FILE" 2>&1 &
    echo "服务已启动，PID: $!"
    ;;
  2)
    echo "启动监听模式..."
    echo "日志文件: $LOG_FILE"
    echo "按 Ctrl+C 停止"
    echo ""
    nohup node "$PROJECT_DIR/auto-push.js" --watch >> "$LOG_FILE" 2>&1 &
    echo "服务已启动，PID: $!"
    ;;
  3)
    echo "执行单次推送..."
    node "$PROJECT_DIR/auto-push.js"
    ;;
  *)
    echo "无效选项"
    exit 1
    ;;
esac
