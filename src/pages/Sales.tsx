import React, { useState, useEffect } from "react";
import { ShoppingCart, Plus } from "lucide-react";
import { InventoryItem, SaleRecord, Customer, SaleLineItem } from "../db/schema";
import { getRecentSales, deleteSale, getAllSaleItems } from "../db/posService";
import { getCustomers } from "../db/customerService";
import { getStoreSettings, StoreSettings } from "../db/settingsService";
import { PageHeader } from "../components/ui/PageHeader";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { SalesStats } from "../components/sales/SalesStats";
import { SalesTable } from "../components/sales/SalesTable";
import { NewSaleModal } from "../components/sales/NewSaleModal";
import { InvoiceInspectModal } from "../components/sales/InvoiceInspectModal";
import { ReceiptModal } from "../components/sales/ReceiptModal";
import { PaymentProc } from "../components/sales/PaymentProc";
import { CompletedSale } from "../components/sales/types";
import { useSalesCart } from "../components/sales/useSalesCart";

interface SalesPageProps {
  items: InventoryItem[];
  onSaleComplete?: () => Promise<void>;
  initialCartItems?: InventoryItem[];
}

export const SalesPage: React.FC<SalesPageProps> = ({ items, onSaleComplete, initialCartItems }) => {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [saleItems, setSaleItems] = useState<SaleLineItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<SaleRecord | null>(null);
  const [receiptSale, setReceiptSale] = useState<SaleRecord | null>(null);
  const [paymentSale, setPaymentSale] = useState<SaleRecord | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { cart, isSaleModalOpen, setIsSaleModalOpen, addToCart, updateCartQty, removeFromCart, clearCart } =
    useSalesCart(items, initialCartItems);

  const fetchSalesData = async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const [s, its, c, cfg] = await Promise.all([getRecentSales(100), getAllSaleItems(), getCustomers(), getStoreSettings()]);
      setSales(s);
      setSaleItems(its);
      setCustomers(c);
      setStoreSettings(cfg);
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchSalesData(true); }, []);

  const handleConfirmDelete = async () => {
    if (deleteTargetId === null) return;
    setIsDeleting(true);
    try {
      await deleteSale(deleteTargetId);
      await fetchSalesData();
      if (onSaleComplete) await onSaleComplete();
      setDeleteTargetId(null);
    } catch (err) { console.error(err); } finally { setIsDeleting(false); }
  };

  const handleSaleCompleted = async (completed: CompletedSale) => {
    clearCart();
    await fetchSalesData();
    if (onSaleComplete) await onSaleComplete();
    const created = sales.find((s) => s.invoiceNo === completed.invoiceNo);
    if (created) setReceiptSale(created);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Sales & Point of Sale" subtitle="Manage checkout, customer invoices, and thermal receipts" icon={ShoppingCart}>
        <button onClick={() => { clearCart(); setIsSaleModalOpen(true); }} className="tail-btn-primary text-xs"><Plus className="size-4" /><span>New Sale (F2)</span></button>
      </PageHeader>
      <SalesStats sales={sales} />
      <SalesTable
        sales={sales} saleItems={saleItems} searchQuery={searchQuery} onSearchChange={setSearchQuery}
        statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} isLoading={isLoading}
        onViewInvoice={setViewInvoice} onPrintReceipt={setReceiptSale} onDeleteSale={async (id) => setDeleteTargetId(id)}
        onCollectPayment={(s) => setPaymentSale(s)}
      />
      <NewSaleModal
        isOpen={isSaleModalOpen} onClose={() => setIsSaleModalOpen(false)} items={items} customers={customers}
        cart={cart} onAddToCart={addToCart} onUpdateCartQty={updateCartQty} onRemoveFromCart={removeFromCart} onSaleCompleted={handleSaleCompleted}
      />
      <InvoiceInspectModal sale={viewInvoice} onClose={() => setViewInvoice(null)} onPrintReceipt={(s) => { setViewInvoice(null); setReceiptSale(s); }} />
      <ReceiptModal sale={receiptSale} storeSettings={storeSettings} onClose={() => setReceiptSale(null)} />
      <PaymentProc sale={paymentSale} onClose={() => setPaymentSale(null)} onSuccess={fetchSalesData} />
      <ConfirmModal
        isOpen={deleteTargetId !== null} onClose={() => setDeleteTargetId(null)} onConfirm={handleConfirmDelete}
        title="Void Sales Invoice" message="Are you sure you want to delete this invoice? The items will be returned to stock."
        confirmText="Void Invoice" isLoading={isDeleting}
      />
    </div>
  );
};
