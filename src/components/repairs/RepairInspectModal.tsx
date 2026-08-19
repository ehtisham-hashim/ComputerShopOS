import React from "react";
import { Wrench, Printer } from "lucide-react";
import { RepairTicketRecord, RepairPartUsed } from "../../db/schema";
import { Modal } from "../ui/Modal";

interface RepairInspectModalProps {
  ticket: RepairTicketRecord | null;
  onClose: () => void;
}

export const RepairInspectModal: React.FC<RepairInspectModalProps> = ({ ticket, onClose }) => {
  if (!ticket) return null;

  let parts: RepairPartUsed[] = [];
  try {
    parts = JSON.parse(ticket.partsUsed || "[]");
  } catch {}

  const partsTotal = parts.reduce((acc, p) => acc + (p.cost || 0), 0);

  return (
    <Modal isOpen={Boolean(ticket)} onClose={onClose} title={`Ticket ${ticket.ticketNo}`} description="Hardware service job overview and invoice sheet" icon={<Wrench className="size-5 text-brand-500" />} size="lg">
      <div className="space-y-4 text-xs">
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
          <div><span className="font-bold text-sm text-gray-900 dark:text-white block">{ticket.customerName}</span><span className="text-gray-500 font-mono">{ticket.customerPhone}</span></div>
          <span className="px-2.5 py-1 rounded-full font-bold bg-brand-50 text-brand-600 dark:bg-brand-500/15">{ticket.status}</span>
        </div>

        <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1">
          <div className="flex justify-between text-gray-500"><span>Device Model:</span><span className="font-bold text-gray-800 dark:text-gray-200">{ticket.device}</span></div>
          <div className="flex justify-between text-gray-500"><span>Reported Issue:</span><span className="font-medium text-gray-700 dark:text-gray-300">{ticket.reportedIssue}</span></div>
        </div>

        <div>
          <span className="font-bold text-gray-700 dark:text-gray-300 block mb-1.5">Parts & Components ({parts.length})</span>
          {parts.length === 0 ? (
            <p className="text-gray-400 py-2">No replacement parts logged.</p>
          ) : (
            <div className="space-y-1">
              {parts.map((p, idx) => (
                <div key={idx} className="flex justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/40">
                  <span>{p.name}</span>
                  <span className="font-mono font-bold">PKR {Number(p.cost || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 rounded-xl bg-brand-50/60 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 space-y-1 font-medium">
          <div className="flex justify-between text-gray-600 dark:text-gray-300"><span>Parts Subtotal:</span><span>PKR {partsTotal.toLocaleString()}</span></div>
          <div className="flex justify-between text-gray-600 dark:text-gray-300"><span>Labor Fee:</span><span>PKR {Number(ticket.laborCost || 0).toLocaleString()}</span></div>
          <div className="flex justify-between font-bold text-sm text-brand-700 dark:text-brand-300 pt-1 border-t border-brand-200 dark:border-brand-500/30">
            <span>Total Job Cost:</span>
            <span>PKR {Number(ticket.finalCost || ticket.estimatedCost || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button onClick={onClose} className="tail-btn-secondary">Close</button>
          <button onClick={() => window.print()} className="tail-btn-primary"><Printer className="size-4" /><span>Print RMA Sheet</span></button>
        </div>
      </div>
    </Modal>
  );
};
