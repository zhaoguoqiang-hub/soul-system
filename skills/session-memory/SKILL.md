---
name: session-memory
description: 自动监控会话长度，在长会话中间主动写摘要，防止信息丢失。触发词：长会话摘要、session summary。日常由 cron 驱动，不需要用户触发。
---

# Session Memory Skill

## 核心定位

把"简单总结"升级为"9段式结构化记忆术"，参照 Claude Code 的上下文压缩格式。

---

## 触发条件

**Cron 驱动**：每 30 分钟检查一次，或用户说"写个 session 摘要"

---

## 9 段式 Session Summary 格式

每条 summary 必须包含以下 9 个字段，**不允许省略任何段**：

```
1. [Primary Request and Intent] 
   用户的原始需求（一句话）

2. [Key Technical Concepts]
   本次涉及的关键概念/术语（技术相关）

3. [Files and Code Sections]
   涉及的文件和代码片段（必须附代码！不要只写文件名）

4. [Errors and Fixes]
   犯了什么错、怎么修的

5. [Problem Solving]
   问题解决过程（思考路径）

6. [All User Messages]
   用户所有原话（不许遗漏！防止压缩后丢失真实意图）

7. [Pending Tasks]
   待办事项

8. [Current Work]
   当前进度

9. [Optional Next Step]
   下一步计划（如有）
```

### 硬性要求

- **必须保留代码片段**：不是"修改了 auth.ts"，而是要把关键代码粘进来
- **必须保留用户所有原话**：防止压缩后丢失用户的真实意图
- 代码片段放第 3 段，用户原话放第 6 段，格式不对视为不合规

---

## Summary 格式（写入 narrative-memory）

```json
{
  "id": "session-summary-{timestamp}",
  "timestamp": "2026-04-03T12:30:00+08:00",
  "type": "session_summary",
  "importance": 0.6,
  "event": "[Session Summary] 2026-04-03 12:30",
  "details": "【9段式】\n1. [Primary Request] xxx\n2. [Key Concepts] xxx\n3. [Files & Code] ```xxx```\n4. [Errors & Fixes] xxx\n5. [Problem Solving] xxx\n6. [All User Messages] xxx\n7. [Pending Tasks] xxx\n8. [Current Work] xxx\n9. [Next Step] xxx",
  "tags": ["session-summary"]
}
```

---

## 状态文件

`memory/session-memory-state.json`:
```json
{
  "lastSummaryTime": "2026-04-03T10:00:00+08:00",
  "lastSummaryMessageCount": 45,
  "lastSessionId": "xxx",
  "threshold": {
    "messageCount": 20,
    "intervalMinutes": 30
  }
}
```

---

## 执行步骤

1. 读取 `memory/session-memory-state.json` 获取上次状态
2. 获取当前 session 的消息数（通过 sessions_list 或 session_status）
3. 判断是否需要写 summary：
   - 消息数 > 20
   - 且距上次 summary > 30 分钟
4. 如需要：
   - 读取最近 20 条消息，严格按 9 段式格式填写
   - 写入 `.soul/narrative-memory.json`（追加 entry）
   - 更新 `memory/session-memory-state.json`
5. 如果不需要写 summary，直接更新 lastSummaryTime（以 lastMessageCount 更新）

---

## 自检清单

写完 summary 后自问：
- 代码片段是否附上了？（第 3 段）
- 用户原话是否完整保留了？（第 6 段）
- 有没有遗漏任何一段？

发现缺失，补全后再写入。
