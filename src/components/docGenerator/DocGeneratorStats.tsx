import React from "react";
import { FileText, DollarSign, Calendar, Sparkles } from "lucide-react";
import { DocumentRecord, BrandType } from "../../db/schema";
import { StatCard } from "../ui/StatCard";
import { BRAND_CONFIGS } from "../../services/docx/brandConfigs";

interface DocGeneratorStatsProps {
  documents: DocumentRecord[];
  activeBrand: BrandType;
}

export const DocGeneratorStats: React.FC<DocGeneratorStatsProps> = ({
  documents,
  activeBrand,
}) => {
  const brandDocs = documents.filter((d) => d.brand === activeBrand);
  const brandTotalAmount = brandDocs.reduce((acc, d) => acc + d.totalAmount, 0);
  const activeBrandConfig = BRAND_CONFIGS[activeBrand];

  const latestDoc = brandDocs.length > 0 ? brandDocs[0] : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Brand Invoices Generated"
        value={brandDocs.length}
        icon={FileText}
        description={"Total documents for " + activeBrandConfig.displayName}
      />
      <StatCard
        title="Total Brand Volume"
        value={"PKR " + brandTotalAmount.toLocaleString()}
        icon={DollarSign}
        description="Combined value of generated bills"
      />
      <StatCard
        title="All Brands Combined"
        value={documents.length}
        icon={Sparkles}
        description="Across all 3 brand letterheads"
      />
      <StatCard
        title="Latest Document"
        value={latestDoc ? latestDoc.refNo : "None"}
        icon={Calendar}
        description={
          latestDoc
            ? latestDoc.date + " - " + latestDoc.customerName.slice(0, 16)
            : "No history yet"
        }
      />
    </div>
  );
};
