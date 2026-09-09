# E2E Test Specification Mining Report: ComputerShopOS (Tiers 1–4)

**Author**: `e2e_spec_miner_1` (teamwork_preview_spec_miner)  
**Target Milestone**: E2E Testing Track (Milestone M3 / Phase 1)  
**Parent Orchestrator**: `sub_orch_e2e_1` (`7eef4fd8-0661-4fa1-a41c-da6d2258ba41`)  
**Workspace**: `/home/ehtisham/Desktop/Projects/ComputerShopOS`  
**Date**: September 4, 2026  

---

## 1. Executive Summary & Authoritative Sources

This specification mining report defines the requirement-driven, opaque-box E2E test criteria, mathematical formulas, date boundaries, edge cases, and test matrices across Tiers 1 through 4 for ComputerShopOS.

### Authoritative Specification Sources Probed:
1. **`ORIGINAL_REQUEST.md`**: Initial Request (BUG-08, SUGGEST-02..05, TYPE-01..02) and Follow-up Request (R1: Database Schema & Expense Tracking, R2: Live & Historical Monthly Report Engine, R3: Historical Data Seeding, R4: Sidebar Navigation Reorganization, R5: UI Implementation, Acceptance Criteria).
2. **`PROJECT.md`**: Feature Inventory (F1 to F16, F17..F19), Interface Contracts (M1 ↔ M2, M2 ↔ M3/M4, Layout), and Directory Layout.
3. **`context/Monthly Report 2026.xlsx`**: Authoritative accounting ledger of "TASNIM COMPUTERS ANWAR CHOWK WAHCANTT", containing 10 sheets (March–August 2026 active; September–December 2026 templates).
4. **`context/extracted_historical_reports.json`**: Verified extracted dataset of 6 historical monthly reports and 44 individual expense records.
5. **Codebase Implementation Contracts**: `src/db/schema.ts`, `src/db/client.ts`, `src/db/posService.ts`, `src/db/repairsService.ts`, `src/db/adjustmentsService.ts`, `src/db/reportService.ts`.

---

## 2. Features Discovered Table

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Database / Schema | F1: SQLite Schema for Expenses | `expenses` table DDL, indexes, and schema types | `year`, `month`, `category`, `title`, `amount`, `expense_date`, `payment_method`, `notes` | Created table & index `idx_expenses_year_month` | Rejects null non-nullable fields | `PROJECT.md` F1, `schema.ts:454` |
| 2 | Database / Schema | F2: SQLite Schema for Monthly Reports | `monthly_reports` snapshot archive table DDL | `year`, `month`, `month_label`, financials, `daily_data_json`, `expense_data_json`, `status` | Created table & unique index `idx_monthly_reports_year_month` | Rejects duplicate `(year, month)` | `PROJECT.md` F2, `schema.ts:473` |
| 3 | Data / Seeding | F3: Historical Seed Data Integration | Seed March 2026 – August 2026 reports and expenses in `seedData.json` | 6 monthly reports, 44 expense items | Populated `seedData.json` | Missing fields fail parse | `PROJECT.md` F3, `extracted_historical_reports.json` |
| 4 | Database / Lifecycle | F4: Safe Startup Seeding Migration | Independent table count checks in `client.ts` without data loss | Database initialization trigger | Seed records inserted only if table count == 0 | Does not duplicate or wipe existing tables | `PROJECT.md` F4, `client.ts:600+` |
| 5 | Service / Expenses | F5: Expense Service CRUD | CRUD operations for expenses in `src/db/expenseService.ts` | `CreateExpenseInput`, ID, update payload | Inserted ID, updated records, deleted status | Throws / rejects negative amount or invalid ID | `PROJECT.md` F5, Interface Contracts |
| 6 | Service / Expenses | F6: Recurring Overheads Generator | Template application for standard monthly shop overheads | `year`, `month` | `{ applied: number; skipped: number }` | Skips existing titles idempotently | `PROJECT.md` F6, Excel Rows 43–52 |
| 7 | Service / Reporting | F7: Live Monthly Report Engine | Date-range SQL / memory queries for sales, COGS, and GP | `year`, `month` | `MonthlyReportDetail` with grossSales, grossProfit | Returns 0 for months without transactions | `PROJECT.md` F7, `ORIGINAL_REQUEST.md` R2 |
| 8 | Service / Reporting | F8: 31-Day Daily Breakdown Engine | Day 1..31 calendar sales, gross profit, and remarks array | `year`, `month` | `DailyReportRow[]` (length matching days in month: 28/29/30/31) | Handles zero-sales days with 0 values | `PROJECT.md` F8, Excel Rows 6–36 |
| 9 | Accounting | F9: Net Profit Formula Integration | Enforce `Net Profit = Gross Profit - Total Expenses` | `grossProfit`, `totalExpenses` | Integer `netProfit` (positive or negative) | Handles negative net profit (net operational loss) | `PROJECT.md` F9, Excel Row 54 |
| 10 | Service / Reporting | F10: Historical Reports Fetching | Fetch past frozen snapshots from `monthly_reports` | `year`, `month` (optional for history list) | Array of past reports or full snapshot detail | Returns null / empty if month not archived | `PROJECT.md` F10, Interface Contracts |
| 11 | UI / Navigation | F11: Sidebar Navigation Reorganization | Move "Monthly Reports" item to bottom of sidebar | Active route, nav click | Navigation to reports view | Active state highlighted | `PROJECT.md` F11, `ORIGINAL_REQUEST.md` R4 |
| 12 | UI / Navigation | F12: Expenses Sidebar & Routing | Add "Expenses & Bills" to `navTypes.ts`, sidebar, and router | Nav item click | Route rendered `ExpensesPage` | Invalid route falls back safely | `PROJECT.md` F12, `ORIGINAL_REQUEST.md` R4 |
| 13 | UI / Expenses | F13: Dedicated Expenses Page | `src/pages/Expenses.tsx` with KPI metrics, filters, modals | Year/Month selection, new expense form | Expense table, summary cards, recurring overheads button | Form highlights missing/invalid inputs | `PROJECT.md` F13, `ORIGINAL_REQUEST.md` R5 |
| 14 | UI / Reports | F14: Current Month Report View | Live KPI cards, 31-day table, and `[ History ➔ ]` button | Current date / active month | Rendered report dashboard with History toggle | Loading / empty state gracefully handled | `PROJECT.md` F14, `ORIGINAL_REQUEST.md` R5 |
| 15 | UI / Reports | F15: Past Months History View | Scrollable single-line containers for past months | Click on `[ History ➔ ]` | List of past month cards with key metrics | Scroll overflow constrained, no layout break | `PROJECT.md` F15, `ORIGINAL_REQUEST.md` R5 |
| 16 | UI / Reports | F16: Historical Month Detail View | Full report UI rendered with historical frozen data | Click on historical month row | Detailed frozen snapshot with `[ ⬅ Back to History ]` | Read-only mode prevents accidental edits | `PROJECT.md` F16, `ORIGINAL_REQUEST.md` R5 |
| 17 | Core / Repairs | BUG-08: Active Repairs Count | Derive active repair count dynamically from live records | Repair ticket collection | Live integer count of `status != 'DELIVERED'` | Does not return hardcoded 2 | `ORIGINAL_REQUEST.md` R1 |
| 18 | Core / Inventory | SUGGEST-02: Inventory Stock Restoration | Restore inventory quantities on record deletion | Delete sale / repair / adjustment ID | Stock quantity incremented / decremented back | Fails gracefully if record not found | `ORIGINAL_REQUEST.md` R2 |
| 19 | Core / Inventory | SUGGEST-03: Serial Status Transition | Mark serial `SOLD` on adjustment checkout | Adjustment line item with serial | Serial status set to `SOLD` | Rejects non-existent serial | `ORIGINAL_REQUEST.md` R2 |
| 20 | Core / POS | SUGGEST-04: Sales Discount UI & Calculation | Support discount input or remove field cleanly | `discount` number in sale input | Subtotal - discount applied in `totalAmount` | Negative discount rejected or clamped to 0 | `ORIGINAL_REQUEST.md` R1 |
| 21 | Core / POS | SUGGEST-05: Pre-checkout Stock Validation | Validate available stock before completing sale | Cart items, requested quantities | Allows checkout if qty <= stock; blocks if qty > stock | Alerts user, blocks invalid checkout | `ORIGINAL_REQUEST.md` R1 |
| 22 | Core / Typing | TYPE-01 & TYPE-02: Clean Interface Types | Remove aliases and centralize domain input interfaces | TypeScript compile check | Clean build without unused aliases | TypeScript compilation error if violated | `ORIGINAL_REQUEST.md` R3 |

---

## 3. Edge Cases Table

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | F3 / F8 (July 2026 Typo) | Sheet `JULY-2026`, Cell B6..B36 | Raw cell strings in Excel read `2025-07-01` to `2025-07-31`, but sheet header and day-of-week match 2026 (`WEDNESDAY` for July 1). Seeder must normalize to `2026-07-xx`. |
| 2 | F8 (Month Day Variations) | April, June, Sept, Nov (30 days); Feb (28/29 days); Jan, Mar, May, Jul, Aug, Oct, Dec (31 days) | Calendar array must dynamically generate exactly 28, 29, 30, or 31 rows. Day 31 must NOT exist for April or June. |
| 3 | F8 (Leap Year February) | February 2024 vs February 2026 | 2024 returns 29 days; 2026 returns 28 days. Day 29 only appears in leap years. |
| 4 | F9 (Net Operational Loss) | March 2026 (GP 103,770; Expenses 111,865) and May 2026 (GP 102,253; Expenses 110,686) | Formula produces negative integers: `-8095` and `-8433`. UI must format negative values correctly (red styling / negative sign) without crashing. |
| 5 | F7 / F8 (Partial Month Data) | August 2026 (Days 1–10 recorded, Days 11–31 null/zero) | Days 11 to 31 evaluate to 0 sales and 0 GP. Total expenses reflect only early-month payments (42,300 PKR). Net profit is +15,760 PKR. |
| 6 | F7 / F8 (Zero-Sales Operating Days) | Eid-ul-Fitr (April 10–13), holidays (March 21–23, May 27–28, June 26) | Daily sales = 0, GP = 0. Margin percentage calculation must not throw `DivideByZeroException`: `marginPercent = grossSales > 0 ? (grossProfit / grossSales) * 100 : 0`. |
| 7 | F7 / F8 (Gross Profit > Sales Anomaly) | June 23, 2026: Sales = 14,280 PKR, Gross Profit = 62,220 PKR | Legitimate accounting entry in authoritative ledger (repair revenue or high-margin adjustment). System must preserve and display without clamping GP to Sales. |
| 8 | F6 (Recurring Overheads Idempotency) | Run `applyRecurringExpenses(2026, 9)` twice in succession | First run returns `{ applied: 9, skipped: 0 }`. Second run returns `{ applied: 0, skipped: 9 }`. No duplicate expense rows are inserted. |
| 9 | F5 (Negative & Zero Expense Amounts) | `amount = 0` vs `amount = -500` | Zero is allowed for dormant lines (e.g. `JAZZ POST PAID BILL = 0`). Negative expense amounts must be rejected by validator or clamped to 0. |
| 10 | F5 / F13 (Special Characters & SQL Injection) | Title: `Shop Rent' OR '1'='1; --`, Notes: `<script>alert("xss")</script>` | Sanitized / parameterized queries prevent SQL injection. React JSX escapes strings preventing XSS. |
| 11 | F1 / F2 (Large Integer Currency Overflow) | Sales = 2,147,483,647 (Max 32-bit signed int) | SQLite stores integers up to 64-bit signed int (9 quintillion). JavaScript `Number.MAX_SAFE_INTEGER` (9,007,199,254,740,991) prevents precision loss. |
| 12 | F7 (Date Boundary Midnight Transitions) | Transaction created at `2026-03-31T23:59:59.999Z` vs `2026-04-01T00:00:00.000Z` | Strict timestamp comparison: `createdAt >= startOfMonth && createdAt <= endOfMonth` ensures exact monthly partitioning without boundary drift. |
| 13 | F4 (Migration Idempotency on Restart) | App launched with populated `expenses` (44 rows) and `monthly_reports` (6 rows) | Count check finds `count > 0` and skips seeding. Existing user data and modifications are untouched. |
| 14 | F10 / F16 (Immutable Historical Archive) | New expense added for March 2026 after report is `CLOSED` | Historical snapshot in `monthly_reports` remains unchanged. Historical view displays frozen figures. |
| 15 | SUGGEST-05 (Concurrent / Out of Stock Checkout) | Item stock = 2; User tries to checkout quantity = 3 | Pre-checkout validation triggers validation error: "Insufficient stock for item X (Available: 2, Requested: 3)" and blocks sale completion. |
| 16 | SUGGEST-02 (Inventory Restoration on Sale Void) | Sale containing 5 RAM sticks (Stock was 15 -> 10) is deleted | Sale items retrieved; each item's quantity added back to inventory: `quantity = quantity + 5` (Stock restored to 15). |
| 17 | SUGGEST-03 (Serialized Item Adjustment Checkout) | Inventory adjustment with negative quantity (item given out) for serial `SN-RTX4080-001` | Serial record status changes from `AVAILABLE` to `SOLD`. Serial is no longer eligible for subsequent sale. |
| 18 | BUG-08 (Derivation of Active Repairs) | Total 5 tickets: 2 DELIVERED, 1 RECEIVED, 1 IN_PROGRESS, 1 WAITING_PARTS | Active repairs count returns exactly 3 (excluding DELIVERED). Hardcoded 2 is completely eliminated. |

---

## 4. Mathematical Formulas & Business Logic Specifications

The authoritative accounting model from `Monthly Report 2026.xlsx` defines the following explicit financial rules:

### 4.1 Daily Gross Profit Formula
For any calendar day $d$:
$$\text{Gross Profit}_d = \text{Daily Gross Sales}_d - \text{COGS}_d$$
*(In historical records, GP is entered directly from physical sales slips, including inline sums such as `=800+300+300+2003 = 3403` on May 9).*

### 4.2 Monthly Aggregations
For month $M$ with $N$ calendar days ($N \in \{28, 29, 30, 31\}$):
$$\text{Gross Sales} = \sum_{d=1}^{N} \text{Daily Gross Sales}_d$$
$$\text{Gross Profit} = \sum_{d=1}^{N} \text{Daily Gross Profit}_d$$
$$\text{Remarks Sum (Tasnim Salary Draws)} = \sum_{d=1}^{N} \text{Remarks Numeric Value}_d$$

### 4.3 Total Operating Expenses Formula
$$\text{Total Expenses} = \sum_{k=1}^{E} \text{Expense Amount}_k$$
Where each expense $k$ belongs to the selected month and year.

### 4.4 Net Profit Formula (Authoritative Ground Truth)
$$\text{Net Profit} = \text{Gross Profit} - \text{Total Expenses}$$
- If $\text{Gross Profit} > \text{Total Expenses}$: $\text{Net Profit} > 0$ (Operational Gain).
- If $\text{Gross Profit} < \text{Total Expenses}$: $\text{Net Profit} < 0$ (Operational Loss).
- Standard Excel cell mapping: Cell `D54 = D41 - D53`.

### 4.5 Partner Profit Share (Historical Excel Rows 55–56)
$$\text{Partner Cut (15\%)} = 0.15 \times \text{Net Profit}$$
$$\text{Actual Retained Net Profit} = \text{Net Profit} - \text{Partner Cut} = 0.85 \times \text{Net Profit}$$
*(Calculated proportionally even when Net Profit is negative, e.g., March: $0.15 \times -8095 = -1214.25$; Retained: $-6880.75$).*

### 4.6 Profit Margin Percentage
$$\text{Gross Margin \%} = \begin{cases} 
\text{round}\left(\frac{\text{Gross Profit}}{\text{Gross Sales}} \times 100\right) & \text{if } \text{Gross Sales} > 0 \\ 
0 & \text{if } \text{Gross Sales} = 0 
\end{cases}$$

### 4.7 Cash Collection & Outstanding Balance
$$\text{Collected Cash} = \sum \text{paidAmount}$$
$$\text{Receivables} = \sum \text{balanceDue}$$
$$\text{Total Amount} = \text{Subtotal} - \text{Discount} + \text{Tax}$$

---

## 5. Authoritative Historical Benchmark (March – August 2026)

All figures in Pakistani Rupees (PKR):

| Metric | March 2026 | April 2026 | May 2026 | June 2026 | July 2026 | August 2026 (10 Days) | 6-Month Total |
|---|---|---|---|---|---|---|---|
| **Gross Sales** | 467,100 | 712,630 | 572,500 | 532,780 | 850,540 | 191,720 | **3,327,270** |
| **Gross Profit** | 103,770 | 123,390 | 102,253 | 183,580 | 165,080 | 58,060 | **736,133** |
| **Gross Margin** | 22.2% | 17.3% | 17.9% | 34.5% | 19.4% | 30.3% | **22.1%** |
| **Total Expenses** | 111,865 | 117,808 | 110,686 | 110,928 | 113,568 | 42,300 | **607,155** |
| **Net Profit** | **-8,095** | **+5,582** | **-8,433** | **+72,652** | **+51,512** | **+15,760** | **+128,978** |
| **Remarks Sum** | 31,500 | 37,700 | 30,000 | 30,000 | 30,000 | 0 | **159,200** |
| **Expense Count** | 8 | 8 | 8 | 8 | 9 | 3 | **44 items** |
| **Active Days** | 28 / 31 | 26 / 30 | 29 / 31 | 29 / 30 | 31 / 31 | 9 / 31 | **152 / 184** |

### Standard Recurring Monthly Overheads Template (Base: 113,000 PKR):
1. `SHOP RENT` (`RENT`): 25,000 PKR
2. `FARHAN BAHI SALARY` (`SALARY`): 30,000 PKR
3. `TASNIM SALARY` (`SALARY`): 30,000 PKR
4. `ARSLAN BAHI SALARY` (`SALARY`): 17,000 PKR (Current rate; escalated from 15k in Mar–May, 16k in Jun, to 17k in Jul–Aug)
5. `CHOKIDARA` (`SECURITY_GUARD`): 300 PKR
6. `SHOP ELECTRICITY BILL` (`UTILITIES`): 5,200 PKR (Average historical bill)
7. `TELEPHONE BILL` (`UTILITIES`): 3,700 PKR (Standard PTCL package)
8. `TELENOR POST PAID BILL` (`UTILITIES`): 1,000 PKR
9. `NET FLEX` (`INTERNET`): 800 PKR

---

## 6. Date Boundaries, Timezones & Calendar Rules

1. **Epoch Resolution**: Timestamps stored as 10-digit integers representing seconds (`Math.floor(Date.now() / 1000)`).
2. **Month-End Time Calculations**:
   - `startOfMonth(year, month)`: `Math.floor(new Date(year, month - 1, 1, 0, 0, 0, 0).getTime() / 1000)`
   - `endOfMonth(year, month)`: `Math.floor(new Date(year, month, 0, 23, 59, 59, 999).getTime() / 1000)`
3. **Calendar Rows Generation**:
   - Number of days $N = \text{new Date}(year, month, 0).\text{getDate()}$.
   - For any day $d \in [1..N]$:
     - `date` = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
     - `dayOfWeek` = `new Date(year, month - 1, d).toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()`
4. **Timezone Handling**: Date boundary queries in SQLite should either use integer epoch range comparisons (`expense_date >= $start AND expense_date <= $end`) or ISO string formatting to avoid UTC vs Local time drift.

---

## 7. Complete 4-Tier Test Specifications Matrix

### 7.1 Tier 1: Feature Coverage (Isolation & Happy Path, >=5 Tests Per Feature)

#### F1: SQLite Schema for Expenses
- **T1-F1-01**: Verify `expenses` table creation with all 10 columns (`id`, `year`, `month`, `category`, `title`, `amount`, `expense_date`, `payment_method`, `notes`, `created_at`).
- **T1-F1-02**: Verify index `idx_expenses_year_month` exists on `expenses(year, month)`.
- **T1-F1-03**: Insert valid expense record with standard category (`RENT`) and assert auto-increment ID generation.
- **T1-F1-04**: Verify default values: `category` defaults to `'MISC'`, `amount` defaults to `0`, `payment_method` defaults to `'CASH'`.
- **T1-F1-05**: Select expenses filtered by `year = 2026 AND month = 3` and assert correct record set returned.

#### F2: SQLite Schema for Monthly Reports
- **T1-F2-01**: Verify `monthly_reports` table creation with all 17 required columns.
- **T1-F2-02**: Verify unique index `idx_monthly_reports_year_month` on `(year, month)`.
- **T1-F2-03**: Insert valid monthly report snapshot for `(2026, 3)` with status `'CLOSED'` and verify retrieval.
- **T1-F2-04**: Verify serializing and deserializing `daily_data_json` array containing 31 daily rows.
- **T1-F2-05**: Verify serializing and deserializing `expense_data_json` array containing 8 expense objects.

#### F3: Historical Seed Data Integration
- **T1-F3-01**: Assert `seedData.monthlyReports` contains exactly 6 historical months (March through August 2026).
- **T1-F3-02**: Assert `seedData.expenses` contains exactly 44 expense items matching Excel rows.
- **T1-F3-03**: Assert March 2026 seeded values: `grossSales == 467100`, `grossProfit == 103770`, `totalExpenses == 111865`, `netProfit == -8095`.
- **T1-F3-04**: Assert July 2026 seeded values: `grossSales == 850540`, `grossProfit == 165080`, `totalExpenses == 113568`, `netProfit == 51512`.
- **T1-F3-05**: Assert July 2026 daily data dates are normalized to `2026-07-xx` (resolving Excel typo).

#### F4: Safe Startup Seeding Migration
- **T1-F4-01**: Run `initDb()` on clean database; assert `monthly_reports` count is 6 and `expenses` count is 44.
- **T1-F4-02**: Run `initDb()` a second time; assert table row counts remain 6 and 44 (no duplicate seeding).
- **T1-F4-03**: Verify existing tables (`customers`, `inventory`, `sales`, `purchases`) remain untouched with original data intact.
- **T1-F4-04**: Verify in-memory fallback store (`memoryStore`) is populated with `memoryExpenses` and `memoryMonthlyReports`.
- **T1-F4-05**: Insert custom expense, re-run `initDb()`, verify custom expense is preserved.

#### F5: Expense Service CRUD
- **T1-F5-01**: Call `createExpense({ year: 2026, month: 9, category: 'UTILITIES', title: 'Power Bill', amount: 5000, expenseDate: 1788220800, paymentMethod: 'CASH' })`; assert positive ID returned.
- **T1-F5-02**: Call `getExpensesByMonth(2026, 9)`; assert returned array contains the newly created record.
- **T1-F5-03**: Call `updateExpense(id, { amount: 6500, notes: 'Adjusted after meter check' })`; assert changes persisted.
- **T1-F5-04**: Call `deleteExpense(id)`; assert record no longer returned by `getExpensesByMonth`.
- **T1-F5-05**: Call `getMonthlyExpenseSummary(2026, 3)`; assert `total == 111865` and `byCategory['RENT'] == 25000`.

#### F6: Recurring Overheads Generator
- **T1-F6-01**: Call `applyRecurringExpenses(2026, 9)` on fresh month; assert returns `{ applied: 9, skipped: 0 }`.
- **T1-F6-02**: Verify all 9 standard overheads created: Shop Rent (25k), Salaries (30k, 30k, 17k), Utilities, etc.
- **T1-F6-03**: Assert sum of generated recurring overheads equals exactly 113,000 PKR.
- **T1-F6-04**: Call `applyRecurringExpenses(2026, 9)` again; assert returns `{ applied: 0, skipped: 9 }`.
- **T1-F6-05**: Verify Arslan's salary is generated at 17,000 PKR (reflecting July/August escalation).

#### F7: Live Monthly Report Engine
- **T1-F7-01**: Call `getMonthlyReport(year, month)` for active month with 2 sales; assert `grossSales` equals sum of invoice totals.
- **T1-F7-02**: Assert `cogs` equals sum of `quantity * costPrice` for items sold in that month.
- **T1-F7-03**: Assert `grossProfit == grossSales - cogs`.
- **T1-F7-04**: Assert `collectedCash` matches sum of `paidAmount` and `receivables` matches sum of `balanceDue`.
- **T1-F7-05**: Assert status returned is `'OPEN'` for active/unarchived months.

#### F8: 31-Day Daily Breakdown Engine
- **T1-F8-01**: Call report engine for March 2026 (31-day month); assert `dailyData` array has exactly 31 elements.
- **T1-F8-02**: Call report engine for June 2026 (30-day month); assert `dailyData` array has exactly 30 elements.
- **T1-F8-03**: Call report engine for February 2026 (28-day month); assert `dailyData` array has exactly 28 elements.
- **T1-F8-04**: Verify row structure contains `day`, `date`, `dayOfWeek`, `sales`, `grossProfit`, `remarks`.
- **T1-F8-05**: Verify days with transactions have sales/GP mapped to the exact day number (e.g. Day 25 in March).

#### F9: Net Profit Formula Integration
- **T1-F9-01**: Query March 2026 report; assert `netProfit == 103770 - 111865 == -8095`.
- **T1-F9-02**: Query April 2026 report; assert `netProfit == 123390 - 117808 == 5582`.
- **T1-F9-03**: Query June 2026 report; assert `netProfit == 183580 - 110928 == 72652`.
- **T1-F9-04**: Create new expense of 10,000 in active month; assert `netProfit` decreases by exactly 10,000.
- **T1-F9-05**: Delete expense of 10,000 in active month; assert `netProfit` increases by exactly 10,000.

#### F10: Historical Reports Fetching
- **T1-F10-01**: Call `getMonthlyReportsHistory()`; assert returns 6 summary items sorted descending by date.
- **T1-F10-02**: Assert summary items contain `year`, `month`, `monthLabel`, `grossSales`, `grossProfit`, `totalExpenses`, `netProfit`.
- **T1-F10-03**: Call `getMonthlyReportDetail(2026, 4)`; assert returns full April snapshot with 30 daily rows and 8 expenses.
- **T1-F10-04**: Verify historical snapshot returns `status: 'CLOSED'`.
- **T1-F10-05**: Call `getMonthlyReportDetail(1999, 1)`; assert returns null or empty response gracefully.

#### F11: Sidebar Navigation Reorganization
- **T1-F11-01**: Mount `AppSidebar`; assert "Monthly Reports" is present and positioned at the bottom of navigation items.
- **T1-F11-02**: Verify navigation label displays "Monthly Reports".
- **T1-F11-03**: Click "Monthly Reports"; assert navigation state updates `activeTab` to `'reports'`.
- **T1-F11-04**: Assert sidebar item has active indicator class when `activeTab === 'reports'`.
- **T1-F11-05**: Verify sidebar remains accessible and responsive on both desktop and mobile viewports.

#### F12: Expenses Sidebar & Routing
- **T1-F12-01**: Verify `NavTab` type union includes `'expenses'`.
- **T1-F12-02**: Mount `AppSidebar`; assert "Expenses & Bills" item exists under Operations section.
- **T1-F12-03**: Click "Expenses & Bills"; assert `activeTab` switches to `'expenses'`.
- **T1-F12-04**: Mount `AppRouter` with `activeTab = 'expenses'`; assert `ExpensesPage` component renders.
- **T1-F12-05**: Verify browser URL / route state updates without triggering a full page reload.

#### F13: Dedicated Expenses Page
- **T1-F13-01**: Mount `ExpensesPage`; assert month and year selectors default to current month.
- **T1-F13-02**: Assert KPI cards display Total Expenses, Top Category, Recurring Count, Cash vs Bank.
- **T1-F13-03**: Verify expense table lists all records for selected month with Date, Title, Category, Amount, Actions.
- **T1-F13-04**: Click "Add Expense" button; assert modal opens with category dropdown, title, amount, and notes.
- **T1-F13-05**: Click "Load Recurring Overheads" button; assert handler invokes `applyRecurringExpenses` and refreshes table.

#### F14: Current Month Report View
- **T1-F14-01**: Mount `ReportsPage`; assert default view displays current month's live report.
- **T1-F14-02**: Assert top KPI cards render Gross Sales, Gross Profit, Total Expenses, and Net Profit.
- **T1-F14-03**: Assert Net Profit card displays green styling for positive profit and red styling for negative profit.
- **T1-F14-04**: Assert 31-day daily breakdown table is visible with headers: Day, Date, Day of Week, Sales, Gross Profit, Remarks.
- **T1-F14-05**: Assert top-right corner displays `[ History ➔ ]` navigation button.

#### F15: Past Months History View
- **T1-F15-01**: Click `[ History ➔ ]` on `ReportsPage`; assert view switches to history list.
- **T1-F15-02**: Assert single-line card containers rendered for all 6 historical months (August down to March).
- **T1-F15-03**: Assert each month row displays Month Label, Sales, GP, Expenses, Net Profit, and `CLOSED` badge.
- **T1-F15-04**: Assert top navigation displays `[ ⬅ Current Month ]` button to return to active month view.
- **T1-F15-05**: Assert container allows smooth vertical scrolling through past months without horizontal overflow.

#### F16: Historical Month Detail View
- **T1-F16-01**: Click on "March 2026" row in History view; assert view switches to March 2026 full report detail.
- **T1-F16-02**: Assert displayed KPIs match historical archive: Sales 467,100, GP 103,770, Expenses 111,865, Net Profit -8,095.
- **T1-F16-03**: Assert daily table contains all 31 rows with March dates and remarks (e.g. 15,000 on March 15 and 31).
- **T1-F16-04**: Assert `[ ⬅ Back to History ]` button is visible in header; clicking it returns to History list.
- **T1-F16-05**: Assert historical report is in read-only mode (expense editing and transaction modifications disabled).

---

### 7.2 Tier 2: Boundary & Corner Cases (>=5 Tests Per Feature)

#### F1: SQLite Schema for Expenses (Boundaries)
- **T2-F1-01**: Insert expense with `amount = 0` (e.g. dormant Jazz bill); assert success and integer `0` stored.
- **T2-F1-02**: Insert expense with `amount = -100`; assert rejection or constraint violation.
- **T2-F1-03**: Insert expense with `title` containing 500 characters; assert stored without truncation.
- **T2-F1-04**: Insert expense with SQL injection payload `title = "Rent'; DROP TABLE expenses; --"`; assert treated strictly as text string.
- **T2-F1-05**: Insert expense with maximum safe 64-bit integer `amount = 9007199254740991`; assert exact numeric preservation.

#### F2: SQLite Schema for Monthly Reports (Boundaries)
- **T2-F2-01**: Attempt to insert two records for the same `(year: 2026, month: 3)`; assert unique constraint violation.
- **T2-F2-02**: Insert report snapshot with negative `net_profit = -8095`; assert negative integer stored and retrieved correctly.
- **T2-F2-03**: Insert report snapshot with empty JSON arrays `daily_data_json = "[]"` and `expense_data_json = "[]"`; assert valid JSON parse.
- **T2-F2-04**: Insert report with huge `daily_data_json` (e.g. 100KB payload); assert stored and retrieved intact.
- **T2-F2-05**: Query `monthly_reports` for boundary month `month = 12` and `month = 1`; assert correct index range query.

#### F3: Historical Seed Data Integration (Boundaries)
- **T3-F3-01**: Assert August 2026 partial month data: Days 1–10 contain positive sales/GP, Days 11–31 contain exactly `0`.
- **T3-F3-02**: Assert August 2026 expenses list contains exactly 3 items totaling 42,300 PKR.
- **T3-F3-03**: Assert June 23, 2026 anomaly: `sales == 14280` and `grossProfit == 62220` (GP > Sales) preserved exactly.
- **T3-F3-04**: Assert April Eid holiday rows: Days 10, 11, 12, 13 all contain `sales == 0` and `grossProfit == 0`.
- **T3-F3-05**: Assert total sum across all 6 historical months equals: Sales `3327270`, GP `736133`, Expenses `607155`, Net Profit `128978`.

#### F4: Safe Startup Seeding Migration (Boundaries)
- **T2-F4-01**: Simulate partially seeded state (`expenses` has 44 rows, but `monthly_reports` has 0); assert only `monthly_reports` is seeded.
- **T2-F4-02**: Simulate database with existing user sales and inventory; run migration and assert zero inventory loss or ID shifts.
- **T2-F4-03**: Corrupt one seed record in JSON; assert validation error is caught with descriptive logging without corrupting DB.
- **T2-F4-04**: Run `initDb()` concurrently from 5 parallel promises; assert SQLite locking or mutex prevents duplicate inserts.
- **T2-F4-05**: Launch app in completely offline / readonly filesystem environment; assert fallback to `memoryStore` works seamlessly.

#### F5: Expense Service CRUD (Boundaries)
- **T2-F5-01**: Call `updateExpense` with non-existent ID (`id = 999999`); assert graceful rejection / error thrown.
- **T2-F5-02**: Call `deleteExpense` with non-existent ID; assert graceful handling without crashing.
- **T2-F5-03**: Call `createExpense` with empty string `title = ""`; assert validation failure ("Title is required").
- **T2-F5-04**: Call `createExpense` with invalid category `'CRYPTO'`; assert fallback to `'MISC'` or schema rejection.
- **T2-F5-05**: Call `createExpense` with date at month boundary `1772323199` (last second of Feb) vs `1772323200` (first second of Mar); assert assigned to correct month.

#### F6: Recurring Overheads Generator (Boundaries)
- **T2-F6-01**: Pre-populate month with 1 of the 9 overheads (`SHOP RENT`); call `applyRecurringExpenses`; assert `{ applied: 8, skipped: 1 }`.
- **T2-F6-02**: Pre-populate month with all 9 overheads but different amounts; assert all 9 skipped by title match.
- **T2-F6-03**: Call recurring overheads for leap year February 2028; assert successful application with 2028 timestamp.
- **T2-F6-04**: Verify payment method for all generated overheads defaults to `'CASH'`.
- **T2-F6-05**: Assert overhead titles match exact Excel casing (`SHOP RENT`, `CHOKIDARA`, `NET FLEX`, `FARHAN BAHI SALARY`).

#### F7: Live Monthly Report Engine (Boundaries)
- **T2-F7-01**: Query report for month with zero sales, zero repairs, and zero expenses; assert all metrics return `0` without NaN or error.
- **T2-F7-02**: Sale made on `2026-04-30T23:59:59` included in April report, but NOT in May report.
- **T2-F7-03**: Sale made on `2026-05-01T00:00:00` included in May report, but NOT in April report.
- **T2-F7-04**: Multiple sales on the same second; assert all included in sales sum and daily breakdown.
- **T2-F7-05**: Sale with 100% discount (`discount == subtotal`, `totalAmount == 0`); assert `grossSales` reflects 0 and margin is 0%.

#### F8: 31-Day Daily Breakdown Engine (Boundaries)
- **T2-F8-01**: February in Leap Year 2024: Assert exactly 29 rows; Day 29 has date `'2024-02-29'` and dayOfWeek `'THURSDAY'`.
- **T2-F8-02**: February in Non-Leap Year 2026: Assert exactly 28 rows; Day 29 does not exist.
- **T2-F8-03**: April 2026 (30 days): Assert row 30 is `'2026-04-30'`; no row 31 present.
- **T2-F8-04**: Day with 15 different sales transactions; assert daily sales is exact sum of all 15 totals.
- **T2-F8-05**: Verify dayOfWeek string formatting is strictly uppercase (`MONDAY`, `TUESDAY`, etc.) matching Excel format.

#### F9: Net Profit Formula Integration (Boundaries)
- **T2-F9-01**: `Gross Profit == Total Expenses` (Break-even): Assert `netProfit === 0`.
- **T2-F9-02**: `Gross Profit == 0` and `Total Expenses == 50000`: Assert `netProfit === -50000`.
- **T2-F9-03**: `Gross Profit == 100000` and `Total Expenses == 0`: Assert `netProfit === 100000`.
- **T2-F9-04**: Floating point prevention: GP of 10.10 and Expenses of 5.05 handled strictly as integer cents/PKR avoiding `0.30000000000000004`.
- **T2-F9-05**: Large profit swing: Gross profit of 50,000,000 PKR minus expenses of 200,000 PKR yields `+49800000`.

#### F10: Historical Reports Fetching (Boundaries)
- **T2-F10-01**: Fetch history list when database has 0 historical reports; assert returns empty array `[]` without error.
- **T2-F10-02**: Fetch detail for month with corrupt `daily_data_json`; assert parser catches syntax error and provides fallback empty array.
- **T2-F10-03**: Verify historical reports ordering: August 2026 appears before July 2026, which appears before June 2026.
- **T2-F10-04**: Request report detail for year 2099; assert returns null without unhandled promise rejection.
- **T2-F10-05**: Verify historical snapshot does NOT reflect sales added to POS for that historical month after snapshot creation.

#### F11: Sidebar Navigation Reorganization (Boundaries)
- **T2-F11-01**: Rapid switching between "Monthly Reports" and other sidebar tabs; assert no memory leak or route conflict.
- **T2-F11-02**: Collapse sidebar; assert "Monthly Reports" icon remains visible, aligned, and clickable.
- **T2-F11-03**: Verify keyboard navigation (Tab + Enter) navigates to "Monthly Reports".
- **T2-F11-04**: Verify sidebar label remains "Monthly Reports" and does not truncate on narrow sidebar width.
- **T2-F11-05**: Assert "Monthly Reports" remains strictly at the bottom even when dynamic menu items load.

#### F12: Expenses Sidebar & Routing (Boundaries)
- **T2-F12-01**: Direct URL / deep link navigation to `activeTab = 'expenses'`; assert page renders immediately.
- **T2-F12-02**: Click "Expenses & Bills" when already on Expenses page; assert no unnecessary re-render or state reset.
- **T2-F12-03**: Resize viewport from 1920px to 375px; assert "Expenses & Bills" navigation collapses into mobile drawer.
- **T2-F12-04**: Route dispatch with unknown query parameters; assert safely ignored.
- **T2-F12-05**: Verify "Expenses & Bills" icon is distinct from "Monthly Reports" icon (e.g. Receipt / CreditCard vs BarChart3).

#### F13: Dedicated Expenses Page (Boundaries)
- **T2-F13-01**: Category filter set to `'SECURITY_GUARD'`; assert table displays only Chokidara (300 PKR).
- **T2-F13-02**: Category filter set to category with 0 expenses; assert table displays friendly empty state message.
- **T2-F13-03**: Search bar input `"telenor"`; assert case-insensitive filtering displays only Telenor post-paid bill.
- **T2-F13-04**: Add expense modal: enter non-numeric characters in amount field; assert blocked or parsed to 0.
- **T2-F13-05**: Delete expense with confirmation prompt cancelled; assert expense remains in table.

#### F14: Current Month Report View (Boundaries)
- **T2-F14-01**: Current month report when system clock is set to December 31, 23:59:59; assert displays December report.
- **T2-F14-02**: Current month report when system clock ticks over to January 1, 00:00:00; assert displays new year January report.
- **T2-F14-03**: Current month with 0 sales and 5 expenses; assert Net Profit card displays red background and negative number.
- **T2-F14-04**: Daily table with 0 sales on all days; assert table renders 30/31 rows with 0s without crashing.
- **T2-F14-05**: Clicking `[ History ➔ ]` while live report data is loading; assert cleanly aborts or switches without race condition.

#### F15: Past Months History View (Boundaries)
- **T2-F15-01**: History list with 60 past months (5 years of history); assert virtualized or smooth scroll performance.
- **T2-F15-02**: Past month row with negative profit (March -8,095); assert net profit badge displays red text and negative sign.
- **T2-F15-03**: Past month row with zero sales; assert displays "PKR 0" cleanly.
- **T2-F15-04**: Rapid clicking on multiple month rows; assert loads the last clicked month detail without UI glitch.
- **T2-F15-05**: Pressing browser back button while in History view; assert navigates back to previous app tab.

#### F16: Historical Month Detail View (Boundaries)
- **T2-F16-01**: Inspect March 2026; assert remarks column on Day 1 shows `"1500"`, Day 15 shows `"15000"`, Day 31 shows `"15000"`.
- **T2-F16-02**: Inspect August 2026 (partial month); assert Days 1–10 have data, Days 11–31 show 0, no unhandled exceptions.
- **T2-F16-03**: Click `[ ⬅ Back to History ]`; assert returns to History view with scroll position preserved.
- **T2-F16-04**: Attempt to trigger inline edit on historical table cells; assert cells are strictly immutable.
- **T2-F16-05**: Inspect July 2026; assert dates render as `2026-07-01` through `2026-07-31` (not 2025).

---

### 7.3 Tier 3: Cross-Feature Combinations (Pairwise Interactions, 25 Scenarios)

- **T3-01 (F3 + F5)**: Load seed data (44 expenses). Execute `getExpensesByMonth(2026, 3)` -> assert 8 items. Update March Shop Rent from 25,000 to 26,000 -> assert persisted. Delete one March expense -> assert count drops to 7.
- **T3-02 (F5 + F9)**: Start with active month having GP = 100,000 and 0 expenses (Net Profit = 100,000). Add expense of 40,000 -> query report -> assert Net Profit = 60,000. Add expense of 70,000 -> query report -> assert Net Profit = -10,000.
- **T3-03 (F6 + F5 + F9)**: Fresh active month with GP = 150,000. Trigger `applyRecurringExpenses` (adds 113,000). Query monthly report -> assert Total Expenses = 113,000, Net Profit = 37,000.
- **T3-04 (F6 + F6)**: Trigger `applyRecurringExpenses(2026, 10)` -> assert `{ applied: 9, skipped: 0 }`. Immediately trigger again -> assert `{ applied: 0, skipped: 9 }`. Query `getExpensesByMonth` -> assert exactly 9 records exist, no duplicates.
- **T3-05 (F7 + F8 + F9)**: Create 3 sales transactions across Day 5, Day 12, and Day 20. Query monthly report -> assert `dailyData` has sales and GP in rows 5, 12, and 20; sum of daily sales matches `grossSales`; sum of daily GP matches `grossProfit`; Net Profit matches `grossProfit - totalExpenses`.
- **T3-06 (F10 + F14 + F15 + F16)**: User opens Reports page (Current Month View, F14). Clicks `[ History ➔ ]` -> switches to History View (F15). Clicks "May 2026" row -> switches to Historical Detail (F16) showing Net Profit `-8433`. Clicks `[ ⬅ Back to History ]` -> returns to History View (F15). Clicks `[ ⬅ Current Month ]` -> returns to Current Month View (F14).
- **T3-07 (F10 + F5)**: Add a new expense for March 2026 in `expenses` table. Query `getMonthlyReportDetail(2026, 3)` -> assert returned snapshot from `monthly_reports` is immutable and still reports original `totalExpenses == 111865` and `netProfit == -8095`.
- **T3-08 (F13 + F5 + F12)**: Navigate to Expenses page via sidebar (F12). Fill "Add Expense" form for current month (F13). Form calls `createExpense` (F5). Expense appears in table. Total Expenses KPI card increases by amount.
- **T3-09 (F13 + F6 + F14)**: On Expenses page, click "Load Recurring Overheads" (F6). 9 items created. Switch to Monthly Reports page (F14). Current month report Total Expenses card immediately reflects +113,000 PKR and Net Profit updates.
- **T3-10 (F17-SUGGEST-05 + F7)**: Inventory item has stock = 1. User tries to sell 2 in POS -> blocked by pre-checkout validation (SUGGEST-05). User changes quantity to 1 -> sale completes. Monthly report engine (F7) updates: Gross Sales increases by item price, COGS increases by item cost price.
- **T3-11 (F17-SUGGEST-02 + F7 + F9)**: Complete a sale of 50,000 PKR with 30,000 COGS (GP = 20,000). Net Profit increases by 20,000. Delete the sale invoice -> inventory stock restored (SUGGEST-02) -> report recomputes: Gross Sales decreases by 50,000, GP decreases by 20,000, Net Profit decreases by 20,000.
- **T3-12 (F17-SUGGEST-03 + F7)**: Adjustment created giving out serialized item with net difference +5,000 PKR. Serial status changes to `SOLD` (SUGGEST-03). Report engine reflects swap margin / net difference in financial summary.
- **T3-13 (F17-BUG-08 + F7)**: Create 3 repair tickets. Mark 1 as `DELIVERED`. `activeRepairsCount` derived dynamically as 2 (BUG-08). Report engine includes revenue from the delivered ticket in `repairRevenue`.
- **T3-14 (F17-SUGGEST-04 + F7)**: Create sale with subtotal 100,000 PKR and discount 10,000 PKR (`totalAmount = 90000`). Report engine records `grossSales = 90000` and `discounts = 10000`.
- **T3-15 (F8 + F14)**: In current month report view, inspect daily table. Remarks entered on Day 15 and Day 30 in daily ledger appear in the corresponding table rows.
- **T3-16 (F1 + F4 + F5)**: Delete database file, restart application. `initDb` creates `expenses` table and seeds 44 records. Call `getMonthlyExpenseSummary(2026, 4)` -> returns `117808`.
- **T3-17 (F2 + F4 + F10)**: Delete database file, restart application. `initDb` creates `monthly_reports` and seeds 6 snapshots. Call `getMonthlyReportsHistory()` -> returns all 6 months with correct net profits.
- **T3-18 (F5 + F13)**: Filter Expenses page by category `'UTILITIES'` for July 2026 -> returns Electricity (5518), Telephone (3700), Telenor (1250). Category total equals 10,468 PKR.
- **T3-19 (F7 + F14)**: In active month, record sale on Day 1 and expense on Day 1. KPI cards show positive/negative net profit. Day 1 row in table shows sales and profit.
- **T3-20 (F8 + F16)**: Open June 2026 detail. June has 30 days. Assert table contains Day 1 through Day 30. Assert Day 31 row does not exist. Assert June 23 row displays sales `14280` and GP `62220`.
- **T3-21 (F5 + F6 + F13)**: On Expenses page, load recurring overheads. Edit `ARSLAN BAHI SALARY` from 17,000 to 18,000. Assert update succeeds and total increases by 1,000.
- **T3-22 (F11 + F12)**: Verify sidebar navigation layout: "Expenses & Bills" is grouped with Operations, while "Monthly Reports" sits at the bottom of the sidebar. Active tab switches cleanly between both.
- **T3-23 (F7 + F10)**: Request report for September 2026 (not in historical archive). System dynamically computes live report from September sales and expenses without error.
- **T3-24 (F9 + F16)**: Open March 2026 detail view. Assert Gross Profit card is 103,770, Total Expenses card is 111,865, Net Profit card is -8,095 with red accent.
- **T3-25 (F17-SUGGEST-02 + F17-BUG-08)**: Delete a repair ticket that consumed 1 inventory spare part. Inventory quantity for the spare part is incremented by 1, and active repairs count updates.

---

### 7.4 Tier 4: Real-World Application Workloads (5 Multi-Step Scenarios)

#### Workload 1: Full Monthly Shop Operating Cycle
1. **Setup & Initialization**: Store manager launches ComputerShopOS on September 1, 2026. Database initializes with 6 historical months.
2. **Apply Monthly Overheads**: Manager navigates to "Expenses & Bills", selects September 2026, and clicks "Load Recurring Overheads". System creates 9 overhead expenses totaling 113,000 PKR.
3. **Daily Operations (Days 1–14)**:
   - Day 1: POS sale of 2 ThinkPad laptops (300,000 PKR total, 250,000 COGS, GP = 50,000). Serial numbers marked SOLD.
   - Day 5: Walk-in sale of 4 RAM sticks (128,000 PKR, 104,000 COGS, GP = 24,000).
   - Day 10: Cash expense of 2,500 PKR added for "Tea & Refreshments" (`TEA_FOOD`).
4. **Mid-Month Salary Advance**: On Day 15, Tasnim draws 15,000 PKR cash advance. Recorded in remarks / expenses.
5. **Daily Operations (Days 16–30)**:
   - Day 20: GPU sale of RTX 4080 Super (285,000 PKR, 250,000 COGS, GP = 35,000).
   - Day 28: Utility bill adjustment: Electricity bill comes in higher at 6,500 PKR (updated from 5,200).
6. **Month-End Financial Audit & Snapshot**:
   - Manager navigates to "Monthly Reports".
   - Current Month View verifies:
     - Gross Sales: 300,000 + 128,000 + 285,000 = 713,000 PKR.
     - COGS: 250,000 + 104,000 + 250,000 = 604,000 PKR.
     - Gross Profit: 713,000 - 604,000 = 109,000 PKR.
     - Total Expenses: 113,000 (base) + 2,500 (tea) + 1,300 (elec increase) = 116,800 PKR.
     - Net Profit: 109,000 - 116,800 = -7,800 PKR (Net loss highlighted in red).
   - Daily breakdown table displays entries on Days 1, 5, 10, 15, 20, 28, and zero-sales on other days.

#### Workload 2: Inventory Restock, Sale, and Expense Interplay
1. **Receive Stock from Supplier**: Manager creates purchase order for 10 ASUS motherboards at 55,000 PKR cost price from "Al-Rehman Computers" on credit.
2. **Stock Verification**: Inventory quantity increases from 6 to 16. Supplier balance in payables increases by 550,000 PKR.
3. **Customer Sales**:
   - Customer A buys 2 motherboards for 68,000 each (136,000 total, 110,000 COGS, paid cash). Stock decreases to 14.
   - Customer B attempts to buy 15 motherboards -> blocked by pre-checkout validation (only 14 available). Customer B buys 14 motherboards -> stock becomes 0.
4. **Supplier Payment Recorded as Expense**: Shop pays 200,000 PKR cash partial payment to supplier. Recorded under Expenses as "Supplier Payment / Overheads".
5. **Financial Report Reconciliation**:
   - Live monthly report engine verifies sales = 136,000 + 952,000 = 1,088,000 PKR.
   - COGS = 880,000 PKR; GP = 208,000 PKR.
   - Net Profit accurately computes Gross Profit minus operating expenses.

#### Workload 3: Repair Service Lifecycle & Revenue Integration
1. **Receive Repair**: Customer brings in damaged gaming laptop with failed SSD. Technician logs ticket #REP-2026-001 with estimated cost 15,000 PKR.
2. **Active Repairs Derivation**: Dashboard derives `activeRepairsCount` as 3 (live count, non-delivered).
3. **Part Consumption**: Repair technician assigns Samsung 990 PRO 2TB SSD from inventory to the repair ticket. Inventory quantity decrements by 1.
4. **Complete & Deliver**: Technician finishes repair, sets final cost to 18,000 PKR, collects cash, and marks ticket `DELIVERED`.
5. **Dynamic Count & Report Update**:
   - `activeRepairsCount` drops to 2.
   - Monthly report engine reflects +18,000 PKR under `repairRevenue`.
   - Net Profit accounts for repair revenue gain.

#### Workload 4: Historical Audit & Multi-Month Trend Comparison
1. **Navigate to History**: Auditor opens ComputerShopOS, clicks "Monthly Reports", then clicks `[ History ➔ ]`.
2. **Audit 6 Historical Months**:
   - March 2026: Asserts Net Profit is `-8,095` PKR (Loss).
   - April 2026: Asserts Net Profit is `+5,582` PKR (Profit).
   - May 2026: Asserts Net Profit is `-8,433` PKR (Loss).
   - June 2026: Asserts Net Profit is `+72,652` PKR (High-profit peak month).
   - July 2026: Asserts Gross Sales is highest at `850,540` PKR, Net Profit `+51,512` PKR.
   - August 2026: Asserts partial month (10 days) with Net Profit `+15,760` PKR.
3. **Inspect Month Detail**:
   - Auditor clicks "July 2026".
   - Verifies 31 daily rows.
   - Verifies all dates are formatted `2026-07-01` through `2026-07-31` (verifying typo fix).
   - Verifies 9 expenses listed totaling 113,568 PKR.
4. **Return to History**: Auditor clicks `[ ⬅ Back to History ]`, confirms list state is preserved.

#### Workload 5: Error Recovery, Voided Transactions & Reconciliation
1. **Erroneous High-Value Sale**: Cashier accidentally enters a sale for 5 RTX 4080 Super GPUs (1,425,000 PKR) instead of 1. Stock drops from 4 to -1 (or to 0).
2. **Report Impact Observed**: Monthly report immediately reflects inflated Gross Sales and GP.
3. **Immediate Void / Delete**: Manager detects error within 5 minutes, opens Sales invoice list, and deletes invoice `INV-2026-042`.
4. **Stock & Report Auto-Restoration**:
   - System invokes `deleteSale`: all 5 GPUs restored to inventory.
   - Monthly report engine recalculates: Gross Sales and GP drop back to pre-sale values.
   - Daily breakdown table row reverts to normal.
   - Net Profit re-aligns with actual shop numbers with 0 drift.

---

## 8. Interface Contracts & Type Definitions

Defined in `src/db/schema.ts` and service layer:

```typescript
export const ExpenseCategories = [
  "RENT",
  "UTILITIES",
  "SALARY",
  "SECURITY_GUARD",
  "INTERNET",
  "TEA_FOOD",
  "MAINTENANCE",
  "MARKETING",
  "MISC",
] as const;
export type ExpenseCategory = (typeof ExpenseCategories)[number];

export interface ExpenseRecord {
  id: number;
  year: number;
  month: number;
  category: ExpenseCategory;
  title: string;
  amount: number;
  expenseDate: number;
  paymentMethod: string;
  notes?: string;
  createdAt: number;
}
export type CreateExpenseInput = Omit<ExpenseRecord, "id" | "createdAt">;

export interface DailyReportRow {
  day: number;
  date: string;       // "YYYY-MM-DD"
  dayOfWeek: string;  // "MONDAY".."SUNDAY"
  sales: number;
  grossProfit: number;
  remarks: string;
}

export interface MonthlyReportDetail {
  year: number;
  month: number;
  monthLabel: string;
  grossSales: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  collectedCash: number;
  receivables: number;
  payables: number;
  repairRevenue: number;
  swapMargin: number;
  dailyData: DailyReportRow[];
  expenses: ExpenseRecord[];
  status: "OPEN" | "CLOSED";
}
```

---

## 9. Conclusion & Recommendations for Test Writers

1. **Strict Opaque-Box Execution**: Tests should interact through public service APIs (`expenseService.ts`, `reportService.ts`, `posService.ts`) and DOM element queries (`data-testid` or accessible role/text selectors) rather than internal mock hacks.
2. **Environment Agnostic Runner**: Test assertions must pass equally in Tauri runtime (with SQLite) and headless Node/browser runner (with `memoryStore`).
3. **Exact Numerical Precision**: No fuzzy rounding on currency; all assertions must check exact integer rupees matching the authoritative Excel baseline.
