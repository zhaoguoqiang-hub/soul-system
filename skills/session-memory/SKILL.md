---
name: session-memory
description: 自动监控会话长度，在长会话中间主动写摘要，防止信息丢失。触发词：长会话摘要、session summary。日常由 cron 驱动，不需要用户触发。
---

# Session Memory Skill

## 触发条件

**Cron 驱动**：每 30 分钟检查一次，或用户说"写个 session 摘要"

---

## 9 段式 Session Summary

通用格式，不限于代码会话。每条 summary 必须包含以下 9 段：

```
1. [Primary Request and Intent]
   用户最初想要什么（一句话概括）

2. [Key Decisions and Conclusions]
   本次达成了哪些关键结论/决策

3. [Core Content]
   本次的核心内容（代码片段 OR 有价值的文字片段，保留原话）
   - 涉及开发/代码：附上关键代码片段
   - 非开发场景：附上有代表性的原话或内容片段
   - 注意：不是全文复述，而是最能代表本次的片段

4. [Errors and Fixes]
   犯了什么错、怎么修的（如有）

5. [Problem Solving Process]
   解决思路和关键步骤

6. [All User Messages]
   用户所有原话（不许遗漏，防止压缩后丢失真实意图）

7. [Pending Tasks]
   待办事项

8. [Current Progress]
   当前进度

9. [Optional Next Step]
   下一步计划（如有）
```

---

## 格式规则

| 场景 | 第3段 Core Content |
|------|-------------------|
| 开发/代码任务 | 附上关键代码片段（文件+行号） |
| 内容创作/写作 | 附上有代表性的段落或标题 |
| 调研/分析 | 附上核心观点或数据 |
| 闲聊/简单问答 | 跳过第3段，或写"本次为闲聊无核心内容" |

**第6段 All User Messages 永远保留**，不管什么场景。

---

## 示例

**场景：代码任务**
```
1. [Primary Request] 帮强哥安装并配置 Tavily API key
2. [Key Decisions] 决定用 openclaw config set 命令配置，Tavily 重启生效
3. [Core Content] ```bash
   openclaw config set plugins.entries.tavily.config.webSearch.apiKey "tvly-dev-xxx"
   ```
4. [Errors and Fixes] 初始 config set 回报"Config overwrite"但 gateway 未重启
5. [Problem Solving] 发现需要 openclaw gateway restart 才能生效
6. [All User Messages] "配置好了吗？之后不管做什么任务，都需要闭环"
7. [Pending Tasks] 验证 Tavily web_search 是否正常工作
8. [Current Progress] API key 已配置，gateway 已重启
9. [Next Step] 手动测试 web_search 功能
```

**场景：内容创作**
```
1. [Primary Request] 分析 Claude Code 源码泄露事件，对 OpenClaw 的启发
2. [Key Decisions] 确定 4 个优先落地方向：记忆三层架构/Coordinator/正负反馈/9段式压缩
3. [Core Content] "Claude Code 的 DreamTask 四阶段：Orient→Gather→Consolidate→Prune，控制记忆在 200行/25KB"
4. [Errors and Fixes] N/A
5. [Problem Solving] 从 xcode.pdf 提取 Claude Code 设计模式，对照 OpenClaw 现状逐条分析
6. [All User Messages] "分析 output 文件下的 xcode.pdf，结合 Claude Code 泄密事件，去网上找一些对 openclaw 系统有提升的内容"
7. [Pending Tasks] DreamTask cron 脚本待写
8. [Current Progress] 9段式格式已落地，proactive-trigger 事件驱动改造已完成
9. [Next Step] 写 DreamTask skill
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
2. 获取当前 session 消息数
3. 判断是否需要写 summary：
   - 消息数 > 20
   - 且距上次 summary > 30 分钟
4. 如需要：读取最近 20 条消息，严格按 9 段式填写，写入 `.soul/narrative-memory.json`，更新状态文件
5. 如果不需要写 summary，直接更新时间

---

## 自检清单

写完后自问：
- 第3段内容是否符合场景（代码 OR 文字片段）？
- 第6段用户原话是否完整？
- 有没有遗漏任何一段？
