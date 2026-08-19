import { useEffect } from "react";
import { NavTab } from "../components/layout/navTypes";

export function useGlobalShortcuts(
  isAuthenticated: boolean,
  setActiveTab: (tab: NavTab) => void
) {
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, NavTab> = {
        F1: "dashboard",
        F2: "sales",
        F3: "inventory",
        F4: "repairs",
        F5: "adjustments",
        F6: "pc-builder",
        F7: "customers",
        F8: "settings",
      };

      if (keyMap[e.key]) {
        e.preventDefault();
        setActiveTab(keyMap[e.key]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthenticated, setActiveTab]);
}
