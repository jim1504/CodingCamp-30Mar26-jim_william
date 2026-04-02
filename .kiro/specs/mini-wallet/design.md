# Design Document: Mini Wallet

## Overview

Mini Wallet is a fully client-side personal finance tracker built with HTML5, CSS, and Vanilla JavaScript. There is no build step, no framework, and no backend — the app is a single `index.html` loading one stylesheet and one script. All state lives in the browser's `localStorage`.

The app has three tabs:
- **Dashboard** — total balance, recent 10 transactions, action buttons, monthly spending pie chart
- **Input Form** — unified form for Income, Expense, and Transfer entry/editing
- **Transaction List** — month-filtered full history table with per-row edit/delete and a monthly pie chart

Transfers are treated as **silent balance adjustments**: they move funds between budget categories but produce no transaction log entry. This keeps the transaction list clean and avoids the complexity of displaying/editing paired transfer records.

Chart.js is loaded from CDN and used for all pie charts.

---

## Architecture

The entire app is a single-page application driven by one JavaScript module (`js/app.js`). There is no routing library — tab switching is pure DOM show/hide. All persistence is through a thin `Storage` wrapper around `localStorage`.

```
index.html
├── css/
│   └── style.css          (all styles, CSS variables for theming)
└── js/
    └── app.js             (all logic: state, storage, rendering, event handling)
```

### Module Responsibilities (logical sections inside app.js)

```
app.js
├── Storage       — read/write localStorage keys
├── State         — in-memory app state (transactions, categories, theme)
├── Formatters    — amount formatting, date helpers
├── Balance       — recalculate category balances from transaction log
├── Tabs          — tab switching logic
├── Dashboard     — render balance, recent list, pie chart
├── Form          — render/populate/validate Income/Expense/Transfer form
├── TransactionList — render table, month selector, pie chart
└── Events        — all event listeners wired at DOMContentLoaded
```

### Data Flow

```
User Action
    │
    ▼
Event Handler (Events)
    │
    ├─► State mutation
    │       │
    │       ▼
    │   Storage.save()  ──► localStorage
    │
    └─► Re-render affected UI sections
```

---

## Components and Interfaces

### Tab Navigation

Three `<section>` elements with `data-tab` attributes. The `<nav>` contains the app name on the left and a theme toggle button on the right (SVG sun/moon icons, 30×30 px). There are no tab navigation buttons — the app opens on the Dashboard and users navigate via in-app links (e.g. "show more" → Transaction List, action buttons → Form). Switching tabs calls `showTab(tabName)` which toggles section visibility.

```
showTab(name: 'dashboard' | 'form' | 'list'): void
```

### Dashboard Component

Renders into `#dashboard`:
- `#balance-label` — "TOTAL BALANCE" label above the balance figure
- `#total-balance` — formatted total balance (inside `#balance-card`)
- `#recent-transactions` — `<ul>` of last 10 transactions
- `#dashboard-chart` — Chart.js canvas
- Three action buttons: `#btn-income` (Income), `#btn-expense` (Expenses), `#btn-transfer` (Transfer)

```
renderDashboard(): void
renderDashboardChart(monthTransactions: Transaction[]): void
```

### Input Form Component

A single `<form id="txn-form">` that morphs based on transaction type. Fields shown/hidden via CSS classes:

| Field | Income | Expense | Transfer |
|---|---|---|---|
| Transaction ID (read-only) | ✓ | ✓ | — |
| Date | ✓ | ✓ | ✓ |
| Item Name | ✓ | ✓ | — |
| Budget Category | ✓ | ✓ | — |
| Source Category | — | — | ✓ |
| Destination Category | — | — | ✓ |
| Amount | ✓ | ✓ | ✓ |
| Description | ✓ | ✓ | ✓ |

```
openForm(type: 'income' | 'expense' | 'transfer', txn?: Transaction): void
validateForm(type: string, data: FormData): string[]   // returns error messages
submitForm(): void
```

### Transaction List Component

Renders into `#transaction-list`:
- `#month-selector` — `<input type="month">`
- `#list-chart` — Chart.js canvas
- `#txn-table` — `<table>` with columns: Date, Item, Amount, Category, Type, Actions

```
renderTransactionList(month: string): void   // month = 'YYYY-MM'
renderListChart(transactions: Transaction[]): void
```

### Storage Interface

```javascript
Storage = {
  load():   { transactions: Transaction[], categories: Category[], theme: string }
  save(state): void
  // Keys: 'mw_transactions', 'mw_categories', 'mw_theme'
}
```

### Balance Engine

Balances are **never stored directly** — they are always derived by replaying the transaction log. This ensures edits and deletes automatically produce correct balances.

```javascript
computeBalances(transactions: Transaction[]): Map<categoryId, number>
computeTotalBalance(transactions: Transaction[]): number
```

---

## Data Models

All data is serialized as JSON in `localStorage`.

### Transaction

```typescript
interface Transaction {
  id: string;           // UUID v4, e.g. "a1b2c3d4-..."
  type: 'income' | 'expense';
  date: string;         // ISO date "YYYY-MM-DD"
  itemName: string;
  categoryId: string;   // references Category.id
  amount: number;       // plain number, no formatting, always positive
  description: string;  // optional, empty string if not provided
}
```

Transfers are **not** stored as transactions. They are applied directly to category balances at submission time and are not logged.

> Rationale: The user confirmed transfers should be silent balance adjustments. Storing them would require special-casing them in balance recalculation, the transaction table, and edit/delete flows — all complexity with no benefit given the use case.

### Category

```typescript
interface Category {
  id: string;    // UUID v4
  name: string;  // user-visible label, e.g. "Food"
  balance: number; // current balance, updated on every transaction mutation
}
```

> Note: Category balance is stored for fast reads (dashboard total balance display) but is always re-derived from the transaction log on load and after any mutation to stay consistent.

### localStorage Keys

| Key | Value |
|---|---|
| `mw_transactions` | `Transaction[]` serialized as JSON |
| `mw_categories` | `Category[]` serialized as JSON |
| `mw_theme` | `"light"` or `"dark"` |

### ID Generation

Transaction and Category IDs use `crypto.randomUUID()` (available in all modern browsers). This guarantees global uniqueness without a counter.

### Amount Handling

- **Storage**: plain `number` (e.g. `1500000`)
- **Display**: formatted with `Intl.NumberFormat` (e.g. `"1,500,000"`)
- **Input**: user types digits; a `keyup` listener reformats the visible value while keeping a hidden numeric field for the actual value

### Typography and Theming

All text uses **EB Garamond** (Google Fonts). Colors are CSS custom properties under `[data-theme="light"]` and `[data-theme="dark"]`. The theme toggle button shows a moon icon in light mode and a sun icon in dark mode (SVG, 30×30 px), positioned at the right of the nav bar.

```css
:root { /* fallback / shared */ }
[data-theme="light"] { --bg: #ffffff; --text: #111111; ... }
[data-theme="dark"]  { --bg: #1a1a2e; --text: #e0e0e0; ... }
```

### Responsive Layout

A single CSS breakpoint at `768px` switches the layout from a two-column desktop grid to a single-column mobile stack. The recent transactions list on the Dashboard gets `overflow-y: auto; max-height: 300px` on mobile.

---

## Error Handling

### Validation Errors

All form validation errors are displayed inline, adjacent to the offending field. Submission is blocked until all errors are resolved. Error messages are cleared on each new submission attempt before re-validating.

| Condition | Error Message |
|---|---|
| Required field empty | "This field is required" |
| Amount is zero or negative | "Amount must be greater than zero" |
| Transfer: source = destination | "Source and destination must be different" |

### localStorage Errors

`localStorage` can throw in private browsing mode or when storage quota is exceeded. All `localStorage` reads/writes are wrapped in `try/catch`. On read failure, the app initializes with empty state and shows a non-blocking banner: "Could not load saved data." On write failure, the app shows a non-blocking banner: "Could not save data — changes may be lost."

### Chart.js Load Failure

If the Chart.js CDN script fails to load (e.g., offline), the chart canvas is replaced with a plain text message: "Chart unavailable." All other app functionality continues normally.

### Corrupt localStorage Data

On app load, if JSON parsing of any `localStorage` key fails, that key is reset to its empty default (`[]` for transactions/categories, `"light"` for theme). A console warning is logged.


