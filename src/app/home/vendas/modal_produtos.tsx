"use client";

import ProdutoRepository from "@/app/repositories/produto_repository";
import { useState, useEffect, useRef, useCallback } from "react";

// Definição do Tipo Produto
export interface Produto {
  id: number;
  nome: string;
  ncm: string;
  estoque: number;
  custo: number;
  precoVenda: number;
  fabricante: string;
  grupo: string;
}

// DADOS FICAM SOMENTE AQUI (Privados ao módulo, não exportamos a lista inteira)
const MOCK_PRODUTOS: Produto[] = [
  { id: 1, nome: "GENERICO", ncm: "11111111", estoque: 80, custo: 0.00, precoVenda: 1.00, fabricante: "GENERICO", grupo: "GERAL" },
  { id: 2, nome: "PEK IMPER 1L", ncm: "38099390", estoque: 10, custo: 109.46, precoVenda: 277.70, fabricante: "PISOCLEAN", grupo: "IMPERMEABILIZANTES" },
  { id: 3, nome: "LIMPEZA DIARIA LP 1L", ncm: "34029031", estoque: 122, custo: 14.42, precoVenda: 35.69, fabricante: "PISOCLEAN", grupo: "LIMPEZA" },
  { id: 4, nome: "DESINCRUSTANTE LP 1L", ncm: "38249941", estoque: 52, custo: 22.20, precoVenda: 54.95, fabricante: "PISOCLEAN", grupo: "LIMPEZA PESADA" },
  { id: 5, nome: "LIMPEZA PESADA LP 1L", ncm: "34023990", estoque: 68, custo: 19.67, precoVenda: 48.69, fabricante: "PISOCLEAN", grupo: "LIMPEZA PESADA" },
  { id: 6, nome: "REJUNTE RENEW 500ML", ncm: "38249941", estoque: 29, custo: 16.18, precoVenda: 40.02, fabricante: "PISOCLEAN", grupo: "ACABAMENTO" },
  { id: 7, nome: "PEK LIMPA PEDRAS 1L", ncm: "38249941", estoque: 11, custo: 23.89, precoVenda: 56.58, fabricante: "PISOCLEAN", grupo: "PEDRAS" },
  { id: 8, nome: "PEK LIMPA PEDRAS 5L", ncm: "38249941", estoque: 0, custo: 44.67, precoVenda: 185.63, fabricante: "PISOCLEAN", grupo: "PEDRAS" },
  { id: 11, nome: "DESINCRUSTANTE LP 5L", ncm: "38249941", estoque: 21, custo: 68.10, precoVenda: 168.56, fabricante: "PISOCLEAN", grupo: "LIMPEZA PESADA" },
];

// --- FUNÇÃO DE BUSCA (SIMULA O BACKEND) ---
// O componente principal usará isso para validar o código digitado
export const buscarProdutoPorCodigo = async (codigo: string) => {
  const produtoRepository = new ProdutoRepository();
  const response = await produtoRepository.getProdutoPorCodigo(parseInt(codigo));
  console.log(response);
  return MOCK_PRODUTOS.find(p => p.id.toString() === codigo);
};

interface ModalProdutosProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (produto: Produto) => void;
}

export default function ModalProdutos({ isOpen, onClose, onSelect }: ModalProdutosProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"nome" | "codigo">("nome");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredData, setFilteredData] = useState<Produto[]>(MOCK_PRODUTOS);

  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Formatação de Moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Filtragem
  useEffect(() => {
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = MOCK_PRODUTOS.filter(p => {
      if (filterType === "nome") return p.nome.toLowerCase().includes(lowerSearch);
      if (filterType === "codigo") return p.id.toString().includes(lowerSearch);
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
      setFilterType(prev => prev === "nome" ? "codigo" : "nome");
    }
  }, [filteredData, selectedIndex, onSelect, onClose]);

  if (!isOpen) return null;

  const produtoSelecionado = filteredData[selectedIndex] || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onKeyDown={handleKeyDown}>

      <div className="bg-white w-full max-w-5xl h-[85vh] md:h-[650px] flex flex-col rounded-xl shadow-2xl overflow-hidden font-sans border border-gray-200">

        {/* HEADER */}
        <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">LOCALIZADOR DE PRODUTOS</h2>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">Selecione o produto para adicionar à venda</p>
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
                placeholder={`Pesquisar produto por ${filterType}...`}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all uppercase text-sm font-semibold text-gray-700 bg-white shadow-sm"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xs font-bold text-gray-400 uppercase mr-1">Filtro (F2):</span>
            {[
              { id: 'nome', label: 'Nome' },
              { id: 'codigo', label: 'Código' },
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
          {/* Cabeçalho */}
          <div className="grid grid-cols-12 px-4 py-2 text-xs font-bold text-gray-400 uppercase border-b border-gray-100 gap-2">
            <div className="col-span-1">Cód.</div>
            <div className="col-span-5">Nome do Produto</div>
            <div className="col-span-2">NCM</div>
            <div className="col-span-1 text-center">Est.</div>
            <div className="col-span-1 text-right">Custo</div>
            <div className="col-span-2 text-right">Venda</div>
          </div>

          {/* Linhas */}
          <div className="mt-1">
            {filteredData.length > 0 ? filteredData.map((prod, index) => (
              <div
                key={prod.id}
                ref={el => { rowRefs.current[index] = el }}
                onClick={() => setSelectedIndex(index)}
                onDoubleClick={() => { onSelect(prod); onClose(); }}
                className={`
                  grid grid-cols-12 px-4 py-2.5 my-1 rounded-md cursor-pointer transition-colors text-sm items-center gap-2
                  ${selectedIndex === index
                    ? "bg-amber-50 border border-amber-200 shadow-sm"
                    : "hover:bg-stone-50 border border-transparent"}
                `}
              >
                <div className={`col-span-1 font-bold ${selectedIndex === index ? "text-amber-600" : "text-gray-500"}`}>
                  {prod.id}
                </div>
                <div className={`col-span-5 font-semibold truncate pr-2 ${selectedIndex === index ? "text-gray-900" : "text-gray-700"}`}>
                  {prod.nome}
                </div>
                <div className="col-span-2 text-gray-500 text-xs truncate">
                  {prod.ncm}
                </div>
                <div className={`col-span-1 text-center text-xs font-bold ${prod.estoque <= 0 ? 'text-red-500' : 'text-gray-600'}`}>
                  {prod.estoque}
                </div>
                <div className="col-span-1 text-right text-gray-400 text-xs">
                  {formatCurrency(prod.custo)}
                </div>
                <div className={`col-span-2 text-right font-bold ${selectedIndex === index ? "text-gray-900" : "text-gray-800"}`}>
                  {formatCurrency(prod.precoVenda)}
                </div>
              </div>
            )) : (
              <div className="h-40 flex flex-col items-center justify-center text-gray-300">
                <i className="fas fa-box-open text-3xl mb-2 opacity-50"></i>
                <span>Nenhum produto encontrado</span>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER INFORMATIVO */}
        <div className="bg-stone-50 border-t border-gray-200 px-6 py-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-3">
            <div className="bg-white p-2 rounded border border-gray-200 shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Fabricante</span>
              <span className="font-semibold text-gray-700 block truncate">{produtoSelecionado.fabricante || "-"}</span>
            </div>
            <div className="bg-white p-2 rounded border border-gray-200 shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Grupo</span>
              <span className="font-semibold text-gray-700 block truncate">{produtoSelecionado.grupo || "-"}</span>
            </div>
            <div className="bg-white p-2 rounded border border-gray-200 shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Local</span>
              <span className="font-semibold text-gray-700 block truncate">LOJA 1</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-[10px] font-bold text-gray-400 uppercase">
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