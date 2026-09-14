import React, { useMemo } from "react";
import { Eye, Printer, Trash2, Banknote, Package, AlertTriangle } from "lucide-react";
import { SaleRecord, SaleLineItem } from "../../db/schema";
import { SearchInput } from "../ui/SearchInput";
import { StatusBadge } from "../ui/StatusBadge";

interface SalesTableProps {
  sales: SaleRecord[];
  saleItems?: SaleLineItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (s: string) => void;
  isLoading: boolean;
  onViewInvoice: (s: SaleRecord) => void;
  onPrintReceipt: (s: SaleRecord) => void;
  onDeleteSale: (id: number) => Promise<void>;
  onCollectPayment?: (s: SaleRecord) => void;
  onToggleBadDebt?: (s: SaleRecord) => void;
}

export const SalesTable: React.FC<SalesTableProps> = ({
  sales,
  saleItems = [],
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  isLoading,
  onViewInvoice,
  onPrintReceipt,
  onDeleteSale,
  onCollectPayment,
  onToggleBadDebt,
}) => {
  // ponytail: pre-aggregate sale items once into a Map instead of O(N*M) linear scan per row
  const itemsBySaleId = useMemo(() => {
    const map = new Map<number, string>();
    for (const it of saleItems) {
      const sid = Number(it.saleId);
      const existing = map.get(sid);
      const chunk = `${it.quantity}x ${it.itemName}`;
      map.set(sid, existing ? `${existing}, ${chunk}` : chunk);
    }
    return map;
  }, [saleItems]);

  const filtered = sales.filter((s) => {
    const matchesSearch =
      s.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customerPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.notes.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "BAD_DEBT") return s.isBadDebt === 1;
    if (statusFilter === "ALL") return true;
    if (statusFilter === "UNPAID") return s.paymentStatus === "UNPAID" && s.isBadDebt !== 1;
    if (statusFilter === "PARTIAL") return s.paymentStatus === "PARTIAL" && s.isBadDebt !== 1;
    if (statusFilter === "PAID") return s.paymentStatus === "PAID";
    return s.paymentStatus === statusFilter;
  });

  return (
    <div className="tail-card space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search invoice #, customer name, phone, notes..."
          className="flex-1 max-w-md"
        />
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { id: "ALL", label: `All (${sales.length})` },
            { id: "PAID", label: "Paid" },
            { id: "PARTIAL", label: "Partial" },
            { id: "UNPAID", label: "Unpaid" },
            { id: "BAD_DEBT", label: "Bad Debt" },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => onStatusFilterChange(st.id)}
              className={`rounded-lg px-3 py-1.5 font-semibold transition-colors shrink-0 ${
                statusFilter === st.id
                  ? "bg-brand-600 text-white shadow-theme-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] text-left text-sm whitespace-nowrap">
          <thead className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase text-gray-400 dark:border-gray-800 dark:bg-gray-800/30 dark:text-gray-500">
            <tr>
              <th className="py-3.5 px-4">Invoice #</th>
              <th className="py-3.5 px-4">Customer & Items</th>
              <th className="py-3.5 px-4">Method</th>
              <th className="py-3.5 px-4">Total Amount</th>
              <th className="py-3.5 px-4">Paid</th>
              <th className="py-3.5 px-4">Balance</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-400 text-xs">
                  Loading sales records...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-400 text-xs">
                  No sales invoices found matching filter.
                </td>
              </tr>
            ) : (
              filtered.map((s) => {
                const summary = itemsBySaleId.get(s.id);
                const isBad = s.isBadDebt === 1;

                return (
                  <tr
                    key={s.id}
                    className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                      {s.invoiceNo}
                    </td>
                    <td className="py-3.5 px-4 max-w-[220px] truncate">
                      <span className="font-bold text-gray-900 dark:text-white block truncate">
                        {s.customerName}
                      </span>
                      {summary ? (
                        <span
                          className="text-[11px] text-gray-400 flex items-center gap-1 truncate"
                          title={summary}
                        >
                          <Package className="size-3 shrink-0 text-brand-500" />
                          {summary}
                        </span>
                      ) : s.notes ? (
                        <span className="text-[10px] text-gray-400 italic truncate block">
                          {s.notes}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="rounded-lg bg-gray-100 px-2 py-0.5 font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {s.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                      PKR {Number(s.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-success-600 dark:text-success-400">
                      PKR {Number(s.paidAmount ?? 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-error-600 dark:text-error-400">
                      {Number(s.balanceDue || 0) > 0
                        ? `PKR ${Number(s.balanceDue || 0).toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      {isBad ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          BAD DEBT
                        </span>
                      ) : (
                        <StatusBadge status={s.paymentStatus || "PAID"} />
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-400">
                      {new Date((s.createdAt || 0) * 1000).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {Number(s.balanceDue || 0) > 0 && onCollectPayment && (
                          <button
                            onClick={() => onCollectPayment(s)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400"
                            title="Collect remaining balance"
                          >
                            <Banknote className="size-3.5" />
                            <span>Collect</span>
                          </button>
                        )}
                        {onToggleBadDebt && (
                          <button
                            onClick={() => onToggleBadDebt(s)}
                            className={`inline-flex size-8 items-center justify-center rounded-lg transition-colors ${
                              isBad
                                ? "text-amber-500 bg-amber-50 dark:bg-amber-950/30 hover:text-gray-400"
                                : "text-gray-300 hover:text-amber-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                            title={isBad ? "Remove bad debt flag" : "Flag as bad debt"}
                          >
                            <AlertTriangle className="size-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onViewInvoice(s)}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/15 dark:hover:text-brand-400"
                          title="View details"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          onClick={() => onPrintReceipt(s)}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/15 dark:hover:text-brand-400"
                          title="Print receipt"
                        >
                          <Printer className="size-4" />
                        </button>
                        <button
                          onClick={() => onDeleteSale(s.id)}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/15 dark:hover:text-error-400"
                          title="Void invoice"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
