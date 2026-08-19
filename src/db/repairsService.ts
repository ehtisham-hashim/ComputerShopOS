import { isTauriEnvironment, memoryStore, getSqlDb } from "./client";
import { RepairTicketRecord, RepairStatus, RepairPartUsed, AddRepairInput } from "./schema";
import { findOrCreateCustomer } from "./customerService";

export type { RepairPartUsed, AddRepairInput };

export async function getRepairTickets(): Promise<RepairTicketRecord[]> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    const rows = await sqlDb.select<any[]>(
      "SELECT * FROM repairs ORDER BY created_at DESC"
    );
    return rows.map((r) => ({
      id: Number(r.id),
      ticketNo: String(r.ticket_no || r.ticketNo || ""),
      customerId: r.customer_id != null ? Number(r.customer_id) : r.customerId != null ? Number(r.customerId) : null,
      customerName: String(r.customer_name || r.customerName || ""),
      customerPhone: String(r.customer_phone || r.customerPhone || ""),
      device: String(r.device || ""),
      reportedIssue: String(r.reported_issue || r.reportedIssue || ""),
      partsUsed: String(r.parts_used || r.partsUsed || "[]"),
      laborCost: Number(r.labor_cost ?? r.laborCost ?? 0),
      estimatedCost: Number(r.estimated_cost ?? r.estimatedCost ?? 0),
      finalCost: Number(r.final_cost ?? r.finalCost ?? 0),
      status: (r.status || "RECEIVED") as RepairStatus,
      createdAt: Number(r.created_at ?? r.createdAt ?? Math.floor(Date.now() / 1000)),
    }));
  }

  return [...memoryStore.repairs].sort((a, b) => b.createdAt - a.createdAt);
}

export async function addRepairTicket(ticket: AddRepairInput): Promise<string> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();
  const ticketNo = `RMA-${Date.now().toString().slice(-7)}`;
  const now = Math.floor(Date.now() / 1000);

  let custId = ticket.customerId;
  if (!custId && ticket.customerPhone) {
    custId = await findOrCreateCustomer(ticket.customerName, ticket.customerPhone);
  }

  const parts = ticket.partsUsed || [];
  const partsCost = parts.reduce((acc, p) => acc + (p.cost || 0), 0);
  const labor = ticket.laborCost || 0.0;
  const totalCost = partsCost + labor;
  const estCost = ticket.estimatedCost || totalCost;
  const partsJson = JSON.stringify(parts);

  if (isTauri && sqlDb) {
    await sqlDb.execute(
      `INSERT INTO repairs (
        ticket_no, customer_id, customer_name, customer_phone, device,
        reported_issue, parts_used, labor_cost, estimated_cost, final_cost, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        ticketNo,
        custId || null,
        ticket.customerName,
        ticket.customerPhone,
        ticket.device,
        ticket.reportedIssue,
        partsJson,
        labor,
        estCost,
        totalCost,
        ticket.status || "RECEIVED",
        now,
      ]
    );

    // If hardware components from inventory were used, decrement stock by specified quantity
    for (const p of parts) {
      if (p.isHardware && p.inventoryId) {
        const qty = p.quantity ?? 1;
        await sqlDb.execute(
          "UPDATE inventory SET quantity = MAX(0, quantity - $1) WHERE id = $2",
          [qty, p.inventoryId]
        );
      }
    }

    return ticketNo;
  }

  // Fallback
  const newTicket: RepairTicketRecord = {
    id: memoryStore.repairs.length + 1,
    ticketNo,
    customerId: custId || null,
    customerName: ticket.customerName,
    customerPhone: ticket.customerPhone,
    device: ticket.device,
    reportedIssue: ticket.reportedIssue,
    partsUsed: partsJson,
    laborCost: labor,
    estimatedCost: estCost,
    finalCost: totalCost,
    status: ticket.status || "RECEIVED",
    createdAt: now,
  };

  memoryStore.repairs.unshift(newTicket);

  for (const p of parts) {
    if (p.isHardware && p.inventoryId) {
      const inv = memoryStore.inventory.find((i) => i.id === p.inventoryId);
      if (inv) inv.quantity = Math.max(0, inv.quantity - (p.quantity ?? 1));
    }
  }

  return ticketNo;
}

export async function updateRepairStatus(
  id: number,
  status: RepairStatus,
  finalCost?: number
): Promise<void> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    if (finalCost !== undefined) {
      await sqlDb.execute(
        "UPDATE repairs SET status = $1, final_cost = $2 WHERE id = $3",
        [status, finalCost, id]
      );
    } else {
      await sqlDb.execute(
        "UPDATE repairs SET status = $1 WHERE id = $2",
        [status, id]
      );
    }
    return;
  }

  const found = memoryStore.repairs.find((r) => r.id === id);
  if (found) {
    found.status = status;
    if (finalCost !== undefined) found.finalCost = finalCost;
  }
}

export async function deleteRepairTicket(id: number): Promise<void> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    const rows = await sqlDb.select<any[]>(
      "SELECT parts_used FROM repairs WHERE id = $1",
      [id]
    );
    await sqlDb.execute("DELETE FROM repairs WHERE id = $1", [id]);
    const rawParts = rows.length > 0 ? (rows[0].parts_used ?? rows[0].partsUsed) : null;
    if (rawParts) {
      try {
        const parts: RepairPartUsed[] = JSON.parse(rawParts || "[]");
        for (const p of parts) {
          if (p.isHardware && p.inventoryId) {
            const qty = p.quantity ?? 1;
            await sqlDb.execute(
              "UPDATE inventory SET quantity = quantity + $1 WHERE id = $2",
              [qty, p.inventoryId]
            );
          }
        }
      } catch (err) {
        console.error("Failed to parse parts_used on delete:", err);
      }
    }
    return;
  }

  const idx = memoryStore.repairs.findIndex((r) => r.id === id);
  if (idx !== -1) {
    const ticket = memoryStore.repairs[idx];
    try {
      const parts: RepairPartUsed[] = JSON.parse(ticket.partsUsed || "[]");
      for (const p of parts) {
        if (p.isHardware && p.inventoryId) {
          const inv = memoryStore.inventory.find((i) => i.id === p.inventoryId);
          if (inv) {
            inv.quantity += (p.quantity ?? 1);
          }
        }
      }
    } catch (err) {
      console.error("Failed to restore memory inventory on repair delete:", err);
    }
    memoryStore.repairs.splice(idx, 1);
  }
}
