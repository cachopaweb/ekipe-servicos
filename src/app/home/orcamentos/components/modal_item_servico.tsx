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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-lg rounded-xl border border-gray-300 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-md">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Editar Serviço
              </h3>
              <p className="text-xs text-gray-500">
                Código: #{servico.OS_CODIGO} | Ref: #{servico.OS_SER}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSalvar} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Descrição do Serviço
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="w-full h-10 px-3 text-sm font-semibold border border-gray-300 rounded-md focus:border-amber-500 uppercase outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Quantidade
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={quantidade}
                onChange={(e) => setQuantidade(parseFloat(e.target.value) || 0)}
                required
                className="w-full h-10 px-3 text-sm font-bold border border-gray-300 rounded-md focus:border-amber-500 outline-none text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Unidade
              </label>
              <select
                value={unidadeMedida}
                onChange={(e) => setUnidadeMedida(e.target.value.toUpperCase())}
                className="w-full h-10 px-3 text-sm font-semibold border border-gray-300 rounded-md focus:border-amber-500 outline-none uppercase bg-white cursor-pointer"
              >
                {unidadesMedida.map((u) => (
                  <option key={u.UM_UNIDADE} value={u.UM_UNIDADE}>
                    {u.UM_UNIDADE}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
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
                className="w-full h-10 px-3 text-sm font-bold border border-gray-300 rounded-md focus:border-amber-500 outline-none text-right"
              />
            </div>
          </div>

          {/* Subtotal Display */}
          <div className="p-3.5 bg-amber-50 rounded-md flex justify-between items-center border border-amber-200">
            <span className="text-xs font-bold text-amber-900 uppercase">
              Subtotal do Serviço
            </span>
            <span className="text-xl font-black text-amber-900">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(valorTotalCalculado)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-md transition flex items-center gap-2"
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
