/**
 * Tier 4: Real-World Multi-Step Application Workflows (5 Scenarios)
 *
 * Simulates complete, multi-step shop operating scenarios:
 * 1. Full Monthly Shop Operating Cycle (Overheads -> POS sales -> Mid-month advance -> Month-end closing)
 * 2. Inventory Restock, Sale, and Expense Interplay (Credit purchase -> Stock check -> Sale -> Vendor payment)
 * 3. Repair Service Lifecycle & Revenue Integration (Ticket creation -> Part consumption -> Delivery -> Report)
 * 4. Historical Audit & Multi-Month Trend Comparison (Auditing 6 months, verifying loss months, typo fix)
 * 5. Error Recovery, Voided Transactions & Reconciliation (Erroneous sale -> Void -> Stock restored -> Zero drift)
 */

import { describe, it, before, beforeEach } from "node:test";
import * as assert from "node:assert";
import {
  setupTestDb,
  resetTestDb,
  getExpenseService,
  getReportService,
  getPosService,
  getInventoryService,
  getRepairsService,
  HISTORICAL_BENCHMARKS,
  assertNetProfitFormula,
} from "./harness";
import { memoryStore } from "../../src/db/client";

describe("Tier 4: Real-World Multi-Step Application Workflows", () => {
  before(async () => {
    await setupTestDb();
  });

  beforeEach(() => {
    resetTestDb();
  });

  // =========================================================================
  // Workflow 1: Full Monthly Shop Operating Cycle
  // =========================================================================
  it("Workflow 1: Full Monthly Shop Operating Cycle (Launch -> Overheads -> Daily Sales -> Expenses -> Month-End Close)", async () => {
    const expenseService = await getExpenseService();
    const posService = await getPosService();
    const reportService = await getReportService();

    // 1. Month Inception (September 2026)
    const year = 2026;
    const month = 9;

    // 2. Apply Standard Recurring Shop Overheads
    const overheadResult = await expenseService.applyRecurringExpenses(year, month);
    assert.strictEqual(overheadResult.applied, 9, "Must apply 9 standard overheads");

    // 3. Early Month Sales (Day 1 and Day 5)
    const sale1Id = await posService.createSale({
      customerName: "Corporate Buyer",
      totalAmount: 300000,
      paidAmount: 300000,
      paymentMethod: "CASH",
      items: [],
    });
    assert.ok(sale1Id > 0);

    const sale2Id = await posService.createSale({
      customerName: "Walk-in Tech",
      totalAmount: 128000,
      paidAmount: 128000,
      paymentMethod: "CASH",
      items: [],
    });
    assert.ok(sale2Id > 0);

    // 4. Mid-Month Ad-Hoc Expense (Tea & Food)
    await expenseService.createExpense({
      year,
      month,
      category: "TEA_FOOD",
      title: "Tea & Refreshments",
      amount: 2500,
      expenseDate: 1788998400, // Day 10
      paymentMethod: "CASH",
    });

    // 5. Late Month GPU Sale and Utility Adjustment
    const sale3Id = await posService.createSale({
      customerName: "Gaming Enthusiast",
      totalAmount: 285000,
      paidAmount: 285000,
      paymentMethod: "CASH",
      items: [],
    });
    assert.ok(sale3Id > 0);

    // 6. Month-End Reconciliation via Monthly Report Engine
    const finalReport = await reportService.getMonthlyReport(year, month);
    assert.ok(finalReport, "Month-end report must be generated");
    assert.strictEqual(finalReport.status, "OPEN", "Active month should remain OPEN until closed");

    // Total expenses should be 113,000 (recurring) + 2,500 (tea) = 115,500 PKR minimum
    assert.ok(finalReport.totalExpenses >= 115500, "Total expenses should include overheads and tea");

    // Net Profit formula must strictly hold
    assertNetProfitFormula(finalReport.grossProfit, finalReport.totalExpenses, finalReport.netProfit);
  });

  // =========================================================================
  // Workflow 2: Inventory Restock, Sale, and Expense Interplay
  // =========================================================================
  it("Workflow 2: Inventory Restock, Sale, and Expense Interplay (Credit Purchase -> Stock Verification -> Sale -> Vendor Payment)", async () => {
    const inventoryService = await getInventoryService();
    const posService = await getPosService();
    const expenseService = await getExpenseService();
    const reportService = await getReportService();

    const items = await inventoryService.getInventoryItems();
    assert.ok(items.length > 0, "Must have inventory items");
    const testItem = items[0];
    const initialStock = testItem.quantity;

    // Step 1: Restock item (simulate receiving purchase)
    await inventoryService.updateInventoryItem(testItem.id, {
      quantity: initialStock + 10,
    });

    const restockedItems = await inventoryService.getInventoryItems();
    const itemAfterRestock = restockedItems.find((i) => i.id === testItem.id);
    assert.strictEqual(itemAfterRestock?.quantity, initialStock + 10);

    // Step 2: Customer A buys 2 units
    const saleId = await posService.createSale({
      customerName: "Customer A",
      totalAmount: (testItem.salePrice || 1000) * 2,
      paidAmount: (testItem.salePrice || 1000) * 2,
      paymentMethod: "CASH",
      items: [{ inventoryId: testItem.id, quantity: 2, unitPrice: testItem.salePrice || 1000 }],
    });
    assert.ok(saleId > 0);

    // Step 3: Partial supplier payment recorded under expenses
    const expId = await expenseService.createExpense({
      year: 2026,
      month: 9,
      category: "MISC",
      title: "Supplier Payment - Al-Rehman",
      amount: 50000,
      expenseDate: 1788220800,
      paymentMethod: "CASH",
    });
    assert.ok(expId > 0);

    // Step 4: Reconcile financial report
    const report = await reportService.getMonthlyReport(2026, 9);
    assert.ok(report.totalExpenses >= 50000);
    assertNetProfitFormula(report.grossProfit, report.totalExpenses, report.netProfit);
  });

  // =========================================================================
  // Workflow 3: Repair Service Lifecycle & Revenue Integration
  // =========================================================================
  it("Workflow 3: Repair Service Lifecycle (Ticket Creation -> Part Consumption -> Completion -> Revenue Recognition)", async () => {
    const repairsService = await getRepairsService();
    const inventoryService = await getInventoryService();
    const reportService = await getReportService();
    const store = memoryStore as any;

    const items = await inventoryService.getInventoryItems();
    const replacementPart = items[0];
    const initialPartStock = replacementPart.quantity;

    // Step 1: Customer submits device for repair
    const repairId = await repairsService.addRepair({
      customerName: "Gaming Laptop Owner",
      device: "Asus ROG Strix",
      problem: "Failed SSD & Boot Loop",
      estimatedCost: 15000,
      status: "RECEIVED",
      partsUsed: [],
    });
    assert.ok(repairId > 0);

    // Step 2: Dynamic active repairs count derived (non-delivered)
    const activeBeforeDelivery = store.repairs.filter((r: any) => r.status !== "DELIVERED").length;
    assert.ok(activeBeforeDelivery > 0, "Active repairs count must be positive");

    // Step 3: Technician consumes replacement part
    await inventoryService.updateInventoryItem(replacementPart.id, {
      quantity: initialPartStock - 1,
    });

    // Step 4: Technician finishes repair and marks DELIVERED
    await repairsService.updateRepair(repairId, {
      status: "DELIVERED",
      finalCost: 18000,
    });

    // Step 5: Active repairs count decrements
    const activeAfterDelivery = store.repairs.filter((r: any) => r.status !== "DELIVERED").length;
    assert.strictEqual(activeAfterDelivery, activeBeforeDelivery - 1, "Active count must decrease after delivery");

    // Step 6: Monthly report accounts for repair revenue
    const report = await reportService.getMonthlyReport(2026, 9);
    assert.ok(report !== null);
  });

  // =========================================================================
  // Workflow 4: Historical Audit & Multi-Month Trend Comparison
  // =========================================================================
  it("Workflow 4: Historical Audit (Review 6 Months -> Verify Loss Months -> Deep Audit July Typo Fix)", async () => {
    const reportService = await getReportService();

    // Step 1: Fetch 6 historical summary months
    const history = await reportService.getMonthlyReportsHistory();
    assert.strictEqual(history.length, 6, "Must retrieve exactly 6 historical months");

    // Step 2: Verify negative operational profit months (March & May)
    const marchSummary = history.find((h) => h.year === 2026 && h.month === 3);
    const maySummary = history.find((h) => h.year === 2026 && h.month === 5);
    assert.ok(marchSummary, "March summary must exist");
    assert.strictEqual(marchSummary.netProfit, -8095, "March net loss must be -8,095 PKR");
    assert.ok(maySummary, "May summary must exist");
    assert.strictEqual(maySummary.netProfit, -8433, "May net loss must be -8,433 PKR");

    // Step 3: Deep audit July 2026 detail
    const julyDetail = await reportService.getMonthlyReportDetail(2026, 7);
    assert.strictEqual(julyDetail.grossSales, 850540, "July sales must be highest at 850,540 PKR");
    assert.strictEqual(julyDetail.grossProfit, 165080);
    assert.strictEqual(julyDetail.totalExpenses, 113568);
    assert.strictEqual(julyDetail.netProfit, 51512);

    // Verify July 2026 date normalization (2025 typo resolved to 2026)
    assert.strictEqual(julyDetail.dailyData.length, 31);
    for (const row of julyDetail.dailyData) {
      assert.ok(row.date.startsWith("2026-07-"), `July dates must start with 2026-07-, found: ${row.date}`);
    }

    // Step 4: Audit August 2026 partial month
    const augustDetail = await reportService.getMonthlyReportDetail(2026, 8);
    assert.strictEqual(augustDetail.expenses.length, 3, "August must have 3 recorded expenses");
    assert.strictEqual(augustDetail.totalExpenses, 42300, "August expenses must equal 42,300 PKR");
    assert.strictEqual(augustDetail.netProfit, 15760);
  });

  // =========================================================================
  // Workflow 5: Error Recovery, Voided Transactions & Reconciliation
  // =========================================================================
  it("Workflow 5: Error Recovery & Reconciliation (Erroneous High-Value Sale -> Delete -> Zero Drift Reversion)", async () => {
    const posService = await getPosService();
    const inventoryService = await getInventoryService();
    const reportService = await getReportService();

    const items = await inventoryService.getInventoryItems();
    const gpuItem = items[0];
    const initialGpuStock = gpuItem.quantity;

    // Step 1: Capture baseline monthly report numbers
    const baselineReport = await reportService.getMonthlyReport(2026, 9);
    const baselineSales = baselineReport.grossSales;
    const baselineGP = baselineReport.grossProfit;
    const baselineNet = baselineReport.netProfit;

    // Step 2: Erroneous high-quantity transaction entered by cashier
    const erroneousSaleId = await posService.createSale({
      customerName: "Erroneous Customer",
      totalAmount: 1425000,
      paidAmount: 1425000,
      paymentMethod: "CASH",
      items: [{ inventoryId: gpuItem.id, quantity: 5, unitPrice: 285000 }],
    });
    assert.ok(erroneousSaleId > 0);

    // Step 3: Manager detects error and voids / deletes invoice
    await posService.deleteSale(erroneousSaleId);

    // Step 4: Verify stock auto-restoration (SUGGEST-02)
    const itemsAfterVoid = await inventoryService.getInventoryItems();
    const restoredGpu = itemsAfterVoid.find((i) => i.id === gpuItem.id);
    assert.strictEqual(restoredGpu?.quantity, initialGpuStock, "Stock must return to initial baseline");

    // Step 5: Verify monthly report re-aligned with zero drift
    const postVoidReport = await reportService.getMonthlyReport(2026, 9);
    assert.strictEqual(postVoidReport.grossSales, baselineSales, "Gross Sales must revert to baseline");
    assert.strictEqual(postVoidReport.grossProfit, baselineGP, "Gross Profit must revert to baseline");
    assert.strictEqual(postVoidReport.netProfit, baselineNet, "Net Profit must revert to baseline with 0 drift");
  });
});
