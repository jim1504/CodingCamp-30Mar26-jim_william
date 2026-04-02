// Mini Wallet app

// ─── Default categories ──────────────────────────────────────────────────────

const DEFAULT_CATEGORIES = [
  { id: 'cat-eat',       name: 'Eat',       balance: 0 },
  { id: 'cat-groceries', name: 'Groceries', balance: 0 },
  { id: 'cat-bill',      name: 'Bill',      balance: 0 },
];

// ─── Storage (localStorage with in-memory fallback) ─────────────────────────

const _memStore = {};
const _ls = (() => {
  try {
    localStorage.setItem('__mw_test__', '1');
    localStorage.removeItem('__mw_test__');
    return localStorage;
  } catch (e) {
    console.warn('mini-wallet: localStorage unavailable, using in-memory store');
    return {
      getItem:    (k) => Object.prototype.hasOwnProperty.call(_memStore, k) ? _memStore[k] : null,
      setItem:    (k, v) => { _memStore[k] = String(v); },
      removeItem: (k) => { delete _memStore[k]; },
    };
  }
})();

const Storage = {
  load() {
    let transactions = [];
    let categories   = null;
    let theme        = 'light';

    try {
      const r = _ls.getItem('mw_transactions');
      if (r !== null) transactions = JSON.parse(r);
    } catch (e) {
      console.warn('mini-wallet: bad mw_transactions, reset', e);
      _ls.setItem('mw_transactions', '[]');
    }

    try {
      const r = _ls.getItem('mw_categories');
      if (r !== null) categories = JSON.parse(r);
    } catch (e) {
      console.warn('mini-wallet: bad mw_categories, reset', e);
      _ls.setItem('mw_categories', '[]');
      categories = [];
    }

    if (categories === null) categories = DEFAULT_CATEGORIES.map(c => ({ ...c }));

    try {
      const r = _ls.getItem('mw_theme');
      if (r !== null) theme = JSON.parse(r);
    } catch (e) {
      console.warn('mini-wallet: bad mw_theme, reset', e);
      _ls.setItem('mw_theme', '"light"');
    }

    return { transactions, categories, theme };
  },

  save(state) {
    try {
      _ls.setItem('mw_transactions', JSON.stringify(state.transactions));
      _ls.setItem('mw_categories',   JSON.stringify(state.categories));
      _ls.setItem('mw_theme',        JSON.stringify(state.theme));
    } catch (e) {
      Storage._showSaveBanner();
    }
  },

  _showSaveBanner() {
    let b = document.getElementById('save-banner');
    if (!b) {
      b = document.createElement('div');
      b.id = 'save-banner';
      b.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#c0392b;color:#fff;text-align:center;padding:10px;z-index:9999;font-size:14px;';
      document.body.appendChild(b);
    }
    b.textContent = 'Could not save data \u2014 changes may be lost.';
    b.style.display = 'block';
    setTimeout(() => { b.style.display = 'none'; }, 4000);
  },
};

// ─── State ──────────────────────────────────────────────────────────────────

const State = { transactions: [], categories: [], theme: 'light' };

// ─── Formatters ─────────────────────────────────────────────────────────────

function formatAmount(n) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
}
function parseAmount(str) {
  return Number(String(str).replace(/,/g, ''));
}
function formatDate(isoStr) {
  if (!isoStr) return '—';
  // Handle both YYYY-MM-DD and YYYY-MM
  const parts = isoStr.split('-');
  if (parts.length === 2) {
    // Budget month: YYYY-MM
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  }
  const d = new Date(isoStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── Balance Engine ─────────────────────────────────────────────────────────

function computeBalances(transactions) {
  const m = new Map();
  for (const t of transactions) {
    const cur = m.get(t.categoryId) || 0;
    if (t.type === 'income')       m.set(t.categoryId, cur + t.amount);
    else if (t.type === 'expense') m.set(t.categoryId, cur - t.amount);
  }
  return m;
}
function computeTotalBalance(transactions) {
  let total = 0;
  for (const v of computeBalances(transactions).values()) total += v;
  return total;
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

function showTab(name) {
  document.querySelectorAll('[data-tab]').forEach(s => {
    s.style.display = s.dataset.tab === name ? 'block' : 'none';
  });
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

let _dashboardChart = null;
let _dashboardMonth = null;

function _getCurrentYearMonth() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
}
function _prevMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function renderDashboardChart(monthTxns) {
  const canvas = document.getElementById('dashboard-chart');
  if (!canvas) return;
  if (typeof window.Chart === 'undefined') {
    canvas.parentNode.innerHTML = '<p>Chart unavailable.</p>';
    return;
  }

  const byCategory = new Map();
  for (const t of monthTxns) {
    if (t.type === 'expense')
      byCategory.set(t.categoryId, (byCategory.get(t.categoryId) || 0) + t.amount);
  }

  const labels = [], data = [], colors = [];
  for (const [id, spent] of byCategory) {
    const cat = State.categories.find(c => c.id === id);
    labels.push(cat ? cat.name : id);
    data.push(spent);
    colors.push(null);
  }

  if (_dashboardChart) { _dashboardChart.destroy(); _dashboardChart = null; }
  if (!data.length) return;

  _dashboardChart = new window.Chart(canvas, {
    type: 'pie',
    data: { labels, datasets: [{ data, borderWidth: 1 }] },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } },
    },
  });
}

function renderDashboard() {
  const month = _dashboardMonth || _getCurrentYearMonth();
  const fi = document.getElementById('dashboard-month');
  if (fi) fi.value = month;

  document.getElementById('total-balance').textContent =
    formatAmount(computeTotalBalance(State.transactions));

  // Balance diff
  const diffEl   = document.getElementById('balance-diff');
  const monthTxns = State.transactions.filter(t => t.date && t.date.startsWith(month));
  const prevTxns  = State.transactions.filter(t => t.date && t.date.startsWith(_prevMonth(month)));
  if (monthTxns.length > 0 && prevTxns.length > 0) {
    const net = arr => arr.reduce((s, t) =>
      s + (t.type === 'income' ? t.amount : t.type === 'expense' ? -t.amount : 0), 0);
    const diff = net(monthTxns) - net(prevTxns);
    diffEl.textContent = `${diff >= 0 ? '+' : ''}${formatAmount(diff)} vs last month`;
    diffEl.className   = diff >= 0 ? 'positive' : 'negative';
    diffEl.classList.remove('hidden');
  } else {
    diffEl.classList.add('hidden');
  }

  // Recent transactions list
  const sorted = State.transactions.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const container = document.getElementById('recent-transactions');
  const ul = document.createElement('ul');
  sorted.slice(0, 10).forEach(txn => {
    const li = document.createElement('li');
    const cat = State.categories.find(c => c.id === txn.categoryId);
    const label = txn.type === 'income'
      ? (cat ? cat.name : 'Income')
      : (txn.itemName || (cat ? cat.name : '—'));
    li.textContent = `${formatDate(txn.date)} \u2014 ${label} (${txn.type}): ${formatAmount(txn.amount)}`;
    ul.appendChild(li);
  });

  container.innerHTML = '';
  container.appendChild(ul);

  // Show "show more" only when > 10 transactions
  if (State.transactions.length > 1) {
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = 'show more';
    a.addEventListener('click', e => {
      e.preventDefault();
      renderTransactionList(_currentMonth);
      showTab('list');
    });
    container.appendChild(a);
  }

  renderDashboardChart(monthTxns);
}

// ─── Input Form ──────────────────────────────────────────────────────────────

function _populateCategorySelect(selectEl, selectedId) {
  selectEl.innerHTML = '';
  for (const cat of State.categories) {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.name;
    if (selectedId && cat.id === selectedId) opt.selected = true;
    selectEl.appendChild(opt);
  }
  // "Other" option — only on the main category select
  if (selectEl.id === 'txn-category') {
    const o = document.createElement('option');
    o.value = '__other__';
    o.textContent = 'Other';
    selectEl.appendChild(o);
    // Reset the custom-name input
    const f = document.getElementById('field-new-category');
    if (f) f.classList.add('hidden');
    const i = document.getElementById('new-category-name');
    if (i) i.value = '';
  }
}

function _show(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}
function _hide(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

function openForm(type, txn) {
  document.getElementById('form-title').textContent = txn
    ? (type === 'income' ? 'Edit Income' : 'Edit Expense')
    : (type === 'income' ? 'Add Income'  : 'Add Expense');

  document.getElementById('form-type').value    = type;
  document.getElementById('form-edit-id').value = txn ? txn.id : '';

  // Show/hide date fields based on type
  if (type === 'income') {
    _show('field-budget-month');
    _hide('field-date');
    _hide('field-item-name');   // income has no item name
  } else {
    _hide('field-budget-month');
    _show('field-date');
    _show('field-item-name');   // expense needs item name
  }

  _show('field-category');
  _show('field-amount');
  _show('field-description');
  _hide('field-txn-id');

  _populateCategorySelect(document.getElementById('txn-category'), txn ? txn.categoryId : null);

  // Pre-fill or clear
  if (txn) {
    if (type === 'income') {
      document.getElementById('txn-budget-month').value = txn.date || '';
    } else {
      document.getElementById('txn-date').value  = txn.date || '';
      document.getElementById('txn-item-name').value = txn.itemName || '';
    }
    document.getElementById('txn-amount-display').value = txn.amount != null ? formatAmount(txn.amount) : '';
    document.getElementById('txn-amount-raw').value     = txn.amount != null ? txn.amount : '';
    document.getElementById('txn-description').value    = txn.description || '';
  } else {
    document.getElementById('txn-budget-month').value   = '';
    document.getElementById('txn-date').value           = '';
    document.getElementById('txn-item-name').value      = '';
    document.getElementById('txn-amount-display').value = '';
    document.getElementById('txn-amount-raw').value     = '';
    document.getElementById('txn-description').value    = '';
  }

  showTab('form');
}

function validateForm(type, data) {
  document.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; });
  const errors = [];

  function setError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
    errors.push(msg);
  }

  // Item Name — required for expense only
  if (type === 'expense') {
    if (!data.itemName || !data.itemName.trim())
      setError('err-item-name', 'This field is required');
  }

  // Category — required; if "Other" chosen, name must be filled
  if (!data.categoryId) {
    setError('err-category', 'This field is required');
  } else if (data.categoryId === '__other__') {
    if (!data.newCategoryName || !data.newCategoryName.trim())
      setError('err-category', 'Please enter a category name');
  }

  // Amount — required and > 0
  if (data.amount == null || data.amount === '' || isNaN(Number(data.amount))) {
    setError('err-amount', 'This field is required');
  } else if (Number(data.amount) <= 0) {
    setError('err-amount', 'Amount must be greater than zero');
  }

  return errors;
}

function submitForm() {
  const type   = document.getElementById('form-type').value;
  const editId = document.getElementById('form-edit-id').value;

  // Date: income uses budget-month, expense uses date
  const dateVal = type === 'income'
    ? document.getElementById('txn-budget-month').value
    : document.getElementById('txn-date').value;

  const data = {
    date:            dateVal,
    itemName:        type === 'income' ? '' : (document.getElementById('txn-item-name').value || '').trim(),
    categoryId:      document.getElementById('txn-category').value,
    newCategoryName: (document.getElementById('new-category-name').value || '').trim(),
    amount:          document.getElementById('txn-amount-raw').value,
    description:     (document.getElementById('txn-description').value || '').trim(),
  };

  const errors = validateForm(type, data);
  if (errors.length > 0) return;

  // Create new category when "Other" is chosen
  if (data.categoryId === '__other__') {
    const newCat = { id: crypto.randomUUID(), name: data.newCategoryName, balance: 0 };
    State.categories.push(newCat);
    data.categoryId = newCat.id;
  }

  const txn = {
    id:          editId || crypto.randomUUID(),
    type,
    date:        data.date,
    itemName:    data.itemName,
    categoryId:  data.categoryId,
    amount:      Number(data.amount),
    description: data.description,
  };

  if (editId) {
    const idx = State.transactions.findIndex(t => t.id === editId);
    if (idx !== -1) State.transactions[idx] = txn;
    else State.transactions.push(txn);
    const bal = computeBalances(State.transactions);
    State.categories = State.categories.map(c => ({ ...c, balance: bal.get(c.id) || 0 }));
  } else {
    State.transactions.push(txn);
  }

  Storage.save(State);
  renderDashboard();
  showTab('dashboard');
}

// ─── Transaction List ────────────────────────────────────────────────────────

let _currentMonth = null;
let _listChart    = null;

function renderListChart(transactions) {
  const canvas = document.getElementById('list-chart');
  if (!canvas) return;
  if (typeof window.Chart === 'undefined') {
    canvas.parentNode.innerHTML = '<p>Chart unavailable.</p>';
    return;
  }

  const byCategory = new Map();
  for (const t of transactions) {
    if (t.type === 'expense')
      byCategory.set(t.categoryId, (byCategory.get(t.categoryId) || 0) + t.amount);
  }

  const labels = [], data = [], labelColors = [];
  const balances = computeBalances(State.transactions);
  for (const [id, spent] of byCategory) {
    const cat = State.categories.find(c => c.id === id);
    labels.push(cat ? cat.name : id);
    data.push(spent);
    labelColors.push(spent > (balances.get(id) || 0) ? '#cc0000' : null);
  }

  if (_listChart) { _listChart.destroy(); _listChart = null; }
  if (!data.length) return;

  _listChart = new window.Chart(canvas, {
    type: 'pie',
    data: { labels, datasets: [{ data, borderWidth: 1 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            font: { family: "'EB Garamond', Georgia, serif", size: 13 },
            padding: 14,
            // Use category names as legend labels (already set via labels array)
            generateLabels(chart) {
              const items = window.Chart.defaults.plugins.legend.labels.generateLabels(chart);
              items.forEach((item, i) => {
                if (labelColors[i]) {
                  item.fontColor = labelColors[i];
                  item.font = { weight: 'bold' };
                }
              });
              return items;
            },
          },
        },
        tooltip: {
          callbacks: {
            label(ctx) { return ` ${ctx.label}: ${formatAmount(ctx.parsed)}`; },
          },
        },
      },
    },
  });
}

function renderTransactionList(month) {
  if (!month) month = _getCurrentYearMonth();
  _currentMonth = month;

  const sel = document.getElementById('month-selector');
  if (sel) sel.value = month;

  const filtered = State.transactions
    .filter(t => t.date && t.date.startsWith(month))
    .slice()
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const table = document.getElementById('txn-table');
  if (!table) return;

  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Date</th><th>Item</th><th>Amount</th><th>Category</th><th>Type</th><th>Actions</th></tr>';

  const tbody = document.createElement('tbody');
  for (const txn of filtered) {
    const cat = State.categories.find(c => c.id === txn.categoryId);
    const itemLabel = txn.type === 'income' ? (cat ? cat.name : '—') : (txn.itemName || '—');
    const tr  = document.createElement('tr');
    [
      formatDate(txn.date),
      itemLabel,
      formatAmount(txn.amount),
      cat ? cat.name : '\u2014',
      txn.type.charAt(0).toUpperCase() + txn.type.slice(1),
    ].forEach(text => {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    });

    const tdA = document.createElement('td');
    ['edit', 'delete'].forEach(action => {
      const btn = document.createElement('button');
      btn.textContent    = action.charAt(0).toUpperCase() + action.slice(1);
      btn.dataset.txnId  = txn.id;
      btn.dataset.action = action;
      tdA.appendChild(btn);
    });
    tr.appendChild(tdA);
    tbody.appendChild(tr);
  }

  table.innerHTML = '';
  table.appendChild(thead);
  table.appendChild(tbody);
  renderListChart(filtered);
}

// ─── App Initialization ─────────────────────────────────────────────────────

function initApp() {
  const saved = Storage.load();
  State.transactions = saved.transactions;
  State.categories   = saved.categories;
  State.theme        = saved.theme;
  document.documentElement.setAttribute('data-theme', State.theme);
  renderDashboard();
  showTab('dashboard');
}

document.addEventListener('DOMContentLoaded', initApp);

// ─── Events ──────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Theme toggle
  document.getElementById('theme-toggle').addEventListener('click', () => {
    State.theme = State.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', State.theme);
    Storage.save(State);
  });

  // Dashboard month filter
  document.getElementById('dashboard-month').addEventListener('change', function () {
    _dashboardMonth = this.value || null;
    renderDashboard();
  });

  // Transaction list month filter
  document.getElementById('month-selector').addEventListener('change', function () {
    renderTransactionList(this.value);
  });

  // Income / Expense buttons
  document.getElementById('btn-income').addEventListener('click',  () => openForm('income'));
  document.getElementById('btn-expense').addEventListener('click', () => openForm('expense'));

  // Form cancel
  document.getElementById('btn-cancel-form').addEventListener('click', () => showTab('dashboard'));

  // Form submit
  document.getElementById('txn-form').addEventListener('submit', e => {
    e.preventDefault();
    submitForm();
  });

  // Real-time amount formatting
  document.getElementById('txn-amount-display').addEventListener('keyup', function () {
    const raw = parseAmount(this.value);
    document.getElementById('txn-amount-raw').value = isNaN(raw) ? '' : raw;
    this.value = raw ? formatAmount(raw) : this.value;
  });

  // Show/hide "Other" text input — single listener
  document.getElementById('txn-category').addEventListener('change', function () {
    const field = document.getElementById('field-new-category');
    const input = document.getElementById('new-category-name');
    if (this.value === '__other__') {
      field.classList.remove('hidden');
      input.focus();
    } else {
      field.classList.add('hidden');
      input.value = '';
    }
  });

  // Back button
  document.getElementById('btn-back-dashboard').addEventListener('click', () => showTab('dashboard'));

  // Edit / Delete delegation
  document.getElementById('txn-table').addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const { txnId, action } = btn.dataset;
    if (action === 'edit') {
      const txn = State.transactions.find(t => t.id === txnId);
      if (txn) openForm(txn.type, txn);
    } else if (action === 'delete') {
      State.transactions = State.transactions.filter(t => t.id !== txnId);
      const bal = computeBalances(State.transactions);
      State.categories = State.categories.map(c => ({ ...c, balance: bal.get(c.id) || 0 }));
      Storage.save(State);
      renderDashboard();
      renderTransactionList(_currentMonth);
    }
  });
});

// ─── Exports ─────────────────────────────────────────────────────────────────

if (typeof module !== 'undefined') {
  module.exports = { Storage, State, initApp, formatAmount, parseAmount, formatDate,
    computeBalances, computeTotalBalance, showTab, renderDashboard, openForm,
    validateForm, submitForm, renderTransactionList, renderListChart };
}
