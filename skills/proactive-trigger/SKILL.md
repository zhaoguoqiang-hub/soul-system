---
name: proactive-trigger
description: 主动触发引擎。由 soul-proactive-engine 插件的 Tick 循环驱动（每15分钟），评估当前目标状态和用户活跃时间，在合适时机推送主动建议。核心原则：只推有意义的内容，每天不超过3次，冷却4小时，不打扰用户休息。
use_when: >
  此 Skill 由 OpenClaw cron 任务触发（periodic-proactive-check，每2小时）。
  cron 运行在独立持久 session（session:soul-proactive-check）中，跨 runs 保持上下文。
  触发前读取 .soul/daily_context.json 获取当日对话上下文。
---

## 核心接口

### evaluateProactiveTrigger(ctx, activeGoals)
评估是否需要触发主动建议。

**参数：**
- `ctx` — OpenClaw Context
- `activeGoals` — 当前活跃目标数组

**返回：**
```typescript
interface TriggerResult {
  shouldTrigger: boolean;       // true=应该发送建议
  reason: string;               // 触发原因描述
  messageSuggestion?: string;   // 建议发送的具体内容
  priority: 'low' | 'medium' | 'high';
}
```

**触发条件：**

### 场景 A — 目标停滞
条件：目标 3 天以上未更新（lastUpdated）且进度 < 50%
返回：
```
shouldTrigger: true
reason: 'Goal "xxx" is stagnating (8 days idle)'
messageSuggestion: '嘿，注意到你已经 8 天没更新"xxx"的进度了。是不是遇到了什么困难？需要我帮你把任务拆小一点吗？'
priority: 'high'
```

### 场景 B — 目标即将完成
条件：80% ≤ 进度 < 100%
返回：
```
shouldTrigger: true
reason: 'Goal "xxx" is near completion (88%)'
messageSuggestion: '太棒了！"xxx"已经完成 88% 了！趁热打铁，今天要不要冲刺一下把它搞定？'
priority: 'medium'
```

### 不触发的场景
- 冷却期（距上次触发 < 4小时）
- 当日触发次数已达上限（3次/天）
- 非活跃时段（22:00~07:00）
- 用户正忙（距上次交互 < 5分钟）

---

## 冷却机制

### checkTriggerCooldown(ctx)
检查是否处于冷却期。

**返回：** `true` = 在冷却中（不应触发），`false` = 可以触发

**每日限额：**
- 最大触发次数：3次/天
- 冷却时间：4小时
- 计数器每日凌晨重置

### recordTrigger(ctx)
记录一次触发事件。调用后：
- `lastTriggerTime` → 当前时间戳
- `triggerCountToday` +1

---

## 配置参数（集中管理）

所有配置在 `src/config.ts`：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `trigger.maxDailyTriggers` | 3 | 每日最大触发次数 |
| `trigger.cooldownMs` | 4h | 冷却时间（毫秒） |
| `trigger.primeTimeStart` | 7 | 触发时间窗口起点（时） |
| `trigger.primeTimeEnd` | 22 | 触发时间窗口终点（时） |
| `trigger.checkIntervalMs` | 15min | 检查间隔 |
| `trigger.confidenceThreshold` | 0.5 | 触发置信度阈值 |

---

## 典型触发流程

```
Tick (每15分钟)
  → checkTriggerCooldown() → true? → 不触发
  → 时间窗口检查 → 非活跃时段? → 不触发
  → 扫描目标列表
    → 停滞目标? → 触发 high 优先级建议
    → 即将完成目标? → 触发 medium 优先级建议
  → recordTrigger()
  → 发送消息到用户（飞书/控制台）
```

## 数据存储

- 存储键：`soul_trigger_state`
- 结构：`{ lastTriggerTime, triggerCountToday, lastResetDate }`

## 依赖

- `utils/storage.ts`
- `src/config.ts`
- `GoalManager`（获取活跃目标）

## 注意事项

- **永远不主动打扰用户**：冷却机制 + 时间窗口确保只在合适时机触达
- **不重复提醒**：同一个目标，触发后至少等下一个停滞节点才再次提醒
- **可被用户打断**：用户发送任意消息 → 触发计数不变，下次 tick 重新评估
