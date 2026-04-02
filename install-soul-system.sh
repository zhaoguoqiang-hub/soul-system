#!/bin/bash

#=======================================
# soul-system 一键安装脚本
# 功能：安装所有soul-system Skills并配置全局命令
#=======================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 技能列表
SKILLS=(
    "narrative-memory"
    "user-context-scanner"
    "value-aware-guard"
    "proactive-trigger"
    "mood-simulator"
)

# 安装目录
SKILLS_DIR="$HOME/.openclaw/skills"
SOURCE_DIR="$HOME/soul-system/skills"

echo "======================================="
echo "   soul-system Skills 一键安装脚本"
echo "======================================="
echo ""

# 检查源目录
if [ ! -d "$SOURCE_DIR" ]; then
    echo "${RED}✗${NC} 错误: GitHub仓库不存在"
    echo "   期望目录: $SOURCE_DIR"
    echo "   请先克隆: git clone https://github.com/zhaoguoqiang-hub/soul-system"
    exit 1
fi

echo "${GREEN}✓${NC} 找到GitHub仓库: $SOURCE_DIR"
mkdir -p "$SKILLS_DIR"

echo ""
echo "📦 开始安装Skills..."
echo "---------------------------------------"

for skill in "${SKILLS[@]}"; do
    echo -n "  安装 $skill... "
    
    if [ -d "$SOURCE_DIR/$skill" ]; then
        rm -rf "$SKILLS_DIR/$skill"
        cp -r "$SOURCE_DIR/$skill" "$SKILLS_DIR/$skill"
        rm -rf "$SKILLS_DIR/$skill/node_modules" 2>/dev/null || true
        rm -f "$SKILLS_DIR/$skill/package-lock.json" 2>/dev/null || true
        
        if [ -f "$SKILLS_DIR/$skill/package.json" ]; then
            cd "$SKILLS_DIR/$skill" && npm install --silent 2>/dev/null || true
        fi
        
        if [ -d "$SKILLS_DIR/$skill/bin" ]; then
            cd "$SKILLS_DIR/$skill" && npm link 2>/dev/null || true
        fi
        
        echo "${GREEN}✓${NC}"
    else
        echo "${RED}✗${NC} 目录不存在"
    fi
done

echo ""
echo "---------------------------------------"
echo "${GREEN}✓${NC} Skills安装完成!"
echo ""

echo "📋 已安装的Skills:"
for skill in "${SKILLS[@]}"; do
    if [ -d "$SKILLS_DIR/$skill" ]; then
        echo "  • $skill"
    fi
done

echo ""
echo "💡 后续步骤:"
echo "   1. 重启终端使全局命令生效"
echo "   2. 测试: soul_narrative --version"
echo ""