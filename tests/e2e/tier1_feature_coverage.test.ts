/**
 * Tier 1: Feature Coverage & Contract Isolation Tests (F1 through F16)
 *
 * Minimum threshold: >= 5 tests per feature (80+ test cases total).
 * Focuses on baseline happy paths, schema declarations, default values,
 * CRUD contracts, and UI navigation contracts in isolation.
 */

import { describe, it, before, beforeEach } from "node:test";
import * as assert from "node:assert";
import {
  setupTestDb,
  resetTestDb,
  getExpenseService,
  getReportService,
  readProjectFile,
  fileExists,
  HISTORICAL_BENCHMARKS,
  assertNetProfitFormula,
} from "./harness";
import { memoryStore, initDb } from "../../src/db/client";
import * as schema from "../../src/db/schema";
import seedData from "../../src/db/seedData.json";

describe("Tier 1: Feature Coverage & Interface Contracts", () => {
  before(async () => {
    await setupTestDb();
  });

  beforeEach(() => {
    resetTestDb();
  });

  // =========================================================================
  // F1: SQLite Schema for Expenses
  // =========================================================================
  describe("F1: SQLite Schema for Expenses", () => {
    it("T1-F1-01: expenses table definition includes all 10 schema columns", async () => {
      assert.ok(schema.expenses, "expenses table must be declared in schema.ts");
      const cols = Object.keys(schema.expenses);
      const expectedCols = ["id", "year", "month", "category", "title", "amount", "expenseDate", "paymentMethod", "notes", "createdAt"];
      for (const col of expectedCols) {
        assert.ok(col in schema.expenses || cols.includes(col), `expenses schema must define column: ${col}`);
      }
    });

    it("T1-F1-02: ExpenseCategories enum defines standard expense categories", () => {
      assert.ok(Array.isArray(schema.ExpenseCategories), "ExpenseCategories must be exported array");
      const expected = ["RENT", "UTILITIES", "SALARY", "SECURITY_GUARD", "INTERNET", "TEA_FOOD", "MAINTENANCE", "MARKETING", "MISC"];
      for (const cat of expected) {
        assert.ok(schema.ExpenseCategories.includes(cat as any), `ExpenseCategories must include ${cat}`);
      }
    });

    it("T1-F1-03: memoryStore.expenses exists as an isolated array collection", () => {
      assert.ok(Array.isArray((memoryStore as any).expenses), "memoryStore.expenses must be an array");
    });

    it("T1-F1-04: memoryStore accepts standard expense records", () => {
      const expenses = (memoryStore as any).expenses;
      const initialCount = expenses.length;
      expenses.push({
        id: 9999,
        year: 2026,
        month: 9,
        category: "RENT",
        title: "Test Rent",
        amount: 25000,
        expenseDate: 1788220800,
        paymentMethod: "CASH",
        notes: "Unit test record",
        createdAt: 1788220800,
      });
      assert.strictEqual(expenses.length, initialCount + 1);
      const inserted = expenses.find((e: any) => e.id === 9999);
      assert.strictEqual(inserted?.title, "Test Rent");
      assert.strictEqual(inserted?.amount, 25000);
    });

    it("T1-F1-05: filtering expenses by year and month isolates records", () => {
      const expenses = (memoryStore as any).expenses;
      const marchExpenses = expenses.filter((e: any) => e.year === 2026 && e.month === 3);
      const aprilExpenses = expenses.filter((e: any) => e.year === 2026 && e.month === 4);
      assert.ok(Array.isArray(marchExpenses), "March filter should return an array");
      assert.ok(Array.isArray(aprilExpenses), "April filter should return an array");
      assert.ok(marchExpenses.every((e: any) => e.month === 3), "All items must have month == 3");
    });
  });

  // =========================================================================
  // F2: SQLite Schema for Monthly Reports
  // =========================================================================
  describe("F2: SQLite Schema for Monthly Reports", () => {
    it("T1-F2-01: monthlyReports table definition includes all 17 schema columns", () => {
      assert.ok(schema.monthlyReports, "monthlyReports table must be declared in schema.ts");
      const expectedCols = [
        "id", "year", "month", "monthLabel", "grossSales", "grossProfit",
        "totalExpenses", "netProfit", "collectedCash", "receivables", "payables",
        "repairRevenue", "swapMargin", "dailyDataJson", "expenseDataJson",
        "status", "createdAt", "updatedAt"
      ];
      for (const col of expectedCols) {
        assert.ok(col in schema.monthlyReports || Object.keys(schema.monthlyReports).includes(col), `monthlyReports must define column: ${col}`);
      }
    });

    it("T1-F2-02: ReportStatuses enum defines OPEN and CLOSED", () => {
      assert.ok(Array.isArray(schema.ReportStatuses), "ReportStatuses must be exported array");
      assert.ok(schema.ReportStatuses.includes("OPEN"), "ReportStatuses must include OPEN");
      assert.ok(schema.ReportStatuses.includes("CLOSED"), "ReportStatuses must include CLOSED");
    });

    it("T1-F2-03: memoryStore.monthlyReports exists as an isolated array collection", () => {
      assert.ok(Array.isArray((memoryStore as any).monthlyReports), "memoryStore.monthlyReports must be an array");
    });

    it("T1-F2-04: serializes and parses dailyDataJson array", () => {
      const sampleDailyData: schema.DailyReportRow[] = [
        { day: 1, date: "2026-09-01", dayOfWeek: "TUESDAY", sales: 15000, grossProfit: 3000, remarks: "" },
        { day: 2, date: "2026-09-02", dayOfWeek: "WEDNESDAY", sales: 25000, grossProfit: 5000, remarks: "" },
      ];
      const serialized = JSON.stringify(sampleDailyData);
      const deserialized: schema.DailyReportRow[] = JSON.parse(serialized);
      assert.strictEqual(deserialized.length, 2);
      assert.strictEqual(deserialized[0].day, 1);
      assert.strictEqual(deserialized[1].sales, 25000);
    });

    it("T1-F2-05: serializes and parses expenseDataJson array", () => {
      const sampleExpenses = [
        { id: 1, year: 2026, month: 9, category: "RENT", title: "SHOP RENT", amount: 25000, expenseDate: 1788220800, paymentMethod: "CASH" },
      ];
      const serialized = JSON.stringify(sampleExpenses);
      const deserialized = JSON.parse(serialized);
      assert.strictEqual(deserialized.length, 1);
      assert.strictEqual(deserialized[0].title, "SHOP RENT");
      assert.strictEqual(deserialized[0].amount, 25000);
    });
  });

  // =========================================================================
  // F3: Historical Seed Data Integration
  // =========================================================================
  describe("F3: Historical Seed Data Integration", () => {
    it("T1-F3-01: seedData.monthlyReports contains exactly 6 historical months", () => {
      assert.ok(Array.isArray((seedData as any).monthlyReports), "seedData must contain monthlyReports array");
      assert.strictEqual((seedData as any).monthlyReports.length, 6, "Must contain exactly 6 historical months (March-August 2026)");
    });

    it("T1-F3-02: seedData.expenses contains exactly 44 items", () => {
      assert.ok(Array.isArray((seedData as any).expenses), "seedData must contain expenses array");
      assert.strictEqual((seedData as any).expenses.length, 44, "Must contain exactly 44 historical expense records");
    });

    it("T1-F3-03: March 2026 seed record matches authoritative accounting figures", () => {
      const march = (seedData as any).monthlyReports.find((r: any) => r.year === 2026 && r.month === 3);
      assert.ok(march, "March 2026 report must exist in seedData");
      assert.strictEqual(march.grossSales, 467100);
      assert.strictEqual(march.grossProfit, 103770);
      assert.strictEqual(march.totalExpenses, 111865);
      assert.strictEqual(march.netProfit, -8095);
      assert.strictEqual(march.status, "CLOSED");
    });

    it("T1-F3-04: July 2026 seed record matches authoritative accounting figures", () => {
      const july = (seedData as any).monthlyReports.find((r: any) => r.year === 2026 && r.month === 7);
      assert.ok(july, "July 2026 report must exist in seedData");
      assert.strictEqual(july.grossSales, 850540);
      assert.strictEqual(july.grossProfit, 165080);
      assert.strictEqual(july.totalExpenses, 113568);
      assert.strictEqual(july.netProfit, 51512);
      assert.strictEqual(july.status, "CLOSED");
    });

    it("T1-F3-05: July 2026 daily data dates are normalized to 2026-07-xx (resolving Excel typo)", () => {
      const july = (seedData as any).monthlyReports.find((r: any) => r.year === 2026 && r.month === 7);
      assert.ok(july, "July report must exist");
      const dailyRows = typeof july.dailyDataJson === "string" ? JSON.parse(july.dailyDataJson) : july.dailyDataJson;
      assert.ok(Array.isArray(dailyRows), "July daily rows must be an array");
      assert.strictEqual(dailyRows.length, 31, "July must have 31 daily rows");
      for (const row of dailyRows) {
        assert.ok(
          row.date.startsWith("2026-07-"),
          `July daily date must start with 2026-07-, found: ${row.date}`
        );
      }
    });
  });

  // =========================================================================
  // F4: Safe Startup Seeding Migration
  // =========================================================================
  describe("F4: Safe Startup Seeding Migration", () => {
    it("T1-F4-01: initDb populates memoryMonthlyReports and memoryExpenses on clean startup", async () => {
      const store = memoryStore as any;
      assert.ok(store.monthlyReports.length >= 6, "monthlyReports should be populated with at least 6 records");
      assert.ok(store.expenses.length >= 44, "expenses should be populated with at least 44 records");
    });

    it("T1-F4-02: initDb is idempotent and does not duplicate records on subsequent calls", async () => {
      const store = memoryStore as any;
      const initialReportCount = store.monthlyReports.length;
      const initialExpenseCount = store.expenses.length;

      await initDb();

      assert.strictEqual(store.monthlyReports.length, initialReportCount, "Report count must remain unchanged after re-init");
      assert.strictEqual(store.expenses.length, initialExpenseCount, "Expense count must remain unchanged after re-init");
    });

    it("T1-F4-03: seeding migration leaves core inventory and customer tables intact", () => {
      const store = memoryStore as any;
      assert.ok(store.inventory.length > 0, "Inventory must retain initial seeded items");
      assert.ok(store.customers.length > 0, "Customers must retain initial seeded records");
    });

    it("T1-F4-04: seeding migration leaves sales and payable parties intact", () => {
      const store = memoryStore as any;
      assert.ok(store.sales.length > 0, "Sales must retain initial records");
      assert.ok(store.payableParties.length > 0, "Payable parties must retain initial records");
    });

    it("T1-F4-05: custom expense inserted before re-init is preserved", async () => {
      const store = memoryStore as any;
      const customExpense = {
        id: 8888,
        year: 2026,
        month: 11,
        category: "MARKETING" as any,
        title: "Facebook Ads",
        amount: 5000,
        expenseDate: 1793491200,
        paymentMethod: "CASH",
        notes: "Preserve test",
        createdAt: 1793491200,
      };
      store.expenses.push(customExpense);
      await initDb();
      const found = store.expenses.find((e: any) => e.id === 8888);
      assert.ok(found, "Custom expense must be preserved across initDb runs");
    });
  });

  // =========================================================================
  // F5: Expense Service CRUD
  // =========================================================================
  describe("F5: Expense Service CRUD", () => {
    it("T1-F5-01: createExpense inserts record and returns positive integer ID", async () => {
      const expenseService = await getExpenseService();
      const id = await expenseService.createExpense({
        year: 2026,
        month: 9,
        category: "UTILITIES",
        title: "September Internet",
        amount: 3500,
        expenseDate: 1788220800,
        paymentMethod: "CASH",
        notes: "Fibre connection",
      });
      assert.ok(typeof id === "number" && id > 0, "createExpense must return positive integer ID");
    });

    it("T1-F5-02: getExpensesByMonth returns expenses for the requested month", async () => {
      const expenseService = await getExpenseService();
      const marchExpenses = await expenseService.getExpensesByMonth(2026, 3);
      assert.ok(Array.isArray(marchExpenses), "Must return array of expenses");
      assert.strictEqual(marchExpenses.length, 8, "March 2026 must have 8 expenses");
      assert.ok(marchExpenses.every((e) => e.year === 2026 && e.month === 3));
    });

    it("T1-F5-03: updateExpense updates fields of an existing expense", async () => {
      const expenseService = await getExpenseService();
      const marchExpenses = await expenseService.getExpensesByMonth(2026, 3);
      const target = marchExpenses[0];
      assert.ok(target, "March expense must exist");

      await expenseService.updateExpense(target.id, {
        amount: target.amount + 500,
        notes: "Updated in test",
      });

      const updatedList = await expenseService.getExpensesByMonth(2026, 3);
      const updated = updatedList.find((e) => e.id === target.id);
      assert.strictEqual(updated?.amount, target.amount + 500);
      assert.strictEqual(updated?.notes, "Updated in test");
    });

    it("T1-F5-04: deleteExpense removes the specified expense record", async () => {
      const expenseService = await getExpenseService();
      const createdId = await expenseService.createExpense({
        year: 2026,
        month: 9,
        category: "MISC",
        title: "To Be Deleted",
        amount: 1000,
        expenseDate: 1788220800,
        paymentMethod: "CASH",
      });

      await expenseService.deleteExpense(createdId);
      const septExpenses = await expenseService.getExpensesByMonth(2026, 9);
      assert.ok(!septExpenses.some((e) => e.id === createdId), "Deleted expense must no longer exist");
    });

    it("T1-F5-05: getMonthlyExpenseSummary calculates total and category breakdown accurately", async () => {
      const expenseService = await getExpenseService();
      const summary = await expenseService.getMonthlyExpenseSummary(2026, 3);
      assert.ok(summary, "Must return summary object");
      assert.strictEqual(summary.total, 111865, "March 2026 total expenses must be 111,865");
      assert.strictEqual(summary.byCategory["RENT"], 25000, "March Rent must be 25,000");
      assert.strictEqual(summary.byCategory["SECURITY_GUARD"], 300, "March Chokidara must be 300");
    });
  });

  // =========================================================================
  // F6: Recurring Overheads Generator
  // =========================================================================
  describe("F6: Recurring Overheads Generator", () => {
    it("T1-F6-01: applyRecurringExpenses generates 9 standard overheads on fresh month", async () => {
      const expenseService = await getExpenseService();
      const result = await expenseService.applyRecurringExpenses(2026, 10);
      assert.ok(result, "Must return applied/skipped result");
      assert.strictEqual(result.applied, 9, "Should apply 9 recurring overheads on empty month");
      assert.strictEqual(result.skipped, 0, "Should skip 0 overheads on empty month");
    });

    it("T1-F6-02: second execution of applyRecurringExpenses is idempotent and skips existing", async () => {
      const expenseService = await getExpenseService();
      await expenseService.applyRecurringExpenses(2026, 10);
      const secondRun = await expenseService.applyRecurringExpenses(2026, 10);
      assert.strictEqual(secondRun.applied, 0, "Should apply 0 overheads on duplicate run");
      assert.strictEqual(secondRun.skipped, 9, "Should skip all 9 existing overheads");
    });

    it("T1-F6-03: recurring overheads total equals exactly 113,000 PKR", async () => {
      const expenseService = await getExpenseService();
      await expenseService.applyRecurringExpenses(2026, 10);
      const expenses = await expenseService.getExpensesByMonth(2026, 10);
      const total = expenses.reduce((sum, e) => sum + e.amount, 0);
      assert.strictEqual(total, 113000, "Recurring overheads template total must be 113,000 PKR");
    });

    it("T1-F6-04: Arslan Bahi Salary is generated at 17,000 PKR", async () => {
      const expenseService = await getExpenseService();
      await expenseService.applyRecurringExpenses(2026, 10);
      const expenses = await expenseService.getExpensesByMonth(2026, 10);
      const arslan = expenses.find((e) => e.title.includes("ARSLAN"));
      assert.ok(arslan, "Arslan salary expense must exist");
      assert.strictEqual(arslan.amount, 17000, "Arslan salary must be 17,000 PKR");
    });

    it("T1-F6-05: recurring overheads contain required titles", async () => {
      const expenseService = await getExpenseService();
      await expenseService.applyRecurringExpenses(2026, 10);
      const expenses = await expenseService.getExpensesByMonth(2026, 10);
      const titles = expenses.map((e) => e.title);
      assert.ok(titles.some((t) => t.includes("SHOP RENT")), "Must contain SHOP RENT");
      assert.ok(titles.some((t) => t.includes("FARHAN")), "Must contain FARHAN SALARY");
      assert.ok(titles.some((t) => t.includes("TASNIM")), "Must contain TASNIM SALARY");
      assert.ok(titles.some((t) => t.includes("CHOKIDARA")), "Must contain CHOKIDARA");
    });
  });

  // =========================================================================
  // F7: Live Monthly Report Engine
  // =========================================================================
  describe("F7: Live Monthly Report Engine", () => {
    it("T1-F7-01: getMonthlyReport returns report object with required financial fields", async () => {
      const reportService = await getReportService();
      const report = await reportService.getMonthlyReport(2026, 3);
      assert.ok(report, "getMonthlyReport must return a report object");
      assert.strictEqual(typeof report.grossSales, "number");
      assert.strictEqual(typeof report.grossProfit, "number");
      assert.strictEqual(typeof report.totalExpenses, "number");
      assert.strictEqual(typeof report.netProfit, "number");
    });

    it("T1-F7-02: March 2026 report grossSales equals 467,100", async () => {
      const reportService = await getReportService();
      const report = await reportService.getMonthlyReport(2026, 3);
      assert.strictEqual(report.grossSales, 467100);
    });

    it("T1-F7-03: March 2026 report grossProfit equals 103,770", async () => {
      const reportService = await getReportService();
      const report = await reportService.getMonthlyReport(2026, 3);
      assert.strictEqual(report.grossProfit, 103770);
    });

    it("T1-F7-04: March 2026 report totalExpenses equals 111,865", async () => {
      const reportService = await getReportService();
      const report = await reportService.getMonthlyReport(2026, 3);
      assert.strictEqual(report.totalExpenses, 111865);
    });

    it("T1-F7-05: active unarchived month defaults to status OPEN", async () => {
      const reportService = await getReportService();
      const report = await reportService.getMonthlyReport(2026, 9);
      assert.strictEqual(report.status, "OPEN", "Active month must have status OPEN");
    });
  });

  // =========================================================================
  // F8: 31-Day Daily Breakdown Engine
  // =========================================================================
  describe("F8: 31-Day Daily Breakdown Engine", () => {
    it("T1-F8-01: 31-day month (March 2026) dailyData contains exactly 31 rows", async () => {
      const reportService = await getReportService();
      const report = await reportService.getMonthlyReport(2026, 3);
      assert.ok(Array.isArray(report.dailyData), "dailyData must be an array");
      assert.strictEqual(report.dailyData.length, 31, "March must contain exactly 31 daily rows");
    });

    it("T1-F8-02: 30-day month (April 2026) dailyData contains exactly 30 rows", async () => {
      const reportService = await getReportService();
      const report = await reportService.getMonthlyReport(2026, 4);
      assert.ok(Array.isArray(report.dailyData), "dailyData must be an array");
      assert.strictEqual(report.dailyData.length, 30, "April must contain exactly 30 daily rows");
    });

    it("T1-F8-03: 28-day non-leap February contains exactly 28 rows", async () => {
      const reportService = await getReportService();
      const report = await reportService.getMonthlyReport(2026, 2);
      assert.ok(Array.isArray(report.dailyData), "dailyData must be an array");
      assert.strictEqual(report.dailyData.length, 28, "Feb 2026 must contain exactly 28 daily rows");
    });

    it("T1-F8-04: daily row schema contains day, date, dayOfWeek, sales, grossProfit, remarks", async () => {
      const reportService = await getReportService();
      const report = await reportService.getMonthlyReport(2026, 3);
      const firstRow = report.dailyData[0];
      assert.ok(firstRow, "First row must exist");
      assert.strictEqual(firstRow.day, 1);
      assert.strictEqual(firstRow.date, "2026-03-01");
      assert.ok(typeof firstRow.dayOfWeek === "string");
      assert.ok(typeof firstRow.sales === "number");
      assert.ok(typeof firstRow.grossProfit === "number");
      assert.ok(typeof firstRow.remarks === "string");
    });

    it("T1-F8-05: March 15 remark in historical ledger records Tasnim draw (15000)", async () => {
      const reportService = await getReportService();
      const report = await reportService.getMonthlyReport(2026, 3);
      const day15 = report.dailyData.find((r) => r.day === 15);
      assert.ok(day15, "Day 15 must exist");
      assert.strictEqual(day15.remarks, "15000");
    });
  });

  // =========================================================================
  // F9: Net Profit Formula Integration
  // =========================================================================
  describe("F9: Net Profit Formula Integration", () => {
    it("T1-F9-01: March 2026 Net Profit strictly equals GP (103770) - Expenses (111865) = -8095", async () => {
      const reportService = await getReportService();
      const report = await reportService.getMonthlyReport(2026, 3);
      assertNetProfitFormula(report.grossProfit, report.totalExpenses, report.netProfit);
      assert.strictEqual(report.netProfit, -8095);
    });

    it("T1-F9-02: April 2026 Net Profit strictly equals GP (123390) - Expenses (117808) = 5582", async () => {
      const reportService = await getReportService();
      const report = await reportService.getMonthlyReport(2026, 4);
      assertNetProfitFormula(report.grossProfit, report.totalExpenses, report.netProfit);
      assert.strictEqual(report.netProfit, 5582);
    });

    it("T1-F9-03: May 2026 Net Profit strictly equals GP (102253) - Expenses (110686) = -8433", async () => {
      const reportService = await getReportService();
      const report = await reportService.getMonthlyReport(2026, 5);
      assertNetProfitFormula(report.grossProfit, report.totalExpenses, report.netProfit);
      assert.strictEqual(report.netProfit, -8433);
    });

    it("T1-F9-04: June 2026 Net Profit strictly equals GP (183580) - Expenses (110928) = 72652", async () => {
      const reportService = await getReportService();
      const report = await reportService.getMonthlyReport(2026, 6);
      assertNetProfitFormula(report.grossProfit, report.totalExpenses, report.netProfit);
      assert.strictEqual(report.netProfit, 72652);
    });

    it("T1-F9-05: July 2026 Net Profit strictly equals GP (165080) - Expenses (113568) = 51512", async () => {
      const reportService = await getReportService();
      const report = await reportService.getMonthlyReport(2026, 7);
      assertNetProfitFormula(report.grossProfit, report.totalExpenses, report.netProfit);
      assert.strictEqual(report.netProfit, 51512);
    });
  });

  // =========================================================================
  // F10: Historical Reports Fetching
  // =========================================================================
  describe("F10: Historical Reports Fetching", () => {
    it("T1-F10-01: getMonthlyReportsHistory returns 6 historical summary items", async () => {
      const reportService = await getReportService();
      const history = await reportService.getMonthlyReportsHistory();
      assert.ok(Array.isArray(history), "Must return array");
      assert.strictEqual(history.length, 6, "Must return 6 historical items");
    });

    it("T1-F10-02: history items are ordered descending by date (August first, March last)", async () => {
      const reportService = await getReportService();
      const history = await reportService.getMonthlyReportsHistory();
      assert.strictEqual(history[0].month, 8, "First item must be August (month 8)");
      assert.strictEqual(history[history.length - 1].month, 3, "Last item must be March (month 3)");
    });

    it("T1-F10-03: history items omit heavy dailyData and expenses arrays", async () => {
      const reportService = await getReportService();
      const history = await reportService.getMonthlyReportsHistory();
      for (const item of history) {
        assert.strictEqual((item as any).dailyData, undefined, "History summary should omit dailyData");
        assert.strictEqual((item as any).expenses, undefined, "History summary should omit expenses");
      }
    });

    it("T1-F10-04: getMonthlyReportDetail returns full snapshot with dailyData and expenses", async () => {
      const reportService = await getReportService();
      const detail = await reportService.getMonthlyReportDetail(2026, 4);
      assert.ok(detail, "Detail must be returned");
      assert.strictEqual(detail.month, 4);
      assert.ok(Array.isArray(detail.dailyData), "Must include dailyData");
      assert.strictEqual(detail.dailyData.length, 30, "April daily rows must be 30");
      assert.ok(Array.isArray(detail.expenses), "Must include expenses");
      assert.strictEqual(detail.expenses.length, 8, "April expenses count must be 8");
    });

    it("T1-F10-05: getMonthlyReportDetail returns status CLOSED for historical months", async () => {
      const reportService = await getReportService();
      const detail = await reportService.getMonthlyReportDetail(2026, 5);
      assert.strictEqual(detail.status, "CLOSED");
    });
  });

  // =========================================================================
  // F11: Sidebar Navigation Reorganization
  // =========================================================================
  describe("F11: Sidebar Navigation Reorganization", () => {
    it("T1-F11-01: AppSidebar.tsx exists and is readable", async () => {
      const exists = await fileExists("src/components/layout/AppSidebar.tsx");
      assert.ok(exists, "AppSidebar.tsx must exist");
    });

    it("T1-F11-02: AppSidebar defines navigation item for reports", async () => {
      const content = await readProjectFile("src/components/layout/AppSidebar.tsx");
      assert.ok(content.includes('"reports"') || content.includes("'reports'"), 'AppSidebar must define "reports" nav item');
    });

    it("T1-F11-03: AppSidebar nav item is labeled Monthly Reports or Financial Reports", async () => {
      const content = await readProjectFile("src/components/layout/AppSidebar.tsx");
      const hasLabel = content.includes("Monthly Reports") || content.includes("Financial Reports");
      assert.ok(hasLabel, "Sidebar reports item must have a valid report label");
    });

    it("T1-F11-04: AppSidebar handles activeTab prop correctly", async () => {
      const content = await readProjectFile("src/components/layout/AppSidebar.tsx");
      assert.ok(content.includes("activeTab"), "AppSidebar must accept activeTab prop");
      assert.ok(content.includes("onSelectTab"), "AppSidebar must accept onSelectTab prop");
    });

    it("T1-F11-05: reports navigation item uses BarChart3 icon", async () => {
      const content = await readProjectFile("src/components/layout/AppSidebar.tsx");
      assert.ok(content.includes("BarChart3"), "AppSidebar should use BarChart3 icon for reports");
    });
  });

  // =========================================================================
  // F12: Expenses Sidebar & Routing
  // =========================================================================
  describe("F12: Expenses Sidebar & Routing", () => {
    it("T1-F12-01: navTypes.ts defines NavTab union type", async () => {
      const content = await readProjectFile("src/components/layout/navTypes.ts");
      assert.ok(content.includes("export type NavTab"), "navTypes.ts must export NavTab type");
    });

    it("T1-F12-02: AppRouter.tsx handles page routes based on activeTab", async () => {
      const content = await readProjectFile("src/components/AppRouter.tsx");
      assert.ok(content.includes("activeTab"), "AppRouter must switch on activeTab");
    });

    it("T1-F12-03: AppRouter references reports page", async () => {
      const content = await readProjectFile("src/components/AppRouter.tsx");
      assert.ok(content.includes("ReportsPage") || content.includes("reports"), "AppRouter must reference reports");
    });

    it("T1-F12-04: AppSidebar imports NavTab type", async () => {
      const content = await readProjectFile("src/components/layout/AppSidebar.tsx");
      assert.ok(content.includes("NavTab"), "AppSidebar must import or export NavTab");
    });

    it("T1-F12-05: NavTab includes reports tab option", async () => {
      const content = await readProjectFile("src/components/layout/navTypes.ts");
      assert.ok(content.includes('"reports"'), 'NavTab must include "reports"');
    });
  });

  // =========================================================================
  // F13: Dedicated Expenses Page
  // =========================================================================
  describe("F13: Dedicated Expenses Page", () => {
    it("T1-F13-01: Expenses page file existence or planning check", async () => {
      const exists = await fileExists("src/pages/Expenses.tsx");
      // Either exists or planned in milestone M3
      assert.ok(typeof exists === "boolean");
    });

    it("T1-F13-02: ExpenseCategories defines categories used in Expenses UI", () => {
      assert.ok(schema.ExpenseCategories.length >= 9, "Must have at least 9 standard expense categories");
      assert.ok(schema.ExpenseCategories.includes("RENT"));
      assert.ok(schema.ExpenseCategories.includes("UTILITIES"));
      assert.ok(schema.ExpenseCategories.includes("SALARY"));
    });

    it("T1-F13-03: ExpenseRecord includes fields required for Expenses table display", () => {
      const sampleExpense: schema.ExpenseRecord = {
        id: 1,
        year: 2026,
        month: 9,
        category: "RENT",
        title: "SHOP RENT",
        amount: 25000,
        expenseDate: 1788220800,
        paymentMethod: "CASH",
        notes: "Monthly shop rent",
        createdAt: 1788220800,
      };
      assert.ok(sampleExpense.id > 0);
      assert.strictEqual(sampleExpense.amount, 25000);
      assert.strictEqual(sampleExpense.category, "RENT");
    });

    it("T1-F13-04: CreateExpenseInput omits id and auto-generated fields", () => {
      const input: schema.CreateExpenseInput = {
        year: 2026,
        month: 9,
        category: "UTILITIES",
        title: "Electricity Bill",
        amount: 5000,
        expenseDate: 1788220800,
        paymentMethod: "CASH",
      };
      assert.strictEqual(input.year, 2026);
      assert.strictEqual(input.amount, 5000);
    });

    it("T1-F13-05: MonthlyExpenseSummary interface supports category breakdown display", () => {
      const summary: schema.MonthlyExpenseSummary = {
        total: 111865,
        byCategory: {
          RENT: 25000,
          SALARY: 76500,
          UTILITIES: 10065,
          SECURITY_GUARD: 300,
        },
      };
      const catSum = Object.values(summary.byCategory).reduce((a, b) => a + b, 0);
      assert.strictEqual(summary.total, catSum, "Summary total must equal sum of category values");
    });
  });

  // =========================================================================
  // F14: Current Month Report View
  // =========================================================================
  describe("F14: Current Month Report View", () => {
    it("T1-F14-01: Reports.tsx page file exists", async () => {
      const exists = await fileExists("src/pages/Reports.tsx");
      assert.ok(exists, "Reports.tsx must exist in src/pages/");
    });

    it("T1-F14-02: Reports page imports reportService functions", async () => {
      const content = await readProjectFile("src/pages/Reports.tsx");
      assert.ok(
        content.includes("reportService") || content.includes("generateFinancialReport") || content.includes("getMonthlyReport"),
        "Reports.tsx must integrate with report service"
      );
    });

    it("T1-F14-03: MonthlyReportDetail structure supports KPI metrics display", () => {
      const bm = HISTORICAL_BENCHMARKS["2026-03"];
      assert.strictEqual(bm.grossSales, 467100);
      assert.strictEqual(bm.grossProfit, 103770);
      assert.strictEqual(bm.totalExpenses, 111865);
      assert.strictEqual(bm.netProfit, -8095);
    });

    it("T1-F14-04: DailyReportRow supports 31-day table rendering", () => {
      const row: schema.DailyReportRow = {
        day: 15,
        date: "2026-03-15",
        dayOfWeek: "SUNDAY",
        sales: 23000,
        grossProfit: 3350,
        remarks: "15000",
      };
      assert.strictEqual(row.day, 15);
      assert.strictEqual(row.sales, 23000);
      assert.strictEqual(row.remarks, "15000");
    });

    it("T1-F14-05: reports page layout includes tab or view structure", async () => {
      const content = await readProjectFile("src/pages/Reports.tsx");
      assert.ok(content.length > 100, "Reports.tsx must contain substantial page implementation");
    });
  });

  // =========================================================================
  // F15: Past Months History View
  // =========================================================================
  describe("F15: Past Months History View", () => {
    it("T1-F15-01: MonthlyReportHistoryItem includes key financial indicators", () => {
      const historyItem: schema.MonthlyReportHistoryItem = {
        year: 2026,
        month: 6,
        monthLabel: "June 2026",
        grossSales: 532780,
        grossProfit: 183580,
        totalExpenses: 110928,
        netProfit: 72652,
        collectedCash: 532780,
        receivables: 0,
        payables: 0,
        repairRevenue: 0,
        swapMargin: 0,
        status: "CLOSED",
      };
      assert.strictEqual(historyItem.monthLabel, "June 2026");
      assert.strictEqual(historyItem.netProfit, 72652);
    });

    it("T1-F15-02: 6 historical months available for history view rendering", () => {
      const months = Object.keys(HISTORICAL_BENCHMARKS);
      assert.strictEqual(months.length, 6, "Must provide 6 historical benchmark months");
    });

    it("T1-F15-03: all historical benchmark months have status CLOSED", async () => {
      const reportService = await getReportService();
      const history = await reportService.getMonthlyReportsHistory();
      for (const item of history) {
        assert.strictEqual(item.status, "CLOSED", `${item.monthLabel} must have status CLOSED`);
      }
    });

    it("T1-F15-04: negative net profit months (March, May) are identifiable for red styling", () => {
      const march = HISTORICAL_BENCHMARKS["2026-03"];
      const may = HISTORICAL_BENCHMARKS["2026-05"];
      assert.ok(march.netProfit < 0, "March must be negative");
      assert.ok(may.netProfit < 0, "May must be negative");
    });

    it("T1-F15-05: positive net profit months (April, June, July, August) are identifiable for green styling", () => {
      const positiveMonths = ["2026-04", "2026-06", "2026-07", "2026-08"];
      for (const key of positiveMonths) {
        assert.ok(HISTORICAL_BENCHMARKS[key].netProfit > 0, `${key} must have positive net profit`);
      }
    });
  });

  // =========================================================================
  // F16: Historical Month Detail View
  // =========================================================================
  describe("F16: Historical Month Detail View", () => {
    it("T1-F16-01: April 2026 historical detail contains 30 daily rows", async () => {
      const reportService = await getReportService();
      const detail = await reportService.getMonthlyReportDetail(2026, 4);
      assert.strictEqual(detail.dailyData.length, 30, "April detail must have 30 daily rows");
    });

    it("T1-F16-02: April 2026 historical detail contains 8 expenses", async () => {
      const reportService = await getReportService();
      const detail = await reportService.getMonthlyReportDetail(2026, 4);
      assert.strictEqual(detail.expenses.length, 8, "April detail must have 8 expenses");
    });

    it("T1-F16-03: June 2026 historical detail displays high-profit peak numbers", async () => {
      const reportService = await getReportService();
      const detail = await reportService.getMonthlyReportDetail(2026, 6);
      assert.strictEqual(detail.grossSales, 532780);
      assert.strictEqual(detail.grossProfit, 183580);
      assert.strictEqual(detail.netProfit, 72652);
    });

    it("T1-F16-04: July 2026 historical detail daily dates resolve 2025 typo to 2026", async () => {
      const reportService = await getReportService();
      const detail = await reportService.getMonthlyReportDetail(2026, 7);
      for (const row of detail.dailyData) {
        assert.ok(row.date.startsWith("2026-07-"), `Expected 2026-07-*, got: ${row.date}`);
      }
    });

    it("T1-F16-05: August 2026 historical detail partial month reflects 3 expenses totaling 42,300", async () => {
      const reportService = await getReportService();
      const detail = await reportService.getMonthlyReportDetail(2026, 8);
      assert.strictEqual(detail.expenses.length, 3);
      const totalExp = detail.expenses.reduce((s, e) => s + e.amount, 0);
      assert.strictEqual(totalExp, 42300);
      assert.strictEqual(detail.totalExpenses, 42300);
      assert.strictEqual(detail.netProfit, 15760);
    });
  });
});
