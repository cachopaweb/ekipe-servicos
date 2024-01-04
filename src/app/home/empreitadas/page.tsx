"use client"
import Modal from "@/app/components/modal";
import OperacaoEmpreitadas from "@/app/faturamentos/implementations/operacao_empreitadas";
import Faturamentos from "@/app/faturamentos/page";
import { GeraCodigo, toastMixin } from "@/app/functions/utils";
import CliForModel from "@/app/models/cli_for_model";
import EmpreitadasModel from "@/app/models/empreitadas_model";
import OrdemModel from "@/app/models/ordem_model";
import UnidadeMedidaModel from "@/app/models/unidade_med_model";
import PesquisaClienteFornecedor from "@/app/pesquisas/pesquisa_cli_for";
import EmpreitadasServicosModel from "../../models/empreitada_servicos_model";
import UnidadeMedidaRepository from "@/app/repositories/unidade_med_repository";
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import EmpreitadasRepository from "@/app/repositories/empreitadas_repository";
import PrintEmpreitadas from '../../print/empreitadas/page';
import { useAppData } from "@/app/contexts/app_context";
import getCliFor from '../../repositories/cli_for_repository';
import CliForRepository from "../../repositories/cli_for_repository";

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
    const [localExecucao, setLocalExecucao] = useState('');
    const [obsEmpreitadas, setObsEmpreitadas] = useState('');
    const [listaEmpreitadas, setListaEmpreitadas] = useState<EmpreitadasModel[]>([]);
    const [cliForSelecionado, setCliForSelecionado] = useState<CliForModel>({ CODIGO: 0, NOME: 'GENERICO' });
    const [showModalPesquisaCliFor, setShowModalPesquisaCliFor] = useState(false);
    const [showModalServicos, setShowModalServicos] = useState<boolean>(false);
    const [listaUnidadesMed, setListaUnidadesMed] = useState<UnidadeMedidaModel[]>([])
    const [showFaturamento, setShowFaturamento] = useState(false);
    const [foiFaturado, setFoiFaturado] = useState(false);
    const [indiceEmpreitada, setIndiceEmpreitada] = useState(0);
    

    const [showModalimprimirEmpreitadas, setShowModalImprimirEmpreitadas] = useState(false);
    const { setEmpreitadaCtx } = useAppData();


    const carregaUnidadesMed = async () => {
        try {
            const repository = new UnidadeMedidaRepository();
            const unidades = await repository.getUnidadeMedidas();
            setListaUnidadesMed(unidades);
        } catch (error) {
            toastMixin.fire('Erro', String(error), 'error')
        }
    }

    function imprimeEmpreitada() {
        if (listaEmpreitadas != null) {

            setEmpreitadaCtx(listaEmpreitadas[indiceEmpreitada]!);
            setShowModalImprimirEmpreitadas(true);
        }
    }

    useEffect(() => {
        buscaEmpreitadas()
    }, [foiFaturado])

    const cacheEmpreitadas = useCallback(async () => {
     
        const repository = new EmpreitadasRepository();
        const repositoryCliFor = new CliForRepository();
        const response = await repository.buscaEmpreitadas(ordemServico.ORD_CODIGO);
        for(var i = 0; i <= response.length; i++){
            if (response[i]){
                const servicos = await buscaServicosEmpreitadas(response[i].EMP_CODIGO);
                response[i].ITENS = servicos!;
                response[i].FORNECEDOR = await repositoryCliFor.getCliFor(response[i].EMP_FOR + 2000000);
            }
        }        
        return response;
    }, [])

    const ModalImprimir = () => {
        return (
            <Modal showModal={showModalimprimirEmpreitadas} setShowModal={setShowModalImprimirEmpreitadas}
                title={foiFaturado ? "Impressão de Ordem de Serviço" : "Impressão de Orçamento"}
                showButtonExit={false}
                body={
                    <PrintEmpreitadas />
                }
            />
        );
    }

    useEffect(() => {
        carregaUnidadesMed()
    }, [])



    useEffect(() => {
        if (cliForSelecionado.CODIGO > 0) {
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
                FOR_NOME: cliForSelecionado!.NOME,
                EMP_FOR: cliForSelecionado!.CODIGO,
                LRC_FAT2: 0,
                EMP_VALOR: 0,
                ITENS: listaServicos,
                FORNECEDOR: cliForSelecionado
            }])
        }
    }, [cliForSelecionado])

    const buscaEmpreitadas = async () => {
        try {
            setListaEmpreitadas([]);
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



    const ModalServicos = () => {
        const [descricaoServico, setDescricaoServico] = useState<string>('');
        const [quantServico, setQuantServico] = useState(0);
        const [valorUnitarioServico, setValorUnitarioServico] = useState(0);
        const [valorServico, setValorServico] = useState(0);
        const [unidadeMedServico, setUnidadeMedServico] = useState('');

        const salvarServicos = async () => {
            toastMixin.fire('Serviço salvo com sucesso', '', 'success');
            const servico = {
                ES_CODIGO: await GeraCodigo('EMPREITADAS_SERVICOS', 'ES_CODIGO'),
                DESCRICAO: descricaoServico,
                ES_EMP: 0,
                ES_PRAZO_CONCLUSAO: new Date().toLocaleDateString(),
                ES_QUANTIDADE: quantServico,
                ES_UNIDADE: unidadeMedServico,
                VLR_UNIT: valorServico / quantServico,
                ES_VALOR: valorServico,
            };
            listaEmpreitadas[indiceEmpreitada].ITENS.push(servico)
            setShowModalServicos(false)
        }

        useEffect(() => {
            if (!isNaN(quantServico) && !isNaN(valorUnitarioServico)) {
                setValorServico(valorUnitarioServico * quantServico);
            }
        }, [valorUnitarioServico, quantServico])

        return (
            <div>
                <Modal showModal={showModalServicos} setShowModal={setShowModalServicos}
                    title="Insere serviços empreitada"
                    showButtonExit={false}
                    body={
                        <div className="bg-white rounded-lg shadow-md my-4 h-3/4 w-full">
                            <div className="w-full p-2 sm:flex sm:justify-between">
                                <div>
                                    <div className="sm:flex">
                                        <div className="flex flex-col p-1">
                                            <label htmlFor="descricao">Descrição</label>
                                            <input autoFocus placeholder="Informe a descrição" id="servicoDescricaoId" value={descricaoServico} onChange={(e) => setDescricaoServico(e.target.value)} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-56" type="text" />
                                        </div>
                                        <div className="flex flex-col p-1">
                                            <label htmlFor="fatura">Quant.</label>
                                            <input value={quantServico} onChange={e => setQuantServico(parseFloat(e.target.value))} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-36" type="text" />
                                        </div>
                                        <div className="flex flex-col p-2">
                                            <label htmlFor="unidade">UM</label>
                                            <select value={unidadeMedServico} onChange={(e) => setUnidadeMedServico(e.target.value)} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-36">
                                                {listaUnidadesMed.map(u => <option key={u.UM_UNIDADE} value={u.UM_UNIDADE}>{u.UM_UNIDADE}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex flex-col p-1">
                                            <label htmlFor="fatura">Valor Unit.</label>
                                            <input value={valorUnitarioServico} onChange={e => setValorUnitarioServico(parseFloat(e.target.value))} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-36" type="text" />
                                        </div>
                                        <div className="flex flex-col p-1">
                                            <label htmlFor="fatura">Valor Total</label>
                                            <input value={valorServico} readOnly className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-36" type="text" />
                                        </div>
                                        <div className="flex flex-col p-1">
                                            <label htmlFor="fatura">Prazo Conclusão</label>
                                            <input className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-36" type="text" />
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className="bg-green-500 text-white active:bg-green-600 font-bold uppercase p-1 text-sm px-2 mx-1 rounded shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150 flex-3"
                                    type="button"
                                    onClick={salvarServicos}
                                >
                                    <i className="fa fa-solid fa-floppy-disk text-white p-2"></i>
                                    Salvar
                                </button>
                            </div>
                        </div>
                    }
                />
            </div>
        );
    }

    const faturamentoEmpreitada = async () => {
        if (listaEmpreitadas.length > 0) {
            const empreitada = listaEmpreitadas[indiceEmpreitada];
            if (empreitada.LRC_FAT2! > 0) {
                toastMixin.fire('Esta empreitada já foi faturada!', 'Atenção', 'info')
                return;
            }
        }
        if (listaEmpreitadas[indiceEmpreitada].ITENS.length > 0) {
            const valor = listaEmpreitadas[indiceEmpreitada].ITENS.map(e => e.ES_VALOR!).reduce((item1, item2) => item1 + item2);
            if (valor === 0) {
                toastMixin.fire('Nenhum valor a faturar!')
                return;
            }
            //atualiza o valor
            listaEmpreitadas[indiceEmpreitada].EMP_VALOR = valor;
        }
        setShowFaturamento(true);
    }

    const BuildBody = () => {
        const excluirServico = (id: number) => {
            const idServico = listaEmpreitadas[indiceEmpreitada].ITENS!.findIndex(e => e.ES_CODIGO === id);
            const lista = Array.from(listaEmpreitadas[indiceEmpreitada].ITENS!);
            lista.splice(idServico, 1);
            listaEmpreitadas[indiceEmpreitada].ITENS = [...lista];
        }

        const excluirEmpreitada = (id: number) => {
            const idEmpreitada = listaEmpreitadas.findIndex(e => e.EMP_CODIGO === id);
            const lista = Array.from(listaEmpreitadas);
            lista.splice(idEmpreitada, 1);
            setListaEmpreitadas(lista);
        }

        return (
            <div>
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
                                {listaEmpreitadas.length > 0 && listaEmpreitadas.map((item, index) =>
                                    <tr key={item.EMP_CODIGO} onClick={e => setIndiceEmpreitada(index)} className={`flex flex-col flex-nowrap sm:table-row mb-2 sm:mb-0 ${index === indiceEmpreitada ? 'bg-amber-500' : ''}`}>
                                        <td className="p-3 text-left w-full">{item.FOR_NOME}</td>
                                        <td className="p-3 text-left">{item.LRC_FAT2}</td>
                                        <td className="border-grey-light border hover:bg-gray-100 p-1 sm:p-3 text-red-400 hover:text-red-600 hover:font-medium cursor-pointer">
                                            <button
                                                className="p-1 text-sm px-2 mx-1 bg-black text-white rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none"
                                                type="button"
                                                onClick={() => excluirEmpreitada(item.EMP_CODIGO)}
                                            >
                                                <i className="fas fa-trash text-white "></i>
                                            </button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <div className="flex items-end justify-end p-2 relative">
                            <button
                                onClick={e => setShowModalPesquisaCliFor(true)}
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

                    <div className="shadow-md my-4">
                        <h2 className="text-md rounded-t-md font-bold text-black bg-amber-400 p-2">Serviços</h2>
                        <div ref={refDivServicos} className="flex items-center justify-center">
                            <table className="w-full flex sm:flex-col flex-nowrap sm:bg-white rounded-lg overflow-hidden sm:shadow-lg my-5">
                                <thead className="text-white">
                                    {divWidthServicos > 600 ? (
                                        <tr className="bg-amber-400 flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0">
                                            <th className="p-3 text-left w-full">Descrição</th>
                                            <th className="p-3 text-left">Quant</th>
                                            <th className="p-3 text-left">UM</th>
                                            <th className="p-3 text-left">Valor Unit.</th>
                                            <th className="p-3 text-left">Valor Total</th>
                                            <th className="p-3 text-left">Prazo Conclusão</th>
                                            <th className="p-3 text-left">Ação</th>
                                        </tr>)
                                        : listaEmpreitadas.length > 0 && listaEmpreitadas[indiceEmpreitada].ITENS.map(item =>
                                            <tr key={item.ES_CODIGO} className="bg-amber-400 flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0">
                                                <th className="p-3 text-left">Descrição</th>
                                                <th className="p-3 text-left">Quant</th>
                                                <th className="p-3 text-left">UM</th>
                                                <th className="p-3 text-left">Valor Unit.</th>
                                                <th className="p-3 text-left">Valor Total</th>
                                                <th className="p-3 text-left">Prazo Conclusão</th>
                                                <th className="p-3 text-left">Ação</th>
                                            </tr>)
                                    }
                                </thead>
                                <tbody className="flex-1 sm:flex-none">
                                    {listaEmpreitadas.length > 0 && listaEmpreitadas[indiceEmpreitada].ITENS.map((item) =>
                                        <tr key={item.ES_CODIGO} className="flex flex-col flex-nowrap sm:table-row mb-2 sm:mb-0">
                                            <td className="border-grey-light border hover:bg-gray-100 p-3 sm:w-full">{item.DESCRICAO}</td>
                                            <td className="border-grey-light border hover:bg-gray-100 p-3">{item.ES_QUANTIDADE}</td>
                                            <td className="border-grey-light border hover:bg-gray-100 p-3">{item.ES_UNIDADE}</td>
                                            <td className="border-grey-light border hover:bg-gray-100 p-3">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(item.ES_VALOR ?? 0 / (item.ES_QUANTIDADE ?? 1))}</td>
                                            <td className="border-grey-light border hover:bg-gray-100 p-3">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(item.ES_VALOR ?? 0)}</td>
                                            <td className="border-grey-light border hover:bg-gray-100 p-3">{item.ES_PRAZO_CONCLUSAO != null ? new Date(item.ES_PRAZO_CONCLUSAO!).toLocaleDateString() : ''}</td>
                                            <td className="border-grey-light border hover:bg-gray-100 p-1 sm:p-3 text-red-400 hover:text-red-600 hover:font-medium cursor-pointer">
                                                <button
                                                    className="p-1 text-sm px-2 mx-1 bg-black text-white rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none"
                                                    type="button"
                                                    onClick={() => excluirServico(item.ES_CODIGO)}
                                                >
                                                    <i className="fas fa-trash text-white "></i>
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-end justify-end p-2 relative">
                            <button
                                onClick={e => setShowModalServicos(true)}
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
                    <div className="w-full">
                        <div className="flex flex-col p-1">
                            <label htmlFor="localExecucao">Local Execução</label>
                            <textarea value={localExecucao} onChange={e => setLocalExecucao(e.target.value)} id="localExecucaoid" className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 h-10" />
                        </div>
                        <div className="flex flex-col p-1">
                            <label htmlFor="obsEmpreitadas">Observações</label>
                            <textarea value={obsEmpreitadas} onChange={e => setObsEmpreitadas(e.target.value)} id="obsEmpreitadasid" className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 h-10" />
                        </div>
                    </div>
                </div>
                {showModalPesquisaCliFor &&
                    <PesquisaClienteFornecedor
                        cliForSelecionado={cliForSelecionado!}
                        setCliForSelecionado={setCliForSelecionado}
                        showModal={showModalPesquisaCliFor}
                        setShowModal={setShowModalPesquisaCliFor}
                    />}
                {
                    showModalServicos && <ModalServicos />
                }
                <div className="flex gap-2 p-2">
                    <button onClick={faturamentoEmpreitada} className="p-0 w-32 h-12 text-white text-bold bg-black rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none">Faturar</button>
                    <button className="p-0 w-32 h-12 text-white text-bold bg-black rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none"
                        onClick={imprimeEmpreitada}
                    >Imprimir</button>
                </div>
                {showFaturamento && <Modal
                    title="Faturamento Empreitadas"
                    showModal={showFaturamento}
                    setShowModal={setShowFaturamento}
                    body={<Faturamentos
                        tipoRecPag="P"
                        Operacao={new OperacaoEmpreitadas()}
                        pedFat={{
                            PF_CODIGO: 0,
                            PF_COD_CLI: cliForSelecionado.CODIGO,
                            PF_CAMPO_DATAC: 'EMP_DATAC',
                            PF_CAMPO_FAT: 'EMP_FAT',
                            PF_CAMPO_PED: 'EMP_CODIGO',
                            PF_CLIENTE: cliForSelecionado.NOME,
                            PF_COD_PED: ordemServico.ORD_CODIGO,
                            PF_DATA: new Date().toLocaleDateString(),
                            PF_DATAC: '01/01/1900',
                            PF_DESCONTO: 0,
                            PF_FAT: 0,
                            PF_FUN: 1,
                            PF_PARCELAS: 1,
                            PF_TABELA: 'EMPREITADAS',
                            PF_TIPO: 2,
                            PF_VALOR: 0,
                            PF_VALORB: 0,
                            PF_VALORPG: 0,
                        }}
                        model={listaEmpreitadas[indiceEmpreitada]}
                        itens={listaEmpreitadas.length > 0 && listaEmpreitadas[indiceEmpreitada].ITENS}
                        cliFor={cliForSelecionado}
                        setShowModal={setShowFaturamento}
                        setFaturado={setFoiFaturado}
                        valorTotal={listaEmpreitadas.length > 0 && listaEmpreitadas[indiceEmpreitada].ITENS.length > 0 ? listaEmpreitadas[indiceEmpreitada].ITENS.map(e => e.ES_VALOR!).reduce((item1, item2) => item1 + item2) : 0} />}
                />}
                {showModalimprimirEmpreitadas && <ModalImprimir />}
            </div>
        );
    }

    return (
        <BuildBody />
    );
}