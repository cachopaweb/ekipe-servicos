"use client"
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Modal from "../../components/component/modal";
import Swal from "sweetalert2";
import ClientRepository from "../repositories/fornecedor_repository";
import { Cadastro_clientes } from "@/components/component/cadastro_clientes";
import { FornecedorModel } from "../models/fornecedor_model";
import FornecedorRepository from "../repositories/fornecedor_repository";
import { Cadastro_fornecedores } from "@/components/component/cadastro_fornecedores";
//import { Mapa } from "@/app/mapa";
import dynamic from "next/dynamic";
import { ClienteModel } from "../models/cliente_model";
import { Input } from "@/components/ui/input"
import CidadeModel from "../models/cidade_model";
import CidadeRepository from "../repositories/cidade_repository";


const Mapa = dynamic(() => import("../mapa/index").then((mod) => mod.Mapa), { ssr: false });

type pesquisaFornecedorParams = {
    showModal: boolean;
    setShowModal: Dispatch<SetStateAction<boolean>>;
    fornecedorSelecionado: FornecedorModel;
    setFornecedorSelecionado: Dispatch<SetStateAction<FornecedorModel>>;
}

export default function PesquisaFornecedor({ showModal, setShowModal, setFornecedorSelecionado }: pesquisaFornecedorParams) {
    const [textoPesquisado, setTextoPesquisado] = useState('');
    const [fornecedores, setFornecedores] = useState<FornecedorModel[]>([]);
    const [visualizarMapa, setVisualizarMapa] = useState(false);
    const [cadastrarFornecedor, setCadastrarFornecedor] = useState(false);
    const [idCadastraFornecedor, setIdCadastraFornecedor] = useState(0);
    const [filtro, setFiltro] = useState("nome");
    const [queryCity, setQueryCity] = useState('');
    const [loadingCity, setLoadingCity] = useState(false);
    const [optionsCity, setOptionsCity] = useState<Array<CidadeModel>>([]);
    const [codigoCidade, setCodigoCidade] = useState(0);

    useEffect(() => {
        buscarFornecedor();
    }, [textoPesquisado])

        useEffect(() => {
        buscarFornecedorCidade();
    }, [codigoCidade])

    useEffect(() => {
        setQueryCity('');
        setCodigoCidade(0);
    }, [filtro]);

    const cadastrarNovoFornecedor = () => {
        setIdCadastraFornecedor(0);
        setCadastrarFornecedor(true);
    }


    function escolheCidade(cidade: CidadeModel) {
        setQueryCity(cidade.DESCRICAO ? cidade.DESCRICAO : '');
        setCodigoCidade(cidade.CID_CODIGO);
    }

    async function buscaCidades() {
        if (queryCity.length >= 3) {
            setLoadingCity(true);

            const repo = new CidadeRepository();

            const options = await repo.getBuscaCidades(queryCity);
            setOptionsCity(options);
            setLoadingCity(false);
        }

    }
    useEffect(() => {
        buscaCidades();
    }, [queryCity]);


    const visualizarMap = () => {
        setVisualizarMapa(true);

    }

        const buscarFornecedorCidade = async () => {
        try {
            const repository = new FornecedorRepository();

            const listaFornecedores = await repository.getFornecedoresPorCidade(codigoCidade);
            setFornecedores(listaFornecedores);

        } catch (error) {
            Swal.fire('Erro', String(error), 'error');
        }
    }

    const buscarFornecedor = async () => {
        try {
            const repository = new FornecedorRepository();
            if (filtro === "nome") {
                const listaFornecedores = await repository.getFornecedoresPorNome(textoPesquisado);
                setFornecedores(listaFornecedores);

            } else if (filtro === "observacoes") {
                const listaFornecedores = await repository.getFornecedoresPorObs(textoPesquisado);
                setFornecedores(listaFornecedores);
            } else if (filtro === "fantasia") {
                const listaFornecedores = await repository.getFornecedoresPorNomeFantasia(textoPesquisado);
                setFornecedores(listaFornecedores);
            }
        } catch (error) {
            Swal.fire('Erro', String(error), 'error');
        }
    }

    const visualizarFornecedor = (model: FornecedorModel) => {
        setIdCadastraFornecedor(model.CODIGO);
        setCadastrarFornecedor(true);
    }
    const selecionarFornecedor = (model: FornecedorModel) => {
        setFornecedorSelecionado(model);
        setShowModal(false);
    }

    return (
        <>
            <Modal
                showModal={showModal}
                setShowModal={setShowModal}
                title="Pesquisa Fornecedor"
                edtSearch={
                    <div className="flex flex-row">

                        <div className="self-start">

                            <div className="justify-self-start flex flex-row gap-1 border-2 border-solid border-gray-500 rounded-md p-2">
                                <label className="flex items-center gap-1">
                                    <input
                                        type="radio"
                                        name="filtro"
                                        value="nome"
                                        checked={filtro === "nome"}
                                        onChange={() => setFiltro("nome")}
                                    />
                                    Nome
                                </label>
                                <label className="flex items-center gap-1">
                                    <input
                                        type="radio"
                                        name="filtro"
                                        value="fantasia"
                                        checked={filtro === "fantasia"}
                                        onChange={() => setFiltro("fantasia")}
                                    />
                                    Nome Fantasia
                                </label>
                                <label className="flex items-center gap-1">
                                    <input
                                        type="radio"
                                        name="filtro"
                                        value="cidade"
                                        checked={filtro === "cidade"}
                                        onChange={() => setFiltro("cidade")}
                                    />
                                    Cidade
                                </label>
                                <label className="flex items-center gap-1">
                                    <input
                                        type="radio"
                                        name="filtro"
                                        value="observacoes"
                                        checked={filtro === "observacoes"}
                                        onChange={() => setFiltro("observacoes")}
                                    />
                                    Observações
                                </label>
                            </div>

                        </div>
                        {filtro === "cidade" ?
                            <div className="relative" >
                                <input className="border rounded-md border-spacing-1 border-amber-400 sm:w-96 sm:p-2 mx-4 uppercase"
                                    type="text"
                                    value={queryCity}

                                    onChange={e => setQueryCity(e.target.value)}
                                    placeholder="Search..."
                                />
                                {loadingCity && <div>Loading...</div>}
                                <ul className="overflow-y-scroll max-h-10" >
                                    {
                                        optionsCity.map((option, index) => (
                                            <li className="cursor-pointer" onClick={e => escolheCidade(option)} key={option.CID_CODIGO}>{option.DESCRICAO}</li>
                                        ))}
                                </ul>
                            </div>
                            : <input className="border rounded-md border-spacing-1 border-amber-400 sm:w-96 sm:p-2 mx-4" type="text" placeholder="Pesquisar" value={textoPesquisado} onChange={(e) => setTextoPesquisado(e.target.value)} />
                        }

                    </div>
                }
                body={
                    <div className=" flex flex-col overflow-scroll h-96">
                        <div className="flex flex-row-reverse">
                            <button onClick={() => cadastrarNovoFornecedor()} className="bg-green-700 p-2 ml-4 text-xs font-bold disabled:cursor-not-allowed rounded-xl shadow-sm text-white">Cadastrar Fornecedor</button>
                            <button onClick={() => visualizarMap()} className="bg-green-700 p-2 text-xs font-bold disabled:cursor-not-allowed rounded-xl shadow-sm text-white">Visualizar Mapa</button>
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
                                                <button onClick={() => visualizarFornecedor(item)} className="bg-green-700 p-2 text-xs rounded-xl shadow-sm text-white">Visualizar</button>
                                            </div>
                                        </td>
                                        <td className="sm:px-4 sm:py-2 text-left">
                                            <div>
                                                <button onClick={() => selecionarFornecedor(item)} className="bg-green-700 p-2 text-xs rounded-xl shadow-sm text-white">Escolher</button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : <h1>Aguarde, carregando dados...</h1>}
                            </tbody>
                        </table>
                    </div>
                }
            />
            {visualizarMapa && <Modal showModal={visualizarMapa} setShowModal={setVisualizarMapa} title="Mapa" body={<Mapa />} />}
            {cadastrarFornecedor && <Modal showModal={cadastrarFornecedor} setShowModal={setCadastrarFornecedor} title="Cadastro Fornecedor" body={<Cadastro_fornecedores setListarFornecedor={setShowModal} setCadastraFornecedor={setCadastrarFornecedor} id={idCadastraFornecedor} />} />}
        </>
    )
}