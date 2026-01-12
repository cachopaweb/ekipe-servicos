"use client"

import { useState, useEffect, useRef } from "react";

import ModalClientes from "./components/modal_clientes";
import ModalProdutos, { Produto, buscarProdutoPorCodigo } from "./components/modal_produtos";
import ModalAtalhos from "./components/modal_atalhos";
import ModalImprimirOrcamento from "./components/modal_orcamento";
import ModalReimprimirVenda from "./components/modal_reimprimir_venda";
import ModalImprimirVenda from "./components/modal_imprimir_venda";
import Faturamentos from "@/app/faturamentos/page";

import UsuarioRepository from "@/app/repositories/usuario_repository";
import VendaRepository from "@/app/repositories/venda_repository";
import ProdutoRepository from "@/app/repositories/produto_repository";

import { FuncionarioModel } from "@/app/models/usuario_model";
import { VendaModel } from "@/app/models/venda_model";
import { VenEstModel } from "@/app/models/ven_est_model";
import { ClienteModel } from "@/app/models/cliente_model";

import { useAppData } from "@/app/contexts/app_context";
import Modal from "@/components/component/modal";
import OperacaoVenda from "@/app/faturamentos/implementations/operacao_venda";
import { ProdutoModel } from "@/app/models/produto_model";
import { IncrementaGenerator } from "@/app/functions/utils";

// Interface estendida para controlar Varejo/Atacado localmente
interface ItemVendaEstendido extends VenEstModel {
    precoVarejo: number;
    precoAtacado: number;
    tipoPreco: 'VAREJO' | 'ATACADO';
}

interface VendaCompleta extends VendaModel {
    CLI_NOME?: string;
    FUN_NOME?: string;
}

export default function Vendas() {
    const [dataHora, setDataHora] = useState(new Date());

    // Estado dos itens usando a interface estendida
    const [items, setItems] = useState<ItemVendaEstendido[]>([]);

    const { usuarioLogado } = useAppData();

    // Modais
    const [showModalCliente, setShowModalCliente] = useState(false);
    const [showModalProduto, setShowModalProduto] = useState(false);
    const [showModalAtalhos, setShowModalAtalhos] = useState(false);
    const [showModalImprimirOrcamento, setshowModalImprimirOrcamento] = useState(false);
    const [showModalReimprimirVenda, setShowModalReimprimirVenda] = useState(false);
    const [showModalFinalizar, setShowModalFinalizar] = useState(false);

    const [foiFaturado, setFoiFaturado] = useState(false);

    // Estados de inputs
    const [codProduto, setCodProduto] = useState("");
    const [qtdProduto, setQtdProduto] = useState('1');
    const [valorPago, setValorPago] = useState('');

    // --- ESTADOS DE DESCONTO ---
    const [descontoPorcentagem, setDescontoPorcentagem] = useState('');
    const [descontoReais, setDescontoReais] = useState('');
    const [descontoFloat, setDescontoFloat] = useState(0);

    const [cliente, setCliente] = useState<ClienteModel | null>(null);
    const [funcionario, setFuncionario] = useState<FuncionarioModel | null>(null);

    const [produtoPreview, setProdutoPreview] = useState("");
    const [codUltimaVenda, setCodUltimaVenda] = useState(0);
    const [venda, setVenda] = useState<VendaCompleta | null>(null);
    const [vendaRecemFinalizada, setVendaRecemFinalizada] = useState<VendaCompleta | null>(null);
    const [totalFinal, setTotalFinal] = useState(0);

    // Refs
    const codProdutoInputRef = useRef<HTMLInputElement>(null);
    const qtdProdutoInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Cálculo do Subtotal
    const subTotal = items.reduce((acc, item) => acc + item.VE_VALOR, 0);

    // --- LÓGICA DE ATUALIZAÇÃO DE PREÇO (VAREJO/ATACADO) ---
    const handleTrocarTipoPreco = (index: number, novoTipo: 'VAREJO' | 'ATACADO') => {
        setItems(prevItems => prevItems.map((item, i) => {
            if (i === index) {
                const novoValorUnitario = novoTipo === 'ATACADO' ? item.precoAtacado : item.precoVarejo;
                return {
                    ...item,
                    tipoPreco: novoTipo,
                    VE_VALOR: novoValorUnitario * item.VE_QUANTIDADE
                };
            }
            return item;
        }));
    };

    // --- LÓGICA DE DESCONTOS SINCRONIZADOS ---

    // Atualiza o Total Final sempre que o subtotal ou desconto em reais muda
    useEffect(() => {
        const descValor = parseFloat(descontoReais.replace(',', '.') || '0');
        setTotalFinal(Math.max(0, subTotal - descValor));
    }, [items, descontoReais, subTotal]);

    // Função: Digitou Porcentagem -> Calcula Reais
    const handleDescontoPorcentagem = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valorInput = e.target.value.replace(',', '.');
        setDescontoPorcentagem(e.target.value); // Mantém o input visual

        const pct = parseFloat(valorInput);
        if (!isNaN(pct) && subTotal > 0) {
            const valorEmReais = (subTotal * pct) / 100;
            // Atualiza o campo de reais formatado
            setDescontoReais(valorEmReais.toFixed(2).replace('.', ','));
        } else if (valorInput === '') {
            setDescontoReais('');
        }
    };

    // Função: Digitou Reais -> Calcula Porcentagem
    const handleDescontoReais = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valorInput = e.target.value.replace(',', '.');
        setDescontoReais(e.target.value); // Mantém o input visual

        const reais = parseFloat(valorInput);
        if (!isNaN(reais) && subTotal > 0) {
            const valorEmPorcentagem = (reais / subTotal) * 100;
            // Atualiza o campo de porcentagem formatado
            setDescontoPorcentagem(valorEmPorcentagem.toFixed(2).replace('.', ','));
        } else if (valorInput === '') {
            setDescontoPorcentagem('');
        }
    };

    // --- EFEITO: LIMPEZA PÓS-FATURAMENTO ---
    useEffect(() => {
        if (foiFaturado) {
            if (venda) {
                const desconto = descontoReais.replace(',', '.') || '0';
                setDescontoFloat(parseFloat(desconto));
                setVendaRecemFinalizada(venda);
            }

            setCodProduto("");
            setQtdProduto('1');
            setValorPago('');

            // Limpa ambos os campos de desconto
            setDescontoPorcentagem('');

            setVenda(null);
            setTotalFinal(0);

            setShowModalFinalizar(false);
            setFoiFaturado(false);
            setCodUltimaVenda(prev => prev + 1);
            restoreFocus();
        }
    }, [foiFaturado, venda]);

    // --- MANIPULAÇÃO DO GRID ---
    const handleRemoveItem = (indexToRemove: number) => {
        if (window.confirm("Remover este item da venda?")) {
            setItems(prevItems => prevItems.filter((_, index) => index !== indexToRemove));
            setTimeout(() => codProdutoInputRef.current?.focus(), 50);
        }
    };

    const handleUpdateQuantity = async (indexToUpdate: number, delta: number) => {
        const itemToUpdate = items[indexToUpdate];
        const newQuantity = itemToUpdate.VE_QUANTIDADE + delta;

        if (newQuantity < 1) return;

        // Valida estoque ao aumentar
        if (delta > 0) {
            try {
                const produto = await buscarProdutoPorCodigo(itemToUpdate.VE_PRO.toString());
                const estoqueDisponivel = produto?.estoque ?? 0;

                if (estoqueDisponivel < newQuantity) {
                    alert(`Estoque insuficiente! Disponível: ${estoqueDisponivel}`);
                    return;
                }
            } catch (error) {
                console.error("Erro ao verificar estoque", error);
                return;
            }
        }

        setItems(prevItems => prevItems.map((item, index) => {
            if (index === indexToUpdate) {
                // Usa o preço correspondente ao tipo selecionado atualmente
                const unitario = item.tipoPreco === 'ATACADO' ? item.precoAtacado : item.precoVarejo;
                return {
                    ...item,
                    VE_QUANTIDADE: newQuantity,
                    VE_VALOR: unitario * newQuantity
                };
            }
            return item;
        }));
    };

    // Carregamento Inicial
    useEffect(() => {
        const fetchDadosIniciais = async () => {
            if (usuarioLogado && usuarioLogado.USU_FUN) {
                try {
                    const usuarioRepository = new UsuarioRepository();
                    const response = await usuarioRepository.getFuncionario(Number(usuarioLogado.USU_FUN));
                    setFuncionario(response);
                } catch (error) {
                    console.error("Erro ao buscar funcionário:", error);
                }
            }
            try {
                const vendaRepository = new VendaRepository();
                const response = await vendaRepository.getUltimaVenda();
                setCodUltimaVenda(response);
            } catch (error) {
                console.error("Erro ao buscar última venda: ", error);
            }
        };
        fetchDadosIniciais();
    }, [usuarioLogado]);

    useEffect(() => {
        const timer = setInterval(() => setDataHora(new Date()), 1000);
        containerRef.current?.focus();
        return () => clearInterval(timer);
    }, []);

    // Preview Produto
    useEffect(() => {
        if (!codProduto) {
            setProdutoPreview("");
            return;
        }
        const executarBusca = async () => {
            try {
                const prod = await buscarProdutoPorCodigo(codProduto);
                if (prod && prod.nome) {
                    setProdutoPreview(prod.nome);
                } else {
                    setProdutoPreview("PRODUTO NÃO ENCONTRADO");
                }
            } catch (e) {
                // Captura erros de rede ou banco e mostra não encontrado para não quebrar a UI
                setProdutoPreview("PRODUTO NÃO ENCONTRADO");
            }
        }
        executarBusca();
    }, [codProduto]);

    const restoreFocus = () => {
        setTimeout(() => {
            if (codProdutoInputRef.current) codProdutoInputRef.current.focus();
            else containerRef.current?.focus();
        }, 50);
    };

    // Handlers Modais
    const handleSelectCliente = (cli: ClienteModel) => {
        setCliente(cli);
        setShowModalCliente(false);
        setTimeout(() => codProdutoInputRef.current?.focus(), 100);
        restoreFocus();
    };

    const handleSelectProduto = (produto: Produto) => {
        setCodProduto(produto.codigo.toString());
        setShowModalProduto(false);
        setTimeout(() => qtdProdutoInputRef.current?.focus(), 100);
        restoreFocus();
    };

    // Finalizar
    const handleFinalizarVenda = () => {
        if (items.length === 0) {
            alert("Adicione produtos antes de finalizar.");
        } else {
            const novaVenda: VendaCompleta = {
                VEN_CODIGO: codUltimaVenda + 1,
                VEN_DATA: new Date().toISOString(),
                VEN_HORA: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                VEN_VALOR: totalFinal,
                VEN_CLI: cliente?.CODIGO || 1,
                VEN_VENDEDOR: Number(usuarioLogado?.USU_FUN) || 1,
                VEN_NF: 0,
                // Passa o valor do desconto calculado em reais
                VEN_DIFERENCA: parseFloat(descontoReais.replace(',', '.')) || 0,
                VEN_DATAC: new Date().toISOString(),
                VEN_FAT: 1,
                VEN_DAV: 0,
                VEN_DEVOLUCAO_P: 'N',
                VEN_FUN: Number(usuarioLogado?.USU_FUN) || 1,
                itensVenEst: items,
                CLI_NOME: cliente?.NOME || "CONSUMIDOR",
                FUN_NOME: funcionario?.FUN_NOME || "ADM"
            };

            setVenda(novaVenda);
            setShowModalFinalizar(true);
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.defaultPrevented) return;
        if (showModalFinalizar || showModalCliente || showModalProduto || showModalAtalhos || showModalImprimirOrcamento || showModalReimprimirVenda || vendaRecemFinalizada) return;

        const target = e.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

        switch (e.key) {
            case 'a': case 'A': if (!isInput) { e.preventDefault(); setShowModalAtalhos(true); } break;
            case 'c': case 'C': if (!isInput) { e.preventDefault(); setShowModalCliente(true); } break;
            case 'p': case 'P': if (!isInput) { e.preventDefault(); setShowModalProduto(true); } break;
            case 'i': case 'I': if (!isInput) { e.preventDefault(); setshowModalImprimirOrcamento(true); } break;
            case 'r': case 'R': if (!isInput) { e.preventDefault(); setShowModalReimprimirVenda(true); } break;
            case 'f': case 'F': if (!isInput) { e.preventDefault(); handleFinalizarVenda(); } break;
            case 'F7': e.preventDefault(); codProdutoInputRef.current?.focus(); break;
            case 'Escape':
                e.preventDefault();
                if (window.confirm("Deseja limpar a venda atual?")) {
                    setItems([]);
                    setCodProduto("");
                    setQtdProduto('1');
                    setValorPago('');
                    setDescontoPorcentagem('');
                    setDescontoReais('');
                    setCliente(null);
                    restoreFocus();
                }
                break;
        }
    };

    const troco = parseFloat(valorPago.replace(',', '.') || '0') > totalFinal ? parseFloat(valorPago.replace(',', '.') || '0') - totalFinal : 0;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    // --- ADICIONAR ITEM ---
    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!codProduto) return;

        try {
            let quantItemsUsados = 0;
            items.forEach(item => {
                if (item.VE_PRO.toString() === codProduto) quantItemsUsados += item.VE_QUANTIDADE;
            });

            const produtoEncontrado = await buscarProdutoPorCodigo(codProduto);

            if (!produtoEncontrado) {
                alert("Produto não cadastrado!");
                return;
            }

            const qtdDesejada = parseInt(qtdProduto) || 1;

            if (produtoEncontrado.estoque < (quantItemsUsados + qtdDesejada)) {
                alert(`Estoque insuficiente! Disponível: ${produtoEncontrado.estoque}`);
                return;
            }

            const indexExistente = items.findIndex(item => item.VE_PRO === produtoEncontrado.codigo);

            if (indexExistente >= 0) {
                setItems(prevItems => {
                    const novosItens = [...prevItems];
                    const itemExistente = novosItens[indexExistente];

                    const novaQuantidade = itemExistente.VE_QUANTIDADE + qtdDesejada;
                    const precoUnitario = itemExistente.tipoPreco === 'ATACADO' ? itemExistente.precoAtacado : itemExistente.precoVarejo;

                    novosItens[indexExistente] = {
                        ...itemExistente,
                        VE_QUANTIDADE: novaQuantidade,
                        VE_VALOR: precoUnitario * novaQuantidade
                    };

                    return novosItens;
                });
            } else {
                const precoVarejo = produtoEncontrado.precoVenda;
                const precoAtacado = produtoEncontrado.precoAtacado || produtoEncontrado.precoVenda;

                const newItem: ItemVendaEstendido = {
                    VE_CODIGO: await IncrementaGenerator('GEN_VE'),
                    VE_VALOR: precoVarejo * qtdDesejada,
                    VE_QUANTIDADE: qtdDesejada,
                    VE_VEN: codUltimaVenda + 1,
                    VE_PRO: produtoEncontrado.codigo,
                    VE_NOME: produtoEncontrado.nome,
                    precoVarejo: precoVarejo,
                    precoAtacado: precoAtacado,
                    tipoPreco: 'VAREJO'
                };

                setItems(prev => [...prev, newItem]);
            }

            // Limpa os campos após adicionar/atualizar
            setCodProduto("");
            setQtdProduto('1');
            setProdutoPreview("");
            codProdutoInputRef.current?.focus();

        } catch (error: any) {
            alert(error.message || "Erro ao buscar produto");
            setCodProduto("");
            codProdutoInputRef.current?.focus();
        }
    };

    return (
        <div
            ref={containerRef}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
            className="flex flex-col w-full gap-2 p-2 bg-stone-100 font-sans outline-none focus:outline-none h-[calc(100vh-64px)] overflow-hidden"
        >
            {/* Header */}
            <div className="bg-white rounded-md shadow-sm px-4 py-2 flex justify-between items-center shrink-0 border-l-4 border-amber-400">
                <div>
                    <h1 className="text-xl font-black text-gray-800 tracking-tight leading-none">EKIPE SERVIÇOS</h1>
                    <span className="text-xs text-gray-500 font-bold tracking-wide">PDV - FRENTE DE CAIXA</span>
                </div>
                <div className="text-right leading-tight">
                    <p className="text-xs text-gray-500 font-semibold uppercase">
                        {dataHora.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-2xl font-bold text-amber-500 font-mono">
                        {dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-2 flex-1 lg:min-h-0 lg:overflow-hidden">

                {/* COLUNA ESQUERDA */}
                <div className="flex flex-col gap-2 flex-1 min-w-0 h-auto lg:h-full lg:overflow-hidden">

                    {/* Painel Dados */}
                    <div className="bg-white px-3 py-2 w-full rounded-md shadow-sm grid grid-cols-12 gap-2 shrink-0 items-end">
                        <div className="col-span-3 md:col-span-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase block">Cód. Venda</label>
                            <div className="text-lg font-bold text-red-600 leading-none">{codUltimaVenda + 1}</div>
                        </div>
                        <div className="col-span-9 md:col-span-3">
                            <label className="text-[10px] font-bold text-gray-400 uppercase block">Funcionário</label>
                            <div className="flex items-center w-full border border-gray-300 rounded text-sm bg-gray-50 h-8 px-1 font-bold text-gray-700 truncate">
                                {funcionario ? funcionario.FUN_NOME : "CARREGANDO..."}
                            </div>
                        </div>
                        <div className="col-span-12 md:col-span-7">
                            <label className="text-[10px] font-bold text-gray-400 uppercase block">Cliente (C)</label>
                            <div className="flex gap-1">
                                <input className="w-full border border-gray-300 rounded text-sm h-8 px-2 font-bold text-gray-700 bg-gray-50 outline-none" value={cliente ? cliente.NOME : "CONSUMIDOR"} readOnly />
                                <button onClick={() => setShowModalCliente(true)} className="bg-amber-400 hover:bg-amber-500 text-white w-8 h-8 rounded flex items-center justify-center transition" tabIndex={-1}><i className="fas fa-search"></i></button>
                            </div>
                        </div>
                    </div>

                    {/* Barra Inclusão */}
                    <form onSubmit={handleAddItem} className="bg-white p-2 rounded-md shadow-sm grid grid-cols-12 gap-2 items-end shrink-0 border border-gray-200">
                        <div className="col-span-4 md:col-span-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Código (F7)</label>
                            <div className="flex gap-1 h-10 w-full">
                                <input ref={codProdutoInputRef} autoFocus value={codProduto} onChange={e => setCodProduto(e.target.value)} className="flex-1 min-w-0 border-2 border-amber-300 rounded px-2 text-lg font-bold focus:border-amber-500 outline-none text-center" placeholder="Cód." />
                                <button type="button" onClick={() => setShowModalProduto(true)} className="bg-amber-400 hover:bg-amber-500 text-white w-8 shrink-0 h-full rounded flex items-center justify-center transition shadow-sm" tabIndex={-1} title="Buscar (P)"><i className="fas fa-search text-sm"></i></button>
                            </div>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Qtd</label>
                            <input ref={qtdProdutoInputRef} type="number" value={qtdProduto} onChange={e => setQtdProduto(e.target.value)} className="w-full border border-gray-300 rounded h-10 px-1 text-lg text-center font-bold focus:border-amber-400 outline-none" />
                        </div>
                        <div className="col-span-6 md:col-span-6">
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Descrição</label>
                            <input disabled value={produtoPreview} className={`w-full border border-gray-100 bg-gray-100 rounded h-10 px-3 text-lg font-bold italic transition-colors ${(produtoPreview || "").includes("NÃO ENCONTRADO") ? 'text-red-400' : 'text-gray-600'}`} placeholder="Leitura..." />
                        </div>
                        <div className="col-span-12 md:col-span-3">
                            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-10 rounded shadow transition flex items-center justify-center gap-2 text-sm uppercase"><i className="fas fa-plus"></i> <span className="inline">Incluir</span></button>
                        </div>
                    </form>

                    {/* Grid de Produtos */}
                    <div className="bg-white rounded-md shadow-sm flex-1 flex flex-col border border-gray-200 overflow-hidden min-h-0">
                        {/* Header Fixo */}
                        <div className="bg-stone-100 border-b border-gray-200 px-1 py-2 grid grid-cols-12 gap-1 text-[10px] font-bold text-gray-600 uppercase text-center shrink-0 pr-2">
                            <div className="col-span-1">#</div>
                            <div className="col-span-1">Cód</div>
                            <div className="col-span-4 text-left">Descrição</div>
                            <div className="col-span-2">Tabela</div>
                            <div className="col-span-2">Qtd / Ação</div>
                            <div className="col-span-2 text-right">Total</div>
                        </div>

                        <div className="overflow-y-auto flex-1 p-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                            <div className="min-w-[600px]">
                                {items.length > 0 ? items.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-1 text-xs py-1 px-1 border-b border-gray-100 hover:bg-amber-50 transition-colors items-center text-center cursor-pointer even:bg-stone-50">
                                        <div className="col-span-1 text-gray-400">{index + 1}</div>
                                        <div className="col-span-1 text-gray-500 font-semibold">{item.VE_PRO}</div>
                                        <div className="col-span-4 text-left font-bold text-gray-800 truncate px-1" title={item.VE_NOME}>{item.VE_NOME}</div>

                                        {/* SELETOR DE PREÇO (Corrigido Visual) */}
                                        <div className="col-span-2">
                                            <select
                                                value={item.tipoPreco}
                                                onChange={(e) => handleTrocarTipoPreco(index, e.target.value as 'VAREJO' | 'ATACADO')}
                                                className="w-full text-[10px] border border-gray-300 rounded px-1 py-1 bg-white text-gray-700 font-bold focus:border-amber-400 outline-none cursor-pointer"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="VAREJO">Var. {formatCurrency(item.precoVarejo)}</option>
                                                <option value="ATACADO">Atac. {formatCurrency(item.precoAtacado)}</option>
                                            </select>
                                        </div>

                                        <div className="col-span-2 flex items-center justify-center gap-1">
                                            <button onClick={() => handleUpdateQuantity(index, -1)} className="w-5 h-5 flex items-center justify-center bg-gray-200 hover:bg-red-100 text-gray-600 rounded font-bold transition">-</button>
                                            <span className="font-bold text-gray-800 w-6">{item.VE_QUANTIDADE}</span>
                                            <button onClick={() => handleUpdateQuantity(index, 1)} className="w-5 h-5 flex items-center justify-center bg-gray-200 hover:bg-green-100 text-gray-600 rounded font-bold transition">+</button>
                                            <button onClick={() => handleRemoveItem(index)} className="text-gray-400 hover:text-red-500 ml-1"><i className="fas fa-trash"></i></button>
                                        </div>

                                        <div className="col-span-2 text-right pr-2 font-bold text-gray-800">{formatCurrency(item.VE_VALOR)}</div>
                                    </div>
                                )) : (
                                    <div className="h-64 flex flex-col items-center justify-center text-gray-300 opacity-50">
                                        <i className="fas fa-shopping-cart text-5xl mb-2"></i>
                                        <span className="text-lg font-medium">Caixa Livre</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="bg-stone-50 p-2 border-t border-gray-200 flex justify-between items-center text-xs font-bold text-gray-500 shrink-0">
                            <span>REGISTROS: {items.length}</span>
                        </div>
                    </div>
                </div>

                {/* COLUNA DIREITA */}
                <div className="w-full lg:w-[320px] flex flex-col gap-2 shrink-0 h-auto lg:h-full">
                    <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden shrink-0">
                        <div className="bg-gray-50 py-1 text-center border-b border-gray-100">
                            <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Total a Pagar</span>
                        </div>
                        <div className="p-4 text-center flex items-center justify-center bg-white">
                            <span className="text-2xl font-bold text-gray-400 self-start mt-2 mr-1">R$</span>
                            <span className="text-5xl font-black text-red-600 tracking-tighter">
                                {totalFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    <div className="p-2 bg-white rounded-md shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
                        <div>
                            <div className="flex justify-between items-end border-b border-dashed border-gray-200 pb-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Subtotal</label>
                                <span className="text-lg font-bold text-gray-700">{formatCurrency(subTotal)}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Desc. (%)</label>
                                    <input placeholder="0" type="text" value={descontoPorcentagem} onChange={handleDescontoPorcentagem} className="w-full border border-gray-300 rounded p-1.5 text-right font-bold text-red-600 focus:border-red-500 outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Desc. (R$)</label>
                                    <input placeholder="0,00" type="text" value={descontoReais} onChange={handleDescontoReais} className="w-full border border-gray-300 rounded p-1.5 text-right font-bold text-red-600 focus:border-red-500 outline-none text-sm" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Valor Pago</label>
                                    <input placeholder="0,00" type="text" value={valorPago} onChange={e => setValorPago(e.target.value.replaceAll(',', '.'))} className="w-full border border-green-500 rounded p-1.5 text-right font-bold text-green-700 focus:ring-1 focus:ring-green-300 outline-none text-lg" />
                                </div>
                            </div>

                            <div className={`p-2 rounded border flex justify-between items-center transition-colors mt-2 ${troco > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                                <label className="text-xs font-bold text-gray-500 uppercase">Troco</label>
                                <span className={`text-xl font-bold ${troco > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                    {formatCurrency(troco)}
                                </span>
                            </div>
                        </div>


                        <button onClick={handleFinalizarVenda} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-black py-3 rounded-lg shadow-lg active:scale-[0.98] transition-transform uppercase tracking-wide flex items-center justify-center gap-2 mt-4">
                            <i className="fas fa-check-circle"></i> Finalizar (F)
                        </button>
                    </div>

                    <div className="bg-stone-800 text-stone-300 rounded-md p-2 text-xs font-mono shadow-inner flex justify-between overflow-y-auto min-h-0 shrink-0">
                        <h3 className="text-stone-500 font-bold uppercase text-[10px] tracking-wider">Teclas de Atalho</h3>
                        <h3 className="rounded bg-red-400 text-stone-800 px-1 font-bold uppercase text-[10px] tracking-wider">[A]</h3>
                    </div>
                </div>
            </div>

            {/* --- MODAIS --- */}
            <ModalClientes isOpen={showModalCliente} onClose={() => { setShowModalCliente(false); restoreFocus(); }} onSelect={handleSelectCliente} />
            <ModalProdutos isOpen={showModalProduto} onClose={() => { setShowModalProduto(false); restoreFocus(); }} onSelect={handleSelectProduto} />
            <ModalAtalhos isOpen={showModalAtalhos} onClose={() => { setShowModalAtalhos(false); restoreFocus(); }} />
            <ModalImprimirOrcamento isOpen={showModalImprimirOrcamento} onClose={() => { setshowModalImprimirOrcamento(false); restoreFocus(); }} itens={items} total={totalFinal} cliente={cliente ? cliente.NOME : "CONSUMIDOR"} funcionario={funcionario?.FUN_NOME ?? "FUNCIONÁRIO"} />
            <ModalReimprimirVenda isOpen={showModalReimprimirVenda} onClose={() => { setShowModalReimprimirVenda(false); restoreFocus(); }} />

            {showModalFinalizar && <Modal
                title="Venda PDV"
                showModal={showModalFinalizar}
                setShowModal={setShowModalFinalizar}
                body={<Faturamentos
                    tipoRecPag="R"
                    Operacao={new OperacaoVenda()}
                    pedFat={{
                        PF_CODIGO: 0,
                        PF_COD_CLI: cliente?.CODIGO ?? 1,
                        PF_CAMPO_DATAC: 'VEN_DATAC',
                        PF_CAMPO_FAT: 'VEN_FAT',
                        PF_CAMPO_PED: 'VEN_CODIGO',
                        PF_CLIENTE: cliente?.NOME ?? 'CONSUMIDOR',
                        PF_COD_PED: venda?.VEN_CODIGO ?? 1,
                        PF_DATA: new Date().toLocaleDateString(),
                        PF_DATAC: '01/01/1900',
                        PF_DESCONTO: 0,
                        PF_FAT: 0,
                        PF_FUN: funcionario?.FUN_CODIGO ?? 1,
                        PF_PARCELAS: 1,
                        PF_TABELA: 'VENDAS',
                        PF_TIPO: 1,
                        PF_VALOR: 0,
                        PF_VALORB: 0,
                        PF_VALORPG: 0,
                    }}
                    model={venda!}
                    itens={venda ? items : []}
                    cliFor={{ CODIGO: cliente?.CODIGO ?? 1, NOME: cliente?.NOME ?? 'CONSUMIDOR' }}
                    setShowModal={setShowModalFinalizar}
                    setFaturado={setFoiFaturado}
                    valorTotal={totalFinal}
                />}
            />}

            <ModalImprimirVenda
                isOpen={!!vendaRecemFinalizada}
                onClose={() => {
                    setVendaRecemFinalizada(null);
                    setCliente(null);
                    setItems([]);
                    setDescontoReais('');
                    restoreFocus();
                }}
                venda={vendaRecemFinalizada}
                desconto={descontoFloat}
                funcionario={funcionario?.FUN_NOME ?? "FUNCIONÁRIO"}
                cliente={cliente?.NOME ?? "CONSUMIDOR"}
                itens={items}
            />
        </div >
    );
}