import React from "react";
import { createRoot } from "react-dom/client";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { saveAs } from "file-saver";
import { DocumentRecord } from "../../db/schema";
import { InvoiceA4Document, PaperSize, PrintLayoutMode } from "../../components/docGenerator/InvoiceA4Document";

/**
 * Wait for all images inside an element to fully load
 */
function waitForImages(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll("img"));
  if (images.length === 0) return Promise.resolve();

  const promises = images.map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
  });

  return Promise.all(promises).then(() => new Promise((r) => setTimeout(r, 120)));
}

/**
 * Generate high-resolution PDF (A4 or A5) supporting multi-page output
 */
export async function generateAndDownloadPdf(
  doc: DocumentRecord,
  paperSize: PaperSize = "a4",
  printMode: PrintLayoutMode = "full",
  includeRefAndDate?: boolean
): Promise<void> {
  const isA5 = paperSize === "a5";
  const isLetter = paperSize === "letter";
  const isLegal = paperSize === "legal";

  const pdfFormat = isA5 ? "a5" : isLetter ? "letter" : isLegal ? "legal" : "a4";
  const targetWidth = isA5 ? 148 : (isLetter || isLegal ? 215.9 : 210);
  const targetHeight = isA5 ? 210 : isLetter ? 279.4 : isLegal ? 355.6 : 297;
  const containerWidth = isA5 ? "148mm" : (isLetter || isLegal ? "215.9mm" : "210mm");

  // Create off-screen rendering container
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = containerWidth;
  container.style.backgroundColor = "#ffffff";
  container.style.zIndex = "-9999";
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    // Render the invoice component
    await new Promise<void>((resolve) => {
      root.render(
        React.createElement(InvoiceA4Document, {
          document: doc,
          paperSize: paperSize,
          printMode: printMode,
          includeRefAndDate: includeRefAndDate,
        })
      );
      setTimeout(resolve, 80);
    });

    await waitForImages(container);

    const pageElements = Array.from(
      container.querySelectorAll(".invoice-page")
    ) as HTMLElement[];

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: pdfFormat,
      compress: true,
    });

    for (let i = 0; i < pageElements.length; i++) {
      if (i > 0) {
        pdf.addPage(pdfFormat, "portrait");
      }

      const canvas = await html2canvas(pageElements[i], {
        scale: 2.5,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement("style");
          style.innerHTML = `
            * {
              font-family: Arial, Helvetica, sans-serif !important;
              letter-spacing: normal !important;
              word-spacing: normal !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        },
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      pdf.addImage(imgData, "JPEG", 0, 0, targetWidth, targetHeight, undefined, "FAST");
    }

    const cleanRef = doc.refNo.replace(/[^a-zA-Z0-9_-]/g, "_");
    const cleanCust = doc.customerName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const modeTag = printMode === "table_only" ? "_TABLE_ONLY" : "";
    const filename = `${doc.brand}_${cleanRef}_${cleanCust}_${paperSize.toUpperCase()}${modeTag}.pdf`;

    const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

    if (isTauri) {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const arrayBuffer = pdf.output("arraybuffer");
        const bytes = Array.from(new Uint8Array(arrayBuffer));

        const savedPath = await invoke<string | null>("save_pdf_file", {
          defaultName: filename,
          data: bytes,
        });

        if (savedPath) {
          console.log("PDF saved successfully to:", savedPath);
          return;
        } else {
          return;
        }
      } catch (err) {
        console.warn("Tauri native save_pdf_file failed, fallback to browser saveAs:", err);
      }
    }

    // Modern browser File System Access API: Prompt user for destination file & folder
    if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: "PDF Document (*.pdf)",
              accept: { "application/pdf": [".pdf"] },
            },
          ],
        });
        const writable = await handle.createWritable();
        const pdfBlob = pdf.output("blob");
        await writable.write(pdfBlob);
        await writable.close();
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") {
          // User cancelled the save dialog
          return;
        }
        console.warn("showSaveFilePicker failed, falling back to saveAs:", err);
      }
    }

    // Fallback: standard browser download via saveAs
    const pdfBlob = pdf.output("blob");
    saveAs(pdfBlob, filename);
  } finally {
    setTimeout(() => {
      root.unmount();
      container.remove();
    }, 100);
  }
}

/**
 * Print document directly via system print dialog using a hidden iframe
 */
export async function printDocument(
  doc: DocumentRecord,
  paperSize: PaperSize = "a4",
  printMode: PrintLayoutMode = "full",
  includeRefAndDate?: boolean
): Promise<void> {
  const isA5 = paperSize === "a5";
  const isLetter = paperSize === "letter";
  const isLegal = paperSize === "legal";
  const containerWidth = isA5 ? "148mm" : (isLetter || isLegal ? "215.9mm" : "210mm");

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = containerWidth;
  container.style.backgroundColor = "#ffffff";
  container.style.zIndex = "-9999";
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    await new Promise<void>((resolve) => {
      root.render(
        React.createElement(InvoiceA4Document, {
          document: doc,
          paperSize: paperSize,
          printMode: printMode,
          includeRefAndDate: includeRefAndDate,
        })
      );
      setTimeout(resolve, 80);
    });

    await waitForImages(container);

    const invoiceWrapper = container.querySelector(".invoice-document-wrapper") as HTMLElement || container;

    // Create an invisible iframe for isolated printing
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      window.print();
      return;
    }

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${doc.refNo} - ${doc.customerName}</title>
          <style>
            @page {
              size: ${paperSize.toUpperCase()} portrait;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background-color: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              font-family: Arial, Helvetica, sans-serif;
            }
            img {
              border: none !important;
              outline: none !important;
              box-shadow: none !important;
            }
            .invoice-page {
              page-break-after: always;
            }
            .invoice-page:last-child {
              page-break-after: auto;
            }
          </style>
        </head>
        <body>
          ${invoiceWrapper.outerHTML}
        </body>
      </html>
    `);
    iframeDoc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        iframe.remove();
      }, 1000);
    }, 300);
  } finally {
    setTimeout(() => {
      root.unmount();
      container.remove();
    }, 100);
  }
}
