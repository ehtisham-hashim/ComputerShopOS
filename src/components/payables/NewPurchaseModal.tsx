import React, { useState, useEffect, useMemo } from "react";
import {
  ShoppingBag,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Package,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { DatePicker } from "../ui/DatePicker";
import { CustomDropdown } from "../ui/CustomDropdown";
import {
  PayableParty,
  InventoryItem,
  ItemTitles,
  ItemTitle,
  PurchaseStatus,
} from "../../db/schema";
import { getPayableParties } from "../../db/payablesService";
import { getInventoryItems } from "../../db/inventoryService";
import { createPurchase, getNextPurchaseNo } from "../../db/purchaseService";

interface PurchaseItemRow {
  id: string;
  inventoryId: number | null;
  title: ItemTitle;
  itemName: string;
  sku: string;
  quantity: number;
  costPrice: number | "";
  sellPrice: number | "";
}

interface NewPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedPartyId?: number | null;
  onSuccess: () => Promise<void>;
  onOpenAddSupplier?: () => void;
}

export const NewPurchaseModal: React.FC<NewPurchaseModalProps> = ({
  isOpen,
  onClose,
  preSelectedPartyId,
  onSuccess,
  onOpenAddSupplier,
}) => {
  const [parties, setParties] = useState<PayableParty[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState<number | "">("");

  const [purchaseNo, setPurchaseNo] = useState("");
  const [refNo, setRefNo] = useState("");
  const [purchaseDateStr, setPurchaseDateStr] = useState("");
  const [status, setStatus] = useState<PurchaseStatus>("RECEIVED");
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<PurchaseItemRow[]>([
    {
      id: "row-1",
      inventoryId: null,
      title: "LAPTOP",
      itemName: "",
      sku: "",
      quantity: 1,
      costPrice: "",
      sellPrice: "",
    },
  ]);

  const [paidAmount, setPaidAmount] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load parties, inventory, and auto-generate purchaseNo when opened
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split("T")[0];
      setPurchaseDateStr(today);
      setStatus("RECEIVED");
      setNotes("");
      setPaidAmount("");
      setError(null);

      // Generate default bill reference
      const billSuffix = Date.now().toString().slice(-6);
      setRefNo(`BILL-${billSuffix}`);

      // Reset items list
      setItems([
        {
          id: "row-" + Date.now(),
          inventoryId: null,
          title: "LAPTOP",
          itemName: "",
          sku: "",
          quantity: 1,
          costPrice: "",
          sellPrice: "",
        },
      ]);

      // Load initial data
      Promise.all([getPayableParties(), getInventoryItems(), getNextPurchaseNo()])
        .then(([allParties, allInv, nextNo]) => {
          setParties(allParties);
          setInventoryList(allInv);
          setPurchaseNo(nextNo);

          if (preSelectedPartyId) {
            setSelectedPartyId(preSelectedPartyId);
          } else if (allParties.length > 0) {
            setSelectedPartyId(allParties[0].id);
          } else {
            setSelectedPartyId("");
          }
        })
        .catch((err) => {
          console.error("Error initializing purchase modal:", err);
        });
    }
  }, [isOpen, preSelectedPartyId]);

  const selectedParty = useMemo(() => {
    return parties.find((p) => p.id === Number(selectedPartyId)) || null;
  }, [parties, selectedPartyId]);

  // Calculations
  const totalAmount = useMemo(() => {
    return items.reduce((sum, row) => {
      const qty = Math.max(0, Number(row.quantity) || 0);
      const cost = Math.max(0, Number(row.costPrice) || 0);
      return sum + qty * cost;
    }, 0);
  }, [items]);

  const totalUnits = useMemo(() => {
    return items.reduce((sum, row) => sum + Math.max(0, Number(row.quantity) || 0), 0);
  }, [items]);

  const numericPaid = typeof paidAmount === "number" ? Math.max(0, paidAmount) : 0;
  const netDue = Math.max(0, totalAmount - numericPaid);
  const currentPartyBalance = selectedParty ? selectedParty.currentBalance : 0;
  const resultingPartyBalance = currentPartyBalance + netDue;

  // Add Item Line
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: "row-" + Math.random().toString(36).substring(2, 9),
        inventoryId: null,
        title: "LAPTOP",
        itemName: "",
        sku: "",
        quantity: 1,
        costPrice: "",
        sellPrice: "",
      },
    ]);
  };

  // Remove Item Line
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((row) => row.id !== id));
  };

  // Update Item Field
  const handleItemChange = (id: string, field: keyof PurchaseItemRow, value: any) => {
    setItems((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };

        // If selecting an existing inventory item
        if (field === "inventoryId") {
          const invId = Number(value);
          if (invId) {
            const inv = inventoryList.find((i) => i.id === invId);
            if (inv) {
              updated.inventoryId = inv.id;
              updated.itemName = inv.name;
              updated.title = inv.title;
              updated.sku = inv.sku;
              updated.costPrice = inv.costPrice;
              updated.sellPrice = inv.price;
            }
          } else {
            updated.inventoryId = null;
          }
        }

        return updated;
      })
    );
  };

  const handleSetFullPayment = () => {
    setPaidAmount(totalAmount);
  };

  const handleSetZeroPayment = () => {
    setPaidAmount(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartyId) {
      setError("Please select a vendor / supplier.");
      return;
    }

    if (items.length === 0) {
      setError("Please add at least one line item.");
      return;
    }

    // Validate item rows
    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      if (!row.itemName.trim()) {
        setError(`Item line #${i + 1} is missing an Item Name.`);
        return;
      }
      if (Number(row.quantity) <= 0) {
        setError(`Item line #${i + 1} quantity must be greater than 0.`);
        return;
      }
      if (Number(row.costPrice) < 0 || row.costPrice === "") {
        setError(`Item line #${i + 1} cost price cannot be empty.`);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const txTimestamp = purchaseDateStr
        ? Math.floor(new Date(purchaseDateStr).getTime() / 1000)
        : Math.floor(Date.now() / 1000);

      await createPurchase({
        partyId: Number(selectedPartyId),
        partyName: selectedParty?.name,
        refNo: refNo.trim() || purchaseNo,
        purchaseDate: txTimestamp,
        status,
        paidAmount: numericPaid,
        notes: notes.trim(),
        items: items.map((it) => ({
          inventoryId: it.inventoryId,
          title: it.title,
          itemName: it.itemName.trim(),
          sku: it.sku.trim() || undefined,
          quantity: Number(it.quantity) || 1,
          costPrice: Number(it.costPrice) || 0,
          sellPrice: it.sellPrice !== "" ? Number(it.sellPrice) : undefined,
        })),
      });

      await onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to create purchase:", err);
      setError(err?.message || "Failed to record purchase. Please verify the input values.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Stock Purchase & Inward Bill"
      description="Procure multiple hardware items, update shop inventory quantities, and register vendor ledger entries"
      icon={<ShoppingBag className="size-5 text-brand-600 dark:text-brand-400" />}
      size="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-error-50 dark:bg-error-950/40 border border-error-200 dark:border-error-800 rounded-xl flex items-center gap-2.5 text-xs text-error-600 dark:text-error-400">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Supplier & Purchase Meta Card */}
        <div className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Supplier Selector */}
            <div className="md:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-brand-500" />
                  <span>Select Supplier / Vendor *</span>
                </label>
                {onOpenAddSupplier && (
                  <button
                    type="button"
                    onClick={onOpenAddSupplier}
                    className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    + New Supplier
                  </button>
                )}
              </div>
              <CustomDropdown
                value={selectedPartyId}
                onChange={(val) => setSelectedPartyId(val ? Number(val) : "")}
                options={[
                  { value: "", label: "-- Select a supplier --" },
                  ...parties.map((p) => ({
                    value: p.id,
                    label: `${p.name} (Balance: PKR ${p.currentBalance.toLocaleString()})`,
                  })),
                ]}
                className="w-full"
                buttonClassName="w-full py-2 bg-white dark:bg-gray-900 font-medium"
              />
            </div>

            {/* Purchase ID & Bill Ref */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <span>Purchase # (Auto)</span>
              </label>
              <div className="px-3 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                {purchaseNo || "PUR-2026-..."}
              </div>
            </div>

            {/* Bill Ref # */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Vendor Bill / Inv Ref #
              </label>
              <input
                type="text"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                placeholder="e.g. BILL-99201"
                className="tail-input text-xs w-full font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
            {/* Purchase Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Purchase Date *
              </label>
              <DatePicker
                value={purchaseDateStr}
                onChange={setPurchaseDateStr}
                className="w-full"
              />
            </div>

            {/* Stock Inward Status Toggle */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                <span>Stock Inward Status *</span>
                <span className="text-[10px] text-gray-400">
                  {status === "RECEIVED" ? "Direct physical intake" : "Awaiting shipment"}
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus("RECEIVED")}
                  className={`flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-bold border transition-all ${
                    status === "RECEIVED"
                      ? "bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-950/40 dark:border-brand-500 dark:text-brand-300 shadow-sm"
                      : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <CheckCircle2 className="size-3.5 text-success-500" />
                  <span>RECEIVED (Add to Stock)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus("ORDERED")}
                  className={`flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-bold border transition-all ${
                    status === "ORDERED"
                      ? "bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950/40 dark:border-amber-500 dark:text-amber-300 shadow-sm"
                      : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <Clock className="size-3.5 text-amber-500" />
                  <span>ORDERED (Transit Only)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Multi-Item Dynamic Table */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="size-4 text-brand-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                Purchase Items ({items.length} {items.length === 1 ? "Item" : "Items"})
              </h4>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="tail-btn-secondary text-xs py-1 px-2.5 flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:border-brand-500"
            >
              <Plus className="size-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {items.map((row, idx) => {
              const rowCost = Math.max(0, Number(row.costPrice) || 0);
              const rowQty = Math.max(0, Number(row.quantity) || 0);
              const rowTotal = rowQty * rowCost;

              return (
                <div
                  key={row.id}
                  className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-theme-xs space-y-2.5 relative group"
                >
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="size-5 rounded-full bg-gray-100 dark:bg-gray-800 font-mono text-[11px] font-bold flex items-center justify-center text-gray-600 dark:text-gray-300">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-gray-700 dark:text-gray-300">
                        Item #{idx + 1}
                      </span>
                      {row.inventoryId && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                          Restocking Existing Inventory
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] uppercase text-gray-400 block leading-none">
                          Line Total
                        </span>
                        <span className="font-mono font-bold text-xs text-gray-900 dark:text-white">
                          PKR {rowTotal.toLocaleString()}
                        </span>
                      </div>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(row.id)}
                          className="p-1 text-gray-400 hover:text-error-500 rounded-lg hover:bg-error-50 dark:hover:bg-error-950/30 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Restock Selector Quick Dropdown */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                    <div className="md:col-span-12">
                      <CustomDropdown
                        value={row.inventoryId ? String(row.inventoryId) : ""}
                        onChange={(val) => handleItemChange(row.id, "inventoryId", val)}
                        options={[
                          { value: "", label: "✨ + Enter New Catalog Hardware (or pick from existing to restock...)" },
                          ...inventoryList.map((inv) => ({
                            value: String(inv.id),
                            label: `Restock: [${inv.title}] ${inv.name} (In Stock: ${inv.quantity}, Last Cost: PKR ${inv.costPrice.toLocaleString()})`,
                          })),
                        ]}
                        className="w-full"
                        buttonClassName="w-full py-1.5 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900"
                        size="sm"
                      />
                    </div>

                    {/* Category */}
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
                        Category *
                      </label>
                      <CustomDropdown
                        value={row.title}
                        onChange={(val) => handleItemChange(row.id, "title", val as ItemTitle)}
                        options={ItemTitles.map((t) => ({ value: t, label: t }))}
                        className="w-full"
                        buttonClassName="w-full py-1.5 bg-white dark:bg-gray-900 font-bold"
                        size="sm"
                      />
                    </div>

                    {/* Item Name */}
                    <div className="md:col-span-5 space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
                        Item Name / Specs *
                      </label>
                      <input
                        type="text"
                        value={row.itemName}
                        onChange={(e) => handleItemChange(row.id, "itemName", e.target.value)}
                        placeholder="e.g. Dell Latitude 5420 i5 11th Gen"
                        className="tail-input text-xs w-full"
                        required
                      />
                    </div>

                    {/* SKU */}
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
                        SKU (Auto or Custom)
                      </label>
                      <input
                        type="text"
                        value={row.sku}
                        onChange={(e) => handleItemChange(row.id, "sku", e.target.value)}
                        placeholder="Leave blank to auto-generate"
                        className="tail-input text-xs w-full font-mono"
                      />
                    </div>

                    {/* Qty, Cost Price, Sell Price */}
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) =>
                          handleItemChange(row.id, "quantity", Math.max(1, parseInt(e.target.value) || 1))
                        }
                        className="tail-input text-xs w-full font-mono font-bold"
                        required
                      />
                    </div>

                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
                        Purchase Cost (PKR) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={row.costPrice}
                        onChange={(e) =>
                          handleItemChange(
                            row.id,
                            "costPrice",
                            e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value) || 0)
                          )
                        }
                        placeholder="Cost per unit"
                        className="tail-input text-xs w-full font-mono font-bold text-error-600 dark:text-error-400"
                        required
                      />
                    </div>

                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
                        Selling Price (PKR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={row.sellPrice}
                        onChange={(e) =>
                          handleItemChange(
                            row.id,
                            "sellPrice",
                            e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value) || 0)
                          )
                        }
                        placeholder="Shop retail price"
                        className="tail-input text-xs w-full font-mono text-success-600 dark:text-success-400"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Notes & Remarks */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
            Bill Remarks / Notes (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Batch delivered from Karachi port, tested working"
            className="tail-input text-xs w-full"
          />
        </div>

        {/* 4. Sticky Summary & Payment Reconciliation Bar */}
        <div className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Left: Khata Impact Preview */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                <span>Total Items / Total Units:</span>
                <span className="font-bold text-gray-900 dark:text-white font-mono">
                  {items.length} items ({totalUnits} units)
                </span>
              </div>

              {selectedParty && (
                <>
                  <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                    <span>Current Khata Balance:</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300">
                      PKR {currentPartyBalance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                    <span>Net Added from this Bill:</span>
                    <span className="font-mono font-bold text-error-600 dark:text-error-400">
                      + PKR {netDue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-gray-200 dark:border-gray-800 font-bold">
                    <span className="text-gray-900 dark:text-white">Updated Supplier Balance:</span>
                    <span className="font-mono text-sm text-brand-600 dark:text-brand-400">
                      PKR {resultingPartyBalance.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Right: Payment & Total Amount */}
            <div className="space-y-3 p-3 rounded-xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400">
                  Total Bill Amount:
                </span>
                <span className="text-lg font-mono font-bold text-gray-900 dark:text-white">
                  PKR {totalAmount.toLocaleString()}
                </span>
              </div>

              {/* Paid Amount */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                    Upfront Paid Amount (PKR)
                  </label>
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={handleSetZeroPayment}
                      className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-600 dark:text-gray-300 font-bold"
                    >
                      PKR 0
                    </button>
                    <button
                      type="button"
                      onClick={handleSetFullPayment}
                      className="px-1.5 py-0.5 rounded bg-success-50 dark:bg-success-950/40 text-success-600 dark:text-success-400 font-bold border border-success-200 dark:border-success-800"
                    >
                      Full Paid
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  max={totalAmount}
                  value={paidAmount}
                  onChange={(e) =>
                    setPaidAmount(e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value) || 0))
                  }
                  placeholder="Enter cash / bank payment amount"
                  className="tail-input text-xs w-full font-mono font-bold text-success-600 dark:text-success-400"
                />
              </div>

              {/* Net Balance Due */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Balance Due (To Khata):</span>
                <span className="font-mono font-bold text-error-600 dark:text-error-400">
                  PKR {netDue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="tail-btn-secondary text-xs py-2 px-4"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalAmount <= 0}
              className="tail-btn-primary text-xs py-2 px-5 flex items-center gap-1.5 font-bold"
            >
              <ShoppingBag className="size-4" />
              <span>{isSubmitting ? "Processing..." : "Confirm & Inward Stock"}</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
