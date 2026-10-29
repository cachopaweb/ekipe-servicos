"use client";

import { FileText, Search, Plus, Save, Printer } from "lucide-react";

interface HeaderOrcamentoProps {
  codigoOrdem: number;
  statusOrdem: string;
  canSave: boolean;
  onOpenPesquisaOS: () => void;
  onNovoOrcamento: () => void;
  onSalvar: () => void;
  onImprimir: () => void;
}

export default function HeaderOrcamento({
  codigoOrdem,
  statusOrdem,
  canSave,
  onOpenPesquisaOS,
  onNovoOrcamento,
  onSalvar,
  onImprimir,
}: HeaderOrcamentoProps) {
  const getStatusColor = (status: string) => {
    const s = (status || "").toUpperCase();
    switch (s) {
      case "ABERTO":
        return "text-amber-500";
      case "ENVIADO":
        return "text-brand";
      case "APROVADO":
        return "text-emerald-600";
      case "FINALIZADO":
        return "text-teal-700";
      case "CANCELADO":
        return "text-rose-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <header className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">
      {/* Esquerda: Identificador da OS e Status */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="p-2.5 bg-amber-500 text-white rounded-lg">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none">
              {codigoOrdem > 0 ? `Ordem de Serviço #${codigoOrdem}` : "Novo Orçamento"}
            </h1>
            <span className="text-gray-400 font-bold">•</span>
            <span
              className={`text-sm font-black tracking-wider uppercase ${getStatusColor(
                statusOrdem
              )}`}
            >
              {statusOrdem || "ABERTO"}
            </span>
          </div>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Gestão comercial e técnica de serviços
          </p>
        </div>
      </div>

      {/* Direita: Ações Rápidas */}
      <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
        <button
          type="button"
          onClick={onOpenPesquisaOS}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
          title="Buscar Ordem Existente"
        >
          <Search className="w-3.5 h-3.5 text-gray-600" />
          <span>Buscar OS</span>
        </button>

        <button
          type="button"
          onClick={onNovoOrcamento}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
          title="Iniciar Novo Orçamento"
        >
          <Plus className="w-3.5 h-3.5 text-gray-600" />
          <span>Novo</span>
        </button>

        <button
          type="button"
          onClick={onImprimir}
          disabled={codigoOrdem === 0}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-md transition ${
            codigoOrdem === 0
              ? "text-gray-300 bg-gray-50 border border-gray-200 cursor-not-allowed"
              : "text-brand bg-brand-soft hover:bg-brand/15 border border-brand-border"
          }`}
          title="Imprimir Orçamento"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Imprimir</span>
        </button>

        <button
          type="button"
          onClick={onSalvar}
          disabled={!canSave}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-md transition ${
            !canSave
              ? "text-gray-400 bg-gray-200 cursor-not-allowed"
              : "text-white bg-emerald-600 hover:bg-emerald-700"
          }`}
          title={
            canSave
              ? "Salvar Ordem"
              : "Adicione ao menos um serviço ou produto para salvar"
          }
        >
          <Save className="w-3.5 h-3.5" />
          <span>Salvar</span>
        </button>
      </div>
    </header>
  );
}
