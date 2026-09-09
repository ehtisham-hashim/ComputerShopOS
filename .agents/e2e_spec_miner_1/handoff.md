# Handoff Report: E2E Test Specification Mining (Tiers 1–4)

**Agent**: `e2e_spec_miner_1`  
**Parent Orchestrator**: `sub_orch_e2e_1` (`7eef4fd8-0661-4fa1-a41c-da6d2258ba41`)  
**Handoff Type**: Hard (Task Complete)  
**Date**: September 4, 2026  

---

## 1. Observation

1. **Authoritative Requirements Documented**:
   - `ORIGINAL_REQUEST.md:28-66`: Specifies R1 (Database schema & expense tracking: `expenses` and `monthly_reports` tables, `expenseService.ts`), R2 (Live & Historical Monthly Report engine with daily breakdown, net profit formula `Net Profit = Gross Profit - Total Expenses`), R3 (Seeding March 2026 – August 2026 reports and fixed expenses from `context/Monthly Report 2026.xlsx`), R4 (Sidebar navigation reordering and "Expenses & Bills" page addition), R5 (UI implementation for Current Month, History list, and Historical Month Detail).
   - `ORIGINAL_REQUEST.md:5-24`: Specifies initial audit issues: BUG-08 (derive active repair count dynamically), SUGGEST-02 (restore inventory on deletion across services), SUGGEST-03 (mark serial `SOLD` on adjustment), SUGGEST-04 (discount UI/calculation), SUGGEST-05 (pre-checkout stock validation), TYPE-01/02 (type cleanups).

2. **Scope & Interface Contracts**:
   - `PROJECT.md:12-34`: Defines Feature Inventory F1 to F16 (+ F17 E2E test suite, F18 hardening, F19 build).
   - `PROJECT.md:46-110`: Outlines strict interface contracts between M1 (Schema & DB), M2 (Services), M3/M4 (UI Pages & Layout), including exact function signatures (`createExpense`, `getExpensesByMonth`, `applyRecurringExpenses`, `getMonthlyReport`, `getMonthlyReportsHistory`, `getMonthlyReportDetail`).

3. **Authoritative Accounting Excel Ledger Verified**:
   - `context/Monthly Report 2026.xlsx` inspected via `survey_spec_miner_1/report.md:1-250` and `context/extracted_historical_reports.json:1-120`.
   - Verified 6 active historical months (March through August 2026) and 44 expenses.
   - Ground truth numbers:
     * March 2026: Gross Sales 467,100; Gross Profit 103,770; Expenses 111,865; Net Profit -8,095; Remarks Sum 31,500.
     * April 2026: Gross Sales 712,630; Gross Profit 123,390; Expenses 117,808; Net Profit +5,582; Remarks Sum 37,700.
     * May 2026: Gross Sales 572,500; Gross Profit 102,253; Expenses 110,686; Net Profit -8,433; Remarks Sum 30,000.
     * June 2026: Gross Sales 532,780; Gross Profit 183,580; Expenses 110,928; Net Profit +72,652; Remarks Sum 30,000.
     * July 2026: Gross Sales 850,540; Gross Profit 165,080; Expenses 113,568; Net Profit +51,512; Remarks Sum 30,000.
     * August 2026: Gross Sales 191,720; Gross Profit 58,060; Expenses 42,300; Net Profit +15,760; Remarks Sum 0 (10 recorded days).
     * 6-Month Totals: Gross Sales 3,327,270 PKR; Gross Profit 736,133 PKR; Expenses 607,155 PKR; Net Profit +128,978 PKR.
   - Fixed expenses baseline template contains 9 recurring overheads totaling 113,000 PKR.
   - Identified critical July 2026 typo in Excel sheet: cell dates say `2025-07-xx` instead of `2026-07-xx`.

4. **Codebase Dual Engine Architecture**:
   - `src/db/client.ts:8, 705-722`: Dual operation support: when running in Tauri desktop environment, SQLite queries are executed; when running in browser or Node.js without Tauri, `memoryStore` handles state.
   - `src/db/schema.ts:440-500`: `expenses` and `monthly_reports` Drizzle table definitions already created.

5. **Test Specification Matrix Generated**:
   - Written to `/home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/e2e_spec_miner_1/report.md`:
     * Features Discovered table: 22 distinct features/fixes cataloged.
     * Edge Cases table: 18 concrete edge scenarios cataloged.
     * Tier 1: 80+ isolated happy-path test cases (>= 5 test cases per feature for F1 to F16).
     * Tier 2: 80+ boundary & corner test cases (>= 5 test cases per feature for F1 to F16).
     * Tier 3: 25 pairwise cross-feature combination test cases.
     * Tier 4: 5 extensive, real-world multi-step shop operating workloads.

---

## 2. Logic Chain

1. **Step 1 (Ground Truth Alignment)**: The master user request demands an opaque-box test suite covering the entire monthly reporting and expense system. Ground truth is strictly established by the real-world accounting records in `context/Monthly Report 2026.xlsx` and interface contracts in `PROJECT.md`.
2. **Step 2 (Formula Extraction)**: By analyzing the workbook formulas (`D37 = SUM(D6:D36)`, `D41 = E37`, `D53 = SUM(D43:D52)`, `D54 = D41 - D53`), the core accounting invariant is locked: `Net Profit = Gross Profit - Total Expenses`. Negative net profit is valid and observed in March and May 2026.
3. **Step 3 (Boundary Extraction)**: By examining calendar lengths (Feb 28/29, Apr/Jun/Sep/Nov 30, Jan/Mar/May/Jul/Aug/Oct/Dec 31) and physical anomalies (June 23 GP > Sales, August partial 10 days, July 2025 date typo, zero-sales holiday periods), boundary conditions were specified to guarantee resilient test validation.
4. **Step 4 (Test Matrix Tiering)**: 
   - Tier 1 isolates each feature F1..F16 and verifies baseline contract compliance (>=5 tests each).
   - Tier 2 stresses each feature with negative inputs, zero limits, leap years, date overflows, and SQL injection (>=5 tests each).
   - Tier 3 evaluates pairwise feature dynamics (e.g. adding an expense alters monthly report net profit, recurring overhead generation is idempotent, inventory sale voiding restores stock and report metrics).
   - Tier 4 simulates end-to-end multi-day shop operations reflecting actual computer shop workflows.
5. **Step 5 (Dual-Execution Compatibility)**: Because ComputerShopOS supports both Tauri SQLite and in-memory store, the test specifications are designed at the service and UI contract level, making them executable regardless of runner environment.

---

## 3. Caveats

1. **Excel Sheet Typo Normalization**: In `JULY-2026`, dates are written as `2025-07-xx` in raw Excel cells, but day of week is `WEDNESDAY` (matching 2026). Test suites must expect normalized `2026-07-xx` dates in seed data and report outputs.
2. **Partner 15% Share**: Rows 55 and 56 of the Excel workbook calculate a 15% partner distribution (`Row 55 = 15% * D54`, `Row 56 = D54 - D55`). The primary software requirement in `ORIGINAL_REQUEST.md` focuses on `Net Profit = Gross Profit - Total Expenses` (Row 54). If future features display partner share, it should be derived from the standard net profit.
3. **August Incomplete Status**: August 2026 data in the Excel workbook contains entries only up to Day 10. The seed data marks its status as `'CLOSED'`, but live report engines may treat current/unclosed months as `'OPEN'`. Tests must distinguish between historical snapshot querying and live month computation.

---

## 4. Conclusion

All feature specifications, mathematical formulas, historical baseline figures, date boundary rules, and edge cases across Tiers 1 through 4 have been mined from authoritative sources and synthesized into `/home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/e2e_spec_miner_1/report.md`.

The downstream test architects (`sub_orch_e2e_1`) and test writers have an unambiguous, quantitative specification to implement the opaque-box test suite in `tests/e2e/`.

---

## 5. Verification Method

1. **Inspect Report Content**:
   ```bash
   cat /home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/e2e_spec_miner_1/report.md | head -n 50
   ```
2. **Verify Coverage Metrics**:
   - Features Discovered Table contains 22 entries.
   - Edge Cases Table contains 18 entries.
   - Tier 1 contains 80 test specifications across F1–F16.
   - Tier 2 contains 80 boundary test specifications across F1–F16.
   - Tier 3 contains 25 pairwise cross-feature scenarios.
   - Tier 4 contains 5 multi-step real-world workloads.
3. **Cross-Check Historical Baselines**:
   - Compare values in Section 5 with `context/extracted_historical_reports.json` and `context/Monthly Report 2026.xlsx`. All totals (Sales: 3,327,270, GP: 736,133, Expenses: 607,155, Net Profit: 128,978) match 100%.
