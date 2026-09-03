import React, { useState } from "react";
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
} from "lucide-react";
import { DocumentRecord, BrandType } from "../../db/schema";
import { parseDocumentItems } from "../../db/documentsService";
import { generateAndDownloadDocx } from "../../services/docx/docxGenerator";
import { EmptyState } from "../ui/EmptyState";
import { SearchInput } from "../ui/SearchInput";

interface DocHistoryTableProps {
  documents: DocumentRecord[];
  activeBrand: BrandType;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isLoading: boolean;
  onInspectDocument: (doc: DocumentRecord) => void;
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

  const brandDocs = documents.filter((d) => d.brand === activeBrand);

  const handleDownload = async (doc: DocumentRecord) => {
    try {
      setDownloadingId(doc.id);
      await generateAndDownloadDocx(doc);
    } catch (err) {
      console.error("Failed to generate DOCX:", err);
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
                brandDocs.map((doc) => {
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
                          {/* Download DOCX */}
                          <button
                            type="button"
                            onClick={() => handleDownload(doc)}
                            disabled={isDownloading}
                            title="Download .docx File"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-400 dark:hover:bg-brand-900/50 text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            {isDownloading ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <FileDown className="size-3.5" />
                            )}
                            <span>DOCX</span>
                          </button>

                          {/* Inspect / View */}
                          <button
                            type="button"
                            onClick={() => onInspectDocument(doc)}
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
      </div>
    </div>
  );
};
