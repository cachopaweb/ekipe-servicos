import EmpreitadasServicosModel from "@/app/models/empreitada_servicos_model";
import EmpreitadasModel from "@/app/models/empreitadas_model";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input"
import { GeraCodigo, keyBoardInputEvent, mascaraMoeda, mascaraMoedaEvent, maskRealToNumber, toastMixin } from "@/app/functions/utils";
import Modal from "@/components/component/modal";
import UnidadeMedidaModel from "@/app/models/unidade_med_model";
import { useMask } from "@react-input/mask";
import UnidadeMedidaRepository from "@/app/repositories/unidade_med_repository";
import Faturamentos from "@/app/faturamentos/page";
import OperacaoEmpreitadas from "@/app/faturamentos/implementations/operacao_empreitadas";
import OrdemModel from "@/app/models/ordem_model";
import CliForModel from "@/app/models/cli_for_model";
import { useAppData } from "@/app/contexts/app_context";
import PrintEmpreitadas from "@/app/print/empreitadas/page";
import EmpreitadasRepository from "@/app/repositories/empreitadas_repository";
interface empreitadaProps {
    empreitadaSelecionada: EmpreitadasModel | undefined;
    setEmpreitadaSelecionada: Dispatch<SetStateAction<EmpreitadasModel | undefined>>;
    ordem: OrdemModel;
    fornecedor: CliForModel;
    showModal: boolean;
    setShowModal: Dispatch<SetStateAction<boolean>>;

}


export default function EmpreitadaModal({empreitadaSelecionada, setEmpreitadaSelecionada, ordem, fornecedor, showModal, setShowModal}: empreitadaProps) {
    const refDivServicos = useRef<HTMLDivElement>(null);
    const [empreitadaServicoEdt, setEmpreitadaServicoEdt] = useState<EmpreitadasServicosModel>({ DESCRICAO : '', ES_CODIGO : 0, ES_EMP : 0, })
    const [divWidthServicos, setDivWidthServicos] = useState<number>(0);
    const [showModalServicos, setShowModalServicos] = useState<boolean>(false);
    const [showModalEdtServicoEmpreitada, setShowModalEdtServicoEmpreitada] = useState(false);
    const [listaUnidadesMed, setListaUnidadesMed] = useState<UnidadeMedidaModel[]>([])
    const inputDataRef = useMask({ mask: '__/__/____', replacement: { _: /\d/ } });
    const [showFaturamento, setShowFaturamento] = useState(false);
    const [foiFaturado, setFoiFaturado] = useState(false);
    const [showModalImprimirEmpreitadas, setShowModalImprimirEmpreitadas] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [empreitada, setEmpreitada] = useState<EmpreitadasModel | undefined>(empreitadaSelecionada);
    const textAreaRefLocal = useRef(null);

    useEffect(() => {
        setDivWidthServicos(refDivServicos.current ? refDivServicos.current.offsetWidth : 0);
    }, [refDivServicos.current]);
    
    


    useEffect(() => {
        carregaDados();
    }, [])

     function carregaDados(){
        if(carregando)
            {
            setEmpreitada(empreitadaSelecionada)
            carregaUnidadesMed();
            buscaServicosBanco();
            setCarregando(false);
            }

    }

            
    const ModalImprimir = () => {

        useEffect(() =>{
        },[])

        return (
            <Modal showModal={showModalImprimirEmpreitadas} setShowModal={setShowModalImprimirEmpreitadas}
                title={foiFaturado ? "Impressão de Ordem de Serviço" : "Impressão de Orçamento"}
                showButtonExit={false}
                body={
                    <PrintEmpreitadas 
                    EmpreitadaCtx={empreitada?empreitada: {EMP_CODIGO:0, EMP_FOR:0, EMP_ORD:0,EMP_VALOR:0,FOR_NOME:'',ITENS:[]}} />
                }
            />
        );
    }


    const editaServico = (servico: EmpreitadasServicosModel) => {
        setEmpreitadaServicoEdt(servico);
        setShowModalEdtServicoEmpreitada(true);
    }


    async function buscaServicosBanco()
    {
        if(empreitada && empreitadaSelecionada && empreitadaSelecionada.EMP_FAT)
        {
            const repository = new EmpreitadasRepository();
            const lista =  await repository.buscaServicosEmpreitadas(empreitadaSelecionada.EMP_CODIGO);
            setEmpreitada({...empreitada, ITENS:lista})
        }
    }

    function estaFaturada()
    {
        if(empreitada!= undefined)
        {
            if(empreitada.EMP_FAT != undefined)
            {
                return true;
            }
        }
        return false
    }
    
    const excluirServico = (indiceServico: number) => {
        const lista = Array.from(empreitada?empreitada.ITENS!:[]);
        lista.splice(indiceServico, 1);
        empreitada ? setEmpreitada({...empreitada, ITENS:lista}): null;
    }


    const carregaUnidadesMed = async () => {
        try {
            const repository = new UnidadeMedidaRepository();
            const unidades = await repository.getUnidadeMedidas();
            setListaUnidadesMed(unidades);
        } catch (error) {
            toastMixin.fire('Erro', String(error), 'error')
        }
    }

    function imprimeEmpreitada() {
        if (empreitada) {

            setShowModalImprimirEmpreitadas(true);
        }
    }



    function imprimePrazoConclusao(prazoConclusao:string){
        if(prazoConclusao.includes('/'))
        {
            return prazoConclusao;
        }
        return new Date(prazoConclusao).toLocaleDateString();
    }



    const faturamentoEmpreitada = async () => {
        if (empreitada!=undefined) {
            const elementlocal = document.getElementById("localExecucaoid") as HTMLInputElement;
            const localExecucao =  elementlocal?.value;
            const elementobs = document.getElementById("obsEmpreitadasid") as HTMLInputElement;
            const obs =  elementobs?.value;
            setEmpreitada({...empreitada, EMP_OBS: obs, EMP_LOCAL_EXECUCAO_SERVICOS: localExecucao, EMP_ORD:ordem.ORD_CODIGO});

            if (empreitada.LRC_FAT2! > 0) {
                toastMixin.fire('Esta empreitada já foi faturada!', 'Atenção', 'info')
                return;
            }
            if (empreitada.ITENS.length > 0) {
                const valor = empreitada.ITENS.map(e => e.ES_VALOR!).reduce((item1, item2) => item1 + item2);
                if (valor === 0) {
                    toastMixin.fire('Nenhum valor a faturar!')
                    return;
                }
                //atualiza o valor
                empreitada.EMP_VALOR = valor;
            }
            setShowFaturamento(true);
        }
        
    }

    const ModalEdtEmpreitada = () => {

        const titulo = "Editar Serviço ";
        const [descricao, setDescricao] = useState(empreitadaServicoEdt.DESCRICAO);
        const [osQuantidade, setOsQuantidade] = useState(empreitadaServicoEdt.ES_QUANTIDADE);
        const [osUnidadeMedida, setOsUnidadeMedida] = useState(empreitadaServicoEdt.ES_UNIDADE);
        const [osValorUnit, setOsValorUnit] = useState(empreitadaServicoEdt.VLR_UNIT);
        const [valorTotal, setValorTotal] = useState(empreitadaServicoEdt.ES_VALOR);
        const [prazo, setPrazo] = useState(empreitadaServicoEdt.ES_PRAZO_CONCLUSAO);
        const [osValorStr, setOsValorStr] = useState(mascaraMoeda(empreitadaServicoEdt.VLR_UNIT??0));

        const salvar = () =>
        {
            var lista = empreitada != undefined ? empreitada.ITENS : [];
            let indice = lista.findIndex(e => e.ES_CODIGO === empreitadaServicoEdt.ES_CODIGO);

            
            var valor = maskRealToNumber(osValorStr);
            var servico:EmpreitadasServicosModel = {
                ES_CODIGO: empreitadaServicoEdt.ES_CODIGO,
                DESCRICAO: descricao,
                ES_EMP: empreitadaServicoEdt.ES_EMP,
                ES_QUANTIDADE: osQuantidade,
                ES_UNIDADE : osUnidadeMedida,
                ES_PRAZO_CONCLUSAO: prazo,
                ES_VALOR : valor * (osQuantidade??1),
                VLR_UNIT: valor
                
            };
            lista.splice(indice, 1);
            lista.push(servico);
            lista.sort(function(a,b){
                return a.ES_CODIGO < b.ES_CODIGO ? -1 : a.ES_CODIGO > b.ES_CODIGO ? 1 : 0;
            })


            empreitada != undefined ? empreitada.ITENS = lista : null;
            if(empreitada)
            {
                setEmpreitada({...empreitada})
            }
           
            toastMixin.fire('Serviço salvo com sucesso', '', 'success');
            setShowModalEdtServicoEmpreitada(false);

        }


        return (
            <Modal showModal={showModalEdtServicoEmpreitada} setShowModal={setShowModalEdtServicoEmpreitada}
                title={titulo}
                showButtonExit={false}
                body={
                    <div className="grid grid-rows divide-y w-[500px]">
                        <div className="grid grid-rows">
                            <span className="mt-2">Descrição: </span>
                            <input value={descricao} onChange={(e) => setDescricao(e.target.value.toUpperCase())} className="sm:w-full uppercase p-1 border rounded-md mb-2 border-spacing-1 border-amber-400" type="text">
                            </input>
                        </div>
                        <div className="grid grid-rows">
                            <span className="mt-2">Quantidade </span>
                            <input value={osQuantidade} step={1} onChange={event => {setOsQuantidade(Number(event.target.value))}} className="sm:w-24 p-1 border rounded-md mb-2 border-spacing-1 border-amber-400" type="number">
                            </input>
                        </div>
                        <div className="grid grid-rows mb-3">
                            <span className="mt-2">Unidade de Medida: </span>
                            <select value={osUnidadeMedida} onChange={(e) => setOsUnidadeMedida(e.target.value.toUpperCase())} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-20">
                                {listaUnidadesMed.map(u => <option key={u.UM_UNIDADE} value={u.UM_UNIDADE}>{u.UM_UNIDADE}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-rows mb-3">
                            <span className="mt-2">Valor Unitário </span>
                            <input id="valorOs" type="text" value={osValorStr} onChange={event => { mascaraMoedaEvent(event), setOsValorStr(event.target.value) }} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-24">
                            </input>
                        </div>

                        <div className="grid grid-rows mb-3">
                            <span className="mt-2">Prazo de Conclusão </span>
                             <Input ref={inputDataRef}  id="valorOs" type="text" value={prazo} onChange={event => setPrazo(event.target.value) } className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-24"/>
                        </div>

                        <div className="grid grid-cols-2">
                            <button
                                className="bg-red-500 text-white active:bg-red-600 font-bold uppercase p-1 mb-2 text-sm px-2 mx-1 rounded shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150 flex-3"
                                type="button"
                                onClick={() => setShowModalEdtServicoEmpreitada(false)}
                            >
                                <i className="fa fa-solid fa-ban text-white p-2"></i>
                                Cancelar
                            </button>
                            <button
                                className="bg-green-500 text-white active:bg-red-600 font-bold uppercase p-1 mb-2 text-sm px-2 mx-1 rounded shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150 flex-3"
                                type="button"
                                onClick={() => salvar() }
                            >
                                <i className="fa fa-solid fa-floppy-disk text-white p-2"></i>
                                Salvar
                            </button>

                        </div>
                    </div>
                }
            />);

    }

    const ModalServicos = () => {
        const [descricaoServico, setDescricaoServico] = useState<string>('');
        const [quantServico, setQuantServico] = useState(0);
        const [valorUnitarioServico, setValorUnitarioServico] = useState(0);
        const [valorServico, setValorServico] = useState(0);
        const [unidadeMedServico, setUnidadeMedServico] = useState('');

        const salvarServicos = async () => {
            toastMixin.fire('Serviço salvo com sucesso', '', 'success');
            const servico = {
                ES_CODIGO: await GeraCodigo('EMPREITADAS_SERVICOS', 'ES_CODIGO'),
                DESCRICAO: descricaoServico,
                ES_EMP: 0,
                ES_PRAZO_CONCLUSAO: new Date().toLocaleDateString(),
                ES_QUANTIDADE: quantServico,
                ES_UNIDADE: unidadeMedServico,
                VLR_UNIT: valorServico / quantServico,
                ES_VALOR: valorServico,
            };
            empreitada != undefined ? empreitada.ITENS.push(servico) : null;
            setShowModalServicos(false)
        }

        useEffect(() => {
            if (!isNaN(quantServico) && !isNaN(valorUnitarioServico)) {
                setValorServico(valorUnitarioServico * quantServico);
            }
        }, [valorUnitarioServico, quantServico])

        return (
            <div>
                <Modal showModal={showModalServicos} 
                setShowModal={setShowModalServicos}
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
                                            <Input ref={inputDataRef} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 sm:w-36" type="text" />
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
            </div>
        );
    }


    function ObservacaoLocalExecucao() {

        const [local, setLocal] = useState(empreitada?.EMP_LOCAL_EXECUCAO_SERVICOS);
        const [obs, setObs] = useState(empreitada?.EMP_OBS);



        return <div className="w-full">
            <div className="flex flex-row w-full">
                <div className="flex flex-col p-1 w-full">
                    <label htmlFor="localExecucao">Local Execução</label>
                    <input  id="localExecucaoid" onBlur={e => empreitada?setEmpreitada({...empreitada,  EMP_LOCAL_EXECUCAO_SERVICOS: e.target.value.toUpperCase()}):setEmpreitada(empreitada)}
                     value={local} onChange={e => setLocal(e.target.value.toUpperCase())} ref={textAreaRefLocal} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 h-10" />
                </div>
            </div>
            <div className="flex flex-row w-full">
                <div className="flex flex-col p-1 w-full">
                    <label htmlFor="obsEmpreitadas">Observações</label>
                    <input id="obsEmpreitadasid" onBlur={e => empreitada?setEmpreitada({...empreitada,  EMP_OBS: e.target.value.toUpperCase()}):setEmpreitada(empreitada)}
                    value={obs} onChange={e => setObs(e.target.value.toLocaleUpperCase())} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 h-10" />
                </div>
            </div>
        </div>;
    }


    return (
        <Modal
        setShowModal={setShowModal}
        showModal={showModal}
        title={empreitada? empreitada.FOR_NOME: 'n'}

        body={carregando ? <>carregando</> : 
            <div className=" h-96 w-[80rem] overflow-scroll">
            <div className="shadow-md my-4">
            <h2 className="text-md rounded-t-md font-bold text-black bg-amber-400 p-2">Serviços</h2>
            <div ref={refDivServicos} className="flex items-center justify-center">
                <table className="w-full flex sm:flex-col flex-nowrap sm:bg-white rounded-lg overflow-hidden sm:shadow-lg my-5">
                    <thead className="text-white">
                        {divWidthServicos > 600 ? (
                            <tr className="bg-amber-400 flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0">
                                <th className="p-3 text-left w-full">Descrição</th>
                                <th className="p-3 text-left">Quant</th>
                                <th className="p-3 text-left">UM</th>
                                <th className="p-3 text-left">Valor Unit.</th>
                                <th className="p-3 text-left">Valor Total</th>
                                <th className="p-3 text-left">Prazo Conclusão</th>
                                <th className="p-3 text-left">Ação</th>
                            </tr>)
                            : empreitada != undefined && empreitada.ITENS  && empreitada.ITENS.map(item =>
                                <tr key={item.ES_CODIGO} className="bg-amber-400 flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0">
                                    <th className="p-3 text-left">Descrição</th>
                                    <th className="p-3 text-left">Quant</th>
                                    <th className="p-3 text-left">UM</th>
                                    <th className="p-3 text-left">Valor Unit.</th>
                                    <th className="p-3 text-left">Valor Total</th>
                                    <th className="p-3 text-left">Prazo Conclusão</th>
                                    <th className="p-3 text-left">Ação</th>
                                </tr>)
                        }
                    </thead>
                    <tbody className="flex-1 sm:flex-none">
                        {
                            (empreitada != undefined && empreitada.ITENS != undefined) ? empreitada.ITENS.map((item, index) =>
                                <tr key={item.ES_CODIGO} className="flex flex-col flex-nowrap sm:table-row mb-2 sm:mb-0">
                                    <td className="border-grey-light border hover:bg-gray-100 p-3 sm:w-full">{item.DESCRICAO}</td>
                                    <td className="border-grey-light border hover:bg-gray-100 p-3">{item.ES_QUANTIDADE}</td>
                                    <td className="border-grey-light border hover:bg-gray-100 p-3">{item.ES_UNIDADE}</td>
                                    <td className="border-grey-light border hover:bg-gray-100 p-3">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(item.VLR_UNIT ?? 0 / (item.ES_QUANTIDADE ?? 1))}</td>
                                    <td className="border-grey-light border hover:bg-gray-100 p-3">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(item.ES_VALOR ?? 0)}</td>
                                    <td className="border-grey-light border hover:bg-gray-100 p-3">{item.ES_PRAZO_CONCLUSAO != null ? imprimePrazoConclusao(item.ES_PRAZO_CONCLUSAO!) : ''}</td>
                                    <td className="border-grey-light border hover:bg-gray-100 p-1 sm:p-3 text-red-400 hover:text-red-600 hover:font-medium cursor-pointer">
                                        <button
                                            className="p-1 text-sm px-2 mx-1 bg-black text-white rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none"
                                            type="button"
                                            onClick={() => editaServico(item)}
                                        >
                                            <i className="fas fa-pen text-white "></i>
                                        </button>
                                        <button
                                            className="p-1 text-sm px-2 mx-1 bg-black text-white rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none"
                                            type="button"
                                            onClick={() => excluirServico(index)}
                                        >
                                            <i className="fas fa-trash text-white "></i>
                                        </button>
                                    </td>
                                </tr>
                            ) : <></>
                        }
                    </tbody>
                </table>
            </div>
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
            <div className="flex gap-2 p-2">
                <button onClick={faturamentoEmpreitada} 
                disabled ={estaFaturada()}
                className="p-0 w-32 h-12 text-white text-bold bg-black rounded-md disabled:cursor-not-allowed hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none">
                    Faturar</button>
                <button className="p-0 w-32 h-12 text-white text-bold disabled:cursor-not-allowed bg-black rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none"
                    disabled ={!estaFaturada()}
                    onClick={imprimeEmpreitada}
                >Imprimir</button>
            </div>
        </div>

        {showFaturamento && <Modal
                title="Faturamento Empreitadas"
                showModal={showFaturamento}
                setShowModal={setShowFaturamento}
                body={<Faturamentos
                    tipoRecPag="P"
                    Operacao={new OperacaoEmpreitadas()}
                    pedFat={{
                        PF_CODIGO: 0,
                        PF_COD_CLI: empreitada?.FORNECEDOR!.CODIGO??0,
                        PF_CAMPO_DATAC: 'EMP_DATAC',
                        PF_CAMPO_FAT: 'EMP_FAT',
                        PF_CAMPO_PED: 'EMP_CODIGO',
                        PF_CLIENTE: empreitada?.FORNECEDOR!.NOME ??'',
                        PF_COD_PED: ordem.ORD_CODIGO,
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
                    model={empreitada!}
                    itens={empreitada? empreitada.ITENS:[]}
                    cliFor={fornecedor}
                    setShowModal={setShowFaturamento}
                    setFaturado={setFoiFaturado}
                    valorTotal={empreitada && empreitada.ITENS.length > 0 ? empreitada.ITENS.map(e => e.ES_VALOR!).reduce((item1, item2) => item1 + item2) : 0} />}
            />}
            { showModalServicos && <ModalServicos />} 
            {showModalEdtServicoEmpreitada && <ModalEdtEmpreitada/>}
            {showModalImprimirEmpreitadas && <ModalImprimir />}
        { <ObservacaoLocalExecucao /> }
        </div>}
        />
    )

}