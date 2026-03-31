/**
 * 注意力预算系统
 * 
 * 引入人工稀缺性：限制主动发起的次数
 * 让AI的主动性变得珍贵，而非无限刷屏
 */

export class AttentionBudget {
  constructor(store, api) {
    this.store = store;
    this.api = api;
    this.defaultBudget = 10;  // 每日默认10次主动触发
    this.resetHour = 6;        // 每天早上6点重置
  }

  async getBudget() {
    let budget = await this.store.get("attentionBudget");
    const today = new Date().toDateString();
    
    // 检查是否需要重置
    if (!budget || budget.resetAt !== today) {
      budget = {
        budget: this.defaultBudget,
        used: 0,
        resetAt: today,
        lastReset: new Date().toISOString()
      };
      await this.store.set("attentionBudget", budget);
    }

    return budget;
  }

  async getRemaining() {
    const budget = await this.getBudget();
    return {
      remaining: budget.budget - budget.used,
      total: budget.budget,
      used: budget.used,
      resetAt: budget.resetAt
    };
  }

  async consume(unit = 1) {
    const budget = await this.getBudget();
    
    if (budget.used + unit > budget.budget) {
      return {
        success: false,
        message: "今日主动触发次数已用完",
        remaining: budget.budget - budget.used
      };
    }

    budget.used += unit;
    await this.store.set("attentionBudget", budget);

    return {
      success: true,
      used: budget.used,
      remaining: budget.budget - budget.used
    };
  }

  async reset() {
    const budget = await this.getBudget();
    budget.used = 0;
    budget.resetAt = new Date().toDateString();
    budget.lastReset = new Date().toISOString();
    await this.store.set("attentionBudget", budget);
    
    return {
      success: true,
      message: "注意力预算已重置",
      budget: budget.budget,
      used: 0,
      remaining: budget.budget
    };
  }

  async setBudget(newBudget) {
    const budget = await this.getBudget();
    budget.budget = Math.max(1, Math.min(50, newBudget));  // 限制在1-50之间
    await this.store.set("attentionBudget", budget);
    
    return {
      success: true,
      budget: budget.budget,
      used: budget.used,
      remaining: budget.budget - budget.used
    };
  }

  async getHistory(days = 7) {
    // 注意：这个实现简化了，实际上应该存储历史记录
    const budget = await this.getBudget();
    return {
      current: budget,
      note: `最近${days}天的历史需要扩展存储`
    };
  }

  // 判断是否应该主动行动
  async shouldProactive(minimumRemaining = 2) {
    const remaining = await this.getRemaining();
    
    // 如果剩余次数过低，不建议主动
    if (remaining.remaining < minimumRemaining) {
      return {
        should: false,
        reason: `剩余次数不足（${remaining.remaining}）`,
        remaining: remaining.remaining
      };
    }

    // 如果今天已经用完，不建议
    if (remaining.remaining <= 0) {
      return {
        should: false,
        reason: "今日主动触发次数已用完",
        remaining: 0
      };
    }

    return {
      should: true,
      remaining: remaining.remaining,
      message: `可以主动（剩余${remaining.remaining}次）`
    };
  }
}
