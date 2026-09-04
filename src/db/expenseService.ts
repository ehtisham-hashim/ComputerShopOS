import { isTauriEnvironment, memoryStore, getSqlDb } from "./client";
import { ExpenseRecord, CreateExpenseInput } from "./schema";

export const RECURRING_EXPENSE_TEMPLATES: Array<Omit<CreateExpenseInput, "year" | "month" | "expenseDate">> = [
  { title: "SHOP RENT", category: "RENT", amount: 25000, paymentMethod: "CASH", notes: "Monthly store premises rent" },
  { title: "SHOP ELECTRICITY BILL", category: "UTILITIES", amount: 5000, paymentMethod: "CASH", notes: "WAPDA / Electricity bill" },
  { title: "TELEPHONE BILL", category: "UTILITIES", amount: 3700, paymentMethod: "CASH", notes: "PTCL Landline" },
  { title: "FARHAN BAHI SALARY", category: "SALARY", amount: 30000, paymentMethod: "CASH", notes: "Staff salary" },
  { title: "TASNIM SALARY", category: "SALARY", amount: 30000, paymentMethod: "CASH", notes: "Staff salary" },
  { title: "ARSLAN BAHI SALARY", category: "SALARY", amount: 17000, paymentMethod: "CASH", notes: "Staff salary" },
  { title: "CHOKIDARA", category: "SECURITY_GUARD", amount: 300, paymentMethod: "CASH", notes: "Security guard fee" },
  { title: "NET FLEX", category: "INTERNET", amount: 800, paymentMethod: "CASH", notes: "Shop internet connection" },
  { title: "TELENOR POST PAID BILL", category: "UTILITIES", amount: 1200, paymentMethod: "CASH", notes: "Shop mobile post-paid" },
];

export async function getExpensesByMonth(year: number, month: number): Promise<ExpenseRecord[]> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    try {
      const rows = await sqlDb.select<any[]>(
        `SELECT id, year, month, category, title, amount, expense_date as expenseDate, 
                payment_method as paymentMethod, notes, created_at as createdAt
         FROM expenses 
         WHERE year = $1 AND month = $2 
         ORDER BY expense_date DESC, id DESC`,
        [year, month]
      );
      return rows.map((r) => ({
        id: Number(r.id),
        year: Number(r.year),
        month: Number(r.month),
        category: r.category || "MISC",
        title: r.title,
        amount: Number(r.amount),
        expenseDate: Number(r.expenseDate),
        paymentMethod: r.paymentMethod || "CASH",
        notes: r.notes || "",
        createdAt: Number(r.createdAt || r.expenseDate),
      }));
    } catch (e) {
      console.error("Failed to fetch expenses from SQLite:", e);
    }
  }

  return memoryStore.expenses
    .filter((e) => e.year === year && e.month === month)
    .sort((a, b) => b.expenseDate - a.expenseDate);
}

export async function createExpense(input: CreateExpenseInput): Promise<number> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();
  const now = Math.floor(Date.now() / 1000);
  const expenseDate = input.expenseDate || now;

  if (isTauri && sqlDb) {
    try {
      const result = await sqlDb.execute(
        `INSERT INTO expenses (year, month, category, title, amount, expense_date, payment_method, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          input.year,
          input.month,
          input.category || "MISC",
          input.title,
          input.amount || 0,
          expenseDate,
          input.paymentMethod || "CASH",
          input.notes || "",
          now,
        ]
      );
      return Number(result.lastInsertId);
    } catch (e) {
      console.error("Failed to insert expense into SQLite:", e);
      throw e;
    }
  }

  const nextId =
    memoryStore.expenses.length > 0 ? Math.max(...memoryStore.expenses.map((e) => e.id)) + 1 : 1;
  const newExp = {
    id: nextId,
    year: input.year,
    month: input.month,
    category: (input.category || "MISC") as any,
    title: input.title,
    amount: input.amount || 0,
    expenseDate,
    paymentMethod: input.paymentMethod || "CASH",
    notes: input.notes ?? null,
    createdAt: now,
  };
  memoryStore.expenses.push(newExp);
  return nextId;
}

export async function updateExpense(id: number, input: Partial<CreateExpenseInput>): Promise<void> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (input.title !== undefined) { sets.push(`title = $${idx++}`); params.push(input.title); }
    if (input.category !== undefined) { sets.push(`category = $${idx++}`); params.push(input.category); }
    if (input.amount !== undefined) { sets.push(`amount = $${idx++}`); params.push(input.amount); }
    if (input.expenseDate !== undefined) { sets.push(`expense_date = $${idx++}`); params.push(input.expenseDate); }
    if (input.paymentMethod !== undefined) { sets.push(`payment_method = $${idx++}`); params.push(input.paymentMethod); }
    if (input.notes !== undefined) { sets.push(`notes = $${idx++}`); params.push(input.notes); }

    if (sets.length > 0) {
      params.push(id);
      await sqlDb.execute(`UPDATE expenses SET ${sets.join(", ")} WHERE id = $${idx}`, params);
    }
    return;
  }

  const item = memoryStore.expenses.find((e) => e.id === id);
  if (item) {
    Object.assign(item, input);
  }
}

export async function deleteExpense(id: number): Promise<void> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    await sqlDb.execute(`DELETE FROM expenses WHERE id = $1`, [id]);
    return;
  }

  const idx = memoryStore.expenses.findIndex((e) => e.id === id);
  if (idx !== -1) {
    memoryStore.expenses.splice(idx, 1);
  }
}

export async function getMonthlyExpenseSummary(
  year: number,
  month: number
): Promise<{ total: number; byCategory: Record<string, number> }> {
  const items = await getExpensesByMonth(year, month);
  let total = 0;
  const byCategory: Record<string, number> = {};

  for (const item of items) {
    total += item.amount;
    byCategory[item.category] = (byCategory[item.category] || 0) + item.amount;
  }

  return { total, byCategory };
}

export async function applyRecurringExpenses(
  year: number,
  month: number
): Promise<{ applied: number; skipped: number }> {
  const existing = await getExpensesByMonth(year, month);
  const existingTitles = new Set(existing.map((e) => e.title.trim().toUpperCase()));

  let applied = 0;
  let skipped = 0;
  const monthStartUnix = Math.floor(new Date(year, month - 1, 1).getTime() / 1000);

  for (const tmpl of RECURRING_EXPENSE_TEMPLATES) {
    if (existingTitles.has(tmpl.title.trim().toUpperCase())) {
      skipped++;
      continue;
    }
    await createExpense({
      year,
      month,
      category: tmpl.category,
      title: tmpl.title,
      amount: tmpl.amount,
      expenseDate: monthStartUnix,
      paymentMethod: tmpl.paymentMethod,
      notes: tmpl.notes,
    });
    applied++;
  }

  return { applied, skipped };
}
