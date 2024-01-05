"use client"
import Image from 'next/image'
import { useReactToPrint } from 'react-to-print';

import logo from '../../../../assets/logo.png'
import { useAppData } from '@/app/contexts/app_context';
import { useEffect, useRef, useState } from 'react';
import { converterDataFormato, formatCurrency, toastMixin } from '../../functions/utils'

const PrintEmpreitadas = () => {
    const componentRef = useRef<HTMLDivElement>(null);

    const { EmpreitadaCtx } = useAppData()
    const [somaItens, setSomaItens] = useState(0);
    const [carregando, setCarregando] = useState(true);
    const [titulo, setTitulo] = useState('Orçamento');

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
    });

    useEffect(() => {
        setCarregando(true);
        var soma = 0;
        EmpreitadaCtx.ITENS.forEach((item) => {
            if (item.ES_VALOR && item.ES_QUANTIDADE) {
                soma = item.ES_VALOR * item.ES_QUANTIDADE;
            }

        })
        setSomaItens(soma);
        toastMixin.fire({
            title: 'Aperte no botão a baixo imprimir!'
        });
        setCarregando(false);
    }, [])

    return (
        carregando ?
            <h1>Aguarde, carregando dados...</h1>
            :
            <div className='p-6 relative' ref={componentRef}>
                <div>
                    <Image className='p-10' src={logo} height={80} alt="Logo" />
                    <div className='divide-solid divide-y divide-black'>
                        <h1 className='text-center text-2xl font-bold'>{titulo}</h1>
                        <div className='box-border border'>
                            <div className='grid grid-cols-2'>
                                <div className='grid grid-rows-2'>
                                    <div className='grid grid-cols-2 '>
                                        <h1 className='font-bold my-0 text-sm'>Empresa/Parceiro</h1>
                                    </div>
                                    <div className='grid grid-cols-2'>
                                        <span className='truncate text-xs'>{EmpreitadaCtx!.FORNECEDOR!.NOME}</span>
                                    </div>
                                </div>
                                <div className='grid grid-rows-2'>
                                    <div className='grid grid-cols-2'>
                                        <h1 className='font-bold my-0 text-sm'>CNPJ/CPF</h1>
                                        <h1 className='font-bold my-0 text-sm'>Nº Controle</h1>
                                    </div>
                                    <div className='grid grid-cols-2'>
                                        <span className='truncate text-xs'>{EmpreitadaCtx!.FORNECEDOR!.CPF_CNPJ}</span>
                                        <span className='truncate text-xs'>{EmpreitadaCtx!.FORNECEDOR!.CODIGO}</span>
                                    </div>
                                </div>
                            </div>
                            <div className='grid grid-cols-3'>
                                <div className='grid grid-rows-2'>
                                    <h1 className='font-bold my-0 text-sm'>Razão Social</h1>
                                    <span className='truncate text-xs'>{EmpreitadaCtx!.FORNECEDOR!.RAZAO_SOCIAL}</span>
                                </div>
                                <div className='grid grid-rows-2'>
                                    <h1 className='font-bold my-0 text-sm'>Telefone</h1>
                                    <span className='truncate text-xs'>{EmpreitadaCtx!.FORNECEDOR!.FONE}</span>
                                </div>
                                <div className='grid grid-rows-2'>
                                    <h1 className='font-bold my-0 text-sm'>Contato</h1>
                                    <span className='truncate text-xs'>{EmpreitadaCtx!.FORNECEDOR!.CELULAR}</span>
                                </div>
                            </div>
                            <div className='grid grid-cols-4'>
                                <div className='grid grid-rows-2'>
                                    <h1 className='font-bold my-0 text-sm'>Endereço</h1>
                                    <span className='truncate text-xs'>{EmpreitadaCtx!.FORNECEDOR!.ENDERECO}</span>
                                </div>
                                <div className='grid grid-rows-2'>
                                    <h1 className='font-bold my-0 text-sm'>Bairro</h1>
                                    <span className='truncate text-xs'>{EmpreitadaCtx!.FORNECEDOR!.BAIRRO}</span>
                                </div>
                                <div className='grid grid-rows-2'>
                                    <h1 className='font-bold my-0 text-sm'>Cidade</h1>
                                    <span className='truncate text-xs'>{EmpreitadaCtx!.FORNECEDOR!.CIDADE + '/' + EmpreitadaCtx!.FORNECEDOR!.UF}</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <table className='w-full' >
                                <thead>
                                    <tr className='grid grid-cols-8'>
                                        <th className='text-start text-sm'>Item</th>
                                        <th className='text-start text-sm'>Quant.</th>
                                        <th className='text-start text-sm'>UND</th>
                                        <th className='col-span-3 text-start text-sm'>Descrição</th>
                                        <th className='text-start text-sm'>Valor Unit.</th>
                                        <th className='text-start text-sm'>Valor Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <div className='divide-solid divide-y divide-slate-500'>
                                        <div className='divide-slate-500 divide-dashed divide-y'>
                                            {EmpreitadaCtx!.ITENS.map((item) =>
                                                <tr className='grid grid-cols-8 ' key={item.ES_CODIGO}>
                                                    <td className='text-start text-xs'>{item.ES_CODIGO}</td>
                                                    <td className='text-start text-xs'>{item.ES_QUANTIDADE}</td>
                                                    <td className='text-start text-xs'>{item.ES_UNIDADE}</td>
                                                    <td className='col-span-3 text-start text-xs'><p className='text-balance'>{item.DESCRICAO}</p></td>
                                                    <td className='text-start text-xs'>{formatCurrency(item.ES_VALOR! / item.ES_QUANTIDADE!)}</td>
                                                    <td className='text-start text-xs'>{formatCurrency(item.ES_VALOR)}</td>

                                                </tr>
                                            )}

                                        </div>
                                        <tr className='grid grid-cols-8'>
                                            <td className='col-span-6 text-end text-sm'>Total:</td>
                                            <td className='text-sm text-end'> {formatCurrency(somaItens)}</td>
                                        </tr>
                                    </div>

                                </tbody>

                            </table>
                        </div>
                        <div>
                            <div className='box-border border-black border'>
                                <div className='divide-solid divide-y divide-black'>
                                    <div>
                                        <span className='text-sm'>Aqui será colocado o Lugar de execução</span>
                                    </div>
                                    <div>
                                        <p className='text-start text-xs font-bold'>OBS: O(A) Contratado(a) deverá possuir e utilizar e/ou fornecer aos seus funcionários e/ou colaboradores todo o Equipamento de
                                            Proteção Individual, bem como certificações e/ou cursos/treinamentos exigíveis para a execução dos serviços, conforme Normas
                                            de Segurança do Trabalho. Fica eleito o foro de Fátima do Sul-MS, para dirimir toda e qualquer dúvida oriunda desta Ordem de
                                            Serviços, inclusive para cobrança dos honorários, com expressa renúncia a qualquer outro, por mais especial ou privilegiado que
                                            seja, ou venha a ser
                                        </p>
                                    </div>
                                    <div className='grid grid-rows-2'>
                                        <div className='text-sm font-bold tracking-tighter text-end p-2'>
                                        FÁTIMA DO SUL - MS, 22/12/2023.
                                        </div>
                                        <div className='grid grid-cols-2 justify-items-center'>
                                            <div className='text-center text-xs space-y-0 pb-14'>
                                                <p>_________________________________________</p>
                                                <p>{EmpreitadaCtx.FORNECEDOR?.NOME}</p>
                                                <p>CNPJ: {EmpreitadaCtx.FORNECEDOR?.CPF_CNPJ}</p>
                                            </div>
                                            <div className='text-center text-xs space-y-0'>
                                                <p>_________________________________________</p>
                                                <p>ADM</p>
                                                <p>comercial@ekipeservicos.com.br</p>
                                                <p>(67) 99618-6079 - (67) 99618-6021</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                    <button
                        id="botaoImpressao"
                        className={`px-4 py-3 flex items-center space-x-4 rounded-md  group text-black font-bold`}
                        onClick={handlePrint}
                    >
                        <i className="fas fa-print"></i>
                        <span>Imprimir</span>
                    </button>
                </div>
                <footer id="footerImpressao" className='fixed bottom-5' >
                    <div className='font-bold text-center w-full'>
                        <p>________________________________________________________________________________________________________________</p>
                        <p>Rua Presidente Dutra, 1413, Centro - Fone (67)99618-6021 / (67)99618-6079</p>
                        <p>CNPJ:07.167.610/0001-23 - Fátima do Sul - MS www.ekipeservicos.com.br</p>
                    </div>
                </footer>
            </div>
    );

}

export default PrintEmpreitadas;