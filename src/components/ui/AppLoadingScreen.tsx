import React from "react";
import { Cpu } from "lucide-react";

interface AppLoadingScreenProps {
  message?: string;
}

export const AppLoadingScreen: React.FC<AppLoadingScreenProps> = ({
  message = "Initializing SQLite database & store services...",
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950 text-white select-none">
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute size-24 rounded-full bg-brand-500/20 blur-xl animate-pulse" />
        <div className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 shadow-xl shadow-brand-500/25 ring-1 ring-white/20">
          <Cpu className="size-8 text-white animate-bounce" />
        </div>
      </div>

      <div className="text-center space-y-2 max-w-sm px-4">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            ComputerShop<span className="text-brand-400">OS</span>
          </h1>
          <span className="rounded-md bg-brand-500/20 border border-brand-500/30 px-1.5 py-0.5 text-[10px] font-bold text-brand-400 tracking-wide uppercase">
            v0.1.0
          </span>
        </div>
        <p className="text-xs text-gray-400 font-medium">
          {message}
        </p>

        <div className="w-48 h-1.5 bg-gray-800 rounded-full overflow-hidden mx-auto mt-4 ring-1 ring-white/10">
          <div className="h-full bg-gradient-to-r from-brand-500 via-indigo-400 to-brand-500 rounded-full animate-[shimmer_1.5s_infinite_linear] w-full" />
        </div>
      </div>
    </div>
  );
};
