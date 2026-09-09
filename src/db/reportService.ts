import { isTauriEnvironment, memoryStore, getSqlDb } from "./client";
import { getExpensesByMonth } from "./expenseService";
import { getInventoryItems } from "./inventoryService";
import { getRepairTickets } from "./repairsService";
import { getAdjustments } from "./adjustmentsService";
import { getPayablesSummary } from "./payablesService";
import { DailyReportRow, ExpenseRecord, MonthlyReportDetail } from "./schema";

export type { DailyReportRow, ExpenseRecord, MonthlyReportDetail };

export interface MonthlyReportViewData extends MonthlyReportDetail {
  marginPercent: number;
  repairCount: number;
  swapCount: number;
  totalTransactions: number;
  cogs: number;
  discounts: number;
  swapInflow: number;
  swapOutflow: number;
  totalNetIncome: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  categoryBreakdown: { category: string; count: number; revenue: number }[];
  paymentBreakdown: { cash: number; card: number; split: number };
  trendData: { label: string; revenue: number; profit: number }[];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export async function getMonthlyReportsHistory(): Promise<Array<{
  year: number;
  month: number;
  monthLabel: string;
  grossSales: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  status: "OPEN" | "CLOSED";
}>> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  const historyMap = new Map<string, {
    year: number;
    month: number;
    monthLabel: string;
    grossSales: number;
    grossProfit: number;
    totalExpenses: number;
    netProfit: number;
    status: "OPEN" | "CLOSED";
  }>();

  // 1. From monthly_reports table
  if (isTauri && sqlDb) {
    try {
      const rows = await sqlDb.select<any[]>(
        `SELECT year, month, month_label as monthLabel, gross_sales as grossSales,
                gross_profit as grossProfit, total_expenses as totalExpenses,
                net_profit as netProfit, status
         FROM monthly_reports
         ORDER BY year DESC, month DESC`
      );
      for (const r of rows) {
        const key = `${r.year}-${r.month}`;
        historyMap.set(key, {
          year: Number(r.year),
          month: Number(r.month),
          monthLabel: r.monthLabel,
          grossSales: Number(r.grossSales || 0),
          grossProfit: Number(r.grossProfit || 0),
          totalExpenses: Number(r.totalExpenses || 0),
          netProfit: Number(r.netProfit || 0),
          status: (r.status as "OPEN" | "CLOSED") || "CLOSED",
        });
      }
    } catch (e) {
      console.error("Failed to fetch monthly reports history from SQLite:", e);
    }
  } else {
    for (const r of memoryStore.monthlyReports) {
      const key = `${r.year}-${r.month}`;
      historyMap.set(key, {
        year: r.year,
        month: r.month,
        monthLabel: r.monthLabel,
        grossSales: r.grossSales || 0,
        grossProfit: r.grossProfit || 0,
        totalExpenses: r.totalExpenses || 0,
        netProfit: r.netProfit || 0,
        status: (r.status as "OPEN" | "CLOSED") || "CLOSED",
      });
    }
  }

  // 2. Also ensure current month is in history if not already
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  const curKey = `${curYear}-${curMonth}`;
  if (!historyMap.has(curKey)) {
    const curReport = await getMonthlyReport(curYear, curMonth);
    historyMap.set(curKey, {
      year: curYear,
      month: curMonth,
      monthLabel: `${MONTH_NAMES[curMonth - 1]} ${curYear}`,
      grossSales: curReport.grossSales,
      grossProfit: curReport.grossProfit,
      totalExpenses: curReport.totalExpenses,
      netProfit: curReport.netProfit,
      status: "OPEN",
    });
  }

  return Array.from(historyMap.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
}

export async function getMonthlyReport(year: number, month: number): Promise<MonthlyReportViewData> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  // Check if closed snapshot exists in monthly_reports
  if (isTauri && sqlDb) {
    try {
      const snapshots = await sqlDb.select<any[]>(
        `SELECT * FROM monthly_reports WHERE year = $1 AND month = $2`,
        [year, month]
      );
      if (snapshots && snapshots.length > 0) {
        const snap = snapshots[0];
        let dailyData: DailyReportRow[] = [];
        let expensesList: ExpenseRecord[] = [];
        try { dailyData = JSON.parse(snap.daily_data_json || "[]"); } catch {}
        try { expensesList = JSON.parse(snap.expense_data_json || "[]"); } catch {}

        if (expensesList.length === 0) {
          expensesList = await getExpensesByMonth(year, month);
        }

        const grossSales = Number(snap.gross_sales || 0);
        const grossProfit = Number(snap.gross_profit || 0);
        const totalExpenses = Number(snap.total_expenses || 0);
        const netProfit = Number(snap.net_profit ?? (grossProfit - totalExpenses));
        const marginPercent = grossSales > 0 ? Math.round((grossProfit / grossSales) * 100) : 0;

        const trendData = dailyData
          .filter((d) => d.sales > 0 || d.grossProfit > 0)
          .slice(0, 15)
          .map((d) => ({
            label: `Day ${d.day}`,
            revenue: d.sales,
            profit: d.grossProfit,
          }));

        return {
          year,
          month,
          monthLabel: snap.month_label || monthLabel,
          grossSales,
          grossProfit,
          totalExpenses,
          netProfit,
          collectedCash: Number(snap.collected_cash || grossSales),
          receivables: Number(snap.receivables || 0),
          payables: Number(snap.payables || 0),
          repairRevenue: Number(snap.repair_revenue || 0),
          swapMargin: Number(snap.swap_margin || 0),
          dailyData,
          expenses: expensesList,
          status: snap.status || "CLOSED",
          marginPercent,
          repairCount: 0,
          swapCount: 0,
          totalTransactions: dailyData.filter((d) => d.sales > 0).length,
          cogs: Math.max(0, grossSales - grossProfit),
          discounts: 0,
          swapInflow: 0,
          swapOutflow: 0,
          totalNetIncome: netProfit,
          topProducts: [],
          categoryBreakdown: [],
          paymentBreakdown: { cash: grossSales, card: 0, split: 0 },
          trendData,
        };
      }
    } catch (e) {
      console.warn("Snapshot lookup failed, calculating live:", e);
    }
  } else {
    const snap = memoryStore.monthlyReports.find((r) => r.year === year && r.month === month);
    if (snap) {
      let dailyData: DailyReportRow[] = [];
      let expensesList: ExpenseRecord[] = [];
      try {
        dailyData = typeof snap.dailyDataJson === "string" ? JSON.parse(snap.dailyDataJson) : (snap.dailyDataJson || []);
      } catch {}
      try {
        expensesList = typeof snap.expenseDataJson === "string" ? JSON.parse(snap.expenseDataJson) : (snap.expenseDataJson || []);
      } catch {}

      if (expensesList.length === 0) {
        expensesList = await getExpensesByMonth(year, month);
      }

      const grossSales = snap.grossSales || 0;
      const grossProfit = snap.grossProfit || 0;
      const totalExpenses = snap.totalExpenses || 0;
      const netProfit = snap.netProfit ?? (grossProfit - totalExpenses);
      const marginPercent = grossSales > 0 ? Math.round((grossProfit / grossSales) * 100) : 0;

      const trendData = dailyData
        .filter((d) => d.sales > 0 || d.grossProfit > 0)
        .slice(0, 15)
        .map((d) => ({
          label: `Day ${d.day}`,
          revenue: d.sales,
          profit: d.grossProfit,
        }));

      return {
        year,
        month,
        monthLabel: snap.monthLabel || monthLabel,
        grossSales,
        grossProfit,
        totalExpenses,
        netProfit,
        collectedCash: snap.collectedCash || grossSales,
        receivables: snap.receivables || 0,
        payables: snap.payables || 0,
        repairRevenue: snap.repairRevenue || 0,
        swapMargin: snap.swapMargin || 0,
        dailyData,
        expenses: expensesList,
        status: snap.status || "CLOSED",
        marginPercent,
        repairCount: 0,
        swapCount: 0,
        totalTransactions: dailyData.filter((d) => d.sales > 0).length,
        cogs: Math.max(0, grossSales - grossProfit),
        discounts: 0,
        swapInflow: 0,
        swapOutflow: 0,
        totalNetIncome: netProfit,
        topProducts: [],
        categoryBreakdown: [],
        paymentBreakdown: { cash: grossSales, card: 0, split: 0 },
        trendData,
      };
    }
  }

  // --- Dynamic Live Calculation for the requested month ---
  const startOfMonth = Math.floor(new Date(year, month - 1, 1, 0, 0, 0).getTime() / 1000);
  const endOfMonth = Math.floor(new Date(year, month, 1, 0, 0, 0).getTime() / 1000);
  const daysInMonth = new Date(year, month, 0).getDate();

  const [inventory, repairs, adjustments, payablesSum, expensesList] = await Promise.all([
    getInventoryItems(),
    getRepairTickets(),
    getAdjustments(),
    getPayablesSummary(),
    getExpensesByMonth(year, month),
  ]);

  const invCostMap = new Map<number, number>();
  const invCatMap = new Map<number, string>();
  inventory.forEach((i) => {
    invCostMap.set(i.id, i.costPrice || 0);
    invCatMap.set(i.id, i.title);
  });

  let periodSales: any[] = [];
  let periodItems: any[] = [];

  if (isTauri && sqlDb) {
    try {
      periodSales = await sqlDb.select<any[]>(
        `SELECT id, invoice_no as invoiceNo, total_amount as totalAmount, 
                paid_amount as paidAmount, balance_due as balanceDue, 
                payment_method as paymentMethod, payment_status as paymentStatus,
                created_at as createdAt
         FROM sales 
         WHERE created_at >= $1 AND created_at < $2`,
        [startOfMonth, endOfMonth]
      );
      if (periodSales.length > 0) {
        const saleIds = periodSales.map((s) => s.id);
        periodItems = await sqlDb.select<any[]>(
          `SELECT sale_id as saleId, inventory_id as inventoryId, item_name as itemName,
                  quantity, unit_price as unitPrice, total_price as totalPrice
           FROM sale_items
           WHERE sale_id IN (${saleIds.map((_, idx) => `$${idx + 1}`).join(",")})`,
          saleIds
        );
      }
    } catch (e) {
      console.error("Failed to query live sales in SQLite:", e);
    }
  } else {
    periodSales = memoryStore.sales.filter((s) => s.createdAt >= startOfMonth && s.createdAt < endOfMonth);
    const saleIds = new Set(periodSales.map((s) => s.id));
    periodItems = memoryStore.saleItems.filter((it) => saleIds.has(it.saleId));
  }

  const periodRepairs = repairs.filter((r) => r.createdAt >= startOfMonth && r.createdAt < endOfMonth);
  const periodAdjustments = adjustments.filter((a) => a.createdAt >= startOfMonth && a.createdAt < endOfMonth);

  const grossSales = periodSales.reduce((acc, s) => acc + Number(s.totalAmount || 0), 0);
  const collectedCash = periodSales.reduce((acc, s) => acc + Number(s.paidAmount || 0), 0);
  const receivables = periodSales.reduce((acc, s) => acc + Number(s.balanceDue || 0), 0);

  let cogs = 0;
  const productMap = new Map<string, { quantity: number; revenue: number }>();
  const categoryMap = new Map<string, { count: number; revenue: number }>();

  periodItems.forEach((it) => {
    const itemCost = invCostMap.get(it.inventoryId) || 0;
    cogs += itemCost * Number(it.quantity || 1);

    const curr = productMap.get(it.itemName) || { quantity: 0, revenue: 0 };
    productMap.set(it.itemName, {
      quantity: curr.quantity + Number(it.quantity || 1),
      revenue: curr.revenue + Number(it.totalPrice || 0),
    });

    const cat = invCatMap.get(it.inventoryId) || "ACCESSORY";
    const catCurr = categoryMap.get(cat) || { count: 0, revenue: 0 };
    categoryMap.set(cat, {
      count: catCurr.count + Number(it.quantity || 1),
      revenue: catCurr.revenue + Number(it.totalPrice || 0),
    });
  });

  const grossProfit = Math.max(0, grossSales - cogs);
  const totalExpenses = expensesList.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const repairRevenue = periodRepairs.reduce((acc, r) => acc + Number(r.finalCost || r.estimatedCost || 0), 0);
  const swapInflow = periodAdjustments.filter((a) => a.netDifference > 0).reduce((acc, a) => acc + a.netDifference, 0);
  const swapOutflow = Math.abs(periodAdjustments.filter((a) => a.netDifference < 0).reduce((acc, a) => acc + a.netDifference, 0));
  const swapMargin = swapInflow - swapOutflow;

  // Formula: True Net Profit = Gross Profit + Repair Revenue + Swap Margin - Operating Expenses
  const netProfit = (grossProfit + repairRevenue + swapMargin) - totalExpenses;
  const marginPercent = grossSales > 0 ? Math.round((grossProfit / grossSales) * 100) : 0;

  // 31-Day Calendar Breakdown
  const dailyData: DailyReportRow[] = [];
  const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayStart = Math.floor(dateObj.getTime() / 1000);
    const dayEnd = dayStart + 86400;
    const dayOfWeek = dayNames[dateObj.getDay()];
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    const daySales = periodSales.filter((s) => s.createdAt >= dayStart && s.createdAt < dayEnd);
    const daySalesTotal = daySales.reduce((acc, s) => acc + Number(s.totalAmount || 0), 0);
    const daySaleIds = new Set(daySales.map((s) => s.id));
    const dayItems = periodItems.filter((it) => daySaleIds.has(it.saleId));
    let dayCogs = 0;
    dayItems.forEach((it) => {
      dayCogs += (invCostMap.get(it.inventoryId) || 0) * Number(it.quantity || 1);
    });
    const dayGp = Math.max(0, daySalesTotal - dayCogs);

    dailyData.push({
      day: d,
      date: dateStr,
      dayOfWeek,
      sales: daySalesTotal,
      grossProfit: dayGp,
      remarks: daySales.length > 0 ? `${daySales.length} invoice(s)` : "",
    });
  }

  const topProducts = Array.from(productMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.revenue - a.revenue);

  const paymentBreakdown = {
    cash: periodSales.filter((s) => s.paymentMethod === "CASH").reduce((a, b) => a + Number(b.paidAmount || 0), 0),
    card: periodSales.filter((s) => s.paymentMethod === "CARD").reduce((a, b) => a + Number(b.paidAmount || 0), 0),
    split: periodSales.filter((s) => s.paymentMethod === "SPLIT").reduce((a, b) => a + Number(b.paidAmount || 0), 0),
  };

  const trendData = dailyData
    .filter((d) => d.sales > 0 || d.grossProfit > 0)
    .slice(0, 15)
    .map((d) => ({
      label: `Day ${d.day}`,
      revenue: d.sales,
      profit: d.grossProfit,
    }));

  return {
    year,
    month,
    monthLabel,
    grossSales,
    grossProfit,
    totalExpenses,
    netProfit,
    collectedCash,
    receivables,
    payables: payablesSum.totalOutstanding,
    repairRevenue,
    swapMargin,
    dailyData,
    expenses: expensesList,
    status: "OPEN",
    marginPercent,
    repairCount: periodRepairs.length,
    swapCount: periodAdjustments.length,
    totalTransactions: periodSales.length,
    cogs,
    discounts: 0,
    swapInflow,
    swapOutflow,
    totalNetIncome: netProfit,
    topProducts,
    categoryBreakdown,
    paymentBreakdown,
    trendData,
  };
}

export type ReportPeriod = "monthly" | "yearly" | "lifetime";
export type ReportData = MonthlyReportViewData;

export async function generateFinancialReport(_period?: ReportPeriod): Promise<ReportData> {
  const now = new Date();
  return getMonthlyReport(now.getFullYear(), now.getMonth() + 1);
}
