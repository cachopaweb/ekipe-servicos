"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useReactToPrint } from "react-to-print";
import {
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  RefreshCw,
  Search,
  Calendar,
  Building2,
  UserCheck,
  DollarSign,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Layers,
  ArrowUpDown,
  X,
} from "lucide-react";
import RelatorioRepository from "@/app/repositories/relatorio_repository";
import { ItemRelatorioEmpreitada, FiltroRelatorioParams } from "@/app/models/relatorio_model";
import { exportarRelatorioParaExcel, exportarRelatorioParaCSV } from "@/app/functions/export_excel";
import PrintRelatorioEmpreitadas from "@/components/component/print_relatorio_empreitadas";
import { mascaraMoeda, toastMixin } from "@/app/functions/utils";

// Helpers para cálculo de datas em formato YYYY-MM-DD
function getPrimeiroDiaMes(d: Date): string {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}-01`;
}

function getUltimoDiaMes(d: Date): string {
  const ano = d.getFullYear();
  const mes = d.getMonth() + 1;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  return `${ano}-${String(mes).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;
}

function formatarDataIso(d: Date): string {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function formatarDataBr(dataStr?: string): string {
  if (!dataStr) return "-";
  if (dataStr.includes("/")) return dataStr;
  const parts = dataStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dataStr;
}

export default function RelatoriosPage() {
  const repo = useMemo(() => new RelatorioRepository(), []);

  // Datas padrão: mês atual
  const hoje = useMemo(() => new Date(), []);
  const [dataInicio, setDataInicio] = useState<string>(() => getPrimeiroDiaMes(hoje));
  const [dataFim, setDataFim] = useState<string>(() => getUltimoDiaMes(hoje));
  const [clienteId, setClienteId] = useState<number>(0);
  const [coordenador, setCoordenador] = useState<string>("");
  const [filtroTexto, setFiltroTexto] = useState<string>("");

  // Listas de apoio
  const [listaClientes, setListaClientes] = useState<{ CODIGO: number; NOME: string }[]>([]);
  const [listaCoordenadores, setListaCoordenadores] = useState<string[]>([]);

  // Dados do relatório
  const [dados, setDados] = useState<ItemRelatorioEmpreitada[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);

  // Ref de impressão
  const printRef = useRef<HTMLDivElement>(null);

  const periodoStr = useMemo(() => {
    if (dataInicio && dataFim) {
      return `${formatarDataBr(dataInicio)} até ${formatarDataBr(dataFim)}`;
    }
    if (dataInicio) return `A partir de ${formatarDataBr(dataInicio)}`;
    if (dataFim) return `Até ${formatarDataBr(dataFim)}`;
    return "Todo o Histórico";
  }, [dataInicio, dataFim]);

  const clienteSelecionadoNome = useMemo(() => {
    if (!clienteId) return undefined;
    const c = listaClientes.find((item) => item.CODIGO === Number(clienteId));
    return c ? c.NOME : undefined;
  }, [clienteId, listaClientes]);

  // Hook de Impressão nativa do navegador
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Relatorio_Atendimentos_Ekipe_${dataInicio || "inicio"}_${dataFim || "fim"}`,
    pageStyle: `
      @page {
        size: A4 landscape;
        margin: 10mm 15mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `,
  });

  // Carrega opções de clientes e coordenadores ao montar a tela
  useEffect(() => {
    async function carregarFiltrosIniciais() {
      try {
        const [clientes, coords] = await Promise.all([
          repo.getClientesParaRelatorio(),
          repo.getCoordenadoresParaRelatorio(),
        ]);
        setListaClientes(clientes);
        setListaCoordenadores(coords);
      } catch (err) {
        console.error("Erro ao carregar listas de filtros:", err);
      }
    }
    carregarFiltrosIniciais();
  }, [repo]);

  // Função principal de busca de dados
  const buscarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const filtros: FiltroRelatorioParams = {
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
        clienteId: clienteId > 0 ? Number(clienteId) : undefined,
        coordenador: coordenador ? coordenador : undefined,
      };

      const resultado = await repo.getRelatorioEmpreitadas(filtros);
      setDados(resultado);
    } catch (err: any) {
      console.error("Erro ao carregar relatório:", err);
      toastMixin.fire({
        icon: "error",
        title: "Erro ao consultar dados",
        text: err?.message || "Ocorreu um erro ao buscar o relatório.",
      });
    } finally {
      setCarregando(false);
    }
  }, [repo, dataInicio, dataFim, clienteId, coordenador]);

  // Executa a busca ao inicializar
  useEffect(() => {
    buscarDados();
  }, [buscarDados]);

  // Filtros rápidos de data
  const aplicarPresetData = (tipo: "esteMes" | "mesAnterior" | "ultimos30" | "anoAtual" | "todos") => {
    const ref = new Date();
    if (tipo === "esteMes") {
      setDataInicio(getPrimeiroDiaMes(ref));
      setDataFim(getUltimoDiaMes(ref));
    } else if (tipo === "mesAnterior") {
      const mesPassado = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
      setDataInicio(getPrimeiroDiaMes(mesPassado));
      setDataFim(getUltimoDiaMes(mesPassado));
    } else if (tipo === "ultimos30") {
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(ref.getDate() - 30);
      setDataInicio(formatarDataIso(trintaDiasAtras));
      setDataFim(formatarDataIso(ref));
    } else if (tipo === "anoAtual") {
      setDataInicio(`${ref.getFullYear()}-01-01`);
      setDataFim(`${ref.getFullYear()}-12-31`);
    } else if (tipo === "todos") {
      setDataInicio("");
      setDataFim("");
    }
  };

  // Filtragem local rápida por texto
  const dadosFiltrados = useMemo(() => {
    if (!filtroTexto.trim()) return dados;
    const busca = filtroTexto.toLowerCase().trim();

    return dados.filter((item) => {
      const protocolo = String(item.EMP_PROTOCOLO || "").toLowerCase();
      const nf = String(item.EMP_NFS || "").toLowerCase();
      const loja = String(item.EMP_LOJA || "").toLowerCase();
      const om = String(item.ORD_OM || "").toLowerCase();
      const pedido = String(item.EMP_PEDIDO || "").toLowerCase();
      const cliente = String(item.CLI_NOME || "").toLowerCase();
      const coord = String(item.EMP_COORDENADOR || "").toLowerCase();
      const os = String(item.EMP_ORD || "").toLowerCase();
      const servicos = (item.ITENS || []).map((s) => s.DESCRICAO?.toLowerCase() || "").join(" ");

      return (
        protocolo.includes(busca) ||
        nf.includes(busca) ||
        loja.includes(busca) ||
        om.includes(busca) ||
        pedido.includes(busca) ||
        cliente.includes(busca) ||
        coord.includes(busca) ||
        os.includes(busca) ||
        servicos.includes(busca)
      );
    });
  }, [dados, filtroTexto]);

  // Cálculos consolidados
  const totalAtendimentos = dadosFiltrados.length;
  const totalServicos = dadosFiltrados.reduce((acc, curr) => acc + (curr.ITENS?.length || 1), 0);
  const totalValorNf = dadosFiltrados.reduce((acc, curr) => acc + (curr.EMP_VALOR || 0), 0);
  const totalRecebido = dadosFiltrados.reduce((acc, curr) => acc + (curr.VALOR_RECEBIDO || 0), 0);
  const saldoPendente = totalValorNf - totalRecebido;

  // Ações de Exportação
  const handleExportarExcel = () => {
    if (dadosFiltrados.length === 0) {
      toastMixin.fire({
        icon: "warning",
        title: "Nenhum registro para exportar",
      });
      return;
    }
    const nome = `Relatorio_Atendimentos_${dataInicio || "inicio"}_${dataFim || "fim"}`;
    exportarRelatorioParaExcel(dadosFiltrados, nome);
    toastMixin.fire({
      icon: "success",
      title: "Planilha Excel exportada com sucesso!",
    });
  };

  const handleExportarCSV = () => {
    if (dadosFiltrados.length === 0) {
      toastMixin.fire({
        icon: "warning",
        title: "Nenhum registro para exportar",
      });
      return;
    }
    const nome = `Relatorio_Atendimentos_${dataInicio || "inicio"}_${dataFim || "fim"}`;
    exportarRelatorioParaCSV(dadosFiltrados, nome);
    toastMixin.fire({
      icon: "success",
      title: "Arquivo CSV exportado com sucesso!",
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-full bg-ek-surface p-4 sm:p-6 lg:p-8">
      {/* 1. TOPO: Título, Descrição e Botões de Exportação */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-ek-border">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-ek-muted mb-1">
            <span>Relatórios gerenciais</span>
            <ChevronRight className="w-3.5 h-3.5 text-ek-faint" />
            <span className="text-brand font-semibold">Atendimentos &amp; Empreitadas</span>
          </div>
          <h1 className="text-[22px] font-bold text-ek-text tracking-[-0.02em] flex items-center gap-2.5">
            <span className="inline-block w-1 h-5 rounded-full bg-brand-gold shrink-0" aria-hidden="true" />
            <span>Relatório de Atendimentos &amp; Empreitadas</span>
          </h1>
          <p className="text-xs text-ek-muted mt-1 pl-3.5">
            Consolidação de protocolos, notas fiscais, lojas, pedidos, serviços executados e controle de faturamento
          </p>
        </div>

        {/* Botões de Ação / Exportação */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportarExcel}
            disabled={carregando || dadosFiltrados.length === 0}
            className="h-9 px-3.5 rounded-[6px] border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[13px] font-medium inline-flex items-center gap-2 transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
            title="Baixar planilha formatada em Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={handleExportarCSV}
            disabled={carregando || dadosFiltrados.length === 0}
            className="ek-btn-secondary disabled:opacity-45 disabled:cursor-not-allowed"
            title="Exportar arquivo CSV separado por ponto e vírgula"
          >
            <Download className="w-4 h-4 text-ek-muted" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={() => handlePrint()}
            disabled={carregando || dadosFiltrados.length === 0}
            className="ek-btn-primary disabled:opacity-45 disabled:cursor-not-allowed"
            title="Imprimir relatório ou Salvar em PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* 2. PAINEL DE FILTROS */}
      <div className="ek-card p-4 mt-5">
        <div className="flex flex-col gap-3">
          {/* Linha de Atalhos Rápidos de Período */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ek-rule pb-3">
            <span className="text-xs font-semibold text-ek-muted flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand" />
              Período rápido
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => aplicarPresetData("esteMes")}
                className="px-2.5 py-1 text-xs font-medium rounded-[6px] bg-ek-raised border border-ek-border hover:border-brand-border hover:bg-brand-soft text-ek-text hover:text-brand transition-colors"
              >
                Este mês
              </button>
              <button
                type="button"
                onClick={() => aplicarPresetData("mesAnterior")}
                className="px-2.5 py-1 text-xs font-medium rounded-[6px] bg-ek-raised border border-ek-border hover:border-brand-border hover:bg-brand-soft text-ek-text hover:text-brand transition-colors"
              >
                Mês anterior
              </button>
              <button
                type="button"
                onClick={() => aplicarPresetData("ultimos30")}
                className="px-2.5 py-1 text-xs font-medium rounded-[6px] bg-ek-raised border border-ek-border hover:border-brand-border hover:bg-brand-soft text-ek-text hover:text-brand transition-colors"
              >
                Últimos 30 dias
              </button>
              <button
                type="button"
                onClick={() => aplicarPresetData("anoAtual")}
                className="px-2.5 py-1 text-xs font-medium rounded-[6px] bg-ek-raised border border-ek-border hover:border-brand-border hover:bg-brand-soft text-ek-text hover:text-brand transition-colors"
              >
                Ano atual
              </button>
              <button
                type="button"
                onClick={() => aplicarPresetData("todos")}
                className="px-2.5 py-1 text-xs font-medium rounded-[6px] bg-ek-raised border border-ek-border hover:bg-ek-active text-ek-muted transition-colors"
              >
                Todo histórico
              </button>
            </div>
          </div>

          {/* Grid de Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            {/* Data Início */}
            <div>
              <label className="ek-label">Data início</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="ek-input text-xs tabular-nums"
              />
            </div>

            {/* Data Fim */}
            <div>
              <label className="ek-label">Data fim</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="ek-input text-xs tabular-nums"
              />
            </div>

            {/* Filtro por Cliente */}
            <div>
              <label className="ek-label flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-ek-faint" />
                Cliente
              </label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(Number(e.target.value))}
                className="ek-select text-xs truncate"
              >
                <option value={0}>Todos os Clientes ({listaClientes.length})</option>
                {listaClientes.map((cli) => (
                  <option key={cli.CODIGO} value={cli.CODIGO}>
                    {cli.NOME}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Coordenador */}
            <div>
              <label className="ek-label flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-ek-faint" />
                Coordenador
              </label>
              <select
                value={coordenador}
                onChange={(e) => setCoordenador(e.target.value)}
                className="ek-select text-xs truncate"
              >
                <option value="">Todos os Coordenadores</option>
                {listaCoordenadores.map((coord, i) => (
                  <option key={i} value={coord}>
                    {coord}
                  </option>
                ))}
              </select>
            </div>

            {/* Botão de Atualizar Consulta */}
            <div>
              <button
                type="button"
                onClick={buscarDados}
                disabled={carregando}
                className="ek-btn-primary w-full justify-center text-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${carregando ? "animate-spin" : ""}`} />
                <span>{carregando ? "Carregando..." : "Atualizar filtros"}</span>
              </button>
            </div>
          </div>

          {/* Linha de Busca Instantânea */}
          <div className="pt-2.5 border-t border-ek-rule flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-ek-faint absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                placeholder="Busca rápida por Protocolo, NF, OM, Pedido, Loja, Serviço, Coordenador..."
                className="ek-input pl-9 pr-8 text-xs"
              />
              {filtroTexto && (
                <button
                  type="button"
                  onClick={() => setFiltroTexto("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ek-faint hover:text-ek-text"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {filtroTexto && (
              <span className="text-xs text-ek-muted shrink-0 tabular-nums">
                Mostrando <b>{dadosFiltrados.length}</b> de <b>{dados.length}</b>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. FAIXA DE RESUMO CONSOLIDADO */}
      <div className="ek-card mt-4 grid grid-cols-2 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-ek-border">
        <div className="px-4 py-3.5 flex items-center justify-between gap-2">
          <div>
            <span className="text-xs font-medium text-ek-muted block">Atendimentos</span>
            <span className="text-xl font-bold text-ek-text tabular-nums">{totalAtendimentos}</span>
          </div>
          <Layers className="w-4 h-4 text-brand shrink-0" />
        </div>

        <div className="px-4 py-3.5 flex items-center justify-between gap-2">
          <div>
            <span className="text-xs font-medium text-ek-muted block">Qtd serviços</span>
            <span className="text-xl font-bold text-ek-text tabular-nums">{totalServicos}</span>
          </div>
          <Filter className="w-4 h-4 text-ek-muted shrink-0" />
        </div>

        <div className="px-4 py-3.5 flex items-center justify-between gap-2">
          <div>
            <span className="text-xs font-medium text-ek-muted block">Total faturado (NF)</span>
            <span className="text-lg font-bold text-ek-text tabular-nums">{mascaraMoeda(totalValorNf)}</span>
          </div>
          <DollarSign className="w-4 h-4 text-ek-muted shrink-0" />
        </div>

        <div className="px-4 py-3.5 flex items-center justify-between gap-2">
          <div>
            <span className="text-xs font-medium text-ek-muted block">Total recebido</span>
            <span className="text-lg font-bold text-emerald-700 tabular-nums">{mascaraMoeda(totalRecebido)}</span>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        </div>

        <div className="px-4 py-3.5 flex items-center justify-between gap-2 col-span-2 lg:col-span-1">
          <div>
            <span className="text-xs font-medium text-ek-muted block">Saldo pendente</span>
            <span className={`text-lg font-bold tabular-nums ${saldoPendente > 0 ? "text-brand-goldInk" : "text-ek-text"}`}>
              {mascaraMoeda(saldoPendente)}
            </span>
          </div>
          <Clock className="w-4 h-4 text-ek-faint shrink-0" />
        </div>
      </div>

      {/* 4. TABELA DE REGISTROS */}
      <div className="ek-card overflow-hidden mt-4 flex-1 flex flex-col">
        <div className="px-4 py-3 bg-ek-raised border-b border-ek-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ek-text">
              Atendimentos encontrados
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-[6px] bg-brand-soft text-brand border border-brand-border tabular-nums">
              {dadosFiltrados.length}
            </span>
          </div>

          <span className="text-xs text-ek-muted font-medium hidden sm:inline tabular-nums">
            Período: <b className="text-ek-text">{periodoStr}</b>
          </span>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-ek-raised text-ek-muted font-semibold text-xs border-b border-ek-border">
                <th className="py-2.5 px-3 text-center">#</th>
                <th className="py-2.5 px-3">Protocolo</th>
                <th className="py-2.5 px-3">Nota fiscal</th>
                <th className="py-2.5 px-3 text-center">Loja</th>
                <th className="py-2.5 px-3">OM</th>
                <th className="py-2.5 px-3">Pedido compras</th>
                <th className="py-2.5 px-3 min-w-[240px]">Serviço(s)</th>
                <th className="py-2.5 px-3 text-right">Valor NF</th>
                <th className="py-2.5 px-3 text-center">Data emissão</th>
                <th className="py-2.5 px-3 text-right">Recebido</th>
                <th className="py-2.5 px-3">Coordenador</th>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ek-rule">
              {carregando ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-ek-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-7 w-7 border-2 border-ek-border border-t-brand" />
                      <span className="text-xs font-medium">Buscando dados no servidor...</span>
                    </div>
                  </td>
                </tr>
              ) : dadosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-ek-muted">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <FileSpreadsheet className="w-9 h-9 text-ek-faint mb-1" />
                      <span className="text-sm font-semibold text-ek-text">
                        Nenhum atendimento encontrado
                      </span>
                      <span className="text-xs text-ek-muted">
                        Tente ajustar os filtros de data, cliente ou termos de busca.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                dadosFiltrados.map((item, index) => {
                  const valorNf = Number(item.EMP_VALOR || 0);
                  const valorRec = Number(item.VALOR_RECEBIDO || 0);
                  const estaPago = valorRec >= valorNf && valorNf > 0;
                  const pagoParcial = valorRec > 0 && valorRec < valorNf;

                  return (
                    <tr
                      key={`${item.EMP_CODIGO}_${index}`}
                      className="hover:bg-ek-raised/70 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-center text-ek-faint font-mono text-xs tabular-nums">
                        {index + 1}
                      </td>

                      <td className="py-2.5 px-3">
                        {item.EMP_PROTOCOLO ? (
                          <span className="font-mono font-semibold text-brand bg-brand-soft px-2 py-0.5 rounded-[6px] border border-brand-border tabular-nums">
                            {item.EMP_PROTOCOLO}
                          </span>
                        ) : (
                          <span className="text-ek-faint text-xs">Não informado</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 font-mono font-semibold text-ek-text tabular-nums">
                        {item.EMP_NFS || "-"}
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono font-medium text-ek-text tabular-nums">
                        {item.EMP_LOJA || "-"}
                      </td>

                      <td className="py-2.5 px-3 font-mono text-ek-muted tabular-nums">
                        {item.ORD_OM || "-"}
                      </td>

                      <td className="py-2.5 px-3 font-mono text-ek-muted tabular-nums">
                        {item.EMP_PEDIDO || "-"}
                      </td>

                      <td className="py-2.5 px-3">
                        {!item.ITENS || item.ITENS.length === 0 ? (
                          <span className="text-ek-faint">Sem serviços discriminados</span>
                        ) : item.ITENS.length === 1 ? (
                          <div className="flex items-start gap-1">
                            <span className="font-medium text-ek-text">
                              {item.ITENS[0].DESCRICAO}
                            </span>
                            {item.ITENS[0].ES_QUANTIDADE ? (
                              <span className="text-[11px] text-ek-muted font-medium shrink-0 tabular-nums">
                                ({item.ITENS[0].ES_QUANTIDADE} {item.ITENS[0].ES_UNIDADE || "UN"})
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <ul className="space-y-1">
                            {item.ITENS.map((s, sIdx) => (
                              <li key={sIdx} className="flex items-start gap-1.5 leading-snug">
                                <span className="text-brand font-bold">•</span>
                                <span className="font-medium text-ek-text">{s.DESCRICAO}</span>
                                {s.ES_QUANTIDADE ? (
                                  <span className="text-[11px] text-ek-muted font-medium shrink-0 tabular-nums">
                                    ({s.ES_QUANTIDADE} {s.ES_UNIDADE || "UN"})
                                  </span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right font-semibold text-ek-text tabular-nums">
                        {mascaraMoeda(valorNf)}
                      </td>

                      <td className="py-2.5 px-3 text-center text-ek-muted tabular-nums">
                        {formatarDataBr(item.EMP_DATA_EMISSAO)}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div className="flex flex-col items-end">
                          <span
                            className={`font-semibold tabular-nums ${
                              estaPago
                                ? "text-emerald-700"
                                : pagoParcial
                                ? "text-brand-goldInk"
                                : "text-ek-muted"
                            }`}
                          >
                            {mascaraMoeda(valorRec)}
                          </span>
                          {estaPago ? (
                            <span className="text-[11px] font-medium text-emerald-700">
                              Pago
                            </span>
                          ) : pagoParcial ? (
                            <span className="text-[11px] font-medium text-brand-goldInk">
                              Parcial
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        {item.EMP_COORDENADOR ? (
                          <span className="px-2 py-0.5 rounded-[6px] bg-ek-raised border border-ek-border text-ek-text font-medium text-[11px] uppercase">
                            {item.EMP_COORDENADOR}
                          </span>
                        ) : (
                          <span className="text-ek-faint">-</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-ek-text font-medium max-w-[180px] truncate" title={item.CLI_NOME || ""}>
                        {item.CLI_NOME || "-"}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <Link
                          href={`/home/orcamentos?ordem=${item.EMP_ORD}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-ek-raised border border-ek-border hover:border-brand-border hover:bg-brand-soft text-ek-text hover:text-brand font-medium text-xs transition-colors tabular-nums"
                          title={`Abrir OS Nº ${item.EMP_ORD} em nova aba`}
                        >
                          <span>OS #{item.EMP_ORD}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {dadosFiltrados.length > 0 && (
              <tfoot>
                <tr className="bg-ek-raised font-semibold border-t border-ek-border text-ek-text">
                  <td colSpan={6} className="py-3 px-3 text-xs text-ek-muted">
                    Totais consolidados ({dadosFiltrados.length} atendimentos)
                  </td>
                  <td className="py-3 px-3 text-ek-muted font-medium text-xs tabular-nums">
                    {totalServicos} serviços
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-bold tabular-nums">
                    {mascaraMoeda(totalValorNf)}
                  </td>
                  <td className="py-3 px-3"></td>
                  <td className="py-3 px-3 text-right text-sm font-bold text-emerald-700 tabular-nums">
                    {mascaraMoeda(totalRecebido)}
                  </td>
                  <td colSpan={3} className="py-3 px-3 text-right text-xs text-ek-muted font-normal">
                    Pendente: <b className="font-bold text-brand-goldInk tabular-nums">{mascaraMoeda(saldoPendente)}</b>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* 5. ELEMENTO OCULTO PARA IMPRESSÃO NATIVA / PDF */}
      <div className="hidden">
        <PrintRelatorioEmpreitadas
          ref={printRef}
          dados={dadosFiltrados}
          periodoStr={periodoStr}
          clienteNome={clienteSelecionadoNome}
          coordenadorNome={coordenador || undefined}
        />
      </div>
    </div>
  );
}
