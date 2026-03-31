// skills/user-context-scanner/user-scanner.ts

import { readFromStorage, writeToStorage } from '../packages/proactive-engine/src/utils/storage';
import { Context } from '../packages/proactive-engine/types/openclaw-stub';
import { UserProfile } from '../packages/proactive-engine/types/soul-types';

const DEFAULT_PROFILE: UserProfile = {
  current_mood: 'neutral',
  mood_confidence: 0,
  suggested_response_style: 'normal',
  emotion_history: [],
  preferences: [],
  habits: [],
  values: [],
  personality: {
    humor: 0.5,
    honesty: 0.8,
    professionalism: 0.7,
    proactivity: 0.6,
    directness: 0.7,
  },
  last_updated: new Date().toISOString(),
};

/**
 * 简单的关键词匹配更新标签
 */
function analyzeAndUpdateTags(text: string, currentProfile: UserProfile): string[] {
  const newTags = new Set(currentProfile.values);

  const tagMap: Record<string, string[]> = {
    '代码': ['developer', 'tech'],
    '编程': ['developer', 'tech'],
    '健身': ['fitness', 'health'],
    '跑步': ['fitness', 'outdoor'],
    '书': ['reading', 'learning'],
    '电影': ['movies', 'entertainment'],
    '加班': ['workaholic', 'busy'],
    '周末': ['leisure'],
  };

  for (const [keyword, tags] of Object.entries(tagMap)) {
    if (text.includes(keyword)) {
      tags.forEach(t => newTags.add(t));
    }
  }

  return Array.from(newTags);
}

/**
 * 扫描消息并更新用户画像
 */
export async function scanAndUpdateProfile(
  ctx: Context,
  userInput: string
): Promise<UserProfile> {
  const currentProfile = await readFromStorage<UserProfile>(ctx, 'user_profile_v1', { ...DEFAULT_PROFILE });

  const updatedValues = analyzeAndUpdateTags(userInput, currentProfile);

  let style = currentProfile.suggested_response_style;
  if (userInput.length > 100 && userInput.includes('因为') && userInput.includes('所以')) {
    style = 'warm';
  } else if (userInput.length < 10) {
    style = 'brief';
  }

  const newProfile: UserProfile = {
    ...currentProfile,
    values: updatedValues,
    suggested_response_style: style,
    last_updated: new Date().toISOString(),
  };

  await writeToStorage(ctx, 'user_profile_v1', newProfile);
  return newProfile;
}

/**
 * 获取当前画像 (供其他 Skill 使用)
 */
export async function getCurrentProfile(ctx: Context): Promise<UserProfile> {
  return readFromStorage<UserProfile>(ctx, 'user_profile_v1', { ...DEFAULT_PROFILE });
}
