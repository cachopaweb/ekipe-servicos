"use client"

import Image  from 'next/image';

import logo from '../../../assets/logo.png'
import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useAppData } from '../contexts/app_context';

interface homeLayoutProps {
    children: ReactNode;
}

export default function HomeLayout({ children }: homeLayoutProps) {  
    const { ultRota, setUltRota } = useAppData();
    const {usuarioLogado} = useAppData();
    const [open, setOpen] = useState(false);

    return (        
        <div className="bg-stone-100">
            <nav className="bg-white border-b border-gray-300">
                <div className="flex justify-between items-center px-9">
                    <button id="menuBtn" onClick={e=> setOpen(!open)}>
                        <i className="fas fa-bars text-amber-500 text-lg"></i>
                    </button>

                    <div className="ml-1">
                        { usuarioLogado.USU_FUN === 1 ? <label className='text-red-600' > versão 23-09-2025 </label>:<></>}
                        <Image src={logo} height={40} alt="Logo" className="p-4" />
                    </div>
                    
                    <div className="space-x-4">
                        <button>
                            <i className="fas fa-bell text-amber-500 text-lg"></i>
                        </button>

                        <button>
                            <i className="fas fa-user text-amber-500 text-lg"></i>
                        </button>
                    </div>
                </div>                
            </nav>

            <div id="sideNav" className={`lg:block ${open ? 'block': 'hidden'} bg-white w-64 h-screen fixed rounded-none border-none`}>
                <div className="p-4 space-y-4">
                    <Link 
                        aria-label="/home/dashboard"  
                        onClick={()=> {
                            setOpen(!open);
                            setUltRota('home');
                        }}
                        href='/home'    
                        className={`relative px-4 py-3 flex items-center space-x-4 rounded-md group  ${ultRota === 'home' ? 'text-white bg-gradient-to-r from-amber-500 to-amber-400' : ''}`}>
                        <i className="fas fa-home"></i>
                        <span className="-mr-1 font-medium">Inicio</span>
                    </Link>

                    <Link 
                        href='/home/vendas'                            
                        onClick={()=> {
                            setOpen(!open);                            
                            setUltRota('vendas');
                        }}
                        className={`px-4 py-3 flex items-center space-x-4 rounded-md group ${ultRota === 'vendas' ? 'text-white bg-gradient-to-r from-amber-500 to-amber-400' : 'text-gray-500'}`}>
                        <i className="fas fa-hand-holding-usd"></i>
                        <span>Vendas</span>
                    </Link>
                    
                    <Link  
                        href='/home/orcamentos'                            
                        onClick={()=> {
                            setOpen(!open);                            
                            setUltRota('orcamentos');
                        }}
                        className={`px-4 py-3 flex items-center space-x-4 rounded-md  group ${ultRota === 'orcamentos' ? 'text-white bg-gradient-to-r from-amber-500 to-amber-400' : 'text-gray-500'}`}>
                        <i className="fas fa-exchange-alt"></i>
                        <span>Orçamentos</span>
                    </Link>
                </div>
            </div>
            {children}            
        </div>
    )
}