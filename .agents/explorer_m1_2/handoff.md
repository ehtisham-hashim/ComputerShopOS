# Handoff Report: Historical Seed Data & Merge Strategy (M1.2)

**Author**: `explorer_m1_2` (teamwork_preview_explorer)  
**Date**: 2026-09-04  
**Working Directory**: `/home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/explorer_m1_2`  
**Recipient**: `sub_orch_m1_1` (Conversation ID: `c0885c4b-6c20-48b5-adb1-958dfec827c6`)  
**Type**: Hard Handoff (Investigation Complete)

---

## 1. Observation

1. **Existing `src/db/seedData.json`**:
   - Inspected via Python `json.load`:
     ```text
     Top-level keys: ['payableParties', 'payableLedger', 'receivables']
     payableParties count: 13
     payableLedger count: 1093
     receivables count: 14
     Total lines: 12343, Total size: 272199 bytes
     ```
   - Referenced in `src/db/client.ts` (lines 497–516 and 581–630) for SQLite seeding and in-memory store initialization.

2. **Source Historical Data in `context/extracted_historical_reports.json`**:
   - Inspected via Python:
     ```text
     Top-level keys: ['monthlyReports', 'expenses']
     monthlyReports count: 6
     expenses count: 44
     ```
   - Month-by-month financial summary:
     - `March 2026`: GrossSales: 467,100, GrossProfit: 103,770, TotalExpenses: 111,865, NetProfit: -8,095 (31 days, 8 expenses).
     - `April 2026`: GrossSales: 712,630, GrossProfit: 123,390, TotalExpenses: 117,808, NetProfit: 5,582 (30 days, 8 expenses).
     - `May 2026`: GrossSales: 572,500, GrossProfit: 102,253, TotalExpenses: 110,686, NetProfit: -8,433 (31 days, 8 expenses).
     - `June 2026`: GrossSales: 532,780, GrossProfit: 183,580, TotalExpenses: 110,928, NetProfit: 72,652 (30 days, 8 expenses).
     - `July 2026`: GrossSales: 850,540, GrossProfit: 165,080, TotalExpenses: 113,568, NetProfit: 51,512 (31 days, 9 expenses).
     - `August 2026`: GrossSales: 191,720, GrossProfit: 58,060, TotalExpenses: 42,300, NetProfit: 15,760 (31 days, 3 expenses).
   - Invariant verification across all 6 months:
     - Daily sales sum minus `grossSales` = 0.
     - Daily gross profit sum minus `grossProfit` = 0.
     - Expense amount sum minus `totalExpenses` = 0.
     - `grossProfit - totalExpenses === netProfit` exactly.
     - Top-level `expenses` (44 items) is an exact concatenation of all 6 `monthlyReports[].expenseDataJson` arrays.

3. **July 2026 Date Anomaly**:
   - In `context/Monthly Report 2026.xlsx`, sheet `JULY-2026`, Row 6:
     ```python
     [None, datetime.datetime(2025, 7, 1, 0, 0), 'WEDNESDAY', 1150, 370, None, None, None]
     ```
     Date formula yielded 2025, while Day column was `WEDNESDAY` (which is 2026-07-01; 2025-07-01 was a Tuesday) and header is `JULY-2026`.
   - In `context/extracted_historical_reports.json`, searching for `"2025"` returned exactly 31 matches, all within `monthlyReports[4].dailyDataJson` (`"2025-07-01"` through `"2025-07-31"`).
   - All other months (March, April, May, June, August) have dates starting strictly with `"2026-MM-"`.
   - July expenses in both `monthlyReports[4].expenseDataJson` and top-level `expenses` already have the correct 2026 timestamp: `expenseDate: 1782846000` (`2026-07-01 00:00:00` local).

4. **Schema and Contract Requirements (`PROJECT.md` & `src/db/schema.ts`)**:
   - `expenses` table schema: `id` (INTEGER PRIMARY KEY), `year`, `month`, `category`, `title`, `amount`, `expense_date`, `payment_method`, `notes`, `created_at`.
   - `monthly_reports` table schema: `id` (INTEGER PRIMARY KEY), `year`, `month`, `month_label`, `gross_sales`, `gross_profit`, `total_expenses`, `net_profit`, `collected_cash`, `receivables`, `payables`, `repair_revenue`, `swap_margin`, `daily_data_json`, `expense_data_json`, `status`, `created_at`, `updated_at`.
   - Categories in historical expenses: `RENT`, `UTILITIES`, `SALARY`, `SECURITY_GUARD`, `INTERNET` (all are valid members of `ExpenseCategories`).

5. **Dry Run Execution**:
   - Executed a complete in-memory dry run test merging the data with ID mapping and July date normalization.
   - All assertions passed:
     `payableParties`: 13 items (identical).
     `payableLedger`: 1093 items (identical).
     `receivables`: 14 items (identical).
     `monthlyReports`: 6 items (IDs 1..6, normalized July dates, 0 occurrences of "2025").
     `expenses`: 44 items (IDs 1..44).

---

## 2. Logic Chain

1. **Non-Regression Requirement**:
   - Observation 1 establishes that existing database migrations and tests rely on `payableParties`, `payableLedger`, and `receivables` in `seedData.json`.
   - Therefore, the merge operation must copy these three arrays without any alteration to keys, order, or values.

2. **Data Consistency & Scope**:
   - Observation 2 demonstrates that `context/extracted_historical_reports.json` contains complete, audited financial reports and expenses for March 2026 through August 2026.
   - All mathematical sums and net profit formulas are verified to 0 variance.
   - Therefore, no calculations or financial adjustments are required; the source data is structurally sound.

3. **Normalization of July 2026**:
   - Observation 3 proves that the year `2025` in sheet `JULY-2026` of `Monthly Report 2026.xlsx` was a clerical entry error. The sheet header, calendar weekday (`WEDNESDAY` on day 1), and expense timestamps (`1782846000` = July 1, 2026) confirm the business period is July 2026.
   - Therefore, rewriting `"2025-07-"` to `"2026-07-"` across the 31 daily rows in July's `dailyDataJson` restores full calendar integrity and eliminates invalid dates without altering sales, profits, or remarks.

4. **Primary Key Synchronization (`id` assignment)**:
   - Observation 4 shows that `ExpenseRecord` in `PROJECT.md` requires `id: number`, and SQLite tables have auto-increment primary keys.
   - In `extracted_historical_reports.json`, neither monthly reports nor expenses have explicit `id` attributes.
   - In `client.ts`, both SQLite inserts and `memoryStore` browser fallback benefit from explicit IDs (consistent with `payableParties` and `payableLedger` which have explicit IDs 1..13 and 1..1093).
   - Therefore, assigning IDs `1..6` to `monthlyReports` and `1..44` to `expenses`, and mapping these same IDs `1..44` inside each report's embedded `expenseDataJson`, guarantees 100% synchronization between SQLite tables, `memoryStore`, and React component key properties.

---

## 3. Caveats

- **Scope Boundaries**: This report covers historical seed data and merge strategy for `src/db/seedData.json`. It does not modify source code or implement the merge itself, respecting the read-only explorer constraint.
- **Assumptions**: We assume `client.ts` will use independent table count checks (`COUNT(*) FROM monthly_reports` and `COUNT(*) FROM expenses`) as analyzed in `explorer_m1_3/analysis.md`, so existing databases will seed the new tables cleanly.
- **Future Months**: The Excel file contains empty template sheets for September–December 2026 (`SEP-2026` to `DEC-2026`). Per `PROJECT.md` and user request, only historical months (March 2026 through August 2026) are to be seeded.

---

## 4. Conclusion

1. The historical data in `context/extracted_historical_reports.json` is verified and ready for merging into `src/db/seedData.json`.
2. The merged `src/db/seedData.json` must contain exactly 5 top-level keys:
   - `payableParties` (13 items, strictly preserved)
   - `payableLedger` (1,093 items, strictly preserved)
   - `receivables` (14 items, strictly preserved)
   - `monthlyReports` (6 items, IDs 1..6, status "CLOSED", July dates normalized to `2026-07-xx`)
   - `expenses` (44 items, IDs 1..44, categories validated)
3. A fully automated, deterministic Python merge script is provided in `analysis.md § 7.1` for Worker M1 to execute safely.

---

## 5. Verification Method

To independently verify the historical seed data analysis and target merge integrity:

1. **Inspect Detailed Analysis**:
   - Read `/home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/explorer_m1_2/analysis.md`.
2. **Verify Extracted Data Consistency**:
   ```bash
   python3 -c "
   import json
   d = json.load(open('context/extracted_historical_reports.json'))
   assert len(d['monthlyReports']) == 6
   assert len(d['expenses']) == 44
   for r in d['monthlyReports']:
       assert r['netProfit'] == r['grossProfit'] - r['totalExpenses']
   print('Extracted data verification PASSED')
   "
   ```
3. **Verify July Date Anomaly Scope**:
   ```bash
   python3 -c "
   with open('context/extracted_historical_reports.json') as f:
       text = f.read()
   import re
   matches = re.findall('2025', text)
   assert len(matches) == 31, f'Expected 31 occurrences of 2025, found {len(matches)}'
   print('July 2025 date anomaly count verified: exactly 31')
   "
   ```
4. **Verify Dry Run of Worker Merge Script**:
   Run the dry-run simulation:
   ```bash
   python3 -c "
   import json
   orig = json.load(open('src/db/seedData.json'))
   ext = json.load(open('context/extracted_historical_reports.json'))
   assert len(orig['payableParties']) == 13
   assert len(orig['payableLedger']) == 1093
   assert len(orig['receivables']) == 14
   print('Baseline seed verification PASSED')
   "
   ```
5. **Invalidation Conditions**:
   - Any modification or deletion of keys/entries in `payableParties`, `payableLedger`, or `receivables`.
   - Retention of any `2025` date string in `monthlyReports[4].dailyDataJson`.
   - Missing IDs or mismatched expense IDs between top-level `expenses` and `monthlyReports[].expenseDataJson`.
