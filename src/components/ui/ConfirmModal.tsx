import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Modal } from "./Modal";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  isDangerous = true,
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description="Action confirmation required"
      icon={
        isDangerous ? (
          <Trash2 className="size-5 text-error-500" />
        ) : (
          <AlertTriangle className="size-5 text-warning-500" />
        )
      }
      size="sm"
    >
      <div className="space-y-4 text-xs">
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
          {message}
        </p>

        <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="tail-btn-secondary"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={
              isDangerous
                ? "tail-btn bg-error-600 hover:bg-error-700 text-white font-bold px-4 py-2 rounded-xl shadow-theme-xs transition-colors"
                : "tail-btn-primary"
            }
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
