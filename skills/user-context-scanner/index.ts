// skills/user-context-scanner/index.ts
import { UserProfile, SoulGoal, ConflictType, SoulContextVariables } from '../packages/proactive-engine/types/soul-types';
import { Context, SkillDefinition, MessagePayload } from '@openclaw/core';
import { scanAndUpdateProfile } from './user-scanner';

const SKILL_ID = 'soul-user-scanner';

class UserScannerSkill {
  async init(ctx: Context): Promise<void> {
    console.log(`[${SKILL_ID}] Initialized. Scanning user interactions for profile updates.`);
    // 初始化默认画像如果不存在
    await scanAndUpdateProfile(ctx, ''); 
  }

  async destroy(ctx: Context): Promise<void> {
    console.log(`[${SKILL_ID}] Destroyed.`);
  }

  async onMessage(ctx: Context, payload: MessagePayload): Promise<void> {
    if (payload.role !== 'user') return;

    try {
      const profile = await scanAndUpdateProfile(ctx, payload.content);
      // 可选：如果标签发生重大变化，可以触发通知或其他逻辑
      if (profile.interactionCount % 10 === 0) {
        console.log(`[${SKILL_ID}] Profile updated. Tags: ${profile.tags.join(', ')}`);
      }
    } catch (error) {
      console.error(`[${SKILL_ID}] Error scanning profile:`, error);
    }
  }
}

const skillInstance = new UserScannerSkill();

export const skill: SkillDefinition = {
  id: SKILL_ID,
  name: 'User Context Scanner',
  version: '1.0.0',
  description: 'Analyzes chat history to dynamically update user tags, interests, and communication style.',
  
  onEnable: (ctx) => skillInstance.init(ctx),
  onDisable: (ctx) => skillInstance.destroy(ctx),
  onMessage: (ctx, payload) => skillInstance.onMessage(ctx, payload)
};

export default skill;