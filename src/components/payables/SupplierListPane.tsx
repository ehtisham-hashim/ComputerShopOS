import React, { useState, useMemo } from "react";
import { Search, Plus, Building2, Phone, MapPin, ChevronRight } from "lucide-react";
import { PayableParty } from "../../db/schema";

interface SupplierListPaneProps {
  parties: PayableParty[];
  selectedPartyId: number | null;
  isLoading?: boolean;
  onSelectParty: (party: PayableParty) => void;
  onOpenAddSupplier: () => void;
}

export const SupplierListPane: React.FC<SupplierListPaneProps> = ({
  parties,
  isLoading = false,
  onSelectParty,
  onOpenAddSupplier,
}) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "OWED" | "SETTLED">("ALL");

  const filteredParties = useMemo(() => {
    return parties.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.phone && p.phone.includes(search)) ||
        (p.notes && p.notes.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;
      if (filter === "OWED") return p.currentBalance > 0;
      if (filter === "SETTLED") return p.currentBalance <= 0;
      return true;
    });
  }, [parties, search, filter]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs overflow-hidden">
      {/* Top action and filter bar */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="size-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search supplier name, phone, or notes..."
              className="tail-input pl-9 text-xs"
            />
          </div>

          {/* Filter pills */}
          <div className="flex gap-1">
            {(["ALL", "OWED", "SETTLED"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-bold py-1.5 px-3 rounded-xl border transition-all ${
                  filter === f
                    ? "bg-brand-500 text-white border-brand-500 shadow-theme-xs"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {f === "ALL"
                  ? `All (${parties.length})`
                  : f === "OWED"
                  ? `Has Balance (${parties.filter((p) => p.currentBalance > 0).length})`
                  : `Settled (${parties.filter((p) => p.currentBalance <= 0).length})`}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onOpenAddSupplier}
          className="tail-btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
        >
          <Plus className="size-3.5" />
          <span>New Supplier</span>
        </button>
      </div>

      {/* Supplier Directory List / Table */}
      <div className="overflow-x-auto scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center h-52">
            <div className="size-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : filteredParties.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">
            No suppliers found matching current filters.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Supplier Name</th>
                <th className="py-3 px-4">Contact & Address</th>
                <th className="py-3 px-4 text-right">Total Billed</th>
                <th className="py-3 px-4 text-right">Total Paid</th>
                <th className="py-3 px-4 text-right">Current Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-mono">
              {filteredParties.map((party) => {
                const hasOwed = party.currentBalance > 0;

                return (
                  <tr
                    key={party.id}
                    onClick={() => onSelectParty(party)}
                    className="hover:bg-brand-50/40 dark:hover:bg-brand-950/20 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 group-hover:bg-brand-50 group-hover:text-brand-600 dark:group-hover:bg-brand-950/40 dark:group-hover:text-brand-400 transition-colors">
                          <Building2 className="size-4" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white text-xs">
                            {party.name}
                          </div>
                          {party.notes && (
                            <div className="text-[10px] text-gray-400 italic font-mono truncate max-w-xs">
                              {party.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-gray-500 font-sans text-xs">
                      {party.phone && (
                        <div className="flex items-center gap-1 font-mono">
                          <Phone className="size-3 text-gray-400" />
                          <span>{party.phone}</span>
                        </div>
                      )}
                      {party.address && (
                        <div className="flex items-center gap-1 text-[11px] text-gray-400">
                          <MapPin className="size-3 text-gray-400" />
                          <span className="truncate max-w-xs">{party.address}</span>
                        </div>
                      )}
                      {!party.phone && !party.address && <span className="text-gray-400">—</span>}
                    </td>

                    <td className="py-3.5 px-4 text-right text-gray-700 dark:text-gray-300">
                      PKR {party.totalCredit.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-right text-success-600 dark:text-success-400">
                      PKR {party.totalDebit.toLocaleString()}
                    </td>

                    <td
                      className={`py-3.5 px-4 text-right font-bold text-sm ${
                        hasOwed
                          ? "text-error-600 dark:text-error-400"
                          : "text-success-600 dark:text-success-400"
                      }`}
                    >
                      PKR {party.currentBalance.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                          hasOwed
                            ? "bg-error-50 text-error-700 dark:bg-error-950/40 dark:text-error-300 border-error-200 dark:border-error-800"
                            : "bg-success-50 text-success-700 dark:bg-success-950/40 dark:text-success-300 border-success-200 dark:border-success-800"
                        }`}
                      >
                        {hasOwed ? "Balance Due" : "Settled"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 group-hover:translate-x-0.5 transition-transform">
                        <span>View Ledger</span>
                        <ChevronRight className="size-4" />
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
  );
};
