import React from "react";
import { FileText, CheckCircle2 } from "lucide-react";
import { ReportData } from "../../db/reportService";

interface ReportFinancialTableProps {
  report: ReportData;
}

export const ReportFinancialTable: React.FC<ReportFinancialTableProps> = ({ report }) => {
  return (
    <div className="tail-card space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
        <div>
          <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="size-4 text-brand-500" />
            Profit & Loss Financial Summary
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Detailed line items and net operating metrics</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
            <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
              <td className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300">
                Gross Sales Invoices (POS Checkout)
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums font-bold text-gray-900 dark:text-white">
                PKR {report.grossSales.toLocaleString()}
              </td>
            </tr>
            <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
              <td className="py-2.5 px-3 font-medium text-gray-500">
                Less: Customer Promotional Discounts
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums font-bold text-warning-600 dark:text-warning-400">
                -PKR {report.discounts.toLocaleString()}
              </td>
            </tr>
            <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
              <td className="py-2.5 px-3 font-medium text-gray-500">
                Less: Cost of Goods Sold (COGS)
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums text-gray-600 dark:text-gray-400">
                -PKR {report.cogs.toLocaleString()}
              </td>
            </tr>
            <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
              <td className="py-2.5 px-3 font-medium text-gray-500">
                Less: Uncollected Credit (Unpaid Sales / Receivables)
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums text-rose-600 dark:text-rose-400">
                {report.receivables > 0 ? `-PKR ${report.receivables.toLocaleString()}` : "PKR 0"}
              </td>
            </tr>
            <tr className="bg-brand-50/50 dark:bg-brand-950/30 font-bold border-y border-brand-100 dark:border-brand-900/40">
              <td className={report.grossProfit >= 0 ? "py-2.5 px-3 text-brand-700 dark:text-brand-300" : "py-2.5 px-3 text-rose-700 dark:text-rose-300"}>
                Realized Gross Hardware Profit (Margin: {report.marginPercent}%)
              </td>
              <td className={`py-2.5 px-3 text-right tabular-nums ${report.grossProfit >= 0 ? "text-brand-700 dark:text-brand-300" : "text-rose-600 dark:text-rose-400"}`}>
                {report.grossProfit >= 0 ? `PKR ${report.grossProfit.toLocaleString()}` : `-PKR ${Math.abs(report.grossProfit).toLocaleString()}`}
              </td>
            </tr>
            <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
              <td className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300">
                Repair & RMA Service Income ({report.repairCount} jobs)
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                +PKR {report.repairRevenue.toLocaleString()}
              </td>
            </tr>
            <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
              <td className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300">
                Hardware Trade-In & Swap Balance Flow ({report.swapCount} deals)
              </td>
              <td className={`py-2.5 px-3 text-right tabular-nums font-bold ${report.swapMargin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {report.swapMargin >= 0 ? `+PKR ${report.swapMargin.toLocaleString()}` : `-PKR ${Math.abs(report.swapMargin).toLocaleString()}`}
              </td>
            </tr>
            <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
              <td className="py-2.5 px-3 font-semibold text-rose-600 dark:text-rose-400">
                Less: Total Operating Expenses (Rent, Bills, Salaries)
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums font-bold text-rose-600 dark:text-rose-400">
                -PKR {report.totalExpenses.toLocaleString()}
              </td>
            </tr>
            <tr className="bg-gray-50 dark:bg-gray-800/80 font-bold text-sm border-t-2 border-gray-200 dark:border-gray-700">
              <td className="py-3 px-3 text-gray-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                TOTAL ESTIMATED NET STORE EARNINGS
              </td>
              <td className={`py-3 px-3 text-right tabular-nums font-bold text-base ${report.totalNetIncome >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {report.totalNetIncome >= 0 ? `PKR ${report.totalNetIncome.toLocaleString()}` : `-PKR ${Math.abs(report.totalNetIncome).toLocaleString()}`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
