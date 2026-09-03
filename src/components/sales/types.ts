import { InventoryItem, PaymentStatus } from "../../db/schema";

export interface CartItem {
  item: InventoryItem;
  quantity: number;
  selectedSerial?: string;
}

export interface CompletedSale {
  invoiceNo: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
}
