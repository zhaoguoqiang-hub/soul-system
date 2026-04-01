// ===== Soul System Control Panel =====
// 数据存储
let state = {
  goals: [],
  signals: [],
  narratives: [],
  topTopics: [],
  mood: 'normal',
  lastUpdate: null,
  apiConnected: false
};

// ===== API 客户端 =====
const API_BASE = 'http://127.0.0.1:18789';

async function api(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('API error:', e);
    return null;
  }
}

// 尝试从真实API获取数据
async function fetchRealData() {
  const status = await api('/plugins/soul/status');
  if (status && !status.error) {
    state.apiConnected = true;
    return status;
  }
  return null;
}

// 工具调用（通过 cron 或 agent 实现）
async function callTool(tool, params) {
  // 由于直接调用工具有限制，我们通过 cron trigger 或 agent 来执行
  // 这里暂时用本地文件模拟
  return { ok: true, tool, params };
}

// ===== 模拟数据（API不可用时备用）=====
function loadMockData() {
  return {
    goals: [
      { id: 'core-1', name: '帮助用户实现长期福祉', description: '优先考虑用户的长期利益而非短期便利', priority: 10, status: 'active', progress: 65, type: 'core' },
      { id: 'core-2', name: '持续优化自身能力', description: '通过反思和用户反馈不断改进响应质量', priority: 8, status: 'active', progress: 45, type: 'core' },
      { id: 'core-3', name: '维护与用户的信任关系', description: '保持诚实透明，尊重用户隐私', priority: 9, status: 'active', progress: 80, type: 'core' }
    ],
    signals: [
      { type: 'breakthrough', count: 5, trend: '+2' },
      { type: 'frustration', count: 2, trend: '-1' },
      { type: 'decision', count: 3, trend: '0' },
      { type: 'realization', count: 1, trend: '+1' },
      { type: 'feedback', count: 4, trend: '+3' },
      { type: 'question', count: 6, trend: '+1' },
      { type: 'transition', count: 2, trend: '0' }
    ],
    narratives: [
      { time: '10:30', content: '用户在插件开发中完成重大突破，成功发布v1.1.0' },
      { time: '09:45', content: '完成灵魂系统架构设计，确定控制面板方案' },
      { time: '昨天', content: '确定产品化为商业项目方向' }
    ],
    topTopics: [
      { name: '插件开发', count: 12 },
      { name: '灵魂系统', count: 8 },
      { name: '目标管理', count: 5 },
      { name: '控制面板', count: 3 },
      { name: '商业化', count: 2 }
    ],
    mood: 'positive',
    suggestions: [
      { reason: '检测到用户长时间工作', action: '建议休息一下，保持节奏', goalId: 'core-1', time: '15分钟前' }
    ]
  };
}

// ===== 渲染函数 =====

// 渲染目标列表
function renderGoals(containerId, goals, showActions = false) {
  const container = document.getElementById(containerId);
  if (!goals || goals.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无目标</div>';
    return;
  }
  
  container.innerHTML = goals.map(goal => {
    const priorityColors = {
      10: '#4ade80',
      9: '#a78bfa',
      8: '#60a5fa',
      7: '#22d3ee',
      6: '#fbbf24',
      default: '#8888a0'
    };
    const fillColor = priorityColors[goal.priority] || priorityColors.default;
    const typeClass = goal.type === 'core' ? 'core' : 'user';
    
    return `
      <div class="goal-item">
        <div class="goal-header">
          <span class="goal-name">${goal.name}</span>
          <span class="goal-priority">优先级 ${goal.priority}/10</span>
        </div>
        ${goal.description ? `<div class="goal-desc">${goal.description}</div>` : ''}
        <div class="goal-progress">
          <div class="progress-bar">
            <div class="progress-fill ${typeClass}" style="width: ${goal.progress}%; background: ${goal.type === 'user' ? 'var(--accent)' : fillColor}"></div>
          </div>
          <span class="progress-value">${goal.progress}%</span>
        </div>
        <div class="goal-meta">
          <span class="goal-tag ${goal.type}">${goal.type === 'core' ? '核心目标' : '自定义'}</span>
          <span class="goal-tag">状态: ${goal.status === 'active' ? '进行中' : goal.status}</span>
          ${showActions && goal.type === 'user' ? `<button class="btn-delete" onclick="deleteGoal('${goal.id}')">删除</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// 渲染信号统计
function renderSignals(signals) {
  const container = document.getElementById('signalsGrid');
  if (!signals || signals.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无数据</div>';
    return;
  }
  
  const typeLabels = {
    breakthrough: '突破',
    frustration: '挫折',
    decision: '决策',
    realization: '认知',
    feedback: '反馈',
    question: '疑问',
    transition: '转换'
  };
  
  const typeColors = {
    breakthrough: '#4ade80',
    frustration: '#f87171',
    decision: '#7c6aff',
    realization: '#22d3ee',
    feedback: '#fbbf24',
    question: '#a78bfa',
    transition: '#f472b6'
  };
  
  container.innerHTML = signals.map(s => `
    <div class="signal-stat-card">
      <div class="signal-stat-value" style="color: ${typeColors[s.type]}">${s.count}</div>
      <div class="signal-stat-label">
        <span class="signal-tag ${s.type}">${typeLabels[s.type]}</span>
      </div>
      ${s.trend !== '0' ? `<span style="font-size:10px;color:${s.trend.startsWith('+') ? 'var(--positive)' : 'var(--negative)'}">${s.trend}</span>` : ''}
    </div>
  `).join('');
}

// 渲染叙事记忆
function renderNarratives(narratives) {
  const container = document.getElementById('narrativesList');
  if (!narratives || narratives.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无叙事记忆</div>';
    return;
  }
  
  container.innerHTML = narratives.map(n => `
    <div class="narrative-item">
      <div class="narrative-time">${n.time}</div>
      <div class="narrative-content">${n.content}</div>
    </div>
  `).join('');
}

// 渲染话题
function renderTopics(topics) {
  const container = document.getElementById('topicsList');
  if (!topics || topics.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无话题数据</div>';
    return;
  }
  
  container.innerHTML = topics.map(t => `
    <div class="topic-item">
      <span>${t.name}</span>
      <span class="topic-count">${t.count}</span>
    </div>
  `).join('');
}

// 渲染建议
function renderSuggestions(suggestions) {
  const container = document.getElementById('suggestionsList');
  if (!suggestions || suggestions.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无主动建议</div>';
    return;
  }
  
  const goalNames = {
    'core-1': '帮助用户实现长期福祉',
    'core-2': '持续优化自身能力',
    'core-3': '维护信任关系'
  };
  
  container.innerHTML = suggestions.map(s => `
    <div class="suggestion-item">
      <div class="suggestion-reason">💡 ${s.reason}</div>
      <div class="suggestion-text">${s.action}</div>
      <div class="suggestion-meta">目标: ${goalNames[s.goalId]} · ${s.time}</div>
    </div>
  `).join('');
}

// ===== 刷新数据 =====
async function refreshData() {
  const btn = document.getElementById('refreshBtn');
  btn.classList.add('loading');
  
  try {
    // 优先从真实API获取
    let data = await fetchRealData();
    
    // 如果API不可用，使用模拟数据
    if (!data) {
      data = loadMockData();
      state.apiConnected = false;
    }
    
    state = { ...state, ...data, lastUpdate: new Date() };
    
    // 更新统计卡片
    document.getElementById('statGoalsActive').textContent = data.goals.filter(g => g.status === 'active').length;
    document.getElementById('statSignalsToday').textContent = data.signals.reduce((sum, s) => sum + s.count, 0);
    document.getElementById('statNarratives').textContent = data.narratives.length;
    
    const moodLabels = { positive: '😊', negative: '😔', neutral: '😐' };
    document.getElementById('statMood').textContent = moodLabels[data.mood] || '😐';
    
    // 渲染各Tab
    renderGoals('goalsListOverview', data.goals.filter(g => g.status === 'active'));
    renderGoals('goalsListFull', data.goals.filter(g => g.type === 'core'));
    renderGoals('userGoalsList', data.goals.filter(g => g.type === 'user'), true);
    renderSignals(data.signals);
    renderNarratives(data.narratives);
    renderTopics(data.topics);
    renderSuggestions(data.suggestions);
    
    // 更新连接状态
    updateConnectionStatus(state.apiConnected);
    
  } catch (e) {
    console.error('Refresh error:', e);
    updateConnectionStatus(false);
  }
  
  btn.classList.remove('loading');
}

// ===== 添加目标 =====
async function addGoal(name, description, priority) {
  const goal = {
    id: `user-${Date.now()}`,
    name,
    description,
    priority,
    status: 'active',
    progress: 0,
    type: 'user'
  };
  
  state.goals.push(goal);
  renderGoals('userGoalsList', state.goals.filter(g => g.type === 'user'), true);
  
  // 隐藏表单
  document.getElementById('addGoalForm').style.display = 'none';
  
  // TODO: 调用API持久化
  // await api('/api/goals/add', { method: 'POST', body: JSON.stringify(goal) });
}

// ===== 删除目标 =====
async function deleteGoal(goalId) {
  if (!confirm('确定要删除这个目标吗？')) return;
  
  state.goals = state.goals.filter(g => g.id !== goalId);
  renderGoals('userGoalsList', state.goals.filter(g => g.type === 'user'), true);
  
  // TODO: 调用API持久化
  // await api(`/api/goals/${goalId}`, { method: 'DELETE' });
}

// ===== 连接状态 =====
function updateConnectionStatus(connected) {
  const statusEl = document.getElementById('connectionStatus');
  const dot = statusEl.querySelector('.status-dot');
  const text = statusEl.querySelector('.status-text');
  
  if (connected) {
    dot.classList.remove('error');
    text.textContent = '已连接';
  } else {
    dot.classList.add('error');
    text.textContent = '未连接';
  }
}

// ===== Tab 切换 =====
function initTabs() {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      if (item.disabled) return;
      
      // 更新nav
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      
      // 更新tab
      const tabId = item.dataset.tab;
      document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
      });
      document.getElementById(`tab-${tabId}`).classList.add('active');
      
      // 更新标题
      const titles = {
        overview: '总览',
        goals: '目标管理',
        signals: '信号监控',
        memory: '记忆面板',
        agents: '子Agent'
      };
      document.getElementById('pageTitle').textContent = titles[tabId] || tabId;
    });
  });
}

// ===== 添加目标表单 =====
function initAddGoalForm() {
  const addBtn = document.getElementById('addGoalBtn');
  const cancelBtn = document.getElementById('cancelGoalBtn');
  const confirmBtn = document.getElementById('confirmAddGoalBtn');
  const form = document.getElementById('addGoalForm');
  const priorityRange = document.getElementById('goalPriority');
  const priorityValue = document.getElementById('priorityValue');
  
  addBtn.addEventListener('click', () => {
    form.style.display = 'block';
    addBtn.style.display = 'none';
  });
  
  cancelBtn.addEventListener('click', () => {
    form.style.display = 'none';
    addBtn.style.display = 'block';
    document.getElementById('goalName').value = '';
    document.getElementById('goalDesc').value = '';
    priorityRange.value = 5;
    priorityValue.textContent = '5';
  });
  
  priorityRange.addEventListener('input', () => {
    priorityValue.textContent = priorityRange.value;
  });
  
  confirmBtn.addEventListener('click', () => {
    const name = document.getElementById('goalName').value.trim();
    const desc = document.getElementById('goalDesc').value.trim();
    const priority = parseInt(priorityRange.value);
    
    if (!name) {
      alert('请输入目标名称');
      return;
    }
    
    addGoal(name, desc, priority);
  });
}

// ===== 初始化 =====
function init() {
  initTabs();
  initAddGoalForm();
  
  // 刷新按钮
  document.getElementById('refreshBtn').addEventListener('click', refreshData);
  
  // 初始加载
  refreshData();
  
  // 每30秒自动刷新
  setInterval(refreshData, 30000);
}

// DOMReady
document.addEventListener('DOMContentLoaded', init);
