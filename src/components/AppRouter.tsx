import { lazy, Suspense } from "react";
import { NavTab } from "./layout/navTypes";
import { InventoryItem, CategoryRecord } from "../db/schema";

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
const ExpensesPage = lazy(() => import("../pages/Expenses").then((m) => ({ default: m.ExpensesPage })));
const SalariesPage = lazy(() => import("../pages/Salaries").then((m) => ({ default: m.SalariesPage })));
const CategoriesPage = lazy(() => import("../pages/Categories").then((m) => ({ default: m.CategoriesPage })));

const PageLoader = () => (
  <div className="flex h-64 w-full items-center justify-center">
    <div className="size-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
  </div>
);

interface AppRouterProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  items: InventoryItem[];
  categories?: CategoryRecord[];
  isLoading: boolean;
  fetchItems: () => Promise<void>;
  salesInitialItems: InventoryItem[];
  setSalesInitialItems: (items: InventoryItem[]) => void;
}

export const AppRouter: React.FC<AppRouterProps> = ({
  activeTab,
  setActiveTab,
  items,
  categories = [],
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
        <SalesPage items={items} categories={categories} onSaleComplete={fetchItems} initialCartItems={salesInitialItems} />
      )}
      {activeTab === "doc-generator" && (
        <DocGeneratorPage items={items} />
      )}
      {activeTab === "inventory" && (
        <InventoryPage items={items} categories={categories} isLoading={isLoading} onRefresh={fetchItems} />
      )}
      {activeTab === "categories" && (
        <CategoriesPage categories={categories} items={items} onRefresh={fetchItems} />
      )}
      {activeTab === "repairs" && (
        <RepairsPage items={items} onRefreshInventory={fetchItems} />
      )}
      {activeTab === "adjustments" && (
        <AdjustmentsPage items={items} onRefreshInventory={fetchItems} />
      )}
      {activeTab === "reports" && <ReportsPage />}
      {activeTab === "expenses" && <ExpensesPage />}
      {activeTab === "salaries" && <SalariesPage />}
      {activeTab === "pc-builder" && (
        <PCBuilderPage items={items} onTransferToSales={(parts) => { setSalesInitialItems(parts); setActiveTab("sales"); }} />
      )}
      {activeTab === "customers" && <CustomersPage />}
      {activeTab === "payables" && <PayablesPage onRefreshInventory={fetchItems} />}
      {activeTab === "settings" && <SettingsPage />}
    </Suspense>
  );
};
