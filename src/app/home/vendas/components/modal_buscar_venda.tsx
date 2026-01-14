"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PedidoRepository from "@/app/repositories/pedido_repository";
import { PedidoModel } from "@/app/models/pedido_model";
import ClientRepository from "@/app/repositories/cliente_repository";
import { Trash } from "lucide-react";
import ModalConfirmacao from "./modal_confirmar";

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

  // --- HANDLERS ---
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
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
      // Corrigido para alternar corretamente entre os tipos definidos no state
      setFilterType(prev => prev === "pedido" ? "cliente_nome" : "pedido");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [pedidos, selectedIndex, onSelect, onClose]);

  const fecharConfirmacao = () => {
    setConfirmacao(prev => ({ ...prev, isOpen: false }));
  };

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in outline-none"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white w-full max-w-4xl h-[85vh] md:h-[600px] flex flex-col rounded-xl shadow-2xl overflow-hidden font-sans border border-gray-300">

        {/* HEADER */}
        <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
              <i className="fas fa-search text-amber-500"></i> BUSCAR PEDIDO
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">Selecione um pedido salvo para carregar</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* FILTROS E INPUT */}
        <div className="px-6 py-4 bg-stone-50 border-b border-gray-100 flex flex-col gap-3 shrink-0">
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
                placeholder={`Pesquisar por ${filterType === 'pedido' ? 'Código do Pedido' : 'Nome do Cliente'}...`}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all uppercase text-sm font-semibold text-gray-700 bg-white shadow-sm"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-xs font-bold text-gray-400 uppercase mr-1">Filtro (F2):</span>

            <button
              onClick={() => { setFilterType('pedido'); inputRef.current?.focus(); }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${filterType === 'pedido'
                ? 'bg-amber-400 border-amber-400 text-white shadow-sm'
                : 'bg-white border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-500'
                }`}
            >
              Cód. Pedido
            </button>

            <button
              onClick={() => { setFilterType('cliente_nome'); inputRef.current?.focus(); }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${filterType === 'cliente_nome'
                ? 'bg-amber-400 border-amber-400 text-white shadow-sm'
                : 'bg-white border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-500'
                }`}
            >
              Nome Cliente
            </button>
          </div>
        </div>

        {/* LISTAGEM (GRID) */}
        <div ref={listRef} className="flex-1 overflow-y-auto bg-white p-2 min-h-0">

          {/* Header da Tabela */}
          <div className="grid grid-cols-12 px-4 py-2 text-xs font-bold text-gray-400 uppercase border-b border-gray-100 gap-2 sticky top-0 bg-white z-10 shadow-sm">
            <div className="col-span-2">Pedido</div>
            <div className="col-span-2">Data</div>
            <div className="col-span-1 text-center">Cód. Cli</div>
            <div className="col-span-3">Nome Cliente</div>
            <div className="col-span-2 text-right">Valor</div>
            <div className="col-span-2 text-right">Ação</div>
          </div>

          {/* Linhas */}
          <div className="mt-1 pb-2">
            {pedidos.length > 0 ? pedidos.map((pedido, index) => (
              <div
                key={pedido.PED_CODIGO}
                ref={el => { rowRefs.current[index] = el }}
                onClick={() => setSelectedIndex(index)}
                onDoubleClick={() => { onSelect(pedido); onClose(); }}
                className={`
                  grid grid-cols-12 px-4 py-3 my-1 rounded-md cursor-pointer transition-colors text-sm items-center gap-2 border
                  ${selectedIndex === index
                    ? "bg-amber-50 border-amber-200 shadow-sm ring-1 ring-amber-200 z-10 relative"
                    : "hover:bg-stone-50 border-transparent"}
                `}
              >
                <div className={`col-span-2 font-black ${selectedIndex === index ? "text-amber-600" : "text-gray-600"}`}>
                  #{pedido.PED_CODIGO}
                </div>
                <div className="col-span-2 text-gray-500 text-xs font-medium">
                  {formatDate(pedido.PED_DATA)}
                </div>
                <div className="col-span-1 text-center text-gray-400 text-xs bg-stone-100 rounded px-1 py-0.5">
                  {pedido.PED_CLI}
                </div>
                {/* Nome do Cliente */}
                <div className={`col-span-3 font-bold truncate ${selectedIndex === index ? "text-gray-800" : "text-gray-600"}`}>
                  {pedido.CLI_NOME || "CONSUMIDOR"}
                </div>
                <div className={`col-span-2 text-right font-bold ${selectedIndex === index ? "text-green-700" : "text-gray-700"}`}>
                  {formatCurrency(pedido.PED_VALOR)}
                </div>

                <div className={`col-span-2 flex justify-end font-bold ${selectedIndex === index ? "text-red-700" : "text-gray-700"}`}>
                  <button onClick={async () => await handleExcluirPedido(pedido)}><Trash size={20} /></button>
                </div>

              </div>
            )) : (
              <div className="h-40 flex flex-col items-center justify-center text-gray-300">
                {loading ? (
                  <div className="flex flex-col items-center gap-2">
                    <i className="fas fa-circle-notch fa-spin text-2xl text-amber-400"></i>
                    <span className="text-xs font-medium text-gray-400">Buscando pedidos...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <i className="fas fa-folder-open text-3xl opacity-50"></i>
                    <span className="text-sm font-medium">Nenhum pedido encontrado</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-stone-50 border-t border-gray-200 px-6 py-3 flex justify-between items-center shrink-0">
          <div className="flex gap-4 text-[10px] font-bold text-gray-400 uppercase">
            <span className="flex items-center gap-1"><span className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-600 shadow-sm">ENTER</span> Selecionar</span>
            <span className="flex items-center gap-1"><span className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-600 shadow-sm">F2</span> Alternar Filtro</span>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition font-bold uppercase text-xs"
          >
            <span className="bg-red-100 border border-red-200 px-2 py-1 rounded text-red-600">ESC</span> Cancelar
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