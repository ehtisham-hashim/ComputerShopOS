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
  size: 4,
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
  left: 110,
  right: 110,
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
          width: brandConfig.watermarkDimensions.width,
          height: brandConfig.watermarkDimensions.height,
        },
        floating: {
          horizontalPosition: {
            relative: HorizontalPositionRelativeFrom.PAGE,
            align: HorizontalPositionAlign.CENTER,
          },
          verticalPosition: {
            relative: VerticalPositionRelativeFrom.PAGE,
            offset: 3600000, // Vertically centered directly behind the items table
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
          width: brandConfig.headerDimensions.width,
          height: brandConfig.headerDimensions.height,
        },
      })
    );
  }

  const headerParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 100 },
    children: headerChildren,
  });

  // 3. Ref.NO & Date Row (Using TabStop to guarantee zero table borders in LibreOffice)
  const refDateParagraph = new Paragraph({
    spacing: { before: 20, after: 60 },
    tabStops: [
      {
        type: TabStopType.RIGHT,
        position: TabStopPosition.MAX,
      },
    ],
    children: [
      new TextRun({ text: "Ref.NO ", bold: true, size: 24 }),
      new TextRun({
        text: doc.refNo,
        bold: true,
        size: 24,
        underline: { type: UnderlineType.SINGLE },
      }),
      new TextRun({
        text: "\tDate: " + doc.date,
        bold: true,
        size: 24,
      }),
    ],
  });

  // 4. Customer Info Block
  const customerParagraphs = [
    new Paragraph({
      spacing: { before: 10, after: 10 },
      children: [
        new TextRun({ text: "MS:              ", bold: true, size: 24 }),
        new TextRun({ text: doc.customerName.toUpperCase(), bold: true, size: 24 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 90 },
      children: [
        new TextRun({ text: "Address:      ", bold: true, size: 24 }),
        new TextRun({ text: doc.customerAddress || "PWD ISB,", size: 24 }),
      ],
    }),
  ];

  // 5. 5-Column Items Table (Matching LAPTOP BILL reference: 8%, 54%, 7%, 14%, 17%)
  const colWidths = {
    sn: { size: 8, type: WidthType.PERCENTAGE },
    desc: { size: 54, type: WidthType.PERCENTAGE },
    qty: { size: 7, type: WidthType.PERCENTAGE },
    price: { size: 14, type: WidthType.PERCENTAGE },
    total: { size: 17, type: WidthType.PERCENTAGE },
  };

  const tableHeaderRow = new TableRow({
    tableHeader: true,
    height: { value: 460, rule: HeightRule.ATLEAST },
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
            children: [new TextRun({ text: "S N", bold: true, size: 22 })],
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
            children: [new TextRun({ text: "Description", bold: true, size: 22 })],
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
            children: [new TextRun({ text: "Qty", bold: true, size: 22 })],
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
            children: [new TextRun({ text: "Unit price", bold: true, size: 22 })],
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
            children: [new TextRun({ text: "Total Amount", bold: true, size: 22 })],
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
        spacing: { before: 20, after: 20 },
        children: [
          new TextRun({
            text: line.trim(),
            bold: lIdx === 0,
            size: lIdx === 0 ? 22 : 20,
          }),
        ],
      })
    );

    const qtyStr = item.qty < 10 ? "0" + item.qty : "" + item.qty;

    return new TableRow({
      height: { value: 520, rule: HeightRule.ATLEAST },
      children: [
        new TableCell({
          width: colWidths.sn,
          borders: BORDER_CONFIG,
          margins: CELL_MARGINS,
          verticalAlign: VerticalAlign.TOP,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "" + (index + 1), size: 22 })],
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
              children: [new TextRun({ text: qtyStr, size: 22 })],
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
              children: [new TextRun({ text: "" + item.unitPrice, size: 22 })],
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
                  size: 22,
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  // Empty filler rows to maintain full-page proportion
  const totalRowsTarget = brandConfig.targetEmptyRows;
  const emptyRowsCount = Math.max(0, totalRowsTarget - items.length);
  const emptyRows: TableRow[] = [];
  for (let i = 0; i < emptyRowsCount; i++) {
    emptyRows.push(
      new TableRow({
        height: { value: 480, rule: HeightRule.ATLEAST },
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
    height: { value: 480, rule: HeightRule.ATLEAST },
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
                size: 23,
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
                size: 23,
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
  const termsHeadingText = brandConfig.termsHeading || "TERMS & CONDITIONS: -";
  const termsParagraphs = [
    new Paragraph({
      spacing: { before: 130, after: 20 },
      children: [
        new TextRun({
          text: termsHeadingText,
          bold: true,
          size: 21,
          underline: { type: UnderlineType.SINGLE },
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 15 },
      children: [
        new TextRun({
          text: "PAYMENT MODE: " + (doc.paymentMode || "CASH").toUpperCase(),
          bold: true,
          size: 20,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 25 },
      children: [
        new TextRun({
          text: (doc.warrantyTerms || "ONE WEEK CHECK WARRENTY").toUpperCase(),
          bold: true,
          size: 20,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 20 },
      children: [
        new TextRun({
          text: "Thank you and best regards,",
          size: 20,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 35 },
      children: [
        new TextRun({
          text: "THIS IS A SYSTEM GENERATED INVOICE AND DOES NOT NEED ANY SIGNATURE",
          bold: true,
          size: 18,
        }),
      ],
    }),
  ];

  // 7. Bottom Section:
  // For brands with full-width footer banner (Farhan Computers, Farhan Enterprises):
  // Stamp above footer on right + full-width footer image banner at the bottom.
  // For Tasnim Computers:
  // Branch details on left + Stamp & PC graphic on right.
  const bottomElements: (Paragraph | Table)[] = [];

  if (brandConfig.hasFooterBanner && assets.footer) {
    if (assets.stamp) {
      bottomElements.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 30, after: 15 },
          children: [
            new ImageRun({
              data: assets.stamp,
              type: "png",
              transformation: {
                width: brandConfig.stampDimensions.width,
                height: brandConfig.stampDimensions.height,
              },
            }),
          ],
        })
      );
    }

    bottomElements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 10, after: 0 },
        children: [
          new ImageRun({
            data: assets.footer,
            type: "jpg",
            transformation: {
              width: brandConfig.footerDimensions!.width,
              height: brandConfig.footerDimensions!.height,
            },
          }),
        ],
      })
    );
  } else {
    // Tasnim Computers layout: addresses on left with icons, stamp + PC graphic on right
    const rightChildren: Paragraph[] = [];
    if (assets.stamp) {
      rightChildren.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 12 },
          children: [
            new ImageRun({
              data: assets.stamp,
              type: "png",
              transformation: {
                width: brandConfig.stampDimensions.width,
                height: brandConfig.stampDimensions.height,
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
                width: brandConfig.graphicDimensions?.width || 145,
                height: brandConfig.graphicDimensions?.height || 94,
              },
            }),
          ],
        })
      );
    }

    // Branch paragraphs with detailed styling
    const branchLines = [
      new Paragraph({
        spacing: { after: 12 },
        children: [
          new TextRun({ text: "Branch 1: ", bold: true, size: 18 }),
          new TextRun({ text: "Anwar Chowk, Wah Cantt.", size: 18 }),
        ],
      }),
      new Paragraph({
        spacing: { after: 18 },
        children: [
          new TextRun({ text: "0345-5982628    ", size: 18 }),
          ...(assets.phoneIcon
            ? [
                new ImageRun({
                  data: assets.phoneIcon,
                  type: "png",
                  transformation: { width: 13, height: 13 },
                }),
              ]
            : []),
          new TextRun({ text: "  051-4265300", size: 18 }),
        ],
      }),
      new Paragraph({
        spacing: { after: 12 },
        children: [
          new TextRun({ text: "Branch 2: ", bold: true, size: 18 }),
          new TextRun({ text: "Bilal Market NawabAbad, Near Barrier 2 WahCantt.", size: 18 }),
        ],
      }),
      new Paragraph({
        spacing: { after: 0 },
        children: [
          new TextRun({ text: "0301-5177866    ", size: 18 }),
          ...(assets.emailIcon
            ? [
                new ImageRun({
                  data: assets.emailIcon,
                  type: "png",
                  transformation: { width: 14, height: 11 },
                }),
              ]
            : []),
          new TextRun({
            text: "  tcomwah@gmail.com",
            size: 18,
            color: "0000FF",
            underline: { type: UnderlineType.SINGLE },
          }),
        ],
      }),
    ];

    let leftCellContent: (Paragraph | Table)[];

    if (assets.contactIcons) {
      // Sub-table pairing the 4-icon strip on the left with branch text lines
      leftCellContent = [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: NO_BORDER_CONFIG,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 8, type: WidthType.PERCENTAGE },
                  borders: NO_BORDER_CONFIG,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      children: [
                        new ImageRun({
                          data: assets.contactIcons,
                          type: "png",
                          transformation: { width: 16, height: 82 },
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 92, type: WidthType.PERCENTAGE },
                  borders: NO_BORDER_CONFIG,
                  verticalAlign: VerticalAlign.CENTER,
                  children: branchLines,
                }),
              ],
            }),
          ],
        }),
      ];
    } else {
      leftCellContent = branchLines;
    }

    bottomElements.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: NO_BORDER_CONFIG,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 65, type: WidthType.PERCENTAGE },
                borders: NO_BORDER_CONFIG,
                verticalAlign: VerticalAlign.BOTTOM,
                children: leftCellContent,
              }),
              new TableCell({
                width: { size: 35, type: WidthType.PERCENTAGE },
                borders: NO_BORDER_CONFIG,
                verticalAlign: VerticalAlign.BOTTOM,
                children: rightChildren,
              }),
            ],
          }),
        ],
      })
    );
  }

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
            size: {
              width: 11906,
              height: 16838,
            },
            margin: {
              top: 500,
              bottom: 300,
              left: 450,
              right: 400,
            },
          },
        },
        children: [
          headerParagraph,
          refDateParagraph,
          ...customerParagraphs,
          mainTable,
          ...termsParagraphs,
          ...bottomElements,
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
