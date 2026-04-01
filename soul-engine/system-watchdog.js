#!/usr/bin/env node

/**
 * 灵魂系统守护进程
 * 
 * 职责：
 * 1. 检查定时任务执行状态
 * 2. 补偿错过的任务
 * 3. 系统启动恢复
 * 4. 健康状态监控
 */

import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

// 替代date-fns功能的工具函数
function formatDate(date, formatStr = 'yyyy-MM-dd HH:mm:ss') {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return formatStr
    .replace('yyyy', year)
    .replace('MM', month)
    .replace('dd', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

function differenceInHours(date1, date2) {
  return Math.floor(Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60));
}

function parseISO(isoString) {
  return new Date(isoString);
}

function formatShort(date) {
  return formatDate(date, 'yyyy-MM-dd HH:mm');
}

const WORKSPACE = process.env.HOME ? join(process.env.HOME, '.openclaw/workspace') : '/tmp/.openclaw/workspace';
const SOUL_DIR = join(WORKSPACE, '.soul');
const WATCHDOG_STATE = join(SOUL_DIR, 'watchdog-state.json');

// 任务定义
const TASKS = {
  'value-guard-boundary': {
    description: '价值守护边界检查',
    executable: '/Users/zhaoguoqiang/.openclaw/skills/@soul-system/value-aware-guard/scripts/guard.js',
    args: '--check-boundaries',
    schedule: '*/30 * * * *', // 每30分钟
    maxMissedHours: 2, // 最多错过2小时
    critical: false
  },
  'value-guard-full': {
    description: '价值守护全面评估',
    executable: '/Users/zhaoguoqiang/.openclaw/skills/@soul-system/value-aware-guard/scripts/guard.js',
    args: '',
    schedule: '0 3 * * *', // 每天凌晨3点
    maxMissedDays: 1, // 最多错过1天
    critical: false
  },
  'narrative-daily': {
    description: '叙事记忆每日分析',
    executable: '/Users/zhaoguoqiang/.openclaw/skills/@soul-system/narrative-memory/scripts/process-daily.js',
    args: '',
    schedule: '0 2 * * *', // 每天凌晨2点
    maxMissedDays: 2, // 最多错过2天
    critical: true // 重要：不能错过太多天
  },
  'signal-distributor': {
    description: '信号分发器',
    executable: '/Users/zhaoguoqiang/.openclaw/workspace/.soul/signal-distributor.js',
    args: '',
    schedule: '*/15 * * * *', // 每15分钟
    maxMissedMinutes: 60, // 最多错过60分钟
    critical: true // 重要：信号不能堆积太久
  }
};

// 日志文件路径
const LOG_PATHS = {
  'value-guard-boundary': '/tmp/value-guard-boundary.log',
  'value-guard-full': '/tmp/value-guard-full.log',
  'narrative-daily': '/tmp/narrative-daily.log',
  'signal-distributor': '/tmp/signal-distributor.log'
};

// 加载状态
function loadState() {
  if (!existsSync(WATCHDOG_STATE)) {
    return {
      tasks: {},
      lastSystemCheck: null,
      compensations: [],
      systemStartTime: new Date().toISOString()
    };
  }
  
  try {
    return JSON.parse(readFileSync(WATCHDOG_STATE, 'utf-8'));
  } catch (error) {
    console.error('加载守护进程状态失败:', error.message);
    return {
      tasks: {},
      lastSystemCheck: null,
      compensations: [],
      systemStartTime: new Date().toISOString()
    };
  }
}

// 保存状态
function saveState(state) {
  if (!existsSync(SOUL_DIR)) {
    mkdirSync(SOUL_DIR, { recursive: true });
  }
  
  state.lastSystemCheck = new Date().toISOString();
  writeFileSync(WATCHDOG_STATE, JSON.stringify(state, null, 2));
}

// 检查日志文件的最后修改时间
function getLastRunFromLog(taskId) {
  const logPath = LOG_PATHS[taskId];
  if (!logPath || !existsSync(logPath)) {
    return null;
  }
  
  try {
    const stats = statSync(logPath);
    return stats.mtime;
  } catch (error) {
    console.error(`检查日志文件失败 ${logPath}:`, error.message);
    return null;
  }
}

// 检查任务状态
function checkTaskStatus(taskId, taskConfig, state) {
  const now = new Date();
  const lastRun = getLastRunFromLog(taskId);
  
  // 从状态文件获取上次记录的执行时间
  const taskState = state.tasks[taskId] || {
    lastSuccessfulRun: null,
    consecutiveMisses: 0,
    totalRuns: 0,
    totalFailures: 0
  };
  
  let status = 'unknown';
  let needsCompensation = false;
  let compensationReason = '';
  
  if (!lastRun) {
    // 从未运行过
    status = 'never-run';
    if (taskConfig.critical) {
      needsCompensation = true;
      compensationReason = '关键任务从未运行';
    }
  } else {
    // 计算距离上次运行的时间
    const diffHours = differenceInHours(now, lastRun);
    
    // 根据任务类型判断是否错过
    if (taskId === 'value-guard-boundary') {
      const diffMinutes = Math.floor((now.getTime() - lastRun.getTime()) / (1000 * 60));
      if (diffMinutes > taskConfig.maxMissedHours * 60) {
        status = 'missed';
        needsCompensation = true;
        compensationReason = `错过了 ${diffMinutes} 分钟`;
      } else {
        status = 'ok';
      }
    } else if (taskId === 'signal-distributor') {
      const diffMinutes = Math.floor((now.getTime() - lastRun.getTime()) / (1000 * 60));
      if (diffMinutes > taskConfig.maxMissedMinutes) {
        status = 'missed';
        needsCompensation = true;
        compensationReason = `错过了 ${diffMinutes} 分钟`;
      } else {
        status = 'ok';
      }
    } else if (taskId.includes('value-guard-full') || taskId.includes('narrative-daily')) {
      if (diffHours > taskConfig.maxMissedDays * 24) {
        status = 'missed';
        needsCompensation = true;
        compensationReason = `错过了 ${Math.floor(diffHours / 24)} 天`;
      } else {
        status = 'ok';
      }
    }
  }
  
  // 更新任务状态
  if (status === 'ok' && lastRun) {
    taskState.lastSuccessfulRun = lastRun.toISOString();
    taskState.consecutiveMisses = 0;
    taskState.totalRuns = (taskState.totalRuns || 0) + 1;
  } else if (status === 'missed') {
    taskState.consecutiveMisses = (taskState.consecutiveMisses || 0) + 1;
    taskState.totalFailures = (taskState.totalFailures || 0) + 1;
  }
  
  state.tasks[taskId] = taskState;
  
  return {
    taskId,
    description: taskConfig.description,
    status,
    lastRun: lastRun ? formatShort(lastRun) : '从未',
    needsCompensation,
    compensationReason,
    schedule: taskConfig.schedule
  };
}

// 执行补偿任务
function executeCompensation(taskId, taskConfig, reason) {
  console.log(`🔧 执行补偿: ${taskConfig.description} (原因: ${reason})`);
  
  try {
    const cmd = `node "${taskConfig.executable}" ${taskConfig.args}`;
    console.log(`执行命令: ${cmd}`);
    
    execSync(cmd, { stdio: 'pipe', timeout: 60000 }); // 60秒超时
    
    console.log(`✅ 补偿执行成功: ${taskId}`);
    return true;
  } catch (error) {
    console.error(`❌ 补偿执行失败 ${taskId}:`, error.message);
    return false;
  }
}

// 检查信号堆积
function checkSignalBacklog() {
  const pendingFile = join(SOUL_DIR, 'signals', 'pending.jsonl');
  
  if (!existsSync(pendingFile)) {
    return { count: 0, status: 'ok' };
  }
  
  try {
    const content = readFileSync(pendingFile, 'utf-8');
    const pendingSignals = content.split('\n').filter(line => line.trim()).length;
    
    if (pendingSignals > 10) {
      return { 
        count: pendingSignals, 
        status: 'warning',
        message: `有 ${pendingSignals} 个待处理信号堆积`
      };
    } else if (pendingSignals > 50) {
      return { 
        count: pendingSignals, 
        status: 'critical',
        message: `有 ${pendingSignals} 个待处理信号堆积，需要立即处理`
      };
    } else {
      return { 
        count: pendingSignals, 
        status: 'ok',
        message: `待处理信号: ${pendingSignals}`
      };
    }
  } catch (error) {
    return { count: 0, status: 'error', message: `检查信号文件失败: ${error.message}` };
  }
}

// 检查每日上下文处理
function checkDailyContext() {
  const dailyContextPath = join(SOUL_DIR, 'daily_context.json');
  
  if (!existsSync(dailyContextPath)) {
    return { status: 'missing', message: '每日上下文文件不存在' };
  }
  
  try {
    const context = JSON.parse(readFileSync(dailyContextPath, 'utf-8'));
    const today = formatDate(new Date(), 'yyyy-MM-dd');
    
    if (context.date !== today) {
      return { 
        status: 'outdated', 
        message: `每日上下文日期为 ${context.date}，今天是 ${today}`,
        context
      };
    }
    
    // 检查是否有未处理的关键事件
    const unprocessedEvents = context.key_events || [];
    if (unprocessedEvents.length > 0) {
      return { 
        status: 'pending', 
        message: `有 ${unprocessedEvents.length} 个关键事件待处理`,
        context
      };
    }
    
    return { status: 'ok', message: '每日上下文正常' };
  } catch (error) {
    return { status: 'error', message: `解析每日上下文失败: ${error.message}` };
  }
}

// 系统启动恢复
function performSystemRecovery() {
  console.log('🚀 执行系统启动恢复检查...');
  
  const state = loadState();
  const now = new Date();
  const systemStartTime = state.systemStartTime ? parseISO(state.systemStartTime) : now;
  const hoursSinceStart = differenceInHours(now, systemStartTime);
  
  // 如果是系统刚启动（1小时内），执行全面检查
  if (hoursSinceStart < 1) {
    console.log('🔍 系统最近启动，执行全面恢复检查...');
    
    // 强制执行所有关键任务
    for (const [taskId, taskConfig] of Object.entries(TASKS)) {
      if (taskConfig.critical) {
        console.log(`强制执行关键任务: ${taskConfig.description}`);
        executeCompensation(taskId, taskConfig, '系统启动恢复');
      }
    }
    
    // 检查信号堆积
    const signalStatus = checkSignalBacklog();
    if (signalStatus.status !== 'ok') {
      console.log(`⚠️ 检测到信号堆积: ${signalStatus.message}`);
      // 立即运行信号分发器
      const signalTask = TASKS['signal-distributor'];
      executeCompensation('signal-distributor', signalTask, signalStatus.message);
    }
    
    // 检查每日上下文
    const contextStatus = checkDailyContext();
    if (contextStatus.status === 'outdated' || contextStatus.status === 'pending') {
      console.log(`⚠️ 每日上下文异常: ${contextStatus.message}`);
      const narrativeTask = TASKS['narrative-daily'];
      executeCompensation('narrative-daily', narrativeTask, contextStatus.message);
    }
  }
  
  // 更新系统启动时间
  state.systemStartTime = now.toISOString();
  saveState(state);
  
  console.log('✅ 系统启动恢复完成');
}

// 主检查函数
async function performHealthCheck() {
  console.log('=== 灵魂系统健康检查 ===');
  console.log(`时间: ${formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
  
  const state = loadState();
  const checkResults = [];
  const compensations = [];
  
  // 检查所有任务
  for (const [taskId, taskConfig] of Object.entries(TASKS)) {
    const result = checkTaskStatus(taskId, taskConfig, state);
    checkResults.push(result);
    
    if (result.needsCompensation) {
      compensations.push({
        taskId,
        taskConfig,
        reason: result.compensationReason
      });
    }
  }
  
  // 显示检查结果
  console.log('\n📋 任务状态检查:');
  for (const result of checkResults) {
    const icon = result.status === 'ok' ? '✅' : result.status === 'missed' ? '⚠️' : '❓';
    console.log(`${icon} ${result.description}: ${result.status} (上次运行: ${result.lastRun})`);
    if (result.needsCompensation) {
      console.log(`   → 需要补偿: ${result.compensationReason}`);
    }
  }
  
  // 检查信号堆积
  console.log('\n📡 信号系统检查:');
  const signalStatus = checkSignalBacklog();
  const signalIcon = signalStatus.status === 'ok' ? '✅' : signalStatus.status === 'warning' ? '⚠️' : '❌';
  console.log(`${signalIcon} ${signalStatus.message}`);
  
  // 检查每日上下文
  console.log('\n📝 每日上下文检查:');
  const contextStatus = checkDailyContext();
  const contextIcon = contextStatus.status === 'ok' ? '✅' : contextStatus.status === 'missing' ? '⚠️' : '❌';
  console.log(`${contextIcon} ${contextStatus.message}`);
  
  // 执行补偿任务
  if (compensations.length > 0) {
    console.log(`\n🔧 需要执行 ${compensations.length} 个补偿任务:`);
    
    for (const comp of compensations) {
      const success = executeCompensation(comp.taskId, comp.taskConfig, comp.reason);
      
      // 记录补偿结果
      state.compensations = state.compensations || [];
      state.compensations.push({
        taskId: comp.taskId,
        reason: comp.reason,
        timestamp: new Date().toISOString(),
        success
      });
      
      // 只保留最近100条补偿记录
      if (state.compensations.length > 100) {
        state.compensations = state.compensations.slice(-100);
      }
    }
  }
  
  // 保存状态
  saveState(state);
  
  console.log('\n=== 健康检查完成 ===');
  return { checkResults, compensations };
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'recovery':
      performSystemRecovery();
      break;
      
    case 'check':
      await performHealthCheck();
      break;
      
    case 'startup':
      // 启动时调用：先恢复再检查
      performSystemRecovery();
      await performHealthCheck();
      break;
      
    case 'status':
      const state = loadState();
      console.log('系统守护进程状态:');
      console.log(JSON.stringify(state, null, 2));
      break;
      
    case 'help':
    default:
      console.log(`
灵魂系统守护进程
用法:
  node system-watchdog.js [命令]

命令:
  startup    系统启动时调用（恢复 + 检查）
  recovery   执行系统恢复（补偿错过的任务）
  check      执行健康检查
  status     显示当前状态
  help       显示此帮助

示例:
  node system-watchdog.js startup   # 系统启动时调用
  node system-watchdog.js check     # 手动健康检查
  node system-watchdog.js recovery  # 恢复错过的任务
      `);
      break;
  }
}

// 运行主函数
main().catch(error => {
  console.error('守护进程执行失败:', error);
  process.exit(1);
});