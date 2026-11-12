"use client";

import { useEffect, useRef, useCallback } from "react";
import { AlertTriangle, CheckCircle, Info, AlertCircle, Loader2 } from "lucide-react";

interface ModalConfirmacaoProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: "danger" | "success" | "warning" | "info";
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export default function ModalConfirmacao({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "info",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isLoading = false,
}: ModalConfirmacaoProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const config = {
    danger: {
      Icon: AlertTriangle,
      iconColor: "text-red-600",
      bgIcon: "bg-red-50",
      btnConfirm: "bg-red-600 hover:bg-red-700 text-white",
      borderColor: "border-red-200",
    },
    success: {
      Icon: CheckCircle,
      iconColor: "text-emerald-600",
      bgIcon: "bg-emerald-50",
      btnConfirm: "bg-emerald-600 hover:bg-emerald-700 text-white",
      borderColor: "border-emerald-200",
    },
    warning: {
      Icon: AlertCircle,
      iconColor: "text-brand-goldInk",
      bgIcon: "bg-brand-goldSoft",
      btnConfirm: "bg-brand hover:bg-brand-hover text-white",
      borderColor: "border-ek-border",
    },
    info: {
      Icon: Info,
      iconColor: "text-brand",
      bgIcon: "bg-brand-soft",
      btnConfirm: "bg-brand hover:bg-brand-hover text-white",
      borderColor: "border-brand-border",
    },
  };

  const current = config[type];
  const { Icon } = current;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Enter") {
        e.preventDefault();
        onConfirm();
      }
    },
    [onClose, onConfirm]
  );

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => confirmButtonRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 outline-none"
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-white w-full max-w-sm rounded-[8px] border border-ek-border shadow-xl overflow-hidden font-sans"
      >
        <div className="p-5 flex flex-col items-start text-left">
          <div className="flex items-start gap-3.5 w-full mb-5">
            <div
              className={`h-10 w-10 rounded-[6px] shrink-0 flex items-center justify-center ${current.bgIcon}`}
            >
              <Icon className={`w-5 h-5 ${current.iconColor}`} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-ek-text leading-snug">{title}</h3>
              <p className="text-sm text-ek-muted mt-1 leading-relaxed">{message}</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 w-full pt-3.5 border-t border-ek-rule">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="ek-btn-secondary flex-1 sm:flex-none"
            >
              {cancelText}
            </button>
            <button
              ref={confirmButtonRef}
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`inline-flex items-center justify-center gap-2 h-9 px-4 rounded-[6px] text-sm font-medium transition-colors flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed ${current.btnConfirm}`}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
