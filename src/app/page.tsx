"use client"

import React, { useEffect, useState, useRef, FormEvent } from "react";
import Image from 'next/image';
import { useRouter } from "next/navigation";
import logo from '../../assets/logo.png';
import UsuarioRepository from "./repositories/usuario_repository";
import { toastMixin } from "./functions/utils";
import { useAppData } from "./contexts/app_context";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  AlertCircle,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export default function Login() {
  const [user, setUser] = useState('');
  const [passw, setPassw] = useState('');
  const [rememberUser, setRememberUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [capsLockAtivo, setCapsLockAtivo] = useState(false);

  const router = useRouter();
  const { setUsuarioLogado } = useAppData();

  const userInputRef = useRef<HTMLInputElement>(null);
  const passInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Sempre encerra qualquer sessão anterior e exige novo login
    localStorage.removeItem('usuario_logado');
    setUsuarioLogado(null);

    const usuarioSalvo = localStorage.getItem('usuario_salvo');
    if (usuarioSalvo) {
      setUser(usuarioSalvo);
      setRememberUser(true);
      // Focar automaticamente no campo de senha se o usuário já estiver preenchido
      setTimeout(() => {
        passInputRef.current?.focus();
      }, 100);
    } else {
      // Focar no campo de usuário
      setTimeout(() => {
        userInputRef.current?.focus();
      }, 100);
    }
  }, [setUsuarioLogado]);

  const handleKeyModifier = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setCapsLockAtivo(e.getModifierState('CapsLock'));
    }
  };

  const fazerLogin = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage('');

    const cleanUser = user.trim();
    if (!cleanUser) {
      setErrorMessage('Por favor, informe seu usuário.');
      userInputRef.current?.focus();
      return;
    }

    if (!passw) {
      setErrorMessage('Por favor, informe sua senha.');
      passInputRef.current?.focus();
      return;
    }

    setLoading(true);
    const repository = new UsuarioRepository();

    try {
      const success = await repository.login(cleanUser, passw);
      if (success) {
        // Busca usuários para sincronizar com o estado da aplicação e localStorage
        try {
          const users = await repository.getUsers();
          const usuarioEncontrado = users.find(
            u => u.USU_LOGIN.toLowerCase() === cleanUser.toLowerCase()
          );

          if (usuarioEncontrado) {
            localStorage.setItem('usuario_logado', JSON.stringify(usuarioEncontrado));
            setUsuarioLogado(usuarioEncontrado);
          } else if (typeof success === 'object') {
            localStorage.setItem('usuario_logado', JSON.stringify(success));
            setUsuarioLogado(success as any);
          }
        } catch {
          if (typeof success === 'object') {
            localStorage.setItem('usuario_logado', JSON.stringify(success));
            setUsuarioLogado(success as any);
          }
        }

        // Salva ou remove o nome do usuário lembrado
        if (rememberUser) {
          localStorage.setItem('usuario_salvo', cleanUser);
        } else {
          localStorage.removeItem('usuario_salvo');
        }

        toastMixin.fire({
          icon: 'success',
          title: 'Acesso autorizado',
          text: `Bem-vindo(a), ${cleanUser}!`
        });

        router.push('/home');
      } else {
        setErrorMessage('Usuário ou senha incorretos.');
        toastMixin.fire('Falha ao logar', 'Usuário ou senha incorretos', 'error');
        setPassw('');
        passInputRef.current?.focus();
      }
    } catch (error: any) {
      const msg = error?.message || 'Falha ao autenticar no servidor. Verifique sua conexão.';
      setErrorMessage(msg);
      toastMixin.fire('Falha ao logar', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-stone-100 relative overflow-hidden font-sans">
      {/* Luz ambiente e elementos decorativos de fundo */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#312783]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#d6d3d1_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

      <div className="relative w-full max-w-[420px] z-10 flex flex-col items-center">
        {/* Card Principal de Login */}
        <div className="w-full bg-white rounded-2xl shadow-xl shadow-stone-300/40 border border-stone-200/90 overflow-hidden">
          {/* Faixa decorativa superior com as cores do sistema */}
          <div className="h-2 w-full bg-gradient-to-r from-[#312783] via-indigo-700 to-amber-500" />

          <div className="p-6 sm:p-8">
            {/* Cabeçalho do Card */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100 shadow-sm mb-3.5 flex items-center justify-center">
                <Image
                  src={logo}
                  height={44}
                  alt="Ekipe Serviços"
                  className="h-9 sm:h-10 w-auto object-contain"
                  priority
                />
              </div>
              <h1 className="text-xl font-bold text-stone-900 tracking-tight">
                Acesso ao Sistema
              </h1>
              <p className="text-xs text-stone-500 font-medium mt-1">
                Identifique-se para acessar o painel de gestão
              </p>
            </div>

            {/* Banner de Erro Inline */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5 transition-all"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span className="flex-1 leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Formulário de Autenticação */}
            <form onSubmit={fazerLogin} className="space-y-4">
              {/* Campo Usuário */}
              <div>
                <label
                  htmlFor="loginUsuario"
                  className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5"
                >
                  Usuário
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 pointer-events-none text-stone-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    ref={userInputRef}
                    id="loginUsuario"
                    type="text"
                    name="login"
                    value={user}
                    onChange={(e) => {
                      setUser(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    onKeyDown={handleKeyModifier}
                    onKeyUp={handleKeyModifier}
                    placeholder="Digite seu usuário"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-[#312783] focus:ring-4 focus:ring-[#312783]/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div>
                <label
                  htmlFor="loginSenha"
                  className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5"
                >
                  Senha
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    ref={passInputRef}
                    id="loginSenha"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={passw}
                    onChange={(e) => {
                      setPassw(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    onKeyDown={handleKeyModifier}
                    onKeyUp={handleKeyModifier}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full pl-10 pr-11 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-[#312783] focus:ring-4 focus:ring-[#312783]/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    title={showPassword ? "Ocultar senha" : "Exibir senha"}
                    aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                    className="absolute right-2.5 p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/50 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Alerta de Caps Lock Ativado */}
                {capsLockAtivo && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-600 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Caps Lock ativado</span>
                  </div>
                )}
              </div>

              {/* Opção Lembrar Usuário */}
              <div className="pt-1 flex items-center justify-between">
                <label
                  htmlFor="rememberUser"
                  className="inline-flex items-center gap-2 cursor-pointer select-none group"
                >
                  <input
                    type="checkbox"
                    id="rememberUser"
                    checked={rememberUser}
                    onChange={(e) => setRememberUser(e.target.checked)}
                    disabled={loading}
                    className="w-4 h-4 rounded border-stone-300 text-[#312783] focus:ring-[#312783]/30 cursor-pointer accent-[#312783]"
                  />
                  <span className="text-xs font-medium text-stone-600 group-hover:text-stone-900 transition-colors">
                    Lembrar usuário
                  </span>
                </label>
              </div>

              {/* Botão de Submissão */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-[#312783] hover:bg-[#261e68] text-white font-bold text-sm shadow-md shadow-[#312783]/20 hover:shadow-lg hover:shadow-[#312783]/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Autenticando...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar no Sistema</span>
                      <LogIn className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Rodapé Interno do Card */}
            <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-center gap-2 text-[11px] font-medium text-stone-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ambiente Seguro • Ekipe Serviços</span>
            </div>
          </div>
        </div>

        {/* Informações de Rodapé */}
        <div className="mt-5 flex items-center gap-2 text-center text-xs text-stone-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span>Servidor Online • Versão 2.0</span>
        </div>
      </div>
    </main>
  );
}
