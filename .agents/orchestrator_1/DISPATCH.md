## 2026-09-04T11:31:41Z

You are the Project Orchestrator for ComputerShopOS.
Your working directory is: /home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/orchestrator_1
The project workspace root is: /home/ehtisham/Desktop/Projects/ComputerShopOS

Please read the user request in:
/home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/ORIGINAL_REQUEST.md

Task summary:
Build dedicated Monthly Report system and Expenses management page in ComputerShopOS Tauri app, with historical data seeded from context/Monthly Report 2026.xlsx and a scrollable History list.

Requirements:
1. R1. Database Schema & Expense Tracking:
   - Add SQLite `expenses` table (`id`, `year`, `month`, `category`, `title`, `amount`, `expense_date`, `payment_method`, `notes`) and `monthly_reports` snapshot table to `src/db/schema.ts` and `src/db/client.ts`.
   - Build `src/db/expenseService.ts` for CRUD and recurring shop expense application.
2. R2. Live & Historical Monthly Report Engine:
   - Update `src/db/reportService.ts` to compute monthly stats directly via SQLite date ranges.
   - Add daily calendar breakdown (day 1..31 sales, gross profit, remarks).
   - Tie formula: Net Profit = Gross Profit - Total Expenses.
   - Support fetching history list of past months.
3. R3. Historical Data Seeding:
   - Import March 2026 through August 2026 monthly reports and fixed expenses from `context/Monthly Report 2026.xlsx` into `src/db/seedData.json` and initialize into SQLite.
4. R4. Sidebar Navigation Reorganization:
   - Move "Monthly Reports" item to the end of the sidebar in `src/components/layout/AppSidebar.tsx`.
   - Add "Expenses & Bills" item to sidebar and router.
5. R5. UI Implementation:
   - Current Month report view with KPI cards, daily table, and top-right `[ History ➔ ]` button.
   - History view with scrollable single-line containers for each past month.
   - Clicking a month container loads full report UI with that month's data and a back button.
   - Dedicated Expenses & Bills page (`src/pages/Expenses.tsx`) with category breakdown and recurring overheads loader.

Acceptance Criteria:
- `pnpm lint && pnpm build` succeeds with zero TypeScript and lint errors.
- `pnpm tauri build` executes cleanly.
- `expenses` and `monthly_reports` tables initialize properly in SQLite without breaking existing tables.
- Seed data loads March 2026 - August 2026 reports.
- Sidebar shows "Monthly Reports" at bottom and "Expenses & Bills" accessible.
- Top-right History button switches between current month and scrollable past month rows.
- Clicking any historical month row renders full report UI for that month.
- Net profit accurately reflects Gross Profit minus Operating Expenses.
