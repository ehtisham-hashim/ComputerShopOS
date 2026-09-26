import React, { useState, useMemo, useEffect } from "react";
import { PackagePlus } from "lucide-react";
import { ItemTitles, ItemTitle, CategoryRecord } from "../../db/schema";
import { addInventoryItem } from "../../db/inventoryService";
import { Modal } from "../ui/Modal";
import { CustomSelect } from "../ui/Select";

interface AddProductModalProps {
  isOpen: boolean;
  categories?: CategoryRecord[];
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, categories = [], onClose, onSuccess }) => {
  const categoryOptions = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.map((c) => c.name);
    }
    return ItemTitles as string[];
  }, [categories]);

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
    title: categoryOptions[0] || "LAPTOP",
    name: "",
    sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
    quantity: 1,
    price: 0,
    costPrice: 0,
    isSerialized: false,
    serialNumbersText: "",
  });

  useEffect(() => {
    if (categoryOptions.length > 0 && !categoryOptions.includes(formData.title)) {
      setFormData((p) => ({ ...p, title: categoryOptions[0] }));
    }
  }, [categoryOptions]);

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

  const marginAmount = (formData.price || 0) - (formData.costPrice || 0);
  const marginPercent =
    formData.price > 0 ? Math.round((marginAmount / formData.price) * 100) : 0;

  const serialCount = formData.serialNumbersText
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Hardware Product"
      description="Register new hardware unit into SQLite inventory catalog"
      icon={<PackagePlus className="size-5 text-brand-500" />}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {formError && (
          <div className="rounded-xl border border-error-200 bg-error-50 p-3 text-xs font-semibold text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {formError}
          </div>
        )}

        {/* Section 1: Classification & SKU */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <CustomSelect
            label="Hardware Category"
            value={formData.title}
            onChange={(val) => setFormData((p) => ({ ...p, title: val as ItemTitle }))}
            options={categoryOptions.map((t) => ({ value: t, label: t }))}
          />
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              SKU Code *
            </label>
            <input
              type="text"
              required
              value={formData.sku}
              onChange={(e) => setFormData((p) => ({ ...p, sku: e.target.value }))}
              className="tail-input font-mono uppercase"
            />
          </div>
        </div>

        {/* Section 2: Product Name */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Product Full Title *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Dell Latitude 7490 Core i7-8650U 16GB 512GB SSD"
            className="tail-input"
          />
        </div>

        {/* Section 3: Pricing & Stock Group */}
        <div className="p-3.5 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Pricing & Initial Stock
            </span>
            {formData.price > 0 && formData.costPrice > 0 && (
              <span
                className={`tabular-nums font-bold text-[11px] px-2 py-0.5 rounded-md ${
                  marginAmount >= 0
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                }`}
              >
                Profit: PKR {marginAmount.toLocaleString()} ({marginPercent}%)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, quantity: parseInt(e.target.value, 10) || 0 }))
                }
                className="tail-input tabular-nums font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                Cost Price (PKR)
              </label>
              <input
                type="number"
                value={formData.costPrice || ""}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, costPrice: parseInt(e.target.value, 10) || 0 }))
                }
                placeholder="0"
                className="tail-input tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                Selling Price (PKR) *
              </label>
              <input
                type="number"
                value={formData.price || ""}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, price: parseInt(e.target.value, 10) || 0 }))
                }
                placeholder="0"
                className="tail-input tabular-nums font-bold"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Serial Numbers Tracking */}
        <div className="p-3 rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/60 space-y-2">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              id="isSerialized"
              checked={formData.isSerialized}
              onChange={(e) => setFormData((p) => ({ ...p, isSerialized: e.target.checked }))}
              className="size-4 rounded text-brand-500 focus:ring-brand-500 border-gray-300 dark:border-gray-700 dark:bg-gray-800"
            />
            <span className="font-bold text-gray-900 dark:text-white text-xs">
              Track Serial Numbers (Individual Hardware Barcodes / SNs)
            </span>
          </label>

          {formData.isSerialized && (
            <div className="pt-1.5 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">Enter one serial number per line:</span>
                <span
                  className={`font-mono font-bold ${
                    serialCount === Number(formData.quantity)
                      ? "text-emerald-500"
                      : "text-amber-500"
                  }`}
                >
                  {serialCount} of {formData.quantity} serials entered
                </span>
              </div>
              <textarea
                rows={3}
                value={formData.serialNumbersText}
                onChange={(e) => setFormData((p) => ({ ...p, serialNumbersText: e.target.value }))}
                placeholder="SN-1029302&#10;SN-1029303"
                className="tail-input font-mono text-xs"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end items-center gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
          <button type="button" onClick={onClose} className="tail-btn-secondary-sm">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="tail-btn-primary-sm"
          >
            {isSubmitting ? "Adding..." : "Add Product"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
