"use client";

import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { Search, X, Loader2, User, UserPlus, Eye, Check, UserX } from "lucide-react";
import ClientRepository from "../repositories/cliente_repository";
import { ClienteModel } from "../models/cliente_model";
import { Cadastro_clientes } from "@/components/component/cadastro_clientes";
import { toastMixin } from "../functions/utils";
import ModalConfirmacao from "@/app/home/orcamentos/components/modal_confirmacao";

type PesquisaClienteParams = {
  showModal?: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  clienteSelecionado?: ClienteModel;
  setClienteSelecionado: Dispatch<SetStateAction<ClienteModel>>;
  isOpen?: boolean;
  onClose?: () => void;
};

export default function PesquisaCliente({
  showModal,
  setShowModal,
  setClienteSelecionado,
  isOpen,
  onClose,
}: PesquisaClienteParams) {
  const activeIsOpen = isOpen !== undefined ? isOpen : (showModal ?? true);

  const [textoPesquisado, setTextoPesquisado] = useState("");
  const [clients, setClients] = useState<ClienteModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [cadastrarCliente, setCadastrarCliente] = useState(false);
  const [idCadastraCliente, setIdCadastraCliente] = useState(0);

  const [confirmDesativar, setConfirmDesativar] = useState<{
    isOpen: boolean;
    cliente: ClienteModel | null;
  }>({
    isOpen: false,
    cliente: null,
  });

  const inputBuscaRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setShowModal(false);
    if (onClose) onClose();
  }, [setShowModal, onClose]);

  const buscarCliente = useCallback(async (termo: string) => {
    setLoading(true);
    try {
      const repository = new ClientRepository();
      const listClients = await repository.getClientes(termo);
      setClients(listClients || []);
      setSelectedIndex(0);
    } catch (error) {
      toastMixin.fire({
        title: "Erro ao buscar clientes",
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

  const cadastrarNovoCliente = () => {
    setIdCadastraCliente(0);
    setCadastrarCliente(true);
  };

  const visualizarCliente = (model: ClienteModel) => {
    setIdCadastraCliente(model.CODIGO);
    setCadastrarCliente(true);
  };

  const selecionarCliente = useCallback(
    (model: ClienteModel) => {
      setClienteSelecionado(model);
      handleClose();
    },
    [setClienteSelecionado, handleClose]
  );

  const solicitarDesativacao = (model: ClienteModel) => {
    setConfirmDesativar({
      isOpen: true,
      cliente: model,
    });
  };

  const handleConfirmDesativar = async () => {
    if (!confirmDesativar.cliente) return;
    const clienteAlvo = confirmDesativar.cliente;
    setConfirmDesativar({ isOpen: false, cliente: null });

    try {
      const repository = new ClientRepository();
      await repository.desabilitaCliente(clienteAlvo);
      toastMixin.fire({
        title: "Cliente Desativado",
        text: `O cliente "${clienteAlvo.NOME}" foi desativado com sucesso.`,
        icon: "success",
        timer: 1500,
      });
      buscarCliente(textoPesquisado);
    } catch (error) {
      toastMixin.fire({
        title: "Erro ao desativar",
        text: String(error),
        icon: "error",
      });
    }
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, clients.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && clients[selectedIndex]) {
        e.preventDefault();
        selecionarCliente(clients[selectedIndex]);
      }
    },
    [clients, selectedIndex, selecionarCliente, handleClose]
  );

  if (!activeIsOpen) return null;

  return (
    <>
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
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-800 tracking-tight">Pesquisa de Clientes</h2>
                <p className="text-xs text-stone-500 font-normal">
                  Navegue com as setas ↑ ↓ e pressione Enter para selecionar
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cadastrarNovoCliente}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm transition active:scale-[0.98]"
              >
                <UserPlus className="w-4 h-4" />
                <span>Novo Cliente</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
                title="Fechar (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Barra de Pesquisa no Topo */}
          <div className="p-4 border-b border-stone-200 bg-white shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={inputBuscaRef}
                type="text"
                value={textoPesquisado}
                onChange={(e) => setTextoPesquisado(e.target.value)}
                placeholder="Pesquisar por nome, CPF/CNPJ, código..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 uppercase transition"
              />
            </div>
          </div>

          {/* Tabela de Resultados */}
          <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-stone-500 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                <span className="text-xs font-medium">Buscando clientes...</span>
              </div>
            ) : clients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-2">
                <User className="w-8 h-8 text-stone-300" />
                <span className="text-sm font-medium">Nenhum cliente encontrado.</span>
                <span className="text-xs text-stone-400">Verifique os termos da busca ou cadastre um novo cliente.</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-100/90 text-stone-600 text-xs font-bold uppercase tracking-wider border-b border-stone-200">
                    <th className="p-3 w-20">Cód.</th>
                    <th className="p-3">Nome</th>
                    <th className="p-3">CPF / CNPJ</th>
                    <th className="p-3">Telefone</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {clients.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <tr
                        key={item.CODIGO}
                        onClick={() => selecionarCliente(item)}
                        className={`cursor-pointer transition-colors text-xs ${
                          isSelected ? "bg-amber-100/70 font-semibold" : "hover:bg-amber-50/40 text-stone-700"
                        }`}
                      >
                        <td className="p-3 font-mono font-medium text-stone-900">{item.CODIGO}</td>
                        <td className="p-3 font-medium text-stone-800">{item.NOME}</td>
                        <td className="p-3 font-mono text-stone-600">{item.CPF_CNPJ || "—"}</td>
                        <td className="p-3 text-stone-600">{item.FONE || "—"}</td>
                        <td className="p-3 text-right">
                          <div
                            className="inline-flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => visualizarCliente(item)}
                              title="Visualizar ou editar cadastro"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition"
                            >
                              <Eye className="w-3.5 h-3.5 text-stone-500" />
                              <span>Ver</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => selecionarCliente(item)}
                              title="Selecionar este cliente"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Escolher</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => solicitarDesativacao(item)}
                              title="Desativar cliente"
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
              {clients.length} {clients.length === 1 ? "cliente encontrado" : "clientes encontrados"}
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

      {/* Confirmação de Desativação */}
      <ModalConfirmacao
        isOpen={confirmDesativar.isOpen}
        onClose={() => setConfirmDesativar({ isOpen: false, cliente: null })}
        onConfirm={handleConfirmDesativar}
        title="Desativar Cliente"
        message={`Deseja realmente desativar o cliente "${confirmDesativar.cliente?.NOME}"?`}
        type="danger"
        confirmText="Sim, Desativar"
        cancelText="Cancelar"
      />

      {/* Sub-modal: Cadastro / Edição de Cliente */}
      {cadastrarCliente && (
        <div
          tabIndex={-1}
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-sm animate-fade-in outline-none"
        >
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-stone-200/80 overflow-hidden font-sans">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/80 bg-stone-50/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-800 tracking-tight">
                    {idCadastraCliente === 0 ? "Novo Cliente" : "Visualizar / Editar Cliente"}
                  </h2>
                  <p className="text-xs text-stone-500 font-normal">Preencha os dados do cliente</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCadastrarCliente(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <Cadastro_clientes
                setListarCliente={setShowModal}
                setCadastrarCliente={setCadastrarCliente}
                id={idCadastraCliente}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
