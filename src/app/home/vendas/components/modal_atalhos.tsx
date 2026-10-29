"use client";

import { useCallback, useEffect, useRef } from "react";
import { X, Keyboard } from "lucide-react";

interface ModalAtalhosProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalAtalhos({ isOpen, onClose }: ModalAtalhosProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => containerRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const atalhos = [
    { label: "Selecionar Cliente", key: "C", variant: "default" },
    { label: "Buscar Produto no Catálogo", key: "P", variant: "default" },
    { label: "Imprimir Orçamento", key: "I", variant: "default" },
    { label: "Reimprimir Venda", key: "R", variant: "default" },
    { label: "Salvar Venda como Ordem", key: "S", variant: "default" },
    { label: "Buscar Venda Salva", key: "B", variant: "default" },
    { label: "Focar Código de Barras", key: "F7", variant: "default" },
    { label: "Finalizar Venda", key: "F", variant: "success" },
    { label: "Cancelar Venda Atual", key: "ESC", variant: "danger" },
  ];

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in outline-none"
      onKeyDown={handleKeyDown}
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200/80 overflow-hidden font-sans flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/80 bg-stone-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-5 bg-amber-500 rounded-full"></span>
            <h3 className="text-base font-bold text-stone-800 tracking-tight flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-amber-600" />
              <span>Atalhos do Sistema</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
            title="Fechar (ESC)"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body com a lista de atalhos */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[70vh]">
          <ul className="divide-y divide-stone-100">
            {atalhos.map((item) => {
              let keycapStyle = "bg-stone-100 text-stone-800 border-stone-300";
              let labelStyle = "text-stone-700 font-medium";

              if (item.variant === "success") {
                keycapStyle = "bg-emerald-50 text-emerald-700 border-emerald-300 font-extrabold";
                labelStyle = "text-emerald-900 font-semibold";
              } else if (item.variant === "danger") {
                keycapStyle = "bg-rose-50 text-rose-700 border-rose-300 font-extrabold";
                labelStyle = "text-rose-800 font-semibold";
              }

              return (
                <li
                  key={item.label}
                  className="flex items-center justify-between py-2.5 px-2 hover:bg-amber-50/40 rounded-lg transition-colors"
                >
                  <span className={`text-sm ${labelStyle}`}>{item.label}</span>
                  <kbd
                    className={`px-2.5 py-1 min-w-[32px] text-center font-mono text-xs font-bold border rounded-md shadow-xs select-none ${keycapStyle}`}
                  >
                    {item.key}
                  </kbd>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-stone-200/80 bg-stone-50/90 shrink-0 text-xs text-stone-500">
          <span>
            Pressione <kbd className="px-1.5 py-0.5 font-mono text-[11px] font-semibold bg-white border border-stone-300 rounded shadow-xs text-stone-700">ESC</kbd> para fechar
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg shadow-xs transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
