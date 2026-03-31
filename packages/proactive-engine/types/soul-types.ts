/**
 * Soul System 全局类型定义
 * 所有模块共享的接口定义
 */

// ============== Goal 相关 ==============
export type GoalCategory = 'understanding' | 'proactive' | 'context' | 'growth';
export type GoalStatus = 'active' | 'paused' | 'completed';

export interface Goal {
  id: string;
  name: string;
  description: string;
  priority: number;   // 1-10
  progress: number;     // 0-100
  enabled: boolean;
  status: GoalStatus;
  lastUpdated: string;
  createdAt: string;
  category: GoalCategory;
  tags?: string[];
  conflictWith?: string[];
  conflictReason?: string;
}

export interface GoalUpdate {
  goalId: string;
  delta: number;
  reason?: string;
}

// ============== Trigger 相关 ==============
export type TriggerType = 'goal_based' | 'reflection_based' | 'time_habit' | 'trust_based';

export interface TriggerChecks {
  focusMode: { active: boolean; skipped: boolean };
  trustScore: { score: number; level: string; minIntervalMinutes: number | null };
  goalBased: { triggered: boolean; reason: string };
  timeHabitBased: { triggered: boolean; reason: string };
  reflectionBased: { triggered: boolean; reason: string };
}

export interface ProactiveSuggestion {
  version: string;
  timestamp: string;
  triggered: boolean;
  confidence: number;
  reason: string;
  suggestion: string | null;
  message_to_user: string | null;
}

export interface TriggerStats {
  total_triggers: number;
  accepted_triggers: number;
  rejected_triggers: number;
  last_trigger_at: string | null;
  by_type: Record<string, number>;
}

// ============== Memory 相关 ==============
export type NarrativeCategory = 'interaction' | 'milestone' | 'preference' | 'reflection';

export interface NarrativeEntry {
  id: string;
  timestamp: string;
  event: string;
  category: NarrativeCategory;
  importance: number;  // 0-1
  tags: string[];
  metadata?: Record<string, unknown>;
}

// ============== Reflection 相关 ==============
export type ReflectionType = 'shallow' | 'deep';
export type InsightType = 'stagnation_warning' | 'momentum_positive' | 'pattern_detected' | 'self_critique';

export interface Insight {
  type: InsightType;
  content: string;
  relatedGoalId?: string;
}

export interface GoalAdjustment {
  goalId: string;
  type: 'reduce_scope' | 'increase_effort' | 'reassess' | 'celebrate';
  suggestion: string;
  confidence: number;
}

export interface ReflectionSession {
  id: string;
  timestamp: number;
  triggeredBy: string;
  analyzedGoals: string[];
  insights: Insight[];
  adjustments: GoalAdjustment[];
  summary: string;
}

export interface Reflection {
  id: string;
  timestamp: string;
  type: ReflectionType;
  content: string;
  insights: string[];  // 必须全是字符串，禁止JSON序列化腐化
  goals_updated: Array<{ goalId: string; delta: number }>;
}

// ============== User Profile 相关 ==============
export type Mood = 'happy' | 'neutral' | 'tired' | 'frustrated' | 'angry' | 'anxious' | 'busy' | 'command';
export type ResponseStyle = 'normal' | 'brief' | 'warm' | 'reassuring' | 'careful';

export interface PersonalityMetrics {
  humor: number;           // 0-1
  honesty: number;          // 0-1
  professionalism: number;   // 0-1
  proactivity: number;      // 0-1
  directness: number;       // 0-1
}

export interface UserProfile {
  current_mood: Mood;
  mood_confidence: number;
  suggested_response_style: ResponseStyle;
  emotion_history: Array<{ mood: Mood; confidence: number; timestamp: string }>;
  preferences: Array<{ content: string; context: string; confidence: number }>;
  habits: string[];
  values: string[];
  personality: PersonalityMetrics;
  last_updated: string;
}

export interface ValueTag {
  tag: string;
  weight: number;
  context: string;
  conflicting?: boolean;
}

export interface HabitPattern {
  name: string;
  pattern: string;
  confidence: number;
}

// ============== Mood/Energy 相关 ==============
export interface MoodConfig {
  timezone: string;
  energy_curve: Record<number, number>;  // hour -> coefficient (0-1)
  work_hours: { start: number; end: number };
  rest_hours: { start: number; end: number };
}

export interface MoodResult {
  coefficient: number;           // 0.0 - 1.0
  suggestedStyle: 'full' | 'normal' | 'brief' | 'minimal';
  tone: 'normal' | 'restrained';
  period: string;                 // "morning_peak" | "afternoon_slump" | etc.
}

// ============== Plugin 相关 ==============
export interface PluginConfig {
  soulDir: string;
}

// ============== Value Guard 相关 ==============
export type ConflictLevel = 'none' | 'soft' | 'hard';
export type ConflictType = 'direct_opposition' | 'resource_competition' | 'value_mismatch';

export interface GuardResult {
  conflict: boolean;
  level: ConflictLevel;
  reason: string;
  suggestion: string | null;  // 柔性提醒话术
}

// ============== Storage 相关 ==============
export interface IStorage {
  read<T>(filename: string, defaultValue: T): T;
  write<T>(filename: string, data: T): boolean;
  exists(filename: string): boolean;
}

// ============== Storage Key 常量 ==============
export const SoulStorageKey = {
  GOALS: 'goals',
  USER_PROFILE: 'user_profile_v1',
  NARRATIVE_TIMELINE: 'narrative_timeline',
  REFLECTIONS_LOG: 'reflections_log',
  PENDING_PROACTIVE_MSG: 'pending_proactive_msg',
  REQUEST_REFLECTION: 'request_reflection',
  FOCUS_MODE: 'focus_mode',
  TRUST_SCORE: 'trust_score',
  MOOD_CONFIG: 'mood_config',
  ATTENTION_BUDGET_HOUR: 'attention_budget_hour',
  LAST_BUDGET_RESET: 'last_budget_reset',
  LAST_USER_INTERACTION_TIME: 'last_user_interaction_time',
} as const;
