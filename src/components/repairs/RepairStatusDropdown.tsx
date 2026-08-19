import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { RepairStatus, RepairStatuses } from "../../db/schema";

interface RepairStatusDropdownProps {
  status: RepairStatus;
  onChange: (status: RepairStatus) => void;
}

export const RepairStatusDropdown: React.FC<RepairStatusDropdownProps> = ({ status, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const fitsBelow = window.innerHeight - rect.bottom > 200;
      setCoords({
        top: fitsBelow ? rect.bottom + 4 : rect.top - 180,
        left: Math.min(rect.left, window.innerWidth - 170),
      });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleScroll = () => setIsOpen(false);
    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  const getBadgeStyle = (s: RepairStatus) => {
    if (s === "READY" || s === "DELIVERED")
      return "bg-success-50 text-success-700 border-success-200 dark:bg-success-500/15 dark:text-success-400 dark:border-success-500/30";
    if (s === "IN_PROGRESS" || s === "WAITING_PARTS")
      return "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-500/15 dark:text-warning-400 dark:border-warning-500/30";
    return "bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-500/15 dark:text-brand-400 dark:border-brand-500/30";
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleDropdown}
        className={`inline-flex items-center justify-between gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition-all shadow-theme-xs ${getBadgeStyle(status)}`}
      >
        <span>{status.replace(/_/g, " ")}</span>
        <ChevronDown className={`size-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: coords.top, left: coords.left, zIndex: 9999 }}
          className="w-40 rounded-xl border border-gray-200 bg-white p-1 text-xs shadow-2xl shadow-black/20 dark:border-gray-800 dark:bg-gray-900 animate-in fade-in zoom-in-95 duration-100"
        >
          {RepairStatuses.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => { onChange(st); setIsOpen(false); }}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 font-semibold transition-colors ${
                status === st
                  ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              <span>{st.replace(/_/g, " ")}</span>
              {status === st && <Check className="size-3.5" />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};
