import React, { useState, useEffect } from "react";
import {
  Wrench,
  Plus,
  User,
  Smartphone,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  Layers,
  Eye,
} from "lucide-react";
import { RepairTicketRecord, RepairStatus, InventoryItem, Customer, RepairPartUsed } from "../db/schema";
import {
  getRepairTickets,
  addRepairTicket,
  updateRepairStatus,
  deleteRepairTicket,
} from "../db/repairsService";
import { getCustomers } from "../db/customerService";
import { Modal } from "../components/ui/Modal";
import { StatCard } from "../components/ui/StatCard";
import { SearchInput } from "../components/ui/SearchInput";
import { CustomSelect } from "../components/ui/Select";

interface RepairsPageProps {
  items?: InventoryItem[];
  onRefreshInventory?: () => Promise<void>;
}

export const RepairsPage: React.FC<RepairsPageProps> = ({ items = [], onRefreshInventory }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tickets, setTickets] = useState<RepairTicketRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Selected ticket for details viewer
  const [inspectTicket, setInspectTicket] = useState<RepairTicketRecord | null>(null);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [device, setDevice] = useState("");
  const [reportedIssue, setReportedIssue] = useState("");
  const [laborCost, setLaborCost] = useState<number>(50);
  const [selectedParts, setSelectedParts] = useState<RepairPartUsed[]>([]);
  const [customPartName, setCustomPartName] = useState("");
  const [customPartCost, setCustomPartCost] = useState<number>(0);

  const fetchTickets = async (showLoader = false) => {
    try {
      if (showLoader) setIsLoading(true);
      const data = await getRepairTickets();
      setTickets(data);
      const custs = await getCustomers();
      setCustomers(custs);
    } catch (err) {
      console.error("Failed to load repairs:", err);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(true);
  }, []);

  const handleSelectCustomer = (val: string) => {
    setSelectedCustomerId(val);
    const found = customers.find((c) => String(c.id) === val);
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone);
    }
  };

  const handleAddHardwarePart = (inventoryIdStr: string) => {
    if (!inventoryIdStr) return;
    const item = items.find((i) => String(i.id) === inventoryIdStr);
    if (item) {
      setSelectedParts((prev) => [
        ...prev,
        {
          name: item.name,
          cost: item.price,
          isHardware: true,
          inventoryId: item.id,
        },
      ]);
    }
  };

  const handleAddCustomPart = () => {
    if (!customPartName.trim()) return;
    setSelectedParts((prev) => [
      ...prev,
      {
        name: customPartName.trim(),
        cost: Number(customPartCost) || 0,
        isHardware: false,
      },
    ]);
    setCustomPartName("");
    setCustomPartCost(0);
  };

  const handleRemovePart = (idx: number) => {
    setSelectedParts((prev) => prev.filter((_, i) => i !== idx));
  };

  const partsTotalCost = selectedParts.reduce((acc, p) => acc + (p.cost || 0), 0);
  const totalRepairCost = partsTotalCost + (Number(laborCost) || 0);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !device.trim()) return;

    await addRepairTicket({
      customerId: selectedCustomerId ? Number(selectedCustomerId) : undefined,
      customerName,
      customerPhone,
      device,
      reportedIssue,
      partsUsed: selectedParts,
      laborCost,
      estimatedCost: totalRepairCost,
    });

    await fetchTickets();
    if (onRefreshInventory) await onRefreshInventory();
    setIsModalOpen(false);
    // Reset
    setCustomerName("");
    setCustomerPhone("");
    setDevice("");
    setReportedIssue("");
    setLaborCost(50);
    setSelectedParts([]);
  };

  const handleStatusChange = async (id: number, status: RepairStatus) => {
    await updateRepairStatus(id, status);
    await fetchTickets();
    if (onRefreshInventory) await onRefreshInventory();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Delete this repair ticket?")) {
      await deleteRepairTicket(id);
      await fetchTickets();
      if (onRefreshInventory) await onRefreshInventory();
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ticketNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: RepairStatus) => {
    switch (status) {
      case "RECEIVED":
        return "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400";
      case "IN_PROGRESS":
        return "bg-warning-50 text-warning-600 border-warning-200 dark:bg-warning-500/15 dark:text-warning-400";
      case "WAITING_PARTS":
        return "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400";
      case "READY":
        return "bg-success-50 text-success-600 border-success-200 dark:bg-success-500/15 dark:text-success-400";
      case "DELIVERED":
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Wrench className="size-6 text-brand-500" />
            Repairs & RMA Service
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Intake customer hardware diagnostics, track parts & components used, and manage technician labor fees
          </p>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="tail-btn-primary">
          <Plus className="size-4" />
          <span>New Repair Ticket</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Active Bench Jobs"
          value={tickets.filter((t) => t.status !== "DELIVERED").length}
          valueColor="brand"
          icon={<Clock className="size-5" />}
        />
        <StatCard
          title="Waiting for Parts"
          value={tickets.filter((t) => t.status === "WAITING_PARTS").length}
          valueColor="warning"
          icon={<AlertTriangle className="size-5" />}
        />
        <StatCard
          title="Ready for Customer Pickup"
          value={tickets.filter((t) => t.status === "READY").length}
          valueColor="success"
          icon={<CheckCircle2 className="size-5" />}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="tail-card p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search ticket #, customer name, device model..."
            className="flex-1 max-w-md"
          />

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {["ALL", "RECEIVED", "IN_PROGRESS", "WAITING_PARTS", "READY", "DELIVERED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-2.5 py-1.5 font-medium transition-colors shrink-0 ${
                  statusFilter === st
                    ? "bg-brand-500 text-white font-semibold shadow-theme-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="tail-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm whitespace-nowrap">
            <thead className="border-b border-gray-200 bg-gray-50/60 text-xs font-semibold uppercase text-gray-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-400">
              <tr>
                <th className="py-3.5 px-5">Ticket #</th>
                <th className="py-3.5 px-5">Customer</th>
                <th className="py-3.5 px-5">Device Details</th>
                <th className="py-3.5 px-5">Issue Description</th>
                <th className="py-3.5 px-5">Parts & Labor Used</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Total Cost</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 text-xs">
                    Loading repair tickets...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 text-xs">
                    No repair tickets found. Click "New Repair Ticket" above to record one.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  let parsedParts: RepairPartUsed[] = [];
                  try {
                    parsedParts = JSON.parse(ticket.partsUsed || "[]");
                  } catch {}

                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 px-5 font-mono text-xs font-bold text-brand-500">
                        {ticket.ticketNo}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5 max-w-[140px] truncate block"
                          title={ticket.customerName}
                        >
                          <User className="size-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{ticket.customerName}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5 max-w-[150px] truncate block"
                          title={ticket.device}
                        >
                          <Smartphone className="size-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{ticket.device}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-600 dark:text-gray-300">
                        <span
                          className="max-w-[180px] truncate block"
                          title={ticket.reportedIssue}
                        >
                          {ticket.reportedIssue}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <button
                          type="button"
                          onClick={() => setInspectTicket(ticket)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-500 hover:text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          <Package className="size-3.5 shrink-0" />
                          {parsedParts.length} Parts (PKR {Number(ticket.finalCost || ticket.estimatedCost || 0).toFixed(2)})
                        </button>
                      </td>
                      <td className="py-3.5 px-5">
                        <select
                          value={ticket.status}
                          onChange={(e) =>
                            handleStatusChange(ticket.id, e.target.value as RepairStatus)
                          }
                          className={`rounded-lg border px-2 py-1 text-xs font-bold ${getStatusBadge(
                            ticket.status
                          )}`}
                        >
                          <option value="RECEIVED">RECEIVED</option>
                          <option value="IN_PROGRESS">IN PROGRESS</option>
                          <option value="WAITING_PARTS">WAITING PARTS</option>
                          <option value="READY">READY</option>
                          <option value="DELIVERED">DELIVERED</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-5 font-bold text-gray-900 dark:text-white">
                        PKR {(ticket.finalCost || ticket.estimatedCost).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setInspectTicket(ticket)}
                            className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/15 dark:hover:text-brand-400 transition-colors"
                            title="View Full Details"
                          >
                            <Eye className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(ticket.id)}
                            className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/15 dark:hover:text-error-400 transition-colors"
                            title="Delete Ticket"
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

      {/* New Repair Ticket Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Intake Repair / Service Ticket"
        subtitle="Log customer device symptoms, select replacement components, and set labor fees"
        icon={<Wrench className="size-5 text-brand-500" />}
        maxWidth="xl"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <CustomSelect
            label="Customer Account (Optional)"
            value={selectedCustomerId}
            onChange={handleSelectCustomer}
            placeholder="Select registered customer or enter below..."
            searchable
            options={customers.map((c) => ({
              value: String(c.id),
              label: c.name,
              sublabel: c.phone,
            }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="tail-input"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                placeholder="+1 (555) 000-0000"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="tail-input font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Device Model / Hardware Spec *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Custom PC (Ryzen 7 5800X / RTX 3070)"
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              className="tail-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Reported Issue / Symptoms *
            </label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Overheating and blue screening under load..."
              value={reportedIssue}
              onChange={(e) => setReportedIssue(e.target.value)}
              className="tail-input resize-none"
            />
          </div>

          {/* Parts Used Section */}
          <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-800/40 space-y-3">
            <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              <Layers className="size-3.5 text-brand-500" />
              Components & Services Used
            </h4>

            <div className="space-y-2">
              <CustomSelect
                label="Add Hardware Component from Inventory"
                value=""
                onChange={handleAddHardwarePart}
                placeholder="Pick replacement inventory part (SSD, RAM, GPU, Cooler)..."
                searchable
                options={items.map((it) => ({
                  value: String(it.id),
                  label: it.name,
                  sublabel: `PKR ${it.price.toFixed(2)} (${it.quantity} in stock)`,
                  badge: it.title,
                }))}
              />

              {/* Custom Software / Labor Item */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Or custom service: e.g. OS Reinstall / Thermal Paste"
                  value={customPartName}
                  onChange={(e) => setCustomPartName(e.target.value)}
                  className="tail-input flex-1 text-xs"
                />
                <input
                  type="number"
                  placeholder="Cost (PKR)"
                  value={customPartCost || ""}
                  onChange={(e) => setCustomPartCost(parseFloat(e.target.value) || 0)}
                  className="tail-input w-28 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddCustomPart}
                  className="tail-btn-secondary text-xs"
                >
                  Add
                </button>
              </div>

              {/* Selected Parts List */}
              {selectedParts.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-gray-200 dark:border-gray-700 max-h-36 overflow-y-auto">
                  {selectedParts.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-xs"
                    >
                      <span className="font-medium text-gray-800 dark:text-gray-200 truncate pr-2">
                        {p.name}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-gray-900 dark:text-white">PKR {p.cost.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePart(idx)}
                          className="text-gray-400 hover:text-error-500"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">
                  Technician Labor / Diagnostic Fee (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={laborCost}
                  onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)}
                  className="tail-input text-xs"
                />
              </div>

              <div className="flex flex-col justify-end text-right">
                <span className="text-[10px] text-gray-400">Total Calculated Cost</span>
                <span className="text-base font-bold text-success-600 dark:text-success-400">
                  PKR {totalRepairCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="tail-btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="tail-btn-primary">
              Create Repair Ticket
            </button>
          </div>
        </form>
      </Modal>

      {/* Ticket Inspector Modal */}
      <Modal
        isOpen={Boolean(inspectTicket)}
        onClose={() => setInspectTicket(null)}
        title={`Repair Job: ${inspectTicket?.ticketNo}`}
        subtitle={`${inspectTicket?.device} • Customer: ${inspectTicket?.customerName}`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <span className="font-bold text-gray-400 uppercase text-[10px]">Reported Symptoms</span>
            <p className="mt-1 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">
              {inspectTicket?.reportedIssue}
            </p>
          </div>

          <div>
            <span className="font-bold text-gray-400 uppercase text-[10px]">Parts & Hardware Installed</span>
            <div className="mt-1 space-y-1">
              {(() => {
                let parts: RepairPartUsed[] = [];
                try {
                  parts = JSON.parse(inspectTicket?.partsUsed || "[]");
                } catch {}

                if (parts.length === 0) {
                  return <p className="text-gray-400 py-1">No physical parts logged.</p>;
                }

                return parts.map((p, i) => (
                  <div key={i} className="flex justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/40">
                    <span>{p.name}</span>
                    <span className="font-bold">PKR {p.cost.toFixed(2)}</span>
                  </div>
                ));
              })()}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1">
            <div className="flex justify-between text-gray-500">
              <span>Labor Fee</span>
              <span>PKR {(inspectTicket?.laborCost || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-gray-900 dark:text-white pt-1">
              <span>Total Repair Amount</span>
              <span className="text-brand-500">PKR {(inspectTicket?.finalCost || inspectTicket?.estimatedCost || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
