import { isTauriEnvironment, memoryStore, getSqlDb } from "./client";
import { Customer, NewCustomer, SaleRecord, RepairTicketRecord } from "./schema";

export async function getCustomers(): Promise<Customer[]> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    return await sqlDb.select<Customer[]>("SELECT * FROM customers ORDER BY created_at DESC");
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
    const custSales = await sqlDb.select<SaleRecord[]>(
      "SELECT * FROM sales WHERE customer_id = $1 ORDER BY created_at DESC",
      [customerId]
    );
    const custRepairs = await sqlDb.select<RepairTicketRecord[]>(
      "SELECT * FROM repairs WHERE customer_id = $1 ORDER BY created_at DESC",
      [customerId]
    );

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
