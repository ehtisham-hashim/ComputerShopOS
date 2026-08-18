import React from "react";
import { Package, LayoutDashboard, Settings, Layers } from "lucide-react";

export type NavTab = "dashboard" | "inventory" | "settings";

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  inventoryCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  inventoryCount,
}) => {
  const navItems = [
    {
      id: "inventory" as NavTab,
      label: "Inventory",
      icon: Package,
      badge: inventoryCount > 0 ? inventoryCount : undefined,
    },
    {
      id: "dashboard" as NavTab,
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "settings" as NavTab,
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-badge">
          <Layers size={22} className="logo-icon" />
        </div>
        <div className="logo-text">
          <span className="brand-name">ComputerShop</span>
          <span className="brand-badge">OS</span>
        </div>
      </div>

      <div className="sidebar-section-title">MANAGEMENT</div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => onSelectTab(item.id)}
            >
              <Icon size={18} className="nav-icon" />
              <span className="nav-label">{item.label}</span>
              {item.badge !== undefined && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="db-status">
          <div className="status-dot online"></div>
          <span>SQLite + Drizzle ORM</span>
        </div>
      </div>
    </aside>
  );
};
