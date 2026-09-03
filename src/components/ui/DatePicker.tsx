import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

interface DatePickerProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "Select date",
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const cur = value ? new Date(value + "T00:00:00") : new Date();
  const [year, setYear] = useState(cur.getFullYear());
  const [month, setMonth] = useState(cur.getMonth());

  useEffect(() => {
    const close = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) {
      document.addEventListener("mousedown", close);
      document.addEventListener("touchstart", close);
    }
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [open]);

  const days = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = new Date(year, month).toLocaleString("default", { month: "short" });

  const pick = (d: number) => {
    const m = String(month + 1).padStart(2, "0");
    const day = String(d).padStart(2, "0");
    onChange(`${year}-${m}-${day}`);
    setOpen(false);
  };

  const nav = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 h-8 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-mono text-left transition-colors hover:border-brand-500"
      >
        <span className="flex items-center gap-1.5 truncate">
          <Calendar className="size-3.5 text-gray-400 shrink-0" />
          <span className={value ? "text-gray-900 dark:text-white" : "text-gray-400 font-sans"}>
            {value || placeholder}
          </span>
        </span>
        {value && (
          <X
            className="size-3 text-gray-400 hover:text-error-500 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
          />
        )}
      </button>

      {open && (
        <div className="absolute left-0 mt-1 z-50 w-56 p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl text-xs select-none">
          <div className="flex items-center justify-between mb-2 font-bold font-sans">
            <button
              type="button"
              onClick={() => nav(-1)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <span>{monthName} {year}</span>
            <button
              type="button"
              onClick={() => nav(1)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-gray-400 mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center font-mono">
            {Array.from({ length: firstDay }).map((_, i) => (
              <span key={`e-${i}`} />
            ))}
            {Array.from({ length: days }).map((_, i) => {
              const d = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const active = value === dateStr;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => pick(d)}
                  className={`size-6 rounded text-xs transition-colors ${
                    active
                      ? "bg-brand-500 text-white font-bold"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between pt-2 mt-2 border-t border-gray-100 dark:border-gray-800 text-[10px]">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                onChange(
                  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
                    now.getDate()
                  ).padStart(2, "0")}`
                );
                setOpen(false);
              }}
              className="text-brand-600 dark:text-brand-400 font-bold hover:underline"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="text-gray-400 hover:text-error-500"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
