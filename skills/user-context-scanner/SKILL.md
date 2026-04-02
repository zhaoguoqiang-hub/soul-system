---
name: user-context-scanner
description: 用户画像扫描器：自动挖掘用户偏好、行为模式、兴趣图谱，支持实时上下文更新。触发条件：用户表达偏好、检测到行为模式。
---

# User Context Scanner - 用户上下文扫描器

## 快速开始

### 1. 安装依赖
```bash
cd skills/user-context-scanner
npm install
```

### 2. 基本使用
```bash
# 扫描上下文
node scripts/scanner.js scan

# 显示用户画像
node scripts/scanner.js profile

# 显示统计
node scripts/scanner.js stats
```

### 3. 信号处理
```bash
node scripts/scanner.js --process-signal context_update
```

## 命令

| 命令 | 说明 |
|------|------|
| `scan` | 扫描并更新上下文 |
| `profile` | 显示用户画像 |
| `stats` | 显示统计信息 |

## 数据存储

- 用户画像：`~/.soul/user-profile.json`
- 上下文数据：`~/.soul/context.json`

## 示例

```bash
# 扫描新上下文
node scripts/scanner.js scan

# 查看画像
node scripts/scanner.js profile
```