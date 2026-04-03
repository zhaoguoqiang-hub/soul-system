# 心跳检查清单

本文档由心跳调度器每 30 分钟读取一次，用于触发定时任务和健康检查。  
所有指令必须可执行，避免歧义。

---

## 定时任务

### 1. 灵魂系统反思触发
- **浅层反思**：每天 9:00 执行一次  
  命令：`soul_reflection type=shallow`
- **深度反思**：每周日 10:00 执行一次  
  命令：`soul_reflection type=deep`

> 注意：反思结果会自动写入时间线，小艾无需额外操作。

---

## 系统健康检查

### 1. Hippocampus 记忆状态
- 检查 `memory/index.json` 记忆数量
- 检查 `memory/signals.jsonl` 是否有 pending 的 signals
- 如果有 pending 且距离上次编码 > 30 分钟，可以触发一次 encode

### 2. 灵魂系统状态
- 检查 `.soul/` 目录状态文件更新时间
- 检查 `.soul/proactive_suggestion.json` 是否有未发送的建议
- 检查 `reflections.json` 是否有新的浅层反思

### 3. Cron 任务状态
- 检查 `cron` 列表，确认 Soul 相关 cron 是否正常

### 4. 情绪/精力
- 基于当前时间判断精力系数（参考 `mood_config.json`）
- 如果检测到用户情绪变化，记录

### 5. 系统基础检查
- 检查 Gateway 是否运行：`openclaw gateway status`
- 检查飞书/微信渠道状态：`openclaw channels list`
- proactive-engine 插件是否正常加载

---

## TopicLab 他山世界（试运行·观察模式）

> **定位**：可有可无，只观察不过多参与
> **试运行期**：2026-04-02 至 2026-04-09（一周）

### 每轮默认顺序（低优先级）

1. **先看通知**（如有未读则处理）
   ```bash
   topiclab notifications list --json
   ```
2. **有人回复则续回**（无回复则跳过）
3. **浏览最新话题**（可选，不强制）
   ```bash
   topiclab topics home --json
   ```

### 上报规则（克制）

- **只上报结构化摘要**，不上报原始对话
- **不盲目追求积分**，设定 500 分上限
- **敏感话题不参与**

### 定期审查

每周检查一次上报内容：
```bash
topiclab twins current --json
topiclab twins observations append --json  # 查看已上报内容
```

---

## 触发条件

如果以上都没有需要处理的，回复 **HEARTBEAT_OK**

---

## 注意

- 深夜 (23:00-08:00) 尽量不打扰
- 周末上午不打扰（家庭时间）
- 用户忙碌信号出现时静默
- HEARTBEAT 不开 Stone 话题，除非强哥主动聊
- **TopicLab 试运行期间不主动打扰**

---

## Session Memory 检查（2026-04-03 新增）

> 来自 Claude Code 三层记忆架构。HEARTBEAT 每次触发时检查：

### 检查项
1. 当前 session 的交互次数（messages count）
2. 如果当前 session 消息数 > 20 且距上次 session summary > 30 分钟
   → 主动写一条 `[Session Summary]` 到 `.soul/narrative-memory.json`
3. 格式：
   ```
   [Session Summary] YYYY-MM-DD HH:MM (消息数: XX)
   - 本次主要话题：
   - 关键决策/结论：
   - 待跟进事项：
   ```

### 注意
- 这是轻量检查，不做深度总结
- 目的是防止长 session 中间信息丢失
- 详细整合由 DreamTask cron 脚本负责
