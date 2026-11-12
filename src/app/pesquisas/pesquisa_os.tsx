"use client";

import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { Search, X, Loader2, FileText, Eye, Check, Package, Wrench, Calendar, AlertTriangle } from "lucide-react";
import OrdemRepository from "../repositories/ordem_repository";
import OrdemModel from "../models/ordem_model";
import OrdEstModel from "../models/ord_est_model";
import OrdSerModel from "../models/ord_ser_model";
import { formatCurrency, Status, toastMixin, converterDataFormato, formatDataInput, parseDataCalendario } from "../functions/utils";

// --- SUB-COMPONENTE MODAL DE DETALHES DESACOPLADO E MODERNO ---
interface ModalDetalhesOSProps {
  isOpen: boolean;
  onClose: () => void;
  codigoOrdem: number;
  produtos: OrdEstModel[];
  servicos: OrdSerModel[];
  onConfirmarSelecao: () => void;
}

function ModalDetalhesOS({
  isOpen,
  onClose,
  codigoOrdem,
  produtos,
  servicos,
  onConfirmarSelecao,
}: ModalDetalhesOSProps) {
  const [tabAtiva, setTabAtiva] = useState<"todos" | "produtos" | "servicos">("todos");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  const totalProdutos = produtos.reduce((acc, p) => acc + (Number(p.ORE_VALOR) || 0), 0);
  const totalServicos = servicos.reduce((acc, s) => acc + (Number(s.OS_VALOR) || 0), 0);
  const totalGeral = totalProdutos + totalServicos;

  return (
    <div
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-slate-950/45 outline-none"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-ek-surface rounded-[8px] border border-ek-border overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ek-border bg-ek-raised shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-1 h-4 bg-brand shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-ek-text tracking-tight">
                Detalhes da OS #{codigoOrdem}
              </h2>
              <p className="text-xs text-ek-muted font-normal">
                Produtos e serviços vinculados a esta ordem de serviço
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[6px] flex items-center justify-center text-ek-muted hover:text-ek-text hover:bg-ek-rule transition-colors"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Filtro / Resumo */}
        <div className="px-6 py-3 border-b border-ek-border bg-ek-surface flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1 bg-ek-raised border border-ek-border p-1 rounded-[6px] text-xs font-medium text-ek-muted">
            <button
              type="button"
              onClick={() => setTabAtiva("todos")}
              className={`px-3 py-1 rounded-[4px] transition-colors ${
                tabAtiva === "todos"
                  ? "bg-ek-surface text-ek-text border border-ek-border font-semibold"
                  : "hover:text-ek-text"
              }`}
            >
              Todos ({produtos.length + servicos.length})
            </button>
            <button
              type="button"
              onClick={() => setTabAtiva("produtos")}
              className={`px-3 py-1 rounded-[4px] transition-colors ${
                tabAtiva === "produtos"
                  ? "bg-ek-surface text-ek-text border border-ek-border font-semibold"
                  : "hover:text-ek-text"
              }`}
            >
              Produtos ({produtos.length})
            </button>
            <button
              type="button"
              onClick={() => setTabAtiva("servicos")}
              className={`px-3 py-1 rounded-[4px] transition-colors ${
                tabAtiva === "servicos"
                  ? "bg-ek-surface text-ek-text border border-ek-border font-semibold"
                  : "hover:text-ek-text"
              }`}
            >
              Serviços ({servicos.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-ek-muted">
            <span>
              Total Produtos:{" "}
              <strong className="text-ek-text font-mono tabular-nums">{formatCurrency(totalProdutos)}</strong>
            </span>
            <span>
              Total Serviços:{" "}
              <strong className="text-ek-text font-mono tabular-nums">{formatCurrency(totalServicos)}</strong>
            </span>
            <span className="text-brand font-semibold bg-brand-soft border border-brand-border px-2.5 py-0.5 rounded-[6px] tabular-nums">
              Total OS: {formatCurrency(totalGeral)}
            </span>
          </div>
        </div>

        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {produtos.length === 0 && servicos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-ek-muted gap-2">
              <Package className="w-8 h-8 text-ek-faint" />
              <span className="text-sm font-medium text-ek-text">Nenhum produto ou serviço cadastrado nesta OS.</span>
            </div>
          ) : (
            <>
              {/* Tabela de Produtos */}
              {(tabAtiva === "todos" || tabAtiva === "produtos") && produtos.length > 0 && (
                <div className="border border-ek-border rounded-[8px] overflow-hidden bg-ek-surface">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-ek-raised border-b border-ek-border text-ek-text text-xs font-semibold">
                    <Package className="w-4 h-4 text-brand" />
                    <span>Produtos ({produtos.length})</span>
                  </div>
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-ek-raised text-ek-muted font-semibold border-b border-ek-border text-xs">
                        <th className="p-3 w-16">Cód.</th>
                        <th className="p-3">Descrição do Produto</th>
                        <th className="p-3 text-center">Quant.</th>
                        <th className="p-3 text-center">UN</th>
                        <th className="p-3 text-right">Valor Unit.</th>
                        <th className="p-3 text-right">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ek-rule">
                      {produtos.map((item) => {
                        const unitValue = item.ORE_QUANTIDADE ? item.ORE_VALOR / item.ORE_QUANTIDADE : 0;
                        return (
                          <tr key={item.ORE_CODIGO} className="hover:bg-ek-raised transition-colors">
                            <td className="p-3 font-mono text-ek-muted tabular-nums">{item.ORE_PRO}</td>
                            <td className="p-3 font-medium text-ek-text">{item.ORE_NOME}</td>
                            <td className="p-3 text-center font-mono tabular-nums">{item.ORE_QUANTIDADE}</td>
                            <td className="p-3 text-center text-ek-muted uppercase">{item.ORE_EMBALAGEM || "UN"}</td>
                            <td className="p-3 text-right font-mono text-ek-muted tabular-nums">{formatCurrency(unitValue)}</td>
                            <td className="p-3 text-right font-mono font-medium text-ek-text tabular-nums">{formatCurrency(item.ORE_VALOR)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tabela de Serviços */}
              {(tabAtiva === "todos" || tabAtiva === "servicos") && servicos.length > 0 && (
                <div className="border border-ek-border rounded-[8px] overflow-hidden bg-ek-surface">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-ek-raised border-b border-ek-border text-ek-text text-xs font-semibold">
                    <Wrench className="w-4 h-4 text-brand" />
                    <span>Serviços ({servicos.length})</span>
                  </div>
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-ek-raised text-ek-muted font-semibold border-b border-ek-border text-xs">
                        <th className="p-3 w-16">Cód.</th>
                        <th className="p-3">Descrição do Serviço</th>
                        <th className="p-3 text-center">Quant.</th>
                        <th className="p-3 text-center">UN</th>
                        <th className="p-3 text-right">Valor Unit.</th>
                        <th className="p-3 text-right">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ek-rule">
                      {servicos.map((item) => {
                        const unitValue = item.OS_QUANTIDADE ? item.OS_VALOR / item.OS_QUANTIDADE : 0;
                        return (
                          <tr key={item.OS_CODIGO} className="hover:bg-ek-raised transition-colors">
                            <td className="p-3 font-mono text-ek-muted tabular-nums">{item.OS_CODIGO}</td>
                            <td className="p-3 font-medium text-ek-text">{item.OS_NOME}</td>
                            <td className="p-3 text-center font-mono tabular-nums">{item.OS_QUANTIDADE}</td>
                            <td className="p-3 text-center text-ek-muted uppercase">{item.OS_UNIDADE_MED || "UN"}</td>
                            <td className="p-3 text-right font-mono text-ek-muted tabular-nums">{formatCurrency(unitValue)}</td>
                            <td className="p-3 text-right font-mono font-medium text-ek-text tabular-nums">{formatCurrency(item.OS_VALOR)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-ek-border bg-ek-raised shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="ek-btn-secondary"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmarSelecao();
              onClose();
            }}
            className="ek-btn-primary"
          >
            <Check className="w-4 h-4" />
            <span>Selecionar esta OS</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL: PESQUISA ORDEM ---
type PesquisaOrdemParams = {
  showModal?: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  OrdemSelecionado: number;
  setOrdemSelecionado: Dispatch<SetStateAction<number>>;
  setBuscouOrdem: Dispatch<SetStateAction<boolean>>;
  isOpen?: boolean;
  onClose?: () => void;
};

export default function PesquisaOrdem({
  showModal,
  setShowModal,
  setOrdemSelecionado,
  setBuscouOrdem,
  isOpen,
  onClose,
}: PesquisaOrdemParams) {
  const activeIsOpen = isOpen !== undefined ? isOpen : (showModal ?? true);

  const [ordems, setOrdems] = useState<OrdemModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [data1Str, setData1Str] = useState(() => formatDataInput(new Date()));
  const [data2Str, setData2Str] = useState(() => formatDataInput(new Date()));
  const [statusOrdem, setStatusOrdem] = useState("TODOS");
  const [tipoBusca, setTipoBusca] = useState("Nome");
  const [textoBusca, setTextoBusca] = useState("");
  const [porPeriodo, setPorPeriodo] = useState(false);

  const [listaProdutosInseridos, setListaProdutosInseridos] = useState<OrdEstModel[]>([]);
  const [listaServicosInseridos, setListaServicosInseridos] = useState<OrdSerModel[]>([]);
  const [codOrdemSelecionada, setCodOrdemSelecionada] = useState(0);
  const [showModalDetalhes, setShowModalDetalhes] = useState(false);

  const inputBuscaRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setShowModal(false);
    if (onClose) onClose();
  }, [setShowModal, onClose]);

  // Função auxiliar para verificar se a OS aprovada está com prazo estourado
  const isOrdemAtrasada = useCallback((item: OrdemModel): boolean => {
    if (item.ORD_ESTADO !== "APROVADO" || !item.ORD_PREVISAO_CONCLUSAO) return false;
    const prevStr = formatDataInput(parseDataCalendario(item.ORD_PREVISAO_CONCLUSAO));
    if (!prevStr || prevStr === "1900-01-01") return false;
    const hojeStr = formatDataInput(new Date());
    return prevStr < hojeStr;
  }, []);

  // Lista de status dinâmicos (incluindo filtro rápido para ATRASADAS)
  const listaStatus = useCallback(() => {
    let list = Object.values(Status).filter((v) => isNaN(Number(v)));
    const mapped = list.map((v) => v.toString().toUpperCase());
    return ["TODOS", "ATRASADAS", ...mapped];
  }, []);

  // Foco inicial
  useEffect(() => {
    if (activeIsOpen) {
      const timer = setTimeout(() => inputBuscaRef.current?.focus(), 60);
      return () => clearTimeout(timer);
    }
  }, [activeIsOpen]);

  // Buscar ordens
  const buscarOrdemModel = useCallback(async () => {
    if (!porPeriodo && textoBusca.trim() === "") {
      setOrdems([]);
      return;
    }

    setLoading(true);
    try {
      const repository = new OrdemRepository();
      const d1 = data1Str ? parseDataCalendario(data1Str) : new Date();
      const d2 = data2Str ? parseDataCalendario(data2Str) : new Date();
      const statusParam = statusOrdem === "ATRASADAS" ? "APROVADO" : statusOrdem;
      const listaOrdems = await repository.pesquisaOrdem(
        textoBusca.toUpperCase(),
        tipoBusca,
        porPeriodo,
        statusParam,
        d1,
        d2
      );
      const resultadoFinal = statusOrdem === "ATRASADAS"
        ? (listaOrdems || []).filter(isOrdemAtrasada)
        : (listaOrdems || []);
      setOrdems(resultadoFinal);
      setSelectedIndex(0);
    } catch (error) {
      toastMixin.fire({
        title: "Erro ao pesquisar ordens",
        text: String(error),
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [textoBusca, tipoBusca, porPeriodo, statusOrdem, data1Str, data2Str, isOrdemAtrasada]);

  // Debounce na busca
  useEffect(() => {
    if (!activeIsOpen) return;
    const timer = setTimeout(() => {
      buscarOrdemModel();
    }, 300);
    return () => clearTimeout(timer);
  }, [buscarOrdemModel, activeIsOpen]);

  // Abrir detalhes com produtos e serviços
  const visualizarDetalhes = async (model: OrdemModel) => {
    const codigoOrdem = model.ORD_CODIGO;
    setCodOrdemSelecionada(codigoOrdem);

    try {
      const repository = new OrdemRepository();
      const [produtos, servicos] = await Promise.all([
        repository.buscaProdutosOrdem(codigoOrdem),
        repository.buscaServicosOrdem(codigoOrdem),
      ]);

      setListaProdutosInseridos(Array.isArray(produtos) ? produtos : []);
      setListaServicosInseridos(Array.isArray(servicos) ? servicos : []);
      setShowModalDetalhes(true);
    } catch (error) {
      toastMixin.fire({
        title: "Erro ao carregar detalhes da OS",
        text: String(error),
        icon: "error",
      });
    }
  };

  // Selecionar ordem diretamente
  const selecionarOrdem = useCallback(
    (model: OrdemModel) => {
      setOrdemSelecionado(model.ORD_CODIGO);
      setBuscouOrdem(true);
      handleClose();
    },
    [setOrdemSelecionado, setBuscouOrdem, handleClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (showModalDetalhes) return; // Se modal de detalhes estiver aberta, deixa ela tratar
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, ordems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && ordems[selectedIndex]) {
        e.preventDefault();
        selecionarOrdem(ordems[selectedIndex]);
      }
    },
    [showModalDetalhes, ordems, selectedIndex, selecionarOrdem, handleClose]
  );

  if (!activeIsOpen) return null;

  return (
    <>
      <div
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/45 outline-none"
      >
        <div className="relative w-full max-w-6xl xl:max-w-7xl max-h-[90vh] flex flex-col bg-ek-surface rounded-[8px] border border-ek-border overflow-hidden font-sans">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-ek-border bg-ek-raised shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-1 h-4 bg-brand shrink-0" />
              <div>
                <h2 className="text-base font-semibold text-ek-text tracking-tight">
                  Pesquisa de Ordens de Serviço (OS)
                </h2>
                <p className="text-xs text-ek-muted font-normal">
                  Busque ordens por código, cliente, solicitação ou filtre por período e status
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-[6px] flex items-center justify-center text-ek-muted hover:text-ek-text hover:bg-ek-rule transition-colors"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filtros no Topo */}
          <div className="p-4 border-b border-ek-border bg-ek-surface flex flex-col gap-3 shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Campo de Busca Principal */}
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 text-ek-faint absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={inputBuscaRef}
                  type="text"
                  value={textoBusca}
                  onChange={(e) => setTextoBusca(e.target.value)}
                  placeholder="Pesquisar OS..."
                  className="ek-input pl-9 pr-4 uppercase"
                />
              </div>

              {/* Tipo de Busca */}
              <div className="md:col-span-3">
                <select
                  value={tipoBusca}
                  onChange={(e) => setTipoBusca(e.target.value)}
                  className="ek-select"
                >
                  <option value="Nome">Buscar por: Nome Cliente</option>
                  <option value="Codigo">Buscar por: Código OS</option>
                  <option value="Solicitacao">Buscar por: Solicitação</option>
                </select>
              </div>

              {/* Status */}
              <div className="md:col-span-4">
                <select
                  value={statusOrdem}
                  onChange={(e) => setStatusOrdem(e.target.value)}
                  className="ek-select"
                >
                  {listaStatus().map((status) => (
                    <option key={status} value={status}>
                      Status: {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Linha Secundária: Período de Datas */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-ek-rule">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-ek-text select-none">
                <input
                  type="checkbox"
                  checked={porPeriodo}
                  onChange={(e) => setPorPeriodo(e.target.checked)}
                  className="w-4 h-4 accent-[#312783] rounded border-ek-control"
                />
                <span>Filtrar por Período de Abertura</span>
              </label>

              {porPeriodo && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-ek-muted flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> De:
                  </span>
                  <input
                    type="date"
                    value={data1Str}
                    onChange={(e) => setData1Str(e.target.value)}
                    className="ek-input h-8 w-auto px-2.5 text-xs"
                  />
                  <span className="text-ek-muted">Até:</span>
                  <input
                    type="date"
                    value={data2Str}
                    onChange={(e) => setData2Str(e.target.value)}
                    className="ek-input h-8 w-auto px-2.5 text-xs"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Tabela de Resultados */}
          <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-ek-muted gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-brand" />
                <span className="text-xs font-medium">Buscando ordens de serviço...</span>
              </div>
            ) : ordems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-ek-muted gap-2">
                <FileText className="w-8 h-8 text-ek-faint" />
                <span className="text-sm font-medium text-ek-text">Nenhuma ordem de serviço encontrada.</span>
                <span className="text-xs text-ek-muted">
                  {textoBusca.trim() === "" && !porPeriodo
                    ? "Digite um termo de pesquisa ou selecione um período de busca."
                    : "Verifique os filtros selecionados ou digite outro termo."}
                </span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-ek-raised text-ek-muted text-xs font-semibold border-b border-ek-border">
                    <th className="p-3 w-16 whitespace-nowrap">Cód.</th>
                    <th className="p-3 w-24 whitespace-nowrap">Data</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Solicitação</th>
                    <th className="p-3 text-right whitespace-nowrap">Valor</th>
                    <th className="p-3 text-center whitespace-nowrap">Estado</th>
                    <th className="p-3">Parceiro</th>
                    <th className="p-3 text-right whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ek-rule">
                  {ordems.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <tr
                        key={item.ORD_CODIGO}
                        onClick={() => selecionarOrdem(item)}
                        className={`cursor-pointer transition-colors text-xs ${
                          isSelected ? "bg-brand-soft font-semibold text-ek-text" : "hover:bg-ek-raised text-ek-text"
                        }`}
                      >
                        <td className="p-3 font-mono font-medium text-ek-text whitespace-nowrap tabular-nums">{item.ORD_CODIGO}</td>
                        <td className="p-3 font-mono text-ek-muted whitespace-nowrap tabular-nums">
                          {item.ORD_DATA ? converterDataFormato(item.ORD_DATA) : "-"}
                        </td>
                        <td className="p-3 font-medium text-ek-text">{item.CLI_NOME || "-"}</td>
                        <td className="p-3 text-ek-muted">
                          <div className="font-medium line-clamp-2">{item.ORD_SOLICITACAO || "-"}</div>
                          {(item.ORD_OM || item.ORD_PEDIDO_COMPRA) && (
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-ek-muted mt-1 font-mono">
                              {item.ORD_OM && (
                                <span className="bg-ek-raised px-1.5 py-0.5 rounded-[4px] border border-ek-border whitespace-nowrap">
                                  OM: <strong className="text-ek-text">{item.ORD_OM}</strong>
                                </span>
                              )}
                              {item.ORD_PEDIDO_COMPRA && (
                                <span className="bg-ek-raised px-1.5 py-0.5 rounded-[4px] border border-ek-border whitespace-nowrap">
                                  Ped: <strong className="text-ek-text">{item.ORD_PEDIDO_COMPRA}</strong>
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-ek-text whitespace-nowrap tabular-nums">
                          {formatCurrency(Number(item.ORD_VALOR) || 0)}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-[4px] text-[11px] font-semibold uppercase whitespace-nowrap ${
                                item.ORD_ESTADO === "APROVADO"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-ek-raised text-ek-muted border border-ek-border"
                              }`}
                            >
                              {item.ORD_ESTADO || "ABERTO"}
                            </span>
                            {isOrdemAtrasada(item) && (
                              <span
                                title={
                                  item.ORD_JUSTIFICATIVA_ATRASO
                                    ? `Prazo de conclusão expirado (${converterDataFormato(item.ORD_PREVISAO_CONCLUSAO || "")})!\nJustificativa: ${item.ORD_JUSTIFICATIVA_ATRASO}`
                                    : `Prazo de conclusão expirado (${converterDataFormato(item.ORD_PREVISAO_CONCLUSAO || "")})!`
                                }
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 cursor-help whitespace-nowrap"
                              >
                                <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                                <span>Atrasada</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-ek-muted">
                          <span className="truncate block max-w-[150px]" title={item.PARCEIRO || "SEM PARC."}>
                            {item.PARCEIRO || "SEM PARC."}
                          </span>
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <div
                            className="inline-flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => visualizarDetalhes(item)}
                              title="Visualizar produtos e serviços da OS"
                              aria-label="Visualizar produtos e serviços da OS"
                              className="p-1.5 text-ek-muted hover:text-ek-text bg-ek-raised hover:bg-ek-rule border border-ek-border rounded-[6px] transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => selecionarOrdem(item)}
                              title="Selecionar esta OS"
                              aria-label="Selecionar esta OS"
                              className="p-1.5 text-brand hover:text-brand-hover bg-brand-soft border border-brand-border rounded-[6px] transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-ek-border bg-ek-raised shrink-0">
            <span className="text-xs text-ek-muted tabular-nums">
              {ordems.length} {ordems.length === 1 ? "ordem encontrada" : "ordens encontradas"}
            </span>
            <button
              type="button"
              onClick={handleClose}
              className="ek-btn-secondary"
            >
              Fechar (Esc)
            </button>
          </div>
        </div>
      </div>

      {/* Sub-modal: Detalhes da Ordem (Produtos e Serviços) Desacoplada */}
      <ModalDetalhesOS
        isOpen={showModalDetalhes}
        onClose={() => setShowModalDetalhes(false)}
        codigoOrdem={codOrdemSelecionada}
        produtos={listaProdutosInseridos}
        servicos={listaServicosInseridos}
        onConfirmarSelecao={() => {
          setOrdemSelecionado(codOrdemSelecionada);
          setBuscouOrdem(true);
          setShowModalDetalhes(false);
          handleClose();
        }}
      />
    </>
  );
}
