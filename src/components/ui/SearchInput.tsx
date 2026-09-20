import React from "react";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoFocus?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onKeyDown,
  placeholder = "Search...",
  autoFocus = false,
  size = "sm",
  className = "",
}) => {
  const isSm = size === "sm";

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search
        className={`absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-colors ${
          isSm ? "left-3 size-3.5" : "left-3.5 size-4"
        }`}
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className={`${isSm ? "tail-input-sm pl-8.5 pr-8" : "tail-input pl-10 pr-9"}`}
        autoFocus={autoFocus}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 size-5 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          title="Clear search"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
};
