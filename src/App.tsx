import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { SidebarProvider } from "./context/SidebarContext";
import { AppLayout } from "./components/layout/AppLayout";
import { NavTab } from "./components/layout/AppSidebar";
import { LoginPage } from "./pages/Login";
import { InventoryItem } from "./db/schema";
import { getInventoryItems } from "./db/inventoryService";
import { getCustomers } from "./db/customerService";
import { getRepairTickets } from "./db/repairsService";
import { initDb } from "./db/client";

// Dynamic Route Splitting for ultra-fast load
const DashboardPage = lazy(() =>
  import("./pages/Dashboard").then((m) => ({ default: m.DashboardPage }))
);
const InventoryPage = lazy(() =>
  import("./pages/Inventory").then((m) => ({ default: m.InventoryPage }))
);
const SalesPage = lazy(() =>
  import("./pages/Sales").then((m) => ({ default: m.SalesPage }))
);
const RepairsPage = lazy(() =>
  import("./pages/Repairs").then((m) => ({ default: m.RepairsPage }))
);
const AdjustmentsPage = lazy(() =>
  import("./pages/Adjustments").then((m) => ({ default: m.AdjustmentsPage }))
);
const PCBuilderPage = lazy(() =>
  import("./pages/PCBuilder").then((m) => ({ default: m.PCBuilderPage }))
);
const CustomersPage = lazy(() =>
  import("./pages/Customers").then((m) => ({ default: m.CustomersPage }))
);
const SettingsPage = lazy(() =>
  import("./pages/Settings").then((m) => ({ default: m.SettingsPage }))
);

const PageLoader = () => (
  <div className="flex h-64 w-full items-center justify-center">
    <div className="size-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
  </div>
);

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem("is_authenticated") === "true";
  });
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [customersCount, setCustomersCount] = useState<number>(0);
  const [activeRepairsCount, setActiveRepairsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [salesInitialItems, setSalesInitialItems] = useState<InventoryItem[]>([]);

  const fetchItems = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setIsLoading(true);
      await initDb();
      try {
        const records = await getInventoryItems();
        setItems(records);
      } catch (e) {
        console.error("Failed to load inventory items:", e);
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
    } catch (err) {
      console.error("Failed to initialize database:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchItems(true);
    }
  }, [isAuthenticated, fetchItems]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        setActiveTab("dashboard");
      } else if (e.key === "F2") {
        e.preventDefault();
        setActiveTab("sales");
      } else if (e.key === "F3") {
        e.preventDefault();
        setActiveTab("inventory");
      } else if (e.key === "F4") {
        e.preventDefault();
        setActiveTab("repairs");
      } else if (e.key === "F5") {
        e.preventDefault();
        setActiveTab("adjustments");
      } else if (e.key === "F6") {
        e.preventDefault();
        setActiveTab("pc-builder");
      } else if (e.key === "F7") {
        e.preventDefault();
        setActiveTab("customers");
      } else if (e.key === "F8") {
        e.preventDefault();
        setActiveTab("settings");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthenticated]);

  const handleLockSession = () => {
    sessionStorage.removeItem("is_authenticated");
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const lowStockCount = items.filter((i) => i.quantity <= 5).length;

  const handleTransferBuildToSales = (selectedParts: InventoryItem[]) => {
    setSalesInitialItems(selectedParts);
    setActiveTab("sales");
  };

  return (
    <AppLayout
      activeTab={activeTab}
      onSelectTab={(tab) => {
        if (tab !== "sales") setSalesInitialItems([]);
        setActiveTab(tab);
      }}
      inventoryCount={items.length}
      lowStockCount={lowStockCount}
      activeRepairsCount={activeRepairsCount}
      customersCount={customersCount}
      onQuickSale={() => {
        setSalesInitialItems([]);
        setActiveTab("sales");
      }}
      onLockSession={handleLockSession}
    >
      <Suspense fallback={<PageLoader />}>
        {activeTab === "dashboard" && (
          <DashboardPage
            items={items}
            onNavigateToInventory={() => setActiveTab("inventory")}
            onNavigateToSales={() => {
              setSalesInitialItems([]);
              setActiveTab("sales");
            }}
            onNavigateToPCBuilder={() => setActiveTab("pc-builder")}
            onNavigateToRepairs={() => setActiveTab("repairs")}
            onNavigateToAdjustments={() => setActiveTab("adjustments")}
          />
        )}

        {activeTab === "sales" && (
          <SalesPage
            items={items}
            onSaleComplete={fetchItems}
            initialCartItems={salesInitialItems}
          />
        )}

        {activeTab === "inventory" && (
          <InventoryPage
            items={items}
            isLoading={isLoading}
            onRefresh={fetchItems}
          />
        )}

        {activeTab === "repairs" && (
          <RepairsPage items={items} onRefreshInventory={fetchItems} />
        )}

        {activeTab === "adjustments" && (
          <AdjustmentsPage
            items={items}
            onRefreshInventory={fetchItems}
          />
        )}

        {activeTab === "pc-builder" && (
          <PCBuilderPage
            items={items}
            onTransferToSales={handleTransferBuildToSales}
          />
        )}

        {activeTab === "customers" && <CustomersPage />}

        {activeTab === "settings" && <SettingsPage />}
      </Suspense>
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
