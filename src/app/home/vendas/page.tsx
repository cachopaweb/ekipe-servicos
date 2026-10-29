"use client"

import { useState, useEffect, useRef } from "react";

import ModalClientes from "./components/modal_clientes";
import ModalProdutos, { Produto, buscarProdutoPorCodigo } from "./components/modal_produtos";
import ModalAtalhos from "./components/modal_atalhos";
import ModalImprimirOrcamento from "./components/modal_orcamento";
import ModalReimprimirVenda from "./components/modal_reimprimir_venda";
import ModalImprimirVenda from "./components/modal_imprimir_venda";
import ModalConfirmacao from "./components/modal_confirmar";
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
import { IncrementaGenerator, horaFormatadaDB, FormatDate } from "@/app/functions/utils";
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
            alert("Adicione produtos antes de finalizar.");
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
            alert("Adicione produtos antes de salvar a venda.");
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
            alert("Adicione produtos antes de salvar como orçamento.");
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
            alert("Erro ao carregar os itens do pedido.");
        }
    };

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
            className="flex flex-col w-full gap-3 p-2 sm:p-4 bg-stone-100 font-sans outline-none focus:outline-none min-h-[calc(100vh-64px)] lg:h-[calc(100vh-64px)] pb-24 lg:pb-3"
        >
            {/* 1. Header do PDV com Identificação, Ações Rápidas e Relógio */}
            <header className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">
                {/* Esquerda: Identificação do Terminal e Número da Venda */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="p-2.5 bg-amber-500 text-white rounded-lg">
                        <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none">
                                Frente de Caixa (PDV)
                            </h1>
                            <span className="text-gray-400 font-bold">•</span>
                            <span className="text-sm font-black tracking-wider uppercase text-amber-500 tabular-nums">
                                Venda #{codUltimaVenda + 1}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                            Terminal comercial de vendas e emissão rápida
                        </p>
                    </div>
                </div>

                {/* Centro/Direita: Barra de Ações Rápidas do PDV */}
                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
                    <button
                        type="button"
                        onClick={() => setShowModalBuscarVenda(true)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
                        title="Buscar Venda Salva ou Pedido [B]"
                    >
                        <Search className="w-3.5 h-3.5 text-gray-600" />
                        <span>Buscar [B]</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleSalvarVenda}
                        disabled={items.length === 0}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-md transition ${
                            items.length === 0
                                ? "text-gray-300 bg-gray-50 border border-gray-200 cursor-not-allowed"
                                : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                        }`}
                        title="Salvar Venda em Formato de Pedido [S]"
                    >
                        <Save className="w-3.5 h-3.5 text-gray-600" />
                        <span>Salvar [S]</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setshowModalImprimirOrcamento(true)}
                        disabled={items.length === 0}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-md transition ${
                            items.length === 0
                                ? "text-gray-300 bg-gray-50 border border-gray-200 cursor-not-allowed"
                                : "text-brand bg-brand-soft hover:bg-brand/15 border border-brand-border"
                        }`}
                        title="Imprimir Orçamento da Venda Atual [I]"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Orçamento [I]</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowModalReimprimirVenda(true)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
                        title="Reimprimir Comprovante de Venda Anterior [R]"
                    >
                        <RotateCcw className="w-3.5 h-3.5 text-gray-600" />
                        <span>Reimprimir [R]</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowModalAtalhos(true)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
                        title="Ver Atalhos de Teclado [A]"
                    >
                        <Keyboard className="w-3.5 h-3.5 text-amber-600" />
                        <span>Atalhos [A]</span>
                    </button>
                </div>
            </header>

            {/* 2. Grid Principal: Área Operacional (Esquerda) e Fechamento (Direita) */}
            <div className="flex flex-col lg:flex-row gap-3 flex-1 lg:min-h-0 lg:overflow-hidden">

                {/* COLUNA ESQUERDA: Operação da Venda */}
                <div className="flex flex-col gap-3 flex-1 min-w-0 h-auto lg:h-full lg:overflow-hidden">

                    {/* Card 1: Identificação (Cliente & Operador) */}
                    <div className="bg-white p-3 rounded-lg border border-gray-200 grid grid-cols-1 sm:grid-cols-12 gap-3 shrink-0 items-center">
                        {/* Atendente / Operador */}
                        <div className="sm:col-span-5 flex flex-col">
                            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase mb-1">
                                <UserCheck className="w-3.5 h-3.5 text-gray-500" />
                                <span>Operador do Caixa</span>
                            </label>
                            <input
                                type="text"
                                readOnly
                                value={funcionario ? funcionario.FUN_NOME : "ADMINISTRADOR"}
                                className="w-full h-10 px-3 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-md outline-none uppercase truncate"
                            />
                        </div>

                        {/* Cliente da Venda */}
                        <div className="sm:col-span-7 flex flex-col">
                            <label className="flex items-center justify-between text-xs font-bold text-gray-700 uppercase mb-1">
                                <span className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Cliente</span>
                                </span>
                                <span className="text-gray-400 font-semibold lowercase">tecla [C]</span>
                            </label>
                            <div className="flex gap-1.5">
                                <input
                                    type="text"
                                    readOnly
                                    value={cliente ? `${cliente.CODIGO} - ${cliente.NOME}` : "1 - CONSUMIDOR"}
                                    onClick={() => setShowModalCliente(true)}
                                    className="w-full h-10 px-3 text-sm font-bold text-gray-800 bg-gray-50 border border-gray-300 rounded-md outline-none uppercase cursor-pointer hover:border-amber-500 transition"
                                    title="Clique para pesquisar cliente (ou tecle C)"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowModalCliente(true)}
                                    className="h-10 px-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md flex items-center justify-center transition shrink-0"
                                    tabIndex={-1}
                                    title="Pesquisar Cliente [C]"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Barra de Leitura e Inclusão de Produtos */}
                    <form onSubmit={handleAddItem} className="bg-white p-3 rounded-lg border border-gray-200 grid grid-cols-12 gap-2.5 items-end shrink-0">
                        {/* Código com Atalho F7 */}
                        <div className="col-span-5 sm:col-span-3 lg:col-span-2">
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                Código <span className="text-amber-600 font-semibold">(F7)</span>
                            </label>
                            <div className="flex gap-1">
                                <input
                                    ref={codProdutoInputRef}
                                    autoFocus
                                    value={codProduto}
                                    onChange={e => setCodProduto(e.target.value)}
                                    className="w-full h-10 px-2 text-sm font-bold border border-gray-300 rounded-md focus:border-amber-500 outline-none text-center bg-white tabular-nums"
                                    placeholder="Cód."
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowModalProduto(true)}
                                    className="h-10 px-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md flex items-center justify-center transition shrink-0"
                                    tabIndex={-1}
                                    title="Buscar Produto no Catálogo [P]"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Quantidade */}
                        <div className="col-span-3 sm:col-span-2 lg:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                Qtd
                            </label>
                            <input
                                ref={qtdProdutoInputRef}
                                type="number"
                                min="1"
                                value={qtdProduto}
                                onChange={e => setQtdProduto(e.target.value)}
                                className="w-full h-10 px-1 text-sm text-center font-bold border border-gray-300 rounded-md focus:border-amber-500 outline-none bg-white tabular-nums"
                            />
                        </div>

                        {/* Preview / Leitura da Descrição */}
                        <div className="col-span-12 sm:col-span-7 lg:col-span-7">
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                Descrição do Produto
                            </label>
                            <input
                                disabled
                                value={produtoPreview}
                                className={`w-full h-10 px-3 text-sm font-semibold uppercase border rounded-md outline-none truncate transition ${
                                    (produtoPreview || "").includes("NÃO ENCONTRADO")
                                        ? "bg-rose-50 border-rose-200 text-rose-600"
                                        : produtoPreview
                                        ? "bg-gray-50 border-gray-300 text-gray-900"
                                        : "bg-gray-50 border-gray-200 text-gray-400 italic"
                                }`}
                                placeholder="Aguardando leitura do código de barras..."
                            />
                        </div>

                        {/* Botão de Inclusão */}
                        <div className="col-span-4 sm:col-span-12 lg:col-span-2">
                            <button
                                type="submit"
                                className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-md transition flex items-center justify-center gap-1.5 text-sm uppercase"
                                title="Incluir Produto na Venda (Enter)"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Incluir</span>
                            </button>
                        </div>
                    </form>

                    {/* Card 3: Grade / Tabela de Produtos da Venda */}
                    <div className="bg-white rounded-lg border border-gray-200 flex-1 flex flex-col overflow-hidden min-h-[260px]">
                        {/* Cabeçalho da Grade */}
                        <div className="bg-stone-50 border-b border-gray-200 px-3 py-2.5 grid grid-cols-12 gap-2 text-xs font-bold text-gray-700 uppercase text-center shrink-0">
                            <div className="col-span-1">#</div>
                            <div className="col-span-1">Cód</div>
                            <div className="col-span-4 text-left">Descrição do Produto</div>
                            <div className="col-span-2">Tabela</div>
                            <div className="col-span-2">Qtd / Ajuste</div>
                            <div className="col-span-2 text-right">Subtotal</div>
                        </div>

                        {/* Linhas da Grade com rolagem suave */}
                        <div className="overflow-y-auto flex-1 p-0 divide-y divide-gray-100">
                            {items.length > 0 ? (
                                items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="grid grid-cols-12 gap-2 text-sm py-2 px-3 hover:bg-amber-50/50 transition-colors items-center text-center even:bg-stone-50/60"
                                    >
                                        <div className="col-span-1 text-gray-400 font-semibold text-xs tabular-nums">
                                            {index + 1}
                                        </div>
                                        <div className="col-span-1 text-gray-600 font-medium text-xs tabular-nums">
                                            {item.VE_PRO}
                                        </div>
                                        <div className="col-span-4 text-left font-semibold text-gray-900 truncate" title={item.VE_NOME}>
                                            {item.VE_NOME}
                                        </div>

                                        {/* Seletor Varejo / Atacado */}
                                        <div className="col-span-2">
                                            <select
                                                value={item.tipoPreco}
                                                onChange={(e) => handleTrocarTipoPreco(index, e.target.value as 'VAREJO' | 'ATACADO')}
                                                className="w-full text-xs border border-gray-300 rounded px-1.5 py-1 bg-white text-gray-800 font-semibold focus:border-amber-500 outline-none cursor-pointer"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="VAREJO">Var. {formatCurrency(item.precoVarejo)}</option>
                                                <option value="ATACADO">Atac. {formatCurrency(item.precoAtacado)}</option>
                                            </select>
                                        </div>

                                        {/* Controle de Quantidade */}
                                        <div className="col-span-2 flex items-center justify-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateQuantity(index, -1)}
                                                className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-bold transition"
                                                title="Diminuir quantidade"
                                            >
                                                <Minus className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="font-bold text-gray-900 w-8 tabular-nums">
                                                {item.VE_QUANTIDADE}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateQuantity(index, 1)}
                                                className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-bold transition"
                                                title="Aumentar quantidade"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(index)}
                                                className="p-1 text-gray-400 hover:text-rose-600 transition ml-1"
                                                title="Remover item da venda"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="col-span-2 text-right font-bold text-gray-900 tabular-nums">
                                            {formatCurrency(item.VE_VALOR)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-2">
                                    <div className="p-3 bg-gray-100 rounded-full text-gray-400">
                                        <ShoppingCart className="w-8 h-8" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-600">Caixa Livre • Nenhum item na venda</p>
                                    <p className="text-xs text-gray-400">Digite o código ou passe o leitor de código de barras para iniciar.</p>
                                </div>
                            )}
                        </div>

                        {/* Rodapé da Grade */}
                        <div className="bg-stone-50 px-4 py-2.5 border-t border-gray-200 flex justify-between items-center text-xs font-semibold text-gray-700 shrink-0">
                            <span>Itens registrados: {items.length}</span>
                            <span className="text-sm font-bold text-gray-900 tabular-nums">
                                Subtotal da Grade: {formatCurrency(subTotal)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* COLUNA DIREITA: Resumo Financeiro & Fechamento */}
                <div className="w-full lg:w-[340px] flex flex-col gap-3 shrink-0 h-auto lg:h-full lg:sticky lg:top-20">
                    {/* Card de Valor Total a Pagar */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="bg-amber-500 px-4 py-2.5 text-white flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Receipt className="w-4 h-4" />
                                <h3 className="text-sm font-semibold text-white">
                                    Total da Venda
                                </h3>
                            </div>
                            <span className="text-xs bg-amber-600 text-white font-medium px-2 py-0.5 rounded tabular-nums">
                                {items.length} {items.length === 1 ? 'item' : 'itens'}
                            </span>
                        </div>

                        <div className="p-5 bg-amber-50/50 border-b border-gray-200 flex flex-col items-center justify-center text-center">
                            <span className="text-xs font-medium text-gray-600 mb-1">
                                Total a Pagar
                            </span>
                            <div className="text-4xl font-black text-gray-900 tracking-tight tabular-nums">
                                {formatCurrency(totalFinal)}
                            </div>
                        </div>

                        {/* Detalhamento Financeiro */}
                        <div className="p-4 space-y-3 text-sm">
                            <div className="flex justify-between items-center text-gray-700">
                                <span>Subtotal Bruto:</span>
                                <span className="font-bold text-gray-900 tabular-nums">
                                    {formatCurrency(subTotal)}
                                </span>
                            </div>

                            {/* Descontos Sincronizados (% e R$) */}
                            <div className="pt-2 border-t border-gray-200 space-y-1.5">
                                <label className="block text-xs font-bold text-gray-700 uppercase">
                                    Desconto Concedido
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="block text-xs text-gray-500 font-semibold mb-1">
                                            Valor (R$)
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="0,00"
                                            value={descontoReais}
                                            onChange={handleDescontoReais}
                                            className="w-full h-9 px-2.5 text-sm font-bold text-right text-rose-600 border border-gray-300 rounded-md focus:border-amber-500 outline-none bg-white tabular-nums"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-500 font-semibold mb-1">
                                            Percentual (%)
                                        </span>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="0.00"
                                                value={descontoPorcentagem}
                                                onChange={handleDescontoPorcentagem}
                                                className="w-full h-9 px-2.5 pr-7 text-sm font-bold text-right text-rose-600 border border-gray-300 rounded-md focus:border-amber-500 outline-none bg-white tabular-nums"
                                            />
                                            <Percent className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-3 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Valor Pago pelo Cliente */}
                            <div className="pt-2 border-t border-gray-200">
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                    Valor Recebido (Dinheiro / Cartão)
                                </label>
                                <input
                                    type="text"
                                    placeholder="0,00"
                                    value={valorPago}
                                    onChange={e => setValorPago(e.target.value.replaceAll(',', '.'))}
                                    className="w-full h-10 px-3 text-base font-bold text-right text-emerald-800 bg-emerald-50/50 border border-emerald-300 rounded-md focus:border-emerald-600 outline-none tabular-nums"
                                />
                            </div>

                            {/* Troco Calculado */}
                            <div className={`p-2.5 rounded-md border flex justify-between items-center transition ${
                                troco > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
                            }`}>
                                <span className="text-xs font-bold text-gray-700 uppercase">Troco</span>
                                <span className={`text-lg font-black tabular-nums ${
                                    troco > 0 ? 'text-emerald-700' : 'text-gray-400'
                                }`}>
                                    {formatCurrency(troco)}
                                </span>
                            </div>

                            {/* Botão Primário: Finalizar Venda */}
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={handleFinalizarVenda}
                                    disabled={items.length === 0}
                                    className={`w-full py-3.5 px-4 rounded-md font-bold text-sm uppercase flex items-center justify-center gap-2 transition ${
                                        items.length > 0
                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                            : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                    }`}
                                    title="Finalizar e Faturar Venda [F]"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span>Finalizar Venda [F]</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Barra Inferior Fixa no Mobile */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-300 px-4 py-2.5 flex items-center justify-between shadow-lg">
                <div>
                    <span className="block text-[10px] font-bold text-gray-500 uppercase">
                        Total da Venda
                    </span>
                    <span className="text-lg font-black text-gray-900 tabular-nums">
                        {formatCurrency(totalFinal)}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={handleFinalizarVenda}
                    disabled={items.length === 0}
                    className={`px-5 py-2.5 rounded-md text-sm font-bold flex items-center gap-2 transition ${
                        items.length > 0
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
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
