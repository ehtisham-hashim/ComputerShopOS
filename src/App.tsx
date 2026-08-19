import { useState, useEffect, useCallback } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { SidebarProvider } from "./context/SidebarContext";
import { AppLayout } from "./components/layout/AppLayout";
import { NavTab } from "./components/layout/AppSidebar";
import { DashboardPage } from "./pages/Dashboard";
import { InventoryPage } from "./pages/Inventory";
import { POSPage } from "./pages/POS";
import { PCBuilderPage } from "./pages/PCBuilder";
import { RepairsPage } from "./pages/Repairs";
import { CustomersPage } from "./pages/Customers";
import { SettingsPage } from "./pages/Settings";
import { InventoryItem } from "./db/schema";
import { getInventoryItems } from "./db/inventoryService";
import { getCustomers } from "./db/customerService";
import { initDb } from "./db/client";

function AppContent() {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [customersCount, setCustomersCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [posInitialItems, setPosInitialItems] = useState<InventoryItem[]>([]);

  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true);
      await initDb();
      const records = await getInventoryItems();
      setItems(records);
      const custs = await getCustomers();
      setCustomersCount(custs.length);
    } catch (err) {
      console.error("Failed to load inventory & customers:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        setActiveTab("dashboard");
      } else if (e.key === "F2") {
        e.preventDefault();
        setActiveTab("pos");
      } else if (e.key === "F3") {
        e.preventDefault();
        setActiveTab("inventory");
      } else if (e.key === "F4") {
        e.preventDefault();
        setActiveTab("pc-builder");
      } else if (e.key === "F5") {
        e.preventDefault();
        setActiveTab("repairs");
      } else if (e.key === "F6") {
        e.preventDefault();
        setActiveTab("customers");
      } else if (e.key === "F7") {
        e.preventDefault();
        setActiveTab("settings");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const lowStockCount = items.filter((i) => i.quantity <= 5).length;

  const handleTransferBuildToPOS = (selectedParts: InventoryItem[]) => {
    setPosInitialItems(selectedParts);
    setActiveTab("pos");
  };

  return (
    <AppLayout
      activeTab={activeTab}
      onSelectTab={(tab) => {
        if (tab !== "pos") setPosInitialItems([]);
        setActiveTab(tab);
      }}
      inventoryCount={items.length}
      lowStockCount={lowStockCount}
      activeRepairsCount={2}
      customersCount={customersCount}
      onQuickSale={() => {
        setPosInitialItems([]);
        setActiveTab("pos");
      }}
    >
      {activeTab === "dashboard" && (
        <DashboardPage
          items={items}
          onNavigateToInventory={() => setActiveTab("inventory")}
          onNavigateToPOS={() => {
            setPosInitialItems([]);
            setActiveTab("pos");
          }}
          onNavigateToPCBuilder={() => setActiveTab("pc-builder")}
          onNavigateToRepairs={() => setActiveTab("repairs")}
        />
      )}

      {activeTab === "inventory" && (
        <InventoryPage
          items={items}
          isLoading={isLoading}
          onRefresh={fetchItems}
        />
      )}

      {activeTab === "pos" && (
        <POSPage
          items={items}
          onSaleComplete={fetchItems}
          initialCartItems={posInitialItems}
        />
      )}

      {activeTab === "pc-builder" && (
        <PCBuilderPage
          items={items}
          onTransferToPOS={handleTransferBuildToPOS}
        />
      )}

      {activeTab === "repairs" && <RepairsPage />}

      {activeTab === "customers" && <CustomersPage />}

      {activeTab === "settings" && <SettingsPage />}
    </AppLayout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <AppContent />
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
