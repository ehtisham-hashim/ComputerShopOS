# Handoff Report: Database & Service Architecture Survey

**Agent**: `survey_db_explorer_1`  
**Working Directory**: `/home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/survey_db_explorer_1`  
**Handoff Type**: Hard (Task complete)  
**Parent Orchestrator**: `6d41796d-671a-486c-a0de-209e8a220008`  

---

## 1. Observation

1. **Schema Definitions in `src/db/schema.ts`**:
   - `expenses` table is defined at lines 454–467:
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
       createdAt: integer("created_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
     });
     ```
   - `monthlyReports` table is defined at lines 473–496 with fields `year`, `month`, `month_label`, `gross_sales`, `gross_profit`, `total_expenses`, `net_profit`, `collected_cash`, `receivables`, `payables`, `repair_revenue`, `swap_margin`, `daily_data_json`, `expense_data_json`, and `status`.
   - Domain input/output interfaces (`DailyReportRow`, `MonthlyReportDetail`, `CreateExpenseInput`, `UpdateExpenseInput`, `MonthlyExpenseSummary`) are currently absent from `src/db/schema.ts`.

2. **SQLite Initialization & In-Memory Fallback in `src/db/client.ts`**:
   - `tableQueries` (lines 288–453) defines tables for `customers`, `inventory`, `inventory_serials`, `sales`, `sale_items`, `repairs`, `adjustments`, `settings`, `documents`, `payable_parties`, `payable_ledger`, `purchases`, and `purchase_items`. It does **not** include `expenses` or `monthly_reports`.
   - `indexQueries` (lines 463–487) lacks indexes for `expenses` and `monthly_reports`.
   - Lines 493–496 currently gate database seeding solely on `payable_parties`:
     ```typescript
     const existingParties = await sqlDb.select<any[]>("SELECT COUNT(*) as cnt FROM payable_parties");
     const count = existingParties?.[0]?.cnt ?? existingParties?.[0]?.["COUNT(*)"] ?? 0;
     if (count === 0) { ... }
     ```
   - `memoryStore` (lines 709–722) does not export `expenses` or `monthlyReports`.

3. **Historical Data Source in `context/`**:
   - `context/Monthly Report 2026.xlsx` contains sheets: `['MAR-2026', 'APRIL-2026', 'MAY-2026', 'JUNE-2026', 'JULY-2026', 'AUG-2026', 'SEP-2026', 'OCT-2026', 'NOV-2026', 'DEC-2026']`.
   - Python inspection confirmed March through August 2026 match `context/extracted_historical_reports.json` exactly:
     - March 2026: Sales = 467,100; GP = 103,770; Expenses = 111,865; Net Profit = -8,095
     - April 2026: Sales = 712,630; GP = 123,390; Expenses = 117,808; Net Profit = 5,582
     - May 2026: Sales = 572,500; GP = 102,253; Expenses = 110,686; Net Profit = -8,433
     - June 2026: Sales = 532,780; GP = 183,580; Expenses = 110,928; Net Profit = 72,652
     - July 2026: Sales = 850,540; GP = 165,080; Expenses = 113,568; Net Profit = 51,512
     - August 2026: Sales = 191,720; GP = 58,060; Expenses = 42,300; Net Profit = 15,760
   - `src/db/seedData.json` currently only has keys `['payableParties', 'payableLedger', 'receivables']`.

4. **Existing Report Logic in `src/db/reportService.ts`**:
   - Lines 33–35 query `getRecentSales(500)`.
   - Line 99 sets `totalNetIncome = grossProfit + repairRevenue + (swapInflow - swapOutflow)`, which completely omits operating expenses and provides no daily calendar breakdown.

5. **Navigation Structure**:
   - `src/components/layout/navTypes.ts` (lines 1–13) lists `NavTab` options without `"expenses"`.
   - `src/components/layout/AppSidebar.tsx` (line 40) positions `reports` in the middle of core modules.

---

## 2. Logic Chain

1. **Table Creation & Indexing**:
   - Because `expenses` and `monthlyReports` are already declared in `schema.ts` (Obs 1) but missing from `tableQueries` in `client.ts` (Obs 2), adding `CREATE TABLE IF NOT EXISTS expenses (...)` and `CREATE TABLE IF NOT EXISTS monthly_reports (...)` inside `tableQueries` will initialize them during `initDb()` without affecting pre-existing tables.
   - Adding `CREATE INDEX IF NOT EXISTS idx_expenses_year_month ON expenses(year, month);`, `CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);`, and `CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_reports_year_month ON monthly_reports(year, month);` ensures indexed queries and prevents duplicate month snapshots.

2. **Database Seeding Migration Safety**:
   - Because existing databases already have records in `payable_parties` (count > 0) (Obs 2), placing monthly report and expense seeding inside the `existingParties === 0` block would cause existing installations to skip loading March–August 2026 historical data.
   - Therefore, seeding must use independent checks:
     `SELECT COUNT(*) as cnt FROM monthly_reports` and `SELECT COUNT(*) as cnt FROM expenses`.
   - If either count is 0, the system inserts from `seedData.json` using `INSERT OR IGNORE`.

3. **Expense Service Architecture**:
   - Implementing `src/db/expenseService.ts` with standard CRUD, monthly summary aggregation, and `applyRecurringExpenses()` using predefined templates (Shop Rent: 25k, Electricity: 5k, Telephone: 4k, Salaries: 30k/30k/17k, Chokidara: 300, Telenor: 1k, NetFlex: 800) fulfills R1.
   - Checking existing titles before inserting recurring expenses prevents duplicate overhead charges.

4. **Monthly Report Engine Architecture**:
   - In `src/db/reportService.ts`, date-bounded SQL queries joining `sales`, `sale_items`, and `inventory` compute accurate live sales and COGS.
   - A 1..31 calendar day mapping populates `DailyReportRow[]`.
   - Integrating monthly expenses and tying `Net Profit = Gross Profit - Total Expenses` satisfies the business formula required by R2.
   - Historical months (March–August 2026) are retrieved directly from `monthly_reports` snapshots.

---

## 3. Caveats

1. **Live vs Historical Distinction**:
   - Months in `monthly_reports` with status `"CLOSED"` are immutable snapshots from the Excel workbook.
   - The current month (e.g. September 2026) does not exist in the Excel workbook; it is live-computed from active SQLite records and has status `"OPEN"`.
2. **COGS Mapping for Live Sales**:
   - Live sales calculate COGS by joining `inventory.cost_price`. If an item's `cost_price` was 0 at time of sale, gross profit will equal the sale price for that line item.
3. **No UI Code Modified in this Turn**:
   - Per explorer role constraints, all investigation is read-only. No source files outside `.agents/survey_db_explorer_1/` were altered.

---

## 4. Conclusion

1. The database schema in `src/db/schema.ts` already has the base `expenses` and `monthlyReports` table definitions. It only needs domain interface exports (`DailyReportRow`, `MonthlyReportDetail`, `CreateExpenseInput`, etc.).
2. `src/db/client.ts` requires the two DDL statements in `tableQueries`, 4 indexes in `indexQueries`, `expenses`/`monthlyReports` in `memoryStore`, and independent `COUNT(*)` checks for safe historical seeding.
3. `src/db/seedData.json` is ready to be merged with `context/extracted_historical_reports.json` (6 monthly reports and 35 expenses).
4. `src/db/expenseService.ts` and `src/db/reportService.ts` have clean, isolated architectures that plug directly into SQLite and the browser memory fallback without breaking existing code or tests.
5. All findings and implementation designs are fully documented in `/home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/survey_db_explorer_1/report.md`.

---

## 5. Verification Method

1. **TypeScript Baseline Verification**:
   ```bash
   npx tsc --noEmit
   ```
   *Verified: passed with exit code 0.*
2. **Seed Data Integrity Verification**:
   ```bash
   python3 -c "import json; d = json.load(open('context/extracted_historical_reports.json')); print('Months:', len(d['monthlyReports']), 'Expenses:', len(d['expenses']))"
   ```
   *Verified: 6 months (March–August 2026) and 35 expenses.*
3. **Report Output Inspection**:
   - View `/home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/survey_db_explorer_1/report.md`
   - View `/home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/survey_db_explorer_1/handoff.md`
