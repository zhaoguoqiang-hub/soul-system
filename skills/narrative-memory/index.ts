// skills/narrative-memory/index.ts
import { UserProfile, SoulGoal, ConflictType, SoulContextVariables } from '../packages/proactive-engine/types/soul-types';
import { Context, SkillDefinition, MessagePayload } from '@openclaw/core';
import { processNewMemory } from './narrative-memory';

const SKILL_ID = 'soul-narrative-memory';

class NarrativeMemorySkill {
  async init(ctx: Context): Promise<void> {
    console.log(`[${SKILL_ID}] Initialized. Listening for messages to extract memories.`);
  }

  async destroy(ctx: Context): Promise<void> {
    console.log(`[${SKILL_ID}] Destroyed.`);
  }

  async onMessage(ctx: Context, payload: MessagePayload): Promise<void> {
    // 只处理用户消息，忽略系统消息或自己的消息
    if (payload.role !== 'user') return;

    try {
      // 提取记忆 (这里暂时不传 AI 回复，因为还没生成，可以在后处理钩子中补充)
      await processNewMemory(ctx, payload.content);
    } catch (error) {
      console.error(`[${SKILL_ID}] Error processing memory:`, error);
    }
  }
}

const skillInstance = new NarrativeMemorySkill();

export const skill: SkillDefinition = {
  id: SKILL_ID,
  name: 'Narrative Memory',
  version: '1.0.0',
  description: 'Extracts facts, preferences, and events from chat to build long-term user memory.',
  
  onEnable: (ctx) => skillInstance.init(ctx),
  onDisable: (ctx) => skillInstance.destroy(ctx),
  onMessage: (ctx, payload) => skillInstance.onMessage(ctx, payload)
};

export default skill;