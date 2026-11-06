"use client";

import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { Search, X, Loader2, Users, Check } from "lucide-react";
import CliForRepository from "../repositories/cli_for_repository";
import CliForModel from "../models/cli_for_model";
import { toastMixin } from "../functions/utils";

type PesquisaCliForParams = {
  showModal?: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  cliForSelecionado?: CliForModel;
  setCliForSelecionado: Dispatch<SetStateAction<CliForModel>>;
  isOpen?: boolean;
  onClose?: () => void;
};

export default function PesquisaClienteFornecedor({
  showModal,
  setShowModal,
  setCliForSelecionado,
  isOpen,
  onClose,
}: PesquisaCliForParams) {
  const activeIsOpen = isOpen !== undefined ? isOpen : (showModal ?? true);

  const [textoPesquisado, setTextoPesquisado] = useState("");
  const [listaCliFor, setListaCliFor] = useState<CliForModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputBuscaRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setShowModal(false);
    if (onClose) onClose();
  }, [setShowModal, onClose]);

  const buscarCliente = useCallback(async (termo: string) => {
    setLoading(true);
    try {
      const repository = new CliForRepository();
      const lista = await repository.getListaCliFor(termo);
      setListaCliFor(lista || []);
      setSelectedIndex(0);
    } catch (error) {
      toastMixin.fire({
        title: "Erro ao pesquisar clientes/fornecedores",
        text: String(error),
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeIsOpen) {
      const timer = setTimeout(() => inputBuscaRef.current?.focus(), 60);
      return () => clearTimeout(timer);
    }
  }, [activeIsOpen]);

  useEffect(() => {
    if (!activeIsOpen) return;
    const timeout = setTimeout(() => {
      buscarCliente(textoPesquisado);
    }, 250);
    return () => clearTimeout(timeout);
  }, [textoPesquisado, activeIsOpen, buscarCliente]);

  const selecionarCliFor = useCallback(
    (model: CliForModel) => {
      setCliForSelecionado(model);
      handleClose();
    },
    [setCliForSelecionado, handleClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, listaCliFor.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && listaCliFor[selectedIndex]) {
        e.preventDefault();
        selecionarCliFor(listaCliFor[selectedIndex]);
      }
    },
    [listaCliFor, selectedIndex, selecionarCliFor, handleClose]
  );

  if (!activeIsOpen) return null;

  return (
    <div
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-sm animate-fade-in outline-none"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-stone-200/80 overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/80 bg-stone-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-800 tracking-tight">
                Pesquisa de Cliente / Fornecedor
              </h2>
              <p className="text-xs text-stone-500 font-normal">
                Navegue com as setas ↑ ↓ e pressione Enter para escolher
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Pesquisa */}
        <div className="p-4 border-b border-stone-200 bg-white shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={inputBuscaRef}
              type="text"
              value={textoPesquisado}
              onChange={(e) => setTextoPesquisado(e.target.value)}
              placeholder="Digite o código, nome ou documento para pesquisar..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 uppercase transition"
            />
          </div>
        </div>

        {/* Tabela de Resultados */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <span className="text-xs font-medium">Buscando registros...</span>
            </div>
          ) : listaCliFor.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-2">
              <Users className="w-8 h-8 text-stone-300" />
              <span className="text-sm font-medium">Nenhum registro encontrado.</span>
              <span className="text-xs text-stone-400">Verifique os termos da busca e tente novamente.</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-100/90 text-stone-600 text-xs font-bold uppercase tracking-wider border-b border-stone-200">
                  <th className="p-3 w-20">Cód.</th>
                  <th className="p-3">Nome / Razão Social</th>
                  <th className="p-3">CNPJ / CPF</th>
                  <th className="p-3">Telefone</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {listaCliFor.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <tr
                      key={item.CODIGO}
                      onClick={() => selecionarCliFor(item)}
                      className={`cursor-pointer transition-colors text-xs ${
                        isSelected ? "bg-amber-100/70 font-semibold" : "hover:bg-amber-50/40 text-stone-700"
                      }`}
                    >
                      <td className="p-3 font-mono font-medium text-stone-900">{item.CODIGO}</td>
                      <td className="p-3 font-medium text-stone-800">{item.NOME}</td>
                      <td className="p-3 font-mono text-stone-600">{item.CPF_CNPJ || "—"}</td>
                      <td className="p-3 text-stone-600">{item.FONE || "—"}</td>
                      <td className="p-3 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200 hover:bg-amber-100 transition">
                          <Check className="w-3.5 h-3.5" />
                          <span>Escolher</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-stone-200/80 bg-stone-50/90 shrink-0">
          <span className="text-xs text-stone-500">
            {listaCliFor.length} {listaCliFor.length === 1 ? "registro encontrado" : "registros encontrados"}
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg shadow-sm transition active:scale-[0.98]"
          >
            Fechar (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
