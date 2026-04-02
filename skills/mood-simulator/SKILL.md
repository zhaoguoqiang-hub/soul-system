---
name: mood-simulator
description: 情绪状态模拟器：评估用户当前情绪状态、能量水平、专注度，支持实时情绪追踪。触发条件：情绪转折、能量变化。
---

# Mood Simulator - 情绪状态模拟器

## 快速开始

### 1. 安装依赖
```bash
cd skills/mood-simulator
npm install
```

### 2. 基本使用
```bash
# 模拟情绪状态
node scripts/simulator.js simulate --energy 70 --focus 80

# 调整时间因子
node scripts/simulator.js adjust --time-factor morning

# 追踪情绪变化
node scripts/simulator.js track
```

### 3. 信号处理
```bash
node scripts/simulator.js --process-signal transition
```

## 命令

| 命令 | 说明 |
|------|------|
| `simulate` | 模拟情绪状态 |
| `adjust` | 调整情绪参数 |
| `track` | 追踪情绪变化 |

## 数据存储

- 情绪状态：`~/.soul/mood-state.json`
- 能量追踪：`~/.soul/energy-tracker.json`

## 示例

```bash
# 模拟当前状态
node scripts/simulator.js simulate --energy 70 --focus 80

# 追踪情绪
node scripts/simulator.js track
```