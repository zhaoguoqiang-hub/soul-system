// skills/mood-simulator/mood-engine.ts

import { Goal } from '../packages/proactive-engine/types/soul-types';
import { readFromStorage, writeToStorage } from '../packages/proactive-engine/src/utils/storage';
import { Context } from '../packages/proactive-engine/types/openclaw-stub';
import { config } from '../packages/proactive-engine/src/config';

/**
 * 情绪维度定义
 * Valence (愉悦度): -10 (极度沮丧) ~ 10 (极度开心)
 * Arousal (激活度): 0 (平静/疲惫) ~ 10 (兴奋/焦虑)
 */
export interface MoodState {
  valence: number;      // 心情好坏
  arousal: number;      // 能量高低
  currentLabel: string; // 当前情绪标签 (e.g., 'cheerful', 'concerned', 'calm')
  lastUpdated: number;
  decayTimer: number;   // 上次自然衰减的时间戳
}

export const DEFAULT_MOOD: MoodState = {
  valence: config.mood.baselineValence,
  arousal: config.mood.baselineArousal,
  currentLabel: 'calm',
  lastUpdated: Date.now(),
  decayTimer: Date.now()
};

// 情绪标签映射表 (用于生成 Prompt 提示词)
const MOOD_LABELS: Array<{ minV: number; minA: number; label: string; promptHint: string }> = [
  { minV: 5, minA: 6, label: 'enthusiastic', promptHint: '热情、充满活力、使用感叹号、鼓励用户' },
  { minV: 5, minA: 0, label: 'content', promptHint: '温和、满意、平和、肯定用户' },
  { minV: 0, minA: 6, label: 'anxious', promptHint: '略显焦急、语速快、关切、频繁询问进展' },
  { minV: 0, minA: 0, label: 'calm', promptHint: '理性、客观、平稳、中立' },
  { minV: -5, minA: 6, label: 'frustrated', promptHint: '严肃、直接、指出问题、带有轻微的失望但想帮忙' },
  { minV: -5, minA: 0, label: 'melancholic', promptHint: '低沉、温柔、安慰、避免过度刺激' },
];

/**
 * 计算自然衰减 (时间越久，情绪越回归基准线)
 */
function applyDecay(state: MoodState): MoodState {
  const now = Date.now();
  const hoursPassed = (now - state.decayTimer) / (1000 * 60 * 60);
  
  if (hoursPassed < config.mood.decayThresholdHours) return state;

  const { baselineValence: targetV, baselineArousal: targetA, decayFactorPerHour } = config.mood;
  const decayFactor = Math.min(hoursPassed * decayFactorPerHour, 1);

  const newValence = state.valence + (targetV - state.valence) * decayFactor;
  const newArousal = state.arousal + (targetA - state.arousal) * decayFactor;

  return {
    ...state,
    valence: parseFloat(newValence.toFixed(2)),
    arousal: parseFloat(newArousal.toFixed(2)),
    decayTimer: now
  };
}

/**
 * 根据事件更新情绪
 */
export async function updateMoodByEvent(
  ctx: Context,
  eventType: 'goal_completed' | 'goal_stalled' | 'user_positive' | 'user_negative' | 'time_passing',
  intensity: number = 1.0 // 影响强度 0.1 ~ 2.0
): Promise<MoodState> {
  
  // 1. 读取当前状态
  let state = await readFromStorage<MoodState>(ctx, 'mood_state', DEFAULT_MOOD);
  
  // 2. 应用衰减
  state = applyDecay(state);

  // 3. 根据事件调整数值
  switch (eventType) {
    case 'goal_completed':
      state.valence += 3 * intensity;
      state.arousal += 2 * intensity;
      break;
    case 'goal_stalled':
      state.valence -= 2 * intensity;
      state.arousal += 1 * intensity; // 停滞通常带来焦虑
      break;
    case 'user_positive':
      state.valence += 1.5 * intensity;
      state.arousal += 0.5 * intensity;
      break;
    case 'user_negative':
      state.valence -= 2 * intensity;
      state.arousal -= 1 * intensity; // 负面通常导致低落
      break;
    case 'time_passing':
      // 仅触发衰减，已在上面处理
      break;
  }

  // 4. 限制范围 (-10 ~ 10)
  state.valence = Math.max(-10, Math.min(10, state.valence));
  state.arousal = Math.max(0, Math.min(10, state.arousal));

  // 5. 确定当前标签
  state.currentLabel = determineLabel(state.valence, state.arousal);
  state.lastUpdated = Date.now();

  // 6. 保存
  await writeToStorage(ctx, 'mood_state', state);
  
  console.log(`[MoodEngine] Updated mood: ${state.currentLabel} (V:${state.valence}, A:${state.arousal})`);
  return state;
}

/**
 * 辅助函数：匹配情绪标签（使用欧几里得距离找最近的）
 */
function determineLabel(v: number, a: number): string {
  let best: { label: string; promptHint: string; distance: number } | null = null;

  for (const m of MOOD_LABELS) {
    // 计算到每个标签中心点的距离
    const d = Math.sqrt((v - m.minV) ** 2 + (a - m.minA) ** 2);
    if (!best || d < best.distance) {
      best = { label: m.label, promptHint: m.promptHint, distance: d };
    }
  }

  return best?.label ?? 'calm';
}

/**
 * 获取当前情绪对 Prompt 的注入文本
 */
export function getMoodPromptInstruction(state: MoodState): string {
  const entry = MOOD_LABELS.find(m => m.label === state.currentLabel);
  if (!entry) return '';
  return `[情绪指令] 当前AI情绪状态：${entry.label}。请表现出：${entry.promptHint}`;
}

/**
 * 扫描目标状态，更新情绪（目标停滞 → 焦虑；目标即将完成 → 积极）
 */
export async function scanGoalsForMood(ctx: Context, goals: Goal[]): Promise<void> {
  const now = Date.now();

  for (const goal of goals) {
    if (goal.status !== 'active') continue;

    const daysIdle = (now - new Date(goal.lastUpdated).getTime()) / (1000 * 60 * 60 * 24);

    // 目标停滞超过 5 天
    if (daysIdle > 5 && goal.progress < 50) {
      await updateMoodByEvent(ctx, 'goal_stalled', 0.5);
      return;
    }

    // 目标即将完成
    if (goal.progress >= 80 && goal.progress < 100) {
      await updateMoodByEvent(ctx, 'goal_completed', 0.3);
      return;
    }
  }
}
