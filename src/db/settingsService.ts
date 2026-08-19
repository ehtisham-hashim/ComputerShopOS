import { isTauriEnvironment, memoryStore, getSqlDb } from "./client";

export interface StoreSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  currencySymbol: string;
  taxRate: string;
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  const defaultSettings: StoreSettings = {
    storeName: "Tasnim PC Hardware & Systems",
    storeAddress: "Shop #12, Computer Plaza, Main Boulevard",
    storePhone: "+92 300 1234567",
    currencySymbol: "PKR ",
    taxRate: "0.0",
  };

  if (isTauri && sqlDb) {
    try {
      const rows = await sqlDb.select<{ key: string; value: string }[]>(
        "SELECT key, value FROM settings"
      );
      const settingsMap: Record<string, string> = {};
      rows.forEach((r) => (settingsMap[r.key] = r.value));

      return {
        storeName: settingsMap["store_name"] || defaultSettings.storeName,
        storeAddress: settingsMap["store_address"] || defaultSettings.storeAddress,
        storePhone: settingsMap["store_phone"] || defaultSettings.storePhone,
        currencySymbol: "PKR ",
        taxRate: "0.0",
      };
    } catch (err) {
      console.warn("Failed to read settings from SQLite, using defaults:", err);
    }
  }

  return {
    storeName: memoryStore.settings["store_name"] || defaultSettings.storeName,
    storeAddress: memoryStore.settings["store_address"] || defaultSettings.storeAddress,
    storePhone: memoryStore.settings["store_phone"] || defaultSettings.storePhone,
    currencySymbol: "PKR ",
    taxRate: "0.0",
  };
}

export async function updateStoreSettings(settings: StoreSettings): Promise<void> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    const entries = [
      ["store_name", settings.storeName],
      ["store_address", settings.storeAddress],
      ["store_phone", settings.storePhone],
      ["currency_symbol", settings.currencySymbol],
      ["tax_rate", settings.taxRate],
    ];

    for (const [key, value] of entries) {
      await sqlDb.execute(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT(key) DO UPDATE SET value = $2`,
        [key, value]
      );
    }
    return;
  }

  memoryStore.settings["store_name"] = settings.storeName;
  memoryStore.settings["store_address"] = settings.storeAddress;
  memoryStore.settings["store_phone"] = settings.storePhone;
  memoryStore.settings["currency_symbol"] = settings.currencySymbol;
  memoryStore.settings["tax_rate"] = settings.taxRate;
}
