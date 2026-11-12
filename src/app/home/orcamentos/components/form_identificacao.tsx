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
    <div className="ek-card p-4 sm:p-5 space-y-4">
      {/* 1. Cliente & Parceiro & Solicitante */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Cliente (4 colunas no Desktop) */}
        <div className="lg:col-span-4 flex flex-col">
          <label className="ek-label flex items-center gap-1.5 h-5 mb-1">
            <User className="w-3.5 h-3.5 text-brand shrink-0" />
            <span>Cliente</span>
            <span className="text-red-600">*</span>
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              readOnly
              value={cliente?.NOME ? `${cliente.CODIGO} - ${cliente.NOME}` : "CONSUMIDOR"}
              className="ek-input bg-ek-raised font-medium uppercase cursor-pointer hover:border-brand/50"
              onClick={onOpenPesquisaCliente}
              title="Clique para pesquisar cliente"
            />
            <button
              type="button"
              onClick={onOpenPesquisaCliente}
              className="ek-btn-secondary w-9 px-0 shrink-0"
              title="Pesquisar Cliente"
            >
              <Search className="w-4 h-4 text-brand" />
            </button>
          </div>

          {/* Badges de Contato do Cliente */}
          <div className="flex flex-wrap gap-1.5 mt-2 text-xs text-ek-muted min-h-[22px]">
            {cliente?.CPF_CNPJ && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-ek-raised rounded-[4px] border border-ek-border text-[11px] tabular-nums">
                <CreditCard className="w-3 h-3 text-ek-faint" />
                {cliente.CPF_CNPJ}
              </span>
            )}
            {cliente?.FONE && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-ek-raised rounded-[4px] border border-ek-border text-[11px] tabular-nums">
                <Phone className="w-3 h-3 text-ek-faint" />
                {cliente.FONE}
              </span>
            )}
            {cliente?.ENDERECO && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-ek-raised rounded-[4px] border border-ek-border truncate max-w-[200px] text-[11px]">
                <MapPin className="w-3 h-3 text-ek-faint" />
                {cliente.ENDERECO}
                {cliente.NUMERO ? `, ${cliente.NUMERO}` : ""}
              </span>
            )}
          </div>
        </div>

        {/* Parceiro / Fornecedor (4 colunas no Desktop) */}
        <div className="lg:col-span-4 flex flex-col">
          <label className="ek-label flex items-center gap-1.5 h-5 mb-1">
            <Building2 className="w-3.5 h-3.5 text-brand shrink-0" />
            <span>Parceiro / Fornecedor</span>
            <span className="text-[11px] font-normal text-ek-faint">(opcional)</span>
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              readOnly
              value={parceiro?.CODIGO ? `${parceiro.CODIGO} - ${parceiro.NOME}` : "Nenhum parceiro vinculado"}
              placeholder="Nenhum parceiro vinculado"
              className="ek-input bg-ek-raised font-medium uppercase cursor-pointer hover:border-brand/50"
              onClick={onOpenPesquisaFornecedor}
              title="Clique para pesquisar parceiro"
            />
            {parceiro?.CODIGO ? (
              <button
                type="button"
                onClick={onClearParceiro}
                className="ek-btn-secondary w-9 px-0 hover:bg-red-50 hover:text-red-700 hover:border-red-200 shrink-0"
                title="Remover Parceiro"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={onOpenPesquisaFornecedor}
              className="ek-btn-secondary w-9 px-0 shrink-0"
              title="Pesquisar Parceiro"
            >
              <Search className="w-4 h-4 text-brand" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2 text-xs text-ek-muted min-h-[22px]">
            {parceiro?.CODIGO ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-soft text-brand rounded-[4px] border border-brand-border font-medium text-[11px] tabular-nums">
                <Building2 className="w-3 h-3" />
                Cód. {parceiro.CODIGO}
              </span>
            ) : (
              <span className="text-xs text-ek-faint py-0.5">Opcional para vinculação</span>
            )}
          </div>
        </div>

        {/* Solicitante / Coordenador (4 colunas no Desktop) */}
        <div className="lg:col-span-4 flex flex-col">
          <label className="ek-label flex items-center gap-1.5 h-5 mb-1">
            <UserCheck className="w-3.5 h-3.5 text-brand shrink-0" />
            <span>Solicitante (Coordenador)</span>
            <span className="text-[11px] font-normal text-ek-faint">(opcional)</span>
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
              className="ek-select uppercase cursor-pointer font-medium"
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
                className="ek-btn-secondary w-9 px-0 hover:bg-red-50 hover:text-red-700 hover:border-red-200 shrink-0"
                title="Remover Solicitante"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={onOpenNovoSolicitante}
              className="ek-btn-primary w-9 px-0 shrink-0"
              title="Cadastrar Novo Solicitante (+)"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Badges de Contato do Solicitante */}
          <div className="flex flex-wrap gap-1.5 mt-2 text-xs text-ek-muted min-h-[22px]">
            {solicitanteSelecionado?.SOL_TELEFONE && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-ek-raised rounded-[4px] border border-ek-border tabular-nums text-[11px]">
                <Phone className="w-3 h-3 text-ek-faint" />
                {solicitanteSelecionado.SOL_TELEFONE}
              </span>
            )}
            {solicitanteSelecionado?.SOL_REGIAO && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-ek-raised rounded-[4px] border border-ek-border text-[11px] truncate max-w-[200px]">
                <MapPin className="w-3 h-3 text-ek-faint" />
                {solicitanteSelecionado.SOL_REGIAO}
              </span>
            )}
            {!solicitanteSelecionado && (
              <span className="text-xs text-ek-faint py-0.5">Opcional para vinculação</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Metadados do Atendimento (Data, Status, Atendente) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3.5 border-t border-ek-rule">
        <div>
          <label className="ek-label flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-ek-faint" />
            <span>Data de Abertura</span>
          </label>
          <input
            type="date"
            value={formatDataInput(dataAbertura)}
            onChange={(e) => handleDateChange(e.target.value)}
            className="ek-input font-medium"
          />
        </div>

        <div>
          <label className="ek-label flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-ek-faint" />
            <span>Status da OS</span>
            <span className="text-red-600">*</span>
          </label>
          <select
            value={statusOrdem}
            onChange={(e) => setStatusOrdem(e.target.value.toUpperCase())}
            className="ek-select font-semibold uppercase cursor-pointer"
          >
            {listaStatus.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="ek-label flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-ek-faint" />
            <span>Atendente / Resp.</span>
          </label>
          <input
            type="text"
            readOnly
            value={nomeFuncionario || "NÃO INFORMADO"}
            className="ek-input bg-ek-raised text-ek-muted font-medium uppercase truncate"
          />
        </div>
      </div>

      {/* 2.1 Campos Operacionais da OS Aprovada (OM, Pedido de Compras, Previsão de Conclusão e Justificativa) */}
      {statusOrdem === "APROVADO" && (
        <div className="p-3.5 bg-ek-raised rounded-[6px] border border-ek-border flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-semibold text-ek-text flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-brand" />
              <span>Controle Operacional (OS Aprovada)</span>
            </span>
            {isAtrasada && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-800 border border-red-200">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span>Prazo Excedido / Em Atraso</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* OM */}
            <div>
              <label className="ek-label flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-ek-faint" />
                <span>OM</span>
              </label>
              <input
                type="text"
                value={om}
                onChange={(e) => setOm && setOm(e.target.value.toUpperCase())}
                placeholder="Ex: 46118812"
                maxLength={30}
                className="ek-input font-medium uppercase"
              />
            </div>

            {/* PEDIDO DE COMPRAS */}
            <div>
              <label className="ek-label flex items-center gap-1">
                <ShoppingCart className="w-3.5 h-3.5 text-ek-faint" />
                <span>Pedido de Compras</span>
              </label>
              <input
                type="text"
                value={pedidoCompra}
                onChange={(e) => setPedidoCompra && setPedidoCompra(e.target.value.toUpperCase())}
                placeholder="Ex: 4800455455"
                maxLength={30}
                className="ek-input font-medium uppercase"
              />
            </div>

            {/* PREVISÃO DE CONCLUSÃO */}
            <div>
              <label className={`ek-label flex items-center justify-between ${
                isAtrasada ? "text-red-700" : ""
              }`}>
                <span className="flex items-center gap-1">
                  <Clock className={`w-3.5 h-3.5 ${isAtrasada ? "text-red-600" : "text-ek-faint"}`} />
                  <span>Previsão Conclusão</span>
                </span>
                {isAtrasada && <span className="text-[11px] text-red-700 font-semibold">Vencido</span>}
              </label>
              <input
                type="date"
                value={dataPrevisaoConclusao}
                onChange={(e) => setDataPrevisaoConclusao && setDataPrevisaoConclusao(e.target.value)}
                className={`ek-input font-medium ${
                  isAtrasada
                    ? "border-red-300 bg-red-50/40 text-red-900 focus:border-red-500 focus:ring-red-500/15"
                    : ""
                }`}
              />
            </div>
          </div>

          {/* LINHA DE JUSTIFICATIVA DE ATRASO / OBSERVAÇÃO */}
          <div>
            <label className={`ek-label flex items-center justify-between ${
              isAtrasada ? "text-red-800" : ""
            }`}>
              <span className="flex items-center gap-1">
                <AlertCircle className={`w-3.5 h-3.5 ${isAtrasada ? "text-red-600" : "text-ek-faint"}`} />
                <span>Observação / Justificativa do Atraso</span>
              </span>
              {isAtrasada && (
                <span className="text-xs font-medium text-red-700">
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
              className={`ek-input uppercase ${
                isAtrasada
                  ? "border-red-300 bg-red-50/30 text-red-900 focus:border-red-500"
                  : ""
              }`}
            />
          </div>
        </div>
      )}

      {/* 3. Diagnóstico & Solicitação do Cliente (Obrigatório e no fluxo real) */}
      <div className="pt-3.5 border-t border-ek-rule space-y-1.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <label
            htmlFor="solicitacao_cliente_input"
            className="ek-label flex items-center gap-1.5 mb-0 text-ek-text font-medium"
          >
            <MessageSquare className="w-3.5 h-3.5 text-brand shrink-0" />
            <span>Solicitação do Cliente / Diagnóstico Inicial</span>
            <span className="text-red-600">*</span>
          </label>
          <span className="text-xs text-ek-faint tabular-nums">
            {solicitacao.trim() ? `${solicitacao.length} caracteres` : "Preenchimento obrigatório"}
          </span>
        </div>
        <textarea
          id="solicitacao_cliente_input"
          rows={3}
          value={solicitacao}
          onChange={(e) => setSolicitacao(e.target.value.toUpperCase())}
          placeholder="Descreva o que o cliente solicitou ou o diagnóstico inicial do serviço (obrigatório para salvar a ordem)..."
          className={`ek-textarea uppercase resize-y ${
            !solicitacao.trim()
              ? "border-brand-gold/70 bg-brand-goldSoft/25 focus:bg-white"
              : ""
          }`}
        />
      </div>

      {/* 4. Detalhes Fiscais & Faturamento (Seção Recolhível) */}
      <div className="pt-2 border-t border-ek-rule">
        <button
          type="button"
          onClick={() => setShowFiscal(!showFiscal)}
          className="flex items-center gap-1.5 text-xs font-medium text-ek-muted hover:text-ek-text transition-colors py-1"
        >
          {showFiscal ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>Dados Fiscais & Fatura Vinculada</span>
          {codFatura > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full tabular-nums">
              Faturado #{codFatura}
            </span>
          )}
        </button>

        {showFiscal && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2.5 p-3 bg-ek-raised rounded-[6px] border border-ek-border">
            <div>
              <label className="ek-label flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-ek-faint" />
                <span>NF Serviço</span>
              </label>
              <input
                type="text"
                value={nfs}
                onChange={(e) => setNfs(e.target.value.toUpperCase())}
                placeholder="Nº DA NOTA FISCAL"
                className="ek-input uppercase"
              />
            </div>

            <div>
              <label className="ek-label flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-ek-faint" />
                <span>Fatura Vinculada</span>
              </label>
              <input
                type="text"
                readOnly
                value={codFatura > 0 ? `Fatura Vinculada #${codFatura}` : "Não faturado"}
                className={`ek-input font-medium ${
                  codFatura > 0
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-white text-ek-faint"
                }`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
