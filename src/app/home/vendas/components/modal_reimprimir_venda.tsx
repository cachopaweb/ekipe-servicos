"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Printer, Search, X } from "lucide-react";
import ModalImprimirVenda from "./modal_imprimir_venda";
import VendaRepository, { VendaComNomes } from "@/app/repositories/venda_repository";
import { VenEstModel } from "@/app/models/ven_est_model";
import { VendaModel } from "@/app/models/venda_model";
import { toastMixin } from "@/app/functions/utils";

// Interfaces
interface VendaCompleta extends VendaModel {
  CLI_NOME?: string;
  FUN_NOME?: string;
  itensVenEst: VenEstModel[];
}

interface ModalReimprimirVendaProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalReimprimirVenda({ isOpen, onClose }: ModalReimprimirVendaProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"codigo" | "cliente">("codigo");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredData, setFilteredData] = useState<VendaComNomes[]>([]);
  const [loading, setLoading] = useState(false);
  const [vendaSelecionada, setVendaSelecionada] = useState<VendaCompleta | null>(null);

  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Movi o fetchVendas para dentro do useEffect ou use useCallback com dependências corretas
  const fetchVendas = useCallback(async (busca: string = "") => {
    setLoading(true);
    try {
      const repository = new VendaRepository();
      const dados = await repository.getVendas(busca, filterType);

      // Ordenação
      if (dados && Array.isArray(dados)) {
        dados.sort((a, b) => b.VEN_CODIGO - a.VEN_CODIGO);
      }
      setFilteredData(dados || []);
      setSelectedIndex(0);
    } catch (error) {
      console.error(error);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    if (!isOpen) return;
    const timeoutId = setTimeout(() => {
      fetchVendas(searchTerm);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, isOpen, fetchVendas]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      fetchVendas("");
    }
  }, [isOpen, fetchVendas]);

  useEffect(() => {
    if (rowRefs.current[selectedIndex]) {
      rowRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  // Envolvi em useCallback para resolver o warning
  const handlePrintSelection = useCallback(async () => {
    const vendaBase = filteredData[selectedIndex];
    if (!vendaBase) return;

    try {
      const repository = new VendaRepository();
      const itens = await repository.getItensVenda(vendaBase.VEN_CODIGO);
      const vendaCompleta: VendaCompleta = {
        ...vendaBase,
        itensVenEst: itens
      };
      setVendaSelecionada(vendaCompleta);
    } catch (error) {
      toastMixin.fire({
        title: 'Erro',
        text: 'Erro ao carregar detalhes da venda.',
        icon: 'error'
      });
      console.error(error);
    }
  }, [filteredData, selectedIndex]);

  // Atalhos de teclado globais quando o modal está aberto (funciona mesmo após clique do mouse)
  useEffect(() => {
    if (!isOpen || vendaSelecionada) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredData.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Enter") {
        e.preventDefault();
        handlePrintSelection();
      } else if (e.key === "i" || e.key === "I") {
        const target = e.target as HTMLElement;
        const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
        if (!isInput) {
          e.preventDefault();
          handlePrintSelection();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "F2") {
        e.preventDefault();
        setFilterType(prev => prev === "codigo" ? "cliente" : "codigo");
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, vendaSelecionada, filteredData, onClose, handlePrintSelection]);

  if (!isOpen) return null;

  return (
    <>
      <div
        ref={containerRef}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 outline-none"
      >
        <div className="bg-ek-surface w-full max-w-5xl h-[85vh] md:h-[650px] flex flex-col rounded-[8px] border border-ek-border overflow-hidden font-sans">

          <div className="bg-ek-raised px-5 py-3.5 border-b border-ek-border flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="w-1 h-4 bg-brand rounded-full" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-semibold text-ek-text flex items-center gap-2">
                  <Printer className="w-4 h-4 text-brand" />
                  <span>Reimprimir venda</span>
                </h2>
                <p className="text-xs text-ek-muted">Selecione a venda e pressione <strong>I</strong> para imprimir</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[6px] text-ek-muted hover:bg-ek-active hover:text-ek-text transition-colors" title="Fechar (ESC)">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 py-3.5 bg-ek-surface border-b border-ek-border flex flex-col gap-2.5 shrink-0">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ek-faint">
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-brand" /> : <Search className="w-4 h-4" />}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={`Pesquisar por ${filterType === 'codigo' ? 'código da venda' : 'nome do cliente'}...`}
                className="ek-input pl-9 uppercase font-medium"
                autoComplete="off"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-ek-muted mr-1">Filtro (F2):</span>
              {[{ id: 'codigo', label: 'Código venda' }, { id: 'cliente', label: 'Cliente' }].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => { setFilterType(filter.id as any); inputRef.current?.focus(); }}
                  className={`px-3 py-1 rounded-[6px] text-xs font-medium border transition-colors ${filterType === filter.id
                    ? 'bg-brand border-brand text-white'
                    : 'bg-ek-surface border-ek-border text-ek-muted hover:text-ek-text hover:bg-ek-raised'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-ek-surface min-h-0">
            <div className="grid grid-cols-12 px-5 py-2 text-xs font-semibold text-ek-muted border-b border-ek-border bg-ek-raised gap-2 sticky top-0 z-10">
              <div className="col-span-1">Cód.</div>
              <div className="col-span-2">Data/Hora</div>
              <div className="col-span-5">Cliente</div>
              <div className="col-span-2 text-right">Valor</div>
              <div className="col-span-2 text-center">Ação</div>
            </div>

            <div className="divide-y divide-ek-rule">
              {filteredData.length > 0 ? filteredData.map((venda, index) => (
                <div
                  key={venda.VEN_CODIGO}
                  ref={el => { rowRefs.current[index] = el }}
                  onClick={() => {
                    setSelectedIndex(index);
                    inputRef.current?.focus();
                  }}
                  onDoubleClick={handlePrintSelection}
                  className={`grid grid-cols-12 px-5 py-2.5 cursor-pointer transition-colors text-[13px] items-center gap-2 ${
                    selectedIndex === index ? "bg-brand-soft border-l-2 border-l-brand" : "hover:bg-ek-raised/80"
                  }`}
                >
                  <div className={`col-span-1 font-semibold tabular-nums ${selectedIndex === index ? "text-brand" : "text-ek-muted"}`}>{venda.VEN_CODIGO}</div>
                  <div className="col-span-2 text-ek-muted text-xs tabular-nums">
                    {new Date(venda.VEN_DATA).toLocaleDateString()} {venda.VEN_HORA ? venda.VEN_HORA.substring(0, 5) : ''}
                  </div>
                  <div className="col-span-5 font-medium text-ek-text truncate">
                    {venda.CLI_NOME || `CLIENTE CÓD. ${venda.VEN_CLI}`}
                  </div>
                  <div className="col-span-2 text-right font-semibold text-ek-text tabular-nums">
                    {formatCurrency(venda.VEN_VALOR)}
                  </div>
                  <div className="col-span-2 text-center flex justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIndex(index);
                        handlePrintSelection();
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-xs font-medium bg-brand-soft text-brand border border-brand-border hover:bg-brand/10 transition-colors"
                      title="Imprimir (I)"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimir</span>
                    </button>
                  </div>
                </div>
              )) : (
                <div className="h-44 flex flex-col items-center justify-center text-ek-muted gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin text-brand" />
                      <span className="text-xs">Buscando...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-7 h-7 text-ek-faint" />
                      <span className="text-sm font-medium">Nenhuma venda encontrada</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-ek-raised border-t border-ek-border px-5 py-3 flex justify-between items-center text-xs text-ek-muted shrink-0">
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5"><kbd className="ek-kbd">F2</kbd> Filtrar</span>
              <span className="flex items-center gap-1.5"><kbd className="ek-kbd">I</kbd> Imprimir selecionada</span>
            </div>
            <button onClick={onClose} className="flex items-center gap-1.5 hover:text-ek-text">
              <kbd className="ek-kbd">ESC</kbd> Sair
            </button>
          </div>
        </div>
      </div>

      {vendaSelecionada && (
        <ModalImprimirVenda
          isOpen={true}
          onClose={() => {
            setVendaSelecionada(null);
            setTimeout(() => containerRef.current?.focus(), 50);
          }}
          venda={vendaSelecionada}
          itens={vendaSelecionada.itensVenEst}
          cliente={vendaSelecionada.CLI_NOME || `Cód. ${vendaSelecionada.VEN_CLI}`}
          funcionario={vendaSelecionada.FUN_NOME || `Cód. ${vendaSelecionada.VEN_VENDEDOR}`}
          desconto={vendaSelecionada.VEN_DIFERENCA}
        />
      )}
    </>
  );
}