import React from "react";
import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  autoFocus = false,
  className = "",
}) => {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="tail-input pl-10"
        autoFocus={autoFocus}
      />
    </div>
  );
};
