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
            let listaMov = await repository.getMovimentacoes(new Date(new Date().valueOf() - 30), new Date())
            if (listaMov) {
                if (listaMov instanceof Array) {
                    listaMov = listaMov;
                } else {
                    listaMov = [listaMov]
                }
                const saldoAnt = listaMov[0].MOV_SALDOANT;
                if (saldoAnt) {
                    let totalCreditoDebito = 0;
                    listaMov.forEach(mov => {
                        totalCreditoDebito += mov.MOV_CREDITO - mov.MOV_DEBITO;
                    });
                    setTotalDia(saldoAnt + totalCreditoDebito);
                }
                setMovimentacoes(listaMov);
            }
        } catch (error) {
            Swal.fire('Erro', String(error), 'error')
        }
    }

    return (
        <div className="flex flex-col h-full w-full gap-4">
            <div className="bg-white rounded-full border-none p-3 mb-4 shadow-md">
                <div className="flex items-center">
                    <i className="px-3 fas fa-search ml-1"></i>
                    <input type="text" placeholder="Buscar..." className="ml-3 focus:outline-none w-full" />
                </div>
            </div>

            <div className="lg:flex gap-4 items-stretch">
                <div className="bg-white md:p-2 p-6 rounded-lg border border-gray-200 mb-4 lg:mb-0 shadow-md lg:w-[35%]">
                    <div className="flex justify-center items-center space-x-5 h-full">
                        <div>
                            <p>Saldo dia</p>
                            <h2 className="text-3xl font-bold text-gray-600 w-56">R$ {totalDia}</h2>
                        </div>
                        <Image src={walletIcon} alt="wallet" height={130} width={120} />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-md flex-1 w-full border border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-4 h-full">
                        <Link
                            href='/home/vendas'
                            onClick={e => setUltRota('vendas')}
                            className="flex-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg flex flex-col items-center justify-center p-4 space-y-2 border border-gray-200 m-2">
                            <i className="fas fa-hand-holding-usd text-white text-4xl"></i>
                            <p className="text-white">Vendas</p>
                        </Link>

                        <Link
                            href='/home/orcamentos'
                            onClick={e => setUltRota('orcamentos')}
                            className="flex-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg flex flex-col items-center justify-center p-4 space-y-2 border border-gray-200 m-2">
                            <i className="fas fa-exchange-alt text-white text-4xl"></i>
                            <p className="text-white">Orçamentos</p>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md flex-1 overflow-hidden flex flex-col border border-gray-200">
                <table className="table-auto w-full">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 text-left border-b-2 w-full">
                                <h2 className="text-ml font-bold text-gray-600">Movimentações</h2>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {movimentacoes.length > 0 ?
                            movimentacoes.map((mov) =>
                                <tr key={mov.MOV_CODIGO} className="border-b w-full">
                                    <td className="px-4 py-2 text-left align-top w-1/2">
                                        <div>
                                            <h2>{mov.MOV_DESCRICAO}</h2>
                                            <p>{mov.MOV_DATAHORA ? new Date(mov.MOV_DATAHORA).toLocaleDateString() : null}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-right text-amber-500">
                                        <p className="w-20"><span>R$ {mov.MOV_CREDITO > 0 ? mov.MOV_CREDITO : mov.MOV_DEBITO}</span></p>
                                    </td>
                                </tr>
                            )
                            : <tr><h1>Não há movimentações no dia</h1></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}