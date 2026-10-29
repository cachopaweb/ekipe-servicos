"use client"

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import PedFatModel from "../models/ped_fat_model";
import PFParcelaModel from "../models/pf_parcela_model";
import TipoPgmRepository from "../repositories/tipo_pgm_repository";
import { IncrementaGenerator, keyBoardInputEvent, keyBoardSelectEvent, toastMixin } from "../functions/utils";
import CliForModel from "../models/cli_for_model";
import Modal from "../../components/component/modal";
import OperacoesStrategy from "./contracts/operacoes_interfaces";
import { CheckCircle, AlertCircle, PlusCircle, CreditCard } from "lucide-react";

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
    const [codTipoPgm, setCodTipoPgm] = useState(0);
    const [vencimento, setVencimento] = useState(new Date());

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
            const cod = await IncrementaGenerator('GEN_FAT');
            setCodFatura(cod);
            const codPedFat = await IncrementaGenerator('GEN_PF');
            setCodPedFat(codPedFat);
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
            setVencimento(new Date());
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
        setVencimento(new Date());
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
                    PP_VENCIMENTO: vencimento,
                    DescricaoTipoPgm: tipoPgm?.TP_DESCRICAO ?? 'DINHEIRO'
                }
                setNumParcelasRestantes(numParcelas!);
                setValorDescontavel(parseFloat(((valorTotal! - vlrEntrada!) / numParcelas!).toFixed(2)));

                setListaPFParcela([pfParcela])
                setParcela(1);
                setVencimento(new Date(vencimento.setDate(vencimento.getDate() + 30)))
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
            PP_VENCIMENTO: vencimento,
            DescricaoTipoPgm: tipoPgm?.TP_DESCRICAO ?? ''
        }
        if (numParcelasRestantes === 1) {
            setValorDescontavel(valorDescontavel);
        } else {
            setValorDescontavel(valorDescontavel - parseFloat(valorParcela!.toFixed(2)));
        }
        setNumParcelasRestantes(numParcelasRestantes - 1);
        setListaPFParcela(old => [...old, pfParcela])
        setVencimento(new Date(vencimento.setDate(vencimento.getDate() + 30)))
        setParcela(nparcela);
        edtTipoPgm?.focus();
    }

    const finalizarFaturamento = async () => {
        try {
            toastMixin.fire('Aguarde...', 'finalizando faturamento', 'info');
            pedFat.PF_COD_CLI = cliFor.CODIGO;
            pedFat.PF_VALOR = valorTotal!;
            pedFat.PF_VALORB = valorTotal!;
            pedFat.PF_VALORPG = vlrEntrada!;
            pedFat.PF_PARCELAS = (vlrEntrada! && numParcelas!) > 0 ? numParcelas! + 1 : numParcelas!;
            setShowModalSalvar(false)
            await Operacao.insereOperacao(model);
            await Operacao.insereItens(itens);
            await Operacao.insereItens2?.(itens2);
            await Operacao.inserePedFat(pedFat!);
            await Operacao.inserePFParcelas(listaPFParcela);
            toastMixin.fire('Finalizado', 'Faturamento finalizado com sucesso', 'success');
            setFaturado(true);
            setShowModal?.(false);
        } catch (error) {
            toastMixin.fire('Erro ao finalizar faturamento', String(error), 'error')
        }
    }

    const ModalSalvar = () => {
        return (
            <Modal
                showModal={showModalSalvar}
                setShowModal={setShowModalSalvar}
                title="Confirmar Faturamento"
                showButtonExit={false}
                body={
                    <div className="flex flex-col gap-4 py-2 font-sans">
                        <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                            <div className="text-sm text-stone-700">
                                Deseja confirmar o fechamento desta fatura no valor de{" "}
                                <span className="font-bold text-stone-900">
                                    {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(valorTotal!)}
                                </span>{" "}
                                dividida em <span className="font-bold text-stone-900">{listaPFParcela.length} parcela(s)</span>?
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                className="px-4 py-2 text-sm font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg shadow-sm transition-colors"
                                type="button"
                                onClick={() => setShowModalSalvar(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                                type="button"
                                onClick={finalizarFaturamento}
                            >
                                <CheckCircle className="w-4 h-4" />
                                Confirmar Fechamento
                            </button>
                        </div>
                    </div>
                }
            />
        );
    }

    return (
        <div ref={refDivFatura} className="flex flex-col gap-4 font-sans text-stone-800">
            {/* Bloco 1: Resumo e Dados Iniciais */}
            <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-100/70 border border-amber-200 flex items-center justify-center text-amber-700">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                                Cód. Fatura
                            </span>
                            <span className="font-mono text-lg font-bold text-stone-800">
                                #{codFatura || '---'}
                            </span>
                        </div>
                    </div>

                    <div className="text-left sm:text-right">
                        <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                            Valor Total a Faturar
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
                            {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(valorTotal!)}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:items-end">
                    <div className="sm:col-span-3">
                        <label htmlFor="edtEntrada" className="text-xs font-semibold text-stone-600 mb-1 block">
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
                            className="w-full bg-white border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-lg px-3 py-2 text-sm text-stone-800 font-semibold transition-all outline-none"
                        />
                    </div>

                    <div className="hidden sm:flex sm:col-span-1 items-center justify-center pb-2 text-stone-400 font-bold text-xl">
                        +
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="edtParcelas" className="text-xs font-semibold text-stone-600 mb-1 block">
                            N° Parcelas
                        </label>
                        <input
                            id="edtParcelas"
                            value={numParcelas ?? ''}
                            placeholder="0"
                            onChange={e => setNumParcelas(e.target.value ? parseInt(e.target.value) : 0)}
                            onKeyDown={keyDownParcelas}
                            type="number"
                            min={0}
                            className="w-full bg-white border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-lg px-3 py-2 text-sm text-stone-800 font-semibold transition-all outline-none"
                        />
                    </div>

                    <div className="sm:col-span-5">
                        <label className="text-xs font-semibold text-stone-600 mb-1 block">
                            Cliente / Consumidor
                        </label>
                        <input
                            value={cliFor.NOME ?? ''}
                            readOnly
                            type="text"
                            className="w-full bg-stone-100 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 font-semibold cursor-not-allowed outline-none truncate"
                        />
                    </div>
                </div>
            </div>

            {showModalSalvar && <ModalSalvar />}

            {/* Bloco 2: Configuração e Inserção de Parcelas */}
            <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                        <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span>
                        <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wider">
                            Dados da Fatura
                        </h3>
                    </div>
                    {numParcelasRestantes > 0 && (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            {numParcelasRestantes} {numParcelasRestantes === 1 ? 'parcela restante' : 'parcelas restantes'}
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:items-end">
                    <div className="sm:col-span-4">
                        <label htmlFor="tipoPgm" className="text-xs font-semibold text-stone-600 mb-1 block">
                            Tipo Pagamento
                        </label>
                        <select
                            onKeyDown={keydownTipoPgm}
                            value={codTipoPgm}
                            onChange={e => setCodTipoPgm(e.target.value ? Number(e.target.value) : 0)}
                            name="tipoPgm"
                            id="tipoPgm"
                            className="w-full bg-white border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-lg px-3 py-2 text-sm text-stone-800 font-medium transition-all outline-none uppercase"
                        >
                            {listaTipopgm && listaTipopgm.map(tp => (
                                <option key={tp.TP_CODIGO} value={tp.TP_CODIGO}>
                                    {tp.TP_DESCRICAO}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="edtVencimento" className="text-xs font-semibold text-stone-600 mb-1 block">
                            Vencimento
                        </label>
                        <input
                            type="date"
                            id="edtVencimento"
                            onKeyDown={keydownVencimento}
                            value={Intl.DateTimeFormat("fr-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(vencimento)}
                            onChange={e => setVencimento(e.target.value ? new Date(e.target.value) : new Date())}
                            className="w-full bg-white border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-lg px-3 py-2 text-sm text-stone-800 font-medium transition-all outline-none"
                        />
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="edtValorParcela" className="text-xs font-semibold text-stone-600 mb-1 block">
                            Valor Parcela
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
                            className="w-full bg-white border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-lg px-3 py-2 text-sm text-stone-800 font-bold transition-all outline-none"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <button
                            onClick={() => salvarParcela(parcela + 1)}
                            id="btnSalvar"
                            type="button"
                            disabled={(numParcelasRestantes === 0)}
                            className="w-full h-[38px] px-3 rounded-lg text-xs font-bold text-white shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed bg-amber-500 hover:bg-amber-600 active:scale-[0.98]"
                        >
                            <PlusCircle className="w-4 h-4" />
                            <span>Adicionar</span>
                        </button>
                    </div>
                </div>

                {/* Tabela de Parcelas */}
                <div className="w-full rounded-xl border border-stone-200 bg-white overflow-hidden shadow-sm mt-1">
                    <div className="overflow-x-auto max-h-[220px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-stone-50/90 border-b border-stone-200 text-stone-600 text-xs font-semibold uppercase tracking-wider sticky top-0 z-10">
                                    <th className="py-2.5 px-3">Duplicata</th>
                                    <th className="py-2.5 px-3">Vencimento</th>
                                    <th className="py-2.5 px-3">Tipo Pgm</th>
                                    <th className="py-2.5 px-3 text-center">Juros</th>
                                    <th className="py-2.5 px-3 text-center">Descontos</th>
                                    <th className="py-2.5 px-3 text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 text-xs sm:text-sm">
                                {listaPFParcela.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-6 text-center text-stone-400">
                                            Nenhuma parcela gerada ainda. Preencha os campos e pressione Enter.
                                        </td>
                                    </tr>
                                ) : (
                                    listaPFParcela.map((item) => (
                                        <tr key={item.PP_DUPLICATA} className="hover:bg-amber-50/30 transition-colors">
                                            <td className="py-2.5 px-3 font-semibold text-stone-800">{item.PP_DUPLICATA}</td>
                                            <td className="py-2.5 px-3 text-stone-600 font-mono">
                                                {Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', formatMatcher: 'basic' }).format(item.PP_VENCIMENTO)}
                                            </td>
                                            <td className="py-2.5 px-3 text-stone-700 font-medium">{item.DescricaoTipoPgm}</td>
                                            <td className="py-2.5 px-3 text-center text-stone-500 font-mono">{item.PP_JUROS}</td>
                                            <td className="py-2.5 px-3 text-center text-stone-500 font-mono">{item.PP_DESCONTOS}</td>
                                            <td className="py-2.5 px-3 text-right font-bold text-amber-600 font-mono">
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
                <div className="pt-2">
                    <button
                        type="button"
                        disabled={(numParcelasRestantes !== 0) || (listaPFParcela.length === 0)}
                        className="w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base text-white shadow-sm transition-all flex items-center justify-center gap-2 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99]"
                        onClick={() => setShowModalSalvar(true)}
                    >
                        <CheckCircle className="w-5 h-5" />
                        <span>Finalizar Faturamento</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
