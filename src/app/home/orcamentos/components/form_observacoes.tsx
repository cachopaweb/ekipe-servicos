"use client";

import { useState } from "react";
import { FileText, Lock } from "lucide-react";

interface FormObservacoesProps {
  obs: string;
  setObs: (o: string) => void;
  obsAdm: string;
  setObsAdm: (a: string) => void;
}

export default function FormObservacoes({
  obs,
  setObs,
  obsAdm,
  setObsAdm,
}: FormObservacoesProps) {
  const [activeTab, setActiveTab] = useState<"obs" | "obsAdm">("obs");

  return (
    <div className="ek-card overflow-hidden">
      {/* Abas Superiores de Condições & Notas */}
      <div className="flex border-b border-ek-rule bg-white px-2 overflow-x-auto gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("obs")}
          className={`flex items-center gap-2 px-3 py-2.5 text-sm transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "obs"
              ? "border-brand text-ek-text font-semibold"
              : "border-transparent text-ek-muted font-medium hover:text-ek-text"
          }`}
        >
          <FileText className={`w-4 h-4 ${activeTab === "obs" ? "text-brand" : "text-ek-faint"}`} />
          <span>Condições & Observações Gerais (Impressão)</span>
          {obs.trim() && (
            <span className="w-1.5 h-1.5 rounded-full bg-brand" title="Possui observações preenchidas" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("obsAdm")}
          className={`flex items-center gap-2 px-3 py-2.5 text-sm transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "obsAdm"
              ? "border-brand text-ek-text font-semibold"
              : "border-transparent text-ek-muted font-medium hover:text-ek-text"
          }`}
        >
          <Lock className={`w-4 h-4 ${activeTab === "obsAdm" ? "text-brand" : "text-ek-faint"}`} />
          <span>Anotações Internas (ADM / Equipe)</span>
          {obsAdm.trim() && (
            <span className="w-1.5 h-1.5 rounded-full bg-brand-gold" title="Possui anotações internas" />
          )}
        </button>
      </div>

      {/* Conteúdo da Aba */}
      <div className="p-4">
        {activeTab === "obs" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-ek-muted">
              <span>Este texto é impresso no orçamento do cliente.</span>
              <span className="tabular-nums">{obs.length} caracteres</span>
            </div>
            <textarea
              id="obs_impressao_id"
              rows={3}
              value={obs}
              onChange={(e) => setObs(e.target.value.toUpperCase())}
              placeholder="Ex: Validade da proposta: 15 dias. Pagamento em 3x no boleto. Garantia de 90 dias nos serviços prestados..."
              className="ek-textarea uppercase resize-y"
            />
          </div>
        )}

        {activeTab === "obsAdm" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-ek-muted">
              <span className="text-brand-goldInk font-medium">Uso restrito da empresa. Não sai na impressão da OS.</span>
              <span className="tabular-nums">{obsAdm.length} caracteres</span>
            </div>
            <textarea
              id="obs_adm_id"
              rows={3}
              value={obsAdm}
              onChange={(e) => setObsAdm(e.target.value.toUpperCase())}
              placeholder="Anotações internas, custos operacionais, instruções para os técnicos em campo..."
              className="ek-textarea uppercase resize-y"
            />
          </div>
        )}
      </div>
    </div>
  );
}
