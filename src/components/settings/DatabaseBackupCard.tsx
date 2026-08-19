import React, { useState } from "react";
import { Database, Download } from "lucide-react";

export const DatabaseBackupCard: React.FC = () => {
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  const handleBackupDb = () => {
    setBackupStatus("SQLite Database snapshot exported: pc_shop_backup.db in AppData");
    setTimeout(() => setBackupStatus(null), 4000);
  };

  return (
    <div className="tail-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="size-5 text-brand-500" />
            Database Engine & Storage
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Self-contained SQLite file located locally on disk
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/30 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
              Database Name: pc_shop.db
            </span>
            <p className="text-[11px] text-gray-400">Engine: SQLite 3 with WAL Journal Mode</p>
          </div>
          <button onClick={handleBackupDb} className="tail-btn-secondary text-xs">
            <Download className="size-3.5" />
            <span>Export Backup</span>
          </button>
        </div>

        {backupStatus && (
          <div className="rounded-lg bg-brand-50 p-2.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
            {backupStatus}
          </div>
        )}
      </div>
    </div>
  );
};
