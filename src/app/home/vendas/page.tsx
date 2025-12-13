"use client"

import { useState, useEffect, useRef, useCallback } from "react";

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

export default function Vendas() {
    const [dataHora, setDataHora] = useState(new Date());
    const [items, setItems] = useState<VenEstModel[]>([]);
    const { usuarioLogado } = useAppData();
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
    const [descontoPorcentagem, setDescontoPorcentagem] = useState('');
    const [descontoReais, setDescontoReais] = useState('');
    const [descontoFloat, setDescontoFloat] = useState(0);
    const [cliente, setCliente] = useState<ClienteModel | null>(null);
    const [funcionario, setFuncionario] = useState<FuncionarioModel | null>(null);
    const [produtoPreview, setProdutoPreview] = useState("");
    const [codUltimaVenda, setCodUltimaVenda] = useState(0);
    const [venda, setVenda] = useState<VendaModel | null>(null);
    const [vendaRecemFinalizada, setVendaRecemFinalizada] = useState<VendaModel | null>(null);
    const [totalFinal, setTotalFinal] = useState(0);

    // Refs
    const codProdutoInputRef = useRef<HTMLInputElement>(null);
    const qtdProdutoInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (foiFaturado) {
            // 1. Configura a venda recém finalizada para impressão
            if (venda) {
                const normalizedString = descontoReais.replace(",", ".");
                setDescontoFloat(parseFloat(normalizedString));
                setVendaRecemFinalizada(venda);
            }

            // 2. Limpa todos os campos da tela
            setCodProduto("");
            setQtdProduto('1');
            setValorPago('');
            setDescontoPorcentagem('');
            setVenda(null);
            setTotalFinal(0);

            // 3. Fecha o modal de faturamento
            setShowModalFinalizar(false);

            // 4. Reseta o gatilho para não rodar novamente sem necessidade
            setFoiFaturado(false);

            // 5. Atualiza contador de vendas (opcional, busca do banco novamente para garantir)
            // fetchUltimaVenda(); ou incrementa localmente
            setCodUltimaVenda(prev => prev + 1);

            // 6. Devolve foco para iniciar próxima venda
            restoreFocus();
        }
    }, [foiFaturado, venda]);

    // Remove um item da lista
    const handleRemoveItem = (indexToRemove: number) => {
        if (window.confirm("Remover este item da venda?")) {
            setItems(prevItems => prevItems.filter((_, index) => index !== indexToRemove));
            // Retorna o foco para o input de código para continuar vendendo
            setTimeout(() => codProdutoInputRef.current?.focus(), 50);
        }
    };

    // Atualiza quantidade (+ ou -)
    const handleUpdateQuantity = async (indexToUpdate: number, delta: number) => {
        const itemToUpdate = items[indexToUpdate];
        const newQuantity = itemToUpdate.VE_QUANTIDADE + delta;

        const repository = new ProdutoRepository();
        const produto = await repository.getProdutoPorCodigo(itemToUpdate.VE_PRO);

        if (newQuantity < 1) return;

        if (delta > 0) {
            try {

                const estoqueDisponivel = produto?.PRO_QUANTIDADE ?? 0;

                if (estoqueDisponivel < newQuantity) {
                    alert(`Estoque insuficiente! Disponível: ${estoqueDisponivel}`);
                    return; // Interrompe a função, o setItems nunca será chamado
                }
            } catch (error) {
                console.error("Erro ao verificar estoque", error);
                return; // Evita atualizar se der erro na rede/banco
            }
        }

        setItems(prevItems => prevItems.map((item, index) => {
            if (index === indexToUpdate) {
                return {
                    ...item,
                    VE_QUANTIDADE: newQuantity,
                    VE_VALOR: produto.PRO_VALORV! * newQuantity
                };
            }

            return item;
        }));
    };

    useEffect(() => {
        const fetchFuncionario = async () => {
            // Só executa se o usuário já estiver carregado
            if (usuarioLogado && usuarioLogado.USU_FUN) {
                try {
                    const usuarioRepository = new UsuarioRepository();
                    const response = await usuarioRepository.getFuncionario(usuarioLogado.USU_FUN as number);
                    setFuncionario(response);
                } catch (error) {
                    console.error("Erro ao buscar funcionário:", error);
                }
            }
        };

        const fetchUltimaVenda = async () => {
            try {
                const vendaRepository = new VendaRepository();
                const response = await vendaRepository.getUltimaVenda();
                setCodUltimaVenda(response);
            } catch (error) {
                console.error("Erro ao buscar última venda: ", error);
            }
        }

        fetchFuncionario();
        fetchUltimaVenda();
    }, [usuarioLogado]);

    // Relógio
    useEffect(() => {
        const timer = setInterval(() => setDataHora(new Date()), 1000);
        // Foca no container principal ao carregar para capturar atalhos
        containerRef.current?.focus();
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!codProduto) {
            setProdutoPreview("");
            return;
        }

        const executarBusca = async () => {
            let quantItemsUsados: number = 0;
            for (let i in items) {
                if (items[i].VE_CODIGO == parseInt(codProduto)) {
                    quantItemsUsados += items[i].VE_QUANTIDADE;
                }
            }

            const prod = await buscarProdutoPorCodigo(codProduto, quantItemsUsados);

            if (prod) {
                setProdutoPreview(prod.nome);
            } else {
                setProdutoPreview("PRODUTO NÃO ENCONTRADO");
            }
        }

        executarBusca();
    }, [codProduto]);

    // Chamada sempre que um modal fecha para garantir que os atalhos voltem a funcionar
    const restoreFocus = () => {
        setTimeout(() => {
            containerRef.current?.focus();
        }, 50); // Pequeno delay para garantir que o modal já desmontou
    };

    // Função chamada quando o modal seleciona alguém
    const handleSelectCliente = (cliente: ClienteModel) => {
        setCliente(cliente);
        setShowModalCliente(false); // Garante o fechamento
        // Devolve o foco para o produto ou container principal
        setTimeout(() => codProdutoInputRef.current?.focus(), 100);
        restoreFocus();
    };

    const handleSelectProduto = (produto: Produto) => {
        setCodProduto(produto.codigo.toString());
        setShowModalProduto(false);
        // Após selecionar o produto, foca na quantidade para agilizar
        setTimeout(() => qtdProdutoInputRef.current?.focus(), 100);
        restoreFocus();
    };

    const handleFinalizarVenda = () => {
        if (items.length === 0) {
            alert("Adicione produtos antes de finalizar.");
        } else {
            const novaVenda: VendaModel = {
                VEN_CODIGO: codUltimaVenda + 1,
                VEN_DATA: new Date().toISOString(),
                VEN_HORA: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                VEN_VALOR: totalFinal,
                VEN_CLI: cliente?.CODIGO || 1,
                VEN_VENDEDOR: usuarioLogado?.USU_FUN as number || 1,
                VEN_NF: 0,
                VEN_DIFERENCA: 0,
                VEN_DATAC: new Date().toISOString(),
                VEN_FAT: 1,
                VEN_DAV: 0,
                VEN_DEVOLUCAO_P: 'N',
                VEN_FUN: usuarioLogado?.USU_FUN as number || 1,
                itensVenEst: items
            };

            setVenda(novaVenda);

            setShowModalFinalizar(true);
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.defaultPrevented) return;
        if (showModalFinalizar || showModalCliente || showModalProduto || showModalAtalhos || showModalImprimirOrcamento) return;

        const target = e.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

        switch (e.key) {
            case 'a':
            case 'A':
                if (!isInput) {
                    e.preventDefault();
                    setShowModalAtalhos(true);
                }
                break;
            case 'c':
            case 'C':
                if (!isInput) {
                    e.preventDefault();
                    setShowModalCliente(true);
                }
                break;
            case 'p':
            case 'P':
                if (!isInput) {
                    e.preventDefault();
                    setShowModalProduto(true);
                }
                break;
            case 'i':
            case 'I':
                if (!isInput) {
                    e.preventDefault();
                    setshowModalImprimirOrcamento(true);
                }
                break;
            case 'r':
            case 'R':
                if (!isInput) {
                    e.preventDefault();
                    setShowModalReimprimirVenda(true);
                }
                break;
            case 'f':
            case 'F':
                e.preventDefault();
                if (!isInput) handleFinalizarVenda();
                break;
            case 'F7':
                e.preventDefault();
                codProdutoInputRef.current?.focus();
                break;
            case 'Escape':
                e.preventDefault();
                // A lógica de limpar só executa se o código passar pelos checks acima
                if (window.confirm("Deseja limpar a venda atual?")) {
                    setItems([]);
                    setCodProduto("");
                    setValorPago('0');
                }
                break;
            default:
                break;
        }
    };

    const subTotal = items.reduce((acc, item) => acc + item.VE_VALOR, 0);
    const troco = parseFloat(valorPago) > totalFinal ? parseFloat(valorPago) - totalFinal : 0;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    useEffect(() => {
        const descValor = parseFloat(descontoReais.replace(',', '.') || '0');
        setTotalFinal(Math.max(0, subTotal - descValor));
    }, [items, descontoReais, subTotal]);

    // Função: Digitou Porcentagem -> Calcula Reais
    const handleDescontoPorcentagem = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valorInput = e.target.value.replace(',', '.');
        setDescontoPorcentagem(e.target.value); // Mantém o que o usuário digita (com vírgula se for o caso)

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
        setDescontoReais(e.target.value);

        const reais = parseFloat(valorInput);
        if (!isNaN(reais) && subTotal > 0) {
            const valorEmPorcentagem = (reais / subTotal) * 100;
            // Atualiza o campo de porcentagem formatado
            setDescontoPorcentagem(valorEmPorcentagem.toFixed(2).replace('.', ','));
        } else if (valorInput === '') {
            setDescontoPorcentagem('');
        }
    };

    const handleAddItem = async (e: React.FormEvent) => { // Note o async aqui
        e.preventDefault();
        if (!codProduto) return;

        try {
            let quantItemsUsados: number = 0;
            for (let i in items) {
                if (items[i].VE_CODIGO == parseInt(codProduto)) {
                    quantItemsUsados += items[i].VE_QUANTIDADE;
                }
            }

            const produtoEncontrado = await buscarProdutoPorCodigo(codProduto, quantItemsUsados);

            if (!produtoEncontrado) {
                alert("Produto não cadastrado!");
                return;
            }

            // Se chegou aqui, tem estoque (senão teria caído no catch)
            const newItem: VenEstModel = {
                VE_CODIGO: await IncrementaGenerator('GEN_VE'),
                VE_VALOR: produtoEncontrado.precoVenda * parseInt(qtdProduto),
                VE_QUANTIDADE: parseInt(qtdProduto),
                VE_VEN: codUltimaVenda + 1,
                VE_PRO: produtoEncontrado.codigo,
                VE_NOME: produtoEncontrado.nome,
            };

            setItems([...items, newItem]);
            setCodProduto("");
            setQtdProduto('1');
            setProdutoPreview("");
            codProdutoInputRef.current?.focus();

        } catch (error: any) {
            // 2. Captura o erro de estoque e mostra ao usuário
            alert(error.message || "Erro ao buscar produto");
            setCodProduto(""); // Opcional: limpar campo se der erro
            codProdutoInputRef.current?.focus();
        }
    };

    return (
        <div
            ref={containerRef}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
            className="flex flex-col w-full gap-2 p-2 bg-stone-100 font-sans outline-none focus:outline-none h-auto min-h-screen lg:h-[calc(100vh-90px)] lg:min-h-0 overflow-y-auto lg:overflow-hidden"
        >

            {/* --- HEADER --- */}
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

            {/* --- ÁREA DE CONTEÚDO --- */}
            <div className="flex flex-col lg:flex-row gap-2 flex-1 min-h-0">

                {/* === COLUNA ESQUERDA === */}
                <div className="flex flex-col gap-2 flex-1 min-w-0 h-auto lg:h-full">

                    {/* 1. Painel de Dados */}
                    <div className="bg-white px-3 py-2 w-full rounded-md shadow-sm grid grid-cols-12 gap-2 shrink-0 items-center">
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase block">Cód. Venda</label>
                            <div className="text-lg font-bold text-red-600 leading-none">{codUltimaVenda + 1}</div>
                        </div>
                        <div className="col-span-5 md:col-span-3">
                            <label className="text-[10px] font-bold text-gray-400 uppercase block">Funcionário</label>
                            <div className="flex items-center w-full border border-gray-300 rounded text-sm bg-gray-50 h-8 px-1 focus:outline-none focus:border-amber-400">
                                {funcionario != null ? funcionario.FUN_NOME : "FUNCIONÁRIO"}
                            </div>
                        </div>
                        <div className="col-span-5 md:col-span-8">
                            <label className="text-[10px] font-bold text-gray-400 uppercase block">Cliente (C)</label>
                            <div className="flex gap-1">
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded text-sm h-8 px-2 font-bold text-gray-700 bg-gray-50 focus:outline-none"
                                    value={cliente != null ? cliente.NOME : "CONSUMIDOR"}
                                    readOnly
                                />
                                <button
                                    onClick={() => setShowModalCliente(true)}
                                    className="bg-amber-400 hover:bg-amber-500 text-white w-8 h-8 rounded flex items-center justify-center transition"
                                >
                                    <i className="fas fa-search"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 2. Barra de Inclusão */}
                    <form onSubmit={handleAddItem} className="bg-white p-2 rounded-md shadow-sm grid grid-cols-12 gap-2 items-end shrink-0 border border-gray-200">

                        {/* CÓDIGO (Col Span 3 mobile, 2 desktop) */}
                        <div className="col-span-3 md:col-span-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Código (F7)</label>
                            <input
                                ref={codProdutoInputRef}
                                autoFocus
                                value={codProduto}
                                onChange={e => setCodProduto(e.target.value)}
                                className="w-full border-2 border-amber-300 rounded h-10 px-2 text-lg font-bold focus:border-amber-500 outline-none text-center"
                                placeholder="Cód."
                            />
                        </div>

                        {/* BOTÃO DE PESQUISA (AO LADO) */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1 truncate" title="Pesquisar (P)">Pesquisar (P)</label>
                            <button
                                type="button"
                                onClick={() => setShowModalProduto(true)}
                                className="bg-amber-400 hover:bg-amber-500 text-white w-full h-10 rounded flex items-center justify-center transition shadow-sm"
                                title="Pesquisar Produto (P ou F6)"
                            >
                                <i className="fas fa-search text-sm"></i>
                            </button>
                        </div>

                        {/* QUANTIDADE */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Qtd</label>
                            <input
                                ref={qtdProdutoInputRef}
                                type="number"
                                value={qtdProduto}
                                onChange={e => setQtdProduto(e.target.value)}
                                className="w-full border border-gray-300 rounded h-10 px-1 text-lg text-center font-bold focus:border-amber-400 outline-none"
                            />
                        </div>

                        {/* DESCRIÇÃO (Reduzi o col-span de 7 para 6 para caber o botão novo) */}
                        <div className="col-span-3 md:col-span-6">
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Descrição do Produto</label>
                            <input
                                disabled
                                value={produtoPreview}
                                className={`w-full border border-gray-100 bg-gray-100 rounded h-10 px-3 text-lg font-bold italic transition-colors ${produtoPreview === "PRODUTO NÃO ENCONTRADO" ? 'text-red-400' : 'text-gray-600'}`}
                                placeholder="Aguardando leitura..."
                            />
                        </div>

                        {/* BOTÃO INCLUIR */}
                        <div className="col-span-2 md:col-span-2">
                            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-10 rounded shadow transition flex items-center justify-center gap-2 text-sm uppercase">
                                <i className="fas fa-plus"></i> <span className="hidden md:inline">Incluir</span>
                            </button>
                        </div>
                    </form>

                    {/* 3. Grid de Produtos */}
                    <div className="bg-white rounded-md shadow-sm flex-1 flex flex-col border border-gray-200 overflow-hidden min-h-[300px] lg:min-h-0">
                        {/* Header do Grid */}
                        <div className="bg-stone-100 border-b border-gray-200 px-1 py-2 grid grid-cols-12 gap-2 text-xs font-bold text-gray-600 uppercase text-center shrink-0 mr-1">
                            <div className="col-span-1">Item</div>
                            <div className="col-span-2 text-left pl-2">Código</div>
                            <div className="col-span-3 text-left">Descrição</div> {/* Reduzi de 4 para 3 para dar espaço */}
                            <div className="col-span-2 text-right">Unitário</div>
                            <div className="col-span-2">Qtd</div> {/* Aumentei de 1 para 2 */}
                            <div className="col-span-2 text-right pr-2">Total</div>
                        </div>

                        <div className="overflow-y-auto flex-1 p-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                            {items.length > 0 ? items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 text-sm py-2 px-1 border-b border-gray-100 hover:bg-amber-50 transition-colors items-center text-center cursor-pointer even:bg-stone-50">
                                    <div className="col-span-1 text-gray-400 font-mono text-xs">{String(index + 1).padStart(3, '0')}</div>
                                    <div className="col-span-2 text-left pl-2 font-semibold text-gray-700 truncate">{item.VE_PRO}</div>
                                    <div className="col-span-3 text-left font-bold text-gray-800 truncate">{item.VE_NOME}</div>
                                    <div className="col-span-2 text-right text-gray-600">{formatCurrency(item.VE_VALOR / item.VE_QUANTIDADE)}</div>

                                    {/* COLUNA DE QUANTIDADE COM CONTROLES */}
                                    <div className="col-span-2 flex items-center justify-center gap-1">
                                        <button
                                            onClick={() => handleUpdateQuantity(index, -1)}
                                            className="w-5 h-5 flex items-center justify-center bg-gray-200 hover:bg-red-100 text-gray-600 hover:text-red-600 rounded text-xs font-bold transition"
                                        >-</button>

                                        <span className="font-bold bg-white border border-gray-200 rounded text-xs py-0.5 px-2 min-w-[24px]">
                                            {item.VE_QUANTIDADE}
                                        </span>

                                        <button
                                            onClick={() => handleUpdateQuantity(index, 1)}
                                            className="w-5 h-5 flex items-center justify-center bg-gray-200 hover:bg-green-100 text-gray-600 hover:text-green-600 rounded text-xs font-bold transition"
                                        >+</button>

                                        {/* Lixeira Pequena */}
                                        <button
                                            onClick={() => handleRemoveItem(index)}
                                            className="ml-1 text-gray-300 hover:text-red-500 transition"
                                            title="Remover Item"
                                        >
                                            <i className="fas fa-trash text-xs"></i>
                                        </button>
                                    </div>

                                    <div className="col-span-2 text-right pr-2 font-bold text-gray-800">{formatCurrency(item.VE_VALOR)}</div>
                                </div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-50">
                                    <i className="fas fa-shopping-cart text-6xl mb-2"></i>
                                    <span className="text-lg font-medium">Caixa Livre</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-stone-50 p-2 border-t border-gray-200 flex justify-between items-center text-xs font-bold text-gray-500 shrink-0">
                            <span>REGISTROS: {items.length}</span>
                            <span>TABELA: VAREJO</span>
                        </div>
                    </div>
                </div>

                {/* === COLUNA DIREITA === */}
                <div className="w-full lg:w-[300px] flex flex-col gap-2 shrink-0 h-auto lg:h-full">
                    {/* Card Total */}
                    <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden shrink-0">
                        <div className="bg-gray-50 py-1 text-center border-b border-gray-100">
                            <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Total a Pagar</span>
                        </div>
                        <div className="p-3 text-center flex items-center justify-center bg-white h-24">
                            <span className="text-2xl font-bold text-gray-400 self-start mt-1 mr-1">R$</span>
                            <span className="text-5xl font-black text-red-600 tracking-tighter">
                                {totalFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Inputs de Pagamento */}
                    <div className="bg-white rounded-md shadow-sm border border-gray-200 p-3 space-y-2 shrink-0">
                        <div className="flex justify-between items-end border-b border-dashed border-gray-200 pb-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Subtotal</label>
                            <span className="text-lg font-bold text-gray-700">{formatCurrency(subTotal)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {/* Linha 1: Descontos */}
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Desc. (%)</label>
                                <input
                                    placeholder="0"
                                    type="text"
                                    value={descontoPorcentagem}
                                    onChange={handleDescontoPorcentagem}
                                    className="w-full border border-gray-300 rounded p-1 text-right font-bold text-red-600 focus:border-red-500 outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Desc. (R$)</label>
                                <input
                                    placeholder="0,00"
                                    type="text"
                                    value={descontoReais}
                                    onChange={handleDescontoReais}
                                    className="w-full border border-gray-300 rounded p-1 text-right font-bold text-red-600 focus:border-red-500 outline-none text-sm"
                                />
                            </div>

                            {/* Linha 2: Valor Pago (Ocupa as 2 colunas) */}
                            <div className="col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Valor Pago</label>
                                <input
                                    placeholder="0,00"
                                    type="text"
                                    value={valorPago}
                                    onChange={e => setValorPago(e.target.value.replaceAll(',', '.'))}
                                    className="w-full border border-green-500 rounded p-1 text-right font-bold text-green-700 focus:ring-1 focus:ring-green-300 outline-none text-sm"
                                />
                            </div>
                        </div>

                        <div className={`p-2 rounded border flex justify-between items-center transition-colors ${troco > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                            <label className="text-xs font-bold text-gray-500 uppercase">Troco</label>
                            <span className={`text-xl font-bold ${troco > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                {formatCurrency(troco)}
                            </span>
                        </div>

                        <button onClick={() => { handleFinalizarVenda() }} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold py-3 rounded shadow active:scale-[0.99] transition-transform uppercase tracking-wide">
                            Finalizar (F)
                        </button>

                        <div className="bg-stone-800 text-stone-300 rounded-md p-2 text-xs font-mono shadow-inner flex justify-between overflow-y-auto min-h-0">
                            <h3 className="text-stone-500 font-bold uppercase text-[10px] tracking-wider">Teclas de Atalho</h3>
                            <h3 className="rounded bg-red-400 text-stone-800 px-1 font-bold uppercase text-[10px] tracking-wider">[A]</h3>
                        </div>
                    </div>
                </div>
            </div>

            <ModalClientes
                isOpen={showModalCliente}
                onClose={() => {
                    setShowModalCliente(false);
                    restoreFocus();
                }}
                onSelect={handleSelectCliente}
            />

            <ModalProdutos
                isOpen={showModalProduto}
                onClose={() => {
                    setShowModalProduto(false);
                    restoreFocus();
                }}
                onSelect={handleSelectProduto}
            />

            <ModalAtalhos
                isOpen={showModalAtalhos}
                onClose={() => {
                    setShowModalAtalhos(false);
                    restoreFocus();
                }}
            />

            <ModalImprimirOrcamento
                isOpen={showModalImprimirOrcamento}
                onClose={() => {
                    setshowModalImprimirOrcamento(false);
                    restoreFocus();
                }}
                itens={items}
                total={totalFinal}
                cliente={cliente != null ? cliente.NOME : "CONSUMIDOR"}
                funcionario={funcionario?.FUN_NOME ?? "FUNCIONÁRIO NÃO IDENTIFICADO"}
            />

            <ModalReimprimirVenda
                isOpen={showModalReimprimirVenda}
                onClose={() => {
                    setShowModalReimprimirVenda(false);
                    restoreFocus();
                }}
            />

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