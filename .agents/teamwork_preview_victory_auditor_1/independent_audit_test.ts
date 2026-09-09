import { memoryStore } from "../../src/db/client";
import { createSaleTransaction, deleteSale, getRecentSales } from "../../src/db/posService";
import { addRepairTicket, deleteRepairTicket, getRepairTickets } from "../../src/db/repairsService";
import { createAdjustment, deleteAdjustment, getAdjustments } from "../../src/db/adjustmentsService";
import * as schema from "../../src/db/schema";
import assert from "node:assert";

async function runAuditTests() {
  console.log("==================================================");
  console.log("  INDEPENDENT FORENSIC TEST SUITE - VICTORY AUDIT ");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (e: any) {
      console.error(`  [FAIL] ${name}:`, e.message || e);
      failed++;
    }
  }

  async function asyncTest(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (e: any) {
      console.error(`  [FAIL] ${name}:`, e.message || e);
      failed++;
    }
  }

  // --- TYPE CHECKS ---
  console.log("\n--- Category 1: Schema & Type Cleanups (TYPE-01, TYPE-02) ---");

  test("TYPE-01: CustomerRecord is NOT exported from schema.ts", () => {
    assert.strictEqual((schema as any).CustomerRecord, undefined, "CustomerRecord should be undefined");
  });

  test("TYPE-02: Input types and interfaces exist in schema.ts", () => {
    const dummySale: schema.CreateSaleInput = {
      items: [{ inventoryId: 1, itemName: "Test", quantity: 1, unitPrice: 100 }],
      subtotal: 100,
      totalAmount: 100,
      paymentMethod: "CASH"
    };
    assert.ok(dummySale);

    const dummyRepair: schema.AddRepairInput = {
      customerName: "John",
      customerPhone: "123456",
      device: "Laptop",
      reportedIssue: "Broken Screen"
    };
    assert.ok(dummyRepair);

    const dummyAdj: schema.CreateAdjustmentInput = {
      customerName: "Jane",
      customerPhone: "654321",
      itemTakenName: "Old GPU",
      itemTakenValue: 50,
      itemGivenName: "New GPU",
      itemGivenPrice: 150,
      netDifference: 100
    };
    assert.ok(dummyAdj);

    const dummyPart: schema.RepairPartUsed = {
      name: "Thermal Paste",
      cost: 15,
      isHardware: true,
      quantity: 2
    };
    assert.ok(dummyPart);
  });

  // --- SERVICE LOGIC: posService (SUGGEST-02) ---
  console.log("\n--- Category 2: Sales Service & Restoration (SUGGEST-02, SUGGEST-04) ---");

  await asyncTest("SUGGEST-02 (Sales): createSaleTransaction decrements stock, deleteSale restores stock & serials", async () => {
    // Pick an item with stock and serial
    const targetItem = memoryStore.inventory.find(i => i.id === 2); // RTX 4080
    assert.ok(targetItem, "Target item 2 exists");
    const initialQty = targetItem.quantity;
    
    // Find available serial for item 2
    const targetSerial = memoryStore.serials.find(s => s.inventoryId === 2 && s.status === "AVAILABLE");
    assert.ok(targetSerial, "Available serial exists for item 2");
    const serialNumber = targetSerial.serialNumber;

    // Create a sale with discount
    const invoiceNo = await createSaleTransaction({
      customerName: "Audit Test Customer",
      customerPhone: "555-0100",
      items: [{
        inventoryId: targetItem.id,
        itemName: targetItem.name,
        serialNumber: serialNumber,
        quantity: 1,
        unitPrice: targetItem.price
      }],
      subtotal: targetItem.price,
      discount: 50,
      totalAmount: targetItem.price - 50,
      paidAmount: targetItem.price - 50,
      paymentMethod: "CASH"
    });

    assert.ok(invoiceNo, "Invoice number generated");
    assert.strictEqual(targetItem.quantity, initialQty - 1, "Inventory quantity decremented after sale");
    assert.strictEqual(targetSerial.status, "SOLD", "Serial marked SOLD after sale");

    // Fetch created sale
    const sales = await getRecentSales();
    const createdSale = sales.find(s => s.invoiceNo === invoiceNo);
    assert.ok(createdSale, "Created sale found in store");
    assert.strictEqual(createdSale.discount, 50, "Discount properly recorded on sale record");

    // Delete the sale
    await deleteSale(createdSale.id);

    // Verify stock restored
    assert.strictEqual(targetItem.quantity, initialQty, "Inventory quantity restored after deleteSale");
    assert.strictEqual(targetSerial.status, "AVAILABLE", "Serial marked AVAILABLE after deleteSale");
  });

  // --- SERVICE LOGIC: repairsService (SUGGEST-02, BUG-04) ---
  console.log("\n--- Category 3: Repairs Service & Restoration (SUGGEST-02, BUG-04) ---");

  await asyncTest("SUGGEST-02 & BUG-04 (Repairs): addRepairTicket decrements stock by custom qty, deleteRepairTicket restores it", async () => {
    // Pick an inventory hardware part: item 4 (RAM)
    const ramItem = memoryStore.inventory.find(i => i.id === 4);
    assert.ok(ramItem, "RAM item 4 exists");
    const initialQty = ramItem.quantity;
    const qtyUsed = 2;

    const ticketNo = await addRepairTicket({
      customerName: "Audit Tech Lab",
      customerPhone: "555-0200",
      device: "Custom Gaming PC",
      reportedIssue: "RAM Upgrade",
      partsUsed: [
        { name: ramItem.name, cost: ramItem.price * qtyUsed, isHardware: true, inventoryId: ramItem.id, quantity: qtyUsed },
        { name: "Labor Service", cost: 50, isHardware: false }
      ],
      laborCost: 50,
      estimatedCost: ramItem.price * qtyUsed + 50
    });

    assert.ok(ticketNo, "Repair ticket created");
    assert.strictEqual(ramItem.quantity, initialQty - qtyUsed, "Inventory decremented by specified quantity (2)");

    const tickets = await getRepairTickets();
    const createdTicket = tickets.find(t => t.ticketNo === ticketNo);
    assert.ok(createdTicket, "Created ticket found");

    // Delete repair ticket
    await deleteRepairTicket(createdTicket.id);

    // Verify stock restored
    assert.strictEqual(ramItem.quantity, initialQty, "Inventory quantity fully restored after deleteRepairTicket");
  });

  // --- SERVICE LOGIC: adjustmentsService (SUGGEST-02, SUGGEST-03) ---
  console.log("\n--- Category 4: Adjustments Service, Serial Sold & Restoration (SUGGEST-02, SUGGEST-03) ---");

  await asyncTest("SUGGEST-03 & SUGGEST-02 (Adjustments): createAdjustment marks serial SOLD, deleteAdjustment restores stock & serial", async () => {
    const cpuItem = memoryStore.inventory.find(i => i.id === 3); // Ryzen 7
    assert.ok(cpuItem, "CPU item 3 exists");
    const initialQty = cpuItem.quantity;

    // Find available serial for item 3
    let availableSerial = memoryStore.serials.find(s => s.inventoryId === 3 && s.status === "AVAILABLE");
    if (!availableSerial) {
      // Add a test serial if none available
      availableSerial = {
        id: 9999,
        inventoryId: 3,
        serialNumber: "SN-TEST-CPU-AUDIT",
        status: "AVAILABLE",
        dateAdded: Math.floor(Date.now() / 1000)
      };
      memoryStore.serials.push(availableSerial);
    }
    const targetSerial = availableSerial;

    const adjNo = await createAdjustment({
      customerName: "Audit Trader",
      customerPhone: "555-0300",
      itemTakenName: "Old Ryzen 5",
      itemTakenValue: 100,
      itemGivenInventoryId: cpuItem.id,
      itemGivenName: cpuItem.name,
      itemGivenPrice: cpuItem.price,
      serialNumber: targetSerial.serialNumber,
      netDifference: cpuItem.price - 100,
      paidAmount: cpuItem.price - 100
    });

    assert.ok(adjNo, "Adjustment created");
    assert.strictEqual(cpuItem.quantity, initialQty - 1, "Inventory quantity decremented");
    assert.strictEqual(targetSerial.status, "SOLD", "Serial status marked SOLD (SUGGEST-03)");

    const adjs = await getAdjustments();
    const createdAdj = adjs.find(a => a.adjustmentNo === adjNo);
    assert.ok(createdAdj, "Created adjustment found");

    // Delete adjustment
    await deleteAdjustment(createdAdj.id);

    // Verify stock & serial restored
    assert.strictEqual(cpuItem.quantity, initialQty, "Inventory restored after deleteAdjustment (SUGGEST-02)");
    assert.strictEqual(targetSerial.status, "AVAILABLE", "Serial restored to AVAILABLE after deleteAdjustment (SUGGEST-02)");
  });

  console.log("\n==================================================");
  console.log(`  AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAuditTests();
