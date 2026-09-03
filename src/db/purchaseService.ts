import { isTauriEnvironment, memoryStore, getSqlDb } from "./client";
import {
  PurchaseRecord,
  PurchaseItemRecord,
  CreatePurchaseInput,
  PurchaseStatus,
  ItemTitle,
} from "./schema";
import { getPayablePartyById, recalculatePartyLedger } from "./payablesService";
import { addInventoryItem, getInventoryItems } from "./inventoryService";

export type PurchaseWithItems = PurchaseRecord & {
  items: PurchaseItemRecord[];
};

/**
 * Generate a collision-proof sequential Purchase Number in format PUR-YYYY-XXX
 */
export async function getNextPurchaseNo(): Promise<string> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();
  const year = new Date().getFullYear();
  const prefixYear = `PUR-${year}-`;

  let maxSeq = 0;

  if (isTauri && sqlDb) {
    try {
      const rows = await sqlDb.select<{ purchase_no: string }[]>(
        `SELECT purchase_no FROM purchases WHERE purchase_no LIKE $1`,
        [`${prefixYear}%`]
      );
      for (const row of rows) {
        const parts = (row.purchase_no || "").split("-");
        if (parts.length >= 3) {
          const num = parseInt(parts[2], 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
    } catch (e) {
      console.error("Failed to query purchase sequence in SQLite:", e);
    }
  }

  for (const p of memoryStore.purchases) {
    if ((p.purchaseNo || "").startsWith(prefixYear)) {
      const parts = (p.purchaseNo || "").split("-");
      if (parts.length >= 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  }

  let candidate = maxSeq + 1;
  let finalPurchaseNo = `${prefixYear}${String(candidate).padStart(3, "0")}`;

  if (isTauri && sqlDb) {
    while (true) {
      try {
        const check = await sqlDb.select<{ count: number }[]>(
          `SELECT COUNT(*) as count FROM purchases WHERE purchase_no = $1`,
          [finalPurchaseNo]
        );
        if (check && check[0] && check[0].count > 0) {
          candidate++;
          finalPurchaseNo = `${prefixYear}${String(candidate).padStart(3, "0")}`;
        } else {
          break;
        }
      } catch {
        break;
      }
    }
  }

  return finalPurchaseNo;
}

/**
 * Creates a multi-item purchase bill, updates inventory stock (if RECEIVED),
 * and automatically logs Khata entries for the supplier.
 */
export async function createPurchase(input: CreatePurchaseInput): Promise<PurchaseWithItems> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();
  const now = Math.floor(Date.now() / 1000);
  const purchaseDate = input.purchaseDate || now;
  const status: PurchaseStatus = input.status || "RECEIVED";

  // Validate supplier
  const party = await getPayablePartyById(input.partyId);
  const partyName = input.partyName?.trim() || party?.name || `Supplier #${input.partyId}`;

  // Validate items
  if (!input.items || input.items.length === 0) {
    throw new Error("A purchase must have at least one line item.");
  }

  // Generate Purchase No
  const purchaseNo = await getNextPurchaseNo();
  const refNo = input.refNo?.trim() || purchaseNo;

  // Compute item totals
  let totalAmount = 0;
  const preparedItems = input.items.map((it, idx) => {
    const quantity = Math.max(1, Math.round(Number(it.quantity) || 1));
    const costPrice = Math.max(0, Math.round(Number(it.costPrice) || 0));
    const sellPrice = Math.max(0, Math.round(Number(it.sellPrice) || 0));
    const totalCost = quantity * costPrice;
    totalAmount += totalCost;

    const sku =
      it.sku?.trim() ||
      `${(it.title || "ITEM").slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-5)}-${idx + 1}`;

    return {
      inventoryId: it.inventoryId || null,
      title: it.title || ("LAPTOP" as ItemTitle),
      itemName: it.itemName.trim(),
      sku,
      quantity,
      costPrice,
      sellPrice,
      totalCost,
    };
  });

  const paidAmount = Math.max(0, Math.min(totalAmount, Math.round(Number(input.paidAmount) || 0)));
  const balanceDue = Math.max(0, totalAmount - paidAmount);

  // Load current inventory list to resolve or link items if needed
  const inventoryList = await getInventoryItems();

  let createdPurchaseId = 0;
  const createdLineItems: PurchaseItemRecord[] = [];

  if (isTauri && sqlDb) {
    // 1. Insert Purchase
    const pRes = await sqlDb.execute(
      `INSERT INTO purchases (purchase_no, party_id, party_name, ref_no, purchase_date, total_amount, paid_amount, balance_due, status, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        purchaseNo,
        input.partyId,
        partyName,
        refNo,
        purchaseDate,
        totalAmount,
        paidAmount,
        balanceDue,
        status,
        input.notes?.trim() || "",
        now,
      ]
    );
    createdPurchaseId = Number(pRes.lastInsertId) || 1;

    // 2. Insert Line Items & update Inventory (if RECEIVED)
    for (const item of preparedItems) {
      let linkedInventoryId = item.inventoryId;

      if (status === "RECEIVED") {
        if (linkedInventoryId) {
          // Increment existing inventory item
          await sqlDb.execute(
            `UPDATE inventory 
             SET quantity = quantity + $1, 
                 cost_price = $2, 
                 price = CASE WHEN $3 > 0 THEN $3 ELSE price END 
             WHERE id = $4`,
            [item.quantity, item.costPrice, item.sellPrice, linkedInventoryId]
          );
        } else {
          // Check if item with same SKU or same title & name exists
          const existing = inventoryList.find(
            (inv) =>
              (item.sku && inv.sku.toLowerCase() === item.sku.toLowerCase()) ||
              (inv.title === item.title && inv.name.toLowerCase() === item.itemName.toLowerCase())
          );

          if (existing) {
            linkedInventoryId = existing.id;
            await sqlDb.execute(
              `UPDATE inventory 
               SET quantity = quantity + $1, 
                   cost_price = $2, 
                   price = CASE WHEN $3 > 0 THEN $3 ELSE price END 
               WHERE id = $4`,
              [item.quantity, item.costPrice, item.sellPrice, existing.id]
            );
          } else {
            // Add new inventory item
            linkedInventoryId = await addInventoryItem({
              title: item.title,
              name: item.itemName,
              sku: item.sku,
              quantity: item.quantity,
              costPrice: item.costPrice,
              price: item.sellPrice > 0 ? item.sellPrice : item.costPrice,
              isSerialized: 0,
            });
          }
        }
      }

      const itemRes = await sqlDb.execute(
        `INSERT INTO purchase_items (purchase_id, inventory_id, title, item_name, sku, quantity, cost_price, sell_price, total_cost)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          createdPurchaseId,
          linkedInventoryId,
          item.title,
          item.itemName,
          item.sku,
          item.quantity,
          item.costPrice,
          item.sellPrice,
          item.totalCost,
        ]
      );

      createdLineItems.push({
        id: Number(itemRes.lastInsertId) || 1,
        purchaseId: createdPurchaseId,
        inventoryId: linkedInventoryId,
        title: item.title,
        itemName: item.itemName,
        sku: item.sku,
        quantity: item.quantity,
        costPrice: item.costPrice,
        sellPrice: item.sellPrice,
        totalCost: item.totalCost,
      });
    }

    // 3. Supplier Khata Ledger Entries
    const itemsSummary = preparedItems.map((i) => `${i.itemName} (x${i.quantity})`).join(", ");
    const purchaseDesc = `Purchase ${purchaseNo}: ${itemsSummary}`.slice(0, 200);

    // Bill Credit
    await sqlDb.execute(
      `INSERT INTO payable_ledger (party_id, tx_date, tx_type, ref_no, description, debit, credit, balance, created_at)
       VALUES ($1, $2, 'PURCHASE', $3, $4, 0, $5, 0, $6)`,
      [input.partyId, purchaseDate, refNo, purchaseDesc, totalAmount, now]
    );

    // Upfront Payment Debit (if any)
    if (paidAmount > 0) {
      await sqlDb.execute(
        `INSERT INTO payable_ledger (party_id, tx_date, tx_type, ref_no, description, debit, credit, balance, created_at)
         VALUES ($1, $2, 'PAYMENT', $3, $4, $5, 0, 0, $6)`,
        [input.partyId, purchaseDate, `PAY-${purchaseNo}`, `Payment for ${purchaseNo}`, paidAmount, now]
      );
    }

    // 4. Recalculate Supplier's Ledger & running balances
    await recalculatePartyLedger(input.partyId);
  } else {
    // Browser Memory Store Fallback
    createdPurchaseId = memoryStore.purchases.length > 0
      ? Math.max(...memoryStore.purchases.map((p) => p.id)) + 1
      : 1;

    for (const item of preparedItems) {
      let linkedInventoryId = item.inventoryId;

      if (status === "RECEIVED") {
        if (linkedInventoryId) {
          const inv = memoryStore.inventory.find((i) => i.id === linkedInventoryId);
          if (inv) {
            inv.quantity += item.quantity;
            inv.costPrice = item.costPrice;
            if (item.sellPrice > 0) inv.price = item.sellPrice;
          }
        } else {
          const existing = memoryStore.inventory.find(
            (inv) =>
              (item.sku && inv.sku.toLowerCase() === item.sku.toLowerCase()) ||
              (inv.title === item.title && inv.name.toLowerCase() === item.itemName.toLowerCase())
          );
          if (existing) {
            linkedInventoryId = existing.id;
            existing.quantity += item.quantity;
            existing.costPrice = item.costPrice;
            if (item.sellPrice > 0) existing.price = item.sellPrice;
          } else {
            linkedInventoryId = await addInventoryItem({
              title: item.title,
              name: item.itemName,
              sku: item.sku,
              quantity: item.quantity,
              costPrice: item.costPrice,
              price: item.sellPrice > 0 ? item.sellPrice : item.costPrice,
              isSerialized: 0,
            });
          }
        }
      }

      const newItemId = memoryStore.purchaseItems.length > 0
        ? Math.max(...memoryStore.purchaseItems.map((pi) => pi.id)) + 1
        : 1;

      const lineRec: PurchaseItemRecord = {
        id: newItemId,
        purchaseId: createdPurchaseId,
        inventoryId: linkedInventoryId,
        title: item.title,
        itemName: item.itemName,
        sku: item.sku,
        quantity: item.quantity,
        costPrice: item.costPrice,
        sellPrice: item.sellPrice,
        totalCost: item.totalCost,
      };

      memoryStore.purchaseItems.push(lineRec);
      createdLineItems.push(lineRec);
    }

    const purchaseRec: PurchaseRecord = {
      id: createdPurchaseId,
      purchaseNo,
      partyId: input.partyId,
      partyName,
      refNo,
      purchaseDate,
      totalAmount,
      paidAmount,
      balanceDue,
      status,
      notes: input.notes?.trim() || "",
      createdAt: now,
    };

    memoryStore.purchases.unshift(purchaseRec);

    // Ledger entries
    const itemsSummary = preparedItems.map((i) => `${i.itemName} (x${i.quantity})`).join(", ");
    const purchaseDesc = `Purchase ${purchaseNo}: ${itemsSummary}`.slice(0, 200);

    const purchaseEntryId = memoryStore.payableLedger.length > 0
      ? Math.max(...memoryStore.payableLedger.map((l) => l.id)) + 1
      : 1;

    memoryStore.payableLedger.push({
      id: purchaseEntryId,
      partyId: input.partyId,
      txDate: purchaseDate,
      txType: "PURCHASE",
      refNo,
      description: purchaseDesc,
      debit: 0,
      credit: totalAmount,
      balance: 0,
      createdAt: now,
    });

    if (paidAmount > 0) {
      memoryStore.payableLedger.push({
        id: purchaseEntryId + 1,
        partyId: input.partyId,
        txDate: purchaseDate,
        txType: "PAYMENT",
        refNo: `PAY-${purchaseNo}`,
        description: `Payment for ${purchaseNo}`,
        debit: paidAmount,
        credit: 0,
        balance: 0,
        createdAt: now,
      });
    }

    await recalculatePartyLedger(input.partyId);
  }

  return {
    id: createdPurchaseId,
    purchaseNo,
    partyId: input.partyId,
    partyName,
    refNo,
    purchaseDate,
    totalAmount,
    paidAmount,
    balanceDue,
    status,
    notes: input.notes?.trim() || "",
    createdAt: now,
    items: createdLineItems,
  };
}

/**
 * Get all purchases with line items, optionally filtered by partyId.
 */
export async function getPurchases(partyId?: number): Promise<PurchaseWithItems[]> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    try {
      const pQuery = partyId
        ? "SELECT * FROM purchases WHERE party_id = $1 ORDER BY purchase_date DESC, id DESC"
        : "SELECT * FROM purchases ORDER BY purchase_date DESC, id DESC";
      const pParams = partyId ? [partyId] : [];
      const pRows = await sqlDb.select<any[]>(pQuery, pParams);

      if (!pRows || pRows.length === 0) return [];

      const pIds = pRows.map((r) => Number(r.id));
      const iRows = await sqlDb.select<any[]>(
        `SELECT * FROM purchase_items WHERE purchase_id IN (${pIds.map(() => "?").join(",")})`,
        pIds
      );

      const itemsByPurchaseId = new Map<number, PurchaseItemRecord[]>();
      for (const ir of iRows) {
        const pid = Number(ir.purchase_id ?? ir.purchaseId);
        if (!itemsByPurchaseId.has(pid)) itemsByPurchaseId.set(pid, []);
        itemsByPurchaseId.get(pid)!.push({
          id: Number(ir.id),
          purchaseId: pid,
          inventoryId: ir.inventory_id ? Number(ir.inventory_id) : null,
          title: ir.title,
          itemName: String(ir.item_name || ir.itemName || ""),
          sku: String(ir.sku || ""),
          quantity: Math.round(Number(ir.quantity) || 1),
          costPrice: Math.round(Number(ir.cost_price ?? ir.costPrice ?? 0)),
          sellPrice: Math.round(Number(ir.sell_price ?? ir.sellPrice ?? 0)),
          totalCost: Math.round(Number(ir.total_cost ?? ir.totalCost ?? 0)),
        });
      }

      return pRows.map((r) => {
        const id = Number(r.id);
        return {
          id,
          purchaseNo: String(r.purchase_no || r.purchaseNo || ""),
          partyId: Number(r.party_id ?? r.partyId),
          partyName: String(r.party_name || r.partyName || ""),
          refNo: String(r.ref_no || r.refNo || ""),
          purchaseDate: Number(r.purchase_date ?? r.purchaseDate),
          totalAmount: Math.round(Number(r.total_amount ?? r.totalAmount ?? 0)),
          paidAmount: Math.round(Number(r.paid_amount ?? r.paidAmount ?? 0)),
          balanceDue: Math.round(Number(r.balance_due ?? r.balanceDue ?? 0)),
          status: (r.status || "RECEIVED") as PurchaseStatus,
          notes: String(r.notes || ""),
          createdAt: Number(r.created_at ?? r.createdAt ?? Math.floor(Date.now() / 1000)),
          items: itemsByPurchaseId.get(id) || [],
        };
      });
    } catch (e) {
      console.error("Failed to query purchases from SQLite:", e);
    }
  }

  return memoryStore.purchases
    .filter((p) => (partyId ? p.partyId === partyId : true))
    .sort((a, b) => b.purchaseDate - a.purchaseDate || b.id - a.id)
    .map((p) => ({
      ...p,
      items: memoryStore.purchaseItems.filter((it) => it.purchaseId === p.id),
    }));
}

/**
 * Get a specific purchase by ID with its line items.
 */
export async function getPurchaseById(id: number): Promise<PurchaseWithItems | null> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    try {
      const rows = await sqlDb.select<any[]>("SELECT * FROM purchases WHERE id = $1", [id]);
      if (!rows || rows.length === 0) return null;
      const r = rows[0];

      const itemRows = await sqlDb.select<any[]>(
        "SELECT * FROM purchase_items WHERE purchase_id = $1 ORDER BY id ASC",
        [id]
      );

      const items: PurchaseItemRecord[] = itemRows.map((ir) => ({
        id: Number(ir.id),
        purchaseId: id,
        inventoryId: ir.inventory_id ? Number(ir.inventory_id) : null,
        title: ir.title,
        itemName: String(ir.item_name || ir.itemName || ""),
        sku: String(ir.sku || ""),
        quantity: Math.round(Number(ir.quantity) || 1),
        costPrice: Math.round(Number(ir.cost_price ?? ir.costPrice ?? 0)),
        sellPrice: Math.round(Number(ir.sell_price ?? ir.sellPrice ?? 0)),
        totalCost: Math.round(Number(ir.total_cost ?? ir.totalCost ?? 0)),
      }));

      return {
        id: Number(r.id),
        purchaseNo: String(r.purchase_no || r.purchaseNo || ""),
        partyId: Number(r.party_id ?? r.partyId),
        partyName: String(r.party_name || r.partyName || ""),
        refNo: String(r.ref_no || r.refNo || ""),
        purchaseDate: Number(r.purchase_date ?? r.purchaseDate),
        totalAmount: Math.round(Number(r.total_amount ?? r.totalAmount ?? 0)),
        paidAmount: Math.round(Number(r.paid_amount ?? r.paidAmount ?? 0)),
        balanceDue: Math.round(Number(r.balance_due ?? r.balanceDue ?? 0)),
        status: (r.status || "RECEIVED") as PurchaseStatus,
        notes: String(r.notes || ""),
        createdAt: Number(r.created_at ?? r.createdAt ?? Math.floor(Date.now() / 1000)),
        items,
      };
    } catch (e) {
      console.error("Failed to query purchase by id from SQLite:", e);
    }
  }

  const found = memoryStore.purchases.find((p) => p.id === id);
  if (!found) return null;

  return {
    ...found,
    items: memoryStore.purchaseItems.filter((it) => it.purchaseId === id),
  };
}

/**
 * Deletes a purchase record, reverts inventory stock (if RECEIVED),
 * deletes linked Khata ledger transactions, and recalculates the supplier's balance.
 */
export async function deletePurchase(purchaseId: number): Promise<void> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  const purchase = await getPurchaseById(purchaseId);
  if (!purchase) return;

  const { partyId, purchaseNo, refNo, status, items } = purchase;

  if (isTauri && sqlDb) {
    // 1. If stock was received, revert inventory quantity
    if (status === "RECEIVED") {
      for (const it of items) {
        if (it.inventoryId) {
          await sqlDb.execute(
            "UPDATE inventory SET quantity = MAX(0, quantity - $1) WHERE id = $2",
            [it.quantity, it.inventoryId]
          );
        }
      }
    }

    // 2. Remove ledger entries referencing this purchase
    await sqlDb.execute(
      `DELETE FROM payable_ledger 
       WHERE party_id = $1 
         AND (ref_no = $2 OR ref_no = $3 OR ref_no = $4 OR description LIKE $5)`,
      [
        partyId,
        refNo,
        purchaseNo,
        `PAY-${purchaseNo}`,
        `%${purchaseNo}%`,
      ]
    );

    // 3. Delete purchase items & purchase
    await sqlDb.execute("DELETE FROM purchase_items WHERE purchase_id = $1", [purchaseId]);
    await sqlDb.execute("DELETE FROM purchases WHERE id = $1", [purchaseId]);

    // 4. Recalculate supplier's Khata
    await recalculatePartyLedger(partyId);
  } else {
    // Memory store fallback
    if (status === "RECEIVED") {
      for (const it of items) {
        if (it.inventoryId) {
          const inv = memoryStore.inventory.find((i) => i.id === it.inventoryId);
          if (inv) {
            inv.quantity = Math.max(0, inv.quantity - it.quantity);
          }
        }
      }
    }

    memoryStore.payableLedger = memoryStore.payableLedger.filter(
      (l) =>
        !(
          l.partyId === partyId &&
          (l.refNo === refNo ||
            l.refNo === purchaseNo ||
            l.refNo === `PAY-${purchaseNo}` ||
            l.description.includes(purchaseNo))
        )
    );

    memoryStore.purchaseItems = memoryStore.purchaseItems.filter((it) => it.purchaseId !== purchaseId);
    memoryStore.purchases = memoryStore.purchases.filter((p) => p.id !== purchaseId);

    await recalculatePartyLedger(partyId);
  }
}
