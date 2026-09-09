# Technical Investigation & Architecture Report: Database, Schema, Services, and Historical Seeding

**Explorer**: `survey_db_explorer_1`  
**Working Directory**: `/home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/survey_db_explorer_1`  
**Date**: 2026-09-04  
**Subject**: Database schema, client initialization, migration strategy, `expenseService.ts`, `reportService.ts`, and historical data seeding from `Monthly Report 2026.xlsx`

---

## 1. Executive Summary

This investigation analyzed the database architecture, client initialization, schema definitions, service layer, and data seeding mechanism in `ComputerShopOS` to plan Requirements R1, R2, and R3.

### Key Architectural Findings:
1. **Drizzle & SQLite Architecture**:
   - The application utilizes Tauri 2's `@tauri-apps/plugin-sql` (`sqlite:pc_shop.db`) with a Drizzle ORM sqlite-proxy adapter and a complete in-memory fallback (`memoryStore`) for browser/testing mode.
   - Migrations do not rely on external migration binaries at runtime. Instead, `client.ts` executes idempotent DDL (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, and safe `ALTER TABLE ... ADD COLUMN` try-catch blocks) during `initDb()`.
2. **Schema State (`src/db/schema.ts`)**:
   - The definitions for `expenses` (table #15) and `monthlyReports` (table #16) are already modeled in `src/db/schema.ts` (lines 440–501) with types `Expense`, `NewExpense`, `MonthlyReportRecord`, and `NewMonthlyReportRecord`.
   - Missing in `schema.ts`: Input interfaces (`CreateExpenseInput`, `UpdateExpenseInput`), snapshot details interface (`MonthlyReportDetail`), and daily calendar interface (`DailyReportRow`).
3. **Client Initialization Gap (`src/db/client.ts`)**:
   - The SQLite DDL execution list (`tableQueries`) and index list (`indexQueries`) in `src/db/client.ts` do **not** yet include `expenses` or `monthly_reports`.
   - `memoryStore` does **not** yet track `expenses` or `monthlyReports`.
   - Seeding currently only triggers if `payable_parties` is empty (`SELECT COUNT(*) as cnt FROM payable_parties`). If an existing user has an initialized database, placing report/expense seeding inside that block would silently skip loading historical reports. Independent table count checks (`SELECT COUNT(*) FROM monthly_reports` and `SELECT COUNT(*) FROM expenses`) are strictly required.
4. **Historical Excel Seeding (`context/Monthly Report 2026.xlsx`)**:
   - `context/extracted_historical_reports.json` already contains parsed, verified data for March 2026 through August 2026 matching the Excel workbook:
     - **March 2026**: Sales 467,100 | GP 103,770 | Expenses 111,865 | Net Profit -8,095
     - **April 2026**: Sales 712,630 | GP 123,390 | Expenses 117,808 | Net Profit +5,582
     - **May 2026**: Sales 572,500 | GP 102,253 | Expenses 110,686 | Net Profit -8,433
     - **June 2026**: Sales 532,780 | GP 183,580 | Expenses 110,928 | Net Profit +72,652
     - **July 2026**: Sales 850,540 | GP 165,080 | Expenses 113,568 | Net Profit +51,512
     - **August 2026**: Sales 191,720 | GP 58,060 | Expenses 42,300 | Net Profit +15,760
   - These 6 monthly snapshots and 35 fixed expense items must be merged into `src/db/seedData.json`.
5. **Service Layer Design**:
   - `src/db/expenseService.ts` needs to be created from scratch, supporting full CRUD, monthly summaries by category, and applying recurring shop overheads (Rent, Electricity, Telephones, Salaries, Chokidara, Internet).
   - `src/db/reportService.ts` currently fetches `getRecentSales(500)` in JS memory with no expense integration. It must be updated to query SQLite via date ranges, join line item cost prices for exact COGS, generate the 1..31 daily calendar breakdown, compute `Net Profit = Gross Profit - Total Expenses`, and serve historical snapshots.

---

## 2. Detailed Schema Analysis (`src/db/schema.ts`)

### 2.1 Existing Model in `schema.ts`
The file `src/db/schema.ts` already contains the table definitions:

```typescript
// 15. Expenses Table
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

export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  category: text("category", { enum: ExpenseCategories }).notNull().default("MISC"),
  title: text("title").notNull(),
  amount: integer("amount").notNull().default(0),
  expenseDate: integer("expense_date").notNull(),
  paymentMethod: text("payment_method").notNull().default("CASH"),
  notes: text("notes").default(""),
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

// 16. Monthly Reports Archive Table
export const monthlyReports = sqliteTable("monthly_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  monthLabel: text("month_label").notNull(),
  grossSales: integer("gross_sales").notNull().default(0),
  grossProfit: integer("gross_profit").notNull().default(0),
  totalExpenses: integer("total_expenses").notNull().default(0),
  netProfit: integer("net_profit").notNull().default(0),
  collectedCash: integer("collected_cash").notNull().default(0),
  receivables: integer("receivables").notNull().default(0),
  payables: integer("payables").notNull().default(0),
  repairRevenue: integer("repair_revenue").notNull().default(0),
  swapMargin: integer("swap_margin").notNull().default(0),
  dailyDataJson: text("daily_data_json").notNull().default("[]"),
  expenseDataJson: text("expense_data_json").notNull().default("[]"),
  status: text("status").notNull().default("CLOSED"),
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
  updatedAt: integer("updated_at")
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export type MonthlyReportRecord = typeof monthlyReports.$inferSelect;
export type NewMonthlyReportRecord = typeof monthlyReports.$inferInsert;
```

### 2.2 Recommended Additions to `schema.ts`
To provide strict typing across `expenseService.ts`, `reportService.ts`, and frontend components, the following domain interfaces must be exported:

```typescript
export interface DailyReportRow {
  day: number;           // 1..31
  date: string;          // "YYYY-MM-DD"
  dayOfWeek: string;     // "MONDAY", "TUESDAY", ...
  sales: number;         // Daily sales in PKR
  grossProfit: number;   // Daily GP in PKR
  remarks: string;       // Daily remarks / manual note
}

export interface CreateExpenseInput {
  year?: number;
  month?: number;
  category: ExpenseCategory;
  title: string;
  amount: number;
  expenseDate?: number;  // Epoch seconds
  paymentMethod?: string;
  notes?: string;
}

export interface UpdateExpenseInput {
  category?: ExpenseCategory;
  title?: string;
  amount?: number;
  expenseDate?: number;
  paymentMethod?: string;
  notes?: string;
}

export interface MonthlyExpenseSummary {
  year: number;
  month: number;
  totalAmount: number;
  categoryTotals: Record<ExpenseCategory, number>;
  expenses: Expense[];
}

export interface MonthlyReportDetail {
  id?: number;
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
  expenses: Expense[];
  status: "OPEN" | "CLOSED";
  createdAt?: number;
  updatedAt?: number;
}
```

---

## 3. SQLite Client & Migration Strategy (`src/db/client.ts`)

### 3.1 DDL Execution Plan
In `src/db/client.ts`, `initDb()` creates tables sequentially via `tableQueries`.

#### SQL for `expenses` Table:
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

#### SQL for `monthly_reports` Table:
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

### 3.2 Indexing Strategy
To optimize monthly and historical queries, the following indexes must be added to `indexQueries` in `client.ts`:
```sql
CREATE INDEX IF NOT EXISTS idx_expenses_year_month ON expenses(year, month);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_reports_year_month ON monthly_reports(year, month);
```
*Note: The `UNIQUE` index on `monthly_reports(year, month)` guarantees idempotent upserts and prevents duplicate snapshots for any month.*

### 3.3 Safe In-Memory Store Fallback (`client.ts`)
For browser preview, development mode without Tauri, or testing environments:
1. Define memory stores:
   ```typescript
   const memoryExpenses: schema.Expense[] = [];
   const memoryMonthlyReports: schema.MonthlyReportRecord[] = [];
   ```
2. Export in `memoryStore`:
   ```typescript
   export const memoryStore = {
     // ... existing collections
     expenses: memoryExpenses,
     monthlyReports: memoryMonthlyReports,
   };
   ```

---

## 4. Historical Data Seeding & Architecture (`src/db/seedData.json`)

### 4.1 Excel Audit vs Extracted Data
The Excel file `context/Monthly Report 2026.xlsx` contains sheets `MAR-2026`, `APRIL-2026`, `MAY-2026`, `JUNE-2026`, `JULY-2026`, `AUG-2026`, and empty future templates `SEP-2026` through `DEC-2026`.

Verification confirmed:
| Month | Gross Sales (PKR) | Gross Profit (PKR) | Total Expenses (PKR) | Net Profit (PKR) | Days with Records | Non-Zero Fixed Expenses |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **March 2026** | 467,100 | 103,770 | 111,865 | -8,095 | 31 (Days 1–31) | 8 items (Rent, Elec, Phone, Farhan, Tasnim, Arslan, Chokidara, Telenor) |
| **April 2026** | 712,630 | 123,390 | 117,808 | +5,582 | 30 (Days 1–30) | 8 items (Rent, Elec, Phone, Farhan, Tasnim, Arslan, Chokidara, Telenor) |
| **May 2026** | 572,500 | 102,253 | 110,686 | -8,433 | 31 (Days 1–31) | 8 items (Rent, Elec, Phone, Farhan, Tasnim, Arslan, Chokidara, Telenor) |
| **June 2026** | 532,780 | 183,580 | 110,928 | +72,652 | 30 (Days 1–30) | 8 items (Rent, Elec, Phone, Farhan, Tasnim, Arslan, Chokidara, Telenor) |
| **July 2026** | 850,540 | 165,080 | 113,568 | +51,512 | 31 (Days 1–31) | 9 items (NetFlex + standard 8 items) |
| **August 2026** | 191,720 | 58,060 | 42,300 | +15,760 | 10 active days (Days 1–10) | 3 items (Rent, Arslan salary, Chokidara) |

The JSON file `context/extracted_historical_reports.json` contains this exact dataset with full 1..31 daily records and expense items.

### 4.2 Merging into `src/db/seedData.json`
`src/db/seedData.json` currently holds:
```json
{
  "payableParties": [...],
  "payableLedger": [...],
  "receivables": [...]
}
```
It must be updated to include:
```json
{
  "payableParties": [...],
  "payableLedger": [...],
  "receivables": [...],
  "monthlyReports": [...],
  "expenses": [...]
}
```

### 4.3 Idempotent Seeding Logic in `initDb()`
**Critical Architectural Protection**:
Existing initialization checks `SELECT COUNT(*) as cnt FROM payable_parties`. Any pre-existing SQLite database with payables would skip seeding if report seeding is placed inside that block.

Instead, separate guards must be used:
```typescript
// 1. Seed Monthly Reports Snapshot Archive
try {
  const existingReports = await sqlDb.select<any[]>("SELECT COUNT(*) as cnt FROM monthly_reports");
  const reportCount = existingReports?.[0]?.cnt ?? existingReports?.[0]?.["COUNT(*)"] ?? 0;
  if (reportCount === 0) {
    const seedData = await loadSeedData();
    for (const r of seedData.monthlyReports || []) {
      await sqlDb.execute(
        `INSERT OR IGNORE INTO monthly_reports 
         (year, month, month_label, gross_sales, gross_profit, total_expenses, net_profit, 
          collected_cash, receivables, payables, repair_revenue, swap_margin, 
          daily_data_json, expense_data_json, status, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.year,
          r.month,
          r.monthLabel,
          r.grossSales,
          r.grossProfit,
          r.totalExpenses,
          r.netProfit,
          r.collectedCash,
          r.receivables || 0,
          r.payables || 0,
          r.repairRevenue || 0,
          r.swapMargin || 0,
          typeof r.dailyDataJson === "string" ? r.dailyDataJson : JSON.stringify(r.dailyDataJson || []),
          typeof r.expenseDataJson === "string" ? r.expenseDataJson : JSON.stringify(r.expenseDataJson || []),
          r.status || "CLOSED",
          r.createdAt || Math.floor(Date.now() / 1000),
          r.updatedAt || Math.floor(Date.now() / 1000),
        ]
      );
    }
  }
} catch (reportSeedErr) {
  console.warn("Seeding monthly reports error:", reportSeedErr);
}

// 2. Seed Historical Expenses Table
try {
  const existingExpenses = await sqlDb.select<any[]>("SELECT COUNT(*) as cnt FROM expenses");
  const expenseCount = existingExpenses?.[0]?.cnt ?? existingExpenses?.[0]?.["COUNT(*)"] ?? 0;
  if (expenseCount === 0) {
    const seedData = await loadSeedData();
    for (const e of seedData.expenses || []) {
      await sqlDb.execute(
        `INSERT OR IGNORE INTO expenses 
         (year, month, category, title, amount, expense_date, payment_method, notes, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          e.year,
          e.month,
          e.category || "MISC",
          e.title,
          e.amount,
          e.expenseDate,
          e.paymentMethod || "CASH",
          e.notes || "",
          e.createdAt || Math.floor(Date.now() / 1000),
        ]
      );
    }
  }
} catch (expenseSeedErr) {
  console.warn("Seeding expenses error:", expenseSeedErr);
}
```

Similarly, in the browser memory fallback:
```typescript
if (memoryStore.monthlyReports.length === 0) {
  const seedData = await loadSeedData();
  // push monthlyReports into memoryStore.monthlyReports
}
if (memoryStore.expenses.length === 0) {
  const seedData = await loadSeedData();
  // push expenses into memoryStore.expenses
}
```

---

## 5. Design of `src/db/expenseService.ts`

`src/db/expenseService.ts` must provide comprehensive CRUD, category summarization, and recurring expense generation.

### 5.1 Proposed API Signatures
```typescript
/**
 * Retrieves expenses matching optional year, month, or category filters.
 * Returns sorted by expenseDate DESC, id DESC.
 */
export async function getExpenses(filter?: {
  year?: number;
  month?: number;
  category?: ExpenseCategory;
}): Promise<Expense[]>;

/**
 * Retrieves a single expense record by ID.
 */
export async function getExpenseById(id: number): Promise<Expense | null>;

/**
 * Creates a new expense entry. Auto-determines year and month from expenseDate if not provided.
 */
export async function createExpense(input: CreateExpenseInput): Promise<Expense>;

/**
 * Updates an existing expense entry by ID.
 */
export async function updateExpense(id: number, input: UpdateExpenseInput): Promise<Expense | null>;

/**
 * Deletes an expense entry by ID.
 */
export async function deleteExpense(id: number): Promise<boolean>;

/**
 * Computes monthly aggregated totals across all expense categories.
 */
export async function getMonthlyExpensesSummary(year: number, month: number): Promise<MonthlyExpenseSummary>;

/**
 * Fast sum of total expense amount for a given month.
 */
export async function getTotalExpensesForMonth(year: number, month: number): Promise<number>;

/**
 * Applies predefined recurring shop overheads to the specified month if not already present.
 */
export async function applyRecurringExpenses(
  year: number,
  month: number,
  customTemplates?: RecurringExpenseTemplate[]
): Promise<Expense[]>;
```

### 5.2 Recurring Overheads Template Specification
Derived directly from the verified shop ledger in `Monthly Report 2026.xlsx`:

```typescript
export interface RecurringExpenseTemplate {
  title: string;
  category: ExpenseCategory;
  defaultAmount: number;
  paymentMethod: string;
  notes?: string;
}

export const DEFAULT_RECURRING_EXPENSES: RecurringExpenseTemplate[] = [
  { title: "SHOP RENT", category: "RENT", defaultAmount: 25000, paymentMethod: "CASH" },
  { title: "SHOP ELECTRICITY BILL", category: "UTILITIES", defaultAmount: 5000, paymentMethod: "CASH" },
  { title: "TELEPHONE BILL", category: "UTILITIES", defaultAmount: 4000, paymentMethod: "CASH" },
  { title: "FARHAN BAHI SALARY", category: "SALARY", defaultAmount: 30000, paymentMethod: "CASH" },
  { title: "TASNIM SALARY", category: "SALARY", defaultAmount: 30000, paymentMethod: "CASH" },
  { title: "ARSLAN BAHI SALARY", category: "SALARY", defaultAmount: 17000, paymentMethod: "CASH" },
  { title: "CHOKIDARA", category: "SECURITY_GUARD", defaultAmount: 300, paymentMethod: "CASH" },
  { title: "TELENOR POST PAID BILL", category: "UTILITIES", defaultAmount: 1000, paymentMethod: "CASH" },
  { title: "NET FLEX (INTERNET)", category: "INTERNET", defaultAmount: 800, paymentMethod: "CASH" },
];
```

### 5.3 Idempotency Rule for Recurring Overheads:
When `applyRecurringExpenses(year, month)` is invoked:
1. Query existing expenses for `(year, month)`.
2. For each template item, check if an expense with the same normalized title already exists for that month.
3. Only insert items that do not yet exist, preventing double-billing if clicked multiple times.

---

## 6. Design of `src/db/reportService.ts`

### 6.1 Limitations in Current Implementation
The current `generateFinancialReport` in `src/db/reportService.ts` has critical limitations:
- Calls `getRecentSales(500)` and filters in client memory. Any sales beyond 500 or in historical dates are truncated.
- Lacks calendar day-by-day (day 1..31) breakdown.
- Does not query or integrate operating expenses.
- Calculates `totalNetIncome = grossProfit + repairRevenue + (swapInflow - swapOutflow)` without subtracting operating expenses.

### 6.2 New Monthly Engine Architecture
To fulfill R2 without breaking existing callers of `generateFinancialReport`:
1. Keep `generateFinancialReport(period)` intact for general dashboard/pie chart components.
2. Introduce dedicated monthly report engine functions:
   - `getMonthlyReport(year: number, month: number): Promise<MonthlyReportDetail>`
   - `getMonthlyReportsHistory(): Promise<MonthlyReportRecord[]>`
   - `saveMonthlyReportSnapshot(snapshot: NewMonthlyReportRecord): Promise<void>`
   - `recalculateCurrentMonth(year: number, month: number): Promise<MonthlyReportDetail>`

### 6.3 Date-Range & COGS Computation
For live calculations (e.g. current month):
1. **Date Bounds**:
   ```typescript
   const startOfMonth = Math.floor(new Date(year, month - 1, 1, 0, 0, 0).getTime() / 1000);
   const daysInMonth = new Date(year, month, 0).getDate();
   const endOfMonth = Math.floor(new Date(year, month - 1, daysInMonth, 23, 59, 59).getTime() / 1000);
   ```
2. **Sales & COGS Direct Query**:
   ```sql
   SELECT 
     s.id,
     s.invoice_no,
     s.total_amount,
     s.paid_amount,
     s.balance_due,
     s.payment_method,
     s.discount,
     s.created_at,
     COALESCE(SUM(si.quantity * inv.cost_price), 0) AS total_cogs
   FROM sales s
   LEFT JOIN sale_items si ON si.sale_id = s.id
   LEFT JOIN inventory inv ON inv.id = si.inventory_id
   WHERE s.created_at >= $1 AND s.created_at <= $2
   GROUP BY s.id
   ORDER BY s.created_at ASC
   ```
3. **Daily Calendar Breakdown (Day 1..31)**:
   - Instantiate array of `daysInMonth` entries:
     ```typescript
     const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
     const dailyData: DailyReportRow[] = Array.from({ length: daysInMonth }, (_, idx) => {
       const dayNum = idx + 1;
       const dateObj = new Date(year, month - 1, dayNum);
       const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
       return {
         day: dayNum,
         date: dateStr,
         dayOfWeek: dayNames[dateObj.getDay()],
         sales: 0,
         grossProfit: 0,
         remarks: "",
       };
     });
     ```
   - Iterate each sale: calculate `day = new Date(sale.createdAt * 1000).getDate()`.
   - Accumulate `dailyData[day - 1].sales += sale.totalAmount`.
   - Accumulate `dailyData[day - 1].grossProfit += (sale.totalAmount - sale.totalCogs)`.

4. **Expenses Integration**:
   - Query `expenses` for `year` and `month` (or via date range):
     ```sql
     SELECT * FROM expenses WHERE year = $1 AND month = $2 ORDER BY expense_date ASC
     ```
   - Calculate `totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)`.

5. **Net Profit Formula**:
   ```typescript
   const grossSales = dailyData.reduce((sum, d) => sum + d.sales, 0);
   const grossProfit = dailyData.reduce((sum, d) => sum + d.grossProfit, 0);
   const netProfit = grossProfit - totalExpenses;
   ```
   *Net Profit accurately reflects Gross Profit minus Operating Expenses.*

### 6.4 Handling Historical Closed Months vs Live Month
- If `monthly_reports` contains a record for `(year, month)`:
  - Return the stored snapshot directly with parsed `dailyDataJson` and `expenseDataJson`.
  - Mark `status: "CLOSED"`.
- If no snapshot exists (such as current month, e.g., September 2026):
  - Execute the live date-range calculation.
  - Return the live report with `status: "OPEN"`.
  - UI displays live data with instant recalculation.

---

## 7. Integration Plan for Frontend & Routes

### 7.1 Sidebar Navigation (`src/components/layout/AppSidebar.tsx` & `navTypes.ts`)
1. Update `NavTab` in `src/components/layout/navTypes.ts`:
   Add `"expenses"`:
   ```typescript
   export type NavTab =
     | "dashboard"
     | "inventory"
     | "sales"
     | "doc-generator"
     | "repairs"
     | "adjustments"
     | "pc-builder"
     | "customers"
     | "payables"
     | "expenses"
     | "reports"
     | "settings";
   ```
2. Reorganize items in `AppSidebar.tsx`:
   - Place "Expenses & Bills" (`Receipt` or `Wallet` icon) in the core navigation.
   - Move "Monthly Reports" (`BarChart3` icon) to the bottom of the list, immediately before "Settings & System".

### 7.2 Router Integration (`src/components/AppRouter.tsx`)
- Lazy load `ExpensesPage` from `../pages/Expenses`.
- Route `activeTab === "expenses"` to `<ExpensesPage />`.
- `activeTab === "reports"` loads the modernized `ReportsPage` supporting current month KPIs, daily table, top-right `[ History ➔ ]` toggle, and historical month deep-dive with back button.

---

## 8. Summary of Actionable Implementation Tasks

| Step | Target File | Action |
| :--- | :--- | :--- |
| **1** | `src/db/schema.ts` | Export domain interfaces: `DailyReportRow`, `MonthlyReportDetail`, `CreateExpenseInput`, `UpdateExpenseInput`, `MonthlyExpenseSummary`. |
| **2** | `src/db/seedData.json` | Merge `monthlyReports` (6 months) and `expenses` (35 entries) from `context/extracted_historical_reports.json`. |
| **3** | `src/db/client.ts` | Add DDL for `expenses` and `monthly_reports`, add indexes, register in `memoryStore`, add independent table seeding logic. |
| **4** | `src/db/expenseService.ts` | Create new service: CRUD operations, category groupings, and recurring shop expenses generation. |
| **5** | `src/db/reportService.ts` | Implement `getMonthlyReport`, `getMonthlyReportsHistory`, date-range SQL engine, daily breakdown, and `Net Profit = GP - Expenses`. |
| **6** | `src/components/layout/` | Update `navTypes.ts` and `AppSidebar.tsx` (reorder Monthly Reports to bottom, add Expenses & Bills). |
| **7** | `src/pages/Expenses.tsx` | Build dedicated Expenses & Bills page with category breakdown and recurring overheads loader. |
| **8** | `src/pages/Reports.tsx` | Modernize Reports page: current month view, KPI cards, daily table, `[ History ➔ ]` toggle, scrollable past month rows, and detailed view with back button. |
