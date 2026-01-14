"use client";

import { useEffect, useRef, useCallback } from "react";

interface ModalConfirmacaoProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'success' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
}

export default function ModalConfirmacao({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar'
}: ModalConfirmacaoProps) {

  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Configuração visual baseada no tipo
  const styles = {
    danger: {
      icon: "fa-triangle-exclamation",
      iconColor: "text-red-500",
      bgIcon: "bg-red-100",
      btnConfirm: "bg-red-600 hover:bg-red-700",
      border: "border-red-200"
    },
    success: {
      icon: "fa-check-circle",
      iconColor: "text-green-500",
      bgIcon: "bg-green-100",
      btnConfirm: "bg-green-600 hover:bg-green-700",
      border: "border-green-200"
    },
    warning: {
      icon: "fa-circle-exclamation",
      iconColor: "text-amber-500",
      bgIcon: "bg-amber-100",
      btnConfirm: "bg-amber-500 hover:bg-amber-600",
      border: "border-amber-200"
    },
    info: {
      icon: "fa-circle-info",
      iconColor: "text-blue-500",
      bgIcon: "bg-blue-100",
      btnConfirm: "bg-blue-600 hover:bg-blue-700",
      border: "border-blue-200"
    }
  };

  const currentStyle = styles[type];

  // Atalhos de Teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      onConfirm();
    }
  }, [onClose, onConfirm]);

  // Foco automático no botão de confirmar para agilidade
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => confirmButtonRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in outline-none"
      onKeyDown={handleKeyDown}
    >
      <div className={`bg-white w-full max-w-sm flex flex-col rounded-xl shadow-2xl overflow-hidden font-sans border-2 ${currentStyle.border} transform transition-all scale-100`}>

        {/* Corpo do Modal */}
        <div className="p-6 flex flex-col items-center text-center gap-4">

          {/* Ícone Animado */}
          <div className={`h-16 w-16 rounded-full flex items-center justify-center ${currentStyle.bgIcon} mb-2`}>
            <i className={`fa-solid ${currentStyle.icon} text-3xl ${currentStyle.iconColor}`}></i>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight leading-none">
              {title}
            </h3>
            <p className="text-sm text-gray-500 font-medium">
              {message}
            </p>
          </div>
        </div>

        {/* Footer com Ações */}
        <div className="bg-stone-50 px-4 py-3 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold uppercase py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-xs shadow-sm"
          >
            {cancelText} (ESC)
          </button>

          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className={`flex-1 text-white font-bold uppercase py-2.5 rounded-lg shadow-md transition-transform active:scale-95 text-xs flex items-center justify-center gap-2 ${currentStyle.btnConfirm}`}
          >
            <i className="fa-solid fa-check"></i>
            {confirmText} (ENTER)
          </button>
        </div>

      </div>
    </div>
  );
}