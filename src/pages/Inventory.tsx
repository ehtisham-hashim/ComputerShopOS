import React, { useState, useMemo } from "react";
import {
  Plus,
  Filter,
  Trash2,
  PackagePlus,
  RefreshCw,
  AlertCircle,
  Package,
  Layers,
  DollarSign,
  Tag,
  Barcode,
  Eye,
} from "lucide-react";
import { ItemTitles, ItemTitle, InventoryItem, InventorySerial } from "../db/schema";
import {
  addInventoryItem,
  updateItemQuantity,
  deleteInventoryItem,
  getItemSerials,
} from "../db/inventoryService";
import { Modal } from "../components/ui/Modal";
import { StatCard } from "../components/ui/StatCard";
import { SearchInput } from "../components/ui/SearchInput";
import { CustomSelect } from "../components/ui/Select";

interface InventoryPageProps {
  items: InventoryItem[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
  items,
  isLoading,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTitleFilter, setSelectedTitleFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inspectItem, setInspectItem] = useState<InventoryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Serial viewer state
  const [activeSerialItem, setActiveSerialItem] = useState<InventoryItem | null>(null);
  const [activeSerials, setActiveSerials] = useState<InventorySerial[]>([]);
  const [loadingSerials, setLoadingSerials] = useState(false);

  // Form state
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
    sku: "",
    quantity: 1,
    price: 0,
    costPrice: 0,
    isSerialized: false,
    serialNumbersText: "",
  });

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTitle =
        selectedTitleFilter === "ALL" || item.title === selectedTitleFilter;
      return matchesSearch && matchesTitle;
    });
  }, [items, searchQuery, selectedTitleFilter]);

  const { totalValuation, totalQuantity } = useMemo(() => {
    let val = 0;
    let qty = 0;
    for (const i of items) {
      qty += i.quantity;
      val += i.price * i.quantity;
    }
    return { totalValuation: val, totalQuantity: qty };
  }, [items]);

  const handleOpenModal = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setFormData({
      title: "LAPTOP",
      name: "",
      sku: `SKU-${randomSuffix}`,
      quantity: 1,
      price: 0,
      costPrice: 0,
      isSerialized: false,
      serialNumbersText: "",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleViewSerials = async (item: InventoryItem) => {
    setActiveSerialItem(item);
    setLoadingSerials(true);
    try {
      const serials = await getItemSerials(item.id);
      setActiveSerials(serials);
    } catch (err) {
      console.error("Failed to load serials:", err);
    } finally {
      setLoadingSerials(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return setFormError("Item name is required.");
    if (!formData.sku.trim()) return setFormError("SKU is required.");

    try {
      setIsSubmitting(true);
      setFormError(null);

      const parsedSerials = formData.serialNumbersText
        ? formData.serialNumbersText.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      await addInventoryItem(
        {
          title: formData.title,
          name: formData.name.trim(),
          sku: formData.sku.trim().toUpperCase(),
          quantity: Number(formData.quantity) || 0,
          price: Number(formData.price) || 0,
          costPrice: Number(formData.costPrice) || 0,
          isSerialized: formData.isSerialized ? 1 : 0,
        },
        parsedSerials
      );

      await onRefresh();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || "Failed to add item. Check SKU uniqueness.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustQuantity = async (id: number, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 0) return;
    await updateItemQuantity(id, newQty);
    await onRefresh();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this inventory record?")) {
      await deleteInventoryItem(id);
      await onRefresh();
    }
  };

  const getCategoryBadgeClass = (title: string) => {
    switch (title) {
      case "GPU":
        return "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/20";
      case "CPU":
        return "bg-pink-50 text-pink-600 border-pink-200 dark:bg-pink-500/15 dark:text-pink-400 dark:border-pink-500/20";
      case "RAM":
      case "STORAGE":
        return "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20";
      case "LAPTOP":
      case "DESKTOP":
        return "bg-brand-50 text-brand-600 border-brand-200 dark:bg-brand-500/15 dark:text-brand-400 dark:border-brand-500/20";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Inventory & Stock
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage hardware components, serialized units, and store catalog
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="tail-btn-secondary"
            title="Refresh database records"
          >
            <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button onClick={handleOpenModal} className="tail-btn-primary">
            <Plus className="size-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Hardware SKUs"
          value={items.length}
          icon={<Package className="size-5" />}
        />
        <StatCard
          title="Units on Shelf"
          value={totalQuantity}
          valueColor="brand"
          icon={<Layers className="size-5" />}
        />
        <StatCard
          title="Total Stock Valuation"
          value={`$${totalValuation.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          valueColor="success"
          icon={<DollarSign className="size-5" />}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="tail-card p-4 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search product name, SKU, or barcode..."
            className="flex-1 max-w-md"
          />

          <div className="flex items-center gap-2">
            <Filter className="size-4 text-gray-400" />
            <select
              value={selectedTitleFilter}
              onChange={(e) => setSelectedTitleFilter(e.target.value)}
              className="tail-select sm:w-48 text-xs font-medium"
            >
              <option value="ALL">All Categories ({ItemTitles.length})</option>
              {ItemTitles.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedTitleFilter("ALL")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-colors shrink-0 ${
              selectedTitleFilter === "ALL"
                ? "bg-brand-500 text-white shadow-theme-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            All Items ({items.length})
          </button>
          {ItemTitles.slice(0, 7).map((title) => {
            const count = items.filter((i) => i.title === title).length;
            const isSelected = selectedTitleFilter === title;
            return (
              <button
                key={title}
                onClick={() => setSelectedTitleFilter(title)}
                className={`rounded-lg px-3 py-1.5 font-medium transition-colors shrink-0 ${
                  isSelected
                    ? "bg-brand-500 text-white shadow-theme-xs font-semibold"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {title} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Inventory Table Card */}
      <div className="tail-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm whitespace-nowrap">
            <thead className="border-b border-gray-200 bg-gray-50/60 text-xs font-semibold uppercase text-gray-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-400">
              <tr>
                <th className="py-3.5 px-5">Category</th>
                <th className="py-3.5 px-5">Product Name</th>
                <th className="py-3.5 px-5">SKU / Code</th>
                <th className="py-3.5 px-5">Unit Price</th>
                <th className="py-3.5 px-5 text-center">Stock Units</th>
                <th className="py-3.5 px-5">Total Value</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 dark:text-gray-400">
                    <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-brand-500" />
                    <span>Loading products from SQLite database...</span>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 dark:text-gray-400">
                    <Package className="size-8 mx-auto mb-2 text-gray-400 opacity-60" />
                    <p className="font-semibold text-gray-700 dark:text-gray-300">No inventory products found</p>
                    <span className="text-xs">Click "Add Product" above to record new inventory.</span>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${getCategoryBadgeClass(
                          item.title
                        )}`}
                      >
                        <Tag className="size-3" />
                        {item.title}
                      </span>
                    </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-semibold text-gray-900 dark:text-white max-w-[200px] truncate block"
                            title={item.name}
                          >
                            {item.name}
                          </span>
                          {item.isSerialized === 1 && (
                            <button
                              type="button"
                              onClick={() => handleViewSerials(item)}
                              className="rounded bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 hover:bg-brand-500/20 shrink-0"
                              title="View Serial Numbers"
                            >
                              SN
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs text-gray-500 dark:text-gray-400">
                        {item.sku}
                      </td>
                      <td className="py-3.5 px-5 font-medium text-gray-900 dark:text-white">
                        PKR {item.price.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAdjustQuantity(item.id, item.quantity, -1)}
                            disabled={item.quantity <= 0}
                            className="flex size-7 items-center justify-center rounded-lg border border-gray-200 bg-white font-bold text-gray-600 shadow-theme-xs hover:bg-gray-100 disabled:opacity-30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            -
                          </button>
                          <span
                            className={`min-w-8 text-center text-xs font-bold ${
                              item.quantity <= 5
                                ? "text-warning-600 dark:text-warning-400"
                                : "text-gray-900 dark:text-white"
                            }`}
                          >
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAdjustQuantity(item.id, item.quantity, 1)}
                            className="flex size-7 items-center justify-center rounded-lg border border-gray-200 bg-white font-bold text-gray-600 shadow-theme-xs hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-gray-900 dark:text-white">
                        PKR {(item.price * item.quantity).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setInspectItem(item)}
                            className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/15 dark:hover:text-brand-400 transition-colors"
                            title="View Full Details"
                          >
                            <Eye className="size-4" />
                          </button>
                          {item.isSerialized === 1 && (
                            <button
                              type="button"
                              onClick={() => handleViewSerials(item)}
                              className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/15 dark:hover:text-brand-400 transition-colors"
                              title="Manage Serials"
                            >
                              <Barcode className="size-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/15 dark:hover:text-error-400 transition-colors"
                            title="Delete product"
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

      {/* Serial Numbers Modal Dialog */}
      <Modal
        isOpen={Boolean(activeSerialItem)}
        onClose={() => setActiveSerialItem(null)}
        title={`Serial Numbers for ${activeSerialItem?.name}`}
        icon={<Barcode className="size-5 text-brand-500" />}
      >
        <div className="my-2 space-y-2 max-h-60 overflow-y-auto">
          {loadingSerials ? (
            <p className="text-xs text-gray-400 py-4 text-center">Loading serial numbers...</p>
          ) : activeSerials.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">
              No individual serial numbers recorded for this item.
            </p>
          ) : (
            activeSerials.map((sn) => (
              <div
                key={sn.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-800/40"
              >
                <span className="font-mono text-xs font-semibold text-gray-900 dark:text-white">
                  {sn.serialNumber}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    sn.status === "AVAILABLE"
                      ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800"
                  }`}
                >
                  {sn.status}
                </span>
              </div>
            ))
          )}
        </div>

        <button
          onClick={() => setActiveSerialItem(null)}
          className="w-full tail-btn-secondary text-xs mt-3"
        >
          Close
        </button>
      </Modal>

      {/* Add Product Modal Dialog */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Hardware Product"
        subtitle="Record new item in local SQLite inventory database"
        icon={<PackagePlus className="size-5 text-brand-500" />}
        maxWidth="xl"
      >
        {formError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-error-200 bg-error-50 p-3 text-xs font-semibold text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            <AlertCircle className="size-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateItem} className="space-y-4">
          <CustomSelect
            label="Hardware Category"
            value={formData.title}
            onChange={(val: string) =>
              setFormData({ ...formData, title: val as ItemTitle })
            }
            options={ItemTitles.map((t) => ({
              value: t,
              label: t,
            }))}
          />

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Product Name
            </label>
            <input
              type="text"
              placeholder="e.g. NVIDIA GeForce RTX 4080 Super"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="tail-input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                SKU Code
              </label>
              <input
                type="text"
                placeholder="e.g. NV-RTX4080S-16G"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="tail-input font-mono uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: parseInt(e.target.value) || 0,
                  })
                }
                className="tail-input"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Retail Price ($ USD)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
                className="tail-input"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Cost Price ($ USD)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.costPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    costPrice: parseFloat(e.target.value) || 0,
                  })
                }
                className="tail-input"
              />
            </div>
          </div>

          {/* Serialized Checkbox & Input */}
          <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/30 space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isSerialized}
                onChange={(e) =>
                  setFormData({ ...formData, isSerialized: e.target.checked })
                }
                className="size-4 rounded text-brand-500 focus:ring-brand-500/20"
              />
              <span>Track by Unique Serial Numbers (GPU, CPU, Laptop)</span>
            </label>

            {formData.isSerialized && (
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">
                  Serial Numbers (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="SN-10023, SN-10024..."
                  value={formData.serialNumbersText}
                  onChange={(e) =>
                    setFormData({ ...formData, serialNumbersText: e.target.value })
                  }
                  className="tail-input text-xs font-mono"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="tail-btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="tail-btn-primary">
              {isSubmitting ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Product Details Inspector Modal */}
      <Modal
        isOpen={Boolean(inspectItem)}
        onClose={() => setInspectItem(null)}
        title={inspectItem?.name || "Product Details"}
        subtitle={`SKU: ${inspectItem?.sku} • Category: ${inspectItem?.title}`}
        icon={<Package className="size-5 text-brand-500" />}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {/* Main Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/60">
              <span className="text-[10px] font-bold uppercase text-gray-400">Retail Unit Price</span>
              <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                PKR {inspectItem?.price.toFixed(2)}
              </p>
            </div>
            <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/60">
              <span className="text-[10px] font-bold uppercase text-gray-400">Stock on Shelf</span>
              <p className={`text-sm font-bold mt-0.5 ${(inspectItem?.quantity || 0) <= 5 ? "text-warning-500" : "text-gray-900 dark:text-white"}`}>
                {inspectItem?.quantity} Units
              </p>
            </div>
            <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/60">
              <span className="text-[10px] font-bold uppercase text-gray-400">Total Stock Value</span>
              <p className="text-sm font-bold text-success-600 dark:text-success-400 mt-0.5">
                PKR {((inspectItem?.price || 0) * (inspectItem?.quantity || 0)).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Product Specifications & Details */}
          <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-800/40 space-y-2">
            <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-500">Hardware Category:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{inspectItem?.title}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-500">Catalog SKU / Barcode:</span>
              <span className="font-mono font-semibold text-gray-900 dark:text-white">{inspectItem?.sku}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-500">Serialized Unit Tracking:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {inspectItem?.isSerialized === 1 ? "Enabled (Individual Serial Numbers)" : "Disabled"}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Cost Price:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                PKR {(inspectItem?.costPrice || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {inspectItem?.isSerialized === 1 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  const it = inspectItem;
                  setInspectItem(null);
                  handleViewSerials(it);
                }}
                className="tail-btn-secondary w-full text-xs justify-center"
              >
                <Barcode className="size-4" />
                <span>View & Manage Serial Numbers</span>
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
