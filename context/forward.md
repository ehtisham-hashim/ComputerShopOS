## Query:

want to make two new pages , but i also have to define the schema, so tell me the schema ()data models, based on the excel files, because we are gonna use it

## Response:

Now I have a complete picture of both files. Here's the full schema analysis based on what the data actually contains:

---

## Schema Design for Receivables & Payables

Here's what I found in both Excel files and the recommended schema to add to your `src/db/schema.ts`:

---

### RECEIVABLES (`RECIEVABLES.xlsx`)

A simple flat table — one entry per customer owed money to you:

```
S#  DATE      NAME                  CELL#          AMOUNT   REMARKS
1   45811     C/O MUKRAB SHAB CO4   0336-5055167   12700
```

---

### PAYABLES (`PAYABLES.xlsx`)

Two-level structure:

1. **Summary sheet** — a list of suppliers/parties with total amounts owed
2. **Ledger sheets per supplier** — transaction-by-transaction history with DEBIT, CREDIT, BALANCE, TYPE (PURCHASE / PAYMENT / RETURN / ADJUSTMENT), REF#, DESCRIPTION

---

### Schema to add to `src/db/schema.ts`

```typescript
// ─────────────────────────────────────────────
// RECEIVABLES
// ─────────────────────────────────────────────

export const receivables = sqliteTable("receivables", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Customer info (may or may not be in customers table)
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull().default(""),

  // The receivable
  amount: real("amount").notNull().default(0.0), // original amount owed
  amountReceived: real("amount_received").notNull().default(0.0), // collected so far
  balanceDue: real("balance_due").notNull().default(0.0), // computed: amount - received

  status: text("status", {
    enum: ["OUTSTANDING", "PARTIAL", "SETTLED", "BAD_DEBT"],
  })
    .notNull()
    .default("OUTSTANDING"),

  remarks: text("remarks").default(""),
  dueDate: integer("due_date"), // Unix timestamp, optional
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export type ReceivableRecord = typeof receivables.$inferSelect;
export type NewReceivableRecord = typeof receivables.$inferInsert;

// ─────────────────────────────────────────────
// PAYABLES — Party/Supplier Master
// ─────────────────────────────────────────────

export const payableParties = sqliteTable("payable_parties", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  name: text("name").notNull(), // e.g. "ZAFAR & SONS RWP", "AL AZIZ LHR"
  phone: text("phone").default(""),
  address: text("address").default(""),

  // Running totals — kept in sync on every ledger entry
  totalDebit: real("total_debit").notNull().default(0.0), // total paid to them
  totalCredit: real("total_credit").notNull().default(0.0), // total purchased from them
  currentBalance: real("current_balance").notNull().default(0.0), // what we owe now

  notes: text("notes").default(""),
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export type PayableParty = typeof payableParties.$inferSelect;
export type NewPayableParty = typeof payableParties.$inferInsert;

// ─────────────────────────────────────────────
// PAYABLES — Ledger (transaction-level)
// ─────────────────────────────────────────────

export const PayableTxTypes = [
  "PURCHASE",
  "PAYMENT",
  "RETURN",
  "ADJUSTMENT",
] as const;
export type PayableTxType = (typeof PayableTxTypes)[number];

export const payableLedger = sqliteTable("payable_ledger", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  partyId: integer("party_id")
    .notNull()
    .references(() => payableParties.id, { onDelete: "cascade" }),

  txDate: integer("tx_date"), // Unix timestamp (Excel serial → JS Date)
  txType: text("tx_type", {
    enum: PayableTxTypes,
  })
    .notNull()
    .default("PURCHASE"),

  refNo: text("ref_no").default(""), // Bill#, Receipt#, etc.
  description: text("description").notNull().default(""),

  debit: real("debit").notNull().default(0.0), // Money we paid them
  credit: real("credit").notNull().default(0.0), // Money we owe them (purchases)
  balance: real("balance").notNull().default(0.0), // Running balance after this entry

  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export type PayableLedgerEntry = typeof payableLedger.$inferSelect;
export type NewPayableLedgerEntry = typeof payableLedger.$inferInsert;

// ─────────────────────────────────────────────
// Input types for services
// ─────────────────────────────────────────────

export interface CreateReceivableInput {
  customerId?: number;
  customerName: string;
  customerPhone?: string;
  amount: number;
  remarks?: string;
  dueDate?: number; // Unix timestamp
}

export interface CreatePayablePartyInput {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  openingBalance?: number; // for importing existing balances
}

export interface CreatePayableLedgerEntryInput {
  partyId: number;
  txDate?: number;
  txType: PayableTxType;
  refNo?: string;
  description: string;
  debit?: number;
  credit?: number;
}
```

---

### SQLite `CREATE TABLE` statements (for `initDb()` in `client.ts`)

Add these to the `tableQueries` array in `initDb()`:

```sql
CREATE TABLE IF NOT EXISTS receivables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL DEFAULT '',
  amount REAL NOT NULL DEFAULT 0.0,
  amount_received REAL NOT NULL DEFAULT 0.0,
  balance_due REAL NOT NULL DEFAULT 0.0,
  status TEXT NOT NULL DEFAULT 'OUTSTANDING',
  remarks TEXT DEFAULT '',
  due_date INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
)
```

```sql
CREATE TABLE IF NOT EXISTS payable_parties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  total_debit REAL NOT NULL DEFAULT 0.0,
  total_credit REAL NOT NULL DEFAULT 0.0,
  current_balance REAL NOT NULL DEFAULT 0.0,
  notes TEXT DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
)
```

```sql
CREATE TABLE IF NOT EXISTS payable_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  party_id INTEGER NOT NULL REFERENCES payable_parties(id) ON DELETE CASCADE,
  tx_date INTEGER,
  tx_type TEXT NOT NULL DEFAULT 'PURCHASE',
  ref_no TEXT DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  debit REAL NOT NULL DEFAULT 0.0,
  credit REAL NOT NULL DEFAULT 0.0,
  balance REAL NOT NULL DEFAULT 0.0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
)
```

---

### What each page will look like

**Receivables Page** — Simple list of customers who owe you money. Columns: Customer Name, Phone, Amount, Received, Balance Due, Status (OUTSTANDING / PARTIAL / SETTLED / BAD_DEBT), Date, Remarks. Add payment collection modal to mark partial/full receipt.

**Payables Page** — Two-panel view: left is the **party list** (ZAFAR & SONS, AL AZIZ LHR, NAEEM BHI PBM, etc.) with their current balance; clicking a party opens/expands the full **ledger** of PURCHASE / PAYMENT / RETURN / ADJUSTMENT transactions with running balance, just like the Excel sheets show. Add new transaction modal supports all four types.

This matches 100% with how the Excel files are structured — the party summary sheet is `payable_parties`, and each per-supplier sheet maps to rows in `payable_ledger` filtered by `party_id`.

## Query-2:

i think we need to expand the receivables, that what we are purchasing , so make it an array, of item, also an option to choose the existing items or add new items, and in the page there is a row in which our receivables are written and when we click them or view the icon button we can see the ecact item list of every details

## Response:

Let me look at the existing code patterns first before designing anything.Good — I already have everything I need from the documents in context. Let me design the expanded receivables schema properly.

Based on your Excel data and the request, here's the complete expanded schema and what it supports:

---

## What changes vs. the previous design

The original `receivables` table had a single `amount` field. Now it gets:

- A **`receivable_items`** child table (one row per item in the receivable)
- Each item can link to `inventory` (existing stock) **or** be a free-text item (new/non-inventory item)
- The parent `receivables` row totals are auto-computed from items

---

## Schema additions for `src/db/schema.ts`

```typescript
// ─────────────────────────────────────────────
// RECEIVABLES — Parent record (one per customer/transaction)
// ─────────────────────────────────────────────

export const receivables = sqliteTable("receivables", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  receivableNo: text("receivable_no").notNull().unique(), // e.g. "RCV-1234567"

  // Customer — may link to existing customer or be walk-in
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull().default(""),

  // Financials — computed from items, stored for fast querying
  totalAmount: real("total_amount").notNull().default(0.0),
  amountReceived: real("amount_received").notNull().default(0.0),
  balanceDue: real("balance_due").notNull().default(0.0),

  status: text("status", {
    enum: ["OUTSTANDING", "PARTIAL", "SETTLED", "BAD_DEBT"],
  })
    .notNull()
    .default("OUTSTANDING"),

  remarks: text("remarks").default(""),
  dueDate: integer("due_date"), // Unix timestamp, optional
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export type ReceivableRecord = typeof receivables.$inferSelect;
export type NewReceivableRecord = typeof receivables.$inferInsert;

// ─────────────────────────────────────────────
// RECEIVABLE ITEMS — Line items inside each receivable
// ─────────────────────────────────────────────

export const receivableItems = sqliteTable("receivable_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  receivableId: integer("receivable_id")
    .notNull()
    .references(() => receivables.id, { onDelete: "cascade" }),

  // Link to inventory OR free-text — one of these will be set
  inventoryId: integer("inventory_id").references(() => inventory.id), // null = custom/non-inventory item

  // Always stored (even for inventory items, denormalized for history)
  itemName: text("item_name").notNull(), // e.g. "HP 840 G3 I5-6TH 8/256"
  itemSku: text("item_sku").default(""), // pulled from inventory if linked

  quantity: integer("quantity").notNull().default(1),
  unitPrice: real("unit_price").notNull().default(0.0),
  totalPrice: real("total_price").notNull().default(0.0), // qty * unitPrice

  notes: text("notes").default(""), // per-item remark
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export type ReceivableItem = typeof receivableItems.$inferSelect;
export type NewReceivableItem = typeof receivableItems.$inferInsert;

// ─────────────────────────────────────────────
// Input types for services
// ─────────────────────────────────────────────

export interface ReceivableLineItem {
  inventoryId?: number; // set if picking from inventory
  itemName: string; // always required
  itemSku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface CreateReceivableInput {
  customerId?: number;
  customerName: string;
  customerPhone?: string;
  items: ReceivableLineItem[];
  totalAmount: number;
  amountReceived?: number; // 0 by default
  remarks?: string;
  dueDate?: number; // Unix timestamp
}

export interface RecordReceivablePaymentInput {
  receivableId: number;
  amountReceived: number; // how much was just collected
  notes?: string;
}
```

---

## SQLite `CREATE TABLE` statements for `initDb()` in `client.ts`

Add both to the `tableQueries` array:

```sql
CREATE TABLE IF NOT EXISTS receivables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receivable_no TEXT NOT NULL UNIQUE,
  customer_id INTEGER REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL DEFAULT '',
  total_amount REAL NOT NULL DEFAULT 0.0,
  amount_received REAL NOT NULL DEFAULT 0.0,
  balance_due REAL NOT NULL DEFAULT 0.0,
  status TEXT NOT NULL DEFAULT 'OUTSTANDING',
  remarks TEXT DEFAULT '',
  due_date INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
)
```

```sql
CREATE TABLE IF NOT EXISTS receivable_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receivable_id INTEGER NOT NULL REFERENCES receivables(id) ON DELETE CASCADE,
  inventory_id INTEGER REFERENCES inventory(id),
  item_name TEXT NOT NULL,
  item_sku TEXT DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0.0,
  total_price REAL NOT NULL DEFAULT 0.0,
  notes TEXT DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
)
```

And add these to the `indexQueries` array:

```sql
CREATE INDEX IF NOT EXISTS idx_receivables_no ON receivables(receivable_no)
CREATE INDEX IF NOT EXISTS idx_receivables_status ON receivables(status)
CREATE INDEX IF NOT EXISTS idx_receivables_customer ON receivables(customer_name)
CREATE INDEX IF NOT EXISTS idx_receivable_items_receivable ON receivable_items(receivable_id)
CREATE INDEX IF NOT EXISTS idx_receivable_items_inventory ON receivable_items(inventory_id)
```

---

## How the page works with this schema

**Main table row** (one per receivable record):

```
RCV#      Customer         Phone          Total     Received   Balance    Status        Date      Actions
RCV-001   Mukrab Shab      0336-505…   PKR 12,700     0       12,700    OUTSTANDING   Jan 15    [Eye] [Delete]
RCV-002   Mustaq Bhi       0320-551…   PKR 35,000   15,000   20,000    PARTIAL        Jan 25    [Eye] [Delete]
```

**Detail modal (Eye icon)** expands to show:

```
┌─ RCV-001 — Mukrab Shab CO4 ─────────────────────────────────────┐
│ Phone: 0336-5055167   Date: Jan 15, 2026   Due: Feb 15, 2026    │
├──────────────────────────────────────────────────────────────────┤
│ # │ Item                        │ SKU        │ Qty │ Unit  │ Total│
│ 1 │ HP 840 G3 I5-6TH 8/256     │ TP-X1C-001 │  1  │ 8,500 │ 8,500│
│ 2 │ Laptop Charger (custom)     │  —         │  2  │ 2,100 │ 4,200│
├──────────────────────────────────────────────────────────────────┤
│                          Total:  PKR 12,700                      │
│                          Received: PKR 0                         │
│                          Balance Due: PKR 12,700                 │
│ [Mark Payment Received]                                          │
└──────────────────────────────────────────────────────────────────┘
```

**New Receivable modal** has:

- Customer selector (existing) or manual name/phone
- Line items section — each row has: `[Search inventory dropdown OR type custom name] [SKU auto-fills] [Qty] [Unit Price] [Total] [Remove]`
- `+ Add Item` button
- Auto-totals
- Optional due date and remarks
- Auto-calculates `status` based on `amountReceived` vs `totalAmount`

---

## `receivablesService.ts` — function signatures you'll need

```typescript
// Get all receivables (summary, no items)
getReceivables(): Promise<ReceivableRecord[]>

// Get one receivable with its items joined
getReceivableWithItems(id: number): Promise<{
  receivable: ReceivableRecord;
  items: ReceivableItem[];
}>

// Create new receivable + line items in one transaction
createReceivable(input: CreateReceivableInput): Promise<string> // returns receivableNo

// Record a payment collection against an existing receivable
recordReceivablePayment(input: RecordReceivablePaymentInput): Promise<void>

// Delete receivable (cascade deletes items)
deleteReceivable(id: number): Promise<void>
```

The `receivableNo` follows the same pattern as the rest of your codebase: `RCV-${Date.now().toString().slice(-7)}`.

When the user picks an **existing inventory item**, `itemName`, `itemSku`, and `unitPrice` auto-populate from the `inventory` row — the user only needs to set quantity. When they type a **custom item**, `inventoryId` stays null, and they fill everything manually. Both cases hit the same `receivable_items` table row — the `inventoryId` being null or not is the only difference.
