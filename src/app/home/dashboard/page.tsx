'use client'

import { useCallback, useEffect, useState } from "react";
import MovimentacoesModel from "../../models/movimentacoes_model";
import MovimentacoesRepository from "../../repositories/movimentacoes_repository";
import Link from "next/link";
import { useAppData } from "@/app/contexts/app_context";
import { Calendar, RefreshCw, ShoppingCart, FileText, ArrowUpRight, ArrowDownRight, ChevronRight } from "lucide-react";

export default function Dashboard() {
    const [movimentacoes, setMovimentacoes] = useState<MovimentacoesModel[]>([]);
    const [totalDia, setTotalDia] = useState(0);
    const [totalCreditos, setTotalCreditos] = useState(0);
    const [totalDebitos, setTotalDebitos] = useState(0);
    const [loading, setLoading] = useState(false);
    const [filtroPreset, setFiltroPreset] = useState<'hoje' | '7dias' | '30dias' | 'personalizado'>('hoje');
    
    // Funções auxiliares para manipulação de data no formato YYYY-MM-DD
    const toInputDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dia = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dia}`;
    };

    const parseInputDate = (s: string) => {
        const [y, m, d] = s.split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    const hojeStr = toInputDate(new Date());
    const [dataInicio, setDataInicio] = useState(hojeStr);
    const [dataFim, setDataFim] = useState(hojeStr);

    const { setUltRota } = useAppData();

    const buscaMovimentacoes = useCallback(async (d1: Date, d2: Date) => {
        try {
            setLoading(true);
            const repository = new MovimentacoesRepository();
            const listaMov = await repository.getMovimentacoes(d1, d2);

            if (listaMov) {
                const listaArray = Array.isArray(listaMov) ? listaMov : [listaMov];

                // Ordenar pelas mais recentes no topo
                listaArray.sort((a, b) => {
                    const timeA = a.MOV_DATAHORA ? new Date(a.MOV_DATAHORA).getTime() : 0;
                    const timeB = b.MOV_DATAHORA ? new Date(b.MOV_DATAHORA).getTime() : 0;
                    return timeB - timeA;
                });

                let creditos = 0;
                let debitos = 0;
                listaArray.forEach((mov) => {
                    creditos += mov.MOV_CREDITO || 0;
                    debitos += mov.MOV_DEBITO || 0;
                });
                setTotalCreditos(creditos);
                setTotalDebitos(debitos);

                // Saldo anterior baseado no primeiro registro histórico se existir
                const saldoAnt = listaArray.length > 0 ? (listaArray[listaArray.length - 1].MOV_SALDOANT || 0) : 0;
                setTotalDia(saldoAnt + (creditos - debitos));
                setMovimentacoes(listaArray);
            } else {
                setMovimentacoes([]);
                setTotalCreditos(0);
                setTotalDebitos(0);
                setTotalDia(0);
            }
        } catch (error) {
            console.error("Erro ao buscar movimentações:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const carregarPorPreset = useCallback((preset: 'hoje' | '7dias' | '30dias') => {
        setFiltroPreset(preset);
        const agora = new Date();
        const fimStr = toInputDate(agora);
        let inicioDate = new Date();

        if (preset === 'hoje') {
            inicioDate = new Date();
        } else if (preset === '7dias') {
            inicioDate = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (preset === '30dias') {
            inicioDate = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        const inicioStr = toInputDate(inicioDate);
        setDataInicio(inicioStr);
        setDataFim(fimStr);
        buscaMovimentacoes(inicioDate, agora);
    }, [buscaMovimentacoes]);

    useEffect(() => {
        carregarPorPreset('hoje');
    }, [carregarPorPreset]);

    const aplicarFiltroPersonalizado = () => {
        setFiltroPreset('personalizado');
        const d1 = parseInputDate(dataInicio);
        const d2 = parseInputDate(dataFim);
        buscaMovimentacoes(d1, d2);
    };

    const formatarData = (dataHoraStr?: string) => {
        if (!dataHoraStr) return '-';
        const d = new Date(dataHoraStr);
        if (isNaN(d.getTime())) return '-';
        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const ano = d.getFullYear();
        return `${dia}/${mes}/${ano}`;
    };

    const formatarHora = (dataHoraStr?: string) => {
        if (!dataHoraStr) return '-';
        const d = new Date(dataHoraStr);
        if (isNaN(d.getTime())) return '-';
        const hora = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        const seg = String(d.getSeconds()).padStart(2, '0');
        return `${hora}:${min}:${seg}`;
    };

    return (
        <div className="flex flex-col h-full w-full p-5 sm:p-6 gap-5 font-sans text-ek-text overflow-hidden">
            {/* Cabeçalho da Folha */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 shrink-0">
                <div>
                    <h1 className="text-[22px] font-semibold text-ek-text tracking-tight leading-tight">
                        Visão Geral
                    </h1>
                    <p className="text-sm text-ek-muted mt-0.5">
                        Acompanhamento de movimentações financeiras e acesso rápido aos módulos.
                    </p>
                </div>
            </div>

            {/* Topo: Resumo Financeiro + Acessos Rápidos */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch shrink-0">
                {/* Faixa KPI dividida (Saldo + Entradas + Saídas) */}
                <div className="lg:col-span-7 ek-card grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-ek-rule overflow-hidden">
                    <div className="p-4 sm:p-5 flex flex-col justify-between">
                        <span className="text-xs font-medium text-ek-muted">
                            {filtroPreset === 'hoje' ? 'Saldo do dia' : 'Saldo do período'}
                        </span>
                        <div className="text-2xl font-medium text-ek-text tracking-tight tabular-nums mt-2">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDia)}
                        </div>
                        <span className="text-xs text-ek-faint mt-1">
                            Resultado consolidado
                        </span>
                    </div>

                    <div className="p-4 sm:p-5 flex flex-col justify-between">
                        <span className="text-xs font-medium text-ek-muted flex items-center gap-1.5">
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-700" />
                            Entradas
                        </span>
                        <div className="text-2xl font-medium text-emerald-700 tracking-tight tabular-nums mt-2">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCreditos)}
                        </div>
                        <span className="text-xs text-ek-faint mt-1">
                            Créditos no período
                        </span>
                    </div>

                    <div className="p-4 sm:p-5 flex flex-col justify-between">
                        <span className="text-xs font-medium text-ek-muted flex items-center gap-1.5">
                            <ArrowDownRight className="w-3.5 h-3.5 text-red-700" />
                            Saídas
                        </span>
                        <div className="text-2xl font-medium text-ek-text tracking-tight tabular-nums mt-2">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDebitos)}
                        </div>
                        <span className="text-xs text-ek-faint mt-1">
                            Débitos no período
                        </span>
                    </div>
                </div>

                {/* Acessos Rápidos */}
                <div className="lg:col-span-5 ek-card p-4 sm:p-5 flex flex-col justify-between gap-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-ek-muted">
                            Acessos rápidos
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1">
                        <Link
                            href="/home/vendas"
                            onClick={() => setUltRota('vendas')}
                            className="border border-ek-border hover:border-brand/40 bg-ek-raised hover:bg-brand-soft/40 rounded-[6px] px-3.5 py-3 flex items-center justify-between gap-3 transition-colors group"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <ShoppingCart className="w-4 h-4 text-brand shrink-0" />
                                <div className="min-w-0">
                                    <h3 className="text-sm font-semibold text-ek-text group-hover:text-brand transition-colors truncate">
                                        Ponto de Venda
                                    </h3>
                                    <p className="text-xs text-ek-muted truncate">Abrir frente de caixa</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-ek-faint group-hover:text-brand shrink-0 transition-colors" />
                        </Link>

                        <Link
                            href="/home/orcamentos"
                            onClick={() => setUltRota('orcamentos')}
                            className="border border-ek-border hover:border-brand/40 bg-ek-raised hover:bg-brand-soft/40 rounded-[6px] px-3.5 py-3 flex items-center justify-between gap-3 transition-colors group"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <FileText className="w-4 h-4 text-brand shrink-0" />
                                <div className="min-w-0">
                                    <h3 className="text-sm font-semibold text-ek-text group-hover:text-brand transition-colors truncate">
                                        Orçamentos
                                    </h3>
                                    <p className="text-xs text-ek-muted truncate">Propostas e O.S.</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-ek-faint group-hover:text-brand shrink-0 transition-colors" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Extrato Financeiro Funcional */}
            <div className="ek-card overflow-hidden flex flex-col flex-1 min-h-0">
                {/* Cabeçalho com Filtros Funcionais */}
                <div className="px-4 py-3 border-b border-ek-rule bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-base font-semibold text-ek-text tracking-tight">
                            Extrato Financeiro
                        </h2>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-ek-raised text-ek-muted border border-ek-border">
                            {movimentacoes.length} {movimentacoes.length === 1 ? 'registro' : 'registros'}
                        </span>
                    </div>

                    {/* Controles de Filtro */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Botões Rápidos (Presets) */}
                        <div className="inline-flex rounded-[6px] bg-ek-raised border border-ek-border p-0.5 text-xs font-medium">
                            <button
                                type="button"
                                onClick={() => carregarPorPreset('hoje')}
                                className={`px-3 py-1 rounded-[4px] transition-colors ${
                                    filtroPreset === 'hoje'
                                        ? 'bg-white text-ek-text font-semibold border border-ek-border'
                                        : 'text-ek-muted hover:text-ek-text border border-transparent'
                                }`}
                            >
                                Hoje
                            </button>
                            <button
                                type="button"
                                onClick={() => carregarPorPreset('7dias')}
                                className={`px-3 py-1 rounded-[4px] transition-colors ${
                                    filtroPreset === '7dias'
                                        ? 'bg-white text-ek-text font-semibold border border-ek-border'
                                        : 'text-ek-muted hover:text-ek-text border border-transparent'
                                }`}
                            >
                                7 dias
                            </button>
                            <button
                                type="button"
                                onClick={() => carregarPorPreset('30dias')}
                                className={`px-3 py-1 rounded-[4px] transition-colors ${
                                    filtroPreset === '30dias'
                                        ? 'bg-white text-ek-text font-semibold border border-ek-border'
                                        : 'text-ek-muted hover:text-ek-text border border-transparent'
                                }`}
                            >
                                30 dias
                            </button>
                        </div>

                        {/* Inputs de Data e Botão Filtrar */}
                        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                            <input
                                type="date"
                                value={dataInicio}
                                onChange={(e) => {
                                    setDataInicio(e.target.value);
                                    setFiltroPreset('personalizado');
                                }}
                                className="h-8 min-w-0 flex-1 sm:flex-none bg-white border border-ek-control rounded-[6px] px-2.5 text-xs text-ek-text font-medium focus:border-brand focus:ring-2 focus:ring-brand/15 outline-none transition-colors"
                            />
                            <span className="text-ek-faint text-xs shrink-0">até</span>
                            <input
                                type="date"
                                value={dataFim}
                                onChange={(e) => {
                                    setDataFim(e.target.value);
                                    setFiltroPreset('personalizado');
                                }}
                                className="h-8 min-w-0 flex-1 sm:flex-none bg-white border border-ek-control rounded-[6px] px-2.5 text-xs text-ek-text font-medium focus:border-brand focus:ring-2 focus:ring-brand/15 outline-none transition-colors"
                            />
                            <button
                                type="button"
                                onClick={aplicarFiltroPersonalizado}
                                title="Aplicar Filtro"
                                className="h-8 w-8 shrink-0 bg-brand hover:bg-brand-hover text-white rounded-[6px] transition-colors flex items-center justify-center"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabela do Extrato com Descrição, Tipo, Data, Hora e Valor */}
                <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-ek-raised border-b border-ek-border text-ek-muted text-xs font-medium sticky top-0 z-10">
                                <th className="py-2.5 px-5 font-medium">Descrição</th>
                                <th className="py-2.5 px-4 text-center w-28 font-medium">Tipo</th>
                                <th className="py-2.5 px-4 w-32 font-medium">Data</th>
                                <th className="py-2.5 px-4 w-28 font-medium">Hora</th>
                                <th className="py-2.5 px-5 text-right w-40 font-medium">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-ek-rule">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-ek-muted">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <RefreshCw className="w-5 h-5 animate-spin text-brand" />
                                            <span className="text-xs font-medium text-ek-muted">
                                                Carregando movimentações...
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : movimentacoes.length > 0 ? (
                                movimentacoes.map((mov) => {
                                    const isCredito = (mov.MOV_CREDITO || 0) > 0;
                                    const valor = isCredito ? mov.MOV_CREDITO : (mov.MOV_DEBITO || 0);

                                    return (
                                        <tr
                                            key={mov.MOV_CODIGO}
                                            className="hover:bg-ek-raised/80 transition-colors"
                                        >
                                            <td className="py-3 px-5 font-medium text-sm text-ek-text">
                                                {mov.MOV_DESCRICAO || 'Movimentação sem descrição'}
                                            </td>

                                            <td className="py-3 px-4 text-center">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        isCredito
                                                            ? 'bg-emerald-50 text-emerald-800'
                                                            : 'bg-red-50 text-red-800'
                                                    }`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                                            isCredito ? 'bg-emerald-600' : 'bg-red-600'
                                                        }`}
                                                    />
                                                    {isCredito ? 'Entrada' : 'Saída'}
                                                </span>
                                            </td>

                                            <td className="py-3 px-4 tabular-nums text-xs text-ek-muted">
                                                {formatarData(mov.MOV_DATAHORA)}
                                            </td>

                                            <td className="py-3 px-4 tabular-nums text-xs text-ek-muted">
                                                {formatarHora(mov.MOV_DATAHORA)}
                                            </td>

                                            <td className="py-3 px-5 text-right tabular-nums text-sm font-medium">
                                                <span
                                                    className={
                                                        isCredito
                                                            ? 'text-emerald-700'
                                                            : 'text-red-700'
                                                    }
                                                >
                                                    {isCredito ? '+ ' : '- '}
                                                    {new Intl.NumberFormat('pt-BR', {
                                                        style: 'currency',
                                                        currency: 'BRL',
                                                    }).format(valor || 0)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-ek-muted">
                                        <div className="flex flex-col items-center gap-2">
                                            <Calendar className="w-7 h-7 text-ek-control" />
                                            <span className="text-sm font-medium text-ek-muted">
                                                Não há movimentações no período selecionado.
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
