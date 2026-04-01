---
name: proactive-trigger
version: 0.4.0
description: >
  主动触发引擎v4：基于话题热度衰减模型 + 沉默等待指数 + 每日简报机制。
  在对的时间说对的话，不打扰、不遗漏、有价值。
  触发条件：用户长时间未互动、话题正热、目标临近、健康关怀时机。
---

# Proactive Trigger v4

让AI主动出现在用户需要的时候，而不是用户开口求助。

## 核心原则

1. **不打扰是底线** — 宁可不发，不能乱发
2. **有上下文才触发** — 每次触发必须先查记忆
3. **话题有生命周期** — 热门话题会自然冷却
4. **沉默越久越主动** — 长时间不互动才提高权重

## 核心概念

### 话题热度衰减模型

每个话题有三种状态：🔥活跃、🌱浮现、❄️休眠。

**基本规则：**
- 🔥活跃：24h内提及≥3次，可主动触发
- 🌱浮现：1-2次提及，积累中，不主动触发
- ❄️休眠：7天未提及，自动冷却

**详细规则：** 见 [references/interest-graph-calculation.md](references/interest-graph-calculation.md)

### 沉默等待指数

根据用户最近互动时间计算触发意愿：
- 沉默越久，指数越高
- 结合用户活动模式和时间段调整

**计算公式：** 见 [references/silence-index-formula.md](references/silence-index-formula.md)

### 综合触发评分

```
TriggerScore = SilenceIndex × TopicHeat × Urgency × ContextRelevance
```

根据评分决定是否触发及触发类型。

## 工作流程

### 1. 状态检查
每次用户互动或定时检查时：
- 更新话题热度状态
- 计算沉默等待指数
- 检查各安全检查项

### 2. 安全检查
触发前必须全部通过：
- ✅ 时间窗口允许（07:00-22:00）
- ✅ 今日触发次数未超6次  
- ✅ 距上次触发超过2小时
- ✅ 已查阅相关记忆上下文
- ✅ 非Focus模式
- ✅ 沉默指数 > 0.5 或 紧迫度极高

### 3. 触发决策
根据综合评分选择触发类型：

| 触发类型 | 最佳时机 | 权重 |
|---------|---------|------|
| 每日简报 | 07:00-09:00首次 | 0.7 |
| 话题推送 | 话题正热时 | 0.6 |
| 目标提醒 | 目标临近时 | 1.5 |
| 健康关怀 | 健康相关时机 | 1.3 |
| 夜间关怀 | 18:00-22:00 | 0.5 |

### 4. 消息生成
**必须包含：**
1. 触发原因（为什么现在说）
2. 用户相关的上下文  
3. 开放式问题或具体价值

**禁止：**
- 无上下文的询问
- 命令式语气
- 封闭式问题（除非紧急）

### 5. 反馈学习
记录用户响应，优化未来触发：
- 用户接受 → 提高该类触发权重
- 用户忽略 → 保持原权重
- 用户拒绝 → 降低权重，该话题沉默24小时

## 关键机制

### 每日简报机制
每天07:00-09:00用户首次互动时生成结构化简报。

### 记忆回溯
触发前必须先查阅相关记忆，确保上下文连贯。

### 状态管理
详细状态数据结构：见 [references/trigger-state-management.md](references/trigger-state-management.md)

## 时间窗口

| 时段 | 可触发 | 强度 |
|------|--------|------|
| 07:00-09:00 | ✅ | 每日简报优先 |
| 09:00-12:00 | ✅ | 全类型 |
| 12:00-14:00 | ⚠️ | 仅简短关怀 |
| 14:00-18:00 | ✅ | 全类型 |
| 18:00-22:00 | ✅ | 关怀优先 |
| 22:00-07:00 | ❌ | 从不触发 |

## 与其他Skill协作

### 接收信号
- `breakthrough` → 触发庆祝
- `frustration` → 降低预期，温和支持
- `goal_progress` → 更新目标状态
- `user_tired` → 降低触发强度

### 发布信号
```
Tool: signal_publish
Params:
  type: "assistant_triggered"
  payload: { type, topic, message_id }
```

## 快速开始

### 启用
1. 安装proactive-engine插件
2. 确保user-context-scanner运行以获取用户兴趣
3. 系统自动开始监控和触发

### 配置
通过`~/.openclaw/workspace/.soul/trigger-state.json`调整：
- 每日最大触发次数（默认6）
- 时间窗口偏好
- 话题冷却时间

### 禁用
- 设置Focus模式暂停所有触发
- 用户明确说"现在不要打扰"

## 参考文件

| 文件 | 内容 |
|------|------|
| [interest-graph-calculation.md](references/interest-graph-calculation.md) | 话题热度衰减详细规则 |
| [silence-index-formula.md](references/silence-index-formula.md) | 沉默等待指数计算公式 |
| [trigger-state-management.md](references/trigger-state-management.md) | 状态数据结构与管理规则 |

---

**Tags:** soul, system, proactive, topic-tracker, silence-index, daily-summary
