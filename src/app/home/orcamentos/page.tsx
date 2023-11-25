'use client'
import { useEffect, useState } from "react";
import Pesquisa_cliente from "../../pesquisas/pesquisa_cliente";
import Pesquisa_produto from "../../pesquisas/pesquisa_produto";
import { ClienteModel } from "../../models/cliente_model";
import { ProdutoModel } from "../../models/produto_model";
import Swal from "sweetalert2";
import OrdEstModel from "../../models/ord_est_model";
import OrdSerModel from "../../models/ord_ser_model";
import Modal from "../../components/modal";
import { FormatDate, GeraCodigo, Status, keyBoardInputEvent } from "@/app/functions/utils";
import OrdemModel from "@/app/models/ordem_model";
import OrdemRepository from "@/app/repositories/ordem_repository";
import UnidadeMedidaModel from "@/app/models/unidade_med_model";
import UnidadeMedidaRepository from "@/app/repositories/unidade_med_repository";
import Empreitadas from "../empreitadas/page";
import Faturamentos from "@/app/faturamentos/page";

var toastMixin = Swal.mixin({
    toast: true,
    icon: 'success',
    title: 'General Title',
    position: 'top-right',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

export default function Orcamentos() {
    const [dataAbertura, setDataAbertura] = useState(new Date());
    const [showModalPesquisaCliente, setShowModalPesquisaCliente] = useState(false);
    const [showModalPesquisaProduto, setShowModalPesquisaProduto] = useState(false);
    const [showModalSalvar, setShowModalSalvar] = useState(false);
    const [showModalEmpreitadas, setShowModalEmpreitadas] = useState(false);
    const [showModalListaArquivos, setShowModalListaArquivos] = useState(false);
    const [clienteSelecionado, setClienteSelecionado] = useState<ClienteModel>({ CODIGO: 1, NOME: 'CONSUMIDOR' });
    // const [servicoSelecionado, setServicoSelecionado] = useState<Servico>({ CODIGO: 1, NOME: 'CONSUMIDOR' });
    const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoModel>({ PRO_CODIGO: 1, PRO_NOME: 'GENERICO' });
    const [atendente, setAtendente] = useState('');
    const [abaAtiva, setAbaAtiva] = useState('SERVICOS');
    const [listaProdutosInseridos, setListaProdutosInseridos] = useState<OrdEstModel[]>([]);
    const [quantProduto, setQuantProduto] = useState(1);
    const [valorProduto, setValorProduto] = useState(0);
    ////servico  
    const [listaServicosInseridos, setListaServicosInseridos] = useState<OrdSerModel[]>([]);
    const [quantServico, setQuantServico] = useState(1);
    const [valorServico, setValorServico] = useState(0);
    const [nomeServico, setNomeServico] = useState('');
    const [unidadeMedServico, setUnidadeMedServico] = useState('');
    const [unidadeMedProduto, setUnidadeMedProduto] = useState('');
    const [codServico, setCodServico] = useState(0);
    const [codigoOrdem, setCodigoOrdem] = useState(0);
    const [nfs, setNfs] = useState('');
    const [obs, setObs] = useState('');
    const [obs_adm, setObs_adm] = useState('');
    const [solicitacao, setSolicitacao] = useState('');
    const [statusOrdem, setStatusOrdem] = useState(Status[0].toUpperCase());
    const [listaUnidadesMed, setListaUnidadesMed] = useState<UnidadeMedidaModel[]>([]);
    const [showFaturamento, setShowFaturamento] = useState(false);

    const carregaUnidadesMed = async () => {
        try {
            const repository = new UnidadeMedidaRepository();
            const unidades = await repository.getUnidadeMedidas();
            setListaUnidadesMed(unidades);
        } catch (error) {
            Swal.fire('Erro', String(error), 'error')
        }
    }

    useEffect(() => {
        carregaUnidadesMed()
    }, [])

    const listaStatus = () => {
        let list = Object.values(Status).filter(v => isNaN(Number(v)));
        list = list.map(v => v.toString().toUpperCase());
        return list;
    }

    const handleClickAba = (aba: string) => {
        setAbaAtiva(aba);
    }

    const inserirProduto = () => {
        try {
            if (quantProduto === 0) {
                Swal.fire('Quantidade zero', 'A quantidade não pode ser Zero', 'warning')
                return;
            }
            if (valorProduto === 0) {
                Swal.fire('Valor zero', 'O Valor do produto não pode ser Zero', 'warning')
                return;
            }
            setListaProdutosInseridos(item => [...item, {
                ORE_CODIGO: 0,
                ORE_NOME: produtoSelecionado.PRO_NOME,
                ORE_EMBALAGEM: unidadeMedProduto,
                ORE_PRO: produtoSelecionado.PRO_CODIGO,
                ORE_QUANTIDADE: quantProduto,
                ORE_VALOR: valorProduto * quantProduto,
                ORE_ORD: 0,
            }])
        } catch (error) {
            Swal.fire('Atenção', String(error), 'warning')
        }
    }

    const inserirServico = () => {
        try {
            if (quantServico === 0) {
                Swal.fire('Quantidade zero', 'A quantidade não pode ser Zero', 'warning')
                return;
            }
            if (valorServico === 0) {
                Swal.fire('Valor zero', 'O Valor do serviço não pode ser Zero', 'warning')
                return;
            }
            setListaServicosInseridos(item => [...item, {
                OS_CODIGO: 0,
                OS_NOME: nomeServico,
                OS_UNIDADE_MED: unidadeMedServico,
                OS_SER: codServico,
                OS_QUANTIDADE: quantServico,
                OS_VALOR: valorServico * quantServico,
                OS_ORD: 0,
            }])
        } catch (error) {
            Swal.fire('Atenção', String(error), 'warning')
        }
    }

    const excluirServico = (id: number) => {
        const idServico = listaServicosInseridos.findIndex(e => e.OS_CODIGO === id);
        const lista = Array.from(listaServicosInseridos)
        lista.splice(idServico, 1);
        setListaServicosInseridos(lista);
    }

    const excluirProduto = (id: number) => {
        const idProduto = listaProdutosInseridos.findIndex(e => e.ORE_CODIGO === id);
        const lista = Array.from(listaProdutosInseridos);
        lista.splice(idProduto, 1);
        setListaProdutosInseridos(lista);
    }

    const totalProdutos = () => listaProdutosInseridos.length > 0 ? listaProdutosInseridos.map(p => p.ORE_VALOR).reduce((item1, item2) => item1 + item2) : 0;
    const totalServicos = () => listaServicosInseridos.length > 0 ? listaServicosInseridos.map(s => s.OS_VALOR).reduce((item1, item2) => item1 + item2) : 0;

    const salvaOrdem = async () => {
        if (statusOrdem === '') {
            Swal.fire('Atenção', 'Informe o estado', 'warning').finally(() => {
                setShowModalSalvar(false);
                const edtStatus = document.getElementById('statusid');
                if (edtStatus) {
                    edtStatus.focus();
                }
            });

            return;
        }
        if (solicitacao === '') {
            Swal.fire('Atenção', 'Solicitação não informada', 'warning').finally(() => {
                setShowModalSalvar(false);
                const edtSolicitacao = document.getElementById('solicitacaoid');
                if (edtSolicitacao) {
                    edtSolicitacao.focus();
                }
            });
            return;
        }
        if (listaProdutosInseridos.length === 0 && listaServicosInseridos.length === 0) {
            Swal.fire('Atenção', 'Insera produtos ou serviços na OS.', 'warning').finally(() => {
                setShowModalSalvar(false);
                if (listaServicosInseridos.length === 0) {
                    setAbaAtiva('SERVICOS')
                    const edtcodigoServico = document.getElementById('codigoServicoid');
                    if (edtcodigoServico) {
                        edtcodigoServico.focus();
                    }
                }
                if (listaProdutosInseridos.length === 0) {
                    setAbaAtiva('PRODUTOS')
                    const edtcodigoProduto = document.getElementById('codigoProdutoid');
                    if (edtcodigoProduto) {
                        edtcodigoProduto.focus();
                    }
                }
            });
            return;
        }
        if (dataAbertura.toString().replaceAll('/', '') === '') {
            setDataAbertura(new Date());
        }
        Swal.fire({
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
            let ordem: OrdemModel = {
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
            }
            ////
            repository.insereordem(ordem);
            ////
            if (listaServicosInseridos.length > 0) {
                Swal.fire({
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
                Swal.fire({
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
            Swal.fire({
                title: 'Erro',
                text: 'Erro ao salvar ordem: ' + String(e),
                timer: 2000
            })
        } finally {
            setShowModalSalvar(false)
        }
    }

    const buscarOrdem = async (e: keyBoardInputEvent) => {        
        if (e.key === 'Enter')
            try {
                const repository = new OrdemRepository();
                const ordem = await repository.buscaOrdem(codigoOrdem);
                setAtendente(ordem.FUN_NOME!);
                setClienteSelecionado(new ClienteModel(ordem.ORD_CLI, ordem.CLI_NOME));
                setDataAbertura(new Date(ordem.ORD_DATA));
                setNfs(ordem.ORD_NFS ?? '');
                setObs(ordem.ORD_OBS);
                setObs_adm(ordem.ORD_OBS_ADM);
                setSolicitacao(ordem.ORD_SOLICITACAO);
                setStatusOrdem(ordem.ORD_ESTADO);
                //produtos
                const produtos = await repository.buscaProdutosOrdem(codigoOrdem);
                console.log(produtos)
                setListaProdutosInseridos([...produtos]);
                //servicos
                const servicos = await repository.buscaServicosOrdem(codigoOrdem);
                console.log(servicos)
                setListaServicosInseridos([...servicos]);
                toastMixin.fire({
                    title: 'Ordem encontrada com sucesso'
                });
            } catch (error) {
                Swal.fire('Erro', String(error), 'error')
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
        return (
            <div className="bg-white rounded-lg shadow-md">
                <div className="border-b-2">
                    <div className="sm:flex">
                        <div className="flex flex-col p-2">
                            <label htmlFor="codigo">Código</label>
                            <div className="flex flex-row">
                                <input id="codigoServicoid" value={codServico} readOnly className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 flex-1" type="text" />
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
                            <input value={nomeServico} onChange={(e) => setNomeServico(e.target.value)} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-80" type="text" />
                        </div>
                        <div className="flex flex-col p-2">
                            <label htmlFor="unidade">UM</label>
                            <select value={unidadeMedServico} onChange={(e) => setUnidadeMedServico(e.target.value)} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-36">
                                {listaUnidadesMed.map(u => <option key={u.UM_UNIDADE} value={u.UM_UNIDADE}>{u.UM_UNIDADE}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col p-2">
                            <label htmlFor="quant">Quant</label>
                            <input value={quantServico} onChange={(e) => setQuantServico(parseFloat(e.target.value))} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-24" type="text" />
                        </div>
                        <div className="flex flex-col p-2 w-60">
                            <label htmlFor="valor">Valor</label>
                            <input value={valorServico} onChange={(e) => setValorServico(parseFloat(e.target.value))} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-24" type="text" />
                        </div>
                        <div>
                            <button
                                className="w-12 h-12 m-4 bg-black text-white rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none"
                                type="button"
                                onClick={inserirServico}
                            >
                                <i className="fas fa-check text-white "></i>
                            </button>
                        </div>
                    </div>
                </div>
                <table className="table-auto w-full">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 text-left border-b-2">
                                <h2 className="text-ml font-bold text-gray-600">Cód.</h2>
                            </th>
                            <th className="px-4 py-2 text-left border-b-2">
                                <h2 className="text-ml font-bold text-gray-600">Serviço</h2>
                            </th>
                            <th className="px-4 py-2 text-left border-b-2">
                                <h2 className="text-ml font-bold text-gray-600">Quantidade</h2>
                            </th>
                            <th className="px-4 py-2 text-left border-b-2">
                                <h2 className="text-ml font-bold text-gray-600">UM</h2>
                            </th>
                            <th className="px-4 py-2 text-left border-b-2">
                                <h2 className="text-ml font-bold text-gray-600">Valor Unit.</h2>
                            </th>
                            <th className="px-4 py-2 text-left border-b-2">
                                <h2 className="text-ml font-bold text-gray-600">Valor Total</h2>
                            </th>
                            <th className="px-4 py-2 text-left border-b-2">
                                <h2 className="text-ml font-bold text-gray-600">Ação</h2>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {listaServicosInseridos.map((item) =>
                            <tr className="border-b w-full">
                                <td className="px-4 py-2 text-left">
                                    <div>
                                        <h2>{item.OS_CODIGO}</h2>
                                    </div>
                                </td>
                                <td className="px-4 py-2 text-left">
                                    <div>
                                        <h2>{item.OS_NOME}</h2>
                                    </div>
                                </td>
                                <td className="px-4 py-2 text-left text-amber-500">
                                    <p><span>{item.OS_QUANTIDADE}</span></p>
                                </td>
                                <td className="px-4 py-2 text-left">
                                    <div>
                                        <h2>{item.OS_UNIDADE_MED}</h2>
                                    </div>
                                </td>
                                <td className="px-4 py-2 text-left text-amber-500">
                                    <p><span>R$ {item.OS_VALOR / item.OS_QUANTIDADE}</span></p>
                                </td>
                                <td className="px-4 py-2 text-left text-amber-500">
                                    <p><span>R$ {item.OS_VALOR}</span></p>
                                </td>
                                <td className="px-4 py-2 text-left text-amber-500">
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
            </div>);
    }

    const AbaProdutos = () => {
        return (
            <div className="bg-white rounded-lg  shadow-md">
                <div className="border-b-2">
                    <div className="sm:flex">
                        <div className="flex flex-col p-2">
                            <label htmlFor="codigo">Código</label>
                            <div className="flex flex-row">
                                <input id="codigoProdutoid" value={produtoSelecionado.PRO_CODIGO} readOnly className="p-1 border rounded-md border-spacing-1 border-amber-400 flex-1" type="text" />
                                <button
                                    className="p-1 text-sm px-2 mx-1 bg-black text-white rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none"
                                    type="button"
                                    onClick={() => setShowModalPesquisaProduto(true)}
                                >
                                    <i className="fas fa-magnifying-glass text-white"></i>
                                </button>
                                {showModalPesquisaProduto &&
                                    <Pesquisa_produto
                                        setValorProduto={setValorProduto}
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
                            <input value={produtoSelecionado.PRO_NOME} readOnly className="p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-80" type="text" />
                        </div>
                        <div className="flex flex-col p-2">
                            <label htmlFor="unidade">UM</label>
                            <select defaultValue={unidadeMedProduto} onChange={(e) => setUnidadeMedProduto(e.target.value)} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-36">
                                {listaUnidadesMed.map(u => <option key={u.UM_UNIDADE} value={u.UM_UNIDADE}>{u.UM_UNIDADE}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col p-2">
                            <label htmlFor="quant">Quant</label>
                            <input value={quantProduto} onChange={(e) => setQuantProduto(parseFloat(e.target.value))} className="p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-24" type="text" />
                        </div>
                        <div className="flex flex-col p-2 w-60">
                            <label htmlFor="valor">Valor</label>
                            <input value={valorProduto} onChange={(e) => setValorProduto(parseFloat(e.target.value))} className="p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-24" type="text" />
                        </div>
                        <div className="">
                            <button
                                className="w-12 h-12 m-4 p-1 bg-black text-white rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none"
                                type="button"
                                onClick={inserirProduto}
                            >
                                <i className="fas fa-check text-white "></i>
                            </button>
                        </div>
                    </div>
                </div>
                <table className="table-auto w-full">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 text-left border-b-2">
                                <h2 className="text-ml font-bold text-gray-600">Cód.</h2>
                            </th>
                            <th className="px-4 py-2 text-left border-b-2">
                                <h2 className="text-ml font-bold text-gray-600">Produto</h2>
                            </th>
                            <th className="px-4 py-2 text-left border-b-2">
                                <h2 className="text-ml font-bold text-gray-600">Quantidade</h2>
                            </th>
                            <th className="px-4 py-2 text-left border-b-2">
                                <h2 className="text-ml font-bold text-gray-600">UM</h2>
                            </th>
                            <th className="px-4 py-2 text-left border-b-2">
                                <h2 className="text-ml font-bold text-gray-600">Valor Unit.</h2>
                            </th>
                            <th className="px-4 py-2 text-left border-b-2">
                                <h2 className="text-ml font-bold text-gray-600">Valor Total</h2>
                            </th>
                            <th className="px-4 py-2 text-left border-b-2">
                                <h2 className="text-ml font-bold text-gray-600">Ação</h2>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {listaProdutosInseridos.map((item) =>
                            <tr className="border-b w-full">
                                <td className="px-4 py-2 text-left">
                                    <div>
                                        <h2>{item.ORE_CODIGO}</h2>
                                    </div>
                                </td>
                                <td className="px-4 py-2 text-left">
                                    <div>
                                        <h2>{item.ORE_NOME}</h2>
                                    </div>
                                </td>
                                <td className="px-4 py-2 text-left text-amber-500">
                                    <p><span>{item.ORE_QUANTIDADE}</span></p>
                                </td>
                                <td className="px-4 py-2 text-left">
                                    <div>
                                        <h2>{item.ORE_EMBALAGEM}</h2>
                                    </div>
                                </td>
                                <td className="px-4 py-2 text-left text-amber-500">
                                    <p><span>R$ {item.ORE_VALOR / item.ORE_QUANTIDADE}</span></p>
                                </td>
                                <td className="px-4 py-2 text-left text-amber-500">
                                    <p><span>R$ {item.ORE_VALOR}</span></p>
                                </td>
                                <td className="px-4 py-2 text-left text-amber-500">
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
        );
    }

    const ModalListarArquivos = () => {
        return (
            <Modal showModal={showModalListaArquivos} setShowModal={setShowModalListaArquivos}
                title="Listar Arquivos"
                showButtonExit={false}
                body={
                    <div>
                        <div className="flex flex-col">
                            <div className="flex flex-col p-1">
                                <label htmlFor="arquivos">Arquivos</label>
                                <input type="file" id="arquivosid" className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 h-36 sm:w-96" />
                            </div>
                            <div className="flex flex-col p-1">
                                <label htmlFor="arquivos">Observação</label>
                                <textarea id="arquivosid" className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 h-36 sm:w-96" />
                            </div>
                        </div>
                        <div className="flex itens-center justify-center gap-4">
                            <button className="bg-black p-2 rounded-md text-white hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none">Salvar Arquivos</button>
                        </div>
                    </div>
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
                    {showModalEmpreitadas && <Empreitadas codigoOrdem={codigoOrdem} showModalEmpreitadas setShowModalEmpreitadas={setShowModalEmpreitadas} />}
                    <button
                        className={`px-4 py-3 flex items-center space-x-4 rounded-md  group text-black font-bold`}
                        onClick={e => setShowModalListaArquivos(true)}
                    >
                        <i className="fas fa-exchange-alt"></i>
                        <span>Listar Arquivos</span>
                    </button>
                    {showModalListaArquivos && <ModalListarArquivos />}

                </div>
            </>
        );
    }

    const faturamentoOS = () => {
        if ((listaProdutosInseridos.length === 0) && (listaServicosInseridos.length === 0)) {
            Swal.fire('Inserira ou menos um produtos ou serviço, para faturar!', 'Atenção', 'warning');
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
                        <button onClick={faturamentoOS} className="p-0 w-32 h-12 text-white text-bold bg-black rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none">Faturar</button>
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
                                <input value={codigoOrdem} onChange={e => setCodigoOrdem(Number(e.target.value))} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400" type="text" onKeyDown={(e) => buscarOrdem(e)} />
                                <button
                                    className={`${(listaProdutosInseridos.length == 0 && listaServicosInseridos.length == 0) ? 'bg-slate-400 active:bg-slate-600' : 'bg-amber-500 active:bg-amber-600'} p-1 text-sm px-2 mx-1 bg-black text-white rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none`}
                                    type="button"
                                    onClick={() => setShowModalSalvar(true)}
                                    disabled={listaProdutosInseridos.length == 0 && listaServicosInseridos.length == 0}
                                >
                                    <i className="fa fa-solid fa-floppy-disk text-white"></i>
                                </button>
                                {showModalSalvar && <ModalSalvar />}
                            </div>
                        </div>
                        <div className="flex flex-1 flex-col p-1">
                            <label htmlFor="dataAb">Data Abertura</label>
                            <input value={dataAbertura.toLocaleDateString()} className="sm:w-28 uppercase p-1 border rounded-md border-spacing-1 border-amber-400" type="text" />
                        </div>
                        <div className="flex flex-1 flex-col p-1">
                            <label htmlFor="fatura">Fatura</label>
                            <input className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400" type="text" />
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
                    <div className="flex gap-2 h-82 p-2">
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
                body={<Faturamentos setShowModal={setShowFaturamento} cliFor={clienteSelecionado} valorTotal={totalProdutos() + totalServicos()} />}
            />}
        </div >
    );
}