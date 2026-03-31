---
name: narrative-memory
description: >
  叙事记忆系统。当用户分享重要事件、情绪变化、目标进展、关键决策时，
  调用 soul_narrative 工具将事件写入时间线。不干预对话，只在后台记录。
  触发词：完成了、决定了、去了、做了、心情、开心、难过、累、目标、进展
---

# 叙事记忆系统

将对话中的有意义事件编织成时间线，构建用户的"人生故事"。

## 触发时机

以下情况发生时，**自动**调用 `soul_narrative` 的 `add` 动作记录：

| 事件类型 | 识别关键词 | category | importance |
|---------|-----------|----------|------------|
| 目标进展 | "完成了"、"做到了"、"进展"、"第一步" | milestone | 0.8 |
| 情绪变化 | "开心"、"难过"、"累"、"压力大"、"兴奋" | emotion_change | 0.7 |
| 关键决策 | "决定了"、"开始做"、"选择" | decision | 0.9 |
| 偏好暴露 | "我喜欢"、"我想要"、"我不喜欢"、"习惯" | preference | 0.6 |
| 一般事件 | "今天做了"、"去了"、"见了" | general | 0.4 |

## 调用方式

```
工具：soul_narrative
动作：add
参数：
  event: <用户原话或事件描述>
  category: <上表对应类别>
  importance: <0.0-1.0>
  tags: [<相关标签>]
```

## 示例

**用户说：** "今天终于完成了产品设计第一版，太开心了"

→ 调用：
```
soul_narrative(action="add", event="完成了产品设计第一版", category="milestone", importance=0.8, tags=["工作", "产品"])
```

**用户说：** "最近加班太多，感觉特别累"

→ 调用：
```
soul_narrative(action="add", event="加班疲劳，情绪低落", category="emotion_change", importance=0.7, tags=["状态", "情绪"])
```

## 读取时间线

当用户问以下问题时，调用 `soul_narrative` 的 `timeline` 动作：

- "最近发生了什么"
- "我最近做了什么"
- "我的目标进展"

```
工具：soul_narrative
动作：timeline
参数：
  limit: 10
```

## 注意事项

- 只记录，不评论
- importance 超过 0.7 的事件，优先保留
- 每天自动汇总一次重要事件（刑部审核时使用）
