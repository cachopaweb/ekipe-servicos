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
    <div className="flex-1 flex flex-col h-full bg-stone-100 overflow-y-auto p-4 sm:p-6 lg:p-8">
      {/* 1. TOPO: Título, Descrição e Botões de Exportação */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            <span>Relatórios Gerenciais</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-amber-700">Atendimentos & Empreitadas</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-amber-600 shrink-0" />
            <span>Relatório de Atendimentos & Empreitadas</span>
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            Consolidação de protocolos, notas fiscais, lojas, pedidos, serviços executados e controle de faturamento
          </p>
        </div>

        {/* Botões de Ação / Exportação */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportarExcel}
            disabled={carregando || dadosFiltrados.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 active:scale-95 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Baixar planilha formatada em Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={handleExportarCSV}
            disabled={carregando || dadosFiltrados.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 active:scale-95 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Exportar arquivo CSV separado por ponto e vírgula"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={() => handlePrint()}
            disabled={carregando || dadosFiltrados.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 active:scale-95 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Imprimir relatório ou Salvar em PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* 2. PAINEL DE FILTROS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mt-5">
        <div className="flex flex-col gap-3">
          {/* Linha de Atalhos Rápidos de Período */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              Período Rápido:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => aplicarPresetData("esteMes")}
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-stone-100 hover:bg-amber-100 text-gray-700 hover:text-amber-900 transition"
              >
                Este Mês
              </button>
              <button
                type="button"
                onClick={() => aplicarPresetData("mesAnterior")}
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-stone-100 hover:bg-amber-100 text-gray-700 hover:text-amber-900 transition"
              >
                Mês Anterior
              </button>
              <button
                type="button"
                onClick={() => aplicarPresetData("ultimos30")}
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-stone-100 hover:bg-amber-100 text-gray-700 hover:text-amber-900 transition"
              >
                Últimos 30 Dias
              </button>
              <button
                type="button"
                onClick={() => aplicarPresetData("anoAtual")}
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-stone-100 hover:bg-amber-100 text-gray-700 hover:text-amber-900 transition"
              >
                Ano Atual
              </button>
              <button
                type="button"
                onClick={() => aplicarPresetData("todos")}
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-stone-100 hover:bg-gray-200 text-gray-500 transition"
              >
                Todo Histórico
              </button>
            </div>
          </div>

          {/* Grid de Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            {/* Data Início */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 bg-stone-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            {/* Data Fim */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 bg-stone-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            {/* Filtro por Cliente */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                Cliente
              </label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(Number(e.target.value))}
                className="w-full text-xs font-medium px-3 py-2 bg-stone-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white truncate"
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
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                Coordenador
              </label>
              <select
                value={coordenador}
                onChange={(e) => setCoordenador(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 bg-stone-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white truncate"
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
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-lg text-xs font-bold hover:bg-stone-900 active:scale-95 transition shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${carregando ? "animate-spin" : ""}`} />
                <span>{carregando ? "Carregando..." : "Atualizar Filtros"}</span>
              </button>
            </div>
          </div>

          {/* Linha de Busca Instantânea */}
          <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                placeholder="Busca rápida por Protocolo, NF, OM, Pedido, Loja, Serviço, Coordenador..."
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-stone-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
              {filtroTexto && (
                <button
                  type="button"
                  onClick={() => setFiltroTexto("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {filtroTexto && (
              <span className="text-[11px] text-gray-500 shrink-0">
                Mostrando <b>{dadosFiltrados.length}</b> de <b>{dados.length}</b>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. CARDS DE RESUMO (KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
        {/* Total Atendimentos */}
        <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Atendimentos
            </span>
            <span className="text-xl font-extrabold text-gray-900">{totalAtendimentos}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Total Serviços */}
        <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Qtd Serviços
            </span>
            <span className="text-xl font-extrabold text-gray-900">{totalServicos}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Filter className="w-5 h-5" />
          </div>
        </div>

        {/* Valor Total NF */}
        <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Total Faturado (NF)
            </span>
            <span className="text-lg font-black text-gray-900 font-mono">
              {mascaraMoeda(totalValorNf)}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Total Recebido */}
        <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Total Recebido
            </span>
            <span className="text-lg font-black text-emerald-700 font-mono">
              {mascaraMoeda(totalRecebido)}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Saldo Pendente */}
        <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-sm flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Saldo Pendente
            </span>
            <span
              className={`text-lg font-black font-mono ${
                saldoPendente > 0 ? "text-amber-700" : "text-gray-700"
              }`}
            >
              {mascaraMoeda(saldoPendente)}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. TABELA DE REGISTROS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-5 flex-1 flex flex-col">
        {/* Cabeçalho da Tabela */}
        <div className="px-4 py-3 bg-stone-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Atendimentos Encontrados
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
              {dadosFiltrados.length}
            </span>
          </div>

          <span className="text-xs text-gray-500 font-medium hidden sm:inline">
            Período: <b className="text-gray-800">{periodoStr}</b>
          </span>
        </div>

        {/* Tabela Responsiva com Scroll */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-100/80 text-gray-600 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                <th className="py-2.5 px-3 text-center">#</th>
                <th className="py-2.5 px-3">Protocolo</th>
                <th className="py-2.5 px-3">Nota Fiscal</th>
                <th className="py-2.5 px-3 text-center">Loja</th>
                <th className="py-2.5 px-3">OM</th>
                <th className="py-2.5 px-3">Pedido Compras</th>
                <th className="py-2.5 px-3 min-w-[240px]">Serviço(s)</th>
                <th className="py-2.5 px-3 text-right">Valor NF</th>
                <th className="py-2.5 px-3 text-center">Data Emissão</th>
                <th className="py-2.5 px-3 text-right">Recebido</th>
                <th className="py-2.5 px-3">Coordenador</th>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {carregando ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-amber-500"></div>
                      <span className="text-xs font-medium">Buscando dados no servidor...</span>
                    </div>
                  </td>
                </tr>
              ) : dadosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <FileSpreadsheet className="w-10 h-10 text-gray-300 mb-1" />
                      <span className="text-sm font-bold text-gray-700">
                        Nenhum atendimento encontrado
                      </span>
                      <span className="text-xs text-gray-400">
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
                      className="hover:bg-amber-50/40 transition-colors"
                    >
                      {/* # Índice */}
                      <td className="py-2.5 px-3 text-center text-gray-400 font-mono text-[11px]">
                        {index + 1}
                      </td>

                      {/* Protocolo */}
                      <td className="py-2.5 px-3">
                        {item.EMP_PROTOCOLO ? (
                          <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {item.EMP_PROTOCOLO}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">Não informado</span>
                        )}
                      </td>

                      {/* NF */}
                      <td className="py-2.5 px-3 font-mono font-bold text-gray-900">
                        {item.EMP_NFS || "-"}
                      </td>

                      {/* Loja */}
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-gray-700">
                        {item.EMP_LOJA || "-"}
                      </td>

                      {/* OM */}
                      <td className="py-2.5 px-3 font-mono text-gray-700">
                        {item.ORD_OM || "-"}
                      </td>

                      {/* Pedido de Compras */}
                      <td className="py-2.5 px-3 font-mono text-gray-700">
                        {item.EMP_PEDIDO || "-"}
                      </td>

                      {/* Serviços */}
                      <td className="py-2.5 px-3">
                        {!item.ITENS || item.ITENS.length === 0 ? (
                          <span className="text-gray-400 italic">Sem serviços discriminados</span>
                        ) : item.ITENS.length === 1 ? (
                          <div className="flex items-start gap-1">
                            <span className="font-medium text-gray-800">
                              {item.ITENS[0].DESCRICAO}
                            </span>
                            {item.ITENS[0].ES_QUANTIDADE ? (
                              <span className="text-[10px] text-gray-500 font-semibold shrink-0">
                                ({item.ITENS[0].ES_QUANTIDADE} {item.ITENS[0].ES_UNIDADE || "UN"})
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <ul className="space-y-1">
                            {item.ITENS.map((s, sIdx) => (
                              <li key={sIdx} className="flex items-start gap-1.5 leading-snug">
                                <span className="text-amber-500 font-bold">•</span>
                                <span className="font-medium text-gray-800">{s.DESCRICAO}</span>
                                {s.ES_QUANTIDADE ? (
                                  <span className="text-[10px] text-gray-500 font-semibold shrink-0">
                                    ({s.ES_QUANTIDADE} {s.ES_UNIDADE || "UN"})
                                  </span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>

                      {/* Valor NF */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                        {mascaraMoeda(valorNf)}
                      </td>

                      {/* Data Emissão */}
                      <td className="py-2.5 px-3 text-center font-mono text-gray-700">
                        {formatarDataBr(item.EMP_DATA_EMISSAO)}
                      </td>

                      {/* Recebido */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex flex-col items-end">
                          <span
                            className={`font-mono font-bold ${
                              estaPago
                                ? "text-emerald-700"
                                : pagoParcial
                                ? "text-amber-700"
                                : "text-gray-500"
                            }`}
                          >
                            {mascaraMoeda(valorRec)}
                          </span>
                          {estaPago ? (
                            <span className="text-[9px] font-bold text-emerald-700 uppercase">
                              Pago
                            </span>
                          ) : pagoParcial ? (
                            <span className="text-[9px] font-bold text-amber-700 uppercase">
                              Parcial
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Coordenador */}
                      <td className="py-2.5 px-3">
                        {item.EMP_COORDENADOR ? (
                          <span className="px-2 py-0.5 rounded bg-stone-100 text-gray-700 font-medium text-[11px] uppercase">
                            {item.EMP_COORDENADOR}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* Cliente */}
                      <td className="py-2.5 px-3 text-gray-700 font-medium max-w-[180px] truncate" title={item.CLI_NOME || ""}>
                        {item.CLI_NOME || "-"}
                      </td>

                      {/* Ações (Link para OS) */}
                      <td className="py-2.5 px-3 text-center">
                        <Link
                          href={`/home/orcamentos?ordem=${item.EMP_ORD}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-stone-100 hover:bg-amber-100 text-gray-700 hover:text-amber-900 font-bold text-[11px] transition"
                          title={`Abrir OS Nº ${item.EMP_ORD} em nova aba`}
                        >
                          <span>OS #{item.EMP_ORD}</span>
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Rodapé com Totais Consolidados */}
            {dadosFiltrados.length > 0 && (
              <tfoot>
                <tr className="bg-stone-100 font-bold border-t-2 border-gray-300 text-gray-900">
                  <td colSpan={6} className="py-3 px-3 uppercase text-xs text-gray-700">
                    Totais Consolidados ({dadosFiltrados.length} Atendimentos)
                  </td>
                  <td className="py-3 px-3 text-gray-700 font-semibold text-xs">
                    {totalServicos} Serviços
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm">
                    {mascaraMoeda(totalValorNf)}
                  </td>
                  <td className="py-3 px-3"></td>
                  <td className="py-3 px-3 text-right font-mono text-sm text-emerald-800">
                    {mascaraMoeda(totalRecebido)}
                  </td>
                  <td colSpan={3} className="py-3 px-3 text-right text-xs text-gray-600 font-normal">
                    Pendente: <b className="font-mono font-bold text-amber-800">{mascaraMoeda(saldoPendente)}</b>
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
