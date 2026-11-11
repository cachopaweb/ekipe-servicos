"use client";

import { useState, useMemo } from "react";
import { parseDataCalendario, formatDataInput } from "@/app/functions/utils";
import { ClienteModel } from "@/app/models/cliente_model";
import { FornecedorModel } from "@/app/models/fornecedor_model";
import { SolicitanteModel } from "@/app/models/solicitante_model";
import {
  User,
  Search,
  Building2,
  Calendar,
  FileCheck,
  Receipt,
  UserCheck,
  X,
  Plus,
  Phone,
  MapPin,
  CreditCard,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Hash,
  ShoppingCart,
  Clock,
  AlertTriangle,
  AlertCircle,
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
  om?: string;
  setOm?: (s: string) => void;
  pedidoCompra?: string;
  setPedidoCompra?: (s: string) => void;
  dataPrevisaoConclusao?: string;
  setDataPrevisaoConclusao?: (s: string) => void;
  justificativaAtraso?: string;
  setJustificativaAtraso?: (s: string) => void;
  solicitanteId?: number;
  setSolicitanteId?: (id: number) => void;
  solicitanteNome?: string;
  setSolicitanteNome?: (nome: string) => void;
  solicitantes?: SolicitanteModel[];
  onOpenNovoSolicitante?: () => void;
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
  om = "",
  setOm,
  pedidoCompra = "",
  setPedidoCompra,
  dataPrevisaoConclusao = "",
  setDataPrevisaoConclusao,
  justificativaAtraso = "",
  setJustificativaAtraso,
  solicitanteId = 0,
  setSolicitanteId,
  solicitanteNome = "",
  setSolicitanteNome,
  solicitantes = [],
  onOpenNovoSolicitante,
}: FormIdentificacaoProps) {
  // Controle de exibição dos dados fiscais secundários
  const [showFiscal, setShowFiscal] = useState<boolean>(codFatura > 0 || Boolean(nfs));

  // Verifica se a OS aprovada está com prazo estourado (atrasada)
  const isAtrasada = useMemo(() => {
    if (statusOrdem !== "APROVADO" || !dataPrevisaoConclusao) return false;
    const hojeStr = formatDataInput(new Date());
    return dataPrevisaoConclusao < hojeStr;
  }, [statusOrdem, dataPrevisaoConclusao]);

  // Solicitante selecionado atualmente
  const solicitanteSelecionado = useMemo(() => {
    if (!solicitanteId) return null;
    return solicitantes.find((s) => s.SOL_CODIGO === solicitanteId) || null;
  }, [solicitanteId, solicitantes]);

  const handleDateChange = (val: string) => {
    if (!val) {
      setDataAbertura(new Date(NaN));
      return;
    }
    setDataAbertura(parseDataCalendario(val));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* 1. Cliente & Parceiro & Solicitante */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Cliente (4 colunas no Desktop) */}
        <div className="lg:col-span-4 flex flex-col">
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
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded border border-gray-200 font-medium text-[11px]">
                <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                {cliente.CPF_CNPJ}
              </span>
            )}
            {cliente?.FONE && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded border border-gray-200 font-medium text-[11px]">
                <Phone className="w-3.5 h-3.5 text-gray-500" />
                {cliente.FONE}
              </span>
            )}
            {cliente?.ENDERECO && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded border border-gray-200 font-medium truncate max-w-[200px] text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-gray-500" />
                {cliente.ENDERECO}
                {cliente.NUMERO ? `, ${cliente.NUMERO}` : ""}
              </span>
            )}
          </div>
        </div>

        {/* Parceiro / Fornecedor (4 colunas no Desktop) */}
        <div className="lg:col-span-4 flex flex-col">
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
          <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-600 min-h-[22px]">
            {parceiro?.CODIGO ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-900 rounded border border-amber-200 font-medium text-[11px]">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                Cód: {parceiro.CODIGO}
              </span>
            ) : (
              <span className="text-[11px] text-gray-400 italic py-1">Opcional para vinculação</span>
            )}
          </div>
        </div>

        {/* Solicitante / Coordenador (4 colunas no Desktop) */}
        <div className="lg:col-span-4 flex flex-col">
          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase mb-1.5 h-5">
            <UserCheck className="w-4 h-4 text-amber-500" />
            <span>Solicitante (Coordenador)</span>
            <span className="text-xs font-normal text-gray-400 lowercase">(opcional)</span>
          </label>
          <div className="flex gap-1.5">
            <select
              value={solicitanteId || ""}
              onChange={(e) => {
                const id = parseInt(e.target.value) || 0;
                const found = solicitantes.find((s) => s.SOL_CODIGO === id);
                if (setSolicitanteId) setSolicitanteId(id);
                if (setSolicitanteNome) setSolicitanteNome(found?.SOL_NOME || "");
              }}
              className="w-full h-10 px-3 text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-300 rounded-md outline-none uppercase cursor-pointer hover:border-amber-500 focus:border-amber-500 transition"
            >
              <option value="">Nenhum solicitante vinculado</option>
              {solicitantes.map((sol) => (
                <option key={sol.SOL_CODIGO} value={sol.SOL_CODIGO}>
                  {sol.SOL_NOME}
                  {sol.SOL_REGIAO ? ` (${sol.SOL_REGIAO})` : ""}
                </option>
              ))}
            </select>
            {solicitanteId ? (
              <button
                type="button"
                onClick={() => {
                  if (setSolicitanteId) setSolicitanteId(0);
                  if (setSolicitanteNome) setSolicitanteNome("");
                }}
                className="h-10 px-3 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-300 rounded-md flex items-center justify-center transition shrink-0"
                title="Remover Solicitante"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={onOpenNovoSolicitante}
              className="h-10 px-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md flex items-center justify-center transition shrink-0"
              title="Cadastrar Novo Solicitante (+)"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Badges de Contato do Solicitante */}
          <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-600 min-h-[22px]">
            {solicitanteSelecionado?.SOL_TELEFONE && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded border border-gray-200 font-mono text-[11px] font-medium">
                <Phone className="w-3.5 h-3.5 text-gray-500" />
                {solicitanteSelecionado.SOL_TELEFONE}
              </span>
            )}
            {solicitanteSelecionado?.SOL_REGIAO && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded border border-gray-200 text-[11px] font-medium truncate max-w-[200px]">
                <MapPin className="w-3.5 h-3.5 text-gray-500" />
                {solicitanteSelecionado.SOL_REGIAO}
              </span>
            )}
            {!solicitanteSelecionado && (
              <span className="text-[11px] text-gray-400 italic py-1">Opcional para vinculação</span>
            )}
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
            value={formatDataInput(dataAbertura)}
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

      {/* 2.1 Campos Operacionais da OS Aprovada (OM, Pedido de Compras, Previsão de Conclusão e Justificativa) */}
      {statusOrdem === "APROVADO" && (
        <div className="pt-3 border-t border-gray-200 bg-amber-50/50 -mx-4 px-4 py-3 border-y border-amber-200/70 flex flex-col gap-3 rounded-lg animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-amber-600" />
              <span>Controle Operacional (OS Aprovada)</span>
            </span>
            {isAtrasada && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span>Prazo Excedido / Em Atraso</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* OM */}
            <div>
              <label className="flex items-center gap-1 text-xs font-bold text-gray-700 uppercase mb-1">
                <Hash className="w-3.5 h-3.5 text-gray-500" />
                <span>OM</span>
              </label>
              <input
                type="text"
                value={om}
                onChange={(e) => setOm && setOm(e.target.value.toUpperCase())}
                placeholder="Ex: 46118812"
                maxLength={30}
                className="w-full h-10 px-3 text-sm font-semibold text-gray-800 border border-gray-300 rounded-md focus:border-amber-500 outline-none uppercase bg-white"
              />
            </div>

            {/* PEDIDO DE COMPRAS */}
            <div>
              <label className="flex items-center gap-1 text-xs font-bold text-gray-700 uppercase mb-1">
                <ShoppingCart className="w-3.5 h-3.5 text-gray-500" />
                <span>Pedido de Compras</span>
              </label>
              <input
                type="text"
                value={pedidoCompra}
                onChange={(e) => setPedidoCompra && setPedidoCompra(e.target.value.toUpperCase())}
                placeholder="Ex: 4800455455"
                maxLength={30}
                className="w-full h-10 px-3 text-sm font-semibold text-gray-800 border border-gray-300 rounded-md focus:border-amber-500 outline-none uppercase bg-white"
              />
            </div>

            {/* PREVISÃO DE CONCLUSÃO */}
            <div>
              <label className={`flex items-center justify-between text-xs font-bold uppercase mb-1 ${
                isAtrasada ? "text-red-700" : "text-gray-700"
              }`}>
                <span className="flex items-center gap-1">
                  <Clock className={`w-3.5 h-3.5 ${isAtrasada ? "text-red-600" : "text-gray-500"}`} />
                  <span>Previsão Conclusão</span>
                </span>
                {isAtrasada && <span className="text-[10px] text-red-600 font-bold">VENCIDO!</span>}
              </label>
              <input
                type="date"
                value={dataPrevisaoConclusao}
                onChange={(e) => setDataPrevisaoConclusao && setDataPrevisaoConclusao(e.target.value)}
                className={`w-full h-10 px-3 text-sm font-bold border rounded-md outline-none bg-white transition ${
                  isAtrasada
                    ? "border-red-400 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-1 focus:ring-red-400"
                    : "border-gray-300 text-gray-800 focus:border-amber-500"
                }`}
              />
            </div>
          </div>

          {/* LINHA DE JUSTIFICATIVA DE ATRASO / OBSERVAÇÃO */}
          <div>
            <label className={`flex items-center justify-between text-xs font-bold uppercase mb-1 ${
              isAtrasada ? "text-red-800" : "text-gray-700"
            }`}>
              <span className="flex items-center gap-1">
                <AlertCircle className={`w-3.5 h-3.5 ${isAtrasada ? "text-red-600" : "text-gray-500"}`} />
                <span>Observação / Justificativa do Atraso</span>
              </span>
              {isAtrasada && (
                <span className="text-[10px] font-semibold text-red-600">
                  Preenchimento obrigatório devido ao atraso
                </span>
              )}
            </label>
            <input
              type="text"
              value={justificativaAtraso}
              onChange={(e) => setJustificativaAtraso && setJustificativaAtraso(e.target.value.toUpperCase())}
              placeholder="Informe a justificativa ou observação referente ao prazo..."
              maxLength={255}
              className={`w-full h-10 px-3 text-sm font-medium uppercase border rounded-md outline-none bg-white transition ${
                isAtrasada
                  ? "border-red-300 bg-red-50/20 text-red-900 focus:border-red-500"
                  : "border-gray-300 text-gray-800 focus:border-amber-500"
              }`}
            />
          </div>
        </div>
      )}

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
