/**
 * 叙事记忆系统
 * 
 * 将碎片事件编织成时间线，构建用户的"人生故事"
 * 让AI能说出"根据我对你的了解……"
 */

export class NarrativeMemory {
  constructor(store, api) {
    this.store = store;
    this.api = api;
    this.maxEvents = 500;  // 保留最近500条事件
  }

  async addEvent({ event, category = "general", importance = 0.5, tags = [] }) {
    const narrative = await this.store.get("narrative") || [];
    
    const newEvent = {
      id: this.generateId(),
      event,
      category,
      importance,
      tags,
      timestamp: new Date().toISOString()
    };

    narrative.push(newEvent);

    // 如果超过最大容量，进行重要性筛选
    if (narrative.length > this.maxEvents) {
      // 按重要性排序，保留最重要的事件
      narrative.sort((a, b) => b.importance - a.importance);
      // 保留前maxEvents条
      narrative.splice(this.maxEvents);
    }

    await this.store.set("narrative", narrative);
    return newEvent;
  }

  async getTimeline({ startDate, endDate, limit = 20 } = {}) {
    let narrative = await this.store.get("narrative") || [];

    // 日期过滤
    if (startDate) {
      const start = new Date(startDate);
      narrative = narrative.filter(e => new Date(e.timestamp) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      narrative = narrative.filter(e => new Date(e.timestamp) <= end);
    }

    // 按时间倒序
    narrative.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // 限制数量
    narrative = narrative.slice(0, limit);

    return this.formatTimeline(narrative);
  }

  async getRecent(limit = 10) {
    let narrative = await this.store.get("narrative") || [];
    narrative.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    narrative = narrative.slice(0, limit);
    return narrative;
  }

  async search(query) {
    const narrative = await this.store.get("narrative") || [];
    const lowerQuery = query.toLowerCase();
    
    const results = narrative.filter(e => 
      e.event.toLowerCase().includes(lowerQuery) ||
      e.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
      e.category.toLowerCase().includes(lowerQuery)
    );

    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return results.slice(0, 20);
  }

  async getByCategory(category, limit = 20) {
    let narrative = await this.store.get("narrative") || [];
    narrative = narrative.filter(e => e.category === category);
    narrative.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return narrative.slice(0, limit);
  }

  async getStats() {
    const narrative = await this.store.get("narrative") || [];
    
    const stats = {
      total: narrative.length,
      byCategory: {},
      byMonth: {},
      topTags: {}
    };

    for (const event of narrative) {
      // 按类别统计
      stats.byCategory[event.category] = (stats.byCategory[event.category] || 0) + 1;
      
      // 按月份统计
      const month = event.timestamp.substring(0, 7); // YYYY-MM
      stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
      
      // 按标签统计
      for (const tag of event.tags) {
        stats.topTags[tag] = (stats.topTags[tag] || 0) + 1;
      }
    }

    // 排序topTags
    stats.topTags = Object.entries(stats.topTags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

    return stats;
  }

  async deleteEvent(eventId) {
    const narrative = await this.store.get("narrative") || [];
    const index = narrative.findIndex(e => e.id === eventId);
    if (index !== -1) {
      narrative.splice(index, 1);
      await this.store.set("narrative", narrative);
    }
    return { success: index !== -1 };
  }

  formatTimeline(events) {
    // 按日期分组
    const grouped = {};
    for (const event of events) {
      const date = event.timestamp.split("T")[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    }

    return {
      events,
      grouped,
      total: events.length
    };
  }

  generateId() {
    return `evt-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
  }
}
