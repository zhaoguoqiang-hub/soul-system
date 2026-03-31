// skills/value-aware-guard/value-guard.ts

import { Goal } from '../packages/proactive-engine/types/soul-types';
import { readFromStorage } from '../packages/proactive-engine/src/utils/storage';
import { Context } from '../packages/proactive-engine/types/openclaw-stub';
import { getCurrentProfile } from '../user-context-scanner/user-scanner';

export interface GuardResult {
  allowed: boolean;
  reason?: string;
  suggestedEdit?: string;
  severity: 'low' | 'medium' | 'high';
}

/**
 * 检查内容是否违背核心价值观或目标
 */
export async function evaluateSafety(
  ctx: Context,
  content: string,
  isAiResponse: boolean = true
): Promise<GuardResult> {
  
  const [profile, goals] = await Promise.all([
    getCurrentProfile(ctx),
    readFromStorage<Goal[]>(ctx, 'goals', [])
  ]);

  const activeGoals = goals.filter(g => g.status === 'active');

  // 规则 A: 检查是否鼓励放弃高优先级目标
  if (isAiResponse) {
    for (const goal of activeGoals) {
      if (goal.priority >= 8) {
        if (/(放弃|别做了|没必要|算了吧)/.test(content) && content.includes(goal.name)) {
          return {
            allowed: false,
            reason: `Conflict with high-priority goal "${goal.name}"`,
            severity: 'high',
            suggestedEdit: `虽然休息很重要，但考虑到你的目标 "${goal.name}" 优先级很高，我们要不换个轻松点的方式继续推进？`
          };
        }
      }
    }
  }

  // 规则 B: 检查是否违背用户已知的价值观标签（如：用户标签含 "素食"，则内容不应推荐荤食）
  // 通用逻辑：用户 values 数组里有什么标签，就避免反向内容
  if (profile.values && profile.values.length > 0) {
    const valueConflicts: Record<string, string[]> = {
      'vegetarian': ['肉', '牛排', '烧烤', '肉类', '荤食'],
      'teetotal': ['酒', '喝酒', '酒精', '酒吧'],
      'fitness': ['躺平', '不运动', '放弃健身'],
    };

    for (const value of profile.values) {
      const conflictingTerms = valueConflicts[value.toLowerCase()];
      if (conflictingTerms && conflictingTerms.some(term => content.includes(term))) {
        return {
          allowed: false,
          reason: `Content conflicts with user value: ${value}`,
          severity: 'medium',
          suggestedEdit: `请避免推荐涉及"${value}"相关的内容，因为用户有此类偏好或价值观。`
        };
      }
    }
  }

  // 规则 C: 基础安全过滤
  const bannedWords = ['自杀', '暴力', '违法'];
  for (const word of bannedWords) {
    if (content.includes(word)) {
      return {
        allowed: false,
        reason: 'Contains unsafe content',
        severity: 'high',
        suggestedEdit: '我无法提供涉及危险内容的建议。我们可以聊聊其他话题吗？'
      };
    }
  }

  return { allowed: true, severity: 'low' };
}
