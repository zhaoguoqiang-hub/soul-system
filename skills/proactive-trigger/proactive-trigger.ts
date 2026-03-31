// skills/proactive-trigger/proactive-trigger.ts

import { Context } from '../packages/proactive-engine/types/openclaw-stub';
import { Goal } from '../packages/proactive-engine/types/soul-types';
import { config } from '../packages/proactive-engine/src/config';
import { checkTriggerCooldown } from './trigger-tracker';

interface TriggerResult {
  shouldTrigger: boolean;
  reason: string;
  messageSuggestion?: string;
  priority: 'low' | 'medium' | 'high';
}

export async function evaluateProactiveTrigger(
  ctx: Context,
  activeGoals: Goal[]
): Promise<TriggerResult> {
  
  const now = Date.now();
  const hour = new Date().getHours();

  // 1. 冷却检查
  const isCoolingDown = await checkTriggerCooldown(ctx);
  if (isCoolingDown) {
    return { shouldTrigger: false, reason: 'In cooldown period', priority: 'low' };
  }

  // 2. 时间窗口检查（可配置）
  const { primeTimeStart: start, primeTimeEnd: end } = config.trigger;
  const isPrimeTime = hour >= start && hour <= end;
  if (!isPrimeTime) {
    return { shouldTrigger: false, reason: 'Not prime time', priority: 'low' };
  }

  // 3. 扫描目标状态
  for (const goal of activeGoals) {
    const daysIdle = (now - new Date(goal.lastUpdated).getTime()) / (1000 * 60 * 60 * 24);

    if (daysIdle > 3 && goal.progress < 50) {
      return {
        shouldTrigger: true,
        reason: `Goal "${goal.name}" is stagnating (${Math.floor(daysIdle)} days idle).`,
        messageSuggestion: `嘿，注意到你已经 ${Math.floor(daysIdle)} 天没更新"${goal.name}"的进度了。是不是遇到了什么困难？需要我帮你把任务拆小一点吗？`,
        priority: 'high'
      };
    }

    if (goal.progress >= 80 && goal.progress < 100) {
      return {
        shouldTrigger: true,
        reason: `Goal "${goal.name}" is near completion.`,
        messageSuggestion: `太棒了！"${goal.name}"已经完成 ${goal.progress}% 了！趁热打铁，今天要不要冲刺一下把它搞定？`,
        priority: 'medium'
      };
    }
  }

  return { shouldTrigger: false, reason: 'No significant events detected', priority: 'low' };
}
