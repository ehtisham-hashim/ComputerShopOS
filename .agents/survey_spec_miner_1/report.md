# Comprehensive Specification Mining Report: Historical Monthly Reports & Expenses

**Author**: `survey_spec_miner_1`  
**Date**: September 4, 2026  
**Source Document**: `context/Monthly Report 2026.xlsx` (47,250 bytes)  
**Reference Extraction**: `context/extracted_historical_reports.json` (47,107 bytes)  
**Project Workspace**: `/home/ehtisham/Desktop/Projects/ComputerShopOS`  

---

## 1. Executive Summary

A comprehensive inspection of `context/Monthly Report 2026.xlsx` was conducted using OpenPyXL and Python script analysis. The workbook represents the authoritative real-world accounting records of **"TASNIM COMPUTERS ANWAR CHOWK WAHCANTT"** for the year 2026.

### Key Discoveries:
1. **Workbook Inventory**: Contains 10 sheets: 6 active historical months (**MAR-2026** through **AUG-2026**) with real operational data, and 4 blank monthly templates (**SEP-2026** through **DEC-2026**).
2. **Data Structure**: Each monthly sheet consists of two distinct functional zones:
   - **Daily Sales & Gross Profit Ledger** (Rows 5 to 37): Tracks individual calendar days (1 to 30/31) with Date, Day of Week, Daily Sales, Daily Gross Profit (GP), and Remarks.
   - **Fixed Overheads & Net Profit Calculation** (Rows 39 to 56): Details operational expenditures (Rent, Electricity, Telephone, Salaries, Guard, Cellular bills, Internet) and computes Net Profit.
3. **Remarks Column Purpose**: The `REMARKS` column (Column F) is specifically used to record cash salary withdrawals/advances by the owner/manager (**Tasnim**) throughout the month (e.g., 15,000 PKR on the 15th and 15,000 PKR on month-end). The sum of the Remarks column exactly equals the `TASNIM SALARY` entry in the Fixed Expenses section.
4. **Partner/Tax Split Formula**: Below standard `NET PROFIT OF THE MONTH` (`=Gross Profit - Total Fixed Expenses`), rows 55 and 56 calculate a 15% deduction (`=15% * Net Profit`) and an `Actual Net Profit` (`=Net Profit - 15% Share`), representing a profit-sharing partner distribution.
5. **Data Fidelity Verification**: The existing file `context/extracted_historical_reports.json` matches 100% of all numerical values in `Monthly Report 2026.xlsx` for all 6 active months across all daily rows and expense line items.
6. **Critical Typo Discovery**: In sheet `JULY-2026`, the date column mistakenly specifies `2025-07-01` through `2025-07-31` instead of `2026-07-01` through `2026-07-31`, despite the sheet header and day-of-week explicitly indicating 2026 (Wednesday, July 1, 2026).

---

## 2. Workbook Inventory & Sheet Profiles

The workbook contains exactly 10 sheets:

| # | Sheet Name | Month Covered | Calendar Days | Data Status | Max Rows | Max Cols | Header Title (Row 3) |
|---|------------|---------------|---------------|-------------|----------|----------|----------------------|
| 1 | `MAR-2026` | March 2026 | 31 | Full Month Data | 60 | 10 | SALES AND GROSS PROFIT DETAIL MARCH-2026 |
| 2 | `APRIL-2026` | April 2026 | 30 | Full Month Data | 56 | 6 | SALES AND GROSS PROFIT DETAIL APRIL-2026 |
| 3 | `MAY-2026` | May 2026 | 31 | Full Month Data | 56 | 6 | SALES AND GROSS PROFIT DETAIL MAY-2026 |
| 4 | `JUNE-2026` | June 2026 | 30 | Full Month Data | 56 | 6 | SALES AND GROSS PROFIT DETAIL JUNE-2026 |
| 5 | `JULY-2026` | July 2026 | 31 | Full Month Data | 57 | 6 | SALES AND GROSS PROFIT DETAIL JULY-2026 |
| 6 | `AUG-2026` | August 2026 | 31 | Partial (Days 1–10) | 56 | 7 | SALES AND GROSS PROFIT DETAIL AUG-2026 |
| 7 | `SEP-2026` | September 2026 | 30 | Blank Template (0s) | 55 | 6 | SALES AND GROSS PROFIT DETAIL SEP-2026 |
| 8 | `OCT-2026` | October 2026 | 31 | Blank Template (0s) | 55 | 6 | SALES AND GROSS PROFIT DETAIL OCT-2026 |
| 9 | `NOV-2026` | November 2026 | 30 | Blank Template (0s) | 55 | 6 | SALES AND GROSS PROFIT DETAIL NOV-2026 |
| 10 | `DEC-2026` | December 2026 | 31 | Blank Template (0s) | 55 | 6 | SALES AND GROSS PROFIT DETAIL DEC-2026 |

*Note: There are no sheets for January 2026 or February 2026 in this workbook.*

---

## 3. Detailed Monthly Historical Metrics (March 2026 – August 2026)

All currency figures are in Pakistani Rupees (PKR) as integers.

### Summary Metrics Table

| Metric | March 2026 | April 2026 | May 2026 | June 2026 | July 2026 | August 2026 (10 Days) | 6-Month Total |
|---|---|---|---|---|---|---|---|
| **Gross Sales (PKR)** | 467,100 | 712,630 | 572,500 | 532,780 | 850,540 | 191,720 | **3,327,270** |
| **Gross Profit (PKR)** | 103,770 | 123,390 | 102,253 | 183,580 | 165,080 | 58,060 | **736,133** |
| **Gross Margin %** | 22.2% | 17.3% | 17.9% | 34.5% | 19.4% | 30.3% | **22.1%** |
| **Total Expenses (PKR)** | 111,865 | 117,808 | 110,686 | 110,928 | 113,568 | 42,300 | **607,155** |
| **Net Profit (Standard) (PKR)** | **-8,095** | **+5,582** | **-8,433** | **+72,652** | **+51,512** | **+15,760** | **+128,978** |
| **15% Partner Cut (Row 55)** | -1,214.25 | +837.30 | -1,264.95 | +10,897.80 | +7,726.80 | +2,364.00 | **+19,346.70** |
| **Actual Net Profit (Row 56)** | -6,880.75 | +4,744.70 | -7,168.05 | +61,754.20 | +43,785.20 | +13,396.00 | **+109,631.30** |
| **Remarks Sum (Tasnim Salary)** | 31,500 | 37,700 | 30,000 | 30,000 | 30,000 | 0 (pending) | **159,200** |
| **Days with Recorded Sales** | 28 / 31 | 26 / 30 | 29 / 31 | 29 / 30 | 31 / 31 | 9 / 31 | **152 / 184** |

---

## 4. Sheet Layout & Cell Mapping

Every sheet in the workbook adheres to a standard coordinate grid:

```
Row 1: [B1]: TASNIM COMPUTERS ANWAR CHOWK WAHCANTT (Store Banner)
Row 2: Blank
Row 3: [B3]: SALES AND GROSS PROFIT DETAIL <MONTH>-2026 (Sheet Title)
Row 4: Blank
Row 5: [B5]: DATE | [C5]: Day | [D5]: SALE | [E5]: GP | [F5]: REMARKS (Table Headers)
Row 6 to Row 35/36: Daily entries for Days 1 to 30/31
Row 37: [B37]: TOTAL  | [D37]: =SUM(D6:D36) | [E37]: =SUM(E6:E36) | [F37]: =SUM(F6:F36)
Row 38: Blank
Row 39: [B39]: GROSS PROFIT, FIXED EXPENDITURES AND  NET PROFIT DETAIL (Section Header)
Row 40: Blank
Row 41: [B41]: TOTAL GP  | [D41]: =E37
Row 42: [B42]: LESS FIXED EXPS:
Row 43: [B43]: NET FLEX 
Row 44: [B44]: SHOP RENT
Row 45: [B45]: SHOP ELECTRICITY BILL
Row 46: [B46]: TELEHPONE BILL
Row 47: [B47]: FARHAN BAHI SALARY
Row 48: [B48]: TASNIM SALARY
Row 49: [B49]: ARSLAN BAHI SALARY
Row 50: [B50]: CHOKIDARA
Row 51: [B51]: JAZZ POST PAID BILL
Row 52: [B52]: TELENOR POST PAID BILL
Row 53: [B53]: TOTAL FIXED EXPS | [D53]: =SUM(D43:D52)
Row 54: [B54]: NET PROFIT OF THE MONTH | [D54]: =D41-D53
Row 55: [B55]: 0.15 | [D55]: =15%*D54
Row 56: [B56]: Actual Net Profit | [D56]: =D54-D55
```

*Note: In 30-day months (April, June, September, November), Row 36 is blank, and Row 37 contains the `=SUM(D6:D36)` formula.*

---

## 5. Fixed Expenses Breakdown & Category Mapping

The workbook records 10 distinct fixed expense items. These map directly to the `ExpenseCategories` defined in `src/db/schema.ts`:

| Excel Label (Col B) | Recommended System Category | Description & Policy | Mar 2026 | Apr 2026 | May 2026 | Jun 2026 | Jul 2026 | Aug 2026 | Normal Recurring Value |
|---|---|---|---|---|---|---|---|---|---|
| `SHOP RENT` | `RENT` | Fixed monthly store premises rental | 25,000 | 25,000 | 25,000 | 25,000 | 25,000 | 25,000 | **25,000** |
| `SHOP ELECTRICITY BILL` | `UTILITIES` | Monthly power utility bill | 4,865 | 5,000 | 5,050 | 5,367 | 5,518 | *Unbilled* | **~5,200** |
| `TELEHPONE BILL` | `UTILITIES` | Landline / PTCL telephone & internet | 4,000 | 4,000 | 4,000 | 3,700 | 3,700 | *Unbilled* | **~3,800** |
| `FARHAN BAHI SALARY` | `SALARY` | Staff / Partner monthly base salary | 30,000 | 30,000 | 30,000 | 30,000 | 30,000 | *Unbilled* | **30,000** |
| `TASNIM SALARY` | `SALARY` | Manager / Owner monthly drawings | 31,500 | 37,700 | 30,000 | 30,000 | 30,000 | *Unbilled* | **30,000** |
| `ARSLAN BAHI SALARY` | `SALARY` | Technician / staff salary (escalating) | 15,000 | 15,000 | 15,000 | 16,000 | 17,000 | 17,000 | **17,000** |
| `CHOKIDARA` | `SECURITY_GUARD` | Bazaar / market night watchman fee | 300 | 300 | 300 | 300 | 300 | 300 | **300** |
| `TELENOR POST PAID BILL` | `UTILITIES` | Official shop post-paid mobile line | 1,200 | 808 | 1,336 | 561 | 1,250 | *Unbilled* | **~1,000** |
| `NET FLEX` | `INTERNET` | Streaming service / connectivity | *None* | *None* | 0 | 0 | 800 | *Unbilled* | **800** |
| `JAZZ POST PAID BILL` | `UTILITIES` | Alternate cellular line (dormant) | 0 | 0 | 0 | 0 | 0 | *None* | **0** |
| **TOTAL FIXED EXPENSES** | | | **111,865** | **117,808** | **110,686** | **110,928** | **113,568** | **42,300** | **~113,100** |

### Salary Observations & Rules:
1. **Arslan's Salary Progression**: Started at 15,000 PKR in March–May, increased to 16,000 PKR in June (+1,000), and further increased to 17,000 PKR in July and August. Current rate to use for recurring overhead is **17,000 PKR**.
2. **Tasnim's Salary Draws**: Base compensation is 30,000 PKR. In March (31,500 PKR) and April (37,700 PKR), additional advance draws were taken. In May, June, and July, exactly two draws of 15,000 PKR each were taken (on the 15th/19th and month-end), totaling 30,000 PKR.
3. **August Incompleteness**: August was recorded only through day 10. Consequently, only rent (25,000), Arslan's salary (17,000), and chowkidara (300) were paid by that date, totaling 42,300 PKR. Utilities and other salaries remained unbilled.

---

## 6. Daily Breakdown Analysis (Days 1 to 31)

### Day-by-Day Observations:
- **Zero-Sale Operating Closures**:
  - March 21–23: 0 sales (Saturday through Monday).
  - April 10–13: 4 consecutive 0 sales days (Friday through Monday) — aligns with Eid-ul-Fitr holidays.
  - May 27–28: 0 sales (Wednesday and Thursday).
  - June 26: 0 sales (Friday).
  - August 2: 0 sales (Sunday).
  - August 11–31: Null entries in Excel (file saved mid-month on August 10).
- **Highest Daily Sales**:
  - March 25: 117,950 PKR (GP: 22,370 PKR)
  - April 4: 96,400 PKR (GP: 18,300 PKR)
  - May 10: 151,400 PKR (GP: 8,300 PKR) — Highest single-day revenue in 2026.
  - June 28: 65,300 PKR (GP: 7,200 PKR)
  - July 28: 88,650 PKR (GP: 8,200 PKR)
  - August 3: 44,450 PKR (GP: 8,700 PKR)
- **Highest Daily Gross Profit**:
  - June 23: GP of 62,220 PKR on sales of 14,280 PKR. *(Note: This indicates either a high-margin repair service or inventory adjustment where sales price was lower than realized gain, or cost accounting adjustment).*

---

## 7. Mathematical Formulas Extracted from Excel

The authoritative accounting model uses the following explicit formulas:

1. **Daily Gross Profit**:
   - Stored in Column E for each row $r \in [6, 36]$:
     $$\text{GP}_r = \text{Sales}_r - \text{COGS}_r$$
   - *Special case*: Cell `E14` in sheet `MAY-2026` contains an inline sum formula:
     $$=800 + 300 + 300 + 2003 = 3403$$
2. **Monthly Total Gross Sales**:
   - Cell `D37`:
     $$=SUM(D6:D36)$$
3. **Monthly Total Gross Profit**:
   - Cell `E37`:
     $$=SUM(E6:E36)$$
4. **Monthly Remarks Sum (Salary Draws)**:
   - Cell `F37`:
     $$=SUM(F6:F36)$$
5. **Gross Profit Brought Forward to Expense Section**:
   - Cell `D41`:
     $$=E37$$
6. **Total Fixed Expenses**:
   - Cell `D53` (or `D52` in SEP–DEC templates):
     $$=SUM(D43:D52)$$
7. **Net Profit of the Month**:
   - Cell `D54` (or `D53` in SEP–DEC templates):
     $$\text{Net Profit} = \text{Gross Profit} - \text{Total Fixed Expenses} = D41 - D53$$
8. **Partner Profit Distribution (15%)**:
   - Cell `D55` (or `D54` in SEP–DEC templates):
     $$\text{Partner Cut} = 15\% \times \text{Net Profit} = =15\% * D54$$
9. **Actual Retained Net Profit**:
   - Cell `D56` (or `D55` in SEP–DEC templates):
     $$\text{Actual Net Profit} = \text{Net Profit} - \text{Partner Cut} = =D54 - D55$$

---

## 8. Features Discovered Table

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| 1 | Reporting | Daily Sales & GP Ledger | 31-day table recording daily performance | Date, Day of Week, Sales (PKR), GP (PKR), Remarks | Daily rows array, sums | Null values default to 0 | `Monthly Report 2026.xlsx` rows 6–36 |
| 2 | Reporting | Monthly Totals Aggregation | Aggregates daily sales, profit, and remarks | Range `D6:D36`, `E6:E36`, `F6:F36` | `grossSales`, `grossProfit`, `remarksTotal` | Ignores blank row 36 in 30-day months | Row 37 `=SUM()` formulas |
| 3 | Expenses | Fixed Overheads Ledger | Enumerates 10 standard shop overhead line items | Rent, Bills, Salaries, Guard, Internet | `totalExpenses` sum | Missing/blank entries treated as 0 | Rows 43–52 |
| 4 | Accounting | Standard Net Profit | Computes shop operational net profit | Total GP, Total Fixed Expenses | `netProfit = grossProfit - totalExpenses` | Supports negative numbers (losses) | Row 54 `=D41-D53` |
| 5 | Accounting | 15% Partner Cut | Calculates 15% profit-sharing allocation | Net Profit | `15% * netProfit` | Calculates on negative profit as negative cut | Row 55 `=15%*D54` |
| 6 | Accounting | Actual Retained Net Profit | Calculates post-partner net profit | Net Profit, 15% Partner Cut | `85% * netProfit` | Retains loss proportion if net profit < 0 | Row 56 `=D54-D55` |
| 7 | Payroll | Remarks Salary Draw Tracking | Associates salary advances with Remarks column | Remarks entered on specific calendar days | Sum matches Tasnim Salary line item | Unremarked months require manual entry | Column F `=SUM(F6:F36)` vs Row 48 |
| 8 | History | Historical Month Snapshot Archive | Stores frozen past monthly reports in SQLite | Year, Month, totals, daily JSON, expense JSON | Archived record with status `CLOSED` | Prevents recalculation on closed past months | `monthly_reports` table schema |
| 9 | Overheads | Recurring Overheads Auto-population | Pre-fills recurring overheads for active month | Category, Title, Default Amount | Populated `expenses` rows | Can be modified/supplemented per month | `src/db/expenseService.ts` spec |
| 10 | Metadata | Cell Comments on Items | Annotation on specific transactions | Text comments in cell metadata | Informational note on product/purchase | Dropped in plain value reads unless parsed | Cell `F16` in `MAY-2026` |

---

## 9. Edge Cases Table

| # | Feature | Input | Observed Behavior |
|---|---|---|---|
| 1 | July 2026 Dates | Sheet `JULY-2026`, Cell B6..B36 | Raw cell values show `2025-07-01` to `2025-07-31` (2025 instead of 2026). However, Day of Week is `WEDNESDAY` (matching July 1, 2026, not 2025), Sheet is `JULY-2026`, and expenses are dated 2026. *Recommendation*: Downstream seeder should normalize date strings to `2026-07-xx`. |
| 2 | December Template Dates | Sheet `DEC-2026`, Cell B6..B36 | Template date column contains `2025-12-01` to `2025-12-31`. Blank template with zero entries. |
| 3 | 30-Day vs 31-Day Months | April, June, September, November | Day 31 (Row 36) is completely blank. The formula `=SUM(D6:D36)` correctly aggregates rows 6 to 35 without error. |
| 4 | Incomplete Month (August) | `AUG-2026`, Days 11–31 | Days 11 to 31 have `None` in Excel. Only 3 expenses paid (Rent, Arslan Salary, Chokidara = 42,300). Net profit reflects partial month (+15,760 PKR). Must be seeded with status `CLOSED` or `IN_PROGRESS`. |
| 5 | Negative Net Profit Months | March 2026 (-8,095 PKR), May 2026 (-8,433 PKR) | Expenses exceeded Gross Profit. Net profit is negative. Row 55 (15% share) calculates negative share (-1,214.25 and -1,264.95), and row 56 reflects reduced loss. |
| 6 | Inline Compound Formula in GP | May 9, 2026, Cell `E14` | Cell contains literal formula `=800+300+300+2003` evaluating to `3403`. Numerical parsers reading formulas without evaluation could get a string instead of number. |
| 7 | High Margin Anomaly | June 23, 2026 | Daily Sales = 14,280 PKR, but Gross Profit = 62,220 PKR (GP > Sales). Likely reflects large repair service fee or inventory credit adjustment recorded in GP. |
| 8 | Embedded Cell Comment | May 11, 2026, Cell `F16` | Cell F16 contains comment: `TASNIM COMPUTERS: MOURI AIR BUDS RS. 2300/- BUYING PRICE`. |
| 9 | Missing Fixed Expense Row in Templates | Sheets `SEP-2026` to `DEC-2026` | Row 43 (`NET FLEX`) is absent in template sheets, shifting `TOTAL FIXED EXPS` to row 52 and `NET PROFIT` to row 53. |
| 10 | Zero Cash Flow Days | Eid-ul-Fitr (April 10–13), Eid/holidays (March 21–23, May 27–28, June 26) | Daily sales and GP are 0. System must handle days with zero sales without dividing by zero in margin calculation (`marginPercent = grossSales > 0 ? (grossProfit / grossSales) * 100 : 0`). |

---

## 10. Database Schema Specification

### 1. `expenses` Table
Defined in `src/db/schema.ts` and SQLite DDL:

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
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expenses_year_month ON expenses(year, month);
```

### 2. `monthly_reports` Table
Defined in `src/db/schema.ts` and SQLite DDL:

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
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_reports_year_month ON monthly_reports(year, month);
```

---

## 11. Seed Data JSON Specification for `src/db/seedData.json`

The file `context/extracted_historical_reports.json` is completely extracted and verified. To integrate into `src/db/seedData.json`:

1. Merge `monthlyReports` (6 array elements) and `expenses` (44 array elements) into the root object of `src/db/seedData.json`.
2. *(Recommended Data Cleanliness)*: In `monthlyReports[4]` (July 2026), replace the year typo `"2025-07-"` with `"2026-07-"` in the `dailyDataJson` string.
3. In `src/db/client.ts`:
   - Execute `CREATE TABLE IF NOT EXISTS expenses` and `CREATE TABLE IF NOT EXISTS monthly_reports`.
   - In the database initialization block, if `monthly_reports` count is 0, insert `seedData.monthlyReports`.
   - If `expenses` count is 0, insert `seedData.expenses`.
   - In memory fallback mode (`memoryStore`), populate `memoryMonthlyReports` and `memoryExpenses`.

---

## 12. Standard Recurring Overheads Specification

For `src/db/expenseService.ts` (`applyRecurringOverheads(year, month)`):

```typescript
export const DEFAULT_RECURRING_OVERHEADS = [
  { category: "RENT", title: "SHOP RENT", amount: 25000, paymentMethod: "CASH" },
  { category: "SALARY", title: "FARHAN BAHI SALARY", amount: 30000, paymentMethod: "CASH" },
  { category: "SALARY", title: "TASNIM SALARY", amount: 30000, paymentMethod: "CASH" },
  { category: "SALARY", title: "ARSLAN BAHI SALARY", amount: 17000, paymentMethod: "CASH" },
  { category: "SECURITY_GUARD", title: "CHOKIDARA", amount: 300, paymentMethod: "CASH" },
  { category: "UTILITIES", title: "SHOP ELECTRICITY BILL", amount: 5200, paymentMethod: "CASH" },
  { category: "UTILITIES", title: "TELEPHONE BILL", amount: 3700, paymentMethod: "CASH" },
  { category: "UTILITIES", title: "TELENOR POST PAID BILL", amount: 1000, paymentMethod: "CASH" },
  { category: "INTERNET", title: "NET FLEX", amount: 800, paymentMethod: "CASH" },
];
```

Total recurring overhead base: **113,000 PKR**.
