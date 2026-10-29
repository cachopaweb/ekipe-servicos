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
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Abas Superiores de Condições & Notas */}
      <div className="flex border-b border-gray-200 bg-stone-50 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("obs")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition border-b-2 whitespace-nowrap ${
            activeTab === "obs"
              ? "border-amber-500 text-amber-800 bg-white"
              : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Condições & Observações Gerais (Impressão)</span>
          {obs.trim() && (
            <span className="w-2 h-2 rounded-full bg-amber-500" title="Possui observações preenchidas" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("obsAdm")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition border-b-2 whitespace-nowrap ${
            activeTab === "obsAdm"
              ? "border-amber-500 text-amber-800 bg-white"
              : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Anotações Internas (ADM / Equipe)</span>
          {obsAdm.trim() && (
            <span className="w-2 h-2 rounded-full bg-amber-500" title="Possui anotações internas" />
          )}
        </button>
      </div>

      {/* Conteúdo da Aba */}
      <div className="p-4">
        {activeTab === "obs" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Este texto é impresso no orçamento do cliente.</span>
              <span>{obs.length} caracteres</span>
            </div>
            <textarea
              id="obs_impressao_id"
              rows={3}
              value={obs}
              onChange={(e) => setObs(e.target.value.toUpperCase())}
              placeholder="Ex: Validade da proposta: 15 dias. Pagamento em 3x no boleto. Garantia de 90 dias nos serviços prestados..."
              className="w-full p-3 text-sm font-medium uppercase border border-gray-300 rounded-md focus:border-amber-500 outline-none resize-y"
            />
          </div>
        )}

        {activeTab === "obsAdm" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="text-amber-700 font-semibold">Uso restrito da empresa. Não sai na impressão da OS.</span>
              <span>{obsAdm.length} caracteres</span>
            </div>
            <textarea
              id="obs_adm_id"
              rows={3}
              value={obsAdm}
              onChange={(e) => setObsAdm(e.target.value.toUpperCase())}
              placeholder="Anotações internas, custos operacionais, instruções para os técnicos em campo..."
              className="w-full p-3 text-sm font-medium uppercase border border-gray-300 rounded-md focus:border-amber-500 outline-none resize-y"
            />
          </div>
        )}
      </div>
    </div>
  );
}
