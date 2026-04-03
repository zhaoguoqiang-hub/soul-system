#!/usr/bin/env node

/**
 * User Context Scanner 主执行脚本
 * 
 * 执行模式：
 * 1. --scan-memory        : 扫描记忆文件，提取用户信息
 * 2. --analyze-profile    : 分析当前画像，计算置信度
 * 3. --check-contradictions : 检测画像中的矛盾
 * 4. --update-profile     : 根据新证据更新画像
 * 5. --generate-quiz      : 生成验证Quiz（针对低置信度字段）
 * 6. 无参数              : 执行完整扫描流程
 */

import { parseArgs } from 'node:util';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { format, differenceInDays, parseISO } from 'date-fns';

// 配置路径
const WORKSPACE = process.env.HOME ? join(process.env.HOME, '.openclaw/workspace') : '/tmp/.openclaw/workspace';
const SOUL_DIR = join(WORKSPACE, '.soul');
const MEMORY_DIR = join(WORKSPACE, 'memory');
const PROFILE_PATH = join(SOUL_DIR, 'user-profile.json');
const SCANNER_STATE_PATH = join(SOUL_DIR, 'scanner-state.json');
const SIGNALS_DIR = join(SOUL_DIR, 'signals');
const PENDING_SIGNALS_FILE = join(SIGNALS_DIR, 'pending.jsonl');

function getPendingSignals() {
  if (!existsSync(PENDING_SIGNALS_FILE)) return [];
  try {
    const content = readFileSync(PENDING_SIGNALS_FILE, 'utf-8');
    const lines = content.split('\n').filter(Boolean);
    return lines.map(line => {
      try { return JSON.parse(line); }
      catch { return null; }
    }).filter(s => s && s.status === 'pending');
  } catch { return []; }
}

function updateSignalStatus(signalId, updates) {
  try {
    const lines = readFileSync(PENDING_SIGNALS_FILE, 'utf-8').split('\n').filter(Boolean);
    const signals = lines.map(line => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean);
    const idx = signals.findIndex(s => s.id === signalId);
    if (idx === -1) return;
    signals[idx] = { ...signals[idx], ...updates };
    const output = signals.map(s => JSON.stringify(s)).join('\n') + '\n';
    writeFileSync(PENDING_SIGNALS_FILE, output);
  } catch {}
}

async function consumeSignalsForContext() {
  const signals = getPendingSignals();
  const targetTypes = ['context_update', 'decision', 'question', 'breakthrough', 'frustration', 'feedback'];
  const relevant = signals.filter(s => targetTypes.includes(s.type) && !(s.processedBy || []).includes("user-context-scanner"));
  if (relevant.length === 0) { console.log('[user-context-scanner] 无相关信号'); return { processed: 0 }; }
  console.log('[user-context-scanner] 发现' + relevant.length + '个信号');
  const profile = loadUserProfile();
  if (!profile.profile) profile.profile = {};
  for (var f of ['demographics','profession','habits','preferences','values','emotional_patterns','content_patterns']) { if (!profile.profile[f]) profile.profile[f] = {}; }
  if (!profile.metadata) profile.metadata = { quiz_pending: [] };
  let processed = 0, quizCount = 0;
  for (const signal of relevant) {
    var topic = (signal.payload && (signal.payload.topic || signal.payload.text || signal.payload.event || '')) || '';
    var extractions = extractFromSignal(signal);
    for (var ex of extractions) {
      var fd = (profile.profile[ex.field] && profile.profile[ex.field][ex.subfield]) || {};
      var newConf = updateConf(fd.confidence || 0, ex.confidence, ex.source.includes('direct') ? 'direct' : 'behavior');
      if (!profile.profile[ex.field]) profile.profile[ex.field] = {};
      profile.profile[ex.field][ex.subfield] = { value: ex.value, confidence: newConf, source: ex.source, lastUpdated: new Date().toISOString(), evidence: [...(fd.evidence||[]), ex.matched_pattern].slice(-5) };
      console.log('  [提取] ' + ex.field + '.' + ex.subfield + ' conf=' + newConf.toFixed(2));
      if (newConf < 0.5) {
        var quiz = genQuiz(ex.field, ex.subfield);
        if (quiz && profile.metadata.quiz_pending.indexOf(quiz.payload.field) === -1) {
          await publishQuizSignal(quiz);
          profile.metadata.quiz_pending.push(quiz.payload.field);
          quizCount++;
        }
      }
    }
    if (topic) {
      var key = 'topic:'+topic.slice(0,20);
      if (!profile.profile.preferences[key]) {
        profile.profile.preferences[key] = { interest: signal.type==='decision'?'high':signal.type==='frustration'?'frustrated':'medium', lastSeen: new Date().toISOString(), source: signal.type };
      }
    }
    profile.profile.lastUpdated = new Date().toISOString();
    saveUserProfile(profile);
    updateSignalStatus(signal.id, { status: 'done', processedBy: [...(signal.processedBy || []), 'user-context-scanner'] });
    processed++;
  }
  console.log('[user-context-scanner] 完成: ' + processed + '信号, ' + quizCount + 'quiz');
  return { processed, quizzes: quizCount };
}

// ===== 用户画像提取引擎 (2026-04-03) =====
const EXTRACTION_PATTERNS = [
  { field: 'profession', subfield: 'industry', patterns: ['电力','能源','虚拟电厂','电力交易'], confidence: 0.9 },
  { field: 'profession', subfield: 'title', patterns: ['产品经理','PM'], confidence: 0.9 },
  { field: 'profession', subfield: 'years_experience', patterns: ['12年'], confidence: 0.9 },
  { field: 'profession', subfield: 'current_status', patterns: ['打工','创业'], confidence: 0.9 },
  { field: 'habits', subfield: 'sleep_wake', patterns: ['点起床','点睡觉','点睡','点起'], confidence: 0.8 },
  { field: 'habits', subfield: 'thinking_time', patterns: ['思考时间'], confidence: 0.8 },
  { field: 'habits', subfield: 'exercise_freq', patterns: ['很少运动'], confidence: 0.7 },
  { field: 'preferences', subfield: 'communication_style', patterns: ['先分析','让我定','自己决定'], confidence: 0.9 },
  { field: 'content_patterns', subfield: 'preferred_topics', patterns: ['头条','OpenClaw','视频'], confidence: 0.8 },
  { field: 'content_patterns', subfield: 'content_angle', patterns: ['不受欢迎','不火'], confidence: 0.8 },
  { field: 'content_patterns', subfield: 'posting_frequency', patterns: ['一天','一篇'], confidence: 0.7 },
  { field: 'demographics', subfield: 'family', patterns: ['老婆','兜兜','露露','儿子','女儿'], confidence: 0.9 },
];
const QUIZ_TEMPLATE = {
  'emotional_patterns_triggers': { q: '你什么时候会感到特别有压力？', o: ['deadline紧','沟通没进展','系统故障','其他'], w: '不了解你的情绪触发点' },
  'emotional_patterns_recovery_style': { q: '遇到挫折时通常怎么恢复？', o: ['睡一觉','找人聊聊','换事情做','硬扛'], w: '了解恢复方式可更好安排主动触发' },
  'habits_exercise_freq': { q: '最近一次运动是什么时候？', o: ['这周','上个月','很久没','经常运动'], w: '你说很少运动需督促' },
};
function updateConf(existing, newC, source) {
  if (source === 'direct') return Math.min(0.9, Math.max(existing, newC));
  if (source === 'behavior') return existing > 0.3 ? Math.min(0.7, existing + 0.15) : 0.4;
  return existing;
}
function genQuiz(field, subfield) {
  var key = field + '_' + subfield;
  var t = QUIZ_TEMPLATE[key];
  if (!t) return null;
  return { id: 'quiz_' + Date.now(), type: 'quiz_generated', source: 'user-context-scanner', priority: 'low', status: 'pending', createdAt: new Date().toISOString(), payload: { field: key, question: t.q, options: t.o, context: t.w, confidence: 0.2 } };
}
async function publishQuizSignal(quiz) {
  try {
    var signals = [];
    if (existsSync(PENDING_SIGNALS_FILE)) {
      var lines = readFileSync(PENDING_SIGNALS_FILE, 'utf-8').split('\n').filter(Boolean);
      for (var l of lines) { try { signals.push(JSON.parse(l)); } catch {} }
    }
    signals.push(quiz);
    writeFileSync(PENDING_SIGNALS_FILE, signals.map(function(s){return JSON.stringify(s);}).join('\n') + '\n');
    console.log('[quiz] 已发布: ' + quiz.payload.question.slice(0,20));
  } catch(e) { console.error('[quiz] 失败:', e.message); }
}
function extractFromSignal(signal) {
  var results = [];
  var text = (signal.payload && (signal.payload.topic || signal.payload.text || signal.payload.event || '')) + '';
  if (!text) return results;
  for (var p of EXTRACTION_PATTERNS) {
    var matched = p.patterns.some(function(pp){ return text.toLowerCase().includes(pp.toLowerCase()); });
    if (matched) {
      results.push({ field: p.field, subfield: p.subfield, value: text.slice(0,80), confidence: p.confidence, source: 'signal:' + signal.type, matched_pattern: p.patterns.find(function(pp){ return text.toLowerCase().includes(pp.toLowerCase()); }) });
    }
  }
  return results;
}
// 默认配置
const DEFAULT_CONFIG = {
  scanIntervalHours: 24,
  minConfidenceForUse: 0.7,
  minEvidenceCount: 2,
  contradictionThreshold: 0.3,
  maxProfileAgeDays: 90,
  
  // 扫描参数
  scanMemoryFiles: true,
  scanRecentDays: 30,
  includeNarrative: true,
  
  // 分析参数
  analyzeHabits: true,
  analyzeValues: true,
  analyzePreferences: true,
  
  // 信号参数
  publishPatternSignals: true,
  publishContradictionSignals: true,
  publishProfileUpdateSignals: true,
  
  // Quiz参数
  generateQuizzes: true,
  maxQuizzesPerSession: 3,
  quizConfidenceThreshold: 0.5
};

// 确保目录存在
function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

// 加载配置
function loadConfig() {
  const configPath = join(SOUL_DIR, 'scanner-config.json');
  
  if (!existsSync(configPath)) {
    saveConfig(DEFAULT_CONFIG);
    return { ...DEFAULT_CONFIG };
  }
  
  try {
    const userConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
    return { ...DEFAULT_CONFIG, ...userConfig };
  } catch (error) {
    console.error('加载配置失败，使用默认配置:', error.message);
    return { ...DEFAULT_CONFIG };
  }
}

// 保存配置
function saveConfig(config) {
  ensureDir(SOUL_DIR);
  const configPath = join(SOUL_DIR, 'scanner-config.json');
  writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

// 加载状态
function loadState() {
  if (!existsSync(SCANNER_STATE_PATH)) {
    return {
      lastScanTime: null,
      scansToday: 0,
      profilesAnalyzed: 0,
      contradictionsFound: 0,
      quizzesGenerated: 0,
      lastProfileUpdate: null,
      scannedFiles: {},
      config: loadConfig()
    };
  }
  
  try {
    const state = JSON.parse(readFileSync(SCANNER_STATE_PATH, 'utf-8'));
    state.config = loadConfig();
    return state;
  } catch (error) {
    console.error('加载状态文件失败:', error.message);
    return {
      lastScanTime: null,
      scansToday: 0,
      profilesAnalyzed: 0,
      contradictionsFound: 0,
      quizzesGenerated: 0,
      lastProfileUpdate: null,
      scannedFiles: {},
      config: loadConfig()
    };
  }
}

// 保存状态
function saveState(state) {
  ensureDir(SOUL_DIR);
  writeFileSync(SCANNER_STATE_PATH, JSON.stringify(state, null, 2), 'utf-8');
}

// 加载用户画像
function loadUserProfile() {
  if (!existsSync(PROFILE_PATH)) {
    // 创建初始画像
    const initialProfile = {
      profile_id: 'user_001',
      version: '1.0',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile: {
        demographics: {},
        profession: {},
        values: {},
        habits: {},
        preferences: {}
      },
      metadata: {
        confidence_summary: {},
        contradictions: [],
        quiz_pending: [],
        update_history: []
      }
    };
    
    ensureDir(SOUL_DIR);
    writeFileSync(PROFILE_PATH, JSON.stringify(initialProfile, null, 2), 'utf-8');
    console.log('创建初始用户画像:', PROFILE_PATH);
    return initialProfile;
  }
  
  try {
    return JSON.parse(readFileSync(PROFILE_PATH, 'utf-8'));
  } catch (error) {
    console.error('加载用户画像失败:', error.message);
    return null;
  }
}

// 保存用户画像
function saveUserProfile(profile) {
  profile.updated_at = new Date().toISOString();
  writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2), 'utf-8');
}

// 扫描记忆文件
function scanMemoryFiles(state) {
  const config = state.config;
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - config.scanRecentDays * 24 * 60 * 60 * 1000);
  
  if (!existsSync(MEMORY_DIR)) {
    console.log('记忆目录不存在:', MEMORY_DIR);
    return { filesScanned: 0, newEvidence: 0 };
  }
  
  const files = readdirSync(MEMORY_DIR)
    .filter(file => file.endsWith('.md'))
    .sort()
    .reverse();
  
  let filesScanned = 0;
  let newEvidence = 0;
  
  for (const file of files) {
    const filePath = join(MEMORY_DIR, file);
    const fileStat = existsSync(filePath) ? statSync(filePath) : null;
    
    // 检查是否已扫描过
    const lastScanned = state.scannedFiles[file];
    if (lastScanned && fileStat && fileStat.mtime <= new Date(lastScanned)) {
      continue; // 文件未修改，跳过
    }
    
    // 检查文件日期
    const fileDate = extractDateFromFilename(file);
    if (fileDate && fileDate < cutoffDate && !config.scanAllHistory) {
      continue; // 超过扫描时间范围
    }
    
    try {
      const content = readFileSync(filePath, 'utf-8');
      const evidence = extractEvidenceFromContent(content, file);
      
      if (evidence.length > 0) {
        newEvidence += evidence.length;
        console.log(`从 ${file} 提取 ${evidence.length} 条证据`);
        
        // 处理证据（实际实现中会更新画像）
        // processEvidence(evidence, profile);
      }
      
      // 更新扫描记录
      state.scannedFiles[file] = now.toISOString();
      filesScanned++;
      
    } catch (error) {
      console.error(`扫描文件 ${file} 失败:`, error.message);
    }
  }
  
  return { filesScanned, newEvidence };
}

// 从文件名提取日期
function extractDateFromFilename(filename) {
  const match = filename.match(/(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return parseISO(match[1]);
  }
  return null;
}

// 从内容提取证据（简化实现）
function extractEvidenceFromContent(content, sourceFile) {
  const evidence = [];
  const lines = content.split('\n');
  
  // 简单关键词匹配（实际实现需要更复杂的NLP）
  const patterns = [
    { pattern: /我(?:今年|已经|现在)(\d+)岁/, category: 'demographics', field: 'age' },
    { pattern: /我是(\S+)/, category: 'profession', field: 'current_role' },
    { pattern: /我喜欢(\S+)/, category: 'preferences', field: 'likes' },
    { pattern: /我习惯(\S+)/, category: 'habits', field: 'habits' },
    { pattern: /我认为(\S+)/, category: 'values', field: 'beliefs' },
    { pattern: /我讨厌(\S+)/, category: 'preferences', field: 'dislikes' },
    { pattern: /我需要(\S+)/, category: 'preferences', field: 'needs' },
    { pattern: /我目标[是|是](\S+)/, category: 'values', field: 'goals' }
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length < 5) continue;
    
    for (const { pattern, category, field } of patterns) {
      const match = line.match(pattern);
      if (match) {
        evidence.push({
          source: 'memory_file',
          source_file: sourceFile,
          category,
          field,
          value: match[1],
          excerpt: line.substring(0, 100),
          timestamp: extractDateFromFilename(sourceFile)?.toISOString() || new Date().toISOString(),
          confidence: 0.7 // 基础置信度
        });
      }
    }
  }
  
  return evidence;
}

// 分析画像置信度
function analyzeProfileConfidence(profile) {
  const categories = ['demographics', 'profession', 'values', 'habits', 'preferences'];
  const summary = {};
  
  for (const category of categories) {
    const fields = profile.profile[category];
    if (!fields || Object.keys(fields).length === 0) {
      summary[category] = { confidence: 0, fields: 0 };
      continue;
    }
    
    let totalConfidence = 0;
    let fieldCount = 0;
    
    for (const [field, data] of Object.entries(fields)) {
      if (data && typeof data.confidence === 'number') {
        totalConfidence += data.confidence;
        fieldCount++;
      }
    }
    
    summary[category] = {
      confidence: fieldCount > 0 ? totalConfidence / fieldCount : 0,
      fields: fieldCount
    };
  }
  
  // 总体置信度
  const validCategories = Object.values(summary).filter(s => s.fields > 0);
  const overallConfidence = validCategories.length > 0 
    ? validCategories.reduce((sum, s) => sum + s.confidence, 0) / validCategories.length
    : 0;
  
  return { summary, overall: overallConfidence };
}

// 检测矛盾
function detectContradictions(profile, evidenceList) {
  const contradictions = [];
  
  // 简单矛盾检测（实际实现需要更复杂的逻辑）
  // 这里只是示例：检测同一字段的不同值
  const fieldValues = {};
  
  for (const evidence of evidenceList) {
    const key = `${evidence.category}.${evidence.field}`;
    if (!fieldValues[key]) {
      fieldValues[key] = [];
    }
    fieldValues[key].push(evidence);
  }
  
  for (const [key, evidences] of Object.entries(fieldValues)) {
    if (evidences.length < 2) continue;
    
    // 检查值是否一致
    const uniqueValues = new Set(evidences.map(e => e.value));
    if (uniqueValues.size > 1) {
      contradictions.push({
        field: key,
        values: Array.from(uniqueValues),
        evidences: evidences.map(e => ({
          source: e.source_file,
          value: e.value,
          timestamp: e.timestamp,
          confidence: e.confidence
        })),
        severity: 'medium',
        detected_at: new Date().toISOString()
      });
    }
  }
  
  return contradictions;
}

// 生成Quiz（针对低置信度字段）
function generateQuizzes(profile, contradictions) {
  const quizzes = [];
  const config = loadConfig();
  
  // 基于低置信度字段生成Quiz
  const categories = ['demographics', 'profession', 'values', 'habits', 'preferences'];
  
  for (const category of categories) {
    const fields = profile.profile[category];
    if (!fields) continue;
    
    for (const [field, data] of Object.entries(fields)) {
      if (data && data.confidence < config.quizConfidenceThreshold) {
        quizzes.push({
          type: 'confidence_verification',
          field: `${category}.${field}`,
          current_value: data.value,
          current_confidence: data.confidence,
          question: `关于您的${field}，当前记录为"${data.value}"，这个信息准确吗？`,
          options: ['完全准确', '基本准确但需调整', '不太准确', '完全不准确'],
          priority: 'medium'
        });
      }
    }
  }
  
  // 基于矛盾生成Quiz
  for (const contradiction of contradictions.slice(0, 2)) {
    quizzes.push({
      type: 'contradiction_resolution',
      field: contradiction.field,
      conflicting_values: contradiction.values,
      question: `我发现关于${contradiction.field}有不同的记录，能帮我确认一下哪个是正确的吗？`,
      options: contradiction.values.map((v, i) => `选项${i+1}: ${v}`),
      priority: 'high'
    });
  }
  
  return quizzes.slice(0, config.maxQuizzesPerSession);
}

// 发布信号
async function publishSignal(type, payload, priority = 'medium') {
  // 使用文件系统信号管理器（复用proactive-trigger的）
  try {
    const signalManager = await import('./utils/signal-manager.js');
    return signalManager.publishSignal('user-context-scanner', type, payload, priority);
  } catch (error) {
    console.log(`[信号模拟] ${type}:`, payload);
    return `simulated_${Date.now()}`;
  }
}

// 执行完整扫描流程
async function runFullScan() {
  console.log('=== 用户画像扫描开始 ===\n');
  
  const state = loadState();
  const profile = loadUserProfile();
  
  if (!profile) {
    console.error('无法加载用户画像，扫描终止');
    return false;
  }
  
  // 1. 扫描记忆文件
  console.log('1. 扫描记忆文件...');
  const scanResult = scanMemoryFiles(state);
  console.log(`   扫描${scanResult.filesScanned}个文件，发现${scanResult.newEvidence}条新证据`);
  
  // 2. 分析画像置信度
  console.log('\n2. 分析画像置信度...');
  const confidenceAnalysis = analyzeProfileConfidence(profile);
  console.log(`   总体置信度: ${confidenceAnalysis.overall.toFixed(2)}`);
  
  for (const [category, data] of Object.entries(confidenceAnalysis.summary)) {
    if (data.fields > 0) {
      console.log(`   ${category}: ${data.confidence.toFixed(2)} (${data.fields}个字段)`);
    }
  }
  
  // 3. 检测矛盾
  console.log('\n3. 检测矛盾...');
  const contradictions = detectContradictions(profile, []);
  console.log(`   发现${contradictions.length}个矛盾`);
  
  // 4. 生成Quiz
  console.log('\n4. 生成验证Quiz...');
  const quizzes = generateQuizzes(profile, contradictions);
  console.log(`   生成${quizzes.length}个Quiz`);
  
  if (quizzes.length > 0) {
    for (const quiz of quizzes) {
      console.log(`   - ${quiz.question}`);
    }
  }
  
  // 5. 发布信号
  console.log('\n5. 发布信号...');
  if (scanResult.newEvidence > 0) {
    await publishSignal('new_evidence_found', {
      count: scanResult.newEvidence,
      categories: Object.keys(scanResult.newEvidenceByCategory || {})
    }, 'low');
  }
  
  if (contradictions.length > 0) {
    await publishSignal('contradiction_detected', {
      count: contradictions.length,
      fields: contradictions.map(c => c.field)
    }, 'medium');
  }
  
  if (quizzes.length > 0) {
    await publishSignal('quiz_generated', {
      count: quizzes.length,
      types: [...new Set(quizzes.map(q => q.type))]
    }, 'low');
  }
  
  // 6. 更新状态
  state.lastScanTime = new Date().toISOString();
  state.scansToday += 1;
  state.profilesAnalyzed += 1;
  state.contradictionsFound += contradictions.length;
  state.quizzesGenerated += quizzes.length;
  
  saveState(state);
  
  console.log('\n=== 扫描完成 ===');
  console.log(`下次扫描建议: ${new Date(Date.now() + state.config.scanIntervalHours * 60 * 60 * 1000).toLocaleString()}`);
  
  return true;
}

// 主函数
async function main() {
  const args = parseArgs({
    options: {
      'scan-memory': { type: 'boolean' },
      'analyze-profile': { type: 'boolean' },
      'check-contradictions': { type: 'boolean' },
      'update-profile': { type: 'boolean' },
      'generate-quiz': { type: 'boolean' },
      'consume-signals': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' }
    },
    allowPositionals: true
  });
  
  const { values, positionals } = args;
  
  if (values.help) {
    console.log(`
User Context Scanner 脚本
用法:
  node scanner.js [选项]

选项:
  --scan-memory        扫描记忆文件，提取用户信息
  --analyze-profile    分析当前画像，计算置信度
  --check-contradictions 检测画像中的矛盾
  --update-profile     根据新证据更新画像
  --generate-quiz      生成验证Quiz（针对低置信度字段）
  --consume-signals    从信号队列消费上下文相关信号
  -h, --help           显示此帮助信息

示例:
  node scanner.js --scan-memory
  node scanner.js --analyze-profile
  node scanner.js --check-contradictions
    `);
    return;
  }
  
  if (values['scan-memory']) {
    const state = loadState();
    const result = scanMemoryFiles(state);
    console.log(`扫描完成: ${result.filesScanned}个文件，${result.newEvidence}条新证据`);
    
    // 更新状态
    state.lastScanTime = new Date().toISOString();
    state.scansToday += 1;
    saveState(state);
    
  } else if (values['analyze-profile']) {
    const profile = loadUserProfile();
    if (!profile) {
      console.error('无法加载用户画像');
      return;
    }
    
    const analysis = analyzeProfileConfidence(profile);
    console.log('画像置信度分析:');
    console.log(`总体置信度: ${analysis.overall.toFixed(2)}`);
    
    for (const [category, data] of Object.entries(analysis.summary)) {
      if (data.fields > 0) {
        console.log(`${category}: ${data.confidence.toFixed(2)} (${data.fields}个字段)`);
      }
    }
    
  } else if (values['check-contradictions']) {
    const profile = loadUserProfile();
    const contradictions = detectContradictions(profile, []);
    
    console.log(`发现 ${contradictions.length} 个矛盾:`);
    for (const contradiction of contradictions) {
      console.log(`- ${contradiction.field}: ${contradiction.values.join(' vs ')}`);
    }
    
  } else if (values['consume-signals']) {
    await consumeSignalsForContext();
    
  } else if (values['update-profile']) {
    console.log('更新画像功能（待实现）');
    
  } else if (values['generate-quiz']) {
    const profile = loadUserProfile();
    const quizzes = generateQuizzes(profile, []);
    
    console.log(`生成 ${quizzes.length} 个Quiz:`);
    for (const quiz of quizzes) {
      console.log(`\n[${quiz.type}] ${quiz.field}`);
      console.log(`问题: ${quiz.question}`);
      console.log(`选项: ${quiz.options.join(', ')}`);
    }
    
  } else {
    // 默认执行完整扫描
    await runFullScan();
  }
}

// 执行主函数
main().catch(error => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});