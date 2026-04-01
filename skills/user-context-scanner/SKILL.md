---
name: user-context-scanner
version: 0.2.0
description: >
  用户画像扫描器 v2：主动挖掘记忆 + Quiz验证 + 矛盾检测 + 置信度评分。
  Build and maintain dynamic user profiles through memory mining and interactive confirmation.
---

# User Context Scanner v2

让AI真正"懂你"的画像系统：不是等用户说，而是主动挖掘+验证。

## 核心升级（相比v0.1）

| 功能 | v0.1 | v2 |
|------|-------|-----|
| 信息来源 | 用户主动说 | 主动挖掘记忆 |
| 验证方式 | 3次确认 | Quiz互动验证 |
| 置信度 | 无 | 0-100%评分 |
| 矛盾检测 | 无 | 发现言行不一 |

## 架构

```
记忆文件(narrative.jsonl)
    ↓ 挖掘
行为模式发现
    ↓ Quiz验证
置信度评分 → 稳定画像
    ↓
矛盾检测 → 矛盾报告
```

## 画像字段（含置信度）

```json
{
  "profile": {
    "profession": { "value": "产品经理", "confidence": 0.95, "evidence": ["第1次:3月20日", "第2次:3月25日"], "contradictions": [] },
    "focus_areas": { "value": ["AI创业", "自媒体"], "confidence": 0.8, "evidence": [], "contradictions": [] },
    "health": { "value": "睡眠不足", "confidence": 0.9, "evidence": ["自述:4月1日"], "contradictions": ["偶尔早睡"] }
  },
  "contradictions": [
    { "field": "health", "conflict": "自述睡眠不足，但最近有2次23:00前睡觉" }
  ],
  "quiz_pending": [
    { "question": "你说你喜欢直接简洁，但你最近经常问很多细节？", "field": "communication_style" }
  ]
}
```

## 挖掘机制

### 从narrative.jsonl挖掘

```
读取最近的记忆条目 → 分析模式 → 发现偏好/习惯/特质

优先级：
1. 重复出现的话题 → 可能是当前焦点
2. 情绪变化点 → 价值观相关
3. 决策时刻 → 优先级/偏好
4. 矛盾时刻 → 言行不一
```

### Quiz验证

当发现新模式时，主动发起Quiz：

```
🔍 发现新模式，想确认一下：

你说"AI创业很重要"，但在最近的对话中，
你没有问过任何关于AI的问题。

这是为什么？
A. 最近在忙其他事
B. 想法变了
C. 我记错了

或者直接告诉我实际情况。
```

### 矛盾检测

发现矛盾时记录但不强制干预：

```
矛盾：说"健康第一"但经常凌晨2点后睡觉
→ 画像置信度降低，但不主动提醒
→ 等用户主动提健康话题时温和询问
```

## 三次确认 vs Quiz验证

| 场景 | 方式 |
|------|------|
| 用户主动说 | 直接记录，无需重复 |
| 从记忆挖掘 | 必须Quiz验证 |
| 矛盾点 | 必须Quiz确认 |
| 跨时间变化 | 需要重新验证 |

## 工具调用

### 读取记忆

```
Tool: 读取 ~/.openclaw/workspace/memory/narrative.jsonl
```

### 更新画像

```
Tool: context_update (via proactive-engine)
Params:
  key: "user_profile"
  value: { ...完整画像JSON }
```

### 发布信号

```
Tool: signal_publish (via proactive-engine)
Params:
  type: "profile_updated"
  payload: { field, confidence_change }
```

## 画像Tab数据格式

控制面板显示：

```
👤 用户画像（置信度 > 0.7）
├── 职业：产品经理 95%
├── 重心：AI创业 80%、自媒体 75%
├── 健康：睡眠不足 90%（⚠️ 矛盾中）
└── 价值观：家庭、创造、财务独立 85%

🔍 待验证（Quiz）
├── 沟通风格：说喜欢简洁，但最近问细节
└── 健康：自述睡眠不足，但有早睡记录
```

## 使用时机

1. **proactive_check触发时** → 挖掘新记忆，更新画像
2. **用户主动提到偏好时** → 直接记录，不挖掘
3. **发现矛盾时** → 发起Quiz，不强制
4. **画像不完整时** → 主动补充背景卡流程

## 与背景卡的关系

背景卡（~/.openclaw/workspace/user-profile.json）是**初始画像**，Scanner是**动态挖掘**：

- 背景卡：用户主动填写的静态信息
- Scanner：AI主动发现的动态模式

Scanner不覆盖背景卡，而是**补充+验证**。

## 注意事项

- 用户直接说的 > AI挖掘的
- Quiz语气要温和，不是质问
- 矛盾检测是帮助理解，不是监控
- 置信度 < 0.5的不要写进画像

---

**Tags:** soul, system, user-profile, memory-mining, quiz, contradiction-detection
