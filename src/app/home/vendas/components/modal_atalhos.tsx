"use client";

import { useCallback, useEffect, useRef } from "react";
import { X, Keyboard } from "lucide-react";

interface ModalAtalhosProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalAtalhos({ isOpen, onClose }: ModalAtalhosProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Atalhos de teclado globais quando o modal está aberto (ESC para fechar mesmo se clicou com o mouse)
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, onClose]);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 outline-none"
    >
      <div className="relative w-full max-w-md bg-ek-surface rounded-[8px] border border-ek-border overflow-hidden font-sans flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-ek-border bg-ek-raised shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-1 h-4 bg-brand rounded-full" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-ek-text tracking-[-0.01em] flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-brand" />
              <span>Atalhos do Sistema</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[6px] flex items-center justify-center text-ek-muted hover:text-ek-text hover:bg-ek-active transition-colors"
            title="Fechar (ESC)"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body com a lista de atalhos */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[70vh]">
          <ul className="divide-y divide-ek-rule">
            {atalhos.map((item) => {
              let keycapStyle = "bg-ek-raised text-ek-text border-ek-control";
              let labelStyle = "text-ek-text font-medium";

              if (item.variant === "success") {
                keycapStyle = "bg-brand-soft text-brand border-brand-border font-semibold";
                labelStyle = "text-brand font-semibold";
              } else if (item.variant === "danger") {
                keycapStyle = "bg-rose-50 text-rose-700 border-rose-200 font-semibold";
                labelStyle = "text-rose-700 font-semibold";
              }

              return (
                <li
                  key={item.label}
                  className="flex items-center justify-between py-2.5 px-2.5 hover:bg-ek-raised rounded-[6px] transition-colors"
                >
                  <span className={`text-[13px] ${labelStyle}`}>{item.label}</span>
                  <kbd
                    className={`px-2.5 py-1 min-w-[34px] text-center font-mono text-xs font-semibold border rounded-[6px] select-none ${keycapStyle}`}
                  >
                    {item.key}
                  </kbd>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-ek-border bg-ek-raised shrink-0 text-xs text-ek-muted">
          <span>
            Pressione <kbd className="ek-kbd">ESC</kbd> para fechar
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ek-btn-secondary h-8 px-3 text-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
