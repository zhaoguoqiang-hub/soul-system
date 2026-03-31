// skills/value-aware-guard/index.ts

import { Context, SkillDefinition, MessagePayload } from '../packages/proactive-engine/types/openclaw-stub';
import { evaluateSafety } from './value-guard';

const SKILL_ID = 'soul-value-guard';

class ValueGuardSkill {
  async init(ctx: Context): Promise<void> {
    console.log(`[${SKILL_ID}] Initialized. Monitoring messages for value conflicts.`);
  }

  async destroy(ctx: Context): Promise<void> {
    console.log(`[${SKILL_ID}] Destroyed.`);
  }

  /**
   * 拦截 AI 发出的消息
   * 注意：这需要框架支持 "onBeforeSend" 或类似的中间件钩子。
   * 如果框架只支持 "onMessage" (接收后)，则此技能主要用于事后警告或记录。
   * 这里假设框架允许我们在发送前拦截 (或通过修改 context 状态来阻止发送)。
   */
  async onBeforeSend?(ctx: Context, payload: MessagePayload): Promise<MessagePayload | null> {
    // 只检查 AI 生成的回复
    if (payload.role !== 'assistant') return payload;

    try {
      const result = await evaluateSafety(ctx, payload.content || '', true);

      if (!result.allowed) {
        console.warn(`[${SKILL_ID}] BLOCKED message: ${result.reason}`);
        
        // 策略 1: 直接替换为建议内容
        if (result.suggestedEdit) {
          return {
            ...payload,
            content: result.suggestedEdit,
            metadata: { ...payload.metadata, guarded: true, reason: result.reason }
          };
        }
        
        // 策略 2: 直接阻断 (返回 null 或抛出特定错误，取决于框架行为)
        // 这里返回一个安全的默认回复
        return {
          ...payload,
          content: "为了符合你的价值观和目标，我暂时不能这样回答。我们可以换个角度聊聊吗？",
          metadata: { ...payload.metadata, guarded: true, reason: result.reason }
        };
      }
    } catch (error) {
      console.error(`[${SKILL_ID}] Error in guard check:`, error);
      // 失败时默认放行，避免阻塞用户体验
    }

    return payload;
  }
  
  // 兼容旧版框架：如果没有 onBeforeSend，可以在 onMessage 中记录违规
  async onMessage(ctx: Context, payload: MessagePayload): Promise<void> {
     // 如果是用户发了危险内容，记录日志或给予温和提醒
     if (payload.role === 'user') {
       const result = await evaluateSafety(ctx, payload.content || '', false);
       if (!result.allowed && result.severity === 'high') {
         console.log(`[${SKILL_ID}] User input flagged: ${result.reason}`);
         // 可以选择在这里插入一条系统的关怀消息
       }
     }
  }
}

const skillInstance = new ValueGuardSkill();

export const skill: SkillDefinition = {
  id: SKILL_ID,
  name: 'Value Aware Guard',
  version: '1.0.0',
  description: 'Intercepts messages to ensure alignment with user values, goals, and safety guidelines.',
  
  onEnable: (ctx) => skillInstance.init(ctx),
  onDisable: (ctx) => skillInstance.destroy(ctx),
  onMessage: (ctx, payload) => skillInstance.onMessage(ctx, payload),
  // 如果框架支持，注册这个钩子
  onBeforeSend: async (ctx, payload) => {
    if (!skillInstance.onBeforeSend) return payload;
    return skillInstance.onBeforeSend(ctx, payload);
  }
};

export default skill;