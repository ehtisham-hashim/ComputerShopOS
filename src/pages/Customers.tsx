import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Trash2,
  UserPlus,
  ShoppingCart,
  Wrench,
  Coins,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { Customer, SaleRecord, RepairTicketRecord } from "../db/schema";
import { getCustomers, addCustomer, deleteCustomer, getCustomerHistory } from "../db/customerService";
import { Modal } from "../components/ui/Modal";
import { StatCard } from "../components/ui/StatCard";
import { SearchInput } from "../components/ui/SearchInput";

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSales, setCustomerSales] = useState<SaleRecord[]>([]);
  const [customerRepairs, setCustomerRepairs] = useState<RepairTicketRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCustomers = async (showLoader = false) => {
    try {
      if (showLoader) setIsLoading(true);
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(true);
  }, []);

  const handleOpenAddModal = () => {
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setNotes("");
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !phone.trim()) {
      setFormError("Name and phone number are required.");
      return;
    }

    try {
      await addCustomer({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      await fetchCustomers();
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to save customer. Phone number may already exist.");
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this customer record?")) {
      await deleteCustomer(id);
      await fetchCustomers();
    }
  };

  const handleViewHistory = async (cust: Customer) => {
    setSelectedCustomer(cust);
    setLoadingHistory(true);
    try {
      const history = await getCustomerHistory(cust.id);
      setCustomerSales(history.sales);
      setCustomerRepairs(history.repairs);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalSpent = customerSales.reduce((acc, s) => acc + s.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="size-6 text-brand-500" />
            Customer Directory (CRM)
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage customer accounts, contact details, sales history, and repair records
          </p>
        </div>

        <button onClick={handleOpenAddModal} className="tail-btn-primary">
          <Plus className="size-4" />
          <span>New Customer</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Registered Customers"
          value={customers.length}
          icon={<Users className="size-5" />}
        />
        <StatCard
          title="Verified Phone Contacts"
          value={customers.filter((c) => c.phone.length > 5).length}
          valueColor="brand"
          icon={<ShieldCheck className="size-5" />}
        />
        <StatCard
          title="Delivery Addresses"
          value={customers.filter((c) => c.address && c.address.length > 3).length}
          valueColor="success"
          icon={<MapPin className="size-5" />}
        />
      </div>

      {/* Search Bar */}
      <div className="tail-card p-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by customer name, phone, address, or email..."
          className="max-w-md"
        />
      </div>

      {/* Customers Table */}
      <div className="tail-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm whitespace-nowrap">
            <thead className="border-b border-gray-200 bg-gray-50/60 text-xs font-semibold uppercase text-gray-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-400">
              <tr>
                <th className="py-3.5 px-5">Customer ID</th>
                <th className="py-3.5 px-5">Name</th>
                <th className="py-3.5 px-5">Phone Number</th>
                <th className="py-3.5 px-5">Email</th>
                <th className="py-3.5 px-5">Address</th>
                <th className="py-3.5 px-5">Joined Date</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                    Loading customer records from SQLite...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                    No customers found. Click "New Customer" to register a profile.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3.5 px-5 font-mono text-xs font-bold text-gray-400">
                      CUST-{String(cust.id).padStart(4, "0")}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className="font-bold text-gray-900 dark:text-white max-w-[150px] truncate block"
                        title={cust.name}
                      >
                        {cust.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-xs font-mono text-gray-600 dark:text-gray-300">
                      <span className="flex items-center gap-1.5">
                        <Phone className="size-3.5 text-gray-400" />
                        {cust.phone}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-gray-500 dark:text-gray-400">
                      {cust.email ? (
                        <span
                          className="flex items-center gap-1.5 max-w-[160px] truncate block"
                          title={cust.email}
                        >
                          <Mail className="size-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{cust.email}</span>
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-gray-500 dark:text-gray-400">
                      {cust.address ? (
                        <span
                          className="flex items-center gap-1.5 max-w-[180px] truncate block"
                          title={cust.address}
                        >
                          <MapPin className="size-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{cust.address}</span>
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3 text-gray-400" />
                        {new Date(cust.createdAt * 1000).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleViewHistory(cust)}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/15 dark:hover:text-brand-400 transition-colors"
                          title="View Customer Profile & History"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomer(cust.id)}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/15 dark:hover:text-error-400 transition-colors"
                          title="Delete customer"
                        >
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

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Customer"
        icon={<UserPlus className="size-5 text-brand-500" />}
      >
        {formError && (
          <div className="mb-3 rounded-xl border border-error-200 bg-error-50 p-2.5 text-xs font-semibold text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {formError}
          </div>
        )}

        <form onSubmit={handleSaveCustomer} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Customer Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Johnathan Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="tail-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Phone Number (Unique ID) *
            </label>
            <input
              type="text"
              required
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="tail-input font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Email Address (Optional)
            </label>
            <input
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="tail-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Physical / Delivery Address
            </label>
            <input
              type="text"
              placeholder="Street, City, Zip"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="tail-input"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="tail-btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="tail-btn-primary">
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer History Modal */}
      <Modal
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        title={`${selectedCustomer?.name} (History)`}
        subtitle={`${selectedCustomer?.phone} • ${selectedCustomer?.address || "No address"}`}
        maxWidth="2xl"
      >
        {loadingHistory ? (
          <p className="py-8 text-center text-xs text-gray-400">Loading customer history...</p>
        ) : (
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {/* Total Valuation Chip */}
            <div className="flex items-center justify-between rounded-xl bg-brand-50/60 p-3 dark:bg-brand-500/10">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-700 dark:text-brand-300">
                <Coins className="size-4" /> Lifetime Store Spend
              </div>
              <span className="font-bold text-sm text-brand-700 dark:text-brand-300">
                PKR {Number(totalSpent || 0).toFixed(2)}
              </span>
            </div>

            {/* Invoices Section */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                <ShoppingCart className="size-3.5 text-brand-500" /> Sales Invoices ({customerSales.length})
              </h4>

              {customerSales.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">No past sales invoices.</p>
              ) : (
                <div className="space-y-1.5">
                  {customerSales.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50/50 text-xs dark:border-gray-800 dark:bg-gray-800/40"
                    >
                      <div>
                        <span className="font-mono font-bold text-gray-900 dark:text-white">{s.invoiceNo}</span>
                        <span className="text-gray-400 ml-2">{new Date((s.createdAt || 0) * 1000).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white">PKR {Number(s.totalAmount || 0).toFixed(2)}</span>
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-gray-800">{s.paymentMethod}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Repairs Section */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                <Wrench className="size-3.5 text-emerald-500" /> Repair Jobs ({customerRepairs.length})
              </h4>

              {customerRepairs.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">No repair tickets recorded.</p>
              ) : (
                <div className="space-y-1.5">
                  {customerRepairs.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50/50 text-xs dark:border-gray-800 dark:bg-gray-800/40"
                    >
                      <div>
                        <span className="font-mono font-bold text-gray-900 dark:text-white">{r.ticketNo}</span>
                        <span className="text-gray-700 dark:text-gray-300 ml-2">{r.device}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-500/15">{r.status}</span>
                        <span className="font-bold text-gray-900 dark:text-white">PKR {Number(r.finalCost || r.estimatedCost || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button
            onClick={() => setSelectedCustomer(null)}
            className="tail-btn-secondary text-xs"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};
