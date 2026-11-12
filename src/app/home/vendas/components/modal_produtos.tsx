"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, PackageOpen, Search, X } from "lucide-react";
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

  // Atalhos de teclado globais quando o modal está aberto (funciona mesmo após clique do mouse)
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
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
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, filteredData, selectedIndex, onSelect, onClose]);

  if (!isOpen) return null;

  const produtoSelecionado = filteredData[selectedIndex] || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">

      <div className="bg-ek-surface w-full max-w-5xl h-[85vh] md:h-[650px] flex flex-col rounded-[8px] border border-ek-border overflow-hidden font-sans">

        {/* HEADER */}
        <div className="bg-ek-raised px-5 py-3.5 border-b border-ek-border flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-1 h-4 bg-brand rounded-full" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-ek-text flex items-center gap-2">
                <Search className="w-4 h-4 text-brand" />
                <span>Localizador de produtos</span>
              </h2>
              <p className="text-xs text-ek-muted">Selecione o produto para adicionar à venda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-[6px] text-ek-muted hover:bg-ek-active hover:text-ek-text transition-colors"
            title="Fechar (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ÁREA DE BUSCA */}
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
              placeholder={`Pesquisar produto por ${filterType}...`}
              className="ek-input pl-9 uppercase font-medium"
              autoComplete="off"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-ek-muted mr-1">Filtro (F2):</span>
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

        {/* LISTAGEM (GRID) */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto bg-ek-surface min-h-0"
          onScroll={handleScroll}
        >
          <div className="grid grid-cols-12 px-5 py-2 text-xs font-semibold text-ek-muted border-b border-ek-border bg-ek-raised gap-2 sticky top-0 z-10">
            <div className="col-span-1">Cód.</div>
            <div className="col-span-5">Nome do produto</div>
            <div className="col-span-2">NCM</div>
            <div className="col-span-1 text-center">Est.</div>
            <div className="col-span-1 text-right">Custo</div>
            <div className="col-span-2 text-right">Venda</div>
          </div>

          <div className="divide-y divide-ek-rule">
            {filteredData.length > 0 ? filteredData.map((prod, index) => (
              <div
                key={`${prod.codigo}-${index}`}
                ref={el => { rowRefs.current[index] = el }}
                onClick={() => {
                  setSelectedIndex(index);
                  inputRef.current?.focus();
                }}
                onDoubleClick={() => { onSelect(prod); onClose(); }}
                className={`grid grid-cols-12 px-5 py-2.5 cursor-pointer transition-colors text-[13px] items-center gap-2 ${
                  selectedIndex === index
                    ? "bg-brand-soft border-l-2 border-l-brand"
                    : "hover:bg-ek-raised/80"
                }`}
              >
                <div className={`col-span-1 font-semibold tabular-nums ${selectedIndex === index ? "text-brand" : "text-ek-muted"}`}>
                  {prod.codigo}
                </div>
                <div className="col-span-5 font-medium text-ek-text truncate pr-2">
                  {prod.nome}
                </div>
                <div className="col-span-2 text-ek-muted text-xs truncate font-mono tabular-nums">
                  {prod.ncm}
                </div>
                <div className={`col-span-1 text-center text-xs font-semibold tabular-nums ${prod.estoque <= 0 ? 'text-rose-600' : 'text-ek-text'}`}>
                  {prod.estoque}
                </div>
                <div className="col-span-1 text-right text-ek-muted text-xs tabular-nums">
                  {formatCurrency(prod.custo)}
                </div>
                <div className="col-span-2 text-right font-semibold text-ek-text tabular-nums">
                  {formatCurrency(prod.precoVenda)}
                </div>
              </div>
            )) : (
              !loading && (
                <div className="h-44 flex flex-col items-center justify-center text-ek-muted gap-2">
                  <PackageOpen className="w-7 h-7 text-ek-faint" />
                  <span className="text-sm font-medium">Nenhum produto encontrado</span>
                </div>
              )
            )}

            {loading && (
              <div className="py-4 text-center text-ek-muted text-xs flex justify-center items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand" />
                <span>Carregando produtos...</span>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER INFORMATIVO */}
        <div className="bg-ek-raised border-t border-ek-border px-5 py-3 shrink-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-2.5">
            <div className="bg-ek-surface px-3 py-2 rounded-[6px] border border-ek-border">
              <span className="text-[11px] font-medium text-ek-muted block mb-0.5">Fabricante</span>
              <span className="font-medium text-ek-text block truncate">{produtoSelecionado.fabricante || "-"}</span>
            </div>
            <div className="bg-ek-surface px-3 py-2 rounded-[6px] border border-ek-border">
              <span className="text-[11px] font-medium text-ek-muted block mb-0.5">Grupo</span>
              <span className="font-medium text-ek-text block truncate">{produtoSelecionado.grupo || "-"}</span>
            </div>
            <div className="bg-ek-surface px-3 py-2 rounded-[6px] border border-ek-border">
              <span className="text-[11px] font-medium text-ek-muted block mb-0.5">Local</span>
              <span className="font-medium text-ek-text block truncate">{produtoSelecionado.local || "LOJA 1"}</span>
            </div>
            <div className="bg-ek-surface px-3 py-2 rounded-[6px] border border-ek-border">
              <span className="text-[11px] font-medium text-ek-muted block mb-0.5">Preço atacado</span>
              <span className="font-semibold text-brand block truncate tabular-nums">{formatCurrency(produtoSelecionado.precoAtacado)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-ek-rule text-xs text-ek-muted">
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5"><kbd className="ek-kbd">ENTER</kbd> Selecionar</span>
              <span className="flex items-center gap-1.5"><kbd className="ek-kbd">F2</kbd> Filtrar</span>
            </div>
            <button onClick={onClose} className="flex items-center gap-1.5 hover:text-ek-text">
              <kbd className="ek-kbd">ESC</kbd> Cancelar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}