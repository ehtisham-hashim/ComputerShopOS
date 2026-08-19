import { db, isTauriEnvironment, memoryStore, getSqlDb } from "./client";
import { inventory, InventoryItem, NewInventoryItem, InventorySerial } from "./schema";
import { desc } from "drizzle-orm";

export async function getInventoryItems(): Promise<InventoryItem[]> {
  if (isTauriEnvironment()) {
    try {
      return await db.select().from(inventory).orderBy(desc(inventory.createdAt));
    } catch (err) {
      console.error("Failed to query inventory via Drizzle:", err);
    }
  }
  return [...memoryStore.inventory].sort((a, b) => b.createdAt - a.createdAt);
}

export async function addInventoryItem(item: NewInventoryItem, serialNumbers?: string[]): Promise<number> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    const res = await sqlDb.execute(
      `INSERT INTO inventory (title, name, sku, quantity, price, cost_price, is_serialized, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        item.title,
        item.name,
        item.sku,
        item.quantity || 0,
        item.price || 0.0,
        item.costPrice || 0.0,
        item.isSerialized || 0,
        Math.floor(Date.now() / 1000),
      ]
    );

    const newId = Number(res.lastInsertId) || 1;
    if (serialNumbers && serialNumbers.length > 0) {
      for (const sn of serialNumbers) {
        if (sn.trim()) {
          await sqlDb.execute(
            `INSERT INTO inventory_serials (inventory_id, serial_number, status, created_at)
             VALUES ($1, $2, 'AVAILABLE', $3)`,
            [newId, sn.trim().toUpperCase(), Math.floor(Date.now() / 1000)]
          );
        }
      }
    }
    return newId;
  }

  // Browser Fallback
  const newId = memoryStore.inventory.length > 0 ? Math.max(...memoryStore.inventory.map((i) => i.id)) + 1 : 1;
  const newItem: InventoryItem = {
    id: newId,
    title: item.title,
    name: item.name,
    sku: item.sku,
    quantity: item.quantity ?? 0,
    price: item.price ?? 0.0,
    costPrice: item.costPrice ?? 0.0,
    isSerialized: item.isSerialized ?? 0,
    createdAt: Math.floor(Date.now() / 1000),
  };
  memoryStore.inventory.unshift(newItem);

  if (serialNumbers && serialNumbers.length > 0) {
    for (const sn of serialNumbers) {
      if (sn.trim()) {
        memoryStore.serials.push({
          id: memoryStore.serials.length + 1,
          inventoryId: newId,
          serialNumber: sn.trim().toUpperCase(),
          status: "AVAILABLE",
          createdAt: Math.floor(Date.now() / 1000),
        });
      }
    }
  }

  return newId;
}

export async function updateItemQuantity(id: number, quantity: number): Promise<void> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    await sqlDb.execute("UPDATE inventory SET quantity = $1 WHERE id = $2", [quantity, id]);
    return;
  }

  const found = memoryStore.inventory.find((i) => i.id === id);
  if (found) {
    found.quantity = quantity;
  }
}

export async function deleteInventoryItem(id: number): Promise<void> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    await sqlDb.execute("DELETE FROM inventory WHERE id = $1", [id]);
    return;
  }

  const idx = memoryStore.inventory.findIndex((i) => i.id === id);
  if (idx !== -1) {
    memoryStore.inventory.splice(idx, 1);
  }
}

export async function getItemSerials(inventoryId: number): Promise<InventorySerial[]> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    return await sqlDb.select<InventorySerial[]>(
      "SELECT * FROM inventory_serials WHERE inventory_id = $1 ORDER BY id DESC",
      [inventoryId]
    );
  }

  return memoryStore.serials.filter((s) => s.inventoryId === inventoryId);
}
