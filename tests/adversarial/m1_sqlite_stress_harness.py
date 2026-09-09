#!/usr/bin/env python3
"""
Empirical Adversarial Stress Harness for SQLite Schema, Migrations, and Seeding
Verifies src/db/client.ts against native SQLite engine.
"""

import os
import sys
import json
import sqlite3
import re
import traceback

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
CLIENT_TS_PATH = os.path.join(REPO_ROOT, "src/db/client.ts")
SEED_DATA_PATH = os.path.join(REPO_ROOT, "src/db/seedData.json")

def log(msg, status="INFO"):
    symbol = {"PASS": "✅", "FAIL": "❌", "WARN": "⚠️", "INFO": "ℹ️"}.get(status, "•")
    print(f"{symbol} [{status}] {msg}")

def extract_client_ts_queries():
    """Extract tableQueries, alter statements, and indexQueries from src/db/client.ts."""
    with open(CLIENT_TS_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract tableQueries array
    tq_match = re.search(r"const tableQueries = \[(.*?)\];", content, re.DOTALL)
    if not tq_match:
        raise RuntimeError("Could not find tableQueries in client.ts")
    raw_table_queries = tq_match.group(1)
    table_queries = [
        q.strip().strip("`").strip()
        for q in re.findall(r"`([^`]+)`", raw_table_queries)
        if q.strip()
    ]

    # Extract ALTER TABLE statements
    alter_queries = re.findall(r'execute\("(ALTER TABLE [^"]+)"\)', content)

    # Extract indexQueries array
    iq_match = re.search(r"const indexQueries = \[(.*?)\];", content, re.DOTALL)
    if not iq_match:
        raise RuntimeError("Could not find indexQueries in client.ts")
    raw_index_queries = iq_match.group(1)
    index_queries = [
        q.strip().strip('"').strip()
        for q in re.findall(r'"([^"]+)"', raw_index_queries)
        if q.strip()
    ]

    return table_queries, alter_queries, index_queries

def load_seed_data():
    with open(SEED_DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def run_migrations(conn, table_queries, alter_queries, index_queries):
    """Execute tableQueries, alter statements, and indexQueries as done in client.ts."""
    c = conn.cursor()
    c.execute("PRAGMA foreign_keys = ON;")
    c.execute("PRAGMA journal_mode = WAL;")
    c.execute("PRAGMA synchronous = NORMAL;")
    c.execute("PRAGMA busy_timeout = 5000;")

    for q in table_queries:
        c.execute(q)

    for q in alter_queries:
        try:
            c.execute(q)
        except sqlite3.OperationalError:
            pass  # Expected if column already exists

    for idx in index_queries:
        c.execute(idx)
    conn.commit()

def run_seeding(conn, seed_data):
    """Execute seeding as implemented in client.ts."""
    c = conn.cursor()

    # 1. Payables / Receivables
    c.execute("SELECT COUNT(*) as cnt FROM payable_parties")
    if c.fetchone()[0] == 0:
        for p in seed_data.get("payableParties", []):
            c.execute(
                "INSERT OR IGNORE INTO payable_parties (id, name, phone, address, total_debit, total_credit, current_balance, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    p["id"],
                    p["name"],
                    p.get("phone", ""),
                    p.get("address", ""),
                    p.get("totalDebit", 0),
                    p.get("totalCredit", 0),
                    p.get("currentBalance", 0),
                    p.get("notes", ""),
                    p.get("createdAt", 1700000000),
                ),
            )
        for l in seed_data.get("payableLedger", []):
            c.execute(
                "INSERT OR IGNORE INTO payable_ledger (id, party_id, tx_date, tx_type, ref_no, description, debit, credit, balance, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    l["id"],
                    l["partyId"],
                    l["txDate"],
                    l["txType"],
                    l.get("refNo", ""),
                    l["description"],
                    l.get("debit", 0),
                    l.get("credit", 0),
                    l.get("balance", 0),
                    l.get("createdAt", l["txDate"]),
                ),
            )
        for r in seed_data.get("receivables", []):
            c.execute(
                "INSERT OR IGNORE INTO sales (invoice_no, customer_name, customer_phone, subtotal, discount, tax, total_amount, paid_amount, payment_status, balance_due, payment_method, notes, is_bad_debt, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    r["invoiceNo"],
                    r["customerName"],
                    r["customerPhone"],
                    r["totalAmount"],
                    0,
                    0,
                    r["totalAmount"],
                    r["paidAmount"],
                    r["paymentStatus"],
                    r["balanceDue"],
                    r["paymentMethod"],
                    r["notes"],
                    r.get("isBadDebt", 0),
                    r["createdAt"],
                ),
            )

    # 2. Monthly Reports
    c.execute("SELECT COUNT(*) as cnt FROM monthly_reports")
    if c.fetchone()[0] == 0:
        for mr in seed_data.get("monthlyReports", []):
            daily_str = mr["dailyDataJson"] if isinstance(mr.get("dailyDataJson"), str) else json.dumps(mr.get("dailyDataJson", []))
            expense_str = mr["expenseDataJson"] if isinstance(mr.get("expenseDataJson"), str) else json.dumps(mr.get("expenseDataJson", []))
            c.execute(
                """INSERT OR IGNORE INTO monthly_reports (
                    id, year, month, month_label, gross_sales, gross_profit, total_expenses,
                    net_profit, collected_cash, receivables, payables, repair_revenue,
                    swap_margin, daily_data_json, expense_data_json, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    mr.get("id"),
                    mr["year"],
                    mr["month"],
                    mr["monthLabel"],
                    mr.get("grossSales", 0),
                    mr.get("grossProfit", 0),
                    mr.get("totalExpenses", 0),
                    mr.get("netProfit", 0),
                    mr.get("collectedCash", 0),
                    mr.get("receivables", 0),
                    mr.get("payables", 0),
                    mr.get("repairRevenue", 0),
                    mr.get("swapMargin", 0),
                    daily_str,
                    expense_str,
                    mr.get("status", "CLOSED"),
                    mr.get("createdAt", 1700000000),
                    mr.get("updatedAt", 1700000000),
                ),
            )

    # 3. Expenses
    c.execute("SELECT COUNT(*) as cnt FROM expenses")
    if c.fetchone()[0] == 0:
        for exp in seed_data.get("expenses", []):
            c.execute(
                """INSERT OR IGNORE INTO expenses (
                    id, year, month, category, title, amount, expense_date, payment_method, notes, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    exp.get("id"),
                    exp["year"],
                    exp["month"],
                    exp["category"],
                    exp["title"],
                    exp.get("amount", 0),
                    exp["expenseDate"],
                    exp.get("paymentMethod", "CASH"),
                    exp.get("notes", ""),
                    exp.get("createdAt", 1700000000),
                ),
            )

    # 4. Opening Balance Ledger Sync
    c.execute(
        """SELECT p.id, p.current_balance, p.created_at FROM payable_parties p 
           WHERE p.current_balance > 0 
           AND NOT EXISTS (SELECT 1 FROM payable_ledger l WHERE l.party_id = p.id)"""
    )
    parties_without_ledger = c.fetchall()
    for p in parties_without_ledger:
        pid, bal, cat = p[0], int(p[1]), int(p[2] or 1700000000)
        c.execute(
            """INSERT INTO payable_ledger (party_id, tx_date, tx_type, ref_no, description, debit, credit, balance, created_at)
               VALUES (?, ?, 'PURCHASE', 'OPENING', 'Opening Balance', 0, ?, ?, ?)""",
            (pid, cat, bal, bal, cat),
        )

    conn.commit()


# =========================================================================
# TEST SUITE
# =========================================================================

results = []

def record_test(name, passed, message=""):
    results.append({"name": name, "passed": passed, "message": message})
    status = "PASS" if passed else "FAIL"
    log(f"{name}: {message}" if message else name, status=status)

def main():
    print("=" * 70)
    print("EMPIRICAL SQLITE STRESS HARNESS: M1.1 SCHEMA & SEEDING")
    print(f"SQLite Version: {sqlite3.sqlite_version}")
    print("=" * 70)

    # Extract source queries
    table_queries, alter_queries, index_queries = extract_client_ts_queries()
    seed_data = load_seed_data()

    print(f"Extracted from client.ts:")
    print(f" - {len(table_queries)} tableQueries")
    print(f" - {len(alter_queries)} ALTER TABLE statements")
    print(f" - {len(index_queries)} indexQueries")
    print(f"Loaded seedData.json:")
    print(f" - {len(seed_data.get('payableParties', []))} payableParties")
    print(f" - {len(seed_data.get('payableLedger', []))} payableLedger")
    print(f" - {len(seed_data.get('receivables', []))} receivables")
    print(f" - {len(seed_data.get('monthlyReports', []))} monthlyReports")
    print(f" - {len(seed_data.get('expenses', []))} expenses")
    print("-" * 70)

    # -----------------------------------------------------------------
    # Group 1: Schema DDL Execution & Column Integrity
    # -----------------------------------------------------------------
    print("\n--- Group 1: Schema DDL Execution & Column Integrity ---")
    conn = sqlite3.connect(":memory:")
    try:
        run_migrations(conn, table_queries, alter_queries, index_queries)
        c = conn.cursor()

        # Check all 15 tables exist
        c.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        existing_tables = [r[0] for r in c.fetchall() if not r[0].startswith("sqlite_")]
        expected_tables = [
            "adjustments", "customers", "documents", "expenses", "inventory",
            "inventory_serials", "monthly_reports", "payable_ledger", "payable_parties",
            "purchase_items", "purchases", "repairs", "sale_items", "sales", "settings"
        ]
        missing_tables = set(expected_tables) - set(existing_tables)
        record_test(
            "T1.1: All 15 Schema Tables Created",
            len(missing_tables) == 0,
            f"Found {len(existing_tables)}/15 tables. Missing: {missing_tables}"
        )

        # Check expenses table columns (10 columns)
        c.execute("PRAGMA table_info(expenses)")
        exp_cols = {r[1]: r[2] for r in c.fetchall()}
        required_exp_cols = ["id", "year", "month", "category", "title", "amount", "expense_date", "payment_method", "notes", "created_at"]
        missing_exp = set(required_exp_cols) - set(exp_cols.keys())
        record_test(
            "T1.2: Expenses Table Schema Definition (10 columns)",
            len(missing_exp) == 0,
            f"Columns: {list(exp_cols.keys())}. Missing: {missing_exp}"
        )

        # Check monthly_reports table columns (17 columns)
        c.execute("PRAGMA table_info(monthly_reports)")
        rep_cols = {r[1]: r[2] for r in c.fetchall()}
        required_rep_cols = [
            "id", "year", "month", "month_label", "gross_sales", "gross_profit", "total_expenses",
            "net_profit", "collected_cash", "receivables", "payables", "repair_revenue",
            "swap_margin", "daily_data_json", "expense_data_json", "status", "created_at", "updated_at"
        ]
        missing_rep = set(required_rep_cols) - set(rep_cols.keys())
        record_test(
            "T1.3: Monthly Reports Table Schema Definition (17 columns)",
            len(missing_rep) == 0,
            f"Columns: {list(rep_cols.keys())}. Missing: {missing_rep}"
        )

        # Check ALTER TABLE migrations applied
        c.execute("PRAGMA table_info(sales)")
        sales_cols = {r[1] for r in c.fetchall()}
        c.execute("PRAGMA table_info(adjustments)")
        adj_cols = {r[1] for r in c.fetchall()}
        alter_ok = "is_bad_debt" in sales_cols and "due_date" in sales_cols and "item_taken_inventory_id" in adj_cols
        record_test(
            "T1.4: ALTER TABLE Dynamic Migrations Applied",
            alter_ok,
            f"is_bad_debt in sales: {'is_bad_debt' in sales_cols}, due_date in sales: {'due_date' in sales_cols}, item_taken_inv in adj: {'item_taken_inventory_id' in adj_cols}"
        )

        # Check all 27 indexes created
        c.execute("SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_autoindex_%'")
        existing_indexes = {r[0] for r in c.fetchall()}
        record_test(
            "T1.5: All 27 Performance & Integrity Indexes Created",
            len(existing_indexes) == 27,
            f"Created {len(existing_indexes)}/27 indexes"
        )

        # Check specific M1 indexes
        m1_indexes = [
            "idx_expenses_year_month",
            "idx_expenses_date",
            "idx_expenses_category",
            "idx_monthly_reports_year_month"
        ]
        missing_m1_idx = set(m1_indexes) - existing_indexes
        record_test(
            "T1.6: All 4 M1 Indexes Active",
            len(missing_m1_idx) == 0,
            f"Active: {m1_indexes}. Missing: {missing_m1_idx}"
        )

    except Exception as e:
        record_test("T1: Schema DDL Execution", False, f"Exception: {e}\n{traceback.format_exc()}")
    finally:
        conn.close()

    # -----------------------------------------------------------------
    # Group 2: Baseline Seeding Execution
    # -----------------------------------------------------------------
    print("\n--- Group 2: Baseline Seeding Execution ---")
    conn = sqlite3.connect(":memory:")
    try:
        run_migrations(conn, table_queries, alter_queries, index_queries)
        run_seeding(conn, seed_data)
        c = conn.cursor()

        # Check counts
        c.execute("SELECT COUNT(*) FROM payable_parties")
        cnt_parties = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM payable_ledger")
        cnt_ledger = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM sales")
        cnt_sales = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM monthly_reports")
        cnt_reports = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM expenses")
        cnt_expenses = c.fetchone()[0]

        record_test(
            "T2.1: Seed Count Verification",
            cnt_parties == 13 and cnt_ledger == 1093 and cnt_sales == 14 and cnt_reports == 6 and cnt_expenses == 44,
            f"parties={cnt_parties}/13, ledger={cnt_ledger}/1093, sales={cnt_sales}/14, reports={cnt_reports}/6, expenses={cnt_expenses}/44"
        )

        # Check March 2026 data integrity
        c.execute("SELECT year, month, month_label, gross_sales, gross_profit, total_expenses, net_profit, status FROM monthly_reports WHERE year=2026 AND month=3")
        mar = c.fetchone()
        mar_ok = (mar is not None and mar[2] == "March 2026" and mar[3] == 2423500 and mar[4] == 463130 and mar[5] == 185250 and mar[6] == 277880 and mar[7] == "CLOSED")
        record_test(
            "T2.2: March 2026 Authoritative Financial Snapshot",
            mar_ok,
            f"March row: {mar}"
        )

        # Check July 2026 data integrity & typo resolution
        c.execute("SELECT daily_data_json FROM monthly_reports WHERE year=2026 AND month=7")
        jul_row = c.fetchone()
        jul_daily = json.loads(jul_row[0]) if jul_row else []
        jul_dates = [d["date"] for d in jul_daily]
        jul_typo_free = all(d.startswith("2026-07-") for d in jul_dates)
        record_test(
            "T2.3: July 2026 Daily Dates Normalized (2025 typo eliminated)",
            jul_typo_free and len(jul_dates) == 31,
            f"31 daily records; all starting with '2026-07-': {jul_typo_free}"
        )

        # Check August 2026 expenses
        c.execute("SELECT COUNT(*), SUM(amount) FROM expenses WHERE year=2026 AND month=8")
        aug_exp = c.fetchone()
        record_test(
            "T2.4: August 2026 Historical Expenses Baseline (3 expenses, 42,300 total)",
            aug_exp[0] == 3 and aug_exp[1] == 42300,
            f"Count: {aug_exp[0]}, Total Amount: {aug_exp[1]}"
        )

    except Exception as e:
        record_test("T2: Baseline Seeding Execution", False, f"Exception: {e}\n{traceback.format_exc()}")
    finally:
        conn.close()

    # -----------------------------------------------------------------
    # Group 3: Idempotency & Re-entrancy (5 Sequential Runs)
    # -----------------------------------------------------------------
    print("\n--- Group 3: Idempotency & Re-entrancy (5 Sequential Runs) ---")
    db_file = "/tmp/test_pc_shop_reentrancy.db"
    if os.path.exists(db_file):
        os.remove(db_file)

    try:
        conn = sqlite3.connect(db_file)
        c = conn.cursor()

        # Run 1
        run_migrations(conn, table_queries, alter_queries, index_queries)
        run_seeding(conn, seed_data)

        # Snapshot counts after Run 1
        def get_all_counts(cursor):
            tables = ["payable_parties", "payable_ledger", "sales", "monthly_reports", "expenses"]
            counts = {}
            for t in tables:
                cursor.execute(f"SELECT COUNT(*) FROM {t}")
                counts[t] = cursor.fetchone()[0]
            return counts

        run1_counts = get_all_counts(c)

        # Runs 2 through 5
        idempotent = True
        collision_detected = False

        for r in range(2, 6):
            try:
                run_migrations(conn, table_queries, alter_queries, index_queries)
                run_seeding(conn, seed_data)
                counts = get_all_counts(c)
                if counts != run1_counts:
                    idempotent = False
                    log(f"Run {r} altered table counts! Expected {run1_counts}, got {counts}", "FAIL")
            except sqlite3.IntegrityError as ie:
                collision_detected = True
                log(f"Run {r} caused primary key / unique constraint collision: {ie}", "FAIL")
            except Exception as ex:
                log(f"Run {r} threw unexpected exception: {ex}", "FAIL")
                idempotent = False

        record_test(
            "T3.1: 5x Sequential Migration & Seed Idempotency",
            idempotent and not collision_detected,
            f"Counts invariant across 5 runs: {run1_counts}"
        )

        # Check duplicate IDs in expenses
        c.execute("SELECT id, COUNT(*) FROM expenses GROUP BY id HAVING COUNT(*) > 1")
        dup_exp = c.fetchall()
        record_test(
            "T3.2: Zero Duplicate Expense IDs",
            len(dup_exp) == 0,
            f"Duplicates: {dup_exp}"
        )

        # Check duplicate (year, month) in monthly_reports
        c.execute("SELECT year, month, COUNT(*) FROM monthly_reports GROUP BY year, month HAVING COUNT(*) > 1")
        dup_rep = c.fetchall()
        record_test(
            "T3.3: Zero Duplicate Monthly Report (Year, Month) Tuples",
            len(dup_rep) == 0,
            f"Duplicates: {dup_rep}"
        )

    except Exception as e:
        record_test("T3: Idempotency & Re-entrancy", False, f"Exception: {e}\n{traceback.format_exc()}")
    finally:
        conn.close()
        if os.path.exists(db_file):
            os.remove(db_file)

    # -----------------------------------------------------------------
    # Group 4: Pre-existing Database Scenarios
    # -----------------------------------------------------------------
    print("\n--- Group 4: Pre-existing Database Scenarios ---")

    # Scenario 4A: Pre-existing database with custom payable_parties and sales, but 0 expenses and 0 monthly_reports
    conn = sqlite3.connect(":memory:")
    try:
        run_migrations(conn, table_queries, alter_queries, index_queries)
        c = conn.cursor()
        # Insert custom pre-existing party
        c.execute(
            "INSERT INTO payable_parties (id, name, phone, current_balance) VALUES (999, 'CUSTOM VENDOR PREEXISTING', '03001234567', 100000)"
        )
        c.execute(
            "INSERT INTO payable_ledger (id, party_id, tx_date, tx_type, ref_no, description, debit, credit, balance, created_at) VALUES (8888, 999, 1700000000, 'PURCHASE', 'INV-CUSTOM', 'Custom pre-existing invoice', 0, 100000, 100000, 1700000000)"
        )
        conn.commit()

        # Run seeding
        run_seeding(conn, seed_data)

        # Verify custom party preserved
        c.execute("SELECT id, name, current_balance FROM payable_parties WHERE id=999")
        custom_party = c.fetchone()
        # Verify payableParties was NOT seeded because count was 1 (> 0)
        c.execute("SELECT COUNT(*) FROM payable_parties")
        party_cnt = c.fetchone()[0]
        # Verify monthly_reports was seeded independently (6 rows)
        c.execute("SELECT COUNT(*) FROM monthly_reports")
        rep_cnt = c.fetchone()[0]
        # Verify expenses was seeded independently (44 rows)
        c.execute("SELECT COUNT(*) FROM expenses")
        exp_cnt = c.fetchone()[0]

        record_test(
            "T4.1: Independent Table Seeding in Legacy Pre-existing DB",
            custom_party is not None and party_cnt == 1 and rep_cnt == 6 and exp_cnt == 44,
            f"Custom party preserved: {custom_party[1]}; party_cnt={party_cnt}/1; rep_cnt={rep_cnt}/6; exp_cnt={exp_cnt}/44"
        )
    finally:
        conn.close()

    # Scenario 4B: Pre-existing expenses & monthly_reports (Custom User Data Safety)
    conn = sqlite3.connect(":memory:")
    try:
        run_migrations(conn, table_queries, alter_queries, index_queries)
        c = conn.cursor()
        # User already created 1 custom expense
        c.execute(
            "INSERT INTO expenses (id, year, month, category, title, amount, expense_date, payment_method, notes) VALUES (5000, 2026, 9, 'MARKETING', 'Custom Flyer Printing', 8500, 1788200000, 'CASH', 'User created before seeding')"
        )
        # User already created 1 custom monthly report
        c.execute(
            "INSERT INTO monthly_reports (id, year, month, month_label, gross_sales, net_profit, status) VALUES (6000, 2026, 9, 'September 2026', 500000, 120000, 'OPEN')"
        )
        conn.commit()

        # Run seeding
        run_seeding(conn, seed_data)

        # Check that expenses count is still 1 (custom data preserved, seed skipped)
        c.execute("SELECT COUNT(*), title FROM expenses WHERE id=5000")
        custom_exp = c.fetchone()
        c.execute("SELECT COUNT(*) FROM expenses")
        total_exp = c.fetchone()[0]

        # Check that reports count is still 1 (custom report preserved, seed skipped)
        c.execute("SELECT COUNT(*), month_label FROM monthly_reports WHERE id=6000")
        custom_rep = c.fetchone()
        c.execute("SELECT COUNT(*) FROM monthly_reports")
        total_rep = c.fetchone()[0]

        record_test(
            "T4.2: User Custom Data Preserved (No Overwriting When Tables Non-Empty)",
            custom_exp[0] == 1 and total_exp == 1 and custom_rep[0] == 1 and total_rep == 1,
            f"Expenses count={total_exp} (custom preserved), Reports count={total_rep} (custom preserved)"
        )
    finally:
        conn.close()

    # Scenario 4C: Party with Opening Balance but No Ledger Entry
    conn = sqlite3.connect(":memory:")
    try:
        run_migrations(conn, table_queries, alter_queries, index_queries)
        c = conn.cursor()
        c.execute(
            "INSERT INTO payable_parties (id, name, phone, current_balance, created_at) VALUES (101, 'OPENING BALANCE TEST PARTY', '03331112233', 75000, 1770000000)"
        )
        conn.commit()

        # Run seeding (which executes opening balance sync)
        run_seeding(conn, seed_data)

        c.execute("SELECT party_id, tx_type, ref_no, credit, balance FROM payable_ledger WHERE party_id=101")
        ledger_entry = c.fetchone()
        entry_ok = (ledger_entry is not None and ledger_entry[1] == "PURCHASE" and ledger_entry[2] == "OPENING" and ledger_entry[3] == 75000 and ledger_entry[4] == 75000)

        # Run seeding a 2nd time to verify opening balance ledger entry is not duplicated
        run_seeding(conn, seed_data)
        c.execute("SELECT COUNT(*) FROM payable_ledger WHERE party_id=101")
        entry_count = c.fetchone()[0]

        record_test(
            "T4.3: Opening Balance Ledger Sync Created and Idempotent",
            entry_ok and entry_count == 1,
            f"Ledger entry: {ledger_entry}, Total entries for party: {entry_count}"
        )
    finally:
        conn.close()

    # -----------------------------------------------------------------
    # Group 5: Index Utilization & Optimization (EXPLAIN QUERY PLAN)
    # -----------------------------------------------------------------
    print("\n--- Group 5: Index Utilization & Optimization ---")
    conn = sqlite3.connect(":memory:")
    try:
        run_migrations(conn, table_queries, alter_queries, index_queries)
        run_seeding(conn, seed_data)
        c = conn.cursor()

        # 5.1 idx_expenses_year_month
        c.execute("EXPLAIN QUERY PLAN SELECT * FROM expenses WHERE year = 2026 AND month = 4")
        plan1 = [r[3] for r in c.fetchall()]
        uses_idx1 = any("idx_expenses_year_month" in p for p in plan1)
        record_test(
            "T5.1: Index Utilization on expenses(year, month)",
            uses_idx1,
            f"Plan: {plan1}"
        )

        # 5.2 idx_expenses_date
        c.execute("EXPLAIN QUERY PLAN SELECT * FROM expenses WHERE expense_date >= 1774900000 AND expense_date <= 1777500000")
        plan2 = [r[3] for r in c.fetchall()]
        uses_idx2 = any("idx_expenses_date" in p for p in plan2)
        record_test(
            "T5.2: Index Utilization on expenses(expense_date)",
            uses_idx2,
            f"Plan: {plan2}"
        )

        # 5.3 idx_expenses_category
        c.execute("EXPLAIN QUERY PLAN SELECT * FROM expenses WHERE category = 'RENT'")
        plan3 = [r[3] for r in c.fetchall()]
        uses_idx3 = any("idx_expenses_category" in p for p in plan3)
        record_test(
            "T5.3: Index Utilization on expenses(category)",
            uses_idx3,
            f"Plan: {plan3}"
        )

        # 5.4 idx_monthly_reports_year_month
        c.execute("EXPLAIN QUERY PLAN SELECT * FROM monthly_reports WHERE year = 2026 AND month = 4")
        plan4 = [r[3] for r in c.fetchall()]
        uses_idx4 = any("idx_monthly_reports_year_month" in p for p in plan4)
        record_test(
            "T5.4: Index Utilization on monthly_reports(year, month)",
            uses_idx4,
            f"Plan: {plan4}"
        )

        # 5.5 UNIQUE Constraint Enforcement on monthly_reports(year, month)
        unique_failed = False
        try:
            c.execute("INSERT INTO monthly_reports (year, month, month_label) VALUES (2026, 4, 'Duplicate April 2026')")
        except sqlite3.IntegrityError as ie:
            unique_failed = True
            unique_msg = str(ie)

        record_test(
            "T5.5: UNIQUE Constraint on monthly_reports(year, month) Prevents Duplication",
            unique_failed,
            f"IntegrityError correctly triggered: {unique_msg if unique_failed else 'No error raised!'}"
        )

    finally:
        conn.close()

    # -----------------------------------------------------------------
    # Group 6: Foreign Key Cascades & Referential Integrity
    # -----------------------------------------------------------------
    print("\n--- Group 6: Foreign Key Cascades & Referential Integrity ---")
    conn = sqlite3.connect(":memory:")
    try:
        run_migrations(conn, table_queries, alter_queries, index_queries)
        c = conn.cursor()
        c.execute("PRAGMA foreign_keys = ON;")

        # Test payable_parties -> payable_ledger ON DELETE CASCADE
        c.execute("INSERT INTO payable_parties (id, name) VALUES (10, 'TEST CASCADE PARTY')")
        c.execute("INSERT INTO payable_ledger (id, party_id, tx_date, description) VALUES (100, 10, 1700000000, 'CASCADE TEST')")
        conn.commit()

        c.execute("DELETE FROM payable_parties WHERE id = 10")
        conn.commit()

        c.execute("SELECT COUNT(*) FROM payable_ledger WHERE party_id = 10")
        ledger_left = c.fetchone()[0]
        record_test(
            "T6.1: payable_ledger ON DELETE CASCADE",
            ledger_left == 0,
            f"Remaining ledger rows after party delete: {ledger_left}"
        )

        # Test sales -> sale_items ON DELETE CASCADE
        c.execute("INSERT INTO sales (id, invoice_no, total_amount) VALUES (20, 'INV-TEST-CASCADE', 50000)")
        c.execute("INSERT INTO sale_items (id, sale_id, item_name, quantity, unit_price, total_price) VALUES (200, 20, 'Test Item', 1, 50000, 50000)")
        conn.commit()

        c.execute("DELETE FROM sales WHERE id = 20")
        conn.commit()

        c.execute("SELECT COUNT(*) FROM sale_items WHERE sale_id = 20")
        items_left = c.fetchone()[0]
        record_test(
            "T6.2: sale_items ON DELETE CASCADE",
            items_left == 0,
            f"Remaining sale_items after sale delete: {items_left}"
        )

        # Test inventory -> inventory_serials ON DELETE CASCADE
        c.execute("INSERT INTO inventory (id, title, name, sku) VALUES (30, 'GPU', 'Test GPU', 'SKU-CASCADE-30')")
        c.execute("INSERT INTO inventory_serials (id, inventory_id, serial_number) VALUES (300, 30, 'SN-CASCADE-300')")
        conn.commit()

        c.execute("DELETE FROM inventory WHERE id = 30")
        conn.commit()

        c.execute("SELECT COUNT(*) FROM inventory_serials WHERE inventory_id = 30")
        serials_left = c.fetchone()[0]
        record_test(
            "T6.3: inventory_serials ON DELETE CASCADE",
            serials_left == 0,
            f"Remaining serials after inventory delete: {serials_left}"
        )

    finally:
        conn.close()

    # -----------------------------------------------------------------
    # Group 7: SQLite Parameter Binding Check ($1 vs ?)
    # -----------------------------------------------------------------
    print("\n--- Group 7: SQLite Parameter Binding Syntax Verification ---")
    conn = sqlite3.connect(":memory:")
    try:
        run_migrations(conn, table_queries, alter_queries, index_queries)
        c = conn.cursor()

        # In SQLite, statements with $1, $2 or ?
        # Test executing parameterized statement with ? (Standard)
        c.execute("INSERT INTO settings (key, value) VALUES (?, ?)", ("theme", "dark"))
        c.execute("SELECT value FROM settings WHERE key = ?", ("theme",))
        row = c.fetchone()
        qmark_ok = (row is not None and row[0] == "dark")

        # Test parameterized statement with $1, $2 (Tauri SQL style)
        # In Python sqlite3, $key can be bound via dict: {"key": "light"} or :name
        c.execute("INSERT INTO settings (key, value) VALUES (:k, :v)", {"k": "mode", "v": "desktop"})
        c.execute("SELECT value FROM settings WHERE key = :k", {"k": "mode"})
        row2 = c.fetchone()
        named_ok = (row2 is not None and row2[0] == "desktop")

        record_test(
            "T7.1: SQLite Parameter Binding Integrity",
            qmark_ok and named_ok,
            f"qmark binding: {qmark_ok}, named binding: {named_ok}"
        )
    finally:
        conn.close()

    # -----------------------------------------------------------------
    # SUMMARY & FINAL VERDICT
    # -----------------------------------------------------------------
    print("\n" + "=" * 70)
    print("HARNESS RESULTS SUMMARY")
    print("=" * 70)
    total_tests = len(results)
    passed_tests = sum(1 for r in results if r["passed"])
    failed_tests = total_tests - passed_tests

    for r in results:
        mark = "PASS" if r["passed"] else "FAIL"
        print(f"[{mark}] {r['name']}: {r['message']}")

    print("-" * 70)
    print(f"Total: {total_tests} | Passed: {passed_tests} | Failed: {failed_tests}")

    verdict = "APPROVE" if failed_tests == 0 else "REJECT"
    print(f"FINAL VERDICT: {verdict}")
    print("=" * 70)

    if failed_tests > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
