import React from "react";
import { Phone, Mail, MapPin, Calendar, Eye, Trash2 } from "lucide-react";
import { Customer } from "../../db/schema";
import { SearchInput } from "../ui/SearchInput";

interface CustomerTableProps {
  customers: Customer[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isLoading: boolean;
  onViewHistory: (c: Customer) => void;
  onDeleteCustomer: (id: number) => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  searchQuery,
  onSearchChange,
  isLoading,
  onViewHistory,
  onDeleteCustomer,
}) => {
  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="tail-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Customer Database</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">All registered buyers and service clients</p>
        </div>
        <div className="w-full sm:w-72">
          <SearchInput value={searchQuery} onChange={onSearchChange} placeholder="Search by name, phone, email..." />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm whitespace-nowrap">
          <thead className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase text-gray-400 dark:border-gray-800 dark:bg-gray-800/30 dark:text-gray-500">
            <tr>
              <th className="py-3.5 px-4">Customer ID</th>
              <th className="py-3.5 px-4">Name</th>
              <th className="py-3.5 px-4">Phone</th>
              <th className="py-3.5 px-4">Email</th>
              <th className="py-3.5 px-4">Address</th>
              <th className="py-3.5 px-4">Joined Date</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading ? (
              <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-xs">Loading records...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-xs">No customers found.</td></tr>
            ) : (
              filtered.map((cust) => (
                <tr key={cust.id} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-gray-400">CUST-{String(cust.id).padStart(4, "0")}</td>
                  <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white truncate max-w-[140px]">{cust.name}</td>
                  <td className="py-3.5 px-4 text-xs font-mono text-gray-600 dark:text-gray-300">
                    <span className="flex items-center gap-1.5"><Phone className="size-3.5 text-gray-400" />{cust.phone}</span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400">
                    {cust.email ? <span className="flex items-center gap-1.5 truncate max-w-[140px]"><Mail className="size-3.5 text-gray-400 shrink-0" />{cust.email}</span> : "—"}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400">
                    {cust.address ? <span className="flex items-center gap-1.5 truncate max-w-[150px]"><MapPin className="size-3.5 text-gray-400 shrink-0" />{cust.address}</span> : "—"}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1"><Calendar className="size-3 text-gray-400" />{new Date(cust.createdAt * 1000).toLocaleDateString()}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => onViewHistory(cust)} className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/15 dark:hover:text-brand-400 transition-colors" title="View Customer Profile & History">
                        <Eye className="size-4" />
                      </button>
                      <button onClick={() => onDeleteCustomer(cust.id)} className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/15 dark:hover:text-error-400 transition-colors" title="Delete customer">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
