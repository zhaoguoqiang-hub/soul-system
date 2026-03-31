# Soul System

让 AI 助手拥有灵魂——主动性、记忆、反思与成长。

## 🎯 目标

让 AI 助理从「被动响应命令」转变为「积极主动的伙伴」。

## 🏗️ 架构

```
Soul System
├── packages/
│   ├── proactive-engine/        # 主动引擎插件（OpenClaw Plugin）
│   │   ├── index.js             # 插件入口
│   │   └── src/
│   │       ├── goal-manager.js      # 内生目标系统
│   │       ├── narrative-memory.js  # 叙事记忆
│   │       ├── reflection-thread.js # 后台反思线程
│   │       └── attention-budget.js   # 注意力预算
│   └── soul-*/                  # Skill 层（后续）
│
└── 灵魂系统设计文档.md          # 完整设计规范
```

## 🔌 已实现：proactive-engine 插件

提供 6 大核心工具：

| 工具 | 功能 |
|------|------|
| `soul_goals` | 目标查询/更新（4个核心目标） |
| `soul_narrative` | 叙事记忆写入/查询/时间线 |
| `soul_reflection` | 执行浅层/深度反思 |
| `soul_focus` | 专注模式开关 |
| `soul_proactive` | 主动触发管理 |
| `soul_context` | 用户画像更新/查询 |
| `soul_status` | 系统状态面板 |

## 📦 安装

```bash
# 开发中 - 尚未发布到 ClawHub
# 安装插件
openclaw plugins install ~/soul-system/packages/proactive-engine

# 重启网关
openclaw gateway restart
```

## 🛠️ 开发

```bash
# 克隆项目
git clone https://github.com/zhaoguoqiang-hub/soul-system.git
cd soul-system

# 安装依赖
pnpm install

# 测试插件（开发中）
openclaw plugins dev packages/proactive-engine
```

## 📖 设计文档

详见 [AI意识探讨.md](./AI意识探讨.md)

## 📋  Roadmap

- [ ] proactive-engine 插件开发完成 ✅
- [ ] soul_* Skill 层开发
- [ ] 用户控制面板
- [ ] ClawHub 发布

---

*Build with ❤️ for a more proactive AI companion*
