"use client";

import React, { forwardRef } from "react";
import Image from "next/image";
import logo from "../../../assets/logo.png";
import { ItemRelatorioEmpreitada } from "@/app/models/relatorio_model";
import { mascaraMoeda } from "@/app/functions/utils";

interface PrintRelatorioEmpreitadasProps {
  dados: ItemRelatorioEmpreitada[];
  periodoStr: string;
  clienteNome?: string;
  coordenadorNome?: string;
}

function formatarData(dataStr?: string): string {
  if (!dataStr) return "-";
  if (dataStr.includes("/")) return dataStr;
  const parts = dataStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dataStr;
}

export const PrintRelatorioEmpreitadas = forwardRef<HTMLDivElement, PrintRelatorioEmpreitadasProps>(
  ({ dados, periodoStr, clienteNome, coordenadorNome }, ref) => {
    const totalEmitido = dados.reduce((acc, curr) => acc + (curr.EMP_VALOR || 0), 0);
    const totalRecebido = dados.reduce((acc, curr) => acc + (curr.VALOR_RECEBIDO || 0), 0);
    const totalServicos = dados.reduce((acc, curr) => acc + (curr.ITENS?.length || 1), 0);

    return (
      <div ref={ref} className="w-full max-w-full bg-white text-black font-sans text-xs p-6 box-border">
        {/* Estilo CSS embutido para forçar impressão paisagem e margens simétricas */}
        <style dangerouslySetInnerHTML={{ __html: `
          @page {
            size: A4 landscape;
            margin: 10mm 15mm;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}} />

        {/* Cabeçalho da Empresa */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-3">
          <div className="flex items-center gap-4">
            <Image src={logo} alt="Logo Ekipe Serviços" width={130} height={45} className="object-contain" priority />
            <div>
              <h1 className="text-base font-bold uppercase tracking-tight">EKIPE SERVIÇOS</h1>
              <p className="text-[10.5px] text-gray-700">CNPJ: 07.167.610/0001-23</p>
              <p className="text-[10.5px] text-gray-700 font-semibold">
                RELATÓRIO MENSAL DE ATENDIMENTOS E EMPREITADAS
              </p>
            </div>
          </div>

          <div className="text-right text-[10.5px] space-y-0.5">
            <p>
              <span className="font-bold">Período:</span> {periodoStr}
            </p>
            {clienteNome && (
              <p>
                <span className="font-bold">Cliente:</span> {clienteNome}
              </p>
            )}
            {coordenadorNome && (
              <p>
                <span className="font-bold">Coordenador:</span> {coordenadorNome}
              </p>
            )}
            <p className="text-gray-500 text-[10px]">
              Emitido em: {new Date().toLocaleDateString("pt-BR")} às{" "}
              {new Date().toLocaleTimeString("pt-BR")}
            </p>
          </div>
        </div>

        {/* Resumo Executivo */}
        <div className="grid grid-cols-4 gap-3 mb-3 p-2.5 bg-gray-50 border border-gray-300 rounded text-center">
          <div>
            <span className="text-[10px] uppercase text-gray-500 font-bold block">Total Atendimentos</span>
            <span className="text-sm font-bold">{dados.length}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-gray-500 font-bold block">Total Serviços</span>
            <span className="text-sm font-bold">{totalServicos}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-gray-500 font-bold block">Total Valor NF</span>
            <span className="text-sm font-bold font-mono">{mascaraMoeda(totalEmitido)}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-gray-500 font-bold block">Total Recebido</span>
            <span className="text-sm font-bold font-mono text-emerald-800">{mascaraMoeda(totalRecebido)}</span>
          </div>
        </div>

        {/* Tabela de Itens (100% de largura, colunas proporcionais fixas que somam 100%) */}
        <table className="w-full table-fixed border-collapse border border-black text-[10.5px]">
          <thead>
            <tr className="bg-gray-100 font-bold text-center border-b border-black">
              <th className="border border-black p-1 text-center w-[11%] break-words">PROTOCOLO</th>
              <th className="border border-black p-1 text-center w-[7%] break-words">NF</th>
              <th className="border border-black p-1 text-center w-[6%] break-words">LOJA</th>
              <th className="border border-black p-1 text-center w-[8%] break-words">OM</th>
              <th className="border border-black p-1 text-center w-[10%] break-words">PEDIDO COMPRAS</th>
              <th className="border border-black p-1 text-left w-[24%] break-words">SERVIÇO(S)</th>
              <th className="border border-black p-1 text-right w-[9%] break-words">VALOR DA NF</th>
              <th className="border border-black p-1 text-center w-[8%] break-words">DATA EMISSÃO</th>
              <th className="border border-black p-1 text-right w-[8%] break-words">RECEBIDO</th>
              <th className="border border-black p-1 text-left w-[9%] break-words">COORDENADOR</th>
            </tr>
          </thead>
          <tbody>
            {dados.length === 0 ? (
              <tr>
                <td colSpan={10} className="border border-black p-4 text-center text-gray-500">
                  Nenhum registro encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              dados.map((item, index) => (
                <tr key={`${item.EMP_CODIGO}_${index}`} className="border-b border-gray-300">
                  <td className="border border-black p-1 font-mono text-center font-bold break-words">
                    {item.EMP_PROTOCOLO || "-"}
                  </td>
                  <td className="border border-black p-1 font-mono text-center font-bold break-words">
                    {item.EMP_NFS || "-"}
                  </td>
                  <td className="border border-black p-1 font-mono text-center break-words">
                    {item.EMP_LOJA || "-"}
                  </td>
                  <td className="border border-black p-1 font-mono text-center break-words">
                    {item.ORD_OM || "-"}
                  </td>
                  <td className="border border-black p-1 font-mono text-center break-words">
                    {item.EMP_PEDIDO || "-"}
                  </td>
                  <td className="border border-black p-1 text-left break-words">
                    {!item.ITENS || item.ITENS.length === 0 ? (
                      <span className="text-gray-400 italic">Sem serviços descritos</span>
                    ) : item.ITENS.length === 1 ? (
                      <span>{item.ITENS[0].DESCRICAO}</span>
                    ) : (
                      <ul className="space-y-0.5 list-disc list-inside">
                        {item.ITENS.map((s, sIdx) => (
                          <li key={sIdx} className="leading-tight break-words">
                            <span className="font-semibold">{s.DESCRICAO}</span>
                            {s.ES_QUANTIDADE ? (
                              <span className="text-[9.5px] text-gray-600">
                                {" "}
                                ({s.ES_QUANTIDADE} {s.ES_UNIDADE || "UN"})
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="border border-black p-1 text-right font-mono font-semibold break-words">
                    {mascaraMoeda(item.EMP_VALOR)}
                  </td>
                  <td className="border border-black p-1 text-center font-mono break-words">
                    {formatarData(item.EMP_DATA_EMISSAO)}
                  </td>
                  <td className="border border-black p-1 text-right font-mono font-bold text-emerald-900 break-words">
                    {mascaraMoeda(item.VALOR_RECEBIDO)}
                  </td>
                  <td className="border border-black p-1 text-left uppercase font-semibold break-words">
                    {item.EMP_COORDENADOR || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold border-t-2 border-black">
              <td colSpan={5} className="border border-black p-1.5 uppercase text-left break-words">
                Totais ({dados.length} Atendimentos)
              </td>
              <td className="border border-black p-1.5 text-left font-semibold text-gray-700 break-words">
                {totalServicos} Serviços
              </td>
              <td className="border border-black p-1.5 text-right font-mono break-words">
                {mascaraMoeda(totalEmitido)}
              </td>
              <td className="border border-black p-1.5"></td>
              <td className="border border-black p-1.5 text-right font-mono text-emerald-900 break-words">
                {mascaraMoeda(totalRecebido)}
              </td>
              <td className="border border-black p-1.5"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }
);

PrintRelatorioEmpreitadas.displayName = "PrintRelatorioEmpreitadas";
export default PrintRelatorioEmpreitadas;
