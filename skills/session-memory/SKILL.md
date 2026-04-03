---
name: session-memory
description: 自动监控会话长度，在长会话中间主动写摘要，防止信息丢失。触发词：长会话摘要、session summary。日常由 cron 驱动，不需要用户触发。
---

# Session Memory Skill

## 触发条件

**Cron 驱动**：每 30 分钟检查一次，或用户说"写个 session 摘要"

---

## Session Summary 格式

无论什么场景，统一用以下结构。**每条必须包含第1、2、6段，其余按需填写。**

```
1. [What was this about]
   一句话说明这次谈了什么

2. [Key decisions made]
   达成的结论或决定（即使是"方向待定"也要写）

3. [Content snapshot]
   本次的核心内容片段（保留原话，不加工）
   - 内容创作：最具代表性的段落/标题/开头
   - 灵魂系统迭代：决策依据或关键判断
   - 调研/分析：核心观点或数据
   - 闲聊/简单问答：跳过或写"闲聊无核心内容"

4. [Mistakes and lessons]
   犯了什么错、得到什么教训（如有）

5. [How we got here]
   从哪里来的，上下文是什么（承接之前什么）

6. [What was said]
   强哥的原话（不许删，防止时间长了丢失真实意图）

7. [Still open]
  悬而未决的事

8. [Current status]
   现在推进到哪里了

9. [Next move]
   下一步谁做什么
```

### 强哥场景优先级

| 场景 | 第3段重点 | 常用段落 |
|------|----------|---------|
| 自媒体创作 | 标题/角度/核心观点 | 1,2,3,6,7,8,9 |
| 灵魂系统迭代 | 决策/判断/改动点 | 1,2,3,4,5,6,7,8,9 |
| 调研/分析 | 核心结论/数据 | 1,2,3,6,7,8 |
| 闲聊/简单问答 | 跳过 | 1,2,6 |

---

## 示例（自媒体创作场景）

```
1. [What was this about]
   分析 Claude Code 源码泄露事件，提炼对 OpenClaw 的启发

2. [Key decisions made]
   决定优先落地：Session Memory + Feedback Tracker + DreamTask + Coordinator 模式

3. [Content snapshot]
   "Claude Code 的 DreamTask 四阶段：Orient→Gather→Consolidate→Prune，
   触发条件：距上次≥24h 且积累≥5个新会话，永驻日志控制200行/25KB"

4. [Mistakes and lessons]
   N/A

5. [How we got here]
   承接 xcode.pdf 的分析，从源码里挖出了记忆三层架构的设计

6. [What was said]
   "xcode.pdf 对我们的启发中还有哪些没处理的？"

7. [Still open]
   DreamTask cron 脚本待测试

8. [Current status]
   Session Memory、Feedback Tracker 已落地 commit，DreamTask skill 已写好

9. [Next move]
   小艾测试 DreamTask cron 是否正常触发
```

---

## 示例（灵魂系统迭代场景）

```
1. [What was this about]
   把 Claude Code 的记忆三层架构落地到 OpenClaw

2. [Key decisions made]
   Session Memory 和 Feedback Tracker 做成独立 skill + cron，不整合进灵魂系统；
   DreamTask 做成独立 skill + 每周日9AM cron；
   Coordinator 模式写入尚书省 SOUL.md

3. [Content snapshot]
   "反馈追踪器和灵魂系统是传感器和大脑的关系——传感器不是大脑，
   但它给大脑提供数据。弱关系原则：feedback-tracker 只 append 到
   .soul/signals/pending.jsonl，不调用任何 guard 工具"

4. [Mistakes and lessons]
   之前把记忆规则写在文档里但没有自动触发，现在改成 skill + cron 才算长效机制

5. [How we got here]
   从"这两机制能不能沉淀到灵魂系统"这个问题出发，讨论后决定不整合但联动

6. [What was said]
   "可以，但是尽量这个 skill 和 value-aware-guard 是弱关系"

7. [Still open]
   无

8. [Current status]
   Skill 文件已写好，cron 已建，commit 完成

9. [Next move]
   跑几天看反馈 tracker 是否有误报
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
3. 判断是否需要写 summary（消息数 > 20 且距上次 > 30 分钟）
4. 如需要：读取最近 20 条消息，按场景优先级填写对应段落，写入 `.soul/narrative-memory.json`，更新状态文件
5. 如果不需要写 summary，直接更新时间

---

## 自检清单

写完后检查：
- 第1段能不能用一句话说清楚这次谈了什么？
- 第2段的结论是不是具体的（不是"讨论了某事"而是"决定做某事"）？
- 第6段强哥原话有没有遗漏？
SKELLEOF
echo "Done"