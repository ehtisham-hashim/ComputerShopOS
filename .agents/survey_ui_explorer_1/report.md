# Comprehensive UI, Routing & Navigation Survey Report

**Agent**: `survey_ui_explorer_1`  
**Date**: 2026-09-04  
**Integrity Mode**: Development / Read-Only Investigation  
**Focus**: Frontend Navigation, AppSidebar, Routing, Monthly Reports UI, Expenses Management Page, Styling Conventions, and Build Pipeline  

---

## Executive Summary

This report delivers the complete architectural blueprint and UI component design for requirements **R4** (Sidebar Navigation Reorganization) and **R5** (UI Implementation) of ComputerShopOS:
1. **Sidebar Navigation & Routing**: Reorganizing `src/components/layout/AppSidebar.tsx` to move `"Monthly Reports"` to the bottom/end of the sidebar, adding `"Expenses & Bills"` as an accessible navigation item, extending `src/components/layout/navTypes.ts` with `"expenses"`, and wiring lazy-loaded routing in `src/components/AppRouter.tsx`.
2. **Monthly Reports Page & System (`src/pages/Reports.tsx`)**: Upgrading from a generic financial analytics page to a dedicated Monthly Report Engine supporting:
   - **Current Month Live View**: Real-time KPI summary cards (Sales, Gross Profit, Expenses, Net Profit = Gross Profit - Expenses, Margin %), a comprehensive 31-day daily calendar breakdown table (day 1..31 sales, gross profit, margin, remarks), and a top-right `[ History ➔ ]` navigation button.
   - **Archive / History List View**: A scrollable list of single-line horizontal card containers for each past month (March 2026 – August 2026 historical records and saved snapshots).
   - **Historical Month Detail View**: Clicking any past month row renders the full monthly report UI populated with that month's immutable snapshot data, complete with a `[ ⬅ Back to History ]` navigation button.
3. **Dedicated Expenses Management Page (`src/pages/Expenses.tsx`)**:
   - Monthly and categorical expense filtering.
   - Metric summary cards (Total Overheads, Salaries, Rent & Facility, Utilities & Tech, Miscellaneous).
   - Category breakdown cards and distribution bars.
   - Full CRUD table (Date, Title, Category Badge, Payment Method, Amount, Notes, Edit/Delete).
   - Recurring Overheads loader modal / one-click action to inject standard shop operating expenses (Shop Rent, Salaries, Electricity, Phone, Chokidara, Internet).
4. **Design System & Conventions**: Leveraging existing TailAdmin primitives (`tail-card`, `tail-input`, `tail-btn-primary`, `PageHeader`, `StatCard`, `StatusBadge`, `Modal`) ensuring full light/dark theme parity and zero layout shifts.
5. **Build & Lint Verification**: Verified baseline scripts (`pnpm lint` -> `tsc --noEmit` and `pnpm build` -> `tsc && vite build`), both exiting with status 0.

---

## 1. Baseline Architecture & Codebase Inspection

### 1.1 Dependencies & UI Stack (`package.json`)
From `package.json`:
- **React**: `19.1.0` (Vite client environment).
- **Styling**: `tailwindcss` `3.4.17` with `@tailwindcss/forms`, custom components in `src/index.css`, and Outfit / Inter typography.
- **Icons**: `lucide-react` `0.475.0`.
- **Charts**: `recharts` `3.10.1` (`AreaChart`, `ResponsiveContainer`, `PieChart`, etc.).
- **CSS Utilities**: `clsx` and `tailwind-merge`.
- **Navigation Model**: State-driven navigation via `NavTab` state in `src/App.tsx` and conditional rendering inside `src/components/AppRouter.tsx` using `React.lazy` and `<Suspense>`. No external routing library (`react-router`) is used, ensuring light desktop footprint and instant tab switching.

### 1.2 Verification Pipeline
- `pnpm lint`: Runs `tsc --noEmit`. Verified clean pass.
- `pnpm build`: Runs `tsc && vite build`. Verified clean pass (2422 modules transformed, bundled into `dist/assets/`).
- `pnpm tauri build`: Calls `tauri build`, executing `beforeBuildCommand: "pnpm build"` before packaging with Rust.

---

## 2. Navigation & Routing Reorganization (R4)

### 2.1 Type Definition Update: `src/components/layout/navTypes.ts`
Currently:
```typescript
// src/components/layout/navTypes.ts (lines 1-12)
export type NavTab =
  | "dashboard"
  | "inventory"
  | "sales"
  | "doc-generator"
  | "repairs"
  | "adjustments"
  | "pc-builder"
  | "customers"
  | "payables"
  | "reports"
  | "settings";
```
**Proposed Change**:
Add `"expenses"` to `NavTab`:
```typescript
export type NavTab =
  | "dashboard"
  | "inventory"
  | "sales"
  | "doc-generator"
  | "repairs"
  | "adjustments"
  | "pc-builder"
  | "customers"
  | "payables"
  | "expenses"
  | "reports"
  | "settings";
```

### 2.2 AppSidebar Navigation Reorganization: `src/components/layout/AppSidebar.tsx`
Currently in `AppSidebar.tsx`:
- Line 2: Imports `BarChart3` for reports.
- Line 40: `{ id: "reports", label: "Financial Reports", icon: BarChart3 }` is positioned in the middle (between `adjustments` and `customers`).
- Line 42: `{ id: "settings", label: "Settings & System", icon: Settings }`.

**Requirement R4 Analysis**:
1. *"Move 'Monthly Reports' item to the end of the sidebar in `src/components/layout/AppSidebar.tsx`."*
2. *"Add 'Expenses & Bills' item to sidebar and router."*
3. *"Sidebar shows 'Monthly Reports' at bottom and 'Expenses & Bills' accessible."*

**Proposed Structure in `AppSidebar.tsx`**:
- Import `ReceiptText` (or `Receipt`) from `lucide-react` for Expenses & Bills.
- Position `"expenses"` logically next to `"payables"` (accounting/procurement module group) or before Settings.
- Position `"reports"` with label `"Monthly Reports"` at the very bottom of the nav items list (after `"settings"`).

```typescript
// Proposed navItems in src/components/layout/AppSidebar.tsx:
const navItems: NavItemConfig[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "sales", label: "Sales & Invoices", icon: ShoppingCart, hotkey: "F2" },
  { id: "payables", label: "Payables & Vendors", icon: Building2, badge: payablesCount > 0 ? `${payablesCount}` : undefined, badgeType: "warning" },
  { id: "expenses", label: "Expenses & Bills", icon: ReceiptText },
  { id: "doc-generator", label: "Doc Generator", icon: FileText, hotkey: "F4" },
  { id: "inventory", label: "Inventory & Serials", icon: Boxes, badge: lowStockCount > 0 ? `${lowStockCount} Low` : `${inventoryCount}`, badgeType: lowStockCount > 0 ? "warning" : "neutral" },
  { id: "repairs", label: "Repairs & RMA", icon: Wrench, badge: activeRepairsCount > 0 ? `${activeRepairsCount}` : undefined, badgeType: "brand" },
  { id: "adjustments", label: "Swaps & Trade-Ins", icon: ArrowLeftRight },
  { id: "customers", label: "Customers (CRM)", icon: Users, badge: customersCount > 0 ? `${customersCount}` : undefined, badgeType: "neutral" },
  { id: "settings", label: "Settings & System", icon: Settings },
  { id: "reports", label: "Monthly Reports", icon: BarChart3 },
];
```
This guarantees:
- "Expenses & Bills" is immediately accessible under financial management.
- "Monthly Reports" is positioned at the very bottom/end of the sidebar.
- Existing badge notifications and hotkeys are preserved.

### 2.3 Router Integration: `src/components/AppRouter.tsx`
`AppRouter.tsx` uses code-split lazy imports.
**Proposed Integration**:
1. Add lazy import:
   ```typescript
   const ExpensesPage = lazy(() => import("../pages/Expenses").then((m) => ({ default: m.ExpensesPage })));
   ```
2. Render in JSX:
   ```typescript
   {activeTab === "expenses" && <ExpensesPage />}
   ```
3. Pass `fetchItems` or refresh hooks if expenses affect inventory (expenses are standalone overheads, so no special props required).

---

## 3. Dedicated Monthly Reports System Design (R5 & R2)

### 3.1 UX State Architecture in `src/pages/Reports.tsx`
The new `ReportsPage` operates in three distinct UI modes:
```
                ┌───────────────────────────────────────┐
                │          ReportsPage Root             │
                └───────────────────┬───────────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           ▼                                                 ▼
┌──────────────────────┐                          ┌──────────────────────┐
│  Mode: "current"     │   [ History ➔ ] Click    │   Mode: "history"    │
│  Current Month Live  ├─────────────────────────►│ Scrollable Past Months│
│  - KPI Summary Cards │                          │ Single-line Rows     │
│  - 31-Day Table      │◄─────────────────────────┤                      │
│  - Daily Charts      │   [ ⬅ Back ] Click       │                      │
└──────────────────────┘                          └──────────┬───────────┘
                                                             │ Click Month Row
                                                             ▼
                                                  ┌──────────────────────┐
                                                  │ Mode: "detail"       │
                                                  │ Historical Month     │
                                                  │ - Historical KPIs    │
                                                  │ - 31-Day Table       │
                                                  │ - Expense Breakdown  │
                                                  │ [ ⬅ Back to History ]│
                                                  └──────────────────────┘
```

### 3.2 View 1: Current Month Live Report View

#### Top Header:
- **Title**: `"Monthly Reports & Performance"`
- **Subtitle**: `"Real-time monthly profit & loss, daily sales calendar, and overhead reconciliation"`
- **Active Month Indicator**: Display current month & year (e.g., `September 2026`).
- **Top-Right Controls**:
  - `[ 🖨️ Print Statement ]` (`tail-btn-secondary`)
  - `[ 📜 History ➔ ]` (`tail-btn-primary` with `History` icon and `ArrowRight` icon)
    - Clicking this toggles `viewMode` from `"current"` to `"history"`.

#### KPI Summary Cards (5-Card Grid):
1. **Gross Sales Invoiced**:
   - Total sales for the month (sum of `sales.total_amount`).
   - Icon: `DollarSign`
   - Description: e.g. `"X invoices processed this month"`
2. **Gross Profit (Hardware)**:
   - Total sales minus COGS (`cost_price * qty`).
   - Icon: `TrendingUp`
   - Description: Gross margin percentage (`GP / Sales * 100%`)
3. **Total Operating Expenses**:
   - Total recorded expenses for the month from SQLite `expenses` table.
   - Icon: `Receipt`
   - Description: Fixed overheads, salaries, rent & utilities
   - Color: Amber / Warning accent
4. **Net Profit**:
   - Formula: **`Net Profit = Gross Profit - Total Expenses`**
   - Icon: `Wallet`
   - Value Color: Green (`text-success-600`) if positive, Red (`text-error-600`) if negative (e.g. `-PKR 8,095`).
   - Description: `"Gross Profit - Operating Expenses"`
5. **Net Profit Margin**:
   - Formula: `(Net Profit / Gross Sales) * 100%`
   - Icon: `Percent`
   - Description: Net operating return on sales

#### Secondary Metrics Bar:
- Collected Cash (`PKR xxx`)
- Customer Receivables / Dues (`PKR xxx`)
- Repair Services Net (`PKR xxx`)
- Trade-in Swap Balance (`PKR xxx`)

#### Daily Calendar Breakdown Table (Day 1..31):
A high-density table displaying daily store performance:
- **Columns**:
  1. `Day / Date`: e.g. `"01" | "2026-09-01"`
  2. `Day of Week`: e.g. `"MONDAY"`
  3. `Sales Invoiced (PKR)`: Daily total sales (font-mono font-semibold)
  4. `Gross Profit (PKR)`: Daily gross profit (font-mono text-brand-600)
  5. `Daily Margin %`: `(GP / Sales) * 100` (e.g. `22.4%`)
  6. `Remarks / Notes`: Text notes (e.g. promotional events, technician notes, or Excel remarks like `"15000"`)
- **Visual Features**:
  - Zebra striping or subtle border separators.
  - Days with zero sales styled with subtle muted opacity so active sales days stand out.
  - Sunday / weekend indicator badge.
- **Table Footer / Total Summary Row**:
  - Total Active Days with sales.
  - Total Monthly Sales Invoiced (`PKR xxx`).
  - Total Monthly Gross Profit (`PKR xxx`).
  - Weighted Average Margin (`xx.x%`).

#### Daily Trend Area Chart:
- Embedded Recharts `AreaChart` plotting Day 1..31 trajectory:
  - Blue line/fill: Daily Sales Volume
  - Emerald line/fill: Daily Gross Profit

---

### 3.3 View 2: History View (Scrollable Single-Line Containers)

When user clicks `[ History ➔ ]`:
- **Header**:
  - Title: `"Monthly Report Archives & Snapshots"`
  - Subtitle: `"Audited financial snapshots from March 2026 onwards"`
  - Left button: `[ ⬅ Back to Current Month ]`
- **History Summary Banner**:
  - Displays total archived months count (6 months), total historical revenue, total historical net profit.
- **Scrollable Past Months List**:
  - Vertical list of single-line horizontal card containers (`tail-card` container with `cursor-pointer`, `hover:border-brand-500`, `hover:shadow-theme-sm`, `transition-all`).
  - Sorted chronologically descending (August 2026, July 2026, June 2026, May 2026, April 2026, March 2026).
  - **Single-Line Container Row Layout**:
    ```
    ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
    │ 📅 August 2026  [CLOSED] │ Sales: PKR 191,720 │ GP: PKR 58,060 │ Exp: PKR 42,300 │ Net: +PKR 15,760 (8.2%) │ [ View Report ➔ ]│
    └──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
    ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
    │ 📅 July 2026    [CLOSED] │ Sales: PKR 850,540 │ GP: PKR 165,080│ Exp: PKR 113,568│ Net: +PKR 51,512 (6.1%) │ [ View Report ➔ ]│
    └──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
    ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
    │ 📅 June 2026    [CLOSED] │ Sales: PKR 532,780 │ GP: PKR 183,580│ Exp: PKR 110,928│ Net: +PKR 72,652 (13.6%)│ [ View Report ➔ ]│
    └──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
    ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
    │ 📅 May 2026     [CLOSED] │ Sales: PKR 572,500 │ GP: PKR 102,253│ Exp: PKR 110,686│ Net: -PKR 8,433 (-1.5%) │ [ View Report ➔ ]│
    └──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
    ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
    │ 📅 April 2026   [CLOSED] │ Sales: PKR 712,630 │ GP: PKR 123,390│ Exp: PKR 117,808│ Net: +PKR 5,582 (0.8%)  │ [ View Report ➔ ]│
    └──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
    ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
    │ 📅 March 2026   [CLOSED] │ Sales: PKR 467,100 │ GP: PKR 103,770│ Exp: PKR 111,865│ Net: -PKR 8,095 (-1.7%) │ [ View Report ➔ ]│
    └──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
    ```
  - **Key Metrics in each row**:
    - **Month & Year**: Bold title with calendar icon.
    - **Status Badge**: `<StatusBadge status="CLOSED" variant="brand" />`
    - **Gross Sales**: `PKR 850,540`
    - **Gross Profit**: `PKR 165,080`
    - **Expenses**: `PKR 113,568`
    - **Net Profit**: Green text if positive (`+PKR 51,512`), Red text if negative (`-PKR 8,095`).
    - **Action Arrow**: `ChevronRight` icon prompting click.

---

### 3.4 View 3: Historical Month Detail View

When any historical month container is clicked:
- Sets `selectedHistoricalMonth` state.
- **Top Header**:
  - `[ ⬅ Back to History ]` navigation button.
  - Month Title: e.g. `"Monthly Report: July 2026 (Archived Snapshot)"`.
  - Status pill: `"AUDITED ARCHIVE"`.
  - `[ 🖨️ Print Statement ]` button.
- **KPI Summary Cards**:
  - Renders the exact Gross Sales, Gross Profit, Total Expenses, Net Profit, and Margin for that historical month.
- **Full Daily Calendar Breakdown Table (Day 1..31)**:
  - Parsed from `monthly_report.dailyDataJson` (e.g. all 31 days with exact sales, gross profit, and remarks matching `Monthly Report 2026.xlsx`).
- **Historical Expense Breakdown Table**:
  - Parsed from `monthly_report.expenseDataJson`:
    - SHOP RENT: PKR 25,000
    - SHOP ELECTRICITY BILL: PKR 5,518
    - TELEPHONE BILL: PKR 3,700
    - FARHAN BAHI SALARY: PKR 30,000
    - TASNIM SALARY: PKR 30,000
    - ARSLAN BAHI SALARY: PKR 17,000
    - CHOKIDARA: PKR 300
    - TELENOR POST PAID BILL: PKR 1,250
    - NET FLEX: PKR 800
    - Total: PKR 113,568

---

## 4. Dedicated Expenses & Bills Management Page Design (`src/pages/Expenses.tsx`)

### 4.1 Layout & Structure
The page resides at `src/pages/Expenses.tsx`.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Receipt] Expenses & Store Overheads                                 [⚡ Apply Overheads] [ + Add Expense ] │
│ Track operating overheads, utilities, salaries, and shop bills                                               │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌─────────────────────┐ │
│ │ Total Expenses   │ │ Salaries         │ │ Rent & Security  │ │ Utilities & Net  │ │ Miscellaneous       │ │
│ │ PKR 113,568      │ │ PKR 77,000       │ │ PKR 25,300       │ │ PKR 10,468       │ │ PKR 800             │ │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘ └─────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Filter Month: July 2026 ▼ ]   [ All ] [ Rent ] [ Salary ] [ Utilities ] [ Internet ] [ Security ] [ Misc ] │
│ 🔍 [ Search expenses... ]                                                                                    │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Date       │ Title / Description     │ Category      │ Method │ Notes               │ Amount       │ Actions │
│ 2026-07-01 │ SHOP RENT               │ [ RENT ]      │ CASH   │ Monthly Shop Rent   │ PKR 25,000   │ [✏️] [🗑️]│
│ 2026-07-01 │ FARHAN BAHI SALARY      │ [ SALARY ]    │ CASH   │ Staff Compensation  │ PKR 30,000   │ [✏️] [🗑️]│
│ 2026-07-01 │ TASNIM SALARY           │ [ SALARY ]    │ CASH   │ Staff Compensation  │ PKR 30,000   │ [✏️] [🗑️]│
│ 2026-07-01 │ ARSLAN BAHI SALARY      │ [ SALARY ]    │ CASH   │ Staff Compensation  │ PKR 17,000   │ [✏️] [🗑️]│
│ 2026-07-01 │ SHOP ELECTRICITY BILL   │ [ UTILITIES ] │ CASH   │ Power bill          │ PKR 5,518    │ [✏️] [🗑️]│
│ 2026-07-01 │ TELEPHONE BILL          │ [ UTILITIES ] │ CASH   │ PTCL landline       │ PKR 3,700    │ [✏️] [🗑️]│
│ 2026-07-01 │ TELENOR POST PAID BILL  │ [ UTILITIES ] │ CASH   │ Mobile internet     │ PKR 1,250    │ [✏️] [🗑️]│
│ 2026-07-01 │ NET FLEX                │ [ INTERNET ]  │ CASH   │ Fiber line          │ PKR 800      │ [✏️] [🗑️]│
│ 2026-07-01 │ CHOKIDARA               │ [ SECURITY ]  │ CASH   │ Night guard fee     │ PKR 300      │ [✏️] [🗑️]│
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Key Features of `Expenses.tsx`
1. **Period Selection**:
   - Month & Year selector allowing quick browsing between any month (including past historical months seeded from Excel, or the live current month).
2. **Category Badges**:
   - `RENT`: Purple badge (`bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300`)
   - `SALARY`: Blue badge (`bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300`)
   - `UTILITIES`: Amber badge (`bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300`)
   - `SECURITY_GUARD`: Slate badge (`bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300`)
   - `INTERNET`: Cyan badge (`bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300`)
   - `TEA_FOOD`: Rose badge (`bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300`)
   - `MAINTENANCE`: Emerald badge (`bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300`)
   - `MISC`: Gray badge
3. **Category Breakdown Progress & Cards**:
   - Horizontal stacked progress bar and mini cards showing percentage contribution of each category to the total monthly spend.
4. **CRUD Actions**:
   - Add new expense via `AddExpenseModal`.
   - Edit existing expense via edit modal.
   - Delete expense with `ConfirmModal`.

### 4.3 Recurring Overheads Loader (`RecurringOverheadsModal`)
- **Objective**: Automate the entry of standard store monthly operating costs so the store owner doesn't have to manually type 8 standard expense items every month.
- **Template Items**:
  1. Shop Rent: `PKR 25,000` (`RENT`)
  2. Farhan Bahi Salary: `PKR 30,000` (`SALARY`)
  3. Tasnim Salary: `PKR 30,000` (`SALARY`)
  4. Arslan Bahi Salary: `PKR 17,000` (`SALARY`)
  5. Shop Electricity Bill: `PKR 5,000` (estimated, `UTILITIES`)
  6. Telephone / PTCL: `PKR 4,000` (`UTILITIES`)
  7. Internet / NetFlex: `PKR 800` (`INTERNET`)
  8. Chokidara (Night Guard): `PKR 300` (`SECURITY_GUARD`)
- **Safety Checks**:
  - Modal checks if recurring expenses have already been loaded for that month and warns: `"Overheads already applied for this month. Applying again may produce duplicate entries."`
  - Allows toggling on/off individual items or editing amounts before saving to SQLite.

---

## 5. UI Component Inventory & Styling System

The project strictly follows the **TailAdmin** design system defined in `context/design.md`:

| Component | File Path | Usage in R4 & R5 |
| :--- | :--- | :--- |
| `PageHeader` | `src/components/ui/PageHeader.tsx` | Standard top page titles, subtitle, and action buttons |
| `StatCard` | `src/components/ui/StatCard.tsx` | Top KPI cards in Reports & Expenses with value color variants |
| `Modal` | `src/components/ui/Modal.tsx` | Add/Edit Expense modal, Recurring Overheads modal |
| `ConfirmModal`| `src/components/ui/ConfirmModal.tsx` | Deleting expense confirmation |
| `StatusBadge` | `src/components/ui/StatusBadge.tsx` | Badges for CLOSED, OPEN, CASH, BANK |
| `EmptyState` | `src/components/ui/EmptyState.tsx` | Zero expense records or zero reports placeholder |
| `SearchInput` | `src/components/ui/SearchInput.tsx` | Filter/search bar for expense titles |
| `.tail-card` | `src/index.css` | Card containers for statistics, tables, and history rows |
| `.tail-btn-primary` | `src/index.css` | Primary action buttons (`[ History ➔ ]`, `+ Add Expense`) |
| `.tail-btn-secondary` | `src/index.css` | Secondary actions (`Print Statement`, `Cancel`) |
| `.tail-input` | `src/index.css` | Form inputs (amounts, titles, dates) |
| `.tail-select` | `src/index.css` | Dropdown selectors (categories, payment methods) |

---

## 6. Implementation Checklist & Verification Plan

### 6.1 Code Modifications Required
1. `src/components/layout/navTypes.ts`:
   - Add `"expenses"` to `NavTab`.
2. `src/components/layout/AppSidebar.tsx`:
   - Move `"reports"` (label `"Monthly Reports"`) to bottom of `navItems`.
   - Add `"expenses"` (label `"Expenses & Bills"`, icon `ReceiptText`) to `navItems`.
3. `src/components/AppRouter.tsx`:
   - Add lazy import for `ExpensesPage`.
   - Add conditional render for `{activeTab === "expenses" && <ExpensesPage />}`.
4. `src/pages/Reports.tsx`:
   - Implement three view modes: `"current"`, `"history"`, `"detail"`.
   - Top-right `[ History ➔ ]` button to switch to past months list.
   - 31-day daily calendar table with Day, Date, DayOfWeek, Sales, GP, Margin, Remarks.
   - Net Profit formula: `Net Profit = Gross Profit - Total Expenses`.
   - Single-line historical month cards with click handler to load historical detail.
5. `src/pages/Expenses.tsx`:
   - Build complete expenses management interface with KPI stats, category breakdown, search, table, CRUD modal, and Recurring Overheads loader.

### 6.2 Verification Commands
- `pnpm lint`: Must pass with 0 errors (`tsc --noEmit`).
- `pnpm build`: Must compile Vite production build cleanly (`tsc && vite build`).
- `pnpm tauri build`: Must build desktop application cleanly.

---

## 7. Synthesis & Recommendations for Implementer

1. **Keep Reports.tsx Clean via Decomposition**:
   - Break down `Reports.tsx` into modular child components under `src/components/reports/`:
     - `CurrentMonthReportView.tsx` (Current month KPI cards, 31-day table, trend chart)
     - `ReportHistoryListView.tsx` (Scrollable list of single-line monthly cards)
     - `HistoricalMonthReportView.tsx` (Snapshot view with back button)
     - `DailyReportTable.tsx` (Reusable 31-day breakdown table)
2. **Handle In-Memory Fallback Smoothly**:
   - For web/dev preview when not inside Tauri (`!isTauri`), ensure `expenseService` and `reportService` fall back cleanly to memory stores or seed data so developer tooling and browser tests run without error.
3. **Number Formatting Consistency**:
   - Always format currency with `PKR ${amount.toLocaleString()}` and margins with `Math.round((profit / sales) * 100)` or `toFixed(1)%` to prevent floating point anomalies.
