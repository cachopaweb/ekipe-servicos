"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/app/contexts/app_context";
import UsuarioRepository, { isUsuarioAdmin } from "@/app/repositories/usuario_repository";
import { FuncionarioModel } from "@/app/models/usuario_model";
import ModalConfirmacao from "@/app/home/orcamentos/components/modal_confirmacao";
import { toastMixin } from "@/app/functions/utils";
import { Loader2, LogOut, User, Fingerprint, BadgeCheck, Mail, Phone, UserX, Shield } from "lucide-react";

export default function PerfilUsuario() {
  const { usuarioLogado, setUsuarioLogado } = useAppData();

  const [funcionario, setFuncionario] = useState<FuncionarioModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
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
          toastMixin.fire({
            title: 'Erro',
            text: 'Falha ao carregar perfil.',
            icon: 'error'
          });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDadosFuncionario();
  }, [usuarioLogado]);

  const handleLogout = () => {
    setConfirmLogout(true);
  };

  const executeLogout = () => {
    setConfirmLogout(false);
    localStorage.removeItem('usuario_logado');
    setUsuarioLogado(null as any);
    router.push('/');
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
      <div className="flex h-64 items-center justify-center text-ek-muted font-medium">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-brand" /> Carregando perfil...
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-4 font-sans">

      {/* Cabeçalho do Cartão */}
      <div className="ek-card overflow-hidden shrink-0">
        <div className="h-[4px] w-full flex">
          <div className="flex-1 bg-brand" />
          <div className="w-24 bg-brand-gold" />
        </div>

        <div className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-[8px] border border-brand-border bg-brand-soft flex items-center justify-center text-brand text-xl font-bold select-none shrink-0">
              {getIniciais(funcionario?.FUN_NOME || usuarioLogado.USU_LOGIN || "")}
            </div>

            <div className="min-w-0">
              <h1 className="text-lg font-bold text-ek-text uppercase tracking-[-0.01em] truncate">
                {funcionario?.FUN_NOME || usuarioLogado.USU_LOGIN}
              </h1>
              <p className="text-xs sm:text-sm text-ek-muted font-mono truncate">
                @{usuarioLogado.USU_LOGIN}
              </p>
            </div>
          </div>

          <div className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold border shrink-0 ${usuarioLogado.FUN_ESTADO === 'ATIVO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
            {usuarioLogado.FUN_ESTADO || 'DESCONHECIDO'}
          </div>
        </div>
      </div>

      {/* Detalhes do Perfil */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">

        {/* Coluna Esquerda: Dados de Acesso */}
        <div className="ek-card p-5 sm:p-6 lg:col-span-1 flex flex-col justify-between h-full">
          <div>
            <h3 className="text-xs font-semibold text-ek-muted mb-4 border-b border-ek-rule pb-2">
              Dados de acesso
            </h3>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-medium text-ek-muted block mb-1">Login</span>
                <div className="text-sm font-semibold text-ek-text flex items-center gap-2 truncate">
                  <User className="w-4 h-4 text-brand shrink-0" />
                  <span>{usuarioLogado.USU_LOGIN}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-ek-muted block mb-1">ID usuário</span>
                <div className="text-sm font-semibold text-ek-text flex items-center gap-2 tabular-nums">
                  <Fingerprint className="w-4 h-4 text-brand shrink-0" />
                  <span>#{usuarioLogado.USU_CODIGO}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-ek-muted block mb-1">ID funcionário</span>
                <div className="text-sm font-semibold text-ek-text flex items-center gap-2 tabular-nums">
                  <BadgeCheck className="w-4 h-4 text-brand shrink-0" />
                  <span>#{usuarioLogado.USU_FUN?.toString() || "N/A"}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-ek-muted block mb-1">Perfil de acesso</span>
                <div className="text-sm font-semibold text-ek-text flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brand shrink-0" />
                  <span>{isUsuarioAdmin(usuarioLogado) ? "Admin" : "Operador"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-ek-rule">
            <button
              type="button"
              onClick={handleLogout}
              className="ek-btn-danger w-full justify-center text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sair do sistema
            </button>
          </div>
        </div>

        {/* Coluna Direita: Dados Pessoais */}
        <div className="ek-card p-5 sm:p-6 lg:col-span-2 flex flex-col justify-between h-full">
          <div>
            <h3 className="text-xs font-semibold text-ek-muted mb-4 border-b border-ek-rule pb-2">
              Dados pessoais
            </h3>

            {funcionario ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div className="md:col-span-2">
                  <span className="text-xs font-medium text-ek-muted block mb-1">Nome completo</span>
                  <div className="text-sm font-semibold text-ek-text border-b border-ek-rule pb-2 truncate">
                    {funcionario.FUN_NOME}
                  </div>
                </div>

                <div className="overflow-hidden">
                  <span className="text-xs font-medium text-ek-muted block mb-1">E-mail</span>
                  <div className="text-sm font-medium text-ek-text border-b border-ek-rule pb-2 flex items-center gap-2 truncate">
                    <Mail className="w-4 h-4 text-ek-faint shrink-0" />
                    <span className="truncate">{funcionario.FUN_EMAIL || "Não informado"}</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-medium text-ek-muted block mb-1">Telefone / Celular</span>
                  <div className="text-sm font-medium text-ek-text border-b border-ek-rule pb-2 flex items-center gap-2 tabular-nums">
                    <Phone className="w-4 h-4 text-ek-faint shrink-0" />
                    <span>{funcionario.FUN_FONE || "Não informado"}</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-medium text-ek-muted block mb-1">Situação cadastral</span>
                  <div className="text-sm font-semibold text-ek-text border-b border-ek-rule pb-2 flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${funcionario.FUN_ESTADO === 'ATIVO' ? 'bg-emerald-500' : 'bg-ek-faint'}`} />
                    <span>{funcionario.FUN_ESTADO}</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-medium text-ek-muted block mb-1">Código interno</span>
                  <div className="text-sm font-semibold font-mono text-ek-text border-b border-ek-rule pb-2 tabular-nums">
                    {funcionario.FUN_CODIGO}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-ek-muted bg-ek-raised rounded-[6px] border border-dashed border-ek-border">
                <UserX className="w-8 h-8 mb-2 text-ek-faint" />
                <p className="text-sm">Dados não vinculados ao funcionário.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ModalConfirmacao
        isOpen={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={executeLogout}
        title="Sair do Sistema"
        message="Deseja realmente encerrar sua sessão no sistema?"
        type="danger"
        confirmText="Sim, Sair"
      />
    </div>
  );
}
