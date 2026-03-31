---
name: user-context-scanner
description: >
  用户画像更新。当用户透露偏好、习惯、价值观时，调用 soul_context 更新用户画像。
  触发词：通常、一般、喜欢、讨厌、想要、我一般、我习惯
---

# 用户画像系统

维护用户特征数据库，让AI能够"了解这个人"。

## 触发时机

用户透露以下信息时，**自动**调用 `soul_context` 的 `add` 动作：

| 信息类型 | 识别模式 | 写入字段 |
|---------|---------|---------|
| 领域标签 | "我是程序员"、"在做运营"、"搞设计" | values |
| 偏好 | "我喜欢xxx"、"我一般xxx" | preferences |
| 习惯 | "我习惯xxx"、"通常我会xxx" | habits |
| 工作状态 | "最近很忙"、"刚休假回来" | （记录为标签） |

## 调用方式

```
工具：soul_context
动作：add
参数：
  key: <字段名>
  value: <提取到的信息>
```

## 示例

**用户说：** "我一般周末喜欢在家看书"

→ 调用：
```
soul_context(action="add", key="habits", value="周末阅读")
soul_context(action="add", key="values", value="reading")
```

**用户说：** "我是个开发者，平时用TypeScript比较多"

→ 调用：
```
soul_context(action="add", key="values", value="developer")
soul_context(action="add", key="values", value="typescript")
```

## 读取画像

当需要了解用户偏好时调用：
```
工具：soul_context
动作：get
```

## 注意事项

- 只记录，不主动询问
- 一个话题只记一次（重复偏好不覆盖）
- 刑部审核时可查阅用户画像，确保语气合适
