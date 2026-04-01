---
name: mood-simulator
version: 0.4.0
description: >
  情绪状态模拟器v4：可执行脚本 + 实时能量计算 + 个性化模式学习 + 自适应回应策略。
  基于时间、内容和历史的综合情绪评估。
  触发条件：每次用户互动时自动评估，调整回应长度和语气。
---

# Mood Simulator v4

让AI的回应风格精准匹配用户的当前情绪状态，实现个性化交互。**现在可执行，非文档指导。**

## 核心概念

### 情绪状态综合评估

基于三个维度评估用户当前状态：

```
综合情绪状态 = 时间因子 × 内容因子 × 历史因子

- 时间因子：基于时间段的基准能量水平
- 内容因子：分析对话内容的情绪倾向  
- 历史因子：用户最近的情绪模式
```

**详细计算：** 见 [references/energy-calculation.md](references/energy-calculation.md)

### 情绪光谱分类

识别7种主要状态类型：

| 状态类型 | 能量范围 | 回应策略 |
|----------|---------|---------|
| 积极活跃 | 0.8-1.0 | 详细深入，积极互动 |
| 平静专注 | 0.7-0.9 | 正常详细，不打扰 |
| 常规工作 | 0.6-0.8 | 标准回应，适当简化 |
| 轻微疲惫 | 0.5-0.7 | 简洁直接，重点突出 |
| 中度疲惫 | 0.3-0.5 | 非常简洁，只讲要点 |
| 情绪波动 | 0.4-0.6 | 温和安抚，结构清晰 |
| 深度休息 | 0.1-0.3 | 最简回应，必要信息 |

**详细定义与识别规则：** 见 [references/state-classification.md](references/state-classification.md)

### 时间因子调整

基于时间段和用户个性化模式调整基准能量。

**详细算法：** 见 [references/time-factor-adjustment.md](references/time-factor-adjustment.md)

## 工作流程

### 1. 实时评估
每次用户发消息时：
- 获取当前时间，计算时间因子
- 分析消息内容，计算内容因子  
- 查询历史模式，计算历史因子
- 综合计算能量值，确定状态类型

### 2. 回应调整
根据确定的状态类型调整AI回应：
- **长度调整：** 从10字到500字不等
- **深度调整：** 从只讲要点到多角度分析
- **语气调整：** 从简洁直接到温和安抚
- **互动调整：** 从最小互动到积极扩展

### 3. 记录学习
记录本次评估结果，用于优化未来评估：
- 记录预测状态 vs 用户实际回应
- 更新用户个性化模式
- 调整各因子权重

## 能量强度与回应策略

| 能量级别 | 强度值 | 回应长度 | 策略 |
|---------|-------|---------|------|
| 高能量 | 0.8-1.0 | 300-500字 | 详细深入，多角度思考 |
| 中高能量 | 0.6-0.8 | 150-300字 | 标准回应，适当简化 |
| 中等能量 | 0.4-0.6 | 80-150字 | 简洁，重点突出 |
| 低能量 | 0.2-0.4 | 30-80字 | 要点式，不啰嗦 |
| 最低能量 | 0.0-0.2 | 10-30字 | 最简，必要信息 |

## 关键特性

### 个性化学习
- 学习用户的作息模式（早起型/夜猫子型）
- 识别用户的高效时段和低谷时段
- 适应季节性、工作日/周末差异

### 上下文感知
- 分析对话内容的情绪倾向
- 识别疲惫、压力、兴奋等情绪信号
- 考虑近期对话历史

### 动态调整
- 实时微调基于最新交互
- 处理特殊情况（时区变化、疾病恢复）
- 基于反馈持续优化

## 与其他Skill协作

### 信号发布（自动）
脚本自动发布以下信号到共享信号系统：

| 信号类型 | 触发条件 | 用途 |
|----------|----------|------|
| `mood_state_assessed` | 每次情绪状态评估 | proactive-trigger用于调整触发时机 |
| `energy_low_alert` | 能量值低于0.3 | 提醒其他skills简化交互 |
| `emotion_patterns_updated` | 发现新的情绪模式 | user-context-scanner用于更新用户画像 |
| `mood_shift_detected` | 情绪状态显著变化 | value-aware-guard用于调整价值对话强度 |

### 信号接收（自动）
脚本自动处理以下信号：

| 信号类型 | 来源 | 处理方式 |
|----------|------|----------|
| `user_pattern_discovered` | user-context-scanner | 更新用户作息偏好数据 |
| `assistant_triggered` | proactive-trigger | 分析触发效果，优化评估模型 |
| `value_violation` | value-aware-guard | 调整情绪评估中的价值权重 |
| `conversation_analysis` | narrative-memory | 获取历史对话的情绪模式 |

### 数据共享
通过 `~/.openclaw/workspace/.soul/` 目录共享数据：
- `mood-config.json` - 可调参数配置
- `mood-state.json` - 当前情绪状态
- `mood-patterns.json` - 个性化情绪模式
- `mood-history.jsonl` - 历史评估记录

## 执行方式

### 脚本驱动（推荐）
skill现在包含可执行脚本，通过Node.js运行：

```bash
# 进入skill目录
cd /Users/zhaoguoqiang/.openclaw/skills/@soul-system/mood-simulator

# 安装依赖
npm install

# 运行方式：
npm run start                    # 完整评估流程
npm run test                     # 基础功能测试
npm run calculate-energy         # 计算当前能量值
npm run analyze-message          # 分析消息情绪倾向
npm run update-patterns          # 更新情绪模式
```

### 手动测试
```bash
node scripts/simulator.js --test
node scripts/simulator.js --calculate-energy
node scripts/simulator.js --analyze-message "今天有点累"
node scripts/simulator.js --update-patterns
```

### 自动集成
通过cron或proactive-engine插件自动调用：
```bash
# 每15分钟更新一次模式
*/15 * * * * cd /path/to/skill && node scripts/simulator.js --update-patterns

# 每次用户消息时评估（需与对话系统集成）
```

### 配置管理
```bash
# 查看配置
npm run config-show

# 重置配置
npm run config-reset

# 更新配置
node scripts/utils/config-loader.js update timeFactorWeight 0.5
```

## 快速开始

### 启用
1. **安装依赖**：运行 `npm install`
2. **初始测试**：运行 `npm test` 验证基础功能
3. **首次评估**：运行 `npm run start` 开始情绪状态评估
4. **模式学习**：运行 `npm run update-patterns` 建立个性化模型

### 配置选项
通过 `~/.openclaw/workspace/.soul/mood-config.json` 调整：
- 是否启用个性化学习
- 数据保存时长（默认30天）
- 最低置信度阈值（默认0.6）
- 各因子权重（时间/内容/历史）

### 手动覆盖
用户可通过以下方式手动设置状态：
- "我现在很累" → 强制设置为低能量状态
- "我现在状态很好" → 强制设置为高能量状态
- "不要调整回应风格" → 临时禁用状态调整

## 参考文件

### 详细算法
| 文件 | 内容 |
|------|------|
| [energy-calculation.md](references/energy-calculation.md) | 能量综合计算公式 |
| [state-classification.md](references/state-classification.md) | 7种状态详细定义与识别 |
| [time-factor-adjustment.md](references/time-factor-adjustment.md) | 时间因子调整算法 |

### 脚本文件（可执行）
| 脚本 | 功能 |
|------|------|
| `scripts/simulator.js` | 主执行脚本，情绪评估、能量计算、模式学习 |
| `scripts/utils/config-loader.js` | 配置管理，支持动态调整参数 |
| `scripts/utils/signal-manager.js` | 信号发布与处理（复用proactive-trigger） |
| `scripts/test-basic.js` | 基础功能测试 |
| `package.json` | 依赖和脚本命令定义 |

---

**Tags:** soul, system, mood-assessment, energy-tracking, adaptive-response, executable-scripts
