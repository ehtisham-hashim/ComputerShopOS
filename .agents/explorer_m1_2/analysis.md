# Exploration Analysis: Historical Seed Data & Merge Strategy (M1.2)

**Author**: `explorer_m1_2` (teamwork_preview_explorer)  
**Date**: 2026-09-04  
**Working Directory**: `/home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/explorer_m1_2`  
**Target Files**:
- `/home/ehtisham/Desktop/Projects/ComputerShopOS/src/db/seedData.json`
- `/home/ehtisham/Desktop/Projects/ComputerShopOS/context/extracted_historical_reports.json`
- `/home/ehtisham/Desktop/Projects/ComputerShopOS/context/Monthly Report 2026.xlsx`
- `/home/ehtisham/Desktop/Projects/ComputerShopOS/PROJECT.md`
- `/home/ehtisham/Desktop/Projects/ComputerShopOS/src/db/schema.ts`
- `/home/ehtisham/Desktop/Projects/ComputerShopOS/src/db/client.ts`

---

## 1. Executive Summary & Objective

The objective of this investigation is to analyze the historical report data in `context/extracted_historical_reports.json` (and `context/Monthly Report 2026.xlsx`) and the existing static seed data in `src/db/seedData.json`, determining the exact specification and safe execution procedure to merge historical monthly reports and fixed shop expenses (March 2026 – August 2026) into `src/db/seedData.json`.

### Key Findings:
1. **Existing Seed Data Invariant**: `src/db/seedData.json` currently contains three top-level keys: `payableParties` (13 records), `payableLedger` (1,093 records), and `receivables` (14 records). These 1,120 records must remain strictly preserved with 100% byte and value fidelity.
2. **Historical Data Completeness**: `context/extracted_historical_reports.json` contains:
   - 6 monthly report summaries (`March 2026` through `August 2026`) with pre-computed financial aggregates (`grossSales`, `grossProfit`, `totalExpenses`, `netProfit`), complete 30/31-day daily sales breakdowns (`dailyDataJson`), and categorized expense lists (`expenseDataJson`).
   - 44 categorized shop expenses across the 6 months matching five valid enum categories: `RENT`, `UTILITIES`, `SALARY`, `SECURITY_GUARD`, and `INTERNET`.
   - Financial arithmetic across all 6 months is exact: `netProfit === grossProfit - totalExpenses` with $0 variance, and the sum of daily sales/GP matches monthly totals with $0 variance.
3. **July 2026 Date Anomaly Root Cause & Scope**:
   - In `context/Monthly Report 2026.xlsx`, sheet `JULY-2026`, the date column cells were entered with year 2025 (`2025-07-01` through `2025-07-31`), even though the sheet title is `JULY-2026` and the day of week was `WEDNESDAY` (which matches 2026-07-01, whereas 2025-07-01 was Tuesday).
   - In `context/extracted_historical_reports.json`, all 31 daily rows in July's `dailyDataJson` have `"date": "2025-07-xx"`. These represent the **only** occurrences of "2025" in the entire dataset (exactly 31 occurrences).
   - The expense timestamps (`expenseDate: 1782846000`) and weekdays in July are already correctly set to 2026.
   - Normalization requires rewriting `"2025-07-xx"` to `"2026-07-xx"`.
4. **Target Data Shape**: Two new top-level keys must be appended to `src/db/seedData.json`:
   - `monthlyReports`: Array of 6 objects with IDs `1..6`, `status: "CLOSED"`, normalized July daily data, and matching expense data.
   - `expenses`: Array of 44 objects with sequential IDs `1..44`, Unix timestamp `expenseDate`, and matching category enums.
   - Synchronizing IDs `1..44` inside `monthlyReports[].expenseDataJson` ensures downstream React UI views and TypeScript models have unique keys and zero missing IDs.

---

## 2. Current State of `src/db/seedData.json`

### 2.1 File Overview
- **Path**: `/home/ehtisham/Desktop/Projects/ComputerShopOS/src/db/seedData.json`
- **Size**: 272,199 bytes (~272 KB)
- **Total Lines**: 12,343 lines
- **Format**: Standard JSON object (`{ "key": [...] }`)

### 2.2 Existing Keys & Record Counts
| Top-Level Key | Record Count | ID Range / Key Field | Description |
|---|---|---|---|
| `payableParties` | 13 | `id`: 1 to 13 | Vendor/supplier master accounts with balance and debit/credit summaries |
| `payableLedger` | 1,093 | `id`: 1 to 1093 | Granular ledger transactions (payments, purchases, opening balances) |
| `receivables` | 14 | `invoiceNo`: `RCV-2026-002` to `RCV-2026-015` | Historical receivables and outstanding customer invoices |

### 2.3 Existing Field Names & Typing Conventions
- Property names in `seedData.json` use **camelCase**:
  - `payableParties`: `id`, `name`, `phone`, `address`, `totalDebit`, `totalCredit`, `currentBalance`, `notes`
  - `payableLedger`: `id`, `partyId`, `txDate`, `txType`, `refNo`, `description`, `debit`, `credit`, `balance`, `createdAt`
  - `receivables`: `invoiceNo`, `customerName`, `customerPhone`, `totalAmount`, `paidAmount`, `paymentStatus`, `balanceDue`, `paymentMethod`, `notes`, `isBadDebt`, `createdAt`
- In `src/db/client.ts` (lines 498–514 and 582–629), the seed hydration functions read these camelCase properties directly and bind them to SQLite parameterized queries (`?`) and `memoryStore` collections.
- **Strict Requirement**: Any merge must preserve all 1,120 records without changing property names, types, order, or values.

---

## 3. Analysis of Historical Data (`context/extracted_historical_reports.json`)

### 3.1 Structure Overview
The file contains two top-level keys:
```json
{
  "monthlyReports": [ /* 6 monthly report objects */ ],
  "expenses": [ /* 44 expense objects */ ]
}
```

### 3.2 Monthly Reports Breakdown (March 2026 – August 2026)
Each report in `monthlyReports` corresponds to one completed operational month:

| Month | Month Label | Gross Sales | Gross Profit | Total Expenses | Net Profit | Daily Rows | Expense Items | Net Profit Verification |
|---|---|---|---|---|---|---|---|---|
| 3 | March 2026 | 467,100 | 103,770 | 111,865 | -8,095 | 31 | 8 | $103,770 - 111,865 = -8,095$ (Exact) |
| 4 | April 2026 | 712,630 | 123,390 | 117,808 | 5,582 | 30 | 8 | $123,390 - 117,808 = 5,582$ (Exact) |
| 5 | May 2026 | 572,500 | 102,253 | 110,686 | -8,433 | 31 | 8 | $102,253 - 110,686 = -8,433$ (Exact) |
| 6 | June 2026 | 532,780 | 183,580 | 110,928 | 72,652 | 30 | 8 | $183,580 - 110,928 = 72,652$ (Exact) |
| 7 | July 2026 | 850,540 | 165,080 | 113,568 | 51,512 | 31 | 9 | $165,080 - 113,568 = 51,512$ (Exact) |
| 8 | August 2026 | 191,720 | 58,060 | 42,300 | 15,760 | 31 | 3 | $58,060 - 42,300 = 15,760$ (Exact) |

#### Financial Consistency Invariants:
1. **Daily Aggregates**:
   $$\sum_{d=1}^{N} \text{sales}_d = \text{grossSales} \quad (\text{Variance} = 0 \text{ across all months})$$
   $$\sum_{d=1}^{N} \text{grossProfit}_d = \text{grossProfit} \quad (\text{Variance} = 0 \text{ across all months})$$
2. **Expense Sums**:
   $$\sum_{e=1}^{M} \text{amount}_e = \text{totalExpenses} \quad (\text{Variance} = 0 \text{ across all months})$$
3. **Net Profit Formula**:
   $$\text{netProfit} = \text{grossProfit} - \text{totalExpenses} \quad (\text{Strictly enforced})$$
4. **Other Monthly Fields**:
   - `collectedCash`: equals `grossSales` (cash business model in historical period)
   - `receivables`: `0`
   - `payables`: `0`
   - `repairRevenue`: `0`
   - `swapMargin`: `0`
   - `status`: `"CLOSED"`

### 3.3 Expenses Breakdown (44 Items)
All 44 expense entries in `data['expenses']` match the concatenated items in `data['monthlyReports'][].expenseDataJson`.

#### Category Distribution:
| Category | Count | Total Amount (PKR) | Notes |
|---|---|---|---|
| `RENT` | 6 | 150,000 | 25,000/month (Shop rent) |
| `SALARY` | 16 | 369,000 | Staff salaries: Farhan (30k/mo), Tasnim (31.5k/mo), Arslan (15k/mo), etc. |
| `UTILITIES` | 13 | 75,987 | Shop electricity, PTCL/telephone, Telenor postpaid |
| `INTERNET` | 3 | 2,400 | Net Flex bills (June, July, August) |
| `SECURITY_GUARD` | 6 | 9,760 | Night watchman / chokidara (300 to 4,860) |
| **Total** | **44** | **607,147** | Sum across March–August 2026 |

All categories exist in `ExpenseCategories = ["RENT", "UTILITIES", "SALARY", "SECURITY_GUARD", "INTERNET", "TEA_FOOD", "MAINTENANCE", "MARKETING", "MISC"]` in `src/db/schema.ts`.

---

## 4. Investigation of July 2026 Date Anomaly

### 4.1 Excel Source Inspection
In `context/Monthly Report 2026.xlsx`:
- The workbook contains 10 sheets: `MAR-2026`, `APRIL-2026`, `MAY-2026`, `JUNE-2026`, `JULY-2026`, `AUG-2026`, `SEP-2026`, `OCT-2026`, `NOV-2026`, `DEC-2026`.
- In sheet `JULY-2026`:
  - Row 3 explicitly declares: `"SALES AND GROSS PROFIT DETAIL JULY-2026"`
  - Column B (Date) contains Excel date serial values evaluating to `2025-07-01` through `2025-07-31`.
  - Column C (Day of Week) contains `WEDNESDAY` on Row 6 (Day 1), `THURSDAY` on Row 7 (Day 2), etc.
  - In the Gregorian calendar:
    - **2025-07-01** was a **Tuesday**.
    - **2026-07-01** was a **Wednesday**.
- This proves conclusively that the shop clerk entered "25" instead of "26" for the year in the date formula, but the calendar days, sheet title, and business period were unequivocally July 2026.

### 4.2 Search for Anomaly in Extracted JSON
Regex search across the entire `context/extracted_historical_reports.json` reveals:
- Exactly 31 occurrences of `"2025"` in the entire file.
- All 31 occurrences are located exclusively in `monthlyReports[4].dailyDataJson`:
  - `{"day": 1, "date": "2025-07-01", "dayOfWeek": "WEDNESDAY", ...}`
  - ...
  - `{"day": 31, "date": "2025-07-31", "dayOfWeek": "FRIDAY", ...}`
- No other months (March, April, May, June, August) have any 2025 dates.
- July expenses in both `monthlyReports[4].expenseDataJson` and top-level `expenses` already have the correct 2026 Unix timestamp: `expenseDate: 1782846000` (`2026-07-01 00:00:00` local / `2026-06-30 19:00:00` UTC).

### 4.3 Date Normalization Rule
For July 2026 (`month === 7`):
- For every row `d` in `dailyData`:
  `d.date = d.date.replace("2025-07-", "2026-07-")` (e.g. `"2026-07-01"` through `"2026-07-31"`).
- `d.dayOfWeek` remains `"WEDNESDAY"`, `"THURSDAY"`, etc. as already present.
- Assertion check:
  `assert not any("2025" in d["date"] for d in julyDailyData)`

---

## 5. Target Shape & Specifications for `src/db/seedData.json`

### 5.1 JSON File Schema
The merged `src/db/seedData.json` will have exactly 5 top-level keys:
```json
{
  "payableParties": [ /* 13 unchanged objects */ ],
  "payableLedger": [ /* 1093 unchanged objects */ ],
  "receivables": [ /* 14 unchanged objects */ ],
  "monthlyReports": [ /* 6 normalized historical monthly reports */ ],
  "expenses": [ /* 44 historical expense records */ ]
}
```

### 5.2 Schema Specification: `monthlyReports` (6 items)
Each item in `monthlyReports` conforms to:
```typescript
interface SeedMonthlyReport {
  id: number;                // 1 to 6
  year: number;              // 2026
  month: number;             // 3 to 8
  monthLabel: string;        // "March 2026" .. "August 2026"
  grossSales: number;        // integer
  grossProfit: number;       // integer
  totalExpenses: number;     // integer
  netProfit: number;         // integer (grossProfit - totalExpenses)
  collectedCash: number;     // integer
  receivables: number;       // 0
  payables: number;          // 0
  repairRevenue: number;     // 0
  swapMargin: number;        // 0
  dailyDataJson: string;     // JSON string of DailyReportRow[] with normalized dates
  expenseDataJson: string;   // JSON string of ExpenseRecord[] with matching IDs 1..44
  status: "CLOSED";          // "CLOSED"
  createdAt: number;         // Unix timestamp
  updatedAt: number;         // Unix timestamp
}
```

#### IDs and Month Mapping:
| ID | Year | Month | Month Label | First Expense ID | Last Expense ID |
|---|---|---|---|---|---|
| 1 | 2026 | 3 | March 2026 | 1 | 8 |
| 2 | 2026 | 4 | April 2026 | 9 | 16 |
| 3 | 2026 | 5 | May 2026 | 17 | 24 |
| 4 | 2026 | 6 | June 2026 | 25 | 32 |
| 5 | 2026 | 7 | July 2026 | 33 | 41 |
| 6 | 2026 | 8 | August 2026 | 42 | 44 |

### 5.3 Schema Specification: `expenses` (44 items)
Each item in `expenses` conforms to `ExpenseRecord`:
```typescript
interface SeedExpense {
  id: number;                // 1 to 44
  year: number;              // 2026
  month: number;             // 3 to 8
  category: "RENT" | "UTILITIES" | "SALARY" | "SECURITY_GUARD" | "INTERNET";
  title: string;             // e.g. "SHOP RENT", "FARHAN BAHI SALARY"
  amount: number;            // integer (PKR)
  expenseDate: number;       // Unix timestamp (1st of month)
  paymentMethod: "CASH";     // "CASH"
  notes: string;             // "Imported from Monthly Report 2026.xlsx"
  createdAt: number;         // Unix timestamp matching expenseDate
}
```

### 5.4 DailyReportRow Structure inside `dailyDataJson`
Inside `monthlyReports[i].dailyDataJson`:
```typescript
interface DailyReportRow {
  day: number;           // 1 to 30/31
  date: string;          // "2026-MM-DD"
  dayOfWeek: string;     // "SUNDAY", "MONDAY", etc.
  sales: number;         // integer
  grossProfit: number;   // integer
  remarks: string;       // e.g. "" or "15000"
}
```

---

## 6. Integration with Peer Subagents & Architectural Contracts

### 6.1 Alignment with `explorer_m1_1` (Schema Definitions & Interfaces)
- `explorer_m1_1` defines the domain interfaces:
  `DailyReportRow`, `MonthlyReportDetail`, `ExpenseRecord`, and enum `ReportStatuses = ["OPEN", "CLOSED"]`.
- The merged data in `seedData.json` matches these interfaces:
  - `ExpenseRecord` requires `id: number` -> our specification assigns sequential IDs `1..44` to both `seedData.expenses` and the embedded `expenseDataJson`.
  - `status: "CLOSED"` matches `ReportStatus`.
  - All category strings match `ExpenseCategories`.

### 6.2 Alignment with `explorer_m1_3` (Client Migrations & Memory Store)
- `explorer_m1_3` designed safe independent table count seeding in `src/db/client.ts`:
  ```typescript
  // Independent check for monthly_reports
  const existingReports = await sqlDb.select<any[]>("SELECT COUNT(*) as cnt FROM monthly_reports");
  const reportCount = existingReports?.[0]?.cnt ?? existingReports?.[0]?.["COUNT(*)"] ?? 0;
  if (Number(reportCount) === 0) {
    for (const mr of seedData.monthlyReports || []) {
      // inserts monthly report
    }
  }

  // Independent check for expenses
  const existingExpenses = await sqlDb.select<any[]>("SELECT COUNT(*) as cnt FROM expenses");
  const expenseCount = existingExpenses?.[0]?.cnt ?? existingExpenses?.[0]?.["COUNT(*)"] ?? 0;
  if (Number(expenseCount) === 0) {
    for (const exp of seedData.expenses || []) {
      // inserts expense
    }
  }
  ```
- In the browser in-memory fallback, `memoryStore.monthlyReports` and `memoryStore.expenses` read directly from `seedData.monthlyReports` and `seedData.expenses`.
- Providing explicit `id`, `createdAt`, and `updatedAt` in `seedData.json` ensures that in-memory fallback items and SQLite rows have identical primary keys across both runtimes.

---

## 7. Concrete Step-by-Step Merge Instructions for Worker

The Worker can execute the merge deterministically via a Python script.

### 7.1 Python Merge Script (`merge_historical_seed.py`)
```python
import json
import os

SEED_PATH = "src/db/seedData.json"
EXTRACTED_PATH = "context/extracted_historical_reports.json"

# 1. Read existing seedData.json
with open(SEED_PATH, "r", encoding="utf-8") as f:
    existing_seed = json.load(f)

# Guard checks on existing keys
assert "payableParties" in existing_seed, "Missing payableParties!"
assert "payableLedger" in existing_seed, "Missing payableLedger!"
assert "receivables" in existing_seed, "Missing receivables!"
orig_parties_count = len(existing_seed["payableParties"])
orig_ledger_count = len(existing_seed["payableLedger"])
orig_receivables_count = len(existing_seed["receivables"])
assert orig_parties_count == 13, f"Expected 13 parties, got {orig_parties_count}"
assert orig_ledger_count == 1093, f"Expected 1093 ledger entries, got {orig_ledger_count}"
assert orig_receivables_count == 14, f"Expected 14 receivables, got {orig_receivables_count}"

# 2. Read extracted historical reports
with open(EXTRACTED_PATH, "r", encoding="utf-8") as f:
    extracted = json.load(f)

assert len(extracted["monthlyReports"]) == 6, "Expected 6 monthly reports"
assert len(extracted["expenses"]) == 44, "Expected 44 expenses"

# 3. Process expenses with sequential IDs 1..44
processed_expenses = []
for idx, exp in enumerate(extracted["expenses"], start=1):
    e = dict(exp)
    e["id"] = idx
    e["createdAt"] = e.get("expenseDate", 1772305200)
    processed_expenses.append(e)

# 4. Process monthly reports with sequential IDs 1..6, normalized July dates, and mapped expense IDs
processed_reports = []
global_exp_counter = 1

for idx, rep in enumerate(extracted["monthlyReports"], start=1):
    r = dict(rep)
    r["id"] = idx
    
    # Normalize dailyDataJson
    daily_rows = json.loads(r["dailyDataJson"])
    for row in daily_rows:
        if row["date"].startswith("2025-07-"):
            row["date"] = row["date"].replace("2025-07-", "2026-07-")
    r["dailyDataJson"] = json.dumps(daily_rows)
    
    # Map expense IDs inside expenseDataJson to match top-level expenses
    rep_expenses = json.loads(r["expenseDataJson"])
    for e_item in rep_expenses:
        e_item["id"] = global_exp_counter
        global_exp_counter += 1
    r["expenseDataJson"] = json.dumps(rep_expenses)
    
    # Add timestamps if missing
    ref_ts = rep_expenses[0]["expenseDate"] if rep_expenses else 1772305200
    r.setdefault("createdAt", ref_ts)
    r.setdefault("updatedAt", ref_ts)
    
    processed_reports.append(r)

assert global_exp_counter == 45, f"Expected 44 total expenses mapped, got {global_exp_counter - 1}"

# 5. Build merged data structure
merged_seed = {
    "payableParties": existing_seed["payableParties"],
    "payableLedger": existing_seed["payableLedger"],
    "receivables": existing_seed["receivables"],
    "monthlyReports": processed_reports,
    "expenses": processed_expenses,
}

# 6. Strict Validation Assertions
assert len(merged_seed["payableParties"]) == 13
assert len(merged_seed["payableLedger"]) == 1093
assert len(merged_seed["receivables"]) == 14
assert len(merged_seed["monthlyReports"]) == 6
assert len(merged_seed["expenses"]) == 44

# Verify July date normalization: exactly zero occurrences of '2025' in monthlyReports[4]
july_daily = json.loads(merged_seed["monthlyReports"][4]["dailyDataJson"])
for d in july_daily:
    assert d["date"].startswith("2026-07-"), f"Unexpected July date: {d['date']}"
    assert "2025" not in d["date"], f"Found 2025 in July date: {d['date']}"

# Write back to seedData.json with 2-space indentation
with open(SEED_PATH, "w", encoding="utf-8") as f:
    json.dump(merged_seed, f, indent=2)

print("Successfully merged historical data into src/db/seedData.json!")
```

### 7.2 Post-Merge Verification Checklist
The Worker or Reviewer should run:
1. `python3 -c "import json; d=json.load(open('src/db/seedData.json')); print(list(d.keys()), [len(d[k]) for k in d])"`
   - Expected Output: `['payableParties', 'payableLedger', 'receivables', 'monthlyReports', 'expenses'] [13, 1093, 14, 6, 44]`
2. `python3 -c "import json; d=json.load(open('src/db/seedData.json')); assert not any('2025-07' in json.dumps(d['monthlyReports'])); print('July dates cleanly normalized!')"`
   - Expected Output: `July dates cleanly normalized!`
3. `npx tsc --noEmit && pnpm lint`
   - Validates that TypeScript `resolveJsonModule` cleanly typechecks `seedData.json` with zero errors.
