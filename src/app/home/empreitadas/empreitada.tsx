"use client";

import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  Save,
  Edit2,
  Trash2,
  Printer,
  DollarSign,
  Plus,
  Wrench,
  Building2,
  Loader2,
  Calendar,
  Hash,
  FileText,
  Store,
  UserCheck,
  MapPin,
  RefreshCw,
  Coins,
  CheckCircle2,
  Ban,
  Clock,
  History,
  AlertCircle,
} from "lucide-react";
import {
  converterDataFormato,
  FormatDate,
  formatDataInput,
  GeraCodigo,
  mascaraMoeda,
  mascaraMoedaEvent,
  maskRealToNumber,
  toastMixin,
} from "@/app/functions/utils";
import Modal from "@/components/component/modal";
import ModalConfirmacao from "@/app/home/orcamentos/components/modal_confirmacao";
import UnidadeMedidaModel from "@/app/models/unidade_med_model";
import EmpreitadasServicosModel from "@/app/models/empreitada_servicos_model";
import EmpreitadasModel from "@/app/models/empreitadas_model";
import OrdemModel from "@/app/models/ordem_model";
import OrdSerModel from "@/app/models/ord_ser_model";
import CliForModel from "@/app/models/cli_for_model";
import UnidadeMedidaRepository from "@/app/repositories/unidade_med_repository";
import EmpreitadasRepository from "@/app/repositories/empreitadas_repository";
import PagamentosRepository from "@/app/repositories/pagamentos_repository";
import OrdemRepository from "@/app/repositories/ordem_repository";
import UsuarioRepository from "@/app/repositories/usuario_repository";
import { PagamentoEmpreitadaItem } from "@/app/models/pagamentos_model";
import Faturamentos from "@/app/faturamentos/page";
import OperacaoEmpreitadas from "@/app/faturamentos/implementations/operacao_empreitadas";
import PrintEmpreitadas from "@/app/print/empreitadas/page";

function aplicarMascaraData(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4, 8)}`;
}

function obterOpcoesUnidades(
  unidadesMedida: UnidadeMedidaModel[],
  unidadeAtual: string
): string[] {
  const padroes = ["UN", "PC", "M", "M2", "M3", "KG", "HR", "SV", "CJ", "LT"];
  const vindasDoBanco = (unidadesMedida || [])
    .map((u) => (u.UM_UNIDADE || "").trim().toUpperCase())
    .filter(Boolean);
  const base = vindasDoBanco.length > 0 ? vindasDoBanco : padroes;
  const atualLimpa = (unidadeAtual || "").trim().toUpperCase();
  const unicas = Array.from(new Set(atualLimpa ? [atualLimpa, ...base] : base));
  return unicas;
}

interface EmpreitadaProps {
  empreitadaSelecionada: EmpreitadasModel | undefined;
  setEmpreitadaSelecionada: Dispatch<SetStateAction<EmpreitadasModel | undefined>>;
  ordem: OrdemModel;
  fornecedor: CliForModel;
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  onSaveSuccess?: () => void;
}

interface ModalEdtEmpreitadaProps {
  isOpen: boolean;
  onClose: () => void;
  servico: EmpreitadasServicosModel;
  unidadesMedida: UnidadeMedidaModel[];
  onSave: (servicoAtualizado: EmpreitadasServicosModel) => void;
}

function ModalEdtEmpreitada({
  isOpen,
  onClose,
  servico,
  unidadesMedida,
  onSave,
}: ModalEdtEmpreitadaProps) {
  const [descricao, setDescricao] = useState("");
  const [osQuantidadeStr, setOsQuantidadeStr] = useState("1");
  const [osUnidadeMedida, setOsUnidadeMedida] = useState("UN");
  const [osValorStr, setOsValorStr] = useState(mascaraMoeda(0));
  const [prazo, setPrazo] = useState("");
  const loadedKeyRef = useRef<string>("");

  useEffect(() => {
    if (!isOpen) {
      loadedKeyRef.current = "";
      return;
    }
    const key = `${servico?.ES_CODIGO ?? 0}`;
    if (servico && loadedKeyRef.current !== key) {
      loadedKeyRef.current = key;
      setDescricao(servico.DESCRICAO || "");
      const qtd = Number(servico.ES_QUANTIDADE) > 0 ? Number(servico.ES_QUANTIDADE) : 1;
      setOsQuantidadeStr(String(qtd));
      const defaultUm = (
        servico.ES_UNIDADE ||
        unidadesMedida[0]?.UM_UNIDADE ||
        "UN"
      )
        .trim()
        .toUpperCase();
      setOsUnidadeMedida(defaultUm || "UN");
      const unitario =
        servico.VLR_UNIT ?? (qtd > 0 ? (servico.ES_VALOR || 0) / qtd : 0);
      setOsValorStr(mascaraMoeda(unitario));
      setPrazo(
        servico.ES_PRAZO_CONCLUSAO
          ? converterDataFormato(servico.ES_PRAZO_CONCLUSAO)
          : converterDataFormato(new Date())
      );
    }
  }, [servico, isOpen, unidadesMedida]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const osQuantidadeNum = parseFloat(String(osQuantidadeStr).replace(",", ".")) || 0;
  const valorUnitario = maskRealToNumber(osValorStr) || 0;
  const valorTotalCalculado = valorUnitario * (osQuantidadeNum > 0 ? osQuantidadeNum : 0);
  const opcoesUnidades = obterOpcoesUnidades(unidadesMedida, osUnidadeMedida);

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      toastMixin.fire({
        title: "Atenção",
        text: "Informe a descrição do serviço.",
        icon: "warning",
      });
      return;
    }
    if (osQuantidadeNum <= 0) {
      toastMixin.fire({
        title: "Atenção",
        text: "A quantidade deve ser maior que zero.",
        icon: "warning",
      });
      return;
    }
    const servicoAtualizado: EmpreitadasServicosModel = {
      ...servico,
      DESCRICAO: descricao.trim().toUpperCase(),
      ES_QUANTIDADE: osQuantidadeNum,
      ES_UNIDADE: (osUnidadeMedida || "UN").trim().toUpperCase(),
      ES_PRAZO_CONCLUSAO: prazo.trim() || converterDataFormato(new Date()),
      VLR_UNIT: valorUnitario,
      ES_VALOR: valorTotalCalculado,
    };
    onSave(servicoAtualizado);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-sm animate-fade-in outline-none">
      <div className="relative w-full max-w-lg flex flex-col bg-white rounded-2xl shadow-2xl border border-stone-200/80 overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/80 bg-stone-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-800 tracking-tight">Editar Serviço</h3>
              <p className="text-xs text-stone-500 font-normal">Código: #{servico.ES_CODIGO}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSalvar} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
              Descrição do Serviço
            </label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
              placeholder="Informe a descrição do serviço"
              className="w-full px-3 py-2 text-sm text-stone-900 bg-stone-50 border border-stone-300 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                Quantidade
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                value={osQuantidadeStr}
                onChange={(e) => setOsQuantidadeStr(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm font-semibold text-stone-900 bg-stone-50 border border-stone-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                Unidade
              </label>
              <select
                value={osUnidadeMedida}
                onChange={(e) => setOsUnidadeMedida(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-sm text-stone-900 bg-stone-50 border border-stone-300 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
              >
                {opcoesUnidades.map((um) => (
                  <option key={um} value={um}>
                    {um}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                Valor Unit. (R$)
              </label>
              <input
                type="text"
                value={osValorStr}
                onChange={(e) => {
                  mascaraMoedaEvent(e);
                  setOsValorStr(e.target.value);
                }}
                required
                className="w-full px-3 py-2 text-sm font-semibold text-stone-900 bg-stone-50 border border-stone-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
              Prazo de Conclusão
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="DD/MM/AAAA"
              value={prazo}
              onChange={(e) => setPrazo(aplicarMascaraData(e.target.value))}
              className="w-full px-3 py-2 text-sm text-stone-900 bg-stone-50 border border-stone-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
            />
          </div>

          {/* Subtotal Display */}
          <div className="p-3.5 bg-amber-50/80 rounded-xl flex justify-between items-center border border-amber-200/80">
            <span className="text-xs font-bold text-amber-900 uppercase">Subtotal do Serviço</span>
            <span className="text-lg font-black text-amber-900">
              {Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(valorTotalCalculado)}
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg shadow-sm transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm transition active:scale-[0.98]"
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

interface ModalServicosProps {
  isOpen: boolean;
  onClose: () => void;
  unidadesMedida: UnidadeMedidaModel[];
  ordem?: OrdemModel;
  onSave: (novoServico: EmpreitadasServicosModel) => void;
}

function ModalServicos({
  isOpen,
  onClose,
  unidadesMedida,
  ordem,
  onSave,
}: ModalServicosProps) {
  const [servicoSelecionadoCod, setServicoSelecionadoCod] = useState<string>("");
  const [descricao, setDescricao] = useState("");
  const [quantidadeStr, setQuantidadeStr] = useState("1");
  const [unidadeMedida, setUnidadeMedida] = useState("UN");
  const [valorUnitarioStr, setValorUnitarioStr] = useState(mascaraMoeda(0));
  const [prazo, setPrazo] = useState(converterDataFormato(new Date()));
  const [servicosDisponiveis, setServicosDisponiveis] = useState<OrdSerModel[]>([]);
  const wasOpenRef = useRef(false);

  // Reseta os campos do formulário APENAS quando o modal abre (transição fechado -> aberto)
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setServicoSelecionadoCod("");
      setDescricao("");
      setQuantidadeStr("1");
      const defaultUm = (unidadesMedida[0]?.UM_UNIDADE || "UN").trim().toUpperCase();
      setUnidadeMedida(defaultUm || "UN");
      setValorUnitarioStr(mascaraMoeda(0));
      setPrazo(converterDataFormato(new Date()));
    } else if (!isOpen && wasOpenRef.current) {
      wasOpenRef.current = false;
    }
  }, [isOpen, unidadesMedida]);

  // Carrega a lista de serviços da OS sem interferir nos campos digitados pelo usuário
  useEffect(() => {
    if (!isOpen) return;
    if (ordem?.itensOrdSer && ordem.itensOrdSer.length > 0) {
      setServicosDisponiveis(ordem.itensOrdSer);
    } else if (ordem?.ORD_CODIGO && ordem.ORD_CODIGO > 0) {
      const rep = new OrdemRepository();
      rep
        .buscaServicosOrdem(ordem.ORD_CODIGO)
        .then((res) => setServicosDisponiveis(Array.isArray(res) ? res : []))
        .catch(() => setServicosDisponiveis([]));
    } else {
      setServicosDisponiveis([]);
    }
  }, [isOpen, ordem?.ORD_CODIGO, ordem?.itensOrdSer]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quantidadeNum = parseFloat(String(quantidadeStr).replace(",", ".")) || 0;
  const valorUnitario = maskRealToNumber(valorUnitarioStr) || 0;
  const valorTotalCalc = valorUnitario * (quantidadeNum > 0 ? quantidadeNum : 0);
  const opcoesUnidades = obterOpcoesUnidades(unidadesMedida, unidadeMedida);

  const handleSelecionarServicoOS = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setServicoSelecionadoCod(val);
    if (!val) return;
    const idxOrCod = Number(val);
    const servOs = servicosDisponiveis.find(
      (s, idx) => Number(s.OS_CODIGO) === idxOrCod || idx === idxOrCod
    );
    if (servOs) {
      setDescricao((servOs.OS_NOME || "").trim().toUpperCase());
      const qtd = Number(servOs.OS_QUANTIDADE) > 0 ? Number(servOs.OS_QUANTIDADE) : 1;
      setQuantidadeStr(String(qtd));
      const um = (servOs.OS_UNIDADE_MED || "").trim().toUpperCase();
      if (um) {
        setUnidadeMedida(um);
      }
      const valorTotalOs = Number(servOs.OS_VALOR) || 0;
      const unit = qtd > 0 ? valorTotalOs / qtd : valorTotalOs;
      setValorUnitarioStr(mascaraMoeda(unit));
    }
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      toastMixin.fire({
        title: "Atenção",
        text: "Informe a descrição do serviço.",
        icon: "warning",
      });
      return;
    }
    if (quantidadeNum <= 0) {
      toastMixin.fire({
        title: "Atenção",
        text: "A quantidade deve ser maior que zero.",
        icon: "warning",
      });
      return;
    }
    const tempId = -Date.now() - Math.floor(Math.random() * 10000);
    const novoServico: EmpreitadasServicosModel = {
      ES_CODIGO: tempId,
      isNovo: true,
      DESCRICAO: descricao.trim().toUpperCase(),
      ES_EMP: 0,
      ES_PRAZO_CONCLUSAO: prazo.trim() || converterDataFormato(new Date()),
      ES_QUANTIDADE: quantidadeNum,
      ES_UNIDADE: (unidadeMedida || "UN").trim().toUpperCase(),
      VLR_UNIT: valorUnitario,
      ES_VALOR: valorTotalCalc,
    };
    onSave(novoServico);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-sm animate-fade-in outline-none">
      <div className="relative w-full max-w-lg flex flex-col bg-white rounded-2xl shadow-2xl border border-stone-200/80 overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/80 bg-stone-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-800 tracking-tight">Adicionar Serviço</h3>
              <p className="text-xs text-stone-500 font-normal">Novo item para esta empreitada</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSalvar} className="p-6 space-y-4">
          {servicosDisponiveis.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                Selecionar Serviço Cadastrado na OS (opcional)
              </label>
              <select
                value={servicoSelecionadoCod}
                onChange={handleSelecionarServicoOS}
                className="w-full px-3 py-2 text-sm text-stone-900 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
              >
                <option value="">-- Selecione um serviço cadastrado ou digite abaixo --</option>
                {servicosDisponiveis.map((s, idx) => {
                  const valOption = s.OS_CODIGO ? String(s.OS_CODIGO) : String(idx);
                  return (
                    <option key={`${valOption}_${idx}`} value={valOption}>
                      {s.OS_NOME} ({s.OS_QUANTIDADE} {s.OS_UNIDADE_MED} - {mascaraMoeda(s.OS_VALOR)})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
              Descrição do Serviço (Texto / Cadastro)
            </label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
              placeholder="Informe a descrição do serviço"
              autoFocus
              className="w-full px-3 py-2 text-sm text-stone-900 bg-stone-50 border border-stone-300 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                Quantidade
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                value={quantidadeStr}
                onChange={(e) => setQuantidadeStr(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm font-semibold text-stone-900 bg-stone-50 border border-stone-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                Unidade
              </label>
              <select
                value={unidadeMedida}
                onChange={(e) => setUnidadeMedida(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-sm text-stone-900 bg-stone-50 border border-stone-300 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
              >
                {opcoesUnidades.map((um) => (
                  <option key={um} value={um}>
                    {um}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
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
                className="w-full px-3 py-2 text-sm font-semibold text-stone-900 bg-stone-50 border border-stone-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
              Prazo de Conclusão
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="DD/MM/AAAA"
              value={prazo}
              onChange={(e) => setPrazo(aplicarMascaraData(e.target.value))}
              className="w-full px-3 py-2 text-sm text-stone-900 bg-stone-50 border border-stone-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
            />
          </div>

          {/* Subtotal Display */}
          <div className="p-3.5 bg-amber-50/80 rounded-xl flex justify-between items-center border border-amber-200/80">
            <span className="text-xs font-bold text-amber-900 uppercase">Subtotal do Serviço</span>
            <span className="text-lg font-black text-amber-900">
              {Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(valorTotalCalc)}
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg shadow-sm transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm transition active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              Salvar Serviço
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


interface ModalRegistrarPagamentoProps {
  isOpen: boolean;
  onClose: () => void;
  saldoRestante: number;
  onConfirm: (dados: {
    valor: number;
    data: string;
    formaPgm: string;
    duplicata: string;
    obs: string;
  }) => void;
  isLoading: boolean;
}

function ModalRegistrarPagamento({
  isOpen,
  onClose,
  saldoRestante,
  onConfirm,
  isLoading,
}: ModalRegistrarPagamentoProps) {
  const [valorStr, setValorStr] = useState("0,00");
  const [dataPgm, setDataPgm] = useState(converterDataFormato(new Date()));
  const [formaPgm, setFormaPgm] = useState("PIX");
  const [duplicata, setDuplicata] = useState("");
  const [obs, setObs] = useState("");
  const wasOpenPgmRef = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpenPgmRef.current) {
      wasOpenPgmRef.current = true;
      const defaultVal = saldoRestante > 0 ? saldoRestante : 0;
      setValorStr(mascaraMoeda(defaultVal));
      setDataPgm(converterDataFormato(new Date()));
      setFormaPgm("PIX");
      setDuplicata("");
      setObs("");
    } else if (!isOpen && wasOpenPgmRef.current) {
      wasOpenPgmRef.current = false;
    }
  }, [isOpen, saldoRestante]);

  if (!isOpen) return null;

  const valorNum = maskRealToNumber(valorStr) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (valorNum <= 0) {
      toastMixin.fire({
        title: "Atenção",
        text: "O valor do pagamento deve ser maior que zero.",
        icon: "warning",
      });
      return;
    }
    onConfirm({
      valor: valorNum,
      data: dataPgm,
      formaPgm,
      duplicata: duplicata.trim(),
      obs: obs.trim(),
    });
  };

  return (
    <div
      tabIndex={-1}
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-sm animate-fade-in outline-none"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden font-sans">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-stone-800">Registrar Pagamento / Baixa</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase">Saldo Restante da Empreitada:</span>
            <span className="text-base font-bold text-amber-900 font-mono">
              {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(saldoRestante)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Valor da Parcela (R$) *
              </label>
              <input
                type="text"
                value={valorStr}
                required
                onChange={(e) => {
                  mascaraMoedaEvent(e);
                  setValorStr(e.target.value);
                }}
                className="w-full px-3 py-2 text-sm font-semibold bg-stone-50 border border-stone-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
              />
              {saldoRestante > 0 && valorNum !== saldoRestante && (
                <button
                  type="button"
                  onClick={() => setValorStr(mascaraMoeda(saldoRestante))}
                  className="mt-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1"
                >
                  Usar saldo total ({mascaraMoeda(saldoRestante)})
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Data do Pagamento *
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={dataPgm}
                onChange={(e) => setDataPgm(aplicarMascaraData(e.target.value))}
                placeholder="DD/MM/AAAA"
                className="w-full px-3 py-2 text-sm text-stone-900 bg-stone-50 border border-stone-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Forma de Pagamento
              </label>
              <select
                value={formaPgm}
                onChange={(e) => setFormaPgm(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
              >
                <option value="PIX">PIX</option>
                <option value="DINHEIRO">DINHEIRO</option>
                <option value="TRANSFERÊNCIA">TRANSFERÊNCIA</option>
                <option value="BOLETO">BOLETO</option>
                <option value="CHEQUE">CHEQUE</option>
                <option value="CARTÃO DE CRÉDITO">CARTÃO DE CRÉDITO</option>
                <option value="CARTÃO DE DÉBITO">CARTÃO DE DÉBITO</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Identificação / Parcela
              </label>
              <input
                type="text"
                value={duplicata}
                onChange={(e) => setDuplicata(e.target.value)}
                placeholder="Ex: Entrada, 1ª Parcela"
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
              Observações do Pagamento
            </label>
            <input
              type="text"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Opcional: comprovante, banco, detalhes da baixa"
              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
            />
          </div>

          {valorNum > saldoRestante && saldoRestante > 0 && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                Atenção: O valor informado é maior que o saldo restante da empreitada.
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar Pagamento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ModalEstornoPagamentoProps {
  isOpen: boolean;
  onClose: () => void;
  pagamento: PagamentoEmpreitadaItem | null;
  onConfirm: (motivo: string) => void;
  isLoading: boolean;
}

function ModalEstornoPagamento({
  isOpen,
  onClose,
  pagamento,
  onConfirm,
  isLoading,
}: ModalEstornoPagamentoProps) {
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    if (isOpen) {
      setMotivo("");
    }
  }, [isOpen]);

  if (!isOpen || !pagamento) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) {
      toastMixin.fire({
        title: "Atenção",
        text: "Por favor, informe a justificativa do estorno.",
        icon: "warning",
      });
      return;
    }
    onConfirm(motivo.trim());
  };

  return (
    <div
      tabIndex={-1}
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-sm animate-fade-in outline-none"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden font-sans">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-rose-50">
          <div className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-rose-600" />
            <h3 className="text-base font-bold text-rose-900">Estornar Pagamento #{pagamento.PAG_CODIGO}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-stone-500">Valor da baixa:</span>
              <span className="font-bold font-mono text-stone-800">
                {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pagamento.PAG_VALOR)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Data registrada:</span>
              <span className="font-mono text-stone-700">
                {pagamento.PP_DATAPGM ? formatDataInput(pagamento.PP_DATAPGM) : formatDataInput(pagamento.PAG_VENCIMENTO)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Identificação:</span>
              <span className="text-stone-700">{pagamento.PAG_DUPLICATA || "Baixa avulsa"}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
              Justificativa / Motivo do Estorno *
            </label>
            <textarea
              rows={3}
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Pagamento cancelado pelo financeiro, valor incorreto..."
              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Estornando...
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4" />
                  Confirmar Estorno
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EmpreitadaModal({
  empreitadaSelecionada,
  setEmpreitadaSelecionada,
  ordem,
  fornecedor,
  showModal,
  setShowModal,
  onSaveSuccess,
}: EmpreitadaProps) {
  const [empreitada, setEmpreitada] = useState<EmpreitadasModel | undefined>(empreitadaSelecionada);

  // Campos do formulário
  const [nfs, setNfs] = useState<string>("");
  const [loja, setLoja] = useState<string>("");
  const [pedido, setPedido] = useState<string>("");
  const [dataEmissao, setDataEmissao] = useState<string>(formatDataInput(new Date()));
  const [coordenador, setCoordenador] = useState<string>("");
  const [localExecucao, setLocalExecucao] = useState<string>("");
  const [obsEmpreitadas, setObsEmpreitadas] = useState<string>("");
  const [valorNfStr, setValorNfStr] = useState<string>("0,00");
  const [itens, setItens] = useState<EmpreitadasServicosModel[]>([]);
  const [servicosParaExcluir, setServicosParaExcluir] = useState<number[]>([]);

  // Submodais e controles
  const [empreitadaServicoEdt, setEmpreitadaServicoEdt] = useState<EmpreitadasServicosModel>({
    DESCRICAO: "",
    ES_CODIGO: 0,
    ES_EMP: 0,
  });
  const [showModalServicos, setShowModalServicos] = useState(false);
  const [showModalEdtServicoEmpreitada, setShowModalEdtServicoEmpreitada] = useState(false);
  const [listaUnidadesMed, setListaUnidadesMed] = useState<UnidadeMedidaModel[]>([]);
  const [listaCoordenadores, setListaCoordenadores] = useState<string[]>([]);
  const [showFaturamento, setShowFaturamento] = useState(false);
  const [foiFaturado, setFoiFaturado] = useState(false);
  const [showModalImprimirEmpreitadas, setShowModalImprimirEmpreitadas] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [isSalvando, setIsSalvando] = useState(false);
  // Pagamentos parciais e histórico (E05 / R02)
  const [pagamentos, setPagamentos] = useState<PagamentoEmpreitadaItem[]>([]);
  const [carregandoPagamentos, setCarregandoPagamentos] = useState(false);
  const [showModalRegistrarPagamento, setShowModalRegistrarPagamento] = useState(false);
  const [showModalEstorno, setShowModalEstorno] = useState(false);
  const [pagamentoParaEstornar, setPagamentoParaEstornar] = useState<PagamentoEmpreitadaItem | null>(null);
  const [isRegistrandoPagamento, setIsRegistrandoPagamento] = useState(false);
  const [isEstornando, setIsEstornando] = useState(false);


  // Confirmação de exclusão de serviço
  const [confirmDeleteServico, setConfirmDeleteServico] = useState<{
    isOpen: boolean;
    index: number;
    codigo: number;
    descricao?: string;
  }>({
    isOpen: false,
    index: -1,
    codigo: 0,
  });

  // Confirmação de descarte de alterações (E02 / A09)
  const [showConfirmDescartar, setShowConfirmDescartar] = useState(false);
  const snapshotRef = useRef<string>("");

  const makeSnapshot = useCallback(
    (
      _nfs: string,
      _loja: string,
      _pedido: string,
      _dataEmissao: string,
      _coordenador: string,
      _local: string,
      _obs: string,
      _valorStr: string,
      _itens: EmpreitadasServicosModel[]
    ) => {
      return JSON.stringify({
        nfs: (_nfs || "").trim(),
        loja: (_loja || "").trim(),
        pedido: (_pedido || "").trim(),
        dataEmissao: (_dataEmissao || "").trim(),
        coordenador: (_coordenador || "").trim(),
        local: (_local || "").trim(),
        obs: (_obs || "").trim(),
        valor: maskRealToNumber(_valorStr) || 0,
        itens: (_itens || []).map((it) => ({
          desc: (it.DESCRICAO || "").trim(),
          qtd: it.ES_QUANTIDADE || 1,
          um: it.ES_UNIDADE || "UN",
          vlr: it.ES_VALOR || 0,
          prazo: it.ES_PRAZO_CONCLUSAO || "",
        })),
      });
    },
    []
  );

  const carregaUnidadesMed = useCallback(async () => {
    try {
      const repository = new UnidadeMedidaRepository();
      const unidades = await repository.getUnidadeMedidas();
      setListaUnidadesMed(unidades);
    } catch (error) {
      toastMixin.fire({
        title: "Erro",
        text: String(error),
        icon: "error",
      });
    }
    try {
      const usuRep = new UsuarioRepository();
      const users = await usuRep.getUsers();
      const list = Array.isArray(users)
        ? users
        : users && typeof users === "object" && Object.keys(users).length > 0
        ? [users]
        : [];
      const nomes = Array.from(
        new Set(
          list
            .map((u: any) => String(u.FUN_NOME || "").trim().toUpperCase())
            .filter(Boolean)
        )
      );
      setListaCoordenadores(nomes);
    } catch {
      // Silencioso caso não consiga carregar lista de funcionários
    }
  }, []);


  const carregaPagamentos = useCallback(async (fat2?: number | null) => {
    if (!fat2 || fat2 <= 0) {
      setPagamentos([]);
      return;
    }
    setCarregandoPagamentos(true);
    try {
      const repPag = new PagamentosRepository();
      const dados = await repPag.buscaPagamentosEmpreitada(fat2);
      setPagamentos(dados);
    } catch (err) {
      console.error("Erro ao carregar pagamentos da empreitada:", err);
    } finally {
      setCarregandoPagamentos(false);
    }
  }, []);

  const handleRegistrarPagamento = async (dados: {
    valor: number;
    data: string;
    formaPgm: string;
    duplicata: string;
    obs: string;
  }) => {
    if (!empreitada || empreitada.EMP_CODIGO === 0) return;
    setIsRegistrandoPagamento(true);
    try {
      const repPag = new PagamentosRepository();
      const repEmp = new EmpreitadasRepository();
      const idempotencyKey = `emp_${empreitada.EMP_CODIGO}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      const res = await repPag.registrarPagamentoEmpreitada({
        empCodigo: empreitada.EMP_CODIGO,
        ordCodigo: ordem.ORD_CODIGO,
        empFat: empreitada.EMP_FAT,
        empFor: empreitada.EMP_FOR || fornecedor.CODIGO,
        valor: dados.valor,
        data: dados.data,
        formaPgm: dados.formaPgm,
        duplicata: dados.duplicata,
        obs: dados.obs,
        idempotencyKey,
      });

      if (res.success) {
        toastMixin.fire({
          title: "Sucesso!",
          text: res.isDuplicate
            ? "Pagamento já havia sido registrado anteriormente."
            : "Pagamento registrado com sucesso!",
          icon: "success",
        });
        const updatedEmp = await repEmp.buscaEmpreitadaById(empreitada.EMP_CODIGO);
        if (updatedEmp) {
          setEmpreitada(updatedEmp);
          setEmpreitadaSelecionada(updatedEmp);
        }
        await carregaPagamentos(res.codFat);
        setShowModalRegistrarPagamento(false);
        onSaveSuccess?.();
      }
    } catch (err) {
      toastMixin.fire({
        title: "Erro ao registrar pagamento",
        text: String(err),
        icon: "error",
      });
    } finally {
      setIsRegistrandoPagamento(false);
    }
  };

  const handleConfirmEstorno = async (motivo: string) => {
    if (!pagamentoParaEstornar) return;
    setIsEstornando(true);
    try {
      const repPag = new PagamentosRepository();
      const repEmp = new EmpreitadasRepository();
      await repPag.estornarPagamentoEmpreitada({
        codPag: pagamentoParaEstornar.PAG_CODIGO,
        motivo,
      });
      toastMixin.fire({
        title: "Sucesso!",
        text: "Pagamento estornado com sucesso.",
        icon: "success",
      });
      if (empreitada?.EMP_CODIGO) {
        const updatedEmp = await repEmp.buscaEmpreitadaById(empreitada.EMP_CODIGO);
        if (updatedEmp) {
          setEmpreitada(updatedEmp);
          setEmpreitadaSelecionada(updatedEmp);
        }
      }
      if (empreitada?.EMP_FAT) {
        await carregaPagamentos(empreitada.EMP_FAT);
      }
      setShowModalEstorno(false);
      setPagamentoParaEstornar(null);
      onSaveSuccess?.();
    } catch (err) {
      toastMixin.fire({
        title: "Erro ao estornar pagamento",
        text: String(err),
        icon: "error",
      });
    } finally {
      setIsEstornando(false);
    }
  };

  const handleDarBaixa = async (item: PagamentoEmpreitadaItem) => {
    try {
      const repPag = new PagamentosRepository();
      const repEmp = new EmpreitadasRepository();
      await repPag.darBaixaParcelaEmpreitada({
        codPag: item.PAG_CODIGO,
        valor: item.PAG_VALOR,
        data: new Date(),
      });
      toastMixin.fire({
        title: "Sucesso!",
        text: "Baixa realizada com sucesso.",
        icon: "success",
      });
      if (empreitada?.EMP_CODIGO) {
        const updatedEmp = await repEmp.buscaEmpreitadaById(empreitada.EMP_CODIGO);
        if (updatedEmp) {
          setEmpreitada(updatedEmp);
          setEmpreitadaSelecionada(updatedEmp);
        }
      }
      if (empreitada?.EMP_FAT) {
        await carregaPagamentos(empreitada.EMP_FAT);
      }
      onSaveSuccess?.();
    } catch (err) {
      toastMixin.fire({
        title: "Erro ao dar baixa",
        text: String(err),
        icon: "error",
      });
    }
  };

  const totalServicosCalculado = itens.reduce(
    (acc, curr) => acc + (curr.ES_VALOR || 0),
    0
  );

  const initData = useCallback(async () => {
    setCarregando(true);
    await carregaUnidadesMed();

    if (empreitadaSelecionada) {
      setEmpreitada(empreitadaSelecionada);
      const curNfs = empreitadaSelecionada.EMP_NFS ? String(empreitadaSelecionada.EMP_NFS) : "";
      const curLoja = empreitadaSelecionada.EMP_LOJA || "";
      const curPedido = empreitadaSelecionada.EMP_PEDIDO || "";
      const curDataEmissao = empreitadaSelecionada.EMP_DATA_EMISSAO
        ? formatDataInput(empreitadaSelecionada.EMP_DATA_EMISSAO)
        : formatDataInput(new Date());
      const curCoordenador = empreitadaSelecionada.EMP_COORDENADOR || "";
      const curLocal = empreitadaSelecionada.EMP_LOCAL_EXECUCAO_SERVICOS || "";
      const curObs = empreitadaSelecionada.EMP_OBS || "";

      let curItens: EmpreitadasServicosModel[] = [];
      if (empreitadaSelecionada.EMP_CODIGO > 0) {
        const repository = new EmpreitadasRepository();
        curItens = await repository.buscaServicosEmpreitadas(empreitadaSelecionada.EMP_CODIGO);
      } else if (empreitadaSelecionada.ITENS && empreitadaSelecionada.ITENS.length > 0) {
        curItens = [...empreitadaSelecionada.ITENS];
      }

      const totalItens = curItens.reduce((acc, c) => acc + (c.ES_VALOR || 0), 0);
      const curValorStr = mascaraMoeda(
        empreitadaSelecionada.EMP_VALOR !== undefined && empreitadaSelecionada.EMP_VALOR !== null
          ? empreitadaSelecionada.EMP_VALOR
          : totalItens
      );

      setNfs(curNfs);
      setLoja(curLoja);
      setPedido(curPedido);
      setDataEmissao(curDataEmissao);
      setCoordenador(curCoordenador);
      setLocalExecucao(curLocal);
      setObsEmpreitadas(curObs);
      setItens(curItens);
      setValorNfStr(curValorStr);
      setServicosParaExcluir([]);
      await carregaPagamentos(empreitadaSelecionada.EMP_FAT);

      snapshotRef.current = makeSnapshot(
        curNfs,
        curLoja,
        curPedido,
        curDataEmissao,
        curCoordenador,
        curLocal,
        curObs,
        curValorStr,
        curItens
      );
    }
    setCarregando(false);
  }, [empreitadaSelecionada, carregaUnidadesMed, makeSnapshot]);

  const initKeyRef = useRef<string>("");

  useEffect(() => {
    if (!showModal) {
      initKeyRef.current = "";
      return;
    }
    const key = `${empreitadaSelecionada?.EMP_CODIGO ?? -1}_${empreitadaSelecionada?.EMP_FOR ?? 0}`;
    if (initKeyRef.current !== key) {
      initKeyRef.current = key;
      initData();
    }
  }, [showModal, empreitadaSelecionada?.EMP_CODIGO, empreitadaSelecionada?.EMP_FOR, initData]);

  const isFormDirty = () => {
    const current = makeSnapshot(
      nfs,
      loja,
      pedido,
      dataEmissao,
      coordenador,
      localExecucao,
      obsEmpreitadas,
      valorNfStr,
      itens
    );
    return current !== snapshotRef.current;
  };

  const handleRequestClose = () => {
    if (isFormDirty()) {
      setShowConfirmDescartar(true);
    } else {
      setShowModal(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (
          showModalEdtServicoEmpreitada ||
          showModalServicos ||
          confirmDeleteServico.isOpen ||
          showModalImprimirEmpreitadas ||
          showFaturamento ||
          showConfirmDescartar
        ) {
          return;
        }
        handleRequestClose();
      }
    };
    if (showModal) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [
    showModal,
    showModalEdtServicoEmpreitada,
    showModalServicos,
    confirmDeleteServico.isOpen,
    showModalImprimirEmpreitadas,
    showFaturamento,
    showConfirmDescartar,
  ]);

  const possuiVinculoFinanceiro = () => {
    if (empreitada?.EMP_FAT != null && empreitada.EMP_FAT !== 0) {
      return true;
    }
    return false;
  };

  // Permite continuar editando os dados cadastrais e serviços mesmo com pagamentos parciais registrados (R02)
  const estaFaturada = () => false;

  const editaServico = (servico: EmpreitadasServicosModel) => {
    setEmpreitadaServicoEdt(servico);
    setShowModalEdtServicoEmpreitada(true);
  };

  const salvarEdicaoServico = (servicoAtualizado: EmpreitadasServicosModel) => {
    const prevTotal = itens.reduce((acc, c) => acc + (c.ES_VALOR || 0), 0);
    const lista = Array.from(itens);
    const indice = lista.findIndex((e) => e.ES_CODIGO === servicoAtualizado.ES_CODIGO);

    if (indice >= 0) {
      lista.splice(indice, 1, servicoAtualizado);
    } else {
      lista.push(servicoAtualizado);
    }
    lista.sort((a, b) => (a.ES_CODIGO < b.ES_CODIGO ? -1 : a.ES_CODIGO > b.ES_CODIGO ? 1 : 0));

    const newTotal = lista.reduce((acc, c) => acc + (c.ES_VALOR || 0), 0);
    const curVal = maskRealToNumber(valorNfStr) || 0;
    if (curVal === 0 || Math.abs(curVal - prevTotal) < 0.01) {
      setValorNfStr(mascaraMoeda(newTotal));
    }

    setItens(lista);
    toastMixin.fire({
      title: "Sucesso",
      text: "Serviço alterado localmente",
      icon: "success",
      timer: 1500,
    });
    setShowModalEdtServicoEmpreitada(false);
  };

  const salvarNovoServico = (novoServico: EmpreitadasServicosModel) => {
    const prevTotal = itens.reduce((acc, c) => acc + (c.ES_VALOR || 0), 0);
    const itensAtualizados = [...itens, novoServico];
    const newTotal = itensAtualizados.reduce((acc, c) => acc + (c.ES_VALOR || 0), 0);
    const curVal = maskRealToNumber(valorNfStr) || 0;
    if (curVal === 0 || Math.abs(curVal - prevTotal) < 0.01) {
      setValorNfStr(mascaraMoeda(newTotal));
    }
    setItens(itensAtualizados);
    toastMixin.fire({
      title: "Sucesso",
      text: "Serviço adicionado localmente",
      icon: "success",
      timer: 1500,
    });
    setShowModalServicos(false);
  };

  const handleConfirmDeleteServico = () => {
    if (confirmDeleteServico.index >= 0) {
      const prevTotal = itens.reduce((acc, c) => acc + (c.ES_VALOR || 0), 0);
      const lista = Array.from(itens);
      const removido = lista.splice(confirmDeleteServico.index, 1)[0];
      const newTotal = lista.reduce((acc, c) => acc + (c.ES_VALOR || 0), 0);
      const curVal = maskRealToNumber(valorNfStr) || 0;
      if (curVal === 0 || Math.abs(curVal - prevTotal) < 0.01) {
        setValorNfStr(mascaraMoeda(newTotal));
      }
      setItens(lista);
      if (removido && removido.ES_CODIGO > 0) {
        setServicosParaExcluir((prev) => [...prev, removido.ES_CODIGO]);
      }
      toastMixin.fire({
        title: "Serviço Removido",
        text: "O serviço foi removido do rascunho da empreitada.",
        icon: "success",
        timer: 1500,
      });
    }
    setConfirmDeleteServico({ isOpen: false, index: -1, codigo: 0 });
  };

  function imprimePrazoConclusao(prazoConclusao: string) {
    if (!prazoConclusao) return "-";
    if (prazoConclusao.includes("/")) {
      return prazoConclusao;
    }
    try {
      return new Date(prazoConclusao).toLocaleDateString("pt-BR");
    } catch {
      return prazoConclusao;
    }
  }

  const handleSalvarEmpreitada = async () => {
    try {
      setIsSalvando(true);
      const rep = new EmpreitadasRepository();

      const totalCalc = itens.reduce((acc, curr) => acc + (curr.ES_VALOR || 0), 0);
      const valorInformado = maskRealToNumber(valorNfStr);
      const valorFinal = valorInformado > 0 ? valorInformado : totalCalc;

      // 1. Executar exclusões pendentes de serviços no banco
      for (const cod of servicosParaExcluir) {
        if (cod > 0) {
          await rep.deleteServicoEmpreitada(cod);
        }
      }
      setServicosParaExcluir([]);

      // 2. Montar objeto com campos completos
      const payload: EmpreitadasModel = {
        EMP_CODIGO: empreitada?.EMP_CODIGO || 0,
        EMP_ORD: ordem.ORD_CODIGO,
        EMP_FOR: empreitada?.EMP_FOR || fornecedor.CODIGO,
        FOR_NOME: empreitada?.FOR_NOME || fornecedor.NOME,
        EMP_NFS: nfs.trim(),
        EMP_LOJA: loja.trim(),
        EMP_PEDIDO: pedido.trim(),
        EMP_DATA_EMISSAO: dataEmissao,
        EMP_COORDENADOR: coordenador.trim(),
        EMP_LOCAL_EXECUCAO_SERVICOS: localExecucao.trim(),
        EMP_OBS: obsEmpreitadas.trim(),
        EMP_VALOR: valorFinal,
        EMP_FAT: empreitada?.EMP_FAT,
        LRC_FAT2: empreitada?.LRC_FAT2,
        ITENS: itens,
        FORNECEDOR: empreitada?.FORNECEDOR || fornecedor,
      };

      // 3. Persistir
      const codigoPersistido = await rep.insereEmpreitada(payload);
      payload.EMP_CODIGO = codigoPersistido;
      setEmpreitada(payload);
      setEmpreitadaSelecionada(payload);

      // Atualiza o snapshot para limpar o estado sujo
      snapshotRef.current = makeSnapshot(
        nfs,
        loja,
        pedido,
        dataEmissao,
        coordenador,
        localExecucao,
        obsEmpreitadas,
        valorNfStr,
        itens
      );

      toastMixin.fire({
        title: "Empreitada Salva",
        text: `Empreitada #${codigoPersistido} salva com sucesso!`,
        icon: "success",
        timer: 1500,
      });

      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (err: any) {
      toastMixin.fire({
        title: "Erro ao salvar",
        text: err.message || "Não foi possível salvar a empreitada.",
        icon: "error",
      });
    } finally {
      setIsSalvando(false);
    }
  };

  const faturamentoEmpreitada = async () => {
    if (!empreitada || empreitada.EMP_CODIGO === 0) {
      toastMixin.fire({
        title: "Atenção",
        text: "Por favor, salve a empreitada antes de faturar!",
        icon: "warning",
      });
      return;
    }

    if (empreitada.LRC_FAT2! > 0 || (empreitada.EMP_FAT && empreitada.EMP_FAT > 0)) {
      toastMixin.fire({
        title: "Atenção",
        text: "Esta empreitada já foi faturada!",
        icon: "info",
      });
      return;
    }

    const valorTotal = itens.reduce((acc, curr) => acc + (curr.ES_VALOR || 0), 0);
    if (valorTotal === 0 && (maskRealToNumber(valorNfStr) || 0) === 0) {
      toastMixin.fire({
        title: "Atenção",
        text: "Nenhum valor a faturar!",
        icon: "warning",
      });
      return;
    }

    setShowFaturamento(true);
  };

  if (!showModal) return null;

  const valorNfNum = maskRealToNumber(valorNfStr) || 0;
  const valorRecebido = empreitada?.VALOR_RECEBIDO || 0;
  const saldoRestante = Math.max(0, (valorNfNum || totalServicosCalculado) - valorRecebido);

  return (
    <div
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-sm animate-fade-in outline-none"
    >
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-stone-200/80 overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/80 bg-stone-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-800 tracking-tight">
                  {empreitada?.FOR_NOME || fornecedor.NOME || "Empreitada"}
                </h2>
                {empreitada?.EMP_CODIGO ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 font-mono font-bold">
                    #{empreitada.EMP_CODIGO}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                    Novo Cadastro
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 font-normal">
                Ordem de Serviço #{ordem.ORD_CODIGO}{" "}
                {empreitada?.EMP_FAT ? (
                  <span className="text-emerald-600 font-semibold">| Fatura #{empreitada.EMP_FAT}</span>
                ) : (
                  <span className="text-amber-600 font-semibold">| Em Aberto</span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {carregando ? (
            <div className="flex flex-col items-center justify-center py-16 text-stone-500 gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
              <span className="text-xs font-medium">Carregando dados da empreitada...</span>
            </div>
          ) : (
            <>
              {/* SEÇÃO 1: DADOS FISCAIS E DE COMPRA */}
              <div className="bg-white rounded-xl border border-stone-200/80 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-stone-200/80 bg-stone-50/80 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                    Dados Fiscais e de Compra
                  </h3>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-600 uppercase mb-1 flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-stone-400" />
                      Nota Fiscal
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={nfs}
                      disabled={estaFaturada()}
                      onChange={(e) => setNfs(e.target.value.replace(/\D/g, ""))}
                      placeholder="Ex: 001234"
                      className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-600 uppercase mb-1 flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 text-stone-400" />
                      Loja / Filial
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={loja}
                      disabled={estaFaturada()}
                      onChange={(e) => setLoja(e.target.value.replace(/\D/g, ""))}
                      placeholder="Ex: 01"
                      className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-600 uppercase mb-1 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-stone-400" />
                      Pedido de Compra
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={pedido}
                      disabled={estaFaturada()}
                      onChange={(e) => setPedido(e.target.value.replace(/\D/g, ""))}
                      placeholder="Ex: 8877"
                      className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-600 uppercase mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      Data de Emissão
                    </label>
                    <input
                      type="date"
                      value={dataEmissao}
                      disabled={estaFaturada()}
                      onChange={(e) => setDataEmissao(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: PRESTADOR E COORDENAÇÃO */}
              <div className="bg-white rounded-xl border border-stone-200/80 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-stone-200/80 bg-stone-50/80 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                    Prestador e Coordenação
                  </h3>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                      Prestador de Serviços
                    </label>
                    <div className="flex items-center px-3 py-2 text-sm bg-stone-100 text-stone-800 border border-stone-300 rounded-lg font-medium">
                      <Building2 className="w-4 h-4 text-stone-500 mr-2 shrink-0" />
                      <span className="truncate">{empreitada?.FOR_NOME || fornecedor.NOME}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                      Coordenador / Responsável
                    </label>
                    <div className="flex flex-col gap-1.5">
                      <input
                        type="text"
                        list="datalist-coordenadores-emp"
                        value={coordenador}
                        disabled={estaFaturada()}
                        onChange={(e) => setCoordenador(e.target.value.toUpperCase())}
                        placeholder="Selecione ou digite o coordenador"
                        className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition disabled:opacity-50"
                      />
                      <datalist id="datalist-coordenadores-emp">
                        {listaCoordenadores.map((nome) => (
                          <option key={nome} value={nome} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-600 uppercase mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      Local de Execução
                    </label>
                    <input
                      type="text"
                      value={localExecucao}
                      disabled={estaFaturada()}
                      onChange={(e) => setLocalExecucao(e.target.value.toUpperCase())}
                      placeholder="Ex: Pavimento 2, Bessa, João Pessoa-PB"
                      className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO 3: SERVIÇOS DA EMPREITADA */}
              <div className="bg-white rounded-xl border border-stone-200/80 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200/80 bg-stone-50/90">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                      Serviços da Empreitada
                    </h3>
                  </div>
                  <button
                    type="button"
                    disabled={estaFaturada()}
                    onClick={() => setShowModalServicos(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Serviço
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-100/90 text-stone-600 font-bold uppercase text-xs border-b border-stone-200 tracking-wider">
                        <th className="p-3">Descrição</th>
                        <th className="p-3 text-center">Quant.</th>
                        <th className="p-3 text-center">UM</th>
                        <th className="p-3 text-right">Valor Unit.</th>
                        <th className="p-3 text-right">Valor Total</th>
                        <th className="p-3 text-center">Prazo Conclusão</th>
                        <th className="p-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {itens.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-xs text-stone-400">
                            Nenhum serviço cadastrado para esta empreitada. Clique em &quot;Adicionar Serviço&quot; para incluir.
                          </td>
                        </tr>
                      ) : (
                        itens.map((item, index) => (
                          <tr
                            key={item.ES_CODIGO || index}
                            className="hover:bg-amber-50/40 transition-colors text-xs text-stone-700"
                          >
                            <td className="p-3 font-medium text-stone-900">{item.DESCRICAO}</td>
                            <td className="p-3 text-center font-mono">{item.ES_QUANTIDADE}</td>
                            <td className="p-3 text-center">{item.ES_UNIDADE}</td>
                            <td className="p-3 text-right font-mono">
                              {Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(
                                item.VLR_UNIT ??
                                  (item.ES_VALOR ?? 0) / (item.ES_QUANTIDADE || 1)
                              )}
                            </td>
                            <td className="p-3 text-right font-mono font-semibold text-stone-900">
                              {Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(item.ES_VALOR ?? 0)}
                            </td>
                            <td className="p-3 text-center">
                              {item.ES_PRAZO_CONCLUSAO
                                ? imprimePrazoConclusao(item.ES_PRAZO_CONCLUSAO)
                                : "-"}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  disabled={estaFaturada()}
                                  onClick={() => editaServico(item)}
                                  className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Editar Serviço"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  disabled={estaFaturada()}
                                  onClick={() =>
                                    setConfirmDeleteServico({
                                      isOpen: true,
                                      index,
                                      codigo: item.ES_CODIGO,
                                      descricao: item.DESCRICAO,
                                    })
                                  }
                                  className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Excluir Serviço"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Subtotal da Empreitada */}
                {itens.length > 0 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-stone-200 bg-stone-50/60">
                    <span className="text-xs font-bold text-stone-600 uppercase">
                      Total dos Serviços ({itens.length}{" "}
                      {itens.length === 1 ? "item" : "itens"}):
                    </span>
                    <span className="text-base font-bold text-stone-900 font-mono">
                      {Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(totalServicosCalculado)}
                    </span>
                  </div>
                )}
              </div>

              {/* SEÇÃO 4: VALORES E PAGAMENTOS */}
              <div className="bg-white rounded-xl border border-stone-200/80 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                    Valores e Pagamentos da Empreitada
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                      Valor da NF / Total (R$)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={valorNfStr}
                        disabled={estaFaturada()}
                        onChange={(e) => {
                          mascaraMoedaEvent(e);
                          setValorNfStr(e.target.value);
                        }}
                        className="w-full px-3 py-2 text-sm font-semibold bg-stone-50 border border-stone-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition disabled:opacity-50"
                      />
                    </div>
                    {totalServicosCalculado > 0 && (
                      <button
                        type="button"
                        disabled={estaFaturada()}
                        onClick={() => setValorNfStr(mascaraMoeda(totalServicosCalculado))}
                        className="mt-1 text-[11px] text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Usar soma dos serviços ({mascaraMoeda(totalServicosCalculado)})
                      </button>
                    )}
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="block text-[11px] font-bold text-stone-500 uppercase">
                      Total dos Serviços
                    </span>
                    <span className="text-base font-bold text-stone-800 font-mono">
                      {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                        totalServicosCalculado
                      )}
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="block text-[11px] font-bold text-emerald-700 uppercase">
                      Valor Pago / Recebido
                    </span>
                    <span className="text-base font-bold text-emerald-800 font-mono">
                      {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                        valorRecebido
                      )}
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <span className="block text-[11px] font-bold text-amber-800 uppercase">
                      Saldo a Pagar
                    </span>
                    <span className="text-base font-bold text-amber-900 font-mono">
                      {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                        saldoRestante
                      )}
                    </span>
                  </div>
                </div>

                {/* HISTÓRICO DE PAGAMENTOS / PARCELAS (E05 / R02) */}
                <div className="mt-5 pt-4 border-t border-stone-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-stone-600" />
                      <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                        Histórico de Pagamentos e Baixas
                      </h4>
                      {pagamentos.length > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-mono font-semibold">
                          {pagamentos.length} {pagamentos.length === 1 ? "registro" : "registros"}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={!empreitada || empreitada.EMP_CODIGO === 0}
                      onClick={() => setShowModalRegistrarPagamento(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
                      title={
                        !empreitada || empreitada.EMP_CODIGO === 0
                          ? "Salve a empreitada antes de registrar pagamentos"
                          : "Registrar novo pagamento parcial"
                      }
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Registrar Pagamento
                    </button>
                  </div>

                  {carregandoPagamentos ? (
                    <div className="flex items-center justify-center py-6 text-stone-400 gap-2 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                      Carregando histórico de pagamentos...
                    </div>
                  ) : pagamentos.length === 0 ? (
                    <div className="text-center py-5 px-3 bg-stone-50 rounded-xl border border-stone-200/80 text-xs text-stone-500">
                      Nenhum pagamento ou parcela registrado para esta empreitada.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-stone-200">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] border-b border-stone-200">
                          <tr>
                            <th className="px-3 py-2">#</th>
                            <th className="px-3 py-2">Data</th>
                            <th className="px-3 py-2">Identificação / Parcela</th>
                            <th className="px-3 py-2">Forma</th>
                            <th className="px-3 py-2 text-right">Valor (R$)</th>
                            <th className="px-3 py-2 text-center">Status</th>
                            <th className="px-3 py-2 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200">
                          {pagamentos.map((pag) => {
                            const isEstornado = pag.PAG_SITUACAO === -1;
                            const isQuitado = pag.PAG_ESTADO === 3 && !isEstornado;
                            const isPendente = pag.PAG_ESTADO === 1 && !isEstornado;
                            const dataExibicao = pag.PP_DATAPGM
                              ? formatDataInput(pag.PP_DATAPGM)
                              : formatDataInput(pag.PAG_VENCIMENTO);

                            return (
                              <tr
                                key={pag.PAG_CODIGO}
                                className={
                                  isEstornado
                                    ? "bg-rose-50/40 text-stone-400"
                                    : "hover:bg-stone-50/60"
                                }
                              >
                                <td className="px-3 py-2 font-mono font-bold text-stone-500">
                                  #{pag.PAG_CODIGO}
                                </td>
                                <td className="px-3 py-2 font-mono">{dataExibicao}</td>
                                <td className="px-3 py-2 font-medium">
                                  <div>{pag.PAG_DUPLICATA || "Baixa avulsa"}</div>
                                  {pag.PAG_OBS && (
                                    <div
                                      className="text-[10px] text-stone-400 truncate max-w-xs"
                                      title={pag.PAG_OBS}
                                    >
                                      {pag.PAG_OBS.replace(/\[IDEMP:[^\]]+\]\s*/, "")}
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-2 font-mono">{pag.PAG_TIPO || "DINHEIRO"}</td>
                                <td
                                  className={`px-3 py-2 text-right font-mono font-bold ${
                                    isEstornado
                                      ? "line-through text-stone-400"
                                      : isQuitado
                                      ? "text-emerald-700"
                                      : "text-amber-700"
                                  }`}
                                >
                                  {Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format(pag.PAG_VALOR)}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {isEstornado ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                      <Ban className="w-2.5 h-2.5" /> Estornado
                                    </span>
                                  ) : isQuitado ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      <CheckCircle2 className="w-2.5 h-2.5" /> Quitado
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                      <Clock className="w-2.5 h-2.5" /> Pendente
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {isQuitado && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPagamentoParaEstornar(pag);
                                        setShowModalEstorno(true);
                                      }}
                                      className="p-1 text-stone-400 hover:text-rose-600 transition"
                                      title="Estornar este pagamento"
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {isPendente && (
                                    <button
                                      type="button"
                                      onClick={() => handleDarBaixa(pag)}
                                      className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded transition"
                                      title="Confirmar quitação desta parcela"
                                    >
                                      Dar Baixa
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* SEÇÃO 5: OBSERVAÇÕES */}
              <div className="bg-white rounded-xl border border-stone-200/80 shadow-sm p-4">
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                  Observações da Empreitada
                </label>
                <textarea
                  rows={3}
                  value={obsEmpreitadas}
                  disabled={estaFaturada()}
                  onChange={(e) => setObsEmpreitadas(e.target.value)}
                  placeholder="Informações adicionais, condições de pagamento, prazos de entrega..."
                  className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition disabled:opacity-50"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-stone-200/80 bg-stone-50/90 shrink-0">
          <button
            type="button"
            onClick={handleRequestClose}
            className="px-4 py-2 text-sm font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg shadow-sm transition"
          >
            Fechar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!empreitada || empreitada.EMP_CODIGO === 0}
              onClick={() => setShowModalImprimirEmpreitadas(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>

            <button
              type="button"
              disabled={isSalvando || estaFaturada()}
              onClick={handleSalvarEmpreitada}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSalvando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar Empreitada
            </button>

            <button
              type="button"
              disabled={possuiVinculoFinanceiro() || !empreitada || empreitada.EMP_CODIGO === 0}
              onClick={faturamentoEmpreitada}
              title={
                possuiVinculoFinanceiro()
                  ? "Empreitada já possui faturamento/pagamentos vinculados. Utilize 'Registrar Pagamento' para novas baixas."
                  : "Gerar faturamento completo da empreitada"
              }
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <DollarSign className="w-4 h-4" />
              Faturar Empreitada
            </button>
          </div>
        </div>
      </div>

      {/* Submodais */}
      {/* Modal de Registro de Pagamento Parcial (E05) */}
      <ModalRegistrarPagamento
        isOpen={showModalRegistrarPagamento}
        onClose={() => setShowModalRegistrarPagamento(false)}
        saldoRestante={saldoRestante}
        onConfirm={handleRegistrarPagamento}
        isLoading={isRegistrandoPagamento}
      />

      {/* Modal de Confirmação de Estorno de Pagamento (E05 / D05) */}
      <ModalEstornoPagamento
        isOpen={showModalEstorno}
        onClose={() => {
          setShowModalEstorno(false);
          setPagamentoParaEstornar(null);
        }}
        pagamento={pagamentoParaEstornar}
        onConfirm={handleConfirmEstorno}
        isLoading={isEstornando}
      />

      <ModalEdtEmpreitada
        isOpen={showModalEdtServicoEmpreitada}
        onClose={() => setShowModalEdtServicoEmpreitada(false)}
        servico={empreitadaServicoEdt}
        unidadesMedida={listaUnidadesMed}
        onSave={salvarEdicaoServico}
      />

      <ModalServicos
        isOpen={showModalServicos}
        onClose={() => setShowModalServicos(false)}
        unidadesMedida={listaUnidadesMed}
        ordem={ordem}
        onSave={salvarNovoServico}
      />

      <ModalConfirmacao
        isOpen={confirmDeleteServico.isOpen}
        onClose={() => setConfirmDeleteServico({ isOpen: false, index: -1, codigo: 0 })}
        onConfirm={handleConfirmDeleteServico}
        title="Excluir Serviço"
        message={`Tem certeza de que deseja remover o serviço "${confirmDeleteServico.descricao || ""}" desta empreitada?`}
        type="danger"
        confirmText="Sim, Excluir"
      />

      {/* Modal de confirmação para descartar alterações (A09) */}
      <ModalConfirmacao
        isOpen={showConfirmDescartar}
        onClose={() => setShowConfirmDescartar(false)}
        onConfirm={() => {
          setShowConfirmDescartar(false);
          setShowModal(false);
        }}
        title="Atenção!"
        message="Existem alterações que ainda não foram salvas. Se você sair desta tela, todas as alterações realizadas serão perdidas. Deseja realmente sair sem salvar?"
        type="warning"
        confirmText="Sair sem salvar"
        cancelText="Continuar editando"
      />

      {showModalImprimirEmpreitadas && (
        <Modal
          showModal={showModalImprimirEmpreitadas}
          setShowModal={setShowModalImprimirEmpreitadas}
          title={foiFaturado ? "Impressão de Ordem de Serviço" : "Impressão de Orçamento"}
          showButtonExit={false}
          body={
            <PrintEmpreitadas
              EmpreitadaCtx={
                empreitada || {
                  EMP_CODIGO: 0,
                  EMP_FOR: 0,
                  EMP_ORD: 0,
                  EMP_VALOR: 0,
                  FOR_NOME: "",
                  ITENS: [],
                }
              }
            />
          }
        />
      )}

      {showFaturamento && (
        <Modal
          title="Faturamento Empreitadas"
          showModal={showFaturamento}
          setShowModal={setShowFaturamento}
          body={
            <Faturamentos
              tipoRecPag="P"
              Operacao={new OperacaoEmpreitadas()}
              pedFat={{
                PF_CODIGO: 0,
                PF_COD_CLI: empreitada?.FORNECEDOR?.CODIGO ?? 0,
                PF_CAMPO_DATAC: "EMP_DATAC",
                PF_CAMPO_FAT: "EMP_FAT",
                PF_CAMPO_PED: "EMP_CODIGO",
                PF_CLIENTE: empreitada?.FORNECEDOR?.NOME ?? "",
                PF_COD_PED: ordem.ORD_CODIGO,
                PF_DATA: FormatDate(new Date()),
                PF_DATAC: "01/01/1900",
                PF_DESCONTO: 0,
                PF_FAT: 0,
                PF_FUN: 1,
                PF_PARCELAS: 1,
                PF_TABELA: "EMPREITADAS",
                PF_TIPO: 2,
                PF_VALOR: 0,
                PF_VALORB: 0,
                PF_VALORPG: 0,
              }}
              model={empreitada!}
              itens={itens}
              cliFor={fornecedor}
              setShowModal={setShowFaturamento}
              setFaturado={(fat) => {
                setFoiFaturado(fat);
                if (fat && onSaveSuccess) {
                  onSaveSuccess();
                }
              }}
              valorTotal={
                maskRealToNumber(valorNfStr) || totalServicosCalculado
              }
            />
          }
        />
      )}
    </div>
  );
}
