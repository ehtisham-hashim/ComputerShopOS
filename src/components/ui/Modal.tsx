import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, LucideIcon } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode | LucideIcon | React.ElementType;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen, onClose, title, subtitle, description, icon, maxWidth, size = "lg", children,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape" && isOpen) onClose(); };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const widthKey = maxWidth || size;
  const maxWidthClass = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-2xl",
    xl: "max-w-3xl",
    "2xl": "max-w-4xl",
    "3xl": "max-w-5xl",
    "4xl": "max-w-6xl",
  }[widthKey] || "max-w-2xl";

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComp = icon as React.ElementType;
    return <IconComp className="size-5 text-brand-500" />;
  };

  const subText = description || subtitle;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md dark:bg-black/60 p-3 sm:p-5 md:p-6 animate-in fade-in duration-150">
      <div className="absolute inset-0 w-full h-full" onClick={onClose} />
      <div className={`relative z-10 w-full ${maxWidthClass} max-h-[90vh] flex flex-col rounded-2xl border border-gray-200 bg-white shadow-theme-xl dark:border-gray-800 dark:bg-gray-900 transition-all`}>
        <div className="flex items-center justify-between border-b border-gray-100 p-4 sm:px-6 sm:py-4 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            {icon && <div className="shrink-0">{renderIcon()}</div>}
            <div className="flex flex-col">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">{title}</h3>
              {subText && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subText}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="size-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white transition-colors">
            <X className="size-4.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
};
