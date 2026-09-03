import React, { useState } from "react";
import { Boxes, Plus } from "lucide-react";
import { InventoryItem, InventorySerial } from "../db/schema";
import { updateItemQuantity, deleteInventoryItem, getItemSerials } from "../db/inventoryService";
import { PageHeader } from "../components/ui/PageHeader";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { InventoryStats } from "../components/inventory/InventoryStats";
import { InventoryTable } from "../components/inventory/InventoryTable";
import { AddProductModal } from "../components/inventory/AddProductModal";
import { SerialViewerModal } from "../components/inventory/SerialViewerModal";
import { ProductInspectModal } from "../components/inventory/ProductInspectModal";

interface InventoryPageProps {
  items: InventoryItem[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ items, isLoading, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTitleFilter, setSelectedTitleFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inspectItem, setInspectItem] = useState<InventoryItem | null>(null);
  const [activeSerialItem, setActiveSerialItem] = useState<InventoryItem | null>(null);
  const [activeSerials, setActiveSerials] = useState<InventorySerial[]>([]);
  const [loadingSerials, setLoadingSerials] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAdjustQuantity = async (id: number, currentQty: number, delta: number) => {
    await updateItemQuantity(id, Math.max(0, currentQty + delta));
    await onRefresh();
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId === null) return;
    setIsDeleting(true);
    try {
      await deleteInventoryItem(deleteTargetId);
      await onRefresh();
      setDeleteTargetId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewSerials = async (item: InventoryItem) => {
    setActiveSerialItem(item);
    setLoadingSerials(true);
    try {
      const serials = await getItemSerials(item.id);
      setActiveSerials(serials);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSerials(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory & Stock Management" subtitle="Manage catalogs, stock units, margins, and serials" icon={Boxes}>
        <button onClick={() => setIsModalOpen(true)} className="tail-btn-primary text-xs"><Plus className="size-4" /><span>Add Product</span></button>
      </PageHeader>
      <InventoryStats items={items} />
      <InventoryTable
        items={items} searchQuery={searchQuery} onSearchChange={setSearchQuery}
        selectedTitleFilter={selectedTitleFilter} onTitleFilterChange={setSelectedTitleFilter}
        isLoading={isLoading} onAdjustQuantity={handleAdjustQuantity} onViewSerials={handleViewSerials}
        onInspectItem={setInspectItem} onDeleteItem={async (id) => setDeleteTargetId(id)}
      />
      <AddProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={onRefresh} />
      <SerialViewerModal item={activeSerialItem} serials={activeSerials} loading={loadingSerials} onClose={() => setActiveSerialItem(null)} />
      <ProductInspectModal item={inspectItem} onClose={() => setInspectItem(null)} />
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Inventory Product"
        message="Are you sure you want to delete this hardware product? Any associated serial records will also be removed."
        confirmText="Delete Product"
        isLoading={isDeleting}
      />
    </div>
  );
};
