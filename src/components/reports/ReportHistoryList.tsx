import React, { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, ChevronDown, Calendar, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

export interface MonthlyHistoryItem {
  year: number;
  month: number;
  monthLabel: string;
  grossSales: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  status: "OPEN" | "CLOSED";
}

interface ReportHistoryListProps {
  history: MonthlyHistoryItem[];
  onSelectMonth: (year: number, month: number) => void;
  onBackToCurrent: () => void;
  loading: boolean;
}

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number) => `Rs. ${n.toLocaleString()}`;

function MonthRow({ item, onSelect }: { item: MonthlyHistoryItem; onSelect: () => void }) {
  const isProfitable = item.netProfit >= 0;
  const margin = item.grossSales > 0 ? Math.round((item.grossProfit / item.grossSales) * 100) : 0;
  return (
    <div
      onClick={onSelect}
      className="group flex flex-col md:flex-row md:items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-theme-xs hover:border-brand-500/50 hover:shadow-theme-md transition-all cursor-pointer gap-4"
    >
      {/* Month + status */}
      <div className="flex items-center gap-3 min-w-[200px]">
        <div className="size-10 rounded-xl bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center text-brand-600 dark:text-brand-400">
          <Calendar className="size-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">
            {item.monthLabel}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
              item.status === "OPEN"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            }`}>
              {item.status === "OPEN" ? "Active" : "Archived"}
            </span>
            <span className="text-[11px] text-gray-400">{margin}% GP Margin</span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 text-xs">
        <div>
          <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Sales</span>
          <span className="font-bold tabular-nums text-gray-900 dark:text-white">{fmt(item.grossSales)}</span>
        </div>
        <div>
          <span className="text-gray-400 block text-[10px] uppercase font-bold">Gross Profit</span>
          <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{fmt(item.grossProfit)}</span>
        </div>
        <div>
          <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Expenses</span>
          <span className="font-bold tabular-nums text-rose-600 dark:text-rose-400">{fmt(item.totalExpenses)}</span>
        </div>
        <div>
          <span className="text-gray-400 block text-[10px] uppercase font-bold">Net Profit</span>
          <span className={`font-bold tabular-nums flex items-center gap-1 ${isProfitable ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {isProfitable ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
            {fmt(item.netProfit)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end md:justify-center">
        <div className="flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 group-hover:translate-x-0.5 transition-transform">
          <span>View Report</span>
          <ChevronRight className="size-4" />
        </div>
      </div>
    </div>
  );
}

function YearGroup({ year, months, onSelectMonth }: {
  year: number;
  months: MonthlyHistoryItem[];
  onSelectMonth: (year: number, month: number) => void;
}) {
  const [open, setOpen] = useState(false);

  // ponytail: derive yearly totals from already-loaded month data — no extra fetch
  const totals = useMemo(() => months.reduce(
    (acc, m) => ({
      grossSales:    acc.grossSales    + m.grossSales,
      grossProfit:   acc.grossProfit   + m.grossProfit,
      totalExpenses: acc.totalExpenses + m.totalExpenses,
      netProfit:     acc.netProfit     + m.netProfit,
    }),
    { grossSales: 0, grossProfit: 0, totalExpenses: 0, netProfit: 0 }
  ), [months]);

  const isProfitable = totals.netProfit >= 0;
  const margin = totals.grossSales > 0 ? Math.round((totals.grossProfit / totals.grossSales) * 100) : 0;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-theme-xs">
      {/* Year summary header — clickable to expand */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/60 hover:bg-brand-50/60 dark:hover:bg-brand-950/20 transition-colors gap-4 text-left"
      >
        {/* Year label */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="size-10 rounded-xl bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-brand-700 dark:text-brand-300">
            <BarChart3 className="size-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-gray-900 dark:text-white">{year}</h3>
            <span className="text-[11px] text-gray-400">{months.length} month{months.length !== 1 ? "s" : ""} • {margin}% GP Margin</span>
          </div>
        </div>

        {/* Year totals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 text-xs">
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Sales</span>
            <span className="font-bold tabular-nums text-gray-900 dark:text-white">{fmt(totals.grossSales)}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Gross Profit</span>
            <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{fmt(totals.grossProfit)}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Expenses</span>
            <span className="font-bold tabular-nums text-rose-600 dark:text-rose-400">{fmt(totals.totalExpenses)}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Net Profit</span>
            <span className={`font-bold tabular-nums flex items-center gap-1 ${isProfitable ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {isProfitable ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
              {fmt(totals.netProfit)}
            </span>
          </div>
        </div>

        <ChevronDown className={`size-5 text-gray-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Collapsible months */}
      {open && (
        <div className="divide-y divide-gray-100 dark:divide-gray-800 px-3 pb-3 pt-1 space-y-2">
          {months.map((item) => (
            <MonthRow
              key={`${item.year}-${item.month}`}
              item={item}
              onSelect={() => onSelectMonth(item.year, item.month)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── main export ─────────────────────────────────────────────────────────────
export const ReportHistoryList: React.FC<ReportHistoryListProps> = ({
  history,
  onSelectMonth,
  onBackToCurrent,
  loading,
}) => {
  const [view, setView] = useState<"monthly" | "yearly">("monthly");

  // ponytail: group once via useMemo, no service layer needed
  const yearGroups = useMemo(() => {
    const map = new Map<number, MonthlyHistoryItem[]>();
    for (const item of history) {
      const list = map.get(item.year) ?? [];
      list.push(item);
      map.set(item.year, list);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b - a)
      .map(([year, months]) => ({ year, months: months.sort((a, b) => b.month - a.month) }));
  }, [history]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBackToCurrent} className="tail-btn-secondary-sm flex items-center gap-1.5">
            <ArrowLeft className="size-4" />
            <span>Back to Current Month</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Reports Archive
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Select any past month to view its complete financial statement
            </p>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl self-start sm:self-auto">
          {(["monthly", "yearly"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                view === v
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">Loading historical reports...</div>
      ) : history.length === 0 ? (
        <div className="py-20 text-center text-xs text-gray-400">No monthly archives recorded yet.</div>
      ) : view === "monthly" ? (
        <div className="space-y-3">
          {history.map((item) => (
            <MonthRow
              key={`${item.year}-${item.month}`}
              item={item}
              onSelect={() => onSelectMonth(item.year, item.month)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {yearGroups.map(({ year, months }) => (
            <YearGroup key={year} year={year} months={months} onSelectMonth={onSelectMonth} />
          ))}
        </div>
      )}
    </div>
  );
};
