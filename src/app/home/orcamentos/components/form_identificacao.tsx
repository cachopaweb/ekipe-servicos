"use client";

import { useState } from "react";
import { ClienteModel } from "@/app/models/cliente_model";
import { FornecedorModel } from "@/app/models/fornecedor_model";
import {
  User,
  Search,
  Building2,
  Calendar,
  FileCheck,
  Receipt,
  UserCheck,
  X,
  Phone,
  MapPin,
  CreditCard,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface FormIdentificacaoProps {
  cliente: ClienteModel;
  onOpenPesquisaCliente: () => void;
  parceiro: FornecedorModel;
  onOpenPesquisaFornecedor: () => void;
  onClearParceiro: () => void;
  dataAbertura: Date;
  setDataAbertura: (d: Date) => void;
  statusOrdem: string;
  setStatusOrdem: (s: string) => void;
  listaStatus: string[];
  nfs: string;
  setNfs: (n: string) => void;
  codFatura: number;
  nomeFuncionario: string;
  solicitacao: string;
  setSolicitacao: (s: string) => void;
}

export default function FormIdentificacao({
  cliente,
  onOpenPesquisaCliente,
  parceiro,
  onOpenPesquisaFornecedor,
  onClearParceiro,
  dataAbertura,
  setDataAbertura,
  statusOrdem,
  setStatusOrdem,
  listaStatus,
  nfs,
  setNfs,
  codFatura,
  nomeFuncionario,
  solicitacao,
  setSolicitacao,
}: FormIdentificacaoProps) {
  // Controle de exibição dos dados fiscais secundários
  const [showFiscal, setShowFiscal] = useState<boolean>(codFatura > 0 || Boolean(nfs));

  // Converte Date para string no formato YYYY-MM-DD para input date
  const formatInputDate = (d: Date) => {
    try {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0"); // taste-skill-ignore
      const day = String(d.getDate()).padStart(2, "0"); // taste-skill-ignore
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  const handleDateChange = (val: string) => {
    if (!val) return;
    const parts = val.split("-");
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      setDataAbertura(d);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* 1. Cliente & Parceiro */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Cliente (7 colunas no Desktop) */}
        <div className="lg:col-span-7 flex flex-col">
          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase mb-1.5 h-5">
            <User className="w-4 h-4 text-amber-500" />
            <span>Cliente</span>
            <span className="text-amber-500 font-bold ml-0.5">*</span>
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              readOnly
              value={cliente?.NOME ? `${cliente.CODIGO} - ${cliente.NOME}` : "CONSUMIDOR"}
              className="w-full h-10 px-3 text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-300 rounded-md outline-none uppercase cursor-pointer hover:border-amber-500 transition"
              onClick={onOpenPesquisaCliente}
              title="Clique para pesquisar cliente"
            />
            <button
              type="button"
              onClick={onOpenPesquisaCliente}
              className="h-10 px-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md flex items-center justify-center transition shrink-0"
              title="Pesquisar Cliente"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Badges de Contato do Cliente */}
          <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-600 min-h-[22px]">
            {cliente?.CPF_CNPJ && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded border border-gray-200 font-medium">
                <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                {cliente.CPF_CNPJ}
              </span>
            )}
            {cliente?.FONE && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded border border-gray-200 font-medium">
                <Phone className="w-3.5 h-3.5 text-gray-500" />
                {cliente.FONE}
              </span>
            )}
            {cliente?.ENDERECO && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded border border-gray-200 font-medium truncate max-w-sm">
                <MapPin className="w-3.5 h-3.5 text-gray-500" />
                {cliente.ENDERECO}
                {cliente.NUMERO ? `, ${cliente.NUMERO}` : ""}
                {cliente.BAIRRO ? ` - ${cliente.BAIRRO}` : ""}
              </span>
            )}
          </div>
        </div>

        {/* Parceiro / Fornecedor (5 colunas no Desktop) */}
        <div className="lg:col-span-5 flex flex-col">
          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase mb-1.5 h-5">
            <Building2 className="w-4 h-4 text-amber-500" />
            <span>Parceiro / Fornecedor</span>
            <span className="text-xs font-normal text-gray-400 lowercase">(opcional)</span>
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              readOnly
              value={parceiro?.CODIGO ? `${parceiro.CODIGO} - ${parceiro.NOME}` : "Nenhum parceiro vinculado"}
              placeholder="Nenhum parceiro vinculado"
              className="w-full h-10 px-3 text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-300 rounded-md outline-none uppercase cursor-pointer hover:border-amber-500 transition"
              onClick={onOpenPesquisaFornecedor}
              title="Clique para pesquisar parceiro"
            />
            {parceiro?.CODIGO ? (
              <button
                type="button"
                onClick={onClearParceiro}
                className="h-10 px-3 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-300 rounded-md flex items-center justify-center transition shrink-0"
                title="Remover Parceiro"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={onOpenPesquisaFornecedor}
              className="h-10 px-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md flex items-center justify-center transition shrink-0"
              title="Pesquisar Parceiro"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Metadados do Atendimento (Data, Status, Atendente) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-200">
        <div>
          <label className="flex items-center gap-1 text-xs font-bold text-gray-700 uppercase mb-1">
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            <span>Data de Abertura</span>
          </label>
          <input
            type="date"
            value={formatInputDate(dataAbertura)}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full h-10 px-3 text-sm font-medium text-gray-800 border border-gray-300 rounded-md focus:border-amber-500 outline-none bg-white"
          />
        </div>

        <div>
          <label className="flex items-center gap-1 text-xs font-bold text-gray-700 uppercase mb-1">
            <FileCheck className="w-3.5 h-3.5 text-gray-500" />
            <span>Status da OS</span>
            <span className="text-amber-500 font-bold ml-0.5">*</span>
          </label>
          <select
            value={statusOrdem}
            onChange={(e) => setStatusOrdem(e.target.value.toUpperCase())}
            className="w-full h-10 px-3 text-sm font-bold text-gray-800 border border-gray-300 rounded-md focus:border-amber-500 outline-none uppercase bg-white cursor-pointer"
          >
            {listaStatus.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-1 text-xs font-bold text-gray-700 uppercase mb-1">
            <UserCheck className="w-3.5 h-3.5 text-gray-500" />
            <span>Atendente / Resp.</span>
          </label>
          <input
            type="text"
            readOnly
            value={nomeFuncionario || "NÃO INFORMADO"}
            className="w-full h-10 px-3 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md outline-none uppercase truncate"
          />
        </div>
      </div>

      {/* 3. Diagnóstico & Solicitação do Cliente (Obrigatório e no fluxo real) */}
      <div className="pt-3 border-t border-gray-200 space-y-1.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <label
            htmlFor="solicitacao_cliente_input"
            className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase"
          >
            <MessageSquare className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Solicitação do Cliente / Diagnóstico Inicial</span>
            <span className="text-amber-500 font-bold ml-0.5">*</span>
          </label>
          <span className="text-xs text-gray-400">
            {solicitacao.trim() ? `${solicitacao.length} caracteres` : "Preenchimento obrigatório"}
          </span>
        </div>
        <textarea
          id="solicitacao_cliente_input"
          rows={3}
          value={solicitacao}
          onChange={(e) => setSolicitacao(e.target.value.toUpperCase())}
          placeholder="Descreva o que o cliente solicitou ou o diagnóstico inicial do serviço (obrigatório para salvar a ordem)..."
          className={`w-full p-3 text-sm font-medium uppercase border rounded-md outline-none resize-y transition ${
            !solicitacao.trim()
              ? "border-amber-300 bg-amber-50/20 focus:border-amber-500 focus:bg-white"
              : "border-gray-300 bg-white focus:border-amber-500"
          }`}
        />
      </div>

      {/* 4. Detalhes Fiscais & Faturamento (Seção Recolhível) */}
      <div className="pt-2 border-t border-gray-200">
        <button
          type="button"
          onClick={() => setShowFiscal(!showFiscal)}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition py-1"
        >
          {showFiscal ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>Dados Fiscais & Fatura Vinculada</span>
          {codFatura > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded">
              Faturado #{codFatura}
            </span>
          )}
        </button>

        {showFiscal && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2.5 p-3 bg-stone-50 rounded-md border border-gray-200">
            <div>
              <label className="flex items-center gap-1 text-xs font-bold text-gray-700 uppercase mb-1">
                <Receipt className="w-3.5 h-3.5 text-gray-500" />
                <span>NF Serviço</span>
              </label>
              <input
                type="text"
                value={nfs}
                onChange={(e) => setNfs(e.target.value.toUpperCase())}
                placeholder="Nº DA NOTA FISCAL"
                className="w-full h-10 px-3 text-sm font-medium text-gray-800 border border-gray-300 rounded-md focus:border-amber-500 outline-none uppercase bg-white"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-xs font-bold text-gray-700 uppercase mb-1">
                <Receipt className="w-3.5 h-3.5 text-gray-500" />
                <span>Fatura Vinculada</span>
              </label>
              <input
                type="text"
                readOnly
                value={codFatura > 0 ? `Fatura Vinculada #${codFatura}` : "Não faturado"}
                className={`w-full h-10 px-3 text-sm font-bold border rounded-md outline-none ${
                  codFatura > 0
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : "bg-gray-100 text-gray-400 border-gray-200"
                }`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
