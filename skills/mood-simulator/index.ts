// skills/mood-simulator/index.ts

import { Context, SkillDefinition, MessagePayload } from '../packages/proactive-engine/types/openclaw-stub';
import { 
  updateMoodByEvent, 
  getMoodPromptInstruction, 
  scanGoalsForMood, 
  MoodState,
  DEFAULT_MOOD 
} from './mood-engine';
import { readFromStorage } from '../packages/proactive-engine/src/utils/storage';
import { Goal } from '../packages/proactive-engine/types/soul-types';

const SKILL_ID = 'soul-mood-simulator';

class MoodSimulatorSkill {
  async init(ctx: Context): Promise<void> {
    console.log(`[${SKILL_ID}] Initialized. Emotion engine ready.`);
    const goals = await readFromStorage<Goal[]>(ctx, 'goals', []);
    await scanGoalsForMood(ctx, goals);
  }

  async destroy(_ctx: Context): Promise<void> {
    console.log(`[${SKILL_ID}] Destroyed.`);
  }

  async onMessage(ctx: Context, payload: MessagePayload): Promise<void> {
    if (payload.role !== 'user') return;

    const text = payload.content || '';
    
    const positiveWords = ['开心', '棒', '太好了', '完成了', 'love', 'great', 'happy'];
    const negativeWords = ['难过', '累', '烦', '放弃', 'hate', 'sad', 'tired', 'stuck'];

    let eventType: 'user_positive' | 'user_negative' | null = null;

    if (positiveWords.some(w => text.includes(w))) {
      eventType = 'user_positive';
    } else if (negativeWords.some(w => text.includes(w))) {
      eventType = 'user_negative';
    }

    if (eventType) {
      await updateMoodByEvent(ctx, eventType, 1.0);
    }
    
    const stats = await readFromStorage<{ count: number }>(ctx, 'msg_stats', { count: 0 });
    if (stats.count % 10 === 0) {
      const goals = await readFromStorage<Goal[]>(ctx, 'goals', []);
      await scanGoalsForMood(ctx, goals);
    }
    await ctx.storage.set('soul_msg_stats', JSON.stringify({ count: stats.count + 1 }));
  }

  async onBeforeSend?(ctx: Context, payload: MessagePayload): Promise<MessagePayload | null> {
    if (payload.role !== 'assistant') return null;

    try {
      const state = await readFromStorage<MoodState>(ctx, 'mood_state', { ...DEFAULT_MOOD, lastUpdated: Date.now() });
      const moodInstruction = getMoodPromptInstruction(state);

      const enhancedPayload = {
        ...payload,
        metadata: {
          ...payload.metadata,
          moodState: state,
          systemInstructionAppend: moodInstruction
        }
      };

      console.log(`[${SKILL_ID}] Injecting mood: ${state.currentLabel}`);
      return enhancedPayload;

    } catch (error) {
      console.error(`[${SKILL_ID}] Error injecting mood:`, error);
      return payload;
    }
  }
}

const skillInstance = new MoodSimulatorSkill();

export const skill: SkillDefinition = {
  id: SKILL_ID,
  name: 'Mood Simulator',
  version: '1.0.0',
  description: 'Simulates dynamic emotions based on user interactions and goal progress, adjusting AI tone accordingly.',
  
  onEnable: (ctx) => skillInstance.init(ctx),
  onDisable: (ctx) => skillInstance.destroy(ctx),
  onMessage: (ctx, payload) => skillInstance.onMessage(ctx, payload),
  onBeforeSend: async (ctx, payload) => {
    if (!skillInstance.onBeforeSend) return null;
    return skillInstance.onBeforeSend(ctx, payload);
  }
};

export default skill;
