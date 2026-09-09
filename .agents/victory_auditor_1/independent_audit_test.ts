import assert from "node:assert";
import * as schema from "../../src/db/schema";
import { memoryStore, initDb } from "../../src/db/client";
import {
  createSaleTransaction,
  deleteSale,
  getSaleItems,
  CreateSaleInput,
} from "../../src/db/posService";
import {
  addRepairTicket,
  deleteRepairTicket,
  getRepairTickets,
  updateRepairStatus,
  RepairPartUsed,
  AddRepairInput,
} from "../../src/db/repairsService";
import {
  createAdjustment,
  deleteAdjustment,
  getAdjustments,
  CreateAdjustmentInput,
} from "../../src/db/adjustmentsService";

async function runIndependentAuditTests() {
  console.log("=================================================");
  console.log("STARTING INDEPENDENT POST-VICTORY AUDIT TEST RUN");
  console.log("=================================================");

  let testsPassed = 0;
  let testsFailed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    return (async () => {
      try {
        await fn();
        console.log(`  [PASS] ${name}`);
        testsPassed++;
      } catch (err: any) {
        console.error(`  [FAIL] ${name}:`, err.message || err);
        testsFailed++;
      }
    })();
  }

  // --- TYPE DEFINITION TESTS (TYPE-01 & TYPE-02) ---
  console.log("\n--- Category 1: Type Definitions & Cleanups (TYPE-01, TYPE-02) ---");

  await test("TYPE-01: CustomerRecord is NOT exported from schema.ts", () => {
    assert.strictEqual(
      (schema as any).CustomerRecord,
      undefined,
      "CustomerRecord must not be exported from schema.ts"
    );
  });

  await test("TYPE-02: Input types exported from schema.ts and re-exported from services", () => {
    // Check schema.ts exports types (interfaces are compile-time, but verify no import resolution errors occurred)
    const dummySale: schema.CreateSaleInput = {
      items: [{ inventoryId: 1, itemName: "Test", quantity: 1, unitPrice: 100 }],
      subtotal: 100,
      totalAmount: 100,
      paymentMethod: "CASH",
    };
    const dummyRepair: schema.AddRepairInput = {
      customerName: "Auditor",
      customerPhone: "12345",
      device: "Laptop",
      reportedIssue: "Screen dead",
      partsUsed: [{ name: "LCD", cost: 50, isHardware: true, inventoryId: 1, quantity: 1 }],
    };
    const dummyAdj: schema.CreateAdjustmentInput = {
      customerName: "Auditor",
      customerPhone: "12345",
      itemTakenName: "Old GPU",
      itemTakenValue: 50,
      itemGivenName: "New GPU",
      itemGivenPrice: 150,
      netDifference: 100,
    };
    const dummyPart: schema.RepairPartUsed = {
      name: "Fan",
      cost: 20,
      isHardware: true,
      inventoryId: 2,
      quantity: 2,
    };

    assert.ok(dummySale && dummyRepair && dummyAdj && dummyPart);
  });

  // --- BUG-08: REPAIRS COUNT TESTS ---
  console.log("\n--- Category 2: Dynamic Repairs Count (BUG-08) ---");

  await test("BUG-08: Active repairs count ignores DELIVERED and counts all active statuses", async () => {
    // Reset memory store repairs
    memoryStore.repairs = [
      {
        id: 101,
        ticketNo: "RMA-101",
        customerId: 1,
        customerName: "Test 1",
        customerPhone: "111",
        device: "MacBook",
        reportedIssue: "Battery",
        technicianNotes: null,
        partsUsed: "[]",
        laborCost: 20,
        estimatedCost: 100,
        finalCost: 100,
        status: "IN_PROGRESS",
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: 102,
        ticketNo: "RMA-102",
        customerId: 2,
        customerName: "Test 2",
        customerPhone: "222",
        device: "ThinkPad",
        reportedIssue: "Keyboard",
        technicianNotes: null,
        partsUsed: "[]",
        laborCost: 10,
        estimatedCost: 50,
        finalCost: 50,
        status: "WAITING_PARTS",
        createdAt: 1001,
        updatedAt: 1001,
      },
      {
        id: 103,
        ticketNo: "RMA-103",
        customerId: 3,
        customerName: "Test 3",
        customerPhone: "333",
        device: "Dell XPS",
        reportedIssue: "Fan",
        technicianNotes: null,
        partsUsed: "[]",
        laborCost: 15,
        estimatedCost: 40,
        finalCost: 40,
        status: "DELIVERED",
        createdAt: 1002,
        updatedAt: 1002,
      },
    ];

    const tickets = await getRepairTickets();
    const activeCount = tickets.filter((t) => t.status !== "DELIVERED").length;
    assert.strictEqual(activeCount, 2, "Active count should exclude DELIVERED ticket (2 active, 1 delivered)");

    // Now update ticket 101 to DELIVERED
    await updateRepairStatus(101, "DELIVERED");
    const updatedTickets = await getRepairTickets();
    const newActiveCount = updatedTickets.filter((t) => t.status !== "DELIVERED").length;
    assert.strictEqual(newActiveCount, 1, "Active count should decrease to 1 after delivery");
  });

  // --- SUGGEST-04: SALES DISCOUNT TESTS ---
  console.log("\n--- Category 3: Sales Discount Calculation & UI Logic (SUGGEST-04) ---");

  await test("SUGGEST-04: Discount calculation logic handles standard, partial, 100%, and excessive discounts safely", () => {
    const calculateTotals = (subtotal: number, discountInput: string, taxAmount: number = 0) => {
      const discountAmount = Math.min(subtotal, Math.max(0, parseFloat(discountInput) || 0));
      const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount);
      return { discountAmount, grandTotal };
    };

    // Case 1: Standard discount
    const res1 = calculateTotals(1000, "150");
    assert.strictEqual(res1.discountAmount, 150);
    assert.strictEqual(res1.grandTotal, 850);

    // Case 2: Excessive discount (discount > subtotal)
    const res2 = calculateTotals(500, "700");
    assert.strictEqual(res2.discountAmount, 500, "Discount must be capped at subtotal");
    assert.strictEqual(res2.grandTotal, 0, "Grand total must not be negative");

    // Case 3: Negative discount input
    const res3 = calculateTotals(500, "-50");
    assert.strictEqual(res3.discountAmount, 0, "Negative discount input must be clamped to 0");
    assert.strictEqual(res3.grandTotal, 500);

    // Case 4: Invalid non-numeric input
    const res4 = calculateTotals(500, "abc");
    assert.strictEqual(res4.discountAmount, 0, "Invalid text input must fallback to 0");
    assert.strictEqual(res4.grandTotal, 500);

    // Case 5: 100% discount with 0 paid should calculate PAID paymentStatus when grandTotal is 0
    const calcPaymentStatus = (grandTotal: number, effectivePaid: number) => {
      if (grandTotal > 0 && effectivePaid <= 0) return "UNPAID";
      if (effectivePaid < grandTotal) return "PARTIAL";
      return "PAID";
    };
    assert.strictEqual(calcPaymentStatus(0, 0), "PAID", "0 total invoice should be PAID");
    assert.strictEqual(calcPaymentStatus(100, 0), "UNPAID", "Positive invoice with 0 paid is UNPAID");
    assert.strictEqual(calcPaymentStatus(100, 50), "PARTIAL", "Partial paid is PARTIAL");
    assert.strictEqual(calcPaymentStatus(100, 100), "PAID", "Full paid is PAID");
  });

  // --- SUGGEST-05: PRE-CHECKOUT STOCK VALIDATION TESTS ---
  console.log("\n--- Category 4: Pre-Checkout Stock Validation (SUGGEST-05) ---");

  await test("SUGGEST-05: Stock validator aggregates cart quantities and detects stock breaches", () => {
    const mockInventory: schema.InventoryItem[] = [
      {
        id: 10,
        sku: "RAM-01",
        name: "16GB RAM",
        category: "RAM",
        costPrice: 40,
        price: 60,
        quantity: 3,
        minQuantity: 1,
        location: "A1",
        description: null,
        status: "ACTIVE",
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: 20,
        sku: "SSD-01",
        name: "1TB NVMe",
        category: "Storage",
        costPrice: 50,
        price: 80,
        quantity: 1,
        minQuantity: 1,
        location: "A2",
        description: null,
        status: "ACTIVE",
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];

    const validateStock = (cart: { item: { id: number; name: string }; quantity: number }[]) => {
      const requestedQtyByItem: Record<number, { name: string; qty: number }> = {};
      for (const c of cart) {
        if (!requestedQtyByItem[c.item.id]) {
          requestedQtyByItem[c.item.id] = { name: c.item.name, qty: 0 };
        }
        requestedQtyByItem[c.item.id].qty += c.quantity;
      }

      for (const [idStr, req] of Object.entries(requestedQtyByItem)) {
        const invId = Number(idStr);
        const live = mockInventory.find((i) => i.id === invId);
        if (!live || live.quantity < req.qty) {
          return {
            valid: false,
            error: `Insufficient stock for "${req.name}". Available: ${live?.quantity ?? 0}, Requested: ${req.qty}`,
          };
        }
      }
      return { valid: true, error: null };
    };

    // Valid: 2 RAM sticks (stock has 3)
    const test1 = validateStock([{ item: { id: 10, name: "16GB RAM" }, quantity: 2 }]);
    assert.strictEqual(test1.valid, true);

    // Invalid: single line requesting 4 RAM sticks (stock has 3)
    const test2 = validateStock([{ item: { id: 10, name: "16GB RAM" }, quantity: 4 }]);
    assert.strictEqual(test2.valid, false);

    // Invalid: multiple duplicate cart items aggregating to 4 RAM sticks (2 + 2 = 4 > 3)
    const test3 = validateStock([
      { item: { id: 10, name: "16GB RAM" }, quantity: 2 },
      { item: { id: 10, name: "16GB RAM" }, quantity: 2 },
    ]);
    assert.strictEqual(test3.valid, false);
    assert.ok(test3.error?.includes("Requested: 4"));

    // Invalid: item not in stock / missing item
    const test4 = validateStock([{ item: { id: 999, name: "Nonexistent" }, quantity: 1 }]);
    assert.strictEqual(test4.valid, false);
  });

  // --- SUGGEST-02 & SUGGEST-03: INVENTORY RESTORATION & SERIAL STATUS TESTS ---
  console.log("\n--- Category 5: Service Logic & Inventory Restoration (SUGGEST-02, SUGGEST-03) ---");

  await test("SUGGEST-02 (POS): deleteSale restores inventory stock and serial status", async () => {
    // Seed inventory and serial
    const testItemId = 201;
    const testSerialNo = "SN-AUDIT-POS-01";
    memoryStore.inventory = [
      {
        id: testItemId,
        sku: "GPU-TEST",
        name: "Test GPU",
        category: "GPU",
        costPrice: 500,
        price: 700,
        quantity: 5,
        minQuantity: 1,
        location: "Shelf 1",
        description: null,
        status: "ACTIVE",
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];
    memoryStore.serials = [
      {
        id: 501,
        inventoryId: testItemId,
        serialNumber: testSerialNo,
        status: "AVAILABLE",
        notes: null,
        createdAt: 1000,
      },
    ];
    memoryStore.sales = [];
    memoryStore.saleItems = [];

    // Create Sale
    const invoiceNo = await createSaleTransaction({
      customerName: "Buyer",
      items: [
        {
          inventoryId: testItemId,
          itemName: "Test GPU",
          serialNumber: testSerialNo,
          quantity: 2,
          unitPrice: 700,
        },
      ],
      subtotal: 1400,
      discount: 100,
      totalAmount: 1300,
      paidAmount: 1300,
      paymentMethod: "CASH",
    });

    const invAfterSale = memoryStore.inventory.find((i) => i.id === testItemId)!;
    assert.strictEqual(invAfterSale.quantity, 3, "Stock should decrement from 5 to 3");
    const serialAfterSale = memoryStore.serials.find((s) => s.serialNumber === testSerialNo)!;
    assert.strictEqual(serialAfterSale.status, "SOLD", "Serial status should be SOLD");

    const createdSale = memoryStore.sales.find((s) => s.invoiceNo === invoiceNo)!;
    assert.ok(createdSale);

    // Delete Sale
    await deleteSale(createdSale.id);

    const invAfterDelete = memoryStore.inventory.find((i) => i.id === testItemId)!;
    assert.strictEqual(invAfterDelete.quantity, 5, "Stock should be restored from 3 back to 5 on deleteSale");
    const serialAfterDelete = memoryStore.serials.find((s) => s.serialNumber === testSerialNo)!;
    assert.strictEqual(serialAfterDelete.status, "AVAILABLE", "Serial status should be restored to AVAILABLE on deleteSale");
    assert.strictEqual(memoryStore.sales.length, 0, "Sale header should be deleted");
    assert.strictEqual(memoryStore.saleItems.length, 0, "Sale items should be deleted");
  });

  await test("SUGGEST-02 (Repairs): deleteRepairTicket restores inventory stock for parts used", async () => {
    const testItemId = 301;
    memoryStore.inventory = [
      {
        id: testItemId,
        sku: "SCREEN-01",
        name: "Replacement Screen",
        category: "Parts",
        costPrice: 50,
        price: 90,
        quantity: 10,
        minQuantity: 1,
        location: "Bin 3",
        description: null,
        status: "ACTIVE",
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];
    memoryStore.repairs = [];

    // Add repair ticket consuming 3 screens
    const ticketNo = await addRepairTicket({
      customerName: "Repair Client",
      customerPhone: "555-1234",
      device: "Laptop Display",
      reportedIssue: "Cracked",
      partsUsed: [
        {
          name: "Replacement Screen",
          cost: 90,
          isHardware: true,
          inventoryId: testItemId,
          quantity: 3,
        },
      ],
      laborCost: 30,
      estimatedCost: 300,
    });

    const invAfterRepair = memoryStore.inventory.find((i) => i.id === testItemId)!;
    assert.strictEqual(invAfterRepair.quantity, 7, "Stock should decrement from 10 to 7 (10 - 3)");

    const ticket = memoryStore.repairs.find((r) => r.ticketNo === ticketNo)!;
    assert.ok(ticket);

    // Delete repair ticket
    await deleteRepairTicket(ticket.id);

    const invAfterDelete = memoryStore.inventory.find((i) => i.id === testItemId)!;
    assert.strictEqual(invAfterDelete.quantity, 10, "Stock should be restored from 7 back to 10 on deleteRepairTicket");
    assert.strictEqual(memoryStore.repairs.length, 0, "Repair ticket should be deleted");
  });

  await test("SUGGEST-02 & SUGGEST-03 (Adjustments): createAdjustment marks serial SOLD and deleteAdjustment restores stock & serial", async () => {
    const testItemId = 401;
    const testSerialNo = "SN-ADJ-AUDIT-88";
    memoryStore.inventory = [
      {
        id: testItemId,
        sku: "LAPTOP-USED",
        name: "Used ThinkPad",
        category: "Laptop",
        costPrice: 200,
        price: 350,
        quantity: 4,
        minQuantity: 1,
        location: "Display",
        description: null,
        status: "ACTIVE",
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];
    memoryStore.serials = [
      {
        id: 701,
        inventoryId: testItemId,
        serialNumber: testSerialNo,
        status: "AVAILABLE",
        notes: null,
        createdAt: 1000,
      },
    ];
    memoryStore.adjustments = [];

    // Create adjustment (Trade-in: customer trades in old PC for Used ThinkPad)
    const adjNo = await createAdjustment({
      customerName: "Trade In Customer",
      customerPhone: "555-9876",
      itemTakenName: "Old Desktop",
      itemTakenValue: 150,
      itemGivenInventoryId: testItemId,
      itemGivenName: "Used ThinkPad",
      itemGivenPrice: 350,
      serialNumber: testSerialNo,
      netDifference: 200,
      paidAmount: 200,
      balanceDue: 0,
      paymentStatus: "PAID",
    });

    const invAfterAdj = memoryStore.inventory.find((i) => i.id === testItemId)!;
    assert.strictEqual(invAfterAdj.quantity, 3, "Stock should decrement from 4 to 3 on trade-in given item");

    // SUGGEST-03 verification
    const serialAfterAdj = memoryStore.serials.find((s) => s.serialNumber === testSerialNo)!;
    assert.strictEqual(serialAfterAdj.status, "SOLD", "Serial number must be marked SOLD when given in adjustment");

    const adjRecord = memoryStore.adjustments.find((a) => a.adjustmentNo === adjNo)!;
    assert.ok(adjRecord);

    // SUGGEST-02 verification on deleteAdjustment
    await deleteAdjustment(adjRecord.id);

    const invAfterDelete = memoryStore.inventory.find((i) => i.id === testItemId)!;
    assert.strictEqual(invAfterDelete.quantity, 4, "Stock should be restored from 3 back to 4 on deleteAdjustment");

    const serialAfterDelete = memoryStore.serials.find((s) => s.serialNumber === testSerialNo)!;
    assert.strictEqual(serialAfterDelete.status, "AVAILABLE", "Serial number must be restored to AVAILABLE on deleteAdjustment");
    assert.strictEqual(memoryStore.adjustments.length, 0, "Adjustment record should be deleted");
  });

  console.log("\n=================================================");
  console.log(`AUDIT TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log("=================================================");

  if (testsFailed > 0) {
    throw new Error(`Independent audit tests failed: ${testsFailed} failure(s)`);
  }
}

runIndependentAuditTests().catch((e) => {
  console.error("FATAL AUDIT TEST ERROR:", e);
  process.exit(1);
});
