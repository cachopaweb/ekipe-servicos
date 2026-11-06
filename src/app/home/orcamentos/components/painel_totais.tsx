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
    <div className="flex flex-col gap-3 lg:sticky lg:top-20">
      {/* Card Principal: Totalizador Financeiro */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        {/* Cabeçalho do Card */}
        <div className="bg-amber-500 px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase">
              Resumo Financeiro
            </h3>
          </div>
          {isFaturado && (
            <span className="text-xs bg-emerald-700 text-white font-bold px-2.5 py-0.5 rounded uppercase">
              Faturado #{codFatura}
            </span>
          )}
        </div>

        {/* Bloco dos 3 Indicadores Principais (E06 / R04) */}
        <div className="p-4 bg-amber-50/40 border-b border-gray-200 space-y-3">
          {/* 1. Total da OS */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                Total da OS
              </span>
              {isDirty && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-300">
                  Em edição
                </span>
              )}
            </div>
            <div className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight tabular-nums font-mono">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalOS)}
            </div>
          </div>

          {/* Grid com Total Pago e Saldo a Pagar */}
          <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-amber-200/70">
            {/* Total Pago */}
            <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-tight">
                  Total Pago
                </span>
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              {carregandoTotalPago ? (
                <div className="flex items-center gap-1 text-xs text-stone-400 py-0.5">
                  <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                  <span className="text-[11px]">Calculando...</span>
                </div>
              ) : erroTotalPago ? (
                <div className="flex items-center justify-between text-[11px] text-rose-600">
                  <span>Indisponível</span>
                  {onRetryTotalPago && (
                    <button
                      type="button"
                      onClick={onRetryTotalPago}
                      className="text-stone-700 underline font-semibold hover:text-stone-900"
                    >
                      Tentar
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-sm sm:text-base font-extrabold text-emerald-800 font-mono tabular-nums">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(pagoConfirmado)}
                </span>
              )}
            </div>

            {/* Saldo a Pagar */}
            <div
              className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                saldoAPagar < 0
                  ? "bg-purple-50 border-purple-200"
                  : saldoAPagar === 0 && pagoConfirmado > 0
                  ? "bg-teal-50 border-teal-200"
                  : "bg-amber-50 border-amber-200"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[10px] font-bold uppercase tracking-tight ${
                    saldoAPagar < 0
                      ? "text-purple-800"
                      : saldoAPagar === 0 && pagoConfirmado > 0
                      ? "text-teal-800"
                      : "text-amber-800"
                  }`}
                >
                  Saldo a Pagar
                </span>
                <Clock
                  className={`w-3.5 h-3.5 ${
                    saldoAPagar < 0
                      ? "text-purple-600"
                      : saldoAPagar === 0 && pagoConfirmado > 0
                      ? "text-teal-600"
                      : "text-amber-600"
                  }`}
                />
              </div>
              {carregandoTotalPago ? (
                <div className="flex items-center gap-1 text-xs text-stone-400 py-0.5">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                  <span className="text-[11px]">Calculando...</span>
                </div>
              ) : (
                <div>
                  <span
                    className={`text-sm sm:text-base font-extrabold font-mono tabular-nums ${
                      saldoAPagar < 0
                        ? "text-purple-900"
                        : saldoAPagar === 0 && pagoConfirmado > 0
                        ? "text-teal-900"
                        : "text-amber-900"
                    }`}
                  >
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(saldoAPagar)}
                  </span>
                  {saldoAPagar < 0 && (
                    <span className="block text-[9px] font-bold text-purple-700 uppercase tracking-tight">
                      Excedente
                    </span>
                  )}
                  {saldoAPagar === 0 && pagoConfirmado > 0 && (
                    <span className="block text-[9px] font-bold text-teal-700 uppercase tracking-tight">
                      Quitado
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Linhas de Discriminação */}
        <div className="p-4 space-y-3 text-sm">
          <div className="flex justify-between items-center text-gray-700">
            <span>Total Serviços:</span>
            <span className="font-bold text-gray-900 tabular-nums">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalServicos)}
            </span>
          </div>

          <div className="flex justify-between items-center text-gray-700">
            <span>Total Produtos:</span>
            <span className="font-bold text-gray-900 tabular-nums">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalProdutos)}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2.5 border-t border-gray-200 font-bold text-gray-800 text-sm">
            <span>Subtotal Bruto:</span>
            <span className="tabular-nums">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(subtotal)}
            </span>
          </div>

          {/* Desconto Reativo */}
          <div className="pt-3 border-t border-gray-200 space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase">
              Desconto Concedido
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="block text-xs text-gray-500 font-semibold mb-1">
                  Valor (R$)
                </span>
                <input
                  type="text"
                  value={inputDescontoReais}
                  onChange={handleDescontoReaisChange}
                  placeholder="0,00"
                  className="w-full h-9 px-2.5 text-sm font-bold text-right text-red-600 border border-gray-300 rounded-md focus:border-amber-500 outline-none bg-white tabular-nums"
                />
              </div>

              <div>
                <span className="block text-xs text-gray-500 font-semibold mb-1">
                  Percentual (%)
                </span>
                <div className="relative">
                  <input
                    type="text"
                    value={inputDescontoPct}
                    onChange={handleDescontoPctChange}
                    placeholder="0.00"
                    className="w-full h-9 px-2.5 pr-7 text-sm font-bold text-right text-red-600 border border-gray-300 rounded-md focus:border-amber-500 outline-none bg-white tabular-nums"
                  />
                  <Percent className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-3 pointer-events-none" />
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
              className={`w-full py-3 px-4 rounded-md font-bold text-sm uppercase flex items-center justify-center gap-2 transition ${
                canFaturar
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isFaturado ? "Ordem Faturada" : "Faturar Ordem"}</span>
            </button>

            {isFaturado && onImprimirCompleto && (
              <button
                type="button"
                onClick={onImprimirCompleto}
                className="w-full mt-2.5 py-2.5 px-3 rounded-md font-bold text-xs uppercase flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white transition shadow-sm"
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
      <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
        <span className="block text-xs font-bold text-gray-600 uppercase px-1">
          Atalhos & Módulos
        </span>

        {/* PDF Completo da OS */}
        <button
          type="button"
          onClick={onImprimirCompleto || onImprimir}
          disabled={codigoOrdem === 0}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-semibold transition text-left ${
            codigoOrdem === 0
              ? "text-gray-300 bg-gray-50 cursor-not-allowed"
              : "text-brand bg-brand-soft hover:bg-brand/15 border border-brand-border"
          }`}
          title={
            codigoOrdem === 0
              ? "Salve o orçamento antes de gerar o relatório completo"
              : "Gerar Relatório / PDF Completo da OS"
          }
        >
          <FileText className={`w-4 h-4 ${codigoOrdem === 0 ? "text-gray-300" : "text-brand"}`} />
          <span>PDF Completo da OS</span>
        </button>

        <button
          type="button"
          onClick={onAbrirEmpreitadas}
          disabled={codigoOrdem === 0}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-semibold transition text-left ${
            codigoOrdem === 0
              ? "text-gray-300 bg-gray-50 cursor-not-allowed"
              : "text-gray-700 hover:bg-amber-50 hover:text-amber-800"
          }`}
          title={codigoOrdem === 0 ? "Salve o orçamento antes de gerenciar empreitadas" : "Gerenciar Empreitadas"}
        >
          <Briefcase className="w-4 h-4 text-amber-500" />
          <span>Gestão de Empreitadas</span>
        </button>

        <button
          type="button"
          onClick={onAbrirArquivos}
          disabled={codigoOrdem === 0}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-semibold transition text-left ${
            codigoOrdem === 0
              ? "text-gray-300 bg-gray-50 cursor-not-allowed"
              : "text-gray-700 hover:bg-amber-50 hover:text-amber-800"
          }`}
          title={codigoOrdem === 0 ? "Salve o orçamento antes de anexar arquivos" : "Anexar e Visualizar Documentos"}
        >
          <FolderOpen className="w-4 h-4 text-amber-500" />
          <span>Documentos e Anexos</span>
        </button>

        <button
          type="button"
          onClick={onImprimir}
          disabled={codigoOrdem === 0}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-semibold transition text-left ${
            codigoOrdem === 0
              ? "text-gray-300 bg-gray-50 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-100"
          }`}
          title={codigoOrdem === 0 ? "Salve o orçamento antes de imprimir" : "Impressão Simples do Orçamento"}
        >
          <Printer className={`w-4 h-4 ${codigoOrdem === 0 ? "text-gray-300" : "text-gray-600"}`} />
          <span>Impressão Simples</span>
        </button>
      </div>

      {/* Barra Inferior Fixa para Mobile (Bottom Bar) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-300 px-4 py-2 flex items-center justify-between shadow-lg">
        <div className="flex flex-col text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-500 uppercase">Total:</span>
            <span className="font-black text-gray-900 tabular-nums">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalOS)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-emerald-700 font-bold">
              Pago: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pagoConfirmado)}
            </span>
            <span className={saldoAPagar <= 0 && pagoConfirmado > 0 ? "text-teal-700 font-bold" : "text-amber-800 font-bold"}>
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
              className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-1.5 transition ${
                canSave
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Save className="w-4 h-4" />
              <span>Salvar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
