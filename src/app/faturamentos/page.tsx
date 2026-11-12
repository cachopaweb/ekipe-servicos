"use client"

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import PedFatModel from "../models/ped_fat_model";
import PFParcelaModel from "../models/pf_parcela_model";
import TipoPgmModel from "../models/tipo_pgm_model";
import TipoPgmRepository from "../repositories/tipo_pgm_repository";
import { IncrementaGenerator, keyBoardInputEvent, keyBoardSelectEvent, toastMixin, formatCurrency, formatDataInput, parseDataCalendario } from "../functions/utils";
import CliForModel from "../models/cli_for_model";
import ModalConfirmacao from "@/app/home/orcamentos/components/modal_confirmacao";
import OperacoesStrategy from "./contracts/operacoes_interfaces";
import { CheckCircle, AlertCircle, PlusCircle, CreditCard, Loader2 } from "lucide-react";

interface FaturamentoProps {
    valorTotal: number;
    cliFor: CliForModel;
    setShowModal?: Dispatch<SetStateAction<boolean>>;
    Operacao: OperacoesStrategy;
    model: Object;
    itens: Object;
    itens2?: Object;
    pedFat: PedFatModel;
    setFaturado: Dispatch<SetStateAction<boolean>>;
    tipoRecPag: string;
}

export default function Faturamentos({ valorTotal, cliFor = { CODIGO: 1, NOME: 'GENERICO' }, setShowModal, Operacao, model, itens, itens2, pedFat, setFaturado, tipoRecPag }: FaturamentoProps) {
    const refDivFatura = useRef<HTMLDivElement>(null);
    const [divWidthFatura, setDivWidthFatura] = useState<number>(0);
    useEffect(() => {
        setDivWidthFatura(refDivFatura.current ? refDivFatura.current.offsetWidth : 0);
    }, [refDivFatura.current]);
    const [codFatura, setCodFatura] = useState(0);
    const [codPedFat, setCodPedFat] = useState(0);
    const [listaPFParcela, setListaPFParcela] = useState<PFParcelaModel[]>([]);
    const [listaTipopgm, setListaTipoPgm] = useState<TipoPgmModel[]>([]);
    const [vlrEntrada, setVlrEntrada] = useState<number>(0);
    const [numParcelas, setNumParcelas] = useState<number | null>(null);
    const [valorParcela, setValorParcela] = useState<number | null>(null);
    const [valorDescontavel, setValorDescontavel] = useState(0);
    const [numParcelasRestantes, setNumParcelasRestantes] = useState(0);
    const [parcela, setParcela] = useState(0);
    const [showModalSalvar, setShowModalSalvar] = useState(false);
    const [isFinishing, setIsFinishing] = useState(false);
    const [codTipoPgm, setCodTipoPgm] = useState(0);
    const [vencimentoStr, setVencimentoStr] = useState(() => formatDataInput(new Date()));

    useEffect(() => {
        if (numParcelas && (numParcelas > 0))
            setValorDescontavel(valorTotal!)
    }, [valorTotal])

    useEffect(() => {
        if (valorDescontavel > 0)
            setValorParcela(valorDescontavel)
    }, [valorDescontavel])

    useEffect(() => {
        if ((listaPFParcela.length > 0) && (numParcelasRestantes === 0))
            setShowModalSalvar(true);
    }, [numParcelasRestantes])

    useEffect(() => {
        buscaTipoPgm(tipoRecPag)
    }, []);

    useEffect(() => {
        iniciaCodFatura()
        const edtEntrada = document.getElementById('edtEntrada') as HTMLInputElement;
        edtEntrada?.select();
    }, [])

    const iniciaCodFatura = async () => {
        try {
            const genFat = tipoRecPag === 'P' ? 'GEN_FAT2' : 'GEN_FAT';
            const cod = await IncrementaGenerator(genFat);
            setCodFatura(cod);
            (Operacao as any).codFatura = cod;
            const codPf = await IncrementaGenerator('GEN_PF');
            setCodPedFat(codPf);
            (Operacao as any).codPedFat = codPf;
        } catch (error) {
            toastMixin.fire('Erro ao iniciar codigo fatura', String(error), 'error');
        }
    }

    const buscaTipoPgm = async (tipo: string) => {
        try {
            const repository = new TipoPgmRepository();
            const tp = await repository.buscaTipoPgm(tipo);
            setListaTipoPgm(tp);
            if (tp && tp.length > 0) {
                setCodTipoPgm(tp[0].TP_CODIGO);
            }

        } catch (error) {
            toastMixin.fire('Erro ao buscar tipo pgm', String(error), 'error');
        }
    }

    const keydownEntrada = (e: keyBoardInputEvent) => {
        if (e.key === 'Enter') {
            if (!vlrEntrada) {
                setVlrEntrada(0);
            }
            setParcela(0);
            setVencimentoStr(formatDataInput(new Date()));
            setListaPFParcela([])
            const edtParcelas = document.getElementById('edtParcelas');
            edtParcelas?.focus()
        }
    }

    const keydownValorParcela = (e: keyBoardInputEvent) => {
        if (e.key === 'Enter') {
            const btnSalvar = document.getElementById('btnSalvar');
            btnSalvar?.focus()
        }
    }

    const keydownTipoPgm = (e: keyBoardSelectEvent) => {
        if (e.key === 'Enter') {
            const edtVencimento = document.getElementById('edtVencimento');
            edtVencimento?.focus()
        }
    }

    const keydownVencimento = (e: keyBoardInputEvent) => {
        if (e.key === 'Enter') {
            const edtValorParcela = document.getElementById('edtValorParcela');
            edtValorParcela?.focus()
        }
    }

    const keyDownParcelas = async (e: keyBoardInputEvent) => {
        const tipoPgm = listaTipopgm?.find((tp) => tp.TP_CODIGO === (tipoRecPag === 'R' ? 0 : -1));
        setParcela(0);
        const hoje = new Date();
        setVencimentoStr(formatDataInput(hoje));
        if (e.key === 'Enter') {
            if (!numParcelas || numParcelas === 0) {
                toastMixin.fire('Número de parcelas não informado!', 'Informe o número de parcelas', 'warning');
                return;
            }
            const edtTipoPgm = document.getElementById('tipoPgm');
            if (vlrEntrada && vlrEntrada != 0) {
                const pfParcela: PFParcelaModel = {
                    PP_CODIGO: 0,
                    PP_DUPLICATA: `${codFatura}-1/${numParcelas! + 1}`,
                    PP_DESCONTOS: 0,
                    PP_JUROS: 0,
                    PP_ESTADO: 3, // 3 é pago 1 em aberto
                    PP_PF: codPedFat,
                    PP_TP: tipoPgm?.TP_CODIGO ?? 0,
                    PP_VALOR: vlrEntrada!,
                    PP_VALORPG: vlrEntrada!,
                    PP_VENCIMENTO: new Date(hoje),
                    DescricaoTipoPgm: tipoPgm?.TP_DESCRICAO ?? 'DINHEIRO'
                }
                setNumParcelasRestantes(numParcelas!);
                setValorDescontavel(parseFloat(((valorTotal! - vlrEntrada!) / numParcelas!).toFixed(2)));

                setListaPFParcela([pfParcela])
                setParcela(1);
                const proxVenc = new Date(hoje);
                proxVenc.setDate(proxVenc.getDate() + 30);
                setVencimentoStr(formatDataInput(proxVenc));
                edtTipoPgm?.focus();
            } else {
                setNumParcelasRestantes(numParcelas!);
                setValorDescontavel(valorTotal! / numParcelas!);
                setListaPFParcela([])
                edtTipoPgm?.focus();
            }
        }
    }

    const salvarParcela = async (nparcela: number) => {
        const tipoPgm = listaTipopgm?.find((tp) => tp.TP_CODIGO === codTipoPgm);
        const edtTipoPgm = document.getElementById('tipoPgm');
        const dtVenc = vencimentoStr ? parseDataCalendario(vencimentoStr) : new Date();
        const pfParcela: PFParcelaModel = {
            PP_CODIGO: 0,
            PP_DUPLICATA: `${codFatura}-${nparcela}/${vlrEntrada && vlrEntrada > 0 ? numParcelas! + 1 : numParcelas}`,
            PP_DESCONTOS: 0,
            PP_JUROS: 0,
            PP_ESTADO: tipoPgm?.TP_CODIGO == 0 ? 3 : 1, // 3 é pago 1 em aberto
            PP_PF: codPedFat,
            PP_TP: tipoPgm?.TP_CODIGO ?? 0,
            PP_VALOR: valorParcela!,
            PP_VALORPG: tipoPgm?.TP_CODIGO == 0 ? valorParcela! : 0,
            PP_VENCIMENTO: dtVenc,
            DescricaoTipoPgm: tipoPgm?.TP_DESCRICAO ?? ''
        }
        if (numParcelasRestantes === 1) {
            setValorDescontavel(valorDescontavel);
        } else {
            setValorDescontavel(valorDescontavel - parseFloat(valorParcela!.toFixed(2)));
        }
        setNumParcelasRestantes(numParcelasRestantes - 1);
        setListaPFParcela(old => [...old, pfParcela])
        const proxVenc = new Date(dtVenc);
        proxVenc.setDate(proxVenc.getDate() + 30);
        setVencimentoStr(formatDataInput(proxVenc));
        setParcela(nparcela);
        edtTipoPgm?.focus();
    }

    const finalizarFaturamento = async () => {
        if (isFinishing) return;
        setIsFinishing(true);
        try {
            toastMixin.fire({
                title: 'Aguarde...',
                text: 'finalizando faturamento',
                icon: 'info'
            });
            if (codFatura > 0) (Operacao as any).codFatura = codFatura;
            if (codPedFat > 0) (Operacao as any).codPedFat = codPedFat;
            pedFat.PF_CODIGO = codPedFat;
            pedFat.PF_FAT = codFatura;
            pedFat.PF_COD_CLI = cliFor.CODIGO;
            pedFat.PF_VALOR = valorTotal!;
            pedFat.PF_VALORB = valorTotal!;
            pedFat.PF_VALORPG = vlrEntrada!;
            pedFat.PF_PARCELAS = (vlrEntrada! && numParcelas!) > 0 ? numParcelas! + 1 : numParcelas!;
            setShowModalSalvar(false);
            await Operacao.insereOperacao(model);
            await Operacao.insereItens(itens);
            await Operacao.insereItens2?.(itens2);
            await Operacao.inserePedFat(pedFat!);
            await Operacao.inserePFParcelas(listaPFParcela);
            toastMixin.fire({
                title: 'Finalizado',
                text: 'Faturamento finalizado com sucesso',
                icon: 'success'
            });
            setFaturado(true);
            setShowModal?.(false);
        } catch (error) {
            toastMixin.fire({
                title: 'Erro ao finalizar faturamento',
                text: String(error),
                icon: 'error'
            });
        } finally {
            setIsFinishing(false);
        }
    }

    return (
        <div ref={refDivFatura} className="flex flex-col gap-4 font-sans text-ek-text">
            {/* Bloco 1: Resumo e Dados Iniciais */}
            <div className="ek-card p-4 sm:p-5 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-ek-rule gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[6px] bg-brand-soft border border-brand-border flex items-center justify-center text-brand">
                            <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="text-xs font-medium text-ek-muted block">
                                Cód. fatura
                            </span>
                            <span className="font-mono text-base font-bold text-ek-text tabular-nums">
                                #{codFatura || '---'}
                            </span>
                        </div>
                    </div>

                    <div className="text-left sm:text-right">
                        <span className="text-xs font-medium text-ek-muted block">
                            Valor total a faturar
                        </span>
                        <span className="text-2xl font-bold text-brand tracking-[-0.02em] tabular-nums">
                            {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(valorTotal!)}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:items-end">
                    <div className="sm:col-span-3">
                        <label htmlFor="edtEntrada" className="ek-label">
                            Entrada (R$)
                        </label>
                        <input
                            type="number"
                            placeholder="0,00"
                            step={0.1}
                            min={0}
                            max={valorTotal!}
                            autoFocus
                            id="edtEntrada"
                            value={vlrEntrada ?? ''}
                            onChange={e => setVlrEntrada(parseFloat(e.target.value))}
                            onKeyDown={keydownEntrada}
                            className="ek-input font-semibold tabular-nums"
                        />
                    </div>

                    <div className="hidden sm:flex sm:col-span-1 items-center justify-center pb-2 text-ek-faint font-semibold text-lg">
                        +
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="edtParcelas" className="ek-label">
                            N° parcelas
                        </label>
                        <input
                            id="edtParcelas"
                            value={numParcelas ?? ''}
                            placeholder="0"
                            onChange={e => setNumParcelas(e.target.value ? parseInt(e.target.value) : 0)}
                            onKeyDown={keyDownParcelas}
                            type="number"
                            min={0}
                            className="ek-input font-semibold tabular-nums"
                        />
                    </div>

                    <div className="sm:col-span-5">
                        <label className="ek-label">
                            Cliente / Consumidor
                        </label>
                        <input
                            value={cliFor.NOME ?? ''}
                            readOnly
                            type="text"
                            className="ek-input bg-ek-raised text-ek-muted font-medium cursor-not-allowed truncate"
                        />
                    </div>
                </div>
            </div>

            <ModalConfirmacao
                isOpen={showModalSalvar}
                onClose={() => setShowModalSalvar(false)}
                onConfirm={finalizarFaturamento}
                title="Confirmar Faturamento"
                message={`Deseja confirmar o fechamento desta fatura no valor de ${formatCurrency(valorTotal)} dividida em ${listaPFParcela.length} parcela(s)?`}
                type="success"
                confirmText="Confirmar Fechamento"
                isLoading={isFinishing}
            />

            {/* Bloco 2: Configuração e Inserção de Parcelas */}
            <div className="ek-card p-4 sm:p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-ek-rule">
                    <div className="flex items-center gap-2.5">
                        <span className="w-1 h-4 bg-brand rounded-full" aria-hidden="true" />
                        <h3 className="text-sm font-semibold text-ek-text">
                            Dados da fatura
                        </h3>
                    </div>
                    {numParcelasRestantes > 0 && (
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-[6px] bg-brand-soft text-brand border border-brand-border tabular-nums">
                            {numParcelasRestantes} {numParcelasRestantes === 1 ? 'parcela restante' : 'parcelas restantes'}
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:items-end">
                    <div className="sm:col-span-4">
                        <label htmlFor="tipoPgm" className="ek-label">
                            Tipo de pagamento
                        </label>
                        <select
                            onKeyDown={keydownTipoPgm}
                            value={codTipoPgm}
                            onChange={e => setCodTipoPgm(e.target.value ? Number(e.target.value) : 0)}
                            name="tipoPgm"
                            id="tipoPgm"
                            className="ek-select uppercase"
                        >
                            {listaTipopgm && listaTipopgm.map(tp => (
                                <option key={tp.TP_CODIGO} value={tp.TP_CODIGO}>
                                    {tp.TP_DESCRICAO}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="edtVencimento" className="ek-label">
                            Vencimento
                        </label>
                        <input
                            type="date"
                            id="edtVencimento"
                            onKeyDown={keydownVencimento}
                            value={vencimentoStr}
                            onChange={e => setVencimentoStr(e.target.value)}
                            className="ek-input tabular-nums"
                        />
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="edtValorParcela" className="ek-label">
                            Valor da parcela
                        </label>
                        <input
                            id="edtValorParcela"
                            step={0.1}
                            onKeyDown={keydownValorParcela}
                            value={valorParcela ?? ''}
                            placeholder="0,00"
                            onChange={e => setValorParcela(e.target.value ? parseFloat(e.target.value) : 0)}
                            type="number"
                            min={0}
                            className="ek-input font-semibold tabular-nums"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <button
                            onClick={() => salvarParcela(parcela + 1)}
                            id="btnSalvar"
                            type="button"
                            disabled={(numParcelasRestantes === 0)}
                            className="ek-btn-primary w-full justify-center disabled:opacity-45 disabled:cursor-not-allowed"
                        >
                            <PlusCircle className="w-4 h-4" />
                            <span>Adicionar</span>
                        </button>
                    </div>
                </div>

                {/* Tabela de Parcelas */}
                <div className="w-full rounded-[6px] border border-ek-border bg-ek-surface overflow-hidden mt-1">
                    <div className="overflow-x-auto max-h-[220px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-ek-raised border-b border-ek-border text-ek-muted text-xs font-semibold sticky top-0 z-10">
                                    <th className="py-2.5 px-3">Duplicata</th>
                                    <th className="py-2.5 px-3">Vencimento</th>
                                    <th className="py-2.5 px-3">Tipo pagto</th>
                                    <th className="py-2.5 px-3 text-center">Juros</th>
                                    <th className="py-2.5 px-3 text-center">Descontos</th>
                                    <th className="py-2.5 px-3 text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ek-rule text-xs sm:text-[13px]">
                                {listaPFParcela.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-6 text-center text-ek-faint">
                                            Nenhuma parcela gerada ainda. Preencha os campos e pressione Enter.
                                        </td>
                                    </tr>
                                ) : (
                                    listaPFParcela.map((item) => (
                                        <tr key={item.PP_DUPLICATA} className="hover:bg-ek-raised/80 transition-colors">
                                            <td className="py-2.5 px-3 font-medium text-ek-text tabular-nums">{item.PP_DUPLICATA}</td>
                                            <td className="py-2.5 px-3 text-ek-muted tabular-nums">
                                                {Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', formatMatcher: 'basic' }).format(item.PP_VENCIMENTO)}
                                            </td>
                                            <td className="py-2.5 px-3 text-ek-text font-medium">{item.DescricaoTipoPgm}</td>
                                            <td className="py-2.5 px-3 text-center text-ek-muted tabular-nums">{item.PP_JUROS}</td>
                                            <td className="py-2.5 px-3 text-center text-ek-muted tabular-nums">{item.PP_DESCONTOS}</td>
                                            <td className="py-2.5 px-3 text-right font-semibold text-brand tabular-nums">
                                                {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(item.PP_VALOR)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Botão Finalizar */}
                <div className="pt-1">
                    <button
                        type="button"
                        disabled={(numParcelasRestantes !== 0) || (listaPFParcela.length === 0) || isFinishing}
                        className="ek-btn-primary w-full h-11 text-sm font-semibold justify-center disabled:opacity-45 disabled:cursor-not-allowed"
                        onClick={() => setShowModalSalvar(true)}
                    >
                        {isFinishing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <CheckCircle className="w-4 h-4" />
                        )}
                        <span>{isFinishing ? "Finalizando..." : "Finalizar faturamento"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
