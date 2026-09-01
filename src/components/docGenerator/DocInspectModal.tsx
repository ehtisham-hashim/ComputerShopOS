import React, { useState } from "react";
import { FileText, FileDown, Loader2 } from "lucide-react";
import { DocumentRecord } from "../../db/schema";
import { parseDocumentItems } from "../../db/documentsService";
import { BRAND_CONFIGS } from "../../services/docx/brandConfigs";
import { BRAND_ASSETS_MAP } from "../../services/docx/imageLoader";
import { generateAndDownloadDocx } from "../../services/docx/docxGenerator";
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

  if (!doc) return null;

  const brandConfig = BRAND_CONFIGS[doc.brand] || BRAND_CONFIGS.tasnim_computers;
  const assets = BRAND_ASSETS_MAP[doc.brand] || BRAND_ASSETS_MAP.tasnim_computers;
  const items = parseDocumentItems(doc.itemsJson);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await generateAndDownloadDocx(doc);
    } catch (err) {
      console.error("Failed to generate DOCX:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Add empty filler rows if needed to match real invoice height
  const emptyRowsCount = Math.max(0, 3 - items.length);

  return (
    <Modal
      isOpen={doc !== null}
      onClose={onClose}
      title={"Document Preview - " + doc.refNo}
      subtitle={brandConfig.displayName + " Official Letterhead Invoice"}
      icon={FileText}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* A4 PAPER INVOICE CONTAINER */}
        <div className="relative overflow-hidden rounded-xl border border-gray-300 bg-white p-6 sm:p-8 text-black shadow-lg font-sans">
          
          {/* WATERMARK IN BACKGROUND */}
          {assets.watermark && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.08]">
              <img
                src={assets.watermark}
                alt="Watermark"
                className="max-h-[380px] max-w-[450px] object-contain select-none"
              />
            </div>
          )}

          {/* 1. TOP HEADER BANNER IMAGE */}
          <div className="relative z-10 w-full mb-3">
            <img
              src={assets.header}
              alt={brandConfig.displayName + " Header"}
              className="w-full h-auto object-contain rounded-sm"
            />
          </div>

          {/* 2. METADATA ROW: REF NO & DATE */}
          <div className="relative z-10 flex items-center justify-between text-xs font-bold text-gray-900 pb-2 border-b border-gray-200">
            <div>
              <span>Ref.NO </span>
              <span className="underline font-mono text-sm tracking-wide">
                {doc.refNo}
              </span>
            </div>
            <div>
              <span>Date: </span>
              <span className="font-mono text-sm">{doc.date}</span>
            </div>
          </div>

          {/* 3. CUSTOMER BLOCK */}
          <div className="relative z-10 my-3 text-xs text-gray-900 space-y-1">
            <div className="font-bold flex items-start gap-4">
              <span className="w-16 shrink-0">MS:</span>
              <span className="text-sm font-black tracking-wide">
                {doc.customerName.toUpperCase()}
              </span>
            </div>
            <div className="font-semibold flex items-start gap-4">
              <span className="w-16 shrink-0">Address:</span>
              <span className="text-gray-700">
                {doc.customerAddress || "N/A"}
              </span>
            </div>
          </div>

          {/* 4. 5-COLUMN ITEMS TABLE */}
          <div className="relative z-10 my-4 overflow-hidden border border-gray-800 rounded-none">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-800 text-gray-900 font-bold">
                  <th className="px-3 py-2 text-center w-12 border-r border-gray-800">S N</th>
                  <th className="px-3 py-2 border-r border-gray-800">Description</th>
                  <th className="px-3 py-2 text-center w-14 border-r border-gray-800">Qty</th>
                  <th className="px-3 py-2 text-center w-24 border-r border-gray-800">Unit price</th>
                  <th className="px-3 py-2 text-right w-28">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {items.map((item, idx) => {
                  const lines = (item.description || "").split("\n");
                  const qtyStr = item.qty < 10 ? "0" + item.qty : "" + item.qty;

                  return (
                    <tr key={idx} className="align-top">
                      <td className="px-3 py-2.5 text-center font-bold border-r border-gray-800">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2.5 border-r border-gray-800">
                        <div className="font-bold text-gray-950">{lines[0]}</div>
                        {lines.length > 1 && (
                          <div className="text-[11px] font-semibold text-gray-700 mt-0.5 whitespace-pre-line">
                            {lines.slice(1).join("\n")}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center border-r border-gray-800 font-mono font-semibold">
                        {qtyStr}
                      </td>
                      <td className="px-3 py-2.5 text-center border-r border-gray-800 font-mono font-semibold">
                        {item.unitPrice.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-gray-950">
                        {item.totalAmount.toLocaleString()}/.
                      </td>
                    </tr>
                  );
                })}

                {/* Empty Rows Filler */}
                {Array.from({ length: emptyRowsCount }).map((_, i) => (
                  <tr key={"empty-" + i} className="h-7">
                    <td className="border-r border-gray-800"></td>
                    <td className="border-r border-gray-800"></td>
                    <td className="border-r border-gray-800"></td>
                    <td className="border-r border-gray-800"></td>
                    <td></td>
                  </tr>
                ))}

                {/* TOTAL AMOUNT ROW */}
                <tr className="bg-gray-50 font-bold border-t-2 border-gray-800 text-xs">
                  <td colSpan={4} className="px-3 py-2.5 uppercase font-black tracking-wider">
                    TOTAL AMOUNT
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-sm font-black text-gray-950">
                    {doc.totalAmount.toLocaleString()}/.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 5. TERMS & CONDITIONS */}
          <div className="relative z-10 my-4 space-y-1 text-xs text-gray-900">
            <div className="font-bold underline text-[11px]">TERMS & CONDITIONS: -</div>
            <div className="font-bold text-[11px]">PAYMENT MODE: {(doc.paymentMode || "CASH").toUpperCase()}</div>
            <div className="font-bold text-[11px]">
              {(doc.warrantyTerms || "ONE WEEK CHECK WARRENTY").toUpperCase()}
            </div>
            <div className="pt-2 text-gray-600 text-[11px]">Thank you and best regards,</div>
            <div className="font-bold text-[10px] text-gray-800 pt-0.5">
              THIS IS A SYSTEM GENERATED INVOICE AND DOES NOT NEED ANY SIGNATURE
            </div>
          </div>

          {/* 6. BOTTOM SECTION: ADDRESSES & STAMP + PC GRAPHIC */}
          <div className="relative z-10 mt-6 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-end justify-between gap-4">
            {/* Left: Branch Addresses */}
            <div className="text-[11px] space-y-1 text-gray-700 font-medium max-w-[360px]">
              {brandConfig.addresses.map((addr, i) => (
                <div key={i} className="font-bold text-gray-800">
                  {addr}
                </div>
              ))}
            </div>

            {/* Right: Circular Stamp + PC Graphic */}
            <div className="flex items-center gap-3 shrink-0">
              {assets.stamp && (
                <img
                  src={assets.stamp}
                  alt="Stamp"
                  className="size-20 object-contain drop-shadow-sm"
                />
              )}
              {assets.graphic && (
                <img
                  src={assets.graphic}
                  alt="Hardware Graphic"
                  className="h-16 w-24 object-contain"
                />
              )}
            </div>
          </div>

        </div>

        {/* MODAL ACTION BAR */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500">
            Letterhead layout verified for standard A4 printing
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="tail-btn-secondary text-xs"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="tail-btn-primary text-xs"
            >
              {isDownloading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <FileDown className="size-3.5" />
              )}
              <span>Save & Export DOCX</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
