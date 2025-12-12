"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { VendaModel } from "@/app/models/venda_model";
import { VenEstModel } from "@/app/models/ven_est_model"; // Importe o modelo dos itens se existir, ou defina abaixo

interface ModalImprimirVendaProps {
  isOpen: boolean;
  onClose: () => void;
  venda: VendaModel | null;
  desconto: number;
  funcionario: string;
  cliente: string;
  itens: VenEstModel[] | null;
}

export default function ModalImprimirVenda({ isOpen, onClose, venda, desconto, funcionario, cliente, itens }: ModalImprimirVendaProps) {
  const [observacoes, setObservacoes] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const obsRef = useRef<HTMLTextAreaElement>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handlePrint = () => {
    if (!venda) return;

    // Gera as linhas da tabela de itens
    const itensHtml = venda.itensVenEst && venda.itensVenEst.length > 0
      ? venda.itensVenEst.map((item, idx) => {
        const unitario = item.VE_VALOR / item.VE_QUANTIDADE;
        return `
            <tr>
                <td>${String(idx + 1).padStart(2, '0')}</td>
                <td>${item.VE_NOME ? item.VE_NOME.substring(0, 18) : 'ITEM ' + item.VE_PRO}</td>
                <td class="right">${item.VE_QUANTIDADE}</td>
                <td class="right">${unitario.toFixed(2)}</td>
                <td class="right">${item.VE_VALOR.toFixed(2)}</td>
            </tr>
          `;
      }).join('')
      : '<tr><td colspan="5" class="center">Lista de itens não disponível</td></tr>';

    // HTML para Bobina 80mm
    const cupomHTML = `
            <html>
            <head>
                <title>Reimprimir Venda ${venda.VEN_CODIGO}</title>
                <style>
                    @page { size: 80mm auto; margin: 0; }
                    body { font-family: 'Courier New', monospace; width: 72mm; margin: 0 auto; padding: 5px; font-size: 12px; color: #000; }
                    .center { text-align: center; }
                    .bold { font-weight: bold; }
                    .row { display: flex; justify-content: space-between; }
                    .divider { border-top: 1px dashed #000; margin: 5px 0; }
                    .logo { width: 50%; margin: 0 auto 10px auto; display: block; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 5px; }
                    th { border-bottom: 1px solid #000; padding-bottom: 2px; }
                    th, td { text-align: left; vertical-align: top; }
                    .right { text-align: right; }
                </style>
            </head>
            <body>
                <img src="/logo-mono.png" alt="Logo" class="logo" />
                
                <div class="center bold" style="font-size: 14px;">EKIPE SERVIÇOS</div>
                <div class="center">Reimpressão de Conferência</div>
                
                <div class="divider"></div>
                
                <div class="center bold" style="font-size: 16px;">VENDA Nº: ${venda.VEN_CODIGO}</div>
                <div class="center">Data: ${new Date(venda.VEN_DATA).toLocaleDateString()} - ${venda.VEN_HORA}</div>
                
                <div class="divider"></div>
                
                <div><span class="bold">CLIENTE:</span> ${venda.VEN_CLI} - ${cliente || 'CONSUMIDOR'}</div>
                <div><span class="bold">VENDEDOR:</span> ${venda.VEN_VENDEDOR} - ${funcionario || 'ADM'}</div>
                ${venda.VEN_NF ? `<div><span class="bold">NOTA FISCAL:</span> ${venda.VEN_NF}</div>` : ''}
                
                <div class="divider"></div>
                
                <table>
                    <thead>
                        <tr>
                            <th width="5%">#</th>
                            <th width="45%">DESCRIÇÃO</th>
                            <th width="10%" class="right">QTD</th>
                            <th width="20%" class="right">UN</th>
                            <th width="20%" class="right">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itensHtml}
                    </tbody>
                </table>
                
                <div class="divider"></div>
                
                <div class="center bold">RESUMO FINANCEIRO</div>
                
                <div class="row" style="margin-top: 5px;">
                    <span>TOTAL BRUTO:</span>
                    <span>${formatCurrency(venda.VEN_VALOR + desconto)}</span>
                </div>
                
                ${desconto > 0 ? `
                <div class="row">
                    <span>DESCONTO:</span>
                    <span>${formatCurrency(desconto)}</span>
                </div>
                ` : ''}
                
                <div class="divider"></div>
                
                <div class="row bold" style="font-size: 16px;">
                    <span>TOTAL LÍQUIDO:</span>
                    <span>${formatCurrency(venda.VEN_VALOR)}</span>
                </div>
                
                <div class="divider"></div>
                
                ${observacoes ? `
                <div><span class="bold">OBSERVAÇÕES:</span><br/>${observacoes}</div>
                <div class="divider"></div>
                ` : ''}
                
                <div class="center" style="font-size: 10px; margin-top: 10px;">
                    *** DOCUMENTO SEM VALOR FISCAL ***
                </div>
                <br/><br/>
            </body>
            </html>
        `;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(cupomHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        onClose();
      }, 500);
    }
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
    if (e.key === 'F8' || e.key === 'Enter') {
      e.preventDefault();
      handlePrint();
    }
  }, [onClose, venda, observacoes]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => obsRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen || !venda) return null;

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in outline-none"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-gray-300 flex flex-col">

        <div className="bg-stone-100 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <i className="fas fa-print"></i> Imprimir Venda #{venda.VEN_CODIGO}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition">✕</button>
        </div>

        <div className="p-6 bg-stone-50 flex flex-col gap-4">
          <div className="bg-white p-4 rounded border border-gray-200 shadow-sm text-center">
            <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Valor Total da Venda</label>
            <div className="text-3xl font-black text-green-600">{formatCurrency(venda.VEN_VALOR)}</div>
            <div className="text-xs text-gray-500 mt-1">{new Date(venda.VEN_DATA).toLocaleDateString()} às {venda.VEN_HORA}</div>
          </div>

          {/* Resumo Visual dos Itens (Apenas informativo no modal) */}
          <div className="bg-white p-3 rounded border border-gray-200 shadow-sm max-h-32 overflow-y-auto">
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1 border-b pb-1">Resumo dos Itens</label>
            {venda.itensVenEst && venda.itensVenEst.length > 0 ? (
              <ul className="text-xs text-gray-600 space-y-1">
                {itens!.map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span className="truncate w-2/3">{item.VE_QUANTIDADE}x {item.VE_NOME}</span>
                    <span>{formatCurrency(item.VE_VALOR)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400 italic text-center py-2">Itens não carregados para visualização</p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Observação para Impressão</label>
            <textarea
              ref={obsRef}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full h-20 border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none resize-none bg-white shadow-inner"
              placeholder="Opcional..."
            />
          </div>
        </div>

        <div className="bg-stone-200 px-4 py-3 border-t border-gray-300 flex justify-between items-center text-xs font-bold text-gray-600 uppercase">
          <div onClick={onClose} className="flex items-center gap-2 cursor-pointer hover:text-red-600 transition">
            <span className="bg-red-200 text-red-700 px-2 py-1 rounded border border-red-300">ESC</span> Voltar
          </div>
          <div onClick={handlePrint} className="flex items-center gap-2 cursor-pointer hover:text-green-700 transition">
            <span>Imprimir</span> <span className="bg-green-200 text-green-800 px-2 py-1 rounded border border-green-300">F8 / ENTER</span>
          </div>
        </div>
      </div>
    </div>
  );
}