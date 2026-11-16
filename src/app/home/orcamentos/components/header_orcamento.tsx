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
  onImprimirCompleto?: () => void;
}

export default function HeaderOrcamento({
  codigoOrdem,
  statusOrdem,
  canSave,
  onOpenPesquisaOS,
  onNovoOrcamento,
  onSalvar,
  onImprimir,
  onImprimirCompleto,
}: HeaderOrcamentoProps) {
  const getStatusBadge = (status: string) => {
    const s = (status || "ABERTO").toUpperCase();
    switch (s) {
      case "ABERTO":
        return "bg-brand-goldSoft text-brand-goldInk border border-brand-gold/40";
      case "ENVIADO":
        return "bg-brand-soft text-brand border border-brand-border";
      case "APROVADO":
      case "FINALIZADO":
        return "bg-emerald-50 text-emerald-800 border border-emerald-200";
      case "CANCELADO":
        return "bg-red-50 text-red-800 border border-red-200";
      default:
        return "bg-ek-raised text-ek-muted border border-ek-border";
    }
  };

  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 pb-4 border-b border-ek-rule shrink-0">
      {/* Esquerda: Identificador da OS e Status */}
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-[22px] font-semibold text-ek-text tracking-tight leading-tight">
            {codigoOrdem > 0 ? `Ordem de Serviço #${codigoOrdem}` : "Novo Orçamento"}
          </h1>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(
              statusOrdem
            )}`}
          >
            {statusOrdem || "ABERTO"}
          </span>
        </div>
        <p className="text-sm text-ek-muted mt-0.5">
          Gestão comercial e técnica de serviços
        </p>
      </div>

      {/* Direita: Ações Rápidas */}
      <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
        <button
          type="button"
          onClick={onOpenPesquisaOS}
          className="ek-btn-secondary h-8 px-3 text-xs"
          title="Buscar Ordem Existente"
        >
          <Search className="w-3.5 h-3.5 text-ek-muted" />
          <span>Buscar OS</span>
        </button>

        <button
          type="button"
          onClick={onNovoOrcamento}
          className="ek-btn-secondary h-8 px-3 text-xs"
          title="Iniciar Novo Orçamento"
        >
          <Plus className="w-3.5 h-3.5 text-ek-muted" />
          <span>Novo</span>
        </button>

        {/* Botão PDF Completo */}
        <button
          type="button"
          onClick={onImprimirCompleto || onImprimir}
          disabled={codigoOrdem === 0}
          className={`inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-[6px] border transition-colors ${
            codigoOrdem === 0
              ? "text-ek-faint bg-ek-raised border-ek-border cursor-not-allowed opacity-60"
              : "text-brand bg-brand-soft hover:bg-brand-border/50 border-brand-border"
          }`}
          title={
            codigoOrdem === 0
              ? "Gere uma OS para emitir o relatório completo"
              : "Gerar Relatório / PDF Completo da Ordem de Serviço"
          }
        >
          <FileText className="w-3.5 h-3.5" />
          <span>PDF Completo</span>
        </button>

        {/* Botão Impressão Simples */}
        <button
          type="button"
          onClick={onImprimir}
          disabled={codigoOrdem === 0}
          className="ek-btn-secondary h-8 px-3 text-xs"
          title="Imprimir Orçamento Resumido"
        >
          <Printer className="w-3.5 h-3.5 text-ek-muted" />
          <span>Simples</span>
        </button>

        <button
          type="button"
          onClick={onSalvar}
          disabled={!canSave}
          className="ek-btn-primary h-8 px-3.5 text-xs"
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
