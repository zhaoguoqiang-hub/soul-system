// utils/storage.ts

import { Context } from '../types/openclaw-stub';

/**
 * 通用存储键名前缀，避免冲突
 */
const PREFIX = 'soul_';

/**
 * 从存储中读取数据
 * @param ctx OpenClaw 上下文
 * @param key 键名 (会自动添加前缀)
 * @param defaultValue 如果不存在则返回的默认值
 */
export async function readFromStorage<T>(
  ctx: Context, 
  key: string, 
  defaultValue: T
): Promise<T> {
  const fullKey = `${PREFIX}${key}`;
  try {
    const raw = await ctx.storage.get(fullKey);
    if (raw === undefined || raw === null) {
      return defaultValue;
    }
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw) as T;
      } catch {
        return defaultValue;
      }
    }
    return raw as T;
  } catch (error) {
    console.error(`[Storage] Read error for ${fullKey}:`, error);
    return defaultValue;
  }
}

/**
 * 向存储中写入数据
 * @param ctx OpenClaw 上下文
 * @param key 键名
 * @param value 要存储的值 (会自动序列化为 JSON)
 */
export async function writeToStorage<T>(
  ctx: Context, 
  key: string, 
  value: T
): Promise<void> {
  const fullKey = `${PREFIX}${key}`;
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await ctx.storage.set(fullKey, serialized);
  } catch (error) {
    console.error(`[Storage] Write error for ${fullKey}:`, error);
    throw error;
  }
}

/**
 * 删除存储数据
 */
export async function deleteFromStorage(ctx: Context, key: string): Promise<void> {
  const fullKey = `${PREFIX}${key}`;
  await ctx.storage.delete(fullKey);
}