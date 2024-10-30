import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Modal from "../../components/component/modal";
import Swal from "sweetalert2";
import ClientRepository from "../repositories/fornecedor_repository";
import { Cadastro_clientes } from "@/components/component/cadastro_clientes";
import { FornecedorModel } from "../models/fornecedor_model";
import FornecedorRepository from "../repositories/fornecedor_repository";

type pesquisaFornecedorParams = {
    showModal: boolean;
    setShowModal: Dispatch<SetStateAction<boolean>>;
    fornecedorSelecionado: FornecedorModel;
    setFornecedorSelecionado: Dispatch<SetStateAction<FornecedorModel>>;
}

export default function PesquisaFornecedor({ showModal, setShowModal, setFornecedorSelecionado }: pesquisaFornecedorParams){ 
    const [textoPesquisado, setTextoPesquisado] = useState('');
    const [fornecedores, setFornecedores] = useState<FornecedorModel[]>([]);
    const [cadastrarFornecedor, setCadastrarFornecedor] = useState(false);
    const [idCadastraFornecedor, setIdCadastraFornecedor] = useState(0);   

    useEffect(()=>{
        buscarFornecedor();
    }, [textoPesquisado])

    const cadastrarNovoFornecedor = ()=> {
        setIdCadastraFornecedor(0);
        setCadastrarFornecedor(true);
    }

    const buscarFornecedor = async ()=> {
        try {
            const repository = new FornecedorRepository();
            const listaFornecedores = await repository.getFornecedores(textoPesquisado);
            setFornecedores(listaFornecedores);
        } catch (error) {
            Swal.fire('Erro', String(error), 'error');
        }
    }

    const visualizarFornecedor = (model: FornecedorModel)=> {
        setIdCadastraFornecedor(model.CODIGO);
        setCadastrarFornecedor(false);
    }
    const selecionarFornecedor = (model: FornecedorModel)=> {
        setFornecedorSelecionado(model);
        setShowModal(false);
    }

    return (
        <>
            <Modal
                showModal={showModal}
                setShowModal={setShowModal}
                title="Pesquisa Fornecedor"
                edtSearch={<input className="border rounded-md border-spacing-1 border-amber-400 sm:w-96 sm:p-2 mx-4" type="text" placeholder="Pesquisar" value={textoPesquisado} onChange={(e)=> setTextoPesquisado(e.target.value)} />}
                body={
                    <div className=" flex flex-col">
                        <div className="flex flex-row-reverse">
                        {<button disabled={true} onClick={()=> cadastrarNovoFornecedor()} className="bg-green-700 p-2 text-xs font-bold disabled:cursor-not-allowed rounded-xl shadow-sm text-white">Cadastrar Fornecedor</button>}
                        </div>
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
                                        <h2 className="text-ml font-bold text-gray-600">CNPJ</h2>
                                    </th>
                                    <th className="sm:px-4 sm:py-2 text-left border-b-2">
                                        <h2 className="text-ml font-bold text-gray-600">Fone</h2>
                                    </th>
                                    <th className="sm:px-4 sm:py-2 text-left border-b-2">
                                        <h2 className="text-ml font-bold text-gray-600">Ver Fornecedor</h2>
                                    </th>                                                          
                                    <th className="sm:px-4 sm:py-2 text-left border-b-2">
                                        <h2 className="text-ml font-bold text-gray-600">Ação</h2>
                                    </th>                                                        
                                </tr>
                            </thead>
                            <tbody>
                                {fornecedores.length > 0 ? (fornecedores.map((item) =>
                                    <tr key={item.CODIGO} className="border-b">
                                        <td className="sm:px-4 sm:py-2 text-left">
                                            <div>
                                                <span className="text-xs">{item.CODIGO}</span>
                                            </div>
                                        </td>
                                        <td className="sm:px-4 sm:py-2 text-left">
                                            <div>
                                                <span className="text-xs">{item.NOME}</span>
                                            </div>
                                        </td>
                                        <td className="sm:px-4 sm:py-2 text-left text-amber-500">
                                            <p><span className="text-xs">{item.CPF_CNPJ}</span></p>
                                        </td>
                                        <td className="sm:px-4 sm:py-2 text-left">
                                            <div>
                                                <span className="text-xs">{item.FONE}</span>
                                            </div>
                                        </td>
                                        <td className="sm:px-4 sm:py-2 text-left">
                                            <div>
                                                <button onClick={()=> visualizarFornecedor(item)} className="bg-green-700 p-2 text-xs rounded-xl shadow-sm text-white">Visualizar</button>
                                            </div>
                                        </td>                                                               
                                        <td className="sm:px-4 sm:py-2 text-left">
                                            <div>
                                                <button onClick={()=> selecionarFornecedor(item)} className="bg-green-700 p-2 text-xs rounded-xl shadow-sm text-white">Escolher</button>
                                            </div>
                                        </td>                                                            
                                    </tr>
                                )): <h1>Aguarde, carregando dados...</h1>}
                            </tbody>
                        </table>
                    </div>
                }
            />
            {cadastrarFornecedor && <Modal showModal={cadastrarFornecedor} setShowModal={setCadastrarFornecedor} title="Cadastro Fornecedor" body={<Cadastro_clientes  setListarCliente={setShowModal} setCadastrarCliente={setCadastrarFornecedor}  id={idCadastraFornecedor} />} /> }
        </>
    )
}