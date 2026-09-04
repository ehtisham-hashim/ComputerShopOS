/**
 * E2E Test Harness & Shared Fixtures for ComputerShopOS
 *
 * Provides:
 * 1. Headless in-memory DB initialization and in-place snapshot & restore (`dbReset`).
 * 2. Authoritative accounting baseline constants from `Monthly Report 2026.xlsx`.
 * 3. Safe dynamic contract loaders for services to ensure tests fail with clean,
 *    informative assertions if a feature is pending implementation.
 */

import * as assert from "node:assert";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { initDb, memoryStore } from "../../src/db/client";
import type * as schema from "../../src/db/schema";

// ---------------------------------------------------------------------------
// 1. Authoritative Accounting Baseline Constants (March – August 2026)
// ---------------------------------------------------------------------------

export interface MonthBenchmark {
  year: number;
  month: number;
  monthLabel: string;
  grossSales: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  grossMarginPercent: number;
  expenseCount: number;
  activeDays: number;
  totalDays: number;
  remarksSum: number;
}

export const HISTORICAL_BENCHMARKS: Record<string, MonthBenchmark> = {
  "2026-03": {
    year: 2026,
    month: 3,
    monthLabel: "March 2026",
    grossSales: 467100,
    grossProfit: 103770,
    totalExpenses: 111865,
    netProfit: -8095,
    grossMarginPercent: 22,
    expenseCount: 8,
    activeDays: 28,
    totalDays: 31,
    remarksSum: 31500,
  },
  "2026-04": {
    year: 2026,
    month: 4,
    monthLabel: "April 2026",
    grossSales: 712630,
    grossProfit: 123390,
    totalExpenses: 117808,
    netProfit: 5582,
    grossMarginPercent: 17,
    expenseCount: 8,
    activeDays: 26,
    totalDays: 30,
    remarksSum: 37700,
  },
  "2026-05": {
    year: 2026,
    month: 5,
    monthLabel: "May 2026",
    grossSales: 572500,
    grossProfit: 102253,
    totalExpenses: 110686,
    netProfit: -8433,
    grossMarginPercent: 18,
    expenseCount: 8,
    activeDays: 29,
    totalDays: 31,
    remarksSum: 30000,
  },
  "2026-06": {
    year: 2026,
    month: 6,
    monthLabel: "June 2026",
    grossSales: 532780,
    grossProfit: 183580,
    totalExpenses: 110928,
    netProfit: 72652,
    grossMarginPercent: 34,
    expenseCount: 8,
    activeDays: 29,
    totalDays: 30,
    remarksSum: 30000,
  },
  "2026-07": {
    year: 2026,
    month: 7,
    monthLabel: "July 2026",
    grossSales: 850540,
    grossProfit: 165080,
    totalExpenses: 113568,
    netProfit: 51512,
    grossMarginPercent: 19,
    expenseCount: 9,
    activeDays: 31,
    totalDays: 31,
    remarksSum: 30000,
  },
  "2026-08": {
    year: 2026,
    month: 8,
    monthLabel: "August 2026",
    grossSales: 191720,
    grossProfit: 58060,
    totalExpenses: 42300,
    netProfit: 15760,
    grossMarginPercent: 30,
    expenseCount: 3,
    activeDays: 9,
    totalDays: 31,
    remarksSum: 0,
  },
};

export const HISTORICAL_TOTALS = {
  grossSales: 3327270,
  grossProfit: 736133,
  totalExpenses: 607155,
  netProfit: 128978,
  expenseCount: 44,
  activeDays: 152,
  totalDays: 184,
  remarksSum: 159200,
};

export const RECURRING_OVERHEADS_TEMPLATE = [
  { title: "SHOP RENT", category: "RENT", amount: 25000 },
  { title: "FARHAN BAHI SALARY", category: "SALARY", amount: 30000 },
  { title: "TASNIM SALARY", category: "SALARY", amount: 30000 },
  { title: "ARSLAN BAHI SALARY", category: "SALARY", amount: 17000 },
  { title: "CHOKIDARA", category: "SECURITY_GUARD", amount: 300 },
  { title: "SHOP ELECTRICITY BILL", category: "UTILITIES", amount: 5200 },
  { title: "TELEPHONE BILL", category: "UTILITIES", amount: 3700 },
  { title: "TELENOR POST PAID BILL", category: "UTILITIES", amount: 1000 },
  { title: "NET FLEX", category: "INTERNET", amount: 800 },
];

export const RECURRING_TOTAL_AMOUNT = 113000;

// ---------------------------------------------------------------------------
// 2. In-Place DB Isolation Fixture (Snapshot & Restore)
// ---------------------------------------------------------------------------

let pristineSnapshot: string | null = null;

/**
 * Initializes the database in memory and captures a deep snapshot.
 */
export async function setupTestDb(): Promise<void> {
  await initDb();
  // Ensure array properties exist in memoryStore even if partially initialized
  const store = memoryStore as any;
  if (!store.expenses) store.expenses = [];
  if (!store.monthlyReports) store.monthlyReports = [];

  if (!pristineSnapshot) {
    pristineSnapshot = JSON.stringify(memoryStore);
  }
}

/**
 * Restores memoryStore collections in-place to avoid cross-test pollution.
 */
export function resetTestDb(): void {
  if (!pristineSnapshot) {
    // If setupTestDb wasn't called yet, capture current state
    pristineSnapshot = JSON.stringify(memoryStore);
    return;
  }

  const cleanState = JSON.parse(pristineSnapshot);
  const store = memoryStore as any;

  for (const key of Object.keys(store)) {
    const target = store[key];
    const source = cleanState[key];

    if (Array.isArray(target)) {
      target.length = 0;
      if (Array.isArray(source)) {
        target.push(...JSON.parse(JSON.stringify(source)));
      }
    } else if (typeof target === "object" && target !== null && typeof source === "object") {
      for (const k of Object.keys(target)) {
        delete target[k];
      }
      Object.assign(target, JSON.parse(JSON.stringify(source)));
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Service Contract Types
// ---------------------------------------------------------------------------

export interface ExpenseServiceContract {
  createExpense(input: schema.CreateExpenseInput): Promise<number>;
  getExpensesByMonth(year: number, month: number): Promise<schema.ExpenseRecord[]>;
  updateExpense(id: number, input: Partial<schema.CreateExpenseInput>): Promise<void>;
  deleteExpense(id: number): Promise<void>;
  getMonthlyExpenseSummary(year: number, month: number): Promise<schema.MonthlyExpenseSummary>;
  applyRecurringExpenses(year: number, month: number): Promise<{ applied: number; skipped: number }>;
}

export interface ReportServiceContract {
  getMonthlyReport(year: number, month: number): Promise<schema.MonthlyReportDetail>;
  getMonthlyReportsHistory(): Promise<schema.MonthlyReportHistoryItem[]>;
  getMonthlyReportDetail(year: number, month: number): Promise<schema.MonthlyReportDetail>;
  generateFinancialReport?(period: string): Promise<any>;
}

export interface PosServiceContract {
  createSale(input: any): Promise<number>;
  getRecentSales(limit?: number): Promise<any[]>;
  getSaleById(id: number): Promise<any>;
  deleteSale(id: number): Promise<void>;
  getAllSaleItems(): Promise<any[]>;
}

export interface InventoryServiceContract {
  getInventoryItems(): Promise<any[]>;
  getInventoryItemById(id: number): Promise<any>;
  updateInventoryItem(id: number, input: any): Promise<void>;
}

export interface RepairsServiceContract {
  getRepairTickets(): Promise<any[]>;
  addRepair(input: any): Promise<number>;
  updateRepair(id: number, input: any): Promise<void>;
  deleteRepair(id: number): Promise<void>;
}

export interface AdjustmentsServiceContract {
  getAdjustments(): Promise<any[]>;
  createAdjustment(input: any): Promise<number>;
  deleteAdjustment(id: number): Promise<void>;
}

// ---------------------------------------------------------------------------
// 4. Safe Dynamic Service Loaders
// ---------------------------------------------------------------------------

/**
 * Creates a fallback proxy that asserts failure when missing functions are invoked.
 */
function createSafeProxy<T extends object>(moduleName: string, loadedMod: any, errMessage?: string): T {
  return new Proxy(loadedMod || {}, {
    get(target, prop: string | symbol) {
      if (prop === "then" || typeof prop === "symbol") {
        return target[prop];
      }
      if (typeof prop === "string" && prop in target && typeof target[prop] === "function") {
        return target[prop].bind(target);
      }
      if (typeof prop === "string" && prop in target) {
        return target[prop];
      }
      return () => {
        const reason = errMessage
          ? `Module "${moduleName}" failed to load: ${errMessage}`
          : `Method "${prop}" is not exported by "${moduleName}"`;
        assert.fail(`[Contract Pending] ${reason}`);
      };
    },
  }) as T;
}

export async function getExpenseService(): Promise<ExpenseServiceContract> {
  try {
    const mod = await import("../../src/db/expenseService");
    return createSafeProxy<ExpenseServiceContract>("src/db/expenseService", mod);
  } catch (err: any) {
    return createSafeProxy<ExpenseServiceContract>("src/db/expenseService", {}, err.message);
  }
}

export async function getReportService(): Promise<ReportServiceContract> {
  try {
    const mod = await import("../../src/db/reportService");
    return createSafeProxy<ReportServiceContract>("src/db/reportService", mod);
  } catch (err: any) {
    return createSafeProxy<ReportServiceContract>("src/db/reportService", {}, err.message);
  }
}

export async function getPosService(): Promise<PosServiceContract> {
  try {
    const mod = await import("../../src/db/posService");
    return createSafeProxy<PosServiceContract>("src/db/posService", mod);
  } catch (err: any) {
    return createSafeProxy<PosServiceContract>("src/db/posService", {}, err.message);
  }
}

export async function getInventoryService(): Promise<InventoryServiceContract> {
  try {
    const mod = await import("../../src/db/inventoryService");
    return createSafeProxy<InventoryServiceContract>("src/db/inventoryService", mod);
  } catch (err: any) {
    return createSafeProxy<InventoryServiceContract>("src/db/inventoryService", {}, err.message);
  }
}

export async function getRepairsService(): Promise<RepairsServiceContract> {
  try {
    const mod = await import("../../src/db/repairsService");
    return createSafeProxy<RepairsServiceContract>("src/db/repairsService", mod);
  } catch (err: any) {
    return createSafeProxy<RepairsServiceContract>("src/db/repairsService", {}, err.message);
  }
}

export async function getAdjustmentsService(): Promise<AdjustmentsServiceContract> {
  try {
    const mod = await import("../../src/db/adjustmentsService");
    return createSafeProxy<AdjustmentsServiceContract>("src/db/adjustmentsService", mod);
  } catch (err: any) {
    return createSafeProxy<AdjustmentsServiceContract>("src/db/adjustmentsService", {}, err.message);
  }
}

// ---------------------------------------------------------------------------
// 5. Source File Reading & Static Contract Verification Helpers
// ---------------------------------------------------------------------------

const PROJECT_ROOT = process.cwd();

export async function readProjectFile(relPath: string): Promise<string> {
  const fullPath = path.join(PROJECT_ROOT, relPath);
  return await fs.readFile(fullPath, "utf-8");
}

export async function fileExists(relPath: string): Promise<boolean> {
  const fullPath = path.join(PROJECT_ROOT, relPath);
  try {
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 6. Accounting Formula & Assertion Helpers
// ---------------------------------------------------------------------------

export function assertNetProfitFormula(grossProfit: number, totalExpenses: number, netProfit: number): void {
  const expected = grossProfit - totalExpenses;
  assert.strictEqual(
    netProfit,
    expected,
    `Net Profit invariant violated: Expected ${grossProfit} - ${totalExpenses} = ${expected}, but got ${netProfit}`
  );
}

export function assertValidDailyRow(row: schema.DailyReportRow, expectedDay: number, expectedYear: number, expectedMonth: number): void {
  assert.strictEqual(row.day, expectedDay, `Daily row day must be ${expectedDay}`);
  const expectedDate = `${expectedYear}-${String(expectedMonth).padStart(2, "0")}-${String(expectedDay).padStart(2, "0")}`;
  assert.strictEqual(row.date, expectedDate, `Daily row date format must be ${expectedDate}`);
  assert.ok(
    ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].includes(row.dayOfWeek),
    `Invalid day of week: ${row.dayOfWeek}`
  );
  assert.ok(typeof row.sales === "number" && !isNaN(row.sales), `Sales must be a valid number on day ${expectedDay}`);
  assert.ok(typeof row.grossProfit === "number" && !isNaN(row.grossProfit), `Gross profit must be a number on day ${expectedDay}`);
  assert.ok(typeof row.remarks === "string", `Remarks must be string on day ${expectedDay}`);
}
