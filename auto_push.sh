#!/bin/bash

# ============================================
# 铅言万语小程序 - 自动推送到 Gitee
# 仓库: https://gitee.com/oxygen02/qianyanwanyu
# 触发条件: 每90分钟自动检查 / 有重大变更时
# ============================================

PROJECT_DIR="/Users/ouyangguoqing/Documents/trae_projects/qianyanwanyu"
LOG_FILE="$PROJECT_DIR/push.log"
GITEE_URL="https://gitee.com/oxygen02/qianyanwanyu"

cd "$PROJECT_DIR" || exit 1

# 记录开始时间
echo "========================================" >> "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始检查..." >> "$LOG_FILE"

# 获取当前分支
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "master")
echo "当前分支: $CURRENT_BRANCH" >> "$LOG_FILE"

# 检查是否有变更（包括未跟踪文件）
git status --porcelain | grep -q .
HAS_CHANGES=$?

if [ $HAS_CHANGES -eq 0 ]; then
    # 有变更，执行推送
    echo "检测到变更，开始提交..." >> "$LOG_FILE"
    
    # 显示变更概要
    echo "变更文件:" >> "$LOG_FILE"
    git status --short >> "$LOG_FILE"
    
    # 添加所有变更
    git add .
    
    # 提交（使用更详细的提交信息）
    COMMIT_MSG="Auto push: $(date '+%Y-%m-%d %H:%M:%S')
    
变更概要:
$(git status --short)

推送至: $GITEE_URL"
    
    git commit -m "$COMMIT_MSG" >> "$LOG_FILE" 2>&1
    
    # 推送到 Gitee
    git push origin "$CURRENT_BRANCH" >> "$LOG_FILE" 2>&1
    PUSH_RESULT=$?
    
    if [ $PUSH_RESULT -eq 0 ]; then
        echo "[✓] 推送成功 at $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
    else
        echo "[✗] 推送失败 at $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
        # 尝试强制推送（如果普通推送失败）
        echo "尝试强制推送..." >> "$LOG_FILE"
        git push -f origin "$CURRENT_BRANCH" >> "$LOG_FILE" 2>&1
    fi
else
    echo "[-] 无变更，跳过推送 at $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"
