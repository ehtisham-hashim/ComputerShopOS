import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { updateStoreSettings } from "../../db/settingsService";

interface StoreProfileFormProps {
  storeName: string;
  setStoreName: (v: string) => void;
  storeAddress: string;
  setStoreAddress: (v: string) => void;
  storePhone: string;
  setStorePhone: (v: string) => void;
  currencySymbol: string;
  taxRate: string;
  setTaxRate: (v: string) => void;
}

export const StoreProfileForm: React.FC<StoreProfileFormProps> = ({
  storeName,
  setStoreName,
  storeAddress,
  setStoreAddress,
  storePhone,
  setStorePhone,
  currencySymbol,
  taxRate,
  setTaxRate,
}) => {
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
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

  return (
    <div className="tail-card">
      <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">Store Information (Receipt Header)</h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Details printed on customer receipts and quotation sheets (saved in SQLite)
      </p>

      {isSaved && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-success-200 bg-success-50 p-3 text-xs font-semibold text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
          <CheckCircle2 className="size-4" />
          <span>Store settings saved to SQLite database!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Business / Store Name</label>
            <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="tail-input" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Phone Number</label>
            <input type="text" value={storePhone} onChange={(e) => setStorePhone(e.target.value)} className="tail-input" required />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Store Physical Address</label>
          <input type="text" value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} className="tail-input" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Global Currency (Locked)</label>
            <input type="text" value="PKR (Pakistani Rupee)" disabled className="tail-input bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed font-bold" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Tax Rate (%)</label>
            <input type="text" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className="tail-input" required />
          </div>
        </div>
        <button type="submit" className="tail-btn-primary">Save Store Details</button>
      </form>
    </div>
  );
};
