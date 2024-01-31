"use client"

import React, { ReactNode, useState, useContext, createContext, SetStateAction } from "react";
import OrdemModel from "../models/ordem_model";
import EmpreitadasModel from "../models/empreitadas_model";
import { UsuarioModel } from "../models/usuario_model";


interface AppDataContextType {
    ultRota: string;
    OrdemCtx:OrdemModel;
    EmpreitadaCtx:EmpreitadasModel;
    usuarioLogado: UsuarioModel;
    setOrdemCtx :React.Dispatch<SetStateAction<OrdemModel>>;
    setEmpreitadaCtx :React.Dispatch<SetStateAction<EmpreitadasModel>>;
    setUltRota: React.Dispatch<SetStateAction<string>>;
    setUsuarioLogado: React.Dispatch<SetStateAction<UsuarioModel>>;
}

const AppDataContext = createContext({});

interface AppProviderProps {
    children: ReactNode;
}

function AppProvider({ children }: AppProviderProps){
    const [ultRota, setUltRota] = useState<string>('home');
    const [OrdemCtx, setOrdemCtx] = useState<OrdemModel | null>(null);
    const [EmpreitadaCtx, setEmpreitadaCtx] = useState<EmpreitadasModel | null>(null);
    const [usuarioLogado, setUsuarioLogado ] = useState<UsuarioModel | null>(null);

    return (
        <AppDataContext.Provider value={{ultRota, setUltRota, OrdemCtx,setOrdemCtx, EmpreitadaCtx, setEmpreitadaCtx, usuarioLogado, setUsuarioLogado}}>
            {children}
        </AppDataContext.Provider>
    );
}

function useAppData(): AppDataContextType{
    const context = useContext(AppDataContext);
    if (context === null){
        throw new Error('O contexto ainda não foi criado')
    }
    const { ultRota, setUltRota, OrdemCtx, setOrdemCtx, EmpreitadaCtx, setEmpreitadaCtx, usuarioLogado, setUsuarioLogado } = context as AppDataContextType;
    return {ultRota, setUltRota, OrdemCtx, setOrdemCtx, EmpreitadaCtx, setEmpreitadaCtx, usuarioLogado, setUsuarioLogado};
}

export { AppProvider, useAppData }
