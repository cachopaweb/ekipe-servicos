"use client"
import Image from 'next/image'
import { useReactToPrint } from 'react-to-print';

import logo from '../../../../assets/logo.png'
import { useAppData } from '@/app/contexts/app_context';
import { useEffect, useRef, useState } from 'react';
import { converterDataFormato, formatCurrency, toastMixin } from '../../functions/utils'

const PrintOrcamentos = () => {
    const componentRef = useRef<HTMLDivElement>(null);

    const { OrdemCtx } = useAppData()
    const [somaProdutos, setSomaProdutos] = useState(0);
    const [somaServicos, setSomaServicos] = useState(0);
    const [carregando, setCarregando] = useState(true);
    const [titulo, setTitulo] = useState('Orçamento');
    const [obs, setObs] = useState <Array<string>>([])
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
    });

    function stringToLinesArray(inputString:string) {
        if(inputString === null || inputString === undefined)
        {
            return [''];
        }
        // Usa o método split para dividir a string em linhas, usando o caractere de nova linha (\n) como delimitador
        return inputString.split('\n');
    }

    useEffect(() => {
        setCarregando(true);

        var somaProd = 0;
        var somaServ = 0;
        if (OrdemCtx!.itensOrdEst.length > 0) {
            somaProd = OrdemCtx!.itensOrdEst.map(e => e.ORE_VALOR).reduce((item1, item2) => item1 + item2);
        }
        if (OrdemCtx!.itensOrdSer.length > 0) {
            somaServ = OrdemCtx!.itensOrdSer.map(e => e.OS_VALOR).reduce((item1, item2) => item1 + item2);
        }
    
        setSomaProdutos(somaProd);
        setSomaServicos(somaServ);
        toastMixin.fire({
            title: 'Aperte no botão a baixo imprimir!'
        });
        OrdemCtx.ORD_FAT == null ? OrdemCtx.ORD_FAT = 0 : OrdemCtx.ORD_FAT = OrdemCtx.ORD_FAT;
        OrdemCtx.ORD_FAT == 0 ? setTitulo('Orçamento') : setTitulo('Ordem de Serviço');
        setObs(stringToLinesArray(OrdemCtx.ORD_OBS));
        setCarregando(false);
    }, [])

    return (
        carregando ?
            <h1>Aguarde, carregando dados...</h1>
            :
            <div className='p-3 relative' ref={componentRef}>
                <div >
                    <Image className='p-10' src={logo} height={80} alt="Logo" />
                    <div className='divide-solid divide-y divide-black print:pl-10'>
                        <h1 className='text-center text-2xl font-bold'>{titulo}</h1>
                        <div>
                            <div className='grid grid-cols-2'>
                                <div className='grid grid-rows-2'>
                                    <div className='grid grid-cols-2 '>
                                    <h1 className='font-bold pr-10 my-0 text-sm'>Nome do Cliente</h1>
                                    <h1 className='font-bold my-0 text-sm'>CNPJ/CPF</h1>
                                      
                
                                    </div>
                                        <div className='grid grid-cols-2'>
                                        <span className='pr-10 truncate text-xs	'>{OrdemCtx!.CLI_NOME}</span>
                                        <span className='truncate text-xs'>{OrdemCtx!.CLI_CNPJ_CPF}</span>
                                    </div>
                                </div>
                                <div className='grid grid-rows-2'>
                                    <div className='grid grid-cols-2'>
                                        <h1 className='font-bold my-0 text-sm'>Núm. Controle</h1>
                                        <h1 className='font-bold my-0 text-sm'>Data</h1>
                                    </div>
                                    <div className='grid grid-cols-2'>
                                        <span className='truncate text-xs'>{OrdemCtx!.ORD_CODIGO}</span>
                                        <span className='truncate text-xs'>{converterDataFormato(OrdemCtx!.ORD_DATA)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className='grid grid-cols-5'>
                                <div className='grid grid-rows-2'>
                                    <h1 className='font-bold my-0 text-sm'>Endereço</h1>
                                    <span className='truncate text-xs'>{OrdemCtx!.CLI_ENDERECO}</span>
                                </div>
                                <div className='grid grid-rows-2'>
                                    <h1 className='font-bold my-0 text-sm'>Número</h1>
                                    <span className='truncate text-xs'>{OrdemCtx!.CLI_NUMERO}</span>
                                </div>
                                <div className='grid grid-rows-2'>
                                    <h1 className='font-bold my-0 text-sm'>Bairro</h1>
                                    <span className='truncate text-xs'>{OrdemCtx!.CLI_BAIRRO}</span>
                                </div>
                                <div className='grid grid-rows-2'>
                                    <h1 className='font-bold my-0 text-sm'>Cidade</h1>
                                    <span className='truncate text-xs'>{`${OrdemCtx!.CID_NOME}/${OrdemCtx!.CID_UF}`}</span>
                                </div>
                                <div className='grid grid-rows-2'>
                                    <h1 className='font-bold my-0 text-sm'>Telefone</h1>
                                    <span className='truncate text-xs'>{OrdemCtx!.CLI_FONE}</span>
                                </div>
                            </div>
                            <div>
                                <h1 className='font-bold my-0 text-sm'>Solicitação</h1>
                                <span className='truncate text-xs'>{OrdemCtx!.ORD_SOLICITACAO}</span>
                            </div>
                        </div>
                        <div>
                            <table className='w-full' >
                                <thead>
                                    <tr className='grid grid-cols-8'>
                                        <th className='col-span-4 text-start text-sm'>Produto</th>
                                        <th className='text-start text-sm'>UND</th>
                                        <th className='text-start text-sm'>Quant.</th>
                                        <th className='text-start text-sm'>Valor Unit.</th>
                                        <th className='text-start text-sm'>Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <div className='divide-solid divide-y divide-slate-500'>
                                        <div className='divide-slate-500 divide-dashed divide-y'>
                                            {OrdemCtx!.itensOrdEst.map((item) =>
                                                <tr className='grid grid-cols-8 ' key={item.ORE_CODIGO}>
                                                    <td className='col-span-4 text-start text-xs'>{item.ORE_NOME}</td>
                                                    <td className='text-start text-xs'>{item.ORE_EMBALAGEM}</td>
                                                    <td className='text-start text-xs'>{item.ORE_QUANTIDADE}</td>
                                                    <td className='text-start text-xs'>{formatCurrency(item.ORE_VALOR / item.ORE_QUANTIDADE)}</td>
                                                    <td className='text-start text-xs'>{formatCurrency(item.ORE_VALOR)}</td>
                                                </tr>
                                            )}
                                        </div>
                                        <tr className='grid grid-cols-8'>
                                            <td className='col-span-6 text-end text-sm'>Total Produtos:</td>
                                            <div></div>
                                            <td className='text-sm text-start'> {formatCurrency(somaProdutos)}</td>
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
                                            {OrdemCtx!.itensOrdSer.map((item) =>
                                                <tr className='grid grid-cols-8 ' key={item.OS_CODIGO}>
                                                    <td className='col-span-4 text-start text-xs'>{item.OS_NOME}</td>
                                                    <td className='text-start text-xs'>{item.OS_UNIDADE_MED}</td>
                                                    <td className='text-start text-xs'>{item.OS_QUANTIDADE}</td>
                                                    <td className='text-start text-xs'>{formatCurrency(item.OS_VALOR / item.OS_QUANTIDADE)}</td>
                                                    <td className='text-start text-xs'>{formatCurrency(item.OS_VALOR)}</td>
                                                </tr>
                                            )}
                                        </div>
                                        <tr className='grid grid-cols-8'>
                                            <td className='col-span-6 text-end text-sm'>Total Serviços:</td>
                                            <div></div>
                                            <td className='text-sm text-start'> {formatCurrency(somaServicos)}</td>
                                        </tr>
                                    </div>
                                </tbody>
                            </table>
                        </div>
                        <div>
                            <div className='grid grid-cols-8 font-bold'>
                                <span className='text-sm'>Observação: </span>
                                <span className='text-sm col-span-5 text-end'> Valor Total:</span>
                                <div></div>
                                <span className='text-sm text-start'> {formatCurrency(OrdemCtx!.ORD_VALOR)}</span>
                            </div>
                            
                            {obs ? obs.map((obs) => 
                                    <p key={obs} className='text-start text-xs'>
                                        {obs}
                                    </p>                                                            
                             ) : <></>}

                            

                            <div className='text-end pt-16 grid-rows-3 pr-6'>
                                <div>
                                    <span className='font-bold text-xl' >{OrdemCtx!.FUN_NOME}</span>
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
                        className={`px-4 py-3 flex items-center space-x-4 rounded-md  group text-black font-bold print:hidden`}
                        onClick={handlePrint}
                    >
                        <i className="fas fa-print"></i>
                        <span>Imprimir</span>
                    </button>
                </div>
                <footer id="footerImpressao" className='fixed bottom-5' >
                    <div className='font-bold text-center w-full invisible print:visible'>
                        <p>________________________________________________________________________________________________________________</p>
                        <p>Rua Presidente Dutra, 1413, Centro - Fone (67)99618-6021 / (67)99618-6079</p>
                        <p>CNPJ:07.167.610/0001-23 - Fátima do Sul - MS www.ekipeservicos.com.br</p>
                    </div>
                </footer>
            </div>
    );

}

export default PrintOrcamentos;