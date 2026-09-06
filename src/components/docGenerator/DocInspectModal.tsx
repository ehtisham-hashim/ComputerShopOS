import React, { useState } from "react";
import { FileText, FileDown, Printer, Loader2 } from "lucide-react";
import { DocumentRecord } from "../../db/schema";
import { BRAND_CONFIGS } from "../../services/docx/brandConfigs";
import { generateAndDownloadPdf, printDocument } from "../../services/pdf/pdfGenerator";
import { InvoiceA4Document, PaperSize } from "./InvoiceA4Document";
import { Modal } from "../ui/Modal";

interface DocInspectModalProps {
  document: DocumentRecord | null;
  onClose: () => void;
}

export const DocInspectModal: React.FC<DocInspectModalProps> = ({
  document: doc,
  onClose,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [paperSize, setPaperSize] = useState<PaperSize>("a4");

  if (!doc) return null;

  const brandConfig = BRAND_CONFIGS[doc.brand] || BRAND_CONFIGS.tasnim_computers;

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await generateAndDownloadPdf(doc, paperSize);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      await printDocument(doc, paperSize);
    } catch (err) {
      console.error("Failed to print document:", err);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Modal
      isOpen={doc !== null}
      onClose={onClose}
      title={`Document Preview - ${doc.refNo}`}
      subtitle={`${brandConfig.displayName} Official Letterhead Invoice`}
      icon={FileText}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* PAPER SIZE SELECTOR BAR */}
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Paper Format:
            </span>
            <div className="inline-flex rounded-lg bg-gray-200/80 dark:bg-gray-700 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setPaperSize("a4")}
                className={`px-3 py-1 rounded-md transition-all ${
                  paperSize === "a4"
                    ? "bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 font-bold shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                }`}
              >
                A4 (Standard)
              </button>
              <button
                type="button"
                onClick={() => setPaperSize("a5")}
                className={`px-3 py-1 rounded-md transition-all ${
                  paperSize === "a5"
                    ? "bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 font-bold shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                }`}
              >
                A5 (Compact)
              </button>
            </div>
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            {paperSize === "a4" ? "210 × 297 mm" : "148 × 210 mm"}
          </span>
        </div>

        {/* PAPER PREVIEW CONTAINER */}
        <div className="overflow-x-auto max-h-[62vh] overflow-y-auto bg-gray-100 dark:bg-gray-950 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-800 flex justify-center shadow-inner">
          <div className="shadow-2xl rounded-sm overflow-hidden bg-white scale-[0.92] sm:scale-100 origin-top">
            <InvoiceA4Document document={doc} paperSize={paperSize} />
          </div>
        </div>

        {/* MODAL ACTION BAR */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Zero image borders • Crisp vector typography
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="tail-btn-secondary text-xs"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting || isDownloading}
              className="tail-btn-secondary text-xs"
            >
              {isPrinting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Printer className="size-3.5" />
              )}
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading || isPrinting}
              className="tail-btn-primary text-xs"
            >
              {isDownloading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <FileDown className="size-3.5" />
              )}
              <span>Save as PDF ({paperSize.toUpperCase()})</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
