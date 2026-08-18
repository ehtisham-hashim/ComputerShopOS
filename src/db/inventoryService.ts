import { getSqlDb, getMemoryStore, isTauriEnvironment } from "./client";
import { InventoryItem, NewInventoryItem } from "./schema";

export async function getInventoryItems(): Promise<InventoryItem[]> {
  const sqlDb = await getSqlDb();

  if (isTauriEnvironment() && sqlDb) {
    const rows = await sqlDb.select<any[]>(
      `SELECT id, title, name, sku, quantity, price, created_at as createdAt 
       FROM inventory 
       ORDER BY id DESC`
    );
    return rows.map((r) => ({
      id: Number(r.id),
      title: r.title,
      name: r.name,
      sku: r.sku,
      quantity: Number(r.quantity),
      price: Number(r.price),
      createdAt: Number(r.createdAt || r.created_at),
    }));
  }

  // Memory store fallback
  return [...getMemoryStore()].sort((a, b) => b.id - a.id);
}

export async function addInventoryItem(item: Omit<NewInventoryItem, "id" | "createdAt">): Promise<InventoryItem> {
  const sqlDb = await getSqlDb();
  const createdAt = Math.floor(Date.now() / 1000);

  if (isTauriEnvironment() && sqlDb) {
    const result = await sqlDb.execute(
      `INSERT INTO inventory (title, name, sku, quantity, price, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [item.title, item.name, item.sku, item.quantity ?? 0, item.price ?? 0.0, createdAt]
    );

    return {
      id: result.lastInsertId || Date.now(),
      title: item.title,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity ?? 0,
      price: item.price ?? 0.0,
      createdAt,
    };
  }

  // Memory store fallback
  const store = getMemoryStore();
  const newItem: InventoryItem = {
    id: store.length > 0 ? Math.max(...store.map((i) => i.id)) + 1 : 1,
    title: item.title,
    name: item.name,
    sku: item.sku,
    quantity: item.quantity ?? 0,
    price: item.price ?? 0.0,
    createdAt,
  };
  store.unshift(newItem);
  return newItem;
}

export async function updateItemQuantity(id: number, newQuantity: number): Promise<void> {
  const sqlDb = await getSqlDb();
  const safeQty = Math.max(0, newQuantity);

  if (isTauriEnvironment() && sqlDb) {
    await sqlDb.execute(
      `UPDATE inventory SET quantity = $1 WHERE id = $2`,
      [safeQty, id]
    );
    return;
  }

  // Memory fallback
  const store = getMemoryStore();
  const target = store.find((i) => i.id === id);
  if (target) {
    target.quantity = safeQty;
  }
}

export async function deleteInventoryItem(id: number): Promise<void> {
  const sqlDb = await getSqlDb();

  if (isTauriEnvironment() && sqlDb) {
    await sqlDb.execute(`DELETE FROM inventory WHERE id = $1`, [id]);
    return;
  }

  // Memory fallback
  const store = getMemoryStore();
  const idx = store.findIndex((i) => i.id === id);
  if (idx !== -1) {
    store.splice(idx, 1);
  }
}
