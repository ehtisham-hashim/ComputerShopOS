import React from "react";
import { Sparkles } from "lucide-react";

export const LoginBrandHeader: React.FC = () => {
  return (
    <div className="text-center space-y-2">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-theme-md">
        <Sparkles className="size-7" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        ComputerShop<span className="text-brand-500">OS</span>
      </h1>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Hardware Store Management & POS System
      </p>
    </div>
  );
};
