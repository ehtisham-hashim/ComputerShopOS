# Exploration Analysis: Schema Definitions & TypeScript Interfaces (M1.1)

**Author**: `explorer_m1_1` (teamwork_preview_explorer)  
**Date**: 2026-09-04  
**Target Files**:
- `/home/ehtisham/Desktop/Projects/ComputerShopOS/src/db/schema.ts`
- `/home/ehtisham/Desktop/Projects/ComputerShopOS/PROJECT.md`
- `/home/ehtisham/Desktop/Projects/ComputerShopOS/src/db/client.ts`

---

## 1. Executive Summary & Objective
The objective of this investigation is to analyze `src/db/schema.ts` and codebase typing conventions to determine the exact Drizzle table declarations and domain TypeScript interfaces (`DailyReportRow`, `MonthlyReportDetail`, `ExpenseRecord`, `CreateExpenseInput`, `UpdateExpenseInput`, `MonthlyExpenseSummary`, `MonthlyReportHistoryItem`) required by `PROJECT.md § Interface Contracts`.

Our investigation reveals:
1. `src/db/schema.ts` currently contains initial declarations for `expenses` (lines 454–467) and `monthlyReports` (lines 473–496), along with `ExpenseCategories` enum (lines 441–452).
2. The domain TypeScript interfaces (`DailyReportRow`, `MonthlyReportDetail`, `ExpenseRecord`, `CreateExpenseInput`, `UpdateExpenseInput`, `MonthlyExpenseSummary`) are **completely absent** from `src/db/schema.ts`.
3. The `status` field in `monthlyReports` is currently an unconstrained `text("status").notNull().default("CLOSED")`, whereas `PROJECT.md` specifies `status: "OPEN" | "CLOSED"`. Introducing `ReportStatuses` const array and `ReportStatus` type brings it into full conformity with existing schema enum patterns.
4. Downstream consumers (`client.ts`, `expenseService.ts`, `reportService.ts`) rely on these definitions to implement DDL execution, seed data hydration, SQLite date-range aggregation, and UI reporting.
5. All existing exports and 14 table definitions in `src/db/schema.ts` remain 100% intact with zero breaking changes or name collisions.

---

## 2. Current State of `src/db/schema.ts`

### 2.1 Existing Structure
`src/db/schema.ts` (501 lines) defines:
- Enums: `ItemTitles`, `SerialStatuses`, `PaymentMethods`, `PaymentStatuses`, `RepairStatuses`, `BrandTypes`, `DocTypes`, `PayableTxTypes`, `PurchaseStatuses`, `ExpenseCategories`.
- 14 Pre-existing Drizzle Tables:
  1. `customers` (lines 39–47)
  2. `inventory` (lines 53–63)
  3. `inventorySerials` (lines 69–77)
  4. `sales` (lines 83–101)
  5. `saleItems` (lines 107–120)
  6. `repairs` (lines 126–140)
  7. `adjustments` (lines 146–164)
  8. `settings` (lines 170–174)
  9. `documents` (lines 199–220)
  10. `payableParties` (lines 310–322)
  11. `payableLedger` (lines 336–351)
  12. `purchases` (lines 378–395)
  13. `purchaseItems` (lines 401–414)
  14. `expenses` (lines 454–467)
  15. `monthlyReports` (lines 473–496)

### 2.2 Lines 440–501 in `src/db/schema.ts`:
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

---

## 3. Gap Analysis against `PROJECT.md § Interface Contracts`

| Requirement in PROJECT.md | Current State in `schema.ts` | Action Required |
|---|---|---|
| `expenses` Drizzle table | Present (lines 454–467) | Retain column definitions, ensure `notes` compatibility |
| `monthlyReports` Drizzle table | Present (lines 473–496) | Add `ReportStatuses` enum to strictly type `status` as `"OPEN" \| "CLOSED"` |
| `DailyReportRow` interface | Missing | Add interface with `day`, `date`, `dayOfWeek`, `sales`, `grossProfit`, `remarks` |
| `ExpenseRecord` interface | Missing | Add interface with `id`, `year`, `month`, `category`, `title`, `amount`, `expenseDate`, `paymentMethod`, `notes?`, `createdAt?` |
| `CreateExpenseInput` type | Missing | Add `Omit<ExpenseRecord, "id">` |
| `UpdateExpenseInput` type | Missing | Add `Partial<CreateExpenseInput>` |
| `MonthlyExpenseSummary` interface | Missing | Add interface `{ total: number; byCategory: Record<string, number>; count?: number }` |
| `MonthlyReportDetail` interface | Missing | Add interface with financial metrics, `dailyData: DailyReportRow[]`, `expenses: ExpenseRecord[]`, `status: "OPEN" \| "CLOSED"` |
| `MonthlyReportHistoryItem` type | Missing | Add convenience type `Omit<MonthlyReportDetail, 'dailyData' \| 'expenses'>` |

---

## 4. Proposed Drizzle Table Declarations & Enum Definitions

### 4.1 Report Status Enum
To mirror the codebase convention (e.g. `PaymentStatuses`, `RepairStatuses`, `PurchaseStatuses`):
```typescript
export const ReportStatuses = ["OPEN", "CLOSED"] as const;
export type ReportStatus = (typeof ReportStatuses)[number];
```

### 4.2 `expenses` Table
```typescript
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
```

### 4.3 `monthlyReports` Table
```typescript
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
  status: text("status", { enum: ReportStatuses }).notNull().default("CLOSED"),
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

---

## 5. Exact TypeScript Domain Interfaces to Export

These domain interfaces must be placed immediately following the table declarations in `src/db/schema.ts`:

```typescript
// --- Monthly Reports & Expense Domain Interfaces ---

export interface DailyReportRow {
  day: number;
  date: string;
  dayOfWeek: string;
  sales: number;
  grossProfit: number;
  remarks: string;
}

export interface ExpenseRecord {
  id: number;
  year: number;
  month: number;
  category: string;
  title: string;
  amount: number;
  expenseDate: number;
  paymentMethod: string;
  notes?: string;
  createdAt?: number;
}

export type CreateExpenseInput = Omit<ExpenseRecord, "id">;

export type UpdateExpenseInput = Partial<CreateExpenseInput>;

export interface MonthlyExpenseSummary {
  total: number;
  byCategory: Record<string, number>;
  count?: number;
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
  expenses: ExpenseRecord[];
  status: "OPEN" | "CLOSED";
  createdAt?: number;
  updatedAt?: number;
}

export type MonthlyReportHistoryItem = Omit<MonthlyReportDetail, "dailyData" | "expenses">;
```

---

## 6. Interoperability & Downstream Integration Analysis

### 6.1 `src/db/client.ts` Alignment
For `client.ts` (handled in M1 Worker):
1. **DDL Queries (`tableQueries`)**:
   Add `CREATE TABLE IF NOT EXISTS expenses (...)` and `CREATE TABLE IF NOT EXISTS monthly_reports (...)`.
2. **Index Queries (`indexQueries`)**:
   Add:
   - `idx_expenses_year_month ON expenses(year, month)`
   - `idx_expenses_date ON expenses(expense_date)`
   - `idx_expenses_category ON expenses(category)`
   - `idx_monthly_reports_year_month ON monthly_reports(year, month)`
   - `idx_monthly_reports_status ON monthly_reports(status)`
3. **Memory Store Fallback (`memoryStore`)**:
   - `const memoryExpenses: schema.ExpenseRecord[] = [];`
   - `const memoryMonthlyReports: schema.MonthlyReportRecord[] = [];`
   - Expose in `export const memoryStore = { ... expenses: memoryExpenses, monthlyReports: memoryMonthlyReports };`

### 6.2 Data Seeding Alignment (`seedData.json`)
The extracted historical reports file (`context/extracted_historical_reports.json`) contains:
- 6 `monthlyReports` (March 2026 – August 2026)
- 49 `expenses` items
The schema interfaces (`DailyReportRow`, `ExpenseRecord`, `MonthlyReportDetail`) align 100% with the JSON payload keys (`day`, `date`, `dayOfWeek`, `sales`, `grossProfit`, `remarks`, etc.).

### 6.3 Services Layer Alignment (`expenseService.ts` & `reportService.ts`)
The proposed interfaces satisfy all method signatures specified in `PROJECT.md § M2 ↔ M3 & M4`:
- `getExpensesByMonth(year: number, month: number): Promise<ExpenseRecord[]>`
- `createExpense(input: CreateExpenseInput): Promise<number>`
- `updateExpense(id: number, input: UpdateExpenseInput): Promise<void>`
- `getMonthlyExpenseSummary(year: number, month: number): Promise<MonthlyExpenseSummary>`
- `getMonthlyReport(year: number, month: number): Promise<MonthlyReportDetail>`
- `getMonthlyReportsHistory(): Promise<MonthlyReportHistoryItem[]>`

---

## 7. Safety & Non-Regression Verification
- **Current TypeScript Check**: `npx tsc --noEmit` exits with status code 0.
- **Export Collision Check**: None. The names `DailyReportRow`, `MonthlyReportDetail`, `ExpenseRecord`, `CreateExpenseInput`, `UpdateExpenseInput`, `MonthlyExpenseSummary`, and `MonthlyReportHistoryItem` are unique across `src/`.
- **Drizzle Query Engine**: `export const db = drizzle<typeof schema>(..., { schema })` automatically incorporates `expenses` and `monthlyReports` without needing manual registration in `client.ts` other than re-exporting `* as schema`.

---

## 8. Step-by-Step Code Change Recommendation for Worker M1.1

In `src/db/schema.ts`, replace lines 472–501 with:

```typescript
// 16. Monthly Reports Archive Table
export const ReportStatuses = ["OPEN", "CLOSED"] as const;
export type ReportStatus = (typeof ReportStatuses)[number];

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
  status: text("status", { enum: ReportStatuses }).notNull().default("CLOSED"),
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
  updatedAt: integer("updated_at")
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export type MonthlyReportRecord = typeof monthlyReports.$inferSelect;
export type NewMonthlyReportRecord = typeof monthlyReports.$inferInsert;

// --- Monthly Reports & Expense Domain Interfaces ---

export interface DailyReportRow {
  day: number;
  date: string;
  dayOfWeek: string;
  sales: number;
  grossProfit: number;
  remarks: string;
}

export interface ExpenseRecord {
  id: number;
  year: number;
  month: number;
  category: string;
  title: string;
  amount: number;
  expenseDate: number;
  paymentMethod: string;
  notes?: string;
  createdAt?: number;
}

export type CreateExpenseInput = Omit<ExpenseRecord, "id">;

export type UpdateExpenseInput = Partial<CreateExpenseInput>;

export interface MonthlyExpenseSummary {
  total: number;
  byCategory: Record<string, number>;
  count?: number;
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
  expenses: ExpenseRecord[];
  status: "OPEN" | "CLOSED";
  createdAt?: number;
  updatedAt?: number;
}

export type MonthlyReportHistoryItem = Omit<MonthlyReportDetail, "dailyData" | "expenses">;
```
