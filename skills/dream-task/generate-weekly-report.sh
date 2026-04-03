#!/bin/bash
# 生成灵魂系统周报
WORKSPACE="$HOME/.openclaw/workspace"
SOUL="$WORKSPACE/.soul"
REPORT="$WORKSPACE/memory/weekly-report-$(date +%Y-%m-%d).md"
TEMPLATE="$WORKSPACE/skills/dream-task/weekly-report-template.md"

# 收集数据
SIGNAL_COUNT=$(grep -c '"type"' "$SOUL/signals/pending.jsonl" 2>/dev/null || echo 0)
NARRATIVE_COUNT=$(grep -c '"id"' "$SOUL/narrative-memory.json" 2>/dev/null || echo 0)
MOOD_AVG=$(python3 -c "import json; entries=[json.loads(l) for l in open('$SOUL/mood-history.jsonl')] if '$SOUL/mood-history.jsonl' else []; print(sum(e.get('energy',0) for e in entries[-20:])/len(entries[-20:]) if entries else 'N/A')" 2>/dev/null || echo "N/A")

# 生成报告
cat "$TEMPLATE" | sed "s/\[自动生成日期\]/$(date '+%Y-%m-%d %H:%M')/" | \
  sed "s/总对话次数 | X | vs上周/X | $SIGNAL_COUNT/" | \
  sed "s/有效信号数 | X | breakthrough/X | $SIGNAL_COUNT/" | \
  sed "s/新增 session summary | X 条 |/$NARRATIVE_COUNT 条 |/" | \
  sed "s/能量峰值 | X | 触发原因 |/平均 $MOOD_AVG |/" \
  > "$REPORT"

echo "[周报生成] $REPORT"
cat "$REPORT"
