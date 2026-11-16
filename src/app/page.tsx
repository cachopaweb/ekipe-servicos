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
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-ek-ground font-sans text-ek-text">
      <div className="w-full max-w-[400px] flex flex-col items-center">
        {/* Card Principal de Login */}
        <div className="w-full bg-white rounded-[10px] border border-ek-border overflow-hidden">
          {/* Assinatura geométrica da logo Ekipe Serviços */}
          <div className="flex h-1 w-full">
            <div className="flex-1 bg-brand" />
            <div className="w-20 bg-brand-gold" />
          </div>

          <div className="p-7 sm:p-8">
            {/* Cabeçalho do Card */}
            <div className="flex flex-col items-start mb-7">
              <Image
                src={logo}
                height={42}
                alt="Ekipe Serviços"
                className="h-9 w-auto object-contain mb-5"
                priority
              />
              <h1 className="text-[20px] font-semibold text-ek-text tracking-tight">
                Acesso ao Sistema
              </h1>
              <p className="text-sm text-ek-muted mt-1">
                Identifique-se para acessar o painel de gestão.
              </p>
            </div>

            {/* Banner de Erro Inline */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 p-3 rounded-[6px] bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span className="flex-1 leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Formulário de Autenticação */}
            <form onSubmit={fazerLogin} className="space-y-4">
              {/* Campo Usuário */}
              <div>
                <label
                  htmlFor="loginUsuario"
                  className="ek-label"
                >
                  Usuário
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 pointer-events-none text-ek-faint">
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
                    className="ek-input pl-9"
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div>
                <label
                  htmlFor="loginSenha"
                  className="ek-label"
                >
                  Senha
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 pointer-events-none text-ek-faint">
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
                    className="ek-input pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    title={showPassword ? "Ocultar senha" : "Exibir senha"}
                    aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                    className="absolute right-2 p-1 text-ek-faint hover:text-ek-text rounded-[4px] hover:bg-ek-raised transition-colors"
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
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-800 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Caps Lock ativado</span>
                  </div>
                )}
              </div>

              {/* Opção Lembrar Usuário */}
              <div className="pt-0.5 flex items-center justify-between">
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
                    className="w-4 h-4 rounded border-ek-control text-brand focus:ring-brand/30 cursor-pointer accent-[#312783]"
                  />
                  <span className="text-xs font-medium text-ek-muted group-hover:text-ek-text transition-colors">
                    Lembrar usuário
                  </span>
                </label>
              </div>

              {/* Botão de Submissão */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="ek-btn-primary w-full h-10"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-brand-gold" />
                      <span>Autenticando...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar no Sistema</span>
                      <LogIn className="w-4 h-4 text-brand-gold" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Rodapé Interno do Card */}
            <div className="mt-6 pt-4 border-t border-ek-rule flex items-center justify-between text-xs text-ek-faint">
              <span>Ekipe Serviços</span>
              <span>Versão 2.0</span>
            </div>
          </div>
        </div>

        {/* Informações de Rodapé */}
        <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-ek-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
          <span>Servidor Online</span>
        </div>
      </div>
    </main>
  );
}
