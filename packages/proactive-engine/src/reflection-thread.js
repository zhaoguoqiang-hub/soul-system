/**
 * 反思线程 - 后台常驻进程
 * 
 * 在用户无交互时自动执行：
 * - 梳理未完成目标
 * - 分析交互模式
 * - 生成洞察和建议
 */

export class ReflectionThread {
  constructor({ store, goalManager, narrativeMemory, api, intervalMs, idleThresholdMs }) {
    this.store = store;
    this.goalManager = goalManager;
    this.narrativeMemory = narrativeMemory;
    this.api = api;
    this.intervalMs = intervalMs || 3600000;  // 默认1小时
    this.idleThresholdMs = idleThresholdMs || 300000;  // 默认5分钟
    this.timer = null;
    this.isRunning = false;
    this.lastUserInteraction = Date.now();
  }

  start() {
    if (this.timer) return;
    
    this.timer = setInterval(() => {
      this.runIfNeeded();
    }, this.intervalMs);

    // 记录启动
    this.narrativeMemory.addEvent({
      event: "反思线程已启动",
      category: "milestone",
      importance: 0.8,
      tags: ["系统", "启动"]
    });
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    this.narrativeMemory.addEvent({
      event: "反思线程已停止",
      category: "milestone",
      importance: 0.8,
      tags: ["系统"]
    });
  }

  recordInteraction() {
    this.lastUserInteraction = Date.now();
  }

  async runIfNeeded() {
    if (this.isRunning) return;
    
    const idleMs = Date.now() - this.lastUserInteraction;
    const isDeepReflection = idleMs > this.idleThresholdMs;
    
    if (isDeepReflection) {
      await this.runDeep(true);
    } else {
      await this.runShallow(false);
    }
  }

  async runShallow(force = false) {
    if (this.isRunning && !force) return;
    this.isRunning = true;

    try {
      // 1. 检查目标进度
      const goals = await this.goalManager.getGoals();
      const insights = [];

      // 2. 分析叙事模式（浅层）
      const stats = await this.narrativeMemory.getStats();
      
      // 3. 识别需要关注的信号
      for (const goal of goals) {
        if (goal.status === "active" && goal.progress < 20) {
          insights.push({
            type: "goal_slow",
            goalId: goal.id,
            goalName: goal.name,
            message: `目标"${goal.name}"进展缓慢（${goal.progress}%）`,
            suggestion: "建议拆解为更小的子目标"
          });
        }
      }

      // 4. 更新统计
      const reflectionStats = await this.store.get("reflectionStats") || { total: 0, lastRun: null };
      reflectionStats.total += 1;
      reflectionStats.lastRun = new Date().toISOString();
      reflectionStats.lastType = "shallow";
      await this.store.set("reflectionStats", reflectionStats);

      // 5. 记录反思
      await this.narrativeMemory.addEvent({
        event: `浅层反思完成：发现${insights.length}个关注点`,
        category: "reflection",
        importance: 0.5,
        tags: ["反思", "浅层"]
      });

      return {
        type: "shallow",
        timestamp: new Date().toISOString(),
        insights,
        stats: {
          goalsCount: goals.length,
          narrativeCount: stats.total
        }
      };
    } finally {
      this.isRunning = false;
    }
  }

  async runDeep(force = false) {
    if (this.isRunning && !force) return;
    this.isRunning = true;

    try {
      // 1. 获取完整上下文
      const goals = await this.goalManager.getGoals();
      const narrative = await this.narrativeMemory.getRecent(50);
      const reflectionStats = await this.store.get("reflectionStats") || { total: 0 };
      const userProfile = await this.store.get("userProfile") || {};

      const insights = [];
      const recommendations = [];

      // 2. 深度分析目标状态
      for (const goal of goals) {
        if (goal.status === "active") {
          if (goal.progress < 30) {
            recommendations.push(`目标"${goal.name}"需要更多关注，建议制定具体行动计划`);
          }
          if (goal.lastReason) {
            insights.push({
              type: "goal_progress",
              goalId: goal.id,
              message: `目标"${goal.name}"因"${goal.lastReason}"更新`
            });
          }
        }
      }

      // 3. 分析叙事趋势
      const categories = {};
      for (const event of narrative) {
        categories[event.category] = (categories[event.category] || 0) + 1;
      }
      
      const topCategory = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])[0];
      
      if (topCategory) {
        insights.push({
          type: "narrative_trend",
          message: `近期最高频活动类型：${topCategory[0]}（${topCategory[1]}次）`
        });
        
        if (topCategory[1] > 10) {
          recommendations.push(`你最近在${topCategory[0]}方面很活跃，考虑设定相关目标`);
        }
      }

      // 4. 检查用户画像完整性
      const profileKeys = Object.keys(userProfile).filter(k => k !== "lastUpdated");
      if (profileKeys.length < 3) {
        recommendations.push("用户画像信息较少，建议在对话中主动了解用户偏好");
      }

      // 5. 更新统计
      reflectionStats.total += 1;
      reflectionStats.lastRun = new Date().toISOString();
      reflectionStats.lastType = "deep";
      await this.store.set("reflectionStats", reflectionStats);

      // 6. 保存深度反思记录
      const reflections = await this.store.get("reflections") || [];
      reflections.push({
        timestamp: new Date().toISOString(),
        type: "deep",
        insights,
        recommendations,
        goalsSnapshot: goals.map(g => ({ id: g.id, name: g.name, progress: g.progress })),
        narrativeCount: narrative.length
      });
      
      // 只保留最近30条
      if (reflections.length > 30) reflections.shift();
      await this.store.set("reflections", reflections);

      // 7. 记录叙事
      await this.narrativeMemory.addEvent({
        event: `深度反思完成：${insights.length}个洞察，${recommendations.length}个建议`,
        category: "reflection",
        importance: 0.7,
        tags: ["反思", "深度"]
      });

      return {
        type: "deep",
        timestamp: new Date().toISOString(),
        insights,
        recommendations,
        reflectionId: reflections.length
      };
    } finally {
      this.isRunning = false;
    }
  }

  getStatus() {
    return {
      running: !!this.timer,
      intervalMs: this.intervalMs,
      idleThresholdMs: this.idleThresholdMs,
      isExecuting: this.isRunning,
      lastInteraction: new Date(this.lastUserInteraction).toISOString(),
      idleMs: Date.now() - this.lastUserInteraction
    };
  }
}
