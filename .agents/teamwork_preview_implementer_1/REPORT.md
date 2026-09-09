# Implementation Report: Inventory Connections Audit & Fixes

## 1. What was changed
- `src/App.tsx`: Derived `activeRepairsCount` from live data (`getRepairTickets()`) filtering tickets where `status !== "DELIVERED"` instead of hardcoded `2`.
- `src/db/schema.ts`:
  - Removed redundant `CustomerRecord` alias (`TYPE-01`).
  - Added shared domain/service input interfaces: `RepairPartUsed`, `CreateSaleInput`, `AddRepairInput`, `CreateAdjustmentInput` (`TYPE-02`).
- `src/db/posService.ts`:
  - Imported `CreateSaleInput` from `./schema` and re-exported it.
  - Implemented `deleteSale` / `deleteSaleTransaction` to restore item inventory quantities and serial availability on sale deletion (`SUGGEST-02`).
- `src/db/repairsService.ts`:
  - Imported `RepairPartUsed`, `AddRepairInput` from `./schema` and re-exported them.
  - Updated `deleteRepairTicket` to restore hardware parts inventory quantities on deletion (`SUGGEST-02`).
- `src/db/adjustmentsService.ts`:
  - Imported `CreateAdjustmentInput` from `./schema` and re-exported it.
  - Updated `createAdjustment` to mark serialized items as `SOLD` in `inventory_serials` (`SUGGEST-03`).
  - Updated `deleteAdjustment` to restore item stock and restore serial availability on deletion (`SUGGEST-02`).
- `src/pages/Adjustments.tsx`:
  - Replaced `CustomerRecord` type import and state typing with `Customer` (`TYPE-01`).
- `src/pages/Repairs.tsx`:
  - Updated `RepairPartUsed` import to source from `../db/schema`.
  - Added `onRefreshInventory` callback triggers on `handleStatusChange` and `handleDelete`.
- `src/pages/Sales.tsx`:
  - Added Discount UI input field and calculation breakdown to New Sale modal and Invoice receipt modal (`SUGGEST-04`).
  - Added pre-checkout stock validation before transaction commit to prevent negative inventory (`SUGGEST-05`).

## 2. Verification
- `npx tsc --noEmit`: Clean compilation without any errors or warnings.
- `npm run build`: Production build succeeded (`vite build` & `tsc`).
- Integration tests verified:
  - Sale creation & deletion inventory/serial restoration.
  - Repair ticket creation & deletion hardware parts inventory restoration with custom quantities.
  - Adjustment creation marking serials `SOLD` and deletion restoring inventory and serial availability.
