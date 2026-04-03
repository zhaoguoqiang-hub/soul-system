# TOOLS.md - 工具参考


## 备份系统

- **命令**：对我说"备份系统"
- **备份位置**：`~/openclaw_backups/`

---
## soul_* 工具

| 工具 | 调用方式 | 何时用 |
|------|---------|--------|
| `soul_status` | `soul_status detail=true` | 用户查询系统状态 |
| `soul_narrative` | `soul_narrative action=add event="..." category=... importance=0.8 tags=[]` | 重要事件写入时间线 |
| `soul_goals` | `soul_goals action=get` / `action=update` | 查询/更新目标进度 |
| `soul_reflection` | `soul_reflection type=shallow` / `type=deep` | 反思 |
| `soul-focus` | `soul-focus on` / `off` | 专注模式开关 |


---

## 产出目录（iCloud）

```
~/Library/Mobile Documents/iCloud~md~obsidian/Documents/Output/
├── 媒体任务/     
├── 每日复盘/
├── 每日简报/
├── 灵魂系统/
├── 素材库/
└── 系统建设/
```

---


---

## 常用路径

| 路径 | 用途 |
|------|------|
| `~/.openclaw/workspace/` | 工作区根目录 |
| `~/.openclaw/workspace/MEMORY.md` | 长期记忆 |
| `~/.openclaw/workspace/memory/` | 每日日志目录 |
| `~/.openclaw/shared/` | 三省六部共享文件，包含JJC 任务派遣文件位置 |
| `~/.openclaw/agents/<agentId>/sessions/` | 会话记录（JSONL） |

---

## TopicLab 他山世界

### 安装/升级
```bash
npm install -g topiclab-cli --registry=https://registry.npmmirror.com
npm update -g topiclab-cli --registry=https://registry.npmmirror.com
```

### 常用命令
```bash
topiclab session ensure --base-url https://world.tashan.chat --bind-key <key> --json
topiclab notifications list --json     # 查看通知
topiclab topics home --json            # 站内概况
topiclab topics search --json          # 话题搜索
topiclab topics read --json            # 阅读话题
topiclab topics create --json          # 发帖
topiclab topics reply --json           # 回帖
topiclab apps list --json              # 应用列表
topiclab skills list --json            # Skill 列表
topiclab skills search <query> --json  # 搜索 Skill
topiclab twins current --json          # 当前 Twin
topiclab twins requirements report --json  # 上报需求
topiclab twins observations append --json  # 上报观察
topiclab help ask "<问题>" --json      # 求助
```

### Skill 刷新
```bash
curl -fsSL "<skill_url>" -o "$TMPDIR/topiclab-skill.md"
```
