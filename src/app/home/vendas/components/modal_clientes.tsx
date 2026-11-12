"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Search, Users, X } from "lucide-react";

import ClientRepository from "@/app/repositories/cliente_repository"; // Ajuste o caminho se necessário

import { ClienteModel } from "@/app/models/cliente_model"; // Ajuste o caminho se necessário

interface ModalClientesProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (cliente: ClienteModel) => void;
}

export default function ModalClientes({ isOpen, onClose, onSelect }: ModalClientesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"nome" | "codigo" | "cpf">("nome");

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredData, setFilteredData] = useState<ClienteModel[]>([]);
  const [loading, setLoading] = useState(false);

  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Função de busca no servidor
  const fetchClientes = useCallback(async (busca: string) => {
    setLoading(true);
    try {
      const repository = new ClientRepository();
      const dados = await repository.getClientes(busca);
      setFilteredData(dados);
      setSelectedIndex(0);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce para evitar muitas requisições enquanto digita
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Busca vazia traz os primeiros 50 (conforme seu SQL "SELECT FIRST 50...")
      // ou busca pelo termo digitado
      fetchClientes(searchTerm);
    }, 500); // Aguarda 500ms após parar de digitar

    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchClientes]);

  // Foco inicial ao abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      // Carrega a lista inicial ao abrir
      fetchClientes("");
    }
  }, [isOpen, fetchClientes]);

  // Scroll automático
  useEffect(() => {
    if (rowRefs.current[selectedIndex]) {
      rowRefs.current[selectedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth"
      });
    }
  }, [selectedIndex]);

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
        const filters: ("nome" | "codigo" | "cpf")[] = ["nome", "codigo", "cpf"];
        const currentIdx = filters.indexOf(filterType);
        const nextIdx = (currentIdx + 1) % filters.length;
        setFilterType(filters[nextIdx]);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, filteredData, selectedIndex, onSelect, onClose, filterType]);

  if (!isOpen) return null;

  const clienteSelecionado = filteredData[selectedIndex] || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">

      <div className="bg-ek-surface w-full max-w-4xl h-[85vh] md:h-[650px] flex flex-col rounded-[8px] border border-ek-border overflow-hidden font-sans">

        {/* HEADER */}
        <div className="bg-ek-raised px-5 py-3.5 border-b border-ek-border flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-1 h-4 bg-brand rounded-full" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-ek-text flex items-center gap-2">
                <Users className="w-4 h-4 text-brand" />
                <span>Localizar cliente</span>
              </h2>
              <p className="text-xs text-ek-muted">Use as setas para navegar e Enter para confirmar</p>
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
              placeholder="Pesquisar cliente..."
              className="ek-input pl-9 uppercase font-medium"
              autoComplete="off"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-ek-muted mr-1">Filtro (F2):</span>
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
        <div className="flex-1 overflow-y-auto bg-ek-surface min-h-0">
          <div className="grid grid-cols-12 px-5 py-2 text-xs font-semibold text-ek-muted border-b border-ek-border bg-ek-raised sticky top-0 z-10">
            <div className="col-span-1">Cód.</div>
            <div className="col-span-6">Nome / Razão Social</div>
            <div className="col-span-3">CPF / CNPJ</div>
            <div className="col-span-2 text-right">Telefone</div>
          </div>

          <div className="divide-y divide-ek-rule">
            {filteredData.length > 0 ? filteredData.map((cliente, index) => (
              <div
                key={cliente.CODIGO}
                ref={el => { rowRefs.current[index] = el }}
                onClick={() => {
                  setSelectedIndex(index);
                  inputRef.current?.focus();
                }}
                onDoubleClick={() => { onSelect(cliente); onClose(); }}
                className={`grid grid-cols-12 px-5 py-2.5 cursor-pointer transition-colors text-[13px] items-center ${
                  selectedIndex === index
                    ? "bg-brand-soft border-l-2 border-l-brand"
                    : "hover:bg-ek-raised/80"
                }`}
              >
                <div className={`col-span-1 font-semibold tabular-nums ${selectedIndex === index ? "text-brand" : "text-ek-muted"}`}>
                  {cliente.CODIGO}
                </div>
                <div className="col-span-6 font-medium text-ek-text truncate pr-2">
                  {cliente.NOME}
                </div>
                <div className="col-span-3 text-ek-muted text-xs tabular-nums">
                  {cliente.CPF_CNPJ}
                </div>
                <div className="col-span-2 text-right text-ek-muted text-xs tabular-nums">
                  {cliente.FONE || cliente.CELULAR}
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
                    <span className="text-sm font-medium">Nenhum cliente encontrado</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* PAINEL DE DETALHES (Footer Informativo) */}
        <div className="bg-ek-raised border-t border-ek-border px-5 py-3 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-ek-surface px-3 py-2 rounded-[6px] border border-ek-border">
              <span className="text-[11px] font-medium text-ek-muted block mb-0.5">Endereço</span>
              <span className="font-medium text-ek-text block truncate">{clienteSelecionado.ENDERECO || "-"}</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-ek-surface px-3 py-2 rounded-[6px] border border-ek-border">
                <span className="text-[11px] font-medium text-ek-muted block mb-0.5">RG</span>
                <span className="font-medium text-ek-text block truncate tabular-nums">{clienteSelecionado.RG || "-"}</span>
              </div>
              <div className="bg-ek-surface px-3 py-2 rounded-[6px] border border-ek-border">
                <span className="text-[11px] font-medium text-ek-muted block mb-0.5">Celular</span>
                <span className="font-medium text-ek-text block truncate tabular-nums">{clienteSelecionado.CELULAR || "-"}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-ek-rule text-xs text-ek-muted">
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