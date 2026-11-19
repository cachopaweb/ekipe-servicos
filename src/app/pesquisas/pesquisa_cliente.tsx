"use client";

import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Loader2, User, UserPlus, Eye, Check, Power, PowerOff } from "lucide-react";
import ClientRepository, { FiltroEstadoCliente } from "../repositories/cliente_repository";
import { ClienteModel, EstadoCliente, isClienteAtivo } from "../models/cliente_model";
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
  const [filtroStatus, setFiltroStatus] = useState<FiltroEstadoCliente>("todos");
  const [clients, setClients] = useState<ClienteModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [cadastrarCliente, setCadastrarCliente] = useState(false);
  const [idCadastraCliente, setIdCadastraCliente] = useState(0);

  const [confirmAlterarEstado, setConfirmAlterarEstado] = useState<{
    isOpen: boolean;
    cliente: ClienteModel | null;
    novoEstado: EstadoCliente;
  }>({
    isOpen: false,
    cliente: null,
    novoEstado: "INATIVO",
  });
  const [atualizandoEstado, setAtualizandoEstado] = useState(false);

  const inputBuscaRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setShowModal(false);
    if (onClose) onClose();
  }, [setShowModal, onClose]);

  const buscarCliente = useCallback(async (termo: string, status: FiltroEstadoCliente) => {
    setLoading(true);
    try {
      const repository = new ClientRepository();
      const listClients = await repository.getClientes(termo, status);
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
      buscarCliente(textoPesquisado, filtroStatus);
    }, 250);
    return () => clearTimeout(timeout);
  }, [textoPesquisado, filtroStatus, activeIsOpen, buscarCliente]);

  const cadastrarNovoCliente = () => {
    setIdCadastraCliente(0);
    setCadastrarCliente(true);
  };

  const visualizarCliente = (model: ClienteModel) => {
    setIdCadastraCliente(model.CODIGO);
    setCadastrarCliente(true);
  };

  const clientesFiltrados = useMemo(() => {
    if (filtroStatus === "ativos") {
      return clients.filter((item) => isClienteAtivo(item.ESTADO));
    }
    if (filtroStatus === "inativos") {
      return clients.filter((item) => !isClienteAtivo(item.ESTADO));
    }
    return clients;
  }, [clients, filtroStatus]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filtroStatus]);

  useEffect(() => {
    setSelectedIndex((prev) =>
      clientesFiltrados.length === 0 ? 0 : Math.min(prev, clientesFiltrados.length - 1)
    );
  }, [clientesFiltrados.length]);

  const selecionarCliente = useCallback(
    (model: ClienteModel) => {
      if (!isClienteAtivo(model.ESTADO)) {
        toastMixin.fire({
          title: "Cliente inativo",
          text: `O cliente "${model.NOME}" está inativo. Ative-o antes de selecioná-lo.`,
          icon: "warning",
          timer: 2000,
        });
        return;
      }
      setClienteSelecionado(model);
      handleClose();
    },
    [setClienteSelecionado, handleClose]
  );

  const solicitarAlteracaoEstado = (model: ClienteModel) => {
    const ativoAtual = isClienteAtivo(model.ESTADO);
    setConfirmAlterarEstado({
      isOpen: true,
      cliente: model,
      novoEstado: ativoAtual ? "INATIVO" : "ATIVO",
    });
  };

  const handleConfirmAlterarEstado = async () => {
    const { cliente, novoEstado } = confirmAlterarEstado;
    if (!cliente || atualizandoEstado) return;

    setAtualizandoEstado(true);
    try {
      const repository = new ClientRepository();
      const sucesso = await repository.setEstadoCliente(cliente.CODIGO, novoEstado);
      if (!sucesso) {
        throw new Error("Não foi possível atualizar o status do cliente.");
      }

      setClients((prev) =>
        prev.map((item) =>
          item.CODIGO === cliente.CODIGO ? { ...item, ESTADO: novoEstado } : item
        )
      );
      setConfirmAlterarEstado({ isOpen: false, cliente: null, novoEstado: "INATIVO" });

      toastMixin.fire({
        title: novoEstado === "INATIVO" ? "Cliente Inativado" : "Cliente Ativado",
        text: `O cliente "${cliente.NOME}" foi ${
          novoEstado === "INATIVO" ? "inativado" : "ativado"
        } com sucesso.`,
        icon: "success",
        timer: 1500,
      });
    } catch (error) {
      toastMixin.fire({
        title: "Erro ao alterar status",
        text: String(error),
        icon: "error",
      });
    } finally {
      setAtualizandoEstado(false);
    }
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (confirmAlterarEstado.isOpen || cadastrarCliente) {
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, Math.max(clientesFiltrados.length - 1, 0))
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && clientesFiltrados[selectedIndex]) {
        e.preventDefault();
        selecionarCliente(clientesFiltrados[selectedIndex]);
      }
    },
    [
      confirmAlterarEstado.isOpen,
      cadastrarCliente,
      clientesFiltrados,
      selectedIndex,
      selecionarCliente,
      handleClose,
    ]
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

          {/* Barra de Pesquisa e Filtro de Status */}
          <div className="p-4 border-b border-ek-border bg-ek-surface flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
            <div className="relative flex-1">
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

            <div className="flex flex-wrap items-center gap-1 bg-ek-raised border border-ek-border p-1 rounded-[6px] w-fit text-xs font-medium text-ek-muted shrink-0">
              {(
                [
                  { value: "todos", label: "Todos" },
                  { value: "ativos", label: "Ativos" },
                  { value: "inativos", label: "Inativos" },
                ] as const
              ).map((opcao) => (
                <button
                  key={opcao.value}
                  type="button"
                  onClick={() => setFiltroStatus(opcao.value)}
                  className={`px-3 py-1 rounded-[4px] transition-colors ${
                    filtroStatus === opcao.value
                      ? "bg-ek-surface text-ek-text border border-ek-border font-semibold"
                      : "hover:text-ek-text"
                  }`}
                >
                  {opcao.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabela de Resultados */}
          <div className="flex-1 overflow-y-auto min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-ek-muted gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-brand" />
                <span className="text-xs font-medium">Buscando clientes...</span>
              </div>
            ) : clientesFiltrados.length === 0 ? (
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
                    <th className="py-2.5 px-4 text-center w-28 whitespace-nowrap">Status</th>
                    <th className="py-2.5 px-4 text-center w-44 whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ek-rule">
                  {clientesFiltrados.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    const ativo = isClienteAtivo(item.ESTADO);
                    return (
                      <tr
                        key={item.CODIGO}
                        onClick={() => selecionarCliente(item)}
                        className={`cursor-pointer transition-colors text-[13px] ${
                          isSelected
                            ? "bg-brand-soft font-semibold text-ek-text"
                            : ativo
                            ? "hover:bg-ek-raised/80 text-ek-text"
                            : "bg-ek-raised/40 hover:bg-ek-raised text-ek-muted"
                        }`}
                      >
                        <td className="p-3 px-4 font-mono font-semibold text-ek-muted text-center whitespace-nowrap tabular-nums">{item.CODIGO}</td>
                        <td className={`p-3 px-4 font-medium ${ativo ? "text-ek-text" : "text-ek-muted"}`}>{item.NOME}</td>
                        <td className="p-3 px-4 font-mono text-ek-muted whitespace-nowrap tabular-nums">{item.CPF_CNPJ || "—"}</td>
                        <td className="p-3 px-4 text-ek-muted whitespace-nowrap tabular-nums">{item.FONE || "—"}</td>
                        <td className="p-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-xs font-semibold border ${
                              ativo
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                ativo ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                            />
                            {ativo ? "ATIVO" : "INATIVO"}
                          </span>
                        </td>
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
                              disabled={!ativo}
                              onClick={() => selecionarCliente(item)}
                              title={
                                ativo
                                  ? "Selecionar este cliente"
                                  : "Cliente inativo — ative para selecionar"
                              }
                              aria-label={
                                ativo
                                  ? "Selecionar este cliente"
                                  : "Cliente inativo — ative para selecionar"
                              }
                              className={`p-1.5 border rounded-[6px] transition-colors ${
                                ativo
                                  ? "text-brand bg-brand-soft hover:bg-brand/10 border-brand-border"
                                  : "text-ek-faint bg-ek-raised border-ek-border opacity-50 cursor-not-allowed"
                              }`}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            {ativo ? (
                              <button
                                type="button"
                                onClick={() => solicitarAlteracaoEstado(item)}
                                title="Inativar cliente"
                                aria-label="Inativar cliente"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-[6px] transition-colors"
                              >
                                <PowerOff className="w-3.5 h-3.5" />
                                <span>Inativar</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => solicitarAlteracaoEstado(item)}
                                title="Ativar cliente"
                                aria-label="Ativar cliente"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-[6px] transition-colors"
                              >
                                <Power className="w-3.5 h-3.5" />
                                <span>Ativar</span>
                              </button>
                            )}
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
              {clientesFiltrados.length}{" "}
              {clientesFiltrados.length === 1 ? "cliente encontrado" : "clientes encontrados"}
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

      {/* Confirmação de Ativação / Inativação */}
      <ModalConfirmacao
        isOpen={confirmAlterarEstado.isOpen}
        onClose={() => {
          if (!atualizandoEstado) {
            setConfirmAlterarEstado({ isOpen: false, cliente: null, novoEstado: "INATIVO" });
          }
        }}
        onConfirm={handleConfirmAlterarEstado}
        title={
          confirmAlterarEstado.novoEstado === "INATIVO"
            ? "Inativar Cliente"
            : "Ativar Cliente"
        }
        message={
          confirmAlterarEstado.novoEstado === "INATIVO"
            ? `Deseja realmente inativar o cliente "${confirmAlterarEstado.cliente?.NOME}"?`
            : `Deseja realmente ativar o cliente "${confirmAlterarEstado.cliente?.NOME}"?`
        }
        type={confirmAlterarEstado.novoEstado === "INATIVO" ? "danger" : "success"}
        confirmText={
          confirmAlterarEstado.novoEstado === "INATIVO" ? "Sim, Inativar" : "Sim, Ativar"
        }
        cancelText="Cancelar"
        isLoading={atualizandoEstado}
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
