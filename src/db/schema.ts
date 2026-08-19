import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";

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

// 1. Customers Table (Entity)
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
export type CustomerRecord = Customer;
export type NewCustomer = typeof customers.$inferInsert;

// 2. Inventory Table
export const inventory = sqliteTable("inventory", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title", { enum: ItemTitles }).notNull(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  quantity: integer("quantity").notNull().default(0),
  price: real("price").notNull().default(0.0),
  costPrice: real("cost_price").notNull().default(0.0),
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

// 4. Sales Invoices Table
export const sales = sqliteTable("sales", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceNo: text("invoice_no").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull().default("Walk-in Customer"),
  customerPhone: text("customer_phone").notNull().default(""),
  subtotal: real("subtotal").notNull().default(0.0),
  discount: real("discount").notNull().default(0.0),
  tax: real("tax").notNull().default(0.0),
  totalAmount: real("total_amount").notNull().default(0.0),
  paidAmount: real("paid_amount").notNull().default(0.0),
  paymentStatus: text("payment_status", { enum: PaymentStatuses }).notNull().default("PAID"),
  balanceDue: real("balance_due").notNull().default(0.0),
  paymentMethod: text("payment_method", { enum: PaymentMethods }).notNull().default("CASH"),
  notes: text("notes").notNull().default(""),
  createdAt: integer("created_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export type SaleRecord = typeof sales.$inferSelect;
export type NewSaleRecord = typeof sales.$inferInsert;

// 5. Sale Line Items Table
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
  unitPrice: real("unit_price").notNull().default(0.0),
  totalPrice: real("total_price").notNull().default(0.0),
});

export type SaleLineItem = typeof saleItems.$inferSelect;
export type NewSaleLineItem = typeof saleItems.$inferInsert;

// 6. Repairs & Service Tickets Table
export const repairs = sqliteTable("repairs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticketNo: text("ticket_no").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  device: text("device").notNull(),
  reportedIssue: text("reported_issue").notNull(),
  partsUsed: text("parts_used").default("[]"), // JSON string of [{ name, cost, isHardware, inventoryId? }]
  laborCost: real("labor_cost").notNull().default(0.0),
  estimatedCost: real("estimated_cost").notNull().default(0.0),
  finalCost: real("final_cost").notNull().default(0.0),
  status: text("status", { enum: RepairStatuses }).notNull().default("RECEIVED"),
  createdAt: integer("created_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export type RepairTicketRecord = typeof repairs.$inferSelect;
export type NewRepairTicketRecord = typeof repairs.$inferInsert;

// 7. Adjustments / PC Swap & Trade-In Table
export const adjustments = sqliteTable("adjustments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  adjustmentNo: text("adjustment_no").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  itemTakenName: text("item_taken_name").notNull(), // Trade-in PC / Part
  itemTakenValue: real("item_taken_value").notNull().default(0.0), // Valuation given
  itemGivenInventoryId: integer("item_given_inventory_id").references(() => inventory.id),
  itemGivenName: text("item_given_name").notNull(), // New PC / Part given
  itemGivenPrice: real("item_given_price").notNull().default(0.0), // Store retail price
  netDifference: real("net_difference").notNull().default(0.0), // Positive = Customer pays, Negative = Store refunds
  paidAmount: real("paid_amount").notNull().default(0.0),
  balanceDue: real("balance_due").notNull().default(0.0),
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
