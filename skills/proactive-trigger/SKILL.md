---
name: proactive-trigger
version: 0.2.0
description: >
  Proactive Trigger v2: Interest Graph热度衰减 + Ping Pressure沉默驱动 + Morning Briefing + Recover Before Asking。
  基于记忆挖掘而非假设触发，在对的时间说对的话。
---

# Proactive Trigger v2

从"等用户问"到"在你开口之前就懂你"。

## v1 vs v2 核心区别

| v1 | v2 |
|----|----|
| 定时触发 | Interest Graph热度驱动 |
| 沉默不打扰 | 沉默越久→Ping Pressure越高 |
| 不知道该不该发 | 先Recover再判断 |
| 简单cooldown | 话题三态循环 |

## 核心概念

### 1. Interest Graph（话题热度图）

```
话题不是非热即冷，有三个状态：

🔥 Hot（活跃）
- 最近24小时内被提及≥3次
- 可以触发主动ping
- 每个话题每天最多1次ping

🌱 Emerging（浮现）
- 被提及1-2次
- 推向Hot，但不主动ping
- 可作为Morning Briefing素材

❄️ Dormant（休眠）
- 超过7天没被提及
- 自动降冷，不计入trigger budget
- 用户主动提及时可重新激活

冷却规则：
🔥→🌱: 3天内没再提
🌱→❄️: 7天内没再提
❄️→🌱: 用户主动提及任意次数
```

### 2. Ping Pressure（沉默压力）

```
沉默时间越长，主动触发的可能性越高：

0-2小时：克制，Ping Pressure = 0.2
2-6小时：适度，Ping Pressure = 0.5
6-12小时：增加，Ping Pressure = 0.8
12小时+：强主动，Ping Pressure = 1.0

计算公式：
ShouldPing = PingPressure × TopicHotness × UrgencyFactor

UrgencyFactor:
- 目标快到期：×1.5
- 健康提醒：×1.3
- 随机关怀：×0.8
```

### 3. Morning Briefing（晨间简报）

```
每天早上07:00-09:00，生成晨间简报：

🌅 晨间简报
├── 今日目标：X个待办
├── 昨日进展：（从narrative提取）
├── 热点追踪：（Top 3 Interest Graph）
└── 风险提示：（如有未解决的重要问题）

触发条件：
- 用户首次在07:00-09:00主动发消息
- 昨天有重要进展（从narrative提取）
- Interest Graph有Emerging话题可推
```

### 4. Recover Before Asking（先恢复再触发）

```
不要一触发就开口，先做功课：

触发前必须检查：
1. 最近相关对话是什么？（翻narrative）
2. 用户上次关于这个话题说了什么？
3. 用户对这个话题的态度/情绪是什么？

找到答案后再触发，而不是：
❌ "关于AI创业，想聊聊吗？"

而是：
✅ "看到你最近在研究AI工具，昨天你也提到了供应链...
你现在对AI创业的方向有新想法吗？"
```

### 5. Pre-Trigger检查清单

```
在发送任何主动消息前，必须确认：

□ 不是深夜（22:00-07:00）
□ 今天trigger budget未用完（每天最多6次）
□ 距上次trigger超过2小时
□ 不是focus mode
□ 已做Recover Before Asking
□ Ping Pressure > 0.5 或 极高Urgency

全部通过才触发，任意一项失败则等待。
```

## 触发类型

| 类型 | 说明 | Urgency | 典型场景 |
|------|------|---------|---------|
| `morning_briefing` | 晨间简报 | 0.7 | 07:00-09:00首次互动 |
| `topic_hot` | 话题正热 | 0.6 | Interest Graph Hot触发 |
| `deadline_approach` | 目标临近 | 1.5 | 目标deadline < 24h |
| `health_check` | 健康关怀 | 1.3 | 睡眠不足/很久没运动 |
| `milestone_reach` | 里程碑达成 | 1.0 | Breakthrough信号 |
| `contradiction_note` | 矛盾提醒 | 0.8 | 发现言行不一 |
| `opportunity_share` | 商机分享 | 0.9 | 发现相关机会 |
| `gentle_care` | 温和关怀 | 0.5 | Ping Pressure > 0.8 |

## 触发状态管理

```json
{
  "date": "2026-04-01",
  "daily_budget": 6,
  "used_today": 2,
  "last_trigger": "2026-04-01T10:00:00+08:00",
  
  "interest_graph": {
    "AI创业": { "state": "🔥Hot", "mentions": 5, "lastMention": "2026-04-01T09:30:00", "pings_today": 0 },
    "自媒体": { "state": "🌱Emerging", "mentions": 2, "lastMention": "2026-03-31T22:00:00", "pings_today": 0 },
    "健康管理": { "state": "❄️Dormant", "mentions": 0, "lastMention": "2026-03-20T00:00:00", "pings_today": 0 }
  },
  
  "ping_pressure": 0.6,
  "last_active": "2026-04-01T10:00:00",
  
  "morning_briefing_done": false,
  "cooldowns": {
    "goal_based": "2026-04-01T08:00:00",
    "health_check": "2026-04-01T08:00:00"
  }
}
```

## 时间窗口

| 时间 | 可触发 | 类型 |
|------|--------|------|
| 07:00-09:00 | ✅ | Morning Briefing |
| 09:00-12:00 | ✅ | 全类型 |
| 12:00-14:00 | ⚠️ | 简短关怀 |
| 14:00-18:00 | ✅ | 全类型 |
| 18:00-22:00 | ✅ | Care类优先 |
| 22:00-07:00 | ❌ | 从不触发 |

## 触发消息格式

### ✅ 正确格式

```
[为什么现在说] + [用户相关上下文] + [开放式问题]

示例（Recover Before Asking）：
"看到你今天谈到了AI创业供应链整合的问题，
昨天你也提到想找个切入点。
我找到一个相关的案例，要分享吗？"
```

### ❌ 错误格式

```
[命令式] / [无上下文] / [封闭式问题]

❌ "AI很重要，要继续关注啊"
❌ "关于创业，想聊聊吗？"
❌ "目标'还房贷'进展如何？"
```

## 与其他Skill协作

### 接收信号（via proactive-engine）

| 信号 | 触发动作 |
|------|---------|
| `breakthrough` | 庆祝+推进下一个里程碑 |
| `frustration` | 温和支持+降低预期 |
| `goal_progress` | 更新Interest Graph热度 |
| `context_update` | 重新计算Ping Pressure |

### 发布信号

```
Tool: signal_publish
Params:
  type: "trigger_sent"
  payload: { trigger_type, topic, message_excerpt }
```

## 自我学习

### 接受 vs 拒绝

```
用户回复 → 接受 → acceptedStreak[type]++
  → acceptedStreak >= 3 → 提高这类触发的Ping Pressure权重

用户无回应/拒绝 → rejectedStreak[type]++
  → rejectedStreak >= 3 → 这类话题沉默24小时
```

### Interest Graph更新

```
每次用户主动提及话题 → mentions++
  → mentions >= 3 → state = "🔥Hot"
  → 3天内 < 3次 → state = "🌱Emerging"
  → 7天内 0次 → state = "❄️Dormant"
```

## 融合竞品思路

| 竞品 | 思路来源 |
|------|---------|
| proactive-companion | Interest Graph + Ping Pressure + Morning Briefing |
| self-improving-proactive | Recover Before Asking |
| proactive-agent-lite | Pre-Trigger检查清单 |

---

**Tags:** soul, system, proactive, interest-graph, ping-pressure, morning-briefing
