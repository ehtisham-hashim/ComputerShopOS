import Database from "@tauri-apps/plugin-sql";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";
import seedData from "./seedData.json";

let sqlDb: Database | null = null;
let isInitialized = false;

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
    price: 150000,
    costPrice: 125000,
    isSerialized: 1,
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 5,
  },
  {
    id: 2,
    title: "GPU",
    name: "NVIDIA GeForce RTX 4080 Super 16GB",
    sku: "NV-RTX4080S-16G",
    quantity: 4,
    price: 285000,
    costPrice: 250000,
    isSerialized: 1,
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 3,
  },
  {
    id: 3,
    title: "CPU",
    name: "AMD Ryzen 7 7800X3D 8-Core Processor",
    sku: "AMD-R7-7800X3D",
    quantity: 12,
    price: 120000,
    costPrice: 105000,
    isSerialized: 1,
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 2,
  },
  {
    id: 4,
    title: "RAM",
    name: "Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz",
    sku: "COR-DDR5-32G-6000",
    quantity: 20,
    price: 32000,
    costPrice: 26000,
    isSerialized: 0,
    createdAt: Math.floor(Date.now() / 1000) - 86400,
  },
  {
    id: 5,
    title: "STORAGE",
    name: "Samsung 990 PRO 2TB PCIe 4.0 NVMe SSD",
    sku: "SAM-990PRO-2TB",
    quantity: 15,
    price: 48000,
    costPrice: 38000,
    isSerialized: 1,
    createdAt: Math.floor(Date.now() / 1000) - 36000,
  },
  {
    id: 6,
    title: "MOTHERBOARD",
    name: "ASUS ROG STRIX B650-A GAMING WIFI",
    sku: "ASUS-ROG-B650A",
    quantity: 6,
    price: 68000,
    costPrice: 55000,
    isSerialized: 1,
    createdAt: Math.floor(Date.now() / 1000) - 20000,
  },
  {
    id: 7,
    title: "PSU",
    name: "Corsair RM850x 850W 80+ Gold Fully Modular",
    sku: "COR-RM850X-GOLD",
    quantity: 10,
    price: 38000,
    costPrice: 30000,
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
    subtotal: 317000,
    discount: 5000,
    tax: 0,
    totalAmount: 312000,
    paidAmount: 312000,
    paymentStatus: "PAID",
    balanceDue: 0,
    paymentMethod: "CARD",
    notes: "RTX 4080S + RAM purchase",
    isBadDebt: 0,
    dueDate: null,
    createdAt: Math.floor(Date.now() / 1000) - 7200,
  },
  {
    id: 2,
    invoiceNo: "INV-2026-002",
    customerId: 2,
    customerName: "David Miller",
    customerPhone: "+1 (555) 234-5678",
    subtotal: 150000,
    discount: 5000,
    tax: 0,
    totalAmount: 145000,
    paidAmount: 100000,
    paymentStatus: "PARTIAL",
    balanceDue: 45000,
    paymentMethod: "SPLIT",
    notes: "ThinkPad X1 purchase - Partial deposit",
    isBadDebt: 0,
    dueDate: null,
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 2,
  },
  {
    id: 3,
    invoiceNo: "INV-2026-003",
    customerId: 3,
    customerName: "Sarah Jenkins",
    customerPhone: "+1 (555) 987-6543",
    subtotal: 120000,
    discount: 0,
    tax: 0,
    totalAmount: 120000,
    paidAmount: 0,
    paymentStatus: "UNPAID",
    balanceDue: 120000,
    paymentMethod: "CASH",
    notes: "Ryzen 7800X3D reserved invoice",
    isBadDebt: 0,
    dueDate: null,
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 4,
  },
];

const memorySaleItems: schema.SaleLineItem[] = [
  { id: 1, saleId: 1, inventoryId: 2, itemName: "NVIDIA GeForce RTX 4080 Super 16GB", serialNumber: "SN-RTX4080-884910", quantity: 1, unitPrice: 285000, totalPrice: 285000 },
  { id: 2, saleId: 1, inventoryId: 4, itemName: "Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz", serialNumber: null, quantity: 1, unitPrice: 32000, totalPrice: 32000 },
  { id: 3, saleId: 2, inventoryId: 1, itemName: "ThinkPad X1 Carbon Gen 11 (Core i7, 32GB RAM, 1TB SSD)", serialNumber: null, quantity: 1, unitPrice: 150000, totalPrice: 150000 },
  { id: 4, saleId: 3, inventoryId: 3, itemName: "AMD Ryzen 7 7800X3D 8-Core Processor", serialNumber: "SN-R7-7800-449101", quantity: 1, unitPrice: 120000, totalPrice: 120000 },
];

const memoryRepairs: schema.RepairTicketRecord[] = [
  {
    id: 1,
    ticketNo: "RMA-1042",
    customerId: 2,
    customerName: "David Miller",
    customerPhone: "+1 (555) 234-5678",
    device: "ASUS ROG Zephyrus G14",
    reportedIssue: "GPU thermal throttling and fan noise",
    partsUsed: JSON.stringify([
      { name: "Liquid Metal Repaste + Thermal Pads", cost: 4500, isHardware: true },
      { name: "BIOS & Thermal Profile Update", cost: 2500, isHardware: false },
    ]),
    laborCost: 5000,
    estimatedCost: 12000,
    finalCost: 12000,
    status: "IN_PROGRESS",
    createdAt: Math.floor(Date.now() / 1000) - 86400,
  },
  {
    id: 2,
    ticketNo: "RMA-1041",
    customerId: 3,
    customerName: "Sarah Jenkins",
    customerPhone: "+1 (555) 987-6543",
    device: "Custom Desktop PC (i7-13700K / RTX 4070)",
    reportedIssue: "Corrupted NVMe boot partition & driver BSOD",
    partsUsed: JSON.stringify([
      { name: "Samsung 990 PRO 2TB PCIe 4.0 NVMe SSD", cost: 48000, isHardware: true, inventoryId: 5 },
      { name: "Windows 11 OS Reinstallation & Drivers", cost: 3500, isHardware: false },
    ]),
    laborCost: 4500,
    estimatedCost: 56000,
    finalCost: 56000,
    status: "READY",
    createdAt: Math.floor(Date.now() / 1000) - 172800,
  },
];

const memoryAdjustments: schema.AdjustmentRecord[] = [
  {
    id: 1,
    adjustmentNo: "ADJ-501",
    customerId: 1,
    customerName: "Alex Chen",
    customerPhone: "+1 (555) 321-7654",
    itemTakenName: "Old GTX 1070 8GB Rig",
    itemTakenValue: 45000,
    itemGivenInventoryId: 2,
    itemGivenName: "NVIDIA GeForce RTX 4080 Super 16GB",
    itemGivenPrice: 285000,
    netDifference: 240000,
    paidAmount: 240000,
    balanceDue: 0,
    paymentStatus: "PAID",
    notes: "Customer traded in old GTX 1070 rig towards RTX 4080 Super",
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 3,
  },
];

const memorySettings: Record<string, string> = {
  store_name: "Tasnim PC Hardware & Systems",
  store_address: "Shop #12, Computer Plaza, Main Boulevard",
  store_phone: "+92 300 1234567",
  currency_symbol: "PKR ",
  tax_rate: "0",
};

const initialReceivables: schema.SaleRecord[] = (seedData.receivables || []).map((r: any, i: number) => ({
  id: 4 + i,
  invoiceNo: r.invoiceNo,
  customerId: null,
  customerName: r.customerName,
  customerPhone: r.customerPhone,
  subtotal: r.totalAmount,
  discount: 0,
  tax: 0,
  totalAmount: r.totalAmount,
  paidAmount: r.paidAmount,
  paymentStatus: r.paymentStatus as schema.PaymentStatus,
  balanceDue: r.balanceDue,
  paymentMethod: r.paymentMethod as schema.PaymentMethod,
  notes: r.notes,
  isBadDebt: r.isBadDebt || 0,
  dueDate: null,
  createdAt: r.createdAt,
}));

memorySales.push(...initialReceivables);

const memoryPayableParties: schema.PayableParty[] = (seedData.payableParties || []).map((p: any) => ({
  id: p.id,
  name: p.name,
  phone: p.phone || "",
  address: p.address || "",
  totalDebit: p.totalDebit || 0,
  totalCredit: p.totalCredit || 0,
  currentBalance: p.currentBalance || 0,
  notes: p.notes || "",
  createdAt: Math.floor(Date.now() / 1000) - 86400 * 30,
}));

const memoryPayableLedger: schema.PayableLedgerEntry[] = (seedData.payableLedger || []).map((l: any) => ({
  id: l.id,
  partyId: l.partyId,
  txDate: l.txDate,
  txType: l.txType as schema.PayableTxType,
  refNo: l.refNo || "",
  description: l.description,
  debit: l.debit || 0,
  credit: l.credit || 0,
  balance: l.balance || 0,
  createdAt: l.txDate,
}));

export async function initDb(): Promise<void> {
  if (isInitialized) return;

  if (isTauri) {
    try {
      sqlDb = await Database.load("sqlite:pc_shop.db");

      try { await sqlDb.execute("PRAGMA journal_mode = WAL;"); } catch {}
      try { await sqlDb.execute("PRAGMA synchronous = NORMAL;"); } catch {}
      try { await sqlDb.execute("PRAGMA foreign_keys = ON;"); } catch {}
      try { await sqlDb.execute("PRAGMA busy_timeout = 5000;"); } catch {}

      const tableQueries = [
        `CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT NOT NULL UNIQUE,
          email TEXT DEFAULT '',
          address TEXT DEFAULT '',
          notes TEXT DEFAULT '',
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        )`,
        `CREATE TABLE IF NOT EXISTS inventory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          name TEXT NOT NULL,
          sku TEXT NOT NULL UNIQUE,
          quantity INTEGER NOT NULL DEFAULT 0,
          price INTEGER NOT NULL DEFAULT 0,
          cost_price INTEGER NOT NULL DEFAULT 0,
          is_serialized INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        )`,
        `CREATE TABLE IF NOT EXISTS inventory_serials (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          inventory_id INTEGER NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
          serial_number TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'AVAILABLE',
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        )`,
        `CREATE TABLE IF NOT EXISTS sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_no TEXT NOT NULL UNIQUE,
          customer_id INTEGER REFERENCES customers(id),
          customer_name TEXT NOT NULL DEFAULT 'Walk-in Customer',
          customer_phone TEXT NOT NULL DEFAULT '',
          subtotal INTEGER NOT NULL DEFAULT 0,
          discount INTEGER NOT NULL DEFAULT 0,
          tax INTEGER NOT NULL DEFAULT 0,
          total_amount INTEGER NOT NULL DEFAULT 0,
          paid_amount INTEGER NOT NULL DEFAULT 0,
          payment_status TEXT NOT NULL DEFAULT 'PAID',
          balance_due INTEGER NOT NULL DEFAULT 0,
          payment_method TEXT NOT NULL DEFAULT 'CASH',
          notes TEXT NOT NULL DEFAULT '',
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        )`,
        `CREATE TABLE IF NOT EXISTS sale_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
          inventory_id INTEGER NOT NULL REFERENCES inventory(id),
          item_name TEXT NOT NULL,
          serial_number TEXT,
          quantity INTEGER NOT NULL DEFAULT 1,
          unit_price INTEGER NOT NULL DEFAULT 0,
          total_price INTEGER NOT NULL DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS repairs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ticket_no TEXT NOT NULL UNIQUE,
          customer_id INTEGER REFERENCES customers(id),
          customer_name TEXT NOT NULL,
          customer_phone TEXT NOT NULL,
          device TEXT NOT NULL,
          reported_issue TEXT NOT NULL,
          parts_used TEXT DEFAULT '[]',
          labor_cost INTEGER NOT NULL DEFAULT 0,
          estimated_cost INTEGER NOT NULL DEFAULT 0,
          final_cost INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'RECEIVED',
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        )`,
        `CREATE TABLE IF NOT EXISTS adjustments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          adjustment_no TEXT NOT NULL UNIQUE,
          customer_id INTEGER REFERENCES customers(id),
          customer_name TEXT NOT NULL,
          customer_phone TEXT NOT NULL,
          item_taken_name TEXT NOT NULL,
          item_taken_value INTEGER NOT NULL DEFAULT 0,
          item_given_inventory_id INTEGER REFERENCES inventory(id),
          item_given_name TEXT NOT NULL,
          item_given_price INTEGER NOT NULL DEFAULT 0,
          net_difference INTEGER NOT NULL DEFAULT 0,
          paid_amount INTEGER NOT NULL DEFAULT 0,
          balance_due INTEGER NOT NULL DEFAULT 0,
          payment_status TEXT NOT NULL DEFAULT 'PAID',
          notes TEXT DEFAULT '',
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        )`,
        `CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT NOT NULL UNIQUE,
          value TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          brand TEXT NOT NULL DEFAULT 'tasnim_computers',
          doc_type TEXT NOT NULL DEFAULT 'invoice',
          ref_no TEXT NOT NULL UNIQUE,
          date TEXT NOT NULL,
          customer_id INTEGER REFERENCES customers(id),
          customer_name TEXT NOT NULL,
          customer_address TEXT DEFAULT '',
          customer_phone TEXT DEFAULT '',
          items_json TEXT NOT NULL DEFAULT '[]',
          subtotal INTEGER NOT NULL DEFAULT 0,
          discount INTEGER NOT NULL DEFAULT 0,
          tax INTEGER NOT NULL DEFAULT 0,
          total_amount INTEGER NOT NULL DEFAULT 0,
          payment_mode TEXT NOT NULL DEFAULT 'CASH',
          warranty_terms TEXT NOT NULL DEFAULT 'ONE WEEK CHECK WARRANTY',
          notes TEXT NOT NULL DEFAULT '',
          schema_version INTEGER NOT NULL DEFAULT 1,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        )`,
        `CREATE TABLE IF NOT EXISTS payable_parties (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT DEFAULT '',
          address TEXT DEFAULT '',
          total_debit INTEGER NOT NULL DEFAULT 0,
          total_credit INTEGER NOT NULL DEFAULT 0,
          current_balance INTEGER NOT NULL DEFAULT 0,
          notes TEXT DEFAULT '',
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        )`,
        `CREATE TABLE IF NOT EXISTS payable_ledger (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          party_id INTEGER NOT NULL REFERENCES payable_parties(id) ON DELETE CASCADE,
          tx_date INTEGER NOT NULL,
          tx_type TEXT NOT NULL DEFAULT 'PURCHASE',
          ref_no TEXT DEFAULT '',
          description TEXT NOT NULL DEFAULT '',
          debit INTEGER NOT NULL DEFAULT 0,
          credit INTEGER NOT NULL DEFAULT 0,
          balance INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        )`,
      ];

      for (const q of tableQueries) {
        try { await sqlDb.execute(q); } catch (err) { console.warn("Table init:", err); }
      }

      try { await sqlDb.execute("ALTER TABLE sales ADD COLUMN is_bad_debt INTEGER NOT NULL DEFAULT 0;"); } catch {}
      try { await sqlDb.execute("ALTER TABLE sales ADD COLUMN due_date INTEGER;"); } catch {}

      const indexQueries = [
        "CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)",
        "CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name)",
        "CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku)",
        "CREATE INDEX IF NOT EXISTS idx_inventory_title ON inventory(title)",
        "CREATE INDEX IF NOT EXISTS idx_serials_number ON inventory_serials(serial_number)",
        "CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_no)",
        "CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(payment_status)",
        "CREATE INDEX IF NOT EXISTS idx_repairs_ticket ON repairs(ticket_no)",
        "CREATE INDEX IF NOT EXISTS idx_adjustments_no ON adjustments(adjustment_no)",
        "CREATE INDEX IF NOT EXISTS idx_adjustments_customer ON adjustments(customer_name)",
        "CREATE INDEX IF NOT EXISTS idx_adjustments_status ON adjustments(payment_status)",
        "CREATE INDEX IF NOT EXISTS idx_documents_brand_created ON documents(brand, created_at DESC)",
        "CREATE INDEX IF NOT EXISTS idx_documents_ref_no ON documents(ref_no)",
        "CREATE INDEX IF NOT EXISTS idx_documents_customer ON documents(customer_name)",
        "CREATE INDEX IF NOT EXISTS idx_payable_parties_name ON payable_parties(name)",
        "CREATE INDEX IF NOT EXISTS idx_payable_ledger_party ON payable_ledger(party_id)",
        "CREATE INDEX IF NOT EXISTS idx_payable_ledger_date ON payable_ledger(tx_date)",
      ];

      for (const idx of indexQueries) {
        try { await sqlDb.execute(idx); } catch {}
      }

      try {
        const existingParties = await sqlDb.select<any[]>("SELECT COUNT(*) as cnt FROM payable_parties");
        const count = existingParties?.[0]?.cnt ?? existingParties?.[0]?.["COUNT(*)"] ?? 0;
        if (count === 0) {
          for (const p of memoryPayableParties) {
            await sqlDb.execute(
              "INSERT OR IGNORE INTO payable_parties (id, name, phone, address, total_debit, total_credit, current_balance, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
              [p.id, p.name, p.phone || "", p.address || "", p.totalDebit, p.totalCredit, p.currentBalance, p.notes || "", p.createdAt]
            );
          }
          for (const l of memoryPayableLedger) {
            await sqlDb.execute(
              "INSERT OR IGNORE INTO payable_ledger (id, party_id, tx_date, tx_type, ref_no, description, debit, credit, balance, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
              [l.id, l.partyId, l.txDate, l.txType, l.refNo || "", l.description, l.debit, l.credit, l.balance, l.createdAt]
            );
          }
          for (const r of initialReceivables) {
            await sqlDb.execute(
              "INSERT OR IGNORE INTO sales (invoice_no, customer_name, customer_phone, subtotal, discount, tax, total_amount, paid_amount, payment_status, balance_due, payment_method, notes, is_bad_debt, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
              [r.invoiceNo, r.customerName, r.customerPhone, r.subtotal, r.discount, r.tax, r.totalAmount, r.paidAmount, r.paymentStatus, r.balanceDue, r.paymentMethod, r.notes, r.isBadDebt, r.createdAt]
            );
          }
        }
      } catch (seedErr) {
        console.warn("Seeding payables/receivables error:", seedErr);
      }

      // Re-standardize any legacy non-standard invoice IDs (e.g. INV-890568) into standard INV-YYYY-XXX
      try {
        const legacySales = await sqlDb.select<{ id: number; invoice_no: string; created_at: number }[]>(
          `SELECT id, invoice_no, created_at FROM sales 
           WHERE invoice_no NOT LIKE 'INV-____-%' AND invoice_no NOT LIKE 'RCV-____-%' 
           ORDER BY created_at ASC, id ASC`
        );
        if (legacySales && legacySales.length > 0) {
          const year = new Date().getFullYear();
          const existingStandard = await sqlDb.select<{ invoice_no: string }[]>(
            `SELECT invoice_no FROM sales WHERE invoice_no LIKE $1`,
            [`INV-${year}-%`]
          );
          let maxSeq = 0;
          for (const row of existingStandard) {
            const parts = (row.invoice_no || "").split("-");
            if (parts.length >= 3) {
              const num = parseInt(parts[2], 10);
              if (!isNaN(num) && num > maxSeq) maxSeq = num;
            }
          }
          for (const s of legacySales) {
            maxSeq++;
            const newInvoiceNo = `INV-${year}-${String(maxSeq).padStart(3, "0")}`;
            await sqlDb.execute(`UPDATE sales SET invoice_no = $1 WHERE id = $2`, [newInvoiceNo, s.id]);
          }
        }
      } catch (legacyErr) {
        console.warn("Legacy invoice re-standardization error:", legacyErr);
      }

      isInitialized = true;
      return;
    } catch (err) {
      console.warn("Tauri SQL Database load failed, falling back to memory store:", err);
    }
  }

  // Memory store fallback re-standardization
  const year = new Date().getFullYear();
  let memMaxSeq = 0;
  for (const s of memoryStore.sales) {
    if ((s.invoiceNo || "").startsWith(`INV-${year}-`)) {
      const parts = (s.invoiceNo || "").split("-");
      if (parts.length >= 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > memMaxSeq) memMaxSeq = num;
      }
    }
  }
  for (const s of memoryStore.sales) {
    if (!s.invoiceNo.startsWith(`INV-${year}-`) && !s.invoiceNo.startsWith(`RCV-${year}-`)) {
      memMaxSeq++;
      s.invoiceNo = `INV-${year}-${String(memMaxSeq).padStart(3, "0")}`;
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

export const memoryStore = {
  customers: memoryCustomers,
  inventory: memoryInventory,
  serials: memorySerials,
  sales: memorySales,
  saleItems: memorySaleItems,
  repairs: memoryRepairs,
  adjustments: memoryAdjustments,
  settings: memorySettings,
  payableParties: memoryPayableParties,
  payableLedger: memoryPayableLedger,
};
