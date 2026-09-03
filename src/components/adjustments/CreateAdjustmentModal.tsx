import React, { useState, useEffect } from "react";
import { ArrowLeftRight, PackagePlus, TrendingUp, ShieldCheck } from "lucide-react";
import { Customer, InventoryItem, PaymentStatus, ItemTitle, ItemTitles } from "../../db/schema";
import { createAdjustment, getNextTradeInSku } from "../../db/adjustmentsService";
import { Modal } from "../ui/Modal";
import { CustomSelect } from "../ui/Select";

interface CreateAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  customers: Customer[];
  onSuccess: () => Promise<void>;
}

const CONDITION_OPTIONS = [
  "Used - Good (9/10)",
  "Like New (10/10)",
  "Used - Fair (8/10)",
  "Refurbished / Tested",
  "Minor Issue / For Parts",
];

export const CreateAdjustmentModal: React.FC<CreateAdjustmentModalProps> = ({
  isOpen,
  onClose,
  items,
  customers,
  onSuccess,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Trade-In Intake (Item Taken In)
  const [itemTakenCategory, setItemTakenCategory] = useState<ItemTitle>("LAPTOP");
  const [itemTakenName, setItemTakenName] = useState("");
  const [itemTakenSku, setItemTakenSku] = useState("");
  const [itemTakenCondition, setItemTakenCondition] = useState("Used - Good (9/10)");
  const [itemTakenSerial, setItemTakenSerial] = useState("");
  const [itemTakenValue, setItemTakenValue] = useState<number | "">("");
  const [itemTakenSellPrice, setItemTakenSellPrice] = useState<number | "">("");
  const [isCustomResaleSet, setIsCustomResaleSet] = useState(false);

  // Item Given Out
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [itemGivenName, setItemGivenName] = useState("");
  const [itemGivenPrice, setItemGivenPrice] = useState<number | "">("");

  // Financial Settlement
  const [paidAmount, setPaidAmount] = useState<number | "">("");
  const [isCustomPaidSet, setIsCustomPaidSet] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize trade-in SKU when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCustomerId("");
      setCustomerName("");
      setCustomerPhone("");
      setItemTakenCategory("LAPTOP");
      setItemTakenName("");
      setItemTakenCondition("Used - Good (9/10)");
      setItemTakenSerial("");
      setItemTakenValue("");
      setItemTakenSellPrice("");
      setIsCustomResaleSet(false);
      setSelectedInventoryId("");
      setItemGivenName("");
      setItemGivenPrice("");
      setPaidAmount("");
      setIsCustomPaidSet(false);
      setNotes("");
      setError(null);

      // Pre-generate SKU
      getNextTradeInSku("LAPTOP").then((sku) => {
        setItemTakenSku(sku);
      });
    }
  }, [isOpen]);

  const handleCategoryChange = async (cat: ItemTitle) => {
    setItemTakenCategory(cat);
    const sku = await getNextTradeInSku(cat);
    setItemTakenSku(sku);
  };

  const handleSelectCustomer = (val: string) => {
    setSelectedCustomerId(val);
    const found = customers.find((c) => String(c.id) === val);
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone);
    }
  };

  const handleSelectInventoryItem = (val: string) => {
    setSelectedInventoryId(val);
    const item = items.find((i) => String(i.id) === val);
    if (item) {
      setItemGivenName(item.name);
      setItemGivenPrice(item.price);
      const valNum = typeof itemTakenValue === "number" ? itemTakenValue : 0;
      if (!isCustomPaidSet) {
        setPaidAmount(Math.max(0, item.price - valNum));
      }
    }
  };

  const handleValuationChange = (val: number | "") => {
    setItemTakenValue(val);
    const numVal = typeof val === "number" ? val : 0;

    // Auto-suggest resale price (+25% markup) if not explicitly customized
    if (!isCustomResaleSet) {
      setItemTakenSellPrice(numVal > 0 ? Math.round(numVal * 1.25) : "");
    }

    // Auto update settlement paid amount if not customized
    const givenPriceNum = typeof itemGivenPrice === "number" ? itemGivenPrice : 0;
    if (!isCustomPaidSet) {
      setPaidAmount(Math.max(0, givenPriceNum - numVal));
    }
  };

  const valNum = typeof itemTakenValue === "number" ? itemTakenValue : 0;
  const resaleNum = typeof itemTakenSellPrice === "number" ? itemTakenSellPrice : 0;
  const givenPriceNum = typeof itemGivenPrice === "number" ? itemGivenPrice : 0;

  const netDifference = Math.round(givenPriceNum - valNum);
  const targetDue = Math.abs(netDifference);
  const estMargin = resaleNum > 0 && valNum > 0 ? resaleNum - valNum : 0;
  const estMarginPct = valNum > 0 && estMargin > 0 ? Math.round((estMargin / valNum) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError("Please provide customer name.");
      return;
    }
    if (!itemTakenName.trim()) {
      setError("Please enter the name/specs of the item taken in.");
      return;
    }
    if (valNum < 0) {
      setError("Please enter a valid valuation.");
      return;
    }
    if (!itemGivenName.trim()) {
      setError("Please select the item given out.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const paid = paidAmount !== "" && paidAmount !== undefined ? Math.round(Number(paidAmount)) : targetDue;
      const status: PaymentStatus =
        netDifference === 0 || paid >= targetDue
          ? "PAID"
          : paid > 0
          ? "PARTIAL"
          : "UNPAID";

      await createAdjustment({
        customerId: selectedCustomerId ? Number(selectedCustomerId) : undefined,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        itemTakenTitle: itemTakenCategory,
        itemTakenName: itemTakenName.trim(),
        itemTakenSku: itemTakenSku.trim() || undefined,
        itemTakenValue: valNum,
        itemTakenSellPrice: resaleNum > 0 ? resaleNum : undefined,
        itemTakenSerial: itemTakenSerial.trim() || undefined,
        itemTakenCondition: itemTakenCondition.trim() || undefined,
        itemGivenInventoryId: selectedInventoryId ? Number(selectedInventoryId) : undefined,
        itemGivenName: itemGivenName.trim(),
        itemGivenPrice: givenPriceNum,
        netDifference,
        paidAmount: paid,
        balanceDue: Math.max(0, targetDue - paid),
        paymentStatus: status,
        notes: notes.trim(),
      });

      await onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to record swap adjustment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record PC Trade-In / Swap"
      description="Exchange customer hardware, inward trade-in to inventory, and reconcile financial difference"
      icon={<ArrowLeftRight className="size-5 text-brand-500" />}
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/20 text-error-600 dark:text-error-400 font-medium">
            {error}
          </div>
        )}

        {/* 1. Customer Selection */}
        <div className="p-3.5 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 space-y-2.5">
          <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <span>1. Customer Information</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <CustomSelect
                label="Existing Customer"
                value={selectedCustomerId}
                onChange={handleSelectCustomer}
                options={customers.map((c) => ({
                  value: String(c.id),
                  label: c.name,
                  sublabel: c.phone,
                }))}
                placeholder="Search customer..."
                searchable
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Bilal Ahmed"
                className="tail-input text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="0300-1234567"
                className="tail-input font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* 2. Item Taken In (Trade-In Hardware Inward to Inventory) */}
        <div className="p-3.5 rounded-xl bg-amber-50/40 dark:bg-amber-500/5 border border-amber-200/60 dark:border-amber-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackagePlus className="size-4 text-amber-600 dark:text-amber-400" />
              <span className="font-bold text-gray-900 dark:text-white text-xs">
                2. Item Taken In (Inwards directly into Inventory)
              </span>
            </div>
            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-500/20 px-2 py-0.5 rounded-full">
              Adds Stock +1
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                Category *
              </label>
              <select
                value={itemTakenCategory}
                onChange={(e) => handleCategoryChange(e.target.value as ItemTitle)}
                className="tail-input text-xs"
              >
                {ItemTitles.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                Product Name & Full Specs *
              </label>
              <input
                type="text"
                required
                value={itemTakenName}
                onChange={(e) => setItemTakenName(e.target.value)}
                placeholder="e.g. HP EliteBook 840 G6 (Core i5 8th, 16GB, 256GB SSD)"
                className="tail-input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                Trade-In SKU
              </label>
              <input
                type="text"
                value={itemTakenSku}
                onChange={(e) => setItemTakenSku(e.target.value)}
                className="tail-input font-mono text-xs"
                placeholder="TRD-2026-001"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                Physical Condition
              </label>
              <select
                value={itemTakenCondition}
                onChange={(e) => setItemTakenCondition(e.target.value)}
                className="tail-input text-xs"
              >
                {CONDITION_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                Valuation (PKR) * <span className="text-gray-400 font-normal">[Cost]</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={itemTakenValue}
                onChange={(e) =>
                  handleValuationChange(
                    e.target.value === "" ? "" : parseInt(e.target.value, 10) || 0
                  )
                }
                placeholder="e.g. 35000"
                className="tail-input font-mono font-bold text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                Target Resale (PKR) <span className="text-gray-400 font-normal">[Price]</span>
              </label>
              <input
                type="number"
                min="0"
                value={itemTakenSellPrice}
                onChange={(e) => {
                  setIsCustomResaleSet(true);
                  setItemTakenSellPrice(
                    e.target.value === "" ? "" : parseInt(e.target.value, 10) || 0
                  );
                }}
                placeholder="e.g. 45000"
                className="tail-input font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                Serial / Tag Number (Optional)
              </label>
              <input
                type="text"
                value={itemTakenSerial}
                onChange={(e) => setItemTakenSerial(e.target.value)}
                placeholder="e.g. 5CD9280VXX"
                className="tail-input font-mono uppercase text-xs"
              />
            </div>

            {/* Live Profit Margin Badge */}
            {resaleNum > 0 && valNum > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/70 dark:bg-gray-800/60 border border-amber-200/50 dark:border-amber-500/20 text-[11px] mt-4">
                <TrendingUp className="size-4 text-success-600 dark:text-success-400 shrink-0" />
                <span className="text-gray-600 dark:text-gray-300">
                  Est. Gross Margin:{" "}
                  <strong className="text-success-600 dark:text-success-400">
                    +PKR {estMargin.toLocaleString()}
                  </strong>{" "}
                  ({estMarginPct}%)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 3. Item Given Out */}
        <div className="p-3.5 rounded-xl bg-brand-50/30 dark:bg-brand-500/5 border border-brand-100 dark:border-brand-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-brand-600 dark:text-brand-400" />
              <span className="font-bold text-gray-900 dark:text-white text-xs">
                3. Item Given Out (Decrements Stock -1)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <CustomSelect
                label="Select Inventory Product *"
                value={selectedInventoryId}
                onChange={handleSelectInventoryItem}
                options={items.map((i) => ({
                  value: String(i.id),
                  label: i.name,
                  sublabel: `Qty: ${i.quantity} • PKR ${i.price.toLocaleString()}`,
                }))}
                placeholder="Pick hardware to give customer..."
                searchable
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                Selling Price (PKR) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={itemGivenPrice}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10) || 0;
                  setItemGivenPrice(v);
                  if (!isCustomPaidSet) {
                    setPaidAmount(Math.max(0, v - valNum));
                  }
                }}
                className="tail-input font-mono font-bold text-xs"
              />
            </div>
          </div>
        </div>

        {/* 4. Financial Reconciliation Bar */}
        <div className="p-3.5 rounded-xl bg-gray-900 text-white dark:bg-gray-950 border border-gray-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] text-gray-400 uppercase tracking-wider block">
                Net Swap Financial Difference
              </span>
              <div className="text-base font-bold">
                {netDifference > 0 ? (
                  <span className="text-success-400">
                    Customer Pays Store: PKR {netDifference.toLocaleString()}
                  </span>
                ) : netDifference < 0 ? (
                  <span className="text-amber-400">
                    Store Refunds Customer: PKR {Math.abs(netDifference).toLocaleString()}
                  </span>
                ) : (
                  <span className="text-gray-300">Even Swap (PKR 0 Difference)</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-[10px] text-gray-400 block">Upfront Paid</span>
                <input
                  type="number"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => {
                    setIsCustomPaidSet(true);
                    setPaidAmount(
                      e.target.value === "" ? "" : parseInt(e.target.value, 10) || 0
                    );
                  }}
                  className="tail-input w-32 bg-gray-800 border-gray-700 text-white font-mono text-xs font-bold text-right"
                  placeholder="0"
                />
              </div>
              <div className="flex flex-col gap-1 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomPaidSet(true);
                    setPaidAmount(0);
                  }}
                  className="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-[10px] text-gray-300"
                >
                  Unpaid
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomPaidSet(true);
                    setPaidAmount(targetDue);
                  }}
                  className="px-2 py-0.5 rounded bg-brand-700 hover:bg-brand-600 text-[10px] text-white font-bold"
                >
                  Full Paid
                </button>
              </div>
            </div>
          </div>

          <div>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes, exchange warranty terms, reason for swap..."
              className="tail-input text-xs bg-gray-800/80 border-gray-700 text-gray-200 placeholder-gray-500 w-full"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="tail-btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="tail-btn-primary"
          >
            {isSubmitting ? "Recording & Inwarding..." : "Record Trade-In & Inward Stock"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
