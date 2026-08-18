import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  Trash2,
  PackagePlus,
  RefreshCw,
  X,
  AlertCircle,
} from "lucide-react";
import { ItemTitles, ItemTitle, InventoryItem } from "../db/schema";
import {
  addInventoryItem,
  updateItemQuantity,
  deleteInventoryItem,
} from "../db/inventoryService";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    title: ItemTitle;
    name: string;
    sku: string;
    quantity: number;
    price: number;
  }>({
    title: "LAPTOP",
    name: "",
    sku: "",
    quantity: 1,
    price: 0,
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

  const totalValuation = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const handleOpenModal = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setFormData({
      title: "LAPTOP",
      name: "",
      sku: `SKU-${randomSuffix}`,
      quantity: 1,
      price: 0,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Item name is required.");
      return;
    }
    if (!formData.sku.trim()) {
      setFormError("SKU is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      await addInventoryItem({
        title: formData.title,
        name: formData.name.trim(),
        sku: formData.sku.trim().toUpperCase(),
        quantity: Number(formData.quantity) || 0,
        price: Number(formData.price) || 0,
      });
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
    await deleteInventoryItem(id);
    await onRefresh();
  };

  return (
    <div className="page-container">
      {/* Header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">
            Manage hardware stock, categories, and item records
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh database records"
          >
            <RefreshCw size={16} className={isLoading ? "spinning" : ""} />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={handleOpenModal}>
            <Plus size={16} />
            Add Item
          </button>
        </div>
      </header>

      {/* Summary KPI Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Total Unique SKUs</span>
          <span className="metric-value">{items.length}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Total Stock Units</span>
          <span className="metric-value">{totalQuantity}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Inventory Valuation</span>
          <span className="metric-value highlight">
            ${totalValuation.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by item name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-box">
          <Filter size={16} className="filter-icon" />
          <select
            value={selectedTitleFilter}
            onChange={(e) => setSelectedTitleFilter(e.target.value)}
            className="select-filter"
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

      {/* Inventory Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Category (Enum)</th>
              <th>Item Name</th>
              <th>SKU</th>
              <th>Unit Price</th>
              <th>Quantity</th>
              <th>Total Value</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted">
                  Loading inventory from SQLite database...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted">
                  No inventory items found. Click <strong>"Add Item"</strong> to record stock.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className={`category-tag tag-${item.title.toLowerCase()}`}>
                      {item.title}
                    </span>
                  </td>
                  <td className="font-medium text-white">{item.name}</td>
                  <td className="sku-cell">{item.sku}</td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>
                    <div className="quantity-controls">
                      <button
                        className="qty-btn"
                        onClick={() => handleAdjustQuantity(item.id, item.quantity, -1)}
                        disabled={item.quantity <= 0}
                      >
                        -
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => handleAdjustQuantity(item.id, item.quantity, 1)}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td>${(item.price * item.quantity).toFixed(2)}</td>
                  <td className="text-right">
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(item.id)}
                      title="Delete Item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title-group">
                <PackagePlus size={20} className="modal-icon" />
                <h3 className="modal-title">Add Inventory Item</h3>
              </div>
              <button
                className="close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="form-error-banner">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateItem} className="item-form">
              <div className="form-group">
                <label htmlFor="item-title">Item Title / Category (Enum)</label>
                <select
                  id="item-title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value as ItemTitle })
                  }
                  required
                >
                  {ItemTitles.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <span className="form-hint">
                  Typed SQLite Enum category for future addition and filtering
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="item-name">Item Name</label>
                <input
                  id="item-name"
                  type="text"
                  placeholder="e.g. Dell XPS 15 9530"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="item-sku">SKU Code</label>
                  <input
                    id="item-sku"
                    type="text"
                    placeholder="e.g. LAP-DELL-XPS15"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="item-qty">Initial Quantity</label>
                  <input
                    id="item-qty"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="item-price">Unit Price ($ USD)</label>
                <input
                  id="item-price"
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
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save to Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
