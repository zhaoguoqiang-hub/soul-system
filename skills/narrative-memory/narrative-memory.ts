// skills/narrative-memory/narrative-memory.ts

import { Goal } from '../packages/proactive-engine/types/soul-types';
import { readFromStorage, writeToStorage } from '../packages/proactive-engine/src/utils/storage';
import { Context } from '../packages/proactive-engine/types/openclaw-stub';

export interface MemoryFragment {
  id: string;
  timestamp: number;
  type: 'fact' | 'event' | 'preference' | 'emotion';
  content: string;
  tags: string[];
  relatedGoalId?: string;
}

interface MemoryStore {
  fragments: MemoryFragment[];
  lastSummary: string;
  summaryUpdatedAt: number;
}

const MAX_FRAGMENTS = 100; // 内存中保留的最大片段数

/**
 * 模拟 NLP 提取逻辑
 * 在实际生产中，这里会调用 LLM API 进行实体抽取和情感分析
 */
function extractInsights(text: string, contextGoals: Goal[]): MemoryFragment[] {
  const fragments: MemoryFragment[] = [];
  const now = Date.now();
  const idPrefix = `mem_${now}`;

  // 规则 1: 偏好提取 (包含 "喜欢", "讨厌", "想要")
  if (/(喜欢|讨厌|想要|希望|不喜欢)/.test(text)) {
    fragments.push({
      id: `${idPrefix}_pref`,
      timestamp: now,
      type: 'preference',
      content: text,
      tags: ['preference', 'user-input']
    });
  }

  // 规则 2: 事件提取 (包含 "完成了", "去了", "做了")
  if (/(完成了|做到了|去了|参加了| finished)/.test(text)) {
    // 尝试关联目标
    let relatedId: string | undefined;
    for (const goal of contextGoals) {
      if (text.includes(goal.name)) {
        relatedId = goal.id;
        break;
      }
    }
    
    fragments.push({
      id: `${idPrefix}_evt`,
      timestamp: now,
      type: 'event',
      content: text,
      tags: ['achievement', 'activity'],
      relatedGoalId: relatedId
    });
  }

  // 规则 3: 情感提取 (包含 "开心", "难过", "累", "兴奋")
  if (/(开心|难过|累|压力|兴奋|焦虑)/.test(text)) {
    fragments.push({
      id: `${idPrefix}_emo`,
      timestamp: now,
      type: 'emotion',
      content: text,
      tags: ['emotion', 'mood']
    });
  }

  return fragments;
}

/**
 * 处理新消息，更新记忆库
 */
export async function processNewMemory(
  ctx: Context,
  userInput: string,
  aiResponse?: string
): Promise<MemoryFragment[]> {
  
  // 1. 获取当前活跃目标 (用于关联记忆)
  // 假设存储键为 'soul_goals'
  const allGoals = await readFromStorage<Goal[]>(ctx, 'goals', []);
  const activeGoals = allGoals.filter(g => g.status === 'active');

  // 2. 提取洞察
  const newFragments = extractInsights(userInput, activeGoals);
  
  // 如果有 AI 回复，也可以记录交互结果 (可选)
  if (aiResponse && aiResponse.length > 20) {
     // 简单记录长回复作为上下文参考，不标记为重要记忆
     // 实际逻辑可更复杂
  }

  if (newFragments.length === 0) {
    return [];
  }

  // 3. 读取现有记忆
  const store = await readFromStorage<MemoryStore>(ctx, 'narrative_memory', {
    fragments: [],
    lastSummary: '',
    summaryUpdatedAt: 0
  });

  // 4. 合并并截断 (先进先出)
  const updatedFragments = [...newFragments, ...store.fragments].slice(0, MAX_FRAGMENTS);

  // 5. 保存
  await writeToStorage(ctx, 'narrative_memory', {
    ...store,
    fragments: updatedFragments,
    // 这里可以添加逻辑：如果片段够多了，触发一次 "LLM 总结" 更新 lastSummary
  });

  console.log(`[NarrativeMemory] Added ${newFragments.length} new fragments.`);
  return newFragments;
}

/**
 * 获取最近的历史记忆 (用于构建 Prompt 上下文)
 */
export async function getRecentMemories(ctx: Context, limit: number = 10): Promise<MemoryFragment[]> {
  const store = await readFromStorage<MemoryStore>(ctx, 'narrative_memory', { fragments: [], lastSummary: '', summaryUpdatedAt: 0 });
  return store.fragments.slice(0, limit);
}