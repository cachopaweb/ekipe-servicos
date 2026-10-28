"use client";

import { useEffect, useRef, useCallback } from "react";
import { AlertTriangle, CheckCircle, Info, AlertCircle } from "lucide-react";

interface ModalConfirmacaoProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: "danger" | "success" | "warning" | "info";
  confirmText?: string;
  cancelText?: string;
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
      iconColor: "text-amber-600",
      bgIcon: "bg-amber-50",
      btnConfirm: "bg-amber-500 hover:bg-amber-600 text-white",
      borderColor: "border-amber-200",
    },
    info: {
      Icon: Info,
      iconColor: "text-blue-600",
      bgIcon: "bg-blue-50",
      btnConfirm: "bg-blue-600 hover:bg-blue-700 text-white",
      borderColor: "border-blue-200",
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 outline-none"
      onKeyDown={handleKeyDown}
    >
      <div
        className={`bg-white w-full max-w-sm rounded-xl border ${current.borderColor} overflow-hidden`}
      >
        <div className="p-6 flex flex-col items-center text-center">
          <div
            className={`h-14 w-14 rounded-full flex items-center justify-center ${current.bgIcon} mb-3`}
          >
            <Icon className={`w-7 h-7 ${current.iconColor}`} />
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600 mb-6">{message}</p>

          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
            >
              {cancelText}
            </button>
            <button
              ref={confirmButtonRef}
              type="button"
              onClick={onConfirm}
              className={`w-full py-2.5 px-4 text-sm font-semibold rounded-md transition ${current.btnConfirm}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
