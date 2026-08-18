import { useState, useEffect, useCallback } from "react";
import { Sidebar, NavTab } from "./components/Sidebar";
import { InventoryPage } from "./pages/Inventory";
import { DashboardPage } from "./pages/Dashboard";
import { InventoryItem } from "./db/schema";
import { getInventoryItems } from "./db/inventoryService";
import { initDb } from "./db/client";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState<NavTab>("inventory");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true);
      await initDb();
      const records = await getInventoryItems();
      setItems(records);
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <div className="app-shell">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        inventoryCount={items.length}
      />

      <main className="content-area">
        {activeTab === "inventory" && (
          <InventoryPage
            items={items}
            isLoading={isLoading}
            onRefresh={fetchItems}
          />
        )}

        {activeTab === "dashboard" && (
          <DashboardPage
            items={items}
            onNavigateToInventory={() => setActiveTab("inventory")}
          />
        )}

        {activeTab === "settings" && (
          <div className="page-container">
            <header className="page-header">
              <div>
                <h1 className="page-title">Settings & System Info</h1>
                <p className="page-subtitle">Database configuration and engine status</p>
              </div>
            </header>
            <div className="dashboard-content-box">
              <h2 className="section-title">Database Info</h2>
              <p className="text-muted mb-2">
                Engine: <strong>SQLite (Local Embedded via @tauri-apps/plugin-sql)</strong>
              </p>
              <p className="text-muted mb-2">
                ORM: <strong>Drizzle ORM (Proxy Driver & Schema Builder)</strong>
              </p>
              <p className="text-muted">
                Database file: <code>pc_shop.db</code> in application data directory.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
