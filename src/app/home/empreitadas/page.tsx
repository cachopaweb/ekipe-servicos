"use client"
import Modal from "@/app/components/modal";
import OperacaoEmpreitadas from "@/app/faturamentos/implementations/operacao_empreitadas";
import Faturamentos from "@/app/faturamentos/page";
import { GeraCodigo } from "@/app/functions/utils";
import CliForModel from "@/app/models/cli_for_model";
import EmpreitadasModel from "@/app/models/empreitadas_model";
import UnidadeMedidaModel from "@/app/models/unidade_med_model";
import PesquisaClienteFornecedor from "@/app/pesquisas/pesquisa_cli_for";
import EmpreitadasRepository from "@/app/repositories/empreitadas_repository";
import UnidadeMedidaRepository from "@/app/repositories/unidade_med_repository";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Swal from "sweetalert2";

interface empreitadasProps {
    showModalEmpreitadas: boolean;
    setShowModalEmpreitadas: Dispatch<SetStateAction<boolean>>
    codigoOrdem: number;
}

export default function Empreitadas({ codigoOrdem, showModalEmpreitadas, setShowModalEmpreitadas }: empreitadasProps) {
    const [listaEmpreitadas, setListaEmpreitadas] = useState<EmpreitadasModel[]>([]);
    const [listaServicosEmpreitadas, setListaServicosEmpreitadas] = useState<EmpreitadasServicosModel[]>([]);
    const [cliForSelecionado, setCliForSelecionado] = useState<CliForModel>({ CODIGO: 0, NOME: 'GENERICO' });
    const [showModalPesquisaCliFor, setShowModalPesquisaCliFor] = useState(false);
    const [showModalServicos, setShowModalServicos] = useState<boolean>(false);
    const [listaUnidadesMed, setListaUnidadesMed] = useState<UnidadeMedidaModel[]>([]) 
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

    useEffect(() => {
        if (codigoOrdem > 0) {
            buscaEmpreitadas();
        }
    }, []);

    useEffect(() => {
        if (cliForSelecionado.CODIGO > 0) {
            setListaEmpreitadas(old => [...old, { 
                EMP_CODIGO: 0, 
                EMP_ORD: codigoOrdem, 
                FOR_NOME: 
                cliForSelecionado!.NOME, 
                EMP_FOR: cliForSelecionado!.CODIGO, 
                LRC_FAT2: 0, 
                EMP_VALOR: 0,
            }])
        }
    }, [cliForSelecionado])

    const buscaEmpreitadas = async () => {
        try {
            const repository = new EmpreitadasRepository();
            const data = await repository.buscaEmpreitadas(codigoOrdem);
            setListaEmpreitadas([data]);
            buscaServicosEmpreitadas(data.EMP_CODIGO);
        } catch (error) {
            Swal.fire('Erro', 'Erro ao buscar empreitadas', 'error');
        }
    }

    const buscaServicosEmpreitadas = async (codEmpreitada: number) => {
        try {
            const repository = new EmpreitadasRepository();
            const data = await repository.buscaServicosEmpreitadas(codEmpreitada);
            setListaServicosEmpreitadas([...data])
        } catch (error) {
            Swal.fire('Erro', 'Erro ao buscar Servicos empreitadas', 'error');
        }
    }

    

    const ModalServicos = () => {   
        const [descricaoServico, setDescricaoServico] = useState<string>('');
        const [quantServico, setQuantServico] = useState(0);
        const [valorUnitarioServico, setValorUnitarioServico] = useState(0);
        const [valorServico, setValorServico] = useState(0);     
        const [unidadeMedServico, setUnidadeMedServico] = useState('');
    
        const salvarServicos = async () => {    
            Swal.fire('Serviço salvo com sucesso', '', 'success');    
            const servico = {
                ES_CODIGO: await GeraCodigo('EMPREITADAS_SERVICOS', 'ES_CODIGO'),
                DESCRICAO: descricaoServico,
                ES_EMP: 0,
                ES_PRAZO_CONCLUSAO: new Date(),
                ES_QUANTIDADE: quantServico,
                ES_UNIDADE: unidadeMedServico,
                VLR_UNIT: valorServico / quantServico,
                ES_VALOR: valorServico,
            };    
            setListaServicosEmpreitadas(old => [...old, servico])
            setShowModalServicos(false)
        }
    
        useEffect(() => {         
            if (!isNaN(quantServico) && !isNaN(valorUnitarioServico)){
                setValorServico(valorUnitarioServico * quantServico);
            }   
        }, [valorUnitarioServico, quantServico])

        return (
            <Modal showModal={showModalServicos} setShowModal={setShowModalServicos}
                title="Insere serviços empreitada"
                showButtonExit={false}
                body={
                    <div className="bg-white rounded-lg shadow-md my-4 h-3/4 w-full">
                        <div className="w-full p-2 sm:flex sm:justify-between">
                            <div>
                                <div className="sm:flex">
                                    <div className="flex flex-col p-1">
                                        <label htmlFor="descricao">Descrição</label>
                                        <input autoFocus placeholder="Informe a descrição" id="servicoDescricaoId" value={descricaoServico} onChange={(e) => setDescricaoServico(e.target.value)} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-56" type="text" />
                                    </div>
                                    <div className="flex flex-col p-1">
                                        <label htmlFor="fatura">Quant.</label>
                                        <input value={quantServico} onChange={e => setQuantServico(parseFloat(e.target.value))} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-36" type="text" />
                                    </div>
                                    <div className="flex flex-col p-2">
                                        <label htmlFor="unidade">UM</label>
                                        <select value={unidadeMedServico} onChange={(e) => setUnidadeMedServico(e.target.value)} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-36">
                                            {listaUnidadesMed.map(u => <option key={u.UM_UNIDADE} value={u.UM_UNIDADE}>{u.UM_UNIDADE}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-col p-1">
                                        <label htmlFor="fatura">Valor Unit.</label>
                                        <input value={valorUnitarioServico} onChange={e => setValorUnitarioServico(parseFloat(e.target.value))} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-36" type="text" />
                                    </div>
                                    <div className="flex flex-col p-1">
                                        <label htmlFor="fatura">Valor Total</label>
                                        <input value={valorServico} readOnly className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-36" type="text" />
                                    </div>
                                    <div className="flex flex-col p-1">
                                        <label htmlFor="fatura">Prazo Conclusão</label>
                                        <input className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-36" type="text" />
                                    </div>
                                </div>
                            </div>
                            <button
                                className="bg-green-500 text-white active:bg-green-600 font-bold uppercase p-1 text-sm px-2 mx-1 rounded shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150 flex-3"
                                type="button"
                                onClick={salvarServicos}
                            >
                                <i className="fa fa-solid fa-floppy-disk text-white p-2"></i>
                                Salvar
                            </button>
                        </div>
                    </div>
                }
            />
        );
    }

    const faturamentoEmpreitada = async ()=>{          
        if (listaEmpreitadas.length > 0){
            const empreitada = listaEmpreitadas.at(0)!;
            if(empreitada.LRC_FAT2! > 0){
                Swal.fire('Esta empreitada já foi faturada!')
                return;
            }
        }      
        if(listaServicosEmpreitadas.length > 0){
            const valor = listaServicosEmpreitadas.map(e=> e.ES_VALOR!).reduce((item1, item2)=> item1+item2);
            if (valor === 0){
                Swal.fire('Nenhum valor a faturar!')
                return;
            }
            //atualiza o valor
            listaEmpreitadas[0].EMP_VALOR = valor;
        }
       setShowFaturamento(true);
    }

    const BuidBody = () => {
        const [localExecucao, setLocalExecucao] = useState('');
        const [obsEmpreitadas, setObsEmpreitadas] = useState('');
    
        return (
            <div>
                <div>
                    <div className="shadow-md my-4">

                        <h2 className="text-md rounded-t-md font-bold text-black bg-amber-400 p-2">Prestadores</h2>
                        <table className="table-auto w-full">
                            <thead>
                                <tr>
                                    <th className="px-4 py-2 text-left border-b-2">
                                        <h2 className="text-ml font-bold text-gray-600">Prestador</h2>
                                    </th>
                                    <th className="px-4 py-2 text-left border-b-2">
                                        <h2 className="text-ml font-bold text-gray-600">Fatura</h2>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {listaEmpreitadas.map((item) =>
                                    <tr className="border-b w-full">
                                        <td className="px-4 py-2 text-left">
                                            <div>
                                                <h2>{item.FOR_NOME}</h2>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-left">
                                            <div>
                                                <h2>{item.LRC_FAT2}</h2>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <div className="flex items-end justify-end p-2 relative">
                            <button
                                onClick={e => setShowModalPesquisaCliFor(true)}
                                className="p-0 w-12 h-12 bg-black rounded-full hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none">
                                <svg viewBox="0 0 20 20" enable-background="new 0 0 20 20" className="w-6 h-6 inline-block">
                                    <path fill="#FFFFFF" d="M16,10c0,0.553-0.048,1-0.601,1H11v4.399C11,15.951,10.553,16,10,16c-0.553,0-1-0.049-1-0.601V11H4.601
                                        C4.049,11,4,10.553,4,10c0-0.553,0.049-1,0.601-1H9V4.601C9,4.048,9.447,4,10,4c0.553,0,1,0.048,1,0.601V9h4.399
                                        C15.952,9,16,9.447,16,10z"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="shadow-md my-4">
                        <h2 className="text-md rounded-t-md font-bold text-black bg-amber-400 p-2">Serviços</h2>
                        <table className="table-auto w-full">
                            <thead>
                                <tr>
                                    <th className="px-4 py-2 text-left border-b-2">
                                        <h2 className="text-ml font-bold text-gray-600">Descrição</h2>
                                    </th>
                                    <th className="px-4 py-2 text-left border-b-2">
                                        <h2 className="text-ml font-bold text-gray-600">Quant</h2>
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
                                        <h2 className="text-ml font-bold text-gray-600">Prazo Conclusão</h2>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {listaServicosEmpreitadas.map((item) =>
                                    <tr key={item.ES_CODIGO} className="border-b w-full">
                                        <td className="px-4 py-2 text-left">
                                            <div>
                                                <h2>{item.DESCRICAO}</h2>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-left">
                                            <div>
                                                <h2>{item.ES_QUANTIDADE}</h2>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-left">
                                            <div>
                                                <h2>{item.ES_UNIDADE}</h2>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-left">
                                            <div>
                                                <h2>{item.VLR_UNIT}</h2>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-left">
                                            <div>
                                                <h2>{item.ES_VALOR}</h2>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-left">
                                            <div>
                                                <h2>{item.ES_PRAZO_CONCLUSAO != null ? item.ES_PRAZO_CONCLUSAO?.toLocaleDateString() : ''}</h2>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <div className="flex items-end justify-end p-2 relative">
                            <button
                                onClick={e => setShowModalServicos(true)}
                                className="p-0 w-12 h-12 bg-black rounded-full hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none">
                                <svg viewBox="0 0 20 20" enable-background="new 0 0 20 20" className="w-6 h-6 inline-block">
                                    <path fill="#FFFFFF" d="M16,10c0,0.553-0.048,1-0.601,1H11v4.399C11,15.951,10.553,16,10,16c-0.553,0-1-0.049-1-0.601V11H4.601
                                            C4.049,11,4,10.553,4,10c0-0.553,0.049-1,0.601-1H9V4.601C9,4.048,9.447,4,10,4c0.553,0,1,0.048,1,0.601V9h4.399
                                            C15.952,9,16,9.447,16,10z"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="w-full">
                        <div className="flex flex-col p-1">
                            <label htmlFor="localExecucao">Local Execução</label>
                            <textarea value={localExecucao} onChange={e => setLocalExecucao(e.target.value)} id="localExecucaoid" className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 h-10" />
                        </div>
                        <div className="flex flex-col p-1">
                            <label htmlFor="obsEmpreitadas">Observações</label>
                            <textarea value={obsEmpreitadas} onChange={e => setObsEmpreitadas(e.target.value)} id="obsEmpreitadasid" className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 h-10" />
                        </div>
                    </div>
                </div>
                {showModalPesquisaCliFor &&
                    <PesquisaClienteFornecedor
                        cliForSelecionado={cliForSelecionado!}
                        setCliForSelecionado={setCliForSelecionado}
                        showModal={showModalPesquisaCliFor}
                        setShowModal={setShowModalPesquisaCliFor}
                    />}
                {
                    showModalServicos && <ModalServicos />
                }
                <div className="flex gap-2 p-2">
                    <button onClick={faturamentoEmpreitada} className="p-0 w-32 h-12 text-white text-bold bg-black rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none">Faturar</button>
                    <button className="p-0 w-32 h-12 text-white text-bold bg-black rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none">Imprimir</button>
                </div>
                {showFaturamento && <Modal
                    title="Faturamento Empreitadas"
                    showModal={showFaturamento}
                    setShowModal={setShowFaturamento}
                    body={<Faturamentos 
                        Operacao={new OperacaoEmpreitadas()}
                        pedFat={{
                            PF_CODIGO: 0,
                            PF_COD_CLI: cliForSelecionado.CODIGO,
                            PF_CAMPO_DATAC: 'EMP_DATAC',
                            PF_CAMPO_FAT: 'EMP_FAT',
                            PF_CAMPO_PED: 'EMP_CODIGO',
                            PF_CLIENTE: cliForSelecionado.NOME,
                            PF_COD_PED: codigoOrdem,
                            PF_DATA: new Date().toLocaleDateString(),
                            PF_DATAC: '01/01/1900',
                            PF_DESCONTO: 0,
                            PF_FAT: 0,
                            PF_FUN: 1,
                            PF_PARCELAS: 1,
                            PF_TABELA: 'EMPREITADAS',
                            PF_TIPO: 2,
                            PF_VALOR: 0,
                            PF_VALORB: 0,
                            PF_VALORPG: 0,                        
                        }}
                        model={listaEmpreitadas}
                        itens={listaServicosEmpreitadas}
                        cliFor={cliForSelecionado}
                        setShowModal={setShowFaturamento}
                        valorTotal={listaServicosEmpreitadas.length > 0 ? listaServicosEmpreitadas.map(e=> e.ES_VALOR!).reduce((item1, item2)=> item1+item2) : 0} />}
                />}
            </div>
        );
    }

    return (
        <Modal showModal={showModalEmpreitadas} setShowModal={setShowModalEmpreitadas}
            title="Empreitadas"
            showButtonExit={false}
            body={
                <BuidBody />
            }
        />
    );
}