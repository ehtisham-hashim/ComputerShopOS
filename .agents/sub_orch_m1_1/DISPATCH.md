# Dispatch: Milestone 1 Sub-Orchestrator (Database Schema, Migrations & Seeding)

**Identity**: You are sub_orch_m1_1 (archetype: self / orchestrator).
**Working Directory**: /home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/sub_orch_m1_1
**Scope Document**: /home/ehtisham/Desktop/Projects/ComputerShopOS/PROJECT.md
**Original User Request**: /home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/ORIGINAL_REQUEST.md
**Parent Orchestrator Conversation ID**: 6d41796d-671a-486c-a0de-209e8a220008

## Mission & Milestone 1 Scope
Deliver Milestone 1: Database Schema, SQLite Client Migrations & Historical Seeding.

## File Ownership
- `src/db/schema.ts`
- `src/db/client.ts`
- `src/db/seedData.json`

## Requirements
1. **Schema Definitions (`src/db/schema.ts`)**:
   - Export domain interfaces: `DailyReportRow`, `MonthlyReportDetail`, `ExpenseRecord`, `CreateExpenseInput`, `UpdateExpenseInput`, `MonthlyExpenseSummary`.
   - Ensure `expenses` and `monthlyReports` tables match the specifications in `PROJECT.md § Interface Contracts`.
2. **Seed Data (`src/db/seedData.json`)**:
   - Merge March 2026 – August 2026 historical monthly reports and fixed expenses from `context/extracted_historical_reports.json` into `src/db/seedData.json`.
   - Ensure July 2026 dates are normalized to `2026-07-xx`.
   - Preserve existing keys (`payableParties`, `payableLedger`, `receivables`).
3. **SQLite Client & Migrations (`src/db/client.ts`)**:
   - Add `CREATE TABLE IF NOT EXISTS expenses` and `CREATE TABLE IF NOT EXISTS monthly_reports` to `tableQueries`.
   - Add indexes (`idx_expenses_year_month`, `idx_expenses_date`, `idx_monthly_reports_year_month`) to `indexQueries`.
   - Add `expenses` and `monthlyReports` collections to `memoryStore`.
   - Add independent migration/seeding checks (`COUNT(*) FROM monthly_reports`, `COUNT(*) FROM expenses`) so that historical data is seeded safely even when existing tables like `payable_parties` already have data.
4. **Execution & Gate**:
   - Apply the sub-orchestrator procedure: Assess -> Iteration loop (Explorer -> Worker -> Reviewer -> Challenger -> Auditor -> Gate).
   - Verify `pnpm lint && pnpm build` passes with 0 errors.
   - Update `progress.md` and `GATE_STATUS.md` in your working directory.
   - Upon gate PASS, write `handoff.md` and notify parent orchestrator via `send_message`.

## 2026-09-04T11:38:47Z
You are sub_orch_m1_1.
Your working directory is: /home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/sub_orch_m1_1
Your task assignment is in: /home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/sub_orch_m1_1/DISPATCH.md
Scope document is in: /home/ehtisham/Desktop/Projects/ComputerShopOS/PROJECT.md
Original user request is in: /home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/ORIGINAL_REQUEST.md
Your parent conversation ID is: 6d41796d-671a-486c-a0de-209e8a220008

Please read DISPATCH.md and PROJECT.md, and orchestrate Milestone 1 (src/db/schema.ts, src/db/client.ts, src/db/seedData.json) through the sub-orchestrator iteration loop: Explorer -> Worker -> Reviewer -> Challenger -> Auditor -> Gate. Verify pnpm lint && pnpm build pass cleanly. Write handoff.md and notify me via send_message when complete.
