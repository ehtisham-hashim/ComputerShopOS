import { isTauriEnvironment, memoryStore, getSqlDb } from "./client";
import { CategoryRecord } from "./schema";

export async function getCategories(): Promise<CategoryRecord[]> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    try {
      const rows = await sqlDb.select<any[]>(
        "SELECT id, name, description, created_at FROM categories ORDER BY name ASC"
      );
      return rows.map((r) => ({
        id: Number(r.id),
        name: String(r.name || ""),
        description: String(r.description || ""),
        createdAt: Number(r.created_at || Math.floor(Date.now() / 1000)),
      }));
    } catch (err) {
      console.error("Failed to query categories from SQLite:", err);
    }
  }

  return [...memoryStore.categories].sort((a, b) => a.name.localeCompare(b.name));
}

export async function addCategory(input: { name: string; description?: string }): Promise<number> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();
  const trimmedName = input.name.trim();
  const description = (input.description || "").trim();

  if (!trimmedName) {
    throw new Error("Category name is required.");
  }

  if (isTauri && sqlDb) {
    // Check duplicate
    const existing = await sqlDb.select<any[]>(
      "SELECT id FROM categories WHERE LOWER(name) = LOWER($1)",
      [trimmedName]
    );
    if (existing && existing.length > 0) {
      throw new Error(`Category "${trimmedName}" already exists.`);
    }

    const now = Math.floor(Date.now() / 1000);
    const res = await sqlDb.execute(
      "INSERT INTO categories (name, description, created_at) VALUES ($1, $2, $3)",
      [trimmedName, description, now]
    );
    return Number(res.lastInsertId) || 1;
  }

  // Browser Fallback
  const exists = memoryStore.categories.some(
    (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (exists) {
    throw new Error(`Category "${trimmedName}" already exists.`);
  }

  const newId = memoryStore.categories.length > 0
    ? Math.max(...memoryStore.categories.map((c) => c.id)) + 1
    : 1;

  const newCat: CategoryRecord = {
    id: newId,
    name: trimmedName,
    description,
    createdAt: Math.floor(Date.now() / 1000),
  };
  memoryStore.categories.push(newCat);
  return newId;
}

export async function updateCategory(
  id: number,
  input: { name: string; description?: string }
): Promise<void> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();
  const trimmedName = input.name.trim();
  const description = (input.description || "").trim();

  if (!trimmedName) {
    throw new Error("Category name is required.");
  }

  if (isTauri && sqlDb) {
    // Check duplicate with another ID
    const existing = await sqlDb.select<any[]>(
      "SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND id != $2",
      [trimmedName, id]
    );
    if (existing && existing.length > 0) {
      throw new Error(`Category "${trimmedName}" already exists.`);
    }

    // Get old name for cascade update
    const current = await sqlDb.select<any[]>(
      "SELECT name FROM categories WHERE id = $1",
      [id]
    );
    const oldName = current?.[0]?.name;

    await sqlDb.execute(
      "UPDATE categories SET name = $1, description = $2 WHERE id = $3",
      [trimmedName, description, id]
    );

    // If name changed, update inventory & purchase items using the old category name
    if (oldName && oldName !== trimmedName) {
      try {
        await sqlDb.execute(
          "UPDATE inventory SET title = $1 WHERE title = $2",
          [trimmedName, oldName]
        );
        await sqlDb.execute(
          "UPDATE purchase_items SET title = $1 WHERE title = $2",
          [trimmedName, oldName]
        );
      } catch (cascadeErr) {
        console.warn("Cascade category update warning:", cascadeErr);
      }
    }
    return;
  }

  // Browser Fallback
  const idx = memoryStore.categories.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error("Category not found.");

  const duplicate = memoryStore.categories.some(
    (c) => c.id !== id && c.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (duplicate) {
    throw new Error(`Category "${trimmedName}" already exists.`);
  }

  const oldName = memoryStore.categories[idx].name;
  memoryStore.categories[idx] = {
    ...memoryStore.categories[idx],
    name: trimmedName,
    description,
  };

  if (oldName !== trimmedName) {
    for (const inv of memoryStore.inventory) {
      if (inv.title === oldName) inv.title = trimmedName;
    }
    for (const pi of memoryStore.purchaseItems) {
      if (pi.title === oldName) pi.title = trimmedName;
    }
  }
}

export async function deleteCategory(id: number): Promise<void> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    await sqlDb.execute("DELETE FROM categories WHERE id = $1", [id]);
    return;
  }

  const idx = memoryStore.categories.findIndex((c) => c.id === id);
  if (idx !== -1) {
    memoryStore.categories.splice(idx, 1);
  }
}

export async function getCategoryUsageCounts(): Promise<Record<string, number>> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();
  const counts: Record<string, number> = {};

  if (isTauri && sqlDb) {
    try {
      const rows = await sqlDb.select<{ title: string; count: number }[]>(
        "SELECT title, COUNT(*) as count FROM inventory GROUP BY title"
      );
      for (const r of rows) {
        if (r.title) {
          counts[r.title] = Number(r.count || 0);
        }
      }
      return counts;
    } catch (err) {
      console.error("Failed to query category usage counts from SQLite:", err);
    }
  }

  for (const item of memoryStore.inventory) {
    counts[item.title] = (counts[item.title] || 0) + 1;
  }
  return counts;
}
