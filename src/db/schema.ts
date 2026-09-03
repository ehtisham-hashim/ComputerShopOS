import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const ItemTitles = [
  "LAPTOP",
  "DESKTOP",
  "GPU",
  "CPU",
  "RAM",
  "STORAGE",
  "MOTHERBOARD",
  "PSU",
  "MONITOR",
  "KEYBOARD",
  "MOUSE",
  "ACCESSORY",
] as const;

export type ItemTitle = (typeof ItemTitles)[number];

export const SerialStatuses = ["AVAILABLE", "SOLD", "DEFECTIVE"] as const;
export type SerialStatus = (typeof SerialStatuses)[number];

export const PaymentMethods = ["CASH", "CARD", "SPLIT"] as const;
export type PaymentMethod = (typeof PaymentMethods)[number];

export const PaymentStatuses = ["PAID", "PARTIAL", "UNPAID"] as const;
export type PaymentStatus = (typeof PaymentStatuses)[number];

export const RepairStatuses = [
  "RECEIVED",
  "IN_PROGRESS",
  "WAITING_PARTS",
  "READY",
  "DELIVERED",
] as const;
export type RepairStatus = (typeof RepairStatuses)[number];

// 1. Customers Table
export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  email: text("email").default(""),
  address: text("address").default(""),
  notes: text("notes").default(""),
  createdAt: integer("created_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

// 2. Inventory Table (Integer Currency)
export const inventory = sqliteTable("inventory", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title", { enum: ItemTitles }).notNull(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  quantity: integer("quantity").notNull().default(0),
  price: integer("price").notNull().default(0),
  costPrice: integer("cost_price").notNull().default(0),
  isSerialized: integer("is_serialized").notNull().default(0),
  createdAt: integer("created_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export type InventoryItem = typeof inventory.$inferSelect;
export type NewInventoryItem = typeof inventory.$inferInsert;

// 3. Inventory Serials Table
export const inventorySerials = sqliteTable("inventory_serials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  inventoryId: integer("inventory_id")
    .notNull()
    .references(() => inventory.id, { onDelete: "cascade" }),
  serialNumber: text("serial_number").notNull(),
  status: text("status", { enum: SerialStatuses }).notNull().default("AVAILABLE"),
  createdAt: integer("created_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export type InventorySerial = typeof inventorySerials.$inferSelect;
export type NewInventorySerial = typeof inventorySerials.$inferInsert;

// 4. Sales Invoices Table (Integer Currency)
export const sales = sqliteTable("sales", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceNo: text("invoice_no").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull().default("Walk-in Customer"),
  customerPhone: text("customer_phone").notNull().default(""),
  subtotal: integer("subtotal").notNull().default(0),
  discount: integer("discount").notNull().default(0),
  tax: integer("tax").notNull().default(0),
  totalAmount: integer("total_amount").notNull().default(0),
  paidAmount: integer("paid_amount").notNull().default(0),
  paymentStatus: text("payment_status", { enum: PaymentStatuses }).notNull().default("PAID"),
  balanceDue: integer("balance_due").notNull().default(0),
  paymentMethod: text("payment_method", { enum: PaymentMethods }).notNull().default("CASH"),
  notes: text("notes").notNull().default(""),
  isBadDebt: integer("is_bad_debt").notNull().default(0),
  dueDate: integer("due_date"),
  createdAt: integer("created_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export type SaleRecord = typeof sales.$inferSelect;
export type NewSaleRecord = typeof sales.$inferInsert;

// 5. Sale Line Items Table (Integer Currency)
export const saleItems = sqliteTable("sale_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  saleId: integer("sale_id")
    .notNull()
    .references(() => sales.id, { onDelete: "cascade" }),
  inventoryId: integer("inventory_id")
    .notNull()
    .references(() => inventory.id),
  itemName: text("item_name").notNull(),
  serialNumber: text("serial_number"),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull().default(0),
  totalPrice: integer("total_price").notNull().default(0),
});

export type SaleLineItem = typeof saleItems.$inferSelect;
export type NewSaleLineItem = typeof saleItems.$inferInsert;

// 6. Repairs & Service Tickets Table (Integer Currency)
export const repairs = sqliteTable("repairs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticketNo: text("ticket_no").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  device: text("device").notNull(),
  reportedIssue: text("reported_issue").notNull(),
  partsUsed: text("parts_used").default("[]"),
  laborCost: integer("labor_cost").notNull().default(0),
  estimatedCost: integer("estimated_cost").notNull().default(0),
  finalCost: integer("final_cost").notNull().default(0),
  status: text("status", { enum: RepairStatuses }).notNull().default("RECEIVED"),
  createdAt: integer("created_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export type RepairTicketRecord = typeof repairs.$inferSelect;
export type NewRepairTicketRecord = typeof repairs.$inferInsert;

// 7. Adjustments / PC Swap & Trade-In Table (Integer Currency)
export const adjustments = sqliteTable("adjustments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  adjustmentNo: text("adjustment_no").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  itemTakenName: text("item_taken_name").notNull(),
  itemTakenValue: integer("item_taken_value").notNull().default(0),
  itemGivenInventoryId: integer("item_given_inventory_id").references(() => inventory.id),
  itemGivenName: text("item_given_name").notNull(),
  itemGivenPrice: integer("item_given_price").notNull().default(0),
  netDifference: integer("net_difference").notNull().default(0),
  paidAmount: integer("paid_amount").notNull().default(0),
  balanceDue: integer("balance_due").notNull().default(0),
  paymentStatus: text("payment_status", { enum: PaymentStatuses }).notNull().default("PAID"),
  notes: text("notes").default(""),
  createdAt: integer("created_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export type AdjustmentRecord = typeof adjustments.$inferSelect;
export type NewAdjustmentRecord = typeof adjustments.$inferInsert;

// 8. Settings Key-Value Store
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export type SettingRecord = typeof settings.$inferSelect;
export type NewSettingRecord = typeof settings.$inferInsert;

// 9. Brand & Document Types
export const BrandTypes = [
  "tasnim_computers",
  "farhan_computers",
  "farhan_enterprises",
] as const;
export type BrandType = (typeof BrandTypes)[number];

export const DocTypes = ["invoice", "quotation", "bill", "challan"] as const;
export type DocType = (typeof DocTypes)[number];

export interface DocumentLineItem {
  sn: number;
  description: string;
  qty: number;
  unitPrice: number;
  totalAmount: number;
}

// 10. Generated Documents Table
export const documents = sqliteTable("documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brand: text("brand", { enum: BrandTypes }).notNull().default("tasnim_computers"),
  docType: text("doc_type", { enum: DocTypes }).notNull().default("invoice"),
  refNo: text("ref_no").notNull().unique(),
  date: text("date").notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerAddress: text("customer_address").notNull().default(""),
  customerPhone: text("customer_phone").notNull().default(""),
  itemsJson: text("items_json").notNull().default("[]"),
  subtotal: integer("subtotal").notNull().default(0),
  discount: integer("discount").notNull().default(0),
  tax: integer("tax").notNull().default(0),
  totalAmount: integer("total_amount").notNull().default(0),
  paymentMode: text("payment_mode").notNull().default("CASH"),
  warrantyTerms: text("warranty_terms").notNull().default("ONE WEEK CHECK WARRANTY"),
  notes: text("notes").notNull().default(""),
  schemaVersion: integer("schema_version").notNull().default(1),
  createdAt: integer("created_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
  updatedAt: integer("updated_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export type DocumentRecord = typeof documents.$inferSelect;
export type NewDocumentRecord = typeof documents.$inferInsert;

// --- Domain Interfaces ---

export interface CreateDocumentInput {
  brand: BrandType;
  docType?: DocType;
  refNo: string;
  date: string;
  customerId?: number;
  customerName: string;
  customerAddress?: string;
  customerPhone?: string;
  items: DocumentLineItem[];
  subtotal: number;
  discount?: number;
  tax?: number;
  totalAmount: number;
  paymentMode?: string;
  warrantyTerms?: string;
  notes?: string;
}

export interface RepairPartUsed {
  name: string;
  cost: number;
  isHardware: boolean;
  inventoryId?: number;
  quantity?: number;
}

export interface CreateSaleInput {
  customerId?: number;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: {
    inventoryId: number;
    itemName: string;
    serialNumber?: string;
    quantity: number;
    unitPrice: number;
  }[];
  subtotal: number;
  discount?: number;
  tax?: number;
  totalAmount: number;
  paidAmount?: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface AddRepairInput {
  customerId?: number;
  customerName: string;
  customerPhone: string;
  device: string;
  reportedIssue: string;
  partsUsed?: RepairPartUsed[];
  laborCost?: number;
  estimatedCost?: number;
  status?: RepairStatus;
}

export interface CreateAdjustmentInput {
  customerId?: number;
  customerName: string;
  customerPhone: string;
  itemTakenName: string;
  itemTakenValue: number;
  itemGivenInventoryId?: number;
  itemGivenName: string;
  itemGivenPrice: number;
  serialNumber?: string;
  netDifference: number;
  paidAmount?: number;
  balanceDue?: number;
  paymentStatus?: PaymentStatus;
  notes?: string;
}

// 11. Payables - Suppliers / Parties Master Table
export const payableParties = sqliteTable("payable_parties", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").default(""),
  address: text("address").default(""),
  totalDebit: integer("total_debit").notNull().default(0),
  totalCredit: integer("total_credit").notNull().default(0),
  currentBalance: integer("current_balance").notNull().default(0),
  notes: text("notes").default(""),
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export type PayableParty = typeof payableParties.$inferSelect;
export type NewPayableParty = typeof payableParties.$inferInsert;

// 12. Payables - 2-Level Transaction Ledger Table
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
  txDate: integer("tx_date").notNull(),
  txType: text("tx_type", { enum: PayableTxTypes }).notNull().default("PURCHASE"),
  refNo: text("ref_no").default(""),
  description: text("description").notNull().default(""),
  debit: integer("debit").notNull().default(0),
  credit: integer("credit").notNull().default(0),
  balance: integer("balance").notNull().default(0),
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export type PayableLedgerEntry = typeof payableLedger.$inferSelect;
export type NewPayableLedgerEntry = typeof payableLedger.$inferInsert;

export interface CreatePayablePartyInput {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  openingBalance?: number;
}

export interface CreatePayableLedgerInput {
  partyId: number;
  txDate: number;
  txType: PayableTxType;
  refNo?: string;
  description: string;
  debit?: number;
  credit?: number;
}
