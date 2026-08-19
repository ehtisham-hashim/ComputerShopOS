import { isTauriEnvironment, memoryStore, getSqlDb } from "./client";
import { AdjustmentRecord, PaymentStatus, CreateAdjustmentInput } from "./schema";
import { findOrCreateCustomer } from "./customerService";

export type { CreateAdjustmentInput };

export async function getAdjustments(): Promise<AdjustmentRecord[]> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    const rows = await sqlDb.select<any[]>(
      "SELECT * FROM adjustments ORDER BY created_at DESC"
    );
    return rows.map((r) => ({
      id: Number(r.id),
      adjustmentNo: String(r.adjustment_no || r.adjustmentNo || ""),
      customerId: r.customer_id != null ? Number(r.customer_id) : r.customerId != null ? Number(r.customerId) : null,
      customerName: String(r.customer_name || r.customerName || ""),
      customerPhone: String(r.customer_phone || r.customerPhone || ""),
      itemTakenName: String(r.item_taken_name || r.itemTakenName || ""),
      itemTakenValue: Number(r.item_taken_value ?? r.itemTakenValue ?? 0),
      itemGivenInventoryId: r.item_given_inventory_id != null ? Number(r.item_given_inventory_id) : r.itemGivenInventoryId != null ? Number(r.itemGivenInventoryId) : null,
      itemGivenName: String(r.item_given_name || r.itemGivenName || ""),
      itemGivenPrice: Number(r.item_given_price ?? r.itemGivenPrice ?? 0),
      netDifference: Number(r.net_difference ?? r.netDifference ?? 0),
      paidAmount: Number(r.paid_amount ?? r.paidAmount ?? 0),
      balanceDue: Number(r.balance_due ?? r.balanceDue ?? 0),
      paymentStatus: (r.payment_status || r.paymentStatus || "PAID") as PaymentStatus,
      notes: String(r.notes || ""),
      createdAt: Number(r.created_at ?? r.createdAt ?? Math.floor(Date.now() / 1000)),
    }));
  }

  return [...memoryStore.adjustments].sort((a, b) => b.createdAt - a.createdAt);
}

export async function createAdjustment(input: CreateAdjustmentInput): Promise<string> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();
  const adjustmentNo = `ADJ-${Date.now().toString().slice(-7)}`;
  const now = Math.floor(Date.now() / 1000);

  const netDiff = input.netDifference || 0.0;
  const targetDue = Math.abs(netDiff);
  const paid = input.paidAmount !== undefined ? input.paidAmount : targetDue;
  const balance = Math.max(0, targetDue - paid);

  let status: PaymentStatus = input.paymentStatus || "PAID";
  if (!input.paymentStatus) {
    if (netDiff === 0 || paid >= targetDue) {
      status = "PAID";
    } else if (paid > 0) {
      status = "PARTIAL";
    } else {
      status = "UNPAID";
    }
  }

  let custId = input.customerId;
  if (!custId && input.customerPhone) {
    custId = await findOrCreateCustomer(input.customerName, input.customerPhone);
  }

  if (isTauri && sqlDb) {
    await sqlDb.execute(
      `INSERT INTO adjustments (
        adjustment_no, customer_id, customer_name, customer_phone,
        item_taken_name, item_taken_value, item_given_inventory_id,
        item_given_name, item_given_price, net_difference, paid_amount,
        balance_due, payment_status, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        adjustmentNo,
        custId || null,
        input.customerName,
        input.customerPhone,
        input.itemTakenName,
        input.itemTakenValue || 0.0,
        input.itemGivenInventoryId || null,
        input.itemGivenName,
        input.itemGivenPrice || 0.0,
        netDiff,
        paid,
        balance,
        status,
        input.notes || "",
        now,
      ]
    );

    // Decrement store inventory item stock if given out
    if (input.itemGivenInventoryId) {
      await sqlDb.execute(
        "UPDATE inventory SET quantity = MAX(0, quantity - 1) WHERE id = $1",
        [input.itemGivenInventoryId]
      );
    }

    // Mark serial SOLD if serialized item is given out
    if (input.serialNumber) {
      await sqlDb.execute(
        "UPDATE inventory_serials SET status = 'SOLD' WHERE serial_number = $1",
        [input.serialNumber]
      );
    } else if (input.itemGivenInventoryId) {
      const availableSerials = await sqlDb.select<{ id: number }[]>(
        "SELECT id FROM inventory_serials WHERE inventory_id = $1 AND status = 'AVAILABLE' LIMIT 1",
        [input.itemGivenInventoryId]
      );
      if (availableSerials.length > 0) {
        await sqlDb.execute(
          "UPDATE inventory_serials SET status = 'SOLD' WHERE id = $1",
          [availableSerials[0].id]
        );
      }
    }

    return adjustmentNo;
  }

  // Fallback memory store
  const newAdj: AdjustmentRecord = {
    id: memoryStore.adjustments.length + 1,
    adjustmentNo,
    customerId: custId || null,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    itemTakenName: input.itemTakenName,
    itemTakenValue: input.itemTakenValue || 0.0,
    itemGivenInventoryId: input.itemGivenInventoryId || null,
    itemGivenName: input.itemGivenName,
    itemGivenPrice: input.itemGivenPrice || 0.0,
    netDifference: netDiff,
    paidAmount: paid,
    balanceDue: balance,
    paymentStatus: status,
    notes: input.notes || "",
    createdAt: now,
  };

  memoryStore.adjustments.unshift(newAdj);

  if (input.itemGivenInventoryId) {
    const inv = memoryStore.inventory.find((i) => i.id === input.itemGivenInventoryId);
    if (inv) {
      inv.quantity = Math.max(0, inv.quantity - 1);
    }
  }

  if (input.serialNumber) {
    const serial = memoryStore.serials.find(
      (s) => s.serialNumber.toUpperCase() === input.serialNumber!.toUpperCase()
    );
    if (serial) serial.status = "SOLD";
  } else if (input.itemGivenInventoryId) {
    const serial = memoryStore.serials.find(
      (s) => s.inventoryId === input.itemGivenInventoryId && s.status === "AVAILABLE"
    );
    if (serial) serial.status = "SOLD";
  }

  return adjustmentNo;
}

export async function deleteAdjustment(id: number): Promise<void> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    const rows = await sqlDb.select<any[]>(
      "SELECT item_given_inventory_id FROM adjustments WHERE id = $1",
      [id]
    );
    await sqlDb.execute("DELETE FROM adjustments WHERE id = $1", [id]);
    const invId = rows.length > 0 ? (rows[0].item_given_inventory_id ?? rows[0].itemGivenInventoryId) : null;
    if (invId) {
      await sqlDb.execute(
        "UPDATE inventory SET quantity = quantity + 1 WHERE id = $1",
        [invId]
      );
      // Restore serial to AVAILABLE if one was marked SOLD
      const soldSerials = await sqlDb.select<{ id: number }[]>(
        "SELECT id FROM inventory_serials WHERE inventory_id = $1 AND status = 'SOLD' ORDER BY id DESC LIMIT 1",
        [invId]
      );
      if (soldSerials.length > 0) {
        await sqlDb.execute(
          "UPDATE inventory_serials SET status = 'AVAILABLE' WHERE id = $1",
          [soldSerials[0].id]
        );
      }
    }
    return;
  }

  const idx = memoryStore.adjustments.findIndex((a) => a.id === id);
  if (idx !== -1) {
    const adj = memoryStore.adjustments[idx];
    if (adj.itemGivenInventoryId) {
      const inv = memoryStore.inventory.find((i) => i.id === adj.itemGivenInventoryId);
      if (inv) {
        inv.quantity += 1;
      }
      const soldSerial = memoryStore.serials.find(
        (s) => s.inventoryId === adj.itemGivenInventoryId && s.status === "SOLD"
      );
      if (soldSerial) soldSerial.status = "AVAILABLE";
    }
    memoryStore.adjustments.splice(idx, 1);
  }
}
