import React, { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { getStoreSettings } from "../db/settingsService";
import { PageHeader } from "../components/ui/PageHeader";
import { ThemeSettingsCard } from "../components/settings/ThemeSettingsCard";
import { StoreProfileForm } from "../components/settings/StoreProfileForm";
import { DatabaseBackupCard } from "../components/settings/DatabaseBackupCard";

export const SettingsPage: React.FC = () => {
  const [storeName, setStoreName] = useState("Tasnim PC Hardware & Systems");
  const [storeAddress, setStoreAddress] = useState("Shop #12, Computer Plaza, Main Boulevard");
  const [storePhone, setStorePhone] = useState("+92 300 1234567");
  const [currencySymbol, setCurrencySymbol] = useState("PKR ");
  const [taxRate, setTaxRate] = useState("0.0");

  useEffect(() => {
    getStoreSettings().then((cfg) => {
      setStoreName(cfg.storeName);
      setStoreAddress(cfg.storeAddress);
      setStorePhone(cfg.storePhone);
      setCurrencySymbol(cfg.currencySymbol);
      setTaxRate(cfg.taxRate);
    });
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Settings & System Configuration"
        subtitle="Store profile, appearance theme, and local SQLite database management"
        icon={Settings}
        iconColor="text-gray-500"
      />

      <ThemeSettingsCard />

      <StoreProfileForm
        storeName={storeName}
        setStoreName={setStoreName}
        storeAddress={storeAddress}
        setStoreAddress={setStoreAddress}
        storePhone={storePhone}
        setStorePhone={setStorePhone}
        currencySymbol={currencySymbol}
        taxRate={taxRate}
        setTaxRate={setTaxRate}
      />

      <DatabaseBackupCard />
    </div>
  );
};
