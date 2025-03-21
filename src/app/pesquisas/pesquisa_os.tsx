import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import Modal from "../../components/component/modal";
import Swal from "sweetalert2";
import OrdemRepository from "../repositories/ordem_repository";
import OrdemModel from "../models/ordem_model";
import { FormatDate, Status } from "../functions/utils";
import OrdEstModel from "../models/ord_est_model";
import OrdSerModel from "../models/ord_ser_model";
import { Eye, Check  } from 'lucide-react';
import Tabela from "../compositionpattern/tabela";

type pesquisaOrdemParams = {
    showModal: boolean;
    setShowModal: Dispatch<SetStateAction<boolean>>;
    OrdemSelecionado: number;
    setOrdemSelecionado: Dispatch<SetStateAction<number>>;
    setBuscouOrdem: Dispatch<SetStateAction<boolean>>;
}

export default function PesquisaOrdem({ showModal, setShowModal, setOrdemSelecionado, setBuscouOrdem }: pesquisaOrdemParams) {
    /////
    const refDivOrdem = useRef<HTMLDivElement>(null);
    const [divWidthOrdem, setdivWidthOrdem] = useState<number>(0);
    useEffect(() => {
        setdivWidthOrdem(refDivOrdem.current ? refDivOrdem.current.offsetWidth : 0);
    }, [refDivOrdem.current]);
    const [Ordems, setOrdems] = useState<OrdemModel[]>([]);
    const [data1, setData1] = useState(new Date());
    const [data2, setData2] = useState(new Date());
    const [statusOrdem, setStatusOrdem] = useState('TODOS');
    const [tipoBusca, setTipoBusca] = useState('Nome');
    const [textoBusca, setTextoBusca] = useState('');
    const [porPeriodo, setPorPeriodo] = useState(false);
    const [listaProdutosInseridos, setListaProdutosInseridos] = useState<OrdEstModel[]>([]);
    const [listaServicosInseridos, setListaServicosInseridos] = useState<OrdSerModel[]>([]);
    const [codOrdemSelecionada, setCodOrdemSelecionada] = useState(0);
    const [showModalDetalhes, setShowModalDetalhes] = useState(false);

    useEffect(() => {
        buscarOrdemModel();
    }, [textoBusca, data1, data2, porPeriodo, statusOrdem])

    const listaStatus = () => {
        let list = Object.values(Status).filter(v => isNaN(Number(v)));
        list = list.map(v => v.toString().toUpperCase());
        list.unshift('TODOS');
        console.log(list);
        return list;
    }

    const buscarOrdemModel = async () => {
        if (!porPeriodo && textoBusca === '') {
            return;
        }
        if (!porPeriodo && textoBusca != '' && textoBusca.length < 1) {
            return;
        }
        try {
            const repository = new OrdemRepository();
            const listaOrdems = await repository.pesquisaOrdem(textoBusca.toUpperCase(), tipoBusca, porPeriodo, statusOrdem, data1, data2);
            setOrdems(listaOrdems);
        } catch (error) {
            Swal.fire('Erro', String(error), 'error');
        }
    }

    const selecionarOrdemModel = async (model: OrdemModel) => {
        const codigoOrdem = model.ORD_CODIGO;
        //produtos
        const repository = new OrdemRepository();
        const produtos = await repository.buscaProdutosOrdem(codigoOrdem);
        if (produtos.length > 0)
            setListaProdutosInseridos([...produtos])
        else
            setListaProdutosInseridos([])
        //servicos
        const servicos = await repository.buscaServicosOrdem(codigoOrdem);
        if (servicos.length > 0)
            setListaServicosInseridos([...servicos])
        else
            setListaServicosInseridos([])
        setCodOrdemSelecionada(codigoOrdem);
        setShowModalDetalhes(true);
    }

    const ModalDetalhes = () => {

        const refDivProdutos = useRef<HTMLDivElement>(null);
        const [divWidthProdutos, setDivWidthProdutos] = useState<number>(0);
        useEffect(() => {
            setDivWidthProdutos(refDivProdutos.current ? refDivProdutos.current.offsetWidth : 0);
        }, [refDivProdutos.current]);
        /////
        const refDivServicos = useRef<HTMLDivElement>(null);
        const [divWidthServicos, setDivWidthServicos] = useState<number>(0);
        useEffect(() => {
            setDivWidthServicos(refDivServicos.current ? refDivServicos.current.offsetWidth : 0);
        }, [refDivServicos.current]);

        return (<>
            <Modal
                title="Detalhes"
                showModal={showModalDetalhes}
                setShowModal={setShowModalDetalhes}
                body={
                    ((listaProdutosInseridos.length === 0) && (listaServicosInseridos.length === 0)) ?
                        <div>
                            Não existe nenhum produto ou serviço
                        </div>
                        :
                        <div className="flex flex-col sm:w-[900px] sm:h-[500px] ">
                            {listaProdutosInseridos.length > 0 ?
                                <div ref={refDivProdutos} className="flex flex-col items-center justify-center w-full">
                                    <h2 className="text-sm text-md rounded-t-md font-bold text-black bg-amber-400 p-2">Produtos</h2>
                                    <table className="w-full flex sm:flex-col flex-nowrap sm:bg-white rounded-lg overflow-hidden sm:shadow-lg mt-1 mb-5">
                                        <thead className="text-white">
                                            {divWidthProdutos > 600 ?

                                                (
                                                    <tr className="bg-amber-400 flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0">
                                                        <th className="p-3 text-sm text-left">Cód.</th>
                                                        <th className="p-3 text-sm text-left w-full">Produto</th>
                                                        <th className="p-3 text-sm text-left">Quantidade</th>
                                                        <th className="p-3 text-sm text-left">UM</th>
                                                        <th className="p-3 text-sm text-left">Valor Unit.</th>
                                                        <th className="p-3 text-sm text-left">Valor Total</th>
                                                    </tr>)
                                                :

                                                listaProdutosInseridos.map(item =>
                                                    <tr key={item.ORE_CODIGO} className="bg-amber-400 flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0">
                                                        <th className="p-3 text-left">Cód.</th>
                                                        <th className="p-3 text-left">Produto</th>
                                                        <th className="p-3 text-left">Quantidade</th>
                                                        <th className="p-3 text-left">UM</th>
                                                        <th className="p-3 text-left">Valor Unit.</th>
                                                        <th className="p-3 text-left">Valor Total</th>
                                                    </tr>)
                                            }
                                        </thead>
                                        <tbody className="flex-1 sm:flex-none">
                                            {listaProdutosInseridos.map((item) =>
                                                <tr key={item.ORE_CODIGO} className="flex flex-col flex-nowrap sm:table-row mb-2 sm:mb-0">
                                                    <td className="text-sm border-grey-light border hover:bg-gray-100 p-3">{item.ORE_PRO}</td>
                                                    <td className="text-sm border-grey-light border hover:bg-gray-100 p-3 sm:w-full">{item.ORE_NOME}</td>
                                                    <td className="text-sm border-grey-light border hover:bg-gray-100 p-3">{item.ORE_QUANTIDADE}</td>
                                                    <td className="text-sm border-grey-light border hover:bg-gray-100 p-3">{item.ORE_EMBALAGEM}</td>
                                                    <td className="text-sm border-grey-light border hover:bg-gray-100 p-3">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(item.ORE_VALOR / item.ORE_QUANTIDADE)}</td>
                                                    <td className="text-sm border-grey-light border hover:bg-gray-100 p-3">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(item.ORE_VALOR)}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div> : <>
                                </>}

                            {listaServicosInseridos.length > 0 ?
                                <div ref={refDivServicos} className="flex flex-col items-center justify-center w-full">
                                    <h2 className="text-sm text-md rounded-t-md font-bold text-black bg-amber-400 p-2">Serviços</h2>
                                    <table className="flex sm:flex-col flex-nowrap sm:bg-white rounded-lg overflow-hidden sm:shadow-lg mt-1 mb-5">
                                        <thead className="text-white w-full">
                                            {divWidthServicos > 600 ? (
                                                <tr className="bg-amber-400 flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0">
                                                    <th className="p-3 text-left">Cód.</th>
                                                    <th className="p-3 text-left w-[30px]">Serviço</th>
                                                    <th className="p-3 text-left">Quantidade</th>
                                                    <th className="p-3 text-left">UM</th>
                                                    <th className="p-3 text-left">Valor Unit.</th>
                                                    <th className="p-3 text-left">Valor Total</th>
                                                </tr>
                                            )
                                                :
                                                listaServicosInseridos.map(item =>
                                                    <tr key={item.OS_CODIGO} className="bg-amber-400 flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0">
                                                        <th className="p-3 text-left">Cód.</th>
                                                        <th className="p-3 text-left">Serviço</th>
                                                        <th className="p-3 text-left">Quantidade</th>
                                                        <th className="p-3 text-left">UM</th>
                                                        <th className="p-3 text-left">Valor Unit.</th>
                                                        <th className="p-3 text-left">Valor Total</th>
                                                    </tr>
                                                )
                                            }
                                        </thead>
                                        <tbody className="flex-1 sm:flex-none">
                                            {listaServicosInseridos.map((item) =>
                                                <tr key={item.OS_CODIGO} className="flex flex-col flex-nowrap sm:table-row mb-2 sm:mb-0">
                                                    <td className="text-sm border-grey-light border hover:bg-gray-100 p-3">{item.OS_CODIGO}</td>
                                                    <td className="text-sm border-grey-light border hover:bg-gray-100 p-3"><p data-truncate={divWidthServicos < 600} className="data-[truncate=true]:truncate md:text-ellipsis lg:text-ellipsis sm:text-ellipsis hover:text-clip">{item.OS_NOME}</p></td>
                                                    <td className="text-sm border-grey-light border hover:bg-gray-100 p-3">{item.OS_QUANTIDADE}</td>
                                                    <td className="text-sm border-grey-light border hover:bg-gray-100 p-3">{item.OS_UNIDADE_MED}</td>
                                                    <td className="text-sm border-grey-light border hover:bg-gray-100 p-3">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(item.OS_VALOR / item.OS_QUANTIDADE)}</td>
                                                    <td className="text-sm border-grey-light border hover:bg-gray-100 p-3">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(item.OS_VALOR)}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                : <></>}

                        </div>
                }
            ></Modal>
        </>);

    }

    const selecionarOrdem = (model: OrdemModel) => {
        selecionarOrdemModel(model);
        setOrdemSelecionado(model.ORD_CODIGO)
        setBuscouOrdem(true);
        setShowModal(false)
    }

    return (
        <>
            <Modal
                showModal={showModal}
                setShowModal={setShowModal}
                title="Pesquisa Ordem"
                corBotaoExit="green"
                titutloBotaoExit="Escolher"
                edtSearch={<input autoFocus value={textoBusca} onChange={(e) => setTextoBusca(e.target.value)} className="w-full uppercase p-1 m-4 border rounded-md border-spacing-1 border-amber-400" type="text" />}
                onclickExit={()=> {
                    setOrdemSelecionado(codOrdemSelecionada)
                    setBuscouOrdem(true);
                    setShowModal(false)
                }}
                body={
                    <div className="flex flex-col sm:w-[900px] sm:h-[400px] ">
                        <div className="bg-white rounded-lg shadow-md m-2">
                            <h2 className="text-sm rounded-t-md font-bold text-black bg-amber-400 p-2">Filtro busca OS</h2>
                            <div className="sm:flex gap-2">
                                <div className="flex flex-wrap items-start justify-start">
                                    <div className="flex flex-1 flex-col p-1">
                                        <div className="flex-row">
                                            <label className="mr-5 text-sm" htmlFor="codOrdem">Aplicar Período</label>
                                            <input type="checkbox" id="aplicarPeriodo" value={porPeriodo ? 1 : 0} onChange={e => setPorPeriodo(!porPeriodo)} autoFocus className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400" />
                                            <div className="flex flex-row gap-2">
                                                <input type="date" id="edtData1" value={Intl.DateTimeFormat("fr-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(data1)} onChange={e => setData1(e.target.value ? new Date(e.target.value) : new Date())} className="text-sm uppercase p-1 border max-h-6 rounded-md border-spacing-1 border-amber-400" />
                                                <input type="date" id="edtData2" value={Intl.DateTimeFormat("fr-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(data2)} onChange={e => setData2(e.target.value ? new Date(e.target.value) : new Date())} className="text-sm uppercase p-1 border max-h-6 rounded-md border-spacing-1 border-amber-400" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-1 flex-col p-1">
                                        <label htmlFor="status text-sm">Status</label>
                                        <select id='statusid' value={statusOrdem} onChange={(e) => setStatusOrdem(e.target.value)} className="text-sm uppercase p-1 border rounded-md border-spacing-1 max-h-7 border-amber-400" >
                                            {listaStatus().map(status => <option key={status} value={status}>{status}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-1 flex-col p-1">
                                        <label className="text-sm" htmlFor="status">Tipo Busca</label>
                                        <select id='tipoBusca' value={tipoBusca} onChange={(e) => setTipoBusca(e.target.value)} className="text-sm uppercase p-1 border rounded-md border-spacing-1 max-h-7 border-amber-400" >
                                        <option key="Codigo" value="Codigo">Código</option>
                                            <option key="Nome" value="Nome">Nome</option>
                                            <option key="Solicitacao" value="Solicitacao">Solicitação</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div ref={refDivOrdem} className="overflow-x-hidden h-[300px]">
                            <table className="w-full flex sm:flex-col flex-nowrap sm:bg-white rounded-lg overflow-hidden sm:shadow-lg my-5">
                                <thead className="text-white w-full">
                                    {divWidthOrdem > 600 ? (
                                        <tr className="bg-amber-400 flex flex-col sm:flex-row flex-nowrap rounded-l-lg w-full sm:rounded-none mb-2 sm:mb-0">
                                            <th className="p-3 text-sm text-center sm:w-[8%]">Cód.</th>
                                            <th className="p-3 text-sm text-center sm:w-[10%]">Data</th>
                                            <th className="p-3 text-sm text-center sm:w-[22%]">Solicitação</th>
                                            <th className="p-3 text-sm text-center w-full sm:w-[30%]">Nome</th>
                                            <th className="p-3 text-sm text-center sm:w-[10%]">Valor</th>
                                            <th className="p-3 text-sm text-center sm:w-[10%]">Estado</th>
                                            <th className="p-3 text-sm text-center sm:w-[15%]">Parceiro</th>
                                            <th className="p-3 text-sm text-center sm:w-[10%]">Ação</th>
                                        </tr>)
                                        : Ordems.map(item =>
                                            <tr key={item.ORD_CODIGO} className="bg-amber-400 flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0">
                                                <th className="p-3 text-left">Cód.</th>
                                                <th className="p-3 text-left">Data</th>
                                                <th className="p-3 text-left">Solicitação</th>
                                                <th className="p-3 text-left">Nome</th>
                                                <th className="p-3 text-left">Valor</th>
                                                <th className="p-3 text-left">Estado</th>
                                                <th className="p-3 text-left">Parceiro</th>
                                                <th className="p-3 text-left">Ação</th>
                                            </tr>)
                                    }
                                </thead>
                                <tbody className="flex-1 sm:flex-none text-center">
                                    {Ordems.length > 0 ? (Ordems.map((item) =>
                                        <tr key={item.ORD_CODIGO} className="flex flex-col flex-nowrap sm:flex-row sm:table-fixed mb-2 sm:mb-0">
                                            <td className="text-xs border-grey-light border hover:bg-gray-100 p-3 sm:w-[8%]">{item.ORD_CODIGO}</td>
                                            <td className="text-xs border-grey-light border  hover:bg-gray-100 p-3 sm:w-[10%]">{item.ORD_DATA != null ? new Date(item.ORD_DATA).toLocaleDateString() : ''}</td>
                                            <td className="text-xs border-grey-light border hover:bg-gray-100 p-3 sm:w-[22%]">{item.ORD_SOLICITACAO}</td>
                                            <td className="text-xs border-grey-light border hover:bg-gray-100 p-3 sm:w-[30%]">{item.CLI_NOME}</td>
                                            <td className="text-xs border-grey-light border hover:bg-gray-100 p-3 sm:w-[10%]">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(item.ORD_VALOR)}</td>
                                            <td className="text-xs border-grey-light border hover:bg-gray-100 p-3 sm:w-[10%]">{item.ORD_ESTADO}</td>
                                            <td className="text-xs border-grey-light border hover: p-3 sm:w-[15%]">{item.PARCEIRO? item.PARCEIRO : 'SEM PARC.'}</td>
                                            <td className="sm:px-4 sm:py-2 text-left border-grey-light border sm:w-[10%]">
                                                <div className="flex flex-row gap-2">
                                                    <Eye onClick={() => selecionarOrdemModel(item)} className="text-amber-700 text-xl mr-1 hover:cursor-pointer" />
                                                    <Check  onClick={() => selecionarOrdem(item)} className="text-green-800 ml-1 hover:cursor-pointer" />
                                                    
                                                </div>
                                            </td>
                                        </tr>
                                    )) : <h1>Aguarde, carregando dados...</h1>}
                                </tbody>
                            </table>
                        </div>
                        {showModalDetalhes && <ModalDetalhes />}
                    </div>
                }
            />
        </>
    )
}