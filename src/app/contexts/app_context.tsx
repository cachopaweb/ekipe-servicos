"use client"

import React, { ReactNode, useState, useContext, createContext, SetStateAction, useEffect } from "react";
import OrdemModel from "../models/ordem_model";
import EmpreitadasModel from "../models/empreitadas_model";
import { UsuarioModel } from "../models/usuario_model";
import UsuarioRepository from "../repositories/usuario_repository";

interface AppDataContextType {
    ultRota: string;
    OrdemCtx: OrdemModel | null;
    EmpreitadaCtx: EmpreitadasModel | null;
    usuarioLogado: UsuarioModel | null;
    loadingAuth: boolean;
    setOrdemCtx: React.Dispatch<SetStateAction<OrdemModel | null>>;
    setEmpreitadaCtx: React.Dispatch<SetStateAction<EmpreitadasModel | null>>;
    setUltRota: React.Dispatch<SetStateAction<string>>;
    setUsuarioLogado: React.Dispatch<SetStateAction<UsuarioModel | null>>;
}

const AppDataContext = createContext<AppDataContextType | null>(null);

interface AppProviderProps {
    children: ReactNode;
}

function AppProvider({ children }: AppProviderProps) {
    const [ultRota, setUltRota] = useState<string>('home');
    const [OrdemCtx, setOrdemCtx] = useState<OrdemModel | null>(null);
    const [EmpreitadaCtx, setEmpreitadaCtx] = useState<EmpreitadasModel | null>(null);
    const [usuarioLogado, setUsuarioLogado] = useState<UsuarioModel | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        const carregarUsuarioStorage = async () => {
            const usuarioSalvo = localStorage.getItem('usuario_logado');
            if (usuarioSalvo) {
                try {
                    const userParsed = JSON.parse(usuarioSalvo);
                    setUsuarioLogado(userParsed);
                } catch (error) {
                    console.error("Erro ao ler usuário do storage:", error);
                    localStorage.removeItem('usuario_logado');
                }
            }
            setLoadingAuth(false);
        };

        carregarUsuarioStorage();
    }, []);

    return (
        <AppDataContext.Provider value={{
            ultRota,
            setUltRota,
            OrdemCtx,
            setOrdemCtx,
            EmpreitadaCtx,
            setEmpreitadaCtx,
            usuarioLogado,
            setUsuarioLogado,
            loadingAuth
        }}>
            {children}
        </AppDataContext.Provider>
    );
}

function useAppData(): AppDataContextType {
    const context = useContext(AppDataContext);

    if (!context) {
        throw new Error('O contexto deve ser usado dentro de um AppProvider');
    }

    return context;
}

export { AppProvider, useAppData };