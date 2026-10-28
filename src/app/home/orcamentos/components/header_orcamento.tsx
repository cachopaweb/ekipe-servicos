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
        return "text-amber-600";
      case "ENVIADO":
        return "text-sky-600";
      case "APROVADO":
        return "text-emerald-600";
      case "FINALIZADO":
        return "text-indigo-600";
      case "CANCELADO":
        return "text-rose-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 px-5 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      {/* Esquerda: Identificador da OS e Status sem background */}
      <div className="flex items-center gap-3.5 flex-wrap">
        <div className="p-2.5 bg-amber-500 text-white rounded-lg">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              {codigoOrdem > 0 ? `Ordem de Serviço #${codigoOrdem}` : "Novo Orçamento"}
            </h1>
            <span className="text-gray-400 font-bold">•</span>
            {/* Status sem background, apenas a escrita em cor de destaque */}
            <span
              className={`text-sm font-black tracking-wider uppercase ${getStatusColor(
                statusOrdem
              )}`}
            >
              {statusOrdem || "ABERTO"}
            </span>
          </div>
          <p className="text-sm text-gray-500 font-medium mt-0.5">
            Gestão comercial e técnica de serviços
          </p>
        </div>
      </div>

      {/* Direita: Ações Rápidas (Sem sombras) */}
      <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-end">
        <button
          type="button"
          onClick={onOpenPesquisaOS}
          className="flex items-center gap-2 px-3.5 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
          title="Buscar Ordem Existente"
        >
          <Search className="w-4 h-4 text-gray-600" />
          <span>Buscar OS</span>
        </button>

        <button
          type="button"
          onClick={onNovoOrcamento}
          className="flex items-center gap-2 px-3.5 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
          title="Iniciar Novo Orçamento"
        >
          <Plus className="w-4 h-4 text-gray-600" />
          <span>Novo</span>
        </button>

        <button
          type="button"
          onClick={onImprimir}
          disabled={codigoOrdem === 0}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-md transition ${
            codigoOrdem === 0
              ? "text-gray-300 bg-gray-50 border border-gray-200 cursor-not-allowed"
              : "text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200"
          }`}
          title="Imprimir Orçamento"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir</span>
        </button>

        <button
          type="button"
          onClick={onSalvar}
          disabled={!canSave}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-md transition ${
            !canSave
              ? "text-gray-400 bg-gray-200 cursor-not-allowed"
              : "text-white bg-emerald-600 hover:bg-emerald-700"
          }`}
          title="Salvar Ordem"
        >
          <Save className="w-4 h-4" />
          <span>Salvar</span>
        </button>
      </div>
    </div>
  );
}
