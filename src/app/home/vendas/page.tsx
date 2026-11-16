"use client"

import { useState, useEffect, useRef } from "react";

import ModalClientes from "./components/modal_clientes";
import ModalProdutos, { Produto, buscarProdutoPorCodigo } from "./components/modal_produtos";
import ModalAtalhos from "./components/modal_atalhos";
import ModalImprimirOrcamento from "./components/modal_orcamento";
import ModalReimprimirVenda from "./components/modal_reimprimir_venda";
import ModalImprimirVenda from "./components/modal_imprimir_venda";
import ModalConfirmacao from "@/app/home/orcamentos/components/modal_confirmacao";
import Faturamentos from "@/app/faturamentos/page";

import UsuarioRepository from "@/app/repositories/usuario_repository";
import VendaRepository from "@/app/repositories/venda_repository";

import { FuncionarioModel } from "@/app/models/usuario_model";
import { VendaModel } from "@/app/models/venda_model";
import mapItemPedidoParaItemVenda, { VenEstModel } from "@/app/models/ven_est_model";
import { ClienteModel } from "@/app/models/cliente_model";
import mapItemVendaParaItemPedido, { PedEstModel } from "@/app/models/ped_est_model";

import { useAppData } from "@/app/contexts/app_context";
import Modal from "@/components/component/modal";
import OperacaoVenda from "@/app/faturamentos/implementations/operacao_venda";
import { IncrementaGenerator, horaFormatadaDB, FormatDate, toastMixin } from "@/app/functions/utils";
import { PedidoModel } from "@/app/models/pedido_model";
import PedidoRepository from "@/app/repositories/pedido_repository";
import ModalBuscarVenda from "./components/modal_buscar_venda";
import ClientRepository from "@/app/repositories/cliente_repository";

import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Printer,
  FileText,
  Save,
  RotateCcw,
  Keyboard,
  User,
  UserCheck,
  Receipt,
  ShoppingCart,
  Percent,
} from "lucide-react";

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
    const [showModalBuscarVenda, setShowModalBuscarVenda] = useState(false);

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
    useEffect(() => {
        const descValor = parseFloat(descontoReais.replace(',', '.') || '0');
        setTotalFinal(Math.max(0, subTotal - descValor));
    }, [items, descontoReais, subTotal]);

    const handleDescontoPorcentagem = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valorInput = e.target.value.replace(',', '.');
        setDescontoPorcentagem(e.target.value);

        const pct = parseFloat(valorInput);
        if (!isNaN(pct) && subTotal > 0) {
            const valorEmReais = (subTotal * pct) / 100;
            setDescontoReais(valorEmReais.toFixed(2).replace('.', ','));
        } else if (valorInput === '') {
            setDescontoReais('');
        }
    };

    const handleDescontoReais = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valorInput = e.target.value.replace(',', '.');
        setDescontoReais(e.target.value);

        const reais = parseFloat(valorInput);
        if (!isNaN(reais) && subTotal > 0) {
            const valorEmPorcentagem = (reais / subTotal) * 100;
            setDescontoPorcentagem(valorEmPorcentagem.toFixed(2).replace('.', ','));
        } else if (valorInput === '') {
            setDescontoPorcentagem('');
        }
    };

    const handleRemovePedidoPosVenda = async (codVenda: number) => {
        const pedidoRepository = new PedidoRepository();
        try {
            await pedidoRepository.removePedidosEProdutos(codVenda);
        } catch (error) {
            console.error(error);
        }
    };

    // --- EFEITO: LIMPEZA PÓS-FATURAMENTO ---
    useEffect(() => {
        if (foiFaturado) {
            if (venda) {
                handleRemovePedidoPosVenda(venda.VEN_CODIGO);
                const desconto = descontoReais.replace(',', '.') || '0';
                setDescontoFloat(parseFloat(desconto));
                setVendaRecemFinalizada(venda);
            }

            setCodProduto("");
            setQtdProduto('1');
            setValorPago('');
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
        setConfirmacao({
            isOpen: true,
            tipo: 'danger',
            titulo: 'Remover Produto',
            mensagem: `Deseja remover "${items[indexToRemove]?.VE_NOME}" da venda?`,
            acaoConfirmar: () => {
                setItems(prevItems => prevItems.filter((_, index) => index !== indexToRemove));
                fecharConfirmacao();
                setTimeout(() => codProdutoInputRef.current?.focus(), 50);
            }
        });
    };

    const handleUpdateQuantity = async (indexToUpdate: number, delta: number) => {
        const itemToUpdate = items[indexToUpdate];
        const newQuantity = itemToUpdate.VE_QUANTIDADE + delta;

        if (newQuantity < 1) return;

        if (delta > 0) {
            try {
                const produto = await buscarProdutoPorCodigo(itemToUpdate.VE_PRO.toString());
                const estoqueDisponivel = produto?.estoque ?? 0;

                if (estoqueDisponivel < newQuantity) {
                    toastMixin.fire({
                        title: 'Atenção',
                        text: `Estoque insuficiente! Disponível: ${estoqueDisponivel}`,
                        icon: 'warning'
                    });
                    return;
                }
            } catch (error) {
                console.error("Erro ao verificar estoque", error);
                return;
            }
        }

        setItems(prevItems => prevItems.map((item, index) => {
            if (index === indexToUpdate) {
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
        containerRef.current?.focus();
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
                setProdutoPreview("PRODUTO NÃO ENCONTRADO");
            }
        };
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
            toastMixin.fire({
                title: 'Atenção',
                text: "Adicione produtos antes de finalizar.",
                icon: 'warning'
            });
        } else {
            const novaVenda: VendaCompleta = {
                VEN_CODIGO: codUltimaVenda + 1,
                VEN_DATA: new Date().toISOString(),
                VEN_HORA: horaFormatadaDB(),
                VEN_VALOR: totalFinal,
                VEN_CLI: cliente?.CODIGO || 1,
                VEN_VENDEDOR: Number(usuarioLogado?.USU_FUN) || 1,
                VEN_NF: 0,
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
    };

    const handleSalvarPedido = async () => {
        if (items.length === 0) {
            toastMixin.fire({
                title: 'Atenção',
                text: "Adicione produtos antes de salvar a venda.",
                icon: 'warning'
            });
        } else {
            const pedCod = await IncrementaGenerator('GEN_PED');

            const itemsPedido: PedEstModel[] = await Promise.all(
                items.map(async (item) => await mapItemVendaParaItemPedido(item, pedCod))
            );
            const novoPedido: PedidoModel = {
                PED_CODIGO: pedCod,
                PED_CLI: cliente?.CODIGO || 1,
                PED_DATA: new Date().toISOString(),
                PED_FUN: Number(usuarioLogado?.USU_FUN) || 1,
                PED_TIPO: "Confirmar",
                PED_VALOR: totalFinal,
                itensPedEst: itemsPedido
            };

            const pedidoRepository = new PedidoRepository();
            try {
                await pedidoRepository.inserePedido(novoPedido);
                for (const pedido of itemsPedido) {
                    await pedidoRepository.insereProdutos(pedido);
                }
            }
            catch (e) {
                console.log(e);
            }
        }
    };

    const fecharConfirmacao = () => {
        setConfirmacao(prev => ({ ...prev, isOpen: false }));
        restoreFocus();
    };

    // Salva a venda em formato de orçamento
    const handleSalvarVenda = () => {
        if (items.length === 0) {
            toastMixin.fire({
                title: 'Atenção',
                text: "Adicione produtos antes de salvar como orçamento.",
                icon: 'warning'
            });
            return;
        }

        setConfirmacao({
            isOpen: true,
            tipo: 'warning',
            titulo: 'Salvar Venda como Orçamento?',
            mensagem: 'Todos os itens da venda atual serão salvos em formato de pedido/ordem para faturamento posterior.',
            acaoConfirmar: () => {
                handleSalvarPedido();
                setItems([]);
                setCodProduto("");
                setQtdProduto('1');
                setValorPago('');
                setDescontoPorcentagem('');
                setDescontoReais('');
                setCliente(null);
                setTotalFinal(0);
                fecharConfirmacao();
            }
        });
    };

    const handleSelectVendaSalva = async (pedido: PedidoModel) => {
        try {
            const clientRepository = new ClientRepository();
            const clienteEncontrado = await clientRepository.getClienteById(pedido.PED_CLI);

            const pedidoRepository = new PedidoRepository();
            const itemsPedido = await pedidoRepository.getItensPedido(pedido.PED_CODIGO);

            const novosItens: ItemVendaEstendido[] = await Promise.all(itemsPedido.map(async (item) => {
                const itemVendaBase = mapItemPedidoParaItemVenda(item, pedido.PED_CODIGO);

                const produtoDados = await buscarProdutoPorCodigo(itemVendaBase.VE_PRO.toString());

                const precoVarejo = produtoDados ? produtoDados.precoVenda : (itemVendaBase.VE_VALOR / itemVendaBase.VE_QUANTIDADE);
                const precoAtacado = produtoDados ? (produtoDados.precoAtacado || produtoDados.precoVenda) : precoVarejo;

                const valorUnitarioNoPedido = itemVendaBase.VE_VALOR / itemVendaBase.VE_QUANTIDADE;
                const isAtacado = Math.abs(valorUnitarioNoPedido - precoAtacado) < 0.01;

                return {
                    ...itemVendaBase,
                    precoVarejo: precoVarejo,
                    precoAtacado: precoAtacado,
                    tipoPreco: isAtacado ? 'ATACADO' : 'VAREJO'
                };
            }));

            setItems(novosItens);
            setCliente(clienteEncontrado);

            const vendaPedido: VendaCompleta = {
                VEN_CLI: pedido.PED_CLI,
                VEN_CODIGO: pedido.PED_CODIGO,
                VEN_DATA: pedido.PED_DATA,
                VEN_HORA: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                VEN_FUN: Number(usuarioLogado?.USU_FUN) || 1,
                VEN_NF: 0,
                VEN_DIFERENCA: 0,
                VEN_DATAC: new Date().toISOString(),
                VEN_FAT: 1,
                VEN_DAV: 0,
                VEN_VENDEDOR: Number(usuarioLogado?.USU_FUN) || 1,
                VEN_DEVOLUCAO_P: 'N',
                VEN_VALOR: pedido.PED_VALOR,
                CLI_NOME: clienteEncontrado.NOME,
                FUN_NOME: funcionario?.FUN_NOME,
                itensVenEst: novosItens
            };

            setVenda(vendaPedido);

            setShowModalBuscarVenda(false);
            setCodProduto("");
            setQtdProduto('1');
            setProdutoPreview("");
            restoreFocus();

        } catch (error) {
            console.error("Erro ao carregar venda salva:", error);
            toastMixin.fire({
                title: 'Erro',
                text: "Erro ao carregar os itens do pedido.",
                icon: 'error'
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.defaultPrevented) return;
        if (showModalFinalizar || showModalCliente || showModalProduto || showModalAtalhos || showModalImprimirOrcamento || showModalReimprimirVenda || showModalBuscarVenda || confirmacao.isOpen || vendaRecemFinalizada) return;

        const target = e.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

        switch (e.key) {
            case 'a': case 'A': if (!isInput) { e.preventDefault(); setShowModalAtalhos(true); } break;
            case 'c': case 'C': if (!isInput) { e.preventDefault(); setShowModalCliente(true); } break;
            case 'p': case 'P': if (!isInput) { e.preventDefault(); setShowModalProduto(true); } break;
            case 'i': case 'I': if (!isInput) { e.preventDefault(); setshowModalImprimirOrcamento(true); } break;
            case 'r': case 'R': if (!isInput) { e.preventDefault(); setShowModalReimprimirVenda(true); } break;
            case 'f': case 'F': if (!isInput) { e.preventDefault(); handleFinalizarVenda(); } break;
            case 's': case 'S': if (!isInput) { e.preventDefault(); handleSalvarVenda(); } break;
            case 'b': case 'B': if (!isInput) { e.preventDefault(); setShowModalBuscarVenda(true); } break;
            case 'F7': e.preventDefault(); codProdutoInputRef.current?.focus(); break;
            case 'Escape':
                e.preventDefault();
                if (items.length > 0) {
                    setConfirmacao({
                        isOpen: true,
                        tipo: 'warning',
                        titulo: 'Limpar Venda Atual?',
                        mensagem: 'Tem certeza de que deseja esvaziar todos os produtos inseridos nesta venda?',
                        acaoConfirmar: () => {
                            setItems([]);
                            setCodProduto("");
                            setQtdProduto('1');
                            setValorPago('');
                            setDescontoPorcentagem('');
                            setDescontoReais('');
                            setCliente(null);
                            fecharConfirmacao();
                        }
                    });
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
                toastMixin.fire({
                    title: 'Atenção',
                    text: "Produto não cadastrado!",
                    icon: 'warning'
                });
                return;
            }

            const qtdDesejada = parseInt(qtdProduto) || 1;

            if (produtoEncontrado.estoque < (quantItemsUsados + qtdDesejada)) {
                toastMixin.fire({
                    title: 'Atenção',
                    text: `Estoque insuficiente! Disponível: ${produtoEncontrado.estoque}`,
                    icon: 'warning'
                });
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

            setCodProduto("");
            setQtdProduto('1');
            setProdutoPreview("");
            codProdutoInputRef.current?.focus();

        } catch (error: any) {
            toastMixin.fire({
                title: 'Erro',
                text: error.message || "Erro ao buscar produto",
                icon: 'error'
            });
            setCodProduto("");
            codProdutoInputRef.current?.focus();
        }
    };

    return (
        <div
            ref={containerRef}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
            className="flex flex-col w-full gap-4 p-4 sm:p-6 bg-ek-surface outline-none focus:outline-none min-h-full pb-24 lg:pb-6"
        >
            {/* 1. Header do PDV com Identificação e Ações Rápidas */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b border-ek-border shrink-0">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="inline-block w-1 h-5 rounded-full bg-brand-gold" aria-hidden="true" />
                            <h1 className="text-[22px] font-bold text-ek-text tracking-[-0.02em] leading-tight">
                                Frente de Caixa (PDV)
                            </h1>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-brand-soft text-brand border border-brand-border tabular-nums">
                                Venda #{codUltimaVenda + 1}
                            </span>
                        </div>
                        <p className="text-xs text-ek-muted pl-3.5">
                            Terminal comercial de vendas e emissão rápida
                        </p>
                    </div>
                </div>

                {/* Barra de Ações Rápidas do PDV */}
                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
                    <button
                        type="button"
                        onClick={() => setShowModalBuscarVenda(true)}
                        className="ek-btn-secondary"
                        title="Buscar Venda Salva ou Pedido [B]"
                    >
                        <Search className="w-3.5 h-3.5 text-ek-muted" />
                        <span>Buscar</span>
                        <kbd className="ek-kbd">B</kbd>
                    </button>

                    <button
                        type="button"
                        onClick={handleSalvarVenda}
                        disabled={items.length === 0}
                        className="ek-btn-secondary disabled:opacity-45 disabled:cursor-not-allowed"
                        title="Salvar Venda em Formato de Pedido [S]"
                    >
                        <Save className="w-3.5 h-3.5 text-ek-muted" />
                        <span>Salvar</span>
                        <kbd className="ek-kbd">S</kbd>
                    </button>

                    <button
                        type="button"
                        onClick={() => setshowModalImprimirOrcamento(true)}
                        disabled={items.length === 0}
                        className={`h-9 px-3 rounded-[6px] text-[13px] font-medium inline-flex items-center gap-1.5 border transition-colors ${
                            items.length === 0
                                ? "text-ek-faint bg-ek-raised border-ek-border cursor-not-allowed opacity-60"
                                : "text-brand bg-brand-soft hover:bg-brand/10 border-brand-border"
                        }`}
                        title="Imprimir Orçamento da Venda Atual [I]"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Orçamento</span>
                        <kbd className="ek-kbd border-brand-border text-brand bg-white">I</kbd>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowModalReimprimirVenda(true)}
                        className="ek-btn-secondary"
                        title="Reimprimir Comprovante de Venda Anterior [R]"
                    >
                        <RotateCcw className="w-3.5 h-3.5 text-ek-muted" />
                        <span>Reimprimir</span>
                        <kbd className="ek-kbd">R</kbd>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowModalAtalhos(true)}
                        className="ek-btn-secondary"
                        title="Ver Atalhos de Teclado [A]"
                    >
                        <Keyboard className="w-3.5 h-3.5 text-brand" />
                        <span>Atalhos</span>
                        <kbd className="ek-kbd">A</kbd>
                    </button>
                </div>
            </header>

            {/* 2. Grid Principal: Área Operacional (Esquerda) e Fechamento (Direita) */}
            <div className="flex flex-col lg:flex-row gap-4 flex-1 lg:min-h-0">

                {/* COLUNA ESQUERDA: Operação da Venda */}
                <div className="flex flex-col gap-3 flex-1 min-w-0">

                    {/* Card 1: Identificação (Cliente & Operador) */}
                    <div className="ek-card p-3.5 grid grid-cols-1 sm:grid-cols-12 gap-3 shrink-0 items-end">
                        {/* Atendente / Operador */}
                        <div className="sm:col-span-5 flex flex-col">
                            <label className="ek-label flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-ek-muted" />
                                <span>Operador do caixa</span>
                            </label>
                            <input
                                type="text"
                                readOnly
                                value={funcionario ? funcionario.FUN_NOME : "ADMINISTRADOR"}
                                className="ek-input bg-ek-raised text-ek-muted font-medium uppercase truncate cursor-default"
                            />
                        </div>

                        {/* Cliente da Venda */}
                        <div className="sm:col-span-7 flex flex-col">
                            <label className="ek-label flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-brand" />
                                    <span>Cliente</span>
                                </span>
                                <span className="text-[11px] font-medium text-ek-faint">Tecla [C]</span>
                            </label>
                            <div className="flex gap-1.5">
                                <input
                                    type="text"
                                    readOnly
                                    value={cliente ? `${cliente.CODIGO} - ${cliente.NOME}` : "1 - CONSUMIDOR"}
                                    onClick={() => setShowModalCliente(true)}
                                    className="ek-input bg-ek-raised font-semibold uppercase cursor-pointer hover:border-brand/50 transition-colors"
                                    title="Clique para pesquisar cliente (ou tecle C)"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowModalCliente(true)}
                                    className="ek-btn-secondary px-3 shrink-0"
                                    tabIndex={-1}
                                    title="Pesquisar Cliente [C]"
                                >
                                    <Search className="w-4 h-4 text-brand" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Barra de Leitura e Inclusão de Produtos */}
                    <form onSubmit={handleAddItem} className="ek-card p-3.5 grid grid-cols-12 gap-2.5 items-end shrink-0">
                        {/* Código com Atalho F7 */}
                        <div className="col-span-5 sm:col-span-3 lg:col-span-2">
                            <label className="ek-label flex items-center justify-between">
                                <span>Código</span>
                                <span className="text-[11px] font-semibold text-brand">(F7)</span>
                            </label>
                            <div className="flex gap-1">
                                <input
                                    ref={codProdutoInputRef}
                                    autoFocus
                                    value={codProduto}
                                    onChange={e => setCodProduto(e.target.value)}
                                    className="ek-input px-2 font-semibold text-center tabular-nums"
                                    placeholder="Cód."
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowModalProduto(true)}
                                    className="ek-btn-secondary px-2.5 shrink-0"
                                    tabIndex={-1}
                                    title="Buscar Produto no Catálogo [P]"
                                >
                                    <Search className="w-4 h-4 text-brand" />
                                </button>
                            </div>
                        </div>

                        {/* Quantidade */}
                        <div className="col-span-3 sm:col-span-2 lg:col-span-1">
                            <label className="ek-label">Qtd</label>
                            <input
                                ref={qtdProdutoInputRef}
                                type="number"
                                min="1"
                                value={qtdProduto}
                                onChange={e => setQtdProduto(e.target.value)}
                                className="ek-input px-1.5 text-center font-semibold tabular-nums"
                            />
                        </div>

                        {/* Preview / Leitura da Descrição */}
                        <div className="col-span-12 sm:col-span-7 lg:col-span-7">
                            <label className="ek-label">Descrição do produto</label>
                            <input
                                disabled
                                value={produtoPreview}
                                className={`ek-input font-medium uppercase truncate ${
                                    (produtoPreview || "").includes("NÃO ENCONTRADO")
                                        ? "bg-rose-50 border-rose-200 text-rose-700"
                                        : produtoPreview
                                        ? "bg-ek-raised border-ek-border text-ek-text font-semibold"
                                        : "bg-ek-raised border-ek-border text-ek-faint"
                                }`}
                                placeholder="Aguardando leitura do código de barras..."
                            />
                        </div>

                        {/* Botão de Inclusão */}
                        <div className="col-span-4 sm:col-span-12 lg:col-span-2">
                            <button
                                type="submit"
                                className="ek-btn-primary w-full justify-center"
                                title="Incluir Produto na Venda (Enter)"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Incluir</span>
                            </button>
                        </div>
                    </form>

                    {/* Card 3: Grade / Tabela de Produtos da Venda */}
                    <div className="ek-card flex-1 flex flex-col overflow-hidden min-h-[280px]">
                        {/* Cabeçalho da Grade */}
                        <div className="bg-ek-raised border-b border-ek-border px-3.5 py-2.5 grid grid-cols-12 gap-2 text-xs font-semibold text-ek-muted text-center shrink-0">
                            <div className="col-span-1">#</div>
                            <div className="col-span-1">Cód</div>
                            <div className="col-span-4 text-left">Descrição do produto</div>
                            <div className="col-span-2">Tabela</div>
                            <div className="col-span-2">Qtd / Ajuste</div>
                            <div className="col-span-2 text-right">Subtotal</div>
                        </div>

                        {/* Linhas da Grade */}
                        <div className="overflow-y-auto flex-1 divide-y divide-ek-rule">
                            {items.length > 0 ? (
                                items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="grid grid-cols-12 gap-2 text-[13px] py-2.5 px-3.5 hover:bg-ek-raised/80 transition-colors items-center text-center"
                                    >
                                        <div className="col-span-1 text-ek-faint font-medium text-xs tabular-nums">
                                            {index + 1}
                                        </div>
                                        <div className="col-span-1 text-ek-muted font-mono text-xs tabular-nums">
                                            {item.VE_PRO}
                                        </div>
                                        <div className="col-span-4 text-left font-medium text-ek-text truncate" title={item.VE_NOME}>
                                            {item.VE_NOME}
                                        </div>

                                        {/* Seletor Varejo / Atacado */}
                                        <div className="col-span-2">
                                            <select
                                                value={item.tipoPreco}
                                                onChange={(e) => handleTrocarTipoPreco(index, e.target.value as 'VAREJO' | 'ATACADO')}
                                                className="ek-select h-8 text-xs px-2 tabular-nums"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="VAREJO">Var. {formatCurrency(item.precoVarejo)}</option>
                                                <option value="ATACADO">Atac. {formatCurrency(item.precoAtacado)}</option>
                                            </select>
                                        </div>

                                        {/* Controle de Quantidade */}
                                        <div className="col-span-2 flex items-center justify-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateQuantity(index, -1)}
                                                className="w-7 h-7 flex items-center justify-center bg-ek-raised border border-ek-border hover:bg-ek-active text-ek-text rounded-[6px] transition-colors"
                                                title="Diminuir quantidade"
                                            >
                                                <Minus className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="font-semibold text-ek-text w-8 tabular-nums">
                                                {item.VE_QUANTIDADE}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateQuantity(index, 1)}
                                                className="w-7 h-7 flex items-center justify-center bg-ek-raised border border-ek-border hover:bg-ek-active text-ek-text rounded-[6px] transition-colors"
                                                title="Aumentar quantidade"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(index)}
                                                className="p-1.5 text-ek-faint hover:text-rose-600 rounded-[6px] hover:bg-rose-50 transition-colors ml-1"
                                                title="Remover item da venda"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <div className="col-span-2 text-right font-semibold text-ek-text tabular-nums">
                                            {formatCurrency(item.VE_VALOR)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-64 flex flex-col items-center justify-center text-ek-muted gap-2 px-4 text-center">
                                    <div className="w-11 h-11 rounded-[8px] bg-ek-raised border border-ek-border flex items-center justify-center text-ek-faint">
                                        <ShoppingCart className="w-5 h-5" />
                                    </div>
                                    <p className="text-sm font-semibold text-ek-text">Caixa livre — nenhum item na venda</p>
                                    <p className="text-xs text-ek-muted max-w-xs">
                                        Digite o código ou utilize o leitor de código de barras para iniciar.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Rodapé da Grade */}
                        <div className="bg-ek-raised px-4 py-2.5 border-t border-ek-border flex justify-between items-center text-xs font-medium text-ek-muted shrink-0">
                            <span className="tabular-nums">Itens registrados: {items.length}</span>
                            <span className="text-sm font-bold text-ek-text tabular-nums">
                                Subtotal da grade: {formatCurrency(subTotal)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* COLUNA DIREITA: Resumo Financeiro & Fechamento */}
                <div className="w-full lg:w-[340px] flex flex-col gap-3 shrink-0 lg:sticky lg:top-4 self-start">
                    <div className="ek-card overflow-hidden">
                        {/* Assinatura geométrica Ekipe */}
                        <div className="h-[3px] w-full flex">
                            <div className="flex-1 bg-brand" />
                            <div className="w-16 bg-brand-gold" />
                        </div>

                        <div className="px-4 py-3 border-b border-ek-border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-brand" />
                                <h3 className="text-sm font-semibold text-ek-text">
                                    Total da venda
                                </h3>
                            </div>
                            <span className="text-xs bg-ek-raised border border-ek-border text-ek-muted font-medium px-2 py-0.5 rounded-[6px] tabular-nums">
                                {items.length} {items.length === 1 ? 'item' : 'itens'}
                            </span>
                        </div>

                        <div className="p-5 bg-ek-raised/60 border-b border-ek-border flex flex-col items-center justify-center text-center">
                            <span className="text-xs font-medium text-ek-muted mb-1">
                                Total a pagar
                            </span>
                            <div className="text-3xl font-bold text-brand tracking-[-0.02em] tabular-nums">
                                {formatCurrency(totalFinal)}
                            </div>
                        </div>

                        {/* Detalhamento Financeiro */}
                        <div className="p-4 space-y-3.5 text-sm">
                            <div className="flex justify-between items-center text-ek-muted">
                                <span>Subtotal bruto</span>
                                <span className="font-semibold text-ek-text tabular-nums">
                                    {formatCurrency(subTotal)}
                                </span>
                            </div>

                            {/* Descontos Sincronizados (% e R$) */}
                            <div className="pt-3 border-t border-ek-rule space-y-1.5">
                                <label className="ek-label mb-1">
                                    Desconto concedido
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="block text-xs text-ek-muted mb-1">
                                            Valor (R$)
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="0,00"
                                            value={descontoReais}
                                            onChange={handleDescontoReais}
                                            className="ek-input font-semibold text-right text-rose-700 tabular-nums"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-xs text-ek-muted mb-1">
                                            Percentual (%)
                                        </span>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="0.00"
                                                value={descontoPorcentagem}
                                                onChange={handleDescontoPorcentagem}
                                                className="ek-input pr-7 font-semibold text-right text-rose-700 tabular-nums"
                                            />
                                            <Percent className="w-3.5 h-3.5 text-ek-faint absolute right-2.5 top-2.5 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Valor Pago pelo Cliente */}
                            <div className="pt-3 border-t border-ek-rule">
                                <label className="ek-label">
                                    Valor recebido (dinheiro / cartão)
                                </label>
                                <input
                                    type="text"
                                    placeholder="0,00"
                                    value={valorPago}
                                    onChange={e => setValorPago(e.target.value.replaceAll(',', '.'))}
                                    className="ek-input h-10 text-base font-bold text-right text-emerald-700 bg-emerald-50/40 border-emerald-300 focus:border-emerald-600 tabular-nums"
                                />
                            </div>

                            {/* Troco Calculado */}
                            <div className={`px-3 py-2.5 rounded-[6px] border flex justify-between items-center transition-colors ${
                                troco > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-ek-raised border-ek-border'
                            }`}>
                                <span className="text-xs font-semibold text-ek-muted">Troco</span>
                                <span className={`text-lg font-bold tabular-nums ${
                                    troco > 0 ? 'text-emerald-700' : 'text-ek-faint'
                                }`}>
                                    {formatCurrency(troco)}
                                </span>
                            </div>

                            {/* Botão Primário: Finalizar Venda */}
                            <div className="pt-1">
                                <button
                                    type="button"
                                    onClick={handleFinalizarVenda}
                                    disabled={items.length === 0}
                                    className="ek-btn-primary w-full h-11 text-sm font-semibold justify-center disabled:opacity-45 disabled:cursor-not-allowed"
                                    title="Finalizar e Faturar Venda [F]"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Finalizar Venda [F]</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Barra Inferior Fixa no Mobile */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-ek-surface border-t border-ek-border px-4 py-2.5 flex items-center justify-between">
                <div>
                    <span className="block text-xs font-medium text-ek-muted">
                        Total da venda
                    </span>
                    <span className="text-lg font-bold text-brand tabular-nums">
                        {formatCurrency(totalFinal)}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={handleFinalizarVenda}
                    disabled={items.length === 0}
                    className="ek-btn-primary px-4 disabled:opacity-45 disabled:cursor-not-allowed"
                >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Finalizar [F]</span>
                </button>
            </div>

            {/* --- MODAIS DO SISTEMA --- */}
            <ModalClientes
                isOpen={showModalCliente}
                onClose={() => { setShowModalCliente(false); restoreFocus(); }}
                onSelect={handleSelectCliente}
            />

            <ModalProdutos
                isOpen={showModalProduto}
                onClose={() => { setShowModalProduto(false); restoreFocus(); }}
                onSelect={handleSelectProduto}
            />

            <ModalAtalhos
                isOpen={showModalAtalhos}
                onClose={() => { setShowModalAtalhos(false); restoreFocus(); }}
            />

            <ModalImprimirOrcamento
                isOpen={showModalImprimirOrcamento}
                onClose={() => { setshowModalImprimirOrcamento(false); restoreFocus(); }}
                itens={items}
                total={totalFinal}
                cliente={cliente ? cliente.NOME : "CONSUMIDOR"}
                funcionario={funcionario?.FUN_NOME ?? "FUNCIONÁRIO"}
            />

            <ModalReimprimirVenda
                isOpen={showModalReimprimirVenda}
                onClose={() => { setShowModalReimprimirVenda(false); restoreFocus(); }}
            />

            {showModalFinalizar && (
                <Modal
                    title="Venda PDV"
                    showModal={showModalFinalizar}
                    setShowModal={setShowModalFinalizar}
                    body={
                        <Faturamentos
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
                                PF_DATA: FormatDate(new Date()),
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
                        />
                    }
                />
            )}

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

            <ModalConfirmacao
                isOpen={confirmacao.isOpen}
                onClose={fecharConfirmacao}
                onConfirm={confirmacao.acaoConfirmar}
                title={confirmacao.titulo}
                message={confirmacao.mensagem}
                type={confirmacao.tipo}
            />

            <ModalBuscarVenda
                isOpen={showModalBuscarVenda}
                onClose={() => setShowModalBuscarVenda(false)}
                onSelect={handleSelectVendaSalva}
            />
        </div>
    );
}
