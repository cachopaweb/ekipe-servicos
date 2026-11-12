"use client";

import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { Search, X, Loader2, Package, Check } from "lucide-react";
import ProdutoRepository from "../repositories/produto_repository";
import { ProdutoModel } from "../models/produto_model";
import { formatCurrency, toastMixin } from "../functions/utils";

type PesquisaProdutoParams = {
  showModal?: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  produtoSelecionado?: ProdutoModel;
  setProdutoSelecionado: Dispatch<SetStateAction<ProdutoModel>>;
  isOpen?: boolean;
  onClose?: () => void;
};

export default function PesquisaProduto({
  showModal,
  setShowModal,
  setProdutoSelecionado,
  isOpen,
  onClose,
}: PesquisaProdutoParams) {
  const activeIsOpen = isOpen !== undefined ? isOpen : (showModal ?? true);

  const [textoPesquisado, setTextoPesquisado] = useState("");
  const [produtos, setProdutos] = useState<ProdutoModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputBuscaRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setShowModal(false);
    if (onClose) onClose();
  }, [setShowModal, onClose]);

  const buscarProdutoModel = useCallback(async (termo: string) => {
    setLoading(true);
    try {
      const repository = new ProdutoRepository();
      const listaProdutos = await repository.getProdutos(termo);
      setProdutos(listaProdutos || []);
      setSelectedIndex(0);
    } catch (error) {
      toastMixin.fire({
        title: "Erro ao buscar produtos",
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
      buscarProdutoModel(textoPesquisado);
    }, 250);
    return () => clearTimeout(timeout);
  }, [textoPesquisado, activeIsOpen, buscarProdutoModel]);

  const selecionarProduto = useCallback(
    (model: ProdutoModel) => {
      setProdutoSelecionado(model);
      handleClose();
    },
    [setProdutoSelecionado, handleClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, produtos.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && produtos[selectedIndex]) {
        e.preventDefault();
        selecionarProduto(produtos[selectedIndex]);
      }
    },
    [produtos, selectedIndex, selecionarProduto, handleClose]
  );

  if (!activeIsOpen) return null;

  return (
    <div
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/45 outline-none"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-ek-surface rounded-[8px] border border-ek-border overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-ek-border bg-ek-raised shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-1 h-4 bg-brand rounded-full" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-ek-text flex items-center gap-2">
                <Package className="w-4 h-4 text-brand" />
                <span>Pesquisa de produtos</span>
              </h2>
              <p className="text-xs text-ek-muted">
                Navegue com as setas ↑ ↓ e pressione Enter para escolher
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-[6px] flex items-center justify-center text-ek-muted hover:text-ek-text hover:bg-ek-active transition-colors"
            title="Fechar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de Pesquisa */}
        <div className="p-4 border-b border-ek-border bg-ek-surface shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-ek-faint absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={inputBuscaRef}
              type="text"
              value={textoPesquisado}
              onChange={(e) => setTextoPesquisado(e.target.value)}
              placeholder="Digite o código ou nome do produto para pesquisar..."
              className="ek-input pl-9 uppercase"
            />
          </div>
        </div>

        {/* Tabela de Produtos */}
        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-ek-muted gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-brand" />
              <span className="text-xs font-medium">Buscando produtos...</span>
            </div>
          ) : produtos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-ek-muted gap-2">
              <Package className="w-8 h-8 text-ek-faint" />
              <span className="text-sm font-medium text-ek-text">Nenhum produto encontrado.</span>
              <span className="text-xs text-ek-muted">Tente buscar por outro termo ou código.</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-ek-raised text-ek-muted text-xs font-semibold border-b border-ek-border sticky top-0 z-10">
                  <th className="py-2.5 px-4 w-20">Cód.</th>
                  <th className="py-2.5 px-4">Nome / Descrição</th>
                  <th className="py-2.5 px-4 text-center">Quant.</th>
                  <th className="py-2.5 px-4 text-right">Custo</th>
                  <th className="py-2.5 px-4 text-right">Valor venda</th>
                  <th className="py-2.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ek-rule">
                {produtos.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <tr
                      key={item.PRO_CODIGO}
                      onClick={() => selecionarProduto(item)}
                      className={`cursor-pointer transition-colors text-xs ${
                        isSelected ? "bg-brand-soft font-semibold" : "hover:bg-ek-raised/80 text-ek-text"
                      }`}
                    >
                      <td className="p-3 px-4 font-mono font-semibold text-ek-muted tabular-nums">{item.PRO_CODIGO}</td>
                      <td className="p-3 px-4 font-medium text-ek-text">{item.PRO_NOME}</td>
                      <td className="p-3 px-4 text-center font-mono tabular-nums">{item.PRO_QUANTIDADE ?? 0}</td>
                      <td className="p-3 px-4 text-right text-ek-muted tabular-nums">
                        {formatCurrency(Number(item.PRO_VALORC) || 0)}
                      </td>
                      <td className="p-3 px-4 text-right font-semibold text-brand tabular-nums">
                        {formatCurrency(Number(item.PRO_VALORV) || 0)}
                      </td>
                      <td className="p-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-brand-soft text-brand text-xs font-medium border border-brand-border hover:bg-brand/10 transition-colors">
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
        <div className="flex items-center justify-between px-5 py-3 border-t border-ek-border bg-ek-raised shrink-0">
          <span className="text-xs text-ek-muted tabular-nums">
            {produtos.length} {produtos.length === 1 ? "produto encontrado" : "produtos encontrados"}
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
  );
}
