"use client"
import {toastMixin } from "@/app/functions/utils";
import CliForModel from "@/app/models/cli_for_model";
import EmpreitadasModel from "@/app/models/empreitadas_model";
import OrdemModel from "@/app/models/ordem_model";
import EmpreitadasServicosModel from "../../models/empreitada_servicos_model";
import {useCallback, useEffect, useMemo, useRef, useState } from "react";
import EmpreitadasRepository from "@/app/repositories/empreitadas_repository";
import PesquisaFornecedor from "@/app/pesquisas/pesquisa_fornecedor";
import CliForRepository from "../../repositories/cli_for_repository";
import EmpreitadaModal from "./empreitada";
import { useAppData } from "@/app/contexts/app_context";

interface empreitadasProps {
    ordemServico: OrdemModel;
}

export default function Empreitadas({ ordemServico }: empreitadasProps) {
    //tamanho da tela
    const refDivServicos = useRef<HTMLDivElement>(null);
    const [divWidthServicos, setDivWidthServicos] = useState<number>(0);
    useEffect(() => {
        setDivWidthServicos(refDivServicos.current ? refDivServicos.current.offsetWidth : 0);
    }, [refDivServicos.current]);
    /////

    const [listaEmpreitadas, setListaEmpreitadas] = useState<EmpreitadasModel[]>([]);
    const [fornecedorSelecionado, setFornecedorSelecionado] = useState<CliForModel>({ CODIGO: 0, NOME: 'GENERICO' });
    const [showModalPesquisaFornecedor, setShowModalPesquisaFornecedor] = useState(false);
    const [empreitadaSelecionada, setEmpreitadaSelecionada] = useState<EmpreitadasModel | undefined>(undefined)
    const [indiceEmpreitada, setIndiceEmpreitada] = useState(0);
    const [showModalEmpreitada, setShowModalEmpreitada] = useState(false);

    useEffect(()=>{
        buscaEmpreitadas();
    },[])


    const buscaEmpreitada = async () =>{

        if(listaEmpreitadas[indiceEmpreitada] != undefined)
        {
            const repository = new EmpreitadasRepository();
            const repositoryfornecedor = new CliForRepository();
            var empreitada : EmpreitadasModel ;
            
            if(listaEmpreitadas[indiceEmpreitada].EMP_CODIGO === 0)
            {
                empreitada = listaEmpreitadas[indiceEmpreitada]
                empreitada.FORNECEDOR = await repositoryfornecedor.getCliFor(empreitada.EMP_FOR);
            }
            else
            {
                empreitada  = await repository.buscaEmpreitadaById(listaEmpreitadas[indiceEmpreitada].EMP_CODIGO);
                const servicos = await buscaServicosEmpreitadas(empreitada.EMP_CODIGO);
                empreitada.FORNECEDOR = await repositoryfornecedor.getCliFor(empreitada.EMP_FOR);
                empreitada.ITENS = servicos??[];
            }        
            setEmpreitadaSelecionada(empreitada);
        }
    }
    const cacheEmpreitadas = useCallback(async () => {
     
        const repository = new EmpreitadasRepository();
        const repositoryfornecedor = new CliForRepository();
        const response = await repository.buscaEmpreitadas(ordemServico.ORD_CODIGO);
        for(var i = 0; i <= response.length; i++){
            if (response[i]){
                if(response[i].EMP_FOR)
                {
                    response[i].FORNECEDOR = await repositoryfornecedor.getCliFor(response[i].EMP_FOR + 2000000);
                }
            }
        }        
        return response;
    }, [])

    useEffect(() => {
        if (fornecedorSelecionado.CODIGO > 0) {
            let listaServicos: Array<EmpreitadasServicosModel> = [];
            if (ordemServico.itensOrdSer.length > 0) {
                ordemServico.itensOrdSer.map(os => {
                    listaServicos.push({
                        ES_CODIGO: 0,
                        DESCRICAO: os.OS_NOME,
                        ES_EMP: 0,
                        ES_PRAZO_CONCLUSAO: new Date().toLocaleDateString(),
                        ES_QUANTIDADE: os.OS_QUANTIDADE,
                        ES_UNIDADE: os.OS_UNIDADE_MED,
                        VLR_UNIT: os.OS_VALOR / os.OS_QUANTIDADE,
                        ES_VALOR: os.OS_VALOR,
                    })
                });
            }
            setListaEmpreitadas(old => [...old, {
                EMP_CODIGO: 0,
                EMP_ORD: ordemServico.ORD_CODIGO,
                FOR_NOME: fornecedorSelecionado!.NOME,
                EMP_FOR: fornecedorSelecionado!.CODIGO,
                LRC_FAT2: 0,
                EMP_VALOR: 0,
                ITENS: listaServicos,
                FORNECEDOR: fornecedorSelecionado,

            }])
        }
    }, [fornecedorSelecionado])




    const buscaEmpreitadas = async () => {
        try {
            const emp = await cacheEmpreitadas();
            setListaEmpreitadas(emp);
        } catch (error) {
            toastMixin.fire('Erro', 'Erro ao buscar empreitadas', 'error');
        }
    }

    async function buscaServicosEmpreitadas(codEmpreitada: number) {
        try {
            if (codEmpreitada > 0) {
                const repository = new EmpreitadasRepository();
                const data = await repository.buscaServicosEmpreitadas(codEmpreitada);
                return data;
            } else {
                return [];
            }
        } catch (error) {
            toastMixin.fire('Erro', 'Erro ao buscar Servicos empreitadas', 'error');
        }
    }



    const BuildBody = () => {


        const excluirEmpreitada = (indiceEmpreitada: number) => {
            const lista = Array.from(listaEmpreitadas);
            setIndiceEmpreitada(0);
            lista.splice(indiceEmpreitada, 1);
            setListaEmpreitadas(lista);
        }

        const selecionaEmpreitada = (indice:number) =>{
            setEmpreitadaSelecionada({...listaEmpreitadas[indice]});
            setShowModalEmpreitada(true);
            setIndiceEmpreitada(indice);
        }

        const excluirServicoEmpreitada = (id: number) => {
            const idEmpreitada = listaEmpreitadas.findIndex(e => e.EMP_CODIGO === id);
            const lista = Array.from(listaEmpreitadas);
            lista.splice(idEmpreitada, 1);
            setListaEmpreitadas(lista);
        }

        return (
            <div  className="overflow-scroll w-[48rem] h-[32rem]">
                <div>
                    <div className="shadow-md my-4">
                        <h2 className="text-md rounded-t-md font-bold text-black bg-amber-400 p-2">Prestadores</h2>
                        <table className="w-full flex sm:flex-col flex-nowrap sm:bg-white rounded-lg overflow-hidden sm:shadow-lg my-5">
                            <thead className="text-white">
                                <tr className="bg-amber-400 flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0">
                                    <th className="p-3 text-left w-full">Prestador</th>
                                    <th className="p-3 text-left ">Fatura</th>
                                    <th className="p-3 text-left">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="flex-1 sm:flex-none">
                                {listaEmpreitadas.length > 0  && listaEmpreitadas.map((item, index) =>
                                {
                                    
                                    if(!item.FORNECEDOR)
                                    {
                                        return(<></>)
                                    }
                                    return(
                                    <tr key={item.EMP_CODIGO} onClick={e => selecionaEmpreitada(index)} className={`flex flex-col flex-nowrap sm:table-row mb-2 cursor-pointer sm:mb-0 ${index === indiceEmpreitada ? 'bg-amber-500' : ''}`}>
                                        <td className="p-3 text-left w-full">{item.FOR_NOME}</td>
                                        <td className="p-3 text-left">{item.EMP_FAT}</td>
                                        <td className="border-grey-light border hover:bg-gray-100 p-1 sm:p-3 text-red-400 hover:text-red-600 hover:font-medium cursor-pointer">
                                            <button
                                                disabled = {item.EMP_FAT? true: false}
                                                className="p-1 text-sm px-2 mx-1 bg-black text-white rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none"
                                                type="button"
                                                onClick={() => excluirEmpreitada(index)}
                                            >
                                                <i className="fas fa-trash text-white "></i>
                                            </button>
                                        </td>
                                    </tr>)
                                }
                                )}
                            </tbody>
                        </table>
                        <div className="flex items-end justify-end p-2 relative">
                            <button
                                onClick={e => setShowModalPesquisaFornecedor(true)}
                                className="p-0 w-12 h-12 bg-black rounded-full hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none">
                                <svg viewBox="0 0 20 20" enable-background="new 0 0 20 20" className="w-6 h-6 inline-block">
                                    <path fill="#FFFFFF" d="M16,10c0,0.553-0.048,1-0.601,1H11v4.399C11,15.951,10.553,16,10,16c-0.553,0-1-0.049-1-0.601V11H4.601
                                        C4.049,11,4,10.553,4,10c0-0.553,0.049-1,0.601-1H9V4.601C9,4.048,9.447,4,10,4c0.553,0,1,0.048,1,0.601V9h4.399
                                        C15.952,9,16,9.447,16,10z"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>

                    
                </div>
                {showModalPesquisaFornecedor &&
                    <PesquisaFornecedor
                    fornecedorSelecionado={fornecedorSelecionado!}
                        setFornecedorSelecionado={setFornecedorSelecionado}
                        showModal={showModalPesquisaFornecedor}
                        setShowModal={setShowModalPesquisaFornecedor}
                    />}
                {showModalEmpreitada &&
                <EmpreitadaModal empreitadaSelecionada={empreitadaSelecionada}
                setEmpreitadaSelecionada={setEmpreitadaSelecionada}
                ordem={ordemServico} 
                fornecedor={fornecedorSelecionado}
                showModal={showModalEmpreitada}
                setShowModal={setShowModalEmpreitada}  />}
            </div>
        );       
    }

    return (
        <BuildBody />
    );
}