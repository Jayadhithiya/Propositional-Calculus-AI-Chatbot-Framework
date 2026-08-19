// ============================================================
// ui.js — UI Controller
// Tab management, rendering, animations, event handling
// ============================================================

class UIController {
  constructor() {
    this.activeTab = 'chatbot';
    this.typingEl = null;
    this.ruleEditingId = null;
  }

  // ─── Init ────────────────────────────────────────────────
  init() {
    this._setupTabs();
    this._setupChatInput();
    this._initKnowledgeBaseUI();
    this._initRuleBuilderUI();
    this._initTruthTableUI();
    this._initDecisionTraceUI();
    this._initSampleConversations();

    // Listen to chatbot messages
    chatbot.onMessage(msg => this._handleMessage(msg));
    chatbot.onTrace(trace => this._updateDecisionTrace(trace));

    // Init chatbot
    chatbot.init();

    // Animate in
    document.body.classList.add('loaded');
  }

  // ─── Tab Management ──────────────────────────────────────
  _setupTabs() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        this.switchTab(tab);
      });
    });
  }

  switchTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-panel').forEach(el => {
      const isActive = el.id === `tab-${tab}`;
      el.classList.toggle('active', isActive);
      if (isActive) {
        el.style.animation = 'none';
        requestAnimationFrame(() => {
          el.style.animation = 'panelFadeIn 0.4s ease';
        });
      }
    });
  }

  // ─── Chat UI ─────────────────────────────────────────────
  _setupChatInput() {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');

    if (!input || !sendBtn) return;

    const send = () => {
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      input.style.height = 'auto';
      chatbot.processMessage(text);
    };

    sendBtn.addEventListener('click', send);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });

    // Auto-resize
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });
  }

  _handleMessage(msg) {
    if (msg.role === 'typing') {
      this._showTypingIndicator();
      return;
    }
    if (msg.role === 'typing-end') {
      this._hideTypingIndicator();
      return;
    }

    const container = document.getElementById('chat-messages');
    if (!container) return;

    const el = document.createElement('div');
    el.className = `message ${msg.role}-message`;
    el.id = msg.id;

    const formattedText = this._formatMessageText(msg.text);

    if (msg.role === 'user') {
      el.innerHTML = `
        <div class="msg-bubble user-bubble">
          <div class="msg-content">${formattedText}</div>
          <div class="msg-time">${this._formatTime(msg.timestamp)}</div>
        </div>
        <div class="avatar user-avatar">👤</div>
      `;
    } else {
      const rulesBadge = msg.firedRules && msg.firedRules.length > 0
        ? `<div class="rules-badge" onclick="ui.switchTab('trace')" title="View decision trace">
             ⚡ ${msg.firedRules.length} rule${msg.firedRules.length > 1 ? 's' : ''} fired
             <span class="rules-list">${msg.firedRules.slice(0,3).map(r => r.rule).join(', ')}</span>
           </div>`
        : '';

      el.innerHTML = `
        <div class="avatar bot-avatar">🤖</div>
        <div class="msg-bubble bot-bubble">
          <div class="msg-content">${formattedText}</div>
          ${rulesBadge}
          <div class="msg-time">${this._formatTime(msg.timestamp)}</div>
        </div>
      `;
    }

    // Remove typing indicator if exists
    this._hideTypingIndicator();
    container.appendChild(el);
    this._animateMessage(el);
    this._scrollToBottom(container);
  }

  _showTypingIndicator() {
    const container = document.getElementById('chat-messages');
    if (!container || document.getElementById('typing-indicator')) return;
    const el = document.createElement('div');
    el.className = 'message bot-message';
    el.id = 'typing-indicator';
    el.innerHTML = `
      <div class="avatar bot-avatar">🤖</div>
      <div class="msg-bubble bot-bubble typing-bubble">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    container.appendChild(el);
    this._scrollToBottom(container);
  }

  _hideTypingIndicator() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
  }

  _animateMessage(el) {
    el.style.opacity = '0';
    el.style.transform = el.classList.contains('user-message') ? 'translateX(20px)' : 'translateX(-20px)';
    requestAnimationFrame(() => {
      el.style.transition = 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
      el.style.opacity = '1';
      el.style.transform = 'translateX(0)';
    });
  }

  _scrollToBottom(container) {
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 50);
  }

  _formatMessageText(text) {
    // Bold: **text**
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic: *text*
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Newlines
    text = text.replace(/\n/g, '<br>');
    // Inline code
    text = text.replace(/`(.*?)`/g, '<code>$1</code>');
    return text;
  }

  _formatTime(date) {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // ─── Knowledge Base UI ───────────────────────────────────
  _initKnowledgeBaseUI() {
    this.refreshKnowledgeBaseUI();
  }

  refreshKnowledgeBaseUI() {
    const container = document.getElementById('kb-propositions');
    if (!container) return;

    const byCategory = knowledgeBase.getPropositionsByCategory();
    const categoryLabels = {
      billing: '💰 Billing & Payments',
      technical: '🔧 Technical Issues',
      account: '👤 Account Management',
      support: '🎧 Support Level',
      custom: '⚙️ Custom'
    };
    const categoryOrder = ['billing', 'technical', 'account', 'support', 'custom'];

    let html = '';
    for (const cat of categoryOrder) {
      if (!byCategory[cat]) continue;
      html += `
        <div class="kb-category">
          <div class="kb-cat-header">${categoryLabels[cat] || cat}</div>
          <div class="kb-props-grid">
            ${byCategory[cat].map(p => `
              <div class="kb-prop-card ${p.value ? 'prop-true' : 'prop-false'}" id="prop-${p.id}">
                <div class="prop-id">${p.id}</div>
                <div class="prop-label">${p.label}</div>
                <label class="prop-toggle">
                  <input type="checkbox" ${p.value ? 'checked' : ''} onchange="ui.toggleProposition('${p.id}', this.checked)">
                  <span class="toggle-slider"></span>
                </label>
                <div class="prop-value-badge">${p.value ? 'TRUE' : 'FALSE'}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;

    // Update live facts count
    const truePropCount = knowledgeBase.propositions.filter(p => p.value).length;
    const el = document.getElementById('kb-true-count');
    if (el) el.textContent = truePropCount;
  }

  toggleProposition(id, value) {
    knowledgeBase.setProposition(id, value);
    const card = document.getElementById(`prop-${id}`);
    if (card) {
      card.classList.toggle('prop-true', value);
      card.classList.toggle('prop-false', !value);
      const badge = card.querySelector('.prop-value-badge');
      if (badge) badge.textContent = value ? 'TRUE' : 'FALSE';
    }
    const truePropCount = knowledgeBase.propositions.filter(p => p.value).length;
    const el = document.getElementById('kb-true-count');
    if (el) el.textContent = truePropCount;
  }

  resetKB() {
    knowledgeBase.resetPropositions();
    this.refreshKnowledgeBaseUI();
    this._showNotification('Knowledge base reset to defaults', 'info');
  }

  exportKB() {
    const json = knowledgeBase.export();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knowledge_base_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this._showNotification('Knowledge base exported!', 'success');
  }

  // ─── Rule Builder UI ─────────────────────────────────────
  _initRuleBuilderUI() {
    this.renderRuleList();
    this._setupRuleForm();
  }

  renderRuleList() {
    const container = document.getElementById('rule-list');
    if (!container) return;

    const byCategory = knowledgeBase.getRulesByCategory();
    const categoryLabels = {
      billing: '💰 Billing', technical: '🔧 Technical',
      account: '👤 Account', support: '🎧 Support', custom: '⚙️ Custom'
    };
    const categoryOrder = ['billing', 'technical', 'account', 'support', 'custom'];

    let html = '';
    for (const cat of categoryOrder) {
      if (!byCategory[cat]) continue;
      html += `<div class="rule-category-header">${categoryLabels[cat] || cat}</div>`;
      html += byCategory[cat].map(r => `
        <div class="rule-card ${r.enabled ? 'rule-enabled' : 'rule-disabled'}" id="rule-${r.id}">
          <div class="rule-card-top">
            <div class="rule-id-badge">${r.id}</div>
            <div class="rule-name">${r.name}</div>
            <div class="rule-priority">Priority: ${r.priority}</div>
            <div class="rule-actions">
              <button class="btn-icon" onclick="ui.editRule('${r.id}')" title="Edit">✏️</button>
              <button class="btn-icon" onclick="ui.deleteRule('${r.id}')" title="Delete">🗑️</button>
              <label class="rule-toggle-mini">
                <input type="checkbox" ${r.enabled ? 'checked' : ''} onchange="ui.toggleRule('${r.id}', this.checked)">
                <span class="toggle-slider-mini"></span>
              </label>
            </div>
          </div>
          <div class="rule-formula-row">
            <span class="formula-label">IF</span>
            <span class="rule-formula-display">${logicEngine.formulaToHTML(r.formula)}</span>
            <span class="formula-label">THEN</span>
            <span class="rule-conclusion">${r.conclusion}</span>
          </div>
          <div class="rule-response-preview">"${r.response.substring(0, 80)}${r.response.length > 80 ? '…' : ''}"</div>
        </div>
      `).join('');
    }

    container.innerHTML = html || '<div class="no-rules">No rules defined yet.</div>';
  }

  _setupRuleForm() {
    const form = document.getElementById('rule-form');
    if (!form) return;

    // Formula preview
    const formulaInput = document.getElementById('rule-formula');
    if (formulaInput) {
      formulaInput.addEventListener('input', () => {
        const preview = document.getElementById('formula-preview');
        if (preview) {
          const val = formulaInput.value.trim();
          if (val) {
            const validation = logicEngine.validateFormula(val);
            preview.innerHTML = validation.valid
              ? `✅ ${logicEngine.formulaToHTML(val)}`
              : `❌ ${validation.error}`;
            preview.className = validation.valid ? 'formula-preview valid' : 'formula-preview invalid';
          } else {
            preview.innerHTML = '';
            preview.className = 'formula-preview';
          }
        }
      });
    }
  }

  _insertOperator(op) {
    const input = document.getElementById('rule-formula');
    if (!input) return;
    const pos = input.selectionStart;
    const val = input.value;
    const insert = ` ${op} `;
    input.value = val.slice(0, pos) + insert + val.slice(pos);
    input.selectionStart = input.selectionEnd = pos + insert.length;
    input.dispatchEvent(new Event('input'));
    input.focus();
  }

  saveRule() {
    const id     = (document.getElementById('rule-id') || {}).value?.trim();
    const name   = (document.getElementById('rule-name') || {}).value?.trim();
    const formula= (document.getElementById('rule-formula') || {}).value?.trim();
    const conclusion = (document.getElementById('rule-conclusion') || {}).value?.trim();
    const response   = (document.getElementById('rule-response') || {}).value?.trim();
    const priority   = parseInt((document.getElementById('rule-priority') || {}).value) || 5;

    if (!formula || !conclusion) {
      this._showNotification('Formula and conclusion are required!', 'error');
      return;
    }

    if (this.ruleEditingId) {
      const res = knowledgeBase.updateRule(this.ruleEditingId, { name, formula, conclusion, response, priority });
      if (res.success) {
        this._showNotification(`Rule ${this.ruleEditingId} updated!`, 'success');
        this.ruleEditingId = null;
      } else {
        this._showNotification(res.error || 'Update failed', 'error');
        return;
      }
    } else {
      const res = knowledgeBase.addRule({ id, name, formula, conclusion, response, priority });
      if (res.success) {
        this._showNotification(`Rule ${res.id} added!`, 'success');
      } else {
        this._showNotification(res.error || 'Add failed', 'error');
        return;
      }
    }

    this._resetRuleForm();
    this.renderRuleList();
  }

  editRule(id) {
    const rule = knowledgeBase.getRule(id);
    if (!rule) return;
    this.ruleEditingId = id;

    const setVal = (elId, val) => {
      const el = document.getElementById(elId);
      if (el) el.value = val || '';
    };
    setVal('rule-id', rule.id);
    setVal('rule-name', rule.name);
    setVal('rule-formula', rule.formula);
    setVal('rule-conclusion', rule.conclusion);
    setVal('rule-response', rule.response);
    setVal('rule-priority', rule.priority);

    document.getElementById('rule-formula')?.dispatchEvent(new Event('input'));
    document.getElementById('rule-form-title').textContent = `Editing Rule ${id}`;
    document.getElementById('rule-form')?.scrollIntoView({ behavior: 'smooth' });
    this._showNotification(`Editing Rule ${id} — make changes and save`, 'info');
  }

  deleteRule(id) {
    if (!confirm(`Delete Rule ${id}? This cannot be undone.`)) return;
    knowledgeBase.removeRule(id);
    this.renderRuleList();
    this._showNotification(`Rule ${id} deleted`, 'info');
  }

  toggleRule(id, enabled) {
    knowledgeBase.toggleRule(id);
    const card = document.getElementById(`rule-${id}`);
    if (card) {
      card.classList.toggle('rule-enabled', enabled);
      card.classList.toggle('rule-disabled', !enabled);
    }
  }

  _resetRuleForm() {
    this.ruleEditingId = null;
    const ids = ['rule-id','rule-name','rule-formula','rule-conclusion','rule-response'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const pr = document.getElementById('rule-priority');
    if (pr) pr.value = '5';
    const preview = document.getElementById('formula-preview');
    if (preview) { preview.innerHTML = ''; preview.className = 'formula-preview'; }
    const title = document.getElementById('rule-form-title');
    if (title) title.textContent = 'Add New Rule';
  }

  cancelEdit() {
    this._resetRuleForm();
    this._showNotification('Edit cancelled', 'info');
  }

  // ─── Truth Table UI ──────────────────────────────────────
  _initTruthTableUI() {
    const input = document.getElementById('tt-formula-input');
    if (input) {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') this.generateTruthTable();
      });
    }

    const input2 = document.getElementById('tt-formula-input-2');
    if (input2) {
      input2.addEventListener('keydown', e => {
        if (e.key === 'Enter') this.compareTruthTables();
      });
    }
  }

  generateTruthTable() {
    const formula = document.getElementById('tt-formula-input')?.value?.trim();
    truthTableManager.generate(formula, 'tt-output');
  }

  compareTruthTables() {
    const f1 = document.getElementById('tt-formula-input')?.value?.trim();
    const f2 = document.getElementById('tt-formula-input-2')?.value?.trim();
    if (!f1 || !f2) {
      this._showNotification('Enter both formulas to compare', 'error');
      return;
    }
    truthTableManager.compareFormulas(f1, f2, 'tt-output');
  }

  generateResolutionProof() {
    const premisesRaw = document.getElementById('proof-premises')?.value?.trim();
    const conclusion  = document.getElementById('proof-conclusion')?.value?.trim();
    if (!premisesRaw || !conclusion) {
      this._showNotification('Enter premises and conclusion', 'error');
      return;
    }
    const premises = premisesRaw.split('\n').map(p => p.trim()).filter(Boolean);
    truthTableManager.renderResolutionProof(premises, conclusion, 'proof-output');
  }

  exportTruthTable() {
    truthTableManager.exportCSV();
  }

  insertTTOperator(op) {
    const input = document.getElementById('tt-formula-input');
    if (!input) return;
    const pos = input.selectionStart;
    const val = input.value;
    const insert = ` ${op} `;
    input.value = val.slice(0, pos) + insert + val.slice(pos);
    input.selectionStart = input.selectionEnd = pos + insert.length;
    input.focus();
  }

  setExampleFormula(formula) {
    const input = document.getElementById('tt-formula-input');
    if (input) {
      input.value = formula;
      this.generateTruthTable();
    }
  }

  // ─── Decision Trace UI ───────────────────────────────────
  _initDecisionTraceUI() {
    const container = document.getElementById('trace-container');
    if (container) {
      container.innerHTML = `
        <div class="trace-empty">
          <div class="trace-empty-icon">🔍</div>
          <p>Send a message in the chatbot to see the decision trace here.</p>
          <p>Each chatbot response will show step-by-step propositional logic reasoning.</p>
        </div>
      `;
    }
  }

  _updateDecisionTrace(trace) {
    this.lastTrace = trace;
    const container = document.getElementById('trace-container');
    if (!container) return;

    // Update trace badge
    const badge = document.getElementById('trace-badge');
    if (badge) {
      badge.textContent = trace.firedRules.length;
      badge.classList.add('pulse');
      setTimeout(() => badge.classList.remove('pulse'), 1000);
    }

    let html = `
      <div class="trace-header">
        <div class="trace-user-input">
          <span class="trace-label">User Input</span>
          <span class="trace-user-text">"${trace.userInput}"</span>
        </div>
        <div class="trace-summary">
          <span class="trace-rules-fired">⚡ ${trace.firedRules.length} rule(s) fired</span>
        </div>
      </div>

      <div class="trace-steps">
        ${trace.proofSteps.map(step => `
          <div class="trace-step trace-step-${step.type}" style="animation-delay: ${(step.num - 1) * 0.08}s">
            <div class="trace-step-icon">${step.icon}</div>
            <div class="trace-step-body">
              <div class="trace-step-num">Step ${step.num}</div>
              <div class="trace-step-label">${step.label}</div>
              <div class="trace-step-detail">${step.detail}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    if (trace.firedRules.length > 0) {
      html += `
        <div class="trace-rules-section">
          <h4>📋 All Evaluated Rules</h4>
          <div class="trace-rules-list">
            ${trace.firedRules.map((r, i) => `
              <div class="trace-rule-item ${i === 0 ? 'top-rule' : ''}">
                <div class="trace-rule-header">
                  ${i === 0 ? '<span class="top-badge">SELECTED</span>' : ''}
                  <span class="trace-rule-id">${r.rule}</span>
                  <span class="trace-rule-name">${r.ruleName}</span>
                  <span class="trace-rule-priority">P:${r.priority}</span>
                </div>
                <div class="trace-rule-formula">
                  <code>${r.antecedent}</code> → <span class="conclusion-tag">${r.conclusion}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    html += `
      <div class="trace-bot-response">
        <div class="trace-label">Bot Response</div>
        <div class="trace-response-text">${this._formatMessageText(trace.botResponse)}</div>
      </div>
    `;

    container.innerHTML = html;
  }

  // ─── Sample Conversations ────────────────────────────────
  _initSampleConversations() {
    const container = document.getElementById('sample-convos');
    if (!container) return;
    container.innerHTML = SAMPLE_CONVERSATIONS.map((s, i) => `
      <button class="sample-btn" onclick="ui.loadSample(${i})">${s.title}</button>
    `).join('');
  }

  loadSample(idx) {
    chatbot.loadSample(SAMPLE_CONVERSATIONS[idx]);
    this.switchTab('chatbot');
    this._showNotification(`Loading: "${SAMPLE_CONVERSATIONS[idx].title}"`, 'info');
  }

  clearChat() {
    const container = document.getElementById('chat-messages');
    if (container) container.innerHTML = '';
    chatbot.clearConversation();
  }

  // ─── Notification Toast ──────────────────────────────────
  _showNotification(message, type = 'info') {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.className = `toast-notification toast-${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    el.innerHTML = `${icons[type] || 'ℹ️'} ${message}`;
    document.body.appendChild(el);

    requestAnimationFrame(() => { el.classList.add('toast-visible'); });
    setTimeout(() => {
      el.classList.remove('toast-visible');
      setTimeout(() => el.remove(), 400);
    }, 3000);
  }
}

// Singleton export
const ui = new UIController();

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize data
  knowledgeBase.init(INITIAL_PROPOSITIONS, INITIAL_RULES);
  // Initialize UI
  ui.init();
});
