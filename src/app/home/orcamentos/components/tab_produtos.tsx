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
  onExcluirProduto: (codigo: number) => void;
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
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
      {/* Barra de Inclusão Rápida */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-stone-50 border-b border-gray-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
      >
        <div className="sm:col-span-3 lg:col-span-2">
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
            Código (Enter)
          </label>
          <div className="flex gap-1">
            <input
              ref={codInputRef}
              type="text"
              value={codProduto}
              onChange={(e) => setCodProduto(e.target.value)}
              onKeyDown={handleCodKeyDown}
              className="w-full h-10 px-2 text-sm font-bold text-center border border-gray-300 rounded-md focus:border-amber-500 outline-none bg-white"
            />
            <button
              type="button"
              onClick={onOpenPesquisaProduto}
              className="h-10 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-md flex items-center justify-center transition shrink-0"
              title="Buscar Produto"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="sm:col-span-5 lg:col-span-5">
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
            Descrição do Produto <span className="text-amber-500 font-bold ml-0.5">*</span>
          </label>
          <input
            ref={nomeInputRef}
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            disabled={Number(codProduto) !== 1}
            className={`w-full h-10 px-3 text-sm font-semibold uppercase border rounded-md focus:border-amber-500 outline-none ${
              Number(codProduto) !== 1
                ? "bg-gray-100 text-gray-700 border-gray-200"
                : "bg-white border-gray-300"
            }`}
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
            Unidade
          </label>
          <select
            value={unidade}
            onChange={(e) => setUnidade(e.target.value.toUpperCase())}
            className="w-full h-10 px-2 text-sm font-semibold uppercase border border-gray-300 rounded-md focus:border-amber-500 outline-none bg-white cursor-pointer"
          >
            {unidadesMedida.map((u) => (
              <option key={u.UM_UNIDADE} value={u.UM_UNIDADE}>
                {u.UM_UNIDADE}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
            Qtd <span className="text-amber-500 font-bold ml-0.5">*</span>
          </label>
          <input
            ref={qtdInputRef}
            type="number"
            step="0.01"
            min="0.01"
            value={quantidade}
            onChange={(e) => setQuantidade(parseFloat(e.target.value) || 0)}
            onKeyDown={handleQtdKeyDown}
            className="w-full h-10 px-2 text-sm font-bold text-center border border-gray-300 rounded-md focus:border-amber-500 outline-none bg-white"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-2">
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
            Valor Unit. (R$) <span className="text-amber-500 font-bold ml-0.5">*</span>
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
            className="w-full h-10 px-3 text-sm font-bold text-right border border-gray-300 rounded-md focus:border-amber-500 outline-none bg-white"
          />
        </div>

        <div className="sm:col-span-12 lg:col-span-1">
          <button
            type="submit"
            className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-white rounded-md flex items-center justify-center gap-1.5 text-sm font-bold transition"
            title="Adicionar Produto (Enter)"
          >
            <Plus className="w-5 h-5" />
            <span className="lg:hidden">Adicionar</span>
          </button>
        </div>
      </form>

      {/* Tabela de Produtos */}
      <div className="overflow-x-auto min-h-[220px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-xs font-bold text-gray-700 uppercase border-b border-gray-200">
              <th className="py-3 px-3 w-12 text-center">#</th>
              <th className="py-3 px-3 w-20 text-center">Cód.</th>
              <th className="py-3 px-4">Descrição do Produto</th>
              <th className="py-3 px-3 w-20 text-center">UM</th>
              <th className="py-3 px-3 w-24 text-center">Qtd</th>
              <th className="py-3 px-4 w-32 text-right">Valor Unit.</th>
              <th className="py-3 px-4 w-32 text-right">Subtotal</th>
              <th className="py-3 px-3 w-24 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {produtos.length > 0 ? (
              produtos.map((item, index) => {
                const unitario =
                  item.ORE_QUANTIDADE > 0
                    ? item.ORE_VALOR / item.ORE_QUANTIDADE
                    : 0;
                return (
                  <tr
                    key={item.ORE_CODIGO || index}
                    className="hover:bg-amber-50/50 transition-colors even:bg-stone-50/60"
                  >
                    <td className="py-3 px-3 text-center text-gray-400 font-mono text-xs">
                      {index + 1}
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-gray-600">
                      {item.ORE_PRO}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {item.ORE_NOME}
                    </td>
                    <td className="py-3 px-3 text-center uppercase font-medium text-gray-600">
                      {item.ORE_EMBALAGEM}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-gray-900">
                      {item.ORE_QUANTIDADE}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-700">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(unitario)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(item.ORE_VALOR)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEditarProduto(item)}
                          className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-100 rounded transition"
                          title="Editar Produto"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onExcluirProduto(item.ORE_CODIGO)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"
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
                <td colSpan={8} className="py-14 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-3 bg-gray-100 rounded-full text-gray-400">
                      <Inbox className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-semibold text-gray-600">
                      Nenhum produto adicionado nesta ordem.
                    </p>
                    <p className="text-xs text-gray-400">
                      Digite o código ou utilize a busca para adicionar produtos.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Rodapé da tabela com contagem e subtotal */}
      <div className="bg-stone-50 px-4 py-3 border-t border-gray-200 flex justify-between items-center text-sm font-semibold text-gray-700">
        <span>Itens cadastrados: {produtos.length}</span>
        <span className="text-base text-gray-900 font-bold">
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
