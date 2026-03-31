// type stub for OpenClaw runtime-provided packages
// These modules are injected by the OpenClaw host at runtime, not available via npm

export interface IStorage {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface IConfig {
  get(): Promise<Record<string, unknown>>;
}

export interface Context {
  storage: IStorage;
  config: IConfig;
  send(payload: unknown): Promise<void>;
}

export interface PluginContext {
  storage: IStorage;
  config: IConfig;
}

export interface MessagePayload {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
}

export interface SkillDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  onEnable?(ctx: Context): Promise<void> | void;
  onDisable?(ctx: Context): Promise<void> | void;
  onMessage?(ctx: Context, payload: MessagePayload): Promise<void> | void;
  onBeforeSend?(ctx: Context, payload: MessagePayload): Promise<MessagePayload | null>;
}
