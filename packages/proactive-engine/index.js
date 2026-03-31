/**
 * proactive-engine - 主动引擎插件
 * 
 * 提供：
 * - soul_goals: 目标管理系统
 * - soul_narrative: 叙事记忆系统
 * - soul_reflection: 反思线程
 * - soul-focus: 专注模式
 * - soul_proactive: 主动触发管理
 * - soul_context: 用户画像
 */

import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry.js";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store.js";
import { GoalManager } from "./src/goal-manager.js";
import { ReflectionThread } from "./src/reflection-thread.js";
import { NarrativeMemory } from "./src/narrative-memory.js";
import { AttentionBudget } from "./src/attention-budget.js";

export default definePluginEntry({
  id: "proactive-engine",
  name: "Soul Proactive Engine",
  description: "主动引擎：为AI助理提供内生目标、反思与主动触发能力",

  async register(api) {
    // 创建持久化存储
    const store = createPluginRuntimeStore(api, {
      namespace: "proactive-engine",
      defaults: {
        goals: [],
        narrative: [],
        reflections: [],
        focusMode: { enabled: false },
        attentionBudget: { budget: 10, used: 0, resetAt: null },
        userProfile: {},
        reflectionStats: { total: 0, lastRun: null }
      }
    });

    // 初始化核心模块
    const goalManager = new GoalManager(store, api);
    const narrativeMemory = new NarrativeMemory(store, api);
    const attentionBudget = new AttentionBudget(store, api);

    // 初始化反思线程
    const reflectionThread = new ReflectionThread({
      store,
      goalManager,
      narrativeMemory,
      api,
      intervalMs: 3600000,        // 1小时
      idleThresholdMs: 300000,     // 5分钟
    });

    // 注册工具
    api.registerTool({
      name: "soul_goals",
      description: "Soul 目标管理系统 - 查询和更新核心目标进度",
      parameters: {
        type: "object",
        properties: {
          action: { 
            type: "string", 
            enum: ["get", "update", "list", "add", "remove"],
            description: "操作类型"
          },
          goalId: { type: "string", description: "目标ID" },
          delta: { type: "number", description: "进度变化量（正/负）" },
          reason: { type: "string", description: "更新原因" },
          name: { type: "string", description: "目标名称（add时）" },
          description: { type: "string", description: "目标描述（add时）" },
          priority: { type: "number", description: "优先级1-10（add时）" }
        },
        required: ["action"]
      },
      async execute(_id, params) {
        const { action, goalId, delta, reason, name, description, priority } = params;

        switch (action) {
          case "get":
            return goalManager.getGoals();
          
          case "list":
            return goalManager.listGoals();
          
          case "update":
            if (!goalId || delta === undefined) {
              return { error: "goalId 和 delta 是必填项" };
            }
            await goalManager.updateProgress(goalId, delta, reason);
            return { success: true, message: `目标 ${goalId} 进度更新 ${delta > 0 ? "+" : ""}${delta}` };
          
          case "add":
            if (!name) return { error: "name 是必填项" };
            await goalManager.addGoal({ name, description: description || "", priority: priority || 5 });
            return { success: true, message: `目标 "${name}" 已添加` };
          
          case "remove":
            if (!goalId) return { error: "goalId 是必填项" };
            await goalManager.removeGoal(goalId);
            return { success: true, message: `目标 ${goalId} 已移除` };
          
          default:
            return { error: `未知操作: ${action}` };
        }
      }
    });

    api.registerTool({
      name: "soul_narrative",
      description: "Soul 叙事记忆系统 - 将事件编织成时间线",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["add", "timeline", "search", "recent"],
            description: "操作类型"
          },
          event: { type: "string", description: "事件描述（add时）" },
          category: { 
            type: "string", 
            enum: ["milestone", "emotion_change", "decision", "habit", "preference", "general"],
            description: "事件类别"
          },
          importance: { type: "number", description: "重要性 0-1" },
          tags: { type: "array", items: { type: "string" }, description: "标签" },
          startDate: { type: "string", description: "查询开始日期" },
          endDate: { type: "string", description: "查询结束日期" },
          query: { type: "string", description: "搜索关键词" },
          limit: { type: "number", description: "返回数量限制" }
        },
        required: ["action"]
      },
      async execute(_id, params) {
        const { action, event, category, importance, tags, startDate, endDate, query, limit } = params;

        switch (action) {
          case "add":
            if (!event) return { error: "event 是必填项" };
            await narrativeMemory.addEvent({
              event,
              category: category || "general",
              importance: importance || 0.5,
              tags: tags || []
            });
            return { success: true, message: "事件已记录到叙事记忆" };
          
          case "timeline":
            return narrativeMemory.getTimeline({ startDate, endDate, limit: limit || 20 });
          
          case "search":
            if (!query) return { error: "query 是必填项" };
            return narrativeMemory.search(query);
          
          case "recent":
            return narrativeMemory.getRecent(limit || 10);
          
          default:
            return { error: `未知操作: ${action}` };
        }
      }
    });

    api.registerTool({
      name: "soul_reflection",
      description: "Soul 反思线程 - 执行浅层或深度反思",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["shallow", "deep", "status"],
            description: "反思类型"
          },
          force: { type: "boolean", description: "强制执行（忽略检查）" }
        },
        required: ["type"]
      },
      async execute(_id, params) {
        const { type, force } = params;

        if (type === "status") {
          return reflectionThread.getStatus();
        }

        if (type === "shallow") {
          return await reflectionThread.runShallow(force);
        }

        if (type === "deep") {
          return await reflectionThread.runDeep(force);
        }

        return { error: `未知反思类型: ${type}` };
      }
    });

    api.registerTool({
      name: "soul_focus",
      description: "Soul 专注模式 - 暂停主动打扰",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["on", "off", "status", "peek"],
            description: "操作类型"
          },
          duration: { type: "number", description: "专注时长（分钟）" },
          reason: { type: "string", description: "专注原因" }
        },
        required: ["action"]
      },
      async execute(_id, params) {
        const { action, duration, reason } = params;

        switch (action) {
          case "on":
            await store.set("focusMode", { 
              enabled: true, 
              reason: reason || "用户请求",
              until: duration ? Date.now() + duration * 60000 : null 
            });
            return { success: true, message: "专注模式已开启", until: duration ? `${duration}分钟` : "直到手动关闭" };
          
          case "off":
            await store.set("focusMode", { enabled: false, reason: null, until: null });
            return { success: true, message: "专注模式已关闭" };
          
          case "status":
            const focus = await store.get("focusMode");
            return {
              enabled: focus?.enabled || false,
              reason: focus?.reason || null,
              until: focus?.until || null,
              remaining: focus?.until ? Math.max(0, focus.until - Date.now()) : null
            };
          
          case "peek":
            // 检查但不更新
            const peek = await store.get("focusMode");
            if (peek?.enabled && peek?.until && Date.now() > peek.until) {
              await store.set("focusMode", { enabled: false, reason: null, until: null });
              return { enabled: false, expired: true };
            }
            return { enabled: peek?.enabled || false, expired: false };
          
          default:
            return { error: `未知操作: ${action}` };
        }
      }
    });

    api.registerTool({
      name: "soul_proactive",
      description: "Soul 主动触发管理 - 检查是否应该主动发起建议",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["check", "status", "reset", "suggest"],
            description: "操作类型"
          },
          context: { type: "string", description: "当前上下文描述" }
        },
        required: ["action"]
      },
      async execute(_id, params) {
        const { action, context } = params;

        // 检查专注模式
        const focus = await store.get("focusMode");
        if (focus?.enabled) {
          if (focus.until && Date.now() > focus.until) {
            await store.set("focusMode", { enabled: false, reason: null, until: null });
          } else {
            return { 
              allowed: false, 
              reason: "专注模式已开启",
              suggestions: [] 
            };
          }
        }

        // 检查注意力预算
        const budget = await store.get("attentionBudget");
        const today = new Date().toDateString();
        if (budget?.resetAt !== today) {
          // 重置每日预算
          await store.set("attentionBudget", { 
            budget: 10, 
            used: 0, 
            resetAt: today 
          });
        }

        switch (action) {
          case "status":
            return {
              budget: budget?.budget || 10,
              used: budget?.used || 0,
              remaining: budget?.budget - (budget?.used || 0)
            };
          
          case "reset":
            await store.set("attentionBudget", { budget: 10, used: 0, resetAt: new Date().toDateString() });
            return { success: true, message: "注意力预算已重置" };
          
          case "check":
            const remaining = (budget?.budget || 10) - (budget?.used || 0);
            if (remaining <= 0) {
              return { allowed: false, reason: "今日主动建议次数已用完", suggestions: [] };
            }
            
            // 基于上下文生成建议（简单规则）
            const suggestions = [];
            if (context) {
              // TODO: 接入LLM进行更智能的上下文分析
              if (context.includes("工作") || context.includes("任务")) {
                suggestions.push("提醒：注意工作节奏，适时休息");
              }
              if (context.includes("晚上") || context.includes("深夜")) {
                suggestions.push("提醒：夜深了，注意作息");
              }
            }
            
            return { 
              allowed: true, 
              remaining,
              suggestions,
              message: suggestions.length > 0 ? "有主动建议" : "暂无建议"
            };
          
          case "suggest":
            // 消费一个注意力预算
            const currentUsed = (budget?.used || 0) + 1;
            await store.set("attentionBudget", { 
              ...budget, 
              used: currentUsed 
            });
            return { success: true, used: currentUsed, remaining: (budget?.budget || 10) - currentUsed };
          
          default:
            return { error: `未知操作: ${action}` };
        }
      }
    });

    api.registerTool({
      name: "soul_context",
      description: "Soul 用户画像 - 获取和更新用户特征",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["get", "update", "add", "merge"],
            description: "操作类型"
          },
          key: { type: "string", description: "字段名" },
          value: { type: "string", description: "字段值" },
          data: { type: "object", description: "合并数据（merge时）" }
        },
        required: ["action"]
      },
      async execute(_id, params) {
        const { action, key, value, data } = params;

        switch (action) {
          case "get":
            const profile = await store.get("userProfile") || {};
            return profile;
          
          case "update":
            if (!key || value === undefined) {
              return { error: "key 和 value 是必填项" };
            }
            const current = await store.get("userProfile") || {};
            current[key] = value;
            current.lastUpdated = new Date().toISOString();
            await store.set("userProfile", current);
            return { success: true, message: `用户画像 ${key} 已更新` };
          
          case "add":
            if (!key || value === undefined) {
              return { error: "key 和 value 是必填项" };
            }
            // add 追加到现有数组
            const existing = await store.get("userProfile") || {};
            if (!existing[key]) existing[key] = [];
            if (Array.isArray(existing[key])) {
              existing[key] = [...existing[key], value];
            } else {
              existing[key] = value;
            }
            existing.lastUpdated = new Date().toISOString();
            await store.set("userProfile", existing);
            return { success: true, message: `已添加到用户画像 ${key}` };
          
          case "merge":
            if (!data) return { error: "data 是必填项" };
            const merged = await store.get("userProfile") || {};
            Object.assign(merged, data);
            merged.lastUpdated = new Date().toISOString();
            await store.set("userProfile", merged);
            return { success: true, message: "用户画像已合并更新" };
          
          default:
            return { error: `未知操作: ${action}` };
        }
      }
    });

    api.registerTool({
      name: "soul_status",
      description: "Soul 系统状态面板 - 查看灵魂系统整体健康度",
      parameters: {
        type: "object",
        properties: {
          detail: { type: "boolean", description: "是否显示详细信息" }
        }
      },
      async execute(_id, params) {
        const goals = await goalManager.getGoals();
        const narrative = await narrativeMemory.getRecent(5);
        const reflectionStats = await store.get("reflectionStats") || { total: 0, lastRun: null };
        const focus = await store.get("focusMode") || { enabled: false };
        const budget = await store.get("attentionBudget") || { budget: 10, used: 0, resetAt: null };
        const userProfile = await store.get("userProfile") || {};

        const base = {
          status: "运行中",
          uptime: "Soul 系统正常",
          goals: {
            total: goals.length,
            active: goals.filter(g => g.status === "active").length
          },
          attention: {
            budget: budget.budget,
            used: budget.used,
            remaining: budget.budget - budget.used
          },
          reflection: {
            total: reflectionStats.total,
            lastRun: reflectionStats.lastRun
          },
          focusMode: focus.enabled ? "开启" : "关闭"
        };

        if (!params.detail) {
          return base;
        }

        return {
          ...base,
          goalsDetail: goals,
          recentNarrative: narrative,
          userProfileLastUpdated: userProfile.lastUpdated || "从未",
          systemHealth: calculateHealth(goals, focus, budget)
        };
      }
    });

    // 注册Hook：会话结束时记录交互摘要（agent_end）
    api.registerHook({
      event: "agent_end",
      handler: async (ctx) => {
        // 会话结束时写入叙事记忆
        await narrativeMemory.addEvent({
          event: `Soul 系统会话结束`,
          category: "habit",
          importance: 0.3,
          tags: ["系统交互", "会话"]
        });
      }
    });

    // 启动反思线程
    reflectionThread.start();

    return {
      async cleanup() {
        reflectionThread.stop();
      }
    };
  }
});

function calculateHealth(goals, focus, budget) {
  let score = 100;
  
  // 目标健康度
  const staleGoals = goals.filter(g => {
    if (g.status !== "active") return false;
    const lastUpdate = new Date(g.lastUpdated);
    const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate > 7;
  });
  score -= staleGoals.length * 10;
  
  // 专注模式
  if (focus.enabled) score -= 5;
  
  // 注意力预算
  if (budget.used >= budget.budget) score -= 10;
  
  return Math.max(0, Math.min(100, score));
}
