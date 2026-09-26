import { useState, useCallback, useEffect } from "react";
import { InventoryItem, CategoryRecord } from "../db/schema";
import { getInventoryItems } from "../db/inventoryService";
import { getCustomersCount } from "../db/customerService";
import { getActiveRepairsCount } from "../db/repairsService";
import { getPayablesSummary } from "../db/payablesService";
import { getCategories } from "../db/categoryService";
import { initDb } from "../db/client";

export function useAppData(isAuthenticated: boolean) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
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
        const count = await getCustomersCount();
        setCustomersCount(count);
      } catch (e) {
        console.error("Failed to load customers count:", e);
      }
      try {
        const count = await getActiveRepairsCount();
        setActiveRepairsCount(count);
      } catch (e) {
        console.error("Failed to load repair tickets count:", e);
      }
      try {
        const pSummary = await getPayablesSummary();
        setPayablesCount(pSummary.activeSuppliersCount);
      } catch (e) {
        console.error("Failed to load payables summary:", e);
      }
      try {
        const cats = await getCategories();
        setCategories(cats);
      } catch (e) {
        console.error("Failed to load categories:", e);
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

  return {
    items,
    categories,
    categoriesCount: categories.length,
    customersCount,
    activeRepairsCount,
    payablesCount,
    lowStockCount,
    isLoading,
    fetchItems,
  };
}
