"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  FolderOpen,
  Printer,
  FileText,
  CheckCircle2,
  Receipt,
  Percent,
  Save,
  Coins,
  Clock,
  Loader2,
} from "lucide-react";
import { mascaraMoeda, maskRealToNumber, mascaraMoedaEvent } from "@/app/functions/utils";

interface PainelTotaisProps {
  totalServicos: number;
  totalProdutos: number;
  valorDesconto: number;
  setValorDesconto: (v: number) => void;
  valorPorcentagemDesconto: number;
  setValorPorcentagemDesconto: (v: number) => void;
  codigoOrdem: number;
  codFatura: number;
  totalItens: number;
  totalPago?: number;
  carregandoTotalPago?: boolean;
  erroTotalPago?: boolean;
  onRetryTotalPago?: () => void;
  isDirty?: boolean;
  onFaturar: () => void;
  onAbrirEmpreitadas: () => void;
  onAbrirArquivos: () => void;
  onImprimir: () => void;
  onImprimirCompleto?: () => void;
  onSalvar?: () => void;
  canSave?: boolean;
}

export default function PainelTotais({
  totalServicos,
  totalProdutos,
  valorDesconto,
  setValorDesconto,
  valorPorcentagemDesconto,
  setValorPorcentagemDesconto,
  codigoOrdem,
  codFatura,
  totalItens,
  totalPago,
  carregandoTotalPago,
  erroTotalPago,
  onRetryTotalPago,
  isDirty,
  onFaturar,
  onAbrirEmpreitadas,
  onAbrirArquivos,
  onImprimir,
  onImprimirCompleto,
  onSalvar,
  canSave,
}: PainelTotaisProps) {
  const subtotal = totalServicos + totalProdutos;
  const totalOS = Math.max(0, subtotal - (valorDesconto || 0));
  const pagoConfirmado = totalPago ?? 0;
  const saldoAPagar = totalOS - pagoConfirmado;

  const [inputDescontoReais, setInputDescontoReais] = useState("");
  const [inputDescontoPct, setInputDescontoPct] = useState("");

  // Sincroniza estado inicial dos descontos
  useEffect(() => {
    if (valorDesconto > 0) {
      setInputDescontoReais(mascaraMoeda(valorDesconto));
    } else {
      setInputDescontoReais("");
    }
  }, [valorDesconto]);

  useEffect(() => {
    if (valorPorcentagemDesconto > 0) {
      setInputDescontoPct(valorPorcentagemDesconto.toFixed(2));
    } else {
      setInputDescontoPct("");
    }
  }, [valorPorcentagemDesconto]);

  // Altera desconto em Reais -> calcula %
  const handleDescontoReaisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    mascaraMoedaEvent(e);
    const valStr = e.target.value;
    setInputDescontoReais(valStr);

    const valNum = maskRealToNumber(valStr) || 0;
    setValorDesconto(valNum);

    if (subtotal > 0 && valNum > 0) {
      const pct = (valNum / subtotal) * 100;
      setValorPorcentagemDesconto(pct);
      setInputDescontoPct(pct.toFixed(2));
    } else {
      setValorPorcentagemDesconto(0);
      setInputDescontoPct("");
    }
  };

  // Altera desconto em % -> calcula Reais
  const handleDescontoPctChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value.replace(/[^0-9.]/g, "");
    setInputDescontoPct(valStr);

    const pctNum = parseFloat(valStr) || 0;
    setValorPorcentagemDesconto(pctNum);

    if (subtotal > 0 && pctNum > 0) {
      const reais = (pctNum / 100) * subtotal;
      setValorDesconto(reais);
      setInputDescontoReais(mascaraMoeda(reais));
    } else {
      setValorDesconto(0);
      setInputDescontoReais("");
    }
  };

  const isFaturado = codFatura > 0;
  const canFaturar = !isFaturado && codigoOrdem > 0 && totalItens > 0;

  return (
    <div className="flex flex-col gap-3 lg:sticky lg:top-6">
      {/* Card Principal: Totalizador Financeiro */}
      <div className="ek-card overflow-hidden">
        {/* Assinatura superior sutil Ekipe */}
        <div className="flex h-0.5 w-full">
          <div className="flex-1 bg-brand" />
          <div className="w-12 bg-brand-gold" />
        </div>

        {/* Cabeçalho do Card */}
        <div className="px-4 py-3 border-b border-ek-rule bg-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-semibold text-ek-text">
              Resumo Financeiro
            </h3>
          </div>
          {isFaturado && (
            <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium px-2 py-0.5 rounded-full tabular-nums">
              Faturado #{codFatura}
            </span>
          )}
        </div>

        {/* Bloco dos 3 Indicadores Principais (E06 / R04) */}
        <div className="p-4 bg-ek-raised/60 border-b border-ek-rule space-y-3">
          {/* 1. Total da OS */}
          <div className="flex flex-col items-start justify-center">
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-xs font-medium text-ek-muted">
                Total da OS
              </span>
              {isDirty && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-goldSoft text-brand-goldInk font-medium border border-brand-gold/40">
                  Em edição
                </span>
              )}
            </div>
            <div className="text-3xl font-semibold text-ek-text tracking-tight tabular-nums">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalOS)}
            </div>
          </div>

          {/* Grid com Total Pago e Saldo a Pagar */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-ek-border">
            {/* Total Pago */}
            <div className="p-2.5 bg-white rounded-[6px] border border-ek-border flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-ek-muted">
                  Total Pago
                </span>
                <Coins className="w-3.5 h-3.5 text-emerald-700" />
              </div>
              {carregandoTotalPago ? (
                <div className="flex items-center gap-1 text-xs text-ek-faint py-0.5">
                  <Loader2 className="w-3 h-3 animate-spin text-brand" />
                  <span className="text-[11px]">Calculando...</span>
                </div>
              ) : erroTotalPago ? (
                <div className="flex items-center justify-between text-[11px] text-red-700">
                  <span>Indisponível</span>
                  {onRetryTotalPago && (
                    <button
                      type="button"
                      onClick={onRetryTotalPago}
                      className="text-ek-text underline font-medium hover:text-brand"
                    >
                      Tentar
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-sm font-semibold text-emerald-700 tabular-nums">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(pagoConfirmado)}
                </span>
              )}
            </div>

            {/* Saldo a Pagar */}
            <div
              className={`p-2.5 rounded-[6px] border flex flex-col justify-between ${
                saldoAPagar < 0
                  ? "bg-brand-soft/60 border-brand-border"
                  : saldoAPagar === 0 && pagoConfirmado > 0
                  ? "bg-emerald-50/60 border-emerald-200"
                  : "bg-white border-ek-border"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-medium ${
                    saldoAPagar < 0
                      ? "text-brand"
                      : saldoAPagar === 0 && pagoConfirmado > 0
                      ? "text-emerald-800"
                      : "text-ek-muted"
                  }`}
                >
                  Saldo a Pagar
                </span>
                <Clock
                  className={`w-3.5 h-3.5 ${
                    saldoAPagar < 0
                      ? "text-brand"
                      : saldoAPagar === 0 && pagoConfirmado > 0
                      ? "text-emerald-700"
                      : "text-ek-faint"
                  }`}
                />
              </div>
              {carregandoTotalPago ? (
                <div className="flex items-center gap-1 text-xs text-ek-faint py-0.5">
                  <Loader2 className="w-3 h-3 animate-spin text-brand" />
                  <span className="text-[11px]">Calculando...</span>
                </div>
              ) : (
                <div>
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      saldoAPagar < 0
                        ? "text-brand"
                        : saldoAPagar === 0 && pagoConfirmado > 0
                        ? "text-emerald-800"
                        : "text-ek-text"
                    }`}
                  >
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(saldoAPagar)}
                  </span>
                  {saldoAPagar < 0 && (
                    <span className="block text-[11px] font-medium text-brand">
                      Excedente
                    </span>
                  )}
                  {saldoAPagar === 0 && pagoConfirmado > 0 && (
                    <span className="block text-[11px] font-medium text-emerald-700">
                      Quitado
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Linhas de Discriminação */}
        <div className="p-4 space-y-2.5 text-sm">
          <div className="flex justify-between items-center text-ek-muted">
            <span>Total Serviços</span>
            <span className="font-medium text-ek-text tabular-nums">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalServicos)}
            </span>
          </div>

          <div className="flex justify-between items-center text-ek-muted">
            <span>Total Produtos</span>
            <span className="font-medium text-ek-text tabular-nums">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalProdutos)}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2.5 border-t border-ek-rule font-semibold text-ek-text text-sm">
            <span>Subtotal Bruto</span>
            <span className="tabular-nums">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(subtotal)}
            </span>
          </div>

          {/* Desconto Reativo */}
          <div className="pt-3 border-t border-ek-rule space-y-2">
            <label className="ek-label mb-0 text-ek-text">
              Desconto Concedido
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="block text-xs text-ek-muted mb-1">
                  Valor (R$)
                </span>
                <input
                  type="text"
                  value={inputDescontoReais}
                  onChange={handleDescontoReaisChange}
                  placeholder="0,00"
                  className="ek-input text-right font-medium text-red-700 tabular-nums"
                />
              </div>

              <div>
                <span className="block text-xs text-ek-muted mb-1">
                  Percentual (%)
                </span>
                <div className="relative">
                  <input
                    type="text"
                    value={inputDescontoPct}
                    onChange={handleDescontoPctChange}
                    placeholder="0.00"
                    className="ek-input pr-7 text-right font-medium text-red-700 tabular-nums"
                  />
                  <Percent className="w-3.5 h-3.5 text-ek-faint absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Botão de Faturamento */}
          <div className="pt-3">
            <button
              type="button"
              onClick={onFaturar}
              disabled={!canFaturar}
              className={`w-full h-10 px-4 rounded-[6px] font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                canFaturar
                  ? "bg-brand hover:bg-brand-hover text-white"
                  : "bg-ek-raised text-ek-faint cursor-not-allowed border border-ek-border"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isFaturado ? "Ordem Faturada" : "Faturar Ordem"}</span>
            </button>

            {isFaturado && onImprimirCompleto && (
              <button
                type="button"
                onClick={onImprimirCompleto}
                className="ek-btn-secondary w-full mt-2 h-9 text-xs text-brand border-brand-border bg-brand-soft hover:bg-brand-border/50"
                title="Reemitir PDF Completo da Ordem de Serviço"
              >
                <FileText className="w-4 h-4" />
                <span>PDF Completo da OS</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Card Secundário: Atalhos & Módulos */}
      <div className="ek-card p-3 space-y-1">
        <span className="block text-xs font-medium text-ek-muted px-2 py-1">
          Atalhos & Módulos
        </span>

        {/* PDF Completo da OS */}
        <button
          type="button"
          onClick={onImprimirCompleto || onImprimir}
          disabled={codigoOrdem === 0}
          className={`w-full flex items-center gap-2.5 px-2.5 h-9 rounded-[6px] text-sm font-medium transition-colors text-left ${
            codigoOrdem === 0
              ? "text-ek-faint bg-ek-raised/50 cursor-not-allowed"
              : "text-brand bg-brand-soft hover:bg-brand-border/40"
          }`}
          title={
            codigoOrdem === 0
              ? "Salve o orçamento antes de gerar o relatório completo"
              : "Gerar Relatório / PDF Completo da OS"
          }
        >
          <FileText className={`w-4 h-4 ${codigoOrdem === 0 ? "text-ek-faint" : "text-brand"}`} />
          <span>PDF Completo da OS</span>
        </button>

        <button
          type="button"
          onClick={onAbrirEmpreitadas}
          disabled={codigoOrdem === 0}
          className={`w-full flex items-center gap-2.5 px-2.5 h-9 rounded-[6px] text-sm font-medium transition-colors text-left ${
            codigoOrdem === 0
              ? "text-ek-faint bg-ek-raised/50 cursor-not-allowed"
              : "text-ek-text hover:bg-ek-raised"
          }`}
          title={codigoOrdem === 0 ? "Salve o orçamento antes de gerenciar empreitadas" : "Gerenciar Empreitadas"}
        >
          <Briefcase className={`w-4 h-4 ${codigoOrdem === 0 ? "text-ek-faint" : "text-brand"}`} />
          <span>Gestão de Empreitadas</span>
        </button>

        <button
          type="button"
          onClick={onAbrirArquivos}
          disabled={codigoOrdem === 0}
          className={`w-full flex items-center gap-2.5 px-2.5 h-9 rounded-[6px] text-sm font-medium transition-colors text-left ${
            codigoOrdem === 0
              ? "text-ek-faint bg-ek-raised/50 cursor-not-allowed"
              : "text-ek-text hover:bg-ek-raised"
          }`}
          title={codigoOrdem === 0 ? "Salve o orçamento antes de anexar arquivos" : "Anexar e Visualizar Documentos"}
        >
          <FolderOpen className={`w-4 h-4 ${codigoOrdem === 0 ? "text-ek-faint" : "text-brand"}`} />
          <span>Documentos e Anexos</span>
        </button>

        <button
          type="button"
          onClick={onImprimir}
          disabled={codigoOrdem === 0}
          className={`w-full flex items-center gap-2.5 px-2.5 h-9 rounded-[6px] text-sm font-medium transition-colors text-left ${
            codigoOrdem === 0
              ? "text-ek-faint bg-ek-raised/50 cursor-not-allowed"
              : "text-ek-text hover:bg-ek-raised"
          }`}
          title={codigoOrdem === 0 ? "Salve o orçamento antes de imprimir" : "Impressão Simples do Orçamento"}
        >
          <Printer className={`w-4 h-4 ${codigoOrdem === 0 ? "text-ek-faint" : "text-ek-muted"}`} />
          <span>Impressão Simples</span>
        </button>
      </div>

      {/* Barra Inferior Fixa para Mobile (Bottom Bar) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-ek-border px-4 py-2.5 flex items-center justify-between shadow-lg">
        <div className="flex flex-col text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-ek-muted">Total:</span>
            <span className="font-semibold text-ek-text tabular-nums">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalOS)}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-[11px] tabular-nums">
            <span className="text-emerald-700 font-medium">
              Pago: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pagoConfirmado)}
            </span>
            <span className={saldoAPagar <= 0 && pagoConfirmado > 0 ? "text-emerald-700 font-medium" : "text-ek-muted font-medium"}>
              Saldo: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(saldoAPagar)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onSalvar && (
            <button
              type="button"
              onClick={onSalvar}
              disabled={!canSave}
              className="ek-btn-primary h-9 px-4 text-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
