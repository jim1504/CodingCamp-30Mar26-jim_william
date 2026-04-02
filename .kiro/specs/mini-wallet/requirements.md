# Requirements Document

## Introduction

Mini Wallet is a client-side web application for personal expense and budget visualization. It allows users to track income, expenses, and budget categories through a clean three-tab interface. All data is persisted in the browser's Local Storage — no backend or server is required. The app is built with HTML5, CSS, and Vanilla JavaScript, and is compatible with modern browsers on both desktop and mobile.

---

## Glossary

- **App**: The Mini Wallet web application.
- **Transaction**: A single financial record of type Income, Expense, or Transfer.
- **Income**: A transaction that adds funds to a budget category (triggered by the "+" button).
- **Expense**: A transaction that deducts funds from a budget category (triggered by the "-" button).
- **Transfer**: A movement of balance from one budget category to another.
- **Budget_Category**: A named grouping used to classify income and expenses (e.g., Food, Investment). Users may add custom categories.
- **Transaction_ID**: A unique identifier automatically assigned to each transaction.
- **Dashboard**: Tab 1 of the App, showing balance summary, recent transactions, and spending chart.
- **Input_Form**: Tab 2 of the App, used to create or edit transactions.
- **Transaction_List**: Tab 3 of the App, showing a filterable, full transaction history.
- **Local_Storage**: The browser's built-in client-side key-value storage API.
- **Pie_Chart**: A Chart.js-rendered circular chart showing spending distribution by category.
- **Month_Selector**: A UI control allowing the user to filter data by a specific month and year.

---

## Requirements

### Requirement 1: Application Shell and Navigation

**User Story:** As a user, I want a tabbed interface so that I can navigate between the Dashboard, Input Form, and Transaction List without page reloads.

#### Acceptance Criteria

1. THE App SHALL render three tabs: Dashboard, Input Form, and Transaction List.
2. WHEN a tab is selected, THE App SHALL display the corresponding tab content and hide the others.
3. THE App SHALL be responsive and usable on desktop and mobile screen sizes.
4. THE App SHALL be compatible with current versions of Chrome, Firefox, Edge, and Safari.
5. THE App SHALL load without a backend server, using only static HTML, CSS, and JavaScript files.

---

### Requirement 2: Data Persistence

**User Story:** As a user, I want my data saved automatically so that my transactions and categories are still available after I close or refresh the browser.

#### Acceptance Criteria

1. THE App SHALL store all transaction data in the browser's Local_Storage.
2. THE App SHALL store all Budget_Category data in the browser's Local_Storage.
3. WHEN the App is loaded, THE App SHALL read and restore all previously saved transactions and categories from Local_Storage.
4. WHEN a transaction is created, edited, or deleted, THE App SHALL immediately persist the updated data to Local_Storage.
5. WHEN a Budget_Category is created, THE App SHALL immediately persist the updated category list to Local_Storage.

---

### Requirement 3: Transaction ID Generation

**User Story:** As a user, I want each transaction to have a unique ID so that records can be reliably identified and edited.

#### Acceptance Criteria

1. WHEN a new transaction is created, THE App SHALL automatically assign a unique Transaction_ID to it.
2. THE App SHALL ensure no two transactions share the same Transaction_ID.
3. THE Input_Form SHALL display the auto-generated Transaction_ID as a read-only field.

---

### Requirement 4: Income Transaction Entry

**User Story:** As a user, I want to record income so that I can track money added to my budget categories.

#### Acceptance Criteria

1. WHEN the "+" button on the Dashboard is activated, THE App SHALL open the Input_Form pre-configured for an Income transaction.
2. THE Input_Form SHALL include the following fields for an Income transaction: Transaction_ID (read-only, auto-generated), Transaction Date (date selector), Item Name (text), Budget_Category (selectable from existing categories or a new custom category), Amount (numeric, displayed with thousand separator, stored without comma), and Description (optional text).
3. THE App SHALL treat Transaction Date, Item Name, Budget_Category, and Amount as required fields for an Income transaction.
4. WHEN an Income transaction is submitted, THE App SHALL add the Amount to the balance of the selected Budget_Category.
5. IF a required field is empty when the Income form is submitted, THEN THE Input_Form SHALL display a validation error and prevent submission.

---

### Requirement 5: Expense Transaction Entry

**User Story:** As a user, I want to record expenses so that I can track money spent from my budget categories.

#### Acceptance Criteria

1. WHEN the "-" button on the Dashboard is activated, THE App SHALL open the Input_Form pre-configured for an Expense transaction.
2. THE Input_Form SHALL include the following fields for an Expense transaction: Transaction_ID (read-only, auto-generated), Transaction Date (date selector), Item Name (text), Budget_Category (selectable from existing income categories), Amount (numeric, displayed with thousand separator, stored without comma), and Description (optional text).
3. THE App SHALL treat Transaction Date, Item Name, Budget_Category, and Amount as required fields for an Expense transaction.
4. WHEN an Expense transaction is submitted, THE App SHALL deduct the Amount from the balance of the selected Budget_Category.
5. IF a required field is empty when the Expense form is submitted, THEN THE Input_Form SHALL display a validation error and prevent submission.

---

### Requirement 6: Transfer Transaction Entry

**User Story:** As a user, I want to transfer balance between budget categories so that I can reallocate funds as needed.

#### Acceptance Criteria

1. WHEN the "Transfer" button on the Dashboard is activated, THE App SHALL open the Input_Form pre-configured for a Transfer transaction.
2. THE Transfer form SHALL include: a source Budget_Category selector, a destination Budget_Category selector, an Amount field, a Transaction Date selector, and an optional Description field.
3. THE App SHALL treat source Budget_Category, destination Budget_Category, Amount, and Transaction Date as required fields for a Transfer.
4. WHEN a Transfer is submitted, THE App SHALL deduct the Amount from the source Budget_Category and add the Amount to the destination Budget_Category.
5. IF the source and destination Budget_Category are the same, THEN THE Input_Form SHALL display a validation error and prevent submission.
6. IF a required field is empty when the Transfer form is submitted, THEN THE Input_Form SHALL display a validation error and prevent submission.

> **Discussion Point:** Whether Transfer transactions should be recorded in the transaction log is an open question. The user suggested they may not need a log entry for transfers. This should be confirmed before implementation — options are: (a) log transfers as a distinct transaction type visible in the Transaction List, or (b) treat transfers as a silent balance adjustment with no log entry. The current requirements assume option (a) for traceability, but this can be changed.

---

### Requirement 7: Custom Budget Categories

**User Story:** As a user, I want to create custom budget categories so that I can organize my finances in a way that fits my lifestyle.

#### Acceptance Criteria

1. WHEN the user enters a new category name in the Budget_Category field of the Income form, THE App SHALL add that name to the list of available Budget_Categories.
2. THE App SHALL make newly created Budget_Categories available in all subsequent Income, Expense, and Transfer forms.
3. THE App SHALL persist all Budget_Categories to Local_Storage.

---

### Requirement 8: Dashboard — Total Balance Display

**User Story:** As a user, I want to see my total balance prominently on the Dashboard so that I always know my overall financial position.

#### Acceptance Criteria

1. THE Dashboard SHALL display the total balance in a visually prominent, centered, bold element.
2. THE total balance SHALL be calculated as the sum of all Budget_Category balances.
3. WHEN a transaction is added or deleted, THE Dashboard SHALL update the total balance display without requiring a page reload.

---

### Requirement 9: Dashboard — Recent Transactions

**User Story:** As a user, I want to see my most recent transactions on the Dashboard so that I can quickly review recent activity.

#### Acceptance Criteria

1. THE Dashboard SHALL display the 10 most recent transactions in reverse chronological order.
2. WHEN a transaction is added or deleted, THE Dashboard SHALL update the recent transactions list automatically.
3. WHEN the user activates the "show more" control on the Dashboard, THE App SHALL navigate to the Transaction_List tab.
4. WHILE the viewport is a mobile screen size, THE Dashboard SHALL render the recent transactions list in a scrollable container.

---

### Requirement 10: Dashboard — Spending Pie Chart

**User Story:** As a user, I want a visual breakdown of my spending by category so that I can understand where my money is going this month.

#### Acceptance Criteria

1. THE Dashboard SHALL render a Pie_Chart using Chart.js showing spending distribution by Budget_Category for the current calendar month.
2. WHEN a transaction is added or deleted, THE Dashboard SHALL update the Pie_Chart automatically.
3. WHEN a Budget_Category's total spending for the current month exceeds its allocated budget, THE Dashboard SHALL highlight that category label in bold red font on the Pie_Chart.

---

### Requirement 11: Transaction List — Month Filter

**User Story:** As a user, I want to filter my transaction history by month so that I can review spending for a specific period.

#### Acceptance Criteria

1. THE Transaction_List SHALL display a Month_Selector at the top of the tab.
2. WHEN a month is selected, THE Transaction_List SHALL display only transactions whose Transaction Date falls within that month and year.
3. WHEN a month is selected, THE Transaction_List SHALL update the Pie_Chart to reflect spending distribution for the selected month.

---

### Requirement 12: Transaction List — Table Display

**User Story:** As a user, I want to see all my transactions in a table so that I can review my full financial history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display transactions in a table with the following columns: Transaction Date, Item Name, Amount, Budget_Category, and Type (Income, Expense, or Transfer).
2. THE Transaction_List SHALL display transactions in reverse chronological order by default.
3. WHILE a month filter is active, THE Transaction_List SHALL show only transactions matching the selected month.

---

### Requirement 13: Transaction Edit and Delete

**User Story:** As a user, I want to edit or delete transactions so that I can correct mistakes or remove outdated records.

#### Acceptance Criteria

1. THE Transaction_List SHALL provide an edit control for each transaction row.
2. WHEN the edit control for a transaction is activated, THE App SHALL open the Input_Form pre-filled with that transaction's data, identified by its Transaction_ID.
3. WHEN an edited transaction is submitted, THE App SHALL update the stored transaction and recalculate all affected Budget_Category balances.
4. THE Transaction_List SHALL provide a delete control for each transaction row.
5. WHEN the delete control for a transaction is activated, THE App SHALL remove the transaction from storage and recalculate all affected Budget_Category balances.
6. WHEN a transaction is edited or deleted, THE Dashboard SHALL reflect the updated balance and recent transactions automatically.

---

### Requirement 14: Amount Formatting

**User Story:** As a user, I want amounts displayed with thousand separators so that large numbers are easy to read.

#### Acceptance Criteria

1. WHEN an amount is displayed anywhere in the App, THE App SHALL format it with a thousand separator (e.g., 1,000,000).
2. WHEN an amount is stored in Local_Storage, THE App SHALL store it as a plain number without formatting characters.
3. WHEN a user types an amount in a form field, THE App SHALL display a thousand separator in real time without affecting the stored numeric value.

---

### Requirement 15: Dark/Light Mode Toggle

**User Story:** As a user, I want to switch between dark and light mode so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE App SHALL provide a toggle control to switch between dark mode and light mode.
2. WHEN the mode is toggled, THE App SHALL apply the selected theme to all visible UI elements immediately.
3. THE App SHALL persist the user's theme preference to Local_Storage.
4. WHEN the App is loaded, THE App SHALL restore the previously saved theme preference from Local_Storage.

---

### Requirement 16: Performance and Usability

**User Story:** As a user, I want the app to feel fast and responsive so that I can use it without frustration.

#### Acceptance Criteria

1. THE App SHALL render the initial view with no perceptible delay on a standard broadband connection.
2. WHEN data is updated (transaction added, edited, or deleted), THE App SHALL reflect changes in the UI within 100ms.
3. THE App SHALL use a single CSS file and a single JavaScript file to minimize load overhead.
4. THE App SHALL present a clear visual hierarchy with readable typography across all screen sizes.
