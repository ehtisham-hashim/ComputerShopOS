import React, { useState } from "react";
import { UserPlus } from "lucide-react";
import { Modal } from "../ui/Modal";
import { addCustomer } from "../../db/customerService";

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim() || !phone.trim()) {
      setFormError("Name and phone number are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      await addCustomer({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      await onSuccess();
      onClose();
    } catch (err: any) {
      setFormError(err.message || "Failed to save customer. Phone may already exist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register New Customer" description="Add customer contact to SQLite CRM" icon={<UserPlus className="size-5 text-brand-500" />} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && <div className="rounded-xl border border-error-200 bg-error-50 p-3 text-xs font-semibold text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">{formError}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Full Name *</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex Chen" className="tail-input" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Phone Number *</label>
            <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 1234567" className="tail-input" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@example.com" className="tail-input" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Physical / Delivery Address</label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address, city" className="tail-input" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Internal Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Preferences, specs, notes..." rows={2} className="tail-input" />
        </div>
        <div className="flex justify-end gap-2.5 pt-2">
          <button type="button" onClick={onClose} className="tail-btn-secondary">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="tail-btn-primary">{isSubmitting ? "Saving..." : "Save Customer"}</button>
        </div>
      </form>
    </Modal>
  );
};
