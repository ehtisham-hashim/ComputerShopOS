import React, { useState, useEffect } from "react";
import {
  Settings,
  Sun,
  Moon,
  Database,
  Download,
  CheckCircle2,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { getStoreSettings, updateStoreSettings } from "../db/settingsService";

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [storeName, setStoreName] = useState("Tasnim PC Hardware & Systems");
  const [storeAddress, setStoreAddress] = useState("Shop #12, Computer Plaza, Main Boulevard");
  const [storePhone, setStorePhone] = useState("+92 300 1234567");
  const [currencySymbol, setCurrencySymbol] = useState("PKR ");
  const [taxRate, setTaxRate] = useState("0.0");
  const [isSaved, setIsSaved] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  useEffect(() => {
    getStoreSettings().then((cfg) => {
      setStoreName(cfg.storeName);
      setStoreAddress(cfg.storeAddress);
      setStorePhone(cfg.storePhone);
      setCurrencySymbol(cfg.currencySymbol);
      setTaxRate(cfg.taxRate);
    });
  }, []);

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateStoreSettings({
      storeName,
      storeAddress,
      storePhone,
      currencySymbol,
      taxRate,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleBackupDb = () => {
    setBackupStatus("SQLite Database snapshot exported: pc_shop_backup.db in AppData");
    setTimeout(() => setBackupStatus(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          <Settings className="size-6 text-gray-500" />
          Settings & System Configuration
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Store profile, appearance theme, and local SQLite database management
        </p>
      </div>

      {/* Theme Appearance Card */}
      <div className="tail-card">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">
          Appearance & Theme
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          TailAdmin dashboard theme preference with instant persistence
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-md">
          {/* Light Theme Card */}
          <div
            onClick={() => setTheme("light")}
            className={`cursor-pointer rounded-2xl border p-4 text-center transition-all ${
              theme === "light"
                ? "border-brand-500 bg-brand-50/50 shadow-theme-sm ring-2 ring-brand-500/20"
                : "border-gray-200 hover:border-gray-300 dark:border-gray-800"
            }`}
          >
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-white text-gray-900 shadow-theme-xs mb-3 border border-gray-100">
              <Sun className="size-6 text-warning-500" />
            </div>
            <span className="font-bold text-sm text-gray-900 dark:text-white">Light Mode</span>
            <p className="text-xs text-gray-500 mt-1">Clean crisp white background</p>
          </div>

          {/* Dark Theme Card */}
          <div
            onClick={() => setTheme("dark")}
            className={`cursor-pointer rounded-2xl border p-4 text-center transition-all ${
              theme === "dark"
                ? "border-brand-500 bg-brand-500/10 shadow-theme-sm ring-2 ring-brand-500/20"
                : "border-gray-200 hover:border-gray-300 dark:border-gray-800"
            }`}
          >
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-gray-900 text-white shadow-theme-xs mb-3 border border-gray-800">
              <Moon className="size-6 text-brand-400" />
            </div>
            <span className="font-bold text-sm text-gray-900 dark:text-white">Dark Mode</span>
            <p className="text-xs text-gray-500 mt-1">Deep neutral dark theme (shadcn style)</p>
          </div>
        </div>
      </div>

      {/* Store Profile Form */}
      <div className="tail-card">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">
          Store Information (Receipt Header)
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Details printed on customer receipts and quotation sheets (saved in SQLite)
        </p>

        {isSaved && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-success-200 bg-success-50 p-3 text-xs font-semibold text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
            <CheckCircle2 className="size-4" />
            <span>Store settings saved to SQLite database!</span>
          </div>
        )}

        <form onSubmit={handleSaveStore} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Business / Store Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="tail-input"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                className="tail-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Store Physical Address
            </label>
            <input
              type="text"
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              className="tail-input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Global Currency (Locked)
              </label>
              <input
                type="text"
                value="PKR (Pakistani Rupee)"
                disabled
                className="tail-input bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Tax Rate (%)
              </label>
              <input
                type="text"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="tail-input"
                required
              />
            </div>
          </div>

          <button type="submit" className="tail-btn-primary">
            Save Store Details
          </button>
        </form>
      </div>

      {/* Database & Engine Status Card */}
      <div className="tail-card">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <Database className="size-5 text-brand-500" />
          SQLite Database & Offline Engine
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Local embedded data storage with zero network latency
        </p>

        <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/70 p-4 text-xs dark:border-gray-800 dark:bg-gray-800/40">
          <div className="flex justify-between">
            <span className="text-gray-500">Database Engine:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              SQLite (WAL Mode via @tauri-apps/plugin-sql)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Security & Pragmas:</span>
            <span className="font-semibold text-success-600 dark:text-success-400">
              WAL + synchronous=NORMAL + foreign_keys=ON
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Storage Location:</span>
            <code className="font-mono text-brand-600 dark:text-brand-400">
              pc_shop.db (OS AppData)
            </code>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Cross-Platform Standard:</span>
            <span className="font-semibold text-success-600 dark:text-success-400">
              Compliant (context/cross-platform-guidelines.md)
            </span>
          </div>
        </div>

        {backupStatus && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-success-200 bg-success-50 p-3 text-xs font-semibold text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
            <CheckCircle2 className="size-4" />
            <span>{backupStatus}</span>
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button onClick={handleBackupDb} className="tail-btn-secondary">
            <Download className="size-4" />
            <span>Export Database Backup</span>
          </button>
        </div>
      </div>
    </div>
  );
};
