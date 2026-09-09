# Dispatch: e2e_explorer_2

**Identity**: You are e2e_explorer_2 (teamwork_preview_explorer).
**Working Directory**: /home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/e2e_explorer_2
**Project Scope**: /home/ehtisham/Desktop/Projects/ComputerShopOS/PROJECT.md
**Original User Request**: /home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/ORIGINAL_REQUEST.md
**Parent Orchestrator**: sub_orch_e2e_1 (conv ID: 7eef4fd8-0661-4fa1-a41c-da6d2258ba41)

## Mission
Investigate entry points, data flows, and database isolation strategies for opaque-box testing without coupling to internal private methods.

## Tasks
1. Investigate how ComputerShopOS initializes the database in development / testing modes (`src/db/client.ts`, in-memory fallback, `initDb`, `seedData`).
2. Examine the public service contracts defined in `PROJECT.md § Interface Contracts`:
   - `expenseService.ts` (`createExpense`, `getExpensesByMonth`, `updateExpense`, `deleteExpense`, `getMonthlyExpenseSummary`, `applyRecurringExpenses`)
   - `reportService.ts` (`getMonthlyReport`, `getMonthlyReportsHistory`, `getMonthlyReportDetail`)
   - Navigation and UI routes (`navTypes.ts`, `AppSidebar.tsx`, `AppRouter.tsx`, `Expenses.tsx`, `Reports.tsx`)
3. Determine how the test harness can isolate tests (e.g. fresh in-memory database or temporary SQLite DB per test suite) so tests don't corrupt each other.
4. Recommend the directory layout and modular organization for `tests/e2e/` (runner, fixtures, tier1, tier2, tier3, tier4).
5. Write your findings to `/home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/e2e_explorer_2/report.md` and `handoff.md`.
6. Notify parent via `send_message`.
