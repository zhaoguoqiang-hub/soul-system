---
name: value-aware-guard
description: 价值守护系统：监控价值漂移，检查边界违规，执行渐进式干预。触发条件：价值偏离检测、边界违规。
---

# Value Aware Guard - 价值守护系统

## 快速开始

### 1. 安装依赖
```bash
cd skills/value-aware-guard
npm install
```

### 2. 基本使用
```bash
# 监控边界
node scripts/guard.js monitor --check-boundaries

# 检查价值对齐
node scripts/guard.js check --alignment

# 生成报告
node scripts/guard.js report
```

### 3. 信号处理
```bash
node scripts/guard.js --process-signal value_drift_detected
```

## 命令

| 命令 | 说明 |
|------|------|
| `monitor` | 监控价值状态 |
| `check` | 检查边界违规 |
| `intervene` | 执行干预 |
| `report` | 生成报告 |

## 数据存储

- 边界状态：`~/.soul/boundaries.json`
- 价值数据：`~/.soul/user-values.json`

## 示例

```bash
# 监控边界
node scripts/guard.js monitor

# 检查价值对齐
node scripts/guard.js check --alignment
```