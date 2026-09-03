import React from "react";
import { User, Smartphone, Package, Eye, Trash2 } from "lucide-react";
import { RepairTicketRecord, RepairStatus, RepairPartUsed } from "../../db/schema";
import { SearchInput } from "../ui/SearchInput";
import { RepairStatusDropdown } from "./RepairStatusDropdown";

interface RepairTableProps {
  tickets: RepairTicketRecord[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (s: string) => void;
  isLoading: boolean;
  onStatusChange: (id: number, status: RepairStatus) => Promise<void>;
  onInspectTicket: (t: RepairTicketRecord) => void;
  onDeleteTicket: (id: number) => Promise<void>;
}

export const RepairTable: React.FC<RepairTableProps> = ({
  tickets, searchQuery, onSearchChange, statusFilter, onStatusFilterChange,
  isLoading, onStatusChange, onInspectTicket, onDeleteTicket,
}) => {
  const filtered = tickets.filter((t) => {
    const matchesSearch = t.ticketNo.toLowerCase().includes(searchQuery.toLowerCase()) || t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || t.device.toLowerCase().includes(searchQuery.toLowerCase());
    return (statusFilter === "ALL" || t.status === statusFilter) && matchesSearch;
  });

  return (
    <div className="tail-card space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={searchQuery} onChange={onSearchChange} placeholder="Search ticket #, customer, device..." className="flex-1 max-w-md" />
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {["ALL", "RECEIVED", "IN_PROGRESS", "WAITING_PARTS", "READY", "DELIVERED"].map((st) => (
            <button key={st} onClick={() => onStatusFilterChange(st)} className={`rounded-lg px-2.5 py-1.5 font-medium transition-colors shrink-0 ${statusFilter === st ? "bg-brand-500 text-white font-semibold shadow-theme-xs" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"}`}>
              {st.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm whitespace-nowrap">
          <thead className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase text-gray-400 dark:border-gray-800 dark:bg-gray-800/30 dark:text-gray-500">
            <tr><th className="py-3.5 px-4">Ticket #</th><th className="py-3.5 px-4">Customer</th><th className="py-3.5 px-4">Device</th><th className="py-3.5 px-4">Issue</th><th className="py-3.5 px-4">Parts</th><th className="py-3.5 px-4">Status</th><th className="py-3.5 px-4">Total Cost</th><th className="py-3.5 px-4 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading ? (
              <tr><td colSpan={8} className="py-12 text-center text-gray-400 text-xs">Loading repair tickets...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-gray-400 text-xs">No repair tickets found.</td></tr>
            ) : (
              filtered.map((ticket) => {
                let parsedParts: RepairPartUsed[] = [];
                try { parsedParts = JSON.parse(ticket.partsUsed || "[]"); } catch {}
                return (
                  <tr key={ticket.id} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-brand-500">{ticket.ticketNo}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white truncate max-w-[140px]"><span className="flex items-center gap-1.5"><User className="size-3.5 text-gray-400 shrink-0" /><span className="truncate">{ticket.customerName}</span></span></td>
                    <td className="py-3.5 px-4 text-gray-800 dark:text-gray-200 truncate max-w-[140px]"><span className="flex items-center gap-1.5"><Smartphone className="size-3.5 text-gray-400 shrink-0" /><span className="truncate">{ticket.device}</span></span></td>
                    <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">{ticket.reportedIssue}</td>
                    <td className="py-3.5 px-4"><button onClick={() => onInspectTicket(ticket)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-500 hover:text-brand-600 dark:text-brand-400"><Package className="size-3.5 shrink-0" />{parsedParts.length} Parts</button></td>
                    <td className="py-3.5 px-4">
                      <RepairStatusDropdown status={ticket.status} onChange={(newStatus) => onStatusChange(ticket.id, newStatus)} />
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">PKR {Number(ticket.finalCost || ticket.estimatedCost || 0).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right"><div className="flex items-center justify-end gap-1.5"><button onClick={() => onInspectTicket(ticket)} className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/15 dark:hover:text-brand-400" title="View details"><Eye className="size-4" /></button><button onClick={() => onDeleteTicket(ticket.id)} className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/15 dark:hover:text-error-400" title="Delete ticket"><Trash2 className="size-4" /></button></div></td>
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
