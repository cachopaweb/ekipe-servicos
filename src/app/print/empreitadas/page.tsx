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
    const [somaProdutos, setSomaProdutos] = useState(0);
    const [somaServicos, setSomaServicos] = useState(0);
    const [carregando, setCarregando] = useState(true);
    const [titulo, setTitulo] = useState('Orçamento');

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
    });

    useEffect(() => {
        setCarregando(true);
        console.log('Empreitada');
        console.log(EmpreitadaCtx);

        toastMixin.fire({
            title: 'Aperte no botão a baixo imprimir!'
        });
        setCarregando(false);
    }, [])

    return (
        carregando ?
            <h1>Aguarde, carregando dados...</h1>
            :
            <div className='p-3 relative' ref={componentRef}>
                <div >
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
                                            <td className='col-span-6 text-end text-sm'>Total Produtos:</td>
                                            <td className='text-sm text-end'> {formatCurrency(EmpreitadaCtx.EMP_VALOR)}</td>
                                        </tr>
                                    </div>

                                </tbody>

                            </table>
                        </div>
                        <div>
                            <table className='w-full' >
                                <thead>
                                    <tr className='grid grid-cols-8'>
                                        <th className='col-span-4 text-start text-sm'>Serviço</th>
                                        <th className='text-start text-sm'>UND</th>
                                        <th className='text-start text-sm'>Quant.</th>
                                        <th className='text-start text-sm'>Valor Unit.</th>
                                        <th className='text-start text-sm'>Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <div className='divide-solid divide-y divide-slate-500'>
                                        <div className='divide-slate-500 divide-dashed divide-y'>

                                        </div>
                                        <tr className='grid grid-cols-8'>
                                            <td className='col-span-6 text-end text-sm'>Total Serviços:</td>
                                            <td className='text-sm text-end'> {formatCurrency(somaServicos)}</td>
                                        </tr>
                                    </div>
                                </tbody>
                            </table>
                        </div>
                        <div>
                            <div className='grid grid-cols-8 font-bold'>
                                <span className='text-sm'>Observação: </span>
                                <span className='text-sm col-span-5 text-end'> Valor Total:</span>
                                <span className='text-sm text-end'> 100,00</span>
                            </div>
                            <span className='text-start text-xs'>Observacao</span>

                            <div className='text-end pt-16 grid-rows-3'>
                                <div>
                                    <span className='font-bold text-xl' >Funcionario</span>
                                </div>
                                <div>
                                    <span>comercial@ekipeservicos.com.br</span>
                                </div>
                                <div>
                                    <span>(67) 99618-6079 - (67) 99618-6021</span>
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