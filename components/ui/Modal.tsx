"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  variant?: "default" | "danger" | "warning";
  showCancel?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  variant = "default",
  showCancel = true,
}: ModalProps) {
  // Fechar com ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    // Prevenir scroll do body quando modal está aberto
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const variantStyles = {
    default: "bg-primary",
    danger: "bg-red-500 hover:bg-red-600",
    warning: "bg-orange-500 hover:bg-orange-600",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            style={{ touchAction: "none" }}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-blush/20"
              style={{ touchAction: "auto" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-blush/20">
                <h3 className="text-xl font-display font-semibold text-foreground">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-background-alt transition-colors"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5 text-foreground/60" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
                  {message}
                </p>
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-6 border-t border-blush/20">
                {showCancel && (
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1"
                  >
                    {cancelText}
                  </Button>
                )}
                <Button
                  onClick={handleConfirm}
                  className={`flex-1 ${variantStyles[variant]}`}
                >
                  {confirmText}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

