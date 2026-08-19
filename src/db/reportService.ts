import { getRecentSales, getAllSaleItems } from "./posService";
import { getInventoryItems } from "./inventoryService";
import { getRepairTickets } from "./repairsService";
import { getAdjustments } from "./adjustmentsService";

export type ReportPeriod = "monthly" | "yearly" | "lifetime";

export interface ReportData {
  period: ReportPeriod;
  grossSales: number;
  discounts: number;
  collectedCash: number;
  receivables: number;
  cogs: number;
  grossProfit: number;
  marginPercent: number;
  repairRevenue: number;
  repairCount: number;
  swapInflow: number;
  swapOutflow: number;
  swapCount: number;
  totalNetIncome: number;
  totalTransactions: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  categoryBreakdown: { category: string; count: number; revenue: number }[];
  paymentBreakdown: { cash: number; card: number; split: number };
  trendData: { label: string; revenue: number; profit: number }[];
}

export async function generateFinancialReport(period: ReportPeriod): Promise<ReportData> {
  const [sales, saleItems, inventory, repairs, adjustments] = await Promise.all([
    getRecentSales(500),
    getAllSaleItems(),
    getInventoryItems(),
    getRepairTickets(),
    getAdjustments(),
  ]);

  const now = new Date();
  const startOfMonth = Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000);
  const startOfYear = Math.floor(new Date(now.getFullYear(), 0, 1).getTime() / 1000);

  const filterByTime = (createdAt: number) => {
    if (period === "monthly") return createdAt >= startOfMonth;
    if (period === "yearly") return createdAt >= startOfYear;
    return true;
  };

  const periodSales = sales.filter((s) => filterByTime(s.createdAt));
  const periodRepairs = repairs.filter((r) => filterByTime(r.createdAt));
  const periodAdjustments = adjustments.filter((a) => filterByTime(a.createdAt));

  const saleIds = new Set(periodSales.map((s) => s.id));
  const periodItems = saleItems.filter((it) => saleIds.has(it.saleId));

  const invCostMap = new Map<number, number>();
  const invCatMap = new Map<number, string>();
  inventory.forEach((i) => {
    invCostMap.set(i.id, i.costPrice || 0);
    invCatMap.set(i.id, i.title);
  });

  const grossSales = periodSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const discounts = periodSales.reduce((acc, s) => acc + (s.discount || 0), 0);
  const collectedCash = periodSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
  const receivables = periodSales.reduce((acc, s) => acc + (s.balanceDue || 0), 0);

  let cogs = 0;
  const productMap = new Map<string, { quantity: number; revenue: number }>();
  const categoryMap = new Map<string, { count: number; revenue: number }>();

  periodItems.forEach((it) => {
    const itemCost = invCostMap.get(it.inventoryId) || 0;
    cogs += itemCost * it.quantity;

    const curr = productMap.get(it.itemName) || { quantity: 0, revenue: 0 };
    productMap.set(it.itemName, {
      quantity: curr.quantity + it.quantity,
      revenue: curr.revenue + it.totalPrice,
    });

    const cat = invCatMap.get(it.inventoryId) || "ACCESSORY";
    const catCurr = categoryMap.get(cat) || { count: 0, revenue: 0 };
    categoryMap.set(cat, {
      count: catCurr.count + it.quantity,
      revenue: catCurr.revenue + it.totalPrice,
    });
  });

  const grossProfit = Math.max(0, grossSales - cogs);
  const marginPercent = grossSales > 0 ? Math.round((grossProfit / grossSales) * 100) : 0;

  const repairRevenue = periodRepairs.reduce((acc, r) => acc + (r.finalCost || r.estimatedCost || 0), 0);
  const swapInflow = periodAdjustments.filter((a) => a.netDifference > 0).reduce((acc, a) => acc + a.netDifference, 0);
  const swapOutflow = Math.abs(periodAdjustments.filter((a) => a.netDifference < 0).reduce((acc, a) => acc + a.netDifference, 0));
  const totalNetIncome = grossProfit + repairRevenue + (swapInflow - swapOutflow);

  const topProducts = Array.from(productMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.revenue - a.revenue);

  const paymentBreakdown = {
    cash: periodSales.filter((s) => s.paymentMethod === "CASH").reduce((a, b) => a + b.paidAmount, 0),
    card: periodSales.filter((s) => s.paymentMethod === "CARD").reduce((a, b) => a + b.paidAmount, 0),
    split: periodSales.filter((s) => s.paymentMethod === "SPLIT").reduce((a, b) => a + b.paidAmount, 0),
  };

  const trendData = periodSales.slice(0, 10).reverse().map((s) => ({
    label: s.invoiceNo.slice(-4),
    revenue: s.totalAmount,
    profit: Math.round(s.totalAmount * 0.25),
  }));

  return {
    period,
    grossSales,
    discounts,
    collectedCash,
    receivables,
    cogs,
    grossProfit,
    marginPercent,
    repairRevenue,
    repairCount: periodRepairs.length,
    swapInflow,
    swapOutflow,
    swapCount: periodAdjustments.length,
    totalNetIncome,
    totalTransactions: periodSales.length,
    topProducts,
    categoryBreakdown,
    paymentBreakdown,
    trendData,
  };
}
