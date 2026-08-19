import { isTauriEnvironment, memoryStore, getSqlDb } from "./client";
import { InventoryItem, NewInventoryItem, InventorySerial } from "./schema";

export async function getInventoryItems(): Promise<InventoryItem[]> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    try {
      const rows = await sqlDb.select<any[]>(
        "SELECT * FROM inventory ORDER BY created_at DESC"
      );
      return rows.map((r) => ({
        id: Number(r.id),
        title: r.title,
        name: String(r.name || ""),
        sku: String(r.sku || ""),
        quantity: Number(r.quantity) || 0,
        price: Number(r.price) || 0,
        costPrice: Number(r.cost_price ?? r.costPrice ?? 0),
        isSerialized: Number(r.is_serialized ?? r.isSerialized ?? 0),
        createdAt: Number(r.created_at ?? r.createdAt ?? Math.floor(Date.now() / 1000)),
      }));
    } catch (err) {
      console.error("Failed to query inventory from SQLite:", err);
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
    const rows = await sqlDb.select<any[]>(
      "SELECT * FROM inventory_serials WHERE inventory_id = $1 ORDER BY id DESC",
      [inventoryId]
    );
    return rows.map((r) => ({
      id: Number(r.id),
      inventoryId: Number(r.inventory_id ?? r.inventoryId),
      serialNumber: String(r.serial_number || r.serialNumber || ""),
      status: (r.status || "AVAILABLE") as "AVAILABLE" | "SOLD" | "DEFECTIVE",
      createdAt: Number(r.created_at ?? r.createdAt ?? Math.floor(Date.now() / 1000)),
    }));
  }

  return memoryStore.serials.filter((s) => s.inventoryId === inventoryId);
}
