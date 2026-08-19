import { isTauriEnvironment, memoryStore, getSqlDb } from "./client";
import { SaleRecord, SaleLineItem, PaymentMethod, PaymentStatus, CreateSaleInput } from "./schema";
import { findOrCreateCustomer } from "./customerService";

export type { CreateSaleInput };

export async function createSaleTransaction(input: CreateSaleInput): Promise<string> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();
  const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
  const now = Math.floor(Date.now() / 1000);

  const paid = input.paidAmount !== undefined ? Number(input.paidAmount) : input.totalAmount;
  const balanceDue = Math.max(0, input.totalAmount - paid);
  let paymentStatus: PaymentStatus = "PAID";
  if (input.totalAmount > 0 && paid <= 0) {
    paymentStatus = "UNPAID";
  } else if (paid < input.totalAmount) {
    paymentStatus = "PARTIAL";
  }

  let custId = input.customerId;
  if (!custId && input.customerPhone) {
    custId = await findOrCreateCustomer(
      input.customerName || "Customer",
      input.customerPhone,
      input.customerAddress || ""
    );
  }

  if (isTauri && sqlDb) {
    // 1. Insert Sales Header
    const saleRes = await sqlDb.execute(
      `INSERT INTO sales (
        invoice_no, customer_id, customer_name, customer_phone,
        subtotal, discount, tax, total_amount, paid_amount,
        payment_status, balance_due, payment_method, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        invoiceNo,
        custId || null,
        input.customerName || "Walk-in Customer",
        input.customerPhone || "",
        input.subtotal,
        input.discount || 0.0,
        input.tax || 0.0,
        input.totalAmount,
        paid,
        paymentStatus,
        balanceDue,
        input.paymentMethod,
        input.notes || "",
        now,
      ]
    );

    let saleId = Number(saleRes.lastInsertId);
    if (!saleId || saleId <= 0) {
      const found = await sqlDb.select<{ id: number }[]>(
        "SELECT id FROM sales WHERE invoice_no = $1 LIMIT 1",
        [invoiceNo]
      );
      if (found.length > 0) {
        saleId = found[0].id;
      }
    }

    // 2. Insert Line Items & Deduct Inventory
    for (const item of input.items) {
      const lineTotal = item.unitPrice * item.quantity;
      await sqlDb.execute(
        `INSERT INTO sale_items (sale_id, inventory_id, item_name, serial_number, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [saleId, item.inventoryId, item.itemName, item.serialNumber || null, item.quantity, item.unitPrice, lineTotal]
      );

      // Decrement stock in inventory
      await sqlDb.execute(
        `UPDATE inventory SET quantity = MAX(0, quantity - $1) WHERE id = $2`,
        [item.quantity, item.inventoryId]
      );

      // If serial number was specified, mark it SOLD; otherwise mark available serials for this inventory item
      if (item.serialNumber) {
        await sqlDb.execute(
          `UPDATE inventory_serials SET status = 'SOLD' WHERE serial_number = $1`,
          [item.serialNumber]
        );
      } else {
        const availableSerials = await sqlDb.select<{ id: number }[]>(
          `SELECT id FROM inventory_serials WHERE inventory_id = $1 AND status = 'AVAILABLE' LIMIT $2`,
          [item.inventoryId, item.quantity]
        );
        for (const s of availableSerials) {
          await sqlDb.execute(
            `UPDATE inventory_serials SET status = 'SOLD' WHERE id = $1`,
            [s.id]
          );
        }
      }
    }

    return invoiceNo;
  }

  // Browser Fallback
  const newSaleId = memoryStore.sales.length > 0 ? Math.max(...memoryStore.sales.map((s) => s.id)) + 1 : 1;
  const newSale: SaleRecord = {
    id: newSaleId,
    invoiceNo,
    customerId: custId || null,
    customerName: input.customerName || "Walk-in Customer",
    customerPhone: input.customerPhone || "",
    subtotal: input.subtotal,
    discount: input.discount || 0.0,
    tax: input.tax || 0.0,
    totalAmount: input.totalAmount,
    paidAmount: paid,
    paymentStatus,
    balanceDue,
    paymentMethod: input.paymentMethod,
    notes: input.notes || "",
    createdAt: now,
  };

  memoryStore.sales.unshift(newSale);

  for (const item of input.items) {
    const lineTotal = item.unitPrice * item.quantity;
    const newItemId = memoryStore.saleItems.length > 0 ? Math.max(...memoryStore.saleItems.map((si) => si.id)) + 1 : 1;
    memoryStore.saleItems.push({
      id: newItemId,
      saleId: newSaleId,
      inventoryId: item.inventoryId,
      itemName: item.itemName,
      serialNumber: item.serialNumber || null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: lineTotal,
    });

    const inv = memoryStore.inventory.find((i) => i.id === item.inventoryId);
    if (inv) {
      inv.quantity = Math.max(0, inv.quantity - item.quantity);
    }

    if (item.serialNumber) {
      const serial = memoryStore.serials.find(
        (s) => s.serialNumber.toUpperCase() === item.serialNumber!.toUpperCase()
      );
      if (serial) serial.status = "SOLD";
    } else {
      let qtyToMark = item.quantity;
      for (const s of memoryStore.serials) {
        if (s.inventoryId === item.inventoryId && s.status === "AVAILABLE" && qtyToMark > 0) {
          s.status = "SOLD";
          qtyToMark--;
        }
      }
    }
  }

  return invoiceNo;
}

export async function getRecentSales(limit = 100): Promise<SaleRecord[]> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    const rows = await sqlDb.select<any[]>(
      `SELECT * FROM sales ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return rows.map((r) => ({
      id: Number(r.id),
      invoiceNo: String(r.invoice_no || r.invoiceNo || ""),
      customerId: r.customer_id != null ? Number(r.customer_id) : r.customerId != null ? Number(r.customerId) : null,
      customerName: String(r.customer_name || r.customerName || "Walk-in Customer"),
      customerPhone: String(r.customer_phone || r.customerPhone || ""),
      subtotal: Number(r.subtotal) || 0,
      discount: Number(r.discount) || 0,
      tax: Number(r.tax) || 0,
      totalAmount: Number(r.total_amount ?? r.totalAmount ?? 0),
      paidAmount: Number(r.paid_amount ?? r.paidAmount ?? (r.total_amount ?? r.totalAmount ?? 0)),
      paymentStatus: (r.payment_status || r.paymentStatus || "PAID") as PaymentStatus,
      balanceDue: Number(r.balance_due ?? r.balanceDue ?? 0),
      paymentMethod: (r.payment_method || r.paymentMethod || "CASH") as PaymentMethod,
      notes: String(r.notes || ""),
      createdAt: Number(r.created_at ?? r.createdAt ?? Math.floor(Date.now() / 1000)),
    }));
  }

  return [...memoryStore.sales].slice(0, limit);
}

export async function getSaleItems(saleId: number): Promise<SaleLineItem[]> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    const rows = await sqlDb.select<any[]>(
      `SELECT * FROM sale_items WHERE sale_id = $1`,
      [saleId]
    );
    return rows.map((r) => ({
      id: Number(r.id),
      saleId: Number(r.sale_id ?? r.saleId),
      inventoryId: Number(r.inventory_id ?? r.inventoryId),
      itemName: String(r.item_name || r.itemName || ""),
      serialNumber: r.serial_number || r.serialNumber || undefined,
      quantity: Number(r.quantity) || 1,
      unitPrice: Number(r.unit_price ?? r.unitPrice ?? 0),
      totalPrice: Number(r.total_price ?? r.totalPrice ?? 0),
    }));
  }

  return memoryStore.saleItems.filter((i) => i.saleId === saleId);
}

export async function deleteSale(id: number): Promise<void> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    // 1. Fetch sale items to restore inventory and serials
    const items = await sqlDb.select<any[]>(
      "SELECT inventory_id, quantity, serial_number FROM sale_items WHERE sale_id = $1",
      [id]
    );

    for (const item of items) {
      const invId = Number(item.inventory_id ?? item.inventoryId);
      const qty = Number(item.quantity) || 1;
      const serial = item.serial_number ?? item.serialNumber;

      if (invId) {
        await sqlDb.execute(
          "UPDATE inventory SET quantity = quantity + $1 WHERE id = $2",
          [qty, invId]
        );
      }

      if (serial) {
        await sqlDb.execute(
          "UPDATE inventory_serials SET status = 'AVAILABLE' WHERE serial_number = $1",
          [serial]
        );
      } else if (invId) {
        const soldSerials = await sqlDb.select<{ id: number }[]>(
          "SELECT id FROM inventory_serials WHERE inventory_id = $1 AND status = 'SOLD' ORDER BY id DESC LIMIT $2",
          [invId, qty]
        );
        for (const s of soldSerials) {
          await sqlDb.execute(
            "UPDATE inventory_serials SET status = 'AVAILABLE' WHERE id = $1",
            [s.id]
          );
        }
      }
    }

    // 2. Delete sale line items and sale header
    await sqlDb.execute("DELETE FROM sale_items WHERE sale_id = $1", [id]);
    await sqlDb.execute("DELETE FROM sales WHERE id = $1", [id]);
    return;
  }

  // Fallback memory store
  const items = memoryStore.saleItems.filter((si) => si.saleId === id);
  for (const item of items) {
    const inv = memoryStore.inventory.find((i) => i.id === item.inventoryId);
    if (inv) {
      inv.quantity += item.quantity;
    }
    if (item.serialNumber) {
      const serial = memoryStore.serials.find(
        (s) => s.serialNumber.toUpperCase() === item.serialNumber!.toUpperCase()
      );
      if (serial) serial.status = "AVAILABLE";
    } else {
      let qtyToRestore = item.quantity;
      for (const s of memoryStore.serials) {
        if (s.inventoryId === item.inventoryId && s.status === "SOLD" && qtyToRestore > 0) {
          s.status = "AVAILABLE";
          qtyToRestore--;
        }
      }
    }
  }
  memoryStore.saleItems = memoryStore.saleItems.filter((si) => si.saleId !== id);

  const idx = memoryStore.sales.findIndex((s) => s.id === id);
  if (idx !== -1) {
    memoryStore.sales.splice(idx, 1);
  }
}

export const deleteSaleTransaction = deleteSale;
