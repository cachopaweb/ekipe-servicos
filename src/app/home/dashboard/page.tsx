'use client'
import { useEffect, useState } from "react";
import MovimentacoesModel from "../../models/movimentacoes_model";
import Swal from "sweetalert2";
import MovimentacoesRepository from "../../repositories/movimentacoes_repository";
import Link from "next/link";
import { useAppData } from "@/app/contexts/app_context";
import walletIcon from "../../../../assets/wallet.png";
import Image from "next/image";

export default function Dashboard() {
    const [movimentacoes, setMovimentacoes] = useState<MovimentacoesModel[]>([]);
    const [totalDia, setTotalDia] = useState(0);
    const { setUltRota } = useAppData();

    useEffect(() => {
        buscaMovimentacoes()
    }, [])

    const buscaMovimentacoes = async () => {
        try {
            const repository = new MovimentacoesRepository();
            // Busca movimentações dos últimos 30 dias até hoje
            let listaMov = await repository.getMovimentacoes(new Date(new Date().valueOf() - 30 * 24 * 60 * 60 * 1000), new Date())

            if (listaMov) {
                // Garante que seja um array, mesmo se a API retornar um único objeto
                const listaArray = Array.isArray(listaMov) ? listaMov : [listaMov];

                // Pega o saldo anterior do primeiro item (se existir)
                const saldoAnt = listaArray.length > 0 ? listaArray[0].MOV_SALDOANT : 0;

                if (typeof saldoAnt === 'number') {
                    let totalCreditoDebito = 0;
                    listaArray.forEach(mov => {
                        totalCreditoDebito += (mov.MOV_CREDITO || 0) - (mov.MOV_DEBITO || 0);
                    });
                    setTotalDia(saldoAnt + totalCreditoDebito);
                }
                setMovimentacoes(listaArray);
            }
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className="flex flex-col h-full w-full gap-4">
            {/* Barra de Busca */}
            <div className="bg-white rounded-full border-none p-3 mb-4 shadow-md">
                <div className="flex items-center">
                    <i className="px-3 fas fa-search ml-1 text-gray-400"></i>
                    <input type="text" placeholder="Buscar..." className="ml-3 focus:outline-none w-full text-gray-600" />
                </div>
            </div>

            <div className="lg:flex gap-4 items-stretch">
                {/* Card de Saldo */}
                <div className="bg-white md:p-2 p-6 rounded-lg border border-gray-200 mb-4 lg:mb-0 shadow-md lg:w-[35%]">
                    <div className="flex justify-center items-center space-x-5 h-full">
                        <div>
                            <p className="text-gray-500 font-medium">Saldo dia</p>
                            <h2 className="text-3xl font-bold text-gray-600 w-56 truncate">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDia)}
                            </h2>
                        </div>
                        <div className="relative h-32 w-32">
                            <Image src={walletIcon} alt="wallet" className="object-contain" fill sizes="128px" />
                        </div>
                    </div>
                </div>

                {/* Card de Ações */}
                <div className="bg-white p-4 rounded-lg shadow-md flex-1 w-full border border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-4 h-full">
                        <Link
                            href='/home/vendas'
                            onClick={() => setUltRota('vendas')}
                            className="flex-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg flex flex-col items-center justify-center p-4 space-y-2 border border-gray-200 m-2 transition hover:opacity-90 shadow-sm"
                        >
                            <i className="fas fa-hand-holding-usd text-white text-4xl"></i>
                            <p className="text-white font-bold">Vendas</p>
                        </Link>

                        <Link
                            href='/home/orcamentos'
                            onClick={() => setUltRota('orcamentos')}
                            className="flex-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg flex flex-col items-center justify-center p-4 space-y-2 border border-gray-200 m-2 transition hover:opacity-90 shadow-sm"
                        >
                            <i className="fas fa-exchange-alt text-white text-4xl"></i>
                            <p className="text-white font-bold">Orçamentos</p>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Tabela de Movimentações */}
            <div className="bg-white rounded-lg shadow-md flex-1 overflow-hidden flex flex-col border border-gray-200">
                <div className="overflow-auto w-full">
                    <table className="table-auto w-full">
                        <thead className="bg-stone-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 text-left border-b w-full">
                                    <h2 className="text-lg font-bold text-gray-600">Movimentações</h2>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {movimentacoes.length > 0 ? (
                                movimentacoes.map((mov) => (
                                    <tr key={mov.MOV_CODIGO} className="hover:bg-stone-50 transition-colors">
                                        <td className="px-4 py-3 text-left align-top w-1/2">
                                            <div>
                                                <h2 className="font-semibold text-gray-700">{mov.MOV_DESCRICAO}</h2>
                                                <p className="text-sm text-gray-400">
                                                    {mov.MOV_DATAHORA ? new Date(mov.MOV_DATAHORA).toLocaleDateString() : '-'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-amber-600 font-bold align-middle">
                                            <p className="w-20 whitespace-nowrap">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                                    (mov.MOV_CREDITO || 0) > 0 ? mov.MOV_CREDITO : (mov.MOV_DEBITO || 0)
                                                )}
                                            </p>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={2} className="text-center py-10 text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <i className="fas fa-box-open text-3xl opacity-50"></i>
                                            <h2 className="font-medium">Não há movimentações no dia</h2>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}