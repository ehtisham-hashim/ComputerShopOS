import { eq, desc } from "drizzle-orm";
import { db, isTauriEnvironment, memoryStore } from "./client";
import {
  documents,
  DocumentRecord,
  CreateDocumentInput,
  BrandType,
  DocumentLineItem,
} from "./schema";

const isTauri = () => isTauriEnvironment();

// Memory store initialized if not present
if (!("documents" in memoryStore)) {
  (memoryStore as any).documents = [
    {
      id: 1,
      brand: "tasnim_computers",
      docType: "invoice",
      refNo: "TCOM/JAN-26",
      date: "13-01-2026",
      customerId: 1,
      customerName: "MIKHRAQ AHMAD KHAN.",
      customerAddress: "PWD ISB,",
      customerPhone: "+92 300 1234567",
      itemsJson: JSON.stringify([
        {
          sn: 1,
          description: "LOGITECH H390 OGR\n5 MONTH WARANTY",
          qty: 10,
          unitPrice: 9200,
          totalAmount: 92000,
        },
        {
          sn: 2,
          description: "DELL SOUNDBAR ORG",
          qty: 3,
          unitPrice: 2000,
          totalAmount: 6000,
        },
      ]),
      subtotal: 98000,
      discount: 0,
      tax: 0,
      totalAmount: 98000,
      paymentMode: "CASH",
      warrantyTerms: "ONE WEEK CHECK WARRENTY",
      notes: "System generated invoice sample",
      schemaVersion: 1,
      createdAt: Math.floor(Date.now() / 1000) - 86400 * 45,
      updatedAt: Math.floor(Date.now() / 1000) - 86400 * 45,
    },
  ];
}

export async function getDocuments(options?: {
  brand?: BrandType;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<DocumentRecord[]> {
  const { brand, search, limit, offset } = options || {};

  if (isTauri()) {
    try {
      let query = db.select().from(documents).$dynamic();
      if (brand) {
        query = query.where(eq(documents.brand, brand));
      }
      const all = await query.orderBy(desc(documents.createdAt));
      let filtered = all;
      if (search && search.trim()) {
        const s = search.toLowerCase();
        filtered = all.filter(
          (d) =>
            d.refNo.toLowerCase().includes(s) ||
            d.customerName.toLowerCase().includes(s) ||
            (d.customerPhone && d.customerPhone.toLowerCase().includes(s))
        );
      }
      if (offset !== undefined && limit !== undefined) {
        return filtered.slice(offset, offset + limit);
      } else if (limit !== undefined) {
        return filtered.slice(0, limit);
      }
      return filtered;
    } catch (err) {
      console.warn("Tauri getDocuments failed, falling back to memory store:", err);
    }
  }

  // Memory fallback
  let list: DocumentRecord[] = (memoryStore as any).documents || [];
  if (brand) {
    list = list.filter((d) => d.brand === brand);
  }
  if (search && search.trim()) {
    const s = search.toLowerCase();
    list = list.filter(
      (d) =>
        d.refNo.toLowerCase().includes(s) ||
        d.customerName.toLowerCase().includes(s) ||
        (d.customerPhone && d.customerPhone.toLowerCase().includes(s))
    );
  }
  list.sort((a, b) => b.createdAt - a.createdAt);
  if (offset !== undefined && limit !== undefined) {
    return list.slice(offset, offset + limit);
  } else if (limit !== undefined) {
    return list.slice(0, limit);
  }
  return list;
}

export async function getDocumentById(id: number): Promise<DocumentRecord | null> {
  if (isTauri()) {
    try {
      const res = await db.select().from(documents).where(eq(documents.id, id));
      return res[0] || null;
    } catch (err) {
      console.warn("Tauri getDocumentById failed:", err);
    }
  }

  const list: DocumentRecord[] = (memoryStore as any).documents || [];
  return list.find((d) => d.id === id) || null;
}

export async function createDocument(input: CreateDocumentInput): Promise<DocumentRecord> {
  const now = Math.floor(Date.now() / 1000);
  const itemsJson = JSON.stringify(input.items);

  const docPayload = {
    brand: input.brand,
    docType: input.docType || "invoice",
    refNo: input.refNo,
    date: input.date,
    customerId: input.customerId || null,
    customerName: input.customerName,
    customerAddress: input.customerAddress || "",
    customerPhone: input.customerPhone || "",
    itemsJson,
    subtotal: input.subtotal,
    discount: input.discount || 0,
    tax: input.tax || 0,
    totalAmount: input.totalAmount,
    paymentMode: input.paymentMode || "CASH",
    warrantyTerms: input.warrantyTerms || "ONE WEEK CHECK WARRANTY",
    notes: input.notes || "",
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
  };

  if (isTauri()) {
    try {
      const res = await db.insert(documents).values(docPayload).returning();
      if (res && res[0]) return res[0];
    } catch (err) {
      console.warn("Tauri createDocument failed, saving to memory:", err);
    }
  }

  // Memory fallback
  const list: DocumentRecord[] = (memoryStore as any).documents || [];
  const nextId = list.length > 0 ? Math.max(...list.map((d) => d.id)) + 1 : 1;
  const newDoc: DocumentRecord = {
    id: nextId,
    ...docPayload,
  };
  list.unshift(newDoc);
  (memoryStore as any).documents = list;
  return newDoc;
}

export async function updateDocument(
  id: number,
  input: Partial<CreateDocumentInput>
): Promise<DocumentRecord | null> {
  const now = Math.floor(Date.now() / 1000);
  const updateData: any = {
    updatedAt: now,
  };
  if (input.brand !== undefined) updateData.brand = input.brand;
  if (input.docType !== undefined) updateData.docType = input.docType;
  if (input.refNo !== undefined) updateData.refNo = input.refNo;
  if (input.date !== undefined) updateData.date = input.date;
  if (input.customerId !== undefined) updateData.customerId = input.customerId;
  if (input.customerName !== undefined) updateData.customerName = input.customerName;
  if (input.customerAddress !== undefined) updateData.customerAddress = input.customerAddress;
  if (input.customerPhone !== undefined) updateData.customerPhone = input.customerPhone;
  if (input.items !== undefined) updateData.itemsJson = JSON.stringify(input.items);
  if (input.subtotal !== undefined) updateData.subtotal = input.subtotal;
  if (input.discount !== undefined) updateData.discount = input.discount;
  if (input.tax !== undefined) updateData.tax = input.tax;
  if (input.totalAmount !== undefined) updateData.totalAmount = input.totalAmount;
  if (input.paymentMode !== undefined) updateData.paymentMode = input.paymentMode;
  if (input.warrantyTerms !== undefined) updateData.warrantyTerms = input.warrantyTerms;
  if (input.notes !== undefined) updateData.notes = input.notes;

  if (isTauri()) {
    try {
      const res = await db
        .update(documents)
        .set(updateData)
        .where(eq(documents.id, id))
        .returning();
      if (res && res[0]) return res[0];
    } catch (err) {
      console.warn("Tauri updateDocument failed:", err);
    }
  }

  // Memory fallback
  const list: DocumentRecord[] = (memoryStore as any).documents || [];
  const idx = list.findIndex((d) => d.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updateData };
    (memoryStore as any).documents = list;
    return list[idx];
  }
  return null;
}

export async function deleteDocument(id: number): Promise<boolean> {
  if (isTauri()) {
    try {
      await db.delete(documents).where(eq(documents.id, id));
      return true;
    } catch (err) {
      console.warn("Tauri deleteDocument failed:", err);
    }
  }

  // Memory fallback
  const list: DocumentRecord[] = (memoryStore as any).documents || [];
  (memoryStore as any).documents = list.filter((d) => d.id !== id);
  return true;
}

// Generate smart sequential reference number
export async function getNextDocRefNo(brand: BrandType, dateStr?: string): Promise<string> {
  const dateObj = dateStr ? new Date(dateStr) : new Date();
  const year = dateObj.getFullYear();
  const yearShort = String(year).slice(-2);
  const monthNames = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
  ];
  const month = monthNames[dateObj.getMonth()];

  const allBrandDocs = await getDocuments({ brand });
  const count = allBrandDocs.length + 1;
  const countStr = count < 10 ? "0" + count : "" + count;

  if (brand === "tasnim_computers") {
    return "TCOM/" + month + "-" + yearShort + "-" + countStr;
  } else if (brand === "farhan_computers") {
    return "FC-" + yearShort + "-" + countStr;
  } else {
    return "FE-" + yearShort + "-" + countStr;
  }
}

export function parseDocumentItems(itemsJson: string): DocumentLineItem[] {
  try {
    const parsed = JSON.parse(itemsJson);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}
