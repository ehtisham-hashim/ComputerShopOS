import React from "react";
import { BrandType, DocumentRecord } from "../../db/schema";
import { BRAND_CONFIGS } from "../../services/docx/brandConfigs";

interface DocGeneratorTabsProps {
  activeBrand: BrandType;
  onSelectBrand: (brand: BrandType) => void;
  documents: DocumentRecord[];
}

export const DocGeneratorTabs: React.FC<DocGeneratorTabsProps> = ({
  activeBrand,
  onSelectBrand,
  documents,
}) => {
  const brands: BrandType[] = [
    "tasnim_computers",
    "farhan_computers",
    "farhan_enterprises",
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3 dark:border-gray-800">
      {brands.map((brandId) => {
        const config = BRAND_CONFIGS[brandId];
        const isActive = activeBrand === brandId;
        const count = documents.filter((d) => d.brand === brandId).length;

        let activeStyle = "border-red-500 text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400 dark:border-red-500";
        if (brandId === "farhan_computers") {
          activeStyle = "border-blue-600 text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-500";
        } else if (brandId === "farhan_enterprises") {
          activeStyle = "border-amber-600 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-500";
        }

        return (
          <button
            key={brandId}
            onClick={() => onSelectBrand(brandId)}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-150 ${
              isActive
                ? `${activeStyle} shadow-sm`
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <div
              className="size-2.5 rounded-full"
              style={{ backgroundColor: config.primaryColor }}
            />
            <span>{config.displayName}</span>
            <span
              className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                isActive
                  ? "bg-white/80 dark:bg-gray-800 text-gray-900 dark:text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
