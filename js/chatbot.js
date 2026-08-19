// ============================================================
// chatbot.js — Chatbot Conversation Engine
// Powered by propositional logic & forward chaining
// ============================================================

class ChatbotEngine {
  constructor() {
    this.conversationHistory = [];
    this.sessionProps = {};   // propositions accumulated in this session
    this.turnCount = 0;
    this.fallbackIndex = 0;
    this.lastFiredRules = [];
    this.lastProofSteps = [];
    this.messageListeners = [];
    this.traceListeners = [];
  }

  // ─── Init ────────────────────────────────────────────────
  init() {
    this.conversationHistory = [];
    this.sessionProps = {};
    this.turnCount = 0;
    this.fallbackIndex = 0;

    // Show welcome message
    this._addMessage('bot', DEFAULT_RESPONSE, [], [], true);
  }

  // ─── Main Process ────────────────────────────────────────
  processMessage(userText) {
    if (!userText.trim()) return;
    this.turnCount++;

    // 1. Add user message to history
    this._addMessage('user', userText, [], [], false);

    // 2. Show typing indicator
    this._showTyping();

    // Simulate thinking delay
    setTimeout(() => {
      this._hideTyping();
      const response = this._generateResponse(userText);
      this._addMessage('bot', response.text, response.firedRules, response.proofSteps, false);
      this._updateTrace(response.firedRules, response.proofSteps, userText, response.text);
    }, 800 + Math.random() * 700);
  }

  // ─── Response Generation ─────────────────────────────────
  _generateResponse(userText) {
    // Step 1: Detect intents from user message
    const detectedIntents = this._detectIntents(userText);

    // Step 2: Take a snapshot of the KB before modifying
    const snapshot = knowledgeBase.snapshot();

    // Step 3: Apply detected intents to KB
    const propChanges = [];
    detectedIntents.forEach(intent => {
      const changes = knowledgeBase.applyIntent(intent);
      propChanges.push(...changes);
    });

    // Accumulate session props
    detectedIntents.forEach(intent => {
      Object.assign(this.sessionProps, intent.propositions);
    });

    // Also apply accumulated session props
    Object.entries(this.sessionProps).forEach(([id, value]) => {
      knowledgeBase.setProposition(id, value);
    });

    // Step 4: Run forward chaining
    const firedRules = knowledgeBase.forwardChain();
    this.lastFiredRules = firedRules;

    // Step 5: Build proof steps
    const proofSteps = this._buildProofSteps(detectedIntents, propChanges, firedRules, userText);
    this.lastProofSteps = proofSteps;

    // Step 6: Restore KB to original state (we keep sessionProps separate)
    knowledgeBase.restore(snapshot);
    // Re-apply session accumulated facts
    Object.entries(this.sessionProps).forEach(([id, value]) => {
      knowledgeBase.setProposition(id, value);
    });

    // Step 7: Notify UI of KB changes
    if (window.ui) ui.refreshKnowledgeBaseUI();

    // Step 8: Select best response
    let responseText;
    if (firedRules.length > 0) {
      responseText = firedRules[0].response;
    } else if (detectedIntents.length > 0) {
      responseText = `I've identified your issue as related to **${detectedIntents.map(i => i.name.replace(/_/g, ' ')).join(', ')}**. Let me gather more information to help you better. ${FALLBACK_RESPONSES[this.fallbackIndex % FALLBACK_RESPONSES.length]}`;
      this.fallbackIndex++;
    } else {
      responseText = FALLBACK_RESPONSES[this.fallbackIndex % FALLBACK_RESPONSES.length];
      this.fallbackIndex++;
    }

    return { text: responseText, firedRules, proofSteps };
  }

  // ─── Intent Detection ────────────────────────────────────
  _detectIntents(text) {
    const lowerText = text.toLowerCase();
    const detected = [];
    const matched = new Set();

    for (const intent of CHATBOT_INTENTS) {
      for (const kw of intent.keywords) {
        if (lowerText.includes(kw) && !matched.has(intent.name)) {
          detected.push({ ...intent });
          matched.add(intent.name);
          break;
        }
      }
    }
    return detected;
  }

  // ─── Proof Step Builder ──────────────────────────────────
  _buildProofSteps(intents, propChanges, firedRules, userText) {
    const steps = [];
    let stepNum = 1;

    steps.push({
      num: stepNum++,
      type: 'input',
      label: 'User Input Received',
      detail: `"${userText}"`,
      icon: '💬'
    });

    if (intents.length > 0) {
      steps.push({
        num: stepNum++,
        type: 'intent',
        label: 'Intent Detection (NLP Parsing)',
        detail: intents.map(i => `Detected: <strong>${i.name.replace(/_/g, ' ')}</strong>`).join('<br>'),
        icon: '🔍'
      });
    }

    if (propChanges.length > 0) {
      steps.push({
        num: stepNum++,
        type: 'proposition',
        label: 'Knowledge Base Updated',
        detail: propChanges.map(c => {
          const prop = knowledgeBase.getProposition(c.id);
          const label = prop ? prop.label : c.id;
          return `Set <strong>${c.id}</strong> (${label}) = <span class="${c.newValue ? 'val-true' : 'val-false'}">${c.newValue ? 'TRUE' : 'FALSE'}</span>`;
        }).join('<br>'),
        icon: '📋'
      });
    }

    steps.push({
      num: stepNum++,
      type: 'assignment',
      label: 'Current Truth Assignment',
      detail: this._formatCurrentAssignment(),
      icon: '📊'
    });

    if (firedRules.length > 0) {
      steps.push({
        num: stepNum++,
        type: 'inference',
        label: 'Forward Chaining — Rules Evaluated',
        detail: firedRules.map((r, idx) => {
          const prefix = idx === 0 ? '⭐ ' : '';
          return `${prefix}Rule <strong>${r.rule}</strong> (${r.ruleName}): <code>${r.antecedent}</code> → <span class="conclusion-tag">${r.conclusion}</span>`;
        }).join('<br>'),
        icon: '⚡'
      });

      steps.push({
        num: stepNum++,
        type: 'modus-ponens',
        label: 'Modus Ponens Applied',
        detail: `<em>P → Q</em>, <em>P is TRUE</em> ⊢ <em>Q</em><br><br>` +
                `Applying Rule <strong>${firedRules[0].rule}</strong>:<br>` +
                `Premise: <code>${firedRules[0].antecedent}</code> evaluates to <span class="val-true">TRUE</span><br>` +
                `Conclusion: <strong>${firedRules[0].conclusion}</strong> is derived`,
        icon: '✅'
      });

      steps.push({
        num: stepNum++,
        type: 'response',
        label: 'Response Selected',
        detail: `Best rule: <strong>${firedRules[0].rule}</strong> (priority: ${firedRules[0].priority})<br>Response generated from conclusion: <strong>${firedRules[0].conclusion}</strong>`,
        icon: '💡'
      });
    } else {
      steps.push({
        num: stepNum++,
        type: 'fallback',
        label: 'No Rules Fired — Fallback Response',
        detail: 'No logical rules were triggered. Using fallback clarification response.',
        icon: '🔄'
      });
    }

    return steps;
  }

  _formatCurrentAssignment() {
    const assignment = knowledgeBase.getAssignment();
    const trueProps = knowledgeBase.propositions.filter(p => assignment[p.id]);
    if (trueProps.length === 0) return 'All propositions are FALSE';
    return trueProps.map(p =>
      `<span class="prop-tag">${p.id}</span> = <span class="val-true">TRUE</span> (${p.label})`
    ).join('<br>');
  }

  // ─── Message Management ──────────────────────────────────
  _addMessage(role, text, firedRules, proofSteps, isWelcome) {
    const msg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      role,
      text,
      firedRules: firedRules || [],
      proofSteps: proofSteps || [],
      isWelcome,
      timestamp: new Date()
    };
    this.conversationHistory.push(msg);
    this.messageListeners.forEach(fn => fn(msg));
    return msg;
  }

  _showTyping() {
    this.messageListeners.forEach(fn => fn({ id: 'typing', role: 'typing' }));
  }

  _hideTyping() {
    this.messageListeners.forEach(fn => fn({ id: 'typing-end', role: 'typing-end' }));
  }

  _updateTrace(firedRules, proofSteps, userInput, botResponse) {
    this.traceListeners.forEach(fn => fn({ firedRules, proofSteps, userInput, botResponse }));
  }

  // ─── Listeners ───────────────────────────────────────────
  onMessage(fn) { this.messageListeners.push(fn); }
  onTrace(fn)   { this.traceListeners.push(fn); }

  // ─── Clear Conversation ──────────────────────────────────
  clearConversation() {
    this.conversationHistory = [];
    this.sessionProps = {};
    this.turnCount = 0;
    this.fallbackIndex = 0;
    knowledgeBase.resetPropositions();
    this.init();
  }

  // ─── Load Sample Conversation ────────────────────────────
  loadSample(sample) {
    this.clearConversation();
    let delay = 1200;
    sample.messages.forEach(msg => {
      setTimeout(() => {
        this.processMessage(msg);
      }, delay);
      delay += 2500;
    });
  }
}

// Singleton export
const chatbot = new ChatbotEngine();
