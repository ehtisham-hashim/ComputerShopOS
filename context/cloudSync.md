# ComputerShopOS — Cloud Sync Architecture

> **Pattern:** Offline-First Local SQLite + Background Sync to Cloud Postgres (Neon)
> **Local DB:** SQLite via `@tauri-apps/plugin-sql` (unchanged)
> **Cloud DB:** Neon Postgres (free tier, 512MB)
> **Sync Direction:** Bidirectional (push local changes up, pull remote changes down)
> **Conflict Strategy:** Last-Write-Wins (LWW) using timestamps

---

## 1. Philosophy & Core Principles

### The Golden Rule
**The local SQLite database is ALWAYS the primary source of truth for the running application.** The app reads from and writes to local SQLite only. The cloud database is a secondary replica — it receives pushed changes and provides pulled changes, but the app never queries Postgres directly for UI rendering or business logic.

### Why This Pattern
- A POS system MUST work without internet. Sales, repairs, inventory — everything must function offline.
- Cloud sync exists for: backup, multi-device access (future), and remote data visibility (dashboards, reports from browser).
- SQLite and Postgres are different databases. We do NOT try to make them behave as one. We treat them as independent stores connected by a sync engine.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  TAURI DESKTOP APP                       │
│                                                         │
│  ┌──────────────┐    ┌─────────────────────────────┐   │
│  │   React UI   │───▶│   Service Layer              │   │
│  │  (pages,     │    │   (inventoryService,          │   │
│  │   components)│    │    posService, repairsService, │   │
│  └──────────────┘    │    customerService, etc.)      │   │
│                      └──────────────┬──────────────────┘   │
│                                     │                      │
│                      ┌──────────────▼──────────────────┐   │
│                      │       LOCAL SQLite               │   │
│                      │   (pc_shop.db — all tables)      │   │
│                      │   This is the ONLY database      │   │
│                      │   the app talks to directly.     │   │
│                      └──────────────┬──────────────────┘   │
│                                     │                      │
│                      ┌──────────────▼──────────────────┐   │
│                      │      SYNC ENGINE                 │   │
│                      │  (reads sync_queue, pushes to    │   │
│                      │   cloud, pulls from cloud,       │   │
│                      │   runs on background timer)      │   │
│                      └──────────────┬──────────────────┘   │
│                                     │                      │
└─────────────────────────────────────┼──────────────────────┘
                                      │ HTTPS (when online)
                                      │
                       ┌──────────────▼──────────────────┐
                       │      NEON POSTGRES (Cloud)       │
                       │  - Mirror of all local tables    │
                       │  - Same schema (adapted for PG)  │
                       │  - 512MB free tier                │
                       │  - Accessible via connection      │
                       │    string or HTTP API             │
                       └──────────────────────────────────┘
```

---

## 2. What Changes in the Local SQLite Database

### 2.1 New Metadata Columns on EVERY Syncable Table

Every table that participates in sync MUST have these additional columns:

| Column | Type | Purpose |
|--------|------|---------|
| `sync_id` | `TEXT NOT NULL UNIQUE` | A UUID (v4) generated client-side. This is the **global identity** of the row across all devices. Local `INTEGER PRIMARY KEY AUTOINCREMENT` ids are local-only and MUST NOT be used for sync. |
| `updated_at` | `INTEGER NOT NULL` | Unix timestamp (seconds) of last modification. Used for Last-Write-Wins conflict resolution. Must be updated on EVERY write (insert or update). |
| `is_deleted` | `INTEGER NOT NULL DEFAULT 0` | Soft-delete flag. When a row is "deleted" locally, set this to `1` instead of running `DELETE`. The sync engine pushes the deletion to cloud, and only after confirmed sync should the row be physically purged. |
| `is_synced` | `INTEGER NOT NULL DEFAULT 0` | `0` = pending sync, `1` = synced to cloud. Every local write (insert, update, soft-delete) must reset this to `0`. The sync engine sets it to `1` after successful push. |

**These columns apply to ALL current and future tables that need sync:**
- `customers`
- `inventory`
- `inventory_serials`
- `sales`
- `sale_items`
- `repairs`
- `adjustments`
- `settings`
- Any future tables added to the schema

**Exception:** If a table is purely local (e.g., UI preferences, cached computations), it does NOT need these columns. But any table holding business data that should exist in the cloud MUST have them.

### 2.2 New Standalone Table: `sync_meta`

A small metadata table to track sync state:

```sql
CREATE TABLE IF NOT EXISTS sync_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

Stores values like:
- `last_push_at` — timestamp of last successful push
- `last_pull_at` — timestamp of last successful pull
- `device_id` — unique ID for this device/installation (generated once on first launch)
- `sync_enabled` — whether sync is active (`"true"` / `"false"`)
- `cloud_url` — the Neon connection string or API endpoint (set by user in Settings)

### 2.3 Schema Design Rules for Future Tables

When adding a new table to the schema:

1. **Always include** `sync_id TEXT NOT NULL UNIQUE DEFAULT ''`, `updated_at INTEGER NOT NULL`, `is_deleted INTEGER NOT NULL DEFAULT 0`, `is_synced INTEGER NOT NULL DEFAULT 0`.
2. **Generate `sync_id`** at insert time using a UUID v4 function. Never leave it empty.
3. **Use `sync_id`** as the cross-device identifier. Local autoincrement `id` is for local foreign keys and UI convenience only.
4. **Foreign keys in sync context:** When syncing relational data, foreign keys must reference `sync_id` of the parent row (not the local `id`). The cloud schema uses `sync_id` as the primary relationship key.
5. **Monetary values** remain integers (existing convention). Do not change this for sync.
6. **Timestamps** remain Unix epoch seconds (existing convention). Do not change this for sync.

---

## 3. Cloud Postgres Schema

### 3.1 Mirroring Strategy

The Neon Postgres database contains the **same tables** with the **same columns** as SQLite, with these adaptations:

| SQLite | Postgres Equivalent |
|--------|-------------------|
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `SERIAL PRIMARY KEY` (or just keep `sync_id` as PK) |
| `INTEGER` (for booleans like `is_serialized`) | `INTEGER` (keep same, don't convert to `BOOLEAN`) |
| `TEXT` (for enums) | `TEXT` (keep same, don't use Postgres `ENUM` type) |
| `INTEGER` (unix timestamps) | `INTEGER` (keep same, don't use `TIMESTAMP`) |

**Why keep types identical:** Simplifies sync engine. No type conversion logic. Data flows as-is between SQLite and Postgres.

### 3.2 Postgres Primary Key Strategy

In the cloud Postgres schema, `sync_id` is the **PRIMARY KEY** (not the local autoincrement `id`). The local `id` column can be stored in Postgres for reference but has no uniqueness constraint there — it is only unique per-device.

### 3.3 Who Creates the Postgres Schema

**The user** creates the Neon database and runs the initial schema migration (SQL file provided by the agent). The app does NOT auto-create cloud tables. Schema changes are manual migrations applied by the developer.

---

## 4. Sync Engine Design

### 4.1 Push (Local → Cloud)

The push process:

1. Query all rows where `is_synced = 0` across all syncable tables.
2. For each dirty row:
   - If `is_deleted = 1`: send a DELETE (by `sync_id`) to cloud.
   - If row exists in cloud (by `sync_id`): send an UPDATE with all columns.
   - If row does not exist in cloud: send an INSERT.
3. Use UPSERT (`INSERT ... ON CONFLICT (sync_id) DO UPDATE`) in Postgres to handle insert-or-update in one statement.
4. On successful push, set `is_synced = 1` locally.
5. On failure (network error, timeout), leave `is_synced = 0` — it will retry on next cycle.

**Push order matters for foreign keys:**
Push parent tables before child tables. Example order:
1. `customers` (no dependencies)
2. `settings` (no dependencies)
3. `inventory` (no dependencies)
4. `inventory_serials` (depends on `inventory`)
5. `sales` (depends on `customers`)
6. `sale_items` (depends on `sales` and `inventory`)
7. `repairs` (depends on `customers`)
8. `adjustments` (depends on `customers` and `inventory`)

This order must be maintained when new tables are added. If a new table has a foreign key to an existing table, it goes AFTER that table in the push order.

### 4.2 Pull (Cloud → Local)

The pull process:

1. Query cloud for all rows where `updated_at > last_pull_at`.
2. For each incoming row:
   - Look up local row by `sync_id`.
   - If local row does not exist: INSERT it locally (set `is_synced = 1`).
   - If local row exists and local `is_synced = 1` (clean): UPDATE local row, set `is_synced = 1`.
   - If local row exists and local `is_synced = 0` (dirty / has unpushed changes): **conflict**. Apply Last-Write-Wins — compare `updated_at`. Whichever is newer wins. If cloud wins, overwrite local and set `is_synced = 1`. If local wins, keep local and leave `is_synced = 0` (it will push on next cycle).
   - If incoming row has `is_deleted = 1`: soft-delete locally too.
3. Update `last_pull_at` in `sync_meta`.

**Pull order:** Reverse matters less, but pull parent tables first to avoid FK issues on insert.

### 4.3 Sync Trigger & Frequency

- **Background timer:** Run sync every 60-120 seconds when app is open and online.
- **Manual trigger:** User can press "Sync Now" button in Settings.
- **On app launch:** Run a sync attempt on startup (non-blocking, UI loads immediately from local data).
- **On app close:** Attempt a final push before shutdown (best-effort, non-blocking).
- **Network detection:** If offline, skip sync silently. No error toasts. No spinners. App works normally.

### 4.4 Sync Status UI

Minimal. Do not clutter the POS interface.

- Small icon in sidebar or header: green dot = synced, yellow dot = pending, red dot = error, gray dot = offline/disabled.
- Settings page: last sync time, pending changes count, manual sync button, enable/disable toggle.
- NO per-row sync indicators. NO sync progress bars. NO blocking modals during sync.

---

## 5. Communication with Cloud (API Layer)

### 5.1 How the App Talks to Neon Postgres

The Tauri app does NOT connect to Neon Postgres directly via a Postgres connection string from the frontend. Instead:

**Option A — Direct Neon HTTP API (Simpler, recommended for MVP):**
Neon provides a serverless HTTP/JSON API (`https://neon.tech/docs/serverless/serverless-driver`). The app sends SQL-over-HTTP requests. No backend server needed. The connection string is stored locally in `sync_meta`.

**Option B — Custom Backend API (More secure, recommended for production):**
A small API server (Node.js, Deno, Cloudflare Worker, etc.) sits between the app and Neon. The app sends JSON payloads, the server validates and writes to Postgres. This hides the database credentials from the client.

**For MVP:** Option A is fine. Connection string stored in `sync_meta` table. User enters it in Settings page.

**For production:** Option B preferred. Credentials never leave the server.

### 5.2 Authentication & Security

- The Neon connection string (or API key) is the authentication.
- Store it in `sync_meta` table in local SQLite (not in plain text files or environment variables on the client).
- For Option B, use API keys or JWT tokens issued by your backend.
- NEVER hardcode credentials in source code.
- NEVER ship credentials in the app binary.

---

## 6. What the Developer (User) Must Do

These are manual steps that cannot be automated by the coding agent:

### 6.1 Before Implementation
- [ ] Create a free Neon account at [neon.tech](https://neon.tech)
- [ ] Create a new Neon project and database (e.g., `computershop_cloud`)
- [ ] Save the connection string securely
- [ ] Decide: Option A (direct HTTP) or Option B (backend API) for MVP

### 6.2 During Implementation
- [ ] Review and approve the Postgres schema migration SQL before it runs against Neon
- [ ] Run the schema migration against Neon (via Neon console, psql, or provided script)
- [ ] Enter the Neon connection string into the app's Settings page after the sync feature is built
- [ ] Test sync with real data on a staging/test database before using production

### 6.3 Ongoing Maintenance
- [ ] When adding new tables to the schema: add sync columns, create corresponding Postgres table, add table to sync push/pull order
- [ ] Monitor Neon free tier usage (512MB limit)
- [ ] Periodically purge soft-deleted rows that are confirmed synced (both local and cloud)

---

## 7. What the Coding Agent Must Do

### 7.1 Local SQLite Changes
- Add `sync_id`, `updated_at`, `is_deleted`, `is_synced` columns to all existing syncable tables via migration
- Create `sync_meta` table
- Generate `sync_id` (UUID v4) for all existing rows that lack one (data migration)
- Update the Drizzle schema (`schema.ts`) to include new columns
- Update all service files to:
  - Set `updated_at` on every insert and update
  - Generate `sync_id` on every insert
  - Set `is_synced = 0` on every insert and update
  - Replace hard `DELETE` with soft-delete (`is_deleted = 1`, `is_synced = 0`) where appropriate
  - Exclude soft-deleted rows (`is_deleted = 0`) from all SELECT queries

### 7.2 Sync Engine
- Build the sync engine as a standalone module (e.g., `src/db/syncEngine.ts`)
- Implement push logic (local dirty rows to cloud)
- Implement pull logic (cloud changes to local)
- Implement conflict resolution (Last-Write-Wins by `updated_at`)
- Implement network detection (navigator.onLine or Tauri network API)
- Implement background timer (setInterval or requestIdleCallback)
- Implement sync status tracking (update `sync_meta`)

### 7.3 Postgres Schema
- Generate a SQL migration file that creates all tables in Postgres with identical column structure (adapted types as described in Section 3)
- Use `sync_id` as PRIMARY KEY in Postgres tables
- Include UPSERT-capable INSERT statements in push logic

### 7.4 UI Changes
- Add sync settings to the Settings page: connection string input, enable/disable toggle, sync now button, last sync time display
- Add sync status indicator to sidebar or header (small dot icon)
- No other UI changes. Sync is invisible to the cashier.

### 7.5 Service Layer Modifications (General Rule)

**For every existing and future service function that writes data (insert, update, delete):**

On INSERT:
- Generate and include `sync_id` (UUID v4)
- Set `updated_at` to current unix timestamp
- Set `is_synced = 0`
- Set `is_deleted = 0`

On UPDATE:
- Set `updated_at` to current unix timestamp
- Set `is_synced = 0`

On DELETE:
- Do NOT use `DELETE FROM`. Instead: `UPDATE ... SET is_deleted = 1, is_synced = 0, updated_at = <now>`
- Cascade soft-delete to child rows if applicable

On SELECT (read queries):
- Always add `WHERE is_deleted = 0` (or `AND is_deleted = 0`) to exclude soft-deleted rows
- This applies to list queries, search queries, detail queries, report aggregations — everything

---

## 8. What to AVOID

### 8.1 Agent Must Avoid

| Rule | Why |
|------|-----|
| **Never make the app depend on cloud connectivity to function.** | POS must work offline. If sync fails, app continues normally. |
| **Never query Postgres from the UI layer or service layer.** | Only the sync engine talks to cloud. Services only talk to local SQLite. |
| **Never use local autoincrement `id` for sync identity.** | Two devices will generate the same `id = 1`. Use `sync_id` (UUID) for cross-device identity. |
| **Never block the UI during sync.** | Sync runs in background. No loading spinners, no modals, no "please wait." |
| **Never hard-delete synced rows without checking `is_synced`.** | A deleted row with `is_synced = 0` has not told the cloud yet. Soft-delete first, purge later. |
| **Never store cloud credentials in source code, env files shipped with app, or frontend state.** | Store in `sync_meta` table or secure OS keychain. |
| **Never convert SQLite data types to Postgres-specific types.** | Keep `INTEGER` for timestamps, booleans, money. Keep `TEXT` for enums. Keeps sync engine simple. |
| **Never add sync logic inside React components.** | Sync belongs in the service/engine layer. Components only read local data and display sync status. |
| **Never retry failed sync aggressively (tight loops, immediate retry).** | Use exponential backoff or just wait for next scheduled cycle. |
| **Never sync partial transactions.** | If a sale has a header row and 3 line items, push ALL of them or NONE. Use batch operations. |
| **Never assume push order doesn't matter.** | Parent rows must be pushed before child rows to satisfy foreign key constraints in Postgres. |
| **Never modify the existing browser fallback (memoryStore) for sync.** | Sync only applies when running in Tauri with real SQLite. Browser demo mode is unaffected. |

### 8.2 Developer (User) Must Avoid

| Rule | Why |
|------|-----|
| **Don't manually edit the cloud Postgres data without understanding sync implications.** | Manual cloud edits will be pulled to local on next sync. If you delete a row in Postgres that local still has, the sync engine will try to push it back. Use the app for data changes. |
| **Don't share the Neon connection string publicly.** | Anyone with it can read/write your database. |
| **Don't run the app on two devices simultaneously with the same database in early versions.** | Multi-device sync works but needs thorough testing. Start with single-device sync (backup use case) first. |
| **Don't skip Postgres schema migrations when adding new tables.** | If local has a table that cloud doesn't, push will fail for that table. |
| **Don't expect real-time sync.** | Sync runs on a timer (60-120 seconds). This is not Firebase Realtime Database. It's batch sync. |
| **Don't delete the local SQLite database expecting cloud to restore it automatically.** | Pull can restore data, but the app needs a "restore from cloud" feature for that (future scope). |
| **Don't use the free Neon tier for massive data (100k+ rows with large text fields).** | 512MB fills up. Monitor usage. Upgrade or purge old data when needed. |

---

## 9. Sync Lifecycle Flowchart

```
APP LAUNCH
    │
    ▼
Load local SQLite (existing behavior, unchanged)
    │
    ▼
Check sync_meta: is sync enabled?
    │
    ├── NO: App runs fully offline. No sync code executes. Done.
    │
    └── YES:
         │
         ▼
    Start background sync timer (every 60-120 seconds)
         │
         ▼
    ┌─── SYNC CYCLE ──────────────────────────────────────┐
    │                                                      │
    │  1. Check navigator.onLine                           │
    │     ├── Offline: Skip this cycle. Set status gray.  │
    │     └── Online: Continue.                            │
    │                                                      │
    │  2. PUSH: Query local rows where is_synced = 0       │
    │     ├── For each table (in FK order):                │
    │     │   ├── UPSERT to Postgres (by sync_id)         │
    │     │   ├── On success: SET is_synced = 1 locally   │
    │     │   └── On failure: Leave is_synced = 0, log    │
    │     └── Update sync_meta.last_push_at               │
    │                                                      │
    │  3. PULL: Query Postgres for rows where              │
    │          updated_at > sync_meta.last_pull_at         │
    │     ├── For each incoming row:                       │
    │     │   ├── No local match: INSERT locally           │
    │     │   ├── Local clean (is_synced=1): UPDATE local  │
    │     │   ├── Local dirty (is_synced=0): LWW compare  │
    │     │   │   ├── Cloud newer: Overwrite local        │
    │     │   │   └── Local newer: Keep local             │
    │     │   └── Incoming is_deleted=1: Soft-delete local │
    │     └── Update sync_meta.last_pull_at               │
    │                                                      │
    │  4. PURGE: Delete rows where is_deleted=1            │
    │          AND is_synced=1 AND older than 30 days      │
    │          (both local and cloud)                       │
    │                                                      │
    │  5. Update sync status indicator in UI               │
    │                                                      │
    └──────────────────────────────────────────────────────┘
         │
         ▼
    Wait for next timer tick (or manual trigger)
```

---

## 10. Adding New Tables (Future-Proofing Checklist)

When any developer or agent adds a new table to ComputerShopOS:

1. **Schema definition** (`schema.ts`):
   - Include `sync_id`, `updated_at`, `is_deleted`, `is_synced` columns
   - Set appropriate defaults

2. **Local SQLite creation** (`client.ts` or migration):
   - Include all sync columns in `CREATE TABLE`
   - Add index on `is_synced` for sync query performance
   - Add index on `sync_id` for lookup performance

3. **Postgres migration**:
   - Create corresponding table with `sync_id` as PRIMARY KEY
   - Same columns, same types (no Postgres-specific type conversions)

4. **Service file**:
   - All inserts generate `sync_id` and set `updated_at`, `is_synced = 0`
   - All updates set `updated_at` and `is_synced = 0`
   - All deletes are soft-deletes
   - All reads filter `is_deleted = 0`

5. **Sync engine registration**:
   - Add table to push order (respecting FK dependencies)
   - Add table to pull order
   - No other sync engine changes needed if the engine is table-generic

6. **Test**:
   - Verify push creates row in Postgres
   - Verify pull brings cloud row to local
   - Verify soft-delete syncs in both directions
   - Verify conflict resolution (modify same row on both sides, confirm LWW works)

---

## 11. File Structure (Expected)

```
src/db/
├── schema.ts              ← Add sync columns to all tables
├── client.ts              ← Add sync_meta table creation, unchanged otherwise
├── syncEngine.ts          ← NEW: Core sync logic (push, pull, conflict, timer)
├── syncApi.ts             ← NEW: HTTP communication with Neon Postgres
├── syncUtils.ts           ← NEW: UUID generation, timestamp helpers, network check
├── inventoryService.ts    ← Modify: add sync columns to writes, soft-delete, filter reads
├── posService.ts          ← Modify: same pattern
├── customerService.ts     ← Modify: same pattern
├── repairsService.ts      ← Modify: same pattern
├── adjustmentsService.ts  ← Modify: same pattern
├── reportService.ts       ← Modify: filter is_deleted = 0 in aggregations
├── settingsService.ts     ← Modify: same pattern + sync settings UI data
└── [future services]      ← Follow same pattern
```

---

## 12. Testing Strategy

### Unit Tests
- Sync engine push: mock Postgres API, verify correct UPSERT payload
- Sync engine pull: mock Postgres response, verify local inserts/updates
- Conflict resolution: create conflicting rows, verify LWW outcome
- Soft-delete cascade: delete a sale, verify sale_items also soft-deleted
- UUID generation: verify uniqueness and format

### Integration Tests
- Full cycle: insert local row, push, verify in Postgres, modify in Postgres, pull, verify local updated
- Offline resilience: insert rows while offline, come online, verify push
- Foreign key order: push a sale with line items, verify parent pushed before children

### Manual Tests (Developer)
- Disable internet, use app normally, re-enable, verify sync catches up
- Enter wrong Neon connection string, verify app still works (sync fails silently)
- Add lots of data (100+ sales), verify sync completes without timeout

---

## 13. Migration Path (Existing Data)

When sync is first enabled on an existing database that already has data:

1. Run local SQLite migration to add sync columns to all tables
2. Generate `sync_id` (UUID) for every existing row: `UPDATE <table> SET sync_id = <uuid> WHERE sync_id = '' OR sync_id IS NULL`
3. Set `updated_at = created_at` for existing rows (best approximation)
4. Set `is_synced = 0` for all existing rows (forces initial full push)
5. Set `is_deleted = 0` for all existing rows
6. First sync cycle will push everything to cloud (initial seed)

This migration must be idempotent (safe to run multiple times).

---

## 14. Performance Considerations

- **Batch push:** Don't push one row at a time. Batch 50-100 rows per HTTP request.
- **Indexed queries:** Add indexes on `is_synced` and `sync_id` in local SQLite for fast sync queries.
- **Don't sync on every write.** Sync runs on a timer. Individual writes just set `is_synced = 0`.
- **Pagination on pull:** If cloud has thousands of changed rows, pull in pages (LIMIT/OFFSET or cursor-based).
- **Background thread:** Sync should not block the main thread. Use async operations (already standard in TypeScript).
- **Debounce manual sync:** If user clicks "Sync Now" multiple times, only run one cycle.

---

## 15. Scope & Limitations

### In Scope (MVP)
- One-device push/pull to cloud Postgres
- All 8 existing tables synced
- Last-Write-Wins conflict resolution
- Sync settings in Settings page
- Sync status indicator
- Works offline, syncs when online

### Out of Scope (Future)
- Multi-device simultaneous use (needs more advanced conflict resolution)
- Real-time sync (WebSocket or Server-Sent Events)
- Selective table sync (sync some tables but not others)
- Cloud-to-local full restore ("Reset from Cloud" button)
- End-to-end encryption of synced data
- Attachment/file sync (images, PDFs)
- Sync history/audit log UI
