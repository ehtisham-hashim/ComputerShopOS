import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

export interface DropdownOption<T = string> {
  value: T;
  label: string;
  badgeStyle?: string;
  disabled?: boolean;
}

export interface CustomDropdownProps<T = string> {
  value: T;
  onChange: (val: T) => void;
  options: Array<DropdownOption<T> | T>;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  variant?: "default" | "badge" | "minimal";
  minWidth?: number;
}

export function CustomDropdown<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
  buttonClassName = "",
  menuClassName = "",
  disabled = false,
  size = "md",
  variant = "default",
  minWidth,
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Normalize options to DropdownOption format
  const normalizedOptions: DropdownOption<T>[] = options.map((opt) => {
    if (typeof opt === "object" && opt !== null && "value" in opt) {
      return opt as DropdownOption<T>;
    }
    return { value: opt, label: String(opt) };
  });

  const selectedOption = normalizedOptions.find((o) => o.value === value);

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = Math.min(normalizedOptions.length * 36 + 16, 240);
    const fitsBelow = window.innerHeight - rect.bottom > dropdownHeight + 10;
    const computedWidth = Math.max(rect.width, minWidth || 140);
    const clampedLeft = Math.max(8, Math.min(rect.left, window.innerWidth - computedWidth - 12));

    setCoords({
      top: fitsBelow ? rect.bottom + 4 : Math.max(8, rect.top - dropdownHeight - 4),
      left: clampedLeft,
      width: computedWidth,
    });
  };

  const toggleDropdown = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen]);

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

    const handleScroll = (e: Event) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      setIsOpen(false);
    };

    const handleResize = () => setIsOpen(false);

    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  // Size styling
  const sizeStyles = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs";

  // Variant styling for button
  const getButtonStyles = () => {
    if (variant === "minimal") {
      return "bg-transparent text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 border-none font-bold";
    }
    if (variant === "badge") {
      return selectedOption?.badgeStyle || "border border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 font-bold";
    }
    return "border border-gray-200 bg-white text-gray-800 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 font-medium shadow-theme-xs";
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={toggleDropdown}
        className={`flex w-full items-center justify-between gap-1.5 rounded-xl transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${sizeStyles} ${getButtonStyles()} ${buttonClassName}`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`size-3.5 shrink-0 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-brand-500" : ""
          }`}
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              minWidth: coords.width,
              zIndex: 9999,
            }}
            className={`max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 text-xs shadow-2xl shadow-black/20 dark:border-gray-800 dark:bg-gray-900 scrollbar-thin animate-in fade-in zoom-in-95 duration-100 ${menuClassName}`}
          >
            {normalizedOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 font-medium transition-colors text-left ${
                    isSelected
                      ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 font-bold"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  } ${opt.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="size-3.5 shrink-0 text-brand-500" />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
