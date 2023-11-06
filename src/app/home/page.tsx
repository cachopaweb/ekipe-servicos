"use client"

import Image  from 'next/image';

import logo from '../../../assets/logo.png'
import Dashboard from './dashboard';
import { useState } from 'react';
import Vendas from '../vendas/page';
import Orcamentos from '../orcamentos/page';

export default function Home() {
    const [ultRota, setUltRota] = useState('home');

    const handleClick = (rota: string)=>{
        setUltRota(rota);        
    }

    return (
        <div className="bg-stone-100">
            <nav className="bg-white border-b border-gray-300">
                <div className="flex justify-between items-center px-9">
                    <button id="menuBtn">
                        <i className="fas fa-bars text-amber-500 text-lg"></i>
                    </button>

                    <div className="ml-1">
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

            <div id="sideNav" className="lg:block hidden bg-white w-64 h-screen fixed rounded-none border-none">
                <div className="p-4 space-y-4">
                    <a aria-label="dashboard"  onClick={(e)=> handleClick('home')}
                        className={`relative px-4 py-3 flex items-center space-x-4 rounded-md group  ${ultRota === 'home' ? 'text-white bg-gradient-to-r from-amber-500 to-amber-400' : ''}`}>
                        <i className="fas fa-home"></i>
                        <span className="-mr-1 font-medium">Inicio</span>
                    </a>

                    <a onClick={(e)=> handleClick('vendas')}
                    className={`px-4 py-3 flex items-center space-x-4 rounded-md group ${ultRota === 'vendas' ? 'text-white bg-gradient-to-r from-amber-500 to-amber-400' : 'text-gray-500'}`}>
                        <i className="fas fa-hand-holding-usd"></i>
                        <span>Vendas</span>
                    </a>
                    <a  onClick={(e)=> handleClick('orcamentos')}
                    className={`px-4 py-3 flex items-center space-x-4 rounded-md  group ${ultRota === 'orcamentos' ? 'text-white bg-gradient-to-r from-amber-500 to-amber-400' : 'text-gray-500'}`}>
                        <i className="fas fa-exchange-alt"></i>
                        <span>Orçamentos</span>
                    </a>
                </div>
            </div>
            <RenderSwitch rota={ultRota} handleClick={handleClick} /> 
        </div>
    )
}

type RenderParam = {
    rota: string;
    handleClick: (rota: string)=> void 
}

function RenderSwitch({ rota, handleClick }: RenderParam){
    return (
        <>
        {
             {
                "home": <Dashboard handleClick={handleClick} />,
                "vendas": <Vendas />,                            
                "orcamentos": <Orcamentos />                        
             }[rota]              
             
        }
        </>
    );
}