import React, { useState, useEffect } from "react";
import { Users, Plus } from "lucide-react";
import { Customer, SaleRecord, RepairTicketRecord } from "../db/schema";
import { getCustomers, deleteCustomer, getCustomerHistory } from "../db/customerService";
import { PageHeader } from "../components/ui/PageHeader";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { CustomerStats } from "../components/customers/CustomerStats";
import { CustomerTable } from "../components/customers/CustomerTable";
import { AddCustomerModal } from "../components/customers/AddCustomerModal";
import { CustomerHistoryModal } from "../components/customers/CustomerHistoryModal";

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSales, setCustomerSales] = useState<SaleRecord[]>([]);
  const [customerRepairs, setCustomerRepairs] = useState<RepairTicketRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCustomers = async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(true); }, []);

  const handleConfirmDelete = async () => {
    if (deleteTargetId === null) return;
    setIsDeleting(true);
    try {
      await deleteCustomer(deleteTargetId);
      await fetchCustomers();
      setDeleteTargetId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewHistory = async (cust: Customer) => {
    setSelectedCustomer(cust);
    setLoadingHistory(true);
    try {
      const hist = await getCustomerHistory(cust.id);
      setCustomerSales(hist.sales);
      setCustomerRepairs(hist.repairs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Customer CRM & Profiles" subtitle="Manage contact directory and transaction history" icon={Users}>
        <button onClick={() => setIsAddModalOpen(true)} className="tail-btn-primary text-xs"><Plus className="size-4" /><span>New Customer</span></button>
      </PageHeader>
      <CustomerStats customers={customers} />
      <CustomerTable
        customers={customers} searchQuery={searchQuery} onSearchChange={setSearchQuery}
        isLoading={isLoading} onViewHistory={handleViewHistory} onDeleteCustomer={async (id) => setDeleteTargetId(id)}
      />
      <AddCustomerModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={() => fetchCustomers(false)} />
      <CustomerHistoryModal
        customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} loading={loadingHistory}
        sales={customerSales} repairs={customerRepairs} totalSpent={customerSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0)}
      />
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Customer Profile"
        message="Are you sure you want to delete this customer record from CRM?"
        confirmText="Delete Customer"
        isLoading={isDeleting}
      />
    </div>
  );
};
