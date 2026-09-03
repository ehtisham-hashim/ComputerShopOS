import React, { useState, useEffect, useMemo } from "react";
import { ShoppingCart, Plus, Coins, Receipt } from "lucide-react";
import { InventoryItem, SaleRecord, Customer, SaleLineItem } from "../db/schema";
import { getRecentSales, deleteSale, getAllSaleItems } from "../db/posService";
import { getCustomers } from "../db/customerService";
import { getStoreSettings, StoreSettings } from "../db/settingsService";
import { PageHeader } from "../components/ui/PageHeader";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { SalesStats } from "../components/sales/SalesStats";
import { SalesTable } from "../components/sales/SalesTable";
import { ReceivablesTable } from "../components/sales/ReceivablesTable";
import { NewSaleModal } from "../components/sales/NewSaleModal";
import { AddManualReceivableModal } from "../components/sales/AddManualReceivableModal";
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
  const [activeSubTab, setActiveSubTab] = useState<"invoices" | "receivables">("invoices");
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
  const [isManualReceivableOpen, setIsManualReceivableOpen] = useState(false);

  const { cart, isSaleModalOpen, setIsSaleModalOpen, addToCart, updateCartQty, removeFromCart, clearCart } =
    useSalesCart(items, initialCartItems);

  const fetchSalesData = async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const [s, its, c, cfg] = await Promise.all([getRecentSales(500), getAllSaleItems(), getCustomers(), getStoreSettings()]);
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

  const posInvoices = useMemo(() => sales.filter((s) => !s.invoiceNo.startsWith("RCV-")), [sales]);
  const outstandingDuesCount = sales.filter((s) => s.balanceDue > 0 || s.isBadDebt === 1).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales & Point of Sale"
        subtitle="Manage checkout, customer invoices, and thermal receipts"
        icon={ShoppingCart}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsManualReceivableOpen(true)}
            className="tail-btn-secondary text-xs flex items-center gap-1.5 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700/50 hover:bg-amber-50 dark:hover:bg-amber-950/20"
          >
            <Plus className="size-3.5" />
            <span>Record Receivable</span>
          </button>
          <button
            onClick={() => { clearCart(); setIsSaleModalOpen(true); }}
            className="tail-btn-primary text-xs flex items-center gap-1.5"
          >
            <Plus className="size-4" />
            <span>New Sale (F2)</span>
          </button>
        </div>
      </PageHeader>

      {/* Sub-tab navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-6">
        <button
          onClick={() => setActiveSubTab("invoices")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 transition-all relative ${
            activeSubTab === "invoices"
              ? "text-brand-600 dark:text-brand-400 border-b-2 border-brand-500"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          <Receipt className="size-4" />
          <span>Invoices & Point of Sale</span>
          <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-semibold">
            {posInvoices.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("receivables")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 transition-all relative ${
            activeSubTab === "receivables"
              ? "text-brand-600 dark:text-brand-400 border-b-2 border-brand-500"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          <Coins className="size-4" />
          <span>Outstanding Receivables & Dues</span>
          {outstandingDuesCount > 0 && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
              {outstandingDuesCount}
            </span>
          )}
        </button>
      </div>

      {activeSubTab === "invoices" ? (
        <>
          <SalesStats sales={posInvoices} />
          <SalesTable
            sales={posInvoices}
            saleItems={saleItems}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            isLoading={isLoading}
            onViewInvoice={setViewInvoice}
            onPrintReceipt={setReceiptSale}
            onDeleteSale={async (id) => setDeleteTargetId(id)}
            onCollectPayment={(s) => setPaymentSale(s)}
          />
        </>
      ) : (
        <ReceivablesTable
          sales={sales}
          isLoading={isLoading}
          onViewInvoice={setViewInvoice}
          onCollectPayment={(s) => setPaymentSale(s)}
          onDeleteSale={async (id) => setDeleteTargetId(id)}
          onRefresh={fetchSalesData}
          onOpenAddReceivable={() => setIsManualReceivableOpen(true)}
        />
      )}

      <NewSaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        items={items}
        customers={customers}
        cart={cart}
        onAddToCart={addToCart}
        onUpdateCartQty={updateCartQty}
        onRemoveFromCart={removeFromCart}
        onSaleCompleted={handleSaleCompleted}
      />

      <AddManualReceivableModal
        isOpen={isManualReceivableOpen}
        onClose={() => setIsManualReceivableOpen(false)}
        onSuccess={fetchSalesData}
      />

      <InvoiceInspectModal
        sale={viewInvoice}
        onClose={() => setViewInvoice(null)}
        onPrintReceipt={(s) => {
          setViewInvoice(null);
          setReceiptSale(s);
        }}
      />

      <ReceiptModal
        sale={receiptSale}
        storeSettings={storeSettings}
        onClose={() => setReceiptSale(null)}
      />

      <PaymentProc
        sale={paymentSale}
        onClose={() => setPaymentSale(null)}
        onSuccess={fetchSalesData}
      />

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Void Sales Invoice"
        message="Are you sure you want to delete this invoice? The items will be returned to stock."
        confirmText="Void Invoice"
        isLoading={isDeleting}
      />
    </div>
  );
};
