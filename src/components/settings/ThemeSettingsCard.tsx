import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export const ThemeSettingsCard: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="tail-card">
      <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">Appearance & Theme</h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        TailAdmin dashboard theme preference with instant persistence
      </p>

      <div className="grid grid-cols-2 gap-4 max-w-md">
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
          <p className="text-xs text-gray-500 mt-1">Deep obsidian OLED night theme</p>
        </div>
      </div>
    </div>
  );
};
