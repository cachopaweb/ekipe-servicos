"use client"

import ModalClientes, { Cliente } from "./modal_clientes";
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

    // Estados de inputs
    const [codProduto, setCodProduto] = useState("");
    const [qtdProduto, setQtdProduto] = useState(1);
    const [valorPago, setValorPago] = useState(0);
    const [descontoGeral, setDescontoGeral] = useState(0);
    const [clienteNome, setClienteNome] = useState("CONSUMIDOR");

    // Refs
    const codProdutoInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Relógio
    useEffect(() => {
        const timer = setInterval(() => setDataHora(new Date()), 1000);
        // Foca no container principal ao carregar para capturar atalhos
        containerRef.current?.focus();
        return () => clearInterval(timer);
    }, []);

    // Função chamada quando o modal seleciona alguém
    const handleSelectCliente = (cliente: Cliente) => {
        setClienteNome(cliente.nome);
        setShowModalCliente(false); // Garante o fechamento
        // Devolve o foco para o produto ou container principal
        setTimeout(() => codProdutoInputRef.current?.focus(), 100);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.defaultPrevented) return;
        if (showModalCliente) return;

        switch (e.key) {
            case 'c':
                e.preventDefault();
                setShowModalCliente(true);
                break;
            case 'F2':
                e.preventDefault();
                alert("Focar em edição de valor (F2)");
                break;
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
                    setValorPago(0);
                }
                break;
            default:
                break;
        }
    };

    const subTotal = items.reduce((acc, item) => acc + item.total, 0);
    const totalFinal = subTotal - descontoGeral;
    const troco = valorPago > totalFinal ? valorPago - totalFinal : 0;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!codProduto) return;

        const newItem: ItemVenda = {
            id: items.length + 1,
            codigo: codProduto,
            descricao: `PRODUTO EXEMPLO ${items.length + 1}`,
            valorUnitario: 150.00,
            quantidade: qtdProduto,
            desconto: 0,
            total: 150.00 * qtdProduto
        };

        setItems([...items, newItem]);
        setCodProduto("");
        setQtdProduto(1);
        codProdutoInputRef.current?.focus();
    };

    return (
        <div
            ref={containerRef}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
            className="h-[calc(100vh-90px)] flex flex-col w-full gap-2 p-2 bg-stone-100 overflow-hidden font-sans outline-none focus:outline-none"
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
                <div className="flex flex-col gap-2 flex-1 min-w-0 h-full">

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
                            <label className="text-[10px] font-bold text-gray-400 uppercase block">Cliente (F1)</label>
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
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Qtd</label>
                            <input
                                type="number"
                                value={qtdProduto}
                                onChange={e => setQtdProduto(Number(e.target.value))}
                                className="w-full border border-gray-300 rounded h-10 px-1 text-lg text-center font-bold focus:border-amber-400 outline-none"
                            />
                        </div>
                        <div className="col-span-5 md:col-span-7">
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Descrição do Produto</label>
                            <input disabled className="w-full border border-gray-100 bg-gray-100 rounded h-10 px-3 text-lg text-gray-400 italic" placeholder="Aguardando leitura..." />
                        </div>
                        <div className="col-span-2 md:col-span-2">
                            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-10 rounded shadow transition flex items-center justify-center gap-2 text-sm uppercase">
                                <i className="fas fa-plus"></i> <span className="hidden md:inline">Incluir</span>
                            </button>
                        </div>
                    </form>

                    {/* 3. Grid de Produtos */}
                    <div className="bg-white rounded-md shadow-sm flex-1 flex flex-col border border-gray-200 min-h-0 overflow-hidden">
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
                <div className="w-full lg:w-[300px] flex flex-col gap-2 shrink-0 h-full min-h-0">
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
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Desc. (R$)</label>
                                <input
                                    type="number"
                                    value={descontoGeral}
                                    onChange={e => setDescontoGeral(Number(e.target.value))}
                                    className="w-full border border-gray-300 rounded p-1 text-right font-bold text-red-600 focus:border-red-500 outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Valor Pago</label>
                                <input
                                    type="number"
                                    value={valorPago}
                                    onChange={e => setValorPago(Number(e.target.value))}
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
                    </div>

                    {/* Atalhos */}
                    <div className="bg-stone-800 text-stone-300 rounded-md p-2 text-xs font-mono shadow-inner flex-1 overflow-y-auto min-h-0">
                        <h3 className="text-stone-500 font-bold border-b border-stone-600 pb-1 mb-2 uppercase text-[10px] tracking-wider">Teclas de Atalho</h3>
                        <ul className="space-y-1.5">
                            <li className="flex justify-between items-center group hover:text-white">
                                <span>Selecionar Cliente</span>
                                <span className="bg-stone-700 px-1.5 py-0.5 rounded text-white font-bold group-hover:bg-amber-500">C</span>
                            </li>
                            <li className="flex justify-between items-center group hover:text-white">
                                <span>Editar Valor Unit.</span>
                                <span className="bg-stone-700 px-1.5 py-0.5 rounded text-white font-bold group-hover:bg-amber-500">F2</span>
                            </li>
                            <li className="flex justify-between items-center group hover:text-white">
                                <span>Cadastrar Cliente</span>
                                <span className="bg-stone-700 px-1.5 py-0.5 rounded text-white font-bold group-hover:bg-amber-500">F3</span>
                            </li>
                            <li className="flex justify-between items-center group hover:text-white">
                                <span>Buscar Produto</span>
                                <span className="bg-stone-700 px-1.5 py-0.5 rounded text-white font-bold group-hover:bg-amber-500">F6</span>
                            </li>
                            <li className="flex justify-between items-center group text-amber-400 hover:text-amber-300">
                                <span>Focar Código</span>
                                <span className="bg-stone-700 px-1.5 py-0.5 rounded text-white font-bold border border-amber-500/50">F7</span>
                            </li>
                            <li className="flex justify-between items-center group hover:text-white">
                                <span>Imprimir Orçamento</span>
                                <span className="bg-stone-700 px-1.5 py-0.5 rounded text-white font-bold group-hover:bg-amber-500">F8</span>
                            </li>
                            <li className="flex justify-between items-center group hover:text-white">
                                <span>Reimprimir Venda</span>
                                <span className="bg-stone-700 px-1.5 py-0.5 rounded text-white font-bold group-hover:bg-amber-500">F10</span>
                            </li>
                            <li className="flex justify-between items-center group hover:text-white">
                                <span>Ajuste Estoque</span>
                                <span className="bg-stone-700 px-1.5 py-0.5 rounded text-white font-bold group-hover:bg-amber-500">F12</span>
                            </li>
                            <li className="flex justify-between items-center text-red-300 hover:text-red-200">
                                <span>Cancelar Venda</span>
                                <span className="bg-red-900/50 px-1.5 py-0.5 rounded text-white font-bold">ESC</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <ModalClientes
                isOpen={showModalCliente}
                onClose={() => setShowModalCliente(false)}
                onSelect={handleSelectCliente}
            />
        </div >
    );
}