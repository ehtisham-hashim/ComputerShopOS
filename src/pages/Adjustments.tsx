import React, { useState, useEffect } from "react";
import {
  ArrowLeftRight,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
} from "lucide-react";
import { StatCard } from "../components/ui/StatCard";
import { SearchInput } from "../components/ui/SearchInput";
import { Modal } from "../components/ui/Modal";
import { CustomSelect } from "../components/ui/Select";
import { InventoryItem, AdjustmentRecord, CustomerRecord, PaymentStatus } from "../db/schema";
import { getAdjustments, createAdjustment, deleteAdjustment } from "../db/adjustmentsService";
import { getCustomers } from "../db/customerService";

interface AdjustmentsPageProps {
  items: InventoryItem[];
  onRefreshInventory?: () => Promise<void>;
}

export const AdjustmentsPage: React.FC<AdjustmentsPageProps> = ({
  items,
  onRefreshInventory,
}) => {
  const [adjustments, setAdjustments] = useState<AdjustmentRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inspectAdjustment, setInspectAdjustment] = useState<AdjustmentRecord | null>(null);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [itemTakenName, setItemTakenName] = useState("");
  const [itemTakenValue, setItemTakenValue] = useState<number>(0);
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [itemGivenName, setItemGivenName] = useState("");
  const [itemGivenPrice, setItemGivenPrice] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [isCustomPaidSet, setIsCustomPaidSet] = useState<boolean>(false);
  const [notes, setNotes] = useState("");

  const fetchAdjustments = async (showLoader = false) => {
    try {
      if (showLoader) setIsLoading(true);
      const data = await getAdjustments();
      setAdjustments(data);
      const custs = await getCustomers();
      setCustomers(custs);
    } catch (err) {
      console.error("Failed to load adjustments:", err);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdjustments(true);
  }, []);

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
      if (!isCustomPaidSet) {
        const net = item.price - (itemTakenValue || 0);
        setPaidAmount(Math.max(0, net));
      }
    }
  };

  const handleItemTakenValueChange = (val: number) => {
    setItemTakenValue(val);
    if (!isCustomPaidSet) {
      const net = (itemGivenPrice || 0) - val;
      setPaidAmount(Math.max(0, net));
    }
  };

  const handleItemGivenPriceChange = (val: number) => {
    setItemGivenPrice(val);
    if (!isCustomPaidSet) {
      const net = val - (itemTakenValue || 0);
      setPaidAmount(Math.max(0, net));
    }
  };

  const netDifference = (Number(itemGivenPrice) || 0) - (Number(itemTakenValue) || 0);
  const targetRequired = Math.abs(netDifference);
  const balanceDue = Math.max(0, targetRequired - (paidAmount || 0));

  // Auto-calculated payment status
  const autoPaymentStatus: PaymentStatus =
    targetRequired === 0 || (paidAmount || 0) >= targetRequired
      ? "PAID"
      : (paidAmount || 0) > 0
      ? "PARTIAL"
      : "UNPAID";

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !itemTakenName.trim() || !itemGivenName.trim()) return;

    await createAdjustment({
      customerId: selectedCustomerId ? Number(selectedCustomerId) : undefined,
      customerName,
      customerPhone,
      itemTakenName,
      itemTakenValue,
      itemGivenInventoryId: selectedInventoryId ? Number(selectedInventoryId) : undefined,
      itemGivenName,
      itemGivenPrice,
      netDifference,
      paidAmount: paidAmount || 0,
      balanceDue,
      paymentStatus: autoPaymentStatus,
      notes,
    });

    await fetchAdjustments();
    if (onRefreshInventory) await onRefreshInventory();
    setIsModalOpen(false);

    // Reset Form
    setCustomerName("");
    setCustomerPhone("");
    setItemTakenName("");
    setItemTakenValue(0);
    setSelectedInventoryId("");
    setItemGivenName("");
    setItemGivenPrice(0);
    setPaidAmount(0);
    setIsCustomPaidSet(false);
    setNotes("");
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Delete this adjustment record?")) {
      await deleteAdjustment(id);
      await fetchAdjustments();
    }
  };

  const filteredAdjustments = adjustments.filter(
    (a) =>
      a.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.itemTakenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.itemGivenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.adjustmentNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <ArrowLeftRight className="size-6 text-brand-500" />
            PC Swaps & Trade-In Adjustments
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Handle customer trade-in upgrades, part exchanges, and calculate extra money collected or store refund payouts
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsModalOpen(true);
            setIsCustomPaidSet(false);
          }}
          className="tail-btn-primary"
        >
          <Plus className="size-4" />
          <span>New Swap / Trade-In</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Trade-In Transactions"
          value={adjustments.length}
          icon={<ArrowLeftRight className="size-5" />}
        />
        <StatCard
          title="Net Upgrade Revenue"
          value={`PKR ${adjustments
            .filter((a) => a.netDifference > 0)
            .reduce((acc, a) => acc + (a.paidAmount !== undefined ? a.paidAmount : a.netDifference), 0)
            .toFixed(2)}`}
          valueColor="success"
          icon={<TrendingUp className="size-5" />}
        />
        <StatCard
          title="Store Cash Payouts / Refunds"
          value={`PKR ${Math.abs(
            adjustments
              .filter((a) => a.netDifference < 0)
              .reduce((acc, a) => acc + (a.paidAmount !== undefined ? a.paidAmount : a.netDifference), 0)
          ).toFixed(2)}`}
          valueColor="brand"
          icon={<TrendingDown className="size-5" />}
        />
      </div>

      {/* Search Bar */}
      <div className="tail-card p-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by customer name, trade-in device, given item, or adjustment #..."
          className="max-w-md"
        />
      </div>

      {/* Adjustments Table */}
      <div className="tail-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm whitespace-nowrap">
            <thead className="border-b border-gray-200 bg-gray-50/60 text-xs font-semibold uppercase text-gray-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-400">
              <tr>
                <th className="py-3.5 px-5">Adjustment #</th>
                <th className="py-3.5 px-5">Customer</th>
                <th className="py-3.5 px-5">Item Taken (Trade-In)</th>
                <th className="py-3.5 px-5">Item Given (Store Stock)</th>
                <th className="py-3.5 px-5">Net Balance / Paid</th>
                <th className="py-3.5 px-5">Payment Status</th>
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 text-xs">
                    Loading trade-in adjustments...
                  </td>
                </tr>
              ) : filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 text-xs">
                    No trade-in adjustments recorded yet.
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map((adj) => (
                  <tr
                    key={adj.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3.5 px-5 font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                      {adj.adjustmentNo}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className="font-bold text-gray-900 dark:text-white max-w-[140px] truncate block"
                        title={adj.customerName}
                      >
                        {adj.customerName}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex flex-col max-w-[160px]">
                        <span
                          className="font-semibold text-gray-800 dark:text-gray-200 truncate block"
                          title={adj.itemTakenName}
                        >
                          {adj.itemTakenName}
                        </span>
                        <span className="text-xs text-gray-400">
                          Valued at: PKR {adj.itemTakenValue.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex flex-col max-w-[160px]">
                        <span
                          className="font-semibold text-gray-800 dark:text-gray-200 truncate block"
                          title={adj.itemGivenName}
                        >
                          {adj.itemGivenName}
                        </span>
                        <span className="text-xs text-gray-400">
                          Price: PKR {Number(adj.itemGivenPrice || 0).toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex flex-col">
                        {Number(adj.netDifference || 0) > 0 ? (
                          <span className="font-bold text-success-600 dark:text-success-400">
                            +PKR {Number(adj.netDifference || 0).toFixed(2)}
                          </span>
                        ) : Number(adj.netDifference || 0) < 0 ? (
                          <span className="font-bold text-warning-600 dark:text-warning-400">
                            -PKR {Math.abs(Number(adj.netDifference || 0)).toFixed(2)}
                          </span>
                        ) : (
                          <span className="font-bold text-gray-500">
                            PKR 0.00
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">
                          Paid: PKR {Number(adj.paidAmount !== undefined ? adj.paidAmount : Math.abs(Number(adj.netDifference || 0))).toFixed(2)}
                          {Number(adj.balanceDue || 0) > 0 ? ` (Due: PKR ${Number(adj.balanceDue || 0).toFixed(2)})` : ""}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          adj.paymentStatus === "PAID"
                            ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400"
                            : adj.paymentStatus === "PARTIAL"
                            ? "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400"
                            : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400"
                        }`}
                      >
                        {adj.paymentStatus === "PAID" && <CheckCircle2 className="size-3" />}
                        {adj.paymentStatus === "PARTIAL" && <Clock className="size-3" />}
                        {adj.paymentStatus === "UNPAID" && <AlertCircle className="size-3" />}
                        {adj.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-gray-400">
                      {new Date(adj.createdAt * 1000).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setInspectAdjustment(adj)}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/15 dark:hover:text-brand-400 transition-colors"
                          title="View Full Details"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(adj.id)}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/15 dark:hover:text-error-400 transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Trade-In Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record PC Trade-In / Swap Adjustment"
        subtitle="Trade in customer PC/part, issue store hardware, and calculate financial difference"
        icon={<ArrowLeftRight className="size-5 text-brand-500" />}
        maxWidth="xl"
      >
        <form onSubmit={handleCreateAdjustment} className="space-y-4">
          <CustomSelect
            label="Customer Account"
            value={selectedCustomerId}
            onChange={handleSelectCustomer}
            placeholder="Select customer or enter manually below..."
            searchable
            options={customers.map((c) => ({
              value: String(c.id),
              label: c.name,
              sublabel: c.phone,
            }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Michael Smith"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="tail-input"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                placeholder="+1..."
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="tail-input font-mono"
              />
            </div>
          </div>

          {/* Item Taken (Trade In) Box */}
          <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-800/40 space-y-3">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <TrendingDown className="size-4 text-warning-500" />
              1. Item Taken from Customer (Trade-In / Inflow)
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-gray-500 mb-1">
                  Customer Trade-in Device / Specs *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Old Core i5-10400F / GTX 1660 Super Rig"
                  value={itemTakenName}
                  onChange={(e) => setItemTakenName(e.target.value)}
                  className="tail-input text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">
                  Valuation Allowance (PKR) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="15000"
                  value={itemTakenValue || ""}
                  onChange={(e) => handleItemTakenValueChange(parseFloat(e.target.value) || 0)}
                  className="tail-input text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Item Given (Store Outflow) Box */}
          <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-800/40 space-y-3">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <TrendingUp className="size-4 text-success-500" />
              2. Item Given to Customer (Store Stock / Outflow)
            </h4>

            <CustomSelect
              label="Select from Inventory"
              value={selectedInventoryId}
              onChange={handleSelectInventoryItem}
              placeholder="Pick store item to give out..."
              searchable
              options={items.map((it) => ({
                value: String(it.id),
                label: it.name,
                sublabel: `PKR ${it.price.toFixed(2)} (${it.quantity} avail)`,
              }))}
            />

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-gray-500 mb-1">
                  Item Given Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RTX 4080 Super Custom Rig"
                  value={itemGivenName}
                  onChange={(e) => setItemGivenName(e.target.value)}
                  className="tail-input text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">
                  Retail Price (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="99000"
                  value={itemGivenPrice || ""}
                  onChange={(e) => handleItemGivenPriceChange(parseFloat(e.target.value) || 0)}
                  className="tail-input text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Calculation Banner */}
          <div className={`p-4 rounded-xl border font-semibold flex items-center justify-between text-sm ${
            netDifference > 0
              ? "bg-success-50/60 border-success-200 text-success-800 dark:bg-success-500/10 dark:border-success-500/30 dark:text-success-300"
              : netDifference < 0
              ? "bg-warning-50/60 border-warning-200 text-warning-800 dark:bg-warning-500/10 dark:border-warning-500/30 dark:text-warning-300"
              : "bg-gray-100 border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
          }`}>
            <div>
              <p className="font-bold text-xs uppercase tracking-wider">Adjustment Net Balance</p>
              <p className="text-xs font-normal mt-0.5">
                {netDifference > 0
                  ? "Customer pays additional money to store"
                  : netDifference < 0
                  ? "Store pays cash refund back to customer"
                  : "Even exchange (no monetary difference)"}
              </p>
            </div>

            <span className="text-xl font-bold font-mono">
              {netDifference > 0
                ? `+PKR ${netDifference.toFixed(2)}`
                : netDifference < 0
                ? `-PKR ${Math.abs(netDifference).toFixed(2)}`
                : "PKR 0.00"}
            </span>
          </div>

          {/* Payment Amount & Auto-Calculated Status */}
          <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                {netDifference >= 0 ? "Amount Received / Settled (PKR)" : "Refund Paid to Customer (PKR)"}
              </label>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setPaidAmount(targetRequired);
                    setIsCustomPaidSet(true);
                  }}
                  className="rounded px-2 py-0.5 text-[11px] font-bold bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400"
                >
                  Full Amount
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaidAmount(0);
                    setIsCustomPaidSet(true);
                  }}
                  className="rounded px-2 py-0.5 text-[11px] font-bold bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300"
                >
                  Unpaid (0)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={paidAmount !== undefined ? paidAmount : ""}
                onChange={(e) => {
                  setPaidAmount(parseFloat(e.target.value) || 0);
                  setIsCustomPaidSet(true);
                }}
                className="tail-input font-bold"
                placeholder="0.00"
              />

              {/* Dynamic Auto-Calculated Status Badge */}
              <div className="flex items-center gap-2 p-2 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className="flex-1 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-gray-400">
                    Payment Status (Auto)
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold ${
                        autoPaymentStatus === "PAID"
                          ? "text-success-600 dark:text-success-400"
                          : autoPaymentStatus === "PARTIAL"
                          ? "text-warning-600 dark:text-warning-400"
                          : "text-error-600 dark:text-error-400"
                      }`}
                    >
                      {autoPaymentStatus === "PAID" && <CheckCircle2 className="size-3.5" />}
                      {autoPaymentStatus === "PARTIAL" && <Clock className="size-3.5" />}
                      {autoPaymentStatus === "UNPAID" && <AlertCircle className="size-3.5" />}
                      {autoPaymentStatus === "PAID"
                        ? "PAID - Fully Settled"
                        : autoPaymentStatus === "PARTIAL"
                        ? "PARTIAL Payment"
                        : "UNPAID - Pending"}
                    </span>
                  </div>
                </div>

                {balanceDue > 0 && (
                  <span className="rounded bg-error-50 px-2 py-0.5 text-[10px] font-bold text-error-600 dark:bg-error-500/15 dark:text-error-400">
                    Due: PKR {balanceDue.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="tail-btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="tail-btn-primary">
              Record Swap Adjustment
            </button>
          </div>
        </form>
      </Modal>

      {/* Trade-In Inspector Modal */}
      <Modal
        isOpen={Boolean(inspectAdjustment)}
        onClose={() => setInspectAdjustment(null)}
        title={`Adjustment: ${inspectAdjustment?.adjustmentNo}`}
        subtitle={`Recorded on ${inspectAdjustment ? new Date(inspectAdjustment.createdAt * 1000).toLocaleString() : ""}`}
        icon={<ArrowLeftRight className="size-5 text-brand-500" />}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {/* Customer Info */}
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Customer</span>
              <p className="font-bold text-sm text-gray-900 dark:text-white mt-0.5">
                {inspectAdjustment?.customerName}
              </p>
            </div>
            {inspectAdjustment?.customerPhone && (
              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Phone</span>
                <p className="font-mono text-xs text-gray-700 dark:text-gray-300 mt-0.5">
                  {inspectAdjustment.customerPhone}
                </p>
              </div>
            )}
          </div>

          {/* Trade-In Details Comparison Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Item Taken */}
            <div className="p-3.5 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/60">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-warning-600 dark:text-warning-400">
                <TrendingDown className="size-3.5" /> Item Taken (Trade-In)
              </span>
              <p className="font-semibold text-xs text-gray-900 dark:text-white mt-1">
                {inspectAdjustment?.itemTakenName}
              </p>
              <p className="mt-2 text-[11px] text-gray-400">
                Valuation Allowance: <span className="font-bold text-gray-900 dark:text-white">PKR {inspectAdjustment?.itemTakenValue.toFixed(2)}</span>
              </p>
            </div>

            {/* Item Given */}
            <div className="p-3.5 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/60">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-success-600 dark:text-success-400">
                <TrendingUp className="size-3.5" /> Item Given (Store Stock)
              </span>
              <p className="font-semibold text-xs text-gray-900 dark:text-white mt-1">
                {inspectAdjustment?.itemGivenName}
              </p>
              <p className="mt-2 text-[11px] text-gray-400">
                Retail Price: <span className="font-bold text-gray-900 dark:text-white">PKR {inspectAdjustment?.itemGivenPrice.toFixed(2)}</span>
              </p>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-800/40 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Net Difference:</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {inspectAdjustment && inspectAdjustment.netDifference > 0
                  ? `+PKR ${inspectAdjustment.netDifference.toFixed(2)} (Customer Owed)`
                  : inspectAdjustment && inspectAdjustment.netDifference < 0
                  ? `-PKR ${Math.abs(inspectAdjustment.netDifference).toFixed(2)} (Store Refund)`
                  : "PKR 0.00 (Even Trade)"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Amount Paid / Settled:</span>
              <span className="font-bold text-success-600 dark:text-success-400">
                PKR {((inspectAdjustment?.paidAmount !== undefined ? inspectAdjustment.paidAmount : Math.abs(inspectAdjustment?.netDifference || 0)) || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2 font-bold text-sm">
              <span>Payment Status:</span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs ${
                  inspectAdjustment?.paymentStatus === "PAID"
                    ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400"
                    : inspectAdjustment?.paymentStatus === "PARTIAL"
                    ? "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400"
                    : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400"
                }`}
              >
                {inspectAdjustment?.paymentStatus}
                {inspectAdjustment?.balanceDue && inspectAdjustment.balanceDue > 0 ? ` (Due: PKR ${inspectAdjustment.balanceDue.toFixed(2)})` : ""}
              </span>
            </div>
          </div>

          {inspectAdjustment?.notes && (
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Notes & Remarks</span>
              <p className="mt-1 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">
                {inspectAdjustment.notes}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
