import React from "react";
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  Cpu,
  Wrench,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Database,
} from "lucide-react";
import { useSidebar } from "../../context/SidebarContext";

export type NavTab = "dashboard" | "inventory" | "pos" | "pc-builder" | "repairs" | "customers" | "settings";

interface AppSidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  inventoryCount: number;
  lowStockCount?: number;
  activeRepairsCount?: number;
  customersCount?: number;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeTab,
  onSelectTab,
  inventoryCount,
  lowStockCount = 0,
  activeRepairsCount = 0,
  customersCount = 0,
}) => {
  const { isExpanded, toggleSidebar, isMobileOpen, closeMobileSidebar } = useSidebar();

  const navItems = [
    {
      id: "dashboard" as NavTab,
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "inventory" as NavTab,
      label: "Inventory",
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : `${inventoryCount}`,
      badgeType: lowStockCount > 0 ? "warning" : "neutral",
    },
    {
      id: "pos" as NavTab,
      label: "Point of Sale (POS)",
      icon: ShoppingCart,
      hotkey: "F2",
    },
    {
      id: "pc-builder" as NavTab,
      label: "Custom PC Builder",
      icon: Cpu,
      isNew: true,
    },
    {
      id: "repairs" as NavTab,
      label: "Repairs & RMA",
      icon: Wrench,
      badge: activeRepairsCount > 0 ? `${activeRepairsCount}` : undefined,
      badgeType: "brand",
    },
    {
      id: "customers" as NavTab,
      label: "Customers (CRM)",
      icon: Users,
      badge: customersCount > 0 ? `${customersCount}` : undefined,
      badgeType: "neutral",
    },
    {
      id: "settings" as NavTab,
      label: "Settings & System",
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 ${
          isExpanded ? "w-[280px]" : "w-[88px]"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between px-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white shadow-theme-md">
              <Sparkles className="size-6" />
            </div>
            {isExpanded && (
              <div className="flex flex-col truncate">
                <span className="font-outfit text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                  ComputerShop<span className="text-brand-500">OS</span>
                </span>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Enterprise Desktop POS
                </span>
              </div>
            )}
          </div>

          <button
            onClick={toggleSidebar}
            className="hidden lg:flex size-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isExpanded ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3.5 py-6">
          <div className="space-y-1">
            {isExpanded && (
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Menu
              </p>
            )}

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    closeMobileSidebar();
                  }}
                  className={`menu-item ${isActive ? "menu-item-active" : "menu-item-inactive"} ${
                    !isExpanded ? "justify-center px-0" : ""
                  }`}
                  title={!isExpanded ? item.label : undefined}
                >
                  <Icon className={`size-5 shrink-0 ${isActive ? "text-brand-500 dark:text-brand-400" : "text-gray-400 dark:text-gray-500"}`} />

                  {isExpanded && (
                    <div className="flex flex-1 items-center justify-between overflow-hidden">
                      <span className="truncate">{item.label}</span>

                      <div className="flex items-center gap-1.5 ml-2">
                        {item.hotkey && (
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            {item.hotkey}
                          </span>
                        )}

                        {item.isNew && (
                          <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                            PRO
                          </span>
                        )}

                        {item.badge && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                              item.badgeType === "warning"
                                ? "bg-warning-50 text-warning-600 dark:bg-warning-500/20 dark:text-warning-400"
                                : item.badgeType === "brand"
                                ? "bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Database Footer Status */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <div className={`flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60 ${!isExpanded ? "justify-center p-2" : ""}`}>
            <div className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75"></span>
              <span className="relative inline-flex size-2.5 rounded-full bg-success-500"></span>
            </div>

            {isExpanded && (
              <div className="flex flex-col truncate">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200">
                  <Database className="size-3 text-brand-500" />
                  <span>SQLite Engine</span>
                </div>
                <span className="truncate text-[11px] text-gray-400 dark:text-gray-500">
                  pc_shop.db (WAL Mode)
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
