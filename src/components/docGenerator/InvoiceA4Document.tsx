import React from "react";
import { DocumentRecord, DocumentLineItem } from "../../db/schema";
import { parseDocumentItems } from "../../db/documentsService";
import { BRAND_CONFIGS } from "../../services/docx/brandConfigs";

// Tasnim Computers dedicated crisp assets
import tcLogo from "../../assets/brands/tasnim_computers/tc_logo.png";
import tasnimText from "../../assets/brands/tasnim_computers/tasnim_text.png";
import computersText from "../../assets/brands/tasnim_computers/computers_text.png";
import hpLogo from "../../assets/brands/tasnim_computers/hp_logo.png";
import dellLogo from "../../assets/brands/tasnim_computers/dell_logo.png";
import lenovoLogo from "../../assets/brands/tasnim_computers/lenovo_logo.png";
import tasnimWm from "../../assets/brands/tasnim_computers/watermark.png";
import tasnimStamp from "../../assets/brands/tasnim_computers/stamp.png";
import tasnimPc from "../../assets/brands/tasnim_computers/pc.png";
import pinIcon from "../../assets/brands/tasnim_computers/pin_icon.png";
import mobileIcon from "../../assets/brands/tasnim_computers/mobile_icon.png";
import landlineIcon from "../../assets/brands/tasnim_computers/phone_icon.png";
import emailIcon from "../../assets/brands/tasnim_computers/email_icon.png";

// Farhan Computers assets
import farhanPcHeader from "../../assets/brands/farhan_computers/header.jpg";
import farhanPcStamp from "../../assets/brands/farhan_computers/stamp.png";
import farhanPcWm from "../../assets/brands/farhan_computers/watermark.png";

// Farhan Enterprises assets
import farhanEntHeader from "../../assets/brands/farhan_enterprises/header.jpg";
import farhanEntStamp from "../../assets/brands/farhan_enterprises/stamp.png";
import farhanEntFooter from "../../assets/brands/farhan_enterprises/footer.jpg";
import farhanEntWm from "../../assets/brands/farhan_enterprises/watermark.png";

export type PaperSize = "a4" | "a5" | "letter" | "legal";

interface InvoiceDocumentProps {
  document: DocumentRecord;
  paperSize?: PaperSize;
  className?: string;
}

export const InvoiceA4Document: React.FC<InvoiceDocumentProps> = ({
  document: doc,
  paperSize = "a4",
  className = "",
}) => {
  const brandConfig = BRAND_CONFIGS[doc.brand] || BRAND_CONFIGS.tasnim_computers;
  const items: DocumentLineItem[] = parseDocumentItems(doc.itemsJson);

  const isA5 = paperSize === "a5";
  const isLetter = paperSize === "letter";
  const isLegal = paperSize === "legal";
  const isFullBleedBrand = doc.brand === "farhan_enterprises" || doc.brand === "farhan_computers";

  const itemsPerPage = isA5 ? 5 : (isLetter ? 6 : (isLegal ? 8 : 7));
  const isMultiPage = items.length > itemsPerPage;

  // Split into chunks if multi-page
  const pages: DocumentLineItem[][] = [];
  if (isMultiPage) {
    for (let i = 0; i < items.length; i += itemsPerPage) {
      pages.push(items.slice(i, i + itemsPerPage));
    }
  } else {
    pages.push(items);
  }

  // Dimensions
  const pageWidth = isA5 ? "148mm" : (isLetter || isLegal ? "215.9mm" : "210mm");
  const pageMinHeight = isA5
    ? "210mm"
    : isLetter
    ? "279.4mm"
    : isLegal
    ? "355.6mm"
    : "297mm";
  const pagePadding = isA5
    ? "8mm 10mm 8mm 10mm"
    : isLetter
    ? "10mm 16mm 12mm 16mm"
    : "12mm 16mm 14mm 16mm";

  // Watermark selection
  const watermarkSrc =
    doc.brand === "farhan_enterprises"
      ? farhanEntWm
      : doc.brand === "farhan_computers"
      ? farhanPcWm
      : tasnimWm;

  // Stamp selection
  const stampSrc =
    doc.brand === "farhan_enterprises"
      ? farhanEntStamp
      : doc.brand === "farhan_computers"
      ? farhanPcStamp
      : tasnimStamp;

  return (
    <div className={`invoice-document-wrapper flex flex-col gap-6 ${className}`} style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      {pages.map((pageItems, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === pages.length - 1;

        // Ensure enough filler rows so the table spans comfortably down the page without leaving a huge void
        const targetRowCount = isA5
          ? (doc.brand === "farhan_enterprises" ? 4 : 5)
          : isLetter
          ? (doc.brand === "farhan_enterprises" ? 5 : 6)
          : isLegal
          ? (doc.brand === "farhan_enterprises" ? 7 : 8)
          : (doc.brand === "farhan_enterprises" ? 6 : 7);
        const emptyRowsCount = isLastPage
          ? Math.max(0, targetRowCount - pageItems.length)
          : 0;

        return (
          <div
            key={pageIndex}
            className="invoice-page bg-white text-black box-border select-none relative overflow-hidden shadow-sm flex flex-col justify-between"
            data-page-index={pageIndex}
            style={{
              width: pageWidth,
              minHeight: pageMinHeight,
              padding: isFullBleedBrand ? 0 : pagePadding,
              boxSizing: "border-box",
              backgroundColor: "#ffffff",
              color: "#000000",
              position: "relative",
              fontFamily: "Arial, Helvetica, sans-serif",
              letterSpacing: "normal",
              wordSpacing: "normal",
              pageBreakAfter: isLastPage ? "auto" : "always",
            }}
          >
            {/* 1. CENTERED WATERMARK (100% Opacity - using native transparent PNG alpha) */}
            {watermarkSrc && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  opacity: 1, // 100% opacity as requested
                  pointerEvents: "none",
                  userSelect: "none",
                  zIndex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={watermarkSrc}
                  alt=""
                  style={{
                    width: isA5 ? "250px" : "380px",
                    height: isA5 ? "250px" : "380px",
                    objectFit: "contain",
                    border: "none",
                    outline: "none",
                    boxShadow: "none",
                  }}
                />
              </div>
            )}

            {/* TOP CONTENT SECTION */}
            <div style={{ position: "relative", zIndex: 10, width: "100%" }}>
              {/* HEADER BANNER */}
              {isFirstPage ? (
                <div style={{ width: "100%", marginBottom: isFullBleedBrand ? (isA5 ? "8px" : "12px") : (isA5 ? "12px" : "18px") }}>
                  {doc.brand === "tasnim_computers" ? (
                    // Tasnim Computers: Pure Flexbox Header with separate assets & CSS separator
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px" }}>
                        {/* Left: TC Logo + Centered Title Block */}
                        <div style={{ display: "flex", alignItems: "center", gap: isA5 ? "8px" : "14px" }}>
                          <img
                            src={tcLogo}
                            alt="TC"
                            style={{
                              height: isA5 ? "42px" : "58px",
                              width: "auto",
                              objectFit: "contain",
                              border: "none",
                            }}
                          />
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: isA5 ? "6px" : "8px" }}>
                              <img
                                src={tasnimText}
                                alt="Tasnim"
                                style={{
                                  height: isA5 ? "26px" : "36px",
                                  width: "auto",
                                  objectFit: "contain",
                                  border: "none",
                                }}
                              />
                              <img
                                src={computersText}
                                alt="Computers"
                                style={{
                                  height: isA5 ? "26px" : "36px",
                                  width: "auto",
                                  objectFit: "contain",
                                  border: "none",
                                }}
                              />
                            </div>
                            <div
                              style={{
                                fontSize: isA5 ? "11px" : "13px",
                                fontWeight: 600,
                                color: "#1F2937",
                                marginTop: "3px",
                                textAlign: "center",
                                fontFamily: "Arial, Helvetica, sans-serif",
                              }}
                            >
                              Deals in All Kinds of New &amp; Used Desktop &amp; Laptops
                            </div>
                          </div>
                        </div>

                        {/* Right: HP, Dell, Lenovo Logos + Sales & Service Pill */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: isA5 ? "6px" : "8px" }}>
                            <img
                              src={hpLogo}
                              alt="HP"
                              style={{
                                height: isA5 ? "28px" : "38px",
                                width: isA5 ? "28px" : "38px",
                                objectFit: "contain",
                                border: "none",
                              }}
                            />
                            <img
                              src={dellLogo}
                              alt="Dell"
                              style={{
                                height: isA5 ? "28px" : "38px",
                                width: isA5 ? "28px" : "38px",
                                objectFit: "contain",
                                border: "none",
                              }}
                            />
                            <img
                              src={lenovoLogo}
                              alt="Lenovo"
                              style={{
                                height: isA5 ? "28px" : "38px",
                                width: isA5 ? "28px" : "38px",
                                objectFit: "contain",
                                border: "none",
                              }}
                            />
                          </div>
                          {/* Sales & Service Badge */}
                          <div
                            style={{
                              border: "1.5px solid #1F2937",
                              borderRadius: "9999px",
                              padding: isA5 ? "2px 10px" : "3.5px 14px",
                              boxSizing: "border-box",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: isA5 ? "10.5px" : "12px",
                                fontWeight: 700,
                                color: "#1F2937",
                                lineHeight: 1.2,
                                fontFamily: "Arial, Helvetica, sans-serif",
                                display: "inline-block",
                              }}
                            >
                              Sales &amp; Service
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Dual Red & Black Separator Lines */}
                      <div style={{ width: "100%", marginTop: "2px" }}>
                        <div style={{ height: "2.5px", backgroundColor: "#DC2626", width: "100%" }} />
                        <div style={{ height: "2px" }} />
                        <div style={{ height: "1.5px", backgroundColor: "#1F2937", width: "100%" }} />
                      </div>
                    </div>
                  ) : (
                    // Farhan Computers / Farhan Enterprises Header Banner - Full Bleed
                    <div style={{ width: "100%" }}>
                      <img
                        src={doc.brand === "farhan_enterprises" ? farhanEntHeader : farhanPcHeader}
                        alt={brandConfig.displayName}
                        style={{
                          width: "100%",
                          height: "auto",
                          display: "block",
                          border: "none",
                          outline: "none",
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                // Continuation Header for Subsequent Pages
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "2px solid #000000",
                    padding: isFullBleedBrand
                      ? (isA5 ? "8mm 10mm 8px 10mm" : "12mm 16mm 8px 16mm")
                      : "0 0 8px 0",
                    marginBottom: "16px",
                    fontSize: "13px",
                    fontWeight: 700,
                    fontFamily: "Arial, Helvetica, sans-serif",
                  }}
                >
                  <span>
                    {brandConfig.displayName}&nbsp;-&nbsp;Invoice #{doc.refNo} (Page {pageIndex + 1} of {pages.length})
                  </span>
                  <span>Date:&nbsp;{doc.date}</span>
                </div>
              )}

              {/* CONTENT SECTION (Padded to keep table & text perfectly aligned) */}
              <div
                style={{
                  padding: isFullBleedBrand
                    ? (isA5 ? "0 10mm" : "0 16mm")
                    : "0",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                {/* METADATA ROW & CUSTOMER BLOCK (Page 1) */}
                {isFirstPage && (
                  <>
                    {/* Ref.NO & Date - Same Font, Clean Size */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: isA5 ? "13px" : "15px",
                        fontWeight: 700,
                        marginBottom: isA5 ? "10px" : "14px",
                        fontFamily: "Arial, Helvetica, sans-serif",
                      }}
                    >
                      <div>
                        <span>Ref.NO&nbsp;</span>
                      <span
                        style={{
                          textDecoration: "underline",
                          fontWeight: 700,
                          fontSize: isA5 ? "13px" : "15px",
                        }}
                      >
                        {doc.refNo}
                      </span>
                    </div>
                    <div>
                      <span>Date:&nbsp;</span>
                      <span style={{ fontWeight: 700, fontSize: isA5 ? "13px" : "15px" }}>
                        {doc.date}
                      </span>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div
                    style={{
                      fontSize: isA5 ? "13px" : "15px",
                      lineHeight: "1.5",
                      marginBottom: isA5 ? "12px" : "18px",
                      fontFamily: "Arial, Helvetica, sans-serif",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "4px" }}>
                      <span style={{ width: isA5 ? "75px" : "90px", fontWeight: 700, flexShrink: 0 }}>
                        MS:
                      </span>
                      <span style={{ fontWeight: 800, textTransform: "uppercase" }}>
                        {doc.customerName}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start" }}>
                      <span style={{ width: isA5 ? "75px" : "90px", fontWeight: 700, flexShrink: 0 }}>
                        Address:
                      </span>
                      <span style={{ fontWeight: 600, color: "#222222" }}>
                        {doc.customerAddress || "PWD ISB,"}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* 5-COLUMN ITEMS TABLE */}
              <div
                style={{
                  marginBottom: isA5 ? "12px" : "18px",
                  border: "1.5px solid #000000",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: isA5 ? "12px" : "14px",
                    textAlign: "left",
                    fontFamily: "Arial, Helvetica, sans-serif",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#D9D9D9", borderBottom: "1.5px solid #000000", color: "#000000", fontWeight: 700 }}>
                      <th style={{ padding: isA5 ? "8px 4px" : "10px 6px", textAlign: "center", width: "7%", borderRight: "1px solid #000000", whiteSpace: "nowrap" }}>
                        S N
                      </th>
                      <th style={{ padding: isA5 ? "8px 8px" : "10px 12px", width: "51%", borderRight: "1px solid #000000" }}>
                        Description
                      </th>
                      <th style={{ padding: isA5 ? "8px 4px" : "10px 6px", textAlign: "center", width: "8%", borderRight: "1px solid #000000", whiteSpace: "nowrap" }}>
                        Qty
                      </th>
                      <th style={{ padding: isA5 ? "8px 6px" : "10px 8px", textAlign: "center", width: "16%", borderRight: "1px solid #000000", whiteSpace: "nowrap" }}>
                        Unit Price
                      </th>
                      <th style={{ padding: isA5 ? "8px 8px" : "10px 12px", textAlign: "right", width: "18%", whiteSpace: "nowrap" }}>
                        Total Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((item, idx) => {
                      const globalIdx = pageIndex * itemsPerPage + idx + 1;
                      const lines = (item.description || "").split("\n");
                      const qtyStr = item.qty < 10 ? `0${item.qty}` : `${item.qty}`;

                      return (
                        <tr key={idx} style={{ borderBottom: "1px solid #000000", verticalAlign: "top" }}>
                          <td style={{ padding: isA5 ? "10px 4px" : "13px 6px", textAlign: "center", fontWeight: 700, borderRight: "1px solid #000000" }}>
                            {globalIdx}
                          </td>
                          <td style={{ padding: isA5 ? "10px 8px" : "13px 12px", borderRight: "1px solid #000000" }}>
                            <div style={{ fontWeight: 700, color: "#000000" }}>{lines[0]}</div>
                            {lines.length > 1 && (
                              <div style={{ fontSize: isA5 ? "11px" : "12.5px", fontWeight: 600, color: "#374151", marginTop: "3px", whiteSpace: "pre-line" }}>
                                {lines.slice(1).join("\n")}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: isA5 ? "10px 4px" : "13px 6px", textAlign: "center", borderRight: "1px solid #000000", fontWeight: 600 }}>
                            {qtyStr}
                          </td>
                          <td style={{ padding: isA5 ? "10px 6px" : "13px 8px", textAlign: "center", borderRight: "1px solid #000000", fontWeight: 600 }}>
                            {item.unitPrice.toLocaleString()}
                          </td>
                          <td style={{ padding: isA5 ? "10px 8px" : "13px 12px", textAlign: "right", fontWeight: 700, color: "#000000" }}>
                            {item.totalAmount.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Empty filler rows for balance */}
                    {Array.from({ length: emptyRowsCount }).map((_, i) => (
                      <tr
                        key={`empty-${i}`}
                        style={{
                          height: isA5
                            ? "32px"
                            : isLetter
                            ? doc.brand === "farhan_enterprises"
                              ? "38px"
                              : "42px"
                            : doc.brand === "farhan_enterprises"
                            ? "42px"
                            : "48px",
                          borderBottom: "1px solid #000000",
                        }}
                      >
                        <td style={{ borderRight: "1px solid #000000" }}></td>
                        <td style={{ borderRight: "1px solid #000000" }}></td>
                        <td style={{ borderRight: "1px solid #000000" }}></td>
                        <td style={{ borderRight: "1px solid #000000" }}></td>
                        <td></td>
                      </tr>
                    ))}

                    {/* TOTAL AMOUNT ROW (Shown on last page) */}
                    {isLastPage && (
                      <tr style={{ borderTop: "1.5px solid #000000", backgroundColor: "#ffffff", fontWeight: 700 }}>
                        <td
                          colSpan={4}
                          style={{
                            padding: isA5 ? "10px 8px" : "13px 12px",
                            fontWeight: 900,
                            textTransform: "uppercase",
                            fontSize: isA5 ? "13px" : "15px",
                          }}
                        >
                          TOTAL AMOUNT
                        </td>
                        <td
                          style={{
                            padding: isA5 ? "10px 8px" : "13px 12px",
                            textAlign: "right",
                            fontSize: isA5 ? "14px" : "17px",
                            fontWeight: 900,
                            color: "#000000",
                          }}
                        >
                          {doc.totalAmount.toLocaleString()}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* TERMS & CONDITIONS + STAMP (Only on Last Page) */}
              {isLastPage && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: isA5 ? "8px" : "12px",
                    width: "100%",
                  }}
                >
                  {/* Left: Terms & Conditions */}
                  <div style={{ fontSize: isA5 ? "11px" : "13px", color: "#000000", lineHeight: "1.6", fontFamily: "Arial, Helvetica, sans-serif" }}>
                    <div style={{ fontWeight: 700, textDecoration: "underline" }}>
                      {brandConfig.termsHeading || "TERMS & CONDITIONS: -"}
                    </div>
                    <div style={{ fontWeight: 700 }}>
                      PAYMENT MODE:&nbsp;{(doc.paymentMode || "CASH").toUpperCase()}
                    </div>
                    <div style={{ fontWeight: 700 }}>
                      {(doc.warrantyTerms || "ONE WEEK CHECK WARRENTY").toUpperCase()}
                    </div>
                    <div style={{ color: "#374151", marginTop: "3px" }}>
                      Thank you and best regards,
                    </div>
                    <div style={{ fontWeight: 700, fontSize: isA5 ? "10px" : "11.5px", color: "#111111", marginTop: "2px" }}>
                      {brandConfig.defaultDisclaimer}
                    </div>
                  </div>

                  {/* Right: Stamp for Tasnim Computers & Farhan Computers - Slightly below the table, slightly bigger */}
                  {(doc.brand === "tasnim_computers" || doc.brand === "farhan_computers") && stampSrc && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        paddingRight: isA5 ? "10px" : "20px",
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={stampSrc}
                        alt="Stamp"
                        style={{
                          width: isA5 ? "92px" : "118px",
                          height: isA5 ? "92px" : "118px",
                          objectFit: "contain",
                          border: "none",
                          display: "block",
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

            {/* BOTTOM FOOTER SECTION (Only on Last Page) */}
            {isLastPage && (
              <div
                style={{
                  position: "relative",
                  zIndex: 10,
                  width: "100%",
                  marginTop: isFullBleedBrand
                    ? (isA5 ? "8px" : "14px")
                    : (isA5 ? "16px" : "24px"),
                }}
              >
                {doc.brand === "farhan_enterprises" ? (
                  // Farhan Enterprises Footer Banner with Uplifted Stamp
                  <div>
                    {stampSrc && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          paddingRight: isA5 ? "25px" : "40px",
                          marginBottom: "8px",
                          position: "relative",
                          zIndex: 20,
                        }}
                      >
                        <img
                          src={stampSrc}
                          alt="Stamp"
                          style={{
                            width: isA5 ? "75px" : "95px",
                            height: isA5 ? "75px" : "95px",
                            objectFit: "contain",
                            border: "none",
                            display: "block",
                          }}
                        />
                      </div>
                    )}
                    <img
                      src={farhanEntFooter}
                      alt="Footer"
                      style={{
                        width: "100%",
                        height: "auto",
                        display: "block",
                        border: "none",
                        outline: "none",
                      }}
                    />
                  </div>
                ) : doc.brand === "farhan_computers" ? (
                  // Farhan Computers: Clean Vector Contact Grid + Un-squished PC Graphic + Uplifted Stamp
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                      width: "100%",
                      padding: isA5 ? "0 10mm 8mm 10mm" : "0 16mm 14mm 16mm",
                      boxSizing: "border-box",
                    }}
                  >
                    {/* Left: 4-Row Contact Layout */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: isA5 ? "6px" : "8px",
                        fontSize: isA5 ? "11px" : "13px",
                        color: "#111111",
                        fontFamily: "Arial, Helvetica, sans-serif",
                      }}
                    >
                      {/* Row 1: Address */}
                      <div style={{ display: "flex", alignItems: "center", gap: isA5 ? "7px" : "9px" }}>
                        <div style={{ width: isA5 ? "14px" : "16px", display: "flex", justifyContent: "center", flexShrink: 0 }}>
                          <img
                            src={pinIcon}
                            alt=""
                            style={{ width: isA5 ? "13px" : "15px", height: isA5 ? "14px" : "16px", objectFit: "contain" }}
                          />
                        </div>
                        <div>
                          <span style={{ fontWeight: 600 }}>Anwar Chowk, Wah Cantt.</span>
                        </div>
                      </div>

                      {/* Row 2: Email */}
                      <div style={{ display: "flex", alignItems: "center", gap: isA5 ? "7px" : "9px" }}>
                        <div style={{ width: isA5 ? "14px" : "16px", display: "flex", justifyContent: "center", flexShrink: 0 }}>
                          <img
                            src={emailIcon}
                            alt=""
                            style={{ width: isA5 ? "14px" : "16px", height: isA5 ? "11px" : "13px", objectFit: "contain" }}
                          />
                        </div>
                        <div>
                          <span style={{ fontWeight: 600 }}>farhangill26@gmail.com</span>
                        </div>
                      </div>

                      {/* Row 3: Mobile */}
                      <div style={{ display: "flex", alignItems: "center", gap: isA5 ? "7px" : "9px" }}>
                        <div style={{ width: isA5 ? "14px" : "16px", display: "flex", justifyContent: "center", flexShrink: 0 }}>
                          <img
                            src={mobileIcon}
                            alt=""
                            style={{ width: isA5 ? "13px" : "15px", height: isA5 ? "14px" : "16px", objectFit: "contain" }}
                          />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: isA5 ? "14px" : "20px", fontWeight: 600 }}>
                          <span>0345-5982628</span>
                          <span>0345-5551559</span>
                        </div>
                      </div>

                      {/* Row 4: Landline */}
                      <div style={{ display: "flex", alignItems: "center", gap: isA5 ? "7px" : "9px" }}>
                        <div style={{ width: isA5 ? "14px" : "16px", display: "flex", justifyContent: "center", flexShrink: 0 }}>
                          <img
                            src={landlineIcon}
                            alt=""
                            style={{ width: isA5 ? "13px" : "15px", height: isA5 ? "13px" : "15px", objectFit: "contain" }}
                          />
                        </div>
                        <div>
                          <span style={{ fontWeight: 600 }}>051-4265300</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Clean Desktop PC graphic (stamp uplifted next to terms) */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: isA5 ? "110px" : "150px", flexShrink: 0 }}>
                      <img
                        src={tasnimPc}
                        alt="PC Graphic"
                        style={{
                          width: isA5 ? "110px" : "150px",
                          height: "auto",
                          objectFit: "contain",
                          border: "none",
                          display: "block",
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  // Tasnim Computers: Clean Left Grid Layout + Right PC Graphic
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                      width: "100%",
                    }}
                  >
                    {/* Left: Perfectly Aligned 4-Row Contact Layout Matching Reference */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: isA5 ? "6px" : "8px",
                        fontSize: isA5 ? "11px" : "13px",
                        color: "#111111",
                        fontFamily: "Arial, Helvetica, sans-serif",
                      }}
                    >
                      {/* Row 1: Branch 1 */}
                      <div style={{ display: "flex", alignItems: "center", gap: isA5 ? "7px" : "9px" }}>
                        <div style={{ width: isA5 ? "14px" : "16px", display: "flex", justifyContent: "center", flexShrink: 0 }}>
                          <img
                            src={pinIcon}
                            alt=""
                            style={{ width: isA5 ? "13px" : "15px", height: isA5 ? "14px" : "16px", objectFit: "contain" }}
                          />
                        </div>
                        <div>
                          <strong style={{ fontWeight: 700 }}>Branch 1:&nbsp;</strong>
                          <span style={{ fontWeight: 500 }}>Anwar Chowk, Wah Cantt.</span>
                        </div>
                      </div>

                      {/* Row 2: Mobile & Landline */}
                      <div style={{ display: "flex", alignItems: "center", gap: isA5 ? "7px" : "9px" }}>
                        <div style={{ width: isA5 ? "14px" : "16px", display: "flex", justifyContent: "center", flexShrink: 0 }}>
                          <img
                            src={mobileIcon}
                            alt=""
                            style={{ width: isA5 ? "13px" : "15px", height: isA5 ? "14px" : "16px", objectFit: "contain" }}
                          />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: isA5 ? "14px" : "20px", fontWeight: 500 }}>
                          <span style={{ minWidth: isA5 ? "95px" : "115px" }}>0345-5982628</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <img
                              src={landlineIcon}
                              alt=""
                              style={{ width: isA5 ? "13px" : "15px", height: isA5 ? "13px" : "15px", objectFit: "contain" }}
                            />
                            <span>051-4265300</span>
                          </div>
                        </div>
                      </div>

                      {/* Row 3: Branch 2 */}
                      <div style={{ display: "flex", alignItems: "center", gap: isA5 ? "7px" : "9px" }}>
                        <div style={{ width: isA5 ? "14px" : "16px", display: "flex", justifyContent: "center", flexShrink: 0 }}>
                          <img
                            src={pinIcon}
                            alt=""
                            style={{ width: isA5 ? "13px" : "15px", height: isA5 ? "14px" : "16px", objectFit: "contain" }}
                          />
                        </div>
                        <div>
                          <strong style={{ fontWeight: 700 }}>Branch 2:&nbsp;</strong>
                          <span style={{ fontWeight: 500 }}>Bilal Market NawabAbad, Near Barrier 2 WahCantt.</span>
                        </div>
                      </div>

                      {/* Row 4: Mobile & Email */}
                      <div style={{ display: "flex", alignItems: "center", gap: isA5 ? "7px" : "9px" }}>
                        <div style={{ width: isA5 ? "14px" : "16px", display: "flex", justifyContent: "center", flexShrink: 0 }}>
                          <img
                            src={mobileIcon}
                            alt=""
                            style={{ width: isA5 ? "13px" : "15px", height: isA5 ? "14px" : "16px", objectFit: "contain" }}
                          />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: isA5 ? "14px" : "20px", fontWeight: 500 }}>
                          <span style={{ minWidth: isA5 ? "95px" : "115px" }}>0301-5177866</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <img
                              src={emailIcon}
                              alt=""
                              style={{ width: isA5 ? "14px" : "16px", height: isA5 ? "11px" : "13px", objectFit: "contain" }}
                            />
                            <span style={{ color: "#1D4ED8", textDecoration: "underline" }}>tcomwah@gmail.com</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Desktop PC graphic */}
                    <div style={{ display: "flex", justifyContent: "flex-end", width: isA5 ? "110px" : "150px", flexShrink: 0 }}>
                      <img
                        src={tasnimPc}
                        alt="PC Graphic"
                        style={{
                          width: isA5 ? "110px" : "150px",
                          height: "auto",
                          objectFit: "contain",
                          border: "none",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
