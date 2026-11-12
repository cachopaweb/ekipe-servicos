"use client";

import { useState, useEffect, useRef } from "react";
import OrdEstModel from "@/app/models/ord_est_model";
import { ProdutoModel } from "@/app/models/produto_model";
import UnidadeMedidaModel from "@/app/models/unidade_med_model";
import ProdutoRepository from "@/app/repositories/produto_repository";
import {
  mascaraMoeda,
  mascaraMoedaEvent,
  maskRealToNumber,
  formatCurrency,
  toastMixin,
} from "@/app/functions/utils";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Inbox,
} from "lucide-react";

interface TabProdutosProps {
  produtos: OrdEstModel[];
  unidadesMedida: UnidadeMedidaModel[];
  onAdicionarProduto: (novoProduto: OrdEstModel) => void;
  onEditarProduto: (produto: OrdEstModel) => void;
  onExcluirProduto: (codigo: number, index?: number) => void;
  onOpenPesquisaProduto: () => void;
  produtoSelecionado: ProdutoModel;
  setProdutoSelecionado: (p: ProdutoModel) => void;
}

export default function TabProdutos({
  produtos,
  unidadesMedida,
  onAdicionarProduto,
  onEditarProduto,
  onExcluirProduto,
  onOpenPesquisaProduto,
  produtoSelecionado,
  setProdutoSelecionado,
}: TabProdutosProps) {
  const [codProduto, setCodProduto] = useState<number | string>(1);
  const [nome, setNome] = useState("GENERICO");
  const [unidade, setUnidade] = useState("PC");
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnitarioStr, setValorUnitarioStr] = useState("0,00");

  const valorUnitario = maskRealToNumber(valorUnitarioStr) || 0;
  const valorTotalCalculado = valorUnitario * (quantidade || 0);

  const codInputRef = useRef<HTMLInputElement>(null);
  const nomeInputRef = useRef<HTMLInputElement>(null);
  const qtdInputRef = useRef<HTMLInputElement>(null);
  const valorInputRef = useRef<HTMLInputElement>(null);

  // Efeito quando um produto é selecionado via modal de pesquisa
  useEffect(() => {
    if (produtoSelecionado && produtoSelecionado.PRO_CODIGO > 0) {
      setCodProduto(produtoSelecionado.PRO_CODIGO);
      setNome(produtoSelecionado.PRO_NOME || "");
      if (produtoSelecionado.PRO_EMBALAGEM) {
        setUnidade(produtoSelecionado.PRO_EMBALAGEM);
      }
      const valor = produtoSelecionado.PRO_VALORV || 0;
      setValorUnitarioStr(mascaraMoeda(valor));
      qtdInputRef.current?.focus();
      qtdInputRef.current?.select();
    }
  }, [produtoSelecionado]);

  // Busca de produto pelo código digitado (Enter no código)
  const handleCodKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const cod = parseInt(String(codProduto)) || 0;
      if (cod === 0) return;

      try {
        const repo = new ProdutoRepository();
        const res = await repo.getProdutoPorCodigo(cod);
        if (res) {
          setProdutoSelecionado(res);
          setNome(res.PRO_NOME);
          if (res.PRO_EMBALAGEM) setUnidade(res.PRO_EMBALAGEM);
          setValorUnitarioStr(mascaraMoeda(res.PRO_VALORV || 0));
          qtdInputRef.current?.focus();
          qtdInputRef.current?.select();
        } else {
          toastMixin.fire("Atenção", "Produto não encontrado!", "warning");
        }
      } catch (err) {
        toastMixin.fire("Erro", "Falha ao buscar produto: " + String(err), "error");
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const valorUnitario = maskRealToNumber(valorUnitarioStr) || 0;

    if (!nome.trim()) {
      nomeInputRef.current?.focus();
      return;
    }
    if (quantidade <= 0) {
      qtdInputRef.current?.focus();
      return;
    }
    if (valorUnitario <= 0) {
      valorInputRef.current?.focus();
      return;
    }

    const novo: OrdEstModel = {
      ORE_CODIGO: 0,
      ORE_PRO: parseInt(String(codProduto)) || 1,
      ORE_NOME: nome.trim().toUpperCase(),
      ORE_EMBALAGEM: unidade,
      ORE_QUANTIDADE: quantidade,
      ORE_VALOR: valorUnitario * quantidade,
      ORE_ORD: 0,
    };

    onAdicionarProduto(novo);

    // Reseta formulário para GENERICO
    setCodProduto(1);
    setNome("GENERICO");
    setUnidade("PC");
    setQuantidade(1);
    setValorUnitarioStr("0,00");
    codInputRef.current?.focus();
    codInputRef.current?.select();
  };

  const handleQtdKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      valorInputRef.current?.focus();
      valorInputRef.current?.select();
    }
  };

  const handleValorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="ek-card overflow-hidden flex flex-col">
      {/* Barra de Inclusão Rápida */}
      <form
        onSubmit={handleSubmit}
        className="p-3.5 bg-ek-raised border-b border-ek-rule grid grid-cols-12 gap-2.5 items-end"
      >
        {/* 1. Código com Pesquisa */}
        <div className="col-span-4 sm:col-span-3 md:col-span-2">
          <label className="ek-label">
            Código (Enter)
          </label>
          <div className="flex gap-1">
            <input
              ref={codInputRef}
              type="text"
              value={codProduto}
              onChange={(e) => setCodProduto(e.target.value)}
              onKeyDown={handleCodKeyDown}
              className="ek-input px-1.5 text-center font-medium tabular-nums"
            />
            <button
              type="button"
              onClick={onOpenPesquisaProduto}
              className="ek-btn-secondary w-9 px-0 shrink-0"
              title="Buscar Produto no Catálogo"
            >
              <Search className="w-4 h-4 text-brand" />
            </button>
          </div>
        </div>

        {/* 2. Descrição do Produto */}
        <div className="col-span-8 sm:col-span-9 md:col-span-4">
          <label className="ek-label">
            Descrição do Produto <span className="text-red-600">*</span>
          </label>
          <input
            ref={nomeInputRef}
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            disabled={Number(codProduto) !== 1}
            placeholder="Nome do produto..."
            className="ek-input font-medium uppercase"
          />
        </div>

        {/* 3. Quantidade */}
        <div className="col-span-4 sm:col-span-3 md:col-span-1">
          <label className="ek-label">
            Qtd <span className="text-red-600">*</span>
          </label>
          <input
            ref={qtdInputRef}
            type="number"
            step="0.01"
            min="0.01"
            value={quantidade}
            onChange={(e) => setQuantidade(parseFloat(e.target.value) || 0)}
            onKeyDown={handleQtdKeyDown}
            className="ek-input px-1.5 text-center font-medium tabular-nums"
          />
        </div>

        {/* 4. Unidade */}
        <div className="col-span-4 sm:col-span-3 md:col-span-1">
          <label className="ek-label">
            UM
          </label>
          <select
            value={unidade}
            onChange={(e) => setUnidade(e.target.value.toUpperCase())}
            className="ek-select px-1 uppercase text-center cursor-pointer font-medium"
          >
            {unidadesMedida.map((u) => (
              <option key={u.UM_UNIDADE} value={u.UM_UNIDADE}>
                {u.UM_UNIDADE}
              </option>
            ))}
          </select>
        </div>

        {/* 5. Valor Unitário */}
        <div className="col-span-4 sm:col-span-6 md:col-span-1">
          <label className="ek-label">
            Unit. (R$) <span className="text-red-600">*</span>
          </label>
          <input
            ref={valorInputRef}
            type="text"
            value={valorUnitarioStr}
            onChange={(e) => {
              mascaraMoedaEvent(e);
              setValorUnitarioStr(e.target.value);
            }}
            onKeyDown={handleValorKeyDown}
            className="ek-input px-2 text-right font-medium tabular-nums"
          />
        </div>

        {/* 6. Total (Quantidade × Valor Unitário) */}
        <div className="col-span-6 sm:col-span-6 md:col-span-2">
          <label className="ek-label">
            Total (R$)
          </label>
          <input
            type="text"
            readOnly
            tabIndex={-1}
            value={formatCurrency(valorTotalCalculado)}
            placeholder="R$ 0,00"
            className="ek-input bg-white text-ek-text font-semibold text-right tabular-nums cursor-default select-none"
            title="Total = Quantidade × Valor Unitário"
          />
        </div>

        {/* 7. Botão Adicionar */}
        <div className="col-span-6 sm:col-span-6 md:col-span-1">
          <button
            type="submit"
            className="ek-btn-primary w-full px-0"
            title="Adicionar Produto (Enter)"
          >
            <Plus className="w-4 h-4" />
            <span className="md:hidden">Adicionar</span>
          </button>
        </div>
      </form>

      {/* Tabela de Produtos */}
      <div className="overflow-x-auto min-h-[220px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white text-xs font-medium text-ek-muted border-b border-ek-border">
              <th className="py-2.5 px-3 w-12 text-center font-medium">#</th>
              <th className="py-2.5 px-3 w-20 text-center font-medium">Cód.</th>
              <th className="py-2.5 px-4 font-medium">Descrição do Produto</th>
              <th className="py-2.5 px-3 w-16 text-center font-medium">UM</th>
              <th className="py-2.5 px-3 w-20 text-center font-medium">Qtd</th>
              <th className="py-2.5 px-4 w-28 text-right font-medium">Valor Unit.</th>
              <th className="py-2.5 px-4 w-32 text-right font-medium">Subtotal</th>
              <th className="py-2.5 px-3 w-24 text-center font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ek-rule text-sm">
            {produtos.length > 0 ? (
              produtos.map((item, index) => {
                const unitario =
                  item.ORE_QUANTIDADE > 0
                    ? item.ORE_VALOR / item.ORE_QUANTIDADE
                    : 0;
                return (
                  <tr
                    key={item.ORE_CODIGO || index}
                    className="hover:bg-ek-raised/80 transition-colors"
                  >
                    <td className="py-3 px-3 text-center text-ek-faint text-xs tabular-nums">
                      {index + 1}
                    </td>
                    <td className="py-3 px-3 text-center text-ek-muted tabular-nums text-xs">
                      {item.ORE_PRO}
                    </td>
                    <td className="py-3 px-4 font-medium text-ek-text">
                      {item.ORE_NOME}
                    </td>
                    <td className="py-3 px-3 text-center uppercase text-ek-muted text-xs">
                      {item.ORE_EMBALAGEM}
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-ek-text tabular-nums">
                      {item.ORE_QUANTIDADE}
                    </td>
                    <td className="py-3 px-4 text-right text-ek-muted tabular-nums">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(unitario)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-ek-text tabular-nums">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(item.ORE_VALOR)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditarProduto(item)}
                          className="p-1.5 text-ek-muted hover:text-brand hover:bg-brand-soft rounded-[4px] transition-colors"
                          title="Editar Produto"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onExcluirProduto(item.ORE_CODIGO, index)}
                          className="p-1.5 text-ek-muted hover:text-red-700 hover:bg-red-50 rounded-[4px] transition-colors"
                          title="Remover Produto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-12 text-center text-ek-muted">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="w-6 h-6 text-ek-control" />
                    <p className="text-sm font-medium text-ek-text">
                      Nenhum produto adicionado nesta ordem.
                    </p>
                    <p className="text-xs text-ek-muted">
                      Digite o código ou utilize a busca para adicionar produtos ao orçamento.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Rodapé da tabela com contagem e subtotal */}
      <div className="bg-ek-raised px-4 py-2.5 border-t border-ek-rule flex justify-between items-center text-xs font-medium text-ek-muted">
        <span>Itens cadastrados: <strong className="text-ek-text font-semibold tabular-nums">{produtos.length}</strong></span>
        <span className="text-sm text-ek-text font-semibold tabular-nums">
          Total Produtos:{" "}
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(
            produtos.reduce((acc, curr) => acc + (curr.ORE_VALOR || 0), 0)
          )}
        </span>
      </div>
    </div>
  );
}
