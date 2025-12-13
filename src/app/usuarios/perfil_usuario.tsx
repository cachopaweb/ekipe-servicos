"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/app/contexts/app_context";
import UsuarioRepository from "@/app/repositories/usuario_repository";
import { FuncionarioModel } from "@/app/models/usuario_model";

export default function PerfilUsuario() {
  const { usuarioLogado, setUsuarioLogado } = useAppData();

  const [funcionario, setFuncionario] = useState<FuncionarioModel | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchDadosFuncionario = async () => {
      if (usuarioLogado && usuarioLogado.USU_FUN) {
        try {
          setLoading(true);
          const repo = new UsuarioRepository();
          const idFunc = Number(usuarioLogado.USU_FUN);
          const dadosFuncionario = await repo.getFuncionario(idFunc);

          if (dadosFuncionario) {
            setFuncionario(dadosFuncionario);
          }
        } catch (error) {
          console.error("Erro ao carregar perfil:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDadosFuncionario();
  }, [usuarioLogado]);

  const handleLogout = () => {
    if (window.confirm("Deseja realmente sair do sistema?")) {
      localStorage.removeItem('usuario_logado');
      setUsuarioLogado(null as any);
      router.push('/');
    }
  };

  const getIniciais = (nome: string) => {
    if (!nome) return "U";
    const partes = nome.split(" ");
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  };

  if (!usuarioLogado) {
    return <div className="p-4 text-center text-gray-500">Nenhum usuário identificado.</div>;
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        <i className="fas fa-circle-notch fa-spin mr-2"></i> Carregando perfil...
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-4 p-2 sm:p-4 animate-fade-in font-sans overflow-y-auto">

      {/* Cabeçalho do Cartão */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 shrink-0">
        <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-24 sm:h-32 w-full relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6 relative">
          <div className="absolute -top-12 left-4 sm:-top-16 sm:left-6">
            <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-white bg-stone-200 flex items-center justify-center shadow-lg text-stone-500 text-2xl sm:text-4xl font-bold select-none">
              {getIniciais(funcionario?.FUN_NOME || usuarioLogado.USU_LOGIN || "")}
            </div>
          </div>

          <div className="ml-28 sm:ml-36 pt-1 sm:pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center min-h-[60px]">
            <div className="w-full pr-2">
              <h1 className="text-lg sm:text-2xl font-black text-gray-800 uppercase tracking-tight truncate w-full">
                {funcionario?.FUN_NOME || usuarioLogado.USU_LOGIN}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">
                @{usuarioLogado.USU_LOGIN}
              </p>
            </div>
            <div className={`mt-2 sm:mt-0 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border shrink-0 ${usuarioLogado.FUN_ESTADO === 'ATIVO' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
              {usuarioLogado.FUN_ESTADO || 'DESCONHECIDO'}
            </div>
          </div>
        </div>
      </div>

      {/* Detalhes do Perfil */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Coluna Esquerda: Dados de Acesso */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 lg:col-span-1 h-fit">
          <h3 className="text-gray-400 font-bold text-xs uppercase mb-3 border-b border-gray-100 pb-2">
            Dados de Acesso
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block">Login</label>
              <div className="text-base font-semibold text-gray-800 flex items-center gap-2 truncate">
                <i className="fas fa-user text-amber-400 w-4"></i>
                {usuarioLogado.USU_LOGIN}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block">ID Usuário</label>
              <div className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <i className="fas fa-fingerprint text-amber-400 w-4"></i>
                #{usuarioLogado.USU_CODIGO}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block">ID Funcionário</label>
              <div className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <i className="fas fa-id-badge text-amber-400 w-4"></i>
                #{usuarioLogado.USU_FUN?.toString() || "N/A"}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 px-4 rounded-lg border border-red-200 transition flex items-center justify-center gap-2 group text-sm"
            >
              <i className="fas fa-sign-out-alt group-hover:-translate-x-1 transition-transform"></i>
              Sair do Sistema
            </button>
          </div>
        </div>

        {/* Coluna Direita: Dados Pessoais */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 lg:col-span-2">
          <h3 className="text-gray-400 font-bold text-xs uppercase mb-3 border-b border-gray-100 pb-2">
            Dados Pessoais
          </h3>

          {funcionario ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase block">Nome Completo</label>
                <div className="text-base text-gray-800 border-b border-gray-100 py-1 truncate">
                  {funcionario.FUN_NOME}
                </div>
              </div>

              <div className="overflow-hidden">
                <label className="text-[10px] font-bold text-gray-500 uppercase block">E-mail</label>
                <div className="text-base text-gray-800 border-b border-gray-100 py-1 flex items-center gap-2 truncate">
                  <i className="far fa-envelope text-gray-400 text-sm"></i>
                  <span className="truncate">{funcionario.FUN_EMAIL || "Não informado"}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block">Telefone / Celular</label>
                <div className="text-base text-gray-800 border-b border-gray-100 py-1 flex items-center gap-2">
                  <i className="fas fa-phone text-gray-400 text-sm"></i>
                  {funcionario.FUN_FONE || "Não informado"}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block">Situação Cadastral</label>
                <div className="text-base text-gray-800 border-b border-gray-100 py-1">
                  {funcionario.FUN_ESTADO}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase block">Código Interno</label>
                <div className="text-base text-gray-800 border-b border-gray-100 py-1">
                  {funcionario.FUN_CODIGO}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 bg-stone-50 rounded-lg border-2 border-dashed border-gray-200">
              <i className="fas fa-user-slash text-3xl mb-2"></i>
              <p className="text-sm">Dados não vinculados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}