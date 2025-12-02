"use client"

import Image from 'next/image';

import logo from '../../../assets/logo.png'
import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppData } from '../contexts/app_context';
import Modal from '@/components/component/modal';
import Usuarios from '../usuarios/usuarios';

interface homeLayoutProps {
    children: ReactNode;
}

export default function HomeLayout({ children }: homeLayoutProps) {
    const { ultRota, setUltRota } = useAppData();
    const { usuarioLogado } = useAppData();
    const [open, setOpen] = useState(false);
    const [numUsuario, setNumUsuario] = useState(0);
    const [showModalTelaUsuarios, setShowModalTelaUsuarios] = useState(false);


    useEffect(() => {
        if (usuarioLogado != null) {
            if (usuarioLogado.USU_FUN != null) {
                setNumUsuario(Number(usuarioLogado.USU_FUN));
            }
        }
    }, [])

    function abreTelaUsuarios() {
        setShowModalTelaUsuarios(true);
    }

    return (
        <div className="bg-stone-100 min-h-screen flex flex-col">
            <nav className="bg-white border-b border-gray-300 sticky top-0 z-50 h-16">
                <div className="flex justify-between items-center px-9">
                    <button id="menuBtn" onClick={e => setOpen(!open)}>
                        <i className="fas fa-bars text-amber-500 text-lg"></i>
                    </button>

                    <div className="ml-1">
                        {numUsuario === 1 ? <label className='text-red-600' > versão 27-10-2025 </label> : <></>}
                        <Image src={logo} height={40} alt="Logo" className="p-4" />
                    </div>

                    <div className="space-x-6">
                        {numUsuario === 1 || numUsuario === 2 ?

                            <button onClick={abreTelaUsuarios}>
                                <i className="fas fa-users text-amber-500 text-lg"></i>
                            </button> : <></>}

                        <button>
                            <i className="fas fa-bell text-amber-500 text-lg"></i>
                        </button>
                        <button>
                            <i className="fas fa-user text-amber-500 text-lg"></i>
                        </button>
                    </div>
                </div>
            </nav>

            <div
                id="sideNav"
                className={`fixed left-0 z-40 w-64 h-screen bg-white border-none rounded-none 
                transition-transform duration-300 ease-in-out pt-20
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

            {showModalTelaUsuarios &&
                <Modal showModal={showModalTelaUsuarios} setShowModal={setShowModalTelaUsuarios}
                    title="Usuários"
                    showButtonExit={false}
                    body={<Usuarios />}
                />}
        </div >
    )
}