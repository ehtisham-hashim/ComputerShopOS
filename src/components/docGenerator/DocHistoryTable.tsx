import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import {
  FileDown,
  Eye,
  Copy,
  Trash2,
  FileText,
  Loader2,
  ShieldCheck,
  CreditCard,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DocumentRecord, BrandType } from "../../db/schema";
import { parseDocumentItems } from "../../db/documentsService";
import { generateAndDownloadPdf } from "../../services/pdf/pdfGenerator";
import { PaperSize } from "./InvoiceA4Document";
import { EmptyState } from "../ui/EmptyState";
import { SearchInput } from "../ui/SearchInput";

const PAPER_SIZE_OPTIONS: { id: PaperSize; label: string; sub: string }[] = [
  { id: "a4", label: "A4", sub: "210 × 297 mm" },
  { id: "a5", label: "A5", sub: "148 × 210 mm" },
  { id: "letter", label: "Letter", sub: "8.5 × 11 in" },
  { id: "legal", label: "Legal", sub: "8.5 × 14 in" },
];

interface PdfDownloadButtonProps {
  doc: DocumentRecord;
  onDownload: (doc: DocumentRecord, size: PaperSize) => void;
  onPreview: (doc: DocumentRecord, size: PaperSize) => void;
  isDownloading: boolean;
}

const PdfDownloadButton: React.FC<PdfDownloadButtonProps> = ({
  doc,
  onDownload,
  onPreview,
  isDownloading,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = 220;
    const dropdownWidth = 230;
    const fitsBelow = window.innerHeight - rect.bottom > dropdownHeight + 8;
    const left = Math.max(8, Math.min(rect.right - dropdownWidth, window.innerWidth - dropdownWidth - 12));

    setCoords({
      top: fitsBelow ? rect.bottom + 4 : Math.max(8, rect.top - dropdownHeight - 4),
      left,
    });
  };

  const toggle = () => {
    if (isDownloading) return;
    if (!isOpen) updatePosition();
    setIsOpen(!isOpen);
  };

  useLayoutEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleScroll = () => setIsOpen(false);

    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        disabled={isDownloading}
        title="Export PDF (Select Paper Size)"
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-400 dark:hover:bg-brand-900/50 text-xs font-semibold transition-colors disabled:opacity-50"
      >
        {isDownloading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <FileDown className="size-3.5" />
        )}
        <span>PDF</span>
        <ChevronDown className={`size-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: "230px",
              zIndex: 99999,
            }}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700/60 mb-1 flex items-center justify-between">
              <span>Select Paper Format</span>
              <span className="text-[9px] font-normal text-gray-400 lowercase">preview / save</span>
            </div>
            <div className="space-y-0.5">
              {PAPER_SIZE_OPTIONS.map((opt) => (
                <div
                  key={opt.id}
                  className="flex items-center justify-between rounded-lg p-0.5 hover:bg-brand-50 dark:hover:bg-brand-950/50 group transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onPreview(doc, opt.id);
                    }}
                    title={`Preview ${opt.label} (${opt.sub})`}
                    className="flex items-center gap-2 flex-1 text-left px-2 py-1.5 rounded-md transition-colors"
                  >
                    <Eye className="size-3.5 text-gray-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                        {opt.label}
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                        {opt.sub}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                      onDownload(doc, opt.id);
                    }}
                    title={`Direct download ${opt.label}`}
                    className="p-1.5 rounded-md text-gray-400 hover:text-brand-600 hover:bg-brand-100 dark:hover:bg-brand-900/60 dark:hover:text-brand-300 transition-colors shrink-0 mr-1"
                  >
                    <FileDown className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-1 pt-1 border-t border-gray-100 dark:border-gray-700/60 px-2 py-0.5 text-[9.5px] text-gray-400 dark:text-gray-500 text-center">
              Click format to preview & save
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

interface DocHistoryTableProps {
  documents: DocumentRecord[];
  activeBrand: BrandType;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isLoading: boolean;
  onInspectDocument: (doc: DocumentRecord, paperSize?: PaperSize) => void;
  onDuplicateDocument: (doc: DocumentRecord) => void;
  onDeleteDocument: (id: number) => void;
  onCreateNew: () => void;
}

export const DocHistoryTable: React.FC<DocHistoryTableProps> = ({
  documents,
  activeBrand,
  searchQuery,
  onSearchChange,
  isLoading,
  onInspectDocument,
  onDuplicateDocument,
  onDeleteDocument,
  onCreateNew,
}) => {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const brandDocs = documents.filter((d) => d.brand === activeBrand);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeBrand]);

  const totalPages = Math.ceil(brandDocs.length / pageSize) || 1;
  const paginatedDocs = brandDocs.slice((page - 1) * pageSize, page * pageSize);

  const handleDownload = async (doc: DocumentRecord, size: PaperSize = "a4") => {
    try {
      setDownloadingId(doc.id);
      await generateAndDownloadPdf(doc, size);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search by Ref #, customer name, phone..."
          />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          Showing <span className="font-bold text-gray-900 dark:text-white">{brandDocs.length}</span> documents
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/75 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-400">
              <tr>
                <th className="px-5 py-3.5">Ref #</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Customer / Firm</th>
                <th className="px-5 py-3.5">Items</th>
                <th className="px-5 py-3.5 text-right">Total Amount</th>
                <th className="px-5 py-3.5">Payment & Terms</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                    <Loader2 className="mx-auto size-6 animate-spin text-brand-500 mb-2" />
                    Loading documents...
                  </td>
                </tr>
              ) : brandDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <EmptyState
                      icon={FileText}
                      title="No documents found"
                      description={
                        searchQuery
                          ? "No records matching your search query."
                          : "No invoices or bills generated for this brand yet."
                      }
                      action={
                        !searchQuery ? (
                          <button
                            type="button"
                            onClick={onCreateNew}
                            className="tail-btn-primary text-xs"
                          >
                            <Plus className="size-3.5" />
                            <span>Create First Document</span>
                          </button>
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                paginatedDocs.map((doc) => {
                  const items = parseDocumentItems(doc.itemsJson);
                  const isDownloading = downloadingId === doc.id;

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      {/* Ref No */}
                      <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-brand-500 shrink-0" />
                          <span className="font-mono text-xs">{doc.refNo}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300 font-medium text-xs">
                        {doc.date}
                      </td>

                      {/* Customer Info */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {doc.customerName}
                        </div>
                        {doc.customerAddress && (
                          <div className="text-xs text-gray-400 truncate max-w-[200px]">
                            {doc.customerAddress}
                          </div>
                        )}
                      </td>

                      {/* Items count & summary */}
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                        <div className="font-medium text-xs">
                          {items.length} {items.length === 1 ? "Item" : "Items"}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate max-w-[180px]">
                          {items.map((i) => i.description.split("\n")[0]).join(", ")}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="px-5 py-3.5 text-right font-bold text-gray-900 dark:text-white font-mono">
                        PKR {doc.totalAmount.toLocaleString()}
                      </td>

                      {/* Terms / Payment */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-300">
                            <CreditCard className="size-3 text-gray-400" />
                            {doc.paymentMode}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 truncate max-w-[150px]">
                            <ShieldCheck className="size-3 text-emerald-500" />
                            {doc.warrantyTerms}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Download PDF (with Paper Size Dropdown) */}
                          <PdfDownloadButton
                            doc={doc}
                            onDownload={handleDownload}
                            onPreview={(d, size) => onInspectDocument(d, size)}
                            isDownloading={isDownloading}
                          />

                          {/* Inspect / View */}
                          <button
                            type="button"
                            onClick={() => onInspectDocument(doc, "a4")}
                            title="Quick Preview"
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
                          >
                            <Eye className="size-4" />
                          </button>

                          {/* Duplicate */}
                          <button
                            type="button"
                            onClick={() => onDuplicateDocument(doc)}
                            title="Duplicate Document"
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
                          >
                            <Copy className="size-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => onDeleteDocument(doc.id)}
                            title="Delete Record"
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-5 py-3 text-xs text-gray-500">
            <div>
              Showing {(page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, brandDocs.length)} of {brandDocs.length} documents
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                title="Previous page"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                title="Next page"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
