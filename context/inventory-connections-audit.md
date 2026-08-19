# Inventory ↔ Sales / Repairs / Adjustments — Audit, Flaws & Fix Guide

> **For other agents**: This document is a complete audit of how Sales, Repairs, and Adjustments interact
> with the Inventory layer in `ComputerShopOS`. Read all sections before touching any service or page file.
> Every bug, type gap, and missing feature is documented with the exact fix.

---

## 1. Architecture Overview

```
App.tsx  (owns items: InventoryItem[], calls fetchItems = getInventoryItems())
 ├── SalesPage       items={items}  onSaleComplete={fetchItems}
 ├── RepairsPage     items={items}                              ← NO refresh callback!
 ├── AdjustmentsPage items={items}  onRefreshInventory={fetchItems}
 └── InventoryPage   items={items}  onRefresh={fetchItems}
```

### Data Flow: Inventory Mutation Paths

| Module          | Service call                 | Inventory mutation                                    |
|-----------------|------------------------------|-------------------------------------------------------|
| **Sales**       | `createSaleTransaction()`    | `UPDATE inventory SET quantity = MAX(0, qty - N)` ✅  |
| **Sales**       | (serial item)                | `UPDATE inventory_serials SET status='SOLD'` ✅        |
| **Repairs**     | `addRepairTicket()`          | `UPDATE inventory SET quantity = MAX(0, qty - 1)` (hardware parts only) ✅ |
| **Adjustments** | `createAdjustment()`         | `UPDATE inventory SET quantity = MAX(0, qty - 1)` (given item only) ✅ |

Core logic is **correctly wired** — all three modules decrement inventory on commit.

---

## 2. Confirmed Bugs & Flaws

### 🔴 BUG-01: RepairsPage has NO `onRefreshInventory` callback

**File**: `src/App.tsx` L175

```tsx
// CURRENT (broken — inventory in App never refreshes after repair ticket creation)
{activeTab === "repairs" && <RepairsPage items={items} />}

// FIX
{activeTab === "repairs" && (
  <RepairsPage items={items} onRefreshInventory={fetchItems} />
)}
```

**Impact**: After creating a repair ticket that uses hardware inventory parts, `items` state in `App.tsx`
goes stale. The SalesPage and AdjustmentsPage will show outdated stock counts until a manual page refresh.

**Fix in RepairsPage** — `src/pages/Repairs.tsx`:

```tsx
// 1. Update props interface
interface RepairsPageProps {
  items?: InventoryItem[];
  onRefreshInventory?: () => Promise<void>;  // ADD THIS
}

// 2. Destructure it
export const RepairsPage: React.FC<RepairsPageProps> = ({
  items = [],
  onRefreshInventory,  // ADD THIS
}) => { ... }

// 3. Call it in handleCreateTicket after addRepairTicket
const handleCreateTicket = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!customerName.trim() || !device.trim()) return;

  await addRepairTicket({ ... });

  await fetchTickets();
  if (onRefreshInventory) await onRefreshInventory();  // ADD THIS
  setIsModalOpen(false);
  // ... reset form
};
```

---

### 🔴 BUG-02: `adjustmentNo` collision — tiny range causes duplicates

**File**: `src/db/adjustmentsService.ts` L55

```ts
// CURRENT — only 900 possible values (100-999), will collide on busy stores
const adjustmentNo = `ADJ-${Math.floor(100 + Math.random() * 900)}`;

// FIX — use timestamp slice like posService does
const adjustmentNo = `ADJ-${Date.now().toString().slice(-7)}`;
```

The `adjustments` table has a `UNIQUE` constraint on `adjustment_no` — a collision will throw a
SQLite error and fail the transaction.

---

### 🔴 BUG-03: `repairTicketNo` collision — same small-range issue

**File**: `src/db/repairsService.ts` L55

```ts
// CURRENT — only 9000 possible values
const ticketNo = `RMA-${Math.floor(1000 + Math.random() * 9000)}`;

// FIX
const ticketNo = `RMA-${Date.now().toString().slice(-7)}`;
```

---

### 🔴 BUG-04: Repairs — hardware parts decrement by hard-coded `1`, ignores quantity

**File**: `src/db/repairsService.ts` L93-L100

```ts
// CURRENT — always decrements by 1 regardless of how many units were used
for (const p of parts) {
  if (p.isHardware && p.inventoryId) {
    await sqlDb.execute(
      "UPDATE inventory SET quantity = MAX(0, quantity - 1) WHERE id = $1",
      [p.inventoryId]
    );
  }
}
```

The `RepairPartUsed` interface has no `quantity` field, so adding 2 RAM sticks from one inventory
item only deducts 1. **Three-part fix**:

**Step 1** — Add `quantity` to `RepairPartUsed`:

```ts
export interface RepairPartUsed {
  name: string;
  cost: number;
  isHardware: boolean;
  inventoryId?: number;
  quantity?: number;  // ADD — defaults to 1
}
```

**Step 2** — Use it in the SQLite deduction loop:

```ts
for (const p of parts) {
  if (p.isHardware && p.inventoryId) {
    const qty = p.quantity ?? 1;
    await sqlDb.execute(
      "UPDATE inventory SET quantity = MAX(0, quantity - $1) WHERE id = $2",
      [qty, p.inventoryId]
    );
  }
}
```

**Step 3** — Apply the same fix to the browser fallback block:

```ts
for (const p of parts) {
  if (p.isHardware && p.inventoryId) {
    const inv = memoryStore.inventory.find((i) => i.id === p.inventoryId);
    if (inv) inv.quantity = Math.max(0, inv.quantity - (p.quantity ?? 1));
  }
}
```

---

### 🟡 BUG-05: Adjustments memory fallback doesn't use `Math.max` consistently

**File**: `src/db/adjustmentsService.ts` L139-L143

```ts
// CURRENT — guards with > 0 but plain subtraction (minor inconsistency)
if (inv && inv.quantity > 0) {
  inv.quantity -= 1;
}

// FIX — mirrors SQLite path
if (inv) {
  inv.quantity = Math.max(0, inv.quantity - 1);
}
```

---

### 🟡 BUG-06: Sales catalog shows items with 0 quantity (out-of-stock)

**File**: `src/pages/Sales.tsx` L220-L224

```ts
// CURRENT — no stock filter
const filteredCatalog = items.filter(
  (i) =>
    i.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    i.sku.toLowerCase().includes(catalogSearch.toLowerCase())
);

// FIX — exclude out-of-stock from catalog picker
const filteredCatalog = items.filter(
  (i) =>
    i.quantity > 0 &&
    (i.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
     i.sku.toLowerCase().includes(catalogSearch.toLowerCase()))
);
```

---

### 🟡 BUG-07: Cart allows quantity exceeding available stock

**File**: `src/pages/Sales.tsx` L122-L132

```ts
// FIX — cap at available stock
const addToCart = (product: InventoryItem) => {
  setCart((prev) => {
    const existing = prev.find((c) => c.item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.quantity) return prev; // at stock ceiling
      return prev.map((c) =>
        c.item.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
      );
    }
    if (product.quantity < 1) return prev; // out of stock
    return [...prev, { item: product, quantity: 1 }];
  });
};
```

---

### 🟡 BUG-08: `activeRepairsCount` is hardcoded `2` in App.tsx

**File**: `src/App.tsx` L136

```tsx
// CURRENT — sidebar badge always shows "2"
activeRepairsCount={2}
```

Lift repair tickets count to `App.tsx` state. Add a `fetchRepairsCount` call alongside `fetchItems`,
or pass a callback to `RepairsPage` that reports the current open ticket count back up.

---

## 3. Type System Review

### Placement Status

| Type / Const              | Location              | Status |
|---------------------------|-----------------------|--------|
| `ItemTitle`, `ItemTitles` | `schema.ts`           | ✅ correct |
| `SerialStatus/es`         | `schema.ts`           | ✅ correct |
| `PaymentMethod/s`         | `schema.ts`           | ✅ correct |
| `PaymentStatus/es`        | `schema.ts`           | ✅ correct |
| `RepairStatus/es`         | `schema.ts`           | ✅ correct |
| `InventoryItem` / `New-`  | `schema.ts`           | ✅ correct |
| `SaleRecord` / `New-`     | `schema.ts`           | ✅ correct |
| `AdjustmentRecord`        | `schema.ts`           | ✅ correct |
| `RepairTicketRecord`      | `schema.ts`           | ✅ correct |
| `Customer` / `CustomerRecord` | `schema.ts`       | ⚠️ `CustomerRecord = Customer` alias is redundant |
| `RepairPartUsed`          | `repairsService.ts`   | ⚠️ should be in `schema.ts` |
| `CreateSaleInput`         | `posService.ts`       | ⚠️ should be in `schema.ts` or `types.ts` |
| `CreateAdjustmentInput`   | `adjustmentsService.ts` | ⚠️ same |
| `AddRepairInput`          | `repairsService.ts`   | ⚠️ same |
| `CartItem`                | `Sales.tsx` (exported) | ⚠️ page UI type leaked as export |

### 🟡 TYPE-01: `CustomerRecord` alias is noise

```ts
// schema.ts L50 — DELETE this line
export type CustomerRecord = Customer;
```

`Adjustments.tsx` imports `CustomerRecord` — swap to `Customer` and remove the alias.

### 🟡 TYPE-02: Input interfaces should live in `schema.ts` or a shared `types.ts`

`CreateSaleInput`, `AddRepairInput`, `CreateAdjustmentInput`, and `RepairPartUsed` are all defined
inside service files. Move them to `src/db/schema.ts` or a new `src/db/types.ts` so any module can
import them without importing the full service.

### 🟡 TYPE-03: `CartItem` exported from `Sales.tsx` — wrong layer

```ts
// Sales.tsx L28 — remove the `export` keyword or move to src/types/ui.ts
export interface CartItem { ... }
```

### 🟡 TYPE-04: `partsUsed` column is an untyped JSON blob

The column is `TEXT DEFAULT '[]'` — Drizzle gives it type `string | null`. Always parse with:

```ts
const parts: RepairPartUsed[] = JSON.parse(ticket.partsUsed || "[]");
```

Consider a helper:

```ts
// src/db/helpers.ts
export function parsePartsUsed(raw: string | null): RepairPartUsed[] {
  try { return JSON.parse(raw || "[]"); } catch { return []; }
}
```

---

## 4. Missing Features / Suggestions

### 💡 SUGGEST-01: Repair ticket update should allow parts change + re-sync inventory

`updateRepairStatus()` only updates `status`/`final_cost`. If a tech adds more parts on an existing
ticket, inventory is **never decremented**. Add an `updateRepairParts()` function.

### 💡 SUGGEST-02: Delete operations must restore inventory (currently they don't)

`deleteAdjustment`, `deleteRepairTicket` only remove the DB row — no stock is restored.
This causes **permanent phantom stock loss**.

```ts
// Minimal fix for deleteAdjustment in adjustmentsService.ts
export async function deleteAdjustment(id: number): Promise<void> {
  const sqlDb = await getSqlDb();
  if (isTauriEnvironment() && sqlDb) {
    const [record] = await sqlDb.select<any[]>(
      "SELECT item_given_inventory_id FROM adjustments WHERE id = $1", [id]
    );
    await sqlDb.execute("DELETE FROM adjustments WHERE id = $1", [id]);
    if (record?.item_given_inventory_id) {
      await sqlDb.execute(
        "UPDATE inventory SET quantity = quantity + 1 WHERE id = $1",
        [record.item_given_inventory_id]
      );
    }
    return;
  }
  // memory fallback: also restore quantity
}
```

Apply the same pattern to `deleteRepairTicket`.

### 💡 SUGGEST-03: Adjustment — mark serial SOLD when a serialized item is given out

`createAdjustment()` decrements quantity but never updates `inventory_serials.status` to `'SOLD'`.
Add a serial status update (similar to what `posService.ts` does for sales).

### 💡 SUGGEST-04: Sales `discount` field is always `0` — dead column

```ts
// Sales.tsx L189
discount: 0,  // hardcoded — no UI input exists
```

Either add a discount input to the sale modal, or remove the `discount` column entirely.

### 💡 SUGGEST-05: Add pre-checkout stock validation in Sales

```ts
// Before createSaleTransaction() in handleCheckout:
for (const c of cart) {
  const live = items.find((i) => i.id === c.item.id);
  if (!live || live.quantity < c.quantity) {
    alert(`Insufficient stock for "${c.item.name}". Available: ${live?.quantity ?? 0}`);
    setIsProcessing(false);
    return;
  }
}
```

---

## 5. Priority Fix List

| Priority | ID          | File                          | Action                                        |
|----------|-------------|-------------------------------|-----------------------------------------------|
| 🔴 P1   | BUG-01      | `App.tsx` + `Repairs.tsx`     | Add `onRefreshInventory` callback             |
| 🔴 P1   | BUG-02      | `adjustmentsService.ts`       | Fix `adjustmentNo` collision risk             |
| 🔴 P1   | BUG-03      | `repairsService.ts`           | Fix `ticketNo` collision risk                 |
| 🔴 P1   | BUG-04      | `repairsService.ts`           | Add `quantity` to `RepairPartUsed`, use it   |
| 🟡 P2   | BUG-05      | `adjustmentsService.ts`       | Use `Math.max` in memory fallback             |
| 🟡 P2   | BUG-06      | `Sales.tsx`                   | Filter zero-stock from catalog                |
| 🟡 P2   | BUG-07      | `Sales.tsx`                   | Cap cart qty at stock limit                   |
| 🟡 P2   | BUG-08      | `App.tsx`                     | Derive `activeRepairsCount` from live data    |
| 🟡 P2   | SUGGEST-02  | All services                  | Restore inventory on record delete            |
| 🟡 P2   | TYPE-01     | `schema.ts`                   | Remove `CustomerRecord` alias                 |
| 🟢 P3   | SUGGEST-03  | `adjustmentsService.ts`       | Mark serial SOLD on adjustment                |
| 🟢 P3   | SUGGEST-04  | `Sales.tsx`                   | Add discount UI field or remove column        |
| 🟢 P3   | SUGGEST-05  | `Sales.tsx`                   | Pre-checkout stock validation                 |
| 🟢 P3   | TYPE-02     | `schema.ts` / `types.ts`      | Move input interfaces out of service files    |

---

## 6. Key Files Reference

| File | Role |
|------|------|
| `src/db/schema.ts` | All Drizzle table defs + exported types |
| `src/db/client.ts` | DB init, memory store seed data, `getSqlDb()` |
| `src/db/inventoryService.ts` | CRUD for `inventory` + `inventory_serials` |
| `src/db/posService.ts` | `createSaleTransaction()` — inventory deduction ✅ |
| `src/db/repairsService.ts` | `addRepairTicket()` — deduction ✅ (BUG-04 partial) |
| `src/db/adjustmentsService.ts` | `createAdjustment()` — deduction ✅ |
| `src/pages/Sales.tsx` | UI — cart, checkout, invoices list |
| `src/pages/Repairs.tsx` | UI — ticket form, status board |
| `src/pages/Adjustments.tsx` | UI — trade-in form, adjustments table |
| `src/App.tsx` | Root — owns `items` state, orchestrates refresh |

---

## 7. Invariants Other Agents Must Respect

1. **`items` state lives only in `App.tsx`** — pages receive it as props. Never fetch inventory
   directly inside a page; call the provided `onRefreshInventory` / `onSaleComplete` callback instead.
2. **All SQLite mutations live in service files only** — pages call service functions, never raw SQL.
3. **Memory store is browser-only fallback** — keep SQLite and memory paths in sync.
4. **`isTauriEnvironment()` must be called after `await getSqlDb()`** — the function checks `sqlDb !== null`.
5. **`partsUsed` is a JSON string** — always `JSON.parse(ticket.partsUsed || "[]")` before use.
6. **All timestamps are Unix seconds** — multiply by 1000 for JS Date: `new Date(record.createdAt * 1000)`.
7. **`invoiceNo` uniqueness** — uses `Date.now().slice(-6)` which is fine for low-volume; collision
   theoretically possible within the same millisecond if creating concurrent sales (very edge case).
