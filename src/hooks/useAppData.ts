import { useState, useCallback, useEffect } from "react";
import { InventoryItem } from "../db/schema";
import { getInventoryItems } from "../db/inventoryService";
import { getCustomers } from "../db/customerService";
import { getRepairTickets } from "../db/repairsService";
import { getPayablesSummary } from "../db/payablesService";
import { initDb } from "../db/client";

export function useAppData(isAuthenticated: boolean) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [customersCount, setCustomersCount] = useState<number>(0);
  const [activeRepairsCount, setActiveRepairsCount] = useState<number>(0);
  const [payablesCount, setPayablesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchItems = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setIsLoading(true);
      await initDb();
      try {
        const records = await getInventoryItems();
        setItems(records);
      } catch (e) {
        console.error("Failed to load inventory:", e);
      }
      try {
        const custs = await getCustomers();
        setCustomersCount(custs.length);
      } catch (e) {
        console.error("Failed to load customers:", e);
      }
      try {
        const repairTickets = await getRepairTickets();
        setActiveRepairsCount(repairTickets.filter((t) => t.status !== "DELIVERED").length);
      } catch (e) {
        console.error("Failed to load repair tickets:", e);
      }
      try {
        const pSummary = await getPayablesSummary();
        setPayablesCount(pSummary.activeSuppliersCount);
      } catch (e) {
        console.error("Failed to load payables summary:", e);
      }
    } catch (err) {
      console.error("Database error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchItems(true);
    }
  }, [isAuthenticated, fetchItems]);

  const lowStockCount = items.filter((i) => i.quantity <= 5).length;

  return { items, customersCount, activeRepairsCount, payablesCount, lowStockCount, isLoading, fetchItems };
}
