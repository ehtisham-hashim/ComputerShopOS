import { lazy, Suspense } from "react";
import { NavTab } from "./layout/navTypes";
import { InventoryItem } from "../db/schema";

const DashboardPage = lazy(() => import("../pages/Dashboard").then((m) => ({ default: m.DashboardPage })));
const InventoryPage = lazy(() => import("../pages/Inventory").then((m) => ({ default: m.InventoryPage })));
const SalesPage = lazy(() => import("../pages/Sales").then((m) => ({ default: m.SalesPage })));
const RepairsPage = lazy(() => import("../pages/Repairs").then((m) => ({ default: m.RepairsPage })));
const AdjustmentsPage = lazy(() => import("../pages/Adjustments").then((m) => ({ default: m.AdjustmentsPage })));
const PCBuilderPage = lazy(() => import("../pages/PCBuilder").then((m) => ({ default: m.PCBuilderPage })));
const ReportsPage = lazy(() => import("../pages/Reports").then((m) => ({ default: m.ReportsPage })));
const CustomersPage = lazy(() => import("../pages/Customers").then((m) => ({ default: m.CustomersPage })));
const SettingsPage = lazy(() => import("../pages/Settings").then((m) => ({ default: m.SettingsPage })));
const DocGeneratorPage = lazy(() => import("../pages/DocGenerator").then((m) => ({ default: m.DocGeneratorPage })));
const PayablesPage = lazy(() => import("../pages/Payables").then((m) => ({ default: m.PayablesPage })));

const PageLoader = () => (
  <div className="flex h-64 w-full items-center justify-center">
    <div className="size-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
  </div>
);

interface AppRouterProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  items: InventoryItem[];
  isLoading: boolean;
  fetchItems: () => Promise<void>;
  salesInitialItems: InventoryItem[];
  setSalesInitialItems: (items: InventoryItem[]) => void;
}

export const AppRouter: React.FC<AppRouterProps> = ({
  activeTab,
  setActiveTab,
  items,
  isLoading,
  fetchItems,
  salesInitialItems,
  setSalesInitialItems,
}) => {
  return (
    <Suspense fallback={<PageLoader />}>
      {activeTab === "dashboard" && (
        <DashboardPage
          items={items}
          onNavigateToInventory={() => setActiveTab("inventory")}
          onNavigateToSales={() => { setSalesInitialItems([]); setActiveTab("sales"); }}
          onNavigateToPCBuilder={() => setActiveTab("pc-builder")}
          onNavigateToRepairs={() => setActiveTab("repairs")}
          onNavigateToAdjustments={() => setActiveTab("adjustments")}
        />
      )}
      {activeTab === "sales" && (
        <SalesPage items={items} onSaleComplete={fetchItems} initialCartItems={salesInitialItems} />
      )}
      {activeTab === "doc-generator" && (
        <DocGeneratorPage items={items} />
      )}
      {activeTab === "inventory" && (
        <InventoryPage items={items} isLoading={isLoading} onRefresh={fetchItems} />
      )}
      {activeTab === "repairs" && (
        <RepairsPage items={items} onRefreshInventory={fetchItems} />
      )}
      {activeTab === "adjustments" && (
        <AdjustmentsPage items={items} onRefreshInventory={fetchItems} />
      )}
      {activeTab === "reports" && <ReportsPage />}
      {activeTab === "pc-builder" && (
        <PCBuilderPage items={items} onTransferToSales={(parts) => { setSalesInitialItems(parts); setActiveTab("sales"); }} />
      )}
      {activeTab === "customers" && <CustomersPage />}
      {activeTab === "payables" && <PayablesPage />}
      {activeTab === "settings" && <SettingsPage />}
    </Suspense>
  );
};
