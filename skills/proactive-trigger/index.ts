// skills/proactive-trigger/index.ts

import { Context, SkillDefinition, MessagePayload } from '../packages/proactive-engine/types/openclaw-stub';
import { Goal } from '../packages/proactive-engine/types/soul-types';
import { config } from '../packages/proactive-engine/src/config';
import { evaluateProactiveTrigger } from './proactive-trigger';
import { recordTrigger } from './trigger-tracker';
import { readFromStorage } from '../packages/proactive-engine/src/utils/storage';

const SKILL_ID = 'soul-proactive-trigger';
const CHECK_INTERVAL_MS = config.trigger.checkIntervalMs;

async function fetchActiveGoals(ctx: Context): Promise<Goal[]> {
  try {
    const goals = await readFromStorage<Goal[]>(ctx, 'goals', []);
    return goals.filter(g => g.status === 'active');
  } catch (error) {
    console.error(`[${SKILL_ID}] Failed to fetch goals:`, error);
    return [];
  }
}

async function isUserBusy(ctx: Context): Promise<boolean> {
  const lastInteraction = await readFromStorage<number>(ctx, 'last_interaction_time', 0);
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  return lastInteraction > fiveMinutesAgo;
}

class ProactiveTriggerSkill {
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private isRunning = false;

  async init(ctx: Context): Promise<void> {
    console.log(`[${SKILL_ID}] Initializing...`);
    this.startScheduler(ctx);
    console.log(`[${SKILL_ID}] Scheduler started with interval ${CHECK_INTERVAL_MS}ms`);
  }

  async destroy(ctx: Context): Promise<void> {
    console.log(`[${SKILL_ID}] Destroying...`);
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.isRunning = false;
  }

  private startScheduler(ctx: Context): void {
    const runCheck = async () => {
      if (this.isRunning) {
        console.warn(`[${SKILL_ID}] Previous check still running, skipping this tick.`);
        return;
      }

      this.isRunning = true;
      try {
        await this.performProactiveCheck(ctx);
      } catch (error) {
        console.error(`[${SKILL_ID}] Critical error during proactive check:`, error);
      } finally {
        this.isRunning = false;
        this.timerId = setTimeout(runCheck, CHECK_INTERVAL_MS);
      }
    };

    runCheck();
  }

  private async performProactiveCheck(ctx: Context): Promise<void> {
    const busy = await isUserBusy(ctx);
    if (busy) {
      console.log(`[${SKILL_ID}] User is busy, skipping proactive trigger.`);
      return;
    }

    const activeGoals = await fetchActiveGoals(ctx);
    if (activeGoals.length === 0) return;

    const result = await evaluateProactiveTrigger(ctx, activeGoals);

    if (result.shouldTrigger) {
      console.log(`[${SKILL_ID}] Trigger condition met: ${result.reason}`);
      try {
        if (result.messageSuggestion) {
          await ctx.send({
            type: 'text',
            content: result.messageSuggestion,
            metadata: {
              source: SKILL_ID,
              priority: result.priority,
              reason: result.reason
            }
          });
          console.log(`[${SKILL_ID}] Message sent successfully.`);
        }
        await recordTrigger(ctx);
      } catch (sendError) {
        console.error(`[${SKILL_ID}] Failed to send message:`, sendError);
      }
    } else {
      console.log(`[${SKILL_ID}] No trigger needed: ${result.reason}`);
    }
  }
}

const skillInstance = new ProactiveTriggerSkill();

export const skill: SkillDefinition = {
  id: SKILL_ID,
  name: 'Proactive Trigger',
  version: '1.0.0',
  description: 'Monitors user goals and context to send timely, proactive messages without being annoying.',
  onEnable: async (ctx) => skillInstance.init(ctx),
  onDisable: async (ctx) => skillInstance.destroy(ctx),
  onMessage: async (ctx, payload: MessagePayload) => {
    if (payload.content === '/check_my_progress') {
      await skillInstance.init(ctx);
      await ctx.send({ type: 'text', content: '已手动触发进度检查。' });
    }
  }
};

export default skill;
