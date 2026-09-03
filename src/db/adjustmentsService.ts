import { isTauriEnvironment, memoryStore, getSqlDb } from "./client";
import { AdjustmentRecord, PaymentStatus, CreateAdjustmentInput, ItemTitle } from "./schema";
import { findOrCreateCustomer } from "./customerService";
import { addInventoryItem } from "./inventoryService";

export type { CreateAdjustmentInput };

/**
 * Generate a sequential collision-proof trade-in SKU: TRD-YYYY-XXX
 */
export async function getNextTradeInSku(_title?: ItemTitle): Promise<string> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();
  const year = new Date().getFullYear();
  const prefix = `TRD-${year}-`;
  let maxSeq = 0;

  if (isTauri && sqlDb) {
    try {
      const rows = await sqlDb.select<{ sku: string }[]>(
        "SELECT sku FROM inventory WHERE sku LIKE $1",
        [`${prefix}%`]
      );
      for (const r of rows) {
        const parts = (r.sku || "").split("-");
        if (parts.length >= 3) {
          const num = parseInt(parts[2], 10);
          if (!isNaN(num) && num > maxSeq) maxSeq = num;
        }
      }
    } catch (e) {
      console.error("Failed to query trade-in SKU sequence:", e);
    }
  }

  for (const i of memoryStore.inventory) {
    if ((i.sku || "").startsWith(prefix)) {
      const parts = (i.sku || "").split("-");
      if (parts.length >= 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxSeq) maxSeq = num;
      }
    }
  }

  let candidate = maxSeq + 1;
  let finalSku = `${prefix}${String(candidate).padStart(3, "0")}`;

  if (isTauri && sqlDb) {
    while (true) {
      try {
        const check = await sqlDb.select<{ count: number }[]>(
          "SELECT COUNT(*) as count FROM inventory WHERE sku = $1",
          [finalSku]
        );
        if (check && check[0] && check[0].count > 0) {
          candidate++;
          finalSku = `${prefix}${String(candidate).padStart(3, "0")}`;
        } else {
          break;
        }
      } catch {
        break;
      }
    }
  }

  return finalSku;
}

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
      itemTakenInventoryId: r.item_taken_inventory_id != null ? Number(r.item_taken_inventory_id) : r.itemTakenInventoryId != null ? Number(r.itemTakenInventoryId) : null,
      itemTakenName: String(r.item_taken_name || r.itemTakenName || ""),
      itemTakenValue: Math.round(Number(r.item_taken_value ?? r.itemTakenValue ?? 0)),
      itemGivenInventoryId: r.item_given_inventory_id != null ? Number(r.item_given_inventory_id) : r.itemGivenInventoryId != null ? Number(r.itemGivenInventoryId) : null,
      itemGivenName: String(r.item_given_name || r.itemGivenName || ""),
      itemGivenPrice: Math.round(Number(r.item_given_price ?? r.itemGivenPrice ?? 0)),
      netDifference: Math.round(Number(r.net_difference ?? r.netDifference ?? 0)),
      paidAmount: Math.round(Number(r.paid_amount ?? r.paidAmount ?? 0)),
      balanceDue: Math.round(Number(r.balance_due ?? r.balanceDue ?? 0)),
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

  const itemTakenValInt = Math.round(Number(input.itemTakenValue) || 0);
  const itemGivenPriceInt = Math.round(Number(input.itemGivenPrice) || 0);
  const netDiffInt = Math.round(input.netDifference !== undefined ? Number(input.netDifference) : itemGivenPriceInt - itemTakenValInt);
  const targetDue = Math.abs(netDiffInt);
  const paidInt = Math.round(input.paidAmount !== undefined ? Number(input.paidAmount) : targetDue);
  const balanceInt = Math.max(0, targetDue - paidInt);

  let status: PaymentStatus = input.paymentStatus || "PAID";
  if (!input.paymentStatus) {
    if (netDiffInt === 0 || paidInt >= targetDue) {
      status = "PAID";
    } else if (paidInt > 0) {
      status = "PARTIAL";
    } else {
      status = "UNPAID";
    }
  }

  let custId = input.customerId;
  if (!custId && input.customerPhone) {
    custId = await findOrCreateCustomer(input.customerName, input.customerPhone);
  }

  // 1. Inward the Traded-In Item into Inventory
  let itemTakenInventoryId: number | null = null;
  if (input.itemTakenName.trim()) {
    const category: ItemTitle = input.itemTakenTitle || "LAPTOP";
    const tradeInSku = input.itemTakenSku?.trim() || (await getNextTradeInSku(category));
    const conditionTag = input.itemTakenCondition?.trim();
    const formattedName = conditionTag
      ? `${input.itemTakenName.trim()} [${conditionTag}]`
      : input.itemTakenName.trim();
    const sellPriceInt = input.itemTakenSellPrice !== undefined && input.itemTakenSellPrice > 0
      ? Math.round(Number(input.itemTakenSellPrice))
      : Math.round(itemTakenValInt > 0 ? itemTakenValInt * 1.25 : 0);

    const serials = input.itemTakenSerial?.trim() ? [input.itemTakenSerial.trim().toUpperCase()] : undefined;

    try {
      itemTakenInventoryId = await addInventoryItem(
        {
          title: category,
          name: formattedName,
          sku: tradeInSku,
          quantity: 1,
          costPrice: itemTakenValInt,
          price: sellPriceInt,
          isSerialized: serials && serials.length > 0 ? 1 : 0,
        },
        serials
      );
    } catch (invErr) {
      console.error("Failed to add traded-in item to inventory:", invErr);
    }
  }

  if (isTauri && sqlDb) {
    await sqlDb.execute(
      `INSERT INTO adjustments (
        adjustment_no, customer_id, customer_name, customer_phone,
        item_taken_inventory_id, item_taken_name, item_taken_value, item_given_inventory_id,
        item_given_name, item_given_price, net_difference, paid_amount,
        balance_due, payment_status, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        adjustmentNo,
        custId || null,
        input.customerName,
        input.customerPhone,
        itemTakenInventoryId,
        input.itemTakenName,
        itemTakenValInt,
        input.itemGivenInventoryId || null,
        input.itemGivenName,
        itemGivenPriceInt,
        netDiffInt,
        paidInt,
        balanceInt,
        status,
        input.notes || "",
        now,
      ]
    );

    if (input.itemGivenInventoryId) {
      await sqlDb.execute(
        "UPDATE inventory SET quantity = MAX(0, quantity - 1) WHERE id = $1",
        [input.itemGivenInventoryId]
      );
    }

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
    itemTakenInventoryId,
    itemTakenName: input.itemTakenName,
    itemTakenValue: itemTakenValInt,
    itemGivenInventoryId: input.itemGivenInventoryId || null,
    itemGivenName: input.itemGivenName,
    itemGivenPrice: itemGivenPriceInt,
    netDifference: netDiffInt,
    paidAmount: paidInt,
    balanceDue: balanceInt,
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
      "SELECT item_given_inventory_id, item_taken_inventory_id FROM adjustments WHERE id = $1",
      [id]
    );
    await sqlDb.execute("DELETE FROM adjustments WHERE id = $1", [id]);

    if (rows.length > 0) {
      const givenInvId = rows[0].item_given_inventory_id ?? rows[0].itemGivenInventoryId;
      const takenInvId = rows[0].item_taken_inventory_id ?? rows[0].itemTakenInventoryId;

      if (givenInvId) {
        await sqlDb.execute(
          "UPDATE inventory SET quantity = quantity + 1 WHERE id = $1",
          [givenInvId]
        );
        const soldSerials = await sqlDb.select<{ id: number }[]>(
          "SELECT id FROM inventory_serials WHERE inventory_id = $1 AND status = 'SOLD' ORDER BY id DESC LIMIT 1",
          [givenInvId]
        );
        if (soldSerials.length > 0) {
          await sqlDb.execute(
            "UPDATE inventory_serials SET status = 'AVAILABLE' WHERE id = $1",
            [soldSerials[0].id]
          );
        }
      }

      if (takenInvId) {
        await sqlDb.execute(
          "UPDATE inventory SET quantity = MAX(0, quantity - 1) WHERE id = $1",
          [takenInvId]
        );
        await sqlDb.execute(
          "DELETE FROM inventory_serials WHERE inventory_id = $1",
          [takenInvId]
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

    if (adj.itemTakenInventoryId) {
      const takenInv = memoryStore.inventory.find((i) => i.id === adj.itemTakenInventoryId);
      if (takenInv) {
        takenInv.quantity = Math.max(0, takenInv.quantity - 1);
      }
      const takenSerialIdx = memoryStore.serials.findIndex(
        (s) => s.inventoryId === adj.itemTakenInventoryId
      );
      if (takenSerialIdx !== -1) {
        memoryStore.serials.splice(takenSerialIdx, 1);
      }
    }

    memoryStore.adjustments.splice(idx, 1);
  }
}
