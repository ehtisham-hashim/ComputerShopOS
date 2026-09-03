import React, { useState, useEffect } from "react";
import { Building2, Plus } from "lucide-react";
import { PayableParty, PayableLedgerEntry, PayableTxType } from "../db/schema";
import {
  getPayableParties,
  getPartyLedger,
  getPayablesSummary,
} from "../db/payablesService";
import { PageHeader } from "../components/ui/PageHeader";
import { PayablesStats } from "../components/payables/PayablesStats";
import { SupplierListPane } from "../components/payables/SupplierListPane";
import { SupplierLedgerPane } from "../components/payables/SupplierLedgerPane";
import { AddSupplierModal } from "../components/payables/AddSupplierModal";
import { AddTransactionModal } from "../components/payables/AddTransactionModal";

export const PayablesPage: React.FC = () => {
  const [parties, setParties] = useState<PayableParty[]>([]);
  const [selectedParty, setSelectedParty] = useState<PayableParty | null>(null);
  const [ledger, setLedger] = useState<PayableLedgerEntry[]>([]);
  const [summary, setSummary] = useState({
    totalOutstanding: 0,
    activeSuppliersCount: 0,
    totalPurchases: 0,
    totalPaid: 0,
  });

  const [isLoadingParties, setIsLoadingParties] = useState(true);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);

  // Modals
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [addTxDefaultType, setAddTxDefaultType] = useState<PayableTxType>("PURCHASE");

  const fetchPartiesAndSummary = async (showLoader = false) => {
    if (showLoader) setIsLoadingParties(true);
    try {
      const [allParties, sum] = await Promise.all([
        getPayableParties(),
        getPayablesSummary(),
      ]);
      setParties(allParties);
      setSummary(sum);

      // Keep selected party updated if already selected
      if (selectedParty) {
        const updated = allParties.find((p) => p.id === selectedParty.id);
        if (updated) setSelectedParty(updated);
      } else if (allParties.length > 0) {
        // Default select first party with balance or first party
        const firstOwed = allParties.find((p) => p.currentBalance > 0) || allParties[0];
        setSelectedParty(firstOwed);
      }
    } catch (err) {
      console.error("Error loading payables parties:", err);
    } finally {
      setIsLoadingParties(false);
    }
  };

  const fetchLedger = async (partyId: number) => {
    setIsLoadingLedger(true);
    try {
      const data = await getPartyLedger(partyId);
      setLedger(data);
    } catch (err) {
      console.error("Error loading party ledger:", err);
    } finally {
      setIsLoadingLedger(false);
    }
  };

  useEffect(() => {
    fetchPartiesAndSummary(true);
  }, []);

  useEffect(() => {
    if (selectedParty) {
      fetchLedger(selectedParty.id);
    } else {
      setLedger([]);
    }
  }, [selectedParty?.id]);

  const handleSelectParty = (p: PayableParty) => {
    setSelectedParty(p);
  };

  const handleOpenAddTx = (type: PayableTxType) => {
    setAddTxDefaultType(type);
    setIsAddTxOpen(true);
  };

  const handleRefreshAll = async () => {
    await fetchPartiesAndSummary();
    if (selectedParty) {
      await fetchLedger(selectedParty.id);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts Payable & Supplier Ledgers"
        subtitle="Manage vendor bills, purchases, payments, and running account ledgers"
        icon={Building2}
      >
        <button
          onClick={() => setIsAddSupplierOpen(true)}
          className="tail-btn-primary text-xs flex items-center gap-1.5"
        >
          <Plus className="size-4" />
          <span>New Supplier</span>
        </button>
      </PageHeader>

      <PayablesStats
        totalOutstanding={summary.totalOutstanding}
        totalPurchases={summary.totalPurchases}
        totalPaid={summary.totalPaid}
        activeSuppliersCount={summary.activeSuppliersCount}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane - Supplier Directory */}
        <div className="lg:col-span-4">
          <SupplierListPane
            parties={parties}
            selectedPartyId={selectedParty?.id || null}
            isLoading={isLoadingParties}
            onSelectParty={handleSelectParty}
            onOpenAddSupplier={() => setIsAddSupplierOpen(true)}
          />
        </div>

        {/* Right Pane - Selected Supplier Running Ledger */}
        <div className="lg:col-span-8">
          <SupplierLedgerPane
            party={selectedParty}
            ledger={ledger}
            isLoading={isLoadingLedger}
            onOpenAddTransaction={handleOpenAddTx}
            onRefresh={handleRefreshAll}
            onPartyDeleted={() => {
              setSelectedParty(null);
              fetchPartiesAndSummary();
            }}
          />
        </div>
      </div>

      <AddSupplierModal
        isOpen={isAddSupplierOpen}
        onClose={() => setIsAddSupplierOpen(false)}
        onSuccess={async (newParty) => {
          await fetchPartiesAndSummary();
          setSelectedParty(newParty);
        }}
      />

      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        party={selectedParty}
        defaultType={addTxDefaultType}
        onSuccess={handleRefreshAll}
      />
    </div>
  );
};
