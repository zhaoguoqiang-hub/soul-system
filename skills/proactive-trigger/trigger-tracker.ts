// skills/proactive-trigger/trigger-tracker.ts

import { Context } from '../packages/proactive-engine/types/openclaw-stub';
import { readFromStorage, writeToStorage } from '../packages/proactive-engine/src/utils/storage';
import { config } from '../packages/proactive-engine/src/config';

interface TriggerState {
  lastTriggerTime: number;
  triggerCountToday: number;
  lastResetDate: string; // YYYY-MM-DD
}

/**
 * 检查是否处于冷却期
 * @returns true 如果正在冷却中 (不应触发)
 */
export async function checkTriggerCooldown(ctx: Context): Promise<boolean> {
  const state = await readFromStorage<TriggerState>(ctx, 'trigger_state', {
    lastTriggerTime: 0,
    triggerCountToday: 0,
    lastResetDate: new Date().toISOString().split('T')[0]
  });

  const now = Date.now();
  const todayStr = new Date().toISOString().split('T')[0];

  if (state.lastResetDate !== todayStr) {
    state.triggerCountToday = 0;
    state.lastResetDate = todayStr;
    await writeToStorage(ctx, 'trigger_state', state);
    return false;
  }

  if (state.triggerCountToday >= config.trigger.maxDailyTriggers) {
    return true;
  }

  if (now - state.lastTriggerTime < config.trigger.cooldownMs) {
    return true;
  }

  return false;
}

/**
 * 记录一次触发发生
 */
export async function recordTrigger(ctx: Context): Promise<void> {
  const state = await readFromStorage<TriggerState>(ctx, 'trigger_state', {
    lastTriggerTime: 0,
    triggerCountToday: 0,
    lastResetDate: new Date().toISOString().split('T')[0]
  });

  state.lastTriggerTime = Date.now();
  state.triggerCountToday += 1;
  
  await writeToStorage(ctx, 'trigger_state', state);
}
