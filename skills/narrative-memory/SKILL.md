---
name: narrative-memory
description: 叙事性记忆管理器。将对话中的重要事件按时间线记录，构建用户的"人生故事"。同时维护目标里程碑，追踪每个目标的创建、进展和完成节点。
use_when: >
  每次对话结束后调用 processNewMemory() 记录事件。
  目标状态变化时调用 updateGoals() 记录里程碑。
  用户查询"最近发生了什么""我的目标进展"时调用 getTimeline() 读取时间线。
---

## 核心接口

### processNewMemory(ctx, userInput, aiResponse?)
解析对话内容，将有意义的事件写入时间线。

**参数：**
- `ctx` — OpenClaw Context
- `userInput` — 用户说的话（必填）
- `aiResponse` — AI 的回复（可选）

**自动识别的事件类型：**
- 目标进展：`"我完成了xxx的第一步"` → 里程碑
- 情绪变化：`"最近特别累""太开心了"` → 情绪事件
- 关键决策：`"决定开始做xxx"` → 人生节点
- 日常记录：`"今天做了xxx"` → 一般事件

**示例：**
```
processNewMemory(ctx, '今天终于完成了第一版产品设计稿', '太棒了！这是重要的里程碑')
// → 写入时间线：事件类型 milestone，标签 [产品, 职业]

processNewMemory(ctx, '最近工作压力很大，经常加班到很晚')
// → 写入时间线：事件类型 emotion_change，标签 [工作, 健康]
```

### addToTimeline(ctx, event)
手动向时间线添加事件（不依赖自动解析）。

**参数：**
- `event`: MemoryFragment 对象

```typescript
interface MemoryFragment {
  id: string;
  type: 'event' | 'milestone' | 'decision' | 'emotion_change' | 'goal_update';
  timestamp: string;           // ISO 8601
  summary: string;              // 事件摘要（< 50字）
  detail?: string;              // 详细描述
  tags: string[];               // 标签
  importance: number;            // 0~1，重要程度
  relatedGoals?: string[];      // 关联目标 ID
}
```

**示例：**
```
addToTimeline(ctx, {
  id: 'ms-001',
  type: 'decision',
  timestamp: new Date().toISOString(),
  summary: '决定创业做 AI 工具',
  tags: ['创业', 'AI'],
  importance: 0.9,
  relatedGoals: ['g1']
})
```

### updateGoals(ctx, goals)
将目标状态同步到时间线，记录里程碑。

**示例：**
```
updateGoals(ctx, [
  { id: 'g1', name: '帮助用户实现长期福祉', progress: 30, status: 'active' },
  { id: 'g2', name: '持续优化自身能力', progress: 60, status: 'active' }
])
// → 为每个目标创建/更新 milestone 记录
```

### getTimeline(ctx, options?)
读取时间线。

**参数：**
- `options.filter?: { type?, tag?, since?, limit? }`
- `options.since?: string` — ISO 时间戳，只返回该时间之后的事件
- `options.limit?: number` — 最多返回条数，默认 50

**返回：** `MemoryFragment[]`（按时间倒序）

### getMilestones(ctx, goalId?)
读取目标里程碑。

**示例：**
```
getMilestones(ctx, 'g1')
// → [{ timestamp: '2026-03-01', progress: 10, note: '开始' },
//    { timestamp: '2026-03-15', progress: 30, note: '阶段性进展' },
//    { timestamp: '2026-03-20', progress: 50, note: '继续推进' }]
```

## 数据结构

```typescript
interface NarrativeMemoryStore {
  fragments: MemoryFragment[];   // 所有事件片段
  goalMilestones: Record<string, GoalMilestone[]>; // 目标 ID → 里程碑列表
  lastUpdated: string;         // 最后更新时间
}

interface GoalMilestone {
  timestamp: string;
  progress: number;            // 0~100
  note?: string;
}
```

## 数据存储

- 存储键：`soul_narrative_timeline`
- 通过 `readFromStorage` / `writeToStorage` 读写

## 重要性阈值

- importance ≥ 0.8 → 永久保留
- importance < 0.8 → 超过 100 条时，按时间+重要性淘汰最旧的

## 依赖

- `utils/storage.ts`
- `types/soul-types.ts`
