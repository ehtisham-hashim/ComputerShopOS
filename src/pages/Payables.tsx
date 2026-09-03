import React, { useState, useEffect } from "react";
import { Building2, Plus, ShoppingBag } from "lucide-react";
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
import { NewPurchaseModal } from "../components/payables/NewPurchaseModal";

interface PayablesPageProps {
  onRefreshInventory?: () => Promise<void>;
}

export const PayablesPage: React.FC<PayablesPageProps> = ({ onRefreshInventory }) => {
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
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
  const [purchasePreSelectedPartyId, setPurchasePreSelectedPartyId] = useState<number | null>(null);

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
    if (onRefreshInventory) {
      await onRefreshInventory();
    }
  };

  return (
    <div className="space-y-6">
      {!selectedParty ? (
        <>
          <PageHeader
            title="Accounts Payable & Supplier Ledgers"
            subtitle="Manage vendor bills, purchases, payments, and running account ledgers"
            icon={Building2}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setPurchasePreSelectedPartyId(null);
                  setIsNewPurchaseOpen(true);
                }}
                className="tail-btn-primary text-xs flex items-center gap-1.5"
              >
                <ShoppingBag className="size-4" />
                <span>+ New Purchase</span>
              </button>
              <button
                onClick={() => setIsAddSupplierOpen(true)}
                className="tail-btn-secondary text-xs flex items-center gap-1.5"
              >
                <Plus className="size-4" />
                <span>New Supplier</span>
              </button>
            </div>
          </PageHeader>

          <PayablesStats
            totalOutstanding={summary.totalOutstanding}
            totalPurchases={summary.totalPurchases}
            totalPaid={summary.totalPaid}
            activeSuppliersCount={summary.activeSuppliersCount}
          />

          <SupplierListPane
            parties={parties}
            selectedPartyId={null}
            isLoading={isLoadingParties}
            onSelectParty={handleSelectParty}
            onOpenAddSupplier={() => setIsAddSupplierOpen(true)}
          />
        </>
      ) : (
        <SupplierLedgerPane
          party={selectedParty}
          ledger={ledger}
          isLoading={isLoadingLedger}
          onBack={() => setSelectedParty(null)}
          onOpenAddTransaction={handleOpenAddTx}
          onOpenNewPurchase={() => {
            setPurchasePreSelectedPartyId(selectedParty.id);
            setIsNewPurchaseOpen(true);
          }}
          onRefresh={handleRefreshAll}
          onPartyDeleted={() => {
            setSelectedParty(null);
            fetchPartiesAndSummary();
          }}
        />
      )}

      <NewPurchaseModal
        isOpen={isNewPurchaseOpen}
        onClose={() => setIsNewPurchaseOpen(false)}
        preSelectedPartyId={purchasePreSelectedPartyId}
        onOpenAddSupplier={() => {
          setIsNewPurchaseOpen(false);
          setIsAddSupplierOpen(true);
        }}
        onSuccess={async () => {
          await handleRefreshAll();
          if (onRefreshInventory) {
            await onRefreshInventory();
          }
        }}
      />

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
