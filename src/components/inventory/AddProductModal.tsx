import React, { useState } from "react";
import { PackagePlus } from "lucide-react";
import { ItemTitles, ItemTitle } from "../../db/schema";
import { addInventoryItem } from "../../db/inventoryService";
import { Modal } from "../ui/Modal";
import { CustomSelect } from "../ui/Select";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<{
    title: ItemTitle;
    name: string;
    sku: string;
    quantity: number;
    price: number;
    costPrice: number;
    isSerialized: boolean;
    serialNumbersText: string;
  }>({
    title: "LAPTOP",
    name: "",
    sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
    quantity: 1,
    price: 0,
    costPrice: 0,
    isSerialized: false,
    serialNumbersText: "",
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.name.trim() || !formData.sku.trim()) {
      setFormError("Product name and SKU are required.");
      return;
    }
    const serials = formData.isSerialized
      ? formData.serialNumbersText.split("\n").map((s) => s.trim()).filter(Boolean)
      : [];
    if (formData.isSerialized && serials.length > 0 && serials.length !== Number(formData.quantity)) {
      setFormError(`Provided ${serials.length} serials but quantity is ${formData.quantity}.`);
      return;
    }
    setIsSubmitting(true);
    try {
      await addInventoryItem(
        {
          title: formData.title,
          name: formData.name.trim(),
          sku: formData.sku.trim().toUpperCase(),
          quantity: Math.round(Number(formData.quantity)) || 0,
          price: Math.round(Number(formData.price)) || 0,
          costPrice: Math.round(Number(formData.costPrice)) || 0,
          isSerialized: formData.isSerialized ? 1 : 0,
        },
        serials
      );
      await onSuccess();
      onClose();
    } catch (err: any) {
      setFormError(err.message || "Failed to add inventory item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Hardware Product" description="Register product into SQLite inventory catalog" icon={<PackagePlus className="size-5 text-brand-500" />} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && <div className="rounded-xl border border-error-200 bg-error-50 p-3 text-xs font-semibold text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">{formError}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CustomSelect label="Hardware Category" value={formData.title} onChange={(val) => setFormData((p) => ({ ...p, title: val as ItemTitle }))} options={ItemTitles.map((t) => ({ value: t, label: t }))} />
          <div><label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">SKU Code *</label><input type="text" required value={formData.sku} onChange={(e) => setFormData((p) => ({ ...p, sku: e.target.value }))} className="tail-input font-mono" /></div>
        </div>
        <div><label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Product Name *</label><input type="text" required value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. ASUS ROG Strix RTX 4080 16GB" className="tail-input" /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Initial Quantity</label><input type="number" min="0" value={formData.quantity} onChange={(e) => setFormData((p) => ({ ...p, quantity: parseInt(e.target.value, 10) || 0 }))} className="tail-input" /></div>
          <div><label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Cost Price (PKR)</label><input type="number" value={formData.costPrice || ""} onChange={(e) => setFormData((p) => ({ ...p, costPrice: parseInt(e.target.value, 10) || 0 }))} className="tail-input" /></div>
          <div><label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Selling Price (PKR)</label><input type="number" value={formData.price || ""} onChange={(e) => setFormData((p) => ({ ...p, price: parseInt(e.target.value, 10) || 0 }))} className="tail-input" /></div>
        </div>
        <div className="flex items-center gap-2 pt-1"><input type="checkbox" id="isSerialized" checked={formData.isSerialized} onChange={(e) => setFormData((p) => ({ ...p, isSerialized: e.target.checked }))} className="size-4 rounded text-brand-600 focus:ring-brand-500" /><label htmlFor="isSerialized" className="text-xs font-bold text-gray-700 dark:text-gray-300">Track Serial Numbers (Individual Barcodes / SNs)</label></div>
        {formData.isSerialized && (
          <div><label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Serial Numbers (One per line)</label><textarea rows={3} value={formData.serialNumbersText} onChange={(e) => setFormData((p) => ({ ...p, serialNumbersText: e.target.value }))} placeholder="SN-1029302&#10;SN-1029303" className="tail-input font-mono text-xs" /></div>
        )}
        <div className="flex justify-end gap-2.5 pt-2"><button type="button" onClick={onClose} className="tail-btn-secondary">Cancel</button><button type="submit" disabled={isSubmitting} className="tail-btn-primary">{isSubmitting ? "Adding..." : "Add Product"}</button></div>
      </form>
    </Modal>
  );
};
