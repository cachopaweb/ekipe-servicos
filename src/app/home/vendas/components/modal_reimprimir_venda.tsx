"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ModalImprimirVenda from "./modal_imprimir_venda";
import VendaRepository, { VendaComNomes } from "@/app/repositories/venda_repository";
import { VenEstModel } from "@/app/models/ven_est_model";
import { VendaModel } from "@/app/models/venda_model";

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
      alert("Erro ao carregar detalhes da venda.");
      console.error(error);
    }
  }, [filteredData, selectedIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (vendaSelecionada) return;

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
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
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
  }, [filteredData, onClose, vendaSelecionada, handlePrintSelection]); // Adicionado handlePrintSelection

  if (!isOpen) return null;

  return (
    <>
      <div
        ref={containerRef}
        tabIndex={-1}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in outline-none"
        onKeyDown={handleKeyDown}
      >
        <div className="bg-white w-full max-w-5xl h-[85vh] md:h-[650px] flex flex-col rounded-xl shadow-2xl overflow-hidden font-sans border border-gray-200">

          <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-gray-800 tracking-tight">REIMPRIMIR VENDA</h2>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Selecione a venda e pressione <strong>I</strong> para imprimir</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors">✕</button>
          </div>

          {/* ... (Resto do JSX permanece igual ao anterior) ... */}

          <div className="px-6 py-4 bg-stone-50 border-b border-gray-100 flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-search'} text-gray-400 group-focus-within:text-amber-500 transition-colors`}></i>
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Pesquisar por ${filterType === 'codigo' ? 'código' : 'nome do cliente'}...`}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none transition-all uppercase text-sm font-semibold text-gray-700 bg-white shadow-sm"
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xs font-bold text-gray-400 uppercase mr-1">Filtro (F2):</span>
              {[{ id: 'codigo', label: 'Código Venda' }, { id: 'cliente', label: 'Cliente' }].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => { setFilterType(filter.id as any); inputRef.current?.focus(); }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${filterType === filter.id ? 'bg-amber-400 border-amber-400 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-500'}`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white p-2">
            <div className="grid grid-cols-12 px-4 py-2 text-xs font-bold text-gray-400 uppercase border-b border-gray-100 gap-2">
              <div className="col-span-1">Cód.</div>
              <div className="col-span-2">Data/Hora</div>
              <div className="col-span-5">Cliente</div>
              <div className="col-span-2 text-right">Valor</div>
              <div className="col-span-2 text-center">Ação</div>
            </div>

            <div className="mt-1">
              {filteredData.length > 0 ? filteredData.map((venda, index) => (
                <div
                  key={venda.VEN_CODIGO}
                  ref={el => { rowRefs.current[index] = el }}
                  onClick={() => setSelectedIndex(index)}
                  onDoubleClick={handlePrintSelection}
                  className={`
                  grid grid-cols-12 px-4 py-2.5 my-1 rounded-md cursor-pointer transition-colors text-sm items-center gap-2
                  ${selectedIndex === index ? "bg-amber-50 border border-amber-200 shadow-sm" : "hover:bg-stone-50 border border-transparent"}
                `}
                >
                  <div className={`col-span-1 font-bold ${selectedIndex === index ? "text-amber-600" : "text-gray-500"}`}>{venda.VEN_CODIGO}</div>
                  <div className="col-span-2 text-gray-600 text-xs">
                    {new Date(venda.VEN_DATA).toLocaleDateString()} {venda.VEN_HORA ? venda.VEN_HORA.substring(0, 5) : ''}
                  </div>
                  <div className={`col-span-5 font-semibold truncate ${selectedIndex === index ? "text-gray-900" : "text-gray-700"}`}>
                    {venda.CLI_NOME || `CLIENTE CÓD. ${venda.VEN_CLI}`}
                  </div>
                  <div className={`col-span-2 text-right font-bold ${selectedIndex === index ? "text-gray-900" : "text-gray-800"}`}>
                    {formatCurrency(venda.VEN_VALOR)}
                  </div>
                  <div className="col-span-2 text-center flex justify-center gap-2">
                    <button
                      onClick={handlePrintSelection}
                      className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded text-xs font-bold border border-amber-200 hover:bg-amber-200"
                      title="Imprimir (I)"
                    >
                      <i className="fas fa-print"></i>
                    </button>
                  </div>
                </div>
              )) : (
                <div className="h-40 flex flex-col items-center justify-center text-gray-300">
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin text-3xl mb-2 opacity-50"></i>
                      <span>Buscando...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-search text-3xl mb-2 opacity-50"></i>
                      <span>Nenhuma venda encontrada</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-stone-50 border-t border-gray-200 px-6 py-3 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase">
            <div className="flex gap-4">
              <span className="flex items-center gap-1"><span className="bg-gray-200 px-1.5 rounded text-gray-600">F2</span> Filtrar</span>
            </div>
            <span className="flex items-center gap-1"><span className="bg-red-100 px-1.5 rounded text-red-500">ESC</span> Sair</span>
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