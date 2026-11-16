'use client'

import { useEffect, useState } from "react";
import { useAppData } from "@/app/contexts/app_context";
import UsuarioRepository, { isUsuarioAdmin } from "../repositories/usuario_repository";
import { PerfilUsuarioTipo, UsuarioModel } from "../models/usuario_model";
import ModalConfirmacao from "@/app/home/orcamentos/components/modal_confirmacao";
import { toastMixin } from "@/app/functions/utils";
import { UserRoundX, UserCheck, Users as UsersIcon, Loader2, Shield } from 'lucide-react';

interface ModalState {
    isOpen: boolean;
    title: string;
    message: string;
    type: "warning" | "danger" | "success" | "info";
    confirmText?: string;
    onConfirm: () => void;
}

export default function Usuarios() {
    const { usuarioLogado } = useAppData();
    const [usuarios, setUsuarios] = useState<UsuarioModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingPerfilId, setUpdatingPerfilId] = useState<number | null>(null);
    const [modalConfirmacao, setModalConfirmacao] = useState<ModalState>({
        isOpen: false,
        title: "",
        message: "",
        type: "info",
        confirmText: "Confirmar",
        onConfirm: () => {},
    });

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

    async function mudaEstadoUsuario(item: UsuarioModel) {
        try {
            const repository = new UsuarioRepository();
            await repository.mudaEstadoUsuario(item);
            toastMixin.fire({
                title: 'Sucesso',
                text: 'Situação do usuário atualizada!',
                icon: 'success',
            });
            await carregaUsuarios();
        } catch (error) {
            console.error("Erro ao alterar situação do usuário:", error);
            toastMixin.fire({
                title: 'Erro',
                text: 'Não foi possível alterar a situação do usuário: ' + String(error),
                icon: 'error',
            });
        }
    }

    function desabilitarUsuario(item: UsuarioModel) {
        setModalConfirmacao({
            isOpen: true,
            title: "Desabilitar Usuário",
            message: `Deseja realmente desabilitar o usuário "${item.FUN_NOME || item.USU_LOGIN}"?`,
            type: "danger",
            confirmText: "Sim, Desabilitar",
            onConfirm: () => {
                setModalConfirmacao((prev) => ({ ...prev, isOpen: false }));
                mudaEstadoUsuario(item);
            },
        });
    }

    function habilitaUsuario(item: UsuarioModel) {
        setModalConfirmacao({
            isOpen: true,
            title: "Habilitar Usuário",
            message: `Deseja realmente habilitar o usuário "${item.FUN_NOME || item.USU_LOGIN}"?`,
            type: "success",
            confirmText: "Sim, Habilitar",
            onConfirm: () => {
                setModalConfirmacao((prev) => ({ ...prev, isOpen: false }));
                mudaEstadoUsuario(item);
            },
        });
    }

    async function executarAlteracaoPerfil(item: UsuarioModel, novoPerfil: PerfilUsuarioTipo) {
        try {
            setUpdatingPerfilId(Number(item.USU_CODIGO));
            const repository = new UsuarioRepository();
            await repository.alterarPerfilUsuario(item, novoPerfil, usuarioLogado);
            toastMixin.fire({
                title: 'Sucesso',
                text: `Perfil de "${item.FUN_NOME || item.USU_LOGIN}" alterado para ${novoPerfil === 'ADMIN' ? 'Admin' : 'Operador'}!`,
                icon: 'success',
            });
            await carregaUsuarios();
        } catch (error: any) {
            console.error("Erro ao alterar perfil do usuário:", error);
            toastMixin.fire({
                title: 'Erro',
                text: error?.message || 'Não foi possível alterar o perfil do usuário.',
                icon: 'error',
            });
        } finally {
            setUpdatingPerfilId(null);
        }
    }

    function solicitarAlteracaoPerfil(item: UsuarioModel, novoPerfil: PerfilUsuarioTipo) {
        const perfilAtual: PerfilUsuarioTipo = isUsuarioAdmin(item) ? 'ADMIN' : 'OPERADOR';
        if (novoPerfil === perfilAtual) return;

        if (usuarioLogado && Number(item.USU_CODIGO) === Number(usuarioLogado.USU_CODIGO)) {
            toastMixin.fire({
                title: 'Ação não permitida',
                text: 'Você não pode alterar o seu próprio perfil.',
                icon: 'warning',
            });
            return;
        }

        const nomeExibicao = item.FUN_NOME || item.USU_LOGIN;
        const promovendo = novoPerfil === 'ADMIN';

        setModalConfirmacao({
            isOpen: true,
            title: "Alterar Perfil de Acesso",
            message: promovendo
                ? `Deseja promover "${nomeExibicao}" para Admin? Ele terá acesso à Gestão de Usuários e poderá modificar perfis.`
                : `Deseja alterar o perfil de "${nomeExibicao}" para Operador? Ele perderá o acesso à Gestão de Usuários.`,
            type: promovendo ? "info" : "warning",
            confirmText: "Sim, Alterar",
            onConfirm: () => {
                setModalConfirmacao((prev) => ({ ...prev, isOpen: false }));
                executarAlteracaoPerfil(item, novoPerfil);
            },
        });
    }

    const getIniciais = (nome: string) => {
        if (!nome) return "U";
        const partes = nome.trim().split(" ");
        if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
        return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    };

    return (
        <div className="w-full font-sans space-y-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3.5 py-2.5 rounded-[8px] bg-ek-raised border border-ek-border text-xs text-ek-muted">
                <div className="flex items-center gap-1.5 font-semibold text-ek-text">
                    <Shield className="w-3.5 h-3.5 text-brand" />
                    <span>Hierarquia de perfis:</span>
                </div>
                <span><strong className="text-ek-text">Admin</strong> — Acesso completo, incluindo Gestão de Usuários e alteração de perfis.</span>
                <span><strong className="text-ek-text">Operador</strong> — Acesso aos módulos operacionais, sem acesso à Gestão de Usuários.</span>
            </div>

            <div className="ek-card overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-ek-muted">
                        <Loader2 className="w-6 h-6 animate-spin text-brand mb-2" />
                        <span className="text-sm font-medium">Carregando usuários...</span>
                    </div>
                ) : usuarios.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-ek-faint">
                        <UsersIcon className="w-8 h-8 text-ek-faint mb-2" />
                        <span className="text-sm font-medium">Nenhum usuário cadastrado.</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto max-h-[420px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-ek-raised border-b border-ek-border text-ek-muted text-xs font-semibold sticky top-0 z-10">
                                    <th className="py-2.5 px-4">Nome do funcionário</th>
                                    <th className="py-2.5 px-4 text-center w-40">Perfil</th>
                                    <th className="py-2.5 px-4 text-center w-32">Situação</th>
                                    <th className="py-2.5 px-4 text-right w-36">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ek-rule text-sm">
                                {usuarios.map((usuario) => {
                                    const isAtivo = usuario.FUN_ESTADO === 'ATIVO';
                                    const perfilAtual: PerfilUsuarioTipo = isUsuarioAdmin(usuario) ? 'ADMIN' : 'OPERADOR';
                                    const isProprioUsuario = Boolean(
                                        usuarioLogado && Number(usuario.USU_CODIGO) === Number(usuarioLogado.USU_CODIGO)
                                    );
                                    const isUpdatingPerfil = updatingPerfilId === Number(usuario.USU_CODIGO);

                                    return (
                                        <tr
                                            key={usuario.USU_CODIGO}
                                            className="hover:bg-ek-raised/80 transition-colors"
                                        >
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-[6px] bg-brand-soft text-brand font-semibold text-xs flex items-center justify-center border border-brand-border shrink-0">
                                                        {getIniciais(usuario.FUN_NOME || usuario.USU_LOGIN || "")}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-ek-text flex items-center gap-2">
                                                            <span>{usuario.FUN_NOME || "Sem Nome"}</span>
                                                            {isProprioUsuario && (
                                                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-brand-soft text-brand border border-brand-border">
                                                                    Você
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-ek-muted font-mono">
                                                            @{usuario.USU_LOGIN}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <div className="inline-flex items-center justify-center gap-1.5">
                                                    <select
                                                        aria-label={`Perfil de ${usuario.FUN_NOME || usuario.USU_LOGIN}`}
                                                        value={perfilAtual}
                                                        disabled={isProprioUsuario || isUpdatingPerfil}
                                                        onChange={(e) =>
                                                            solicitarAlteracaoPerfil(
                                                                usuario,
                                                                e.target.value as PerfilUsuarioTipo
                                                            )
                                                        }
                                                        title={
                                                            isProprioUsuario
                                                                ? "Você não pode alterar o seu próprio perfil"
                                                                : "Alterar perfil de acesso do usuário"
                                                        }
                                                        className={`h-8 px-2.5 rounded-[6px] text-xs font-semibold border transition-colors outline-none ${
                                                            perfilAtual === 'ADMIN'
                                                                ? 'bg-brand-soft text-brand border-brand-border'
                                                                : 'bg-ek-raised text-ek-text border-ek-border'
                                                        } ${
                                                            isProprioUsuario || isUpdatingPerfil
                                                                ? 'opacity-70 cursor-not-allowed'
                                                                : 'cursor-pointer hover:border-brand'
                                                        }`}
                                                    >
                                                        <option value="ADMIN">Admin</option>
                                                        <option value="OPERADOR">Operador</option>
                                                    </select>
                                                    {isUpdatingPerfil && (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-brand shrink-0" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-xs font-semibold border ${
                                                        isAtivo
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : 'bg-ek-raised text-ek-muted border-ek-border'
                                                    }`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                                            isAtivo ? 'bg-emerald-500' : 'bg-ek-faint'
                                                        }`}
                                                    />
                                                    {usuario.FUN_ESTADO || 'INATIVO'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                {isAtivo ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => desabilitarUsuario(usuario)}
                                                        className="ek-btn-danger h-8 px-3 text-xs"
                                                        title="Desabilitar acesso do usuário"
                                                    >
                                                        <UserRoundX className="w-3.5 h-3.5" />
                                                        <span>Desabilitar</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => habilitaUsuario(usuario)}
                                                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
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

            <ModalConfirmacao
                isOpen={modalConfirmacao.isOpen}
                onClose={() => setModalConfirmacao((prev) => ({ ...prev, isOpen: false }))}
                onConfirm={modalConfirmacao.onConfirm}
                title={modalConfirmacao.title}
                message={modalConfirmacao.message}
                type={modalConfirmacao.type}
                confirmText={modalConfirmacao.confirmText}
            />
        </div>
    );
}
