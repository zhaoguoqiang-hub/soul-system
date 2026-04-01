# Soul System

让 AI 助手拥有灵魂——主动性、记忆、反思与成长。

## 🎯 目标

让 AI 助理从「被动响应命令」转变为「积极主动的伙伴」。

## 🏗️ 架构

```
Soul System
├── packages/
│   └── proactive-engine/        # 主动引擎插件（OpenClaw Plugin）
│       └── src/
│           └── index.ts         # 插件入口（含HTTP API路由）
│
├── web-ui/                      # 控制面板前端
│   ├── index.html
│   ├── style.css
│   └── app.js
│
└── skills/                      # Skill 层（5个已发布ClawHub）
    ├── narrative-memory/        # 叙事记忆
    ├── proactive-trigger/       # 主动触发
    ├── user-context-scanner/    # 用户画像
    ├── value-aware-guard/       # 价值守护
    └── mood-simulator/          # 情绪模拟
```

## 🔌 核心组件

### proactive-engine 插件 (v1.1.0)

**目标管理工具：**
| 工具 | 功能 |
|------|------|
| `goal_configure` | 查看/添加/删除/完成/更新目标 |
| `goal_suggest` | 基于目标系统生成行动建议 |
| `proactive_check` | 周期性主动检查 |

**信号协调工具：**
| 工具 | 功能 |
|------|------|
| `signal_publish` | 发布信号到协调层 |
| `signal_query` | 查询待处理信号 |
| `signal_resolve` | 处理并关闭信号 |
| `context_get/update` | 共享上下文读写 |

**HTTP API（供控制面板调用）：**
- `GET /plugins/soul/status` - 系统综合状态
- `GET /plugins/soul/goals` - 目标列表
- `GET /plugins/soul/signals` - 信号统计
- `GET /plugins/soul/narratives` - 叙事记忆
- `GET /plugins/soul/context` - 上下文摘要

### 内生目标系统

3个核心目标驱动主动行为：

| 优先级 | 目标 | 驱动行为 |
|--------|------|---------|
| 10 | 帮助用户实现长期福祉 | 提醒熬夜/拖延、评估放弃意图 |
| 9 | 维护信任关系 | 透明数据使用、尊重删除请求 |
| 8 | 持续自优化 | 记录用户纠正、学习偏好 |

### Skill 层（5个）

已发布到 ClawHub，通过协调协议与 plugin 配合工作。

## 📦 安装

```bash
# 安装 proactive-engine 插件
openclaw plugins install proactive-engine

# 安装 Skill（可选）
clawhub install @soul-system/narrative-memory
clawhub install @soul-system/proactive-trigger
clawhub install @soul-system/user-context-scanner
clawhub install @soul-system/value-aware-guard
clawhub install @soul-system/mood-simulator

# 重启网关
openclaw gateway restart
```

## 🎨 控制面板

启动网关后，打开浏览器访问（需配置HTTP服务）：

```
~/.openclaw/web-ui/index.html
```

功能：
- 📊 总览：统计卡片 + 核心目标 + 主动建议
- 🎯 目标：核心目标(只读) + 自定义目标(可增删)
- 📡 信号：7种信号类型统计 + 待处理队列
- 🧠 记忆：叙事记忆 + 高频话题
- 🤖 Agent：（预留）

## 🛠️ 开发

```bash
# 克隆项目
git clone https://github.com/zhaoguoqiang-hub/soul-system.git
cd soul-system

# 本地修改后同步到插件
cp index.ts ~/.openclaw/extensions/proactive-engine/src/index.ts
openclaw gateway restart
```

## 📋 Roadmap

- [x] proactive-engine 插件 ✅ v1.1.0
- [x] 内生目标系统 ✅
- [x] 信号协调中心 ✅
- [x] 5个Skill发布ClawHub ✅
- [x] HTTP API ✅
- [x] 控制面板 Web UI ✅
- [ ] 控制面板接入真实API（待网关HTTP配置）
- [ ] 子Agent监测Tab

## 哲学理念

Soul系统不追求"像人一样有灵魂"——那是拟人化，是噱头。

Soul追求的是：**一个真正有用的助理**，能够记住重要的事、预判你的需求、在你疲惫时主动分担。

不是机器，不是马屁精。就是一个靠谱的搭档。

---

## 许可证

MIT License

*Build with ❤️ for a more proactive AI companion*
