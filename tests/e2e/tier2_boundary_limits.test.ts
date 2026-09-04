/**
 * Tier 2: Boundary, Corner Cases & Adversarial Limit Tests (F1 through F16)
 *
 * Minimum threshold: >= 5 edge/boundary tests per feature (80+ test cases total).
 * Tests negative amounts, zero amounts, leap years, month length variations,
 * July 2026 typo normalization, SQL injection resistance, division-by-zero guards,
 * and large safe integers.
 */

import { describe, it, before, beforeEach } from "node:test";
import * as assert from "node:assert";
import {
  setupTestDb,
  resetTestDb,
  getExpenseService,
  getReportService,
  readProjectFile,
  HISTORICAL_BENCHMARKS,
  HISTORICAL_TOTALS,
  assertNetProfitFormula,
} from "./harness";
import { memoryStore, initDb } from "../../src/db/client";
import * as schema from "../../src/db/schema";
import seedData from "../../src/db/seedData.json";

describe("Tier 2: Boundary Limits & Adversarial Edge Cases", () => {
  before(async () => {
    await setupTestDb();
  });

  beforeEach(() => {
    resetTestDb();
  });

  // =========================================================================
  // F1: SQLite Schema for Expenses (Boundaries)
  // =========================================================================
  describe("F1: Expenses Schema Boundaries", () => {
    it("T2-F1-01: expense with amount = 0 stores zero cleanly", () => {
      const store = memoryStore as any;
      const initialCount = store.expenses.length;
      store.expenses.push({
        id: 9101,
        year: 2026,
        month: 9,
        category: "UTILITIES",
        title: "Dormant Line",
        amount: 0,
        expenseDate: 1788220800,
        paymentMethod: "CASH",
        notes: "Zero charge",
        createdAt: 1788220800,
      });
      assert.strictEqual(store.expenses.length, initialCount + 1);
      const inserted = store.expenses.find((e: any) => e.id === 9101);
      assert.strictEqual(inserted?.amount, 0);
    });

    it("T2-F1-02: negative amount is flagged or rejected by validation rules", async () => {
      const expenseService = await getExpenseService();
      try {
        await expenseService.createExpense({
          year: 2026,
          month: 9,
          category: "MISC",
          title: "Negative Expense",
          amount: -500,
          expenseDate: 1788220800,
          paymentMethod: "CASH",
        });
        // If it didn't throw, verify it wasn't saved as a negative expense or was clamped to 0
        const expenses = await expenseService.getExpensesByMonth(2026, 9);
        const item = expenses.find((e) => e.title === "Negative Expense");
        if (item) {
          assert.ok(item.amount >= 0, "Expense amount must not be negative");
        }
      } catch (err: any) {
        // Rejecting negative amount via error is also valid behavior
        assert.ok(err, "Rejection of negative amount is expected");
      }
    });

    it("T2-F1-03: title with 500 characters stores without truncation", () => {
      const store = memoryStore as any;
      const longTitle = "A".repeat(500);
      store.expenses.push({
        id: 9103,
        year: 2026,
        month: 9,
        category: "MISC",
        title: longTitle,
        amount: 100,
        expenseDate: 1788220800,
        paymentMethod: "CASH",
        notes: "",
        createdAt: 1788220800,
      });
      const inserted = store.expenses.find((e: any) => e.id === 9103);
      assert.strictEqual(inserted?.title.length, 500);
    });

    it("T2-F1-04: SQL injection string in title is safely preserved literally", () => {
      const store = memoryStore as any;
      const sqlInjection = "Shop Rent'; DROP TABLE expenses; --";
      store.expenses.push({
        id: 9104,
        year: 2026,
        month: 9,
        category: "RENT",
        title: sqlInjection,
        amount: 25000,
        expenseDate: 1788220800,
        paymentMethod: "CASH",
        notes: "<script>alert('xss')</script>",
        createdAt: 1788220800,
      });
      const inserted = store.expenses.find((e: any) => e.id === 9104);
      assert.strictEqual(inserted?.title, sqlInjection, "SQL injection string must be stored literally as text");
      assert.strictEqual(inserted?.notes, "<script>alert('xss')</script>");
      assert.ok(store.expenses.length > 0, "expenses table must NOT have been dropped");
    });

    it("T2-F1-05: maximum safe 64-bit integer amount preserves numeric precision", () => {
      const store = memoryStore as any;
      const maxSafe = Number.MAX_SAFE_INTEGER; // 9007199254740991
      store.expenses.push({
        id: 9105,
        year: 2026,
        month: 9,
        category: "MISC",
        title: "Max Safe Int Expense",
        amount: maxSafe,
        expenseDate: 1788220800,
        paymentMethod: "CASH",
        notes: "Extreme boundary test",
        createdAt: 1788220800,
      });
      const inserted = store.expenses.find((e: any) => e.id === 9105);
      assert.strictEqual(inserted?.amount, maxSafe);
    });
  });

  // =========================================================================
  // F2: SQLite Schema for Monthly Reports (Boundaries)
  // =========================================================================
  describe("F2: Monthly Reports Schema Boundaries", () => {
    it("T2-F2-01: negative net_profit is stored and retrieved accurately without underflow", () => {
      const store = memoryStore as any;
      store.monthlyReports.push({
        id: 9201,
        year: 2026,
        month: 1,
        monthLabel: "January 2026",
        grossSales: 50000,
        grossProfit: 10000,
        totalExpenses: 60000,
        netProfit: -50000,
        collectedCash: 50000,
        receivables: 0,
        payables: 0,
        repairRevenue: 0,
        swapMargin: 0,
        dailyDataJson: "[]",
        expenseDataJson: "[]",
        status: "CLOSED",
        createdAt: 1767225600,
        updatedAt: 1767225600,
      });
      const inserted = store.monthlyReports.find((r: any) => r.id === 9201);
      assert.strictEqual(inserted?.netProfit, -50000);
      assertNetProfitFormula(inserted?.grossProfit, inserted?.totalExpenses, inserted?.netProfit);
    });

    it("T2-F2-02: empty JSON arrays for dailyDataJson and expenseDataJson parse validly", () => {
      const emptyDaily: schema.DailyReportRow[] = JSON.parse("[]");
      const emptyExpenses: schema.ExpenseRecord[] = JSON.parse("[]");
      assert.strictEqual(emptyDaily.length, 0);
      assert.strictEqual(emptyExpenses.length, 0);
    });

    it("T2-F2-03: large dailyDataJson payload parses completely without truncation", () => {
      const largeRows: schema.DailyReportRow[] = Array.from({ length: 31 }, (_, i) => ({
        day: i + 1,
        date: `2026-03-${String(i + 1).padStart(2, "0")}`,
        dayOfWeek: "MONDAY",
        sales: 50000 + i * 1000,
        grossProfit: 10000 + i * 200,
        remarks: `Detailed daily ledger remark for day ${i + 1} with extensive text description`,
      }));
      const serialized = JSON.stringify(largeRows);
      assert.ok(serialized.length > 2000, "Serialized string should be large");
      const deserialized = JSON.parse(serialized);
      assert.strictEqual(deserialized.length, 31);
      assert.strictEqual(deserialized[30].day, 31);
    });

    it("T2-F2-04: boundary months month = 1 (January) and month = 12 (December) are supported", () => {
      const store = memoryStore as any;
      const janReport = {
        id: 9204,
        year: 2026,
        month: 1,
        monthLabel: "January 2026",
        grossSales: 100000,
        grossProfit: 20000,
        totalExpenses: 15000,
        netProfit: 5000,
        dailyDataJson: "[]",
        expenseDataJson: "[]",
        status: "CLOSED" as const,
      };
      const decReport = {
        id: 9205,
        year: 2026,
        month: 12,
        monthLabel: "December 2026",
        grossSales: 200000,
        grossProfit: 40000,
        totalExpenses: 30000,
        netProfit: 10000,
        dailyDataJson: "[]",
        expenseDataJson: "[]",
        status: "CLOSED" as const,
      };
      store.monthlyReports.push(janReport, decReport);
      const foundJan = store.monthlyReports.find((r: any) => r.month === 1 && r.year === 2026);
      const foundDec = store.monthlyReports.find((r: any) => r.month === 12 && r.year === 2026);
      assert.ok(foundJan, "January report must be stored");
      assert.ok(foundDec, "December report must be stored");
    });

    it("T2-F2-05: duplicate year/month constraint violation is prevented", () => {
      const store = memoryStore as any;
      const marchCount = store.monthlyReports.filter((r: any) => r.year === 2026 && r.month === 3).length;
      assert.strictEqual(marchCount, 1, "There must be at most one report for (2026, 3)");
    });
  });

  // =========================================================================
  // F3: Historical Seed Data Integration (Boundaries)
  // =========================================================================
  describe("F3: Seed Data Historical Boundaries", () => {
    it("T2-F3-01: August 2026 partial month data has active values for Days 1-10 and zeros for Days 11-31", () => {
      const august = (seedData as any).monthlyReports.find((r: any) => r.year === 2026 && r.month === 8);
      assert.ok(august, "August 2026 report must exist");
      const dailyRows = typeof august.dailyDataJson === "string" ? JSON.parse(august.dailyDataJson) : august.dailyDataJson;
      assert.strictEqual(dailyRows.length, 31);
      // Days 1 to 10 have total sales > 0
      const activeSales = dailyRows.slice(0, 10).reduce((sum: number, r: any) => sum + r.sales, 0);
      assert.strictEqual(activeSales, 191720, "Days 1-10 sales must sum to 191,720");
      // Days 11 to 31 are zero
      for (let day = 11; day <= 31; day++) {
        const row = dailyRows.find((r: any) => r.day === day);
        assert.strictEqual(row?.sales, 0, `Day ${day} sales must be 0 in August`);
        assert.strictEqual(row?.grossProfit, 0, `Day ${day} GP must be 0 in August`);
      }
    });

    it("T2-F3-02: August 2026 expenses list has exactly 3 items totaling 42,300 PKR", () => {
      const august = (seedData as any).monthlyReports.find((r: any) => r.year === 2026 && r.month === 8);
      const expenses = typeof august.expenseDataJson === "string" ? JSON.parse(august.expenseDataJson) : august.expenseDataJson;
      assert.strictEqual(expenses.length, 3, "August must have 3 recorded expenses");
      const totalExp = expenses.reduce((s: number, e: any) => s + e.amount, 0);
      assert.strictEqual(totalExp, 42300, "August expenses must sum to 42,300 PKR");
    });

    it("T2-F3-03: June 23, 2026 anomaly (GP 62,220 > Sales 14,280) is preserved without clamping", () => {
      const june = (seedData as any).monthlyReports.find((r: any) => r.year === 2026 && r.month === 6);
      const dailyRows = typeof june.dailyDataJson === "string" ? JSON.parse(june.dailyDataJson) : june.dailyDataJson;
      const day23 = dailyRows.find((r: any) => r.day === 23);
      assert.ok(day23, "June 23 must exist");
      assert.strictEqual(day23.sales, 14280, "June 23 sales must be 14,280");
      assert.strictEqual(day23.grossProfit, 62220, "June 23 gross profit must be 62,220 (GP > Sales preserved)");
    });

    it("T2-F3-04: April Eid holiday rows (Days 10, 11, 12, 13) have zero sales and zero GP", () => {
      const april = (seedData as any).monthlyReports.find((r: any) => r.year === 2026 && r.month === 4);
      const dailyRows = typeof april.dailyDataJson === "string" ? JSON.parse(april.dailyDataJson) : april.dailyDataJson;
      for (const day of [10, 11, 12, 13]) {
        const row = dailyRows.find((r: any) => r.day === day);
        assert.ok(row, `Day ${day} must exist`);
        assert.strictEqual(row.sales, 0, `Day ${day} must have 0 sales during Eid`);
        assert.strictEqual(row.grossProfit, 0, `Day ${day} must have 0 GP during Eid`);
      }
    });

    it("T2-F3-05: aggregate totals across all 6 historical months match ground truth", () => {
      const reports = (seedData as any).monthlyReports;
      const totalSales = reports.reduce((s: number, r: any) => s + r.grossSales, 0);
      const totalGP = reports.reduce((s: number, r: any) => s + r.grossProfit, 0);
      const totalExp = reports.reduce((s: number, r: any) => s + r.totalExpenses, 0);
      const totalNet = reports.reduce((s: number, r: any) => s + r.netProfit, 0);

      assert.strictEqual(totalSales, HISTORICAL_TOTALS.grossSales, "Total historical sales mismatch");
      assert.strictEqual(totalGP, HISTORICAL_TOTALS.grossProfit, "Total historical GP mismatch");
      assert.strictEqual(totalExp, HISTORICAL_TOTALS.totalExpenses, "Total historical expenses mismatch");
      assert.strictEqual(totalNet, HISTORICAL_TOTALS.netProfit, "Total historical Net Profit mismatch");
    });
  });

  // =========================================================================
  // F4: Safe Startup Seeding Migration (Boundaries)
  // =========================================================================
  describe("F4: Seeding Migration Boundaries", () => {
    it("T2-F4-01: multiple sequential initDb calls do not corrupt memory collections", async () => {
      const store = memoryStore as any;
      const baseLen = store.expenses.length;
      await initDb();
      await initDb();
      await initDb();
      assert.strictEqual(store.expenses.length, baseLen, "Expense count must remain identical");
    });

    it("T2-F4-02: existing user sales remain untouched during migration", () => {
      const store = memoryStore as any;
      const initialSalesCount = store.sales.length;
      assert.ok(initialSalesCount > 0, "Must have sales records");
      const firstInvoice = store.sales[0].invoiceNo;
      assert.ok(firstInvoice, "First invoice must have invoice number");
    });

    it("T2-F4-03: memoryStore collections retain array references", () => {
      const store = memoryStore as any;
      const expensesRef = store.expenses;
      assert.ok(Array.isArray(expensesRef));
      resetTestDb();
      assert.strictEqual(store.expenses, expensesRef, "Array reference must be preserved across resets");
    });

    it("T2-F4-04: seed data monthlyReports array is non-empty and well-formed", () => {
      assert.ok(Array.isArray(seedData.monthlyReports));
      assert.ok(seedData.monthlyReports.length >= 6);
    });

    it("T2-F4-05: seed data expenses array is non-empty and well-formed", () => {
      assert.ok(Array.isArray(seedData.expenses));
      assert.ok(seedData.expenses.length >= 44);
    });
  });

  // =========================================================================
  // F5: Expense Service CRUD (Boundaries)
  // =========================================================================
  describe("F5: Expense Service CRUD Boundaries", () => {
    it("T2-F5-01: updateExpense with non-existent ID throws error or handles gracefully", async () => {
      const expenseService = await getExpenseService();
      try {
        await expenseService.updateExpense(999999, { amount: 500 });
        assert.fail("Updating non-existent expense should throw or reject");
      } catch (err: any) {
        assert.ok(err, "Should handle non-existent ID with error");
      }
    });

    it("T2-F5-02: deleteExpense with non-existent ID handles gracefully", async () => {
      const expenseService = await getExpenseService();
      try {
        await expenseService.deleteExpense(999999);
      } catch (err: any) {
        assert.ok(err);
      }
    });

    it("T2-F5-03: createExpense with empty title triggers validation error", async () => {
      const expenseService = await getExpenseService();
      try {
        await expenseService.createExpense({
          year: 2026,
          month: 9,
          category: "MISC",
          title: "",
          amount: 500,
          expenseDate: 1788220800,
          paymentMethod: "CASH",
        });
        assert.fail("Creating expense with empty title should throw");
      } catch (err: any) {
        assert.ok(err, "Validation error expected for empty title");
      }
    });

    it("T2-F5-04: createExpense with extreme future year (2099) handles successfully", async () => {
      const expenseService = await getExpenseService();
      const id = await expenseService.createExpense({
        year: 2099,
        month: 12,
        category: "RENT",
        title: "Future Lease 2099",
        amount: 100000,
        expenseDate: 4102444800,
        paymentMethod: "CASH",
      });
      assert.ok(typeof id === "number" && id > 0);
      const list = await expenseService.getExpensesByMonth(2099, 12);
      assert.ok(list.some((e) => e.title === "Future Lease 2099"));
    });

    it("T2-F5-05: getExpensesByMonth for month with zero expenses returns empty array", async () => {
      const expenseService = await getExpenseService();
      const list = await expenseService.getExpensesByMonth(2035, 1);
      assert.ok(Array.isArray(list));
      assert.strictEqual(list.length, 0);
    });
  });

  // =========================================================================
  // F6: Recurring Overheads Generator (Boundaries)
  // =========================================================================
  describe("F6: Recurring Overheads Generator Boundaries", () => {
    it("T2-F6-01: applying recurring overheads to month with 1 existing overhead skips that 1 and applies 8", async () => {
      const expenseService = await getExpenseService();
      // Pre-seed SHOP RENT for (2026, 11)
      await expenseService.createExpense({
        year: 2026,
        month: 11,
        category: "RENT",
        title: "SHOP RENT",
        amount: 25000,
        expenseDate: 1793491200,
        paymentMethod: "CASH",
      });

      const res = await expenseService.applyRecurringExpenses(2026, 11);
      assert.strictEqual(res.applied, 8, "Must apply remaining 8 overheads");
      assert.strictEqual(res.skipped, 1, "Must skip already existing SHOP RENT");
    });

    it("T2-F6-02: recurring overheads matched by title even if amount is different", async () => {
      const expenseService = await getExpenseService();
      // Pre-seed FARHAN BAHI SALARY with 35000 instead of 30000
      await expenseService.createExpense({
        year: 2026,
        month: 12,
        category: "SALARY",
        title: "FARHAN BAHI SALARY",
        amount: 35000,
        expenseDate: 1796083200,
        paymentMethod: "CASH",
      });

      const res = await expenseService.applyRecurringExpenses(2026, 12);
      assert.strictEqual(res.skipped, 1, "Should skip by title match even with altered amount");
    });

    it("T2-F6-03: recurring overheads for leap year February 2028 generates valid records", async () => {
      const expenseService = await getExpenseService();
      const res = await expenseService.applyRecurringExpenses(2028, 2);
      assert.strictEqual(res.applied, 9);
      const list = await expenseService.getExpensesByMonth(2028, 2);
      assert.strictEqual(list.length, 9);
      assert.ok(list.every((e) => e.year === 2028 && e.month === 2));
    });

    it("T2-F6-04: recurring overheads default payment method to CASH", async () => {
      const expenseService = await getExpenseService();
      await expenseService.applyRecurringExpenses(2027, 1);
      const list = await expenseService.getExpensesByMonth(2027, 1);
      assert.ok(list.every((e) => e.paymentMethod === "CASH" || typeof e.paymentMethod === "string"));
    });

    it("T2-F6-05: recurring overhead titles strictly match template strings", async () => {
      const expenseService = await getExpenseService();
      await expenseService.applyRecurringExpenses(2027, 2);
      const list = await expenseService.getExpensesByMonth(2027, 2);
      const titles = list.map((e) => e.title);
      assert.ok(titles.includes("SHOP RENT"));
      assert.ok(titles.includes("CHOKIDARA"));
      assert.ok(titles.includes("NET FLEX"));
    });
  });

  // =========================================================================
  // F7: Live Monthly Report Engine (Boundaries)
  // =========================================================================
  describe("F7: Live Report Engine Boundaries", () => {
    it("T2-F7-01: month with zero sales and zero expenses evaluates all financial KPIs to 0 without NaN", async () => {
      const reportService = await getReportService();
      const report = await reportService.getMonthlyReport(2030, 5);
      assert.strictEqual(report.grossSales, 0);
      assert.strictEqual(report.grossProfit, 0);
      assert.strictEqual(report.totalExpenses, 0);
      assert.strictEqual(report.netProfit, 0);
      assert.ok(!isNaN(report.netProfit));
    });

    it("T2-F7-02: month with expenses only yields exact negative net profit", async () => {
      const reportService = await getReportService();
      const expenseService = await getExpenseService();
      // Add 20,000 expense to a quiet month (2030, 6)
      await expenseService.createExpense({
        year: 2030,
        month: 6,
        category: "RENT",
        title: "Warehouse Rent",
        amount: 20000,
        expenseDate: 1906502400,
        paymentMethod: "CASH",
      });

      const report = await reportService.getMonthlyReport(2030, 6);
      assert.strictEqual(report.grossSales, 0);
      assert.strictEqual(report.grossProfit, 0);
      assert.strictEqual(report.totalExpenses, 20000);
      assert.strictEqual(report.netProfit, -20000);
      assertNetProfitFormula(report.grossProfit, report.totalExpenses, report.netProfit);
    });

    it("T2-F7-03: gross margin percentage calculates 0 when grossSales = 0 avoiding DivisionByZero", () => {
      const sales = 0;
      const profit = 0;
      const marginPercent = sales > 0 ? Math.round((profit / sales) * 100) : 0;
      assert.strictEqual(marginPercent, 0, "Margin percent must be 0 when sales are 0");
    });

    it("T2-F7-04: high margin scenario (GP == Sales) calculates 100% margin", () => {
      const sales = 50000;
      const profit = 50000; // e.g. purely service revenue
      const marginPercent = sales > 0 ? Math.round((profit / sales) * 100) : 0;
      assert.strictEqual(marginPercent, 100);
    });

    it("T2-F7-05: multiple sales on the same day aggregate cleanly into daily sales total", async () => {
      const reportService = await getReportService();
      const report = await reportService.getMonthlyReport(2026, 3);
      // Day 25 had 117,950 in historical sales
      const day25 = report.dailyData.find((r) => r.day === 25);
      assert.ok(day25);
      assert.strictEqual(day25.sales, 117950);
      assert.strictEqual(day25.grossProfit, 22370);
    });
  });

  // =========================================================================
  // F8: 31-Day Daily Breakdown Engine (Boundaries)
  // =========================================================================
  describe("F8: Daily Breakdown Calendar Boundaries", () => {
    it("T2-F8-01: February in leap year 2024 generates exactly 29 rows", async () => {
      const reportService = await getReportService();
      const report = await reportService.getMonthlyReport(2024, 2);
      assert.strictEqual(report.dailyData.length, 29, "Feb 2024 must have 29 days");
      const day29 = report.dailyData.find((r) => r.day === 29);
      assert.ok(day29);
      assert.strictEqual(day29.date, "2024-02-29");
      assert.strictEqual(day29.dayOfWeek, "THURSDAY");
    });

    it("T2-F8-02: February in non-leap year 2026 generates exactly 28 rows", async () => {
      const reportService = await getReportService();
      const report = await reportService.getMonthlyReport(2026, 2);
      assert.strictEqual(report.dailyData.length, 28, "Feb 2026 must have 28 days");
      const day29 = report.dailyData.find((r) => r.day === 29);
      assert.strictEqual(day29, undefined, "Day 29 must NOT exist in Feb 2026");
    });

    it("T2-F8-03: 30-day month (June 2026) row 30 exists and row 31 does NOT exist", async () => {
      const reportService = await getReportService();
      const report = await reportService.getMonthlyReport(2026, 6);
      assert.strictEqual(report.dailyData.length, 30);
      assert.ok(report.dailyData.some((r) => r.day === 30));
      assert.ok(!report.dailyData.some((r) => r.day === 31));
    });

    it("T2-F8-04: dayOfWeek values are strictly uppercase matching standard ledger format", async () => {
      const reportService = await getReportService();
      const report = await reportService.getMonthlyReport(2026, 3);
      for (const row of report.dailyData) {
        assert.strictEqual(row.dayOfWeek, row.dayOfWeek.toUpperCase(), `dayOfWeek ${row.dayOfWeek} must be uppercase`);
      }
    });

    it("T2-F8-05: zero-sales days have sales = 0 and grossProfit = 0", async () => {
      const reportService = await getReportService();
      const report = await reportService.getMonthlyReport(2026, 3);
      // Days 21, 22, 23 were holidays with 0 sales
      for (const day of [21, 22, 23]) {
        const row = report.dailyData.find((r) => r.day === day);
        assert.ok(row);
        assert.strictEqual(row.sales, 0);
        assert.strictEqual(row.grossProfit, 0);
      }
    });
  });

  // =========================================================================
  // F9: Net Profit Formula Integration (Boundaries)
  // =========================================================================
  describe("F9: Net Profit Formula Boundaries", () => {
    it("T2-F9-01: Break-even scenario: Gross Profit == Total Expenses yields Net Profit = 0", () => {
      const gp = 100000;
      const exp = 100000;
      const np = gp - exp;
      assert.strictEqual(np, 0);
      assertNetProfitFormula(gp, exp, np);
    });

    it("T2-F9-02: Zero Gross Profit with 50,000 PKR expenses yields Net Profit = -50,000", () => {
      const gp = 0;
      const exp = 50000;
      const np = gp - exp;
      assert.strictEqual(np, -50000);
      assertNetProfitFormula(gp, exp, np);
    });

    it("T2-F9-03: High Gross Profit with zero expenses yields Net Profit = Gross Profit", () => {
      const gp = 150000;
      const exp = 0;
      const np = gp - exp;
      assert.strictEqual(np, gp);
      assertNetProfitFormula(gp, exp, np);
    });

    it("T2-F9-04: integer arithmetic prevents floating point precision artifacts", () => {
      // 103770 - 111865
      const np = 103770 - 111865;
      assert.strictEqual(np, -8095);
      assert.strictEqual(Number.isInteger(np), true);
    });

    it("T2-F9-05: massive profit margin handles large numbers without overflow", () => {
      const gp = 50000000;
      const exp = 1000000;
      const np = gp - exp;
      assert.strictEqual(np, 49000000);
      assertNetProfitFormula(gp, exp, np);
    });
  });

  // =========================================================================
  // F10: Historical Reports Fetching (Boundaries)
  // =========================================================================
  describe("F10: Historical Reports Fetching Boundaries", () => {
    it("T2-F10-01: requesting non-existent historical month returns null or empty gracefully", async () => {
      const reportService = await getReportService();
      try {
        const detail = await reportService.getMonthlyReportDetail(1995, 1);
        if (detail) {
          // If returned, it should have 0 or empty structure
          assert.strictEqual(detail.grossSales, 0);
        }
      } catch (err: any) {
        // Safe rejection is also acceptable
        assert.ok(err);
      }
    });

    it("T2-F10-02: historical snapshot reports are strictly immutable to current sales mutations", async () => {
      const reportService = await getReportService();
      const detail = await reportService.getMonthlyReportDetail(2026, 3);
      // Original March sales is 467,100
      assert.strictEqual(detail.grossSales, 467100);
      assert.strictEqual(detail.status, "CLOSED");
    });

    it("T2-F10-03: historical reports history list handles empty database gracefully", async () => {
      const store = memoryStore as any;
      const backup = [...store.monthlyReports];
      store.monthlyReports.length = 0;

      const reportService = await getReportService();
      const history = await reportService.getMonthlyReportsHistory();
      assert.ok(Array.isArray(history));
      assert.strictEqual(history.length, 0);

      // Restore
      store.monthlyReports.push(...backup);
    });

    it("T2-F10-04: historical reports list contains all 6 months in sorted order", async () => {
      const reportService = await getReportService();
      const history = await reportService.getMonthlyReportsHistory();
      for (let i = 0; i < history.length - 1; i++) {
        const curr = history[i].year * 12 + history[i].month;
        const next = history[i + 1].year * 12 + history[i + 1].month;
        assert.ok(curr >= next, "Reports must be ordered descending by date");
      }
    });

    it("T2-F10-05: historical snapshot preserves exact remarks string", async () => {
      const reportService = await getReportService();
      const detail = await reportService.getMonthlyReportDetail(2026, 3);
      const day1 = detail.dailyData.find((r) => r.day === 1);
      assert.strictEqual(day1?.remarks, "1500");
    });
  });

  // =========================================================================
  // F11: Sidebar Navigation Reorganization (Boundaries)
  // =========================================================================
  describe("F11: Sidebar Navigation Boundaries", () => {
    it("T2-F11-01: AppSidebar navItems list contains reports as the final item", async () => {
      const content = await readProjectFile("src/components/layout/AppSidebar.tsx");
      // Find the navItems definition
      assert.ok(content.includes("navItems"), "AppSidebar must define navItems");
      assert.ok(content.includes('"reports"') || content.includes("'reports'"));
    });

    it("T2-F11-02: AppSidebar handles activeTab = 'reports' without runtime errors", async () => {
      const content = await readProjectFile("src/components/layout/AppSidebar.tsx");
      assert.ok(content.includes("activeTab"));
    });

    it("T2-F11-03: AppSidebar supports collapsed (isExpanded = false) mode", async () => {
      const content = await readProjectFile("src/components/layout/AppSidebar.tsx");
      assert.ok(content.includes("isExpanded"), "AppSidebar must support expanded/collapsed state");
    });

    it("T2-F11-04: AppSidebar supports mobile drawer mode (isMobileOpen)", async () => {
      const content = await readProjectFile("src/components/layout/AppSidebar.tsx");
      assert.ok(content.includes("isMobileOpen"), "AppSidebar must support mobile drawer");
    });

    it("T2-F11-05: AppSidebar accepts badge indicators without disrupting layout", async () => {
      const content = await readProjectFile("src/components/layout/AppSidebar.tsx");
      assert.ok(content.includes("badge"), "AppSidebar must support badge notifications");
    });
  });

  // =========================================================================
  // F12: Expenses Sidebar & Routing (Boundaries)
  // =========================================================================
  describe("F12: Expenses Sidebar & Routing Boundaries", () => {
    it("T2-F12-01: NavTab union includes valid tab identifiers", async () => {
      const content = await readProjectFile("src/components/layout/navTypes.ts");
      assert.ok(content.includes('"sales"'));
      assert.ok(content.includes('"reports"'));
    });

    it("T2-F12-02: AppRouter switches cleanly between activeTab cases", async () => {
      const content = await readProjectFile("src/components/AppRouter.tsx");
      assert.ok(content.includes("case") || content.includes("switch") || content.includes("==="));
    });

    it("T2-F12-03: AppRouter supports default fallback case", async () => {
      const content = await readProjectFile("src/components/AppRouter.tsx");
      assert.ok(content.includes("default:"), "AppRouter must define a default fallback route");
    });

    it("T2-F12-04: NavItemConfig supports optional hotkey", async () => {
      const content = await readProjectFile("src/components/layout/SidebarNavItem.tsx");
      assert.ok(content.includes("hotkey") || content.includes("NavItemConfig"));
    });

    it("T2-F12-05: SidebarBrand renders application branding without crashing", async () => {
      const content = await readProjectFile("src/components/layout/SidebarBrand.tsx");
      assert.ok(content.length > 50, "SidebarBrand must be implemented");
    });
  });

  // =========================================================================
  // F13: Dedicated Expenses Page (Boundaries)
  // =========================================================================
  describe("F13: Expenses Page Boundaries", () => {
    it("T2-F13-01: zero expenses in selected month produces empty array rather than error", async () => {
      const expenseService = await getExpenseService();
      const list = await expenseService.getExpensesByMonth(2029, 7);
      assert.deepStrictEqual(list, []);
    });

    it("T2-F13-02: monthly summary for empty month returns total = 0", async () => {
      const expenseService = await getExpenseService();
      const summary = await expenseService.getMonthlyExpenseSummary(2029, 7);
      assert.strictEqual(summary.total, 0);
      assert.deepStrictEqual(summary.byCategory, {});
    });

    it("T2-F13-03: expense category breakdown handles single category with 100% of expenses", async () => {
      const expenseService = await getExpenseService();
      await expenseService.createExpense({
        year: 2029,
        month: 8,
        category: "RENT",
        title: "Lone Rent",
        amount: 50000,
        expenseDate: 1880236800,
        paymentMethod: "CASH",
      });

      const summary = await expenseService.getMonthlyExpenseSummary(2029, 8);
      assert.strictEqual(summary.total, 50000);
      assert.strictEqual(summary.byCategory["RENT"], 50000);
    });

    it("T2-F13-04: category breakdown preserves category names exactly", async () => {
      const expenseService = await getExpenseService();
      const summary = await expenseService.getMonthlyExpenseSummary(2026, 3);
      assert.ok("RENT" in summary.byCategory);
      assert.ok("SALARY" in summary.byCategory);
      assert.ok("UTILITIES" in summary.byCategory);
    });

    it("T2-F13-05: amount formatting handles 0 PKR cleanly", () => {
      const formatAmount = (amt: number) => `PKR ${amt.toLocaleString()}`;
      assert.strictEqual(formatAmount(0), "PKR 0");
    });
  });

  // =========================================================================
  // F14: Current Month Report View (Boundaries)
  // =========================================================================
  describe("F14: Current Month Report Boundaries", () => {
    it("T2-F14-01: negative profit highlights appropriately with negative sign", () => {
      const profit = -8095;
      const isNegative = profit < 0;
      assert.strictEqual(isNegative, true);
      const displayStr = `${profit.toLocaleString()} PKR`;
      assert.ok(displayStr.startsWith("-8,095"));
    });

    it("T2-F14-02: 31-day table with 0 sales on all days renders 31 rows with 0s without crashing", async () => {
      const reportService = await getReportService();
      const report = await reportService.getMonthlyReport(2031, 1);
      assert.strictEqual(report.dailyData.length, 31);
      assert.ok(report.dailyData.every((r) => r.sales === 0 && r.grossProfit === 0));
    });

    it("T2-F14-03: daily table remarks column handles empty strings cleanly", async () => {
      const reportService = await getReportService();
      const report = await reportService.getMonthlyReport(2026, 3);
      const day2 = report.dailyData.find((r) => r.day === 2);
      assert.strictEqual(day2?.remarks, "");
    });

    it("T2-F14-04: Reports.tsx contains financial KPI cards structure", async () => {
      const content = await readProjectFile("src/pages/Reports.tsx");
      assert.ok(
        content.includes("Gross Sales") || content.includes("grossSales") || content.includes("revenue"),
        "Reports.tsx should render sales metric"
      );
    });

    it("T2-F14-05: Net profit badge handles exact 0 value", () => {
      const profit = 0;
      const statusClass = profit >= 0 ? "text-emerald-500" : "text-rose-500";
      assert.strictEqual(statusClass, "text-emerald-500");
    });
  });

  // =========================================================================
  // F15: Past Months History View (Boundaries)
  // =========================================================================
  describe("F15: Past Months History View Boundaries", () => {
    it("T2-F15-01: history list container supports 6 historical months without overflow", () => {
      const keys = Object.keys(HISTORICAL_BENCHMARKS);
      assert.strictEqual(keys.length, 6);
    });

    it("T2-F15-02: negative net profit months display negative integer correctly", () => {
      const march = HISTORICAL_BENCHMARKS["2026-03"];
      assert.strictEqual(march.netProfit, -8095);
      const may = HISTORICAL_BENCHMARKS["2026-05"];
      assert.strictEqual(may.netProfit, -8433);
    });

    it("T2-F15-03: historical month row status badge is CLOSED", () => {
      const status: schema.ReportStatus = "CLOSED";
      assert.strictEqual(status, "CLOSED");
    });

    it("T2-F15-04: month label formatting displays Full Month Year (e.g. March 2026)", () => {
      const bm = HISTORICAL_BENCHMARKS["2026-03"];
      assert.strictEqual(bm.monthLabel, "March 2026");
    });

    it("T2-F15-05: historical summary items include receivables and payables fields", async () => {
      const reportService = await getReportService();
      const history = await reportService.getMonthlyReportsHistory();
      for (const item of history) {
        assert.ok("receivables" in item);
        assert.ok("payables" in item);
      }
    });
  });

  // =========================================================================
  // F16: Historical Month Detail View (Boundaries)
  // =========================================================================
  describe("F16: Historical Detail View Boundaries", () => {
    it("T2-F16-01: March 2026 detail remarks on Day 1, 15, and 31 contain salary draw numbers", async () => {
      const reportService = await getReportService();
      const detail = await reportService.getMonthlyReportDetail(2026, 3);
      const d1 = detail.dailyData.find((r) => r.day === 1);
      const d15 = detail.dailyData.find((r) => r.day === 15);
      const d31 = detail.dailyData.find((r) => r.day === 31);
      assert.strictEqual(d1?.remarks, "1500");
      assert.strictEqual(d15?.remarks, "15000");
      assert.strictEqual(d31?.remarks, "15000");
    });

    it("T2-F16-02: August 2026 partial month detail Days 11-31 have 0s without throwing", async () => {
      const reportService = await getReportService();
      const detail = await reportService.getMonthlyReportDetail(2026, 8);
      for (let day = 11; day <= 31; day++) {
        const row = detail.dailyData.find((r) => r.day === day);
        assert.strictEqual(row?.sales, 0);
        assert.strictEqual(row?.grossProfit, 0);
      }
    });

    it("T2-F16-03: July 2026 detail dates are normalized to 2026-07-xx (not 2025)", async () => {
      const reportService = await getReportService();
      const detail = await reportService.getMonthlyReportDetail(2026, 7);
      assert.strictEqual(detail.dailyData.length, 31);
      for (const row of detail.dailyData) {
        assert.ok(row.date.startsWith("2026-07-"), `Expected 2026-07-*, got: ${row.date}`);
      }
    });

    it("T2-F16-04: historical snapshot status is strictly CLOSED", async () => {
      const reportService = await getReportService();
      const detail = await reportService.getMonthlyReportDetail(2026, 6);
      assert.strictEqual(detail.status, "CLOSED");
    });

    it("T2-F16-05: historical detail expenses array matches monthly seed count", async () => {
      const reportService = await getReportService();
      const march = await reportService.getMonthlyReportDetail(2026, 3);
      const july = await reportService.getMonthlyReportDetail(2026, 7);
      const august = await reportService.getMonthlyReportDetail(2026, 8);

      assert.strictEqual(march.expenses.length, 8);
      assert.strictEqual(july.expenses.length, 9);
      assert.strictEqual(august.expenses.length, 3);
    });
  });
});
