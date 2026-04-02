# Implementation Plan: Mini Wallet

## Overview

Implement a fully client-side personal finance tracker as three static files (`index.html`, `css/style.css`, `js/app.js`). Tasks are ordered so each step builds on the previous one.

## Tasks

- [x] 1. Project scaffold — index.html and file structure
  - Create `index.html` with semantic shell: `<html data-theme="light">`, `<head>` with Chart.js CDN, EB Garamond Google Font, and wallet `favicon.svg`, `<nav>` with app name (`#app-name`) and theme toggle button (`#theme-toggle`) with SVG sun/moon icons (30×30 px), and three `<section>` elements with `data-tab` attributes (`dashboard`, `form`, `list`)
  - Dashboard section includes `#balance-card` with `#balance-label` ("TOTAL BALANCE") above `#total-balance`
  - Add `<link>` for `css/style.css` and `<script src="js/app.js" defer>`
  - _Requirements: 1.1, 1.5, 15.1_

- [x] 2. CSS — theming, layout, and component styles
  - [x] 2.1 Define CSS custom properties and theming
    - Write `:root` fallback variables, `[data-theme="light"]` and `[data-theme="dark"]` color sets (`--bg`, `--text`, `--card-bg`, `--accent`, `--error`)
    - Import EB Garamond from Google Fonts; apply to `body`, form elements, and table
    - Sun/moon icon visibility: moon shown in light mode, sun shown in dark mode
    - _Requirements: 15.2_
  - [x] 2.2 Implement responsive layout and tab styles
    - Write base layout (single column), tab nav styles with `.active` class, balance card styles, and a `768px` breakpoint that switches to two-column desktop grid
    - Add `overflow-y: auto; max-height: 300px` on `#recent-transactions` for mobile
    - _Requirements: 1.3, 9.4, 16.4_
  - [x] 2.3 Write form, table, and utility styles
    - Style `#txn-form` fields, `.field-error` inline error messages, `#txn-table` columns, and `.hidden` utility class
    - _Requirements: 4.5, 5.5, 6.5, 12.1_

- [x] 3. Storage module
  - Implement `Storage` object in `js/app.js` with `load()` and `save(state)` methods
  - `load()` reads `mw_transactions`, `mw_categories`, `mw_theme` from `localStorage` with `try/catch`; on JSON parse failure reset that key to its empty default and log a console warning
  - `save(state)` writes all three keys; on write failure show a non-blocking banner "Could not save data — changes may be lost."
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. State module and app initialization
  - Define in-memory `State` object `{ transactions: [], categories: [], theme: 'light' }`
  - Implement `initApp()` called at `DOMContentLoaded`: call `Storage.load()`, populate `State`, apply `data-theme` to `<html>`, then call `renderDashboard()` and `showTab('dashboard')`
  - _Requirements: 2.3, 15.4_

- [x] 5. Formatters
  - Implement `formatAmount(n)` using `Intl.NumberFormat` (no decimal places, thousand separator)
  - Implement `parseAmount(str)` that strips commas and returns a `number`
  - Implement `formatDate(isoStr)` that returns a locale-friendly display string
  - _Requirements: 14.1, 14.2, 14.3_

- [x] 6. Balance engine
  - Implement `computeBalances(transactions)` → `Map<categoryId, number>` by replaying the transaction log (income adds, expense subtracts; transfers are not in the log)
  - Implement `computeTotalBalance(transactions)` → `number` as the sum of all category balances from `computeBalances`
  - _Requirements: 8.2, 13.3, 13.5_

- [x] 7. Tab navigation
  - Implement `showTab(name)` that sets `display: block` on the matching `[data-tab]` section and `display: none` on the others, and toggles `.active` on nav buttons
  - Wire `click` listeners on the three nav buttons in the `Events` section
  - _Requirements: 1.1, 1.2_

- [x] 8. Dashboard rendering
  - Implement `renderDashboard()`: compute total balance via `computeTotalBalance`, update `#total-balance` with `formatAmount`, render last 10 transactions (reverse chronological) into `#recent-transactions` as a `<ul>`, and add a "show more" link that calls `showTab('list')`
  - Wire `#btn-income`, `#btn-expense`, `#btn-transfer` click handlers to call `openForm(type)`
  - _Requirements: 8.1, 8.2, 8.3, 9.1, 9.2, 9.3_

- [x] 9. Dashboard pie chart
  - Implement `renderDashboardChart(monthTransactions)` using Chart.js: aggregate expense amounts by `categoryId` for the current calendar month, render a pie chart on `#dashboard-chart`
  - Bold-red label for any category whose monthly spending exceeds its balance (over-budget highlight)
  - If `window.Chart` is undefined, replace the canvas with a `<p>Chart unavailable.</p>` fallback
  - Call `renderDashboardChart` from `renderDashboard`
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 10. Input Form — rendering and field show/hide
  - Implement `openForm(type, txn?)` in `js/app.js`: set form title, show/hide fields per the design matrix (Transaction ID, Date, Item Name, Budget Category, Source/Destination Category, Amount, Description), populate category `<select>` elements from `State.categories`, call `showTab('form')`
  - If `txn` is provided (edit mode), pre-fill all fields from the transaction object
  - Display the auto-generated `Transaction_ID` in a read-only field for income/expense forms
  - _Requirements: 4.1, 4.2, 5.1, 5.2, 6.1, 6.2, 3.3, 13.2_

- [x] 11. Real-time amount formatting on input
  - Add a `keyup` listener on the amount input field that calls `formatAmount(parseAmount(value))` and writes the result back to the field's display value, keeping a hidden numeric field (`#amount-raw`) for the actual stored value
  - _Requirements: 14.3_

- [x] 12. Form validation
  - Implement `validateForm(type, data)` → `string[]` (array of error messages)
  - Check required fields (Date, Item Name, Category, Amount for income/expense; Source, Destination, Amount, Date for transfer)
  - Check Amount > 0
  - Check source ≠ destination for transfers
  - Display inline `.field-error` messages adjacent to each offending field; clear all errors before each validation pass
  - _Requirements: 4.3, 4.5, 5.3, 5.5, 6.3, 6.5, 6.6_

- [x] 13. Form submission — income and expense
  - Implement `submitForm()`: read form type, call `validateForm`, on success build a `Transaction` object with `crypto.randomUUID()` as `id`, push to `State.transactions`, call `Storage.save(State)`, call `renderDashboard()`, call `showTab('dashboard')`
  - For edit mode: find the existing transaction by ID, replace it in `State.transactions`, re-derive category balances
  - _Requirements: 3.1, 3.2, 4.4, 5.4, 13.3_

- [x] 14. Custom category creation
  - In the Income form, detect when the user types a value not in the existing category list and add a "Create new category" option
  - On form submission with a new category name, create a `Category` object with `crypto.randomUUID()` as `id`, push to `State.categories`, persist via `Storage.save(State)`
  - Refresh all category `<select>` elements after creation
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 15. Transfer handling
  - In `submitForm()` for type `'transfer'`: validate source ≠ destination and required fields, then directly adjust `State.categories` balances (deduct from source, add to destination) without creating a transaction log entry, persist, re-render dashboard
  - _Requirements: 6.4, 6.5, 6.6_

- [x] 16. Checkpoint — core data flow complete
  - Verify the app loads, tabs switch, income/expense/transfer flows work end-to-end in the browser.

- [x] 17. Transaction List rendering
  - Implement `renderTransactionList(month)` where `month` is `'YYYY-MM'`
  - Render `<input type="month" id="month-selector">` defaulting to the current month
  - Filter `State.transactions` to the selected month, sort reverse chronological, render into `#txn-table` with columns: Date, Item, Amount, Category, Type, Actions (Edit / Delete buttons per row)
  - Wire `change` listener on `#month-selector` to re-call `renderTransactionList`
  - _Requirements: 11.1, 11.2, 12.1, 12.2, 12.3, 13.1, 13.4_

- [x] 18. Transaction List pie chart
  - Implement `renderListChart(transactions)` using Chart.js (same pattern as dashboard chart) rendered on `#list-chart`
  - Call `renderListChart` from `renderTransactionList` with the filtered transaction set
  - Apply the same Chart.js unavailable fallback
  - _Requirements: 11.3_

- [x] 19. Edit and delete transactions
  - Wire Edit button per row: call `openForm('income' | 'expense', txn)` with the matching transaction object
  - Wire Delete button per row: remove the transaction from `State.transactions`, call `Storage.save(State)`, call `renderDashboard()`, call `renderTransactionList(currentMonth)`
  - _Requirements: 13.2, 13.3, 13.4, 13.5, 13.6_

- [x] 20. Dark/light mode toggle
  - Add a `#theme-toggle` button to `index.html`
  - Implement toggle handler: flip `data-theme` on `<html>` between `"light"` and `"dark"`, update `State.theme`, call `Storage.save(State)`
  - On `initApp()`, restore theme from `State.theme`
  - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [x] 21. Error handling — localStorage failure banners and corrupt data reset
  - Verify `Storage.load()` resets corrupt keys to defaults and logs a console warning
  - Verify `Storage.save()` shows the "Could not save data" banner on write failure
  - _Requirements: 2.4_

- [x] 22. Final checkpoint — full app review
  - Open the app in a browser and verify all tabs, forms, charts, theme toggle, and persistence work correctly end-to-end.

## Notes

- Each task references specific requirements for traceability
- Transfers are silent balance adjustments — no transaction log entry (confirmed in design)
