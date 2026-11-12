"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Printer, X } from "lucide-react";
import { VendaModel } from "@/app/models/venda_model";
import { VenEstModel } from "@/app/models/ven_est_model";

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
  const [tipoImpressao, setTipoImpressao] = useState<'80mm' | 'a4'>('80mm'); // Estado para controlar o formato

  const containerRef = useRef<HTMLDivElement>(null);
  const obsRef = useRef<HTMLTextAreaElement>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handlePrint = () => {
    if (!venda) return;

    let htmlContent = '';

    // ==========================================================================================
    // LÓGICA PARA BOBINA 80MM
    // ==========================================================================================
    if (tipoImpressao === '80mm') {
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

      htmlContent = `
        <html>
        <head>
            <title>Venda ${venda.VEN_CODIGO}</title>
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
                <tbody>${itensHtml}</tbody>
            </table>
            <div class="divider"></div>
            <div class="row" style="margin-top: 5px;">
                <span>TOTAL BRUTO:</span>
                <span>${formatCurrency(venda.VEN_VALOR + desconto)}</span>
            </div>
            ${desconto > 0 ? `
            <div class="row">
                <span>DESCONTO:</span>
                <span>${formatCurrency(desconto)}</span>
            </div>` : ''}
            <div class="divider"></div>
            <div class="row bold" style="font-size: 16px;">
                <span>TOTAL LÍQUIDO:</span>
                <span>${formatCurrency(venda.VEN_VALOR)}</span>
            </div>
            <div class="divider"></div>
            ${observacoes ? `<div><span class="bold">OBSERVAÇÕES:</span><br/>${observacoes}</div><div class="divider"></div>` : ''}
            <div class="center" style="font-size: 10px; margin-top: 10px;">*** DOCUMENTO SEM VALOR FISCAL ***</div>
        </body>
        </html>`;
    }

    // ==========================================================================================
    // LÓGICA PARA FORMATO A4
    // ==========================================================================================
    else {
      const itensHtml = venda.itensVenEst && venda.itensVenEst.length > 0
        ? venda.itensVenEst.map((item, idx) => {
          const unitario = item.VE_VALOR / item.VE_QUANTIDADE;
          return `
            <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td>${item.VE_PRO}</td>
                <td>${item.VE_NOME || 'PRODUTO SEM NOME'}</td>
                <td style="text-align: right;">${item.VE_QUANTIDADE}</td>
                <td style="text-align: right;">${unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="text-align: right;">${item.VE_VALOR.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          `;
        }).join('')
        : '<tr><td colspan="6" style="text-align: center; padding: 20px;">Lista de itens não disponível</td></tr>';

      htmlContent = `
        <html>
        <head>
            <title>Venda ${venda.VEN_CODIGO} - A4</title>
            <style>
                @page { size: A4; margin: 20mm; }
                body { font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: #333; line-height: 1.4; }
                .header { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .company-info h1 { margin: 0; font-size: 24px; color: #000; }
                .meta-info { text-align: right; }
                .meta-info h2 { margin: 0; font-size: 18px; color: #555; }
                .box { border: 1px solid #ccc; padding: 10px; margin-bottom: 20px; border-radius: 4px; background-color: #f9f9f9; }
                .box-title { font-weight: bold; margin-bottom: 5px; text-transform: uppercase; font-size: 10px; color: #777; }
                .row { display: flex; justify-content: space-between; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th { background-color: #eee; text-align: left; padding: 8px; border: 1px solid #ccc; font-weight: bold; }
                td { padding: 8px; border: 1px solid #ccc; }
                .totals { float: right; width: 300px; }
                .totals-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
                .totals-row.final { border-top: 2px solid #333; border-bottom: none; font-weight: bold; font-size: 16px; margin-top: 10px; padding-top: 10px; }
                .footer { clear: both; margin-top: 50px; text-align: center; font-size: 11px; color: #777; border-top: 1px solid #ccc; padding-top: 10px; }
                .signatures { margin-top: 60px; display: flex; justify-content: space-between; gap: 50px; }
                .sign-line { border-top: 1px solid #000; width: 45%; text-align: center; padding-top: 5px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-info">
                    <h1>EKIPE SERVIÇOS</h1>
                    <div>Rua Presidente Dutra, 1413 - Fátima do Sul/MS</div>
                    <div>(67) 9 9618-2061</div>
                </div>
                <div class="meta-info">
                    <h2>PEDIDO DE VENDA</h2>
                    <div><strong>Nº ${venda.VEN_CODIGO}</strong></div>
                    <div>Emissão: ${new Date(venda.VEN_DATA).toLocaleDateString()} ${venda.VEN_HORA}</div>
                </div>
            </div>

            <div class="box">
                <div class="row">
                    <div style="width: 48%;">
                        <div class="box-title">Dados do Cliente</div>
                        <div><strong>Nome:</strong> ${cliente || 'Não Informado'}</div>
                        <div><strong>Cód. Cliente:</strong> ${venda.VEN_CLI}</div>
                    </div>
                    <div style="width: 48%;">
                        <div class="box-title">Informações Adicionais</div>
                        <div><strong>Vendedor:</strong> ${funcionario || 'Não Informado'} (${venda.VEN_VENDEDOR})</div>
                        ${venda.VEN_NF ? `<div><strong>Nota Fiscal:</strong> ${venda.VEN_NF}</div>` : ''}
                    </div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th width="5%" style="text-align: center;">#</th>
                        <th width="10%">Cód.</th>
                        <th width="45%">Descrição do Produto</th>
                        <th width="10%" style="text-align: right;">Qtd</th>
                        <th width="15%" style="text-align: right;">Vl. Unit.</th>
                        <th width="15%" style="text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itensHtml}
                </tbody>
            </table>

            <div class="totals">
                <div class="totals-row">
                    <span>Subtotal:</span>
                    <span>${formatCurrency(venda.VEN_VALOR + desconto)}</span>
                </div>
                ${desconto > 0 ? `
                <div class="totals-row" style="color: red;">
                    <span>Desconto:</span>
                    <span>- ${formatCurrency(desconto)}</span>
                </div>` : ''}
                <div class="totals-row final">
                    <span>Total a Pagar:</span>
                    <span>${formatCurrency(venda.VEN_VALOR)}</span>
                </div>
            </div>

            <div style="clear: both; padding-top: 20px;">
                ${observacoes ? `
                <div class="box">
                    <div class="box-title">Observações</div>
                    <div>${observacoes}</div>
                </div>` : ''}
            </div>

            <div class="signatures">
                <div class="sign-line">Assinatura do Vendedor</div>
                <div class="sign-line">Assinatura do Cliente</div>
            </div>

            <div class="footer">
                Documento gerado eletronicamente. Não possui valor fiscal.
            </div>
        </body>
        </html>
      `;
    }

    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        onClose();
      }, 500);
    }
  };

  // Atalhos de teclado globais quando o modal está aberto
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'F8') {
        e.preventDefault();
        handlePrint();
      }
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement;
        if (target?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handlePrint();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, onClose, venda, observacoes, tipoImpressao]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => obsRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen || !venda) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 outline-none"
    >
      <div className="bg-ek-surface w-full max-w-md rounded-[8px] border border-ek-border overflow-hidden flex flex-col font-sans">

        <div className="bg-ek-raised px-5 py-3.5 border-b border-ek-border flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="w-1 h-4 bg-brand rounded-full" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-ek-text flex items-center gap-2">
              <Printer className="w-4 h-4 text-brand" />
              <span>Imprimir venda #{venda.VEN_CODIGO}</span>
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[6px] text-ek-muted hover:bg-ek-active hover:text-ek-text transition-colors" title="Fechar (ESC)">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 bg-ek-surface flex flex-col gap-3.5">
          <div className="bg-ek-raised px-4 py-3.5 rounded-[6px] border border-ek-border text-center">
            <span className="text-xs font-medium text-ek-muted block mb-1">Valor total da venda</span>
            <div className="text-3xl font-bold text-brand tabular-nums">{formatCurrency(venda.VEN_VALOR)}</div>
            <div className="text-xs text-ek-muted mt-1 tabular-nums">{new Date(venda.VEN_DATA).toLocaleDateString()} às {venda.VEN_HORA}</div>
          </div>

          <div className="bg-ek-surface p-3 rounded-[6px] border border-ek-border max-h-32 overflow-y-auto">
            <span className="text-xs font-semibold text-ek-muted block mb-1.5 border-b border-ek-rule pb-1">Resumo dos itens</span>
            {venda.itensVenEst && venda.itensVenEst.length > 0 ? (
              <ul className="text-xs text-ek-text space-y-1">
                {itens!.map((item, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span className="truncate">{item.VE_QUANTIDADE}x {item.VE_NOME}</span>
                    <span className="font-medium tabular-nums shrink-0">{formatCurrency(item.VE_VALOR)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-ek-faint text-center py-2">Itens não carregados para visualização</p>
            )}
          </div>

          <div className="bg-ek-surface p-3 rounded-[6px] border border-ek-border">
            <span className="ek-label mb-2">Formato de impressão</span>
            <div className="flex gap-5">
              <label className="flex items-center gap-2 cursor-pointer text-[13px] text-ek-text font-medium">
                <input
                  type="radio"
                  name="tipoImpressao"
                  value="80mm"
                  checked={tipoImpressao === '80mm'}
                  onChange={() => setTipoImpressao('80mm')}
                  className="w-4 h-4 accent-[#312783]"
                />
                <span>Bobina 80mm</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[13px] text-ek-text font-medium">
                <input
                  type="radio"
                  name="tipoImpressao"
                  value="a4"
                  checked={tipoImpressao === 'a4'}
                  onChange={() => setTipoImpressao('a4')}
                  className="w-4 h-4 accent-[#312783]"
                />
                <span>Folha A4 (PDF)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="ek-label">Observação para impressão</label>
            <textarea
              ref={obsRef}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="ek-textarea h-20"
              placeholder="Opcional..."
            />
          </div>
        </div>

        <div className="bg-ek-raised px-5 py-3 border-t border-ek-border flex justify-between items-center text-xs">
          <button type="button" onClick={onClose} className="ek-btn-secondary h-8 px-3 text-xs flex items-center gap-1.5">
            <kbd className="ek-kbd">ESC</kbd>
            <span>Voltar</span>
          </button>
          <button type="button" onClick={handlePrint} className="ek-btn-primary h-8 px-3.5 text-xs flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
            <kbd className="px-1.5 py-0.5 text-[11px] font-mono rounded bg-white/15 border border-white/25 text-white">F8 / ENTER</kbd>
          </button>
        </div>
      </div>
    </div>
  );
}