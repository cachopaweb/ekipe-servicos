"use client"

import React, { ReactNode, useState, useContext, createContext, SetStateAction } from "react";
import OrdemModel from "../models/ordem_model";
import EmpreitadasModel from "../models/empreitadas_model";


interface AppDataContextType {
    ultRota: string;
    setUltRota: React.Dispatch<SetStateAction<string>>;
    OrdemCtx:OrdemModel;
    EmpreitadaCtx:EmpreitadasModel;
    setOrdemCtx :React.Dispatch<SetStateAction<OrdemModel>>;
    setEmpreitadaCtx :React.Dispatch<SetStateAction<EmpreitadasModel>>;
}

const AppDataContext = createContext({});

interface AppProviderProps {
    children: ReactNode;
}

function AppProvider({ children }: AppProviderProps){
    const [ultRota, setUltRota] = useState<string>('home');
    const [OrdemCtx, setOrdemCtx] = useState<OrdemModel | null>(null);
    const [EmpreitadaCtx, setEmpreitadaCtx] = useState<EmpreitadasModel | null>(null);

    return (
        <AppDataContext.Provider value={{ultRota, setUltRota, OrdemCtx,setOrdemCtx, EmpreitadaCtx, setEmpreitadaCtx}}>
            {children}
        </AppDataContext.Provider>
    );
}

function useAppData(): AppDataContextType{
    const context = useContext(AppDataContext);
    if (context === null){
        throw new Error('O contexto ainda não foi criado')
    }
    const { ultRota, setUltRota, OrdemCtx, setOrdemCtx, EmpreitadaCtx, setEmpreitadaCtx } = context as AppDataContextType;
    return {ultRota, setUltRota, OrdemCtx, setOrdemCtx, EmpreitadaCtx, setEmpreitadaCtx};
}

export { AppProvider, useAppData }
