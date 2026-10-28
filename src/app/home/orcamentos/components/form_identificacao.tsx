"use client";

import { ClienteModel } from "@/app/models/cliente_model";
import { FornecedorModel } from "@/app/models/fornecedor_model";
import {
  User,
  Search,
  Building2,
  Calendar,
  FileCheck,
  Receipt,
  UserCheck,
  X,
  Phone,
  MapPin,
  CreditCard,
} from "lucide-react";

interface FormIdentificacaoProps {
  cliente: ClienteModel;
  onOpenPesquisaCliente: () => void;
  parceiro: FornecedorModel;
  onOpenPesquisaFornecedor: () => void;
  onClearParceiro: () => void;
  dataAbertura: Date;
  setDataAbertura: (d: Date) => void;
  statusOrdem: string;
  setStatusOrdem: (s: string) => void;
  listaStatus: string[];
  nfs: string;
  setNfs: (n: string) => void;
  codFatura: number;
  nomeFuncionario: string;
}

export default function FormIdentificacao({
  cliente,
  onOpenPesquisaCliente,
  parceiro,
  onOpenPesquisaFornecedor,
  onClearParceiro,
  dataAbertura,
  setDataAbertura,
  statusOrdem,
  setStatusOrdem,
  listaStatus,
  nfs,
  setNfs,
  codFatura,
  nomeFuncionario,
}: FormIdentificacaoProps) {
  // Converte Date para string no formato YYYY-MM-DD para input date
  const formatInputDate = (d: Date) => {
    try {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  const handleDateChange = (val: string) => {
    if (!val) return;
    const parts = val.split("-");
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      setDataAbertura(d);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Linha 1: Cliente & Parceiro perfeitamente alinhados */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Cliente (7 colunas no Desktop) */}
        <div className="lg:col-span-7 flex flex-col">
          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase mb-1.5 h-5">
            <User className="w-4 h-4 text-amber-500" />
            <span>Cliente</span>
            <span className="text-amber-500 font-bold ml-0.5">*</span>
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              readOnly
              value={cliente?.NOME ? `${cliente.CODIGO} - ${cliente.NOME}` : "CONSUMIDOR"}
              className="w-full h-10 px-3 text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-300 rounded-md outline-none uppercase cursor-pointer"
              onClick={onOpenPesquisaCliente}
            />
            <button
              type="button"
              onClick={onOpenPesquisaCliente}
              className="h-10 px-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md flex items-center justify-center transition"
              title="Pesquisar Cliente"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Badges com dados do cliente se selecionado */}
          <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-600 min-h-[22px]">
            {cliente?.CPF_CNPJ && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded border border-gray-200 font-medium">
                <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                {cliente.CPF_CNPJ}
              </span>
            )}
            {cliente?.FONE && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded border border-gray-200 font-medium">
                <Phone className="w-3.5 h-3.5 text-gray-500" />
                {cliente.FONE}
              </span>
            )}
            {cliente?.ENDERECO && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded border border-gray-200 font-medium truncate max-w-sm">
                <MapPin className="w-3.5 h-3.5 text-gray-500" />
                {cliente.ENDERECO}
                {cliente.NUMERO ? `, ${cliente.NUMERO}` : ""}
                {cliente.BAIRRO ? ` - ${cliente.BAIRRO}` : ""}
              </span>
            )}
          </div>
        </div>

        {/* Parceiro / Fornecedor (5 colunas no Desktop) */}
        <div className="lg:col-span-5 flex flex-col">
          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase mb-1.5 h-5">
            <Building2 className="w-4 h-4 text-amber-500" />
            <span>Parceiro / Fornecedor</span>
            <span className="text-xs font-normal text-gray-400 lowercase">(opcional)</span>
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              readOnly
              value={parceiro?.CODIGO ? `${parceiro.CODIGO} - ${parceiro.NOME}` : "Nenhum parceiro vinculado"}
              placeholder="Nenhum parceiro vinculado"
              className="w-full h-10 px-3 text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-300 rounded-md outline-none uppercase cursor-pointer"
              onClick={onOpenPesquisaFornecedor}
            />
            {parceiro?.CODIGO ? (
              <button
                type="button"
                onClick={onClearParceiro}
                className="h-10 px-3 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-300 rounded-md flex items-center justify-center transition"
                title="Remover Parceiro"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={onOpenPesquisaFornecedor}
              className="h-10 px-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md flex items-center justify-center transition"
              title="Pesquisar Parceiro"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Linha 2: Metadados (Data, Status, NF, Fatura, Atendente) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-gray-200">
        <div>
          <label className="flex items-center gap-1 text-xs font-bold text-gray-700 uppercase mb-1">
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            <span>Data Abertura</span>
          </label>
          <input
            type="date"
            value={formatInputDate(dataAbertura)}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full h-10 px-3 text-sm font-medium text-gray-800 border border-gray-300 rounded-md focus:border-amber-500 outline-none bg-white"
          />
        </div>

        <div>
          <label className="flex items-center gap-1 text-xs font-bold text-gray-700 uppercase mb-1">
            <FileCheck className="w-3.5 h-3.5 text-gray-500" />
            <span>Status da OS</span>
            <span className="text-amber-500 font-bold ml-0.5">*</span>
          </label>
          <select
            value={statusOrdem}
            onChange={(e) => setStatusOrdem(e.target.value.toUpperCase())}
            className="w-full h-10 px-3 text-sm font-semibold text-gray-800 border border-gray-300 rounded-md focus:border-amber-500 outline-none uppercase bg-white cursor-pointer"
          >
            {listaStatus.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-1 text-xs font-bold text-gray-700 uppercase mb-1">
            <Receipt className="w-3.5 h-3.5 text-gray-500" />
            <span>NF Serviço</span>
          </label>
          <input
            type="text"
            value={nfs}
            onChange={(e) => setNfs(e.target.value.toUpperCase())}
            placeholder="Nº DA NF"
            className="w-full h-10 px-3 text-sm font-medium text-gray-800 border border-gray-300 rounded-md focus:border-amber-500 outline-none uppercase"
          />
        </div>

        <div>
          <label className="flex items-center gap-1 text-xs font-bold text-gray-700 uppercase mb-1">
            <Receipt className="w-3.5 h-3.5 text-gray-500" />
            <span>Fatura Vinculada</span>
          </label>
          <input
            type="text"
            readOnly
            value={codFatura > 0 ? `#${codFatura}` : "Não faturado"}
            className={`w-full h-10 px-3 text-sm font-bold border rounded-md outline-none ${
              codFatura > 0
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : "bg-gray-50 text-gray-400 border-gray-200"
            }`}
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="flex items-center gap-1 text-xs font-bold text-gray-700 uppercase mb-1">
            <UserCheck className="w-3.5 h-3.5 text-gray-500" />
            <span>Atendente / Resp.</span>
          </label>
          <input
            type="text"
            readOnly
            value={nomeFuncionario || "NÃO INFORMADO"}
            className="w-full h-10 px-3 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md outline-none uppercase truncate"
          />
        </div>
      </div>
    </div>
  );
}
