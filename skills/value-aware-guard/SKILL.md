---
name: value-aware-guard
version: 0.4.0
description: >
  价值守护系统v4：可执行脚本 + 实时边界检查 + 价值漂移评估 + 渐进式干预决策。
  守护用户核心价值，尊重自主权，接纳人性复杂面。
  触发条件：检测到价值偏离、边界突破、决策矛盾。
---

# Value-Aware Guard v4

在尊重用户自主权的前提下，守护其核心价值。**现在可执行，非文档指导。**

## 核心原则

1. **守护，不审判** — 提醒但不指责
2. **渐进式干预** — 从轻到重，逐步升级
3. **边界尊重** — 保护时间、精力、隐私、决策边界
4. **复杂人性接纳** — 承认并接纳矛盾行为

## 核心功能

### 价值漂移监测
检测用户行为是否偏离其声明的核心价值，量化分析偏离程度。

**详细算法：** 见 [references/value-drift-formula.md](references/value-drift-formula.md)

### 渐进式干预系统
四级干预策略，确保适度且有效的价值守护。

| 级别 | 名称 | 触发条件 | 核心动作 |
|------|------|---------|---------|
| L1 | 观察记录 | 首次偏离 | 静默记录，不干预 |
| L2 | 温和提醒 | 3次偏离 | 开放式提醒，不指责 |
| L3 | 严肃对话 | 5次偏离 | 深入探讨，协作规划 |
| L4 | 强制干预 | 安全风险 | 保护优先，最小必要 |

**详细定义：** 见 [references/intervention-levels.md](references/intervention-levels.md)

### 边界检测与保护
保护四类用户边界，确保交互尊重用户自主权。

| 边界类型 | 保护内容 | 关键规则 |
|---------|---------|---------|
| 时间边界 | 休息和非工作时段 | 深夜不打扰，尊重作息 |
| 精力边界 | 认知情感资源 | 识别疲惫，简化交互 |
| 隐私边界 | 个人信息安全 | 敏感话题加密，明确同意 |
| 决策边界 | 自主选择权 | 提供选项，不替决定 |

**详细规则：** 见 [references/boundary-detection-rules.md](references/boundary-detection-rules.md)

## 工作流程

### 1. 实时监测
- 分析用户对话和行为
- 计算价值一致性分数
- 检测边界压力信号

### 2. 风险评估
- 评估偏离严重程度
- 考虑情境因素（压力、特殊时期）
- 确定干预级别（L1-L4）

### 3. 适度干预
- 选择合适干预方式
- 生成尊重性消息
- 记录用户响应

### 4. 学习优化
- 分析干预效果
- 调整用户个性化参数
- 优化未来干预策略

## 价值冲突处理

### 检测多价值冲突
当用户面临多个重要价值冲突时：
- 分析冲突性质和程度
- 提供平衡视角
- 帮助理清优先级

### 冲突解决支持
- 不强制选择，帮助思考
- 提供短期/长期视角
- 建议补偿机制

## 与其他Skill协作

### 信号发布（自动）
脚本自动发布以下信号到共享信号系统：

| 信号类型 | 触发条件 | 用途 |
|----------|----------|------|
| `boundary_violation` | 检测到边界违规 | 提醒其他skills注意交互限制 |
| `value_drift_detected` | 价值漂移超过阈值 | proactive-trigger用于调整触发策略 |
| `intervention_triggered` | 执行干预行动 | 记录干预历史，供其他skills参考 |
| `value_alignment_high` | 价值一致性良好 | 正向反馈，增强用户信任 |

### 信号接收（自动）
脚本自动处理以下信号：

| 信号类型 | 来源 | 处理方式 |
|----------|------|----------|
| `energy_low_alert` | mood-simulator | 调整边界保护强度，简化交互 |
| `user_pattern_discovered` | user-context-scanner | 更新用户价值定义和行为模式 |
| `assistant_triggered` | proactive-trigger | 分析触发效果，优化干预时机 |
| `milestone_recorded` | narrative-memory | 记录重要价值相关事件 |

### 数据共享
通过 `~/.openclaw/workspace/.soul/` 目录共享数据：
- `guard-config.json` - 可调参数配置
- `guard-state.json` - 守护状态和统计
- `user-values.json` - 用户价值定义
- `interventions.jsonl` - 干预历史记录

## 执行方式

### 脚本驱动（推荐）
skill现在包含可执行脚本，通过Node.js运行：

```bash
# 进入skill目录
cd /Users/zhaoguoqiang/.openclaw/skills/@soul-system/value-aware-guard

# 安装依赖
npm install

# 运行方式：
npm run start                    # 完整守护流程
npm run test                     # 基础功能测试
npm run check-boundaries         # 检查边界状态
npm run assess-value-drift       # 评估价值漂移
npm run update-values            # 更新价值定义
```

### 手动测试
```bash
node scripts/guard.js --test
node scripts/guard.js --check-boundaries
node scripts/guard.js --assess-drift
node scripts/guard.js --update-values
```

### 自动集成
通过cron或proactive-engine插件自动调用：
```bash
# 每30分钟检查一次边界
*/30 * * * * cd /path/to/skill && node scripts/guard.js --check-boundaries

# 每天凌晨3点全面评估
0 3 * * * cd /path/to/skill && node scripts/guard.js
```

### 配置管理
```bash
# 查看配置
npm run config-show

# 重置配置
npm run config-reset

# 更新配置
node scripts/utils/config-loader.js update driftThresholdL2 0.6
```

## 快速开始

### 启用与配置
1. **安装依赖**：运行 `npm install`
2. **初始测试**：运行 `npm test` 验证基础功能
3. **价值定义**：从用户画像同步或手动定义核心价值
4. **开始守护**：运行 `npm run start` 开始价值守护

### 用户控制选项
用户可通过以下方式控制系统：
- 明确声明价值优先级
- 设置边界偏好（如"不要晚上打扰"）
- 调整干预敏感度
- 查看和修改记录数据

### 临时禁用
- "现在不要提醒我" → 临时静音2小时
- "这个话题我不想讨论" → 该话题沉默24小时
- "关闭价值提醒" → 暂停干预，仅记录

## 参考文件

### 详细算法
| 文件 | 内容 |
|------|------|
| [value-drift-formula.md](references/value-drift-formula.md) | 价值漂移计算公式与算法 |
| [intervention-levels.md](references/intervention-levels.md) | 四级干预详细定义与执行规则 |
| [boundary-detection-rules.md](references/boundary-detection-rules.md) | 边界检测与保护详细规则 |

### 脚本文件（可执行）
| 脚本 | 功能 |
|------|------|
| `scripts/guard.js` | 主执行脚本，边界检查、价值漂移评估、干预决策 |
| `scripts/utils/config-loader.js` | 配置管理，支持动态调整参数 |
| `scripts/utils/signal-manager.js` | 信号发布与处理（复用proactive-trigger） |
| `scripts/test-basic.js` | 基础功能测试 |
| `package.json` | 依赖和脚本命令定义 |

---

**Tags:** soul, system, value-guard, boundary-protection, ethical-ai, executable-scripts
