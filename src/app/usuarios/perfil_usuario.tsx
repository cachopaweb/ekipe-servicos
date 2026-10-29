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
    return <div className="p-6 text-center text-stone-500 font-medium">Nenhum usuário identificado.</div>;
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-stone-500 font-medium">
        <i className="fas fa-circle-notch fa-spin mr-2 text-amber-500"></i> Carregando perfil...
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-5 animate-fade-in font-sans">

      {/* Cabeçalho do Cartão */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-stone-200 shrink-0">
        <div className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 h-24 sm:h-28 w-full relative">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        </div>

        <div className="px-5 sm:px-6 pb-5 relative">
          <div className="absolute -top-12 left-5 sm:-top-14 sm:left-6">
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full border-4 border-white bg-stone-100 flex items-center justify-center shadow-md text-stone-600 text-2xl sm:text-3xl font-extrabold select-none ring-1 ring-stone-200">
              {getIniciais(funcionario?.FUN_NOME || usuarioLogado.USU_LOGIN || "")}
            </div>
          </div>

          <div className="ml-28 sm:ml-36 pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center min-h-[50px] gap-2">
            <div className="w-full pr-2">
              <h1 className="text-lg sm:text-xl font-bold text-stone-900 uppercase tracking-tight truncate w-full">
                {funcionario?.FUN_NOME || usuarioLogado.USU_LOGIN}
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 font-medium truncate">
                @{usuarioLogado.USU_LOGIN}
              </p>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${usuarioLogado.FUN_ESTADO === 'ATIVO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
              {usuarioLogado.FUN_ESTADO || 'DESCONHECIDO'}
            </div>
          </div>
        </div>
      </div>

      {/* Detalhes do Perfil - Grid alinhado em altura */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">

        {/* Coluna Esquerda: Dados de Acesso */}
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-stone-200 lg:col-span-1 flex flex-col justify-between h-full">
          <div>
            <h3 className="text-stone-400 font-bold text-xs uppercase mb-4 border-b border-stone-100 pb-2 tracking-wider">
              Dados de Acesso
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Login</label>
                <div className="text-sm font-semibold text-stone-800 flex items-center gap-2 truncate">
                  <i className="fas fa-user text-amber-500 w-4 text-center"></i>
                  <span>{usuarioLogado.USU_LOGIN}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">ID Usuário</label>
                <div className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                  <i className="fas fa-fingerprint text-amber-500 w-4 text-center"></i>
                  <span>#{usuarioLogado.USU_CODIGO}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">ID Funcionário</label>
                <div className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                  <i className="fas fa-id-badge text-amber-500 w-4 text-center"></i>
                  <span>#{usuarioLogado.USU_FUN?.toString() || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 font-semibold py-2.5 px-4 rounded-lg border border-rose-200 transition-colors flex items-center justify-center gap-2 group text-sm shadow-sm"
            >
              <i className="fas fa-sign-out-alt group-hover:-translate-x-0.5 transition-transform"></i>
              Sair do Sistema
            </button>
          </div>
        </div>

        {/* Coluna Direita: Dados Pessoais */}
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-stone-200 lg:col-span-2 flex flex-col justify-between h-full">
          <div>
            <h3 className="text-stone-400 font-bold text-xs uppercase mb-4 border-b border-stone-100 pb-2 tracking-wider">
              Dados Pessoais
            </h3>

            {funcionario ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div className="md:col-span-2">
                  <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Nome Completo</label>
                  <div className="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-2 truncate">
                    {funcionario.FUN_NOME}
                  </div>
                </div>

                <div className="overflow-hidden">
                  <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">E-mail</label>
                  <div className="text-sm font-medium text-stone-800 border-b border-stone-100 pb-2 flex items-center gap-2 truncate">
                    <i className="far fa-envelope text-stone-400 text-sm"></i>
                    <span className="truncate">{funcionario.FUN_EMAIL || "Não informado"}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Telefone / Celular</label>
                  <div className="text-sm font-medium text-stone-800 border-b border-stone-100 pb-2 flex items-center gap-2">
                    <i className="fas fa-phone text-stone-400 text-sm"></i>
                    <span>{funcionario.FUN_FONE || "Não informado"}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Situação Cadastral</label>
                  <div className="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-2 flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${funcionario.FUN_ESTADO === 'ATIVO' ? 'bg-emerald-500' : 'bg-stone-400'}`}></span>
                    <span>{funcionario.FUN_ESTADO}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Código Interno</label>
                  <div className="text-sm font-semibold font-mono text-stone-800 border-b border-stone-100 pb-2">
                    {funcionario.FUN_CODIGO}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-stone-400 bg-stone-50 rounded-lg border border-dashed border-stone-200">
                <i className="fas fa-user-slash text-2xl mb-2 text-stone-300"></i>
                <p className="text-sm">Dados não vinculados ao funcionário.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
