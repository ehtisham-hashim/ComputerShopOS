import React, { useState, useEffect } from "react";
import {
  FileText,
  FileDown,
  Printer,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
} from "lucide-react";
import { DocumentRecord } from "../../db/schema";
import { BRAND_CONFIGS } from "../../services/docx/brandConfigs";
import { generateAndDownloadPdf, printDocument } from "../../services/pdf/pdfGenerator";
import { InvoiceA4Document, PaperSize } from "./InvoiceA4Document";
import { Modal } from "../ui/Modal";

interface DocInspectModalProps {
  document: DocumentRecord | null;
  initialPaperSize?: PaperSize;
  onClose: () => void;
}

const getFitZoom = (size: PaperSize): number => {
  switch (size) {
    case "a5":
      return 0.75;
    case "letter":
      return 0.58;
    case "a4":
      return 0.55;
    case "legal":
      return 0.46;
  }
};

export const DocInspectModal: React.FC<DocInspectModalProps> = ({
  document: doc,
  initialPaperSize = "a4",
  onClose,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [paperSize, setPaperSize] = useState<PaperSize>(initialPaperSize);
  const [zoom, setZoom] = useState<number>(() => getFitZoom(initialPaperSize));

  useEffect(() => {
    if (initialPaperSize) {
      setPaperSize(initialPaperSize);
      setZoom(getFitZoom(initialPaperSize));
    }
  }, [initialPaperSize, doc]);

  if (!doc) return null;

  const brandConfig = BRAND_CONFIGS[doc.brand] || BRAND_CONFIGS.tasnim_computers;

  const handleSelectPaperSize = (size: PaperSize) => {
    setPaperSize(size);
    setZoom(getFitZoom(size));
  };

  const handleZoomIn = () => {
    setZoom((z) => Math.min(2.0, Number((z + 0.1).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(0.3, Number((z - 0.1).toFixed(2))));
  };

  const handleFitPage = () => {
    setZoom(getFitZoom(paperSize));
  };

  const handleReset100 = () => {
    setZoom(1.0);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const step = 0.06;
      const delta = e.deltaY < 0 ? step : -step;
      setZoom((z) => Math.min(2.0, Math.max(0.3, Number((z + delta).toFixed(2)))));
    }
  };

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

  const isZoomSupported =
    typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("zoom", "1");

  const pageWidthMm =
    paperSize === "a5" ? 148 : paperSize === "letter" || paperSize === "legal" ? 215.9 : 210;
  const pageHeightMm =
    paperSize === "a5" ? 210 : paperSize === "letter" ? 279.4 : paperSize === "legal" ? 355.6 : 297;
  const scaledWidthMm = pageWidthMm * zoom;
  const scaledHeightMm = pageHeightMm * zoom;

  return (
    <Modal
      isOpen={doc !== null}
      onClose={onClose}
      title={`Document Preview - ${doc.refNo}`}
      subtitle={`${brandConfig.displayName} Official Letterhead Invoice`}
      icon={FileText}
      maxWidth="4xl"
      bodyClassName="flex flex-col flex-1 min-h-0 overflow-hidden p-0"
    >
      <div className="flex flex-col flex-1 min-h-0 h-[78vh] sm:h-[82vh] overflow-hidden">
        {/* TOP TOOLBAR: PAPER FORMAT + ZOOM CONTROLS */}
        <div className="shrink-0 px-4 py-2 bg-gray-50 dark:bg-gray-800/90 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2.5">
          {/* Paper Format Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Format:
            </span>
            <div className="inline-flex rounded-lg bg-gray-200/80 dark:bg-gray-700 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => handleSelectPaperSize("a4")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  paperSize === "a4"
                    ? "bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 font-bold shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                }`}
              >
                A4
              </button>
              <button
                type="button"
                onClick={() => handleSelectPaperSize("a5")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  paperSize === "a5"
                    ? "bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 font-bold shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                }`}
              >
                A5
              </button>
              <button
                type="button"
                onClick={() => handleSelectPaperSize("letter")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  paperSize === "letter"
                    ? "bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 font-bold shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                }`}
              >
                Letter
              </button>
              <button
                type="button"
                onClick={() => handleSelectPaperSize("legal")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  paperSize === "legal"
                    ? "bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 font-bold shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                }`}
              >
                Legal
              </button>
            </div>
          </div>

          {/* Zoom Controls & Dimensions */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[11px] text-gray-500 dark:text-gray-400 font-medium font-mono mr-1">
              {paperSize === "a4"
                ? "210 × 297 mm"
                : paperSize === "a5"
                ? "148 × 210 mm"
                : paperSize === "letter"
                ? "8.5 × 11 in (216 × 279 mm)"
                : "8.5 × 14 in (216 × 356 mm)"}
            </span>

            {/* Zoom Button Group */}
            <div className="inline-flex items-center rounded-lg bg-gray-200/80 dark:bg-gray-700 p-0.5 text-xs">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 0.3}
                title="Zoom Out (Ctrl -)"
                className="p-1 rounded-md text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 disabled:opacity-40 transition-all"
              >
                <ZoomOut className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={handleFitPage}
                title="Click to Fit to Page"
                className="px-2 py-0.5 font-mono text-[11px] font-bold text-gray-700 dark:text-gray-200 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 2.0}
                title="Zoom In (Ctrl +)"
                className="p-1 rounded-md text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 disabled:opacity-40 transition-all"
              >
                <ZoomIn className="size-3.5" />
              </button>
            </div>

            {/* Fit to Page & 100% Quick Buttons */}
            <div className="inline-flex items-center rounded-lg bg-gray-200/80 dark:bg-gray-700 p-0.5 text-xs gap-0.5">
              <button
                type="button"
                onClick={handleFitPage}
                title="Fit full page to screen"
                className="px-2 py-1 rounded-md text-[11px] font-medium text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 transition-all flex items-center gap-1"
              >
                <Maximize2 className="size-3" />
                <span>Fit</span>
              </button>
              <button
                type="button"
                onClick={handleReset100}
                title="Actual 100% size"
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
                  zoom === 1.0
                    ? "bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 font-bold shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900"
                }`}
              >
                <RotateCcw className="size-3" />
                <span>100%</span>
              </button>
            </div>
          </div>
        </div>

        {/* MIDDLE PREVIEW CANVAS: CLEAN DEDICATED SCROLL VIEWPORT */}
        <div
          onWheel={handleWheel}
          className="flex-1 min-h-0 overflow-auto bg-zinc-900/95 dark:bg-zinc-950 p-4 sm:p-8 flex justify-center items-start shadow-inner select-none cursor-default"
        >
          <div
            style={
              isZoomSupported
                ? { zoom }
                : {
                    width: `${scaledWidthMm}mm`,
                    minHeight: `${scaledHeightMm}mm`,
                  }
            }
            className="flex justify-center transition-[zoom] duration-75"
          >
            <div
              style={
                !isZoomSupported
                  ? {
                      width: `${pageWidthMm}mm`,
                      transform: `scale(${zoom})`,
                      transformOrigin: "top center",
                    }
                  : undefined
              }
              className="shadow-2xl rounded-sm bg-white"
            >
              <InvoiceA4Document document={doc} paperSize={paperSize} />
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR: PINNED TO BOTTOM */}
        <div className="shrink-0 px-5 py-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between">
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            Scroll to view • Ctrl + Mouse Wheel to zoom • Crisp vector typography
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
