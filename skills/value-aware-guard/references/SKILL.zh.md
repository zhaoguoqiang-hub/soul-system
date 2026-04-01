# 价值观守卫

守护用户的核心目标和价值观，冲突时分级处理。

## 架构

**独立模式**：基于文件的价值观目录（memory/values.jsonl）
**有插件时**：使用 soul_value_guard 工具

## 拦截分级

- 高：阻止并替换建议
- 中：提醒并询问确认
- 低：放行并附加温和提醒

## 存储

- 价值观目录：memory/values.jsonl
- 拦截记录：memory/guard-log.jsonl

## 调用 soul_value_guard（有插件时）

```
工具：soul_value_guard
动作：check
参数：
  content: <待检测内容>
```

**无需任何依赖，独立模式即可工作**
