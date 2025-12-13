"use client"

import Image from 'next/image';
import logo from '../../../assets/logo.png'
import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppData } from '../contexts/app_context';
import Modal from '@/components/component/modal';
import Usuarios from '../usuarios/usuarios';
import PerfilUsuario from '../usuarios/perfil_usuario';
import { useRouter } from 'next/navigation';

interface homeLayoutProps {
    children: ReactNode;
}

export default function HomeLayout({ children }: homeLayoutProps) {
    const { ultRota, setUltRota, usuarioLogado, loadingAuth } = useAppData();
    const router = useRouter();

    // Estados do Menu e Modais
    const [open, setOpen] = useState(false);
    const [showModalTelaUsuarios, setShowModalTelaUsuarios] = useState(false);
    const [showModalPerfil, setShowModalPerfil] = useState(false);
    const [authorized, setAuthorized] = useState(false);

    // --- PROTEÇÃO DE ROTA ---
    useEffect(() => {
        // Se terminou de carregar e não tem usuário, chuta para o login
        if (!loadingAuth) {
            if (!usuarioLogado) {
                router.push('/');
            } else {
                setAuthorized(true);
            }
        }
    }, [usuarioLogado, loadingAuth, router]);

    // Se estiver carregando ou não autorizado, mostra um loading ou nada
    // Isso evita que a tela "pisque" o conteúdo proibido antes de redirecionar
    if (loadingAuth || !authorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-100">
                <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-amber-500"></div>
                    <span className="text-gray-500 font-medium">Verificando acesso...</span>
                </div>
            </div>
        );
    }

    // --- RENDERIZAÇÃO PRINCIPAL (SÓ CHEGA AQUI SE LOGADO) ---
    return (
        <div className="bg-stone-100 min-h-screen flex flex-col">
            <nav className="bg-white border-b border-gray-300 sticky top-0 z-50 h-16">
                <div className="flex justify-between items-center px-9 h-full">
                    <button id="menuBtn" onClick={e => setOpen(!open)}>
                        <i className="fas fa-bars text-amber-500 text-lg"></i>
                    </button>

                    <div className="flex flex-col items-center justify-center">
                        <Link
                            href="/home"
                            onClick={() => setUltRota('home')}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                            title="Ir para o Início"
                        >
                            <Image src={logo} height={40} alt="Logo" className="mt-1 h-8 w-auto object-contain" priority />
                        </Link>
                    </div>

                    <div className="space-x-6 flex items-center">
                        {/* Verifica permissão para mostrar botão de usuários (Ex: USU_FUN 1 ou 2 é ADM?) */}
                        {(Number(usuarioLogado?.USU_FUN) === 1 || Number(usuarioLogado?.USU_FUN) === 2) && (
                            <button onClick={() => setShowModalTelaUsuarios(true)}>
                                <i className="fas fa-users text-amber-500 text-lg"></i>
                            </button>
                        )}

                        <button>
                            <i className="fas fa-bell text-amber-500 text-lg"></i>
                        </button>

                        <button onClick={() => setShowModalPerfil(true)} title="Meu Perfil">
                            <i className="fas fa-user text-amber-500 text-lg"></i>
                        </button>
                    </div>
                </div>
            </nav>

            <div
                id="sideNav"
                className={`fixed left-0 z-40 w-64 h-screen bg-white border-none rounded-none 
                transition-transform duration-300 ease-in-out pt-20 shadow-xl
                ${open ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="p-4 space-y-4">
                    <Link
                        aria-label="/home/dashboard"
                        onClick={() => {
                            setOpen(false);
                            setUltRota('home');
                        }}
                        href='/home'
                        className={`relative px-4 py-3 flex items-center space-x-4 rounded-md group  ${ultRota === 'home' ? 'text-white bg-gradient-to-r from-amber-500 to-amber-400' : ''}`}>
                        <i className="fas fa-home"></i>
                        <span className="-mr-1 font-medium">Inicio</span>
                    </Link>

                    <Link
                        href='/home/vendas'
                        onClick={() => {
                            setOpen(false);
                            setUltRota('vendas');
                        }}
                        className={`px-4 py-3 flex items-center space-x-4 rounded-md group ${ultRota === 'vendas' ? 'text-white bg-gradient-to-r from-amber-500 to-amber-400' : 'text-gray-500'}`}>
                        <i className="fas fa-hand-holding-usd"></i>
                        <span>Vendas</span>
                    </Link>

                    <Link
                        href='/home/orcamentos'
                        onClick={() => {
                            setOpen(false);
                            setUltRota('orcamentos');
                        }}
                        className={`px-4 py-3 flex items-center space-x-4 rounded-md  group ${ultRota === 'orcamentos' ? 'text-white bg-gradient-to-r from-amber-500 to-amber-400' : 'text-gray-500'}`}>
                        <i className="fas fa-exchange-alt"></i>
                        <span>Orçamentos</span>
                    </Link>
                </div>
            </div>

            <main className={`
                    flex-1 p-4 transition-all duration-300 ease-in-out 
                    ${open ? 'lg:ml-64' : 'lg:ml-0'}
                `}>
                {children}
            </main>

            {open && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-25 z-30 lg:hidden"
                    onClick={() => setOpen(false)}
                ></div>
            )}

            {/* Modal de Gestão de Usuários */}
            {showModalTelaUsuarios &&
                <Modal
                    showModal={showModalTelaUsuarios}
                    setShowModal={setShowModalTelaUsuarios}
                    title="Usuários"
                    showButtonExit={false}
                    body={<Usuarios />}
                />
            }

            {/* Modal de Perfil */}
            {showModalPerfil &&
                <Modal
                    showModal={showModalPerfil}
                    setShowModal={setShowModalPerfil}
                    title="Meu Perfil"
                    showButtonExit={true}
                    body={<PerfilUsuario />}
                />
            }
        </div >
    )
}