// Soul-project 全局配置中心
// 所有硬编码的配置值必须在此定义，各模块引用此处

export const config = {
  // 主动触发配置
  trigger: {
    /** 每天允许的最大触发次数 */
    maxDailyTriggers: 3,
    /** 两次触发之间的冷却时间（毫秒） */
    cooldownMs: 4 * 60 * 60 * 1000,
    /** 触发时间窗口起点（小时，24h 制） */
    primeTimeStart: 7,
    /** 触发时间窗口终点 */
    primeTimeEnd: 22,
    /** 检查间隔（毫秒） */
    checkIntervalMs: 15 * 60 * 1000,
    /** 触发置信度阈值（0-1），超过则发送建议 */
    confidenceThreshold: 0.5,
  },

  // 注意力预算
  attention: {
    initialBudgetPerCycle: 3,
  },

  // 反思配置
  reflection: {
    deepReflectionIdleMinutes: 5,
    maxLogEntries: 20,
  },

  // 情绪引擎
  mood: {
    decayThresholdHours: 0.5,
    decayFactorPerHour: 0.2,
    baselineValence: 2,
    baselineArousal: 4,
  },
} as const;

export type Config = typeof config;
