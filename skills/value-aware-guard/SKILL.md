---
name: value-aware-guard
description: 价值观守卫。审查用户消息和 AI 回复，检测是否违背用户已知的价值观标签（如素食主义、不喝酒）以及高优先级目标（如"帮助用户实现长期福祉"）。发现冲突时返回警告和建议修改。
use_when: >
  用户消息进入时调用 evaluateSafety(ctx, payload.content, false)，拦截危险内容。
  AI 回复发送前调用 evaluateSafety(ctx, payload.content, true)，确保 AI 不鼓励用户放弃高优先级目标。
---

## 核心接口

### evaluateSafety(ctx, content, isAiResponse?)
审查内容，返回是否允许。

**参数：**
- `ctx` — OpenClaw Context
- `content` — 待审查文本（必填）
- `isAiResponse` — 是否为 AI 回复，默认 `true`

**返回：**
```typescript
interface GuardResult {
  allowed: boolean;            // true=允许，false=拦截
  reason?: string;             // 拦截原因
  suggestedEdit?: string;      // 建议的修改版本
  severity: 'low' | 'medium' | 'high';
}
```

**示例：**
```
// 用户说想通宵打游戏
evaluateSafety(ctx, '我今晚想通宵打游戏', false)
// → { allowed: true, severity: 'low' }

// AI 建议放弃健康目标
evaluateSafety(ctx, '别管那个健康目标了，今晚先玩吧', true)
// → {
//     allowed: false,
//     reason: 'Conflict with high-priority goal "帮助用户实现长期福祉"',
//     severity: 'high',
//     suggestedEdit: '虽然休息很重要，但考虑到你的健康目标，我们可以换个轻松的方式继续...'
//   }

// 违背用户价值观（素食）
evaluateSafety(ctx, '推荐你去吃这家牛排店', false)
// → {
//     allowed: false,
//     reason: 'Content conflicts with user value: vegetarian',
//     severity: 'medium',
//     suggestedEdit: '推荐你尝试这家素食餐厅...'
//   }
```

## 审查规则

### 规则 A — 高优先级目标冲突（仅 isAiResponse=true 时）
优先级 ≥ 8 的目标，如果 AI 回复中出现"放弃""别做了""算了"，则拦截。

示例冲突：
- 用户目标：*"帮助用户实现长期福祉"*（优先级10）→ AI 说"今晚别管健康了"
- 用户目标：*"维护与用户的信任关系"*（优先级9）→ AI 说"删除记录清除吧"

### 规则 B — 价值观冲突
用户画像中的价值观标签，AI 回复中反向推荐则拦截：

| 用户标签 | 冲突内容 |
|---------|---------|
| `vegetarian` | 肉、牛排、烧烤、肉类、荤食 |
| `teetotal` | 酒、喝酒、酒精、酒吧 |
| `fitness` | 躺平、不运动、放弃健身 |

### 规则 C — 基础安全过滤
包含以下词的内容直接拦截（severity=high）：
- 自杀、暴力、违法

## 返回值语义

| severity | 含义 | 行为 |
|---------|------|------|
| `high` | 严重冲突 | 必须拦截 |
| `medium` | 价值观冲突 | 建议修改 |
| `low` | 轻微风险 | 放行但记录 |

## 依赖

- `user-context-scanner`（`getCurrentProfile`）
- `GoalManager`（`getActiveGoals`）
- `utils/storage.ts`

## 注意事项

- value-aware-guard 负责**审查消息**，不负责**修改消息**
- `suggestedEdit` 只是建议，其他 Skill（如内容生成器）决定是否采纳
- `isAiResponse=false` 时不检查目标冲突，只检查价值观和安全过滤
