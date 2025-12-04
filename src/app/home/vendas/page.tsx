"use client"

import ModalClientes, { Cliente } from "./modal_clientes";
import ModalProdutos, { Produto, buscarProdutoPorCodigo } from "./modal_produtos";
import ModalAtalhos from "./modal_atalhos";
import ModalImprimir from "./modal_orcamento";
import { useState, useEffect, useRef, useCallback } from "react";

interface ItemVenda {
    id: number;
    codigo: string;
    descricao: string;
    valorUnitario: number;
    quantidade: number;
    desconto: number;
    total: number;
}

export default function Vendas() {
    const [dataHora, setDataHora] = useState(new Date());
    const [items, setItems] = useState<ItemVenda[]>([]);
    const [showModalCliente, setShowModalCliente] = useState(false);
    const [showModalProduto, setShowModalProduto] = useState(false);
    const [showModalAtalhos, setShowModalAtalhos] = useState(false);
    const [showModalImprimir, setShowModalImprimir] = useState(false);

    // Estados de inputs
    const [codProduto, setCodProduto] = useState("");
    const [qtdProduto, setQtdProduto] = useState('1');
    const [valorPago, setValorPago] = useState('0');
    const [descontoGeral, setDescontoGeral] = useState('0');
    const [clienteNome, setClienteNome] = useState("CONSUMIDOR");
    const [funcionarioNome, setFuncionarioNome] = useState("FUNCIONÁRIO");
    const [produtoPreview, setProdutoPreview] = useState("");

    // Refs
    const codProdutoInputRef = useRef<HTMLInputElement>(null);
    const qtdProdutoInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

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
            const prod = await buscarProdutoPorCodigo(codProduto);

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
    const handleSelectCliente = (cliente: Cliente) => {
        setClienteNome(cliente.nome);
        setShowModalCliente(false); // Garante o fechamento
        // Devolve o foco para o produto ou container principal
        setTimeout(() => codProdutoInputRef.current?.focus(), 100);
        restoreFocus();
    };

    const handleSelectProduto = (produto: Produto) => {
        setCodProduto(produto.id.toString());
        setShowModalProduto(false);
        // Após selecionar o produto, foca na quantidade para agilizar
        setTimeout(() => qtdProdutoInputRef.current?.focus(), 100);
        restoreFocus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.defaultPrevented) return;
        if (showModalCliente || showModalProduto || showModalAtalhos || showModalImprimir) return;

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
                    setShowModalImprimir(true);
                }
            case 'F7':
                e.preventDefault();
                codProdutoInputRef.current?.focus();
                break;
            case 'F5':
                e.preventDefault();
                alert("Finalizar Venda (F5)");
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

    const subTotal = items.reduce((acc, item) => acc + item.total, 0);
    const desconto = subTotal * parseFloat(descontoGeral) / 100;
    const totalFinal = Number.isNaN(desconto) ? subTotal : subTotal - desconto;
    const troco = parseFloat(valorPago) > totalFinal ? parseFloat(valorPago) - totalFinal : 0;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!codProduto) return;

        // 1. Busca os dados reais usando a função importada do modal
        const produtoEncontrado = await buscarProdutoPorCodigo(codProduto);

        // 2. Validação
        if (!produtoEncontrado) {
            alert("Produto não encontrado no cadastro!");
            // Opcional: limpar campo
            // setCodProduto(""); 
            return;
        }

        // 3. Cria o item com os dados REAIS
        const newItem: ItemVenda = {
            id: items.length + 1,
            codigo: codProduto,
            descricao: produtoEncontrado.nome, // Nome correto
            valorUnitario: produtoEncontrado.precoVenda, // Preço correto
            quantidade: parseInt(qtdProduto),
            desconto: 0,
            total: produtoEncontrado.precoVenda * parseInt(qtdProduto)
        };

        setItems([...items, newItem]);

        // 4. Limpa para o próximo item
        setCodProduto("");
        setQtdProduto('1');
        setProdutoPreview("");
        codProdutoInputRef.current?.focus();
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
                            <label className="text-[10px] font-bold text-gray-400 uppercase block">Cód.</label>
                            <div className="text-lg font-bold text-red-600 leading-none">2078</div>
                        </div>
                        <div className="col-span-5 md:col-span-3">
                            <label className="text-[10px] font-bold text-gray-400 uppercase block">Funcionário</label>
                            <select className="w-full border border-gray-300 rounded text-sm bg-gray-50 h-8 px-1 focus:outline-none focus:border-amber-400">
                                <option>ADM - ADMINISTRADOR</option>
                            </select>
                        </div>
                        <div className="col-span-5 md:col-span-8">
                            <label className="text-[10px] font-bold text-gray-400 uppercase block">Cliente (C)</label>
                            <div className="flex gap-1">
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded text-sm h-8 px-2 font-bold text-gray-700 bg-gray-50 focus:outline-none"
                                    value={clienteNome}
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
                        <div className="bg-stone-100 border-b border-gray-200 px-1 py-2 grid grid-cols-12 gap-2 text-xs font-bold text-gray-600 uppercase text-center shrink-0 mr-1">
                            <div className="col-span-1">Item</div>
                            <div className="col-span-2 text-left pl-2">Código</div>
                            <div className="col-span-4 text-left">Descrição</div>
                            <div className="col-span-2 text-right">Unitário</div>
                            <div className="col-span-1">Qtd</div>
                            <div className="col-span-2 text-right pr-2">Total</div>
                        </div>

                        <div className="overflow-y-auto flex-1 p-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                            {items.length > 0 ? items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 text-sm py-2 px-1 border-b border-gray-100 hover:bg-amber-50 transition-colors items-center text-center cursor-pointer even:bg-stone-50">
                                    <div className="col-span-1 text-gray-400 font-mono text-xs">{String(index + 1).padStart(3, '0')}</div>
                                    <div className="col-span-2 text-left pl-2 font-semibold text-gray-700 truncate">{item.codigo}</div>
                                    <div className="col-span-4 text-left font-bold text-gray-800 truncate">{item.descricao}</div>
                                    <div className="col-span-2 text-right text-gray-600">{formatCurrency(item.valorUnitario)}</div>
                                    <div className="col-span-1 font-bold bg-white border border-gray-200 rounded text-xs py-0.5 mx-2">{item.quantidade}</div>
                                    <div className="col-span-2 text-right pr-2 font-bold text-gray-800">{formatCurrency(item.total)}</div>
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
                                {totalFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Inputs de Pagamento */}
                    <div className="bg-white rounded-md shadow-sm border border-gray-200 p-3 space-y-2 shrink-0">
                        <div className="flex justify-between items-end border-b border-dashed border-gray-200 pb-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Subtotal</label>
                            <span className="text-lg font-bold text-gray-700">{formatCurrency(subTotal)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Desc. (%)</label>
                                <input
                                    placeholder="0"
                                    type="text"
                                    value={descontoGeral}
                                    onChange={e => setDescontoGeral(e.target.value.replaceAll(',', '.'))}
                                    className="w-full border border-gray-300 rounded p-1 text-right font-bold text-red-600 focus:border-red-500 outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Valor Pago</label>
                                <input
                                    placeholder="0"
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

                        <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold py-3 rounded shadow active:scale-[0.99] transition-transform uppercase tracking-wide">
                            Finalizar (F5)
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

            <ModalImprimir
                isOpen={showModalImprimir}
                onClose={() => {
                    setShowModalImprimir(false);
                    restoreFocus();
                }}
                itens={items}
                total={totalFinal}
                cliente={clienteNome}
                funcionario={funcionarioNome}
            />
        </div >
    );
}