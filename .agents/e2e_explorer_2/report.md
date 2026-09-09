# Architectural & Test Infrastructure Investigation Report: Database Initialization, Isolation, Public Contracts, and E2E Layout

**Agent**: `e2e_explorer_2` (teamwork_preview_explorer)  
**Parent Orchestrator**: `sub_orch_e2e_1` (`7eef4fd8-0661-4fa1-a41c-da6d2258ba41`)  
**Working Directory**: `/home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/e2e_explorer_2`  
**Date**: September 4, 2026  
**Scope**: Database initialization and isolation in testing/headless environments (`src/db/client.ts`, schema, in-memory fallback), public interface contracts, and recommended modular layout for `tests/e2e/`.

---

## 1. Executive Summary

ComputerShopOS is a desktop POS and computer shop management application built on Tauri v2 (Rust backend) and React 19 / TypeScript / Tailwind CSS (frontend). The project architecture relies on a dual-engine database strategy:
1. **Tauri Runtime Mode**: Operates against an embedded SQLite database (`pc_shop.db`) using the `@tauri-apps/plugin-sql` plugin with WAL mode and foreign key support.
2. **Headless / Browser Fallback Mode**: When executed outside Tauri (such as during Vite browser preview or headless automated testing in Node.js), the database client seamlessly falls back to an in-memory datastore (`memoryStore` in `src/db/client.ts`).

This investigation established that:
- In headless test execution (Node.js/tsx/vitest), `isTauri` evaluates to `false` because `window.__TAURI_INTERNALS__` is absent.
- All application services (`posService.ts`, `customerService.ts`, `inventoryService.ts`, and the incoming `expenseService.ts` and `reportService.ts`) contain dual execution branches: executing raw SQL when running in Tauri, and operating on `memoryStore` collections when running in headless mode.
- In-memory execution shares mutable module-level arrays across test cases, posing a significant risk of **cross-test pollution** and order-dependent failures unless isolated.
- Test isolation can be cleanly and reliably achieved without modifying private service methods through an **in-place snapshot/restore pattern** (`tests/e2e/fixtures/dbReset.ts`) that resets array contents without breaking reference identities, coupled with file-level process isolation from the test runner.
- The public interface contracts defined in `PROJECT.md` for `expenseService.ts`, `reportService.ts`, `navTypes.ts`, `AppSidebar.tsx`, and `AppRouter.tsx` provide clear, high-level opaque-box boundaries for testing features F1 through F16 across Tiers 1 through 4.
- A 4-tier modular directory layout for `tests/e2e/` is proposed, mapping directly to Feature Coverage (Tier 1), Boundary & Corner Cases (Tier 2), Pairwise Cross-Feature Interactions (Tier 3), and Real-World End-to-End Workflows (Tier 4).

---

## 2. Database Initialization Architecture (`src/db/client.ts`)

### 2.1 Tauri Mode vs. Headless Mode Detection

In `src/db/client.ts` (lines 5–8):
```typescript
let sqlDb: Database | null = null;
let isInitialized = false;

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
```

- When running inside the Tauri desktop application, `window.__TAURI_INTERNALS__` is injected by the Tauri webview, setting `isTauri = true`.
- When running in any headless testing environment (Node.js, Vitest, tsx, Node `--test`), `window` is `undefined` (or lacks `__TAURI_INTERNALS__`), setting `isTauri = false`.
- The helper `isTauriEnvironment()` returns `isTauri && sqlDb !== null`. In headless testing, this unconditionally returns `false`.

### 2.2 `initDb()` Lifecycle and Flow

`initDb()` (lines 276–673) executes the following sequence:
1. **Idempotency Guard**: `if (isInitialized) return;` prevents duplicate initialization.
2. **Tauri Branch (`if (isTauri)`)**:
   - Loads `sqlite:pc_shop.db` via `Database.load(...)`.
   - Sets PRAGMAs: `journal_mode = WAL`, `synchronous = NORMAL`, `foreign_keys = ON`, `busy_timeout = 5000`.
   - Executes DDL array `tableQueries` (`CREATE TABLE IF NOT EXISTS ...`).
   - Runs non-destructive column migrations (`ALTER TABLE sales ADD COLUMN ...`).
   - Executes index array `indexQueries` (`CREATE INDEX IF NOT EXISTS ...`).
   - Checks table counts to conditionally seed initial data from `seedData.json`.
   - Synchronizes opening balances in `payable_ledger` and standardizes invoice numbers.
   - Sets `isInitialized = true` and returns.
3. **Headless / Browser Memory Branch**:
   - If `isTauri` is false or `Database.load(...)` fails, execution drops into the memory fallback (lines 579–672).
   - If `memoryStore.payableParties.length === 0`, it calls `loadSeedData()` and populates `memoryPayableParties`, `memoryPayableLedger`, and `memorySales`.
   - Standardizes invoice numbering format (`INV-YYYY-XXX`).
   - Ensures opening balance ledger entries exist for payable parties.
   - Sets `isInitialized = true`.

### 2.3 Milestone 1 Database Additions

Milestone 1 (`sub_orch_m1_1`, `explorer_m1_1`, `explorer_m1_2`, `explorer_m1_3`) is introducing:
1. **Schema DDL**:
   - `expenses` table: `id`, `year`, `month`, `category`, `title`, `amount`, `expense_date`, `payment_method`, `notes`, `created_at`.
   - `monthly_reports` table: `id`, `year`, `month`, `month_label`, `gross_sales`, `gross_profit`, `total_expenses`, `net_profit`, `collected_cash`, `receivables`, `payables`, `repair_revenue`, `swap_margin`, `daily_data_json`, `expense_data_json`, `status`, `created_at`, `updated_at`.
2. **Indexes**:
   - `idx_expenses_year_month`, `idx_expenses_date`, `idx_expenses_category`.
   - `idx_monthly_reports_year_month` (UNIQUE on `year, month`).
3. **Independent Table Count Checks**:
   - In existing code, seeding was gated behind `SELECT COUNT(*) FROM payable_parties === 0`.
   - M1 decouples this with independent checks:
     - `SELECT COUNT(*) FROM expenses === 0` -> seeds historical expenses from `seedData.json`.
     - `SELECT COUNT(*) FROM monthly_reports === 0` -> seeds March 2026 – August 2026 snapshots from `seedData.json`.
4. **Memory Store Parity**:
   - Adds `memoryExpenses: schema.ExpenseRecord[] = []` and `memoryMonthlyReports: schema.MonthlyReportRecord[] = []` to `memoryStore` in `client.ts`.
   - Fallback `initDb()` populates `memoryStore.expenses` and `memoryStore.monthlyReports` from `seedData.json`.

### 2.4 Structure of `memoryStore`

The exported `memoryStore` object in `src/db/client.ts` (lines 709–722) contains:
```typescript
export const memoryStore = {
  customers: memoryCustomers,
  inventory: memoryInventory,
  serials: memorySerials,
  sales: memorySales,
  saleItems: memorySaleItems,
  repairs: memoryRepairs,
  adjustments: memoryAdjustments,
  settings: memorySettings,
  payableParties: memoryPayableParties,
  payableLedger: memoryPayableLedger,
  purchases: memoryPurchases,
  purchaseItems: memoryPurchaseItems,
  // Added by M1:
  expenses: memoryExpenses,
  monthlyReports: memoryMonthlyReports,
};
```

---

## 3. Public Interface Contracts Analysis

Opaque-box testing requires testing against the public interfaces defined in `PROJECT.md` rather than internal implementation details.

### 3.1 Domain Types & Interfaces (`src/db/schema.ts`)

| Type / Interface | Purpose & Fields |
|---|---|
| `ExpenseRecord` | `{ id: number; year: number; month: number; category: string; title: string; amount: number; expenseDate: number; paymentMethod: string; notes?: string; createdAt?: number }` |
| `CreateExpenseInput` | `Omit<ExpenseRecord, "id">` |
| `UpdateExpenseInput` | `Partial<CreateExpenseInput>` |
| `DailyReportRow` | `{ day: number; date: string; dayOfWeek: string; sales: number; grossProfit: number; remarks: string }` |
| `MonthlyReportDetail` | `{ id?: number; year: number; month: number; monthLabel: string; grossSales: number; grossProfit: number; totalExpenses: number; netProfit: number; collectedCash: number; receivables: number; payables: number; repairRevenue: number; swapMargin: number; dailyData: DailyReportRow[]; expenses: ExpenseRecord[]; status: "OPEN" \| "CLOSED"; createdAt?: number; updatedAt?: number }` |
| `MonthlyExpenseSummary`| `{ total: number; byCategory: Record<string, number>; count?: number }` |
| `MonthlyReportHistoryItem`| `Omit<MonthlyReportDetail, 'dailyData' \| 'expenses'>` |
| `ExpenseCategories` | `["RENT", "UTILITIES", "SALARY", "SECURITY_GUARD", "INTERNET", "TEA_FOOD", "MAINTENANCE", "MARKETING", "MISC"]` |
| `ReportStatuses` | `["OPEN", "CLOSED"]` |

### 3.2 `src/db/expenseService.ts` Service Contract

`expenseService.ts` exports 6 primary functions:
1. `createExpense(input: CreateExpenseInput): Promise<number>`
   - Inserts record into database (or `memoryStore.expenses`).
   - Returns generated positive integer ID.
   - Enforces integer amount and valid category.
2. `getExpensesByMonth(year: number, month: number): Promise<ExpenseRecord[]>`
   - Queries expenses filtered by `year` and `month`.
   - Returns array ordered by `expenseDate DESC, id DESC`.
3. `updateExpense(id: number, input: Partial<CreateExpenseInput>): Promise<void>`
   - Modifies existing expense by ID.
   - Throws error if ID does not exist.
4. `deleteExpense(id: number): Promise<void>`
   - Removes expense by ID.
   - Throws error if ID does not exist.
5. `getMonthlyExpenseSummary(year: number, month: number): Promise<MonthlyExpenseSummary>`
   - Computes `{ total: number, byCategory: Record<string, number> }`.
   - Total must equal the sum of all category totals.
6. `applyRecurringExpenses(year: number, month: number): Promise<{ applied: number; skipped: number }>`
   - Generates standard shop recurring overheads template:
     * Rent: 40,000 PKR
     * Utilities (Electricity): 25,000 PKR
     * Staff Salaries: 30,000 PKR
     * Security Guard: 5,000 PKR
     * Internet: 3,500 PKR
     * Tea / Food: 4,000 PKR
     * Maintenance: 2,500 PKR
     * Marketing: 2,000 PKR
     * Misc: 1,000 PKR
     * **Template Total**: 113,000 PKR (9 items).
   - Idempotent: Skips any item that already exists for that year and month. Returns count of `{ applied, skipped }`.

### 3.3 `src/db/reportService.ts` Service Contract

`reportService.ts` exports 3 primary functions:
1. `getMonthlyReport(year: number, month: number): Promise<MonthlyReportDetail>`
   - Checks if a historical snapshot exists in `monthly_reports`. If so, returns snapshot.
   - For open/live months, queries date range `[startOfMonth, endOfMonth)` across sales, sale items, inventory cost prices, repairs, adjustments, and expenses.
   - Constructs `dailyData`: array of `DailyReportRow` for every calendar day in the month (e.g. 1..31).
   - Invariant formula: `netProfit = grossProfit - totalExpenses`.
2. `getMonthlyReportsHistory(): Promise<MonthlyReportHistoryItem[]>`
   - Returns summary list of all available monthly reports sorted descending by year and month.
   - Omits heavy `dailyData` and `expenses` arrays to support efficient history listing.
3. `getMonthlyReportDetail(year: number, month: number): Promise<MonthlyReportDetail>`
   - Returns the complete detail report for a specific historical or current month, including `dailyData` and `expenses`.

### 3.4 Navigation, Layout & UI Route Contracts

1. **`src/components/layout/navTypes.ts`**:
   - `NavTab` type union must include `"reports"` and `"expenses"`.
2. **`src/components/layout/AppSidebar.tsx`**:
   - Navigation item `"expenses"`: labeled `"Expenses & Bills"`, placed in core operations.
   - Navigation item `"reports"`: labeled `"Monthly Reports"`, relocated to the bottom of the sidebar.
3. **`src/components/AppRouter.tsx`**:
   - Maps `activeTab === "expenses"` to `<ExpensesPage />`.
   - Maps `activeTab === "reports"` to `<ReportsPage />`.
4. **`src/pages/Reports.tsx`**:
   - View 1: Current Month View (KPI cards, 31-day table, top-right `[ History ➔ ]` toggle).
   - View 2: History List View (Scrollable list of single-line containers for past months).
   - View 3: Historical Month Detail View (Full report populated with past snapshot, `[ ⬅ Back to History ]` button).
5. **`src/pages/Expenses.tsx`**:
   - Dedicated page with month filter, "Apply Recurring Overheads" button, category breakdown cards, and CRUD modals/actions.

---

## 4. Database Isolation Strategy for Automated Testing

### 4.1 The Challenge: Shared Mutable In-Memory State

In Node.js, ES modules are cached once evaluated (`import.meta.url`).
When tests run in headless mode:
- `client.ts` instantiates module-level arrays (`memorySales`, `memoryCustomers`, `memoryExpenses`, etc.).
- When Test Suite A creates or deletes an expense, it mutates `memoryStore.expenses`.
- If Test Suite B runs in the same Node process, it will observe the leftover data from Test Suite A.
- This creates test order dependency, intermittent test failures, and corrupted aggregations (such as distorted `totalExpenses` or `netProfit`).

### 4.2 Architectural Alternatives Considered

| Alternative | Mechanism | Pros | Cons | Verdict |
|---|---|---|---|---|
| **A. Tauri IPC in Node** | Run Tauri Rust backend alongside Node runner | Uses real SQLite | Requires running Tauri binary, heavy, non-headless, slow | **Rejected** |
| **B. Mocking Services** | Jest/Vitest `vi.mock()` on service functions | Fast | White-box; defeats opaque-box testing; doesn't test real service logic | **Rejected** |
| **C. Standalone SQLite (`node:sqlite`)** | Redirect queries to Node 24 native SQLite | Tests SQL syntax | Service layer uses `isTauriEnvironment()` which branches to `memoryStore` | **Rejected** |
| **D. In-Place Snapshot & Restore** | Deep snapshot after `initDb()`; restore arrays in-place before each test | Preserves object references, fast, pure TypeScript, tests actual service code | Requires reset fixture | **Recommended** |
| **E. Subprocess Isolation** | Run each test file in a separate Node process | 100% clean memory | Slightly higher startup overhead per file | **Recommended** (Combine with D) |

### 4.3 Recommended Dual-Layer Isolation Pattern

The optimal isolation strategy combines **file-level process isolation** with **case-level in-place snapshot/restore**:

#### Layer 1: In-Place Snapshot & Reset Fixture (`tests/e2e/fixtures/dbReset.ts`)
```typescript
import { initDb, memoryStore } from "../../../src/db/client";

let pristineSnapshot: string | null = null;

/**
 * Initializes the database and records a clean snapshot of the initial state.
 * Must be called once before test execution begins.
 */
export async function setupTestDb(): Promise<void> {
  await initDb();
  if (!pristineSnapshot) {
    pristineSnapshot = JSON.stringify(memoryStore);
  }
}

/**
 * Restores memoryStore collections to the pristine initial snapshot.
 * Mutates arrays in-place (array.length = 0 followed by array.push(...))
 * so that any internal module references remain intact.
 */
export function resetTestDb(): void {
  if (!pristineSnapshot) {
    throw new Error("setupTestDb() must be invoked before resetTestDb()");
  }
  const cleanState = JSON.parse(pristineSnapshot);
  for (const key of Object.keys(memoryStore) as Array<keyof typeof memoryStore>) {
    const target = memoryStore[key];
    const source = cleanState[key];
    if (Array.isArray(target) && Array.isArray(source)) {
      target.length = 0;
      target.push(...source);
    } else if (typeof target === "object" && target !== null && typeof source === "object") {
      Object.keys(target).forEach((k) => delete (target as any)[k]);
      Object.assign(target, source);
    }
  }
}
```

#### Layer 2: Test Suite Integration
Each test suite uses standard test hooks:
```typescript
import { before, beforeEach } from "node:test"; // or vitest describe/beforeEach
import { setupTestDb, resetTestDb } from "../fixtures/dbReset";

describe("Expense Service E2E Tests", () => {
  before(async () => {
    await setupTestDb();
  });

  beforeEach(() => {
    resetTestDb();
  });

  // Test cases run with guaranteed isolated state...
});
```

#### Layer 3: Recommendation for Core Application (`src/db/client.ts`)
We strongly recommend that Milestone 1 export a public maintenance function in `src/db/client.ts`:
```typescript
export function resetMemoryStore(): void {
  // Re-populates memoryStore from clean seedData snapshot
}
```
This simplifies test fixtures and allows hot-reloading in development browser preview without refreshing the window.

---

## 5. Recommended Modular Layout for `tests/e2e/`

To satisfy the E2E Testing Track requirements (`sub_orch_e2e_1`) and project conventions, `tests/e2e/` should be structured as follows:

```
tests/e2e/
├── runner.ts                           # Test runner entrypoint / orchestrator CLI
├── fixtures/
│   ├── dbReset.ts                      # In-place snapshot and reset fixture
│   ├── mockExpenses.ts                 # Expense generators & template helpers
│   ├── mockReports.ts                  # Report verification helpers & baseline data
│   └── mockSales.ts                    # POS sale injection helpers for report testing
├── tier1-feature-coverage/
│   ├── F01-F02-schema-db.test.ts       # F1, F2: Schema declarations & memoryStore collections
│   ├── F03-F04-seed-data.test.ts       # F3, F4: Historical seed loading (Mar-Aug 2026, counts)
│   ├── F05-expense-crud.test.ts        # F5: Expense CRUD (create, getByMonth, update, delete)
│   ├── F06-recurring-expenses.test.ts  # F6: Recurring overheads generator & template items
│   ├── F07-report-engine.test.ts       # F7: Live monthly report date filtering & sales/COGS
│   ├── F08-daily-breakdown.test.ts     # F8: 31-day daily calendar logic & day-of-week
│   ├── F09-net-profit-formula.test.ts  # F9: Invariant Net Profit = Gross Profit - Expenses
│   ├── F10-report-history.test.ts      # F10: Historical reports listing & detail retrieval
│   ├── F11-F12-navigation.test.ts      # F11, F12: Sidebar reorganization & routing contracts
│   └── F13-F16-ui-contracts.test.ts    # F13-F16: UI state contracts (Current, History, Detail)
├── tier2-boundary-corner/
│   ├── expense-boundaries.test.ts      # Zero/negative amounts, future dates, max integers
│   ├── report-boundaries.test.ts       # Feb 28/29 leap year, 30 vs 31 days, zero sales months
│   ├── net-profit-edge.test.ts         # Loss months (GP < Expenses), zero expenses, equal amounts
│   ├── recurring-idempotency.test.ts   # Repeated execution within same month (0 duplicates)
│   └── seed-data-integrity.test.ts     # Missing optional fields, null notes, corrupted JSON
├── tier3-cross-feature/
│   ├── expense-to-report.test.ts       # Adding expense updates report totalExpenses & netProfit
│   ├── sales-to-report.test.ts         # POS sale updates grossSales, grossProfit & daily calendar
│   ├── recurring-to-report.test.ts     # Applying recurring overheads propagates to monthly report
│   ├── repair-swap-margin.test.ts      # Repairs & adjustments margins flow into monthly report
│   ├── delete-cascade.test.ts          # Deleting an expense immediately restores net profit
│   └── historical-isolation.test.ts    # Current month mutations do not alter past snapshots
└── tier4-application-scenarios/
    ├── scenario-1-new-month.test.ts    # Workflow 1: New month inception & recurring overheads
    ├── scenario-2-daily-trading.test.ts# Workflow 2: Daily sales cycle, ad-hoc expenses, live KPI
    ├── scenario-3-history-audit.test.ts# Workflow 3: Auditor navigates history, audits June 2026
    ├── scenario-4-midmonth-fix.test.ts # Workflow 4: Expense correction, sale void, margin recheck
    └── scenario-5-month-close.test.ts  # Workflow 5: Month-end close, vendor payables separation
```

### 5.1 Test Tier Responsibilities & Thresholds

| Tier | Category | Minimum Target | Description |
|---|---|---|---|
| **Tier 1** | Feature Coverage | >= 5 tests per feature (F1–F16) | Validates baseline happy paths and interface contract compliance for every single feature. |
| **Tier 2** | Boundary & Corner | >= 5 tests per feature (F1–F16) | Stresses edge cases: negative amounts, zero amounts, leap years, month-end boundaries, SQL injection patterns, large payloads. |
| **Tier 3** | Pairwise Interactions | All feature pairs | Evaluates interactions between subsystems (e.g. Sales ↔ Reports, Expenses ↔ Reports, Recurring ↔ Summary, Deletion ↔ Net Profit). |
| **Tier 4** | Real-World Workflows | >= 5 complete workflows | Executes realistic multi-step business operating scenarios reflecting day-to-day shop activities. |

---

## 6. Synthesis with Mining and Survey Findings

### 6.1 Ground Truth Baseline Data from `Monthly Report 2026.xlsx`

Our investigation verified the accounting figures extracted by `e2e_spec_miner_1`:
- **Active Months**: March 2026 through August 2026.
- **Total Historical Sales**: 3,327,270 PKR.
- **Total Gross Profit**: 736,133 PKR.
- **Total Operating Expenses**: 607,155 PKR.
- **Total Net Profit**: +128,978 PKR.
- **Negative Profit Months Observed**: March 2026 (-8,095 PKR) and May 2026 (-8,433 PKR). This proves that the report engine and test suite must properly support negative net profits (losses).
- **July 2026 Date Normalization**: The raw Excel sheet contains dates formatted as `2025-07-xx` due to manual entry typos, but with day-of-week corresponding to 2026. The seed data and test expectations must use normalized `2026-07-xx` dates.

### 6.2 Test Runner Command Integration

Because the repository uses Vite 7, React 19, and Node 24:
- The test runner can execute via `node --test` with native TypeScript strip-types or via a lightweight test runner entrypoint (`tests/e2e/runner.ts`).
- Clean exit code `0` on 100% pass and non-zero on failure ensures full automation capability in CI and sub-orchestrator verification.
- A script entry in `package.json`: `"test:e2e": "node --test tests/e2e/**/*.test.ts"` (or `node tests/e2e/runner.ts`).

---

## 7. Actionable Guidance for Test Implementers

1. **Importing DB Services**: In test files, import directly from `src/db/expenseService`, `src/db/reportService`, `src/db/client`, and `src/db/schema`.
2. **Mandatory Fixture Usage**: Every test suite must invoke `await setupTestDb()` in `before()` and `resetTestDb()` in `beforeEach()`.
3. **No Private Method Coupling**: Never access unexported local variables inside service files. Interact only through exported service functions and `memoryStore`.
4. **Assert Exact Ground Truth**: For historical seed tests, assert exact figures from the March–August 2026 ledger.
5. **Enforce Net Profit Invariant**: In all test cases involving report generation, verify:
   $$\text{netProfit} = \text{grossProfit} - \text{totalExpenses}$$
