"use client";

import { useState, useRef } from "react";
import OrdSerModel from "@/app/models/ord_ser_model";
import UnidadeMedidaModel from "@/app/models/unidade_med_model";
import {
  mascaraMoedaEvent,
  maskRealToNumber,
  formatCurrency,
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
  onExcluirServico: (codigo: number, index?: number) => void;
}

export default function TabServicos({
  servicos,
  unidadesMedida,
  onAdicionarServico,
  onEditarServico,
  onExcluirServico,
  onPickCodRef,
}: TabServicosProps & { onPickCodRef?: () => void }) {
  const [nome, setNome] = useState("");
  const [codRef, setCodRef] = useState(0);
  const [unidade, setUnidade] = useState("PC");
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnitarioStr, setValorUnitarioStr] = useState("");

  const valorUnitario = maskRealToNumber(valorUnitarioStr) || 0;
  const valorTotalCalculado = valorUnitario * (quantidade || 0);

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
    <div className="ek-card overflow-hidden flex flex-col">
      {/* Barra de Inclusão Rápida: Inicia com Descrição do Serviço */}
      <form
        onSubmit={handleSubmit}
        className="p-3.5 bg-ek-raised border-b border-ek-rule grid grid-cols-12 gap-2.5 items-end"
      >
        {/* 1. Descrição do Serviço (Foco Principal) */}
        <div className="col-span-12 md:col-span-4">
          <label className="ek-label">
            Descrição do Serviço <span className="text-red-600">*</span>
          </label>
          <input
            ref={nomeInputRef}
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={handleNomeKeyDown}
            placeholder="Ex: Instalação de tubulação, troca de válvula..."
            className="ek-input font-medium uppercase"
          />
        </div>

        {/* 2. Quantidade */}
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

        {/* 3. Unidade de Medida */}
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

        {/* 4. Valor Unitário */}
        <div className="col-span-4 sm:col-span-6 md:col-span-2">
          <label className="ek-label">
            Valor Unit. (R$) <span className="text-red-600">*</span>
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
            className="ek-input text-right font-medium tabular-nums"
          />
        </div>

        {/* 5. Total (Quantidade × Valor Unitário) */}
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

        {/* 6. Cód. Ref (Secundário/Opcional) */}
        <div className="col-span-3 sm:col-span-3 md:col-span-1">
          <label className="ek-label">
            Ref
          </label>
          <input
            type="number"
            value={codRef || ""}
            onChange={(e) => setCodRef(parseInt(e.target.value) || 0)}
            placeholder="0"
            className="ek-input px-1.5 text-center tabular-nums"
            title="Código de Referência interno (opcional)"
          />
        </div>

        {/* 7. Botão de Inclusão */}
        <div className="col-span-3 sm:col-span-3 md:col-span-1">
          <button
            type="submit"
            className="ek-btn-primary w-full px-0"
            title="Adicionar Serviço (Enter)"
          >
            <Plus className="w-4 h-4" />
            <span className="md:hidden">Adicionar</span>
          </button>
        </div>
      </form>

      {/* Tabela de Serviços */}
      <div className="overflow-x-auto min-h-[220px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white text-xs font-medium text-ek-muted border-b border-ek-border">
              <th className="py-2.5 px-3 w-12 text-center font-medium">#</th>
              <th className="py-2.5 px-3 w-16 text-center font-medium">Ref</th>
              <th className="py-2.5 px-4 font-medium">Descrição do Serviço</th>
              <th className="py-2.5 px-3 w-16 text-center font-medium">UM</th>
              <th className="py-2.5 px-3 w-20 text-center font-medium">Qtd</th>
              <th className="py-2.5 px-4 w-28 text-right font-medium">Valor Unit.</th>
              <th className="py-2.5 px-4 w-32 text-right font-medium">Subtotal</th>
              <th className="py-2.5 px-3 w-24 text-center font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ek-rule text-sm">
            {servicos.length > 0 ? (
              servicos.map((item, index) => {
                const unitario =
                  item.OS_QUANTIDADE > 0
                    ? item.OS_VALOR / item.OS_QUANTIDADE
                    : 0;
                return (
                  <tr
                    key={item.OS_CODIGO || index}
                    className="hover:bg-ek-raised/80 transition-colors"
                  >
                    <td className="py-3 px-3 text-center text-ek-faint text-xs tabular-nums">
                      {index + 1}
                    </td>
                    <td className="py-3 px-3 text-center text-ek-muted tabular-nums text-xs">
                      {item.OS_SER || "-"}
                    </td>
                    <td className="py-3 px-4 font-medium text-ek-text">
                      {item.OS_NOME}
                    </td>
                    <td className="py-3 px-3 text-center uppercase text-ek-muted text-xs">
                      {item.OS_UNIDADE_MED}
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-ek-text tabular-nums">
                      {item.OS_QUANTIDADE}
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
                      }).format(item.OS_VALOR)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditarServico(item)}
                          className="p-1.5 text-ek-muted hover:text-brand hover:bg-brand-soft rounded-[4px] transition-colors"
                          title="Editar Serviço"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onExcluirServico(item.OS_CODIGO, index)}
                          className="p-1.5 text-ek-muted hover:text-red-700 hover:bg-red-50 rounded-[4px] transition-colors"
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
                <td colSpan={8} className="py-12 text-center text-ek-muted">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="w-6 h-6 text-ek-control" />
                    <p className="text-sm font-medium text-ek-text">
                      Nenhum serviço adicionado nesta ordem.
                    </p>
                    <p className="text-xs text-ek-muted">
                      Preencha a descrição, quantidade e valor na barra acima para incluir o serviço.
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
        <span>Itens cadastrados: <strong className="text-ek-text font-semibold tabular-nums">{servicos.length}</strong></span>
        <span className="text-sm text-ek-text font-semibold tabular-nums">
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
