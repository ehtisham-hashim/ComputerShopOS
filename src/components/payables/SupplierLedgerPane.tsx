import React, { useState, useMemo } from "react";
import {
  ShoppingBag,
  Banknote,
  Undo2,
  Sliders,
  Download,
  Printer,
  Trash2,
  Search,
  Building2,
  Phone,
  MapPin,
  ArrowLeft,
  Eye,
} from "lucide-react";
import { PayableParty, PayableLedgerEntry, PayableTxType } from "../../db/schema";
import { deleteLedgerEntry, deletePayableParty } from "../../db/payablesService";
import { getPurchases, deletePurchase } from "../../db/purchaseService";
import { ConfirmModal } from "../ui/ConfirmModal";
import { DatePicker } from "../ui/DatePicker";
import { ViewPurchaseModal } from "./ViewPurchaseModal";

interface SupplierLedgerPaneProps {
  party: PayableParty | null;
  ledger: PayableLedgerEntry[];
  isLoading: boolean;
  onBack?: () => void;
  onOpenAddTransaction: (type: PayableTxType) => void;
  onOpenNewPurchase?: () => void;
  onRefresh: () => Promise<void>;
  onPartyDeleted: () => void;
}

export const SupplierLedgerPane: React.FC<SupplierLedgerPaneProps> = ({
  party,
  ledger,
  isLoading,
  onBack,
  onOpenAddTransaction,
  onOpenNewPurchase,
  onRefresh,
  onPartyDeleted,
}) => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const [viewPurchaseRef, setViewPurchaseRef] = useState<string | null>(null);

  const [deleteEntryId, setDeleteEntryId] = useState<number | null>(null);
  const [isDeletingEntry, setIsDeletingEntry] = useState(false);

  const [isConfirmDeletePartyOpen, setIsConfirmDeletePartyOpen] = useState(false);
  const [isDeletingParty, setIsDeletingParty] = useState(false);

  const filteredEntries = useMemo(() => {
    return ledger.filter((entry) => {
      const matchesSearch =
        entry.description.toLowerCase().includes(search.toLowerCase()) ||
        (entry.refNo || "").toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;
      if (typeFilter !== "ALL" && entry.txType !== typeFilter) return false;

      if (dateFrom) {
        const fromTs = Math.floor(new Date(dateFrom).getTime() / 1000);
        if (entry.txDate < fromTs) return false;
      }
      if (dateTo) {
        const toTs = Math.floor(new Date(dateTo).getTime() / 1000) + 86399;
        if (entry.txDate > toTs) return false;
      }

      return true;
    });
  }, [ledger, search, typeFilter, dateFrom, dateTo]);

  const handleDeleteEntry = async () => {
    if (deleteEntryId === null) return;
    setIsDeletingEntry(true);
    try {
      const entry = ledger.find((l) => l.id === deleteEntryId);
      if (entry && entry.txType === "PURCHASE" && party) {
        const allPurchases = await getPurchases(party.id);
        const linked = allPurchases.find(
          (p) =>
            p.purchaseNo === entry.refNo ||
            p.refNo === entry.refNo ||
            entry.description.includes(p.purchaseNo)
        );
        if (linked) {
          await deletePurchase(linked.id);
          await onRefresh();
          setDeleteEntryId(null);
          return;
        }
      }
      await deleteLedgerEntry(deleteEntryId);
      await onRefresh();
      setDeleteEntryId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeletingEntry(false);
    }
  };

  const handleDeleteParty = async () => {
    if (!party) return;
    setIsDeletingParty(true);
    try {
      await deletePayableParty(party.id);
      setIsConfirmDeletePartyOpen(false);
      onPartyDeleted();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeletingParty(false);
    }
  };

  const handleExportCsv = () => {
    if (!party) return;
    const headers = ["Date", "Type", "Ref#", "Description", "Debit (PKR)", "Credit (PKR)", "Balance (PKR)"];
    const rows = filteredEntries.map((e) => [
      new Date(e.txDate * 1000).toISOString().split("T")[0],
      e.txType,
      `"${(e.refNo || "").replace(/"/g, '""')}"`,
      `"${(e.description || "").replace(/"/g, '""')}"`,
      e.debit,
      e.credit,
      e.balance,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Ledger_${party.name.replace(/[^a-zA-Z0-9]/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!party) {
    return (
      <div className="flex flex-col items-center justify-center h-[750px] border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900 p-8 text-center shadow-theme-xs">
        <div className="size-16 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/50 flex items-center justify-center text-brand-500 mb-4">
          <Building2 className="size-8" />
        </div>
        <h3 className="font-bold text-base text-gray-900 dark:text-white mb-1">
          No Supplier Selected
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
          Select a supplier from the directory on the left to inspect their running transaction ledger, record purchases, and track payments.
        </p>
      </div>
    );
  }

  const hasBalance = party.currentBalance > 0;

  return (
    <div className="flex flex-col min-h-[650px] border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900 overflow-hidden shadow-theme-xs">
      {/* Top Header Card */}
      <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="tail-btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 shrink-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Back to all suppliers directory"
              >
                <ArrowLeft className="size-4" />
                <span className="font-bold">Suppliers</span>
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {party.name}
                </h2>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    hasBalance
                      ? "bg-error-50 text-error-600 dark:bg-error-950/40 dark:text-error-400 border border-error-200 dark:border-error-800"
                      : "bg-success-50 text-success-600 dark:bg-success-950/40 dark:text-success-400 border border-success-200 dark:border-success-800"
                  }`}
                >
                  {hasBalance ? "Balance Due" : "Settled"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                {party.phone && (
                  <div className="flex items-center gap-1 font-mono">
                    <Phone className="size-3 text-gray-400" />
                    <span>{party.phone}</span>
                  </div>
                )}
                {party.address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="size-3 text-gray-400" />
                    <span>{party.address}</span>
                  </div>
                )}
                {party.notes && (
                  <div className="text-gray-400 italic">
                    Note: {party.notes}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Current Balance Display */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80 text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">
                Current Balance
              </span>
              <span
                className={`text-lg font-bold font-mono ${
                  hasBalance
                    ? "text-error-600 dark:text-error-400"
                    : "text-success-600 dark:text-success-400"
                }`}
              >
                PKR {party.currentBalance.toLocaleString()}
              </span>
            </div>

            <button
              onClick={() => setIsConfirmDeletePartyOpen(true)}
              title="Delete supplier"
              className="p-2 text-gray-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-950/30 rounded-xl transition-all"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-200/60 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                if (onOpenNewPurchase) {
                  onOpenNewPurchase();
                } else {
                  onOpenAddTransaction("PURCHASE");
                }
              }}
              className="tail-btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <ShoppingBag className="size-3.5" />
              <span>+ Purchase</span>
            </button>
            <button
              onClick={() => onOpenAddTransaction("PAYMENT")}
              className="tail-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-success-600 dark:text-success-400 hover:border-success-500"
            >
              <Banknote className="size-3.5" />
              <span>+ Payment</span>
            </button>
            <button
              onClick={() => onOpenAddTransaction("RETURN")}
              className="tail-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-amber-600 dark:text-amber-400 hover:border-amber-500"
            >
              <Undo2 className="size-3.5" />
              <span>+ Return</span>
            </button>
            <button
              onClick={() => onOpenAddTransaction("ADJUSTMENT")}
              className="tail-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-purple-600 dark:text-purple-400 hover:border-purple-500"
            >
              <Sliders className="size-3.5" />
              <span>Adjustment</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportCsv}
              className="tail-btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1 text-gray-600 dark:text-gray-300"
              title="Export ledger as CSV"
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="tail-btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1 text-gray-600 dark:text-gray-300"
              title="Print Ledger"
            >
              <Printer className="size-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="size-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description or ref#..."
              className="tail-input text-xs pl-8 py-1 h-7"
            />
          </div>

          {/* Type dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="tail-input text-xs py-1 h-7 w-32"
          >
            <option value="ALL">All Types</option>
            <option value="PURCHASE">Purchases</option>
            <option value="PAYMENT">Payments</option>
            <option value="RETURN">Returns</option>
            <option value="ADJUSTMENT">Adjustments</option>
          </select>
        </div>

        {/* Date range with modern custom DatePicker */}
        <div className="flex items-center gap-1.5">
          <DatePicker
            value={dateFrom}
            onChange={setDateFrom}
            placeholder="From Date"
            className="w-32"
          />
          <span className="text-gray-400 font-bold">-</span>
          <DatePicker
            value={dateTo}
            onChange={setDateTo}
            placeholder="To Date"
            className="w-32"
          />
        </div>
      </div>

      {/* Interactive Ledger Table */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            No ledger transactions found matching filters.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800/90 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-800 text-[11px] uppercase tracking-wider backdrop-blur-sm">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-2.5">Type</th>
                <th className="py-2.5 px-2.5">Ref #</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Debit (Paid)</th>
                <th className="py-2.5 px-3 text-right">Credit (Bill)</th>
                <th className="py-2.5 px-3 text-right">Balance</th>
                <th className="py-2.5 px-2 text-center w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-mono">
              {filteredEntries.map((entry) => {
                const dateFormatted = new Date(entry.txDate * 1000)
                  .toISOString()
                  .split("T")[0];

                const typeBadgeClass = {
                  PURCHASE: "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 border-brand-200 dark:border-brand-800",
                  PAYMENT: "bg-success-50 text-success-700 dark:bg-success-950/40 dark:text-success-300 border-success-200 dark:border-success-800",
                  RETURN: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
                  ADJUSTMENT: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
                }[entry.txType] || "bg-gray-100 text-gray-700";

                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="py-2 px-3 text-gray-500 font-sans text-xs whitespace-nowrap">
                      {dateFormatted}
                    </td>
                    <td className="py-2 px-2.5 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${typeBadgeClass}`}
                      >
                        {entry.txType}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-gray-600 dark:text-gray-300 font-bold whitespace-nowrap">
                      {entry.refNo || "—"}
                    </td>
                    <td className="py-2 px-3 text-gray-800 dark:text-gray-200 font-sans text-xs max-w-xs truncate">
                      {entry.description}
                    </td>
                    <td className="py-2 px-3 text-right text-success-600 dark:text-success-400 font-bold">
                      {entry.debit > 0 ? entry.debit.toLocaleString() : "—"}
                    </td>
                    <td className="py-2 px-3 text-right text-error-600 dark:text-error-400 font-bold">
                      {entry.credit > 0 ? entry.credit.toLocaleString() : "—"}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-gray-900 dark:text-white">
                      {entry.balance.toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {entry.txType === "PURCHASE" && (
                          <button
                            onClick={() => setViewPurchaseRef(entry.refNo || "")}
                            className="text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 p-1 rounded transition-colors"
                            title="View Purchase Inward Bill"
                          >
                            <Eye className="size-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteEntryId(entry.id)}
                          className="text-gray-300 hover:text-error-500 dark:text-gray-600 dark:hover:text-error-400 p-1 rounded transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="size-3.5" />
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

      {/* Bottom Summary Bar */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-200 dark:border-gray-800 text-xs font-mono flex flex-wrap items-center justify-between gap-4">
        <div className="text-gray-500 font-sans text-[11px]">
          Showing {filteredEntries.length} transaction entries
        </div>
        <div className="flex items-center gap-6">
          <div>
            <span className="text-gray-400 text-[10px] uppercase block">Total Credit (Billed)</span>
            <span className="text-error-600 dark:text-error-400 font-bold">
              PKR {filteredEntries.reduce((s, e) => s + e.credit, 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-gray-400 text-[10px] uppercase block">Total Debit (Paid)</span>
            <span className="text-success-600 dark:text-success-400 font-bold">
              PKR {filteredEntries.reduce((s, e) => s + e.debit, 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-gray-400 text-[10px] uppercase block">Ledger Balance</span>
            <span
              className={`font-bold ${
                party.currentBalance > 0
                  ? "text-error-600 dark:text-error-400"
                  : "text-success-600 dark:text-success-400"
              }`}
            >
              PKR {party.currentBalance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* View Purchase Bill Details Modal */}
      <ViewPurchaseModal
        isOpen={Boolean(viewPurchaseRef)}
        onClose={() => setViewPurchaseRef(null)}
        purchaseNoOrRef={viewPurchaseRef}
        partyId={party.id}
      />

      {/* Confirm Delete Entry Modal */}
      <ConfirmModal
        isOpen={deleteEntryId !== null}
        onClose={() => setDeleteEntryId(null)}
        onConfirm={handleDeleteEntry}
        title="Delete Ledger Entry"
        message="Are you sure you want to delete this transaction entry? Running balances will be recalculated."
        confirmText="Delete Entry"
        isLoading={isDeletingEntry}
      />

      {/* Confirm Delete Party Modal */}
      <ConfirmModal
        isOpen={isConfirmDeletePartyOpen}
        onClose={() => setIsConfirmDeletePartyOpen(false)}
        onConfirm={handleDeleteParty}
        title={`Delete Supplier: ${party.name}`}
        message="Are you sure you want to delete this supplier and all their associated ledger history? This cannot be undone."
        confirmText="Delete Supplier"
        isLoading={isDeletingParty}
      />
    </div>
  );
};
