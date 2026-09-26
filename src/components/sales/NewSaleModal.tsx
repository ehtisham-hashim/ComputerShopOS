import React, { useState, useMemo, useEffect, useCallback } from "react";
import { ShoppingCart, CreditCard, Banknote, Split, CornerDownLeft, Sparkles } from "lucide-react";
import { InventoryItem, Customer, PaymentMethod, PaymentStatus, CategoryRecord } from "../../db/schema";
import { createSaleTransaction } from "../../db/posService";
import { Modal } from "../ui/Modal";
import { CustomSelect } from "../ui/Select";
import { StatusBadge } from "../ui/StatusBadge";
import { CatalogPicker } from "./CatalogPicker";
import { CartItemList } from "./CartItemList";
import { CartItem, CompletedSale } from "./types";

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  categories?: CategoryRecord[];
  customers: Customer[];
  cart: CartItem[];
  onAddToCart: (item: InventoryItem) => void;
  onSetCartQty?: (id: number, qty: number) => void;
  onUpdateCartQty: (id: number, delta: number) => void;
  onRemoveFromCart: (id: number) => void;
  onSaleCompleted: (completed: CompletedSale) => void;
}

export const NewSaleModal: React.FC<NewSaleModalProps> = ({
  isOpen,
  onClose,
  items,
  categories = [],
  customers,
  cart,
  onAddToCart,
  onSetCartQty,
  onUpdateCartQty,
  onRemoveFromCart,
  onSaleCompleted,
}) => {
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("walk-in");
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [discountInput, setDiscountInput] = useState("");
  const [amountPaidInput, setAmountPaidInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = useMemo(
    () => cart.reduce((acc, c) => acc + c.item.price * c.quantity, 0),
    [cart]
  );
  const discount = parseInt(discountInput, 10) || 0;
  const totalAmount = Math.max(0, subtotal - discount);
  const rawTendered = amountPaidInput !== "" ? parseInt(amountPaidInput, 10) || 0 : totalAmount;
  const paidAmount = Math.max(0, Math.min(totalAmount, rawTendered));
  const changeDue = Math.max(0, rawTendered - totalAmount);
  const balanceDue = Math.max(0, totalAmount - paidAmount);
  const paymentStatus: PaymentStatus =
    totalAmount === 0 || paidAmount >= totalAmount ? "PAID" : paidAmount > 0 ? "PARTIAL" : "UNPAID";

  const handleSelectCustomer = (val: string) => {
    setSelectedCustomerId(val);
    if (val === "walk-in") {
      setCustomerName("Walk-in Customer");
      setCustomerPhone("");
    } else {
      const found = customers.find((c) => String(c.id) === val);
      if (found) {
        setCustomerName(found.name);
        setCustomerPhone(found.phone);
      }
    }
  };

  const handleCheckout = useCallback(async () => {
    if (cart.length === 0 || isProcessing) return;
    setIsProcessing(true);
    try {
      const invNo = await createSaleTransaction({
        customerId: selectedCustomerId !== "walk-in" ? Number(selectedCustomerId) : undefined,
        customerName,
        customerPhone,
        items: cart.map((c) => ({
          inventoryId: c.item.id,
          itemName: c.item.name,
          quantity: c.quantity,
          unitPrice: c.item.price,
          costPrice: c.item.costPrice,
        })),
        subtotal,
        discount,
        totalAmount,
        paidAmount,
        paymentMethod,
      });
      onSaleCompleted({
        invoiceNo: invNo,
        customerName,
        totalAmount,
        paidAmount,
        balanceDue,
        paymentStatus,
      });
      onClose();
    } catch (err) {
      console.error("Sale checkout failed:", err);
    } finally {
      setIsProcessing(false);
    }
  }, [
    cart,
    isProcessing,
    selectedCustomerId,
    customerName,
    customerPhone,
    subtotal,
    discount,
    totalAmount,
    paidAmount,
    paymentMethod,
    balanceDue,
    paymentStatus,
    onSaleCompleted,
    onClose,
  ]);

  // Keyboard shortcut Ctrl + Enter to checkout
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleCheckout();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleCheckout]);

  const quickCashOptions = useMemo(() => {
    const list: number[] = [totalAmount];
    [500, 1000, 5000].forEach((den) => {
      if (den > totalAmount && !list.includes(den)) list.push(den);
    });
    if (totalAmount > 1000) {
      const nextThousand = Math.ceil(totalAmount / 1000) * 1000;
      if (!list.includes(nextThousand)) list.push(nextThousand);
      const nextFiveThousand = Math.ceil(totalAmount / 5000) * 5000;
      if (!list.includes(nextFiveThousand)) list.push(nextFiveThousand);
    }
    return list.slice(0, 4);
  }, [totalAmount]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Point of Sale (POS Checkout)"
      description="High-speed hardware counter checkout terminal"
      icon={<ShoppingCart className="size-5 text-brand-500" />}
      size="4xl"
    >
      <div className="space-y-4">
        {/* Customer Header Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800">
          <CustomSelect
            label="Customer Account"
            value={selectedCustomerId}
            onChange={handleSelectCustomer}
            options={[
              { value: "walk-in", label: "Walk-in Customer" },
              ...customers.map((c) => ({ value: String(c.id), label: c.name, sublabel: c.phone })),
            ]}
            searchable
          />
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="tail-input"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Contact Phone
            </label>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+92 300 1234567"
              className="tail-input"
            />
          </div>
        </div>

        {/* Split POS Terminal: Left = Catalog Picker, Right = Cart & Tender */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
          <div className="lg:col-span-7">
            <CatalogPicker
              items={items}
              categories={categories}
              search={catalogSearch}
              onSearchChange={setCatalogSearch}
              onAddToCart={onAddToCart}
            />
          </div>

          <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
            {/* Cart Items List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Cart Items ({cart.reduce((a, b) => a + b.quantity, 0)})
                </span>
                {cart.length > 0 && (
                  <span className="tabular-nums font-bold text-xs text-brand-600 dark:text-brand-400">
                    Subtotal: PKR {subtotal.toLocaleString()}
                  </span>
                )}
              </div>
              <CartItemList
                cart={cart}
                onUpdateQty={onUpdateCartQty}
                onSetQty={onSetCartQty}
                onRemoveItem={onRemoveFromCart}
              />
            </div>

            {/* Tender & Payment Box */}
            <div className="p-4 rounded-2xl bg-gray-50/90 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 space-y-3 text-xs shadow-theme-xs">
              {/* Payment Method Switcher */}
              <div className="grid grid-cols-3 gap-2">
                {([
                  ["CASH", Banknote],
                  ["CARD", CreditCard],
                  ["SPLIT", Split],
                ] as const).map(([pm, Icon]) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setPaymentMethod(pm)}
                    className={`flex items-center justify-center gap-1.5 h-9 font-bold rounded-xl border text-xs transition-all ${
                      paymentMethod === pm
                        ? "border-brand-500 bg-brand-500 text-white shadow-theme-xs"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    <span>{pm}</span>
                  </button>
                ))}
              </div>

              {/* Discount & Cash Tender Fields */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Discount (PKR)
                  </label>
                  <input
                    type="number"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    placeholder="0"
                    className="tail-input tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Amount Tendered (PKR)
                  </label>
                  <input
                    type="number"
                    value={amountPaidInput}
                    onChange={(e) => setAmountPaidInput(e.target.value)}
                    placeholder={totalAmount.toString()}
                    className="tail-input tabular-nums font-bold"
                  />
                </div>
              </div>

              {/* Quick-Cash Tender Chips */}
              {paymentMethod === "CASH" && totalAmount > 0 && (
                <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto pb-0.5 scrollbar-thin">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 shrink-0">
                    Quick:
                  </span>
                  {quickCashOptions.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmountPaidInput(String(amt))}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors shadow-theme-xs shrink-0 tabular-nums"
                    >
                      {amt === totalAmount ? "Exact" : `PKR ${amt.toLocaleString()}`}
                    </button>
                  ))}
                </div>
              )}

              {/* Cash Return / Debt Balance Indicators */}
              {changeDue > 0 && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 font-bold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="size-3.5" />
                    Change Due (Return to Customer):
                  </span>
                  <span className="tabular-nums text-sm font-bold">
                    PKR {changeDue.toLocaleString()}
                  </span>
                </div>
              )}

              {balanceDue > 0 && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 font-bold">
                  <span>Balance Due (Uncollected Dues):</span>
                  <span className="tabular-nums text-sm font-bold">
                    PKR {balanceDue.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Total Row */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Total Payable</span>
                  <span className="font-bold tabular-nums text-gray-900 dark:text-white text-lg leading-tight">
                    PKR {totalAmount.toLocaleString()}
                  </span>
                </div>
                <StatusBadge status={paymentStatus} />
              </div>

              {/* Complete Checkout Action */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={cart.length === 0 || isProcessing}
                className="w-full tail-btn-primary py-2.5 text-sm font-bold shadow-theme-sm flex items-center justify-center gap-2"
              >
                <span>
                  {isProcessing
                    ? "Processing Sale..."
                    : `Complete Sale • PKR ${totalAmount.toLocaleString()}`}
                </span>
                <span className="text-[10px] opacity-70 border border-white/30 px-1.5 py-0.5 rounded font-mono hidden sm:inline-flex items-center gap-0.5">
                  <CornerDownLeft className="size-3" /> Ctrl+↵
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
