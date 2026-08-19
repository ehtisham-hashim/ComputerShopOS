import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Trash2,
  Receipt,
  Plus,
  Minus,
  CreditCard,
  DollarSign,
  CheckCircle2,
  Printer,
  User,
} from "lucide-react";
import { InventoryItem, PaymentMethod } from "../db/schema";
import { createSaleTransaction } from "../db/posService";
import { getStoreSettings, StoreSettings } from "../db/settingsService";
import { Modal } from "../components/ui/Modal";
import { SearchInput } from "../components/ui/SearchInput";

interface POSPageProps {
  items: InventoryItem[];
  onSaleComplete?: () => Promise<void>;
  initialCartItems?: InventoryItem[];
}

export interface CartItem {
  item: InventoryItem;
  quantity: number;
  selectedSerial?: string;
}

export const POSPage: React.FC<POSPageProps> = ({
  items,
  onSaleComplete,
  initialCartItems,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    getStoreSettings().then(setStoreSettings);
  }, []);

  useEffect(() => {
    if (initialCartItems && initialCartItems.length > 0) {
      const initialMap: Record<number, number> = {};
      initialCartItems.forEach((it) => {
        initialMap[it.id] = (initialMap[it.id] || 0) + 1;
      });

      const newCart: CartItem[] = Object.entries(initialMap).map(([id, qty]) => {
        const product = items.find((i) => i.id === Number(id)) || initialCartItems.find((i) => i.id === Number(id))!;
        return { item: product, quantity: qty };
      });

      setCart(newCart);
    }
  }, [initialCartItems, items]);

  const filteredCatalog = items.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: InventoryItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === product.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { item: product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.item.id === productId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((c) => c.item.id !== productId));
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((acc, c) => acc + c.item.price * c.quantity, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxRate = parseFloat(storeSettings?.taxRate || "5.0") / 100;
  const taxAmount = (subtotal - discountAmount) * taxRate;
  const grandTotal = subtotal - discountAmount + taxAmount;

  const handleCheckout = async () => {
    if (cart.length === 0 || isProcessing) return;

    try {
      setIsProcessing(true);
      const invNum = await createSaleTransaction({
        customerName,
        customerPhone,
        items: cart.map((c) => ({
          inventoryId: c.item.id,
          itemName: c.item.name,
          serialNumber: c.selectedSerial,
          quantity: c.quantity,
          unitPrice: c.item.price,
        })),
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        totalAmount: grandTotal,
        paymentMethod,
      });

      setLastInvoiceNumber(invNum);
      setIsReceiptOpen(true);
      if (onSaleComplete) await onSaleComplete();
    } catch (err) {
      console.error("Failed to checkout sale:", err);
      alert("Failed to process transaction in SQLite database.");
    } finally {
      setIsProcessing(false);
    }
  };

  const currency = storeSettings?.currencySymbol || "$";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="size-6 text-brand-500" />
            Point of Sale (POS)
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Rapid retail checkout, barcode scanning, and invoice printing
          </p>
        </div>

        <button
          onClick={clearCart}
          disabled={cart.length === 0}
          className="tail-btn-secondary text-xs"
        >
          Clear Cart
        </button>
      </div>

      {/* Main 2-Column Split: Catalog (Left) + Cart & Checkout (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Product Catalog & Fast Search (7 Cols) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="tail-card p-4">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Scan barcode or type hardware name / SKU..."
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filteredCatalog.map((product) => (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className="tail-card p-4 cursor-pointer hover:border-brand-400 hover:shadow-theme-sm transition-all group active:scale-[0.98]"
              >
                <div className="flex items-start justify-between">
                  <span className="rounded bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                    {product.title}
                  </span>
                  <span className="font-mono text-xs text-gray-400">{product.sku}</span>
                </div>

                <h4 className="font-semibold text-sm text-gray-900 dark:text-white mt-2 group-hover:text-brand-500 transition-colors line-clamp-1">
                  {product.name}
                </h4>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="font-bold text-base text-gray-900 dark:text-white">
                    {currency}{product.price.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {product.quantity} in stock
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Active Cart & Tender Panel (5 Cols) */}
        <div className="space-y-4 lg:col-span-5">
          <div className="tail-card flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="size-4 text-brand-500" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  Active Cart ({cart.reduce((a, c) => a + c.quantity, 0)} items)
                </h3>
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-2 pt-3 pb-2 border-b border-gray-100 dark:border-gray-800">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1 flex items-center gap-1">
                  <User className="size-3" /> Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="tail-input py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="text"
                  placeholder="+1..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="tail-input py-1.5 text-xs"
                />
              </div>
            </div>

            {/* Cart Line Items */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2 min-h-[200px] max-h-[320px]">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
                  <ShoppingCart className="size-8 mb-2 opacity-40" />
                  <p className="text-xs font-semibold">Cart is empty</p>
                  <span className="text-[11px]">Click items on the left or scan barcode to add.</span>
                </div>
              ) : (
                cart.map((cartItem) => (
                  <div
                    key={cartItem.item.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-800/40"
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="font-bold text-xs text-gray-900 dark:text-white truncate">
                        {cartItem.item.name}
                      </span>
                      <span className="font-mono text-[11px] text-gray-400">
                        {currency}{cartItem.item.price.toFixed(2)} each
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-0.5 dark:border-gray-700 dark:bg-gray-800">
                        <button
                          onClick={() => updateQuantity(cartItem.item.id, -1)}
                          className="size-6 flex items-center justify-center text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold">
                          {cartItem.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(cartItem.item.id, 1)}
                          className="size-6 flex items-center justify-center text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>

                      <span className="w-16 text-right font-bold text-xs text-gray-900 dark:text-white">
                        {currency}{(cartItem.item.price * cartItem.quantity).toFixed(2)}
                      </span>

                      <button
                        onClick={() => removeFromCart(cartItem.item.id)}
                        className="text-gray-400 hover:text-error-500 p-1"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Checkout */}
            <div className="border-t border-gray-100 pt-3 dark:border-gray-800 space-y-2.5">
              {/* Payment Method Selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod("CASH")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold border transition-colors ${
                    paymentMethod === "CASH"
                      ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                      : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  <DollarSign className="size-3.5" /> Cash
                </button>
                <button
                  onClick={() => setPaymentMethod("CARD")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold border transition-colors ${
                    paymentMethod === "CARD"
                      ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                      : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  <CreditCard className="size-3.5" /> Card
                </button>
                <button
                  onClick={() => setPaymentMethod("SPLIT")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold border transition-colors ${
                    paymentMethod === "SPLIT"
                      ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                      : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  Split
                </button>
              </div>

              {/* Summary Breakdown */}
              <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {currency}{subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({storeSettings?.taxRate || "5.0"}%)</span>
                  <span>{currency}{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span>Grand Total</span>
                  <span className="text-base text-brand-500 dark:text-brand-400">
                    {currency}{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || isProcessing}
                className="w-full tail-btn-primary py-3 text-base font-bold shadow-theme-md"
              >
                <Receipt className="size-5" />
                <span>{isProcessing ? "Processing..." : "Complete Sale (F10)"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice / Receipt Preview Modal */}
      <Modal
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          clearCart();
        }}
        title="Sale Recorded in SQLite"
        icon={<CheckCircle2 className="size-5 text-success-500" />}
      >
        <div className="my-2 p-4 rounded-xl border border-gray-200 bg-gray-50 font-mono text-xs text-gray-800 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-200">
          <div className="text-center pb-3 border-b border-dashed border-gray-300 dark:border-gray-700">
            <p className="font-bold text-sm">{storeSettings?.storeName || "ComputerShopOS Store"}</p>
            <p className="text-[10px] text-gray-500">{storeSettings?.storeAddress}</p>
            <p className="text-[10px] text-gray-500">Tel: {storeSettings?.storePhone}</p>
            <p className="text-[10px] text-gray-500 font-bold mt-1">Invoice #{lastInvoiceNumber}</p>
            <p className="text-[10px] text-gray-500">Customer: {customerName}</p>
            <p className="text-[10px] text-gray-500">{new Date().toLocaleString()}</p>
          </div>

          <div className="py-3 space-y-1.5 border-b border-dashed border-gray-300 dark:border-gray-700">
            {cart.map((c) => (
              <div key={c.item.id} className="flex justify-between">
                <span>
                  {c.quantity}x {c.item.name}
                </span>
                <span>{currency}{(c.item.price * c.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 space-y-1">
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL PAID ({paymentMethod})</span>
              <span>{currency}{grandTotal.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-gray-500 text-center pt-2">
              Thank you for shopping at ComputerShopOS!
            </p>
          </div>
        </div>

        <div className="flex gap-2.5 mt-4">
          <button onClick={() => window.print()} className="flex-1 tail-btn-primary">
            <Printer className="size-4" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={() => {
              setIsReceiptOpen(false);
              clearCart();
            }}
            className="tail-btn-secondary"
          >
            Done
          </button>
        </div>
      </Modal>
    </div>
  );
};
