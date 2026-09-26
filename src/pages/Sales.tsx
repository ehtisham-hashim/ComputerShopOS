import React, { useState, useEffect } from "react";
import { ShoppingCart, Plus } from "lucide-react";
import { InventoryItem, SaleRecord, Customer, CategoryRecord } from "../db/schema";
import { getRecentSales, deleteSale, toggleSaleBadDebt } from "../db/posService";
import { getCustomers } from "../db/customerService";
import { getStoreSettings, StoreSettings } from "../db/settingsService";
import { PageHeader } from "../components/ui/PageHeader";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { SalesStats } from "../components/sales/SalesStats";
import { SalesTable } from "../components/sales/SalesTable";
import { NewSaleModal } from "../components/sales/NewSaleModal";
import { AddManualReceivableModal } from "../components/sales/AddManualReceivableModal";
import { InvoiceInspectModal } from "../components/sales/InvoiceInspectModal";
import { ReceiptModal } from "../components/sales/ReceiptModal";
import { PaymentProc } from "../components/sales/PaymentProc";
import { CompletedSale } from "../components/sales/types";
import { useSalesCart } from "../components/sales/useSalesCart";

interface SalesPageProps {
  items: InventoryItem[];
  categories?: CategoryRecord[];
  onSaleComplete?: () => Promise<void>;
  initialCartItems?: InventoryItem[];
}

export const SalesPage: React.FC<SalesPageProps> = ({ items, categories = [], onSaleComplete, initialCartItems }) => {
  const [sales, setSales] = useState<SaleRecord[]>([]);
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

  const {
    cart,
    isSaleModalOpen,
    setIsSaleModalOpen,
    addToCart,
    setCartItemQty,
    updateCartQty,
    removeFromCart,
    clearCart,
  } = useSalesCart(items, initialCartItems);

  const fetchSalesData = async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const [s, c, cfg] = await Promise.all([
        getRecentSales(100),
        getCustomers(),
        getStoreSettings(),
      ]);
      setSales(s);
      setCustomers(c);
      setStoreSettings(cfg);
      return s;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        clearCart();
        setIsSaleModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clearCart, setIsSaleModalOpen]);

  const handleConfirmDelete = async () => {
    if (deleteTargetId === null) return;
    setIsDeleting(true);
    try {
      await deleteSale(deleteTargetId);
      await fetchSalesData();
      if (onSaleComplete) await onSaleComplete();
      setDeleteTargetId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleBadDebt = async (sale: SaleRecord) => {
    try {
      await toggleSaleBadDebt(sale.id, sale.isBadDebt !== 1);
      await fetchSalesData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaleCompleted = async (completed: CompletedSale) => {
    clearCart();
    const freshSales = await fetchSalesData();
    if (onSaleComplete) await onSaleComplete();
    const created = freshSales?.find((s) => s.invoiceNo === completed.invoiceNo);
    if (created) setReceiptSale(created);
  };

  const deletingSale = sales.find((s) => s.id === deleteTargetId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales & Point of Sale"
        subtitle="Manage checkout, customer invoices, receivables, and thermal receipts"
        icon={ShoppingCart}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsManualReceivableOpen(true)}
            className="tail-btn-secondary-sm text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700/50 hover:bg-amber-50 dark:hover:bg-amber-950/20"
          >
            <Plus className="size-3.5" />
            <span>Record Receivable</span>
          </button>
          <button
            onClick={() => {
              clearCart();
              setIsSaleModalOpen(true);
            }}
            className="tail-btn-primary-sm"
          >
            <Plus className="size-3.5" />
            <span>New Sale (F2)</span>
          </button>
        </div>
      </PageHeader>

      <SalesStats sales={sales} />

      <SalesTable
        sales={sales}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        isLoading={isLoading}
        onViewInvoice={setViewInvoice}
        onPrintReceipt={setReceiptSale}
        onDeleteSale={async (id) => setDeleteTargetId(id)}
        onCollectPayment={(s) => setPaymentSale(s)}
        onToggleBadDebt={handleToggleBadDebt}
      />

      <NewSaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        items={items}
        categories={categories}
        customers={customers}
        cart={cart}
        onAddToCart={addToCart}
        onSetCartQty={setCartItemQty}
        onUpdateCartQty={updateCartQty}
        onRemoveFromCart={removeFromCart}
        onSaleCompleted={handleSaleCompleted}
      />

      <AddManualReceivableModal
        isOpen={isManualReceivableOpen}
        onClose={() => setIsManualReceivableOpen(false)}
        onSuccess={async () => {
          await fetchSalesData();
        }}
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
        onSuccess={async () => {
          await fetchSalesData();
        }}
      />

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Void Sales Invoice"
        message={
          deletingSale?.invoiceNo.startsWith("RCV-")
            ? "Are you sure you want to void this manual receivable? The outstanding balance will be removed."
            : "Are you sure you want to void this invoice? The sold items will be returned to stock."
        }
        confirmText="Void Invoice"
        isLoading={isDeleting}
      />
    </div>
  );
};
