---
name: proactive-trigger
description: 主动触发引擎：基于兴趣衰减、沉默检测、话题热度，决定何时进行主动干预。触发条件：用户沉默、兴趣衰减。
---

# Proactive Trigger - 主动触发引擎

## 快速开始

### 1. 安装依赖
```bash
cd skills/proactive-trigger
npm install
```

### 2. 基本使用
```bash
# 评估触发时机
node scripts/trigger.js assess --interest-graph

# 检查沉默指数
node scripts/trigger.js suggest --silence-index

# 查看触发条件
node scripts/trigger.js check
```

### 3. 信号处理
```bash
node scripts/trigger.js --process-signal boundary_violation
```

## 命令

| 命令 | 说明 |
|------|------|
| `assess` | 评估触发时机 |
| `suggest` | 生成触发建议 |
| `check` | 检查触发条件 |

## 数据存储

- 触发状态：`~/.soul/trigger-state.json`
- 兴趣图谱：`~/.soul/interest-graph.json`

## 示例

```bash
# 评估兴趣图谱
node scripts/trigger.js assess --interest-graph

# 检查沉默
node scripts/trigger.js suggest --silence-index
```