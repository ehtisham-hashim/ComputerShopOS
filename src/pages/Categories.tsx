import React, { useState, useEffect, useMemo } from "react";
import { Tags, Plus, Edit2, Trash2, Layers, CheckCircle2, Search } from "lucide-react";
import { CategoryRecord, InventoryItem } from "../db/schema";
import { addCategory, updateCategory, deleteCategory, getCategoryUsageCounts } from "../db/categoryService";
import { PageHeader } from "../components/ui/PageHeader";
import { Modal } from "../components/ui/Modal";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { SearchInput } from "../components/ui/SearchInput";

interface CategoriesPageProps {
  categories: CategoryRecord[];
  items: InventoryItem[];
  onRefresh: () => Promise<void>;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  categories,
  items,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({});

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<CategoryRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch live usage counts
  const loadUsage = async () => {
    try {
      const counts = await getCategoryUsageCounts();
      setUsageCounts(counts);
    } catch (err) {
      console.error("Failed to load category usage:", err);
    }
  };

  useEffect(() => {
    loadUsage();
  }, [items, categories]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  // Statistics
  const totalCategories = categories.length;
  const inUseCount = useMemo(() => {
    return categories.filter((c) => (usageCounts[c.name] || 0) > 0).length;
  }, [categories, usageCounts]);
  const totalItemsCount = items.length;

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: CategoryRecord) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || "");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setFormError("Category name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, { name: trimmed, description });
      } else {
        await addCategory({ name: trimmed, description });
      }
      await onRefresh();
      await loadUsage();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to save category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCategory(deleteTarget.id);
      await onRefresh();
      await loadUsage();
      setDeleteTarget(null);
    } catch (err: any) {
      console.error("Failed to delete category:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Categories"
        subtitle="Manage product categories and classifications across all store modules"
        icon={Tags}
      >
        <button
          onClick={handleOpenAddModal}
          className="tail-btn-primary text-xs flex items-center gap-1.5"
        >
          <Plus className="size-4" />
          <span>Add Category</span>
        </button>
      </PageHeader>

      {/* Bento Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="tail-card p-4 flex items-center gap-3.5 border-l-4 border-l-brand-500">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <Tags className="size-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Categories</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white tabular-nums">
              {totalCategories}
            </p>
          </div>
        </div>

        <div className="tail-card p-4 flex items-center gap-3.5 border-l-4 border-l-emerald-500">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">In-Stock Categories</p>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {inUseCount}
            </p>
          </div>
        </div>

        <div className="tail-card p-4 flex items-center gap-3.5 border-l-4 border-l-blue-500">
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Layers className="size-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Linked Products</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white tabular-nums">
              {totalItemsCount} units
            </p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="tail-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search categories by name or description..."
            className="flex-1 max-w-md"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Showing {filteredCategories.length} of {categories.length} categories
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm whitespace-nowrap">
            <thead className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase text-gray-400 dark:border-gray-800 dark:bg-gray-800/30 dark:text-gray-500">
              <tr>
                <th className="py-3.5 px-4">Category Name</th>
                <th className="py-3.5 px-4">Description & Scope</th>
                <th className="py-3.5 px-4 text-center">Active Products</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 text-xs">
                    <Search className="size-8 mx-auto mb-2 text-gray-400 opacity-60" />
                    No product categories found. Click &quot;Add Category&quot; to create one.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => {
                  const usage = usageCounts[cat.name] || 0;
                  const dateStr = new Date(cat.createdAt * 1000).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 shrink-0">
                            <Tags className="size-3.5" />
                          </span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {cat.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-md truncate text-xs text-gray-600 dark:text-gray-300">
                        {cat.description || (
                          <span className="italic text-gray-400">No description provided</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums ${
                            usage > 0
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {usage} {usage === 1 ? "item" : "items"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400">
                        {dateStr}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(cat)}
                            className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/15 dark:hover:text-brand-400 transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(cat)}
                            className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/15 dark:hover:text-error-400 transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="size-3.5" />
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? "Edit Product Category" : "Add Product Category"}
        description="Categories are used across Inventory, Sales POS, Purchases, and Trade-Ins"
        icon={<Tags className="size-5 text-brand-500" />}
        size="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-xl border border-error-200 bg-error-50 p-3 text-xs font-semibold text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Gaming Accessories, Display Cables, Routers"
              className="tail-input"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Description / Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Keyboards, mice, headsets, desk pads"
              className="tail-input text-xs"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="tail-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="tail-btn-primary"
            >
              {isSubmitting ? "Saving..." : editingCategory ? "Update Category" : "Add Category"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Product Category"
        message={
          deleteTarget
            ? (usageCounts[deleteTarget.name] || 0) > 0
              ? `Warning: Category "${deleteTarget.name}" currently has ${usageCounts[deleteTarget.name]} active inventory item(s) linked to it. Deleting this category will remove it from future selections, but existing items will keep their label.`
              : `Are you sure you want to delete category "${deleteTarget.name}"? This action cannot be undone.`
            : ""
        }
        confirmText="Delete Category"
        isLoading={isDeleting}
      />
    </div>
  );
};
