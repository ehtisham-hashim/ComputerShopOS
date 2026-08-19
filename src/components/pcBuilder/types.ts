import { InventoryItem } from "../../db/schema";

export interface BuildSlot {
  category: string;
  label: string;
  estimatedWatts: number;
  item: InventoryItem | null;
}
