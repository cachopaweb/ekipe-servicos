"use client"
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Modal from "../../components/component/modal";
import Swal from "sweetalert2";
import ClientRepository from "../repositories/cliente_repository";
import { ClienteModel } from "../models/cliente_model";
import { Cadastro_clientes } from "@/components/component/cadastro_clientes";

type pesquisaClienteParams = {
    showModal: boolean;
    setShowModal: Dispatch<SetStateAction<boolean>>;
    clienteSelecionado: ClienteModel;
    setClienteSelecionado: Dispatch<SetStateAction<ClienteModel>>;
}

export default function PesquisaCliente({ showModal, setShowModal, setClienteSelecionado }: pesquisaClienteParams){ 
    const [textoPesquisado, setTextoPesquisado] = useState('');
    const [clients, setClients] = useState<ClienteModel[]>([]);
    const [cadastrarCliente, setCadastrarCliente] = useState(false);
    const [idCadastraCliente, setIdCadastraCliente] = useState(0);   

    useEffect(()=>{
        buscarCliente();
    }, [textoPesquisado])

    const cadastrarNovoCliente = ()=> {
        setIdCadastraCliente(0);
        setCadastrarCliente(true);
    }

    const buscarCliente = async ()=> {
        try {
            const repository = new ClientRepository();
            const listClients = await repository.getClientes(textoPesquisado);
            setClients(listClients);
        } catch (error) {
            Swal.fire('Erro', String(error), 'error');
        }
    }

    const visualizarCliente = (model: ClienteModel)=> {
        setIdCadastraCliente(model.CODIGO);
        setCadastrarCliente(true);
    }
    const selecionarCliente = (model: ClienteModel)=> {
        setClienteSelecionado(model);
        setShowModal(false);
    }

    return (
        <>
            <Modal
                showModal={showModal}
                setShowModal={setShowModal}
                title="Pesquisa Cliente"
                edtSearch={<input className="border rounded-md border-spacing-1 border-amber-400 sm:w-96 sm:p-2 mx-4" type="text" placeholder="Pesquisar" value={textoPesquisado} onChange={(e)=> setTextoPesquisado(e.target.value)} />}
                body={
                    <div className=" flex flex-col overflow-scroll h-96">
                        <div className="flex flex-row-reverse">
                        <button onClick={()=> cadastrarNovoCliente()} className="bg-green-700 p-2 text-xs font-bold rounded-xl shadow-sm text-white">Cadastrar Cliente</button>
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
                                        <h2 className="text-ml font-bold text-gray-600">Ver Cliente</h2>
                                    </th>                                                          
                                    <th className="sm:px-4 sm:py-2 text-left border-b-2">
                                        <h2 className="text-ml font-bold text-gray-600">Ação</h2>
                                    </th>                                                        
                                </tr>
                            </thead>
                            <tbody>
                                {clients.length > 0 ? (clients.map((item) =>
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
                                                <button onClick={()=> visualizarCliente(item)} className="bg-green-700 p-2 text-xs rounded-xl shadow-sm text-white">Visualizar</button>
                                            </div>
                                        </td>                                                               
                                        <td className="sm:px-4 sm:py-2 text-left">
                                            <div>
                                                <button onClick={()=> selecionarCliente(item)} className="bg-green-700 p-2 text-xs rounded-xl shadow-sm text-white">Escolher</button>
                                            </div>
                                        </td>                                                            
                                    </tr>
                                )): <h1>Aguarde, carregando dados...</h1>}
                            </tbody>
                        </table>
                    </div>
                }
            />
            {cadastrarCliente && <Modal showModal={cadastrarCliente} setShowModal={setCadastrarCliente} title="Cadastro Cliente" body={<Cadastro_clientes setListarCliente={setShowModal} setCadastrarCliente={setCadastrarCliente}  id={idCadastraCliente} />} /> }
        </>
    )
}