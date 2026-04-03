---
name: dream-task
description: Claude Code 风格的四阶段记忆整合任务。在系统刚醒来的时刻（周日 9AM）触发，对睡眠期间的积累进行整理合并。触发条件：距上次整合 ≥24h 且积累 ≥5 条新 session summary。
---

# DreamTask — 四阶段记忆整合

## 触发条件

- **时间**：每周日 9:00 AM（Asia/Shanghai）
- **前置检查**：距上次整合 ≥24h，且 memory/ 目录下有 ≥5 条 session summary
- **兜底**：即使不满足条件，每月 1 日也强制跑一次

## 四阶段工作流

### Phase 1 — Orient（定位）

读取现有记忆文件，防止重复整合：

1. 读取 `.soul/narrative-memory.json` 获取当前记忆列表
2. 读取 `memory/session-memory-state.json` 获取上次整合时间戳
3. 扫描 `memory/` 目录下所有 session summary
4. 确认哪些是上次整合后新增的（去重依据）

### Phase 2 — Gather（采集）

扫描睡眠期间的 session 记录，收集具体细节：

1. 读取 `memory/YYYY-MM-DD.md` 日志文件（取最近 2 天）
2. 从 `.soul/narrative-memory.json` 提取新增的 session summary
3. 从 `memory/feedback-log.json` 提取睡眠期间的正负反馈
4. 汇总所有来源，标记时间线

### Phase 3 — Consolidate（整合）

合并重复、修正矛盾、统一时间表达：

1. **合并重复**：同一事件的多个记录 → 保留最完整的一条
2. **修正矛盾**："昨天" → 替换为具体日期（如"上周五"→"2026-03-27"）
3. **删除过时**：被后续记录推翻的事实 → 标记为 `superseded`
4. **时间归一化**：所有时间戳统一为 ISO 8601 格式

### Phase 4 — Prune（修剪）

控制记忆文件体积，防止无限膨胀：

1. 检查 `.soul/narrative-memory.json` 总行数
2. 如果超过 **200 行**或 **25KB**，执行修剪：
   - 按 importance 排序，保留高价值记录
   - 旧记录归档到 `memory/archive/YYYY-MM.json`
3. 更新索引文件
4. 写入本次整合记录（含处理了哪些文件、删了多少条）

## 依赖的 Skill

DreamTask 整合以下 skill 的产出：

| Skill | 提供的内容 |
|-------|----------|
| `narrative-memory` | 有意义事件的叙事记录（整合来源） |
| `session-memory` | 每日 session summary（整合来源） |
| `feedback-tracker` | 正负反馈记录（整合时同步更新 MEMORY.md） |

## 输出文件

1. **更新**：`.soul/narrative-memory.json`（整合后的记忆）
2. **归档**：将旧记录移动到 `memory/archive/YYYY-MM.json`
3. **状态**：更新 `memory/dreamtask-state.json`（上次整合时间、处理统计）
4. **报告**：如果整合了 ≥10 条，写入 `memory/dreamtask-report.md` 供强哥查看

## 兜底机制

- **强制触发**：每月 1 日 9AM，无论积累数量都跑一次
- **连续失败**：连续 2 次失败后，改用轻量模式（只做 Orient + 最小 Prune）
- **空状态保护**：如果 narrative-memory.json 不存在，初始化空结构，不报错
- **部分失败**：某 phase 失败不影响后续 phases，继续执行

## 状态文件格式

`memory/dreamtask-state.json`:
```json
{
  "lastRunTime": "2026-04-03T09:00:00+08:00",
  "lastRunStatus": "success",
  "recordsProcessed": 23,
  "recordsRemoved": 5,
  "recordsArchived": 18,
  "nextScheduledRun": "2026-04-07T09:00:00+08:00",
  "consecutiveFailures": 0
}
```
