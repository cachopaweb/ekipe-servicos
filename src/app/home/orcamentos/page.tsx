"use client"
import { useEffect, useRef, useState } from "react";

import Pesquisa_cliente from "../../pesquisas/pesquisa_cliente";
import Pesquisa_produto from "../../pesquisas/pesquisa_produto";
import { ClienteModel } from "../../models/cliente_model";
import { ProdutoModel } from "../../models/produto_model";
import OrdEstModel from "../../models/ord_est_model";
import OrdSerModel from "../../models/ord_ser_model";
import Modal from "../../components/modal";
import { FormatDate, GeraCodigo, Status, keyBoardInputEvent, toastMixin, getFileName } from "@/app/functions/utils";
import OrdemModel from "@/app/models/ordem_model";
import OrdemRepository from "@/app/repositories/ordem_repository";
import UnidadeMedidaModel from "@/app/models/unidade_med_model";
import UnidadeMedidaRepository from "@/app/repositories/unidade_med_repository";
import Empreitadas from "../empreitadas/page";
import Faturamentos from "@/app/faturamentos/page";
import OperacaoOrdens from "@/app/faturamentos/implementations/operacao_ordens";
import ProdutoRepository from "@/app/repositories/produto_repository";
import { useAppData } from "@/app/contexts/app_context";
import PrintOrcamentos from "@/app/print/orcamento/page";
import PesquisaOrdem from "@/app/pesquisas/pesquisa_os";
import axios from "axios";
import ArquivoModel from "@/app/models/arquivo_model";
import ArquivoRepository from "@/app/repositories/arquivo_repository";
import Link from "next/link";

export default function Orcamentos() {
    const { setOrdemCtx } = useAppData();
    const [ordem, setOrdem] = useState<OrdemModel | null>(null);
    const [dataAbertura, setDataAbertura] = useState(new Date());
    const [showModalPesquisaCliente, setShowModalPesquisaCliente] = useState(false);
    const [showModalPesquisaProduto, setShowModalPesquisaProduto] = useState(false);
    const [showModalSalvar, setShowModalSalvar] = useState(false);
    const [showModalEmpreitadas, setShowModalEmpreitadas] = useState(false);
    const [showModalListaArquivos, setShowModalListaArquivos] = useState(false);
    const [clienteSelecionado, setClienteSelecionado] = useState<ClienteModel>({ CODIGO: 1, NOME: 'CONSUMIDOR' });
    const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoModel>({ PRO_CODIGO: 1, PRO_NOME: 'GENERICO', PRO_VALORV: 0 });
    const [atendente, setAtendente] = useState('');
    const [abaAtiva, setAbaAtiva] = useState('SERVICOS');
    const [listaProdutosInseridos, setListaProdutosInseridos] = useState<OrdEstModel[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    ////servico  
    const [listaServicosInseridos, setListaServicosInseridos] = useState<OrdSerModel[]>([]);
    const [codigoOrdem, setCodigoOrdem] = useState(0);
    const [nfs, setNfs] = useState('');
    const [obs, setObs] = useState('');
    const [obs_adm, setObs_adm] = useState('');
    const [solicitacao, setSolicitacao] = useState('');
    const [statusOrdem, setStatusOrdem] = useState(Status[0].toUpperCase());
    const [listaUnidadesMed, setListaUnidadesMed] = useState<UnidadeMedidaModel[]>([]);
    const [showFaturamento, setShowFaturamento] = useState(false);
    const [codFatura, setCodFatura] = useState(0);
    const [foiFaturado, setFoiFaturado] = useState(false);
    const [showModalimprimir, setShowModalImprimir] = useState(false);
    const [showModalPesquisaOS, setShowModalPesquisaOS] = useState(false);

    useEffect(() => {
        buscaOrdemServidor();
    }, [foiFaturado])

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (codigoOrdem > 0)
                buscaOrdemServidor()
        }, 1000)
        return () => clearTimeout(timeout);
    }, [codigoOrdem])

    const carregaUnidadesMed = async () => {
        try {
            const repository = new UnidadeMedidaRepository();
            const unidades = await repository.getUnidadeMedidas();
            setListaUnidadesMed(unidades);
        } catch (error) {
            toastMixin.fire('Erro', String(error), 'error')
        }
    }

    useEffect(() => {
        carregaUnidadesMed()
        const edtCodigoOrdem = document.getElementById('edtCodigoOrdem') as HTMLInputElement;
        edtCodigoOrdem!.select();
        edtCodigoOrdem!.focus()
    }, [])

    const listaStatus = () => {
        let list = Object.values(Status).filter(v => isNaN(Number(v)));
        list = list.map(v => v.toString().toUpperCase());
        return list;
    }

    function imprimeOrcamento() {
        if (ordem != null) {
            setOrdemCtx(ordem!);
            setShowModalImprimir(true);
        }
    }

    const handleClickAba = (aba: string) => {
        setAbaAtiva(aba);
    }

    const totalProdutos = () => listaProdutosInseridos.length > 0 ? listaProdutosInseridos.map(p => p.ORE_VALOR).reduce((item1, item2) => item1 + item2) : 0;
    const totalServicos = () => listaServicosInseridos.length > 0 ? listaServicosInseridos.map(s => s.OS_VALOR).reduce((item1, item2) => item1 + item2) : 0;

    const salvaOrdem = async () => {
        if (statusOrdem === '') {
            toastMixin.fire('Atenção', 'Informe o estado', 'warning').finally(() => {
                setShowModalSalvar(false);
                const edtStatus = document.getElementById('statusid');
                if (edtStatus) {
                    edtStatus.focus();
                }
            });

            return;
        }
        if (solicitacao === '') {
            toastMixin.fire('Atenção', 'Solicitação não informada', 'warning').finally(() => {
                setShowModalSalvar(false);
                const edtSolicitacao = document.getElementById('solicitacaoid');
                if (edtSolicitacao) {
                    edtSolicitacao.focus();
                }
            });
            return;
        }
        if (listaProdutosInseridos.length === 0 && listaServicosInseridos.length === 0) {
            toastMixin.fire('Atenção', 'Insera produtos ou serviços na OS.', 'warning').finally(() => {
                setShowModalSalvar(false);
                if (listaServicosInseridos.length === 0) {
                    setAbaAtiva('SERVICOS')
                }
                if (listaProdutosInseridos.length === 0) {
                    setAbaAtiva('PRODUTOS')
                }
            });
            return;
        }
        if (dataAbertura.toString().replaceAll('/', '') === '') {
            setDataAbertura(new Date());
        }
        toastMixin.fire({
            title: 'Salvar',
            text: 'Salvando ordem',
            timer: 2000
        })
        const repository = new OrdemRepository();
        let codigo = codigoOrdem;
        if (codigo === 0) {
            codigo = await GeraCodigo('ORDENS', 'ORD_CODIGO');
        }
        try {
            let ord: OrdemModel = {
                ORD_CODIGO: codigo,
                ORD_DATA: FormatDate(new Date()),
                ORD_VALOR: totalProdutos() + totalServicos(),
                ORD_CLI: clienteSelecionado.CODIGO,
                ORD_DESCONTO_P: 0,
                ORD_DESCONTO_S: 0,
                ORD_DEVOLUCAO_P: 'N',
                ORD_ESTADO: statusOrdem,
                ORD_FUN: 1,
                ORD_NFS: nfs,
                ORD_OBS: obs,
                ORD_OBS_ADM: obs_adm,
                ORD_SOLICITACAO: solicitacao,
                CLI_NOME: clienteSelecionado.NOME,
                ORD_FAT: 0,
                CLI_CNPJ_CPF: clienteSelecionado.CPF_CNPJ!,
                CLI_ENDERECO: clienteSelecionado.ENDERECO != null ? clienteSelecionado.ENDERECO : '',
                CLI_NUMERO: clienteSelecionado.NUMERO != null ? clienteSelecionado.NUMERO : '',
                CLI_BAIRRO: clienteSelecionado.BAIRRO != null ? clienteSelecionado.BAIRRO : '',
                CLI_FONE: clienteSelecionado.FONE != null ? clienteSelecionado.FONE : '',
                itensOrdEst: listaProdutosInseridos,
                itensOrdSer: listaServicosInseridos,
            }
            ////
            setOrdem(ord);
            repository.insereordem(ord);
            ////
            if (listaServicosInseridos.length > 0) {
                toastMixin.fire({
                    title: 'Salvar',
                    text: 'Salvando os serviços',
                    timer: 2000
                })
                ////
                listaServicosInseridos.forEach(async s => {
                    if (s.OS_CODIGO === 0) {
                        s.OS_CODIGO = await GeraCodigo('ORD_SER', 'OS_CODIGO');
                    }
                    s.OS_ORD = codigo;
                    repository.insereServicos(codigo, s);
                });
            }
            if (listaProdutosInseridos.length > 0) {
                toastMixin.fire({
                    title: 'Salvar',
                    text: 'Salvando os produtos',
                    timer: 2000
                })
                ////
                listaProdutosInseridos.forEach(async p => {
                    if (p.ORE_CODIGO === 0) {
                        p.ORE_CODIGO = await GeraCodigo('ORD_EST', 'ORE_CODIGO');
                    }
                    p.ORE_ORD = codigo;
                    repository.insereProdutos(codigo, p);
                });
                ////                

            }
            setCodigoOrdem(codigo);
        } catch (e) {
            toastMixin.fire({
                title: 'Erro',
                text: 'Erro ao salvar ordem: ' + String(e),
                timer: 2000
            })
        } finally {
            setShowModalSalvar(false)
        }
    }

    const buscaOrdemServidor = async () => {
        try {
            if (codigoOrdem === 0) {
                return;
            }
            const repository = new OrdemRepository();
            const ord = await repository.buscaOrdem(codigoOrdem);
            setAtendente(ord.FUN_NOME!);
            setClienteSelecionado(new ClienteModel(ord.ORD_CLI, ord.CLI_NOME));
            setDataAbertura(new Date(ord.ORD_DATA));
            setNfs(ord.ORD_NFS ?? '');
            setObs(ord.ORD_OBS);
            setObs_adm(ord.ORD_OBS_ADM);
            setSolicitacao(ord.ORD_SOLICITACAO);
            setStatusOrdem(ord.ORD_ESTADO);
            setCodFatura(ord.ORD_FAT ?? 0)
            //produtos
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
            toastMixin.fire({
                title: 'Ordem encontrada com sucesso'
            });
            if (produtos.length > 0) {
                ord.itensOrdEst = [...produtos];
            }
            else {
                ord.itensOrdEst = [];
            }

            if (servicos.length > 0) {
                ord.itensOrdSer = [...servicos];
            }
            else {
                ord.itensOrdSer = [];
            }

            setOrdem(ord)
        } catch (error) {
            toastMixin.fire('Erro', String(error), 'error')
        }
    }

    const buscarOrdem = async (e: keyBoardInputEvent) => {
        if (e.key === 'Enter') {
            buscaOrdemServidor()
        }
    }

    const ModalSalvar = () => {
        return (
            <Modal showModal={showModalSalvar} setShowModal={setShowModalSalvar}
                title="Salvar Ordem"
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
                            onClick={salvaOrdem}
                        >
                            <i className="fa fa-solid fa-floppy-disk text-white p-2"></i>
                            Salvar
                        </button>
                    </div>
                }
            />
        );
    }

    const AbaServicos = () => {
        const refDivServicos = useRef<HTMLDivElement>(null);
        const [divWidthServicos, setDivWidthServicos] = useState<number>(0);
        useEffect(() => {
            setDivWidthServicos(refDivServicos.current ? refDivServicos.current.offsetWidth : 0);
        }, [refDivServicos.current]);


        const [servico, setServico] = useState<OrdSerModel>({
            OS_CODIGO: 0,
            OS_NOME: 'GENERICO',
            OS_ORD: 0,
            OS_QUANTIDADE: 1,
            OS_SER: 0,
            OS_UNIDADE_MED: 'PC',
            OS_VALOR: 0,
        })

        const excluirServico = (id: number) => {
            const idServico = listaServicosInseridos.findIndex(e => e.OS_CODIGO === id);
            const lista = Array.from(listaServicosInseridos)
            lista.splice(idServico, 1);
            setListaServicosInseridos(lista);
        }

        const inserirServico = (servico: OrdSerModel) => {
            try {
                if (servico.OS_QUANTIDADE === 0) {
                    toastMixin.fire('Quantidade zero', 'A quantidade não pode ser Zero', 'warning')
                    return;
                }
                if (servico.OS_VALOR === 0) {
                    toastMixin.fire('Valor zero', 'O Valor do serviço não pode ser Zero', 'warning')
                    return;
                }
                setListaServicosInseridos(item => [...item, {
                    OS_CODIGO: 0,
                    OS_NOME: servico.OS_NOME,
                    OS_UNIDADE_MED: servico.OS_UNIDADE_MED,
                    OS_SER: servico.OS_SER,
                    OS_QUANTIDADE: servico.OS_QUANTIDADE,
                    OS_VALOR: servico.OS_VALOR * servico.OS_QUANTIDADE,
                    OS_ORD: 0,
                }])
            } catch (error) {
                toastMixin.fire('Atenção', String(error), 'warning')
            }
        }

        const edtCodServicoKeydown = (e: keyBoardInputEvent) => {
            if (e.key === 'Enter') {
                const edtNomeServico = document.getElementById('edtNomeServico');
                edtNomeServico?.focus();
            }
        }

        const edtNomeServicoKeydown = (e: keyBoardInputEvent) => {
            if (e.key === 'Enter') {
                const edtQuantServico = document.getElementById('edtQuantidadeServico');
                edtQuantServico?.focus();
            }
        }

        const edtQuantServicoKeydown = (e: keyBoardInputEvent) => {
            if (e.key === 'Enter') {
                const edtValorServico = document.getElementById('edtValorServico');
                edtValorServico?.focus();
            }
        }

        const edtValorServicoKeyDown = (e: keyBoardInputEvent) => {
            if (e.key === 'Enter') {
                const btnInsereServico = document.getElementById('btnInsereServico');
                btnInsereServico?.focus();
            }
        }

        return (
            <div ref={refDivServicos} className="bg-white rounded-lg shadow-md">
                <div className="border-b-2">
                    <div className="sm:flex">
                        <div className="flex flex-col p-2">
                            <label htmlFor="codigo">Código</label>
                            <div className="flex flex-row">
                                <input id="codigoServicoid" value={servico.OS_SER} onKeyDown={edtCodServicoKeydown} readOnly className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 flex-1" type="text" />
                                <button
                                    className="p-1 text-sm px-2 mx-1 bg-black text-white rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none"
                                    type="button"
                                // onClick={() => setShowModalPesquisaServico(true)}
                                >
                                    <i className="fas fa-magnifying-glass text-white"></i>
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col p-2">
                            <label htmlFor="servico">Serviço</label>
                            <input id="edtNomeServico" onKeyDown={edtNomeServicoKeydown} value={servico.OS_NOME} onChange={(e) => setServico({ ...servico, OS_NOME: String(e.target.value).toUpperCase() })} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-80" type="text" />
                        </div>
                        <div className="flex flex-col p-2">
                            <label htmlFor="unidade">UM</label>
                            <select value={servico.OS_UNIDADE_MED} onChange={(e) => setServico({ ...servico, OS_UNIDADE_MED: e.target.value })} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-36">
                                {listaUnidadesMed.map(u => <option key={u.UM_UNIDADE} value={u.UM_UNIDADE}>{u.UM_UNIDADE}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col p-2">
                            <label htmlFor="quant">Quant</label>
                            <input id="edtQuantidadeServico" onKeyDown={edtQuantServicoKeydown} value={servico.OS_QUANTIDADE} onChange={(e) => setServico({ ...servico, OS_QUANTIDADE: e.target.value ? parseFloat(e.target.value) : 0 })} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-24" type="text" />
                        </div>
                        <div className="flex flex-col p-2">
                            <label htmlFor="valor">Valor</label>
                            <input id="edtValorServico" onKeyDown={edtValorServicoKeyDown} value={servico.OS_VALOR} onChange={(e) => setServico({ ...servico, OS_VALOR: e.target.value ? parseFloat(e.target.value) : 0 })} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-24" type="text" />
                        </div>
                        <div>
                            <button
                                id="btnInsereServico"
                                className="w-12 h-12 m-4 bg-black text-white rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none"
                                type="button"
                                onClick={e => inserirServico(servico)}                            >
                                <i className="fas fa-check text-white "></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-center">
                    <table className="w-full flex sm:flex-col flex-nowrap sm:bg-white rounded-lg overflow-hidden sm:shadow-lg my-5">
                        <thead className="text-white">
                            {divWidthServicos > 600 ? (
                                <tr className="bg-amber-400 flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0">
                                    <th className="p-3 text-left">Cód.</th>
                                    <th className="p-3 text-left w-full">Serviço</th>
                                    <th className="p-3 text-left">Quantidade</th>
                                    <th className="p-3 text-left">UM</th>
                                    <th className="p-3 text-left">Valor Unit.</th>
                                    <th className="p-3 text-left">Valor Total</th>
                                    <th className="p-3 text-left">Ação</th>
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
                                        <th className="p-3 text-left">Ação</th>
                                    </tr>
                                )
                            }
                        </thead>
                        <tbody className="flex-1 sm:flex-none">
                            {listaServicosInseridos.map((item) =>
                                <tr key={item.OS_CODIGO} className="flex flex-col flex-nowrap sm:table-row mb-2 sm:mb-0">
                                    <td className="border-grey-light border hover:bg-gray-100 p-3">{item.OS_CODIGO}</td>
                                    <td className="border-grey-light border hover:bg-gray-100 p-3 sm:w-full">{item.OS_NOME}</td>
                                    <td className="border-grey-light border hover:bg-gray-100 p-3">{item.OS_QUANTIDADE}</td>
                                    <td className="border-grey-light border hover:bg-gray-100 p-3">{item.OS_UNIDADE_MED}</td>
                                    <td className="border-grey-light border hover:bg-gray-100 p-3">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(item.OS_VALOR / item.OS_QUANTIDADE)}</td>
                                    <td className="border-grey-light border hover:bg-gray-100 p-3">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(item.OS_VALOR)}</td>
                                    <td className="border-grey-light border hover:bg-gray-100 p-1 sm:p-3 text-red-400 hover:text-red-600 hover:font-medium cursor-pointer">
                                        <button
                                            className="p-1 text-sm px-2 mx-1 bg-black text-white rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none"
                                            type="button"
                                            onClick={() => excluirServico(item.OS_CODIGO)}
                                        >
                                            <i className="fas fa-trash text-white "></i>
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    const AbaProdutos = () => {
        const refDivProdutos = useRef<HTMLDivElement>(null);
        const [divWidthProdutos, setDivWidthProdutos] = useState<number>(0);
        useEffect(() => {
            setDivWidthProdutos(refDivProdutos.current ? refDivProdutos.current.offsetWidth : 0);
        }, [refDivProdutos.current]);

        const [produto, setProduto] = useState<OrdEstModel>({
            ORE_CODIGO: 0,
            ORE_EMBALAGEM: 'PC',
            ORE_NOME: 'GENERICO',
            ORE_ORD: 0,
            ORE_PRO: 1,
            ORE_QUANTIDADE: 1,
            ORE_VALOR: 0
        });

        useEffect(() => {
            if (produtoSelecionado.PRO_CODIGO > 1) {
                const edtQuantidade = document.getElementById('edtQuantidade');
                edtQuantidade?.focus();
                setProduto({
                    ORE_CODIGO: 0,
                    ORE_EMBALAGEM: 'PC',
                    ORE_NOME: produtoSelecionado.PRO_NOME,
                    ORE_ORD: 0,
                    ORE_PRO: produtoSelecionado.PRO_CODIGO,
                    ORE_QUANTIDADE: 1,
                    ORE_VALOR: produtoSelecionado.PRO_VALORV ?? 0
                })
            }
        }, [produtoSelecionado])

        const edtNomeProdutoKeyDown = (e: keyBoardInputEvent) => {
            if (e.key === 'Enter') {
                const edtUM = document.getElementById('edtUM');
                edtUM?.focus();
            }
        }
        const edtQuantidadeKeyDown = (e: keyBoardInputEvent) => {
            if (e.key === 'Enter') {
                const edtValorProduto = document.getElementById('edtValorProduto');
                edtValorProduto?.focus();
            }
        }

        const edtValorProdutoKeyDown = (e: keyBoardInputEvent) => {
            if (e.key === 'Enter') {
                const btnInserirProduto = document.getElementById('btnInserirProduto');
                btnInserirProduto?.focus();
            }
        }

        const edtProdutoKeydown = async (e: keyBoardInputEvent) => {
            if (e.key === 'Enter') {
                try {
                    const produtoRepository = new ProdutoRepository();
                    toastMixin.fire('Aguarde...', 'Buscando produto', 'info')
                    const produtoResponse = await produtoRepository.getProdutoPorCodigo(produto.ORE_PRO);
                    if (produtoResponse) {
                        setProduto({
                            ORE_CODIGO: 0,
                            ORE_NOME: produtoResponse.PRO_NOME,
                            ORE_EMBALAGEM: produtoResponse.PRO_EMBALAGEM!,
                            ORE_ORD: codigoOrdem,
                            ORE_PRO: produtoResponse.PRO_CODIGO,
                            ORE_QUANTIDADE: 1,
                            ORE_VALOR: produtoResponse.PRO_VALORV!,
                        })
                        const edtQuantidade = document.getElementById('edtQuantidade');
                        edtQuantidade?.focus();
                    }
                } catch (error) {
                    toastMixin.fire('Erro ao buscar produto', String(error), 'error');
                }
            }
        }

        const inserirProduto = (produto: OrdEstModel) => {
            try {
                if (produto.ORE_QUANTIDADE === 0) {
                    toastMixin.fire('Quantidade zero', 'A quantidade não pode ser Zero', 'warning')
                    return;
                }
                if (produto.ORE_VALOR === 0) {
                    toastMixin.fire('Valor zero', 'O Valor do produto não pode ser Zero', 'warning')
                    return;
                }
                setListaProdutosInseridos(item => [...item, {
                    ORE_CODIGO: 0,
                    ORE_NOME: produto.ORE_NOME,
                    ORE_EMBALAGEM: produto.ORE_EMBALAGEM,
                    ORE_PRO: produto.ORE_PRO,
                    ORE_QUANTIDADE: produto.ORE_QUANTIDADE,
                    ORE_VALOR: produto.ORE_VALOR * produto.ORE_QUANTIDADE,
                    ORE_ORD: 0,
                }])
                const edtCodProduto = document.getElementById('codigoProdutoid');
                edtCodProduto?.focus();
            } catch (error) {
                toastMixin.fire('Atenção', String(error), 'warning')
            }
        }

        const excluirProduto = (id: number) => {
            const idProduto = listaProdutosInseridos.findIndex(e => e.ORE_CODIGO === id);
            const lista = Array.from(listaProdutosInseridos);
            lista.splice(idProduto, 1);
            setListaProdutosInseridos(lista);
        }

        return (
            <div ref={refDivProdutos} className="bg-white rounded-lg  shadow-md">
                <div className="border-b-2">
                    <div className="sm:flex">
                        <div className="flex flex-col p-2">
                            <label htmlFor="codigo">Código</label>
                            <div className="flex flex-row">
                                <input id="codigoProdutoid" value={produto.ORE_PRO} onKeyDown={edtProdutoKeydown} onChange={e => setProduto({ ...produto, ORE_PRO: parseInt(e.target.value ?? 0) })} className="p-1 border rounded-md border-spacing-1 border-amber-400 flex-1" type="text" />
                                <button
                                    className="p-1 text-sm px-2 mx-1 bg-black text-white rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none"
                                    type="button"
                                    onClick={() => setShowModalPesquisaProduto(true)}
                                >
                                    <i className="fas fa-magnifying-glass text-white"></i>
                                </button>
                                {showModalPesquisaProduto &&
                                    <Pesquisa_produto
                                        produtoSelecionado={produtoSelecionado}
                                        setProdutoSelecionado={setProdutoSelecionado}
                                        showModal={showModalPesquisaProduto}
                                        setShowModal={setShowModalPesquisaProduto}
                                    />
                                }
                            </div>
                        </div>
                        <div className="flex flex-col p-2">
                            <label htmlFor="produto">Produto</label>
                            <input value={produto.ORE_NOME}
                                onKeyDown={edtNomeProdutoKeyDown}
                                onChange={(e) => produtoSelecionado.PRO_CODIGO == 1 ? setProduto({ ...produto, ORE_NOME: String(e.target.value).toUpperCase() }) : null}
                                className="p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-80" type="text" />
                        </div>
                        <div className="flex flex-col p-2">
                            <label htmlFor="unidade">UM</label>
                            <select id="edtUM" value={produto.ORE_EMBALAGEM} onChange={(e) => setProduto({ ...produto, ORE_EMBALAGEM: e.target.value })} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-36">
                                {listaUnidadesMed.map(u => <option key={u.UM_UNIDADE} value={u.UM_UNIDADE}>{u.UM_UNIDADE}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col p-2">
                            <label htmlFor="quant">Quant</label>
                            <input id="edtQuantidade" onKeyDown={edtQuantidadeKeyDown} value={produto.ORE_QUANTIDADE} onChange={(e) => setProduto({ ...produto, ORE_QUANTIDADE: e.target.value ? parseFloat(e.target.value) : 0 })} className="p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-24" type="text" />
                        </div>
                        <div className="flex flex-col p-2">
                            <label htmlFor="valor">Valor</label>
                            <input id="edtValorProduto" onKeyDown={edtValorProdutoKeyDown} value={produto.ORE_VALOR} onChange={(e) => setProduto({ ...produto, ORE_VALOR: e.target.value ? parseFloat(e.target.value) : 0 })} className="p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-24" type="text" />
                        </div>
                        <div className="">
                            <button
                                className="w-12 h-12 m-4 p-1 bg-black text-white rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none"
                                type="button"
                                id="btnInserirProduto"
                                onClick={e => inserirProduto(produto)}
                            >
                                <i className="fas fa-check text-white "></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-center">
                    <table className="w-full flex sm:flex-col flex-nowrap sm:bg-white rounded-lg overflow-hidden sm:shadow-lg my-5">
                        <thead className="text-white">
                            {divWidthProdutos > 600 ? (
                                <tr className="bg-amber-400 flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0">
                                    <th className="p-3 text-left">Cód.</th>
                                    <th className="p-3 text-left w-full">Produto</th>
                                    <th className="p-3 text-left">Quantidade</th>
                                    <th className="p-3 text-left">UM</th>
                                    <th className="p-3 text-left">Valor Unit.</th>
                                    <th className="p-3 text-left">Valor Total</th>
                                    <th className="p-3 text-left">Ação</th>
                                </tr>)
                                : listaProdutosInseridos.map(item =>
                                    <tr key={item.ORE_CODIGO} className="bg-amber-400 flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0">
                                        <th className="p-3 text-left">Cód.</th>
                                        <th className="p-3 text-left">Produto</th>
                                        <th className="p-3 text-left">Quantidade</th>
                                        <th className="p-3 text-left">UM</th>
                                        <th className="p-3 text-left">Valor Unit.</th>
                                        <th className="p-3 text-left">Valor Total</th>
                                        <th className="p-3 text-left">Ação</th>
                                    </tr>)
                            }
                        </thead>
                        <tbody className="flex-1 sm:flex-none">
                            {listaProdutosInseridos.map((item) =>
                                <tr key={item.ORE_CODIGO} className="flex flex-col flex-nowrap sm:table-row mb-2 sm:mb-0">
                                    <td className="border-grey-light border hover:bg-gray-100 p-3">{item.ORE_PRO}</td>
                                    <td className="border-grey-light border hover:bg-gray-100 p-3 sm:w-full">{item.ORE_NOME}</td>
                                    <td className="border-grey-light border hover:bg-gray-100 p-3">{item.ORE_QUANTIDADE}</td>
                                    <td className="border-grey-light border hover:bg-gray-100 p-3">{item.ORE_EMBALAGEM}</td>
                                    <td className="border-grey-light border hover:bg-gray-100 p-3">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(item.ORE_VALOR / item.ORE_QUANTIDADE)}</td>
                                    <td className="border-grey-light border hover:bg-gray-100 p-3">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(item.ORE_VALOR)}</td>
                                    <td className="border-grey-light border hover:bg-gray-100 p-1 sm:p-3 text-red-400 hover:text-red-600 hover:font-medium cursor-pointer">
                                        <button
                                            className="p-1 text-sm px-2 mx-1 bg-black text-white rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none"
                                            type="button"
                                            onClick={() => excluirProduto(item.ORE_CODIGO)}
                                        >
                                            <i className="fas fa-trash text-white "></i>
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    const ModalListarArquivos = () => {

        const ModalMostrarArquivos = () => {
            const [listaArquivos, setListaArquivos] = useState<ArquivoModel[]>([]);
            const [carregando, setCarregando] = useState(true);

            const buscaArquivos = async () => {
                const lista = await ArquivoRepository.getArquivoRepository(codigoOrdem);
                setListaArquivos(lista);
            }

            useEffect(() => {
                setCarregando(true);
                buscaArquivos();
                setCarregando(false);

            }, [])

            async function downloadFile(path: string) {
                fetch('/api/downloads', {
                    method: 'GET',
                    
                    headers: {
                      'Content-Type': 'application/pdf',
                      'path': path
                    },
                  })
                  .then((response) => response.blob())
                  .then((blob) => {
                    // Create blob link to download
                    const url = window.URL.createObjectURL(
                      new Blob([blob]),
                    );
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute(
                      'download',
                      getFileName(path),
                    );
                
                    // Append to html link element page
                    document.body.appendChild(link);
                
                    // Start download
                    link.click();
                
                  });
                            
            }


            async function download_File(path: string) {
                const apiDownload = axios.create({ baseURL: '/api' })
                const formData = new FormData();
                formData.append('download', path);
                const response = await apiDownload.get('/downloads', {
                    headers: { path: path },
                    responseType: 'stream'
                });
                const url = window.URL.createObjectURL(new Blob([response.data]))
                            
            }

            return (
                carregando ?
                    <>
                        Carregando...
                    </>
                    :
                    <Modal showModal={showMostrarArquivos} setShowModal={setShowMostrarArquivos}
                        title="Arquivos Enviados"
                        showButtonExit={false}
                        body={
                            <div>
                                <table className="w-full flex sm:flex-col flex-nowrap sm:bg-white rounded-lg overflow-hidden sm:shadow-lg my-5">
                                    <thead className="text-white">
                                        {
                                            <tr className="bg-amber-400 flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0">
                                                <th className="p-3 text-left">Cód.</th>
                                                <th className="p-3 text-left w-full">Nome</th>
                                                <th className="p-3 text-left">Observação</th>
                                                <th className="p-3 text-left">Download</th>
                                            </tr>
                                        }
                                    </thead>
                                    <tbody className="flex-1 sm:flex-none">
                                        {listaArquivos.map((item) =>
                                            <tr key={item.AO_CODIGO} className="flex flex-col flex-nowrap sm:table-row mb-2 sm:mb-0">
                                                <td className="border-grey-light border hover:bg-gray-100 p-3">{item.AO_CODIGO}</td>
                                                <td className="border-grey-light border hover:bg-gray-100 p-3 sm:w-full">{getFileName(item.AO_CAMINHO)}</td>
                                                <td className="border-grey-light border hover:bg-gray-100 p-3">{item.AO_OBS}</td>
                                                <td className="border-grey-light border hover:bg-gray-100 p-1 sm:p-3 text-red-400 hover:text-red-600 hover:font-medium cursor-pointer">
                                                    <button
                                                        className="p-1 text-sm px-2 mx-1 bg-black text-white rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none"
                                                        type="button"
                                                        onClick={() => downloadFile(item.AO_CAMINHO)}
                                                    >
                                                        <i className="fas fa-download text-white "></i>
                                                        <Link
                                                        href={''}
                                                            download="Example-PDF-document"
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        />
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        }
                    />
            );

        }
        const [showMostrarArquivos, setShowMostrarArquivos] = useState(false);
        const [observacaoArquivos, setObservacaoArquivos] = useState('');

        const handleUpload = async () => {
            const apiUpload = axios.create({ baseURL: '/api' })
            if (!selectedFiles) {
                toastMixin.fire('Nenhum arquivo selecionado!', 'Atenção', 'warning');
                return;
            }
            const files = selectedFiles;
            const formData = new FormData();

            for (const file of Array.from(files)) {
                formData.append('files', file);
            }
            const arq: ArquivoModel = {
                AO_CAMINHO: '',
                AO_CODIGO: 0,
                AO_OBS: observacaoArquivos,
                AO_OS: ordem?.ORD_CODIGO!,
            };
            formData.append('arquivo', JSON.stringify(arq));
            const response = await apiUpload.post('/uploads', formData,
                {
                    params: arq
                });
            if (response.status === 200) {
                toastMixin.fire(response.data.message, 'Sucesso', 'success')
            }
        }

        const handleFileChange = (event: any) => {
            setSelectedFiles(Array.from(event.target.files));
        };
        return (
            <div>
                <Modal showModal={showModalListaArquivos} setShowModal={setShowModalListaArquivos}
                    title="Listar Arquivos"
                    showButtonExit={false}
                    body={
                        <div>
                            <div className="flex flex-col">
                                <div className="flex flex-col p-1">
                                    <label htmlFor="arquivos">Arquivos</label>
                                    <input type="file" id="arquivosid" multiple onChange={handleFileChange} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 h-36 sm:w-96" />
                                </div>
                                <div className="flex flex-col p-1">
                                    <label htmlFor="arquivos">Observação</label>

                                    <textarea id="arquivoObs" value={observacaoArquivos} onChange={e => setObservacaoArquivos(e.target.value)} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 h-36 sm:w-96" />
                                </div>
                            </div>
                            <div className=" grid itens-center justify-center gap-4 grid-cols-2	">
                                <button
                                    onClick={e => setShowMostrarArquivos(true)}
                                    className="bg-black p-2 rounded-md text-white hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none">Mostrar Arquivos</button>
                                <button
                                    onClick={handleUpload}
                                    className="bg-black p-2 rounded-md text-white hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none">Salvar Arquivos</button>
                            </div>
                        </div>
                    }
                />
                {showMostrarArquivos && <ModalMostrarArquivos />}
            </div>
        );
    }

    const ModalImprimir = () => {
        return (
            <Modal showModal={showModalimprimir} setShowModal={setShowModalImprimir}
                title={foiFaturado ? "Impressão de Ordem de Serviço" : "Impressão de Orçamento"}
                showButtonExit={false}
                body={
                    <PrintOrcamentos />
                }
            />
        );
    }

    const Atalhos = () => {
        return (
            <>
                <div className="sm:flex justify-center items-center h-8 w-full bg-amber-300 rounded-t-md text-center shadow-lg">
                    <h2 className="text-black font-bold">Atalhos</h2>
                </div>
                <div className="p-4 space-y-4">
                    <button
                        className={`px-4 py-3 flex items-center space-x-4 rounded-md group text-black font-bold`}
                        onClick={e => setShowModalEmpreitadas(true)}
                    >
                        <i className="fas fa-hand-holding-usd"></i>
                        <span>Empreitadas</span>
                    </button>
                    <button
                        className={`px-4 py-3 flex items-center space-x-4 rounded-md  group text-black font-bold`}
                        onClick={e => setShowModalListaArquivos(true)}
                    >
                        <i className="fas fa-exchange-alt"></i>
                        <span>Listar Arquivos</span>
                    </button>
                    <button
                        className={`px-4 py-3 flex items-center space-x-4 rounded-md  group text-black font-bold`}
                        onClick={e => imprimeOrcamento()}
                    >
                        <i className="fas fa-print"></i>
                        <span>Imprimir</span>
                    </button>
                </div>
            </>
        );
    }

    const faturamentoOS = async () => {
        await salvaOrdem();
        if ((listaProdutosInseridos.length === 0) && (listaServicosInseridos.length === 0)) {
            toastMixin.fire('Inserira ou menos um produtos ou serviço, para faturar!', 'Atenção', 'warning');
            return;
        }
        setShowFaturamento(true);
    }

    const Totalizador = () => {
        return (
            <>
                <div className="sm:flex justify-center items-center h-8 w-full bg-amber-300 rounded-t-md text-center shadow-lg">
                    <h2 className="text-black font-bold">Total</h2>
                </div>
                <div className="p-4 space-y-4">
                    <div>
                        <h4 className="text-sm font-bold">Valor Total Produtos</h4>
                        <span className="text-xl font-bold">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(totalProdutos())}</span>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold">Valor Total Serviços</h4>
                        <span className="text-xl font-bold">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(totalServicos())}</span>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold">Valor Total OS</h4>
                        <span className="text-2xl font-bold">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format((totalProdutos()) + (totalServicos() ?? 0))}</span>
                    </div>
                    <div>
                        <button onClick={faturamentoOS} disabled={(codFatura > 0) || codigoOrdem === 0} className={`p-0 w-32 h-12 text-white text-bold ${(codFatura > 0) || codigoOrdem === 0 ? 'bg-gray-400' : 'bg-black'} rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none`}>Faturar</button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="lg:ml-64 lg:pl-4 lg:flex lg:flex-col lg:w-75% mx-2 h-auto overflow-hidden">
            <div className="bg-white rounded-lg shadow-md m-2">
                <h2 className="text-md rounded-t-md font-bold text-black bg-amber-400 p-2">Orçamentos</h2>
                <div className="sm:flex gap-2">
                    <div className="flex flex-wrap items-start justify-start">
                        <div className="flex flex-1 flex-col p-1">
                            <label htmlFor="codOrdem">Cod. Ordem</label>
                            <div className="flex flex-row">
                                <input type="number" id="edtCodigoOrdem" placeholder="0" autoFocus onKeyDown={(e) => buscarOrdem(e)} value={codigoOrdem ?? ''} onChange={e => setCodigoOrdem(parseInt(e.target.value))} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400" />
                                <button
                                    className={`${(listaProdutosInseridos.length == 0 && listaServicosInseridos.length == 0) ? 'bg-slate-400 active:bg-slate-600' : 'bg-amber-500 active:bg-amber-600'} p-1 text-sm px-2 mx-1 bg-black text-white rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none`}
                                    type="button"
                                    onClick={() => setShowModalSalvar(true)}
                                    disabled={listaProdutosInseridos.length == 0 && listaServicosInseridos.length == 0}
                                >
                                    <i className="fa fa-solid fa-floppy-disk text-white"></i>
                                </button>
                                <button
                                    className={`bg-amber-500 active:bg-amber-600'} p-1 text-sm px-2 mx-1 bg-black text-white rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none`}
                                    type="button"
                                    onClick={e => setShowModalPesquisaOS(true)}
                                >
                                    <i className="fas fa-magnifying-glass text-white"></i>
                                </button>
                                {showModalSalvar && <ModalSalvar />}
                                {showModalPesquisaOS && <PesquisaOrdem
                                    OrdemSelecionado={codigoOrdem}
                                    setOrdemSelecionado={setCodigoOrdem}
                                    showModal={showModalPesquisaOS}
                                    setShowModal={setShowModalPesquisaOS}
                                />}
                            </div>
                        </div>
                        <div className="flex flex-1 flex-col p-1">
                            <label htmlFor="dataAb">Data Abertura</label>
                            <input value={dataAbertura.toLocaleDateString()} className="sm:w-28 uppercase p-1 border rounded-md border-spacing-1 border-amber-400" type="text" />
                        </div>
                        <div className="flex flex-1 flex-col p-1">
                            <label htmlFor="fatura">Fatura</label>
                            <input value={codFatura} readOnly className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400" type="text" />
                        </div>
                        <div className="flex flex-1 flex-col p-1">
                            <label htmlFor="nfServico">NF Serviço</label>
                            <input value={nfs} onChange={(e) => setNfs(e.target.value)} className="sm:w-28 uppercase p-1 border rounded-md border-spacing-1 border-amber-400" type="text" />
                        </div>
                        <div className="flex flex-col p-1">
                            <label htmlFor="status">Status</label>
                            <select id='statusid' value={statusOrdem} onChange={(e) => setStatusOrdem(e.target.value)} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400" >
                                {listaStatus().map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-1 flex-col p-1">
                            <label htmlFor="cliente">Cliente</label>
                            <div className="flex flex-row">
                                <input id="clientid" value={clienteSelecionado.NOME} readOnly className="w-96 border uppercase p-1 rounded-md border-spacing-1 border-amber-400" type="text" />
                                <button
                                    className="p-1 text-sm px-2 mx-1 bg-black text-white rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none"
                                    type="button"
                                    onClick={() => setShowModalPesquisaCliente(true)}
                                >
                                    <i className="fas fa-magnifying-glass text-white"></i>
                                </button>
                                {showModalPesquisaCliente &&
                                    <Pesquisa_cliente
                                        clienteSelecionado={clienteSelecionado}
                                        setClienteSelecionado={setClienteSelecionado}
                                        showModal={showModalPesquisaCliente}
                                        setShowModal={setShowModalPesquisaCliente}
                                    />
                                }
                            </div>
                        </div>
                        <div className="flex flex-1 flex-col p-1">
                            <label htmlFor="atendente">Atendente</label>
                            <input id='atendenteid' value={atendente} onChange={(e) => setAtendente(e.target.value)} className="w-96 border uppercase p-1 rounded-md border-spacing-1 border-amber-400" type="text" />
                        </div>
                        <div className="flex flex-1 flex-col p-1">
                            <label htmlFor="obs">Observações</label>
                            <textarea id="obsid" value={obs} onChange={e => setObs(e.target.value)} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400" />
                        </div>
                        <div className="flex flex-1 flex-col p-1">
                            <label htmlFor="solicitacoes">Solicitações</label>
                            <textarea id="solicitacaoid" value={solicitacao} onChange={(e) => setSolicitacao(e.target.value)} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400" />
                        </div>
                    </div>
                    <div className="sm:flex gap-2 h-82 p-2">
                        <div className="bg-amber-400 sm:w-44 rounded-lg shadow-md my-4 w-full">
                            <Atalhos />
                        </div>
                        <div className="bg-amber-400 sm:w-44 rounded-lg shadow-md my-4 w-full">
                            <Totalizador />
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <div className='border border-b-indigo-800'>
                    <ul className='flex cursor-pointer'>
                        <li onClick={() => handleClickAba('SERVICOS')} className={`p-1 m-2 ${abaAtiva === 'SERVICOS' ? 'bg-black text-white rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none' : 'bg-white rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none text-black'}`}>Serviços</li>
                        <li onClick={() => handleClickAba('PRODUTOS')} className={`p-1 m-2 ${abaAtiva === 'PRODUTOS' ? 'bg-black text-white rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none' : 'bg-white rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none text-black'}`}>Produtos</li>
                    </ul>
                </div>
                {abaAtiva === 'SERVICOS' ? <AbaServicos /> : <AbaProdutos />}
            </div>
            {showFaturamento && <Modal
                title="Faturamento OS"
                showModal={showFaturamento}
                setShowModal={setShowFaturamento}
                showButtonExit={false}
                body={<Faturamentos
                    tipoRecPag="R"
                    Operacao={new OperacaoOrdens()}
                    pedFat={{
                        PF_CODIGO: 0,
                        PF_COD_CLI: clienteSelecionado.CODIGO,
                        PF_CAMPO_DATAC: 'ORD_DATAC',
                        PF_CAMPO_FAT: 'ORD_FAT',
                        PF_CAMPO_PED: 'ORD_CODIGO',
                        PF_CLIENTE: clienteSelecionado.NOME,
                        PF_COD_PED: codigoOrdem,
                        PF_DATA: new Date().toLocaleDateString(),
                        PF_DATAC: '01/01/1900',
                        PF_DESCONTO: 0,
                        PF_FAT: 0,
                        PF_FUN: 1,
                        PF_PARCELAS: 1,
                        PF_TABELA: 'ORDENS',
                        PF_TIPO: 1,
                        PF_VALOR: 0,
                        PF_VALORB: 0,
                        PF_VALORPG: 0,
                    }}
                    model={ordem!}
                    itens={listaProdutosInseridos}
                    itens2={listaServicosInseridos}
                    setShowModal={setShowFaturamento}
                    setFaturado={setFoiFaturado}
                    cliFor={clienteSelecionado}
                    valorTotal={totalProdutos() + totalServicos()} />}
            />}
            {showModalimprimir && <ModalImprimir />}
            {showModalEmpreitadas &&
                <Modal showModal={showModalEmpreitadas} setShowModal={setShowModalEmpreitadas}
                    title="Empreitadas"
                    showButtonExit={false}
                    body={
                        <Empreitadas ordemServico={ordem!} />
                    }
                />}
            {showModalListaArquivos && <ModalListarArquivos />}
        </div >
    );
}