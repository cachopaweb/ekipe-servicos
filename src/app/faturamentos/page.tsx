"use client"

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import PedFatModel from "../models/ped_fat_model";
import PFParcelaModel from "../models/pf_parcela_model";
import TipoPgmRepository from "../repositories/tipo_pgm_repository";
import { GeraCodigo, keyBoardInputEvent, keyBoardSelectEvent, toastMixin } from "../functions/utils";
import CliForModel from "../models/cli_for_model";
import Modal from "../components/modal";
import OperacoesStrategy from "./contracts/operacoes_interfaces";

interface FaturamentoProps {
    valorTotal: number;
    cliFor: CliForModel,
    setShowModal?: Dispatch<SetStateAction<boolean>>;
    Operacao: OperacoesStrategy,
    model: Object;
    itens: Object;
    itens2?: Object;
    pedFat: PedFatModel;
    setFaturado: Dispatch<SetStateAction<boolean>>;
    tipoRecPag: string;
}

export default function Faturamentos({ valorTotal, cliFor = {CODIGO: 1, NOME: 'GENERICO'}, setShowModal, Operacao, model, itens, itens2, pedFat, setFaturado, tipoRecPag }: FaturamentoProps) {
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

    useEffect(()=> {
        if (numParcelas && (numParcelas > 0))
            setValorDescontavel(valorTotal!)
    }, [valorTotal])

    useEffect(()=> {
        if (valorDescontavel > 0)
            setValorParcela(valorDescontavel)
    }, [valorDescontavel])
    
    useEffect(()=> {
        if ((listaPFParcela.length > 0) && (numParcelasRestantes === 0))
            setShowModalSalvar(true);
    }, [numParcelasRestantes])

    useEffect(()=>{
        buscaTipoPgm(tipoRecPag)        
    }, []);

    useEffect(()=> {
        iniciaCodFatura()
        const edtEntrada = document.getElementById('edtEntrada') as HTMLInputElement;
        edtEntrada!.select();
    }, [])

    const iniciaCodFatura = async ()=>{
        try {
            const cod = await GeraCodigo('FATURAMENTOS', 'FAT_CODIGO');
            setCodFatura(cod);  
            const codPedFat = await GeraCodigo('PED_FAT', 'PF_CODIGO');
            setCodPedFat(codPedFat);
        } catch (error) {
            toastMixin.fire('Erro ao iniciar codigo fatura', String(error), 'error'); 
        }
    }

    const buscaTipoPgm = async (tipo: string)=>{
        try {
            const repository = new TipoPgmRepository();
            const tp = await repository.buscaTipoPgm(tipo);
            setListaTipoPgm(tp);
        } catch (error) {
            toastMixin.fire('Erro ao buscar tipo pgm', String(error), 'error');
        }
    }

    const keydownEntrada = (e: keyBoardInputEvent)=>{
        if (e.key === 'Enter'){
            if (!vlrEntrada){                
                setVlrEntrada(0);
            }
            setParcela(0);
            setVencimento(new Date());
            setListaPFParcela([])
            const edtParcelas = document.getElementById('edtParcelas');
            edtParcelas?.focus()
        }
    }

    const keydownValorParcela = (e: keyBoardInputEvent)=>{
        if (e.key === 'Enter'){
            const btnSalvar = document.getElementById('btnSalvar');
            btnSalvar?.focus()
        }
    }

    const keydownTipoPgm = (e: keyBoardSelectEvent)=>{
        if (e.key === 'Enter'){
            const edtVencimento = document.getElementById('edtVencimento');
            edtVencimento?.focus()
        }
    }

    const keydownVencimento = (e: keyBoardInputEvent)=>{
        if (e.key === 'Enter'){
            const edtValorParcela = document.getElementById('edtValorParcela');
            edtValorParcela?.focus()
        }
    }

    const keyDownParcelas = async (e: keyBoardInputEvent)=>{
        const tipoPgm = listaTipopgm!.find((tp)=> tp.TP_CODIGO === 0);
        ////
        setParcela(0);
        setVencimento(new Date());
        if (e.key === 'Enter'){
            if (!numParcelas || numParcelas === 0){
                toastMixin.fire('Número de parcelas não informado!', 'Informe o número de parcelas', 'warning');
                return;
            }
            const edtTipoPgm = document.getElementById('tipoPgm');
            if (vlrEntrada && vlrEntrada != 0){ 
                const pfParcela: PFParcelaModel = {
                    PP_CODIGO: 0,
                    PP_DUPLICATA: `${codFatura}-1/${numParcelas!+1}`,
                    PP_DESCONTOS: 0,
                    PP_JUROS: 0,
                    PP_ESTADO: 2,
                    PP_PF: codPedFat,
                    PP_TP: tipoPgm!.TP_CODIGO,
                    PP_VALOR: vlrEntrada!,
                    PP_VALORPG: vlrEntrada!,
                    PP_VENCIMENTO: vencimento,
                    DescricaoTipoPgm: tipoPgm!.TP_DESCRICAO
                }
                setNumParcelasRestantes(numParcelas!);
                setValorDescontavel(parseFloat(((valorTotal! - vlrEntrada!)/numParcelas!).toFixed(2)));

                setListaPFParcela([pfParcela])
                setParcela(1);
                setVencimento(new Date(vencimento.setDate(vencimento.getDate() + 30)))
                edtTipoPgm?.focus();
            }else{
                setNumParcelasRestantes(numParcelas!);
                setValorDescontavel(valorTotal!/numParcelas!);
                setListaPFParcela([])
                edtTipoPgm?.focus();
            }
        }
    }

    const salvarParcela = async (nparcela: number)=>{
        const tipoPgm = listaTipopgm!.find((tp)=> tp.TP_CODIGO === codTipoPgm);        
        const edtTipoPgm = document.getElementById('tipoPgm');
        const pfParcela: PFParcelaModel = {
            PP_CODIGO: 0,
            PP_DUPLICATA: `${codFatura}-${nparcela}/${vlrEntrada && vlrEntrada > 0 ? numParcelas!+1: numParcelas}`,
            PP_DESCONTOS: 0,
            PP_JUROS: 0,
            PP_ESTADO: 2,
            PP_PF: codPedFat,
            PP_TP: tipoPgm!.TP_CODIGO,
            PP_VALOR: valorParcela!,
            PP_VALORPG: 0,
            PP_VENCIMENTO: vencimento,
            DescricaoTipoPgm: tipoPgm!.TP_DESCRICAO
        }        
        if (numParcelasRestantes === 1){
            setValorDescontavel(valorDescontavel);
        }else{
            setValorDescontavel(valorDescontavel - parseFloat(valorParcela!.toFixed(2)));
        }
        setNumParcelasRestantes(numParcelasRestantes-1);
        setListaPFParcela(old=>[...old, pfParcela])
        setVencimento(new Date(vencimento.setDate(vencimento.getDate() + 30)))
        setParcela(nparcela);
        edtTipoPgm?.focus();
    }

    const finalizarFaturamento = async ()=>{
        try {
            toastMixin.fire('Aguarde...', 'finalizando faturamento', 'info');
            pedFat.PF_COD_CLI = cliFor.CODIGO;
            pedFat.PF_VALOR = valorTotal!;
            pedFat.PF_VALORB = valorTotal!;
            pedFat.PF_VALORPG = vlrEntrada!;
            pedFat.PF_PARCELAS = (vlrEntrada! && numParcelas!) > 0 ? numParcelas! + 1: numParcelas!;
            setShowModalSalvar(false)
            await Operacao.insereOperacao(model);
            await Operacao.insereItens(itens);
            await Operacao.insereItens2(itens2);
            await Operacao.inserePedFat(pedFat!);
            await Operacao.inserePFParcelas(listaPFParcela);
            toastMixin.fire('Finalizado', 'Faturamento finalizado com sucesso', 'success');
            setFaturado(true);
            setShowModal!(false);//fecha ele proprio
        } catch (error) {
            toastMixin.fire('Erro ao finalizar faturamento', String(error), 'error')   
        }
    }

    const ModalSalvar = () => {
        return (
            <Modal showModal={showModalSalvar} setShowModal={setShowModalSalvar}
                title="Finalizar Faturamento"
                showButtonExit={false}
                body={
                    <div>
                        <button
                            className="bg-red-500 text-white active:bg-red-600 font-bold uppercase p-1 text-sm px-2 mx-1 rounded shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150 flex-3"
                            type="button"
                            onClick={() => setShowModalSalvar(false)}
                        >
                            <i className="fa fa-solid fa-floppy-disk text-white p-2"></i>
                            Cancelar
                        </button>
                        <button
                            className="bg-green-500 text-white active:bg-green-600 font-bold uppercase p-1 text-sm px-2 mx-1 rounded shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150 flex-3"
                            type="button"
                            onClick={finalizarFaturamento}
                        >
                            <i className="fa fa-solid fa-floppy-disk text-white p-2"></i>
                            Confirmar
                        </button>
                    </div>
                }
            />
        );
    }
    

    return (
        <div className="bg-gray-300 rounded-lg shadow-md w-full">
            <div className="flex flex-col gap-2 bg-white shadow-md w-full rounded-lg">
                <div className="flex">
                    <div className="flex flex-col p-2 flex-1">
                        <label htmlFor="codFatura" className="text-black font-bold text-md">Cód. Fatura</label>
                        <span className="text-black font-bold text-xl">{codFatura}</span>
                    </div>
                    <div className="flex flex-col p-2">
                        <label htmlFor="codFatura" className="text-red-700 font-bold text-md">Valor Total</label>
                        <span className="text-red-800 font-bold text-2xl">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(valorTotal!)}</span>
                    </div>
                </div>
                <div className="flex">
                    <div className="flex flex-col p-2 w-44">
                        <label htmlFor="codFatura" className="text-black font-bold text-md">Entrada</label>
                        <input type="number" placeholder="0" step={0.1} min={0} max={valorTotal!} autoFocus id="edtEntrada" value={vlrEntrada} onChange={e=> setVlrEntrada(e.target.value ? parseFloat(e.target.value): 0)} onKeyDown={keydownEntrada} className="border border-amber-400 p-2 rounded-md" />
                    </div>
                    <div className="flex justify-center items-center">
                        <span className="text-2xl font-bold">+</span>
                    </div>
                    <div className="flex flex-col p-2 w-32">
                        <label htmlFor="codFatura" className="text-black font-bold text-md">N° Parcela</label>
                        <input id="edtParcelas" value={numParcelas ?? ''} placeholder="0" onChange={e=> setNumParcelas(e.target.value ? parseInt(e.target.value) : 0)} onKeyDown={keyDownParcelas} type="number" min={0} className="border border-amber-400 p-2 rounded-md" />
                    </div>
                    <div className="flex flex-col p-2 flex-1">
                        <label htmlFor="codFatura" className="text-black font-bold text-md">Consumidor</label>
                        <input value={cliFor.NOME ?? ''} readOnly type="text" className="border border-amber-400 p-2 rounded-md" />
                    </div>
                </div>
            </div>
            {showModalSalvar && <ModalSalvar />}
            <div className="flex flex-col gap-2 bg-white shadow-md w-full rounded-lg mt-2">
                <h2 className="text-md rounded-t-md font-bold text-black bg-amber-400 p-2">Dados da Fatura</h2>
                <div className="flex">
                    <div className="flex flex-col p-2 w-72">
                        <label htmlFor="codFatura" className="text-black font-bold text-md">Tipo Pgm</label>
                        <select onKeyDown={keydownTipoPgm} value={codTipoPgm} onChange={e=> setCodTipoPgm(e.target.value ? parseInt(e.target.value) : 0)} name="tipoPgm" id="tipoPgm" className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400">
                            {listaTipopgm && listaTipopgm?.map(tp=> <option key={tp.TP_CODIGO} value={tp.TP_CODIGO}>{tp.TP_DESCRICAO}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col p-2">
                        <label htmlFor="codFatura" className="text-red-700 font-bold text-md">Vencimento</label>                        
                        <input type="date" id="edtVencimento" onKeyDown={keydownVencimento} value={Intl.DateTimeFormat("fr-CA",{year: "numeric", month: "2-digit", day: "2-digit"}).format(vencimento)} onChange={e=> setVencimento(e.target.value ? new Date(e.target.value) : new Date())} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400" />
                    </div>
                    <div className="flex flex-col p-2 w-44">
                        <label htmlFor="codFatura" className="text-black font-bold text-md">Valor</label>
                        <input id="edtValorParcela" step={0.1} onKeyDown={keydownValorParcela} value={valorParcela ?? ''} placeholder="0" onChange={e=> setValorParcela(e.target.value ? parseFloat(e.target.value) : 0)} type="number" min={0} className="border border-amber-400 p-1 rounded-md" />
                    </div>
                    <div className="flex flex-col justify-center items-center">
                        <button onClick={e=> salvarParcela(parcela+1)} 
                        id="btnSalvar"
                        disabled={(numParcelasRestantes === 0)}
                        className={`rounded-md ${(numParcelasRestantes === 0) ? 'bg-gray-400' : 'bg-black'} text-white h-16 w-24 mr-2`}
                        >
                            Salvar
                        </button>
                    </div>
                </div>
                <div className="flex">
                    <table className="table-auto w-full">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 text-left border-b-2">
                                    <h2 className="text-ml font-bold text-gray-600">Duplicata</h2>
                                </th>
                                <th className="px-4 py-2 text-left border-b-2">
                                    <h2 className="text-ml font-bold text-gray-600">Vencimento</h2>
                                </th>
                                <th className="px-4 py-2 text-left border-b-2">
                                    <h2 className="text-ml font-bold text-gray-600">Tipo Pgm</h2>
                                </th>
                                <th className="px-4 py-2 text-left border-b-2">
                                    <h2 className="text-ml font-bold text-gray-600">Juros</h2>
                                </th>
                                <th className="px-4 py-2 text-left border-b-2">
                                    <h2 className="text-ml font-bold text-gray-600">Descontos</h2>
                                </th>
                                <th className="px-4 py-2 text-left border-b-2">
                                    <h2 className="text-ml font-bold text-gray-600">Valor</h2>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {listaPFParcela.map((item) =>
                                <tr key={item.PP_DUPLICATA} className="border-b w-full">
                                    <td className="px-4 py-2 text-left">
                                        <div>
                                            <h2>{item.PP_DUPLICATA}</h2>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-left">
                                        <div>
                                            <h2>{Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', formatMatcher: 'basic' }).format(item.PP_VENCIMENTO)}</h2>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-left">
                                        <p><span>{item.DescricaoTipoPgm}</span></p>
                                    </td>
                                    <td className="px-4 py-2 text-left text-amber-500">
                                        <p><span>{item.PP_JUROS}</span></p>
                                    </td>
                                    <td className="px-4 py-2 text-left">
                                        <div>
                                            <h2>{item.PP_DESCONTOS}</h2>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-left text-amber-500">
                                        <p><span>R$ {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(item.PP_VALOR)}</span></p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex flex-col justify-center items-center p-2">
                    <button 
                        disabled={(numParcelasRestantes != 0)} 
                        className={`rounded-md ${(numParcelasRestantes === 0) && (listaPFParcela.length > 0) ? 'bg-green-700': 'bg-gray-400'} text-white h-16 p-2 w-full`}
                        onClick={e=> setShowModalSalvar(true)}
                    >
                        Finalizar
                    </button>
                </div>
            </div>
        </div>
    );
}