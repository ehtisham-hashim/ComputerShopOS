import React, { useState, useMemo } from "react";
import { Search, Plus, Building2, Phone, ChevronRight } from "lucide-react";
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
  selectedPartyId,
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
    <div className="flex flex-col h-[750px] border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900 overflow-hidden shadow-theme-xs">
      {/* Top action bar */}
      <div className="p-3.5 border-b border-gray-100 dark:border-gray-800 space-y-2.5 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-brand-500" />
            <span className="font-bold text-sm text-gray-900 dark:text-white">
              Suppliers Directory
            </span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold">
              {filteredParties.length}
            </span>
          </div>
          <button
            onClick={onOpenAddSupplier}
            className="tail-btn-primary text-xs py-1 px-2.5 h-8 flex items-center gap-1"
          >
            <Plus className="size-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="size-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search party or phone..."
            className="tail-input text-xs pl-8 py-1.5 h-8"
          />
        </div>

        {/* Filter pills */}
        <div className="flex gap-1">
          {(["ALL", "OWED", "SETTLED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 text-[10px] font-bold py-1 rounded-lg border transition-all text-center ${
                filter === f
                  ? "bg-brand-500 text-white border-brand-500 shadow-theme-xs"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {f === "ALL" ? "All" : f === "OWED" ? "Has Balance" : "Settled"}
            </button>
          ))}
        </div>
      </div>

      {/* Supplier List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : filteredParties.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            No suppliers found.
          </div>
        ) : (
          filteredParties.map((party) => {
            const isSelected = selectedPartyId === party.id;
            const hasOwed = party.currentBalance > 0;

            return (
              <div
                key={party.id}
                onClick={() => onSelectParty(party)}
                className={`p-3.5 cursor-pointer transition-all flex items-center justify-between gap-2 select-none ${
                  isSelected
                    ? "bg-brand-50/80 dark:bg-brand-950/40 border-l-4 border-l-brand-500"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-gray-900 dark:text-white truncate">
                      {party.name}
                    </span>
                  </div>
                  {party.phone && (
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 font-mono mt-0.5">
                      <Phone className="size-3" />
                      <span>{party.phone}</span>
                    </div>
                  )}
                  {party.address && (
                    <div className="text-[10px] text-gray-400 truncate mt-0.5">
                      {party.address}
                    </div>
                  )}
                </div>

                <div className="text-right flex items-center gap-1.5 flex-shrink-0">
                  <div>
                    <div
                      className={`text-xs font-bold font-mono ${
                        hasOwed
                          ? "text-error-600 dark:text-error-400"
                          : "text-success-600 dark:text-success-400"
                      }`}
                    >
                      PKR {party.currentBalance.toLocaleString()}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider font-semibold text-gray-400">
                      {hasOwed ? "Balance Due" : "Settled"}
                    </div>
                  </div>
                  <ChevronRight
                    className={`size-4 transition-transform ${
                      isSelected
                        ? "text-brand-500 translate-x-0.5"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
