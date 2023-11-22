"use client"

import React, { ReactNode, useState, useContext, createContext, SetStateAction } from "react";


interface AppDataContextType {
    ultRota: string;
    setUltRota: React.Dispatch<SetStateAction<string>>;
}

const AppDataContext = createContext({});

interface AppProviderProps {
    children: ReactNode;
}

function AppProvider({ children }: AppProviderProps){
    const [ultRota, setUltRota] = useState<string>('home');

    return (
        <AppDataContext.Provider value={{ultRota, setUltRota}}>
            {children}
        </AppDataContext.Provider>
    );
}

function useAppData(): AppDataContextType{
    const context = useContext(AppDataContext);
    if (context === null){
        throw new Error('O contexto ainda não foi criado')
    }
    const { ultRota, setUltRota } = context as AppDataContextType;
    return {ultRota, setUltRota};
}

export { AppProvider, useAppData }
