import { useState } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { SidebarProvider } from "./context/SidebarContext";
import { AppLayout } from "./components/layout/AppLayout";
import { NavTab } from "./components/layout/navTypes";
import { LoginPage } from "./pages/Login";
import { InventoryItem } from "./db/schema";
import { useAppData } from "./hooks/useAppData";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";
import { AppRouter } from "./components/AppRouter";
import { AppLoadingScreen } from "./components/ui/AppLoadingScreen";

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem("is_authenticated") === "true";
  });
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [salesInitialItems, setSalesInitialItems] = useState<InventoryItem[]>([]);

  const { items, customersCount, activeRepairsCount, payablesCount, lowStockCount, isLoading, fetchItems } = useAppData(isAuthenticated);
  useGlobalShortcuts(isAuthenticated, setActiveTab);

  const handleLockSession = () => {
    sessionStorage.removeItem("is_authenticated");
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  if (isLoading) {
    return <AppLoadingScreen message="Loading POS database & hardware engine..." />;
  }

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
      payablesCount={payablesCount}
      onQuickSale={() => { setSalesInitialItems([]); setActiveTab("sales"); }}
      onLockSession={handleLockSession}
    >
      <AppRouter
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        items={items}
        isLoading={isLoading}
        fetchItems={fetchItems}
        salesInitialItems={salesInitialItems}
        setSalesInitialItems={setSalesInitialItems}
      />
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
