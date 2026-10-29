'use client'

import { useEffect, useState } from "react";
import UsuarioRepository from "../repositories/usuario_repository";
import { UsuarioModel } from "../models/usuario_model";
import { UserRoundX, UserCheck, Users as UsersIcon, Loader2 } from 'lucide-react';

export default function Usuarios() {
    const [usuarios, setUsuarios] = useState<UsuarioModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregaUsuarios();
    }, []);

    async function carregaUsuarios() {
        try {
            setLoading(true);
            const repository = new UsuarioRepository();
            const lista: UsuarioModel[] = await repository.getAllUsersLessSuport();
            setUsuarios(lista);
        } catch (error) {
            console.error("Erro ao carregar usuários:", error);
        } finally {
            setLoading(false);
        }
    }

    function mudaEstadoUsuario(item: UsuarioModel) {
        const repository = new UsuarioRepository();
        repository.mudaEstadoUsuario(item);
        carregaUsuarios();
    }

    function desabilitarUsuario(item: UsuarioModel) {
        if (window.confirm(`Deseja realmente desabilitar o usuário "${item.FUN_NOME}"?`)) {
            mudaEstadoUsuario(item);
        }
    }

    function habilitaUsuario(item: UsuarioModel) {
        if (window.confirm(`Deseja realmente habilitar o usuário "${item.FUN_NOME}"?`)) {
            mudaEstadoUsuario(item);
        }
    }

    const getIniciais = (nome: string) => {
        if (!nome) return "U";
        const partes = nome.trim().split(" ");
        if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
        return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    };

    return (
        <div className="w-full font-sans">
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-stone-500">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-500 mb-2" />
                        <span className="text-sm font-medium">Carregando usuários...</span>
                    </div>
                ) : usuarios.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                        <UsersIcon className="w-8 h-8 text-stone-300 mb-2" />
                        <span className="text-sm font-medium">Nenhum usuário cadastrado.</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto max-h-[420px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-stone-50/90 border-b border-stone-200 text-stone-600 text-xs font-semibold uppercase tracking-wider sticky top-0 z-10">
                                    <th className="py-3 px-4">Nome do Funcionário</th>
                                    <th className="py-3 px-4 text-center w-36">Situação</th>
                                    <th className="py-3 px-4 text-right w-36">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 text-sm">
                                {usuarios.map((usuario) => {
                                    const isAtivo = usuario.FUN_ESTADO === 'ATIVO';
                                    return (
                                        <tr
                                            key={usuario.USU_CODIGO}
                                            className="hover:bg-amber-50/30 transition-colors"
                                        >
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 font-bold text-xs flex items-center justify-center border border-stone-200 shrink-0">
                                                        {getIniciais(usuario.FUN_NOME || usuario.USU_LOGIN || "")}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-stone-800">
                                                            {usuario.FUN_NOME || "Sem Nome"}
                                                        </div>
                                                        <div className="text-xs text-stone-500 font-mono">
                                                            @{usuario.USU_LOGIN}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                                        isAtivo
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : 'bg-stone-100 text-stone-600 border-stone-200'
                                                    }`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                                            isAtivo ? 'bg-emerald-500' : 'bg-stone-400'
                                                        }`}
                                                    ></span>
                                                    {usuario.FUN_ESTADO || 'INATIVO'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                {isAtivo ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => desabilitarUsuario(usuario)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 transition-colors shadow-sm"
                                                        title="Desabilitar acesso do usuário"
                                                    >
                                                        <UserRoundX className="w-3.5 h-3.5" />
                                                        <span>Desabilitar</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => habilitaUsuario(usuario)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200 transition-colors shadow-sm"
                                                        title="Habilitar acesso do usuário"
                                                    >
                                                        <UserCheck className="w-3.5 h-3.5" />
                                                        <span>Habilitar</span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
