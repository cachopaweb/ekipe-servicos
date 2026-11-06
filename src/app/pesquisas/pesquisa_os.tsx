"use client";

import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { Search, X, Loader2, FileText, Eye, Check, Package, Wrench, Calendar } from "lucide-react";
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
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-sm animate-fade-in outline-none"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-stone-200/80 overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/80 bg-stone-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-800 tracking-tight">
                Detalhes da OS #{codigoOrdem}
              </h2>
              <p className="text-xs text-stone-500 font-normal">
                Produtos e serviços vinculados a esta ordem de serviço
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Filtro / Resumo */}
        <div className="px-6 py-3 border-b border-stone-200 bg-stone-50/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-stone-200/70 p-1 rounded-lg text-xs font-medium text-stone-600">
            <button
              type="button"
              onClick={() => setTabAtiva("todos")}
              className={`px-3 py-1 rounded-md transition ${
                tabAtiva === "todos"
                  ? "bg-white text-stone-900 shadow-sm font-semibold"
                  : "hover:text-stone-900"
              }`}
            >
              Todos ({produtos.length + servicos.length})
            </button>
            <button
              type="button"
              onClick={() => setTabAtiva("produtos")}
              className={`px-3 py-1 rounded-md transition ${
                tabAtiva === "produtos"
                  ? "bg-white text-stone-900 shadow-sm font-semibold"
                  : "hover:text-stone-900"
              }`}
            >
              Produtos ({produtos.length})
            </button>
            <button
              type="button"
              onClick={() => setTabAtiva("servicos")}
              className={`px-3 py-1 rounded-md transition ${
                tabAtiva === "servicos"
                  ? "bg-white text-stone-900 shadow-sm font-semibold"
                  : "hover:text-stone-900"
              }`}
            >
              Serviços ({servicos.length})
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-stone-600">
            <span>
              Total Produtos:{" "}
              <strong className="text-stone-800 font-mono">{formatCurrency(totalProdutos)}</strong>
            </span>
            <span>
              Total Serviços:{" "}
              <strong className="text-stone-800 font-mono">{formatCurrency(totalServicos)}</strong>
            </span>
            <span className="text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              Total OS: {formatCurrency(totalGeral)}
            </span>
          </div>
        </div>

        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {produtos.length === 0 && servicos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-stone-400 gap-2">
              <Package className="w-8 h-8 text-stone-300" />
              <span className="text-sm font-medium">Nenhum produto ou serviço cadastrado nesta OS.</span>
            </div>
          ) : (
            <>
              {/* Tabela de Produtos */}
              {(tabAtiva === "todos" || tabAtiva === "produtos") && produtos.length > 0 && (
                <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-stone-100/70 border-b border-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider">
                    <Package className="w-4 h-4 text-amber-600" />
                    <span>Produtos ({produtos.length})</span>
                  </div>
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200 uppercase tracking-wider text-[11px]">
                        <th className="p-3 w-16">Cód.</th>
                        <th className="p-3">Descrição do Produto</th>
                        <th className="p-3 text-center">Quant.</th>
                        <th className="p-3 text-center">UN</th>
                        <th className="p-3 text-right">Valor Unit.</th>
                        <th className="p-3 text-right">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {produtos.map((item) => {
                        const unitValue = item.ORE_QUANTIDADE ? item.ORE_VALOR / item.ORE_QUANTIDADE : 0;
                        return (
                          <tr key={item.ORE_CODIGO} className="hover:bg-amber-50/30 transition-colors">
                            <td className="p-3 font-mono text-stone-500">{item.ORE_PRO}</td>
                            <td className="p-3 font-medium text-stone-800">{item.ORE_NOME}</td>
                            <td className="p-3 text-center font-mono">{item.ORE_QUANTIDADE}</td>
                            <td className="p-3 text-center text-stone-500 uppercase">{item.ORE_EMBALAGEM || "UN"}</td>
                            <td className="p-3 text-right font-mono text-stone-600">{formatCurrency(unitValue)}</td>
                            <td className="p-3 text-right font-mono font-medium text-stone-900">{formatCurrency(item.ORE_VALOR)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tabela de Serviços */}
              {(tabAtiva === "todos" || tabAtiva === "servicos") && servicos.length > 0 && (
                <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-stone-100/70 border-b border-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider">
                    <Wrench className="w-4 h-4 text-amber-600" />
                    <span>Serviços ({servicos.length})</span>
                  </div>
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200 uppercase tracking-wider text-[11px]">
                        <th className="p-3 w-16">Cód.</th>
                        <th className="p-3">Descrição do Serviço</th>
                        <th className="p-3 text-center">Quant.</th>
                        <th className="p-3 text-center">UN</th>
                        <th className="p-3 text-right">Valor Unit.</th>
                        <th className="p-3 text-right">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {servicos.map((item) => {
                        const unitValue = item.OS_QUANTIDADE ? item.OS_VALOR / item.OS_QUANTIDADE : 0;
                        return (
                          <tr key={item.OS_CODIGO} className="hover:bg-amber-50/30 transition-colors">
                            <td className="p-3 font-mono text-stone-500">{item.OS_CODIGO}</td>
                            <td className="p-3 font-medium text-stone-800">{item.OS_NOME}</td>
                            <td className="p-3 text-center font-mono">{item.OS_QUANTIDADE}</td>
                            <td className="p-3 text-center text-stone-500 uppercase">{item.OS_UNIDADE_MED || "UN"}</td>
                            <td className="p-3 text-right font-mono text-stone-600">{formatCurrency(unitValue)}</td>
                            <td className="p-3 text-right font-mono font-medium text-stone-900">{formatCurrency(item.OS_VALOR)}</td>
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
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-stone-200/80 bg-stone-50/90 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg shadow-sm transition active:scale-[0.98]"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmarSelecao();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm transition active:scale-[0.98]"
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

  // Lista de status dinâmicos
  const listaStatus = useCallback(() => {
    let list = Object.values(Status).filter((v) => isNaN(Number(v)));
    const mapped = list.map((v) => v.toString().toUpperCase());
    mapped.unshift("TODOS");
    return mapped;
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
      const listaOrdems = await repository.pesquisaOrdem(
        textoBusca.toUpperCase(),
        tipoBusca,
        porPeriodo,
        statusOrdem,
        d1,
        d2
      );
      setOrdems(listaOrdems || []);
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
  }, [textoBusca, tipoBusca, porPeriodo, statusOrdem, data1Str, data2Str]);

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
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-sm animate-fade-in outline-none"
      >
        <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-stone-200/80 overflow-hidden font-sans">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/80 bg-stone-50/90 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-800 tracking-tight">
                  Pesquisa de Ordens de Serviço (OS)
                </h2>
                <p className="text-xs text-stone-500 font-normal">
                  Busque ordens por código, cliente, solicitação ou filtre por período e status
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filtros no Topo */}
          <div className="p-4 border-b border-stone-200 bg-stone-50/60 flex flex-col gap-3 shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Campo de Busca Principal */}
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={inputBuscaRef}
                  type="text"
                  value={textoBusca}
                  onChange={(e) => setTextoBusca(e.target.value)}
                  placeholder="Pesquisar OS..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 uppercase transition"
                />
              </div>

              {/* Tipo de Busca */}
              <div className="md:col-span-3">
                <select
                  value={tipoBusca}
                  onChange={(e) => setTipoBusca(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-stone-700 font-medium transition"
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
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-stone-700 font-medium transition"
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
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200/60">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700 select-none">
                <input
                  type="checkbox"
                  checked={porPeriodo}
                  onChange={(e) => setPorPeriodo(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded border-stone-300 focus:ring-amber-500 focus:ring-offset-0"
                />
                <span>Filtrar por Período de Abertura</span>
              </label>

              {porPeriodo && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-stone-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> De:
                  </span>
                  <input
                    type="date"
                    value={data1Str}
                    onChange={(e) => setData1Str(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-stone-300 rounded-md text-xs text-stone-700 focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-stone-500">Até:</span>
                  <input
                    type="date"
                    value={data2Str}
                    onChange={(e) => setData2Str(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-stone-300 rounded-md text-xs text-stone-700 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Tabela de Resultados */}
          <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-stone-500 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                <span className="text-xs font-medium">Buscando ordens de serviço...</span>
              </div>
            ) : ordems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-2">
                <FileText className="w-8 h-8 text-stone-300" />
                <span className="text-sm font-medium">Nenhuma ordem de serviço encontrada.</span>
                <span className="text-xs text-stone-400">
                  {textoBusca.trim() === "" && !porPeriodo
                    ? "Digite um termo de pesquisa ou selecione um período de busca."
                    : "Verifique os filtros selecionados ou digite outro termo."}
                </span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-100/90 text-stone-600 text-xs font-bold uppercase tracking-wider border-b border-stone-200">
                    <th className="p-3 w-16">Cód.</th>
                    <th className="p-3 w-24">Data</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Solicitação</th>
                    <th className="p-3 text-right">Valor</th>
                    <th className="p-3 text-center">Estado</th>
                    <th className="p-3">Parceiro</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {ordems.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <tr
                        key={item.ORD_CODIGO}
                        onClick={() => selecionarOrdem(item)}
                        className={`cursor-pointer transition-colors text-xs ${
                          isSelected ? "bg-amber-100/70 font-semibold" : "hover:bg-amber-50/40 text-stone-700"
                        }`}
                      >
                        <td className="p-3 font-mono font-medium text-stone-900">{item.ORD_CODIGO}</td>
                        <td className="p-3 font-mono text-stone-600">
                          {item.ORD_DATA ? converterDataFormato(item.ORD_DATA) : "—"}
                        </td>
                        <td className="p-3 font-medium text-stone-800">{item.CLI_NOME || "—"}</td>
                        <td className="p-3 text-stone-600 truncate max-w-xs">{item.ORD_SOLICITACAO || "—"}</td>
                        <td className="p-3 text-right font-mono font-semibold text-stone-900">
                          {formatCurrency(Number(item.ORD_VALOR) || 0)}
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-200 uppercase">
                            {item.ORD_ESTADO || "ABERTO"}
                          </span>
                        </td>
                        <td className="p-3 text-stone-600 truncate max-w-[120px]">
                          {item.PARCEIRO || "SEM PARC."}
                        </td>
                        <td className="p-3 text-right">
                          <div
                            className="inline-flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => visualizarDetalhes(item)}
                              title="Visualizar produtos e serviços da OS"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition"
                            >
                              <Eye className="w-3.5 h-3.5 text-stone-500" />
                              <span>Ver</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => selecionarOrdem(item)}
                              title="Selecionar esta OS"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Escolher</span>
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
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-stone-200/80 bg-stone-50/90 shrink-0">
            <span className="text-xs text-stone-500">
              {ordems.length} {ordems.length === 1 ? "ordem encontrada" : "ordens encontradas"}
            </span>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg shadow-sm transition active:scale-[0.98]"
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
