# Proactive Engine

`soul-system` 的心跳引擎 —— 周期性检查上下文，主动写入记忆。

## 功能

- **主动检查工具** `proactive_check`: 周期性检查上下文，判断是否需要写入记忆
- **LLM输出钩子** `llm_output`: 捕获对话中的里程碑事件，自动记录
- **记忆基础设施**: 写入 `memory/narrative.jsonl` 和 `.soul/daily_context.json`

## 工作原理

```
Cron触发（每2小时）
  → proactive_check 工具执行
  → 分析今日上下文
  → 写入 narrative.jsonl（重要事件）
  → 更新 daily_context.json
  → 向主会话汇报结果
```

## 安装

```bash
openclaw plugins install @soul-system/proactive-engine
```

## 配置 Cron

```bash
# 创建每2小时执行一次的主动检查任务
openclaw cron add \
  --every 2h \
  --name "proactive-check" \
  --message "请执行 proactive_check force=true 并汇报结果" \
  --session isolated \
  --announce
```

## 依赖

需要 soul-system 的 5 个 skill（自动通过 ClawHub 安装）:
- `@soul-system/narrative-memory` - 叙事记忆
- `@soul-system/proactive-trigger` - 主动触发决策
- `@soul-system/user-context-scanner` - 用户上下文扫描
- `@soul-system/value-aware-guard` - 价值守护
- `@soul-system/mood-simulator` - 情绪模拟

## 发布历史

### 0.1.0
- 初始版本
- proactive_check 工具
- llm_output 里程碑捕获钩子
- 记忆文件写入支持
