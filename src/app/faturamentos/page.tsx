"use client"

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import PedFatModel from "../models/ped_fat_model";
import PFParcelaModel from "../models/pf_parcela_model";
import Swal from "sweetalert2";
import TipoPgmRepository from "../repositories/tipo_pgm_repository";
import { GeraCodigo, keyBoardInputEvent, keyBoardSelectEvent } from "../functions/utils";
import CliForModel from "../models/cli_for_model";
import Modal from "../components/modal";

interface FaturamentoProps {
    valorTotal: number;
    cliFor: CliForModel,
    setShowModal: Dispatch<SetStateAction<boolean>>;
}

export default function Faturamentos({ valorTotal, cliFor, setShowModal }: FaturamentoProps) {
    const [codFatura, setCodFatura] = useState(0);
    const [codPedFat, setCodPedFat] = useState(0);
    const [pedFat, setPedFat] = useState<PedFatModel>();
    const [listaPFParcela, setListaPFParcela] = useState<PFParcelaModel[]>([]);
    const [listaTipopgm, setListaTipoPgm] = useState<TipoPgmModel[]>([]);
    const [vlrEntrada, setVlrEntrada] = useState(0);
    const [numParcelas, setNumParcelas] = useState(0);
    const [valorParcela, setValorParcela] = useState(0);
    const [valorDescontavel, setValorDescontavel] = useState(0);
    const [numParcelasRestantes, setNumParcelasRestantes] = useState(0);
    const [parcela, setParcela] = useState(0);  
    const [showModalSalvar, setShowModalSalvar] = useState(false);
    const [codTipoPgm, setCodTipoPgm] = useState(0);

    useEffect(()=> {
        if (numParcelas > 0)
            setValorDescontavel(valorTotal)
    }, [valorTotal])

    useEffect(()=> {
        if (valorDescontavel > 0)
            setValorParcela(valorDescontavel)
    }, [valorDescontavel])

    useEffect(()=>{
        buscaTipoPgm()
    }, []);

    useEffect(()=> {
        iniciaCodFatura()
    }, [])

    const iniciaCodFatura = async ()=>{
        try {
            const cod = await GeraCodigo('FATURAMENTOS', 'FAT_CODIGO');
            setCodFatura(cod);  
            const codPedFat = await GeraCodigo('PED_FAT', 'PF_CODIGO');
            setCodPedFat(codPedFat);
        } catch (error) {
            Swal.fire('Erro ao iniciar codigo fatura', String(error), 'error'); 
        }
    }

    const buscaTipoPgm = async ()=>{
        try {
            const repository = new TipoPgmRepository();
            const tp = await repository.buscaTipoPgm('R');
            setListaTipoPgm(tp);
        } catch (error) {
            Swal.fire('Erro ao buscar tipo pgm', String(error), 'error');
        }
    }

    const keydownEntrada = (e: keyBoardInputEvent)=>{
        if (e.key === 'Enter'){
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
            const edtValorParcela = document.getElementById('edtValorParcela');
            edtValorParcela?.focus()
        }
    }

    const keyDownParcelas = async (e: keyBoardInputEvent)=>{
        const tipoPgm = listaTipopgm.find((tp)=> tp.TP_CODIGO === 0);
        ////
        setParcela(0);
        if (e.key === 'Enter'){
            if (numParcelas === 0){
                Swal.fire('Número de parcelas não informado!', 'Informe o número de parcelas', 'warning');
                return;
            }
            const edtTipoPgm = document.getElementById('tipoPgm');
            if (vlrEntrada != 0){ 
                const pfParcela: PFParcelaModel = {
                    PP_CODIGO: 0,
                    PP_DUPLICATA: `${codFatura}-1/${numParcelas+1}`,
                    PP_DESCONTOS: 0,
                    PP_JUROS: 0,
                    PP_ESTADO: 2,
                    PP_PF: codPedFat,
                    PP_TP: tipoPgm!.TP_CODIGO,
                    PP_VALOR: vlrEntrada,
                    PP_VALORPG: vlrEntrada,
                    PP_VENCIMENTO: new Date(),
                    DescricaoTipoPgm: tipoPgm!.TP_DESCRICAO
                }
                setNumParcelasRestantes(numParcelas);
                setValorDescontavel(parseFloat(((valorTotal - vlrEntrada)/numParcelas).toFixed(2)));
                setListaPFParcela([pfParcela])
                setParcela(1);
                edtTipoPgm?.focus();
            }else{
                edtTipoPgm?.focus();
            }
        }
    }

    const salvarParcela = async (nparcela: number)=>{
        const tipoPgm = listaTipopgm.find((tp)=> tp.TP_CODIGO === codTipoPgm);        
        const edtTipoPgm = document.getElementById('tipoPgm');
        const pfParcela: PFParcelaModel = {
            PP_CODIGO: 0,
            PP_DUPLICATA: `${codFatura}-${nparcela}/${numParcelas+1}`,
            PP_DESCONTOS: 0,
            PP_JUROS: 0,
            PP_ESTADO: 2,
            PP_PF: codPedFat,
            PP_TP: tipoPgm!.TP_CODIGO,
            PP_VALOR: valorParcela,
            PP_VALORPG: 0,
            PP_VENCIMENTO: new Date(),
            DescricaoTipoPgm: tipoPgm!.TP_DESCRICAO
        }
        console.log(numParcelasRestantes)
        if (numParcelasRestantes === 1){
            setValorDescontavel(valorDescontavel);
        }else{
            setValorDescontavel(valorDescontavel - parseFloat(valorParcela.toFixed(2)));
        }
        setNumParcelasRestantes(numParcelasRestantes-1);
        setListaPFParcela(old=>[...old, pfParcela])
        setParcela(nparcela);
        edtTipoPgm?.focus();
    }

    const finalizarFaturamento = ()=>{
        try {
            Swal.fire('finalizando', 'finalizando faturamento', 'success')
            setShowModalSalvar(false)
            setShowModal(false);//fecha ele proprio
        } catch (error) {
            Swal.fire('Erro ao finalizar faturamento', String(error), 'error')   
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
                        <span className="text-red-800 font-bold text-2xl">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(valorTotal)}</span>
                    </div>
                </div>
                <div className="flex">
                    <div className="flex flex-col p-2 w-44">
                        <label htmlFor="codFatura" className="text-black font-bold text-md">Entrada</label>
                        <input id="edtEntrada" value={vlrEntrada} onChange={e=> setVlrEntrada(parseFloat(e.target.value))} onKeyDown={keydownEntrada} type="text" className="border border-amber-400 p-2 rounded-md" />
                    </div>
                    <div className="flex justify-center items-center">
                        <span className="text-2xl font-bold">+</span>
                    </div>
                    <div className="flex flex-col p-2 w-32">
                        <label htmlFor="codFatura" className="text-black font-bold text-md">N° Parcela</label>
                        <input id="edtParcelas" value={numParcelas} onChange={e=> setNumParcelas(parseInt(e.target.value))} onKeyDown={keyDownParcelas} type="text" className="border border-amber-400 p-2 rounded-md" />
                    </div>
                    <div className="flex flex-col p-2 flex-1">
                        <label htmlFor="codFatura" className="text-black font-bold text-md">Consumidor</label>
                        <input defaultValue={cliFor.NOME} readOnly type="text" className="border border-amber-400 p-2 rounded-md" />
                    </div>
                </div>
            </div>
            {showModalSalvar && <ModalSalvar />}
            <div className="flex flex-col gap-2 bg-white shadow-md w-full rounded-lg mt-2">
                <h2 className="text-md rounded-t-md font-bold text-black bg-amber-400 p-2">Dados da Fatura</h2>
                <div className="flex">
                    <div className="flex flex-col p-2 w-72">
                        <label htmlFor="codFatura" className="text-black font-bold text-md">Tipo Pgm</label>
                        <select onKeyDown={keydownTipoPgm} value={codTipoPgm} onChange={e=> setCodTipoPgm(parseInt(e.target.value))} name="tipoPgm" id="tipoPgm" className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400">
                            {listaTipopgm.map(tp=> <option value={tp.TP_CODIGO}>{tp.TP_DESCRICAO}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col p-2">
                        <label htmlFor="codFatura" className="text-red-700 font-bold text-md">Vencimento</label>
                        <span className="text-red-800 font-bold text-xl">{Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', formatMatcher: 'basic' }).format(new Date())}</span>
                    </div>
                    <div className="flex flex-col p-2 w-44">
                        <label htmlFor="codFatura" className="text-black font-bold text-md">Valor</label>
                        <input id="edtValorParcela" onKeyDown={keydownValorParcela} value={valorParcela} onChange={e=> setValorParcela(parseFloat(e.target.value))} type="text" className="border border-amber-400 p-1 rounded-md" />
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
                                <tr className="border-b w-full">
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