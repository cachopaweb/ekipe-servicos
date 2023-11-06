import { useState } from "react";
import Pesquisa_cliente from "../pesquisas/pesquisa_cliente";
import Pesquisa_produto from "../pesquisas/pesquisa_produto";
import { ClienteModel } from "../models/cliente_model";
import { ProdutoModel } from "../models/produto_model";
import Swal from "sweetalert2";
import OrdEstModel from "../models/ord_est_model";
import OrdSerModel from "../models/ord_ser_model";
import Modal from "../components/modal";

export default function Orcamentos() {
    const [dataAbertura, setDataAbertura] = useState(new Date());
    const [showModalPesquisaCliente, setShowModalPesquisaCliente] = useState(false);
    const [showModalPesquisaProduto, setShowModalPesquisaProduto] = useState(false);
    const [showModalSalvar, setShowModalSalvar] = useState(false);
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
    const [codServico, setCodServico] = useState(0);

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
                ore_codigo: listaProdutosInseridos.length + 1,
                ore_nome: produtoSelecionado.PRO_NOME,
                ore_unidade_med: produtoSelecionado.PRO_EMBALAGEM!,
                ore_pro: produtoSelecionado.PRO_CODIGO,
                ore_quantidade: quantProduto,
                ore_valor_unit: valorProduto,
                ore_valor_total: valorProduto * quantProduto
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
                os_codigo: listaServicosInseridos.length + 1,
                os_nome: nomeServico,
                os_unidade_med: unidadeMedServico,
                os_ser: codServico,
                os_quantidade: quantServico,
                os_valor_unit: valorServico,
                os_valor_total: valorServico * quantServico
            }])
        } catch (error) {
            Swal.fire('Atenção', String(error), 'warning')
        }
    }

    const excluirServico = (id: number)=>{
        const idServico = listaServicosInseridos.findIndex(e=> e.os_codigo === id);
        const lista = Array.from(listaServicosInseridos)
        lista.splice(idServico, 1);
        console.log(lista);
        setListaServicosInseridos(lista);
    }
    
    const excluirProduto = (id: number)=>{
        const idProduto = listaProdutosInseridos.findIndex(e=> e.ore_codigo === id);
        const lista = Array.from(listaProdutosInseridos);
        lista.splice(idProduto, 1);
        console.log(lista);
        setListaProdutosInseridos(lista);
    }

    const salvaOrdem = ()=>{
        Swal.fire({
            title: 'Salvar',
            text: 'Salvando ordens',
            timer: 2000
        })    
        setShowModalSalvar(false)
    }

    return (
        <div className="lg:ml-64 lg:pl-4 lg:flex lg:flex-col lg:w-75% mx-2 h-auto overflow-hidden">
            <div className="bg-white rounded-lg shadow-md my-4 h-3/4 p-2 w-full">
                <h2 className="text-ml font-bold text-gray-600">Orçamentos</h2>
                <div className="w-full">
                    <div className="sm:flex">
                        <div className="flex flex-col p-2">
                            <label htmlFor="codOrdem">Cod. Ordem</label>
                            <div className="flex flex-row h-7">
                                <input className="uppercase border rounded-md border-spacing-1 border-amber-400" type="text" />
                                <button
                                    className={`${(listaProdutosInseridos.length == 0 && listaServicosInseridos.length == 0) ? 'bg-slate-400 active:bg-slate-600' : 'bg-amber-500 active:bg-amber-600'} text-white  font-bold uppercase text-sm px-2 mx-1 rounded shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150 flex-3`}
                                    type="button"
                                    onClick={() => setShowModalSalvar(true)}  
                                    disabled={listaProdutosInseridos.length == 0 && listaServicosInseridos.length == 0}
                                >
                                    <i className="fa fa-solid fa-floppy-disk text-white"></i>
                                </button>
                                {showModalSalvar && 
                                <Modal showModal={showModalSalvar} setShowModal={setShowModalSalvar} 
                                    title="Salvar Ordem"
                                    showButtonExit={false}
                                    body={
                                        <div>
                                            <button
                                                className="bg-red-500 text-white active:bg-red-600 font-bold uppercase text-sm px-2 mx-1 rounded shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150 flex-3"
                                                type="button"
                                                onClick={() => setShowModalSalvar(false)}                                    
                                            >
                                                <i className="fa fa-solid fa-floppy-disk text-white p-2"></i>
                                                Cancelar
                                            </button>
                                            <button
                                                className="bg-green-500 text-white active:bg-green-600 font-bold uppercase text-sm px-2 mx-1 rounded shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150 flex-3"
                                                type="button"
                                                onClick={salvaOrdem}                                    
                                            >
                                                <i className="fa fa-solid fa-floppy-disk text-white p-2"></i>
                                                Salvar
                                            </button>
                                        </div>
                                    }
                                />}
                            </div>
                        </div>
                        <div className="flex flex-col p-2">
                            <label htmlFor="dataAb">Data Abertura</label>
                            <input value={dataAbertura.toLocaleDateString()} className="uppercase border rounded-md border-spacing-1 border-amber-400 sm:w-36" type="text" />
                        </div>
                        <div className="flex flex-col p-2">
                            <label htmlFor="fatura">Fatura</label>
                            <input className="uppercase border rounded-md border-spacing-1 border-amber-400 sm:w-36" type="text" />
                        </div>
                        <div className="flex flex-col p-2">
                            <label htmlFor="nfServico">NF Serviço</label>
                            <input className="uppercase border rounded-md border-spacing-1 border-amber-400 sm:w-24" type="text" />
                        </div>
                        <div className="flex flex-col p-2 sm:w-60">
                            <label htmlFor="status">Status</label>
                            <input className="uppercase border rounded-md border-spacing-1 border-amber-400" type="text" />
                        </div>
                    </div>
                    <div className="sm:flex">
                        <div className="flex flex-col p-2">
                            <label htmlFor="cliente">Cliente</label>
                            <div className="flex flex-row h-7">
                                <input value={clienteSelecionado.NOME} className="border rounded-md border-spacing-1 border-amber-400 mr-2 flex-1" type="text" />
                                <button
                                    className="bg-amber-500 text-white active:bg-amber-600 font-bold uppercase text-sm px-2 mx-1 rounded shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150 flex-3"
                                    type="button"
                                    onClick={() => setShowModalPesquisaCliente(true)}
                                >
                                    <i className="fas fa-magnifying-glass text-white"></i>
                                </button>
                                {showModalPesquisaCliente &&
                                    <Pesquisa_cliente clienteSelecionado={clienteSelecionado} setClienteSelecionado={setClienteSelecionado} showModal={showModalPesquisaCliente} setShowModal={setShowModalPesquisaCliente} />
                                }
                            </div>
                        </div>
                        <div className="flex flex-col p-2">
                            <label htmlFor="atendente">Atendente</label>
                            <input value={atendente} onChange={(e) => setAtendente(e.target.value)} className="border rounded-md border-spacing-1 border-amber-400 sm:w-80" type="text" />
                        </div>
                    </div>
                    <div className="sm:flex">
                        <div className="flex flex-col p-2">
                            <label htmlFor="obs">Observações</label>
                            <textarea className="uppercase border rounded-md border-spacing-1 border-amber-400 sm:w-96" />
                        </div>
                        <div className="flex flex-col p-2">
                            <label htmlFor="solicitacoes">Solicitações</label>
                            <textarea className="uppercase border rounded-md border-spacing-1 border-amber-400 sm:w-96" />
                        </div>
                    </div>
                </div>
                <div>
                    <div className='border border-b-indigo-800'>
                        <ul className='flex cursor-pointer'>
                            <li onClick={() => handleClickAba('SERVICOS')} className={`p-2 m-2 ${abaAtiva === 'SERVICOS' ? 'bg-amber-500 text-white font-bold uppercase text-sm px-2 mx-1 rounded shadow hover:shadow-lg' : 'text-black'}`}>Serviços</li>
                            <li onClick={() => handleClickAba('PRODUTOS')} className={`p-2 m-2 ${abaAtiva === 'PRODUTOS' ? 'bg-amber-500 text-white font-bold uppercase text-sm px-2 mx-1 rounded shadow hover:shadow-lg' : 'text-black'}`}>Produtos</li>
                        </ul>
                    </div>
                    {abaAtiva === 'SERVICOS' ? (
                        <div className="bg-white rounded-lg p-4 shadow-md">
                            <div className="border-b-2">
                                <div className="sm:flex">
                                    <div className="flex flex-col p-2">
                                        <label htmlFor="codigo">Código</label>
                                        <div className="flex flex-row">
                                            <input value={codServico} className="p-2 uppercase border rounded-md border-spacing-1 border-amber-400 flex-1" type="text" />
                                            <button
                                                className="bg-amber-500 text-white active:bg-amber-600 font-bold uppercase text-sm px-2 mx-1 rounded shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150 flex-3"
                                                type="button"
                                            // onClick={() => setShowModalPesquisaServico(true)}
                                            >
                                                <i className="fas fa-magnifying-glass text-white"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col p-2">
                                        <label htmlFor="servico">Serviço</label>
                                        <input value={nomeServico} onChange={(e) => setNomeServico(e.target.value)} className="p-2 uppercase border rounded-md border-spacing-1 border-amber-400 sm:w-80" type="text" />
                                    </div>
                                    <div className="flex flex-col p-2">
                                        <label htmlFor="unidade">UM</label>
                                        <input value={unidadeMedServico} onChange={(e) => setUnidadeMedServico(e.target.value)} className="p-2 uppercase border rounded-md border-spacing-1 border-amber-400 sm:w-36" type="text" />
                                    </div>
                                    <div className="flex flex-col p-2">
                                        <label htmlFor="quant">Quant</label>
                                        <input value={quantServico} onChange={(e) => setQuantServico(parseFloat(e.target.value))} className="p-2 uppercase border rounded-md border-spacing-1 border-amber-400 sm:w-24" type="text" />
                                    </div>
                                    <div className="flex flex-col p-2 w-60">
                                        <label htmlFor="valor">Valor</label>
                                        <input value={valorServico} onChange={(e) => setValorServico(parseFloat(e.target.value))} className="p-2 uppercase border rounded-md border-spacing-1 border-amber-400 sm:w-24" type="text" />
                                    </div>
                                    <button
                                        className="bg-amber-500 text-white m-2 p-4 active:bg-amber-600 font-bold uppercase text-sm rounded shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150"
                                        type="button"
                                        onClick={inserirServico}
                                    >
                                        <i className="fas fa-check text-white "></i>
                                    </button>
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
                                                    <h2>{item.os_codigo}</h2>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-left">
                                                <div>
                                                    <h2>{item.os_nome}</h2>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-left text-amber-500">
                                                <p><span>{item.os_quantidade}</span></p>
                                            </td>
                                            <td className="px-4 py-2 text-left">
                                                <div>
                                                    <h2>{item.os_unidade_med}</h2>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-left text-amber-500">
                                                <p><span>R$ {item.os_valor_unit}</span></p>
                                            </td>
                                            <td className="px-4 py-2 text-left text-amber-500">
                                                <p><span>R$ {item.os_valor_total}</span></p>
                                            </td>
                                            <td className="px-4 py-2 text-left text-amber-500">
                                                <button
                                                    className="bg-amber-500 text-white m-2 p-4 active:bg-amber-600 font-bold uppercase text-sm rounded shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150"
                                                    type="button"
                                                    onClick={()=> excluirServico(item.os_codigo)}
                                                >
                                                    <i className="fas fa-trash text-white "></i>
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>)
                        :
                        <div className="bg-white rounded-lg p-4 shadow-md">
                            <div className="border-b-2">
                                <div className="sm:flex">
                                    <div className="flex flex-col p-2">
                                        <label htmlFor="codigo">Código</label>
                                        <div className="flex flex-row">
                                            <input value={produtoSelecionado.PRO_CODIGO} className="p-2 border rounded-md border-spacing-1 border-amber-400 flex-1" type="text" />
                                            <button
                                                className="bg-amber-500 text-white active:bg-amber-600 font-bold uppercase text-sm px-2 mx-1 rounded shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150 flex-3"
                                                type="button"
                                                onClick={() => setShowModalPesquisaProduto(true)}
                                            >
                                                <i className="fas fa-magnifying-glass text-white"></i>
                                            </button>
                                            {showModalPesquisaProduto &&
                                                <Pesquisa_produto setValorProduto={setValorProduto} produtoSelecionado={produtoSelecionado} setProdutoSelecionado={setProdutoSelecionado} showModal={showModalPesquisaProduto} setShowModal={setShowModalPesquisaProduto} />
                                            }
                                        </div>
                                    </div>
                                    <div className="flex flex-col p-2">
                                        <label htmlFor="produto">Produto</label>
                                        <input value={produtoSelecionado.PRO_NOME} className="p-2 border rounded-md border-spacing-1 border-amber-400 sm:w-80" type="text" />
                                    </div>
                                    <div className="flex flex-col p-2">
                                        <label htmlFor="unidade">UM</label>
                                        <input value={produtoSelecionado.PRO_EMBALAGEM} className="p-2 border rounded-md border-spacing-1 border-amber-400 sm:w-36" type="text" />
                                    </div>
                                    <div className="flex flex-col p-2">
                                        <label htmlFor="quant">Quant</label>
                                        <input value={quantProduto} onChange={(e) => setQuantProduto(parseFloat(e.target.value))} className="p-2 border rounded-md border-spacing-1 border-amber-400 sm:w-24" type="text" />
                                    </div>
                                    <div className="flex flex-col p-2 w-60">
                                        <label htmlFor="valor">Valor</label>
                                        <input value={valorProduto} onChange={(e) => setValorProduto(parseFloat(e.target.value))} className="p-2 border rounded-md border-spacing-1 border-amber-400 sm:w-24" type="text" />
                                    </div>
                                    <button
                                        className="bg-amber-500 text-white m-2 p-4 active:bg-amber-600 font-bold uppercase text-sm rounded shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150"
                                        type="button"
                                        onClick={inserirProduto}
                                    >
                                        <i className="fas fa-check text-white "></i>
                                    </button>
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
                                                    <h2>{item.ore_codigo}</h2>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-left">
                                                <div>
                                                    <h2>{item.ore_nome}</h2>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-left text-amber-500">
                                                <p><span>{item.ore_quantidade}</span></p>
                                            </td>
                                            <td className="px-4 py-2 text-left">
                                                <div>
                                                    <h2>{item.ore_unidade_med}</h2>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-left text-amber-500">
                                                <p><span>R$ {item.ore_valor_unit}</span></p>
                                            </td>
                                            <td className="px-4 py-2 text-left text-amber-500">
                                                <p><span>R$ {item.ore_valor_total}</span></p>
                                            </td>
                                            <td className="px-4 py-2 text-left text-amber-500">
                                                <button
                                                    className="bg-amber-500 text-white m-2 p-4 active:bg-amber-600 font-bold uppercase text-sm rounded shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150"
                                                    type="button"
                                                    onClick={()=> excluirProduto(item.ore_codigo)}
                                                >
                                                    <i className="fas fa-trash text-white "></i>
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    }
                </div>
            </div>
        </div>
    );
}