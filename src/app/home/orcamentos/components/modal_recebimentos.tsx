"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  Loader2,
  Receipt,
  X,
} from "lucide-react";
import RecebimentosModel from "@/app/models/recebimentos_model";
import TipoPgmModel from "@/app/models/tipo_pgm_model";
import RecebimentosRepository from "@/app/repositories/recebimentos_repository";
import TipoPgmRepository from "@/app/repositories/tipo_pgm_repository";
import {
  converterDataFormato,
  formatCurrency,
  formatDataInput,
  toastMixin,
} from "@/app/functions/utils";

interface ModalRecebimentosProps {
  codFatura: number;
  codigoOrdem: number;
  clienteNome: string;
  funCodigo?: number;
  onBaixaConcluida: () => void;
  onClose: () => void;
}

export default function ModalRecebimentos({
  codFatura,
  codigoOrdem,
  clienteNome,
  funCodigo = 1,
  onBaixaConcluida,
  onClose,
}: ModalRecebimentosProps) {
  const [recebimentos, setRecebimentos] = useState<RecebimentosModel[]>([]);
  const [tiposPgm, setTiposPgm] = useState<TipoPgmModel[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [selecionado, setSelecionado] = useState<RecebimentosModel | null>(null);
  const [dataBaixa, setDataBaixa] = useState<string>(() => formatDataInput(new Date()));
  const [formaBaixa, setFormaBaixa] = useState<string>("DINHEIRO");
  const [salvandoBaixa, setSalvandoBaixa] = useState(false);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const recRepo = new RecebimentosRepository();
      const tpRepo = new TipoPgmRepository();
      const [listaRec, listaTp] = await Promise.all([
        recRepo.getRecebimentosByFatura(codFatura),
        tpRepo.buscaTipoPgm("R").catch(() => []),
      ]);
      setRecebimentos(listaRec || []);
      setTiposPgm(Array.isArray(listaTp) ? listaTp : []);
    } catch (error) {
      toastMixin.fire("Erro ao carregar recebimentos", String(error), "error");
    } finally {
      setCarregando(false);
    }
  }, [codFatura]);

  useEffect(() => {
    if (codFatura > 0) {
      carregarDados();
    }
  }, [codFatura, carregarDados]);

  const totais = useMemo(() => {
    let totalFatura = 0;
    let totalPago = 0;
    let totalAberto = 0;

    for (const rec of recebimentos) {
      if (Number(rec.REC_SITUACAO) === -1) continue;
      const val = Number(rec.REC_VALOR) || 0;
      totalFatura += val;
      if (Number(rec.REC_ESTADO) === 3) {
        totalPago += val;
      } else {
        totalAberto += val;
      }
    }
    return { totalFatura, totalPago, totalAberto };
  }, [recebimentos]);

  const iniciarBaixa = (rec: RecebimentosModel) => {
    setSelecionado(rec);
    setDataBaixa(formatDataInput(new Date()));
    const dinheiroOpt = tiposPgm.find((t) => t.TP_CODIGO === 0);
    setFormaBaixa(dinheiroOpt?.TP_DESCRICAO || rec.REC_TIPO || "DINHEIRO");
  };

  const confirmarBaixa = async () => {
    if (!selecionado || salvandoBaixa) return;
    setSalvandoBaixa(true);
    try {
      const recRepo = new RecebimentosRepository();
      await recRepo.darBaixaRecebimento({
        recebimento: selecionado,
        dataPagamento: dataBaixa || formatDataInput(new Date()),
        formaPgm: formaBaixa,
        clienteNome,
        funCodigo,
      });
      toastMixin.fire(
        "Baixa registrada",
        `Parcela ${selecionado.REC_DUPLICATA} baixada com sucesso!`,
        "success"
      );
      setSelecionado(null);
      await carregarDados();
      onBaixaConcluida();
    } catch (error) {
      toastMixin.fire("Erro ao dar baixa", String(error), "error");
    } finally {
      setSalvandoBaixa(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 font-sans text-ek-text">
      {/* Cabeçalho resumo */}
      <div className="ek-card p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-ek-rule">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[6px] bg-brand-soft border border-brand-border flex items-center justify-center text-brand">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-ek-muted block">
                Ordem #{codigoOrdem} • Fatura #{codFatura}
              </span>
              <span className="text-sm font-semibold text-ek-text">
                {clienteNome || "Cliente"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-[6px] bg-ek-raised border border-ek-border">
            <span className="text-xs text-ek-muted block mb-0.5">Total da Fatura</span>
            <span className="text-base font-bold text-ek-text tabular-nums">
              {formatCurrency(totais.totalFatura)}
            </span>
          </div>

          <div className="p-3 rounded-[6px] bg-emerald-50/70 border border-emerald-200">
            <span className="text-xs text-emerald-800 block mb-0.5">Total Recebido</span>
            <span className="text-base font-bold text-emerald-700 tabular-nums">
              {formatCurrency(totais.totalPago)}
            </span>
          </div>

          <div
            className={`p-3 rounded-[6px] border ${
              totais.totalAberto > 0
                ? "bg-brand-goldSoft/60 border-brand-gold/50"
                : "bg-white border-ek-border"
            }`}
          >
            <span className="text-xs text-ek-muted block mb-0.5">Saldo em Aberto</span>
            <span
              className={`text-base font-bold tabular-nums ${
                totais.totalAberto > 0 ? "text-brand-goldInk" : "text-ek-faint"
              }`}
            >
              {formatCurrency(totais.totalAberto)}
            </span>
          </div>
        </div>
      </div>

      {/* Painel de confirmação de baixa */}
      {selecionado && (
        <div className="ek-card p-4 border-brand-border bg-brand-soft/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand" />
              <h4 className="text-sm font-semibold text-ek-text">
                Dar Baixa na Parcela {selecionado.REC_DUPLICATA} (
                {formatCurrency(Number(selecionado.REC_VALOR) || 0)})
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setSelecionado(null)}
              className="p-1 text-ek-muted hover:text-ek-text rounded"
              title="Cancelar baixa"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:items-end">
            <div className="sm:col-span-4">
              <label htmlFor="edtDataBaixa" className="ek-label">
                Data do Recebimento
              </label>
              <input
                id="edtDataBaixa"
                type="date"
                value={dataBaixa}
                onChange={(e) => setDataBaixa(e.target.value)}
                className="ek-input tabular-nums"
              />
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="selFormaBaixa" className="ek-label">
                Forma de Pagamento
              </label>
              <select
                id="selFormaBaixa"
                value={formaBaixa}
                onChange={(e) => setFormaBaixa(e.target.value)}
                className="ek-select uppercase"
              >
                {tiposPgm.length > 0 ? (
                  tiposPgm.map((tp) => (
                    <option key={tp.TP_CODIGO} value={tp.TP_DESCRICAO}>
                      {tp.TP_DESCRICAO}
                    </option>
                  ))
                ) : (
                  <option value={formaBaixa}>{formaBaixa}</option>
                )}
              </select>
            </div>

            <div className="sm:col-span-4 flex gap-2">
              <button
                type="button"
                onClick={confirmarBaixa}
                disabled={salvandoBaixa}
                className="ek-btn-primary flex-1 justify-center h-9 text-xs"
              >
                {salvandoBaixa ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>{salvandoBaixa ? "Registrando..." : "Confirmar Baixa"}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelecionado(null)}
                disabled={salvandoBaixa}
                className="ek-btn-secondary h-9 px-3 text-xs"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de parcelas / recebimentos */}
      <div className="ek-card overflow-hidden">
        {carregando ? (
          <div className="flex items-center justify-center py-8 gap-2 text-xs text-ek-muted">
            <Loader2 className="w-4 h-4 animate-spin text-brand" />
            <span>Carregando parcelas da fatura...</span>
          </div>
        ) : recebimentos.length === 0 ? (
          <div className="py-8 text-center text-xs text-ek-faint">
            Nenhum título encontrado para a fatura #{codFatura}.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-ek-raised border-b border-ek-border text-ek-muted text-xs font-semibold sticky top-0 z-10">
                  <th className="py-2.5 px-3">Duplicata</th>
                  <th className="py-2.5 px-3">Vencimento</th>
                  <th className="py-2.5 px-3">Forma</th>
                  <th className="py-2.5 px-3 text-right">Valor</th>
                  <th className="py-2.5 px-3 text-center">Recebido em</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ek-rule text-xs sm:text-[13px]">
                {recebimentos.map((rec) => {
                  const isCancelado = Number(rec.REC_SITUACAO) === -1;
                  const isQuitado = Number(rec.REC_ESTADO) === 3 && !isCancelado;
                  const isEmAberto = !isQuitado && !isCancelado;

                  return (
                    <tr
                      key={rec.REC_CODIGO}
                      className={`transition-colors ${
                        selecionado?.REC_CODIGO === rec.REC_CODIGO
                          ? "bg-brand-soft/40"
                          : "hover:bg-ek-raised/70"
                      }`}
                    >
                      <td className="py-2.5 px-3 font-medium text-ek-text tabular-nums">
                        {rec.REC_DUPLICATA}
                      </td>
                      <td className="py-2.5 px-3 text-ek-muted tabular-nums">
                        {converterDataFormato(rec.REC_VENCIMENTO) || "—"}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-ek-text uppercase">
                        {rec.REC_TIPO}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-ek-text">
                        {formatCurrency(Number(rec.REC_VALOR) || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-center text-ek-muted tabular-nums">
                        {isQuitado ? converterDataFormato(rec.REC_DATAR) || "—" : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isCancelado ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            Cancelado
                          </span>
                        ) : isQuitado ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Quitado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[11px] font-medium bg-brand-goldSoft text-brand-goldInk border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Em aberto
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isEmAberto ? (
                          <button
                            type="button"
                            onClick={() => iniciarBaixa(rec)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>Dar Baixa</span>
                          </button>
                        ) : (
                          <span className="text-xs text-ek-faint">—</span>
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

      <div className="flex justify-end">
        <button type="button" onClick={onClose} className="ek-btn-secondary h-9 px-4 text-xs">
          Fechar
        </button>
      </div>
    </div>
  );
}
