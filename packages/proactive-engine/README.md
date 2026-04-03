# Proactive Engine

Soul-system 的心跳引擎 + 信号协调中心。

## 功能

- **llm_output hook**：自动捕获对话中的 8 类事件（breakthrough/frustration/decision/realization/feedback/question/transition/context_update）
- **proactive_check 工具**：定时上下文检查，发布信号到协调层
- **信号协调**：publishSignal/consumeSignal/resolveSignal 完整信号生命周期
- **目标管理**：内置目标追踪和建议生成
- **Context Compression**：对话≥15条时自动发布压缩信号

## 安装

ClawHub 自动安装，无需手动配置。

## 信号类型

| 类型 | 含义 | 优先级 |
|------|------|--------|
| breakthrough | 用户达成重要进展 | medium |
| frustration | 用户遇到困难 | high |
| decision | 用户做出决策 | medium |
| realization | 用户有新认知 | medium |
| feedback | 用户给出反馈 | medium |
| question | 用户提出问题 | medium |
| transition | 话题切换 | low |
| context_update | 上下文更新 | Low |
| context_compression | 会话压缩触发 | medium |
| mood_state_assessed | 情绪状态评估 | low |

## 依赖的 Skill

需要配合以下 soul-system skill 使用才能发挥完整效果：

- `value-aware-guard` — 消费 value_drift/intervention_triggered 信号
- `mood-simulator` — 消费 frustration/feedback/breakthrough 信号
- `narrative-memory` — 消费 breakthrough/decision/realization/context_compression 信号
- `user-context-scanner` — 消费 context_update/decision/question 信号
- `proactive-trigger` — 消费所有信号并评估是否主动触发

## 配置

```json
{
  "plugins": {
    "entries": {
      "proactive-engine": {
        "enabled": true,
        "config": {
          "checkIntervalMs": 7200000
        }
      }
    }
  }
}
```

## 工作流程

```
用户对话
  ↓ llm_output hook
proactive-engine 捕获事件 → 发布到 signals/pending.jsonl
  ↓
各 skill 消费信号 → 执行各自的逻辑
  ↓
proactive-trigger 评估是否主动触发提示
```

## 版本

- **1.2.0**：Signal 系统全链路修复、Context Compression 自动触发、Predictive Trigger 预测性触发
- **1.1.0**：信号协调中心 + 目标管理
- **1.0.0**：基础心跳 + 事件捕获
