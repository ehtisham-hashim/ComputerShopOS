# ComputerShopOS - UI/UX Design System & Theme Specification

> **Reference Template:** [`/home/ehtisham/Desktop/Projects/TailAdmin-1.0.0`](file:///home/ehtisham/Desktop/Projects/TailAdmin-1.0.0)  
> **Tech Stack:** Tailwind CSS + React 19 + TypeScript + Lucide Icons + Radix UI / Shadcn Primitives  
> **Backend Integration:** Tauri 2 (Rust) + Embedded SQLite (Drizzle ORM)  
> **Target OS:** Windows 10/11 (Client Production) & Ubuntu Linux (Dev) per [`context/cross-platform-guidelines.md`](file:///home/ehtisham/Desktop/Projects/ComputerShopOS/context/cross-platform-guidelines.md)

---

## 1. Executive Summary & Aesthetic Direction

ComputerShopOS adopts the clean, modern, high-density dashboard aesthetic established in the **TailAdmin** template (`/home/ehtisham/Desktop/Projects/TailAdmin-1.0.0`).

The design prioritizes:
1. **Flawless Light & Dark Modes:** Instant class-based switching (`dark` class on root `<html>`) with zero layout shift or flickering.
2. **High-Density Desktop Layout:** Clean 12-column grid, compact spacing, responsive data tables, and quick visual hierarchy tailored for retail POS and tech repair workflows.
3. **Soft Modern Elevation:** Subtle borders (`border-gray-200` in light, `border-gray-800` or `border-white/[0.05]` in dark), refined pill badges, and soft shadows (`shadow-theme-xs`, `shadow-theme-sm`).
4. **Tauri Desktop Performance:** Pure CSS animations and hardware-accelerated transitions that execute at 60+ FPS inside WebKitGTK (Linux) and WebView2 (Windows).

---

## 2. Color Palette & Theme Tokens (Direct from TailAdmin)

The color palette directly imports TailAdmin's refined color tokens:

### 2.1 Core Neutral & Background Colors
| Token | Light Mode Value | Dark Mode Value | Usage |
| :--- | :--- | :--- | :--- |
| **Page Background** | `#F9FAFB` (`bg-gray-50`) | `#101828` (`bg-gray-900` / `#0C111D`) | App shell background |
| **Card / Box Background**| `#FFFFFF` (`bg-white`) | `#1A2231` (`bg-gray-dark` / `bg-white/[0.03]`) | Containers, cards, modals |
| **Sidebar / Header** | `#FFFFFF` (`bg-white`) | `#101828` (`bg-gray-900`) | Navigation bars |
| **Border Normal** | `#E4E7EC` (`border-gray-200`) | `#1D2939` (`border-gray-800`) | Card dividers, table borders |
| **Border Subtle** | `#F2F4F7` (`border-gray-100`) | `rgba(255,255,255,0.05)` | Inner row separators |
| **Text Heading** | `#101828` (`text-gray-900`) | `#FFFFFF` (`text-white`) | Page titles, major metrics |
| **Text Body** | `#344054` (`text-gray-700`) | `#D0D5DD` (`text-gray-300`) | Content, descriptions |
| **Text Muted** | `#667085` (`text-gray-500`) | `#98A2B3` (`text-gray-400`) | Subtitles, helper text |

### 2.2 Semantic & Accent Colors
| Palette | Base Hex (`-500`) | Light Accent BG | Dark Accent BG | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Brand (Blue)** | `#465FFF` | `#ECF3FF` (`bg-brand-50`) | `rgba(70,95,255,0.15)` | Primary buttons, active nav, focus rings |
| **Success (Green)**| `#12B76A` | `#ECFDF3` (`bg-success-50`)| `rgba(18,183,106,0.15)` | Stock in, paid sales, completed repairs |
| **Warning (Amber)**| `#F79009` | `#FFFAEB` (`bg-warning-50`)| `rgba(247,144,9,0.15)` | Low stock alert, repair pending approval |
| **Error (Red)** | `#F04438` | `#FEF3F2` (`bg-error-50`) | `rgba(240,68,56,0.15)` | Out of stock, defective serial, void sale |
| **Purple** | `#7A5AF8` | `#F4F3FF` | `rgba(122,90,248,0.15)`| Custom PC Builder highlights |

---

## 3. Typography & Font Hierarchy

Matching TailAdmin:
* **Primary Font Family:** `Outfit, sans-serif` (with fallback to `Inter, system-ui, sans-serif`).
* **Font Sizing Scale:**
  * Page Title: `text-2xl font-bold tracking-tight text-gray-900 dark:text-white`
  * Section Header: `text-lg font-semibold text-gray-800 dark:text-white/90`
  * Metric Number: `text-3xl font-bold text-gray-900 dark:text-white`
  * Body Text: `text-sm font-normal text-gray-700 dark:text-gray-300`
  * Badge / Label: `text-xs font-medium tracking-wide`

---

## 4. Layout Architecture (App Shell)

Directly modeled on TailAdmin's `src/layout/AppLayout.tsx`:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ App Shell                                                                   │
│ ┌───────────────┐ ┌───────────────────────────────────────────────────────┐ │
│ │ AppSidebar    │ │ AppHeader                                             │ │
│ │               │ │ [ 🔍 Search ] [🌙/☀️ Theme] [🔔 Alerts] [👤 User Profile]│ │
│ │ • Dashboard   │ ├───────────────────────────────────────────────────────┤ │
│ │ • Inventory   │ │ Content Area (Outlet / Page Component)                │ │
│ │ • POS / Sales │ │                                                       │ │
│ │ • PC Builder  │ │ ┌───────────────────┐ ┌─────────────────────────────┐ │ │
│ │ • Repairs     │ │ │ Metric Card 1     │ │ Metric Card 2               │ │ │
│ │ • Settings    │ │ └───────────────────┘ └─────────────────────────────┘ │ │
│ │               │ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ [ Collapse ◀ ]│ │ │ Data Table / Interactive View                   │ │ │
│ └───────────────┘ └─┴─────────────────────────────────────────────────┴─┴─┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Sidebar Behavior
* **Expand / Collapse:** Toggleable width (`290px` expanded vs `90px` compact icon rail) with smooth CSS transition.
* **Active Indicator:** Active route highlighted with `bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400` with subtle left vertical accent bar.
* **Badges:** Count badges on Inventory (e.g. low stock badge) and Repairs (active tickets count).

### 4.2 Header Features
* Global search trigger (`Ctrl + K` / `Cmd + K` for instant item / customer / ticket search).
* Theme toggle button (Sun / Moon icon with animated transition).
* System status pill (Tauri SQLite DB connection status indicator).

---

## 5. UI Component Specs & Design Patterns

### 5.1 Metric / Stat Cards (TailAdmin `EcommerceMetrics` style)
* **Structure:** Rounded container (`rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]`).
* **Icon Pill:** Circular or rounded square (`w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-brand-500`).
* **Value & Growth:** Big bold metric paired with green (`+8.4%`) or red badge chips.

### 5.2 Data Tables (TailAdmin `tables` style)
* **Header:** Subtle uppercase gray text (`text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-white/[0.02] py-3.5 px-4`).
* **Row Hover:** Smooth hover effect (`hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors`).
* **Action Buttons:** Compact ghost buttons with Lucide icons (Edit, Delete, Print, Serial View).

### 5.3 Forms & Dialogs
* **Input Fields:** Clean rounded borders (`rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90`).
* **Primary Buttons:** `bg-brand-500 hover:bg-brand-600 text-white font-medium px-4 py-2.5 rounded-lg shadow-theme-xs transition-colors`.

---

## 6. TailAdmin Style Applied to ComputerShopOS Core Screens

### 6.1 Dashboard Page
* **Top Metric Cards:** Today's Sales ($), Low Stock Alerts (count), Active Repairs (count), Total Inventory Value ($).
* **Recent Sales Table:** Customer name, invoice #, item count, total price, payment method badge.
* **Quick Action Buttons:** New Sale (`F2`), Add Inventory (`F3`), New Repair (`F4`), Custom PC Build (`F5`).

### 6.2 Inventory Page
* **Filter Bar:** Search input, Category tabs/pills (All, CPU, GPU, RAM, Mobo, Storage, PSU, etc.), In-Stock / Low-Stock toggle.
* **Item Table:** SKU, Name, Category badge, Cost Price, Sell Price, Margin %, Stock Count, Serialized Indicator (`[SN]` badge).
* **Add / Edit Modal:** Clean modal dialog with real-time margin calculation and optional Serial Number intake tags.

### 6.3 POS & Checkout Page
* **Split Screen Layout:**
  * **Left (60%):** Fast Item Catalog / Grid / Search with instant barcode scan listener.
  * **Right (40%):** Cart Panel with line items, serial number selector dropdown per line, discount input, subtotal, tax, big "Complete Sale" button (`F10`).
* **Receipt Modal:** Clean formatted preview with instant "Print Receipt" trigger.

### 6.4 Custom PC Builder Page
* **Component Slot Cards:** 8 dedicated slots (Processor, Motherboard, Memory, Graphics, Storage, Power Supply, Cabinet, Cooler).
* **Real-Time Summary Card:** Total Cost, Total Selling Price, Estimated System TDP (Watts), Recommended PSU Wattage with status badge (OK / Underpowered warning), "Create Quotation" & "Transfer to POS" buttons.

### 6.5 Repairs & Service Page
* **Kanban / Status Tabs:** `All`, `Received` (Blue), `In Progress` (Amber), `Waiting for Parts` (Purple), `Ready for Pickup` (Green), `Delivered` (Gray).
* **Repair Ticket Cards / Table:** Ticket #, Customer Name, Phone, Device Model, Reported Fault, Technician Notes, Cost estimate.

### 6.6 Settings Page
* **Store Profile Form:** Store name, address, phone number, receipt footer message, currency symbol.
* **Appearance:** Light / Dark theme selector with live preview.
* **Database & Backup:** SQLite file path display, "Create Instant Backup" button, "Export CSV" button.

---

## 7. Light / Dark Theme Implementation Mechanics

Directly ported from TailAdmin's [`ThemeContext.tsx`](file:///home/ehtisham/Desktop/Projects/TailAdmin-1.0.0/src/context/ThemeContext.tsx):

```typescript
// src/context/ThemeContext.tsx
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>("light");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    const initial = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("theme", theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme, isInitialized]);

  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
```

---

## 8. Cross-Platform Guidelines & Backend Bridge Compliance

1. **No External CDN Dependencies:** Fonts and icons bundled locally within Vite assets to guarantee offline functionality in Tauri.
2. **Scrollbar Normalization:** TailAdmin custom scrollbar rules injected in `index.css` to prevent bulky default Windows scrollbars.
3. **Local Database Synchronization:** All UI state changes immediately commit to local SQLite database via Drizzle ORM queries.
4. **Tauri Safe Dialogs:** File export / print triggers invoke native Tauri plugins (`@tauri-apps/plugin-opener`, `@tauri-apps/plugin-dialog`) rather than browser-specific fallback prompts.
