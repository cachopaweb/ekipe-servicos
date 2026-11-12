"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PedidoRepository from "@/app/repositories/pedido_repository";
import { PedidoModel } from "@/app/models/pedido_model";
import ClientRepository from "@/app/repositories/cliente_repository";
import { FolderOpen, Loader2, Search, Trash2, X } from "lucide-react";
import ModalConfirmacao from "@/app/home/orcamentos/components/modal_confirmacao";

// Estende a interface do modelo para incluir o nome do cliente na visualização
interface PedidoVisualizacao extends PedidoModel {
  CLI_NOME?: string;
}

interface ModalBuscarVendaProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (pedido: PedidoModel) => void;
}

export default function ModalBuscarVenda({ isOpen, onClose, onSelect }: ModalBuscarVendaProps) {
  // Estados
  const [searchTerm, setSearchTerm] = useState("");
  // Padronizei o tipo para 'cliente_nome' para evitar confusão
  const [filterType, setFilterType] = useState<"pedido" | "cliente_nome">("pedido");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pedidos, setPedidos] = useState<PedidoVisualizacao[]>([]);
  const [loading, setLoading] = useState(false);

  const [confirmacao, setConfirmacao] = useState<{
    isOpen: boolean;
    tipo: 'danger' | 'success' | 'warning' | 'info';
    titulo: string;
    mensagem: string;
    acaoConfirmar: () => void;
  }>({
    isOpen: false,
    tipo: 'info',
    titulo: '',
    mensagem: '',
    acaoConfirmar: () => { }
  });

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  const pedidosRepository = new PedidoRepository();

  // Formatadores
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "";
    }
  }

  // --- BUSCA DE DADOS ---
  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    try {
      const clientRepository = new ClientRepository();

      let tipoRepo: 'codigo' | 'cliente' = 'codigo';
      if (filterType === 'cliente_nome') tipoRepo = 'cliente';

      const dados = await pedidosRepository.getPedidos(searchTerm, tipoRepo);

      // CORREÇÃO AQUI: Garante que é array e filtra itens inválidos (ID 0 ou null)
      const listaSegura = Array.isArray(dados) ? dados : [];

      const filtrados = listaSegura.filter(p => {
        // Ignora registros vazios/inválidos que podem vir do backend
        if (!p || !p.PED_CODIGO) return false;

        if (!searchTerm) return true;
        if (filterType === 'pedido') return p.PED_CODIGO.toString().includes(searchTerm);
        // A busca por nome do cliente geralmente já é filtrada pelo repository (LIKE no SQL),
        // então retornamos true aqui para não esconder resultados válidos.
        return true;
      });

      filtrados.sort((a, b) => b.PED_CODIGO - a.PED_CODIGO);

      // 3. Busca os nomes dos clientes (Enrichment)
      const clientesIdsUnicos = Array.from(new Set(filtrados.map(p => p.PED_CLI)));
      const mapaNomesClientes: Record<number, string> = {};

      await Promise.all(clientesIdsUnicos.map(async (idCli) => {
        try {
          // Verifica se o ID do cliente é válido antes de buscar
          if (!idCli) return;
          const cliente = await clientRepository.getClienteById(idCli);
          mapaNomesClientes[idCli] = cliente.NOME;
        } catch {
          mapaNomesClientes[idCli] = "CLIENTE NÃO ENCONTRADO";
        }
      }));

      // 4. Monta o objeto final com o nome
      const pedidosComNomes: PedidoVisualizacao[] = filtrados.map(p => ({
        ...p,
        CLI_NOME: mapaNomesClientes[p.PED_CLI] || "CONSUMIDOR"
      }));

      setPedidos(pedidosComNomes);
      setSelectedIndex(0);

    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterType]);

  // Debounce da busca
  useEffect(() => {
    if (!isOpen) return;
    const timeoutId = setTimeout(() => {
      fetchPedidos();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, isOpen, fetchPedidos]);

  // Foco Inicial
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      fetchPedidos();
    }
  }, [isOpen, fetchPedidos]);

  // Scroll Automático
  useEffect(() => {
    if (rowRefs.current[selectedIndex]) {
      rowRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  const fecharConfirmacao = () => {
    setConfirmacao(prev => ({ ...prev, isOpen: false }));
  };

  // Atalhos de teclado globais quando o modal está aberto (funciona mesmo após clique do mouse)
  useEffect(() => {
    if (!isOpen || confirmacao.isOpen) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev < pedidos.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (pedidos[selectedIndex]) {
          onSelect(pedidos[selectedIndex]);
          onClose();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "F2") {
        e.preventDefault();
        setFilterType(prev => prev === "pedido" ? "cliente_nome" : "pedido");
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, confirmacao.isOpen, pedidos, selectedIndex, onSelect, onClose]);

  const handleExcluirPedido = async (pedido: PedidoModel) => {
    setConfirmacao({
      isOpen: true,
      tipo: 'warning',
      titulo: 'Apagar pedido?',
      mensagem: 'Este pedido será apagado permanentemente.',
      acaoConfirmar: async () => {
        const repo = new PedidoRepository();
        await repo.removePedidosEProdutos(pedido.PED_CODIGO);
        await fetchPedidos();
        fecharConfirmacao();
      }
    });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 outline-none">
      <div className="bg-ek-surface w-full max-w-4xl h-[85vh] md:h-[600px] flex flex-col rounded-[8px] border border-ek-border overflow-hidden font-sans">

        {/* HEADER */}
        <div className="bg-ek-raised px-5 py-3.5 border-b border-ek-border flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-1 h-4 bg-brand rounded-full" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-ek-text flex items-center gap-2">
                <Search className="w-4 h-4 text-brand" />
                <span>Buscar pedido salvo</span>
              </h2>
              <p className="text-xs text-ek-muted">Selecione um pedido para carregar na venda</p>
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

        {/* FILTROS E INPUT */}
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
              placeholder={`Pesquisar por ${filterType === 'pedido' ? 'código do pedido' : 'nome do cliente'}...`}
              className="ek-input pl-9 uppercase font-medium"
              autoComplete="off"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-ek-muted mr-1">Filtro (F2):</span>
            <button
              onClick={() => { setFilterType('pedido'); inputRef.current?.focus(); }}
              className={`px-3 py-1 rounded-[6px] text-xs font-medium border transition-colors ${filterType === 'pedido'
                ? 'bg-brand border-brand text-white'
                : 'bg-ek-surface border-ek-border text-ek-muted hover:text-ek-text hover:bg-ek-raised'
              }`}
            >
              Cód. pedido
            </button>
            <button
              onClick={() => { setFilterType('cliente_nome'); inputRef.current?.focus(); }}
              className={`px-3 py-1 rounded-[6px] text-xs font-medium border transition-colors ${filterType === 'cliente_nome'
                ? 'bg-brand border-brand text-white'
                : 'bg-ek-surface border-ek-border text-ek-muted hover:text-ek-text hover:bg-ek-raised'
              }`}
            >
              Nome do cliente
            </button>
          </div>
        </div>

        {/* LISTAGEM (GRID) */}
        <div ref={listRef} className="flex-1 overflow-y-auto bg-ek-surface min-h-0">
          <div className="grid grid-cols-12 px-5 py-2 text-xs font-semibold text-ek-muted border-b border-ek-border bg-ek-raised gap-2 sticky top-0 z-10">
            <div className="col-span-2">Pedido</div>
            <div className="col-span-2">Data</div>
            <div className="col-span-1 text-center">Cód. cli</div>
            <div className="col-span-3">Nome cliente</div>
            <div className="col-span-2 text-right">Valor</div>
            <div className="col-span-2 text-right">Ação</div>
          </div>

          <div className="divide-y divide-ek-rule">
            {pedidos.length > 0 ? pedidos.map((pedido, index) => (
              <div
                key={pedido.PED_CODIGO}
                ref={el => { rowRefs.current[index] = el }}
                onClick={() => {
                  setSelectedIndex(index);
                  inputRef.current?.focus();
                }}
                onDoubleClick={() => { onSelect(pedido); onClose(); }}
                className={`grid grid-cols-12 px-5 py-2.5 cursor-pointer transition-colors text-[13px] items-center gap-2 ${
                  selectedIndex === index
                    ? "bg-brand-soft border-l-2 border-l-brand"
                    : "hover:bg-ek-raised/80"
                }`}
              >
                <div className={`col-span-2 font-semibold tabular-nums ${selectedIndex === index ? "text-brand" : "text-ek-text"}`}>
                  #{pedido.PED_CODIGO}
                </div>
                <div className="col-span-2 text-ek-muted text-xs tabular-nums">
                  {formatDate(pedido.PED_DATA)}
                </div>
                <div className="col-span-1 text-center text-ek-muted text-xs font-mono tabular-nums">
                  {pedido.PED_CLI}
                </div>
                <div className="col-span-3 font-medium text-ek-text truncate">
                  {pedido.CLI_NOME || "CONSUMIDOR"}
                </div>
                <div className={`col-span-2 text-right font-semibold tabular-nums ${selectedIndex === index ? "text-emerald-700" : "text-ek-text"}`}>
                  {formatCurrency(pedido.PED_VALOR)}
                </div>
                <div className="col-span-2 flex justify-end">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await handleExcluirPedido(pedido);
                    }}
                    className="p-1.5 rounded-[6px] text-ek-faint hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Excluir pedido"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )) : (
              <div className="h-44 flex flex-col items-center justify-center text-ek-muted gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-brand" />
                    <span className="text-xs">Buscando pedidos...</span>
                  </>
                ) : (
                  <>
                    <FolderOpen className="w-7 h-7 text-ek-faint" />
                    <span className="text-sm font-medium">Nenhum pedido encontrado</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-ek-raised border-t border-ek-border px-5 py-3 flex justify-between items-center shrink-0 text-xs text-ek-muted">
          <div className="flex gap-4 items-center">
            <span className="flex items-center gap-1.5"><kbd className="ek-kbd">ENTER</kbd> Selecionar</span>
            <span className="flex items-center gap-1.5"><kbd className="ek-kbd">F2</kbd> Alternar filtro</span>
          </div>

          <button
            onClick={onClose}
            className="ek-btn-secondary h-8 px-3 text-xs flex items-center gap-1.5"
          >
            <kbd className="ek-kbd">ESC</kbd>
            <span>Cancelar</span>
          </button>
        </div>

      </div>

      <ModalConfirmacao
        isOpen={confirmacao.isOpen}
        onClose={fecharConfirmacao}
        onConfirm={confirmacao.acaoConfirmar}
        title={confirmacao.titulo}
        message={confirmacao.mensagem}
        type={confirmacao.tipo}
      />
    </div>
  );
}