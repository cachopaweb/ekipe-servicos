"use client"

import Image from 'next/image';
import logo from '../../../assets/logo.png';
import { ReactNode, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppData } from '../contexts/app_context';
import Modal from '@/components/component/modal';
import ModalConfirmacao from './orcamentos/components/modal_confirmacao';
import Usuarios from '../usuarios/usuarios';
import PerfilUsuario from '../usuarios/perfil_usuario';
import { isUsuarioAdmin } from '../repositories/usuario_repository';
import {
    Menu,
    X,
    LayoutDashboard,
    ShoppingBag,
    FileText,
    Users,
    User,
    LogOut,
    ChevronDown,
    Clock,
    FileSpreadsheet
} from 'lucide-react';

interface HomeLayoutProps {
    children: ReactNode;
}

export default function HomeLayout({ children }: HomeLayoutProps) {
    const { ultRota, setUltRota, usuarioLogado, setUsuarioLogado, loadingAuth, temAlteracoesPendentes, setTemAlteracoesPendentes } = useAppData();
    const router = useRouter();
    const pathname = usePathname();

    // Estados de controle de navegação e modais
    const [open, setOpen] = useState(false);
    const [desktopCollapsed, setDesktopCollapsed] = useState(false);
    const [showModalTelaUsuarios, setShowModalTelaUsuarios] = useState(false);
    const [showModalPerfil, setShowModalPerfil] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
    const [authorized, setAuthorized] = useState(false);
    const [agora, setAgora] = useState<Date | null>(null);

    const handleToggleSidebar = () => {
        if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
            setDesktopCollapsed((prev) => !prev);
        } else {
            setOpen((prev) => !prev);
        }
    };

    // Relógio em tempo real da Navbar
    useEffect(() => {
        setAgora(new Date());
        const timer = setInterval(() => {
            setAgora(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Proteção de Rota
    useEffect(() => {
        if (!loadingAuth) {
            if (!usuarioLogado) {
                router.push('/');
            } else {
                setAuthorized(true);
            }
        }
    }, [usuarioLogado, loadingAuth, router]);

    // Fechar menu mobile ao teclar Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && open) {
                setOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open]);

    // Helper de iniciais do operador para o avatar
    const getIniciais = useCallback((nome?: string) => {
        if (!nome) return "US";
        const partes = nome.trim().split(/\s+/);
        if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
        return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }, []);

    const handleNavWithPendingCheck = (action: () => void) => {
        if (temAlteracoesPendentes) {
            setPendingNavigation(() => action);
            setShowDiscardConfirm(true);
        } else {
            action();
        }
    };

    const confirmDiscardAction = () => {
        setTemAlteracoesPendentes(false);
        setShowDiscardConfirm(false);
        const action = pendingNavigation;
        setPendingNavigation(null);
        if (action) action();
    };

    // Ação rápida de logout
    const handleLogout = () => {
        handleNavWithPendingCheck(() => setShowLogoutConfirm(true));
    };

    const confirmLogoutAction = () => {
        localStorage.removeItem('usuario_logado');
        localStorage.removeItem('usuario_salvo');
        setUsuarioLogado(null);
        setShowLogoutConfirm(false);
        router.push('/');
    };

    // Identificação de rotas ativas
    const isHome = pathname === '/home';
    const isVendas = pathname?.startsWith('/home/vendas');
    const isOrcamentos = pathname?.startsWith('/home/orcamentos');
    const isRelatorios = pathname?.startsWith('/home/relatorios');

    const nomeUsuario = usuarioLogado?.FUN_NOME || usuarioLogado?.USU_LOGIN || "Operador";
    const isAdmin = isUsuarioAdmin(usuarioLogado);

    if (loadingAuth || !authorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-ek-ground font-sans">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-ek-border border-t-brand" />
                    <span className="text-xs font-medium text-ek-muted">
                        Verificando credenciais...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-ek-ground h-screen flex flex-col font-sans text-ek-text overflow-hidden">
            {/* 1. TOP BAR (Chrome unificado de 48px sem divisória pesada) */}
            <nav className="bg-ek-ground sticky top-0 z-40 h-12 shrink-0 px-3 sm:px-5">
                <div className="flex justify-between items-center h-full gap-3">
                    {/* Esquerda: Botão Menu + Logo Ekipe + Módulo Ativo */}
                    <div className="flex items-center gap-2.5">
                        <button
                            id="menuBtn"
                            type="button"
                            onClick={handleToggleSidebar}
                            className="w-8 h-8 rounded-[6px] flex items-center justify-center text-ek-muted hover:text-ek-text hover:bg-ek-active transition-colors"
                            aria-label={open ? "Fechar menu de navegação" : "Abrir menu de navegação"}
                            title="Alternar Menu Lateral"
                        >
                            {open ? <X className="w-4 h-4 lg:hidden" /> : null}
                            <Menu className={`w-4 h-4 ${open ? 'hidden lg:block' : 'block'}`} />
                        </button>

                        <Link
                            href="/home"
                            onClick={(e) => {
                                if (temAlteracoesPendentes) {
                                    e.preventDefault();
                                    handleNavWithPendingCheck(() => {
                                        setOpen(false);
                                        setUltRota('home');
                                        router.push('/home');
                                    });
                                    return;
                                }
                                setOpen(false);
                                setUltRota('home');
                            }}
                            className="flex items-center gap-2.5 transition-opacity hover:opacity-85"
                            title="Ir para o Início"
                        >
                            <Image
                                src={logo}
                                height={28}
                                alt="Ekipe Serviços"
                                className="h-6 w-auto object-contain"
                                priority
                            />
                        </Link>

                        <div className="hidden md:flex items-center gap-2.5 pl-1.5">
                            <span className="h-3.5 w-[2px] rounded-full bg-brand-gold" />
                            <span className="text-xs font-medium text-ek-muted">
                                {isVendas ? "Frente de Caixa (PDV)" : isOrcamentos ? "Orçamentos & Serviços" : isRelatorios ? "Relatórios & Empreitadas" : "Painel Geral"}
                            </span>
                        </div>
                    </div>

                    {/* Direita: Relógio + Status + Administração + Perfil */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {agora && (
                            <div
                                className="hidden md:flex items-center gap-1.5 text-ek-muted select-none tabular-nums"
                                title={agora.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            >
                                <Clock className="w-3.5 h-3.5 text-ek-faint shrink-0" />
                                <span className="hidden xl:inline text-xs capitalize">
                                    {agora.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace('.', '')}
                                </span>
                                <span className="hidden xl:inline text-ek-control">·</span>
                                <span className="text-xs font-medium text-ek-text">
                                    {agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            </div>
                        )}

                        <span className="h-3.5 w-px bg-ek-border hidden md:block" />

                        <div className="hidden sm:flex items-center gap-1.5 text-xs text-ek-muted select-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>Online</span>
                        </div>

                        {isAdmin && (
                            <button
                                type="button"
                                onClick={() => setShowModalTelaUsuarios(true)}
                                className="w-8 h-8 flex items-center justify-center text-ek-muted hover:text-ek-text hover:bg-ek-active rounded-[6px] transition-colors"
                                title="Gestão de Usuários e Permissões"
                                aria-label="Abrir gestão de usuários"
                            >
                                <Users className="w-4 h-4" />
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => setShowModalPerfil(true)}
                            className="flex items-center gap-2 py-1 pl-1 pr-2 rounded-[6px] hover:bg-ek-active transition-colors text-left"
                            title="Ver meu perfil e configurações"
                        >
                            <div className="w-6 h-6 rounded-full bg-brand text-white font-semibold text-[11px] flex items-center justify-center shrink-0">
                                {getIniciais(nomeUsuario)}
                            </div>
                            <div className="hidden sm:flex items-center gap-1.5">
                                <span className="text-xs font-medium text-ek-text leading-none truncate max-w-[120px]">
                                    {nomeUsuario}
                                </span>
                                <span className="text-[11px] text-ek-faint leading-none hidden xl:inline">
                                    · {isAdmin ? "Admin" : "Operador"}
                                </span>
                            </div>
                            <ChevronDown className="w-3.5 h-3.5 text-ek-faint hidden sm:block" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* 2. FRAME PRINCIPAL: SIDEBAR NO CHROME + FOLHA DE TRABALHO BRANCA */}
            <div className="flex-1 flex min-w-0 overflow-hidden">
                {/* SIDEBAR DESKTOP & MOBILE */}
                <aside
                    id="sideNav"
                    aria-label="Navegação Principal"
                    className={`
                        fixed lg:static top-12 left-0 z-30 h-[calc(100vh-48px)] lg:h-full bg-ek-ground
                        flex flex-col justify-between transition-[width,transform] duration-200 ease-out shrink-0
                        ${open ? 'translate-x-0 w-[236px] border-r border-ek-border lg:border-r-0' : '-translate-x-full lg:translate-x-0'}
                        ${desktopCollapsed ? 'lg:w-0 lg:overflow-hidden' : 'lg:w-[228px]'}
                    `}
                >
                    <div className="px-3 py-3 flex flex-col gap-5 overflow-y-auto">
                        {/* Seção Principal de Módulos */}
                        <div>
                            <span className="text-xs font-medium text-ek-faint px-2.5 mb-1.5 block">
                                Módulos comerciais
                            </span>
                            <div className="flex flex-col gap-0.5">
                                <Link
                                    href="/home"
                                    onClick={(e) => {
                                        if (temAlteracoesPendentes) {
                                            e.preventDefault();
                                            handleNavWithPendingCheck(() => {
                                                setOpen(false);
                                                setUltRota('home');
                                                router.push('/home');
                                            });
                                            return;
                                        }
                                        setOpen(false);
                                        setUltRota('home');
                                    }}
                                    className={`relative px-2.5 h-8 rounded-[6px] flex items-center gap-2.5 text-[13px] transition-colors ${
                                        isHome
                                            ? 'bg-ek-active text-ek-text font-semibold'
                                            : 'text-ek-muted font-medium hover:text-ek-text hover:bg-ek-active/60'
                                    }`}
                                >
                                    {isHome && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-brand" />}
                                    <LayoutDashboard className={`w-4 h-4 shrink-0 ${isHome ? 'text-brand' : 'text-ek-faint'}`} />
                                    <span>Visão Geral</span>
                                </Link>

                                <Link
                                    href="/home/vendas"
                                    onClick={(e) => {
                                        if (temAlteracoesPendentes) {
                                            e.preventDefault();
                                            handleNavWithPendingCheck(() => {
                                                setOpen(false);
                                                setUltRota('vendas');
                                                router.push('/home/vendas');
                                            });
                                            return;
                                        }
                                        setOpen(false);
                                        setUltRota('vendas');
                                    }}
                                    className={`relative px-2.5 h-8 rounded-[6px] flex items-center justify-between text-[13px] transition-colors ${
                                        isVendas
                                            ? 'bg-ek-active text-ek-text font-semibold'
                                            : 'text-ek-muted font-medium hover:text-ek-text hover:bg-ek-active/60'
                                    }`}
                                >
                                    {isVendas && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-brand" />}
                                    <div className="flex items-center gap-2.5">
                                        <ShoppingBag className={`w-4 h-4 shrink-0 ${isVendas ? 'text-brand' : 'text-ek-faint'}`} />
                                        <span>Vendas</span>
                                    </div>
                                    <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-white border border-ek-border text-ek-muted">
                                        PDV
                                    </span>
                                </Link>

                                <Link
                                    href="/home/orcamentos"
                                    onClick={(e) => {
                                        if (temAlteracoesPendentes) {
                                            e.preventDefault();
                                            handleNavWithPendingCheck(() => {
                                                setOpen(false);
                                                setUltRota('orcamentos');
                                                router.push('/home/orcamentos');
                                            });
                                            return;
                                        }
                                        setOpen(false);
                                        setUltRota('orcamentos');
                                    }}
                                    className={`relative px-2.5 h-8 rounded-[6px] flex items-center gap-2.5 text-[13px] transition-colors ${
                                        isOrcamentos
                                            ? 'bg-ek-active text-ek-text font-semibold'
                                            : 'text-ek-muted font-medium hover:text-ek-text hover:bg-ek-active/60'
                                    }`}
                                >
                                    {isOrcamentos && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-brand" />}
                                    <FileText className={`w-4 h-4 shrink-0 ${isOrcamentos ? 'text-brand' : 'text-ek-faint'}`} />
                                    <span>Orçamentos & OS</span>
                                </Link>

                                <Link
                                    href="/home/relatorios"
                                    onClick={(e) => {
                                        if (temAlteracoesPendentes) {
                                            e.preventDefault();
                                            handleNavWithPendingCheck(() => {
                                                setOpen(false);
                                                setUltRota('relatorios');
                                                router.push('/home/relatorios');
                                            });
                                            return;
                                        }
                                        setOpen(false);
                                        setUltRota('relatorios');
                                    }}
                                    className={`relative px-2.5 h-8 rounded-[6px] flex items-center gap-2.5 text-[13px] transition-colors ${
                                        isRelatorios
                                            ? 'bg-ek-active text-ek-text font-semibold'
                                            : 'text-ek-muted font-medium hover:text-ek-text hover:bg-ek-active/60'
                                    }`}
                                >
                                    {isRelatorios && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-brand" />}
                                    <FileSpreadsheet className={`w-4 h-4 shrink-0 ${isRelatorios ? 'text-brand' : 'text-ek-faint'}`} />
                                    <span>Relatórios</span>
                                </Link>
                            </div>
                        </div>

                        {/* Seção Administração */}
                        <div>
                            <span className="text-xs font-medium text-ek-faint px-2.5 mb-1.5 block">
                                Configurações
                            </span>
                            <div className="flex flex-col gap-0.5">
                                {isAdmin && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOpen(false);
                                            setShowModalTelaUsuarios(true);
                                        }}
                                        className="w-full px-2.5 h-8 rounded-[6px] flex items-center gap-2.5 text-[13px] font-medium text-ek-muted hover:text-ek-text hover:bg-ek-active/60 transition-colors text-left"
                                    >
                                        <Users className="w-4 h-4 shrink-0 text-ek-faint" />
                                        <span>Gestão de Usuários</span>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setOpen(false);
                                        setShowModalPerfil(true);
                                    }}
                                    className="w-full px-2.5 h-8 rounded-[6px] flex items-center gap-2.5 text-[13px] font-medium text-ek-muted hover:text-ek-text hover:bg-ek-active/60 transition-colors text-left"
                                >
                                    <User className="w-4 h-4 shrink-0 text-ek-faint" />
                                    <span>Meu Perfil</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Rodapé da Sidebar: Usuário & Logout */}
                    <div className="px-3 py-2.5 border-t border-ek-border shrink-0">
                        <div className="flex items-center justify-between gap-2 px-1">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-brand-soft text-brand font-semibold text-xs flex items-center justify-center border border-brand-border shrink-0">
                                    {getIniciais(nomeUsuario)}
                                </div>
                                <div className="min-w-0 flex flex-col">
                                    <span className="text-xs font-semibold text-ek-text truncate">
                                        {nomeUsuario}
                                    </span>
                                    <span className="text-[11px] text-ek-faint truncate">
                                        {usuarioLogado?.USU_LOGIN || "Sessão Ativa"}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="p-1.5 text-ek-muted hover:text-red-700 hover:bg-red-50 rounded-[6px] transition-colors"
                                title="Sair do Sistema"
                                aria-label="Sair do sistema"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </aside>

                {/* BACKDROP EM DISPOSITIVOS MÓVEIS */}
                {open && (
                    <div
                        className="fixed inset-0 bg-slate-950/35 z-20 lg:hidden"
                        onClick={() => setOpen(false)}
                        aria-hidden="true"
                    />
                )}

                {/* 3. CONTEÚDO DA TELA (FOLHA BRANCA FRAMED SHEET) */}
                <main className="flex-1 min-w-0 flex flex-col overflow-y-auto bg-white border-t lg:border-l border-ek-border lg:rounded-tl-[16px]">
                    {children}
                </main>
            </div>

            {/* Modal de Gestão de Usuários */}
            {isAdmin && showModalTelaUsuarios && (
                <Modal
                    showModal={showModalTelaUsuarios}
                    setShowModal={setShowModalTelaUsuarios}
                    title="Usuários"
                    showButtonExit={false}
                    body={<Usuarios />}
                />
            )}

            {/* Modal de Perfil */}
            {showModalPerfil && (
                <Modal
                    showModal={showModalPerfil}
                    setShowModal={setShowModalPerfil}
                    title="Meu Perfil"
                    showButtonExit={true}
                    body={<PerfilUsuario />}
                />
            )}

            {/* Modal de Confirmação de Logout */}
            <ModalConfirmacao
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={confirmLogoutAction}
                title="Sair do Sistema"
                message="Deseja realmente encerrar sua sessão no sistema?"
                type="danger"
                confirmText="Sim, Sair"
            />
            {/* Modal de Confirmação de Alterações Pendentes */}
            <ModalConfirmacao
                isOpen={showDiscardConfirm}
                onClose={() => {
                    setShowDiscardConfirm(false);
                    setPendingNavigation(null);
                }}
                onConfirm={confirmDiscardAction}
                title="Atenção!"
                message="Existem alterações que ainda não foram salvas. Se você sair desta tela, todas as alterações realizadas serão perdidas. Deseja realmente sair sem salvar?"
                type="warning"
                confirmText="Sair sem salvar"
                cancelText="Continuar editando"
            />
        </div>
    );
}
