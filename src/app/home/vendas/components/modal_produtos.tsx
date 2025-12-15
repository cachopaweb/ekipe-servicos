"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ProdutoRepository from "@/app/repositories/produto_repository";
import { ProdutoModel } from "@/app/models/produto_model";

// Interface utilizada pela tela (Frontend)
export interface Produto {
  codigo: number;
  nome: string;
  ncm: string;
  estoque: number;
  custo: number;
  precoVenda: number;
  precoAtacado: number;
  fabricante: string;
  grupo: string;
  local: string;
}

// Função auxiliar para converter o Model do Banco para a Interface da Tela
const mapToProduto = (model: ProdutoModel): Produto => ({
  codigo: model.PRO_CODIGO,
  nome: model.PRO_NOME,
  ncm: model.PRO_NCM || "",
  estoque: model.PRO_QUANTIDADE || 0,
  custo: model.PRO_VALORC || 0,
  precoVenda: model.PRO_VALORV || 0,
  precoAtacado: model.PRO_VALORV_ATACADO || model.PRO_VALORV || 0,
  fabricante: model.PRO_FABRICANTE || "",
  grupo: "", // Campo não presente no ProdutoModel atual
  local: model.PRO_LOCAL || ""
});

// --- FUNÇÃO AUXILIAR EXPORTADA ---
// Busca um produto único pelo código para a tela de vendas
export const buscarProdutoPorCodigo = async (codigo: string, quantItemsUsados: number = 0) => {
  try {
    const repository = new ProdutoRepository();
    const response = await repository.getProdutoPorCodigo(parseInt(codigo));

    if (!response) return null;

    const estoqueAtual = response.PRO_QUANTIDADE ?? 0;

    // Retorna no formato que a tela de vendas espera
    return mapToProduto(response);

  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    return null;
  }
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

  // Estado dos dados e paginação
  const [filteredData, setFilteredData] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null); // Ref para o container da lista (scroll)

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // --- BUSCA NO SERVIDOR COM PAGINAÇÃO ---
  const fetchProdutos = useCallback(async (isNewSearch: boolean = false) => {
    if (loading) return;
    if (!isNewSearch && !hasMore) return;

    setLoading(true);
    try {
      const repository = new ProdutoRepository();
      const currentPage = isNewSearch ? 1 : page;
      const limit = 20; // Traz 20 itens por vez

      // Chama o repositório passando a busca, página e limite
      // Nota: Seu ProdutoRepository precisa aceitar (busca, page, limit) no método getProdutos
      const dadosModel = await repository.getProdutos(searchTerm, currentPage, limit);

      const novosProdutos = dadosModel.map(mapToProduto);

      // Filtragem local adicional caso a API retorne tudo (segurança)
      const filtrados = novosProdutos.filter(p => {
        if (!searchTerm) return true;
        if (filterType === 'codigo') return p.codigo.toString().includes(searchTerm);
        // A busca por nome já deve ser feita no SQL (LIKE)
        return true;
      });

      if (isNewSearch) {
        setFilteredData(filtrados);
        setPage(2);
        setSelectedIndex(0);
        setHasMore(dadosModel.length === limit);
        if (listRef.current) listRef.current.scrollTop = 0;
      } else {
        setFilteredData(prev => [...prev, ...filtrados]);
        setPage(prev => prev + 1);
        setHasMore(dadosModel.length === limit);
      }
    } catch (error) {
      console.error("Erro ao listar produtos:", error);
      if (isNewSearch) setFilteredData([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterType, page, hasMore, loading]);

  // Debounce na digitação
  useEffect(() => {
    if (!isOpen) return;
    const timeoutId = setTimeout(() => {
      // Reseta e busca novamente
      setPage(1);
      setHasMore(true);

      const run = async () => {
        // Pequeno hack para garantir que o estado page=1 seja considerado se o fetch ler o estado
      };
      // A melhor forma é chamar fetchProdutos(true) diretamente:
      fetchProdutos(true);

    }, 500);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, isOpen]); // Removido fetchProdutos das dependências para evitar loop com o useCallback

  // Foco inicial
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      fetchProdutos(true); // Carrega lista inicial
    }
  }, [isOpen]);

  // Scroll automático teclado
  useEffect(() => {
    if (rowRefs.current[selectedIndex]) {
      rowRefs.current[selectedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth"
      });
    }
  }, [selectedIndex]);

  // --- HANDLER DE SCROLL INFINITO ---
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Se chegou perto do fim (50px de margem)
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (hasMore && !loading) {
        fetchProdutos(false); // Carrega mais
      }
    }
  };

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
      setTimeout(() => inputRef.current?.focus(), 50);
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
                <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-search'} text-gray-400 group-focus-within:text-amber-500 transition-colors`}></i>
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
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto bg-white p-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
          onScroll={handleScroll}
        >
          {/* Cabeçalho */}
          <div className="grid grid-cols-12 px-4 py-2 text-xs font-bold text-gray-400 uppercase border-b border-gray-100 gap-2 sticky top-0 bg-white z-10 shadow-sm">
            <div className="col-span-1">Cód.</div>
            <div className="col-span-5">Nome do Produto</div>
            <div className="col-span-2">NCM</div>
            <div className="col-span-1 text-center">Est.</div>
            <div className="col-span-1 text-right">Custo</div>
            <div className="col-span-2 text-right">Venda</div>
          </div>

          {/* Linhas */}
          <div className="mt-1 pb-2">
            {filteredData.length > 0 ? filteredData.map((prod, index) => (
              <div
                key={`${prod.codigo}-${index}`}
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
                  {prod.codigo}
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
              !loading && (
                <div className="h-40 flex flex-col items-center justify-center text-gray-300">
                  <i className="fas fa-box-open text-3xl mb-2 opacity-50"></i>
                  <span>Nenhum produto encontrado</span>
                </div>
              )
            )}

            {/* Loading Indicator no fim da lista */}
            {loading && (
              <div className="py-4 text-center text-gray-400 text-xs flex justify-center items-center gap-2">
                <i className="fas fa-circle-notch fa-spin"></i>
                <span>Carregando mais...</span>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER INFORMATIVO */}
        <div className="bg-stone-50 border-t border-gray-200 px-6 py-3 shrink-0">
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
              <span className="font-semibold text-gray-700 block truncate">{produtoSelecionado.local || "LOJA 1"}</span>
            </div>
            <div className="bg-white p-2 rounded border border-gray-200 shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Preço Atacado</span>
              <span className="font-semibold text-blue-600 block truncate">{formatCurrency(produtoSelecionado.precoAtacado)}</span>
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