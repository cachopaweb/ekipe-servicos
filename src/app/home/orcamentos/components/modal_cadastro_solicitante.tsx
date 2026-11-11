"use client";

import { useState, useRef, useEffect } from "react";
import { UserCheck, X, Save, Loader2, Phone, MapPin } from "lucide-react";
import { SolicitanteModel } from "@/app/models/solicitante_model";
import SolicitanteRepository from "@/app/repositories/solicitante_repository";
import { toastMixin } from "@/app/functions/utils";

interface ModalCadastroSolicitanteProps {
  isOpen: boolean;
  onClose: () => void;
  onSalvo: (novoSolicitante: SolicitanteModel) => void;
}

export default function ModalCadastroSolicitante({
  isOpen,
  onClose,
  onSalvo,
}: ModalCadastroSolicitanteProps) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [regiao, setRegiao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const inputNomeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNome("");
      setTelefone("");
      setRegiao("");
      setTimeout(() => inputNomeRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const formatTelefone = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, (m, p1, p2, p3) =>
        p3 ? `(${p1}) ${p2}-${p3}` : p2 ? `(${p1}) ${p2}` : p1 ? `(${p1}` : ""
      );
    }
    return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, (m, p1, p2, p3) =>
      p3 ? `(${p1}) ${p2}-${p3}` : p2 ? `(${p1}) ${p2}` : p1 ? `(${p1}` : ""
    );
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      inputNomeRef.current?.focus();
      return;
    }

    setSalvando(true);
    try {
      const repo = new SolicitanteRepository();
      const salvo = await repo.salvaSolicitante({
        SOL_NOME: nome.trim(),
        SOL_TELEFONE: telefone.trim(),
        SOL_REGIAO: regiao.trim(),
      });

      toastMixin.fire({
        title: "Solicitante cadastrado!",
        text: `"${salvo.SOL_NOME}" já está disponível para seleção.`,
        icon: "success",
        timer: 1500,
      });

      onSalvo(salvo);
      onClose();
    } catch (error) {
      toastMixin.fire({
        title: "Erro ao cadastrar",
        text: String(error),
        icon: "error",
      });
    } finally {
      setSalvando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-sm animate-fade-in outline-none"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200/80 overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200 bg-stone-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-800 tracking-tight">
                Novo Solicitante (Coordenador)
              </h3>
              <p className="text-[11px] text-stone-500 font-normal">
                Cadastro rápido para vincular às ordens de serviço
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
            title="Fechar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSalvar} className="p-5 space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
              Nome do Solicitante <span className="text-amber-500 font-bold ml-0.5">*</span>
            </label>
            <input
              ref={inputNomeRef}
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value.toUpperCase())}
              placeholder="Ex: LEONARDO SILVA"
              className="w-full h-10 px-3 text-sm font-semibold uppercase bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700 uppercase mb-1">
              <Phone className="w-3.5 h-3.5 text-stone-400" />
              <span>Telefone / WhatsApp</span>
            </label>
            <input
              type="text"
              value={telefone}
              onChange={(e) => setTelefone(formatTelefone(e.target.value))}
              placeholder="(00) 00000-0000"
              className="w-full h-10 px-3 text-sm font-mono bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
            />
          </div>

          {/* Região / Observação */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700 uppercase mb-1">
              <MapPin className="w-3.5 h-3.5 text-stone-400" />
              <span>Região / Observação</span>
            </label>
            <input
              type="text"
              value={regiao}
              onChange={(e) => setRegiao(e.target.value.toUpperCase())}
              placeholder="Ex: REGIONAL SP / COORDENAÇÃO CIVIL"
              className="w-full h-10 px-3 text-sm font-medium uppercase bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
            />
          </div>

          {/* Ações */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm transition active:scale-[0.98] disabled:opacity-60"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Solicitante</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
