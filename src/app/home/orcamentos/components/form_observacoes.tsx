"use client";

import { useState } from "react";
import { MessageSquare, FileText, Lock } from "lucide-react";

interface FormObservacoesProps {
  solicitacao: string;
  setSolicitacao: (s: string) => void;
  obs: string;
  setObs: (o: string) => void;
  obsAdm: string;
  setObsAdm: (a: string) => void;
}

export default function FormObservacoes({
  solicitacao,
  setSolicitacao,
  obs,
  setObs,
  obsAdm,
  setObsAdm,
}: FormObservacoesProps) {
  const [activeTab, setActiveTab] = useState<"solicitacao" | "obs" | "obsAdm">(
    "solicitacao"
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Abas Superiores */}
      <div className="flex border-b border-gray-200 bg-stone-50 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("solicitacao")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition border-b-2 whitespace-nowrap ${
            activeTab === "solicitacao"
              ? "border-amber-500 text-amber-700 bg-white"
              : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Solicitação do Cliente</span>
          <span className="text-sm text-amber-500 font-bold ml-0.5">*</span>
          {solicitacao.trim() && (
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("obs")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition border-b-2 whitespace-nowrap ${
            activeTab === "obs"
              ? "border-amber-500 text-amber-700 bg-white"
              : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Observações Gerais (Impressão)</span>
          {obs.trim() && (
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("obsAdm")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition border-b-2 whitespace-nowrap ${
            activeTab === "obsAdm"
              ? "border-amber-500 text-amber-700 bg-white"
              : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Anotações Internas (ADM)</span>
          {obsAdm.trim() && (
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          )}
        </button>
      </div>

      {/* Conteúdo da Aba */}
      <div className="p-4">
        {activeTab === "solicitacao" && (
          <div>
            <textarea
              id="solicitacaoid"
              rows={3}
              value={solicitacao}
              onChange={(e) => setSolicitacao(e.target.value.toUpperCase())}
              placeholder="Descreva o que o cliente solicitou ou o diagnóstico inicial do serviço (obrigatório)..."
              className="w-full p-3 text-sm font-medium uppercase border border-gray-300 rounded-md focus:border-amber-500 outline-none resize-y"
            />
          </div>
        )}

        {activeTab === "obs" && (
          <div>
            <textarea
              id="obsid"
              rows={3}
              value={obs}
              onChange={(e) => setObs(e.target.value.toUpperCase())}
              placeholder="Observações que serão impressas no orçamento (ex: garantias, prazos de validade, condições de pagamento)..."
              className="w-full p-3 text-sm font-medium uppercase border border-gray-300 rounded-md focus:border-amber-500 outline-none resize-y"
            />
          </div>
        )}

        {activeTab === "obsAdm" && (
          <div>
            <textarea
              id="anotacaoid"
              rows={3}
              value={obsAdm}
              onChange={(e) => setObsAdm(e.target.value.toUpperCase())}
              placeholder="Anotações internas confidenciais da equipe (não saem na impressão da OS)..."
              className="w-full p-3 text-sm font-medium uppercase border border-gray-300 rounded-md focus:border-amber-500 outline-none resize-y"
            />
          </div>
        )}
      </div>
    </div>
  );
}
