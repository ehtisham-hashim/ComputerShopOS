import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Receipt,
  DollarSign,
  Printer,
  AlertCircle,
  Eye,
} from "lucide-react";
import { InventoryItem, PaymentMethod, PaymentStatus, SaleRecord, Customer } from "../db/schema";
import { createSaleTransaction, getRecentSales } from "../db/posService";
import { getCustomers } from "../db/customerService";
import { getStoreSettings, StoreSettings } from "../db/settingsService";
import { Modal } from "../components/ui/Modal";
import { StatCard } from "../components/ui/StatCard";
import { SearchInput } from "../components/ui/SearchInput";
import { CustomSelect } from "../components/ui/Select";

interface SalesPageProps {
  items: InventoryItem[];
  onSaleComplete?: () => Promise<void>;
  initialCartItems?: InventoryItem[];
}

export interface CartItem {
  item: InventoryItem;
  quantity: number;
  selectedSerial?: string;
}

export const SalesPage: React.FC<SalesPageProps> = ({
  items,
  onSaleComplete,
  initialCartItems,
}) => {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(false);

  // New Sale Modal State
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [amountPaidInput, setAmountPaidInput] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // View Invoice Modal State
  const [viewInvoice, setViewInvoice] = useState<SaleRecord | null>(null);
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState<string>("");
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  const fetchSalesData = async (showLoader = false) => {
    try {
      if (showLoader) setIsLoading(true);
      const data = await getRecentSales(100);
      setSales(data);
      const custs = await getCustomers();
      setCustomers(custs);
      const settings = await getStoreSettings();
      setStoreSettings(settings);
    } catch (err) {
      console.error("Failed to load sales:", err);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData(true);
  }, []);

  // Handle external cart transfer (e.g. from Custom PC Builder)
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
      setIsSaleModalOpen(true);
    }
  }, [initialCartItems, items]);

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

  const clearCart = () => {
    setCart([]);
    setAmountPaidInput("");
  };

  const subtotal = cart.reduce((acc, c) => acc + c.item.price * c.quantity, 0);
  const taxAmount = 0.0;
  const grandTotal = subtotal;

  // Auto-calculated payment status
  const effectivePaidAmount = amountPaidInput === "" ? grandTotal : parseFloat(amountPaidInput) || 0;
  const balanceDue = Math.max(0, grandTotal - effectivePaidAmount);

  let calculatedPaymentStatus: PaymentStatus = "PAID";
  if (effectivePaidAmount <= 0) {
    calculatedPaymentStatus = "UNPAID";
  } else if (effectivePaidAmount < grandTotal) {
    calculatedPaymentStatus = "PARTIAL";
  }

  const handleCheckout = async () => {
    if (cart.length === 0 || isProcessing) return;

    try {
      setIsProcessing(true);
      const invNum = await createSaleTransaction({
        customerId: selectedCustomerId && selectedCustomerId !== "walk-in" ? Number(selectedCustomerId) : undefined,
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
        discount: 0,
        tax: taxAmount,
        totalAmount: grandTotal,
        paidAmount: effectivePaidAmount,
        paymentMethod,
      });

      setLastInvoiceNumber(invNum);
      setIsSaleModalOpen(false);
      setIsReceiptOpen(true);
      await fetchSalesData();
      if (onSaleComplete) await onSaleComplete();
      clearCart();
    } catch (err) {
      console.error("Failed to checkout sale:", err);
      alert("Failed to process transaction in SQLite database.");
    } finally {
      setIsProcessing(false);
    }
  };

  const currency = storeSettings?.currencySymbol || "$";

  const filteredCatalog = items.filter(
    (i) =>
      i.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      i.sku.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.customerPhone && s.customerPhone.includes(searchQuery));
    const matchesStatus = statusFilter === "ALL" || s.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalSalesRevenue = sales.reduce((acc, s) => acc + (s.paidAmount || s.totalAmount), 0);
  const totalOutstandingBalance = sales.reduce((acc, s) => acc + (s.balanceDue || 0), 0);

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case "PAID":
        return "bg-success-50 text-success-600 border-success-200 dark:bg-success-500/15 dark:text-success-400 dark:border-success-500/20";
      case "PARTIAL":
        return "bg-warning-50 text-warning-600 border-warning-200 dark:bg-warning-500/15 dark:text-warning-400 dark:border-warning-500/20";
      case "UNPAID":
        return "bg-error-50 text-error-600 border-error-200 dark:bg-error-500/15 dark:text-error-400 dark:border-error-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Top-Right Action */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="size-6 text-brand-500" />
            Sales & Invoices
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            View past sales transactions, track payment balances (Paid, Partial, Unpaid), and create new sales
          </p>
        </div>

        <button
          onClick={() => {
            clearCart();
            setIsSaleModalOpen(true);
          }}
          className="tail-btn-primary"
        >
          <Plus className="size-4" />
          <span>New Sale (F2)</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Collected Revenue"
          value={`${currency}${totalSalesRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          valueColor="success"
          icon={<DollarSign className="size-5" />}
        />
        <StatCard
          title="Total Invoices Recorded"
          value={sales.length}
          valueColor="brand"
          icon={<Receipt className="size-5" />}
        />
        <StatCard
          title="Outstanding Receivable"
          value={`${currency}${totalOutstandingBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          valueColor={totalOutstandingBalance > 0 ? "warning" : "default"}
          icon={<AlertCircle className="size-5" />}
          subtitle={totalOutstandingBalance > 0 ? "Unsettled customer balance" : "All balances settled"}
        />
      </div>

      {/* Search Bar & Status Filter Pills */}
      <div className="tail-card p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search invoice #, customer name, or phone number..."
            className="flex-1 max-w-md"
          />

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {["ALL", "PAID", "PARTIAL", "UNPAID"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-3 py-1.5 font-semibold transition-colors shrink-0 ${
                  statusFilter === st
                    ? "bg-brand-600 text-white shadow-theme-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {st === "ALL" ? `All Invoices (${sales.length})` : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="tail-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm whitespace-nowrap">
            <thead className="border-b border-gray-200 bg-gray-50/60 text-xs font-semibold uppercase text-gray-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-400">
              <tr>
                <th className="py-3.5 px-5">Invoice #</th>
                <th className="py-3.5 px-5">Customer</th>
                <th className="py-3.5 px-5">Payment Method</th>
                <th className="py-3.5 px-5">Total Amount</th>
                <th className="py-3.5 px-5">Amount Paid</th>
                <th className="py-3.5 px-5">Balance Due</th>
                <th className="py-3.5 px-5">Payment Status</th>
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400 text-xs">
                    Loading sales records...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400 text-xs">
                    No sales invoices found. Click "New Sale" above to create one.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3.5 px-5 font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                      {s.invoiceNo}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className="font-bold text-gray-900 dark:text-white max-w-[140px] truncate block"
                        title={s.customerName}
                      >
                        {s.customerName}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-xs">
                      <span className="rounded-lg bg-gray-100 px-2 py-0.5 font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {s.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-gray-900 dark:text-white">
                      {currency}{s.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-success-600 dark:text-success-400">
                      {currency}{(s.paidAmount || s.totalAmount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs font-bold text-error-600 dark:text-error-400">
                      {(s.balanceDue || 0) > 0 ? `${currency}${(s.balanceDue || 0).toFixed(2)}` : "—"}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`border px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(
                          s.paymentStatus || "PAID"
                        )}`}
                      >
                        {s.paymentStatus || "PAID"}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-gray-400">
                      {new Date(s.createdAt * 1000).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setViewInvoice(s)}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/15 dark:hover:text-brand-400 transition-colors"
                        title="View & Print Invoice"
                      >
                        <Eye className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Sale Modal Dialog */}
      <Modal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        title="Create New Sale Transaction"
        subtitle="Select hardware items, customer account, payment method, and amount tendered"
        icon={<ShoppingCart className="size-5 text-brand-500" />}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {/* Customer Selection */}
          <div className="space-y-2">
            <CustomSelect
              label="Customer Account"
              value={selectedCustomerId || "walk-in"}
              onChange={handleSelectCustomer}
              searchable
              options={[
                { value: "walk-in", label: "Walk-in Customer (General Public)" },
                ...customers.map((c) => ({
                  value: String(c.id),
                  label: c.name,
                  sublabel: c.phone,
                })),
              ]}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">
                  Customer Name
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
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+1..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="tail-input py-1.5 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Product Catalog Picker */}
          <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-800/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                Add Products to Cart
              </span>
              <span className="text-[11px] text-gray-400">
                {items.length} items in stock
              </span>
            </div>

            <SearchInput
              value={catalogSearch}
              onChange={setCatalogSearch}
              placeholder="Search product name or SKU..."
            />

            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {filteredCatalog.slice(0, 8).map((product) => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 cursor-pointer hover:border-brand-500 transition-all text-xs"
                >
                  <div className="flex flex-col truncate pr-2">
                    <span className="font-semibold text-gray-900 dark:text-white truncate">
                      {product.name}
                    </span>
                    <span className="font-mono text-[10px] text-gray-400">
                      {product.sku} • {product.quantity} in stock
                    </span>
                  </div>

                  <span className="font-bold text-brand-600 dark:text-brand-400 shrink-0">
                    +{currency}{product.price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Cart Items */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-900 dark:text-white">
              Selected Line Items ({cart.reduce((a, c) => a + c.quantity, 0)})
            </span>

            {cart.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                No items added. Click products above to add to this sale.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {cart.map((cartItem) => (
                  <div
                    key={cartItem.item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 text-xs"
                  >
                    <span className="font-semibold text-gray-900 dark:text-white truncate pr-2">
                      {cartItem.item.name}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800">
                        <button
                          type="button"
                          onClick={() => updateQuantity(cartItem.item.id, -1)}
                          className="size-5 flex items-center justify-center text-xs font-bold rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-4 text-center text-xs font-bold">
                          {cartItem.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(cartItem.item.id, 1)}
                          className="size-5 flex items-center justify-center text-xs font-bold rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>

                      <span className="w-14 text-right font-bold">
                        {currency}{(cartItem.item.price * cartItem.quantity).toFixed(2)}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeFromCart(cartItem.item.id)}
                        className="text-gray-400 hover:text-error-500"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment & Status Calculation */}
          <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-800/40 space-y-3">
            {/* Method Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`py-2 text-xs font-bold rounded-xl border transition-colors ${
                  paymentMethod === "CASH"
                    ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                    : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300"
                }`}
              >
                Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("CARD")}
                className={`py-2 text-xs font-bold rounded-xl border transition-colors ${
                  paymentMethod === "CARD"
                    ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                    : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300"
                }`}
              >
                Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("SPLIT")}
                className={`py-2 text-xs font-bold rounded-xl border transition-colors ${
                  paymentMethod === "SPLIT"
                    ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                    : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300"
                }`}
              >
                Split
              </button>
            </div>

            {/* Amount Tendered vs Auto Calculated Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">
                  Amount Paid / Tendered ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={grandTotal.toFixed(2)}
                  value={amountPaidInput}
                  onChange={(e) => setAmountPaidInput(e.target.value)}
                  className="tail-input text-xs font-bold"
                />
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  Auto-Computed Payment Status
                </span>
                <span
                  className={`mt-1 inline-flex w-max items-center border px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(
                    calculatedPaymentStatus
                  )}`}
                >
                  {calculatedPaymentStatus}
                </span>
              </div>
            </div>

            {/* Balance Due Notification */}
            {balanceDue > 0 && (
              <div className="flex justify-between text-xs font-bold text-error-600 dark:text-error-400 pt-1 border-t border-gray-200 dark:border-gray-700">
                <span>Remaining Customer Balance Due:</span>
                <span>{currency}{balanceDue.toFixed(2)}</span>
              </div>
            )}

            {/* Totals */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700 font-bold text-sm">
              <span>Grand Total</span>
              <span className="text-base text-brand-600 dark:text-brand-400">
                {currency}{grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setIsSaleModalOpen(false)}
              className="tail-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
              className="tail-btn-primary"
            >
              {isProcessing ? "Processing..." : `Record Sale (${calculatedPaymentStatus})`}
            </button>
          </div>
        </div>
      </Modal>

      {/* Invoice Details / Print Receipt Modal */}
      <Modal
        isOpen={Boolean(viewInvoice) || isReceiptOpen}
        onClose={() => {
          setViewInvoice(null);
          setIsReceiptOpen(false);
        }}
        title="Sale Invoice"
        subtitle={`Invoice #${viewInvoice?.invoiceNo || lastInvoiceNumber}`}
        icon={<Receipt className="size-5 text-brand-500" />}
      >
        <div className="my-2 p-4 rounded-xl border border-gray-200 bg-gray-50 font-mono text-xs text-gray-800 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-200">
          <div className="text-center pb-3 border-b border-dashed border-gray-300 dark:border-gray-700">
            <p className="font-bold text-sm">{storeSettings?.storeName || "ComputerShopOS Store"}</p>
            <p className="text-[10px] text-gray-500">{storeSettings?.storeAddress}</p>
            <p className="text-[10px] text-gray-500">Tel: {storeSettings?.storePhone}</p>
            <p className="text-[10px] text-gray-500 font-bold mt-1">Invoice #{viewInvoice?.invoiceNo || lastInvoiceNumber}</p>
            <p className="text-[10px] text-gray-500">Customer: {viewInvoice?.customerName || customerName}</p>
          </div>

          <div className="py-3 space-y-1.5 border-b border-dashed border-gray-300 dark:border-gray-700">
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL INVOICE</span>
              <span>{currency}{(viewInvoice?.totalAmount || grandTotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-success-600 dark:text-success-400">
              <span>Amount Paid</span>
              <span>{currency}{(viewInvoice?.paidAmount || effectivePaidAmount).toFixed(2)}</span>
            </div>
            {(viewInvoice?.balanceDue || balanceDue) > 0 && (
              <div className="flex justify-between text-xs text-error-600 dark:text-error-400 font-bold">
                <span>Balance Due</span>
                <span>{currency}{(viewInvoice?.balanceDue || balanceDue).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-[11px] pt-1">
              <span>Status</span>
              <span className="font-bold">{viewInvoice?.paymentStatus || calculatedPaymentStatus}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 mt-4">
          <button onClick={() => window.print()} className="flex-1 tail-btn-primary">
            <Printer className="size-4" />
            <span>Print Invoice</span>
          </button>
          <button
            onClick={() => {
              setViewInvoice(null);
              setIsReceiptOpen(false);
            }}
            className="tail-btn-secondary"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};
