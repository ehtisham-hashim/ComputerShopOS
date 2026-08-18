import Database from "@tauri-apps/plugin-sql";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";

let sqlDb: Database | null = null;
let isInitialized = false;

// Mock memory store for browser dev preview if not inside Tauri runtime
const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
const memoryStore: schema.InventoryItem[] = [
  {
    id: 1,
    title: "LAPTOP",
    name: "ThinkPad X1 Carbon Gen 11",
    sku: "TP-X1C-G11-001",
    quantity: 12,
    price: 1499.99,
    createdAt: Math.floor(Date.now() / 1000) - 86400,
  },
  {
    id: 2,
    title: "GPU",
    name: "NVIDIA GeForce RTX 4080 Super",
    sku: "NV-RTX4080S-16G",
    quantity: 5,
    price: 999.0,
    createdAt: Math.floor(Date.now() / 1000) - 43200,
  },
  {
    id: 3,
    title: "RAM",
    name: "Corsair Vengeance 32GB DDR5 6000MHz",
    sku: "COR-DDR5-32G-6000",
    quantity: 24,
    price: 119.99,
    createdAt: Math.floor(Date.now() / 1000) - 12000,
  },
];

export async function initDb(): Promise<void> {
  if (isInitialized) return;

  if (isTauri) {
    try {
      sqlDb = await Database.load("sqlite:pc_shop.db");
      await sqlDb.execute(`
        CREATE TABLE IF NOT EXISTS inventory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          name TEXT NOT NULL,
          sku TEXT NOT NULL UNIQUE,
          quantity INTEGER NOT NULL DEFAULT 0,
          price REAL NOT NULL DEFAULT 0.0,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        );
      `);
      isInitialized = true;
      return;
    } catch (err) {
      console.warn("Tauri SQL Database load failed, falling back to memory store:", err);
    }
  }

  isInitialized = true;
}

export const db = drizzle<typeof schema>(
  async (sql, params, method) => {
    await initDb();

    if (isTauri && sqlDb) {
      try {
        if (method === "all" || method === "values") {
          const rows = await sqlDb.select<any[]>(sql, params);
          return { rows: rows.map((r) => Object.values(r)) };
        } else if (method === "get") {
          const rows = await sqlDb.select<any[]>(sql, params);
          return { rows: rows.length > 0 ? Object.values(rows[0]) : undefined };
        } else {
          await sqlDb.execute(sql, params);
          return { rows: [] };
        }
      } catch (err) {
        console.error("Drizzle SQL execution error:", err, { sql, params });
        throw err;
      }
    }

    // Browser fallback simulation
    return { rows: [] };
  },
  { schema }
);

export async function getSqlDb(): Promise<Database | null> {
  await initDb();
  return sqlDb;
}

export function getMemoryStore() {
  return memoryStore;
}

export function isTauriEnvironment(): boolean {
  return isTauri && sqlDb !== null;
}
