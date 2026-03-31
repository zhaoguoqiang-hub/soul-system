/**
 * 目标管理器 - 内生目标系统
 * 
 * 管理AI助理的4个核心目标：
 * - understand-user: 深度理解用户
 * - proactive-help: 主动帮助
 * - maintain-context: 保持上下文
 * - self-growth: 自我进化
 */

export class GoalManager {
  constructor(store, api) {
    this.store = store;
    this.api = api;
    this.coreGoals = [
      {
        id: "understand-user",
        name: "深度理解用户",
        description: "能够准确预判用户的需求和偏好",
        priority: 8,
        status: "active",
        progress: 0,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      {
        id: "proactive-help",
        name: "主动帮助",
        description: "不只是被动响应，要主动识别机会",
        priority: 7,
        status: "active",
        progress: 0,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      {
        id: "maintain-context",
        name: "保持上下文",
        description: "跨会话记忆重要信息，保持一致性",
        priority: 9,
        status: "active",
        progress: 0,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      {
        id: "self-growth",
        name: "自我进化",
        description: "通过反思和学习不断提升能力",
        priority: 6,
        status: "active",
        progress: 0,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
    ];
  }

  async init() {
    const existing = await this.store.get("goals");
    if (!existing || existing.length === 0) {
      await this.store.set("goals", this.coreGoals);
    }
  }

  async getGoals() {
    let goals = await this.store.get("goals");
    if (!goals || goals.length === 0) {
      goals = this.coreGoals;
      await this.store.set("goals", goals);
    }
    return goals;
  }

  async listGoals() {
    const goals = await this.getGoals();
    return goals.map(g => ({
      id: g.id,
      name: g.name,
      status: g.status,
      progress: g.progress,
      priority: g.priority
    }));
  }

  async getActiveGoals() {
    const goals = await this.getGoals();
    return goals.filter(g => g.status === "active");
  }

  async updateProgress(goalId, delta, reason) {
    const goals = await this.getGoals();
    const goal = goals.find(g => g.id === goalId);
    
    if (!goal) {
      // 尝试在coreGoals中查找
      const core = this.coreGoals.find(g => g.id === goalId);
      if (core) {
        goals.push({ ...core, progress: 0, lastUpdated: new Date().toISOString() });
        await this.store.set("goals", goals);
        return this.updateProgress(goalId, delta, reason);
      }
      throw new Error(`目标不存在: ${goalId}`);
    }

    goal.progress = Math.max(0, Math.min(100, goal.progress + delta));
    goal.lastUpdated = new Date().toISOString();
    
    if (reason) {
      goal.lastReason = reason;
    }

    // 如果进度达到100%，标记为完成
    if (goal.progress >= 100) {
      goal.status = "completed";
    }

    await this.store.set("goals", goals);
    return goal;
  }

  async addGoal({ name, description, priority = 5 }) {
    const goals = await this.getGoals();
    const newGoal = {
      id: this.generateId(name),
      name,
      description,
      priority,
      status: "active",
      progress: 0,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    goals.push(newGoal);
    await this.store.set("goals", goals);
    return newGoal;
  }

  async removeGoal(goalId) {
    const goals = await this.getGoals();
    const index = goals.findIndex(g => g.id === goalId);
    if (index === -1) {
      throw new Error(`目标不存在: ${goalId}`);
    }
    goals.splice(index, 1);
    await this.store.set("goals", goals);
    return { success: true };
  }

  async pauseGoal(goalId) {
    const goals = await this.getGoals();
    const goal = goals.find(g => g.id === goalId);
    if (!goal) throw new Error(`目标不存在: ${goalId}`);
    goal.status = "paused";
    goal.lastUpdated = new Date().toISOString();
    await this.store.set("goals", goals);
    return goal;
  }

  async resumeGoal(goalId) {
    const goals = await this.getGoals();
    const goal = goals.find(g => g.id === goalId);
    if (!goal) throw new Error(`目标不存在: ${goalId}`);
    goal.status = "active";
    goal.lastUpdated = new Date().toISOString();
    await this.store.set("goals", goals);
    return goal;
  }

  generateId(name) {
    const base = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    return `${base}-${Date.now().toString(36)}`;
  }
}
