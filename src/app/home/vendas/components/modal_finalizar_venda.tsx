"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/*
 * Este modal é uma nova versão do componente de venda, deve ser
 adaptado conforme necessidade.  
*/

// Interface para os dados de retorno
export interface DadosPagamento {
  parcelas: Parcela[];
  totalVenda: number;
  valorEntrada: number;
}

interface ModalFinalizarVendaProps {
  isOpen: boolean;
  onClose: () => void;
  totalVenda: number;
  clienteNome: string;
  onFinalizar: (dados: DadosPagamento) => void;
}

interface Parcela {
  numero: number;
  vencimento: string;
  valor: number;
  formaPagamento: string;
  tipo: 'ENTRADA' | 'PARCELA';
}

export default function ModalFinalizarVenda({
  isOpen,
  onClose,
  totalVenda,
  clienteNome,
  onFinalizar
}: ModalFinalizarVendaProps) {

  // --- ESTADOS ---
  const [entrada, setEntrada] = useState<number | string>(0);
  const [qtdParcelas, setQtdParcelas] = useState<number | string>(0); // 0 = À vista
  const [formaPagamento, setFormaPagamento] = useState("DINHEIRO");
  const [primeiroVencimento, setPrimeiroVencimento] = useState("");
  const [parcelasGeradas, setParcelasGeradas] = useState<Parcela[]>([]);

  // --- REFS ---
  const entradaRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

  // Formatador de Moeda
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  // --- EFEITO: INICIALIZAÇÃO ---
  useEffect(() => {
    if (isOpen) {
      // Reseta estados ao abrir
      setEntrada(totalVenda); // Sugere pagar tudo à vista
      setQtdParcelas(0);
      setFormaPagamento("DINHEIRO");

      const dataCalculada = new Date();
      dataCalculada.setDate(dataCalculada.getDate() + 30);
      // Formata para YYYY-MM-DD (padrão do input type="date")
      const data30Dias = dataCalculada.toISOString().split('T')[0];

      setPrimeiroVencimento(data30Dias);

      // Foca no campo de entrada
      setTimeout(() => entradaRef.current?.focus(), 50);
    }
  }, [isOpen, totalVenda]);

  // --- EFEITO: CÁLCULO DE PARCELAS (CORE LOGIC) ---
  useEffect(() => {
    const calcularParcelas = () => {

      const valorEntrada = entrada === "" ? 0 : Number(entrada);
      const numParcelas = qtdParcelas === "" ? 0 : Number(qtdParcelas);

      const lista: Parcela[] = [];
      let saldoDevedor = round2(totalVenda);

      // 1. Adiciona a Entrada (se houver)
      if (valorEntrada > 0) {
        lista.push({
          numero: 1,
          vencimento: new Date().toLocaleDateString('pt-BR'), // Hoje
          valor: valorEntrada,
          formaPagamento: "DINHEIRO", // Entrada geralmente é dinheiro/pix
          tipo: 'ENTRADA'
        });
        saldoDevedor = round2(saldoDevedor - valorEntrada);;
      }

      // Ajuste para evitar erros de arredondamento (ex: 0.00000001)
      saldoDevedor = Math.max(0, parseFloat(saldoDevedor.toFixed(2)));

      // 2. Adiciona as Parcelas do Saldo
      if (saldoDevedor > 0 && numParcelas > 0) {
        // Divide o saldo
        const valorBaseParcela = Math.floor((saldoDevedor / numParcelas) * 100) / 100;
        let resto = round2(saldoDevedor - (valorBaseParcela * numParcelas));

        const dataBase = primeiroVencimento
          ? new Date(primeiroVencimento + "T12:00:00")
          : new Date();

        // Se teve entrada, as parcelas começam do índice 2, senão do 1
        const numeroInicial = valorEntrada > 0 ? 2 : 1;

        for (let i = 0; i < numParcelas; i++) {
          // Adiciona os centavos que sobraram na primeira parcela
          const valorAtual = i === 0 ? round2(valorBaseParcela + resto) : valorBaseParcela;

          const dataVenc = new Date(dataBase);
          dataVenc.setDate(dataBase.getDate() + (30 * i));

          lista.push({
            numero: numeroInicial + i,
            vencimento: dataVenc.toLocaleDateString('pt-BR'),
            valor: valorAtual,
            formaPagamento: formaPagamento,
            tipo: 'PARCELA'
          });
        }
      }

      setParcelasGeradas(lista);
    };

    calcularParcelas();
  }, [entrada, qtdParcelas, totalVenda, formaPagamento, primeiroVencimento]);

  // --- HANDLERS ---
  const handleSave = () => {
    const totalGerado = parcelasGeradas.reduce((acc, p) => acc + p.valor, 0);

    // Validação de segurança (margem de erro de 1 centavo)
    if (Math.abs(totalGerado - totalVenda) > 0.01) {
      alert(`Erro de fechamento: Valor gerado (${formatCurrency(totalGerado)}) difere do total da venda! Verifique a entrada.`);
      return;
    }

    if (window.confirm("Confirma o fechamento e geração financeira?")) {
      onFinalizar({
        parcelas: parcelasGeradas,
        totalVenda,
        valorEntrada: entrada === "" ? 0 : Number(entrada)
      });
      onClose();
    }
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
    if (e.key === "F5") {
      e.preventDefault();
      handleSave();
    }
    // Enter no formulário pode pular campos, mas aqui vamos simplificar
    if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "INPUT") {
      e.preventDefault();
      handleSave();
    }
  }, [parcelasGeradas, totalVenda]); // Dependências para o closure funcionar

  if (!isOpen) return null;

  const permiteParcelamento = formaPagamento === "CARTAO_CREDITO" || formaPagamento === "CREDIARIO";

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in outline-none"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white w-full max-w-4xl h-[90vh] md:h-[600px] flex flex-col rounded-xl shadow-2xl overflow-hidden font-sans border border-gray-400">

        {/* === HEADER === */}
        <div className="bg-stone-100 px-6 py-4 border-b border-gray-300 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase">Fechamento de Venda</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200">FATURA A GERAR</span>
              <span className="text-xs font-bold text-gray-500 uppercase truncate max-w-[200px]">{clienteNome}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-gray-500 uppercase block tracking-widest">Valor Total</span>
            <span className="text-5xl font-black text-red-600 tracking-tighter drop-shadow-sm">{formatCurrency(totalVenda)}</span>
          </div>
        </div>

        {/* === CORPO === */}
        <div className="flex-1 bg-white p-4 overflow-y-auto flex flex-col gap-6">

          {/* ÁREA DE ENTRADA (Destaque Visual) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">

            {/* Campo Entrada */}
            <div className="md:col-span-4 relative">
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1 ml-1">Valor de Entrada</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 font-bold text-lg">R$</span>
                <input
                  ref={entradaRef}
                  type="number"
                  step="0.01"
                  value={entrada}
                  onChange={e => {
                    const value = e.target.value;
                    if (value === "") {
                      setEntrada(""); // Permite ficar vazio
                      return;
                    }
                    const v = parseFloat(value);
                    setEntrada(v);
                    if (v >= totalVenda) setQtdParcelas(0);
                  }}
                  // Ao sair do campo, se estiver vazio, volta pra 0, senão formata arredondado
                  onBlur={() => setEntrada(prev => prev === "" ? 0 : round2(Number(prev)))}
                  onFocus={(e) => e.target.select()}
                  className="w-full border-2 border-green-500 rounded-lg h-14 pl-10 pr-4 text-2xl font-bold text-green-700 text-right focus:ring-4 focus:ring-green-100 outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Operador + */}
            <div className="md:col-span-1 flex justify-center items-center h-14 pb-1">
              <i className="fas fa-plus text-gray-300 text-2xl"></i>
            </div>

            {/* Campo Parcelas */}
            <div className="md:col-span-3">
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1 ml-1">Nº Parcelas</label>
              <input
                type="number"
                min="0"
                max="24"
                value={qtdParcelas}
                onChange={e => {
                  const value = e.target.value;
                  if (value === "") {
                    setQtdParcelas(""); // Permite ficar vazio
                    return;
                  }
                  setQtdParcelas(parseInt(value));
                }}
                onFocus={(e) => e.target.select()}
                disabled={Number(entrada) >= totalVenda || !permiteParcelamento}
                className="w-full border border-gray-300 rounded-lg h-14 px-4 text-2xl font-bold text-center text-gray-700 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none disabled:bg-gray-100 disabled:text-gray-300 transition-all"
              />
            </div>

            {/* Info Restante */}
            <div className="md:col-span-4 flex flex-col justify-end h-14">
              <div className="bg-stone-50 border border-stone-200 rounded-lg h-full flex items-center justify-between px-4">
                <span className="text-xs font-bold text-gray-400 uppercase">Saldo a Parcelar</span>
                <span className="text-lg font-bold text-gray-700">
                  {formatCurrency(round2(totalVenda - (entrada === "" ? 0 : Number(entrada))))}
                </span>
              </div>
            </div>
          </div>

          {/* ÁREA DE DETALHES DA FATURA */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-xs font-bold text-gray-400 uppercase border-b border-gray-200 pb-2 mb-3">Configuração das Parcelas</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Forma de Pagamento</label>
                <select
                  value={formaPagamento}
                  onChange={e => {
                    const novaForma = e.target.value;
                    setFormaPagamento(novaForma);

                    if (novaForma !== "CARTAO_CREDITO" && novaForma !== "CREDIARIO") {
                      setQtdParcelas(0);
                    }
                  }}
                  className="w-full border border-gray-300 rounded h-10 px-3 text-sm font-semibold text-gray-700 focus:border-amber-400 outline-none"
                >
                  <option value="DINHEIRO">DINHEIRO</option>
                  <option value="CARTAO_CREDITO">CARTÃO DE CRÉDITO</option>
                  <option value="CARTAO_DEBITO">CARTÃO DE DÉBITO</option>
                  <option value="PIX">PIX</option>
                  <option value="BOLETO">BOLETO BANCÁRIO</option>
                  <option value="CREDIARIO">CREDIÁRIO LOJA</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Vencimento Inicial</label>
                <input
                  type="date"
                  value={primeiroVencimento}
                  onChange={e => setPrimeiroVencimento(e.target.value)}
                  className="w-full border border-gray-300 rounded h-10 px-3 text-sm font-semibold text-gray-700 focus:border-amber-400 outline-none"
                />
              </div>
            </div>
          </div>

          {/* GRID DE DUPLICATAS (Estilo Delphi Modernizado) */}
          <div className="flex-1 flex flex-col border border-gray-300 rounded-lg overflow-hidden bg-white min-h-[150px]">
            {/* Header Grid */}
            <div className="bg-stone-200 px-4 py-2 grid grid-cols-12 gap-2 text-[10px] font-bold text-gray-600 uppercase tracking-wider border-b border-gray-300">
              <div className="col-span-1">#</div>
              <div className="col-span-3">Vencimento</div>
              <div className="col-span-4">Forma Pagamento</div>
              <div className="col-span-2 text-right">Juros/Desc</div>
              <div className="col-span-2 text-right">Valor</div>
            </div>

            {/* Body Grid Scrollable */}
            <div className="overflow-y-auto flex-1 p-0">
              {parcelasGeradas.length > 0 ? parcelasGeradas.map((p, idx) => (
                <div key={idx} className={`grid grid-cols-12 gap-2 px-4 py-2 border-b border-gray-100 text-xs items-center ${p.tipo === 'ENTRADA' ? 'bg-green-50' : 'even:bg-stone-50'}`}>
                  <div className="col-span-1 font-bold text-gray-500">{p.numero}</div>
                  <div className="col-span-3 font-medium text-gray-700">{p.vencimento}</div>
                  <div className="col-span-4 text-gray-600">{p.formaPagamento} {p.tipo === 'ENTRADA' ? '(ENTRADA)' : ''}</div>
                  <div className="col-span-2 text-right text-gray-400">-</div>
                  <div className={`col-span-2 text-right font-bold ${p.tipo === 'ENTRADA' ? 'text-green-700' : 'text-gray-800'}`}>
                    {formatCurrency(p.valor)}
                  </div>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300">
                  <span>Nenhuma parcela gerada</span>
                </div>
              )}
            </div>

            {/* Footer Grid (Totalizador) */}
            <div className="bg-amber-50 px-4 py-2 border-t border-amber-200 flex justify-between items-center">
              <span className="text-xs font-bold text-amber-700 uppercase">Total Gerado</span>
              <span className="text-sm font-black text-amber-800">
                {formatCurrency(parcelasGeradas.reduce((acc, p) => acc + p.valor, 0))}
              </span>
            </div>
          </div>

        </div>

        {/* --- FOOTER --- */}
        <div className="bg-stone-100 px-6 py-4 border-t border-gray-300 flex justify-between items-center shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition font-bold uppercase text-xs group"
          >
            <span className="bg-white border border-gray-300 px-2 py-1 rounded group-hover:border-red-300 group-hover:bg-red-50 transition">ESC</span> Sair
          </button>

          <button
            onClick={handleSave}
            className="bg-gradient-to-b from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-lg shadow-md font-bold uppercase text-sm flex items-center gap-2 transition transform active:scale-95 border-b-4 border-green-800"
          >
            <i className="fas fa-check"></i>
            Confirmar (F5)
          </button>
        </div>

      </div>
    </div>
  );
}