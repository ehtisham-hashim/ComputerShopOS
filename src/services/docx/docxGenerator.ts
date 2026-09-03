import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  VerticalAlign,
  BorderStyle,
  ImageRun,
  UnderlineType,
  HeightRule,
  TabStopType,
  TabStopPosition,
  HorizontalPositionRelativeFrom,
  HorizontalPositionAlign,
  VerticalPositionRelativeFrom,
  TextWrappingType,
} from "docx";
import { saveAs } from "file-saver";
import { DocumentRecord, DocumentLineItem } from "../../db/schema";
import { BRAND_CONFIGS } from "./brandConfigs";
import { loadBrandAssets } from "./imageLoader";
import { parseDocumentItems } from "../../db/documentsService";

const NO_BORDER = {
  style: BorderStyle.NONE,
  size: 0,
  color: "FFFFFF",
};

const NO_BORDER_CONFIG = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
  insideHorizontal: NO_BORDER,
  insideVertical: NO_BORDER,
};

const BLACK_BORDER = {
  style: BorderStyle.SINGLE,
  size: 8,
  color: "000000",
};

const BORDER_CONFIG = {
  top: BLACK_BORDER,
  bottom: BLACK_BORDER,
  left: BLACK_BORDER,
  right: BLACK_BORDER,
  insideHorizontal: BLACK_BORDER,
  insideVertical: BLACK_BORDER,
};

const CELL_MARGINS = {
  top: 90,
  bottom: 90,
  left: 120,
  right: 120,
};

export async function generateAndDownloadDocx(doc: DocumentRecord): Promise<void> {
  const brandConfig = BRAND_CONFIGS[doc.brand] || BRAND_CONFIGS.tasnim_computers;
  const assets = await loadBrandAssets(doc.brand);
  const items: DocumentLineItem[] = parseDocumentItems(doc.itemsJson);

  // 1. Watermark (Placed as floating behindDocument run in the top paragraph)
  const watermarkChildren: (ImageRun | TextRun)[] = [];
  if (assets.watermark) {
    watermarkChildren.push(
      new ImageRun({
        data: assets.watermark,
        type: "png",
        transformation: {
          width: 320,
          height: 170,
        },
        floating: {
          horizontalPosition: {
            relative: HorizontalPositionRelativeFrom.PAGE,
            align: HorizontalPositionAlign.CENTER,
          },
          verticalPosition: {
            relative: VerticalPositionRelativeFrom.PAGE,
            offset: 4800000, // Center of standard A4 page behind table
          },
          wrap: {
            type: TextWrappingType.NONE,
          },
          behindDocument: true,
        },
      })
    );
  }

  // 2. Header Banner Image
  const headerChildren: (ImageRun | TextRun)[] = [...watermarkChildren];
  if (assets.header) {
    headerChildren.push(
      new ImageRun({
        data: assets.header,
        type: "jpg",
        transformation: {
          width: 595,
          height: 110,
        },
      })
    );
  }

  const headerParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 120 },
    children: headerChildren,
  });

  // 3. Ref.NO & Date Row (Using TabStop to guarantee zero table borders in LibreOffice)
  const refDateParagraph = new Paragraph({
    spacing: { before: 40, after: 80 },
    tabStops: [
      {
        type: TabStopType.RIGHT,
        position: TabStopPosition.MAX,
      },
    ],
    children: [
      new TextRun({ text: "Ref.NO ", bold: true, size: 21 }),
      new TextRun({
        text: doc.refNo,
        bold: true,
        size: 21,
        underline: { type: UnderlineType.SINGLE },
      }),
      new TextRun({
        text: "\tDate: " + doc.date,
        bold: true,
        size: 21,
      }),
    ],
  });

  // 4. Customer Info Block
  const customerParagraphs = [
    new Paragraph({
      spacing: { before: 20, after: 20 },
      children: [
        new TextRun({ text: "MS:              ", bold: true, size: 21 }),
        new TextRun({ text: doc.customerName.toUpperCase(), bold: true, size: 21 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 140 },
      children: [
        new TextRun({ text: "Address:      ", bold: true, size: 21 }),
        new TextRun({ text: doc.customerAddress || "PWD ISB,", size: 21 }),
      ],
    }),
  ];

  // 5. 5-Column Items Table
  const colWidths = {
    sn: { size: 7, type: WidthType.PERCENTAGE },
    desc: { size: 53, type: WidthType.PERCENTAGE },
    qty: { size: 8, type: WidthType.PERCENTAGE },
    price: { size: 16, type: WidthType.PERCENTAGE },
    total: { size: 16, type: WidthType.PERCENTAGE },
  };

  const tableHeaderRow = new TableRow({
    tableHeader: true,
    height: { value: 420, rule: HeightRule.ATLEAST },
    children: [
      new TableCell({
        width: colWidths.sn,
        borders: BORDER_CONFIG,
        margins: CELL_MARGINS,
        shading: { fill: "D9D9D9" },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "S N", bold: true, size: 20 })],
          }),
        ],
      }),
      new TableCell({
        width: colWidths.desc,
        borders: BORDER_CONFIG,
        margins: CELL_MARGINS,
        shading: { fill: "D9D9D9" },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Description", bold: true, size: 20 })],
          }),
        ],
      }),
      new TableCell({
        width: colWidths.qty,
        borders: BORDER_CONFIG,
        margins: CELL_MARGINS,
        shading: { fill: "D9D9D9" },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Qty", bold: true, size: 20 })],
          }),
        ],
      }),
      new TableCell({
        width: colWidths.price,
        borders: BORDER_CONFIG,
        margins: CELL_MARGINS,
        shading: { fill: "D9D9D9" },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Unit price", bold: true, size: 20 })],
          }),
        ],
      }),
      new TableCell({
        width: colWidths.total,
        borders: BORDER_CONFIG,
        margins: CELL_MARGINS,
        shading: { fill: "D9D9D9" },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Total Amount", bold: true, size: 20 })],
          }),
        ],
      }),
    ],
  });

  // Table Data Rows
  const tableDataRows = items.map((item, index) => {
    const descLines = (item.description || "").split("\n");
    const descParagraphs = descLines.map((line, lIdx) =>
      new Paragraph({
        spacing: { before: 30, after: 30 },
        children: [
          new TextRun({
            text: line.trim(),
            bold: lIdx === 0,
            size: lIdx === 0 ? 20 : 18,
          }),
        ],
      })
    );

    const qtyStr = item.qty < 10 ? "0" + item.qty : "" + item.qty;

    return new TableRow({
      height: { value: 650, rule: HeightRule.ATLEAST },
      children: [
        new TableCell({
          width: colWidths.sn,
          borders: BORDER_CONFIG,
          margins: CELL_MARGINS,
          verticalAlign: VerticalAlign.TOP,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "" + (index + 1), size: 20 })],
            }),
          ],
        }),
        new TableCell({
          width: colWidths.desc,
          borders: BORDER_CONFIG,
          margins: CELL_MARGINS,
          verticalAlign: VerticalAlign.TOP,
          children: descParagraphs,
        }),
        new TableCell({
          width: colWidths.qty,
          borders: BORDER_CONFIG,
          margins: CELL_MARGINS,
          verticalAlign: VerticalAlign.TOP,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: qtyStr, size: 20 })],
            }),
          ],
        }),
        new TableCell({
          width: colWidths.price,
          borders: BORDER_CONFIG,
          margins: CELL_MARGINS,
          verticalAlign: VerticalAlign.TOP,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "" + item.unitPrice, size: 20 })],
            }),
          ],
        }),
        new TableCell({
          width: colWidths.total,
          borders: BORDER_CONFIG,
          margins: CELL_MARGINS,
          verticalAlign: VerticalAlign.TOP,
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: item.totalAmount.toLocaleString() + "/.",
                  size: 20,
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  // Empty filler rows to maintain full-page proportion
  const totalRowsTarget = 5;
  const emptyRowsCount = Math.max(0, totalRowsTarget - items.length);
  const emptyRows: TableRow[] = [];
  for (let i = 0; i < emptyRowsCount; i++) {
    emptyRows.push(
      new TableRow({
        height: { value: 520, rule: HeightRule.ATLEAST },
        children: [
          new TableCell({
            width: colWidths.sn,
            borders: BORDER_CONFIG,
            margins: CELL_MARGINS,
            children: [new Paragraph({ children: [new TextRun({ text: " " })] })],
          }),
          new TableCell({
            width: colWidths.desc,
            borders: BORDER_CONFIG,
            margins: CELL_MARGINS,
            children: [new Paragraph({ children: [new TextRun({ text: " " })] })],
          }),
          new TableCell({
            width: colWidths.qty,
            borders: BORDER_CONFIG,
            margins: CELL_MARGINS,
            children: [new Paragraph({ children: [new TextRun({ text: " " })] })],
          }),
          new TableCell({
            width: colWidths.price,
            borders: BORDER_CONFIG,
            margins: CELL_MARGINS,
            children: [new Paragraph({ children: [new TextRun({ text: " " })] })],
          }),
          new TableCell({
            width: colWidths.total,
            borders: BORDER_CONFIG,
            margins: CELL_MARGINS,
            children: [new Paragraph({ children: [new TextRun({ text: " " })] })],
          }),
        ],
      })
    );
  }

  // Summary Row (TOTAL AMOUNT)
  const totalRow = new TableRow({
    height: { value: 450, rule: HeightRule.ATLEAST },
    children: [
      new TableCell({
        columnSpan: 4,
        borders: BORDER_CONFIG,
        margins: CELL_MARGINS,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "TOTAL AMOUNT",
                bold: true,
                size: 21,
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: colWidths.total,
        borders: BORDER_CONFIG,
        margins: CELL_MARGINS,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: doc.totalAmount.toLocaleString() + "/.",
                bold: true,
                size: 21,
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const mainTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORDER_CONFIG,
    rows: [tableHeaderRow, ...tableDataRows, ...emptyRows, totalRow],
  });

  // 6. Terms & Sign-off Section
  const termsParagraphs = [
    new Paragraph({
      spacing: { before: 200, after: 30 },
      children: [
        new TextRun({
          text: "TERMS & CONDITIONS: -",
          bold: true,
          size: 19,
          underline: { type: UnderlineType.SINGLE },
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 20 },
      children: [
        new TextRun({
          text: "PAYMENT MODE: " + (doc.paymentMode || "CASH").toUpperCase(),
          bold: true,
          size: 19,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 50 },
      children: [
        new TextRun({
          text: (doc.warrantyTerms || "ONE WEEK CHECK WARRENTY").toUpperCase(),
          bold: true,
          size: 19,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 30 },
      children: [
        new TextRun({
          text: "Thank you and best regards,",
          size: 19,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: "THIS IS A SYSTEM GENERATED INVOICE AND DOES NOT NEED ANY SIGNATURE",
          bold: true,
          size: 17,
        }),
      ],
    }),
  ];

  // 7. Bottom Section:
  // Left: Branch Details
  // Right: Stamp ABOVE the Computer Graphic (Vertical Stack)
  const rightChildren: Paragraph[] = [];
  if (assets.stamp) {
    rightChildren.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 40 },
        children: [
          new ImageRun({
            data: assets.stamp,
            type: "png",
            transformation: {
              width: 90,
              height: 90,
            },
          }),
        ],
      })
    );
  }
  if (assets.graphic) {
    rightChildren.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new ImageRun({
            data: assets.graphic,
            type: "png",
            transformation: {
              width: 140,
              height: 90,
            },
          }),
        ],
      })
    );
  }

  const branchParagraphs = brandConfig.addresses.map((addr) =>
    new Paragraph({
      spacing: { after: 30 },
      children: [new TextRun({ text: addr, size: 16, bold: true })],
    })
  );

  const bottomTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDER_CONFIG,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: NO_BORDER_CONFIG,
            verticalAlign: VerticalAlign.BOTTOM,
            children: branchParagraphs,
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: NO_BORDER_CONFIG,
            verticalAlign: VerticalAlign.BOTTOM,
            children: rightChildren,
          }),
        ],
      }),
    ],
  });

  // Assemble full Word document
  const wordDoc = new Document({
    creator: "ComputerShopOS",
    title: doc.refNo + " - " + doc.customerName,
    description: "Generated Document for " + brandConfig.displayName,
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 20,
            color: "111827",
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 450,
              bottom: 400,
              left: 700,
              right: 700,
            },
          },
        },
        children: [
          headerParagraph,
          refDateParagraph,
          ...customerParagraphs,
          mainTable,
          ...termsParagraphs,
          bottomTable,
        ],
      },
    ],
  });

  // Pack into Blob and download
  const blob = await Packer.toBlob(wordDoc);
  const cleanRef = doc.refNo.replace(/[^a-zA-Z0-9_-]/g, "_");
  const cleanCust = doc.customerName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = doc.brand + "_" + cleanRef + "_" + cleanCust + ".docx";

  const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

  if (isTauri) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = Array.from(new Uint8Array(arrayBuffer));
      const savedPath = await invoke<string | null>("save_docx_file", {
        defaultName: filename,
        data: bytes,
      });
      if (savedPath) {
        console.log("Document saved successfully to:", savedPath);
        return;
      } else {
        // User cancelled the file save dialog
        return;
      }
    } catch (err) {
      console.warn("Tauri native save dialog failed, fallback to browser saveAs:", err);
    }
  }

  saveAs(blob, filename);
}
