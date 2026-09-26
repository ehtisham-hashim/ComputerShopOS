import React from "react";
import { LayoutDashboard, Boxes, ShoppingCart, FileText, Wrench, Users, Settings, ArrowLeftRight, BarChart3, Building2, Receipt, Tags, Banknote } from "lucide-react";
import { useSidebar } from "../../context/SidebarContext";
import { NavTab } from "./navTypes";
import { SidebarBrand } from "./SidebarBrand";
import { SidebarNavItem, NavItemConfig } from "./SidebarNavItem";
import { SidebarFooter } from "./SidebarFooter";

export type { NavTab };

interface AppSidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  inventoryCount: number;
  categoriesCount?: number;
  lowStockCount?: number;
  activeRepairsCount?: number;
  customersCount?: number;
  payablesCount?: number;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeTab,
  onSelectTab,
  inventoryCount,
  categoriesCount = 0,
  lowStockCount = 0,
  activeRepairsCount = 0,
  customersCount = 0,
  payablesCount = 0,
}) => {
  const { isExpanded, toggleSidebar, isMobileOpen, closeMobileSidebar } = useSidebar();

  const navItems: NavItemConfig[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "sales", label: "Sales", icon: ShoppingCart, hotkey: "F2" },
    { id: "payables", label: "Purchases", icon: Building2, badge: payablesCount > 0 ? `${payablesCount}` : undefined, badgeType: "warning" },
    { id: "doc-generator", label: "Documents", icon: FileText, hotkey: "F4" },
    { id: "inventory", label: "Inventory", icon: Boxes, badge: lowStockCount > 0 ? `${lowStockCount} Low` : `${inventoryCount}`, badgeType: lowStockCount > 0 ? "warning" : "neutral" },
    { id: "categories", label: "Categories", icon: Tags, badge: categoriesCount > 0 ? `${categoriesCount}` : undefined, badgeType: "neutral" },
    { id: "repairs", label: "Repairs", icon: Wrench, badge: activeRepairsCount > 0 ? `${activeRepairsCount}` : undefined, badgeType: "brand" },
    { id: "adjustments", label: "Trade-Ins", icon: ArrowLeftRight },
    { id: "expenses", label: "Expenses", icon: Receipt },
    { id: "salaries", label: "Salaries", icon: Banknote },
    { id: "customers", label: "Customers", icon: Users, badge: customersCount > 0 ? `${customersCount}` : undefined, badgeType: "neutral" },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {isMobileOpen && (
        <div onClick={closeMobileSidebar} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in" />
      )}
      <aside
        className={`fixed top-0 left-0 z-40 flex h-screen flex-col justify-between border-r border-gray-200 bg-white transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-950 ${
          isExpanded ? "w-[280px]" : "w-[88px]"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex flex-col flex-1 overflow-hidden">
          <SidebarBrand isExpanded={isExpanded} toggleSidebar={toggleSidebar} />
          <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1 scrollbar-thin">
            {isExpanded && (
              <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Core Modules
              </p>
            )}
            {navItems.map((item) => (
              <SidebarNavItem
                key={item.id}
                item={item}
                isActive={activeTab === item.id}
                isExpanded={isExpanded}
                onClick={() => {
                  onSelectTab(item.id);
                  closeMobileSidebar();
                }}
              />
            ))}
          </div>
        </div>
        <SidebarFooter isExpanded={isExpanded} />
      </aside>
    </>
  );
};
