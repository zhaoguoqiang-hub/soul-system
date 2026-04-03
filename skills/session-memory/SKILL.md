---
name: session-memory
description: 自动监控会话长度，在长会话中间主动写摘要，防止信息丢失。触发词：长会话摘要、session summary。日常由 cron 驱动，不需要用户触发。
---

# Session Memory Skill

## 触发条件

**Cron 驱动**：每 30 分钟检查一次，或用户说"写个 session 摘要"

## 核心逻辑

1. 读取状态文件 `memory/session-memory-state.json`
2. 获取当前 session 的消息数（通过 session_status 或会话历史）
3. 判断是否需要写 summary：
   - 消息数 > 20
   - 且距上次 summary > 30 分钟
4. 如需要，写入 summary 到 `.soul/narrative-memory.json`
5. 更新状态文件

## 状态文件格式

`memory/session-memory-state.json`:
```json
{
  "lastSummaryTime": "2026-04-03T10:00:00+08:00",
  "lastSummaryMessageCount": 45,
  "lastSessionId": "xxx"
}
```

## Summary 格式

写入 `.soul/narrative-memory.json`，新增 entry：
```json
{
  "id": "session-summary-{timestamp}",
  "timestamp": "2026-04-03T10:30:00+08:00",
  "type": "session_summary",
  "importance": 0.6,
  "event": "[Session Summary] 2026-04-03 10:30 (消息数: 48)",
  "details": "主题：xxx\n关键决策：xxx\n待跟进：xxx\n强哥状态：xxx",
  "tags": ["session-summary"]
}
```

## 调用方式

由 HEARTBEAT cron 触发 `agentTurn` 类型任务：
```
每 30 分钟触发一次，检查 → 决定是否写 summary
```
