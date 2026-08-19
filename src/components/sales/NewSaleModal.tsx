import React, { useState, useMemo } from "react";
import { ShoppingCart, CreditCard, Banknote, Split } from "lucide-react";
import { InventoryItem, Customer, PaymentMethod, PaymentStatus } from "../../db/schema";
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
  customers: Customer[];
  cart: CartItem[];
  onAddToCart: (item: InventoryItem) => void;
  onUpdateCartQty: (id: number, delta: number) => void;
  onRemoveFromCart: (id: number) => void;
  onSaleCompleted: (completed: CompletedSale) => void;
}

export const NewSaleModal: React.FC<NewSaleModalProps> = ({
  isOpen, onClose, items, customers, cart, onAddToCart, onUpdateCartQty, onRemoveFromCart, onSaleCompleted,
}) => {
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("walk-in");
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [discountInput, setDiscountInput] = useState("");
  const [amountPaidInput, setAmountPaidInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = useMemo(() => cart.reduce((acc, c) => acc + c.item.price * c.quantity, 0), [cart]);
  const discount = parseInt(discountInput, 10) || 0;
  const totalAmount = Math.max(0, subtotal - discount);
  const paidAmount = amountPaidInput !== "" ? parseInt(amountPaidInput, 10) || 0 : totalAmount;
  const balanceDue = Math.max(0, totalAmount - paidAmount);
  const paymentStatus: PaymentStatus = totalAmount === 0 || paidAmount >= totalAmount ? "PAID" : paidAmount > 0 ? "PARTIAL" : "UNPAID";

  const handleSelectCustomer = (val: string) => {
    setSelectedCustomerId(val);
    if (val === "walk-in") { setCustomerName("Walk-in Customer"); setCustomerPhone(""); }
    else { const found = customers.find((c) => String(c.id) === val); if (found) { setCustomerName(found.name); setCustomerPhone(found.phone); } }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const invNo = await createSaleTransaction({
        customerId: selectedCustomerId !== "walk-in" ? Number(selectedCustomerId) : undefined, customerName, customerPhone,
        items: cart.map((c) => ({ inventoryId: c.item.id, itemName: c.item.name, quantity: c.quantity, unitPrice: c.item.price })),
        subtotal, discount, totalAmount, paidAmount, paymentMethod,
      });
      onSaleCompleted({ invoiceNo: invNo, customerName, totalAmount, paidAmount, balanceDue, paymentStatus });
      onClose();
    } catch (err) { console.error(err); } finally { setIsProcessing(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Point of Sale (POS Checkout)" description="Select hardware items, assign customer, and tender invoice" icon={<ShoppingCart className="size-5 text-brand-500" />} size="4xl">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
          <CustomSelect label="Select Customer" value={selectedCustomerId} onChange={handleSelectCustomer} options={[{ value: "walk-in", label: "Walk-in Customer" }, ...customers.map((c) => ({ value: String(c.id), label: c.name, sublabel: c.phone }))]} searchable />
          <div><label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">Customer Name</label><input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="tail-input" /></div>
          <div><label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">Phone Number</label><input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+92 300 1234567" className="tail-input" /></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
          <div className="lg:col-span-7"><CatalogPicker items={items} search={catalogSearch} onSearchChange={setCatalogSearch} onAddToCart={onAddToCart} /></div>

          <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-gray-500">Cart Items ({cart.reduce((a, b) => a + b.quantity, 0)})</span>{cart.length > 0 && <span className="font-mono text-xs font-bold text-brand-500">PKR {subtotal.toLocaleString()}</span>}</div>
              <CartItemList cart={cart} onUpdateQty={onUpdateCartQty} onRemoveItem={onRemoveFromCart} onSelectSerial={() => {}} />
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/60 space-y-2.5 text-xs shadow-theme-xs">
              <div className="grid grid-cols-3 gap-2">
                {([["CASH", Banknote], ["CARD", CreditCard], ["SPLIT", Split]] as const).map(([pm, Icon]) => (
                  <button key={pm} type="button" onClick={() => setPaymentMethod(pm)} className={`flex items-center justify-center gap-1.5 py-2 font-bold rounded-xl border transition-all ${paymentMethod === pm ? "border-brand-500 bg-brand-500 text-white shadow-theme-xs" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}><Icon className="size-3.5" /><span>{pm}</span></button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[10px] font-bold text-gray-500 mb-0.5">Discount (PKR)</label><input type="number" value={discountInput} onChange={(e) => setDiscountInput(e.target.value)} placeholder="0" className="tail-input" /></div>
                <div><label className="block text-[10px] font-bold text-gray-500 mb-0.5">Amount Tendered (PKR)</label><input type="number" value={amountPaidInput} onChange={(e) => setAmountPaidInput(e.target.value)} placeholder={totalAmount.toString()} className="tail-input font-bold" /></div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700"><span className="font-bold text-gray-900 dark:text-white text-base">Total: PKR {totalAmount.toLocaleString()}</span><StatusBadge status={paymentStatus} /></div>
              <button onClick={handleCheckout} disabled={cart.length === 0 || isProcessing} className="w-full tail-btn-primary py-2.5 text-sm font-bold shadow-theme-sm">{isProcessing ? "Processing Sale..." : `Complete Sale • PKR ${totalAmount.toLocaleString()}`}</button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
