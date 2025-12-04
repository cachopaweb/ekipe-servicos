"use client"

import { useCallback, useEffect, useRef } from "react";

interface ModalAtalhosProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalAtalhos({ isOpen, onClose }: ModalAtalhosProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => containerRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-stone-800 text-stone-300 rounded-xl p-5 text-xs font-mono shadow-2xl border border-stone-600 w-96 h-96 flex flex-col overflow-hidden relative">
        <div className="flex justify-between items-center border-b border-stone-600 pb-3 mb-3 shrink-0">
          <h3 className="text-stone-100 font-bold uppercase text-sm tracking-wider flex items-center gap-2">
            <i className="fas fa-keyboard"></i> Atalhos
          </h3>
          <button onClick={onClose} className="hover:bg-stone-700 rounded-full w-6 h-6 flex items-center justify-center transition">
            ✕
          </button>
        </div>

        <ul className="space-y-1.5">
          <li className="flex justify-between items-center group hover:text-white">
            <span>Selecionar Cliente</span>
            <span className="bg-stone-700 px-1.5 py-0.5 rounded text-white font-bold group-hover:bg-amber-500">C</span>
          </li>
          <li className="flex justify-between items-center group hover:text-white">
            <span>Buscar Produto</span>
            <span className="bg-stone-700 px-1.5 py-0.5 rounded text-white font-bold group-hover:bg-amber-500">P</span>
          </li>
          <li className="flex justify-between items-center group hover:text-white">
            <span>Focar Código</span>
            <span className="bg-stone-700 px-1.5 py-0.5 rounded text-white font-bold group-hover:bg-amber-500">F7</span>
          </li>
          <li className="flex justify-between items-center group hover:text-white">
            <span>Imprimir Orçamento</span>
            <span className="bg-stone-700 px-1.5 py-0.5 rounded text-white font-bold group-hover:bg-amber-500">I</span>
          </li>
          <li className="flex justify-between items-center group hover:text-white">
            <span>Reimprimir Venda</span>
            <span className="bg-stone-700 px-1.5 py-0.5 rounded text-white font-bold group-hover:bg-amber-500">F10</span>
          </li>
          <li className="flex justify-between items-center group hover:text-white">
            <span>Ajuste Estoque</span>
            <span className="bg-stone-700 px-1.5 py-0.5 rounded text-white font-bold group-hover:bg-amber-500">F12</span>
          </li>
          <li className="flex justify-between items-center text-red-300 hover:text-red-200">
            <span>Cancelar Venda</span>
            <span className="bg-red-900/50 px-1.5 py-0.5 rounded text-white font-bold">ESC</span>
          </li>
        </ul>
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-stone-800 to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
}