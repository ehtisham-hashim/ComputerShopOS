import { isTauriEnvironment, memoryStore, getSqlDb } from "./client";
import { Customer, NewCustomer, SaleRecord, RepairTicketRecord } from "./schema";

export async function getCustomers(): Promise<Customer[]> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    const rows = await sqlDb.select<any[]>("SELECT * FROM customers ORDER BY created_at DESC");
    return rows.map((r) => ({
      id: Number(r.id),
      name: String(r.name || ""),
      phone: String(r.phone || ""),
      email: r.email ? String(r.email) : "",
      address: r.address ? String(r.address) : "",
      notes: r.notes ? String(r.notes) : "",
      createdAt: Number(r.created_at ?? r.createdAt ?? Math.floor(Date.now() / 1000)),
    }));
  }

  return [...memoryStore.customers].sort((a, b) => b.createdAt - a.createdAt);
}

export async function addCustomer(cust: NewCustomer): Promise<number> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();
  const now = Math.floor(Date.now() / 1000);

  if (isTauri && sqlDb) {
    const res = await sqlDb.execute(
      `INSERT INTO customers (name, phone, email, address, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [cust.name.trim(), cust.phone.trim(), cust.email?.trim() || "", cust.address?.trim() || "", cust.notes?.trim() || "", now]
    );
    return Number(res.lastInsertId) || 1;
  }

  const newId = memoryStore.customers.length > 0 ? Math.max(...memoryStore.customers.map((c) => c.id)) + 1 : 1;
  const newCust: Customer = {
    id: newId,
    name: cust.name.trim(),
    phone: cust.phone.trim(),
    email: cust.email?.trim() || "",
    address: cust.address?.trim() || "",
    notes: cust.notes?.trim() || "",
    createdAt: now,
  };
  memoryStore.customers.unshift(newCust);
  return newId;
}

export async function findOrCreateCustomer(name: string, phone: string, address = ""): Promise<number> {
  const trimmedPhone = phone.trim();
  const trimmedName = name.trim();
  if (!trimmedPhone) return 0;

  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    const existing = await sqlDb.select<Customer[]>(
      "SELECT * FROM customers WHERE phone = $1 LIMIT 1",
      [trimmedPhone]
    );

    if (existing && existing.length > 0) {
      return existing[0].id;
    }

    const res = await sqlDb.execute(
      `INSERT INTO customers (name, phone, email, address, notes, created_at)
       VALUES ($1, $2, '', $3, '', $4)`,
      [trimmedName || "Customer", trimmedPhone, address.trim(), Math.floor(Date.now() / 1000)]
    );
    return Number(res.lastInsertId) || 1;
  }

  const found = memoryStore.customers.find((c) => c.phone === trimmedPhone);
  if (found) return found.id;

  const newId = memoryStore.customers.length > 0 ? Math.max(...memoryStore.customers.map((c) => c.id)) + 1 : 1;
  memoryStore.customers.unshift({
    id: newId,
    name: trimmedName || "Customer",
    phone: trimmedPhone,
    email: "",
    address: address.trim(),
    notes: "",
    createdAt: Math.floor(Date.now() / 1000),
  });
  return newId;
}

export async function getCustomerHistory(customerId: number): Promise<{
  sales: SaleRecord[];
  repairs: RepairTicketRecord[];
  totalSpent: number;
}> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    const rawSales = await sqlDb.select<any[]>(
      "SELECT * FROM sales WHERE customer_id = $1 ORDER BY created_at DESC",
      [customerId]
    );
    const custSales: SaleRecord[] = rawSales.map((r) => ({
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
      paymentStatus: (r.payment_status || r.paymentStatus || "PAID"),
      balanceDue: Number(r.balance_due ?? r.balanceDue ?? 0),
      paymentMethod: (r.payment_method || r.paymentMethod || "CASH"),
      notes: String(r.notes || ""),
      isBadDebt: Number(r.is_bad_debt || r.isBadDebt || 0),
      dueDate: r.due_date ? Number(r.due_date) : r.dueDate ? Number(r.dueDate) : null,
      createdAt: Number(r.created_at ?? r.createdAt ?? Math.floor(Date.now() / 1000)),
    }));

    const rawRepairs = await sqlDb.select<any[]>(
      "SELECT * FROM repairs WHERE customer_id = $1 ORDER BY created_at DESC",
      [customerId]
    );
    const custRepairs: RepairTicketRecord[] = rawRepairs.map((r) => ({
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
      status: r.status || "RECEIVED",
      createdAt: Number(r.created_at ?? r.createdAt ?? Math.floor(Date.now() / 1000)),
    }));

    const totalSpent = custSales.reduce((acc, s) => acc + s.totalAmount, 0);
    return { sales: custSales, repairs: custRepairs, totalSpent };
  }

  const custSales = memoryStore.sales.filter((s) => s.customerId === customerId);
  const custRepairs = memoryStore.repairs.filter((r) => r.customerId === customerId);
  const totalSpent = custSales.reduce((acc, s) => acc + s.totalAmount, 0);
  return { sales: custSales, repairs: custRepairs, totalSpent };
}

export async function deleteCustomer(id: number): Promise<void> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    await sqlDb.execute("DELETE FROM customers WHERE id = $1", [id]);
    return;
  }

  const idx = memoryStore.customers.findIndex((c) => c.id === id);
  if (idx !== -1) {
    memoryStore.customers.splice(idx, 1);
  }
}
