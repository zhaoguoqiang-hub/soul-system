#!/bin/bash
# soul-system 全局命令链接脚本
# 将所有soul_* CLI命令全局链接

SKILLS_DIR="$HOME/.openclaw/workspace/skills"

echo "🔗 soul-system 全局命令链接"
echo "================================"

for dir in "$SKILLS_DIR"/*/; do
    skill=$(basename "$dir")
    cli_name="soul_${skill//-/_}"
    
    if [ -d "$dir/bin" ]; then
        echo -n "  链接 $cli_name... "
        cd "$dir" && npm link 2>/dev/null && echo "✓" || echo "✗"
    fi
done

echo ""
echo "================================"
echo "💡 重启终端或运行: source ~/.zshrc"