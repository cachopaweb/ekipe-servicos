"use client";

import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { Search, X, Loader2, Building2, Plus, MapPin, Eye, Check } from "lucide-react";
import dynamic from "next/dynamic";
import { FornecedorModel } from "../models/fornecedor_model";
import FornecedorRepository from "../repositories/fornecedor_repository";
import { Cadastro_fornecedores } from "@/components/component/cadastro_fornecedores";
import CidadeModel from "../models/cidade_model";
import CidadeRepository from "../repositories/cidade_repository";
import { toastMixin } from "../functions/utils";

const Mapa = dynamic(() => import("../mapa/index").then((mod) => mod.Mapa), { ssr: false });

type FiltroTipo = "nome" | "fantasia" | "cidade" | "observacoes";

type PesquisaFornecedorParams = {
  showModal?: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  fornecedorSelecionado?: FornecedorModel;
  setFornecedorSelecionado: Dispatch<SetStateAction<FornecedorModel>>;
  isOpen?: boolean;
  onClose?: () => void;
};

export default function PesquisaFornecedor({
  showModal,
  setShowModal,
  setFornecedorSelecionado,
  isOpen,
  onClose,
}: PesquisaFornecedorParams) {
  const activeIsOpen = isOpen !== undefined ? isOpen : (showModal ?? true);

  const [textoPesquisado, setTextoPesquisado] = useState("");
  const [fornecedores, setFornecedores] = useState<FornecedorModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [filtro, setFiltro] = useState<FiltroTipo>("nome");
  const [queryCity, setQueryCity] = useState("");
  const [loadingCity, setLoadingCity] = useState(false);
  const [optionsCity, setOptionsCity] = useState<CidadeModel[]>([]);
  const [codigoCidade, setCodigoCidade] = useState(0);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const [visualizarMapa, setVisualizarMapa] = useState(false);
  const [cadastrarFornecedor, setCadastrarFornecedor] = useState(false);
  const [idCadastraFornecedor, setIdCadastraFornecedor] = useState(0);

  const inputBuscaRef = useRef<HTMLInputElement>(null);
  const inputCityRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setShowModal(false);
    if (onClose) onClose();
  }, [setShowModal, onClose]);

  // Foco inicial
  useEffect(() => {
    if (activeIsOpen) {
      const timer = setTimeout(() => {
        if (filtro === "cidade") {
          inputCityRef.current?.focus();
        } else {
          inputBuscaRef.current?.focus();
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [activeIsOpen, filtro]);

  // Resetar cidade ao mudar filtro
  useEffect(() => {
    setQueryCity("");
    setCodigoCidade(0);
    setOptionsCity([]);
    setShowCityDropdown(false);
  }, [filtro]);

  // Busca de cidades com autocomplete
  useEffect(() => {
    if (queryCity.trim().length >= 3 && filtro === "cidade") {
      let isMounted = true;
      setLoadingCity(true);
      const timer = setTimeout(async () => {
        try {
          const repo = new CidadeRepository();
          const options = await repo.getBuscaCidades(queryCity);
          if (isMounted) {
            setOptionsCity(options || []);
            setShowCityDropdown(true);
          }
        } catch {
          if (isMounted) setOptionsCity([]);
        } finally {
          if (isMounted) setLoadingCity(false);
        }
      }, 250);

      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    } else {
      setOptionsCity([]);
      setShowCityDropdown(false);
    }
  }, [queryCity, filtro]);

  // Buscar fornecedores por termo ou filtro
  const buscarFornecedores = useCallback(
    async (termo: string, tipoFiltro: FiltroTipo) => {
      if (tipoFiltro === "cidade") return;
      setLoading(true);
      try {
        const repository = new FornecedorRepository();
        let lista: FornecedorModel[] = [];
        if (tipoFiltro === "nome") {
          lista = await repository.getFornecedoresPorNome(termo);
        } else if (tipoFiltro === "fantasia") {
          lista = await repository.getFornecedoresPorNomeFantasia(termo);
        } else if (tipoFiltro === "observacoes") {
          lista = await repository.getFornecedoresPorObs(termo);
        }
        setFornecedores(lista || []);
        setSelectedIndex(0);
      } catch (error) {
        toastMixin.fire({
          title: "Erro ao buscar fornecedores",
          text: String(error),
          icon: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Debounce para busca textual
  useEffect(() => {
    if (!activeIsOpen || filtro === "cidade") return;
    const timer = setTimeout(() => {
      buscarFornecedores(textoPesquisado, filtro);
    }, 250);
    return () => clearTimeout(timer);
  }, [textoPesquisado, filtro, activeIsOpen, buscarFornecedores]);

  // Buscar fornecedores por cidade
  const buscarPorCidade = useCallback(async (codCid: number) => {
    if (!codCid) return;
    setLoading(true);
    try {
      const repository = new FornecedorRepository();
      const lista = await repository.getFornecedoresPorCidade(codCid);
      setFornecedores(lista || []);
      setSelectedIndex(0);
    } catch (error) {
      toastMixin.fire({
        title: "Erro ao buscar fornecedores da cidade",
        text: String(error),
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (codigoCidade > 0) {
      buscarPorCidade(codigoCidade);
    }
  }, [codigoCidade, buscarPorCidade]);

  const escolheCidade = (cidade: CidadeModel) => {
    setQueryCity(cidade.DESCRICAO || "");
    setCodigoCidade(cidade.CID_CODIGO);
    setShowCityDropdown(false);
  };

  const cadastrarNovoFornecedor = () => {
    setIdCadastraFornecedor(0);
    setCadastrarFornecedor(true);
  };

  const visualizarFornecedor = (model: FornecedorModel) => {
    setIdCadastraFornecedor(model.CODIGO);
    setCadastrarFornecedor(true);
  };

  const selecionarFornecedor = useCallback(
    (model: FornecedorModel) => {
      setFornecedorSelecionado(model);
      handleClose();
    },
    [setFornecedorSelecionado, handleClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, fornecedores.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && fornecedores[selectedIndex]) {
        e.preventDefault();
        selecionarFornecedor(fornecedores[selectedIndex]);
      }
    },
    [fornecedores, selectedIndex, selecionarFornecedor, handleClose]
  );

  if (!activeIsOpen) return null;

  return (
    <>
      <div
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-sm animate-fade-in outline-none"
      >
        <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-stone-200/80 overflow-hidden font-sans">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/80 bg-stone-50/90 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-800 tracking-tight">
                  Pesquisa de Fornecedores / Parceiros
                </h2>
                <p className="text-xs text-stone-500 font-normal">
                  Navegue com as setas ↑ ↓ e pressione Enter para escolher
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setVisualizarMapa(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg shadow-sm transition active:scale-[0.98]"
              >
                <MapPin className="w-3.5 h-3.5 text-stone-500" />
                <span>Mapa</span>
              </button>
              <button
                type="button"
                onClick={cadastrarNovoFornecedor}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm transition active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Fornecedor</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
                title="Fechar (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filtros e Barra de Pesquisa */}
          <div className="p-4 border-b border-stone-200 bg-stone-50/50 flex flex-col gap-3 shrink-0">
            {/* Seletor de Tipo de Filtro (Segmented Control) */}
            <div className="flex flex-wrap items-center gap-1.5 bg-stone-200/70 p-1 rounded-lg w-fit text-xs font-medium text-stone-600">
              <button
                type="button"
                onClick={() => setFiltro("nome")}
                className={`px-3 py-1 rounded-md transition ${
                  filtro === "nome"
                    ? "bg-white text-stone-900 shadow-sm font-semibold"
                    : "hover:text-stone-900"
                }`}
              >
                Nome
              </button>
              <button
                type="button"
                onClick={() => setFiltro("fantasia")}
                className={`px-3 py-1 rounded-md transition ${
                  filtro === "fantasia"
                    ? "bg-white text-stone-900 shadow-sm font-semibold"
                    : "hover:text-stone-900"
                }`}
              >
                Nome Fantasia
              </button>
              <button
                type="button"
                onClick={() => setFiltro("cidade")}
                className={`px-3 py-1 rounded-md transition ${
                  filtro === "cidade"
                    ? "bg-white text-stone-900 shadow-sm font-semibold"
                    : "hover:text-stone-900"
                }`}
              >
                Cidade
              </button>
              <button
                type="button"
                onClick={() => setFiltro("observacoes")}
                className={`px-3 py-1 rounded-md transition ${
                  filtro === "observacoes"
                    ? "bg-white text-stone-900 shadow-sm font-semibold"
                    : "hover:text-stone-900"
                }`}
              >
                Observações
              </button>
            </div>

            {/* Input de Busca */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
              {filtro === "cidade" ? (
                <div className="relative w-full">
                  <input
                    ref={inputCityRef}
                    type="text"
                    value={queryCity}
                    onChange={(e) => setQueryCity(e.target.value)}
                    placeholder="Digite pelo menos 3 letras da cidade..."
                    className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 uppercase transition"
                  />
                  {loadingCity && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                    </div>
                  )}

                  {showCityDropdown && optionsCity.length > 0 && (
                    <ul className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-stone-200 rounded-lg shadow-lg z-30 divide-y divide-stone-100 text-xs">
                      {optionsCity.map((cidade) => (
                        <li
                          key={cidade.CID_CODIGO}
                          onClick={() => escolheCidade(cidade)}
                          className="px-4 py-2 hover:bg-amber-50/70 cursor-pointer font-medium text-stone-800 transition"
                        >
                          {cidade.DESCRICAO}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <input
                  ref={inputBuscaRef}
                  type="text"
                  value={textoPesquisado}
                  onChange={(e) => setTextoPesquisado(e.target.value)}
                  placeholder={`Pesquisar por ${
                    filtro === "fantasia"
                      ? "nome fantasia"
                      : filtro === "observacoes"
                      ? "observações"
                      : "nome ou código"
                  }...`}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 uppercase transition"
                />
              )}
            </div>
          </div>

          {/* Tabela de Resultados */}
          <div className="flex-1 overflow-auto p-4 min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-stone-500 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                <span className="text-xs font-medium">Buscando fornecedores...</span>
              </div>
            ) : fornecedores.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-2">
                <Building2 className="w-8 h-8 text-stone-300" />
                <span className="text-sm font-medium">Nenhum fornecedor encontrado.</span>
                <span className="text-xs text-stone-400">Verifique os filtros ou cadastre um novo fornecedor.</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-100/90 text-stone-600 text-xs font-bold uppercase tracking-wider border-b border-stone-200">
                    <th className="p-3 w-16 text-center whitespace-nowrap">Cód.</th>
                    <th className="p-3">Nome / Razão Social</th>
                    <th className="p-3 whitespace-nowrap w-48">CNPJ / CPF</th>
                    <th className="p-3 whitespace-nowrap w-40">Telefone</th>
                    <th className="p-3 text-center w-24 whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {fornecedores.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <tr
                        key={item.CODIGO}
                        onClick={() => selecionarFornecedor(item)}
                        className={`cursor-pointer transition-colors text-sm ${
                          isSelected ? "bg-amber-100/70 font-semibold" : "hover:bg-amber-50/40 text-stone-700"
                        }`}
                      >
                        <td className="p-3 font-mono font-medium text-stone-900 text-center whitespace-nowrap">{item.CODIGO}</td>
                        <td className="p-3 font-medium text-stone-800">{item.NOME}</td>
                        <td className="p-3 font-mono text-stone-600 whitespace-nowrap">{item.CPF_CNPJ || "—"}</td>
                        <td className="p-3 text-stone-600 whitespace-nowrap">{item.FONE || "—"}</td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <div
                            className="inline-flex items-center justify-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => visualizarFornecedor(item)}
                              title="Visualizar ou editar cadastro"
                              aria-label="Visualizar ou editar cadastro"
                              className="p-1.5 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-md transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => selecionarFornecedor(item)}
                              title="Selecionar este fornecedor"
                              aria-label="Selecionar este fornecedor"
                              className="p-1.5 text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-stone-200/80 bg-stone-50/90 shrink-0">
            <span className="text-xs text-stone-500">
              {fornecedores.length}{" "}
              {fornecedores.length === 1 ? "fornecedor encontrado" : "fornecedores encontrados"}
            </span>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg shadow-sm transition active:scale-[0.98]"
            >
              Fechar (Esc)
            </button>
          </div>
        </div>
      </div>

      {/* Sub-modal: Mapa */}
      {visualizarMapa && (
        <div
          tabIndex={-1}
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-sm animate-fade-in outline-none"
        >
          <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-stone-200/80 overflow-hidden font-sans">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/80 bg-stone-50/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-800 tracking-tight">Mapa de Fornecedores</h2>
                  <p className="text-xs text-stone-500 font-normal">Localização geográfica dos parceiros</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVisualizarMapa(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-2 min-h-[500px]">
              <Mapa />
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal: Cadastro / Edição de Fornecedor */}
      {cadastrarFornecedor && (
        <div
          tabIndex={-1}
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-sm animate-fade-in outline-none"
        >
          <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-stone-200/80 overflow-hidden font-sans">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/80 bg-stone-50/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-800 tracking-tight">
                    {idCadastraFornecedor === 0 ? "Novo Fornecedor" : "Visualizar / Editar Fornecedor"}
                  </h2>
                  <p className="text-xs text-stone-500 font-normal">Preencha os dados do fornecedor</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCadastrarFornecedor(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <Cadastro_fornecedores
                setListarFornecedor={setShowModal}
                setCadastraFornecedor={setCadastrarFornecedor}
                id={idCadastraFornecedor}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
