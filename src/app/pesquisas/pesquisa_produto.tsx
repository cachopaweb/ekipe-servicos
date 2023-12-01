import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Modal from "../components/modal";
import Swal from "sweetalert2";
import ProdutoRepository from "../repositories/produto_repository";
import { ProdutoModel } from "../models/produto_model";

type pesquisaProdutoParams = {
    showModal: boolean;
    setShowModal: Dispatch<SetStateAction<boolean>>;
    produtoSelecionado: ProdutoModel;
    setProdutoSelecionado: Dispatch<SetStateAction<ProdutoModel>>;
}

export default function PesquisaProduto({ showModal, setShowModal, setProdutoSelecionado }: pesquisaProdutoParams){ 
    const [textoPesquisado, setTextoPesquisado] = useState('');
    const [produtos, setProdutos] = useState<ProdutoModel[]>([]);   

    useEffect(()=>{
        buscarProdutoModel();
    }, [textoPesquisado])

    const buscarProdutoModel = async ()=> {
        try {
            const repository = new ProdutoRepository();
            const listaProdutos = await repository.getProdutos(textoPesquisado);
            setProdutos(listaProdutos);
        } catch (error) {
            Swal.fire('Erro', String(error), 'error');
        }
    }

    const selecionarProdutoModel = (model: ProdutoModel)=> {        
        setProdutoSelecionado(model);
        setShowModal(false);
    }

    return (
        <>
            <Modal
                showModal={showModal}
                setShowModal={setShowModal}
                title="Pesquisa Produto"
                edtSearch={<input className="border rounded-md border-spacing-1 border-amber-400 sm:w-96 sm:p-2 mx-4" type="text" placeholder="Pesquisar" value={textoPesquisado} onChange={(e)=> setTextoPesquisado(e.target.value)} />}
                body={
                    <table className="table-auto">
                        <thead>
                            <tr>
                                <th className="sm:px-4 sm:py-2 text-left border-b-2">
                                    <h2 className="text-ml font-bold text-gray-600">Cód.</h2>
                                </th>
                                <th className="sm:px-4 sm:py-2 text-left border-b-2">
                                    <h2 className="text-ml font-bold text-gray-600">Nome</h2>
                                </th>
                                <th className="sm:px-4 sm:py-2 text-left border-b-2">
                                    <h2 className="text-ml font-bold text-gray-600">Quant</h2>
                                </th>                                                        
                                <th className="sm:px-4 sm:py-2 text-left border-b-2">
                                    <h2 className="text-ml font-bold text-gray-600">Custo</h2>
                                </th>                                                        
                                <th className="sm:px-4 sm:py-2 text-left border-b-2">
                                    <h2 className="text-ml font-bold text-gray-600">Valor Venda</h2>
                                </th>                                                        
                                <th className="sm:px-4 sm:py-2 text-left border-b-2">
                                    <h2 className="text-ml font-bold text-gray-600">Ação</h2>
                                </th>                                                        
                            </tr>
                        </thead>
                        <tbody>
                            {produtos.length > 0 ? (produtos.map((item) =>
                                <tr key={item.PRO_CODIGO} className="border-b">
                                    <td className="sm:px-4 sm:py-2 text-left">
                                        <div>
                                            <span className="text-xs">{item.PRO_CODIGO}</span>
                                        </div>
                                    </td>
                                    <td className="sm:px-4 sm:py-2 text-left">
                                        <div>
                                            <span className="text-xs">{item.PRO_NOME}</span>
                                        </div>
                                    </td>
                                    <td className="sm:px-4 sm:py-2 text-left">
                                        <div>
                                            <span className="text-xs">{item.PRO_QUANTIDADE}</span>
                                        </div>
                                    </td>                                                            
                                    <td className="sm:px-4 sm:py-2 text-left">
                                        <div>
                                            <span className="text-xs">{item.PRO_VALORC}</span>
                                        </div>
                                    </td>                                                            
                                    <td className="sm:px-4 sm:py-2 text-left">
                                        <div>
                                            <span className="text-xs">{item.PRO_VALORV}</span>
                                        </div>
                                    </td>                                                            
                                    <td className="sm:px-4 sm:py-2 text-left">
                                        <div>
                                            <button onClick={()=> selecionarProdutoModel(item)} className="bg-green-700 p-2 text-xs rounded-xl shadow-sm text-white">Escolher</button>
                                        </div>
                                    </td>                                                            
                                </tr>
                            )): <h1>Aguarde, carregando dados...</h1>}
                        </tbody>
                    </table>
                }
            />
        </>
    )
}