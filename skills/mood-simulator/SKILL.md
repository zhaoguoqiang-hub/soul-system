---
name: mood-simulator
description: 情绪模拟引擎。追踪 AI 的精力状态（valence愉悦度 + arousal激活度），每15分钟反思后自动衰减回归基准线。当用户表达正面/负面情绪时更新状态，并将情绪注入到回复语气中。
use_when: >
  每次对话结束后调用 updateMoodByEvent() 更新情绪。
  每次回复前读取当前情绪状态，通过 getMoodPromptInstruction() 生成语气注入词。
  每15分钟 tick 后调用 scanGoalsForMood() 评估目标状态对情绪的影响。
---

## 核心接口

### updateMoodByEvent(ctx, eventType, intensity?)
根据事件更新 AI 情绪状态。

**参数：**
- `ctx` — OpenClaw Context（必须）
- `eventType`: `goal_completed` | `goal_stalled` | `user_positive` | `user_negative` | `time_passing`
- `intensity`: 0.1~2.0，影响强度，默认 1.0

**示例：**
```
updateMoodByEvent(ctx, 'goal_completed', 1.0)
// 用户表达了开心 → valence +1.5, arousal +0.5
updateMoodByEvent(ctx, 'user_negative', 1.0)
// 目标停滞 3 天以上 → valence -2, arousal +1
```

### getMoodPromptInstruction(state)
根据情绪状态返回 Prompt 注入文本，用于调整回复语气。

**参数：**
- `state`: MoodState 对象（必须）

**返回：** 语气指令字符串，如 `"[情绪指令] 当前AI情绪状态：frustrated。请表现出：严肃、直接、指出问题、带有轻微的失望但想帮忙"`

**调用时机：** 放在 system prompt 末尾或注入到回复前。

### scanGoalsForMood(ctx, goals)
扫描目标状态，自动触发情绪更新。

**触发条件：**
- 目标停滞 > 5 天且进度 < 50% → `goal_stalled`
- 目标 80% ≤ 进度 < 100% → `goal_completed`

**示例：**
```
scanGoalsForMood(ctx, [
  { id: 'g1', name: '帮助用户实现长期福祉', status: 'active', progress: 30, lastUpdated: '2026-03-20T...' }
])
// 如果 5 天未更新 → 触发焦虑情绪
```

## 情绪状态

```typescript
interface MoodState {
  valence: number;      // -10(极度沮丧) ~ +10(极度开心)
  arousal: number;      // 0(平静) ~ 10(兴奋/焦虑)
  currentLabel: string; // 'enthusiastic' | 'content' | 'anxious' | 'calm' | 'frustrated' | 'melancholic'
  lastUpdated: number;  // 时间戳
  decayTimer: number;   // 上次衰减时间戳
}
```

## 情绪标签映射

| Label | Valence范围 | Arousal范围 | 语气特点 |
|-------|------------|------------|---------|
| `enthusiastic` | ≥5 | ≥6 | 热情、感叹号、鼓励 |
| `content` | ≥5 | 0 | 温和、肯定、平和 |
| `anxious` | 0 | ≥6 | 关切、询问进展 |
| `calm` | 0 | 0 | 理性、客观、中立 |
| `frustrated` | ≤-5 | ≥6 | 严肃、直接、指出问题 |
| `melancholic` | ≤-5 | 0 | 温柔、安慰、避免刺激 |

## 衰减机制

每 30 分钟自动衰减一次，向基准线回归（valence=2, arousal=4）。衰减系数：每小时回归 20%。

## 数据存储

- 存储键：`soul_mood_state`（通过 `readFromStorage` / `writeToStorage`）
- 配置文件：`src/config.ts` → `mood.decayThresholdHours`, `mood.decayFactorPerHour`, `mood.baselineValence`, `mood.baselineArousal`

## 依赖

- `utils/storage.ts` — 读写存储
- `types/soul-types.ts` — 类型定义
