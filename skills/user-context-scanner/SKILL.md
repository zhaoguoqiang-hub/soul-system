---
name: user-context-scanner
description: 用户画像构建器。每次用户消息后扫描内容，提取价值观标签（如 vegetarian/teetotal/fitness）、偏好、习惯、沟通风格偏好，实时更新用户画像，供其他 Skill 使用。
use_when: >
  每次用户消息进入时调用 scanAndUpdateProfile()。
  其他 Skill（如 value-aware-guard）需要用户画像时调用 getCurrentProfile()。
---

## 核心接口

### scanAndUpdateProfile(ctx, userInput)
分析用户消息，提取并更新画像。

**参数：**
- `ctx` — OpenClaw Context
- `userInput` — 用户输入文本（必填）

**提取逻辑：**
1. 关键词匹配 → 更新价值观标签（vegetarian/teetotal/fitness/developer 等）
2. 文本长度分析 → 更新沟通风格（长文本→detailed，短文本→brief）
3. 逻辑连接词检测（因为/所以）→ detailed 风格

**示例：**
```
scanAndUpdateProfile(ctx, '最近在健身，每天跑步5公里，感觉状态不错')
// → tags: ['fitness', 'outdoor']
// → style: 'warm'

scanAndUpdateProfile(ctx, '我吃素，不吃肉')
// → tags: ['vegetarian']
```

### getCurrentProfile(ctx)
获取当前用户画像，供其他 Skill 使用。

**返回：** `UserProfile` 对象

```typescript
interface UserProfile {
  current_mood: 'neutral' | 'happy' | 'sad' | 'anxious' | 'frustrated';
  mood_confidence: number;           // 0~1，置信度
  suggested_response_style: ResponseStyle;
  emotion_history: string[];         // 历史情绪标签
  preferences: string[];             // 用户偏好标签
  habits: string[];                // 习惯标签
  values: string[];                // 价值观标签
  personality: {
    humor: number;                 // 0~1
    honesty: number;
    professionalism: number;
    proactivity: number;
    directness: number;
  };
  last_updated: string;             // ISO 时间戳
}
```

**调用示例：**
```
const profile = await getCurrentProfile(ctx);
if (profile.values.includes('vegetarian')) {
  // 避免推荐肉食
}
```

## 价值观标签

通过关键词自动打标签：

| 标签 | 触发关键词 |
|------|-----------|
| `vegetarian` | 吃素、不吃肉、素食 |
| `teetotal` | 不喝酒、戒酒、滴酒不沾 |
| `fitness` | 健身、跑步、锻炼、运动 |
| `developer` | 编程、代码、程序员 |
| `reading` | 看书、阅读、学习 |
| `movies` | 电影、追剧 |
| `workaholic` | 加班、忙、累 |
| `leisure` | 周末、休息、度假 |

## 沟通风格判定

| 风格 | 触发条件 |
|------|---------|
| `warm` | 文本 > 100 字且含"因为""所以"等逻辑词 |
| `brief` | 文本 < 10 字 |
| `normal` | 其他 |

## 数据存储

- 存储键：`soul_user_profile_v1`
- 类型来源：`types/soul-types.ts` → `UserProfile`

## 依赖

- `utils/storage.ts`
- `types/soul-types.ts`
