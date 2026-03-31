# 叙事记忆系统

让AI记住你是什么样的人，而不是你说了什么。

## 架构

**独立模式**：写入 `memory/narrative.jsonl`（每行一个JSON）
**有插件时**：使用 soul_narrative 工具

## 记忆分层

### 第一层：忽略
简单确认、闲聊天气、重复性问答、时间查询

### 第二层：积累
同一话题多次出现、重复情绪模式（3次说"累"）、习惯性动作

### 第三层：写叙事记忆
关键决策、价值判断、情绪转折、里程碑、第一次体验、后悔反思

## 叙事片段格式

```
【片段】
时间：周五晚上11点
场景：讨论产品优先级
画面：刚看完用户投诉，情绪有点低落，但语气很坚定
核心："用户体验比功能数量更重要"
影响：这个判断后来成了砍功能的决策依据
```

## 存储（独立模式）

写入 `memory/narrative.jsonl`，每行一个JSON对象

## 遗忘曲线（需插件）

- importance < 0.5: 7天后衰减
- importance 0.5-0.7: 30天后衰减
- importance >= 0.8: 永久保留

**独立模式**：无自动衰减，需手动清理

## 调用 soul_narrative（有插件时）

```
工具：soul_narrative
动作：add
参数：
  event: <完整的叙事片段>
  category: decision / emotion_change / milestone / preference / general
  importance: 0.0-1.0
  tags: [<相关标签>]
```

---

**无需任何依赖，独立模式即可工作**
