"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Edit2, FileText, Building2, Check, Loader2, Store, Calendar, Coins } from "lucide-react";
import { converterDataFormato, formatDataInput, toastMixin } from "@/app/functions/utils";
import CliForModel from "@/app/models/cli_for_model";
import EmpreitadasModel from "@/app/models/empreitadas_model";
import OrdemModel from "@/app/models/ordem_model";
import EmpreitadasRepository from "@/app/repositories/empreitadas_repository";
import PesquisaFornecedor from "@/app/pesquisas/pesquisa_fornecedor";
import CliForRepository from "../../repositories/cli_for_repository";
import EmpreitadaModal from "./empreitada";
import ModalConfirmacao from "@/app/home/orcamentos/components/modal_confirmacao";

interface EmpreitadasProps {
  ordemServico: OrdemModel;
  onUpdateTotalPago?: () => void;
}

export default function Empreitadas({ ordemServico, onUpdateTotalPago }: EmpreitadasProps) {
  const [listaEmpreitadas, setListaEmpreitadas] = useState<EmpreitadasModel[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<CliForModel>({
    CODIGO: 0,
    NOME: "GENERICO",
  });
  const [showModalPesquisaFornecedor, setShowModalPesquisaFornecedor] = useState(false);
  const [empreitadaSelecionada, setEmpreitadaSelecionada] = useState<EmpreitadasModel | undefined>(undefined);
  const [showModalEmpreitada, setShowModalEmpreitada] = useState(false);
  const [isDeletando, setIsDeletando] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    codigo: number;
    nome?: string;
  }>({
    isOpen: false,
    codigo: 0,
  });

  const codOrdem = ordemServico?.ORD_CODIGO || 0;

  const cacheEmpreitadas = useCallback(async () => {
    if (!codOrdem) return [];
    const repository = new EmpreitadasRepository();
    const repositoryfornecedor = new CliForRepository();
    const response = await repository.buscaEmpreitadas(codOrdem);
    for (let i = 0; i < response.length; i++) {
      if (response[i] && response[i].EMP_FOR) {
        try {
          response[i].FORNECEDOR = await repositoryfornecedor.getCliFor(response[i].EMP_FOR + 2000000);
        } catch {
          // Mantém FOR_NOME da consulta principal
        }
      }
    }
    return response;
  }, [codOrdem]);

  const buscaEmpreitadas = useCallback(async () => {
    try {
      setCarregando(true);
      const emp = await cacheEmpreitadas();
      setListaEmpreitadas(emp);
    } catch (error) {
      toastMixin.fire({
        title: "Erro",
        text: "Erro ao buscar empreitadas da ordem de serviço.",
        icon: "error",
      });
    } finally {
      setCarregando(false);
    }
  }, [cacheEmpreitadas]);

  useEffect(() => {
    buscaEmpreitadas();
  }, [buscaEmpreitadas]);

  // Ao selecionar um fornecedor na pesquisa, inicia um rascunho de nova empreitada (A07)
  useEffect(() => {
    if (fornecedorSelecionado.CODIGO > 0) {
      const novaDraft: EmpreitadasModel = {
        EMP_CODIGO: 0,
        EMP_ORD: ordemServico.ORD_CODIGO,
        FOR_NOME: fornecedorSelecionado.NOME,
        EMP_FOR: fornecedorSelecionado.CODIGO,
        EMP_PROTOCOLO: "",
        EMP_NFS: "",
        EMP_LOJA: "",
        EMP_PEDIDO: "",
        EMP_DATA_EMISSAO: formatDataInput(new Date()),
        EMP_COORDENADOR: "",
        EMP_LOCAL_EXECUCAO_SERVICOS: "",
        EMP_OBS: "",
        EMP_VALOR: 0,
        LRC_FAT2: 0,
        EMP_FAT: 0,
        ITENS: [],
        FORNECEDOR: fornecedorSelecionado,
      };

      setEmpreitadaSelecionada(novaDraft);
      setShowModalEmpreitada(true);
      // Reset seleção para permitir selecionar o mesmo ou outro depois
      setFornecedorSelecionado({ CODIGO: 0, NOME: "GENERICO" });
    }
  }, [fornecedorSelecionado, ordemServico.ORD_CODIGO]);

  const selecionaEmpreitada = async (emp: EmpreitadasModel) => {
    if (!emp) return;
    try {
      const repository = new EmpreitadasRepository();
      const repositoryfornecedor = new CliForRepository();
      let detalhe: EmpreitadasModel;

      if (emp.EMP_CODIGO === 0) {
        detalhe = { ...emp };
        if (detalhe.EMP_FOR) {
          try {
            detalhe.FORNECEDOR = await repositoryfornecedor.getCliFor(detalhe.EMP_FOR + 2000000);
          } catch {}
        }
      } else {
        detalhe = await repository.buscaEmpreitadaById(emp.EMP_CODIGO);
        const servicos = await repository.buscaServicosEmpreitadas(detalhe.EMP_CODIGO);
        if (detalhe.EMP_FOR) {
          try {
            detalhe.FORNECEDOR = await repositoryfornecedor.getCliFor(detalhe.EMP_FOR + 2000000);
          } catch {}
        }
        detalhe.ITENS = servicos ?? [];
      }

      setEmpreitadaSelecionada(detalhe);
      setShowModalEmpreitada(true);
    } catch (err: any) {
      toastMixin.fire({
        title: "Erro",
        text: err.message || "Não foi possível carregar a empreitada.",
        icon: "error",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (confirmDelete.codigo > 0) {
      try {
        setIsDeletando(true);
        const repository = new EmpreitadasRepository();
        await repository.deleteEmpreitada(confirmDelete.codigo);
        toastMixin.fire({
          title: "Empreitada Excluída",
          text: `Empreitada #${confirmDelete.codigo} e seus serviços foram excluídos com sucesso.`,
          icon: "success",
          timer: 1500,
        });
        await buscaEmpreitadas();
      } catch (error: any) {
        toastMixin.fire({
          title: "Erro ao excluir",
          text: error.message || "Não foi possível excluir a empreitada.",
          icon: "error",
        });
      } finally {
        setIsDeletando(false);
      }
    }
    setConfirmDelete({ isOpen: false, codigo: 0 });
  };

  if (!ordemServico || !ordemServico.ORD_CODIGO || ordemServico.ORD_CODIGO === 0) {
    return (
      <div className="p-8 text-center text-stone-500 font-sans space-y-2">
        <Building2 className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-stone-800">Orçamento ainda não salvo</h3>
        <p className="text-xs text-stone-500">
          Salve o orçamento primeiro para obter um número de OS antes de gerenciar empreitadas.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full font-sans space-y-4">
      <div className="bg-white rounded-xl border border-stone-200/80 shadow-sm overflow-hidden">
        {/* Header do Card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-stone-200/80 bg-stone-50/90 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-800 tracking-tight">Prestadores e Empreitadas</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 font-mono font-semibold">
                  OS #{ordemServico.ORD_CODIGO}
                </span>
              </div>
              <p className="text-xs text-stone-500 font-normal">
                Cliente: <span className="font-semibold text-stone-700">{ordemServico.CLI_NOME || "Sem cliente"}</span>
                {ordemServico.ORD_NFS ? ` | NF OS: ${ordemServico.ORD_NFS}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowModalPesquisaFornecedor(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Nova Empreitada
          </button>
        </div>

        {/* Tabela de Empreitadas */}
        <div className="overflow-x-auto">
          {carregando ? (
            <div className="flex flex-col items-center justify-center py-12 text-stone-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <span className="text-xs font-medium">Buscando empreitadas cadastradas...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-100/90 text-stone-600 font-bold uppercase text-[11px] border-b border-stone-200 tracking-wider">
                  <th className="p-3">#</th>
                  <th className="p-3">Prestador</th>
                  <th className="p-3">NF Empreitada</th>
                  <th className="p-3">Loja / Pedido</th>
                  <th className="p-3 text-center">Emissão</th>
                  <th className="p-3 text-right">Valor Total</th>
                  <th className="p-3 text-right">Valor Pago</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {listaEmpreitadas.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-xs text-stone-400 space-y-2">
                      <FileText className="w-8 h-8 mx-auto text-stone-300" />
                      <p className="font-medium text-stone-500">Nenhuma empreitada cadastrada para esta OS.</p>
                      <p className="text-[11px] text-stone-400">
                        Clique no botão &quot;Nova Empreitada&quot; acima para adicionar o primeiro prestador.
                      </p>
                    </td>
                  </tr>
                ) : (
                  listaEmpreitadas.map((item) => {
                    const isFaturada = Boolean(item.EMP_FAT && item.EMP_FAT > 0);
                    return (
                      <tr
                        key={item.EMP_CODIGO}
                        onClick={() => selecionaEmpreitada(item)}
                        className="cursor-pointer hover:bg-amber-50/40 transition-colors text-xs text-stone-700 group"
                      >
                        <td className="p-3 font-mono font-bold text-stone-500">#{item.EMP_CODIGO}</td>
                        <td className="p-3 font-medium text-stone-900 flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-500 transition-colors" />
                          <span>{item.FOR_NOME || `Fornecedor #${item.EMP_FOR}`}</span>
                        </td>
                        <td className="p-3 font-mono">
                          {item.EMP_NFS ? (
                            <span className="font-semibold text-stone-800">{item.EMP_NFS}</span>
                          ) : (
                            <span className="text-stone-400">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="text-stone-800">{item.EMP_LOJA || "-"}</span>
                            {item.EMP_PEDIDO && (
                              <span className="text-[11px] text-stone-400">Ped: {item.EMP_PEDIDO}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center text-stone-600">
                          {item.EMP_DATA_EMISSAO ? converterDataFormato(item.EMP_DATA_EMISSAO) : "-"}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-stone-900">
                          {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                            item.EMP_VALOR || 0
                          )}
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-700 font-semibold">
                          {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                            item.VALOR_RECEBIDO || 0
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {isFaturada ? (
                            (item.VALOR_RECEBIDO || 0) >= (item.EMP_VALOR || 0) && (item.EMP_VALOR || 0) > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                                <Check className="w-3 h-3" /> Quitada #{item.EMP_FAT}
                              </span>
                            ) : (item.VALOR_RECEBIDO || 0) > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[11px] font-semibold border border-sky-200">
                                <Coins className="w-3 h-3" /> Parcial #{item.EMP_FAT}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                                <Check className="w-3 h-3" /> Fatura #{item.EMP_FAT}
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-200">
                              Em Aberto
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                selecionaEmpreitada(item);
                              }}
                              className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              title="Editar Empreitada"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              disabled={isFaturada || isDeletando}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDelete({
                                  isOpen: true,
                                  codigo: item.EMP_CODIGO,
                                  nome: item.FOR_NOME,
                                });
                              }}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                              title={isFaturada ? "Empreitada já faturada não pode ser excluída" : "Excluir Empreitada"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Pesquisa de Fornecedor para Nova Empreitada */}
      {showModalPesquisaFornecedor && (
        <PesquisaFornecedor
          fornecedorSelecionado={fornecedorSelecionado}
          setFornecedorSelecionado={setFornecedorSelecionado}
          showModal={showModalPesquisaFornecedor}
          setShowModal={setShowModalPesquisaFornecedor}
        />
      )}

      {/* Modal de Detalhe e Edição da Empreitada */}
      {showModalEmpreitada && (
        <EmpreitadaModal
          empreitadaSelecionada={empreitadaSelecionada}
          setEmpreitadaSelecionada={setEmpreitadaSelecionada}
          ordem={ordemServico}
          fornecedor={
            empreitadaSelecionada?.FORNECEDOR || {
              CODIGO: empreitadaSelecionada?.EMP_FOR || 0,
              NOME: empreitadaSelecionada?.FOR_NOME || "",
            }
          }
          showModal={showModalEmpreitada}
          setShowModal={setShowModalEmpreitada}
          onSaveSuccess={buscaEmpreitadas}
        />
      )}

      {/* Modal de Confirmação de Exclusão Persistida (A10) */}
      <ModalConfirmacao
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, codigo: 0 })}
        onConfirm={handleConfirmDelete}
        title="Excluir Empreitada"
        message={`Tem certeza de que deseja excluir a empreitada #${confirmDelete.codigo} do prestador ${confirmDelete.nome || ""}? Esta ação removerá a empreitada e todos os seus serviços vinculados permanentemente.`}
        type="danger"
        confirmText="Sim, Excluir"
      />
    </div>
  );
}
