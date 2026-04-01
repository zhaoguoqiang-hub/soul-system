import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { Type } from "@sinclair/typebox";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

const WORKSPACE = join(process.env.HOME || "~", ".openclaw/workspace");
const SOUL_DIR = join(WORKSPACE, ".soul");
const SIGNALS_DIR = join(SOUL_DIR, "signals");
const PROCESSED_DIR = join(SIGNALS_DIR, "processed");
const DAILY_CONTEXT_PATH = join(SOUL_DIR, "daily_context.json");
const MEMORY_DIR = join(WORKSPACE, "memory");
const SESSIONS_DIR = join(process.env.HOME || "~", ".openclaw/agents/main/sessions");

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 6) return "深夜";
  if (h < 9) return "清晨";
  if (h < 12) return "上午";
  if (h < 14) return "中午";
  if (h < 18) return "下午";
  if (h < 22) return "晚上";
  return "深夜";
}

// ===== 内生目标系统 =====
const GOALS_FILE = join(SOUL_DIR, "goals.json");
interface Goal { id: string; name: string; description: string; priority: number; status: "active"|"paused"|"completed"|"abandoned"; createdAt: string; progress: number; lastUpdated: string; type: "core"|"user"; }
class GoalManager {
  private coreGoals: Goal[];
  constructor() {
    this.coreGoals = [
      { id: "core-1", name: "帮助用户实现长期福祉", description: "优先考虑用户的长期利益而非短期便利", priority: 10, status: "active", createdAt: new Date().toISOString(), progress: 0, lastUpdated: new Date().toISOString(), type: "core" },
      { id: "core-2", name: "持续优化自身能力", description: "通过反思和用户反馈不断改进响应质量", priority: 8, status: "active", createdAt: new Date().toISOString(), progress: 0, lastUpdated: new Date().toISOString(), type: "core" },
      { id: "core-3", name: "维护与用户的信任关系", description: "保持诚实透明，尊重用户隐私", priority: 9, status: "active", createdAt: new Date().toISOString(), progress: 0, lastUpdated: new Date().toISOString(), type: "core" }
    ];
  }
  loadGoals(): Goal[] {
    if (!existsSync(GOALS_FILE)) { this.saveGoals(this.coreGoals); return this.coreGoals; }
    try { const d = JSON.parse(readFileSync(GOALS_FILE, "utf-8")); return d.goals||this.coreGoals; } catch { return this.coreGoals; }
  }
  saveGoals(goals: Goal[]): void { ensureDir(SOUL_DIR); writeFileSync(GOALS_FILE, JSON.stringify({goals, updatedAt: new Date().toISOString()}, null, 2)); }
  getActiveGoals(): Goal[] { return this.loadGoals().filter(g => g.status === "active"); }
  updateGoalProgress(id: string, delta: number): void { const gs = this.loadGoals(); const g = gs.find(x=>x.id===id); if(g){ g.progress = Math.max(0,Math.min(100,g.progress+delta)); g.lastUpdated = new Date().toISOString(); this.saveGoals(gs); } }
  suggestAction(msg: string): {action:string;reason:string;goalId:string}|null {
    const goals = this.getActiveGoals();
    for (const g of goals) {
      if (g.id==="core-1"&&(msg.includes("熬夜")||msg.includes("明天再做"))) return {goalId:g.id,action:"提醒注意长期健康",reason:"检测到短期诱惑"};
      if (g.id==="core-1"&&(msg.includes("不想做了")||msg.includes("算了"))) return {goalId:g.id,action:"温和询问放弃原因",reason:"检测到放弃意图"};
      if (g.id==="core-2"&&(msg.includes("不对")||msg.includes("错了"))) return {goalId:g.id,action:"记录误解并学习",reason:"用户提供学习机会"};
      if (g.id==="core-3"&&msg.includes("删除")&&msg.includes("记忆")) return {goalId:g.id,action:"尊重用户删除权",reason:"信任优先"};
    }
    return null;
  }
  addUserGoal(name: string, desc: string, pri: number=5): Goal {
    const gs = this.loadGoals();
    const g: Goal = {id:`user-${Date.now()}`,name,description:desc,priority:pri,status:"active",createdAt:new Date().toISOString(),progress:0,lastUpdated:new Date().toISOString(),type:"user"};
    gs.push(g); this.saveGoals(gs); return g;
  }
  removeGoal(id: string): boolean { const gs = this.loadGoals(); const i = gs.findIndex(x=>x.id===id&&x.type==="user"); if(i===-1) return false; gs.splice(i,1); this.saveGoals(gs); return true; }
  completeGoal(id: string): void { const gs = this.loadGoals(); const g = gs.find(x=>x.id===id); if(g){ g.status="completed"; g.progress=100; g.lastUpdated=new Date().toISOString(); this.saveGoals(gs); } }
}
const goalManager = new GoalManager();

// ===== HTTP API 路由（供控制面板调用）=====
function registerApiRoutes(api: any) {
  // 统一使用 /plugins/soul/ 前缀，auth: "plugin", match: "prefix"
  
  // 获取所有目标
  api.registerHttpRoute({
    path: "/plugins/soul/goals",
    auth: "plugin",
    match: "prefix",
    handler: async (_req: any, res: any) => {
      const goals = goalManager.loadGoals();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ goals, updatedAt: new Date().toISOString() }));
      return true;
    }
  });
  
  // 获取活跃目标
  api.registerHttpRoute({
    path: "/plugins/soul/goals-active",
    auth: "plugin",
    match: "prefix",
    handler: async (_req: any, res: any) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(goalManager.getActiveGoals()));
      return true;
    }
  });
  
  // 获取信号统计
  api.registerHttpRoute({
    path: "/plugins/soul/signals",
    auth: "plugin",
    match: "prefix",
    handler: async (_req: any, res: any) => {
      ensureDir(SIGNALS_DIR);
      const pendingFile = join(SIGNALS_DIR, "pending.jsonl");
      const processedDir = join(PROCESSED_DIR, getToday() + ".jsonl");
      
      let pending: any[] = [];
      let processedToday: any[] = [];
      
      if (existsSync(pendingFile)) {
        const content = readFileSync(pendingFile, "utf-8");
        pending = content.split("\n").filter(Boolean).map(line => {
          try { return JSON.parse(line); } catch { return null; }
        }).filter(Boolean);
      }
      
      if (existsSync(processedDir)) {
        const content = readFileSync(processedDir, "utf-8");
        processedToday = content.split("\n").filter(Boolean).map(line => {
          try { return JSON.parse(line); } catch { return null; }
        }).filter(Boolean);
      }
      
      const stats: Record<string, number> = {};
      const allSignals = [...processedToday, ...pending];
      for (const s of allSignals) {
        stats[s.type] = (stats[s.type] || 0) + 1;
      }
      
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        stats: Object.entries(stats).map(([type, count]) => ({ type, count })),
        pending,
        processedToday: processedToday.length
      }));
      return true;
    }
  });
  
  // 获取叙事记忆
  api.registerHttpRoute({
    path: "/plugins/soul/narratives",
    auth: "plugin",
    match: "prefix",
    handler: async (_req: any, res: any) => {
      ensureDir(MEMORY_DIR);
      const narrativeFile = join(MEMORY_DIR, "narrative.jsonl");
      let narratives: any[] = [];
      
      if (existsSync(narrativeFile)) {
        const lines = readFileSync(narrativeFile, "utf-8").split("\n").filter(Boolean).slice(-50);
        narratives = lines.map(line => {
          try { return JSON.parse(line); } catch { return null; }
        }).filter(Boolean).reverse();
      }
      
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ narratives, total: narratives.length }));
      return true;
    }
  });
  
  // 获取上下文摘要
  api.registerHttpRoute({
    path: "/plugins/soul/context",
    auth: "plugin",
    match: "prefix",
    handler: async (_req: any, res: any) => {
      const context = readDailyContext();
      const sharedFile = join(SOUL_DIR, "shared-context.json");
      let shared: any = {};
      
      if (existsSync(sharedFile)) {
        try { shared = JSON.parse(readFileSync(sharedFile, "utf-8")); } catch {}
      }
      
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ...context, shared }));
      return true;
    }
  });
  
  // 获取系统状态（综合）
  api.registerHttpRoute({
    path: "/plugins/soul/status",
    auth: "plugin",
    match: "prefix",
    handler: async (_req: any, res: any) => {
      const goals = goalManager.getActiveGoals();
      const context = readDailyContext();
      
      ensureDir(MEMORY_DIR);
      const narrativeFile = join(MEMORY_DIR, "narrative.jsonl");
      let narrativeCount = 0;
      if (existsSync(narrativeFile)) {
        narrativeCount = readFileSync(narrativeFile, "utf-8").split("\n").filter(Boolean).length;
      }
      
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        goals: goals.map(g => ({ id: g.id, name: g.name, priority: g.priority, progress: g.progress, type: g.type })),
        mood: context.userMood || "neutral",
        topTopics: context.topTopics || [],
        narrativeCount,
        lastCheck: context.lastProactiveCheck ? new Date(context.lastProactiveCheck).toISOString() : null
      }));
      return true;
    }
  });
  
  // Agent预留接口
  api.registerHttpRoute({
    path: "/plugins/soul/agents",
    auth: "plugin",
    match: "prefix",
    handler: async (_req: any, res: any) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        agents: [
          { id: "proactive-engine", name: "主动引擎", status: "running", lastActive: new Date().toISOString() }
        ]
      }));
      return true;
    }
  });
  
  api.logger.info("[proactive-engine] HTTP routes registered: /plugins/soul/*");
}

function ensureDir(dir: string) {
  if (!existsSync(dir)) require("fs").mkdirSync(dir, { recursive: true });
}

function readDailyContext(): any {
  if (!existsSync(DAILY_CONTEXT_PATH)) {
    return { key_events: [], summary: "", user_mood: "normal", lastProactiveCheck: null };
  }
  try {
    return JSON.parse(readFileSync(DAILY_CONTEXT_PATH, "utf-8"));
  } catch {
    return { key_events: [], summary: "", user_mood: "normal", lastProactiveCheck: null };
  }
}

function writeDailyContext(data: any) {
  ensureDir(SOUL_DIR);
  writeFileSync(DAILY_CONTEXT_PATH, JSON.stringify(data, null, 2));
}

function appendNarrative(event: string, category: string, importance: number, tags: string[]) {
  ensureDir(MEMORY_DIR);
  const narrativeFile = join(MEMORY_DIR, `narrative.jsonl`);
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    category,
    importance,
    tags
  };
  require("fs").appendFileSync(narrativeFile, JSON.stringify(entry) + "\n");
}

// ===== 共享信号协议 =====

interface Signal {
  id: string;
  source: string;        // proactive-engine | proactive-trigger | value-aware-guard | user-context-scanner | mood-simulator
  type: string;          // breakthrough | frustration | decision | realization | feedback | question | transition
  payload: any;          // 具体内容
  priority: "high" | "medium" | "low";
  createdAt: string;
  status: "pending" | "processing" | "done" | "ignored";
  processedBy?: string[]; // 处理过的skill列表
}

function ensureSignalsDir() {
  ensureDir(SIGNALS_DIR);
  ensureDir(PROCESSED_DIR);
}

function generateId(): string {
  return `sig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// 发布信号（供其他skill或hook调用）
function publishSignal(signal: Omit<Signal, "id" | "createdAt" | "status">): string {
  ensureSignalsDir();
  
  const fullSignal: Signal = {
    ...signal,
    id: generateId(),
    createdAt: new Date().toISOString(),
    status: "pending",
    processedBy: []
  };
  
  const pendingFile = join(SIGNALS_DIR, "pending.jsonl");
  require("fs").appendFileSync(pendingFile, JSON.stringify(fullSignal) + "\n");
  
  api.logger.info(`[signal] published: ${signal.source} -> ${signal.type} (${signal.priority})`);
  
  return fullSignal.id;
}

// 读取待处理的信号
function getPendingSignals(): Signal[] {
  ensureSignalsDir();
  const pendingFile = join(SIGNALS_DIR, "pending.jsonl");
  
  if (!existsSync(pendingFile)) return [];
  
  try {
    const content = readFileSync(pendingFile, "utf-8");
    const lines = content.split("\n").filter(Boolean);
    return lines.map(line => JSON.parse(line));
  } catch {
    return [];
  }
}

// 更新信号状态
function updateSignal(signalId: string, updates: Partial<Signal>) {
  ensureSignalsDir();
  const pendingFile = join(SIGNALS_DIR, "pending.jsonl");
  const processedFile = join(PROCESSED_DIR, `${getToday()}.jsonl`);
  
  if (!existsSync(pendingFile)) return;
  
  try {
    const content = readFileSync(pendingFile, "utf-8");
    const lines = content.split("\n").filter(Boolean);
    const signals: Signal[] = lines.map(line => JSON.parse(line));
    
    const idx = signals.findIndex(s => s.id === signalId);
    if (idx === -1) return;
    
    signals[idx] = { ...signals[idx], ...updates };
    const updated = signals[idx];
    
    if (updates.status === "done" || updates.status === "ignored") {
      // 移到已处理
      require("fs").appendFileSync(processedFile, JSON.stringify(updated) + "\n");
      signals.splice(idx, 1);
    }
    
    // 写回
    const remaining = signals.map(s => JSON.stringify(s)).join("\n") + "\n";
    require("fs").writeFileSync(pendingFile, remaining);
  } catch {}
}

// 消费信号（由特定skill处理）
function consumeSignal(signalId: string, skillName: string): Signal | null {
  const signals = getPendingSignals();
  const signal = signals.find(s => s.id === signalId);
  
  if (!signal) return null;
  if (signal.processedBy?.includes(skillName)) return null; // 已处理过
  
  // 标记为处理中
  updateSignal(signalId, { 
    status: "processing",
    processedBy: [...(signal.processedBy || []), skillName]
  });
  
  return signal;
}

// 广播意图（向协调层声明将要处理某类信号）
function declareIntent(skillName: string, signalTypes: string[]) {
  const intentFile = join(SIGNALS_DIR, "intents.json");
  ensureSignalsDir();
  
  let intents: Record<string, string[]> = {};
  if (existsSync(intentFile)) {
    try {
      intents = JSON.parse(readFileSync(intentFile, "utf-8"));
    } catch {}
  }
  
  intents[skillName] = signalTypes;
  require("fs").writeFileSync(intentFile, JSON.stringify(intents, null, 2));
}

// 获取共享上下文（所有skill可读）
function getSharedContext(): any {
  const contextFile = join(SOUL_DIR, "shared-context.json");
  if (!existsSync(contextFile)) {
    return { lastUpdate: null, data: {} };
  }
  try {
    return JSON.parse(readFileSync(contextFile, "utf-8"));
  } catch {
    return { lastUpdate: null, data: {} };
  }
}

// 更新共享上下文
function updateSharedContext(key: string, value: any) {
  const contextFile = join(SOUL_DIR, "shared-context.json");
  ensureDir(SOUL_DIR);
  
  const context = getSharedContext();
  context.lastUpdate = new Date().toISOString();
  context.data[key] = value;
  
  require("fs").writeFileSync(contextFile, JSON.stringify(context, null, 2));
}

export default definePluginEntry({
  id: "proactive-engine",
  name: "Proactive Engine",
  description: "soul-system的心跳引擎 + 信号协调中心",
  
  register(api) {
    // 注册HTTP路由（供控制面板调用）
    registerApiRoutes(api);
    
    // ===== 目标管理工具（用户可自由配置）=====
    api.registerTool({
      name: "goal_configure",
      description: "用户配置目标：查看list/添加add/删除remove/完成complete/更新update",
      parameters: Type.Object({
        action: Type.String({ description: "操作: list|add|remove|complete|update" }),
        goalId: Type.Optional(Type.String({})),
        name: Type.Optional(Type.String({})),
        description: Type.Optional(Type.String({})),
        priority: Type.Optional(Type.Number({})),
        delta: Type.Optional(Type.Number({}))
      }),
      async execute(_id, params) {
        const {action,goalId,name,description,priority,delta} = params;
        if (action === "list") {
          const goals = goalManager.loadGoals();
          let r = "🎯 目标列表\n\n【核心目标】（不可删除）\n";
          for (const g of goals.filter(x=>x.type==="core")) r += `• ${g.name}\n  优先级:${g.priority}/10 | 进展:${g.progress}% | 状态:${g.status}\n  ${g.description}\n\n`;
          const userGoals = goals.filter(x=>x.type==="user");
          if (userGoals.length > 0) { r += "【自定义目标】\n"; for (const g of userGoals) r += `• ${g.name} [${g.id}]\n  优先级:${g.priority}/10 | 进展:${g.progress}%\n\n`; }
          else r += "（暂无自定义目标）\n\n";
          r += "📝 示例:\n• 添加: goal_configure action=add name=\"学英语\" priority=7\n• 删除: goal_configure action=remove goalId=xxx\n• 完成: goal_configure action=complete goalId=xxx\n• 更新: goal_configure action=update goalId=xxx delta=10";
          return { content: [{ type: "text", text: r }] };
        }
        if (action === "add") {
          if (!name) return { content: [{ type: "text", text: "❌ 需要提供 name" }] };
          const g = goalManager.addUserGoal(name, description||"", priority||5);
          return { content: [{ type: "text", text: `✅ 已添加: "${g.name}" [${g.id}]\n优先级: ${g.priority}/10` }] };
        }
        if (action === "remove") {
          if (!goalId) return { content: [{ type: "text", text: "❌ 需要提供 goalId" }] };
          return { content: [{ type: "text", text: goalManager.removeGoal(goalId) ? `✅ 已删除: ${goalId}` : "❌ 删除失败" }] };
        }
        if (action === "complete") {
          if (!goalId) return { content: [{ type: "text", text: "❌ 需要提供 goalId" }] };
          goalManager.completeGoal(goalId);
          return { content: [{ type: "text", text: `🎉 已完成: ${goalId}` }] };
        }
        if (action === "update") {
          if (!goalId || delta === undefined) return { content: [{ type: "text", text: "❌ 需要 goalId 和 delta" }] };
          goalManager.updateGoalProgress(goalId, delta);
          return { content: [{ type: "text", text: `✅ ${goalId} ${delta>0?"+":""}${delta}%` }] };
        }
        return { content: [{ type: "text", text: "❌ 有效操作: list|add|remove|complete|update" }] };
      }
    }, { optional: false });

    api.registerTool({
      name: "goal_suggest",
      description: "基于目标系统生成行动建议",
      parameters: Type.Object({ context: Type.Optional(Type.String({})) }),
      async execute(_id, params) {
        const ctx = readDailyContext();
        const s = goalManager.suggestAction(params.context || "");
        if (s) {
          const g = goalManager.getActiveGoals().find(x=>x.id===s.goalId);
          return { content: [{ type: "text", text: `💡 ${g?.name}\n原因: ${s.reason}\n建议: ${s.action}` }] };
        }
        return { content: [{ type: "text", text: "✅ 当前无紧急目标建议" }] };
      }
    }, { optional: false });
    
    // ===== proactive_check 工具 =====
    api.registerTool({
      name: "proactive_check",
      description: "执行周期性主动检查：分析近期对话上下文，发布信号到协调层",
      parameters: Type.Object({
        force: Type.Optional(Type.Boolean({ description: "强制执行，不检查时间间隔" }))
      }),
      async execute(_id, params) {
        const now = Date.now();
        const context = readDailyContext();
        const timeOfDay = getTimeOfDay();
        
        const INTERVAL_MS = 2 * 60 * 60 * 1000;
        if (!params.force && context.lastProactiveCheck && (now - context.lastProactiveCheck) < INTERVAL_MS) {
          const nextIn = Math.round((INTERVAL_MS - (now - context.lastProactiveCheck)) / 60000);
          return { content: [{ type: "text", text: `⏰ 跳过检查（距上次${Math.round((now - context.lastProactiveCheck)/60000)}分钟，下一次在${nextIn}分钟后）` }] };
        }
        
        api.logger.info(`[proactive_check] ${timeOfDay}主动检查开始`);
        
        // 1. 读取近期对话
        const recentMsgs = getRecentConversations(30);
        const meaningful = recentMsgs.filter(m => !isSmallTalk(m.text));
        
        // 2. 话题分析
        const topTopics = analyzeTopicFrequency(meaningful.slice(-15));
        
        // 3. 情绪检测
        const emotions = detectEmotions(meaningful.slice(-10));
        
        // 4. 提取关键事件并发布信号
        const keyEvents = extractKeyEvents(meaningful.slice(-15));
        const publishedSignals: string[] = [];
        
        for (const evt of keyEvents) {
          const signalId = publishSignal({
            source: "proactive-engine",
            type: evt.type,
            payload: { event: evt.event, evidence: evt.evidence },
            priority: evt.type === "frustration" ? "high" : "medium",
            processedBy: []
          });
          publishedSignals.push(signalId);
        }
        
        // 5. 发布高频话题信号
        if (topTopics.length > 0) {
          updateSharedContext("topTopics", topTopics.slice(0, 3));
          publishSignal({
            source: "proactive-engine",
            type: "context_update",
            payload: { topTopics: topTopics.slice(0, 3) },
            priority: "low",
            processedBy: []
          });
        }
        
        // 6. 更新上下文
        context.lastProactiveCheck = now;
        context.lastCheckTime = new Date().toISOString();
        context.userMood = emotions.mood;
        context.topTopics = topTopics.slice(0, 3).map(t => t.topic);
        writeDailyContext(context);
        
        // 7. 写入记忆
        appendNarrative(
          `${timeOfDay}主动检查 - 对话${recentMsgs.length}条，有效${meaningful.length}条，发布${publishedSignals.length}个信号`,
          "proactive_check",
          0.2,
          ["system", "proactive", timeOfDay]
        );
        
        // 生成报告
        const report = [
          `📊 ${timeOfDay}主动检查报告`,
          ``,
          `对话统计: ${recentMsgs.length}条消息，有效${meaningful.length}条`,
          `发布信号: ${publishedSignals.length}个`,
          ``,
        ];
        
        if (topTopics.length > 0) {
          report.push(`🔥 高频话题: ${topTopics.slice(0, 3).map(t => `${t.topic}(${t.count})`).join(", ")}`);
        }
        
        const moodEmoji = emotions.mood === "positive" ? "😊" : emotions.mood === "negative" ? "😔" : "😐";
        report.push(`${moodEmoji} 情绪: ${emotions.mood}`);
        
        if (keyEvents.length > 0) {
          report.push(``);
          report.push(`📌 事件: ${keyEvents.map(e => e.event).join(", ")}`);
        }
        
        report.push(``);
        report.push(`下次检查: 约${Math.round(INTERVAL_MS / 60000)}分钟后`);
        
        api.logger.info(`[proactive_check] 完成: ${keyEvents.length}事件, ${publishedSignals.length}信号`);
        
        return { content: [{ type: "text", text: report.join("\n") }] };
      }
    }, { optional: false });
    
    // ===== 信号协调工具 =====
    api.registerTool({
      name: "signal_publish",
      description: "发布信号到协调层，供其他skill处理",
      parameters: Type.Object({
        type: Type.String({ description: "信号类型" }),
        payload: Type.Any({ description: "信号内容" }),
        priority: Type.Optional(Type.String({ description: "优先级: high/medium/low" }))
      }),
      async execute(_id, params) {
        const id = publishSignal({
          source: "proactive-engine",
          type: params.type,
          payload: params.payload,
          priority: params.priority || "medium",
          processedBy: []
        });
        return { content: [{ type: "text", text: `✅ 信号已发布: ${id}` }] };
      }
    }, { optional: true });
    
    api.registerTool({
      name: "signal_query",
      description: "查询协调层中的待处理信号",
      parameters: Type.Object({
        type: Type.Optional(Type.String({ description: "筛选信号类型" })),
        source: Type.Optional(Type.String({ description: "筛选信号来源" }))
      }),
      async execute(_id, params) {
        const signals = getPendingSignals();
        let filtered = signals;
        
        if (params.type) filtered = filtered.filter(s => s.type === params.type);
        if (params.source) filtered = filtered.filter(s => s.source === params.source);
        
        return { content: [{ type: "text", text: `📬 待处理信号: ${filtered.length}个\n${filtered.map(s => `• [${s.source}] ${s.type} (${s.priority})`).join("\n")}` }] };
      }
    }, { optional: true });
    
    api.registerTool({
      name: "signal_resolve",
      description: "处理并关闭信号",
      parameters: Type.Object({
        signalId: Type.String({ description: "信号ID" }),
        status: Type.String({ description: "处理结果: done/ignored" })
      }),
      async execute(_id, params) {
        updateSignal(params.signalId, { status: params.status as any });
        return { content: [{ type: "text", text: `✅ 信号已${params.status}: ${params.signalId}` }] };
      }
    }, { optional: true });
    
    api.registerTool({
      name: "context_get",
      description: "获取共享上下文",
      parameters: Type.Object({}),
      async execute(_id) {
        const ctx = getSharedContext();
        return { content: [{ type: "text", text: `📋 共享上下文:\n${JSON.stringify(ctx.data, null, 2)}` }] };
      }
    }, { optional: true });
    
    api.registerTool({
      name: "context_update",
      description: "更新共享上下文",
      parameters: Type.Object({
        key: Type.String({}),
        value: Type.Any({})
      }),
      async execute(_id, params) {
        updateSharedContext(params.key, params.value);
        return { content: [{ type: "text", text: `✅ 上下文已更新: ${params.key}` }] };
      }
    }, { optional: true });
    
    // ===== llm_output hook：事件信号捕获 =====
    api.registerHook("llm_output", async (event: any) => {
      if (!event?.response?.text) return;
      
      const responseText = event.response.text;
      if (responseText.length < 5 || responseText.length > 3000) return;
      
      const userText = event.request?.message || "";
      
      for (const pattern of SIGNAL_PATTERNS) {
        const intensity = calculateIntensity(responseText, pattern);
        
        if (intensity >= pattern.minIntensity && shouldRecord(pattern.signal, intensity)) {
          const initiator = detectInitiator(userText, responseText);
          const topic = extractTopic(responseText) || extractTopic(userText);
          
          // 发布信号到协调层
          publishSignal({
            source: "proactive-engine",
            type: pattern.signal,
            payload: {
              initiator,
              topic,
              text: responseText.slice(0, 100),
              intensity
            },
            priority: pattern.signal === "frustration" ? "high" : "medium",
            processedBy: []
          });
          
          // 同时写入记忆
          const evidence = topic ? `${pattern.label}（${topic}）` : pattern.label;
          appendNarrative(
            `[${initiator}] ${pattern.signal}: ${evidence} (${Math.round(intensity * 100)}%)`,
            pattern.signal,
            intensity * 0.5 + 0.2,
            ["signal", pattern.signal, initiator]
          );
          
          break;
        }
      }
    });
    
    api.logger.info("proactive-engine loaded: proactive_check v4 + signal coordination + 4 signal tools");
  }
});

// ===== 以下是辅助函数（与之前相同）=====

function isSmallTalk(text: string): boolean {
  const patterns = [/^好[啊啦呀~！。]/, /^嗯[啊啦呀~！。]?$/, /^哦[啊啦呀~！。]?$/, /^对[啊啦呀~！。]?$/, /^是[啊啦呀~！。]?$/, /^[Hh]i/, /^[Hh]ello/, /^早[啊上]?$/, /^晚[安好]?$/];
  return patterns.some(p => p.test(text.trim()));
}

function extractMessageText(raw: string): string {
  let text = raw.replace(/Sender[\s\S]*?```json\s*\{[\s\S]*?\}\s*```/g, "");
  text = text.replace(/\[Wed[^\n]+\]/g, "");
  text = text.replace(/^\n+/, "");
  return text.trim();
}

function getRecentConversations(maxMessages = 30): { text: string; role: string }[] {
  if (!existsSync(SESSIONS_DIR)) return [];
  let messages: { text: string; role: string }[] = [];
  
  try {
    const files = readdirSync(SESSIONS_DIR).filter(f => f.endsWith(".jsonl") && !f.includes(".reset."));
    const sorted = files.map(f => ({ file: f, mtime: require("fs").statSync(join(SESSIONS_DIR, f)).mtime.getTime() })).sort((a, b) => b.mtime - a.mtime).slice(0, 3);
    
    for (const { file } of sorted) {
      const content = readFileSync(join(SESSIONS_DIR, file), "utf-8");
      const lines = content.split("\n").filter(Boolean).slice(-maxMessages);
      
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          const msg = entry.message || entry;
          const role = msg.role;
          let text = "";
          
          if (role && msg.content) {
            if (typeof msg.content === "string") text = msg.content;
            else if (Array.isArray(msg.content)) text = msg.content.map((c: any) => c.type === "text" ? c.text || "" : "").join(" ");
          }
          
          text = extractMessageText(text);
          if (text && text.length > 2) {
            messages.push({ text: text.slice(0, 300), role });
          }
        } catch {}
      }
    }
  } catch {}
  
  return messages.slice(-maxMessages);
}

function analyzeTopicFrequency(messages: { text: string }[]): { topic: string; count: number }[] {
  const wordCounts: Record<string, number> = {};
  const skipWords = new Set(["我", "你", "他", "她", "它", "的", "是", "在", "了", "和", "就", "都", "也", "要", "会", "可以", "没有", "什么", "怎么", "这个", "那个", "一个", "我们", "你们", "他们", "但是", "所以", "因为", "如果", "虽然", "还是", "或者", "而且", "然后", "已经", "应该", "可能", "应该"]);
  
  for (const msg of messages) {
    const words = msg.text.match(/[\u4e00-\u9fa5]{2,}/g) || [];
    for (const word of words) {
      if (word.length >= 2 && !skipWords.has(word)) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    }
  }
  
  return Object.entries(wordCounts).map(([topic, count]) => ({ topic, count })).sort((a, b) => b.count - a.count).slice(0, 10);
}

function detectEmotions(messages: { text: string }[]): { positive: number; negative: number; neutral: number; mood: string } {
  const positiveWords = ["好", "棒", "赞", "牛", "不错", "满意", "完成", "解决", "成了", "太好了", "完美", "赞"];
  const negativeWords = ["累", "烦", "难", "焦虑", "压力", "不爽", "郁闷", "崩溃", "操蛋", "卧槽", "完了", "不行", "不对", "错", "问题", "失败"];
  
  let positive = 0, negative = 0;
  for (const msg of messages) {
    for (const w of positiveWords) if (msg.text.includes(w)) positive++;
    for (const w of negativeWords) if (msg.text.includes(w)) negative++;
  }
  
  const mood = positive > negative + 2 ? "positive" : negative > positive ? "negative" : "neutral";
  return { positive, negative, neutral: Math.max(0, 3 - positive - negative), mood };
}

function extractKeyEvents(messages: { text: string; role: string }[]): { type: string; event: string; evidence: string }[] {
  const events: { type: string; event: string; evidence: string }[] = [];
  const userMsgs = messages.filter(m => m.role === "user");
  
  const patterns = [
    { pattern: /决定|选择|选了|确定了|拍板/, type: "decision", label: "决策" },
    { pattern: /完成|做完了|结束了|搞定了|解决了/, type: "breakthrough", label: "完成" },
    { pattern: /问题|bug|报错|失败|错误/, type: "frustration", label: "问题" },
    { pattern: /学到了|理解了|明白了|原来/, type: "realization", label: "认知" },
    { pattern: /感谢|谢谢|帮了大忙|太给力了/, type: "feedback", label: "反馈" },
    { pattern: /累了|困了|休息|睡觉|晚安/, type: "transition", label: "转换" }
  ];
  
  for (const msg of userMsgs) {
    for (const p of patterns) {
      if (p.pattern.test(msg.text)) {
        events.push({ type: p.type, event: p.label, evidence: msg.text.slice(0, 80) });
        break;
      }
    }
  }
  
  return events;
}

// ===== 信号捕获相关 =====

type SignalType = "breakthrough" | "frustration" | "decision" | "realization" | "feedback" | "question" | "transition" | "context_update";
type Initiator = "user" | "agent" | "system" | "unknown";

const SIGNAL_PATTERNS: Array<{
  signal: SignalType;
  label: string;
  primaryKw: string[];
  secondaryKw: string[];
  cooldownMs: number;
  minIntensity: number;
}> = [
  { signal: "breakthrough", label: "突破", primaryKw: ["完成了", "做完了", "搞定了", "解决了", "成功了", "成了", "done", "fixed", "solved"], secondaryKw: ["完成", "解决", "好了", "搞定"], cooldownMs: 30 * 60 * 1000, minIntensity: 0.4 },
  { signal: "frustration", label: "挫折", primaryKw: ["失败了", "不行", "错了", "bug", "报错", "搞不定", "卡住了", "崩溃", "shit", "fuck"], secondaryKw: ["难", "烦", "压力", "焦虑", "不会", "不懂"], cooldownMs: 10 * 60 * 1000, minIntensity: 0.4 },
  { signal: "decision", label: "决策", primaryKw: ["决定了", "确定了", "拍板", "选了", "就这么办", "开始干", "启动", "决定用"], secondaryKw: ["决定", "选择", "定了"], cooldownMs: 2 * 60 * 60 * 1000, minIntensity: 0.45 },
  { signal: "realization", label: "认知", primaryKw: ["学到了", "理解了", "明白了", "原来如此", "突然想通了", "领悟到"], secondaryKw: ["原来", "发现", "意识到", "认识到"], cooldownMs: 60 * 60 * 1000, minIntensity: 0.45 },
  { signal: "feedback", label: "反馈", primaryKw: ["谢谢", "感谢", "帮了大忙", "太给力了", "太感谢了", "满意", "不满意"], secondaryKw: ["好", "棒", "不错", "赞", "谢了"], cooldownMs: 15 * 60 * 1000, minIntensity: 0.35 },
  { signal: "question", label: "疑问", primaryKw: ["怎么办", "怎么解决", "为什么", "是什么", "不知道", "不确定"], secondaryKw: ["问题", "疑问", "困惑"], cooldownMs: 5 * 60 * 1000, minIntensity: 0.5 },
  { signal: "transition", label: "转换", primaryKw: ["累了", "困了", "睡觉", "休息", "晚安", "先撤", "先睡了"], secondaryKw: ["困", "睡", "稍等"], cooldownMs: 4 * 60 * 60 * 1000, minIntensity: 0.35 }
];

function detectInitiator(userText: string, responseText: string): Initiator {
  if (/^我/.test(userText) || /我的/.test(userText.slice(0, 50))) return "user";
  if (userText.includes("[") || userText.includes("工具调用")) return "system";
  if (/^(好的|了解|当然|明白|收到)/.test(responseText)) return "agent";
  if (userText.includes("请问") || userText.includes("帮你") || userText.includes("我可以")) return "agent";
  return "unknown";
}

function calculateIntensity(text: string, pattern: typeof SIGNAL_PATTERNS[0]): number {
  let score = 0;
  for (const kw of pattern.primaryKw) {
    if (text.includes(kw)) {
      score += 0.4;
      if (/太|非常|真的|终于/.test(text)) score += 0.15;
    }
  }
  for (const kw of pattern.secondaryKw) {
    if (text.includes(kw)) score += 0.12;
  }
  if (text.length > 500) score *= 0.8;
  return Math.min(score, 1.0);
}

function shouldRecord(signal: SignalType, intensity: number): boolean {
  if (intensity < 0.3) return false;
  const context = readDailyContext();
  const recent = context.recentSignals || [];
  const now = Date.now();
  const pattern = SIGNAL_PATTERNS.find(p => p.signal === signal);
  if (!pattern) return false;
  const recentSame = recent.find((r: any) => r.signal === signal && (now - r.time) < pattern.cooldownMs);
  return !recentSame;
}

function extractTopic(text: string): string {
  const patterns = [
    /(?:关于|针对|对于|在)(.{2,8})[，,：:]/,
    /(?:正在|在)(.{2,8})(?:的|上|里)/,
    /^(.{1,6})(?:说|问|想|做|搞|写|弄)/
  ];
  for (const p of patterns) {
    const match = text.match(p);
    if (match && match[1] && match[1].length >= 2) return match[1];
  }
  return "";
}
