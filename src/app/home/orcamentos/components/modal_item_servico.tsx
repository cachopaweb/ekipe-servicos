"use client";

import { useState, useEffect } from "react";
import OrdSerModel from "@/app/models/ord_ser_model";
import UnidadeMedidaModel from "@/app/models/unidade_med_model";
import { mascaraMoeda, maskRealToNumber, mascaraMoedaEvent } from "@/app/functions/utils";
import { Wrench, X, Save } from "lucide-react";

interface ModalItemServicoProps {
  isOpen: boolean;
  onClose: () => void;
  servico: OrdSerModel | null;
  unidadesMedida: UnidadeMedidaModel[];
  onSave: (servicoAtualizado: OrdSerModel) => void;
}

export default function ModalItemServico({
  isOpen,
  onClose,
  servico,
  unidadesMedida,
  onSave,
}: ModalItemServicoProps) {
  const [nome, setNome] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [unidadeMedida, setUnidadeMedida] = useState("PC");
  const [valorUnitarioStr, setValorUnitarioStr] = useState("0,00");

  useEffect(() => {
    if (servico) {
      setNome(servico.OS_NOME || "");
      const qtd = servico.OS_QUANTIDADE || 1;
      setQuantidade(qtd);
      setUnidadeMedida(servico.OS_UNIDADE_MED || "PC");
      const unitario = qtd > 0 ? (servico.OS_VALOR || 0) / qtd : 0;
      setValorUnitarioStr(mascaraMoeda(unitario));
    }
  }, [servico]);

  if (!isOpen || !servico) return null;

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    const valorUnitario = maskRealToNumber(valorUnitarioStr) || 0;
    const servicoAtualizado: OrdSerModel = {
      ...servico,
      OS_NOME: nome.trim().toUpperCase(),
      OS_QUANTIDADE: quantidade,
      OS_UNIDADE_MED: unidadeMedida,
      OS_VALOR: valorUnitario * quantidade,
    };
    onSave(servicoAtualizado);
  };

  const valorTotalCalculado = (maskRealToNumber(valorUnitarioStr) || 0) * quantidade;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="bg-white w-full max-w-lg rounded-[8px] border border-ek-border shadow-xl overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-ek-rule bg-white">
          <div className="flex items-center gap-2.5">
            <Wrench className="w-4 h-4 text-brand shrink-0" />
            <div>
              <h3 className="text-base font-semibold text-ek-text">
                Editar Serviço
              </h3>
              <p className="text-xs text-ek-muted tabular-nums">
                Código #{servico.OS_CODIGO} · Ref #{servico.OS_SER}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[6px] flex items-center justify-center text-ek-muted hover:text-ek-text hover:bg-ek-raised transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSalvar} className="p-5 space-y-4">
          <div>
            <label className="ek-label">
              Descrição do Serviço
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="ek-input font-medium uppercase"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="ek-label">
                Quantidade
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={quantidade}
                onChange={(e) => setQuantidade(parseFloat(e.target.value) || 0)}
                required
                className="ek-input text-center font-medium"
              />
            </div>

            <div>
              <label className="ek-label">
                Unidade
              </label>
              <select
                value={unidadeMedida}
                onChange={(e) => setUnidadeMedida(e.target.value.toUpperCase())}
                className="ek-select uppercase cursor-pointer"
              >
                {unidadesMedida.map((u) => (
                  <option key={u.UM_UNIDADE} value={u.UM_UNIDADE}>
                    {u.UM_UNIDADE}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="ek-label">
                Valor Unit. (R$)
              </label>
              <input
                type="text"
                value={valorUnitarioStr}
                onChange={(e) => {
                  mascaraMoedaEvent(e);
                  setValorUnitarioStr(e.target.value);
                }}
                required
                className="ek-input text-right font-medium tabular-nums"
              />
            </div>
          </div>

          {/* Subtotal Display */}
          <div className="px-3.5 py-2.5 bg-ek-raised rounded-[6px] flex justify-between items-center border border-ek-border">
            <span className="text-xs font-medium text-ek-muted">
              Subtotal do Serviço
            </span>
            <span className="text-lg font-semibold text-ek-text tabular-nums">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(valorTotalCalculado)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-ek-rule">
            <button
              type="button"
              onClick={onClose}
              className="ek-btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="ek-btn-primary"
            >
              <Save className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
