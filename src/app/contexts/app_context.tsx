"use client"

import React, { ReactNode, useState, useContext, createContext, SetStateAction } from "react";
import OrdemModel from "../models/ordem_model";


interface AppDataContextType {
    ultRota: string;
    setUltRota: React.Dispatch<SetStateAction<string>>;
    OrdemCtx:OrdemModel;
    setOrdemCtx :React.Dispatch<SetStateAction<OrdemModel>>;
}

const AppDataContext = createContext({});

interface AppProviderProps {
    children: ReactNode;
}

function AppProvider({ children }: AppProviderProps){
    const [ultRota, setUltRota] = useState<string>('home');
    const [OrdemCtx, setOrdemCtx] = useState<OrdemModel | null>(null);


    return (
        <AppDataContext.Provider value={{ultRota, setUltRota, OrdemCtx,setOrdemCtx}}>
            {children}
        </AppDataContext.Provider>
    );
}

function useAppData(): AppDataContextType{
    const context = useContext(AppDataContext);
    if (context === null){
        throw new Error('O contexto ainda não foi criado')
    }
    const { ultRota, setUltRota, OrdemCtx, setOrdemCtx } = context as AppDataContextType;
    return {ultRota, setUltRota, OrdemCtx, setOrdemCtx};
}

export { AppProvider, useAppData }
