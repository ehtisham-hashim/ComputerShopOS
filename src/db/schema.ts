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

export const inventory = sqliteTable("inventory", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title", { enum: ItemTitles }).notNull(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  quantity: integer("quantity").notNull().default(0),
  price: real("price").notNull().default(0.0),
  createdAt: integer("created_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export type InventoryItem = typeof inventory.$inferSelect;
export type NewInventoryItem = typeof inventory.$inferInsert;
