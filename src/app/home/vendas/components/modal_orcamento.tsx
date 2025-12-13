"use client"

import { VenEstModel } from "@/app/models/ven_est_model";
import { useState, useEffect, useRef, useCallback } from "react";

interface ModalImprimirOrcamentoProps {
  isOpen: boolean;
  onClose: () => void;
  itens: VenEstModel[];
  total: number;
  cliente: string;
  funcionario: string;
}

export default function ModalImprimirOrcamento({ isOpen, onClose, itens, total, cliente, funcionario }: ModalImprimirOrcamentoProps) {
  const [observacoes, setObservacoes] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const obsRef = useRef<HTMLTextAreaElement>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Função geradora do Cupom (HTML puro para impressão)
  const handlePrint = () => {
    const dataHoje = new Date().toLocaleString('pt-BR');

    // HTML Estruturado para Bobina 80mm
    const cupomHTML = `
            <html>
            <head>
                <title>Imprimir Orçamento</title>
                <style>
                    @page { size: 80mm auto; margin: 0; }
                    body { font-family: 'Courier New', monospace; width: 72mm; margin: 0 auto; padding: 5px; font-size: 12px; color: #000; }
                    .center { text-align: center; }
                    .bold { font-weight: bold; }
                    .row { display: flex; justify-content: space-between; }
                    .divider { border-top: 1px dashed #000; margin: 5px 0; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; }
                    th, td { text-align: left; }
                    .right { text-align: right; }
                </style>
            </head>
            <body>
                <div class="center mb-5">
                    <img src="/logo-mono.png" alt="Logo" style="width: 50%; height: auto; margin-bottom: 10px;" />
                </div>
                <div class="center">Rua Presidente Dutra, 1413 - Centro</div>
                <div class="center">CNPJ: 00.000.000/0001-00</div>
                <div class="center mb-5">Tel: (67) 3467-2074</div>
                
                <div class="divider"></div>
                
                <div class="center bold mt-5">ORÇAMENTO DE VENDA: ${Math.floor(Math.random() * 10000)}</div>
                <div>Data: ${dataHoje}</div>
                <div>Cliente: ${cliente}</div>
                <div>Funcionario: ${funcionario}</div>
                
                <div class="divider"></div>
                
                <table>
                    <thead>
                        <tr>
                            <th>ITEM</th>
                            <th>DESC</th>
                            <th class="right">QTD</th>
                            <th class="right">VL UN</th>
                            <th class="right">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itens.map((item, idx) => `
                            <tr>
                                <td>${String(idx + 1).padStart(2, '0')}</td>
                                <td>${item.VE_NOME.substring(0, 15)}</td>
                                <td class="right">${item.VE_QUANTIDADE}</td>
                                <td class="right">${(item.VE_VALOR / item.VE_QUANTIDADE).toFixed(2)}</td>
                                <td class="right">${item.VE_VALOR.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="divider"></div>
                
                <div class="row bold" style="font-size: 14px;">
                    <span>TOTAL:</span>
                    <span>${formatCurrency(total)}</span>
                </div>
                
                <div class="divider"></div>
                
                ${observacoes ? `
                <div><span class="bold">OBSERVAÇÕES:</span><br/>${observacoes}</div>
                <div class="divider"></div>
                ` : ''}
                
                <div class="center" style="font-size: 10px; margin-top: 10px;">
                    *** NÃO É DOCUMENTO FISCAL ***
                </div>
                <div class="center" style="font-size: 10px;">
                    Sistema Portal.com
                </div>
                <br/><br/>
            </body>
            </html>
        `;

    // Abre uma janela invisível/popup para imprimir
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(cupomHTML);
      printWindow.document.close();
      printWindow.focus();
      // Pequeno delay para carregar estilos antes de imprimir
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        onClose(); // Fecha o modal após mandar imprimir
      }, 500);
    }
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
    if (e.key === 'i' || e.key === 'I') {
      e.preventDefault();
      handlePrint();
    }
  }, [onClose, itens, observacoes]); // Dependências para garantir que os dados estejam atualizados

  useEffect(() => {
    if (isOpen) {
      // Foca na área de texto para permitir digitação imediata
      setTimeout(() => obsRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in outline-none"
      onKeyDown={handleKeyDown}
    >
      {/* Janela do Modal */}
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-gray-300 flex flex-col">

        {/* Header */}
        <div className="bg-stone-100 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <i className="fas fa-print"></i> Imprimir Orçamento
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition">✕</button>
        </div>

        {/* Corpo */}
        <div className="p-6 bg-stone-50 flex flex-col gap-4">

          {/* Valores Totais (Destaque) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded border border-gray-200 shadow-sm">
              <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Valor à Vista</label>
              <div className="text-xl font-black text-green-600">{formatCurrency(total)}</div>
            </div>
            <div className="bg-white p-3 rounded border border-gray-200 shadow-sm">
              <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Valor a Prazo</label>
              <div className="text-xl font-black text-red-600">{formatCurrency(total)}</div>
            </div>
          </div>

          {/* Campo de Observação */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Observações do Orçamento</label>
            <textarea
              ref={obsRef}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full h-32 border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none resize-none bg-white shadow-inner"
              placeholder="Digite aqui instruções de entrega ou detalhes adicionais..."
            />
          </div>

        </div>

        {/* Footer com Atalhos */}
        <div className="bg-stone-200 px-4 py-3 border-t border-gray-300 flex justify-between items-center text-xs font-bold text-gray-600 uppercase">
          <div
            onClick={onClose}
            className="flex items-center gap-2 cursor-pointer hover:text-red-600 transition"
          >
            <span className="bg-red-200 text-red-700 px-2 py-1 rounded border border-red-300">ESC</span>
            Voltar
          </div>

          <div
            onClick={handlePrint}
            className="flex items-center gap-2 cursor-pointer hover:text-green-700 transition"
          >
            <span>Imprimir</span>
            <span className="bg-green-200 text-green-800 px-2 py-1 rounded border border-green-300">I</span>
          </div>
        </div>
      </div>
    </div>
  );
}