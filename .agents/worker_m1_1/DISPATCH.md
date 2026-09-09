# Dispatch: Worker M1.1 (Database Schema, SQLite Client Migrations & Historical Seeding)

**Identity**: You are worker_m1_1 (archetype: teamwork_preview_worker).
**Working Directory**: /home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/worker_m1_1
**Scope Document**: /home/ehtisham/Desktop/Projects/ComputerShopOS/PROJECT.md
**Original User Request**: /home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/ORIGINAL_REQUEST.md
**Parent Orchestrator Conversation ID**: c0885c4b-6c20-48b5-adb1-958dfec827c6

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## File Ownership
You have exclusive write ownership of:
- `src/db/schema.ts`
- `src/db/client.ts`
- `src/db/seedData.json`

DO NOT modify files outside your ownership.

## Explorer Findings to Follow
1. `/home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/explorer_m1_1/handoff.md` and `analysis.md`
2. `/home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/explorer_m1_2/handoff.md` and `analysis.md`
3. `/home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/explorer_m1_3/handoff.md` and `analysis.md`

## Tasks to Implement

### 1. `src/db/schema.ts`
- Define and export `ReportStatuses = ["OPEN", "CLOSED"] as const` and `ReportStatus = (typeof ReportStatuses)[number]`.
- Update `monthlyReports` table definition so `status` uses `{ enum: ReportStatuses }` and defaults to `"CLOSED"`.
- Export domain TypeScript interfaces:
  - `DailyReportRow`:
    ```typescript
    export interface DailyReportRow {
      day: number;
      date: string;
      dayOfWeek: string;
      sales: number;
      grossProfit: number;
      remarks: string;
    }
    ```
  - `MonthlyReportDetail`:
    ```typescript
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
    ```
  - `MonthlyReportHistoryItem`:
    ```typescript
    export type MonthlyReportHistoryItem = Omit<MonthlyReportDetail, "dailyData" | "expenses">;
    ```
  - `ExpenseRecord`:
    ```typescript
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
    ```
  - `CreateExpenseInput`:
    ```typescript
    export type CreateExpenseInput = Omit<ExpenseRecord, "id">;
    ```
  - `UpdateExpenseInput`:
    ```typescript
    export type UpdateExpenseInput = Partial<CreateExpenseInput>;
    ```
  - `MonthlyExpenseSummary`:
    ```typescript
    export interface MonthlyExpenseSummary {
      total: number;
      byCategory: Record<string, number>;
      count?: number;
    }
    ```

### 2. `src/db/seedData.json`
- Preserve existing keys and records (`payableParties` with 13 items, `payableLedger` with 1093 items, `receivables` with 14 items).
- Read `context/extracted_historical_reports.json`.
- Normalize July 2026 daily rows in `monthlyReports[4].dailyDataJson`: replace `"2025-07-"` with `"2026-07-"`. Verify 0 occurrences of `"2025"` remain.
- Ensure `monthlyReports` (6 items, March to August 2026) have IDs 1..6, status "CLOSED", stringified `daily_data_json` / `expense_data_json` (or objects conforming to seed structure).
- Ensure `expenses` (44 items) have IDs 1..44, categories validated against `ExpenseCategories`.
- Ensure embedded expenses in `expenseDataJson` within each monthly report have corresponding IDs.
- Write the merged data back to `src/db/seedData.json`.

### 3. `src/db/client.ts`
- Add `CREATE TABLE IF NOT EXISTS expenses` and `CREATE TABLE IF NOT EXISTS monthly_reports` to `tableQueries`.
- Add indexes (`idx_expenses_year_month`, `idx_expenses_date`, `idx_expenses_category`, and `idx_monthly_reports_year_month`) to `indexQueries`.
- Add `memoryExpenses` and `memoryMonthlyReports` arrays and expose them in `memoryStore` as `expenses` and `monthlyReports`.
- In `initDb()`, populate `memoryExpenses` and `memoryMonthlyReports` from `seedData`.
- In SQLite seeding path, decouple seeding:
  - Keep `payable_parties` seeding check.
  - Add independent check `SELECT COUNT(*) as cnt FROM monthly_reports`. If 0, insert historical reports from `seedData.monthlyReports`.
  - Add independent check `SELECT COUNT(*) as cnt FROM expenses`. If 0, insert historical expenses from `seedData.expenses`.

### 4. Build & Lint Verification
- Run `pnpm lint` (`tsc --noEmit`) and ensure 0 errors.
- Run `pnpm build` and ensure build succeeds cleanly.
- Verify existing tests or code functionality if any test command exists.

## Deliverables
Produce `handoff.md` in `/home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/worker_m1_1/` detailing:
1. Exact changes made to each file.
2. Output of `pnpm lint` and `pnpm build`.
3. Verification results of seed data counts, SQLite DDL, and memoryStore.

When complete, write `handoff.md` and notify parent via `send_message`.
