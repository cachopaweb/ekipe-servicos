import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Modal from "../components/modal";
import Swal from "sweetalert2";
import OrdemRepository from "../repositories/ordem_repository";
import OrdemModel from "../models/ordem_model";
import { Status } from "../functions/utils";

type pesquisaOrdemParams = {
    showModal: boolean;
    setShowModal: Dispatch<SetStateAction<boolean>>;
    OrdemSelecionado: OrdemModel;
    setOrdemSelecionado: Dispatch<SetStateAction<OrdemModel>>;
}

export default function PesquisaOrdem({ showModal, setShowModal, setOrdemSelecionado }: pesquisaOrdemParams) {
    const [textoPesquisado, setTextoPesquisado] = useState('');
    const [Ordems, setOrdems] = useState<OrdemModel[]>([]);
    const [data1, setData1] = useState(new Date());
    const [data2, setData2] = useState(new Date());
    const [statusOrdem, setStatusOrdem] = useState(Status[0].toUpperCase());
    const [tipoBusca, setTipoBusca] = useState('');
    const [textoBusca, setTextoBusca] = useState('');

    useEffect(() => {
        buscarOrdemModel();
    }, [textoPesquisado])

    const listaStatus = () => {
        let list = Object.values(Status).filter(v => isNaN(Number(v)));
        list = list.map(v => v.toString().toUpperCase());
        return list;
    }

    const buscarOrdemModel = async () => {
        try {
            const repository = new OrdemRepository();
            const listaOrdems = await repository.pesquisaOrdem(textoPesquisado, tipoBusca, true, statusOrdem, data1, data2);
            setOrdems(listaOrdems);
        } catch (error) {
            Swal.fire('Erro', String(error), 'error');
        }
    }

    const selecionarOrdemModel = (model: OrdemModel) => {
        setOrdemSelecionado(model);
        setShowModal(false);
    }

    return (
        <>
            <Modal
                showModal={showModal}
                setShowModal={setShowModal}
                title="Pesquisa Ordem"
                edtSearch={<input className="border rounded-md border-spacing-1 border-amber-400 sm:w-96 sm:p-2 mx-4" type="text" placeholder="Pesquisar" value={textoPesquisado} onChange={(e) => setTextoPesquisado(e.target.value)} />}
                body={
                    <div>
                        <div className="bg-white rounded-lg shadow-md m-2">
                            <h2 className="text-md rounded-t-md font-bold text-black bg-amber-400 p-2">Filtro busca OS</h2>
                            <div className="sm:flex gap-2">
                                <div className="flex flex-wrap items-start justify-start">
                                    <div className="flex flex-1 flex-col p-1">
                                        <div className="flex-row">
                                            <label htmlFor="codOrdem">Aplicar Período</label>
                                            <div className="flex flex-row">
                                                <input type="checkbox" id="aplicarPeriodo" autoFocus className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400" />
                                            </div>
                                        </div>
                                        <input type="date" id="edtData1" value={Intl.DateTimeFormat("fr-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(data1)} onChange={e => setData1(e.target.value ? new Date(e.target.value) : new Date())} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400" />
                                        <input type="date" id="edtData2" value={Intl.DateTimeFormat("fr-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(data2)} onChange={e => setData2(e.target.value ? new Date(e.target.value) : new Date())} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400" />
                                    </div>
                                    <div className="flex flex-1 flex-col p-1">
                                        <label htmlFor="status">Status</label>
                                        <select id='statusid' value={statusOrdem} onChange={(e) => setStatusOrdem(e.target.value)} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400" >
                                            {listaStatus().map(status => <option key={status} value={status}>{status}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-1 flex-col p-1">
                                        <label htmlFor="status">Tipo Busca</label>
                                        <select id='tipoBusca' value={tipoBusca} onChange={(e) => setTipoBusca(e.target.value)} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400" >
                                            <option key="Nome" value="Nome">Nome</option>
                                            <option key="Solicitacao" value="Solicitacao">Solicitação</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-1 flex-col p-1">
                                        <label htmlFor="nfServico">Busca</label>
                                        <input value={textoBusca} onChange={(e) => setTextoBusca(e.target.value)} className="sm:w-28 uppercase p-1 border rounded-md border-spacing-1 border-amber-400" type="text" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <table className="table-auto">
                            <thead>
                                <tr>
                                    <th className="sm:px-4 sm:py-2 text-left border-b-2">
                                        <h2 className="text-ml font-bold text-gray-600">Cód.</h2>
                                    </th>
                                    <th className="sm:px-4 sm:py-2 text-left border-b-2">
                                        <h2 className="text-ml font-bold text-gray-600">Data</h2>
                                    </th>
                                    <th className="sm:px-4 sm:py-2 text-left border-b-2">
                                        <h2 className="text-ml font-bold text-gray-600">Solicitação</h2>
                                    </th>
                                    <th className="sm:px-4 sm:py-2 text-left border-b-2">
                                        <h2 className="text-ml font-bold text-gray-600">Nome</h2>
                                    </th>
                                    <th className="sm:px-4 sm:py-2 text-left border-b-2">
                                        <h2 className="text-ml font-bold text-gray-600">Valor</h2>
                                    </th>
                                    <th className="sm:px-4 sm:py-2 text-left border-b-2">
                                        <h2 className="text-ml font-bold text-gray-600">Estado</h2>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {Ordems.length > 0 ? (Ordems.map((item) =>
                                    <tr key={item.ORD_CODIGO} className="border-b">
                                        <td className="sm:px-4 sm:py-2 text-left">
                                            <div>
                                                <span className="text-xs">{item.ORD_CODIGO}</span>
                                            </div>
                                        </td>
                                        <td className="sm:px-4 sm:py-2 text-left">
                                            <div>
                                                <span className="text-xs">{item.ORD_DATA}</span>
                                            </div>
                                        </td>
                                        <td className="sm:px-4 sm:py-2 text-left">
                                            <div>
                                                <span className="text-xs">{item.ORD_SOLICITACAO}</span>
                                            </div>
                                        </td>
                                        <td className="sm:px-4 sm:py-2 text-left">
                                            <div>
                                                <span className="text-xs">{item.CLI_NOME}</span>
                                            </div>
                                        </td>
                                        <td className="sm:px-4 sm:py-2 text-left">
                                            <div>
                                                <span className="text-xs">{item.ORD_VALOR}</span>
                                            </div>
                                        </td>
                                        <td className="sm:px-4 sm:py-2 text-left">
                                            <div>
                                                <span className="text-xs">{item.ORD_ESTADO}</span>
                                            </div>
                                        </td>
                                    </tr>
                                )) : <h1>Aguarde, carregando dados...</h1>}
                            </tbody>
                        </table>
                    </div>

                }
            />
        </>
    )
}