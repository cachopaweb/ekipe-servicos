"use client";

import { useState, useRef } from "react";
import OrdSerModel from "@/app/models/ord_ser_model";
import UnidadeMedidaModel from "@/app/models/unidade_med_model";
import {
  mascaraMoedaEvent,
  maskRealToNumber,
} from "@/app/functions/utils";
import {
  Plus,
  Edit2,
  Trash2,
  Inbox,
} from "lucide-react";

interface TabServicosProps {
  servicos: OrdSerModel[];
  unidadesMedida: UnidadeMedidaModel[];
  onAdicionarServico: (novoServico: OrdSerModel) => void;
  onEditarServico: (servico: OrdSerModel) => void;
  onExcluirServico: (codigo: number) => void;
}

export default function TabServicos({
  servicos,
  unidadesMedida,
  onAdicionarServico,
  onEditarServico,
  onExcluirServico,
}: TabServicosProps) {
  const [nome, setNome] = useState("");
  const [codRef, setCodRef] = useState(0);
  const [unidade, setUnidade] = useState("PC");
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnitarioStr, setValorUnitarioStr] = useState("");

  const nomeInputRef = useRef<HTMLInputElement>(null);
  const qtdInputRef = useRef<HTMLInputElement>(null);
  const valorInputRef = useRef<HTMLInputElement>(null);

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

    const novo: OrdSerModel = {
      OS_CODIGO: 0,
      OS_SER: codRef,
      OS_NOME: nome.trim().toUpperCase(),
      OS_UNIDADE_MED: unidade,
      OS_QUANTIDADE: quantidade,
      OS_VALOR: valorUnitario * quantidade,
      OS_ORD: 0,
    };

    onAdicionarServico(novo);

    // Limpa os campos para o próximo item
    setNome("");
    setCodRef(0);
    setQuantidade(1);
    setValorUnitarioStr("");
    nomeInputRef.current?.focus();
  };

  const handleNomeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      qtdInputRef.current?.focus();
      qtdInputRef.current?.select();
    }
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
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
            Cód. Ref
          </label>
          <input
            type="number"
            value={codRef || ""}
            onChange={(e) => setCodRef(parseInt(e.target.value) || 0)}
            placeholder="0"
            className="w-full h-10 px-2 text-sm font-bold text-center border border-gray-300 rounded-md focus:border-amber-500 outline-none bg-white"
          />
        </div>

        <div className="sm:col-span-5 lg:col-span-5">
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
            Descrição do Serviço <span className="text-amber-500 font-bold ml-0.5">*</span>
          </label>
          <input
            ref={nomeInputRef}
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={handleNomeKeyDown}
            placeholder="Ex: Instalação de tubulação..."
            className="w-full h-10 px-3 text-sm font-semibold uppercase border border-gray-300 rounded-md focus:border-amber-500 outline-none bg-white"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-2">
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
            Unidade
          </label>
          <select
            value={unidade}
            onChange={(e) => setUnidade(e.target.value.toUpperCase())}
            className="w-full h-10 px-2.5 text-sm font-semibold uppercase border border-gray-300 rounded-md focus:border-amber-500 outline-none bg-white cursor-pointer"
          >
            {unidadesMedida.map((u) => (
              <option key={u.UM_UNIDADE} value={u.UM_UNIDADE}>
                {u.UM_UNIDADE}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-1 lg:col-span-1">
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
            placeholder="0,00"
            className="w-full h-10 px-3 text-sm font-bold text-right border border-gray-300 rounded-md focus:border-amber-500 outline-none bg-white"
          />
        </div>

        <div className="sm:col-span-12 lg:col-span-1">
          <button
            type="submit"
            className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-white rounded-md flex items-center justify-center gap-1.5 text-sm font-bold transition"
            title="Adicionar Serviço (Enter)"
          >
            <Plus className="w-5 h-5" />
            <span className="lg:hidden">Adicionar</span>
          </button>
        </div>
      </form>

      {/* Tabela de Serviços */}
      <div className="overflow-x-auto min-h-[220px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-xs font-bold text-gray-700 uppercase border-b border-gray-200">
              <th className="py-3 px-3 w-12 text-center">#</th>
              <th className="py-3 px-3 w-20 text-center">Cód.</th>
              <th className="py-3 px-4">Descrição do Serviço</th>
              <th className="py-3 px-3 w-20 text-center">UM</th>
              <th className="py-3 px-3 w-24 text-center">Qtd</th>
              <th className="py-3 px-4 w-32 text-right">Valor Unit.</th>
              <th className="py-3 px-4 w-32 text-right">Subtotal</th>
              <th className="py-3 px-3 w-24 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {servicos.length > 0 ? (
              servicos.map((item, index) => {
                const unitario =
                  item.OS_QUANTIDADE > 0
                    ? item.OS_VALOR / item.OS_QUANTIDADE
                    : 0;
                return (
                  <tr
                    key={item.OS_CODIGO || index}
                    className="hover:bg-amber-50/50 transition-colors even:bg-stone-50/60"
                  >
                    <td className="py-3 px-3 text-center text-gray-400 font-mono text-xs">
                      {index + 1}
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-gray-600">
                      {item.OS_SER || "-"}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {item.OS_NOME}
                    </td>
                    <td className="py-3 px-3 text-center uppercase font-medium text-gray-600">
                      {item.OS_UNIDADE_MED}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-gray-900">
                      {item.OS_QUANTIDADE}
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
                      }).format(item.OS_VALOR)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEditarServico(item)}
                          className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-100 rounded transition"
                          title="Editar Serviço"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onExcluirServico(item.OS_CODIGO)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                          title="Remover Serviço"
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
                      Nenhum serviço adicionado nesta ordem.
                    </p>
                    <p className="text-xs text-gray-400">
                      Preencha os campos na barra acima para incluir o primeiro serviço.
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
        <span>Itens cadastrados: {servicos.length}</span>
        <span className="text-base text-gray-900 font-bold">
          Total Serviços:{" "}
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(
            servicos.reduce((acc, curr) => acc + (curr.OS_VALOR || 0), 0)
          )}
        </span>
      </div>
    </div>
  );
}
