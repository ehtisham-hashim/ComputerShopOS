# Analysis: SQLite Client Initialization, Migrations & In-Memory Store (M1.3)

**Author**: `explorer_m1_3` (teamwork_preview_explorer)  
**Date**: 2026-09-04  
**Target File**: `src/db/client.ts`  
**Related Files**: `src/db/schema.ts`, `src/db/seedData.json`, `context/extracted_historical_reports.json`

---

## 1. Executive Summary

This investigation analyzes `src/db/client.ts` to design the database migrations, indexing, in-memory preview fallback, and safe startup seeding for the new **Monthly Reports** and **Expenses & Bills** modules.

### Key Findings:
1. **Existing DDL Architecture (`tableQueries`)**: All SQLite tables in ComputerShopOS are created via `tableQueries` in `initDb()` using `CREATE TABLE IF NOT EXISTS` with `INTEGER PRIMARY KEY AUTOINCREMENT` and integer-based currency columns. Adding `expenses` and `monthly_reports` here ensures non-destructive execution across fresh and existing installations.
2. **Index Optimization (`indexQueries`)**: Milestone 2 and Milestone 4 require fast queries on month/year filters, date ranges, and category aggregations. Adding `idx_expenses_year_month`, `idx_expenses_date`, `idx_expenses_category`, and a unique index `idx_monthly_reports_year_month` fulfills all query performance requirements and prevents duplicate monthly snapshots.
3. **Flaw in Existing Seeding Logic & The Need for Independent Checks**: In `src/db/client.ts` (lines 493–519), seed data insertion is currently guarded by `SELECT COUNT(*) as cnt FROM payable_parties`. In any pre-existing database where `payable_parties` already has rows, tying new table seeding to this condition will cause historical monthly reports (March–August 2026) and fixed expenses to **never be seeded**. Introducing independent table count checks (`COUNT(*) FROM monthly_reports` and `COUNT(*) FROM expenses`) is essential for safe migrations.
4. **Browser In-Memory Preview Parity**: When running outside Tauri (e.g. standard browser preview via `vite`), `client.ts` falls back to `memoryStore`. Adding `memoryExpenses` and `memoryMonthlyReports` to `memoryStore`, and populating them during fallback initialization from `seedData.json`, guarantees 100% feature parity in browser development mode.

---

## 2. Table Schema & DDL Design (`tableQueries`)

In `src/db/client.ts` (lines 288–453), `initDb()` defines `tableQueries: string[]`.

### 2.1 `expenses` Table DDL
To align with `src/db/schema.ts` (lines 454–467) and `PROJECT.md § Interface Contracts`:

```sql
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'MISC',
  title TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  expense_date INTEGER NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'CASH',
  notes TEXT DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
)
```

#### Column Mapping & Rationale:
| Column | SQLite Type | Constraints | Drizzle (`schema.ts`) | Description |
|---|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | `id` | Unique expense row ID |
| `year` | INTEGER | NOT NULL | `year` | Calendar year (e.g., `2026`) |
| `month` | INTEGER | NOT NULL | `month` | Calendar month (1–12, e.g., `3` for March) |
| `category` | TEXT | NOT NULL DEFAULT 'MISC' | `category` | Expense category (`RENT`, `SALARY`, `UTILITIES`, etc.) |
| `title` | TEXT | NOT NULL | `title` | Description/title (e.g., `"SHOP RENT"`) |
| `amount` | INTEGER | NOT NULL DEFAULT 0 | `amount` | Amount in integer currency units (PKR) |
| `expense_date` | INTEGER | NOT NULL | `expenseDate` | Unix timestamp in seconds |
| `payment_method` | TEXT | NOT NULL DEFAULT 'CASH' | `paymentMethod` | Payment method (`CASH`, `CARD`, `BANK`, etc.) |
| `notes` | TEXT | DEFAULT '' | `notes` | Optional notes |
| `created_at` | INTEGER | NOT NULL DEFAULT (strftime('%s', 'now')) | `createdAt` | Unix timestamp in seconds |

### 2.2 `monthly_reports` Table DDL
To align with `src/db/schema.ts` (lines 473–496) and `PROJECT.md § Interface Contracts`:

```sql
CREATE TABLE IF NOT EXISTS monthly_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  month_label TEXT NOT NULL,
  gross_sales INTEGER NOT NULL DEFAULT 0,
  gross_profit INTEGER NOT NULL DEFAULT 0,
  total_expenses INTEGER NOT NULL DEFAULT 0,
  net_profit INTEGER NOT NULL DEFAULT 0,
  collected_cash INTEGER NOT NULL DEFAULT 0,
  receivables INTEGER NOT NULL DEFAULT 0,
  payables INTEGER NOT NULL DEFAULT 0,
  repair_revenue INTEGER NOT NULL DEFAULT 0,
  swap_margin INTEGER NOT NULL DEFAULT 0,
  daily_data_json TEXT NOT NULL DEFAULT '[]',
  expense_data_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'CLOSED',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
)
```

#### Column Mapping & Rationale:
| Column | SQLite Type | Constraints | Drizzle (`schema.ts`) | Description |
|---|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | `id` | Snapshot ID |
| `year` | INTEGER | NOT NULL | `year` | Year of snapshot (e.g., `2026`) |
| `month` | INTEGER | NOT NULL | `month` | Month of snapshot (1–12) |
| `month_label` | TEXT | NOT NULL | `monthLabel` | Formatted label (e.g. `"March 2026"`) |
| `gross_sales` | INTEGER | NOT NULL DEFAULT 0 | `grossSales` | Total revenue for month |
| `gross_profit` | INTEGER | NOT NULL DEFAULT 0 | `grossProfit` | Gross profit for month |
| `total_expenses` | INTEGER | NOT NULL DEFAULT 0 | `totalExpenses` | Sum of all expenses for month |
| `net_profit` | INTEGER | NOT NULL DEFAULT 0 | `netProfit` | `gross_profit - total_expenses` |
| `collected_cash` | INTEGER | NOT NULL DEFAULT 0 | `collectedCash` | Total collected cash |
| `receivables` | INTEGER | NOT NULL DEFAULT 0 | `receivables` | Outstanding customer receivables |
| `payables` | INTEGER | NOT NULL DEFAULT 0 | `payables` | Outstanding supplier payables |
| `repair_revenue` | INTEGER | NOT NULL DEFAULT 0 | `repairRevenue` | Repair revenue |
| `swap_margin` | INTEGER | NOT NULL DEFAULT 0 | `swapMargin` | Net margin from trade-ins |
| `daily_data_json` | TEXT | NOT NULL DEFAULT '[]' | `dailyDataJson` | JSON string of 1..31 daily breakdown |
| `expense_data_json` | TEXT | NOT NULL DEFAULT '[]' | `expenseDataJson` | JSON string of monthly expense items |
| `status` | TEXT | NOT NULL DEFAULT 'CLOSED' | `status` | `"OPEN"` or `"CLOSED"` |
| `created_at` | INTEGER | NOT NULL DEFAULT (strftime('%s', 'now')) | `createdAt` | Unix timestamp in seconds |
| `updated_at` | INTEGER | NOT NULL DEFAULT (strftime('%s', 'now')) | `updatedAt` | Unix timestamp in seconds |

---

## 3. Index Strategy (`indexQueries`)

In `src/db/client.ts` (lines 463–487), `indexQueries: string[]` creates indexes using `CREATE INDEX IF NOT EXISTS`.

### Proposed Index Statements:
```typescript
"CREATE INDEX IF NOT EXISTS idx_expenses_year_month ON expenses(year, month)",
"CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date)",
"CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category)",
"CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_reports_year_month ON monthly_reports(year, month)",
```

### Performance & Integrity Justification:
1. **`idx_expenses_year_month`**:
   - Query: `SELECT * FROM expenses WHERE year = ? AND month = ? ORDER BY expense_date DESC`
   - Purpose: Direct coverage for `getExpensesByMonth(year, month)`. Eliminates full table scans when rendering the monthly expenses table or computing monthly overhead totals.
2. **`idx_expenses_date`**:
   - Query: `SELECT * FROM expenses WHERE expense_date >= ? AND expense_date <= ?`
   - Purpose: Used by live report generation (`reportService.ts`) to compute expense totals within arbitrary custom date intervals or calendar boundaries.
3. **`idx_expenses_category`**:
   - Query: `SELECT category, SUM(amount) FROM expenses WHERE year = ? AND month = ? GROUP BY category`
   - Purpose: Used by `getMonthlyExpenseSummary(year, month)` and `Expenses.tsx` to render category cards and charts.
4. **`idx_monthly_reports_year_month` (`UNIQUE`)**:
   - Query: `SELECT * FROM monthly_reports WHERE year = ? AND month = ? LIMIT 1`
   - Query: `SELECT * FROM monthly_reports ORDER BY year DESC, month DESC`
   - Purpose: Guarantees business constraint that **only one snapshot can exist per month**. Enables `INSERT OR IGNORE` and `INSERT OR REPLACE` semantics without duplicating month snapshots. Accelerates historical report lookups and history list sorting.

---

## 4. Safe Startup Seeding Architecture

### 4.1 Existing Seeding Analysis
Currently in `src/db/client.ts` (lines 493–519):
```typescript
try {
  const existingParties = await sqlDb.select<any[]>("SELECT COUNT(*) as cnt FROM payable_parties");
  const count = existingParties?.[0]?.cnt ?? existingParties?.[0]?.["COUNT(*)"] ?? 0;
  if (count === 0) {
    const seedData = await loadSeedData();
    // seeds payableParties, payableLedger, receivables
  }
} catch (seedErr) {
  console.warn("Seeding payables/receivables error:", seedErr);
}
```

### 4.2 The Independent Seeding Imperative
If `seedData.monthlyReports` or `seedData.expenses` were placed inside the `count === 0` block of `payable_parties`:
- On any installation where `payable_parties` already has data (all existing dev/prod environments), `count` is > 0.
- As a result, the entire block is skipped.
- The `monthly_reports` and `expenses` tables would remain permanently empty, breaking the March–August 2026 historical reports feature.

### 4.3 Proposed Implementation: Decoupled Independent Count Checks
Each table family must have its own count check:

```typescript
// 1. Existing Payables/Receivables Seeding (unchanged)
try {
  const existingParties = await sqlDb.select<any[]>("SELECT COUNT(*) as cnt FROM payable_parties");
  const count = existingParties?.[0]?.cnt ?? existingParties?.[0]?.["COUNT(*)"] ?? 0;
  if (count === 0) {
    const seedData = await loadSeedData();
    for (const p of seedData.payableParties || []) { ... }
    for (const l of seedData.payableLedger || []) { ... }
    for (const r of seedData.receivables || []) { ... }
  }
} catch (seedErr) {
  console.warn("Seeding payables/receivables error:", seedErr);
}

// 2. Independent Seeding for monthly_reports
try {
  const existingReports = await sqlDb.select<any[]>("SELECT COUNT(*) as cnt FROM monthly_reports");
  const reportCount = existingReports?.[0]?.cnt ?? existingReports?.[0]?.["COUNT(*)"] ?? 0;
  if (Number(reportCount) === 0) {
    const seedData = await loadSeedData();
    for (const mr of seedData.monthlyReports || []) {
      const dailyDataStr = typeof mr.dailyDataJson === "string"
        ? mr.dailyDataJson
        : JSON.stringify(mr.dailyDataJson || []);
      const expenseDataStr = typeof mr.expenseDataJson === "string"
        ? mr.expenseDataJson
        : JSON.stringify(mr.expenseDataJson || []);
      await sqlDb.execute(
        `INSERT OR IGNORE INTO monthly_reports (
          year, month, month_label, gross_sales, gross_profit, total_expenses,
          net_profit, collected_cash, receivables, payables, repair_revenue,
          swap_margin, daily_data_json, expense_data_json, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          mr.year,
          mr.month,
          mr.monthLabel,
          mr.grossSales ?? 0,
          mr.grossProfit ?? 0,
          mr.totalExpenses ?? 0,
          mr.netProfit ?? 0,
          mr.collectedCash ?? 0,
          mr.receivables ?? 0,
          mr.payables ?? 0,
          mr.repairRevenue ?? 0,
          mr.swapMargin ?? 0,
          dailyDataStr,
          expenseDataStr,
          mr.status ?? "CLOSED",
          mr.createdAt ?? Math.floor(Date.now() / 1000),
          mr.updatedAt ?? Math.floor(Date.now() / 1000),
        ]
      );
    }
  }
} catch (reportSeedErr) {
  console.warn("Seeding monthly_reports error:", reportSeedErr);
}

// 3. Independent Seeding for expenses
try {
  const existingExpenses = await sqlDb.select<any[]>("SELECT COUNT(*) as cnt FROM expenses");
  const expenseCount = existingExpenses?.[0]?.cnt ?? existingExpenses?.[0]?.["COUNT(*)"] ?? 0;
  if (Number(expenseCount) === 0) {
    const seedData = await loadSeedData();
    for (const exp of seedData.expenses || []) {
      await sqlDb.execute(
        `INSERT OR IGNORE INTO expenses (
          year, month, category, title, amount, expense_date, payment_method, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          exp.year,
          exp.month,
          exp.category,
          exp.title,
          exp.amount ?? 0,
          exp.expenseDate,
          exp.paymentMethod ?? "CASH",
          exp.notes ?? "",
          exp.createdAt ?? Math.floor(Date.now() / 1000),
        ]
      );
    }
  }
} catch (expenseSeedErr) {
  console.warn("Seeding expenses error:", expenseSeedErr);
}
```

#### Key Resilience Features:
1. **Dual Column Check**: Checks both `.cnt` and `["COUNT(*)"]` to handle variations across SQLite driver versions.
2. **Type Coercion**: `Number(reportCount) === 0` handles string or numeric returns.
3. **JSON Serialization Guard**: Ensures `dailyDataJson` and `expenseDataJson` are always stringified before insertion, preventing SQLite data type mismatch errors.
4. **Isolated Error Boundaries**: Each seed routine runs inside its own `try/catch`, preventing an issue in one table from blocking initialization of others.

---

## 5. In-Memory Store & Browser Fallback Architecture

### 5.1 Memory Store State Declarations
In `src/db/client.ts` (lines 271–275):
```typescript
const memoryExpenses: schema.Expense[] = [];
const memoryMonthlyReports: schema.MonthlyReportRecord[] = [];
```

Exported in `memoryStore` (lines 709–722):
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
  expenses: memoryExpenses,
  monthlyReports: memoryMonthlyReports,
};
```

### 5.2 Browser Fallback Population in `initDb()`
When `isTauri` is false or `Database.load` fails:
```typescript
  // Populate browser memory fallback if empty
  if (memoryStore.monthlyReports.length === 0 || memoryStore.expenses.length === 0) {
    const seedData = await loadSeedData();
    if (memoryStore.monthlyReports.length === 0 && (seedData.monthlyReports || []).length > 0) {
      for (const [i, mr] of (seedData.monthlyReports || []).entries()) {
        const dailyDataStr = typeof mr.dailyDataJson === "string"
          ? mr.dailyDataJson
          : JSON.stringify(mr.dailyDataJson || []);
        const expenseDataStr = typeof mr.expenseDataJson === "string"
          ? mr.expenseDataJson
          : JSON.stringify(mr.expenseDataJson || []);
        memoryMonthlyReports.push({
          id: mr.id ?? i + 1,
          year: mr.year,
          month: mr.month,
          monthLabel: mr.monthLabel,
          grossSales: mr.grossSales ?? 0,
          grossProfit: mr.grossProfit ?? 0,
          totalExpenses: mr.totalExpenses ?? 0,
          netProfit: mr.netProfit ?? 0,
          collectedCash: mr.collectedCash ?? 0,
          receivables: mr.receivables ?? 0,
          payables: mr.payables ?? 0,
          repairRevenue: mr.repairRevenue ?? 0,
          swapMargin: mr.swapMargin ?? 0,
          dailyDataJson: dailyDataStr,
          expenseDataJson: expenseDataStr,
          status: mr.status ?? "CLOSED",
          createdAt: mr.createdAt ?? Math.floor(Date.now() / 1000),
          updatedAt: mr.updatedAt ?? Math.floor(Date.now() / 1000),
        });
      }
    }
    if (memoryStore.expenses.length === 0 && (seedData.expenses || []).length > 0) {
      for (const [i, exp] of (seedData.expenses || []).entries()) {
        memoryExpenses.push({
          id: exp.id ?? i + 1,
          year: exp.year,
          month: exp.month,
          category: exp.category,
          title: exp.title,
          amount: exp.amount ?? 0,
          expenseDate: exp.expenseDate,
          paymentMethod: exp.paymentMethod ?? "CASH",
          notes: exp.notes ?? "",
          createdAt: exp.createdAt ?? Math.floor(Date.now() / 1000),
        });
      }
    }
  }
```

### 5.3 `loadSeedData()` Safety Update
In `src/db/client.ts` (lines 262–269):
```typescript
async function loadSeedData() {
  try {
    const mod = await import("./seedData.json");
    return (mod as any).default || mod;
  } catch {
    return {
      receivables: [],
      payableParties: [],
      payableLedger: [],
      monthlyReports: [],
      expenses: [],
    };
  }
}
```

---

## 6. Integration Contract Alignment (M1 ↔ M2, M3, M4)

| Component | Target in `client.ts` | Consuming Service / Component | Purpose |
|---|---|---|---|
| `expenses` table | `tableQueries` | `src/db/expenseService.ts` | CRUD operations for expenses, overheads |
| `monthly_reports` table | `tableQueries` | `src/db/reportService.ts` | Monthly snapshot archive & history retrieval |
| `idx_expenses_year_month` | `indexQueries` | `expenseService.getExpensesByMonth` | Filter expenses by year & month |
| `idx_expenses_date` | `indexQueries` | `reportService.getMonthlyReport` | Live date-range sales & expense queries |
| `idx_monthly_reports_year_month` | `indexQueries` | `reportService.getMonthlyReportsHistory` | History ordering & duplicate prevention |
| `memoryStore.expenses` | `memoryStore` | `expenseService` (browser fallback) | Dev preview & UI testing without Tauri |
| `memoryStore.monthlyReports` | `memoryStore` | `reportService` (browser fallback) | Dev preview & UI testing without Tauri |
| Safe Seeding Runner | `initDb()` | Startup lifecycle | Seeds March–August 2026 data safely |

---

## 7. Concrete Implementation Blueprint for Worker

1. **Step 1**: Update `loadSeedData()` fallback return object to include `monthlyReports: []` and `expenses: []`.
2. **Step 2**: Add `memoryExpenses` and `memoryMonthlyReports` arrays.
3. **Step 3**: Append the two `CREATE TABLE IF NOT EXISTS` queries for `expenses` and `monthly_reports` to `tableQueries`.
4. **Step 4**: Append the four index statements to `indexQueries`.
5. **Step 5**: Add independent `COUNT(*)` seeding blocks for `monthly_reports` and `expenses` in the Tauri branch of `initDb()`.
6. **Step 6**: Add browser memoryStore population logic for `monthlyReports` and `expenses` in the browser fallback branch of `initDb()`.
7. **Step 7**: Update `export const memoryStore` to export `expenses` and `monthlyReports`.
8. **Step 8**: Run `pnpm lint` (`tsc --noEmit`) to verify zero TypeScript errors.
