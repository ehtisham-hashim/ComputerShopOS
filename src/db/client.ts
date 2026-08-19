import Database from "@tauri-apps/plugin-sql";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";

let sqlDb: Database | null = null;
let isInitialized = false;

// Mock memory stores for browser preview mode
const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

const memoryCustomers: schema.Customer[] = [
  {
    id: 1,
    name: "Alex Chen",
    phone: "+1 (555) 321-7654",
    email: "alex.chen@example.com",
    address: "742 Evergreen Terrace, Sector 4",
    notes: "Regular gaming enthusiast",
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 30,
  },
  {
    id: 2,
    name: "David Miller",
    phone: "+1 (555) 234-5678",
    email: "david.m@example.com",
    address: "108 Palm Avenue, Suite B",
    notes: "ASUS Laptop owner",
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 15,
  },
  {
    id: 3,
    name: "Sarah Jenkins",
    phone: "+1 (555) 987-6543",
    email: "sarah.j@example.com",
    address: "55 Innovation Blvd",
    notes: "Content creator / workstation builds",
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 7,
  },
];

const memoryInventory: schema.InventoryItem[] = [
  {
    id: 1,
    title: "LAPTOP",
    name: "ThinkPad X1 Carbon Gen 11 (Core i7, 32GB RAM, 1TB SSD)",
    sku: "TP-X1C-G11-001",
    quantity: 8,
    price: 1499.99,
    costPrice: 1250.0,
    isSerialized: 1,
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 5,
  },
  {
    id: 2,
    title: "GPU",
    name: "NVIDIA GeForce RTX 4080 Super 16GB",
    sku: "NV-RTX4080S-16G",
    quantity: 4,
    price: 999.0,
    costPrice: 850.0,
    isSerialized: 1,
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 3,
  },
  {
    id: 3,
    title: "CPU",
    name: "AMD Ryzen 7 7800X3D 8-Core Processor",
    sku: "AMD-R7-7800X3D",
    quantity: 12,
    price: 449.0,
    costPrice: 380.0,
    isSerialized: 1,
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 2,
  },
  {
    id: 4,
    title: "RAM",
    name: "Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz",
    sku: "COR-DDR5-32G-6000",
    quantity: 20,
    price: 119.99,
    costPrice: 90.0,
    isSerialized: 0,
    createdAt: Math.floor(Date.now() / 1000) - 86400,
  },
  {
    id: 5,
    title: "STORAGE",
    name: "Samsung 990 PRO 2TB PCIe 4.0 NVMe SSD",
    sku: "SAM-990PRO-2TB",
    quantity: 15,
    price: 179.99,
    costPrice: 135.0,
    isSerialized: 1,
    createdAt: Math.floor(Date.now() / 1000) - 36000,
  },
  {
    id: 6,
    title: "MOTHERBOARD",
    name: "ASUS ROG STRIX B650-A GAMING WIFI",
    sku: "ASUS-ROG-B650A",
    quantity: 6,
    price: 239.99,
    costPrice: 195.0,
    isSerialized: 1,
    createdAt: Math.floor(Date.now() / 1000) - 20000,
  },
  {
    id: 7,
    title: "PSU",
    name: "Corsair RM850x 850W 80+ Gold Fully Modular",
    sku: "COR-RM850X-GOLD",
    quantity: 10,
    price: 139.99,
    costPrice: 105.0,
    isSerialized: 0,
    createdAt: Math.floor(Date.now() / 1000) - 10000,
  },
];

const memorySerials: schema.InventorySerial[] = [
  { id: 1, inventoryId: 2, serialNumber: "SN-RTX4080-884910", status: "AVAILABLE", createdAt: Math.floor(Date.now() / 1000) },
  { id: 2, inventoryId: 2, serialNumber: "SN-RTX4080-884911", status: "AVAILABLE", createdAt: Math.floor(Date.now() / 1000) },
  { id: 3, inventoryId: 3, serialNumber: "SN-R7-7800-449101", status: "AVAILABLE", createdAt: Math.floor(Date.now() / 1000) },
];

const memorySales: schema.SaleRecord[] = [
  {
    id: 1,
    invoiceNo: "INV-2026-001",
    customerId: 1,
    customerName: "Alex Chen",
    customerPhone: "+1 (555) 321-7654",
    subtotal: 1118.99,
    discount: 0,
    tax: 55.95,
    totalAmount: 1174.94,
    paymentMethod: "CARD",
    notes: "RTX 4080S + RAM purchase",
    createdAt: Math.floor(Date.now() / 1000) - 7200,
  },
];

const memoryRepairs: schema.RepairTicketRecord[] = [
  {
    id: 1,
    ticketNo: "RMA-1042",
    customerId: 2,
    customerName: "David Miller",
    customerPhone: "+1 (555) 234-5678",
    device: "ASUS ROG Zephyrus G14",
    reportedIssue: "GPU artifacting under gaming load, thermal throttling",
    status: "IN_PROGRESS",
    estimatedCost: 120.0,
    finalCost: 0,
    createdAt: Math.floor(Date.now() / 1000) - 86400,
  },
  {
    id: 2,
    ticketNo: "RMA-1041",
    customerId: 3,
    customerName: "Sarah Jenkins",
    customerPhone: "+1 (555) 987-6543",
    device: "Custom Desktop PC (i7-13700K / RTX 4070)",
    reportedIssue: "No display on boot, motherboard DRAM LED red",
    status: "WAITING_PARTS",
    estimatedCost: 85.0,
    finalCost: 0,
    createdAt: Math.floor(Date.now() / 1000) - 172800,
  },
];

const memorySettings: Record<string, string> = {
  store_name: "Tasnim PC Hardware & Systems",
  store_address: "Shop #12, Computer Plaza, Main Boulevard",
  store_phone: "+92 300 1234567",
  currency_symbol: "$",
  tax_rate: "5.0",
};

export async function initDb(): Promise<void> {
  if (isInitialized) return;

  if (isTauri) {
    try {
      sqlDb = await Database.load("sqlite:pc_shop.db");

      // 1. Performance & Security PRAGMAs
      await sqlDb.execute("PRAGMA journal_mode = WAL;");
      await sqlDb.execute("PRAGMA synchronous = NORMAL;");
      await sqlDb.execute("PRAGMA foreign_keys = ON;");
      await sqlDb.execute("PRAGMA busy_timeout = 5000;");

      // 2. Create Relational Tables
      await sqlDb.execute(`
        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT NOT NULL UNIQUE,
          email TEXT DEFAULT '',
          address TEXT DEFAULT '',
          notes TEXT DEFAULT '',
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        );

        CREATE TABLE IF NOT EXISTS inventory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          name TEXT NOT NULL,
          sku TEXT NOT NULL UNIQUE,
          quantity INTEGER NOT NULL DEFAULT 0,
          price REAL NOT NULL DEFAULT 0.0,
          cost_price REAL NOT NULL DEFAULT 0.0,
          is_serialized INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        );

        CREATE TABLE IF NOT EXISTS inventory_serials (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          inventory_id INTEGER NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
          serial_number TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'AVAILABLE',
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        );

        CREATE TABLE IF NOT EXISTS sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_no TEXT NOT NULL UNIQUE,
          customer_id INTEGER REFERENCES customers(id),
          customer_name TEXT NOT NULL DEFAULT 'Walk-in Customer',
          customer_phone TEXT NOT NULL DEFAULT '',
          subtotal REAL NOT NULL DEFAULT 0.0,
          discount REAL NOT NULL DEFAULT 0.0,
          tax REAL NOT NULL DEFAULT 0.0,
          total_amount REAL NOT NULL DEFAULT 0.0,
          payment_method TEXT NOT NULL DEFAULT 'CASH',
          notes TEXT NOT NULL DEFAULT '',
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        );

        CREATE TABLE IF NOT EXISTS sale_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
          inventory_id INTEGER NOT NULL REFERENCES inventory(id),
          item_name TEXT NOT NULL,
          serial_number TEXT,
          quantity INTEGER NOT NULL DEFAULT 1,
          unit_price REAL NOT NULL DEFAULT 0.0,
          total_price REAL NOT NULL DEFAULT 0.0
        );

        CREATE TABLE IF NOT EXISTS repairs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ticket_no TEXT NOT NULL UNIQUE,
          customer_id INTEGER REFERENCES customers(id),
          customer_name TEXT NOT NULL,
          customer_phone TEXT NOT NULL,
          device TEXT NOT NULL,
          reported_issue TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'RECEIVED',
          estimated_cost REAL NOT NULL DEFAULT 0.0,
          final_cost REAL NOT NULL DEFAULT 0.0,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        );

        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT NOT NULL UNIQUE,
          value TEXT NOT NULL
        );

        -- Performance Indexes
        CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
        CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
        CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);
        CREATE INDEX IF NOT EXISTS idx_inventory_title ON inventory(title);
        CREATE INDEX IF NOT EXISTS idx_serials_number ON inventory_serials(serial_number);
        CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_no);
        CREATE INDEX IF NOT EXISTS idx_repairs_ticket ON repairs(ticket_no);
      `);

      // 3. Seed Sample Customers if empty
      const existingCust = await sqlDb.select<any[]>("SELECT COUNT(*) as count FROM customers");
      if (existingCust && existingCust[0] && existingCust[0].count === 0) {
        for (const cust of memoryCustomers) {
          await sqlDb.execute(
            `INSERT INTO customers (name, phone, email, address, notes, created_at)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [cust.name, cust.phone, cust.email, cust.address, cust.notes, cust.createdAt]
          );
        }
      }

      // 4. Seed Sample Inventory if empty
      const existingItems = await sqlDb.select<any[]>("SELECT COUNT(*) as count FROM inventory");
      if (existingItems && existingItems[0] && existingItems[0].count === 0) {
        for (const item of memoryInventory) {
          await sqlDb.execute(
            `INSERT INTO inventory (title, name, sku, quantity, price, cost_price, is_serialized, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [item.title, item.name, item.sku, item.quantity, item.price, item.costPrice, item.isSerialized, item.createdAt]
          );
        }
      }

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
          return { rows: rows.length > 0 ? Object.values(rows[0]) : [] };
        } else {
          await sqlDb.execute(sql, params);
          return { rows: [] };
        }
      } catch (err) {
        console.error("Drizzle SQL execution error:", err, { sql, params });
        throw err;
      }
    }

    return { rows: [] };
  },
  { schema }
);

export async function getSqlDb(): Promise<Database | null> {
  await initDb();
  return sqlDb;
}

export function isTauriEnvironment(): boolean {
  return isTauri && sqlDb !== null;
}

// Memory Store Accessors for browser fallback
export const memoryStore = {
  customers: memoryCustomers,
  inventory: memoryInventory,
  serials: memorySerials,
  sales: memorySales,
  repairs: memoryRepairs,
  settings: memorySettings,
};
