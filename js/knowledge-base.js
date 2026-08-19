// ============================================================
// knowledge-base.js — Fact Store & Rule Manager
// ============================================================

class KnowledgeBase {
  constructor() {
    this.propositions = [];  // { id, label, value, category }
    this.rules = [];         // { id, name, formula, conclusion, response, priority, enabled }
    this.changeListeners = [];
  }

  // ─── Initialize ─────────────────────────────────────────
  init(propositions, rules) {
    this.propositions = propositions.map(p => ({ ...p }));
    this.rules = rules.map(r => ({ ...r }));
    this._notify('init');
  }

  // ─── Propositions ────────────────────────────────────────
  getProposition(id) {
    return this.propositions.find(p => p.id === id);
  }

  setProposition(id, value) {
    const prop = this.propositions.find(p => p.id === id);
    if (prop) {
      prop.value = value;
      this._notify('prop_changed', { id, value });
    }
  }

  resetPropositions() {
    this.propositions.forEach(p => { p.value = false; });
    // Keep a few defaults
    const activeDefaults = ['P2', 'P6', 'P8', 'P17'];
    activeDefaults.forEach(id => this.setProposition(id, true));
    this._notify('props_reset');
  }

  getAssignment() {
    const assignment = {};
    this.propositions.forEach(p => { assignment[p.id] = p.value; });
    return assignment;
  }

  getPropositionsByCategory() {
    const cats = {};
    this.propositions.forEach(p => {
      if (!cats[p.category]) cats[p.category] = [];
      cats[p.category].push(p);
    });
    return cats;
  }

  addProposition(id, label, category = 'custom') {
    if (this.propositions.find(p => p.id === id)) {
      return { success: false, error: `Proposition ${id} already exists` };
    }
    this.propositions.push({ id, label, value: false, category });
    this._notify('prop_added', { id });
    return { success: true };
  }

  removeProposition(id) {
    const idx = this.propositions.findIndex(p => p.id === id);
    if (idx === -1) return { success: false };
    this.propositions.splice(idx, 1);
    this._notify('prop_removed', { id });
    return { success: true };
  }

  // ─── Rules ───────────────────────────────────────────────
  getRule(id) {
    return this.rules.find(r => r.id === id);
  }

  addRule(rule) {
    const id = rule.id || `R${Date.now()}`;
    const newRule = { id, priority: 5, enabled: true, category: 'custom', ...rule };
    // Validate formula
    const validation = logicEngine.validateFormula(rule.formula);
    if (!validation.valid) {
      return { success: false, error: `Invalid formula: ${validation.error}` };
    }
    this.rules.push(newRule);
    this._notify('rule_added', { id });
    return { success: true, id };
  }

  updateRule(id, updates) {
    const rule = this.rules.find(r => r.id === id);
    if (!rule) return { success: false };
    if (updates.formula) {
      const validation = logicEngine.validateFormula(updates.formula);
      if (!validation.valid) {
        return { success: false, error: `Invalid formula: ${validation.error}` };
      }
    }
    Object.assign(rule, updates);
    this._notify('rule_updated', { id });
    return { success: true };
  }

  removeRule(id) {
    const idx = this.rules.findIndex(r => r.id === id);
    if (idx === -1) return { success: false };
    this.rules.splice(idx, 1);
    this._notify('rule_removed', { id });
    return { success: true };
  }

  toggleRule(id) {
    const rule = this.rules.find(r => r.id === id);
    if (rule) {
      rule.enabled = !rule.enabled;
      this._notify('rule_toggled', { id, enabled: rule.enabled });
    }
  }

  getRulesByCategory() {
    const cats = {};
    this.rules.forEach(r => {
      if (!cats[r.category]) cats[r.category] = [];
      cats[r.category].push(r);
    });
    return cats;
  }

  // ─── Forward Chaining Engine ─────────────────────────────
  forwardChain() {
    const assignment = this.getAssignment();
    const firedRules = logicEngine.applyModusPonens([], this.rules, assignment);
    return firedRules;
  }

  // ─── Apply Intent to KB ──────────────────────────────────
  applyIntent(intent) {
    // Temporarily set propositions based on detected intent
    const changes = [];
    Object.entries(intent.propositions).forEach(([id, value]) => {
      const prop = this.getProposition(id);
      if (prop && prop.value !== value) {
        prop.value = value;
        changes.push({ id, oldValue: !value, newValue: value });
      }
    });
    return changes;
  }

  // ─── Snapshot & Restore ──────────────────────────────────
  snapshot() {
    return this.propositions.map(p => ({ id: p.id, value: p.value }));
  }

  restore(snap) {
    snap.forEach(({ id, value }) => {
      const prop = this.propositions.find(p => p.id === id);
      if (prop) prop.value = value;
    });
  }

  // ─── Export / Import ─────────────────────────────────────
  export() {
    return JSON.stringify({
      propositions: this.propositions,
      rules: this.rules,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  import(json) {
    try {
      const data = JSON.parse(json);
      if (data.propositions) this.propositions = data.propositions;
      if (data.rules) this.rules = data.rules;
      this._notify('imported');
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // ─── Change Listeners ────────────────────────────────────
  onChange(fn) {
    this.changeListeners.push(fn);
  }

  _notify(event, data = {}) {
    this.changeListeners.forEach(fn => fn(event, data));
  }
}

// Singleton export
const knowledgeBase = new KnowledgeBase();
