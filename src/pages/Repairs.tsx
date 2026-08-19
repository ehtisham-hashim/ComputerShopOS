import React, { useState, useEffect } from "react";
import { Wrench, Plus } from "lucide-react";
import { RepairTicketRecord, RepairStatus, InventoryItem, Customer } from "../db/schema";
import { getRepairTickets, updateRepairStatus, deleteRepairTicket } from "../db/repairsService";
import { getCustomers } from "../db/customerService";
import { PageHeader } from "../components/ui/PageHeader";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { RepairStats } from "../components/repairs/RepairStats";
import { RepairTable } from "../components/repairs/RepairTable";
import { AddRepairModal } from "../components/repairs/AddRepairModal";
import { RepairInspectModal } from "../components/repairs/RepairInspectModal";

interface RepairsPageProps {
  items?: InventoryItem[];
  onRefreshInventory?: () => Promise<void>;
}

export const RepairsPage: React.FC<RepairsPageProps> = ({ items = [], onRefreshInventory }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tickets, setTickets] = useState<RepairTicketRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inspectTicket, setInspectTicket] = useState<RepairTicketRecord | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTickets = async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const [data, custs] = await Promise.all([getRepairTickets(), getCustomers()]);
      setTickets(data);
      setCustomers(custs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTickets(true); }, []);

  const handleStatusChange = async (id: number, status: RepairStatus) => {
    await updateRepairStatus(id, status);
    await fetchTickets();
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId === null) return;
    setIsDeleting(true);
    try {
      await deleteRepairTicket(deleteTargetId);
      await fetchTickets();
      if (onRefreshInventory) await onRefreshInventory();
      setDeleteTargetId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Repairs & RMA Service" subtitle="Manage hardware service jobs and RMA invoices" icon={Wrench}>
        <button onClick={() => setIsModalOpen(true)} className="tail-btn-primary text-xs"><Plus className="size-4" /><span>New Repair Ticket</span></button>
      </PageHeader>
      <RepairStats tickets={tickets} />
      <RepairTable
        tickets={tickets} searchQuery={searchQuery} onSearchChange={setSearchQuery}
        statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} isLoading={isLoading}
        onStatusChange={handleStatusChange} onInspectTicket={setInspectTicket} onDeleteTicket={async (id) => setDeleteTargetId(id)}
      />
      <AddRepairModal
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} items={items} customers={customers}
        onSuccess={async () => { await fetchTickets(); if (onRefreshInventory) await onRefreshInventory(); }}
      />
      <RepairInspectModal ticket={inspectTicket} onClose={() => setInspectTicket(null)} />
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Repair Ticket"
        message="Are you sure you want to delete this repair record? Any hardware parts consumed will be returned to stock."
        confirmText="Delete Ticket"
        isLoading={isDeleting}
      />
    </div>
  );
};
