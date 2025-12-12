"use client";

import { useState, useEffect, useRef, useCallback } from "react";

import ModalImprimirVenda from "./modal_imprimir_venda"; // Certifique-se que este arquivo existe

import { VendaModel } from "@/app/models/venda_model";

// Dados Mockados
const MOCK_VENDAS: VendaModel[] = [
  { VEN_CODIGO: 2078, VEN_DATA: "2025-12-02", VEN_VALOR: 150.00, VEN_HORA: "15:55", VEN_FUN: 1, VEN_NF: 0, VEN_DIFERENCA: 0, VEN_DATAC: "", VEN_FAT: 0, VEN_DAV: 0, VEN_CLI: 1, VEN_DEVOLUCAO_P: "N", VEN_VENDEDOR: 1 },
  { VEN_CODIGO: 2077, VEN_DATA: "2025-12-02", VEN_VALOR: 450.50, VEN_HORA: "14:30", VEN_FUN: 1, VEN_NF: 1023, VEN_DIFERENCA: 0, VEN_DATAC: "", VEN_FAT: 0, VEN_DAV: 0, VEN_CLI: 10, VEN_DEVOLUCAO_P: "N", VEN_VENDEDOR: 2, },
  { VEN_CODIGO: 2076, VEN_DATA: "2025-12-01", VEN_VALOR: 89.90, VEN_HORA: "09:15", VEN_FUN: 1, VEN_NF: 0, VEN_DIFERENCA: 0, VEN_DATAC: "", VEN_FAT: 0, VEN_DAV: 0, VEN_CLI: 31, VEN_DEVOLUCAO_P: "N", VEN_VENDEDOR: 1, },
  { VEN_CODIGO: 2075, VEN_DATA: "2025-11-30", VEN_VALOR: 1200.00, VEN_HORA: "18:00", VEN_FUN: 3, VEN_NF: 1022, VEN_DIFERENCA: 0, VEN_DATAC: "", VEN_FAT: 0, VEN_DAV: 0, VEN_CLI: 12, VEN_DEVOLUCAO_P: "N", VEN_VENDEDOR: 3, },
  { VEN_CODIGO: 2074, VEN_DATA: "2025-11-29", VEN_VALOR: 35.00, VEN_HORA: "10:00", VEN_FUN: 1, VEN_NF: 0, VEN_DIFERENCA: 0, VEN_DATAC: "", VEN_FAT: 0, VEN_DAV: 0, VEN_CLI: 1, VEN_DEVOLUCAO_P: "N", VEN_VENDEDOR: 1 },
];

interface ModalReimprimirVendaProps {
  isOpen: boolean;
  onClose: () => void;
  funcionario: string,
  cliente: string
}

export default function ModalReimprimirVenda({ isOpen, onClose, funcionario, cliente }: ModalReimprimirVendaProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"codigo" | "cliente">("codigo");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredData, setFilteredData] = useState<VendaModel[]>(MOCK_VENDAS);

  // Estado para controlar o modal filho de impressão
  const [selectedVendaParaImpressao, setSelectedVendaParaImpressao] = useState<VendaModel | null>(null);

  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Filtragem
  useEffect(() => {
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = MOCK_VENDAS.filter(v => {
      if (filterType === "codigo") return v.VEN_CODIGO.toString().includes(lowerSearch);
      if (filterType === "cliente") return (cliente || "").toLowerCase().includes(lowerSearch);
      return true;
    });
    setFilteredData(filtered);
    setSelectedIndex(0);
  }, [searchTerm, filterType]);

  // Foco inicial
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Scroll automático
  useEffect(() => {
    if (rowRefs.current[selectedIndex]) {
      rowRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  // Handler de Impressão (Abre o segundo modal)
  const openPrintModal = () => {
    if (filteredData[selectedIndex]) {
      setSelectedVendaParaImpressao(filteredData[selectedIndex]);
    }
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Se o modal de impressão estiver aberto, bloqueia ações aqui
    if (selectedVendaParaImpressao) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredData.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      openPrintModal();
    } else if (e.key === "i" || e.key === "I") {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (!isInput) {
        e.preventDefault();
        openPrintModal();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "F2") {
      e.preventDefault();
      setFilterType(prev => prev === "codigo" ? "cliente" : "codigo");
      inputRef.current?.focus();
    }
  }, [filteredData, selectedIndex, onClose, selectedVendaParaImpressao]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      tabIndex={- 1
      }
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in outline-none"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white w-full max-w-5xl h-[85vh] md:h-[650px] flex flex-col rounded-xl shadow-2xl overflow-hidden font-sans border border-gray-200" >

        {/* Header */}
        < div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center" >
          <div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight" > REIMPRIMIR VENDA </h2>
            < p className="text-xs text-gray-500 mt-0.5 font-medium" > Selecione a venda e pressione 'I' para imprimir </p>
          </div>
          < button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors" >✕</button>
        </div>

        {/* Filtros */}
        <div className="px-6 py-4 bg-stone-50 border-b border-gray-100 flex flex-col gap-3" >
          <div className="flex gap-2" >
            <div className="relative flex-1 group" >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" >
                <i className="fas fa-search text-gray-400 group-focus-within:text-amber-500 transition-colors" > </i>
              </div>
              < input
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

          < div className="flex items-center gap-2 text-sm" >
            <span className="text-xs font-bold text-gray-400 uppercase mr-1" > Filtro(F2): </span>
            {
              [
                { id: 'codigo', label: 'Código Venda' },
                { id: 'cliente', label: 'Cliente' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => {
                    setFilterType(filter.id as any); inputRef.current?.focus();
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${filterType === filter.id ? 'bg-amber-400 border-amber-400 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-500'}`}
                >
                  {filter.label}
                </button>
              ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto bg-white p-2" >
          {/* Cabeçalho da Tabela */}
          < div className="grid grid-cols-12 px-4 py-2 text-xs font-bold text-gray-400 uppercase border-b border-gray-100 gap-2" >
            <div className="col-span-2" > Cód.Venda </div>
            < div className="col-span-3" > Data / Hora </div>
            < div className="col-span-4" > Cliente </div>
            < div className="col-span-2 text-right" > Valor </div>
            < div className="col-span-1 text-center" > Ação </div>
          </div>

          {/* Corpo da Tabela */}
          <div className="mt-1" >
            {
              filteredData.length > 0 ? filteredData.map((venda, index) => (
                <div
                  key={venda.VEN_CODIGO}
                  ref={el => { rowRefs.current[index] = el }}
                  onClick={() => setSelectedIndex(index)}
                  onDoubleClick={openPrintModal}
                  className={`
                  grid grid-cols-12 px-4 py-2.5 my-1 rounded-md cursor-pointer transition-colors text-sm items-center gap-2
                  ${selectedIndex === index ? "bg-amber-50 border border-amber-200 shadow-sm" : "hover:bg-stone-50 border border-transparent"}
                `}
                >
                  <div className={`col-span-2 font-bold ${selectedIndex === index ? "text-amber-600" : "text-gray-500"}`}> {venda.VEN_CODIGO} </div>
                  < div className="col-span-3 text-gray-600 text-xs" > {new Date(venda.VEN_DATA).toLocaleDateString()} {venda.VEN_HORA} </div>
                  < div className={`col-span-4 font-semibold truncate ${selectedIndex === index ? "text-gray-900" : "text-gray-700"}`}> {cliente || venda.VEN_CLI} </div>
                  < div className={`col-span-2 text-right font-bold ${selectedIndex === index ? "text-gray-900" : "text-gray-800"}`}> {formatCurrency(venda.VEN_VALOR)} </div>
                  < div className="col-span-1 text-center flex justify-center" >
                    <button
                      onClick={openPrintModal}
                      className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded text-xs font-bold border border-amber-200 hover:bg-amber-200"
                      title="Imprimir (I)"
                    >
                      <i className="fas fa-print" > </i>
                    </button>
                  </div>
                </div>
              )) : (
                <div className="h-40 flex flex-col items-center justify-center text-gray-300" >
                  <i className="fas fa-search text-3xl mb-2 opacity-50" > </i>
                  < span > Nenhuma venda encontrada </span>
                </div>
              )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-50 border-t border-gray-200 px-6 py-3 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase" >
          <div className="flex gap-4" >
            <span className="bg-gray-200 px-1.5 rounded text-gray-600" > I / ENTER Imprimir</span >
            <span className="bg-gray-200 px-1.5 rounded text-gray-600" > F2 Filtrar</span >
          </div>
          <span className="bg-red-100 px-1.5 rounded text-red-500" > ESC Sair</span >
        </div>

      </div>

      {/* Modal Filho: Impressão */}
      <ModalImprimirVenda
        isOpen={!!selectedVendaParaImpressao}
        onClose={() => {
          setSelectedVendaParaImpressao(null);
          // Retorna o foco para o modal de busca
          setTimeout(() => containerRef.current?.focus(), 50);
        }}
        venda={selectedVendaParaImpressao}
        funcionario={funcionario}
        cliente={cliente}
      />
    </div>
  );
}