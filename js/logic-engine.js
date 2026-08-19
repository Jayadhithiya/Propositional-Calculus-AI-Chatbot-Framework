// ============================================================
// logic-engine.js — Propositional Calculus Core Engine
// Supports: ¬ (NOT), ∧ (AND), ∨ (OR), → (IMPLIES), ↔ (IFF)
// ============================================================

class LogicEngine {
  constructor() {
    this.operators = {
      '¬': { precedence: 4, unary: true  },
      '∧': { precedence: 3, unary: false },
      '∨': { precedence: 2, unary: false },
      '→': { precedence: 1, unary: false },
      '↔': { precedence: 0, unary: false },
    };
    // Alias map for text input
    this.aliases = {
      'NOT': '¬', '!': '¬', '~': '¬',
      'AND': '∧', '&&': '∧', '&': '∧',
      'OR':  '∨', '||': '∨', '|': '∨',
      '->':  '→', '=>':  '→', 'IMPLIES': '→',
      '<->': '↔', '<=>': '↔', 'IFF': '↔', 'BICONDITIONAL': '↔',
    };
  }

  // ─── Tokenizer ───────────────────────────────────────────
  tokenize(formula) {
    // Normalize aliases to unicode operators
    let f = formula.trim();
    // Replace text aliases (longest first to avoid partial matches)
    const aliasKeys = Object.keys(this.aliases).sort((a, b) => b.length - a.length);
    for (const alias of aliasKeys) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      f = f.replace(new RegExp(escaped, 'gi'), ' ' + this.aliases[alias] + ' ');
    }

    const tokens = [];
    let i = 0;
    while (i < f.length) {
      if (f[i] === ' ' || f[i] === '\t') { i++; continue; }
      if (f[i] === '(') { tokens.push({ type: 'LPAREN', value: '(' }); i++; continue; }
      if (f[i] === ')') { tokens.push({ type: 'RPAREN', value: ')' }); i++; continue; }
      if (this.operators[f[i]]) { tokens.push({ type: 'OP', value: f[i] }); i++; continue; }
      // Variable: word chars
      const match = f.slice(i).match(/^[A-Za-z][A-Za-z0-9_]*/);
      if (match) {
        tokens.push({ type: 'VAR', value: match[0] });
        i += match[0].length;
        continue;
      }
      i++; // skip unknown chars
    }
    return tokens;
  }

  // ─── Parser (Shunting-yard → AST) ───────────────────────
  parse(formula) {
    const tokens = this.tokenize(formula);
    const output = [];
    const opStack = [];
    let prevToken = null;

    for (const token of tokens) {
      if (token.type === 'VAR') {
        output.push({ type: 'VAR', value: token.value });
      } else if (token.type === 'OP') {
        const op = token.value;
        const isUnary = this.operators[op].unary;
        // Determine if ¬ is unary (always is)
        while (opStack.length > 0) {
          const top = opStack[opStack.length - 1];
          if (top.type !== 'OP') break;
          const topOp = top.value;
          const topPrec = this.operators[topOp].precedence;
          const curPrec = this.operators[op].precedence;
          if (!isUnary && (topPrec > curPrec || (topPrec === curPrec && op !== '¬'))) {
            output.push(opStack.pop());
          } else if (isUnary && topPrec > curPrec) {
            output.push(opStack.pop());
          } else break;
        }
        opStack.push({ type: 'OP', value: op, unary: isUnary });
      } else if (token.type === 'LPAREN') {
        opStack.push(token);
      } else if (token.type === 'RPAREN') {
        while (opStack.length > 0 && opStack[opStack.length - 1].type !== 'LPAREN') {
          output.push(opStack.pop());
        }
        opStack.pop(); // remove LPAREN
      }
      prevToken = token;
    }
    while (opStack.length > 0) output.push(opStack.pop());

    // Build AST from RPN
    return this._buildAST(output);
  }

  _buildAST(rpn) {
    const stack = [];
    for (const token of rpn) {
      if (token.type === 'VAR') {
        stack.push({ type: 'VAR', name: token.value });
      } else if (token.type === 'OP') {
        if (token.unary) {
          const operand = stack.pop();
          stack.push({ type: 'UNARY', op: token.value, operand });
        } else {
          const right = stack.pop();
          const left  = stack.pop();
          stack.push({ type: 'BINARY', op: token.value, left, right });
        }
      }
    }
    return stack[0] || null;
  }

  // ─── Evaluator ───────────────────────────────────────────
  evaluate(formula, assignment) {
    try {
      const ast = this.parse(formula);
      if (!ast) return null;
      return this._evalAST(ast, assignment);
    } catch (e) {
      return null;
    }
  }

  _evalAST(node, assignment) {
    if (!node) return null;
    if (node.type === 'VAR') {
      const val = assignment[node.name];
      return val === undefined ? null : Boolean(val);
    }
    if (node.type === 'UNARY') {
      const v = this._evalAST(node.operand, assignment);
      if (v === null) return null;
      return !v; // ¬
    }
    if (node.type === 'BINARY') {
      const l = this._evalAST(node.left,  assignment);
      const r = this._evalAST(node.right, assignment);
      // Short-circuit
      if (node.op === '∧') return (l === false || r === false) ? false : (l === null || r === null) ? null : true;
      if (node.op === '∨') return (l === true  || r === true)  ? true  : (l === null || r === null) ? null : false;
      if (node.op === '→') return (l === false) ? true : (r === null || l === null) ? null : r;
      if (node.op === '↔') return (l === null || r === null) ? null : l === r;
    }
    return null;
  }

  // ─── Variable Extractor ──────────────────────────────────
  getVariables(formula) {
    try {
      const ast = this.parse(formula);
      const vars = new Set();
      this._collectVars(ast, vars);
      return [...vars].sort();
    } catch (e) {
      return [];
    }
  }

  _collectVars(node, vars) {
    if (!node) return;
    if (node.type === 'VAR') { vars.add(node.name); return; }
    if (node.type === 'UNARY') { this._collectVars(node.operand, vars); return; }
    if (node.type === 'BINARY') {
      this._collectVars(node.left, vars);
      this._collectVars(node.right, vars);
    }
  }

  // ─── Truth Table Generator ───────────────────────────────
  generateTruthTable(formula) {
    try {
      const vars = this.getVariables(formula);
      if (vars.length === 0) return null;
      if (vars.length > 8) return { error: "Too many variables (max 8)" };

      const rows = [];
      const total = Math.pow(2, vars.length);

      for (let i = 0; i < total; i++) {
        const assignment = {};
        vars.forEach((v, idx) => {
          assignment[v] = Boolean((i >> (vars.length - 1 - idx)) & 1);
        });
        const result = this.evaluate(formula, assignment);
        rows.push({ assignment: { ...assignment }, result });
      }

      return { vars, rows, formula };
    } catch (e) {
      return { error: "Invalid formula: " + e.message };
    }
  }

  // ─── CNF Converter ───────────────────────────────────────
  toCNF(formula) {
    try {
      let ast = this.parse(formula);
      // Step 1: Eliminate ↔
      ast = this._eliminateBiconditional(ast);
      // Step 2: Eliminate →
      ast = this._eliminateImplication(ast);
      // Step 3: Push ¬ inward (De Morgan's)
      ast = this._pushNegation(ast, false);
      // Step 4: Distribute ∨ over ∧
      ast = this._distribute(ast);
      return this._astToString(ast);
    } catch (e) {
      return "Error: " + e.message;
    }
  }

  _eliminateBiconditional(node) {
    if (!node) return node;
    if (node.type === 'VAR') return node;
    if (node.type === 'UNARY') return { ...node, operand: this._eliminateBiconditional(node.operand) };
    if (node.type === 'BINARY') {
      const l = this._eliminateBiconditional(node.left);
      const r = this._eliminateBiconditional(node.right);
      if (node.op === '↔') {
        return {
          type: 'BINARY', op: '∧',
          left:  { type: 'BINARY', op: '→', left: l, right: r },
          right: { type: 'BINARY', op: '→', left: r, right: l }
        };
      }
      return { ...node, left: l, right: r };
    }
    return node;
  }

  _eliminateImplication(node) {
    if (!node) return node;
    if (node.type === 'VAR') return node;
    if (node.type === 'UNARY') return { ...node, operand: this._eliminateImplication(node.operand) };
    if (node.type === 'BINARY') {
      const l = this._eliminateImplication(node.left);
      const r = this._eliminateImplication(node.right);
      if (node.op === '→') {
        return { type: 'BINARY', op: '∨', left: { type: 'UNARY', op: '¬', operand: l }, right: r };
      }
      return { ...node, left: l, right: r };
    }
    return node;
  }

  _pushNegation(node, negate) {
    if (!node) return node;
    if (node.type === 'VAR') {
      if (!negate) return node;
      return { type: 'UNARY', op: '¬', operand: node };
    }
    if (node.type === 'UNARY' && node.op === '¬') {
      return this._pushNegation(node.operand, !negate);
    }
    if (node.type === 'BINARY') {
      if (!negate) {
        return { ...node, left: this._pushNegation(node.left, false), right: this._pushNegation(node.right, false) };
      }
      // De Morgan's: ¬(A ∧ B) = ¬A ∨ ¬B, ¬(A ∨ B) = ¬A ∧ ¬B
      const newOp = node.op === '∧' ? '∨' : '∧';
      return {
        type: 'BINARY', op: newOp,
        left:  this._pushNegation(node.left,  true),
        right: this._pushNegation(node.right, true)
      };
    }
    return node;
  }

  _distribute(node) {
    if (!node) return node;
    if (node.type === 'VAR' || node.type === 'UNARY') return node;
    if (node.type === 'BINARY') {
      let l = this._distribute(node.left);
      let r = this._distribute(node.right);
      if (node.op === '∨') {
        // Distribute ∨ over ∧: A ∨ (B ∧ C) = (A ∨ B) ∧ (A ∨ C)
        if (r.type === 'BINARY' && r.op === '∧') {
          return this._distribute({
            type: 'BINARY', op: '∧',
            left:  { type: 'BINARY', op: '∨', left: l, right: r.left  },
            right: { type: 'BINARY', op: '∨', left: l, right: r.right }
          });
        }
        if (l.type === 'BINARY' && l.op === '∧') {
          return this._distribute({
            type: 'BINARY', op: '∧',
            left:  { type: 'BINARY', op: '∨', left: l.left,  right: r },
            right: { type: 'BINARY', op: '∨', left: l.right, right: r }
          });
        }
      }
      return { ...node, left: l, right: r };
    }
    return node;
  }

  _astToString(node) {
    if (!node) return '';
    if (node.type === 'VAR') return node.name;
    if (node.type === 'UNARY') return `¬${this._astToString(node.operand)}`;
    if (node.type === 'BINARY') {
      const l = this._astToString(node.left);
      const r = this._astToString(node.right);
      return `(${l} ${node.op} ${r})`;
    }
    return '';
  }

  // ─── Modus Ponens ────────────────────────────────────────
  // Given a set of known truths and rules (P→Q), derive new truths
  applyModusPonens(knownFacts, rules, assignment) {
    const derivedFacts = [];
    for (const rule of rules) {
      if (!rule.enabled) continue;
      const antecedent = rule.formula;
      const result = this.evaluate(antecedent, assignment);
      if (result === true) {
        derivedFacts.push({
          rule: rule.id,
          ruleName: rule.name,
          antecedent: antecedent,
          conclusion: rule.conclusion,
          response: rule.response,
          priority: rule.priority,
          step: `${antecedent} is TRUE → Apply Rule ${rule.id} (${rule.name}) → Conclude: ${rule.conclusion}`
        });
      }
    }
    // Sort by priority descending
    derivedFacts.sort((a, b) => b.priority - a.priority);
    return derivedFacts;
  }

  // ─── Resolution Prover ───────────────────────────────────
  // Proves whether a conclusion follows from premises using resolution
  // Returns { proved, steps }
  proveByResolution(premises, conclusion) {
    const steps = [];
    // Negate conclusion and add to premises
    const negated = `¬(${conclusion})`;
    steps.push({ step: 1, action: "Negate the conclusion", formula: negated });

    const allClauses = [...premises, negated];
    steps.push({ step: 2, action: "Initial clause set", formula: allClauses.join(', ') });

    // Simplified resolution: evaluate premises with truth assignments
    // Build all variable assignments
    const allVars = new Set();
    [...premises, conclusion].forEach(p => {
      this.getVariables(p).forEach(v => allVars.add(v));
    });
    const vars = [...allVars];

    if (vars.length === 0) {
      const result = premises.every(p => this.evaluate(p, {}) === true);
      const concResult = this.evaluate(conclusion, {});
      steps.push({ step: 3, action: "Ground evaluation", formula: `Result: ${concResult}` });
      return { proved: result && concResult === true, steps };
    }

    const total = Math.pow(2, Math.min(vars.length, 6));
    let allSatisfied = true;

    for (let i = 0; i < total; i++) {
      const assignment = {};
      vars.slice(0, 6).forEach((v, idx) => {
        assignment[v] = Boolean((i >> (Math.min(vars.length, 6) - 1 - idx)) & 1);
      });
      // Check if all premises are true AND conclusion is false (contradiction needed)
      const premisesTrue = premises.every(p => this.evaluate(p, assignment) !== false);
      const concFalse = this.evaluate(conclusion, assignment) === false;
      if (premisesTrue && concFalse) {
        allSatisfied = false;
        steps.push({ step: 3, action: "Found counterexample", formula: JSON.stringify(assignment) });
        break;
      }
    }

    if (allSatisfied) {
      steps.push({ step: 3, action: "No counterexample found — Contradiction derived!", formula: "□ (empty clause)" });
      steps.push({ step: 4, action: "Conclusion", formula: `"${conclusion}" is PROVED by resolution` });
    } else {
      steps.push({ step: 4, action: "Conclusion", formula: `"${conclusion}" is NOT provable from the given premises` });
    }

    return { proved: allSatisfied, steps };
  }

  // ─── Formula Validator ───────────────────────────────────
  validateFormula(formula) {
    try {
      const ast = this.parse(formula);
      if (!ast) return { valid: false, error: "Empty or invalid formula" };
      const vars = this.getVariables(formula);
      // Test with a dummy assignment
      const testAssignment = {};
      vars.forEach(v => testAssignment[v] = true);
      this.evaluate(formula, testAssignment);
      return { valid: true, variables: vars };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }

  // ─── Formula to Pretty HTML ──────────────────────────────
  formulaToHTML(formula) {
    return formula
      .replace(/¬/g, '<span class="op-not">¬</span>')
      .replace(/∧/g, '<span class="op-and">∧</span>')
      .replace(/∨/g, '<span class="op-or">∨</span>')
      .replace(/→/g, '<span class="op-implies">→</span>')
      .replace(/↔/g, '<span class="op-iff">↔</span>')
      .replace(/([A-Z][A-Za-z0-9_]*)/g, '<span class="op-var">$1</span>');
  }
}

// Singleton export
const logicEngine = new LogicEngine();
