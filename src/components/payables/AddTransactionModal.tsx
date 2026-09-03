import React, { useState, useEffect } from "react";
import { PlusCircle, ShoppingBag, Banknote, Undo2, Sliders } from "lucide-react";
import { Modal } from "../ui/Modal";
import { DatePicker } from "../ui/DatePicker";
import { PayableTxType, PayableParty } from "../../db/schema";
import { addLedgerEntry } from "../../db/payablesService";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  party: PayableParty | null;
  defaultType?: PayableTxType;
  onSuccess: () => Promise<void>;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  party,
  defaultType = "PURCHASE",
  onSuccess,
}) => {
  const [txType, setTxType] = useState<PayableTxType>(defaultType);
  const [dateStr, setDateStr] = useState<string>("");
  const [refNo, setRefNo] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [adjustmentSide, setAdjustmentSide] = useState<"DEBIT" | "CREDIT">("DEBIT");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateDefaultRef = (type: PayableTxType) => {
    const suffix = Date.now().toString().slice(-6);
    if (type === "PURCHASE") return `BILL-${suffix}`;
    if (type === "PAYMENT") return `PAY-${suffix}`;
    if (type === "RETURN") return `RET-${suffix}`;
    return `ADJ-${suffix}`;
  };

  useEffect(() => {
    if (isOpen) {
      setTxType(defaultType);
      const today = new Date().toISOString().split("T")[0];
      setDateStr(today);
      setRefNo(generateDefaultRef(defaultType));
      setDescription("");
      setAmount("");
      setError(null);
    }
  }, [isOpen, defaultType]);

  const handleTypeChange = (newType: PayableTxType) => {
    setTxType(newType);
    // If refNo is empty or was previously auto-generated, suggest a new one
    if (!refNo || refNo.startsWith("BILL-") || refNo.startsWith("PAY-") || refNo.startsWith("RET-") || refNo.startsWith("ADJ-")) {
      setRefNo(generateDefaultRef(newType));
    }
  };

  if (!party) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = typeof amount === "number" ? amount : 0;
    if (numAmount <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }
    if (!description.trim()) {
      setError("Please provide a description or item detail.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const txTimestamp = dateStr
        ? Math.floor(new Date(dateStr).getTime() / 1000)
        : Math.floor(Date.now() / 1000);

      let debit = 0;
      let credit = 0;

      if (txType === "PURCHASE") {
        credit = numAmount;
      } else if (txType === "PAYMENT" || txType === "RETURN") {
        debit = numAmount;
      } else if (txType === "ADJUSTMENT") {
        if (adjustmentSide === "DEBIT") {
          debit = numAmount; // discount / balance write-off
        } else {
          credit = numAmount; // extra charge / balance increase
        }
      }

      await addLedgerEntry({
        partyId: party.id,
        txDate: txTimestamp,
        txType,
        refNo: refNo.trim(),
        description: description.trim(),
        debit,
        credit,
      });

      await onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add ledger entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeConfig = {
    PURCHASE: { label: "Purchase Bill", icon: ShoppingBag, color: "text-brand-600 dark:text-brand-400" },
    PAYMENT: { label: "Payment Paid", icon: Banknote, color: "text-success-600 dark:text-success-400" },
    RETURN: { label: "Goods Return", icon: Undo2, color: "text-amber-600 dark:text-amber-400" },
    ADJUSTMENT: { label: "Adjustment", icon: Sliders, color: "text-purple-600 dark:text-purple-400" },
  }[txType];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Transaction • ${party.name}`}
      description="Record bills, payments, returns, or balance adjustments into supplier ledger"
      icon={<PlusCircle className="size-5 text-brand-500" />}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/20 text-error-600 dark:text-error-400 font-medium">
            {error}
          </div>
        )}

        {/* Transaction Type Buttons */}
        <div>
          <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">
            Transaction Type *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(["PURCHASE", "PAYMENT", "RETURN", "ADJUSTMENT"] as PayableTxType[]).map((t) => {
              const active = txType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className={`py-2 px-3 rounded-xl font-bold border transition-all text-center flex items-center justify-center gap-1.5 ${
                    active
                      ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 shadow-theme-xs"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  }`}
                >
                  {t === "PURCHASE" && <ShoppingBag className="size-3.5" />}
                  {t === "PAYMENT" && <Banknote className="size-3.5" />}
                  {t === "RETURN" && <Undo2 className="size-3.5" />}
                  {t === "ADJUSTMENT" && <Sliders className="size-3.5" />}
                  <span>{t}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date, Ref, Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Date *
            </label>
            <DatePicker
              value={dateStr}
              onChange={setDateStr}
              placeholder="Select date"
              className="w-full"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-gray-700 dark:text-gray-300">
                Ref # / Bill #
              </label>
              <span className="text-[10px] text-gray-400 font-medium">Optional</span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                className="tail-input font-mono"
                placeholder={txType === "PURCHASE" ? "e.g. BILL #0345" : "e.g. BOP-90823, CASH"}
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Amount (PKR) *
            </label>
            <input
              type="number"
              min="1"
              required
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value, 10) || 0))
              }
              className="tail-input font-mono font-bold"
              placeholder="0"
            />
          </div>
        </div>

        {/* For Adjustment, specify Debit vs Credit */}
        {txType === "ADJUSTMENT" && (
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/30">
            <label className="block font-bold text-purple-900 dark:text-purple-300 mb-1.5">
              Adjustment Impact
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="adjSide"
                  value="DEBIT"
                  checked={adjustmentSide === "DEBIT"}
                  onChange={() => setAdjustmentSide("DEBIT")}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  Debit (Reduces amount owed / Discount received)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="adjSide"
                  value="CREDIT"
                  checked={adjustmentSide === "CREDIT"}
                  onChange={() => setAdjustmentSide("CREDIT")}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  Credit (Increases amount owed / Extra charges)
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Description / Item Breakdown */}
        <div>
          <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">
            Description / Item Details *
          </label>
          <textarea
            rows={2}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="tail-input resize-none font-mono"
            placeholder={
              txType === "PURCHASE"
                ? "e.g. HP 840 G6 8GB/256GB, DELL 5580 TOUCH 1080 8GB/256"
                : txType === "PAYMENT"
                ? "e.g. Online Meezan Bank transfer, Cash handed over at plaza"
                : txType === "RETURN"
                ? "e.g. Return 1x defective Lenovo T450 motherboard"
                : "e.g. Settlement discount or balance reconciliation"
            }
          />
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="text-gray-500 font-mono text-[11px]">
            Current Balance: PKR {party.currentBalance.toLocaleString()}
          </div>
          <div className="flex gap-2">
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
              className="tail-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Recording..." : `Record ${typeConfig.label}`}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
