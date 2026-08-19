import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  maxWidth = "lg",
  children,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
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

  const maxWidthClass = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-2xl",
    xl: "max-w-3xl",
    "2xl": "max-w-4xl",
    "3xl": "max-w-5xl",
  }[maxWidth];

  const modalNode = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md dark:bg-black/60 p-4 sm:p-6 md:p-8 animate-in fade-in duration-150">
      {/* 100% full-screen clickable backdrop */}
      <div className="absolute inset-0 w-full h-full" onClick={onClose} />

      {/* Modal Dialog Card with 10% gap from top & bottom (max-h-[80vh]) and internal Y scrolling */}
      <div
        className={`relative z-10 w-full ${maxWidthClass} max-h-[80vh] flex flex-col rounded-2xl border border-gray-200 bg-white shadow-theme-xl dark:border-gray-800 dark:bg-gray-900 transition-all`}
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-5 md:px-6 md:py-4.5 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            {icon && <div className="shrink-0">{icon}</div>}
            <div className="flex flex-col">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* Scrollable Body on Y-axis */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};
