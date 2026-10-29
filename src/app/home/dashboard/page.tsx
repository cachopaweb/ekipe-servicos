'use client'

import { useCallback, useEffect, useState } from "react";
import MovimentacoesModel from "../../models/movimentacoes_model";
import MovimentacoesRepository from "../../repositories/movimentacoes_repository";
import Link from "next/link";
import { useAppData } from "@/app/contexts/app_context";
import walletIcon from "../../../../assets/wallet.png";
import Image from "next/image";
import { Calendar, RefreshCw, ShoppingCart, FileText, ArrowUpRight, ArrowDownRight } from "lucide-react";

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
        <div className="flex flex-col h-full w-full p-4 sm:p-5 gap-4 font-sans animate-fade-in text-stone-800 overflow-hidden">
            
            {/* Topo: Cards de Saldo e Ações Rápidas */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch shrink-0">
                {/* Card de Saldo */}
                <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-4 bg-amber-500 rounded-full"></span>
                            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                                {filtroPreset === 'hoje' ? 'Saldo do Dia' : 'Saldo do Período'}
                            </span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDia)}
                        </h2>
                        <div className="flex items-center gap-4 mt-3 text-sm">
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCreditos)}
                            </span>
                            {totalDebitos > 0 && (
                                <span className="text-rose-600 font-bold flex items-center gap-1">
                                    <ArrowDownRight className="w-4 h-4 text-rose-600" />
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDebitos)}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 select-none">
                        <Image src={walletIcon} alt="Carteira" className="object-contain" fill sizes="112px" priority />
                    </div>
                </div>

                {/* Card de Ações Rápidas */}
                <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="w-2 h-4 bg-amber-500 rounded-full"></span>
                        <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                            Acessos Rápidos
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-full">
                        <Link
                            href="/home/vendas"
                            onClick={() => setUltRota('vendas')}
                            className="bg-stone-50 hover:bg-amber-50/60 border border-stone-200/80 hover:border-amber-400/80 rounded-xl p-4 flex items-center gap-4 transition-all group shadow-xs"
                        >
                            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                                <ShoppingCart className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                                    Ponto de Venda
                                </h3>
                                <p className="text-xs text-stone-500">Abrir frente de caixa</p>
                            </div>
                        </Link>

                        <Link
                            href="/home/orcamentos"
                            onClick={() => setUltRota('orcamentos')}
                            className="bg-stone-50 hover:bg-amber-50/60 border border-stone-200/80 hover:border-amber-400/80 rounded-xl p-4 flex items-center gap-4 transition-all group shadow-xs"
                        >
                            <div className="w-12 h-12 rounded-xl bg-[#312783] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                                    Orçamentos
                                </h3>
                                <p className="text-xs text-stone-500">Gerenciar propostas e OS</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Extrato Financeiro Funcional */}
            <div className="bg-white rounded-2xl shadow-xs border border-stone-200/80 overflow-hidden flex flex-col flex-1 min-h-0">
                {/* Cabeçalho com Filtros Funcionais */}
                <div className="p-3.5 sm:p-4 border-b border-stone-200/80 bg-stone-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <span className="w-2 h-5 bg-amber-500 rounded-full"></span>
                            <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                                Extrato Financeiro
                            </h2>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-200/70 text-stone-700">
                                {movimentacoes.length} {movimentacoes.length === 1 ? 'registro' : 'registros'}
                            </span>
                        </div>
                    </div>

                    {/* Controles de Filtro */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Botões Rápidos (Presets) */}
                        <div className="inline-flex rounded-lg bg-stone-200/60 p-1 text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => carregarPorPreset('hoje')}
                                className={`px-3 py-1.5 rounded-md transition-all ${
                                    filtroPreset === 'hoje'
                                        ? 'bg-white text-stone-900 shadow-xs'
                                        : 'text-stone-600 hover:text-stone-900'
                                }`}
                            >
                                Hoje
                            </button>
                            <button
                                type="button"
                                onClick={() => carregarPorPreset('7dias')}
                                className={`px-3 py-1.5 rounded-md transition-all ${
                                    filtroPreset === '7dias'
                                        ? 'bg-white text-stone-900 shadow-xs'
                                        : 'text-stone-600 hover:text-stone-900'
                                }`}
                            >
                                7 dias
                            </button>
                            <button
                                type="button"
                                onClick={() => carregarPorPreset('30dias')}
                                className={`px-3 py-1.5 rounded-md transition-all ${
                                    filtroPreset === '30dias'
                                        ? 'bg-white text-stone-900 shadow-xs'
                                        : 'text-stone-600 hover:text-stone-900'
                                }`}
                            >
                                30 dias
                            </button>
                        </div>

                        {/* Inputs de Data e Botão Filtrar */}
                        <div className="flex items-center gap-1.5">
                            <input
                                type="date"
                                value={dataInicio}
                                onChange={(e) => {
                                    setDataInicio(e.target.value);
                                    setFiltroPreset('personalizado');
                                }}
                                className="bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 font-medium focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
                            />
                            <span className="text-stone-400 text-xs">até</span>
                            <input
                                type="date"
                                value={dataFim}
                                onChange={(e) => {
                                    setDataFim(e.target.value);
                                    setFiltroPreset('personalizado');
                                }}
                                className="bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 font-medium focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
                            />
                            <button
                                type="button"
                                onClick={aplicarFiltroPersonalizado}
                                title="Aplicar Filtro"
                                className="p-2 bg-[#312783] hover:bg-[#261e69] text-white rounded-lg shadow-xs transition-colors flex items-center justify-center"
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
                            <tr className="bg-stone-50/90 border-b border-stone-200 text-stone-600 text-xs font-semibold uppercase tracking-wider sticky top-0 z-10">
                                <th className="py-3 px-5">Descrição</th>
                                <th className="py-3 px-4 text-center w-28">Tipo</th>
                                <th className="py-3 px-4 w-32">Data</th>
                                <th className="py-3 px-4 w-28">Hora</th>
                                <th className="py-3 px-5 text-right w-36">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-stone-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                                            <span className="text-xs font-medium text-stone-500">
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
                                            className="hover:bg-amber-50/30 transition-colors"
                                        >
                                            {/* Descrição */}
                                            <td className="py-3 px-5 font-semibold text-sm text-stone-800">
                                                {mov.MOV_DESCRICAO || 'Movimentação sem descrição'}
                                            </td>

                                            {/* Tipo (Entrada / Saída) */}
                                            <td className="py-3 px-4 text-center">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                                        isCredito
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : 'bg-rose-50 text-rose-700 border-rose-200'
                                                    }`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                                            isCredito ? 'bg-emerald-500' : 'bg-rose-500'
                                                        }`}
                                                    ></span>
                                                    {isCredito ? 'Entrada' : 'Saída'}
                                                </span>
                                            </td>

                                            {/* Data */}
                                            <td className="py-3 px-4 font-mono text-xs text-stone-600">
                                                {formatarData(mov.MOV_DATAHORA)}
                                            </td>

                                            {/* Hora */}
                                            <td className="py-3 px-4 font-mono text-xs text-stone-600">
                                                {formatarHora(mov.MOV_DATAHORA)}
                                            </td>

                                            {/* Valor */}
                                            <td className="py-3 px-5 text-right font-mono text-sm font-bold">
                                                <span
                                                    className={
                                                        isCredito
                                                            ? 'text-emerald-700'
                                                            : 'text-rose-600'
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
                                    <td colSpan={5} className="text-center py-12 text-stone-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Calendar className="w-8 h-8 text-stone-300" />
                                            <span className="text-sm font-medium">
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
