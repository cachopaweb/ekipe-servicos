"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// Definição do Tipo Cliente
export interface Cliente {
  id: number;
  nome: string;
  cpf_cnpj: string;
  fone: string;
  endereco: string;
  rg: string;
  celular: string;
}

// Dados Mockados
const MOCK_CLIENTES: Cliente[] = [
  { id: 1, nome: "CONSUMIDOR", cpf_cnpj: "000.000.000-00", fone: "(67)3333-3333", endereco: "RUA PRINCIPAL", rg: "0", celular: "" },
  { id: 10, nome: "AUTO PEÇAS BRASIL IMPORT LTDA", cpf_cnpj: "05.345.540/0001-2", fone: "(67)3342-5454", endereco: "AV. DAS BANDEIRAS", rg: "", celular: "" },
  { id: 11, nome: "BICA D ÁGUA MATERIAS DE CONSTRUÇÃO", cpf_cnpj: "33.076.688/0001-4", fone: "(67)3458-5151", endereco: "RUA DO PORTO", rg: "", celular: "" },
  { id: 12, nome: "BIGOLIN MATERIAIS DE CONSTRUÇÃO (LOJA 3)", cpf_cnpj: "15.505.704/0003-5", fone: "(67)3345-5454", endereco: "AV. CALÓGERAS", rg: "", celular: "" },
  { id: 13, nome: "BIGOLIN MATERIAIS DE CONSTRUÇÃO (LOJA 7)", cpf_cnpj: "15.505.704/0007-8", fone: "(67)3411-5588", endereco: "AV. COSTA E SILVA", rg: "", celular: "" },
  { id: 19, nome: "CAMBARU MATERIAIS DE CONSTRUÇÃO LTDA", cpf_cnpj: "07.159.563/0001-7", fone: "(67)3409-7070", endereco: "RUA CAMBARU", rg: "", celular: "" },
  { id: 31, nome: "FERNANDA GORGEN CUNHA", cpf_cnpj: "014.475.931-46", fone: "(64)9998-4039", endereco: "RUA DOS IPÊS", rg: "123456", celular: "(64)9998-4039" },
  { id: 51, nome: "NISHIOKA & CIA LTDA", cpf_cnpj: "15.354.158/0001-3", fone: "(67)3032-7001", endereco: "RUA JAPÃO", rg: "", celular: "" },
];

interface ModalClientesProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (cliente: Cliente) => void;
}

export default function ModalClientes({ isOpen, onClose, onSelect }: ModalClientesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"nome" | "codigo" | "cpf">("nome");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredData, setFilteredData] = useState<Cliente[]>(MOCK_CLIENTES);

  const rowRefs = useRef<(HTMLDivElement | null)[]>([]); // Mudado para DIV pois modernizei a tabela
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtragem
  useEffect(() => {
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = MOCK_CLIENTES.filter(c => {
      if (filterType === "nome") return c.nome.toLowerCase().includes(lowerSearch);
      if (filterType === "codigo") return c.id.toString().includes(lowerSearch);
      if (filterType === "cpf") return c.cpf_cnpj.includes(lowerSearch);
      return true;
    });
    setFilteredData(filtered);
    setSelectedIndex(0);
  }, [searchTerm, filterType]);

  // Foco inicial
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Scroll automático
  useEffect(() => {
    if (rowRefs.current[selectedIndex]) {
      rowRefs.current[selectedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth"
      });
    }
  }, [selectedIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredData.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredData[selectedIndex]) {
        onSelect(filteredData[selectedIndex]);
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "F2") {
      e.preventDefault();
      const filters: ("nome" | "codigo" | "cpf")[] = ["codigo", "nome", "cpf"];
      const currentIdx = filters.indexOf(filterType);
      const nextIdx = (currentIdx + 1) % filters.length;
      setFilterType(filters[nextIdx]);
    }
  }, [filteredData, selectedIndex, onSelect, onClose, filterType]);

  if (!isOpen) return null;

  const clienteSelecionado = filteredData[selectedIndex] || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onKeyDown={handleKeyDown}>

      <div className="bg-white w-full max-w-4xl h-[85vh] md:h-[650px] flex flex-col rounded-xl shadow-2xl overflow-hidden font-sans border border-gray-200">

        {/* HEADER */}
        <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">LOCALIZAR CLIENTE</h2>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">Use as setas para navegar e Enter para confirmar</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ÁREA DE BUSCA */}
        <div className="px-6 py-4 bg-stone-50 border-b border-gray-100 flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400 group-focus-within:text-amber-500 transition-colors"></i>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Pesquisar por ${filterType === 'codigo' ? 'código' : filterType === 'cpf' ? 'CPF/CNPJ' : 'nome'}...`}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all uppercase text-sm font-semibold text-gray-700 bg-white shadow-sm"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Filtros Modernos (Pills) */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xs font-bold text-gray-400 uppercase mr-1">Filtro (F2):</span>
            {[
              { id: 'nome', label: 'Nome' },
              { id: 'codigo', label: 'Código' },
              { id: 'cpf', label: 'CPF/CNPJ' }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => {
                  setFilterType(filter.id as any);
                  inputRef.current?.focus();
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${filterType === filter.id
                  ? 'bg-amber-400 border-amber-400 text-white shadow-sm'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-500'
                  }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* LISTAGEM (GRID) */}
        <div className="flex-1 overflow-y-auto bg-white p-2">
          {/* Cabeçalho da Tabela */}
          <div className="grid grid-cols-12 px-4 py-2 text-xs font-bold text-gray-400 uppercase border-b border-gray-100">
            <div className="col-span-1">Cód.</div>
            <div className="col-span-6">Nome / Razão Social</div>
            <div className="col-span-3">CPF / CNPJ</div>
            <div className="col-span-2 text-right">Telefone</div>
          </div>

          {/* Linhas */}
          <div className="mt-1">
            {filteredData.length > 0 ? filteredData.map((cliente, index) => (
              <div
                key={cliente.id}
                ref={el => { rowRefs.current[index] = el }}
                onClick={() => setSelectedIndex(index)}
                onDoubleClick={() => { onSelect(cliente); onClose(); }}
                className={`
                  grid grid-cols-12 px-4 py-2.5 my-1 rounded-md cursor-pointer transition-colors text-sm items-center
                  ${selectedIndex === index
                    ? "bg-amber-50 border border-amber-200 shadow-sm"
                    : "hover:bg-stone-50 border border-transparent"}
                `}
              >
                <div className={`col-span-1 font-bold ${selectedIndex === index ? "text-amber-600" : "text-gray-500"}`}>
                  {cliente.id}
                </div>
                <div className={`col-span-6 font-semibold truncate pr-2 ${selectedIndex === index ? "text-gray-900" : "text-gray-700"}`}>
                  {cliente.nome}
                </div>
                <div className="col-span-3 text-gray-500 text-xs">
                  {cliente.cpf_cnpj}
                </div>
                <div className="col-span-2 text-right text-gray-500 text-xs">
                  {cliente.fone}
                </div>
              </div>
            )) : (
              <div className="h-40 flex flex-col items-center justify-center text-gray-300">
                <i className="fas fa-search text-3xl mb-2 opacity-50"></i>
                <span>Nenhum cliente encontrado</span>
              </div>
            )}
          </div>
        </div>

        {/* PAINEL DE DETALHES (Footer Informativo) */}
        <div className="bg-stone-50 border-t border-gray-200 px-6 py-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-white p-2 rounded border border-gray-200 shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Endereço</span>
              <span className="font-semibold text-gray-700 block truncate">{clienteSelecionado.endereco || "-"}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white p-2 rounded border border-gray-200 shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">RG</span>
                <span className="font-semibold text-gray-700 block truncate">{clienteSelecionado.rg || "-"}</span>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200 shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Celular</span>
                <span className="font-semibold text-gray-700 block truncate">{clienteSelecionado.celular || "-"}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200 text-[10px] font-bold text-gray-400 uppercase">
            <div className="flex gap-4">
              <span className="flex items-center gap-1"><span className="bg-gray-200 px-1.5 rounded text-gray-600">ENTER</span> Selecionar</span>
              <span className="flex items-center gap-1"><span className="bg-gray-200 px-1.5 rounded text-gray-600">F2</span> Filtrar</span>
            </div>
            <span className="flex items-center gap-1"><span className="bg-red-100 px-1.5 rounded text-red-500">ESC</span> Cancelar</span>
          </div>
        </div>

      </div>
    </div>
  );
}