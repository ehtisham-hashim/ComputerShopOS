import React from "react";
import { User, Eye, Trash2 } from "lucide-react";
import { AdjustmentRecord } from "../../db/schema";
import { SearchInput } from "../ui/SearchInput";
import { StatusBadge } from "../ui/StatusBadge";

interface AdjustmentTableProps {
  adjustments: AdjustmentRecord[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isLoading: boolean;
  onInspectAdjustment: (a: AdjustmentRecord) => void;
  onDeleteAdjustment: (id: number) => Promise<void>;
}

export const AdjustmentTable: React.FC<AdjustmentTableProps> = ({
  adjustments,
  searchQuery,
  onSearchChange,
  isLoading,
  onInspectAdjustment,
  onDeleteAdjustment,
}) => {
  const filtered = adjustments.filter(
    (a) =>
      a.adjustmentNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.itemTakenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.itemGivenName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="tail-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Trade-In Registry</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">All recorded swap and hardware upgrade transactions</p>
        </div>
        <div className="w-full sm:w-72">
          <SearchInput value={searchQuery} onChange={onSearchChange} placeholder="Search swap #, customer, parts..." />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px] text-left text-sm whitespace-nowrap">
          <thead className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase text-gray-400 dark:border-gray-800 dark:bg-gray-800/30 dark:text-gray-500">
            <tr>
              <th className="py-3.5 px-4">Swap #</th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Item Taken In</th>
              <th className="py-3.5 px-4">Item Given Out</th>
              <th className="py-3.5 px-4">Financial Difference</th>
              <th className="py-3.5 px-4">Payment</th>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading ? (
              <tr><td colSpan={8} className="py-12 text-center text-gray-400 text-xs">Loading swap records...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-gray-400 text-xs">No adjustments found.</td></tr>
            ) : (
              filtered.map((adj) => (
                <tr key={adj.id} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-brand-500">{adj.adjustmentNo}</td>
                  <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white truncate max-w-[130px]"><span className="flex items-center gap-1.5"><User className="size-3.5 text-gray-400 shrink-0" /><span className="truncate">{adj.customerName}</span></span></td>
                  <td className="py-3.5 px-4 truncate max-w-[140px]"><span className="font-semibold text-gray-800 dark:text-gray-200 block truncate">{adj.itemTakenName}</span><span className="text-xs text-gray-400">Valued: PKR {adj.itemTakenValue.toLocaleString()}</span></td>
                  <td className="py-3.5 px-4 truncate max-w-[140px]"><span className="font-semibold text-gray-800 dark:text-gray-200 block truncate">{adj.itemGivenName}</span><span className="text-xs text-gray-400">Price: PKR {Number(adj.itemGivenPrice || 0).toLocaleString()}</span></td>
                  <td className="py-3.5 px-4 font-mono font-bold">{Number(adj.netDifference || 0) > 0 ? <span className="text-success-600 dark:text-success-400">+PKR {Number(adj.netDifference || 0).toLocaleString()}</span> : Number(adj.netDifference || 0) < 0 ? <span className="text-warning-600 dark:text-warning-400">-PKR {Math.abs(Number(adj.netDifference || 0)).toLocaleString()}</span> : <span className="text-gray-500">PKR 0</span>}</td>
                  <td className="py-3.5 px-4"><StatusBadge status={adj.paymentStatus} /></td>
                  <td className="py-3.5 px-4 text-xs text-gray-400">{new Date(adj.createdAt * 1000).toLocaleDateString()}</td>
                  <td className="py-3.5 px-4 text-right"><div className="flex items-center justify-end gap-1"><button onClick={() => onInspectAdjustment(adj)} className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/15 dark:hover:text-brand-400" title="View details"><Eye className="size-4" /></button><button onClick={() => onDeleteAdjustment(adj.id)} className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/15 dark:hover:text-error-400" title="Delete record"><Trash2 className="size-4" /></button></div></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
