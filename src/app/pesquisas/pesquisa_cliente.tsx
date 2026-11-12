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
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/45 outline-none"
      >
        <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col bg-ek-surface rounded-[8px] border border-ek-border overflow-hidden font-sans">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-ek-border bg-ek-raised shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="w-1 h-4 bg-brand rounded-full" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-semibold text-ek-text flex items-center gap-2">
                  <User className="w-4 h-4 text-brand" />
                  <span>Pesquisa de clientes</span>
                </h2>
                <p className="text-xs text-ek-muted">
                  Navegue com as setas ↑ ↓ e pressione Enter para selecionar
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cadastrarNovoCliente}
                className="ek-btn-primary h-8 px-3 text-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Novo cliente</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-[6px] flex items-center justify-center text-ek-muted hover:text-ek-text hover:bg-ek-active transition-colors"
                title="Fechar (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Barra de Pesquisa no Topo */}
          <div className="p-4 border-b border-ek-border bg-ek-surface shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-ek-faint absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={inputBuscaRef}
                type="text"
                value={textoPesquisado}
                onChange={(e) => setTextoPesquisado(e.target.value)}
                placeholder="Pesquisar por nome, CPF/CNPJ, código..."
                className="ek-input pl-9 uppercase"
              />
            </div>
          </div>

          {/* Tabela de Resultados */}
          <div className="flex-1 overflow-y-auto min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-ek-muted gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-brand" />
                <span className="text-xs font-medium">Buscando clientes...</span>
              </div>
            ) : clients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-ek-muted gap-2">
                <User className="w-8 h-8 text-ek-faint" />
                <span className="text-sm font-medium text-ek-text">Nenhum cliente encontrado.</span>
                <span className="text-xs text-ek-muted">Verifique os termos da busca ou cadastre um novo cliente.</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-ek-raised text-ek-muted text-xs font-semibold border-b border-ek-border sticky top-0 z-10">
                    <th className="py-2.5 px-4 w-16 text-center whitespace-nowrap">Cód.</th>
                    <th className="py-2.5 px-4">Nome</th>
                    <th className="py-2.5 px-4 whitespace-nowrap w-48">CPF / CNPJ</th>
                    <th className="py-2.5 px-4 whitespace-nowrap w-40">Telefone</th>
                    <th className="py-2.5 px-4 text-center w-28 whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ek-rule">
                  {clients.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <tr
                        key={item.CODIGO}
                        onClick={() => selecionarCliente(item)}
                        className={`cursor-pointer transition-colors text-[13px] ${
                          isSelected ? "bg-brand-soft font-semibold" : "hover:bg-ek-raised/80 text-ek-text"
                        }`}
                      >
                        <td className="p-3 px-4 font-mono font-semibold text-ek-muted text-center whitespace-nowrap tabular-nums">{item.CODIGO}</td>
                        <td className="p-3 px-4 font-medium text-ek-text">{item.NOME}</td>
                        <td className="p-3 px-4 font-mono text-ek-muted whitespace-nowrap tabular-nums">{item.CPF_CNPJ || "—"}</td>
                        <td className="p-3 px-4 text-ek-muted whitespace-nowrap tabular-nums">{item.FONE || "—"}</td>
                        <td className="p-3 px-4 text-center whitespace-nowrap">
                          <div
                            className="inline-flex items-center justify-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => visualizarCliente(item)}
                              title="Visualizar ou editar cadastro"
                              aria-label="Visualizar ou editar cadastro"
                              className="p-1.5 text-ek-muted hover:text-ek-text bg-ek-raised border border-ek-border hover:bg-ek-active rounded-[6px] transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => selecionarCliente(item)}
                              title="Selecionar este cliente"
                              aria-label="Selecionar este cliente"
                              className="p-1.5 text-brand bg-brand-soft hover:bg-brand/10 border border-brand-border rounded-[6px] transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => solicitarDesativacao(item)}
                              title="Desativar cliente"
                              aria-label="Desativar cliente"
                              className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-[6px] transition-colors"
                            >
                              <UserX className="w-4 h-4" />
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
          <div className="flex items-center justify-between px-5 py-3 border-t border-ek-border bg-ek-raised shrink-0">
            <span className="text-xs text-ek-muted tabular-nums">
              {clients.length} {clients.length === 1 ? "cliente encontrado" : "clientes encontrados"}
            </span>
            <button
              type="button"
              onClick={handleClose}
              className="ek-btn-secondary h-8 px-3 text-xs"
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
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-slate-950/45 outline-none"
        >
          <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col bg-ek-surface rounded-[8px] border border-ek-border overflow-hidden font-sans">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-ek-border bg-ek-raised shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-1 h-4 bg-brand rounded-full" aria-hidden="true" />
                <div>
                  <h2 className="text-sm font-semibold text-ek-text flex items-center gap-2">
                    <User className="w-4 h-4 text-brand" />
                    <span>{idCadastraCliente === 0 ? "Novo cliente" : "Visualizar / editar cliente"}</span>
                  </h2>
                  <p className="text-xs text-ek-muted">Preencha os dados do cliente</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCadastrarCliente(false)}
                className="w-8 h-8 rounded-[6px] flex items-center justify-center text-ek-muted hover:text-ek-text hover:bg-ek-active transition-colors"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
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
