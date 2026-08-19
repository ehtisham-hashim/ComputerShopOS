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
} from "lucide-react";
import { RepairTicketRecord, RepairStatus } from "../db/schema";
import {
  getRepairTickets,
  addRepairTicket,
  updateRepairStatus,
  deleteRepairTicket,
} from "../db/repairsService";
import { Modal } from "../components/ui/Modal";
import { StatCard } from "../components/ui/StatCard";
import { SearchInput } from "../components/ui/SearchInput";

export const RepairsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tickets, setTickets] = useState<RepairTicketRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const data = await getRepairTickets();
      setTickets(data);
    } catch (err) {
      console.error("Failed to load repairs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const [newTicket, setNewTicket] = useState({
    customerName: "",
    customerPhone: "",
    device: "",
    reportedIssue: "",
    estimatedCost: 50,
  });

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ticketNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.customerName.trim() || !newTicket.device.trim()) return;

    await addRepairTicket(newTicket);
    await fetchTickets();
    setIsModalOpen(false);
    setNewTicket({
      customerName: "",
      customerPhone: "",
      device: "",
      reportedIssue: "",
      estimatedCost: 50,
    });
  };

  const handleStatusChange = async (id: number, status: RepairStatus) => {
    await updateRepairStatus(id, status);
    await fetchTickets();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Delete this repair ticket?")) {
      await deleteRepairTicket(id);
      await fetchTickets();
    }
  };

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
            Intake customer hardware diagnostics, track status pipeline, and manage fees
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
          title="Ready for Pickup"
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
                    ? "bg-brand-500 text-white font-semibold"
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
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50/60 text-xs font-semibold uppercase text-gray-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-400">
              <tr>
                <th className="py-3.5 px-4">Ticket #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Device Details</th>
                <th className="py-3.5 px-4">Issue Description</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Est. Cost</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                    Loading repair tickets...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                    No repair tickets found. Click "New Repair Ticket" above to record one.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-brand-500">
                      {ticket.ticketNo}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                          <User className="size-3 text-gray-400" />
                          {ticket.customerName}
                        </span>
                        <span className="font-mono text-[11px] text-gray-400">
                          {ticket.customerPhone}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                        <Smartphone className="size-3.5 text-gray-400" />
                        {ticket.device}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600 dark:text-gray-300 max-w-xs truncate">
                      {ticket.reportedIssue}
                    </td>
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                      ${ticket.estimatedCost.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(ticket.id)}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/15 dark:hover:text-error-400 transition-colors"
                        title="Delete Ticket"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Repair Ticket Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Intake Repair Ticket"
        icon={<Wrench className="size-5 text-brand-500" />}
      >
        <form onSubmit={handleCreateTicket} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={newTicket.customerName}
                onChange={(e) =>
                  setNewTicket({ ...newTicket, customerName: e.target.value })
                }
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
                value={newTicket.customerPhone}
                onChange={(e) =>
                  setNewTicket({ ...newTicket, customerPhone: e.target.value })
                }
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
              placeholder="e.g. Dell XPS 15 (i9 / RTX 3050Ti)"
              value={newTicket.device}
              onChange={(e) =>
                setNewTicket({ ...newTicket, device: e.target.value })
              }
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
              placeholder="e.g. Overheating and shutting down during rendering..."
              value={newTicket.reportedIssue}
              onChange={(e) =>
                setNewTicket({ ...newTicket, reportedIssue: e.target.value })
              }
              className="tail-input resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Estimated Diagnostic / Repair Fee ($ USD)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={newTicket.estimatedCost}
              onChange={(e) =>
                setNewTicket({
                  ...newTicket,
                  estimatedCost: parseFloat(e.target.value) || 0,
                })
              }
              className="tail-input"
            />
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
              Create RMA Ticket
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
