#!/bin/bash
WORKSPACE="$HOME/.openclaw/workspace"
SOUL="$WORKSPACE/.soul"
DATE=$(date +%Y-%m-%d)
REPORT="$WORKSPACE/memory/weekly-report-$DATE.md"
TEMPLATE="$WORKSPACE/skills/dream-task/weekly-report-template.md"
SIGNAL_COUNT=$(grep -c '"type"' "$SOUL/signals/pending.jsonl" 2>/dev/null || echo 0)
NARRATIVE_COUNT=$(grep -c '"id"' "$SOUL/narrative-memory.json" 2>/dev/null || echo 0)
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
sed -e "s/\[自动生成日期\]/$TIMESTAMP/g" -e "s/总对话次数 | X | vs上周 | X/|总对话次数 | $SIGNAL_COUNT |/g" "$TEMPLATE" > "$REPORT"
echo "[周报生成完毕] $REPORT"
