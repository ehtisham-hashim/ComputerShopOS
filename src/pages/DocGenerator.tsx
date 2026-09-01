import React, { useState, useEffect } from "react";
import { FileText, Plus } from "lucide-react";
import { DocumentRecord, BrandType, InventoryItem, Customer } from "../db/schema";
import { getDocuments, deleteDocument } from "../db/documentsService";
import { getCustomers } from "../db/customerService";
import { PageHeader } from "../components/ui/PageHeader";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { DocGeneratorStats } from "../components/docGenerator/DocGeneratorStats";
import { DocGeneratorTabs } from "../components/docGenerator/DocGeneratorTabs";
import { DocHistoryTable } from "../components/docGenerator/DocHistoryTable";
import { CreateDocModal } from "../components/docGenerator/CreateDocModal";
import { DocInspectModal } from "../components/docGenerator/DocInspectModal";

interface DocGeneratorPageProps {
  items: InventoryItem[];
}

export const DocGeneratorPage: React.FC<DocGeneratorPageProps> = ({ items }) => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeBrand, setActiveBrand] = useState<BrandType>("tasnim_computers");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [inspectDoc, setInspectDoc] = useState<DocumentRecord | null>(null);
  const [duplicateDoc, setDuplicateDoc] = useState<DocumentRecord | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDocuments = async (showLoader = false) => {
    try {
      if (showLoader) setIsLoading(true);
      const docs = await getDocuments();
      setDocuments(docs);
      const custs = await getCustomers();
      setCustomers(custs);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (deleteTargetId === null) return;
    setIsDeleting(true);
    try {
      await deleteDocument(deleteTargetId);
      await fetchDocuments();
      setDeleteTargetId(null);
    } catch (err) {
      console.error("Failed to delete document:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenDuplicate = (doc: DocumentRecord) => {
    setDuplicateDoc(doc);
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setDuplicateDoc(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Document Generator"
        subtitle="Generate and print official DOCX bills, invoices, and quotations with verified store letterheads"
        icon={FileText}
      >
        <button
          type="button"
          onClick={() => {
            setDuplicateDoc(null);
            setIsCreateModalOpen(true);
          }}
          className="tail-btn-primary text-xs"
        >
          <Plus className="size-4" />
          <span>New Document</span>
        </button>
      </PageHeader>

      {/* Brand Tabs */}
      <DocGeneratorTabs
        activeBrand={activeBrand}
        onSelectBrand={setActiveBrand}
        documents={documents}
      />

      {/* Summary Metrics */}
      <DocGeneratorStats
        documents={documents}
        activeBrand={activeBrand}
      />

      {/* History Table */}
      <DocHistoryTable
        documents={documents}
        activeBrand={activeBrand}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isLoading={isLoading}
        onInspectDocument={setInspectDoc}
        onDuplicateDocument={handleOpenDuplicate}
        onDeleteDocument={(id) => setDeleteTargetId(id)}
        onCreateNew={() => {
          setDuplicateDoc(null);
          setIsCreateModalOpen(true);
        }}
      />

      {/* Modals */}
      <CreateDocModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSuccess={async () => {
          await fetchDocuments();
        }}
        defaultBrand={activeBrand}
        customers={customers}
        inventoryItems={items}
        duplicateFrom={duplicateDoc}
      />

      <DocInspectModal
        document={inspectDoc}
        onClose={() => setInspectDoc(null)}
      />

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Generated Document"
        message="Are you sure you want to delete this document from history? This action cannot be undone."
        confirmText="Delete Document"
        isLoading={isDeleting}
      />
    </div>
  );
};
