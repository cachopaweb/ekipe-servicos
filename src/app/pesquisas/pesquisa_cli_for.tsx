import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Modal from "../components/modal";
import Swal from "sweetalert2";
import CliForRepository from "../repositories/cli_for_repository";
import CliForModel from "../models/cli_for_model";

type presquisaCliForParams = {
    showModal: boolean;
    setShowModal: Dispatch<SetStateAction<boolean>>;
    cliForSelecionado: CliForModel;
    setCliForSelecionado: Dispatch<SetStateAction<CliForModel>>;
}

export default function PesquisaClienteFornecedor({ showModal, setShowModal, setCliForSelecionado }: presquisaCliForParams){ 
    const [textoPesquisado, setTextoPesquisado] = useState('');
    const [listaCliFor, setlistaCliFor] = useState<CliForModel[]>([]);   

    useEffect(()=>{
        buscarCliente();
    }, [textoPesquisado])

    const buscarCliente = async ()=> {
        try {
            const repository = new CliForRepository();
            const listlistaCliFor = await repository.getListaCliFor(textoPesquisado);
            setlistaCliFor(listlistaCliFor);
        } catch (error) {
            Swal.fire('Erro', String(error), 'error');
        }
    }

    const selecionarCliFor = (model: CliForModel)=> {
        setCliForSelecionado(model);
        setShowModal(false);
    }

    return (
        <>
            <Modal
                showModal={showModal}
                setShowModal={setShowModal}
                title="Pesquisa Cliente/Fornecedor"
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
                                    <h2 className="text-ml font-bold text-gray-600">CNPJ</h2>
                                </th>
                                <th className="sm:px-4 sm:py-2 text-left border-b-2">
                                    <h2 className="text-ml font-bold text-gray-600">Fone</h2>
                                </th>                                                        
                                <th className="sm:px-4 sm:py-2 text-left border-b-2">
                                    <h2 className="text-ml font-bold text-gray-600">Ação</h2>
                                </th>                                                        
                            </tr>
                        </thead>
                        <tbody>
                            {listaCliFor.length > 0 ? (listaCliFor.map((item) =>
                                <tr className="border-b">
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
                                            <button onClick={()=> selecionarCliFor(item)} className="bg-green-700 p-2 text-xs rounded-xl shadow-sm text-white">Escolher</button>
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