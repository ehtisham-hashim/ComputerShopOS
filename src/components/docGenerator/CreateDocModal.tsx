import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Minus,
  Trash2,
  Save,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  BrandType,
  Customer,
  InventoryItem,
  DocumentLineItem,
  CreateDocumentInput,
  DocumentRecord,
} from "../../db/schema";
import { BRAND_CONFIGS } from "../../services/docx/brandConfigs";
import { getNextDocRefNo, createDocument, parseDocumentItems } from "../../db/documentsService";
import { Modal } from "../ui/Modal";
import { CustomDropdown } from "../ui/CustomDropdown";

interface CreateDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  defaultBrand?: BrandType;
  customers: Customer[];
  inventoryItems: InventoryItem[];
  duplicateFrom?: DocumentRecord | null;
}

export const CreateDocModal: React.FC<CreateDocModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultBrand = "tasnim_computers",
  customers,
  inventoryItems,
  duplicateFrom,
}) => {
  const [brand, setBrand] = useState<BrandType>(defaultBrand);
  const [refNo, setRefNo] = useState("");
  const [dateStr, setDateStr] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [items, setItems] = useState<DocumentLineItem[]>([
    { sn: 1, description: "", qty: 1, unitPrice: 0, totalAmount: 0 },
  ]);

  const [discount, setDiscount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [warrantyTerms, setWarrantyTerms] = useState(
    BRAND_CONFIGS[defaultBrand]?.defaultWarranty || "ONE WEEK CHECK WARRENTY"
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or handle duplicate
  useEffect(() => {
    if (!isOpen) return;

    if (duplicateFrom) {
      setBrand(duplicateFrom.brand);
      setCustomerName(duplicateFrom.customerName);
      setCustomerAddress(duplicateFrom.customerAddress || "");
      setCustomerPhone(duplicateFrom.customerPhone || "");
      setSelectedCustomerId(
        duplicateFrom.customerId ? String(duplicateFrom.customerId) : ""
      );
      setItems(parseDocumentItems(duplicateFrom.itemsJson));
      setDiscount(duplicateFrom.discount || 0);
      setPaymentMode(duplicateFrom.paymentMode || "CASH");
      setWarrantyTerms(
        duplicateFrom.warrantyTerms || BRAND_CONFIGS[duplicateFrom.brand]?.defaultWarranty
      );
      setNotes(duplicateFrom.notes || "");
      // Generate new sequential ref number for copy
      getNextDocRefNo(duplicateFrom.brand).then(setRefNo);
    } else {
      setBrand(defaultBrand);
      setWarrantyTerms(BRAND_CONFIGS[defaultBrand]?.defaultWarranty || "ONE WEEK CHECK WARRENTY");
      getNextDocRefNo(defaultBrand).then(setRefNo);
      setItems([
        { sn: 1, description: "", qty: 1, unitPrice: 0, totalAmount: 0 },
      ]);
      setCustomerName("");
      setCustomerAddress("");
      setCustomerPhone("");
      setSelectedCustomerId("");
      setDiscount(0);
    }
  }, [isOpen, defaultBrand, duplicateFrom]);

  // When brand changes, auto-update next Ref No and default warranty
  const handleBrandChange = async (newBrand: BrandType) => {
    setBrand(newBrand);
    const nextRef = await getNextDocRefNo(newBrand, dateStr);
    setRefNo(nextRef);
    setWarrantyTerms(BRAND_CONFIGS[newBrand]?.defaultWarranty || "ONE WEEK CHECK WARRENTY");
  };

  // When CRM customer is picked, autofill
  const handleSelectCustomer = (custIdStr: string) => {
    setSelectedCustomerId(custIdStr);
    if (!custIdStr) return;
    const cust = customers.find((c) => c.id === Number(custIdStr));
    if (cust) {
      setCustomerName(cust.name);
      setCustomerPhone(cust.phone || "");
      setCustomerAddress(cust.address || "");
    }
  };

  // Line item updates
  const updateItem = (
    index: number,
    field: keyof DocumentLineItem,
    value: any
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };
      if (field === "qty" || field === "unitPrice") {
        target.totalAmount = (Number(target.qty) || 0) * (Number(target.unitPrice) || 0);
      }
      updated[index] = target;
      return updated;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { sn: prev.length + 1, description: "", qty: 1, unitPrice: 0, totalAmount: 0 },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, sn: i + 1 }))
    );
  };

  const handlePickInventory = (index: number, itemIdStr: string) => {
    if (!itemIdStr) return;
    const inv = inventoryItems.find((i) => i.id === Number(itemIdStr));
    if (inv) {
      updateItem(index, "description", inv.name);
      updateItem(index, "unitPrice", inv.price);
    }
  };

  // Financial totals
  const subtotal = items.reduce((acc, i) => acc + (Number(i.totalAmount) || 0), 0);
  const totalAmount = Math.max(0, subtotal - (Number(discount) || 0));

  // Date formatting for invoice: DD-MM-YYYY
  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return "";
    const parts = dStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dStr;
  };

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      alert("Please enter customer name");
      return;
    }
    if (items.length === 0 || !items[0].description.trim()) {
      alert("Please add at least one line item with description");
      return;
    }

    setIsSubmitting(true);
    try {
      const input: CreateDocumentInput = {
        brand,
        docType: "invoice",
        refNo: refNo || (await getNextDocRefNo(brand, dateStr)),
        date: formatDisplayDate(dateStr),
        customerId: selectedCustomerId ? Number(selectedCustomerId) : undefined,
        customerName: customerName.trim(),
        customerAddress: customerAddress.trim(),
        customerPhone: customerPhone.trim(),
        items,
        subtotal,
        discount,
        tax: 0,
        totalAmount,
        paymentMode,
        warrantyTerms,
        notes,
      };

      await createDocument(input);

      await onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to save document:", err);
      alert("Error saving document. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const brands: BrandType[] = [
    "tasnim_computers",
    "farhan_computers",
    "farhan_enterprises",
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={duplicateFrom ? "Duplicate Document" : "Create Brand Invoice / Document"}
      subtitle="Fill in customer details, add dynamic items, and export official DOCX bill"
      icon={FileText}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* SECTION 1: BRAND SELECTION */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
            1. Select Brand Letterhead Profile
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {brands.map((bId) => {
              const cfg = BRAND_CONFIGS[bId];
              const isSel = brand === bId;
              return (
                <button
                  key={bId}
                  type="button"
                  onClick={() => handleBrandChange(bId)}
                  className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                    isSel
                      ? "border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500/20"
                      : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      {cfg.displayName}
                    </span>
                    <div
                      className="size-3 rounded-full"
                      style={{ backgroundColor: cfg.primaryColor }}
                    />
                  </div>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                    {cfg.tagline}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: METADATA (REF NO & DATE) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Document Reference #
            </label>
            <div className="relative">
              <input
                type="text"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                placeholder="e.g. TCOM/JAN-26"
                className="tail-input font-mono text-xs font-bold"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Invoice Date
            </label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="tail-input text-xs"
            />
          </div>
        </div>

        {/* SECTION 3: CUSTOMER DETAILS */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/50 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              2. Customer / Firm Details (MS:)
            </span>
            {customers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Auto-fill from CRM:</span>
                <CustomDropdown
                  value={selectedCustomerId}
                  onChange={(val) => handleSelectCustomer(val)}
                  options={[
                    { value: "", label: "-- Choose Customer --" },
                    ...customers.map((c) => ({ value: String(c.id), label: `${c.name} (${c.phone})` })),
                  ]}
                  size="sm"
                  minWidth={200}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                Customer / Firm Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. MIKHRAQ AHMAD KHAN"
                className="tail-input text-xs uppercase"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                Address / City
              </label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="e.g. PWD ISB"
                className="tail-input text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 0345-1234567"
                className="tail-input text-xs"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: INVOICE LINE ITEMS TABLE */}
        <div className="space-y-3">
          {/* Header with item count and Add Row button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                3. Invoice Line Items ({items.length})
              </label>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                Official 5-Column Bill
              </span>
            </div>
            <button
              type="button"
              onClick={addItemRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-400 transition-colors"
            >
              <Plus className="size-3.5" />
              <span>Add Item Row</span>
            </button>
          </div>

          {/* Line items table with clean horizontal scroll for all screens */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
            <table className="w-full text-left text-xs min-w-[620px]">
              <thead className="border-b border-gray-100 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                <tr>
                  <th className="px-3 py-3 w-12 text-center">#</th>
                  <th className="px-3 py-3 min-w-[260px]">Description & Warranty Notes</th>
                  <th className="px-3 py-3 w-36 text-center">Quantity</th>
                  <th className="px-3 py-3 w-40 text-right">Unit Price</th>
                  <th className="px-3 py-3 w-36 text-right">Total Amount</th>
                  <th className="px-3 py-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((item, index) => (
                  <tr key={index} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    {/* Item Number (#) */}
                    <td className="px-3 py-3 text-center align-top">
                      <span className="inline-flex size-6 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300 font-mono mt-1">
                        {index + 1}
                      </span>
                    </td>

                    {/* Description & Inventory Quick Pick */}
                    <td className="px-3 py-3 space-y-2 align-top">
                      {inventoryItems.length > 0 && (
                        <CustomDropdown
                          value=""
                          onChange={(val) => handlePickInventory(index, val)}
                          options={[
                            { value: "", label: "-- Quick pick product from Inventory --" },
                            ...inventoryItems.map((inv) => ({
                              value: String(inv.id),
                              label: `${inv.name} (PKR ${inv.price.toLocaleString()})`,
                            })),
                          ]}
                          size="sm"
                          className="w-full"
                          buttonClassName="w-full text-xs py-1 text-gray-500 bg-gray-50/70 dark:bg-gray-800/50 border-dashed hover:border-brand-400"
                        />
                      )}
                      {/* Uses .tail-textarea from index.css so text never touches the ceiling */}
                      <textarea
                        rows={2}
                        value={item.description}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        placeholder="Item name / specs / warranty&#10;e.g. LOGITECH H390 USB HEADSET - 5 MONTH WARRANTY"
                        className="tail-textarea"
                      />
                    </td>

                    {/* Quantity with tactile - / + stepper */}
                    <td className="px-3 py-3 align-top">
                      <div className="flex flex-col items-center gap-1 mt-1">
                        <div className="tail-stepper">
                          <button
                            type="button"
                            onClick={() => updateItem(index, "qty", Math.max(1, (Number(item.qty) || 1) - 1))}
                            disabled={Number(item.qty) <= 1}
                            aria-label="Decrease quantity"
                            className="tail-stepper-btn"
                          >
                            <Minus className="size-3" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.qty === 0 ? "" : item.qty}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "qty",
                                e.target.value === "" ? 0 : Math.max(1, parseInt(e.target.value) || 1)
                              )
                            }
                            onBlur={() => {
                              if (!item.qty || item.qty < 1) updateItem(index, "qty", 1);
                            }}
                            className="w-11 bg-transparent text-center tail-num-input text-xs font-bold text-gray-900 focus:outline-none dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => updateItem(index, "qty", (Number(item.qty) || 0) + 1)}
                            aria-label="Increase quantity"
                            className="tail-stepper-btn"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">units</span>
                      </div>
                    </td>

                    {/* Unit Price with PKR prefix and +/- 100 micro-adjusters */}
                    <td className="px-3 py-3 align-top">
                      <div className="flex flex-col items-end gap-1 mt-1">
                        <div className="tail-currency-box w-full">
                          <span className="pl-2.5 text-[10px] font-bold text-gray-400 select-none">PKR</span>
                          <input
                            type="number"
                            min="0"
                            value={item.unitPrice === 0 ? "" : item.unitPrice}
                            placeholder="0"
                            onChange={(e) =>
                              updateItem(
                                index,
                                "unitPrice",
                                e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value) || 0)
                              )
                            }
                            className="w-full bg-transparent py-2 pl-1 pr-6 text-right tail-num-input text-xs font-bold text-gray-900 focus:outline-none dark:text-white"
                          />
                          {/* Micro-adjusters for quick +/- 100 PKR adjustments */}
                          <div className="absolute right-1 flex flex-col items-center justify-center">
                            <button
                              type="button"
                              onClick={() =>
                                updateItem(index, "unitPrice", (Number(item.unitPrice) || 0) + 100)
                              }
                              title="Add PKR 100"
                              className="p-0.5 rounded text-gray-400 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-brand-400 transition-colors"
                            >
                              <ChevronUp className="size-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateItem(
                                  index,
                                  "unitPrice",
                                  Math.max(0, (Number(item.unitPrice) || 0) - 100)
                                )
                              }
                              title="Subtract PKR 100"
                              className="p-0.5 rounded text-gray-400 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-brand-400 transition-colors"
                            >
                              <ChevronDown className="size-2.5" />
                            </button>
                          </div>
                        </div>
                        {/* Quick increment chips */}
                        <div className="flex items-center justify-end gap-1">
                          {[500, 1000].map((step) => (
                            <button
                              key={step}
                              type="button"
                              onClick={() =>
                                updateItem(index, "unitPrice", (Number(item.unitPrice) || 0) + step)
                              }
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-brand-950/40 dark:hover:text-brand-400 transition-colors"
                            >
                              +{step}
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Calculated Line Total */}
                    <td className="px-3 py-3 text-right align-top">
                      <div className="pt-2">
                        <span className="font-mono text-xs font-bold tabular-nums text-gray-900 dark:text-white block">
                          PKR {item.totalAmount.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium tabular-nums block mt-0.5">
                          {item.qty || 0} × PKR {Number(item.unitPrice || 0).toLocaleString()}
                        </span>
                      </div>
                    </td>

                    {/* Delete Action Button */}
                    <td className="px-3 py-3 text-center align-top">
                      <div className="pt-1.5">
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          disabled={items.length <= 1}
                          title="Delete line item"
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 disabled:opacity-25 disabled:pointer-events-none transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SECTION 5: FINANCIAL SUMMARY (Subtotal, Discount, Final Total) */}
          <div className="flex flex-col sm:flex-row justify-end items-end gap-4 pt-2">
            <div className="w-full sm:w-80 space-y-2.5 text-xs bg-gray-50/80 dark:bg-gray-800/40 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-theme-xs">
              {/* Subtotal */}
              <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                <span className="font-medium">Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'}):</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white tabular-nums">
                  PKR {subtotal.toLocaleString()}
                </span>
              </div>
              {/* Discount Input with PKR prefix */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-gray-600 dark:text-gray-400">Special Discount:</span>
                <div className="tail-currency-box w-36">
                  <span className="pl-2 text-[10px] font-bold text-gray-400 select-none">PKR</span>
                  <input
                    type="number"
                    min="0"
                    value={discount === 0 ? "" : discount}
                    placeholder="0"
                    onChange={(e) =>
                      setDiscount(e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="w-full bg-transparent py-1.5 pl-1 pr-2.5 text-right tail-num-input text-xs font-bold text-gray-900 focus:outline-none dark:text-white"
                  />
                </div>
              </div>
              {/* Final Payable Total */}
              <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-2.5 text-sm font-bold text-gray-900 dark:text-white">
                <span className="tracking-wide">FINAL PAYABLE:</span>
                <span className="font-mono text-base font-extrabold text-brand-600 dark:text-brand-400 tabular-nums">
                  PKR {totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: TERMS & CONDITIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Payment Mode
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {["CASH", "BANK TRANSFER", "CHEQUE", "CREDIT"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-colors ${
                    paymentMode === mode
                      ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Warranty Terms
            </label>
            <input
              type="text"
              value={warrantyTerms}
              onChange={(e) => setWarrantyTerms(e.target.value)}
              placeholder="e.g. ONE WEEK CHECK WARRENTY"
              className="tail-input text-xs uppercase"
            />
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {[
                "ONE WEEK CHECK WARRENTY",
                "5 MONTH WARANTY",
                "1 YEAR OFFICIAL WARRANTY",
              ].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWarrantyTerms(w)}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 transition-colors"
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MODAL FOOTER BUTTONS */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="tail-btn-secondary-sm w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="tail-btn-primary-sm w-full sm:w-auto flex items-center justify-center gap-1.5"
          >
            <Save className="size-3.5" />
            <span>{isSubmitting ? "Saving..." : "Save Record"}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
