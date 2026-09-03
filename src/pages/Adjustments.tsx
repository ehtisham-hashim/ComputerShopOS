import React, { useState, useEffect } from "react";
import { ArrowLeftRight, Plus } from "lucide-react";
import { InventoryItem, AdjustmentRecord, Customer } from "../db/schema";
import { getAdjustments, deleteAdjustment } from "../db/adjustmentsService";
import { getCustomers } from "../db/customerService";
import { PageHeader } from "../components/ui/PageHeader";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { AdjustmentStats } from "../components/adjustments/AdjustmentStats";
import { AdjustmentTable } from "../components/adjustments/AdjustmentTable";
import { CreateAdjustmentModal } from "../components/adjustments/CreateAdjustmentModal";
import { AdjustmentInspectModal } from "../components/adjustments/AdjustmentInspectModal";

interface AdjustmentsPageProps {
  items: InventoryItem[];
  onRefreshInventory?: () => Promise<void>;
}

export const AdjustmentsPage: React.FC<AdjustmentsPageProps> = ({ items, onRefreshInventory }) => {
  const [adjustments, setAdjustments] = useState<AdjustmentRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inspectAdjustment, setInspectAdjustment] = useState<AdjustmentRecord | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAdjustments = async (showLoader = false) => {
    try {
      if (showLoader) setIsLoading(true);
      const data = await getAdjustments();
      setAdjustments(data);
      const custs = await getCustomers();
      setCustomers(custs);
    } catch (err) {
      console.error("Failed to load adjustments:", err);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => { fetchAdjustments(true); }, []);

  const handleConfirmDelete = async () => {
    if (deleteTargetId === null) return;
    setIsDeleting(true);
    try {
      await deleteAdjustment(deleteTargetId);
      await fetchAdjustments();
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
      <PageHeader title="PC Swap & Trade-In Adjustments" subtitle="Manage customer PC trade-ins, upgrade swaps, and financial difference calculations" icon={ArrowLeftRight}>
        <button onClick={() => setIsModalOpen(true)} className="tail-btn-primary text-xs"><Plus className="size-4" /><span>New Swap / Trade-In</span></button>
      </PageHeader>
      <AdjustmentStats adjustments={adjustments} />
      <AdjustmentTable
        adjustments={adjustments} searchQuery={searchQuery} onSearchChange={setSearchQuery}
        isLoading={isLoading} onInspectAdjustment={setInspectAdjustment} onDeleteAdjustment={async (id) => setDeleteTargetId(id)}
      />
      <CreateAdjustmentModal
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} items={items} customers={customers}
        onSuccess={async () => { await fetchAdjustments(); if (onRefreshInventory) await onRefreshInventory(); }}
      />
      <AdjustmentInspectModal adjustment={inspectAdjustment} onClose={() => setInspectAdjustment(null)} />
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Swap Adjustment"
        message="Are you sure you want to delete this swap record? Any inventory items provided will be returned to stock."
        confirmText="Delete Swap"
        isLoading={isDeleting}
      />
    </div>
  );
};
