import React, { useState, useMemo } from "react";
import {
  Search,
  DollarSign,
  Eye,
  AlertTriangle,
  Download,
  Printer,
  Trash2,
  Phone,
  Coins,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { SaleRecord } from "../../db/schema";
import { toggleSaleBadDebt } from "../../db/posService";
import { StatCard } from "../ui/StatCard";

interface ReceivablesTableProps {
  sales: SaleRecord[];
  isLoading: boolean;
  onViewInvoice: (sale: SaleRecord) => void;
  onCollectPayment: (sale: SaleRecord) => void;
  onDeleteSale: (id: number) => Promise<void>;
  onRefresh: () => Promise<void>;
  onOpenAddReceivable: () => void;
}

export const ReceivablesTable: React.FC<ReceivablesTableProps> = ({
  sales,
  isLoading,
  onViewInvoice,
  onCollectPayment,
  onDeleteSale,
  onRefresh,
  onOpenAddReceivable,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // All sales that have balance due or are marked as bad debt
  const receivableSales = useMemo(() => {
    return sales.filter((s) => s.balanceDue > 0 || s.isBadDebt === 1);
  }, [sales]);

  // Overall metrics
  const totalReceivables = useMemo(() => {
    return receivableSales.reduce((sum, s) => sum + s.balanceDue, 0);
  }, [receivableSales]);

  const badDebtsTotal = useMemo(() => {
    return receivableSales
      .filter((s) => s.isBadDebt === 1)
      .reduce((sum, s) => sum + s.balanceDue, 0);
  }, [receivableSales]);

  const netCollectible = totalReceivables - badDebtsTotal;

  // Filtered rows
  const filteredSales = useMemo(() => {
    return receivableSales.filter((s) => {
      const matchesSearch =
        s.customerName.toLowerCase().includes(search.toLowerCase()) ||
        s.customerPhone.includes(search) ||
        s.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
        s.notes.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === "BAD_DEBT") return s.isBadDebt === 1;
      if (statusFilter === "OUTSTANDING") return s.paymentStatus === "UNPAID" && s.isBadDebt !== 1;
      if (statusFilter === "PARTIAL") return s.paymentStatus === "PARTIAL" && s.isBadDebt !== 1;

      return true;
    });
  }, [receivableSales, search, statusFilter]);

  const handleToggleBadDebt = async (sale: SaleRecord) => {
    try {
      await toggleSaleBadDebt(sale.id, sale.isBadDebt !== 1);
      await onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "Rec / Invoice#",
      "Date",
      "Customer",
      "Phone",
      "Total Amount",
      "Paid",
      "Balance Due",
      "Status",
      "Bad Debt",
      "Notes",
    ];
    const rows = filteredSales.map((s) => [
      s.invoiceNo,
      new Date(s.createdAt * 1000).toISOString().split("T")[0],
      `"${s.customerName.replace(/"/g, '""')}"`,
      `"${s.customerPhone}"`,
      s.totalAmount,
      s.paidAmount,
      s.balanceDue,
      s.paymentStatus,
      s.isBadDebt === 1 ? "YES" : "NO",
      `"${(s.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Receivables_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Receivables Due"
          value={`PKR ${totalReceivables.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
          icon={Coins}
          variant={totalReceivables > 0 ? "warning" : "default"}
          description="Total customer credit owed to shop"
        />
        <StatCard
          title="Doubtful / Bad Debts"
          value={`PKR ${badDebtsTotal.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
          icon={AlertTriangle}
          variant={badDebtsTotal > 0 ? "warning" : "default"}
          description="Flagged as unlikely or hard to recover"
        />
        <StatCard
          title="Net Recoverable Balance"
          value={`PKR ${netCollectible.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
          icon={CheckCircle2}
          description="Active collectible customer credit"
        />
        <StatCard
          title="Total Outstanding Debtors"
          value={receivableSales.length}
          icon={Phone}
          description="Invoices / legacy records with balance"
        />
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs overflow-hidden">
        {/* Table Filter Toolbar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="size-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer, phone, invoice..."
                className="tail-input pl-9 text-xs"
              />
            </div>

            {/* Filter pills */}
            <div className="flex gap-1">
              {[
                { id: "ALL", label: "All Dues" },
                { id: "OUTSTANDING", label: "Unpaid" },
                { id: "PARTIAL", label: "Partial" },
                { id: "BAD_DEBT", label: "Bad Debt" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`text-xs font-bold py-1.5 px-3 rounded-xl border transition-all ${
                    statusFilter === f.id
                      ? "bg-brand-500 text-white border-brand-500 shadow-theme-xs"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddReceivable}
              className="tail-btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Plus className="size-3.5" />
              <span>Record Receivable</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="tail-btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1"
              title="Export CSV"
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="tail-btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1"
              title="Print Table"
            >
              <Printer className="size-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto scrollbar-thin">
          {isLoading ? (
            <div className="flex items-center justify-center h-52">
              <div className="size-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400">
              No outstanding receivables found matching current filters.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Ref / Invoice #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3 text-right">Total</th>
                  <th className="py-3 px-3 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-mono">
                {filteredSales.map((sale) => {
                  const dateStr = new Date(sale.createdAt * 1000)
                    .toISOString()
                    .split("T")[0];

                  const isBad = sale.isBadDebt === 1;

                  return (
                    <tr
                      key={sale.id}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        {sale.invoiceNo}
                      </td>
                      <td className="py-3 px-3 text-gray-500 font-sans text-xs whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white font-sans text-xs font-medium">
                        <div>{sale.customerName}</div>
                        {sale.notes && (
                          <div className="text-[10px] text-gray-400 italic font-mono truncate max-w-xs">
                            {sale.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-gray-500 whitespace-nowrap">
                        {sale.customerPhone || "—"}
                      </td>
                      <td className="py-3 px-3 text-right text-gray-700 dark:text-gray-300">
                        PKR {sale.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right text-success-600 dark:text-success-400">
                        PKR {sale.paidAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-error-600 dark:text-error-400">
                        PKR {sale.balanceDue.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isBad ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            BAD DEBT
                          </span>
                        ) : sale.paymentStatus === "PARTIAL" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            PARTIAL
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-error-50 text-error-700 dark:bg-error-950/40 dark:text-error-300 border border-error-200 dark:border-error-800">
                            UNPAID
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {sale.balanceDue > 0 && (
                            <button
                              onClick={() => onCollectPayment(sale)}
                              className="tail-btn-primary text-xs py-1 px-2.5 flex items-center gap-1"
                              title="Collect balance payment"
                            >
                              <DollarSign className="size-3.5" />
                              <span>Collect</span>
                            </button>
                          )}
                          <button
                            onClick={() => onViewInvoice(sale)}
                            className="p-1.5 text-gray-400 hover:text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            title="Inspect Details"
                          >
                            <Eye className="size-4" />
                          </button>
                          <button
                            onClick={() => handleToggleBadDebt(sale)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isBad
                                ? "text-amber-500 bg-amber-50 dark:bg-amber-950/30 hover:text-gray-400"
                                : "text-gray-300 hover:text-amber-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                            title={isBad ? "Remove Bad Debt Flag" : "Flag as Bad Debt / Doubtful"}
                          >
                            <AlertTriangle className="size-4" />
                          </button>
                          <button
                            onClick={() => onDeleteSale(sale.id)}
                            className="p-1.5 text-gray-300 hover:text-error-500 dark:text-gray-600 dark:hover:text-error-400 rounded-lg transition-colors"
                            title="Delete record"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
