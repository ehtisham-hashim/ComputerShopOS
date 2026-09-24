import React, { useState } from "react";
import { DailyReportRow } from "../../db/schema";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Receipt,
  Building2,
  ShoppingCart,
  ArrowLeftRight,
  Wrench,
} from "lucide-react";

interface ReportDailyTableProps {
  dailyData: DailyReportRow[];
  totalSales: number;
  totalGrossProfit: number;
  totalExpenses?: number;
  totalPayables?: number;
  totalNetProfit?: number;
}

export const ReportDailyTable: React.FC<ReportDailyTableProps> = ({
  dailyData,
  totalSales,
  totalGrossProfit,
  totalExpenses,
  totalPayables,
  totalNetProfit,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());

  const toggleDay = (day: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  };

  const sumExpenses = totalExpenses ?? dailyData.reduce((acc, d) => acc + (d.expenses || 0), 0);
  const sumPayables = totalPayables ?? dailyData.reduce((acc, d) => acc + (d.payables || 0), 0);
  const sumNet = totalNetProfit ?? (totalGrossProfit - sumExpenses);

  const activeDays = dailyData.filter(
    (d) =>
      d.sales > 0 ||
      d.grossProfit !== 0 ||
      (d.expenses || 0) > 0 ||
      (d.payables || 0) > 0 ||
      (d.adjustmentItems && d.adjustmentItems.length > 0) ||
      (d.payableItems && d.payableItems.length > 0) ||
      (d.saleItems && d.saleItems.length > 0)
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs overflow-hidden">
      {/* Table Header / Collapse Toggle */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <Calendar className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Daily Financial Calendar & Transaction Detail
            </h3>
            <p className="text-xs text-gray-400 flex flex-wrap items-center gap-x-2">
              <span>{activeDays.length} active day(s)</span>
              <span>•</span>
              <span>Sales: Rs. {totalSales.toLocaleString()}</span>
              <span>•</span>
              <span className={totalGrossProfit >= 0 ? "text-emerald-500 font-semibold" : "text-rose-500 font-semibold"}>
                GP: {totalGrossProfit >= 0 ? `Rs. ${totalGrossProfit.toLocaleString()}` : `-Rs. ${Math.abs(totalGrossProfit).toLocaleString()}`}
              </span>
              <span>•</span>
              <span className="text-rose-500 dark:text-rose-400">Exp: Rs. {sumExpenses.toLocaleString()}</span>
              <span>•</span>
              <span className={sumNet >= 0 ? "text-emerald-500 font-semibold" : "text-rose-500 font-semibold"}>
                Net: {sumNet >= 0 ? `Rs. ${sumNet.toLocaleString()}` : `-Rs. ${Math.abs(sumNet).toLocaleString()}`}
              </span>
            </p>
          </div>
        </div>

        <button className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          {isCollapsed ? <ChevronDown className="size-5" /> : <ChevronUp className="size-5" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="overflow-x-auto max-h-[75vh] scrollbar-thin">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800/90 backdrop-blur-sm text-gray-500 font-bold uppercase tracking-wider text-[10px] z-10 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-center w-12">Day #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Day</th>
                <th className="px-4 py-3 text-right">Daily Sale</th>
                <th className="px-4 py-3 text-right">Gross Profit</th>
                <th className="px-4 py-3 text-right">Expenses</th>
                <th className="px-4 py-3 text-right">Purchases / Paid</th>
                <th className="px-4 py-3 text-right">Net Profit</th>
                <th className="px-4 py-3 text-right">Margin %</th>
                <th className="px-4 py-3">Remarks / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {dailyData.map((row) => {
                const margin = row.sales > 0 ? Math.round((row.grossProfit / row.sales) * 100) : 0;
                const expenses = row.expenses || 0;
                const payables = row.payables || 0;
                const net = row.netProfit ?? (row.grossProfit - expenses);
                const hasSales = Boolean(row.saleItems && row.saleItems.length > 0);
                const hasSwaps = Boolean(row.adjustmentItems && row.adjustmentItems.length > 0);
                const hasExpenses = Boolean(row.expenseItems && row.expenseItems.length > 0);
                const hasPurchases = Boolean(row.payableItems && row.payableItems.length > 0);
                const hasRepairs = Boolean(row.repairItems && row.repairItems.length > 0);
                const hasDetails = hasSales || hasSwaps || hasExpenses || hasPurchases || hasRepairs;
                const hasActivity =
                  row.sales > 0 ||
                  row.grossProfit !== 0 ||
                  expenses > 0 ||
                  payables > 0 ||
                  hasSwaps ||
                  hasPurchases ||
                  hasSales ||
                  hasRepairs;
                const isExpanded = expandedDays.has(row.day);

                return (
                  <React.Fragment key={row.day}>
                    <tr
                      onClick={() => hasDetails && toggleDay(row.day)}
                      className={`transition-colors ${
                        hasDetails ? "cursor-pointer" : ""
                      } ${
                        isExpanded
                          ? "bg-brand-50/40 dark:bg-brand-950/30"
                          : hasActivity
                          ? "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                          : "opacity-50 hover:opacity-100"
                      }`}
                    >
                      <td className="px-4 py-2.5 font-bold text-gray-500 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {hasDetails ? (
                            isExpanded ? (
                              <ChevronDown className="size-3 text-brand-500" />
                            ) : (
                              <ChevronRight className="size-3 text-gray-400" />
                            )
                          ) : null}
                          <span>{row.day}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-gray-600 dark:text-gray-300 font-mono text-[11px] tabular-nums">
                        {row.date}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-gray-500">{row.dayOfWeek}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-gray-900 dark:text-white tabular-nums">
                        {row.sales > 0 ? `Rs. ${row.sales.toLocaleString()}` : "0"}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-bold tabular-nums ${
                        row.grossProfit > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : row.grossProfit < 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-gray-400"
                      }`}>
                        {row.grossProfit > 0
                          ? `Rs. ${row.grossProfit.toLocaleString()}`
                          : row.grossProfit < 0
                          ? `-Rs. ${Math.abs(row.grossProfit).toLocaleString()}`
                          : "0"}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-bold tabular-nums ${expenses > 0 ? "text-rose-600 dark:text-rose-400" : "text-gray-400"}`}>
                        {expenses > 0 ? `Rs. ${expenses.toLocaleString()}` : "0"}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-bold tabular-nums ${payables > 0 ? "text-amber-600 dark:text-amber-400" : "text-gray-400"}`}>
                        {payables > 0 ? `Rs. ${payables.toLocaleString()}` : "0"}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-bold tabular-nums ${
                        net > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : net < 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-gray-400"
                      }`}>
                        {net > 0
                          ? `Rs. ${net.toLocaleString()}`
                          : net < 0
                          ? `-Rs. ${Math.abs(net).toLocaleString()}`
                          : "0"}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-400 text-[11px] tabular-nums">
                        {row.sales > 0 ? `${margin}%` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 text-[11px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{row.remarks || "—"}</span>
                          {hasDetails && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors ${
                              isExpanded
                                ? "bg-brand-100 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border-brand-300 dark:border-brand-700"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-300 dark:hover:bg-brand-950/30"
                            }`}>
                              {isExpanded ? "Hide Details" : "Show Details"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Breakdown Drawer */}
                    {isExpanded && (
                      <tr className="bg-gray-50/80 dark:bg-gray-800/60 border-y border-gray-200/60 dark:border-gray-700/60">
                        <td colSpan={10} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Daily Sales Breakdown */}
                            {hasSales && (
                              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-white dark:bg-gray-900 p-3 shadow-xs">
                                <div className="flex items-center gap-2 pb-2 mb-2 border-b border-gray-100 dark:border-gray-800 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                  <ShoppingCart className="size-3.5" />
                                  <span>Sales Invoices ({row.saleItems!.length})</span>
                                  <span className="ml-auto">Total: Rs. {row.sales.toLocaleString()}</span>
                                </div>
                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                                  {row.saleItems!.map((sale) => (
                                    <div key={sale.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 dark:border-gray-800/40 last:border-0">
                                      <div className="flex flex-col min-w-0 pr-2">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{sale.customerName}</span>
                                          <span className="font-mono text-[10px] text-gray-400 font-bold">{sale.invoiceNo}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 truncate">
                                          <span className="px-1.5 py-0.2 bg-gray-100 dark:bg-gray-800 rounded font-medium text-gray-600 dark:text-gray-400">
                                            {sale.paymentMethod}
                                          </span>
                                          <span className="truncate">{sale.itemsSummary}</span>
                                          {sale.balanceDue > 0 && (
                                            <span className="text-rose-500 font-semibold">• Due: Rs. {sale.balanceDue.toLocaleString()}</span>
                                          )}
                                        </div>
                                      </div>
                                      <span className="font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap ml-auto">
                                        Rs. {sale.totalAmount.toLocaleString()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Daily Trade-Ins & Swaps Breakdown */}
                            {hasSwaps && (
                              <div className="rounded-xl border border-purple-200 dark:border-purple-900/40 bg-white dark:bg-gray-900 p-3 shadow-xs">
                                <div className="flex items-center gap-2 pb-2 mb-2 border-b border-gray-100 dark:border-gray-800 text-purple-600 dark:text-purple-400 font-bold text-xs">
                                  <ArrowLeftRight className="size-3.5" />
                                  <span>Trade-Ins & Swaps ({row.adjustmentItems!.length})</span>
                                  <span className="ml-auto">
                                    Net:{" "}
                                    {row.adjustmentItems!.reduce((sum, a) => sum + a.netDifference, 0) >= 0
                                      ? `+Rs. ${row.adjustmentItems!.reduce((sum, a) => sum + a.netDifference, 0).toLocaleString()}`
                                      : `-Rs. ${Math.abs(row.adjustmentItems!.reduce((sum, a) => sum + a.netDifference, 0)).toLocaleString()}`}
                                  </span>
                                </div>
                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                                  {row.adjustmentItems!.map((adj) => (
                                    <div key={adj.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 dark:border-gray-800/40 last:border-0">
                                      <div className="flex flex-col min-w-0 pr-2">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{adj.customerName}</span>
                                          <span className="font-mono text-[10px] text-gray-400 font-bold">{adj.adjustmentNo}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 truncate">
                                          <span className="text-amber-600 dark:text-amber-400 font-medium">In: {adj.itemTakenName} (Rs. {adj.itemTakenValue.toLocaleString()})</span>
                                          <span>→</span>
                                          <span className="text-brand-600 dark:text-brand-400 font-medium">Out: {adj.itemGivenName} (Rs. {adj.itemGivenPrice.toLocaleString()})</span>
                                        </div>
                                      </div>
                                      <div className="text-right whitespace-nowrap ml-auto">
                                        <span
                                          className={`font-bold ${
                                            adj.netDifference >= 0
                                              ? "text-emerald-600 dark:text-emerald-400"
                                              : "text-rose-600 dark:text-rose-400"
                                          }`}
                                        >
                                          {adj.netDifference >= 0 ? `+Rs. ${adj.netDifference.toLocaleString()}` : `-Rs. ${Math.abs(adj.netDifference).toLocaleString()}`}
                                        </span>
                                        <div className="text-[9px] text-gray-400">{adj.paymentStatus}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Daily Expenses Breakdown */}
                            {hasExpenses && (
                              <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-white dark:bg-gray-900 p-3 shadow-xs">
                                <div className="flex items-center gap-2 pb-2 mb-2 border-b border-gray-100 dark:border-gray-800 text-rose-600 dark:text-rose-400 font-bold text-xs">
                                  <Receipt className="size-3.5" />
                                  <span>Daily Expenses ({row.expenseItems!.length})</span>
                                  <span className="ml-auto">Total: Rs. {expenses.toLocaleString()}</span>
                                </div>
                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                                  {row.expenseItems!.map((exp) => (
                                    <div key={exp.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 dark:border-gray-800/40 last:border-0">
                                      <div className="flex flex-col">
                                        <span className="font-semibold text-gray-800 dark:text-gray-200">{exp.title}</span>
                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                          <span className="px-1.5 py-0.2 bg-gray-100 dark:bg-gray-800 rounded font-medium text-gray-600 dark:text-gray-400">
                                            {exp.category}
                                          </span>
                                          {exp.paymentMethod && <span>• {exp.paymentMethod}</span>}
                                          {exp.notes && <span>• {exp.notes}</span>}
                                        </div>
                                      </div>
                                      <span className="font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap ml-2">
                                        Rs. {exp.amount.toLocaleString()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Daily Repairs Breakdown */}
                            {hasRepairs && (
                              <div className="rounded-xl border border-sky-200 dark:border-sky-900/40 bg-white dark:bg-gray-900 p-3 shadow-xs">
                                <div className="flex items-center gap-2 pb-2 mb-2 border-b border-gray-100 dark:border-gray-800 text-sky-600 dark:text-sky-400 font-bold text-xs">
                                  <Wrench className="size-3.5" />
                                  <span>Repairs & Service ({row.repairItems!.length})</span>
                                  <span className="ml-auto">Total: Rs. {row.repairItems!.reduce((s, r) => s + r.finalCost, 0).toLocaleString()}</span>
                                </div>
                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                                  {row.repairItems!.map((rep) => (
                                    <div key={rep.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 dark:border-gray-800/40 last:border-0">
                                      <div className="flex flex-col min-w-0 pr-2">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{rep.customerName}</span>
                                          <span className="font-mono text-[10px] text-gray-400 font-bold">{rep.ticketNo}</span>
                                          <span className={`px-1.5 py-0.5 text-[9px] rounded font-semibold ${
                                            rep.status === "COMPLETED"
                                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                              : "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400"
                                          }`}>{rep.status}</span>
                                        </div>
                                        <div className="text-[10px] text-gray-400 truncate">
                                          {rep.device} • {rep.reportedIssue}
                                        </div>
                                      </div>
                                      <span className="font-bold text-sky-600 dark:text-sky-400 whitespace-nowrap ml-auto">
                                        Rs. {rep.finalCost.toLocaleString()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Daily Purchases / Payables Breakdown */}
                            {hasPurchases && (
                              <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-white dark:bg-gray-900 p-3 shadow-xs">
                                <div className="flex items-center gap-2 pb-2 mb-2 border-b border-gray-100 dark:border-gray-800 text-amber-600 dark:text-amber-400 font-bold text-xs">
                                  <Building2 className="size-3.5" />
                                  <span>Purchases & Vendor Payments ({row.payableItems!.length})</span>
                                  <span className="ml-auto">Total: Rs. {payables.toLocaleString()}</span>
                                </div>
                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                                  {row.payableItems!.map((pur) => (
                                    <div key={pur.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 dark:border-gray-800/40 last:border-0">
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                                            {pur.partyName || "Supplier"}
                                          </span>
                                          <span className={`px-1.5 py-0.2 text-[9px] rounded font-semibold ${
                                            pur.type === "PAYMENT"
                                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                                          }`}>
                                            {pur.type === "PAYMENT" ? "SUPPLIER PAYMENT" : "PURCHASE ORDER"}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                          {pur.purchaseNo && <span>{pur.purchaseNo}</span>}
                                          {pur.type === "PAYMENT" ? (
                                            <span>• {pur.description || "Khata Payment"}</span>
                                          ) : (
                                            <>
                                              <span>• Paid: Rs. {pur.paidAmount.toLocaleString()}</span>
                                              {pur.balanceDue > 0 && (
                                                <span className="text-amber-500 font-semibold">• Due: Rs. {pur.balanceDue.toLocaleString()}</span>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      <span className={`font-bold whitespace-nowrap ml-2 ${
                                        pur.type === "PAYMENT" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                                      }`}>
                                        {pur.type === "PAYMENT" ? `Paid Rs. ${pur.paidAmount.toLocaleString()}` : `Rs. ${pur.totalAmount.toLocaleString()}`}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 font-bold border-t-2 border-gray-200 dark:border-gray-700 text-xs z-10">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-gray-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Total for Month
                </td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-white tabular-nums font-bold">
                  Rs. {totalSales.toLocaleString()}
                </td>
                <td className={`px-4 py-3 text-right font-bold tabular-nums ${totalGrossProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {totalGrossProfit >= 0 ? `Rs. ${totalGrossProfit.toLocaleString()}` : `-Rs. ${Math.abs(totalGrossProfit).toLocaleString()}`}
                </td>
                <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400 tabular-nums font-bold">
                  Rs. {sumExpenses.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-amber-600 dark:text-amber-400 tabular-nums font-bold">
                  Rs. {sumPayables.toLocaleString()}
                </td>
                <td className={`px-4 py-3 text-right font-bold tabular-nums ${sumNet >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {sumNet >= 0 ? `Rs. ${sumNet.toLocaleString()}` : `-Rs. ${Math.abs(sumNet).toLocaleString()}`}
                </td>
                <td className="px-4 py-3 text-right text-gray-500 tabular-nums font-bold">
                  {totalSales > 0 ? `${Math.round((totalGrossProfit / totalSales) * 100)}%` : "0%"}
                </td>
                <td className="px-4 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

