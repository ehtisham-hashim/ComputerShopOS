import React from "react";
import { HeaderSearchBar } from "./HeaderSearchBar";
import { HeaderActions } from "./HeaderActions";

interface AppHeaderProps {
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  onOpenQuickSale?: () => void;
  onLockSession?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  searchTerm = "",
  onSearchChange,
  onOpenQuickSale,
  onLockSession,
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md transition-colors sm:px-6 md:px-8 dark:border-gray-800 dark:bg-gray-950/80">
      <HeaderSearchBar searchTerm={searchTerm} onSearchChange={onSearchChange} />
      <HeaderActions onOpenQuickSale={onOpenQuickSale} onLockSession={onLockSession} />
    </header>
  );
};
