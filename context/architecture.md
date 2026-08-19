# ComputerShopOS - Simple & Clean Architecture

> **Stack:** Tauri 2 (Rust) + React 19 + TypeScript + Vite + Tailwind CSS + Shadcn UI + SQLite (Drizzle ORM)  
> **Goal:** Fast, lightweight, reliable desktop app for PC store daily operations.

---

## 1. The Core 4 Modules

Everything in the app revolves around 4 simple screens:

```
┌─────────────────┐      ┌─────────────────┐
│   1. Inventory  │ ───► │  2. POS / Sales │
│ (Stock & Serials│      │ (Cart & Receipt)│
└─────────────────┘      └─────────────────┘
         ▲                        ▲
         │                        │
┌─────────────────┐      ┌─────────────────┐
│  3. PC Builder  │      │   4. Repairs    │
│(Parts & Wattage)│      │(Ticket & Status)│
└─────────────────┘      └─────────────────┘
```

1. **Inventory**: Add/edit hardware components, track quantities, cost price, sell price, and optional serial numbers (for GPUs, CPUs, Mobos).
2. **Point of Sale (POS)**: Search/scan items, pick serial number if item has one, take payment (Cash/Card), print clean receipt or save PDF invoice.
3. **PC Builder**: Pick parts from inventory (CPU, GPU, RAM, Mobo, Storage, PSU, Case), show total price + total estimated wattage, 1-click convert to sale or quotation.
4. **Repairs**: Create customer repair ticket, mark issue, update status (`Received` -> `In Progress` -> `Done`), add repair fee, hand back to customer.

---

## 2. Clean Database Schema (6 Simple Tables)

No bloated tables. Only what is needed:

```
┌──────────────────┐       ┌─────────────────┐
│    inventory     │ 1───N │ inventory_serial│
│ (items & stock)  │       │ (serial numbers)│
└──────────────────┘       └─────────────────┘
         │ 1
         │
         │ N
┌──────────────────┐       ┌─────────────────┐
│    sale_items    │ N───1 │      sales      │
│ (line items)     │       │(invoices/orders)│
└──────────────────┘       └─────────────────┘

┌──────────────────┐       ┌─────────────────┐
│     repairs      │       │    settings     │
│ (service tickets)│       │ (store profile) │
└──────────────────┘       └─────────────────┘
```

### Table Definitions:
* **`inventory`**: `id`, `name`, `category` (CPU, GPU, RAM, etc.), `sku`, `cost_price`, `sell_price`, `quantity`, `is_serialized`, `created_at`
* **`inventory_serials`**: `id`, `inventory_id`, `serial_number`, `status` (`available`, `sold`, `defective`)
* **`sales`**: `id`, `invoice_no`, `customer_name`, `customer_phone`, `total_amount`, `payment_method`, `created_at`
* **`sale_items`**: `id`, `sale_id`, `inventory_id`, `serial_number`, `quantity`, `unit_price`, `total_price`
* **`repairs`**: `id`, `ticket_no`, `customer_name`, `customer_phone`, `device`, `issue`, `status`, `cost`, `created_at`
* **`settings`**: `id`, `store_name`, `store_address`, `store_phone`, `tax_rate`, `currency_symbol`, `theme`

---

## 3. UI & Design System

* **Tailwind CSS + Shadcn UI**: Clean, modern, accessible components (Buttons, Inputs, Dialogs, Tables, Dropdowns, Badges).
* **Light & Dark Mode**: Simple toggle with persistent preference stored in local state.
* **Fast Navigation**: Simple sidebar with icons (Inventory, POS, PC Builder, Repairs, Settings).
* **Desktop Friendly**: Full keyboard support, auto-focus search fields, responsive data tables.

---

## 4. Cross-Platform & Storage

* **Database File:** Single `pc_shop.db` SQLite file located in the OS application data folder via Tauri Path API (`@tauri-apps/api/path`).
* **Offline First:** 100% runs locally without internet.
* **One-Click Backup:** Simple "Export Backup" button in Settings that copies `pc_shop.db` to user-chosen location.
* **Printing:** Built-in standard browser/system print dialog formatted cleanly for receipts and invoices.

---

## 5. Development Steps

1. **Step 1:** Setup Tailwind CSS + Shadcn UI base components + Dark/Light mode.
2. **Step 2:** Update SQLite schema (`src/db/schema.ts`) with the 6 core tables.
3. **Step 3:** Polish **Inventory** screen with serial number support.
4. **Step 4:** Build **POS** screen (Cart, item search, checkout, receipt print).
5. **Step 5:** Build **PC Builder** screen (Part selector + wattage sum + quote print).
6. **Step 6:** Build **Repairs** screen (Ticket list + status switcher).
7. **Step 7:** Build **Settings** screen (Store details + Backup button).
