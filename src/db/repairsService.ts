import { isTauriEnvironment, memoryStore, getSqlDb } from "./client";
import { RepairTicketRecord, RepairStatus } from "./schema";
import { findOrCreateCustomer } from "./customerService";

export interface RepairPartUsed {
  name: string;
  cost: number;
  isHardware: boolean;
  inventoryId?: number;
}

export interface AddRepairInput {
  customerId?: number;
  customerName: string;
  customerPhone: string;
  device: string;
  reportedIssue: string;
  partsUsed?: RepairPartUsed[];
  laborCost?: number;
  estimatedCost?: number;
  status?: RepairStatus;
}

export async function getRepairTickets(): Promise<RepairTicketRecord[]> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    return await sqlDb.select<RepairTicketRecord[]>(
      "SELECT * FROM repairs ORDER BY created_at DESC"
    );
  }

  return [...memoryStore.repairs].sort((a, b) => b.createdAt - a.createdAt);
}

export async function addRepairTicket(ticket: AddRepairInput): Promise<string> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();
  const ticketNo = `RMA-${Math.floor(1000 + Math.random() * 9000)}`;
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

    // If hardware components from inventory were used, decrement stock
    for (const p of parts) {
      if (p.isHardware && p.inventoryId) {
        await sqlDb.execute(
          "UPDATE inventory SET quantity = MAX(0, quantity - 1) WHERE id = $1",
          [p.inventoryId]
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
      if (inv) inv.quantity = Math.max(0, inv.quantity - 1);
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
    await sqlDb.execute("DELETE FROM repairs WHERE id = $1", [id]);
    return;
  }

  const idx = memoryStore.repairs.findIndex((r) => r.id === id);
  if (idx !== -1) {
    memoryStore.repairs.splice(idx, 1);
  }
}
