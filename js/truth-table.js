// ============================================================
// truth-table.js — Truth Table Generator & Renderer
// ============================================================

class TruthTableManager {
  constructor() {
    this.currentTable = null;
    this.currentFormula = '';
  }

  // ─── Generate & Render ───────────────────────────────────
  generate(formula, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!formula.trim()) {
      container.innerHTML = `<div class="tt-empty">Enter a formula above to generate its truth table</div>`;
      return;
    }

    const table = logicEngine.generateTruthTable(formula);

    if (!table) {
      container.innerHTML = `<div class="tt-error">⚠️ Could not parse formula. Check syntax.</div>`;
      return;
    }

    if (table.error) {
      container.innerHTML = `<div class="tt-error">⚠️ ${table.error}</div>`;
      return;
    }

    this.currentTable = table;
    this.currentFormula = formula;

    const trueCount  = table.rows.filter(r => r.result === true).length;
    const falseCount = table.rows.filter(r => r.result === false).length;
    const isTautology    = falseCount === 0;
    const isContradiction = trueCount === 0;
    const isContingent   = !isTautology && !isContradiction;

    const formulaType = isTautology ? 'Tautology ✓' : isContradiction ? 'Contradiction ✗' : 'Contingent';
    const typeClass   = isTautology ? 'type-tautology' : isContradiction ? 'type-contradiction' : 'type-contingent';

    let html = `
      <div class="tt-header-info">
        <div class="tt-formula-display">${logicEngine.formulaToHTML(formula)}</div>
        <div class="tt-meta">
          <span class="tt-type-badge ${typeClass}">${formulaType}</span>
          <span class="tt-stat">✅ ${trueCount} TRUE</span>
          <span class="tt-stat">❌ ${falseCount} FALSE</span>
          <span class="tt-stat">📊 ${table.rows.length} rows</span>
        </div>
      </div>
      <div class="tt-table-wrapper">
        <table class="truth-table">
          <thead>
            <tr>
              <th class="row-num">#</th>
              ${table.vars.map(v => `<th class="var-col">${v}</th>`).join('')}
              <th class="result-col">${this._escapeHTML(formula)}</th>
            </tr>
          </thead>
          <tbody>
            ${table.rows.map((row, idx) => `
              <tr class="${row.result ? 'row-true' : 'row-false'}">
                <td class="row-num">${idx + 1}</td>
                ${table.vars.map(v => `<td class="val-cell">${row.assignment[v] ? '<span class="t-val">T</span>' : '<span class="f-val">F</span>'}</td>`).join('')}
                <td class="result-cell ${row.result ? 'res-true' : 'res-false'}">
                  ${row.result ? '<span class="t-val large">T</span>' : '<span class="f-val large">F</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // CNF section
    const cnf = logicEngine.toCNF(formula);
    html += `
      <div class="tt-cnf-section">
        <h4>📐 Conjunctive Normal Form (CNF)</h4>
        <div class="cnf-formula">${logicEngine.formulaToHTML(cnf)}</div>
      </div>
    `;

    container.innerHTML = html;
    this._addRowAnimations(container);
  }

  // ─── Resolution Proof ────────────────────────────────────
  renderResolutionProof(premises, conclusion, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const result = logicEngine.proveByResolution(premises, conclusion);

    let html = `
      <div class="proof-header">
        <div class="proof-title">Resolution Proof</div>
        <div class="proof-verdict ${result.proved ? 'verdict-proved' : 'verdict-failed'}">
          ${result.proved ? '✅ PROVED' : '❌ NOT PROVABLE'}
        </div>
      </div>
      <div class="proof-premises">
        <strong>Premises:</strong> ${premises.map(p => `<code>${p}</code>`).join(', ')}
      </div>
      <div class="proof-conclusion-line">
        <strong>Conclusion:</strong> <code>${conclusion}</code>
      </div>
      <div class="proof-steps">
        ${result.steps.map(s => `
          <div class="proof-step">
            <span class="step-num">${s.step}</span>
            <div class="step-content">
              <div class="step-action">${s.action}</div>
              <div class="step-formula"><code>${s.formula}</code></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  // ─── Compound Formula Comparison ─────────────────────────
  compareFormulas(formula1, formula2, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const t1 = logicEngine.generateTruthTable(formula1);
    const t2 = logicEngine.generateTruthTable(formula2);

    if (!t1 || t1.error || !t2 || t2.error) {
      container.innerHTML = '<div class="tt-error">Invalid formulas for comparison.</div>';
      return;
    }

    // Merge variables
    const allVars = [...new Set([...t1.vars, ...t2.vars])].sort();

    if (allVars.length > 6) {
      container.innerHTML = '<div class="tt-error">Too many variables for comparison (max 6).</div>';
      return;
    }

    const rows = [];
    const total = Math.pow(2, allVars.length);
    for (let i = 0; i < total; i++) {
      const assignment = {};
      allVars.forEach((v, idx) => {
        assignment[v] = Boolean((i >> (allVars.length - 1 - idx)) & 1);
      });
      const r1 = logicEngine.evaluate(formula1, assignment);
      const r2 = logicEngine.evaluate(formula2, assignment);
      rows.push({ assignment, r1, r2, equivalent: r1 === r2 });
    }

    const equivalent = rows.every(r => r.equivalent);

    let html = `
      <div class="compare-header">
        <span class="compare-badge ${equivalent ? 'equiv-yes' : 'equiv-no'}">
          ${equivalent ? '≡ Logically Equivalent' : '≢ Not Equivalent'}
        </span>
      </div>
      <div class="tt-table-wrapper">
        <table class="truth-table">
          <thead>
            <tr>
              <th>#</th>
              ${allVars.map(v => `<th>${v}</th>`).join('')}
              <th class="f1-col">${this._escapeHTML(formula1)}</th>
              <th class="f2-col">${this._escapeHTML(formula2)}</th>
              <th>≡</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row, idx) => `
              <tr class="${row.equivalent ? '' : 'row-mismatch'}">
                <td>${idx + 1}</td>
                ${allVars.map(v => `<td>${row.assignment[v] ? '<span class="t-val">T</span>' : '<span class="f-val">F</span>'}</td>`).join('')}
                <td class="${row.r1 ? 'res-true' : 'res-false'}">${row.r1 ? '<span class="t-val">T</span>' : '<span class="f-val">F</span>'}</td>
                <td class="${row.r2 ? 'res-true' : 'res-false'}">${row.r2 ? '<span class="t-val">T</span>' : '<span class="f-val">F</span>'}</td>
                <td>${row.equivalent ? '✓' : '✗'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  }

  // ─── Export Table ────────────────────────────────────────
  exportCSV() {
    if (!this.currentTable) return;
    const { vars, rows, formula } = this.currentTable;
    let csv = [...vars, formula].join(',') + '\n';
    rows.forEach(row => {
      const vals = vars.map(v => row.assignment[v] ? '1' : '0');
      vals.push(row.result ? '1' : '0');
      csv += vals.join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `truth_table_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Helpers ─────────────────────────────────────────────
  _escapeHTML(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  _addRowAnimations(container) {
    const rows = container.querySelectorAll('tbody tr');
    rows.forEach((row, idx) => {
      row.style.opacity = '0';
      row.style.transform = 'translateX(-10px)';
      setTimeout(() => {
        row.style.transition = 'all 0.2s ease';
        row.style.opacity = '1';
        row.style.transform = 'translateX(0)';
      }, idx * 30);
    });
  }
}

const truthTableManager = new TruthTableManager();
