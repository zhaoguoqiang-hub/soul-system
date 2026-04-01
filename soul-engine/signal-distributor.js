#!/usr/bin/env node

/**
 * 信号分发器
 * 读取intents.json和pending信号，将信号分发给相应的skill
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const WORKSPACE = process.env.HOME ? join(process.env.HOME, '.openclaw/workspace') : '/tmp/.openclaw/workspace';
const SOUL_DIR = join(WORKSPACE, '.soul');
const SIGNALS_DIR = join(SOUL_DIR, 'signals');
const INTENTS_PATH = join(SIGNALS_DIR, 'intents.json');
const PENDING_PATH = join(SIGNALS_DIR, 'pending.jsonl');
const DISTRIBUTION_LOG = join(SIGNALS_DIR, 'distribution.log');

// 确保目录存在
function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

// 读取intents配置
function readIntents() {
  if (!existsSync(INTENTS_PATH)) {
    console.error('intents.json不存在，请先创建');
    return null;
  }
  
  try {
    return JSON.parse(readFileSync(INTENTS_PATH, 'utf-8'));
  } catch (error) {
    console.error('读取intents.json失败:', error.message);
    return null;
  }
}

// 读取待处理信号
function readPendingSignals() {
  if (!existsSync(PENDING_PATH)) {
    return [];
  }
  
  try {
    const content = readFileSync(PENDING_PATH, 'utf-8');
    return content.split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(signal => signal && signal.status === 'pending');
  } catch (error) {
    console.error('读取pending信号失败:', error.message);
    return [];
  }
}

// 更新信号状态
function updateSignalStatus(signalId, updates) {
  if (!existsSync(PENDING_PATH)) return false;
  
  try {
    const content = readFileSync(PENDING_PATH, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    let updated = false;
    const newLines = lines.map(line => {
      try {
        const signal = JSON.parse(line);
        if (signal.id === signalId) {
          updated = true;
          return JSON.stringify({ ...signal, ...updates });
        }
      } catch {
        // 保持原样
      }
      return line;
    });
    
    if (updated) {
      writeFileSync(PENDING_PATH, newLines.join('\n') + (newLines.length > 0 ? '\n' : ''));
    }
    
    return updated;
  } catch (error) {
    console.error('更新信号状态失败:', error.message);
    return false;
  }
}

// 查找能处理信号的skill
function findSkillsForSignal(signal, intents) {
  const skills = [];
  
  for (const [skillName, skillConfig] of Object.entries(intents.skills)) {
    if (!skillConfig.enabled) continue;
    
    if (skillConfig.handles && skillConfig.handles.includes(signal.type)) {
      skills.push({
        name: skillName,
        config: skillConfig,
        priority: 1
      });
    }
  }
  
  return skills;
}

// 记录分发日志
function logDistribution(signal, skills, action) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    signal: { id: signal.id, type: signal.type, source: signal.source },
    skills: skills.map(s => s.name),
    action,
    note: `${skills.length}个skill可处理此信号`
  };
  
  const logLine = JSON.stringify(logEntry) + '\n';
  appendFileSync(DISTRIBUTION_LOG, logLine);
  
  console.log(`[${logEntry.timestamp}] ${signal.type} -> ${skills.map(s => s.name).join(', ')} (${action})`);
}

// 尝试执行skill
function tryExecuteSkill(skill, signal) {
  const { name, config } = skill;
  
  if (!config.executable || !existsSync(config.executable)) {
    console.log(`  ${name}: 无可执行文件，跳过执行`);
    return false;
  }
  
  try {
    console.log(`  ${name}: 尝试执行 ${config.executable}`);
    
    // 构建命令行参数
    const cmd = `node "${config.executable}" --process-signal '${JSON.stringify(signal)}'`;
    
    // 执行（异步，不等待）
    execSync(cmd, { stdio: 'pipe', timeout: 30000 });
    
    console.log(`  ${name}: 执行成功`);
    return true;
  } catch (error) {
    console.log(`  ${name}: 执行失败 - ${error.message}`);
    return false;
  }
}

// 主分发逻辑
async function distributeSignals() {
  console.log('=== 信号分发器开始运行 ===');
  
  // 确保目录存在
  ensureDir(SIGNALS_DIR);
  
  // 读取配置和信号
  const intents = readIntents();
  if (!intents) return;
  
  const signals = readPendingSignals();
  console.log(`发现${signals.length}个待处理信号`);
  
  let distributed = 0;
  let skipped = 0;
  
  for (const signal of signals) {
    console.log(`\n处理信号: ${signal.type} [${signal.id}]`);
    console.log(`  来源: ${signal.source}, 优先级: ${signal.priority}`);
    
    // 查找能处理此信号的skill
    const skills = findSkillsForSignal(signal, intents);
    
    if (skills.length === 0) {
      console.log('  无匹配的skill，跳过');
      skipped++;
      continue;
    }
    
    console.log(`  匹配skill: ${skills.map(s => s.name).join(', ')}`);
    
    // 记录分发
    logDistribution(signal, skills, 'distributed');
    
    // 尝试执行每个skill（简单的轮询）
    let executed = false;
    for (const skill of skills) {
      if (tryExecuteSkill(skill, signal)) {
        executed = true;
        // 一个信号可以被多个skill处理
      }
    }
    
    if (executed) {
      // 标记信号为处理中
      updateSignalStatus(signal.id, {
        status: 'processing',
        distributedAt: new Date().toISOString(),
        distributedTo: skills.map(s => s.name)
      });
      distributed++;
    } else {
      console.log('  所有skill执行失败');
      skipped++;
    }
  }
  
  console.log(`\n=== 分发完成 ===`);
  console.log(`已分发: ${distributed}个信号`);
  console.log(`跳过: ${skipped}个信号`);
  
  // 记录摘要
  const summary = {
    timestamp: new Date().toISOString(),
    total_signals: signals.length,
    distributed,
    skipped,
    duration_ms: Date.now() - startTime
  };
  
  const summaryLine = `SUMMARY: ${JSON.stringify(summary)}\n`;
  appendFileSync(DISTRIBUTION_LOG, summaryLine);
}

// 运行分发器
const startTime = Date.now();
distributeSignals().catch(error => {
  console.error('信号分发器运行失败:', error);
  process.exit(1);
});