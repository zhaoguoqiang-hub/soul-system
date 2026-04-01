---
name: user-context-scanner
version: 0.4.0
description: >
  用户画像扫描器 v4：可执行脚本 + 自动证据挖掘 + 实时矛盾检测 + 动态置信度评分。
  构建和维护动态用户画像，从被动记录到主动理解。
  触发条件：用户提及偏好、检测到行为模式、发现矛盾、定期画像更新、新记忆文件。
---

# User Context Scanner v4

让AI真正"懂你"：不仅记录你说的话，更理解你的行为模式和内在一致性。**现在可执行，非文档指导。**

## 核心升级

| 功能 | v2 | v3 |
|------|-----|-----|
| 数据源 | 记忆挖掘 + 用户陈述 | 增加行为模式实时分析 |
| 验证方式 | Quiz互动验证 | 优化Quiz时机和表述 |
| 矛盾处理 | 检测与记录 | 分级处理策略 |
| 画像结构 | 基础JSON结构 | 详细Schema支持 |

## 核心流程

```
数据收集 → 模式分析 → 验证澄清 → 画像更新
    ↑           ↓           ↓           ↓
持续监测 ← 矛盾检测 ← Quiz验证 ← 置信度评估
```

## 三大核心功能

### 1. 主动挖掘与分析
从对话历史和行为模式中发现用户偏好、习惯和价值倾向。

**关键能力：**
- 话题热度分析：识别用户关注重点
- 行为模式提取：发现重复行为规律  
- 价值倾向推断：从选择和表述中推断价值观
- 变化趋势监测：跟踪偏好和习惯的演化

### 2. Quiz验证与澄清
当发现新模式或矛盾时，通过交互式Quiz进行验证。

**Quiz类型：**
- 模式验证Quiz：确认发现的模式是否准确
- 矛盾澄清Quiz：理解言行不一致的原因
- 信息补充Quiz：获取画像缺失的重要细节
- 变化探测Quiz：检测偏好是否发生变化

**详细示例：** 见 [references/quiz-examples.md](references/quiz-examples.md)

### 3. 矛盾检测与处理
检测用户言行不一致，采取适度处理策略。

**矛盾类型：**
- 言行不一致：价值声明 vs 实际行为
- 前后不一致：不同时间表述矛盾
- 情境性矛盾：不同情境下行为差异
- 认知失调：持有矛盾信念

**处理策略：**
- 静默记录：轻微矛盾，仅记录不干预
- 观察等待：轻度矛盾，等待自然澄清机会
- 主动澄清：中度矛盾，温和询问理解原因
- 干预支持：严重矛盾，提供解决支持

**详细规则：** 见 [references/contradiction-rules.md](references/contradiction-rules.md)

## 画像数据结构

用户画像采用分层置信度结构，每个字段包含值、置信度和证据。

**核心字段分类：**
- 人口统计：年龄、家庭角色、居住情况
- 职业信息：当前角色、行业、职业焦点
- 价值观：核心价值、工作原则、生活哲学
- 习惯模式：工作习惯、健康习惯、学习习惯
- 沟通偏好：风格偏好、学习偏好、决策偏好

**详细Schema：** 见 [references/profile-schema.md](references/profile-schema.md)

## 置信度管理体系

基于三因素综合评估画像准确性：来源可信度、证据强度、一致性程度。

**核心公式：**
```
置信度 = 来源可信度 × 证据强度 × 一致性因子
```

**置信度级别：**
- **0.9-1.0 极高**：可作为稳定事实
- **0.7-0.9 高**：可信任，偶尔验证
- **0.5-0.7 中**：谨慎使用，建议验证
- **0.3-0.5 低**：仅作参考，需要验证
- **0.0-0.3 极低**：不应写入正式画像

**详细计算规则：** 见 [references/confidence-calculation.md](references/confidence-calculation.md)

## 工作时机

### 自动触发
1. **定期扫描**：proactive-check触发时挖掘新记忆
2. **交互分析**：每次对话后分析新出现的模式
3. **矛盾监控**：实时检测言行不一致
4. **画像维护**：定期审查和更新画像置信度

### 用户驱动
1. **明确陈述**：用户主动提及偏好或价值时直接记录
2. **查询请求**：用户询问自身模式或偏好时提供分析
3. **澄清邀请**：用户邀请AI帮助理解自身矛盾时介入
4. **手动更新**：用户明确要求更新或纠正画像信息

## 与其他Skill协作

### 信号发布（自动）
脚本自动发布以下信号到共享信号系统：

| 信号类型 | 触发条件 | 用途 |
|----------|----------|------|
| `user_pattern_discovered` | 发现新的行为模式 | proactive-trigger用于话题推送 |
| `contradiction_detected` | 检测到言行矛盾 | value-aware-guard用于价值一致性检查 |
| `profile_confidence_low` | 画像字段置信度过低 | 触发Quiz生成和验证 |
| `new_preference_identified` | 识别新的用户偏好 | mood-simulator用于情绪上下文 |
| `profile_updated` | 画像重要字段更新 | 通知所有skills更新用户上下文 |

### 信号接收（自动）
脚本自动处理以下信号：

| 信号类型 | 来源 | 处理方式 |
|----------|------|----------|
| `conversation_analysis` | narrative-memory | 分析对话中的用户陈述 |
| `value_declaration` | value-aware-guard | 记录用户价值声明 |
| `mood_state` | mood-simulator | 理解情境性行为变化 |
| `quiz_response` | 用户交互 | 更新字段置信度和值 |

### 数据共享
通过 `~/.openclaw/workspace/.soul/` 目录共享数据：
- `user-profile.json` - 结构化用户画像
- `user-evidence.jsonl` - 原始证据记录
- `scanner-config.json` - 可调参数配置
- `scanner-state.json` - 扫描状态和统计

## 执行方式

### 脚本驱动（推荐）
skill现在包含可执行脚本，通过Node.js运行：

```bash
# 进入skill目录
cd /Users/zhaoguoqiang/.openclaw/skills/@soul-system/user-context-scanner

# 安装依赖
npm install

# 运行方式：
npm run start                    # 完整扫描流程
npm run scan-memory              # 扫描记忆文件
npm run analyze-profile          # 分析画像置信度
npm run check-contradictions     # 检测矛盾
```

### 手动测试
```bash
node scripts/scanner.js --scan-memory
node scripts/scanner.js --analyze-profile
node scripts/scanner.js --check-contradictions
node scripts/scanner.js --update-profile
node scripts/scanner.js --generate-quiz
```

### 自动集成
通过cron或proactive-engine插件自动调用：
```bash
# 每天凌晨2点执行完整扫描
0 2 * * * cd /path/to/skill && node scripts/scanner.js

# 每6小时检查新记忆
0 */6 * * * cd /path/to/skill && node scripts/scanner.js --scan-memory
```

### 配置管理
```bash
# 查看配置
npm run config-show

# 重置配置
npm run config-reset

# 更新配置
node scripts/utils/config-loader.js update scanIntervalHours 12
```

## 快速开始

### 启用与初始化
1. **安装依赖**：运行 `npm install`
2. **初始测试**：运行 `npm test` 验证基础功能
3. **首次扫描**：运行 `npm run scan-memory` 开始记忆挖掘
4. **自动调度**：设置cron任务定期运行

### 背景卡导入
如有user-profile.json，自动导入作为初始画像

### 学习阶段
1-2周收集足够数据建立可靠画像

### 个性化优化
根据用户反馈调整扫描敏感度和频率

### 用户控制
用户可通过以下方式控制系统：
- 查看完整画像和置信度
- 纠正不准确信息
- 调整数据收集范围
- 控制Quiz频率和时机
- 导出个人画像数据

### 隐私保护
- 所有数据本地加密存储
- 敏感信息额外加密保护
- 用户可随时删除任何数据
- 数据不用于非直接相关分析

## 参考文件

### 详细算法
| 文件 | 内容 |
|------|------|
| [profile-schema.md](references/profile-schema.md) | 画像详细数据结构与Schema |
| [quiz-examples.md](references/quiz-examples.md) | Quiz交互示例与设计策略 |
| [contradiction-rules.md](references/contradiction-rules.md) | 矛盾检测算法与处理规则 |

### 脚本文件（可执行）
| 脚本 | 功能 |
|------|------|
| `scripts/scanner.js` | 主执行脚本，协调扫描、分析、更新全流程 |
| `scripts/utils/profile-manager.js` | 用户画像CRUD操作、证据管理、置信度计算 |
| `scripts/utils/config-loader.js` | 配置管理，支持动态调整参数 |
| `scripts/utils/signal-manager.js` | 信号发布与处理（复用proactive-trigger） |
| `scripts/test-basic.js` | 基础功能测试 |
| `package.json` | 依赖和脚本命令定义 |

---

**Tags:** soul, system, user-profile, memory-mining, contradiction-detection, confidence-scoring, executable-scripts
