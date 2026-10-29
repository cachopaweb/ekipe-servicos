"use client"

import Image from 'next/image';
import logo from '../../../assets/logo.png';
import { ReactNode, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppData } from '../contexts/app_context';
import Modal from '@/components/component/modal';
import Usuarios from '../usuarios/usuarios';
import PerfilUsuario from '../usuarios/perfil_usuario';
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
    Clock
} from 'lucide-react';

interface HomeLayoutProps {
    children: ReactNode;
}

export default function HomeLayout({ children }: HomeLayoutProps) {
    const { ultRota, setUltRota, usuarioLogado, setUsuarioLogado, loadingAuth } = useAppData();
    const router = useRouter();
    const pathname = usePathname();

    // Estados de controle de navegação e modais
    const [open, setOpen] = useState(false);
    const [showModalTelaUsuarios, setShowModalTelaUsuarios] = useState(false);
    const [showModalPerfil, setShowModalPerfil] = useState(false);
    const [authorized, setAuthorized] = useState(false);
    const [agora, setAgora] = useState<Date | null>(null);

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

    // Ação rápida de logout
    const handleLogout = () => {
        if (window.confirm("Deseja realmente sair do sistema?")) {
            localStorage.removeItem('usuario_logado');
            localStorage.removeItem('usuario_salvo');
            setUsuarioLogado(null);
            router.push('/');
        }
    };

    // Identificação de rotas ativas
    const isHome = pathname === '/home';
    const isVendas = pathname?.startsWith('/home/vendas');
    const isOrcamentos = pathname?.startsWith('/home/orcamentos');

    const nomeUsuario = usuarioLogado?.FUN_NOME || usuarioLogado?.USU_LOGIN || "Operador";
    const isAdmin = Number(usuarioLogado?.USU_FUN) === 1 || Number(usuarioLogado?.USU_FUN) === 2;

    if (loadingAuth || !authorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-100 font-sans">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-amber-500"></div>
                    <span className="text-xs font-medium text-gray-500">
                        Verificando credenciais...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-stone-100 h-screen flex flex-col font-sans text-gray-900 overflow-hidden">
            {/* 1. TOP BAR / NAVBAR (Limpa, neutra e de alto contraste) */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 h-14 shrink-0 px-3 sm:px-6">
                <div className="flex justify-between items-center h-full gap-3">
                    {/* Esquerda: Botão Menu + Logo Ekipe + Módulo Ativo */}
                    <div className="flex items-center gap-3">
                        <button
                            id="menuBtn"
                            type="button"
                            onClick={() => setOpen(!open)}
                            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            aria-label={open ? "Fechar menu de navegação" : "Abrir menu de navegação"}
                            title="Alternar Menu Lateral"
                        >
                            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>

                        <Link
                            href="/home"
                            onClick={() => {
                                setOpen(false);
                                setUltRota('home');
                            }}
                            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
                            title="Ir para o Início"
                        >
                            <Image
                                src={logo}
                                height={32}
                                alt="Ekipe Serviços"
                                className="h-7 w-auto object-contain"
                                priority
                            />
                        </Link>

                        <div className="hidden md:flex items-center gap-2 pl-2">
                            <span className="h-4 w-px bg-gray-200"></span>
                            <span className="text-xs font-semibold text-gray-500">
                                {isVendas ? "Frente de Caixa (PDV)" : isOrcamentos ? "Orçamentos & Serviços" : "Painel Geral"}
                            </span>
                        </div>
                    </div>

                    {/* Direita: Status Online + Administração + Perfil */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Relógio em Tempo Real (Sem background) */}
                        {agora && (
                            <div
                                className="hidden md:flex items-center gap-1.5 text-gray-700 select-none"
                                title={agora.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            >
                                <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="hidden xl:inline text-xs font-medium text-gray-500 capitalize">
                                    {agora.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace('.', '')}
                                </span>
                                <span className="hidden xl:inline w-1 h-1 rounded-full bg-gray-300"></span>
                                <span className="font-mono font-bold text-xs text-gray-800 tracking-tight">
                                    {agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            </div>
                        )}

                        <span className="h-4 w-px bg-gray-200 hidden md:block"></span>

                        {/* Status de Conexão Online (Sem background) */}
                        <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-gray-600 select-none">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>Online</span>
                        </div>

                        {/* Botão Gestão de Usuários (Apenas Administradores) */}
                        {isAdmin && (
                            <button
                                type="button"
                                onClick={() => setShowModalTelaUsuarios(true)}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Gestão de Usuários e Permissões"
                                aria-label="Abrir gestão de usuários"
                            >
                                <Users className="w-4 h-4" />
                            </button>
                        )}

                        <span className="h-5 w-px bg-gray-200 hidden sm:block"></span>

                        {/* Card do Usuário Logado */}
                        <button
                            type="button"
                            onClick={() => setShowModalPerfil(true)}
                            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
                            title="Ver meu perfil e configurações"
                        >
                            <div className="w-7 h-7 rounded-full bg-brand-soft text-brand font-bold text-xs flex items-center justify-center border border-brand-border shrink-0">
                                {getIniciais(nomeUsuario)}
                            </div>
                            <div className="hidden sm:flex flex-col">
                                <span className="text-xs font-bold text-gray-800 leading-tight truncate max-w-[120px]">
                                    {nomeUsuario}
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium leading-none uppercase">
                                    {isAdmin ? "Administrador" : "Operador"}
                                </span>
                            </div>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* 2. ÁREA DE CONTEÚDO COM SIDEBAR */}
            <div className="flex-1 flex min-w-0 overflow-hidden">
                {/* SIDEBAR DESKTOP & MOBILE */}
                <aside
                    id="sideNav"
                    aria-label="Navegação Principal"
                    className={`
                        fixed lg:sticky top-14 left-0 z-30 h-[calc(100vh-56px)] bg-white border-r border-gray-200 
                        flex flex-col justify-between transition-[width,transform] duration-200 ease-in-out shrink-0
                        ${open ? 'translate-x-0 w-60' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-r-0 lg:overflow-hidden'}
                    `}
                >
                    <div className="p-3.5 flex flex-col gap-5 overflow-y-auto">
                        {/* Seção Principal de Módulos */}
                        <div>
                            <span className="text-xs font-semibold text-gray-400 px-2.5 mb-1.5 block">
                                Módulos comerciais
                            </span>
                            <div className="flex flex-col gap-1">
                                <Link
                                    href="/home"
                                    onClick={() => {
                                        setOpen(false);
                                        setUltRota('home');
                                    }}
                                    className={`px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm font-bold transition ${
                                        isHome
                                            ? 'bg-amber-50 text-amber-900 border border-amber-200/80 shadow-none'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                                    }`}
                                >
                                    <LayoutDashboard className={`w-4 h-4 ${isHome ? 'text-amber-600' : 'text-gray-400'}`} />
                                    <span>Visão Geral</span>
                                </Link>

                                <Link
                                    href="/home/vendas"
                                    onClick={() => {
                                        setOpen(false);
                                        setUltRota('vendas');
                                    }}
                                    className={`px-3 py-2.5 rounded-lg flex items-center justify-between text-sm font-bold transition ${
                                        isVendas
                                            ? 'bg-amber-50 text-amber-900 border border-amber-200/80 shadow-none'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <ShoppingBag className={`w-4 h-4 ${isVendas ? 'text-amber-600' : 'text-gray-400'}`} />
                                        <span>Vendas</span>
                                    </div>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                                        PDV
                                    </span>
                                </Link>

                                <Link
                                    href="/home/orcamentos"
                                    onClick={() => {
                                        setOpen(false);
                                        setUltRota('orcamentos');
                                    }}
                                    className={`px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm font-bold transition ${
                                        isOrcamentos
                                            ? 'bg-amber-50 text-amber-900 border border-amber-200/80 shadow-none'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                                    }`}
                                >
                                    <FileText className={`w-4 h-4 ${isOrcamentos ? 'text-amber-600' : 'text-gray-400'}`} />
                                    <span>Orçamentos & OS</span>
                                </Link>
                            </div>
                        </div>

                        {/* Seção Administração */}
                        <div>
                            <span className="text-xs font-semibold text-gray-400 px-2.5 mb-1.5 block">
                                Configurações
                            </span>
                            <div className="flex flex-col gap-1">
                                {isAdmin && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOpen(false);
                                            setShowModalTelaUsuarios(true);
                                        }}
                                        className="w-full px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 transition text-left"
                                    >
                                        <Users className="w-4 h-4 text-gray-400" />
                                        <span>Gestão de Usuários</span>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setOpen(false);
                                        setShowModalPerfil(true);
                                    }}
                                    className="w-full px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 transition text-left"
                                >
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span>Meu Perfil</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Rodapé da Sidebar: Usuário & Logout */}
                    <div className="p-3 border-t border-gray-200 bg-stone-50/60 flex flex-col gap-2 shrink-0">
                        <div className="flex items-center justify-between gap-2 px-1">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-brand-soft text-brand font-bold text-xs flex items-center justify-center border border-brand-border shrink-0">
                                    {getIniciais(nomeUsuario)}
                                </div>
                                <div className="min-w-0 flex flex-col">
                                    <span className="text-xs font-bold text-gray-800 truncate">
                                        {nomeUsuario}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        {usuarioLogado?.USU_LOGIN || "Sessão Ativa"}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                title="Sair do Sistema"
                                aria-label="Sair do sistema"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium px-1 text-center">
                            Ekipe Serviços • v1.0
                        </div>
                    </div>
                </aside>

                {/* BACKDROP EM DISPOSITIVOS MÓVEIS */}
                {open && (
                    <div
                        className="fixed inset-0 bg-black/20 z-20 lg:hidden"
                        onClick={() => setOpen(false)}
                        aria-hidden="true"
                    ></div>
                )}

                {/* 3. CONTEÚDO DA TELA */}
                <main className="flex-1 min-w-0 flex flex-col overflow-y-auto">
                    {children}
                </main>
            </div>

            {/* Modal de Gestão de Usuários */}
            {showModalTelaUsuarios && (
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
        </div>
    );
}
