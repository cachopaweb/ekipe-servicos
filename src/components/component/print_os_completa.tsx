"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useReactToPrint } from "react-to-print";
import StorageService from "@/app/services/storage_service";

import logo from "../../../assets/logo.png";
import {
  converterDataFormato,
  formatCurrency,
  getFileName,
  parseDataCalendario,
  toastMixin,
} from "@/app/functions/utils";
import OrdemModel from "@/app/models/ordem_model";
import OrdEstModel from "@/app/models/ord_est_model";
import OrdSerModel from "@/app/models/ord_ser_model";
import EmpreitadasModel from "@/app/models/empreitadas_model";
import EmpreitadasServicosModel from "@/app/models/empreitada_servicos_model";
import RecebimentosModel from "@/app/models/recebimentos_model";
import EmpresaModel from "@/app/models/empresa_model";
import ArquivoModel from "@/app/models/arquivo_model";
import { FuncionarioModel } from "@/app/models/usuario_model";

import OrdemRepository from "@/app/repositories/ordem_repository";
import EmpreitadasRepository from "@/app/repositories/empreitadas_repository";
import RecebimentosRepository from "@/app/repositories/recebimentos_repository";
import EmpresaRepository from "@/app/repositories/empresa_repository";
import ArquivoRepository from "@/app/repositories/arquivo_repository";
import UsuarioRepository from "@/app/repositories/usuario_repository";

import {
  Printer,
  FileText,
  CheckCircle,
  Clock,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  FileCheck,
  Package,
  Wrench,
  DollarSign,
  Image as ImageIcon,
  File as FileIcon,
  X,
  Download,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

interface PrintOSCompletaProps {
  codigoOrdem: number;
  onClose?: () => void;
}

interface EmpreitadaComServicos extends EmpreitadasModel {
  servicos: EmpreitadasServicosModel[];
}

interface ArquivoComUrl extends ArquivoModel {
  url?: string | null;
  isImage: boolean;
  isPdf: boolean;
  isText: boolean;
  extensao: string;
  pdfPages?: string[];
  textContent?: string;
}

const EXTENSOES_IMAGEM = ["jpg", "jpeg", "png", "webp", "jfif", "gif", "bmp"];
const EXTENSOES_TEXTO = ["txt", "csv"];

let pdfJsLoadPromise: Promise<any> | null = null;

function loadPdfJs(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  const win = window as any;
  if (win.pdfjsLib) return Promise.resolve(win.pdfjsLib);
  if (pdfJsLoadPromise) return pdfJsLoadPromise;

  pdfJsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;
    script.onload = () => {
      if (win.pdfjsLib) {
        win.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(win.pdfjsLib);
      } else {
        reject(new Error("pdfjsLib não disponível"));
      }
    };
    script.onerror = () => reject(new Error("Falha ao carregar pdf.js"));
    document.head.appendChild(script);
  });

  return pdfJsLoadPromise;
}

async function renderPdfBlobToImages(blob: Blob): Promise<string[]> {
  try {
    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await blob.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = Math.min(pdf.numPages || 0, 20);
    const pages: string[] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.75 });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      pages.push(canvas.toDataURL("image/jpeg", 0.92));
    }

    return pages;
  } catch (err) {
    console.warn("Aviso ao converter páginas do PDF anexo para imagem:", err);
    return [];
  }
}

export default function PrintOSCompleta({ codigoOrdem, onClose }: PrintOSCompletaProps) {
  const componentRef = useRef<HTMLDivElement>(null);

  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  const [ordem, setOrdem] = useState<OrdemModel | null>(null);
  const [produtos, setProdutos] = useState<OrdEstModel[]>([]);
  const [servicos, setServicos] = useState<OrdSerModel[]>([]);
  const [empreitadas, setEmpreitadas] = useState<EmpreitadaComServicos[]>([]);
  const [recebimentos, setRecebimentos] = useState<RecebimentosModel[]>([]);
  const [empresa, setEmpresa] = useState<EmpresaModel | null>(null);
  const [funcionario, setFuncionario] = useState<FuncionarioModel | null>(null);
  const [anexos, setAnexos] = useState<ArquivoComUrl[]>([]);
  const [totalPago, setTotalPago] = useState<number>(0);

  // Hook react-to-print para disparo nativo do diálogo de impressão do navegador
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Ordem_de_Servico_${codigoOrdem}`,
  });

  useEffect(() => {
    if (codigoOrdem && codigoOrdem > 0) {
      carregaDadosCompletos(codigoOrdem);
    } else {
      setErro("Código de Ordem de Serviço inválido.");
      setCarregando(false);
    }
  }, [codigoOrdem]);

  const carregaDadosCompletos = async (codigo: number) => {
    setCarregando(true);
    setErro(null);

    try {
      const repOrdem = new OrdemRepository();
      const repEmpreitada = new EmpreitadasRepository();
      const repEmpresa = new EmpresaRepository();
      const repRecebimentos = new RecebimentosRepository();
      const repUsuario = new UsuarioRepository();

      // 1. Carrega dados principais da OS, produtos e serviços em paralelo
      const [ordemData, prodsData, servsData, dadosEmpresa, totalPagoVal] =
        await Promise.all([
          repOrdem.buscaOrdem(codigo),
          repOrdem.buscaProdutosOrdem(codigo),
          repOrdem.buscaServicosOrdem(codigo),
          repEmpresa.getDadosEmpresa(),
          repOrdem.buscaTotalPagoOS(codigo).catch(() => 0),
        ]);

      setOrdem(ordemData);
      setProdutos(prodsData || []);
      setServicos(servsData || []);
      setEmpresa(dadosEmpresa);
      setTotalPago(Number(totalPagoVal || 0));

      // 2. Carrega empreitadas e seus respectivos serviços
      try {
        const empList = await repEmpreitada.buscaEmpreitadas(codigo);
        const empComServicos: EmpreitadaComServicos[] = await Promise.all(
          empList.map(async (emp) => {
            const servicosEmp = await repEmpreitada.buscaServicosEmpreitadas(emp.EMP_CODIGO);
            return {
              ...emp,
              servicos: servicosEmp || [],
            };
          })
        );
        setEmpreitadas(empComServicos);
      } catch (errEmp) {
        console.warn("Aviso ao carregar empreitadas:", errEmp);
        setEmpreitadas([]);
      }

      // 3. Se OS faturada, carrega faturas / recebimentos
      const codFat = Number(ordemData.ORD_FAT || 0);
      if (codFat > 0) {
        try {
          const recList = await repRecebimentos.getRecebimentosByFatura(codFat);
          setRecebimentos(recList || []);
        } catch (errRec) {
          console.warn("Aviso ao carregar recebimentos:", errRec);
          setRecebimentos([]);
        }
      }

      // 4. Carrega dados do funcionário responsável
      if (ordemData.ORD_FUN && ordemData.ORD_FUN > 0) {
        try {
          const func = await repUsuario.getFuncionario(ordemData.ORD_FUN);
          setFuncionario(func);
        } catch (errFunc) {
          console.warn("Aviso ao carregar funcionário:", errFunc);
        }
      }

      // 5. Carrega anexos e prepara renderização visual completa (imagens, PDFs e textos)
      try {
        const arqs = await ArquivoRepository.getArquivoRepository(codigo);

        const anexosProcessados: ArquivoComUrl[] = await Promise.all(
          arqs.map(async (arq) => {
            const ext = (arq.AO_CAMINHO.split(".").pop() || "").toLowerCase();
            const isImg = EXTENSOES_IMAGEM.includes(ext);
            const isPdf = ext === "pdf";
            const isText = EXTENSOES_TEXTO.includes(ext);
            let url: string | null = null;
            let pdfPages: string[] = [];
            let textContent: string | undefined = undefined;

            const isLegacyLocal =
              arq.AO_CAMINHO.startsWith("\\\\") ||
              /^[a-zA-Z]:\\/.test(arq.AO_CAMINHO);

            if (!isLegacyLocal) {
              if (arq.AO_CAMINHO.startsWith("http")) {
                url = arq.AO_CAMINHO;
                if (isPdf) {
                  try {
                    const resp = await fetch(url);
                    if (resp.ok) {
                      const blob = await resp.blob();
                      pdfPages = await renderPdfBlobToImages(blob);
                    }
                  } catch {
                    // Fallback para link/iframe
                  }
                }
              } else {
                try {
                  const res = await StorageService.getUrlAnexoOS(arq.AO_CAMINHO, false);
                  url = res.url;
                } catch {
                  url = null;
                }

                if (isPdf || isText) {
                  try {
                    const blob = await StorageService.getBlobAnexoOS(arq.AO_CAMINHO);
                    if (isPdf) {
                      pdfPages = await renderPdfBlobToImages(blob);
                    } else if (isText) {
                      textContent = await blob.text();
                    }
                  } catch (errBlob) {
                    console.warn("Aviso ao ler binário do anexo para visualização:", errBlob);
                  }
                }
              }
            }

            return {
              ...arq,
              url,
              isImage: isImg,
              isPdf,
              isText,
              extensao: ext,
              pdfPages,
              textContent,
            };
          })
        );

        setAnexos(anexosProcessados);
      } catch (errArqs) {
        console.warn("Aviso ao carregar anexos:", errArqs);
        setAnexos([]);
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados da OS completa:", err);
      setErro(err?.message || "Falha ao carregar dados da Ordem de Serviço.");
    } finally {
      setCarregando(false);
    }
  };

  // Cálculos financeiros
  const subtotalServicos = servicos.reduce((acc, s) => acc + (Number(s.OS_VALOR) || 0), 0);
  const subtotalProdutos = produtos.reduce((acc, p) => acc + (Number(p.ORE_VALOR) || 0), 0);
  const subtotalEmpreitadas = empreitadas.reduce((acc, e) => acc + (Number(e.EMP_VALOR) || 0), 0);
  const totalPagoEmpreitadas = empreitadas.reduce((acc, e) => acc + (Number(e.VALOR_RECEBIDO) || 0), 0);
  const saldoEmpreitadas = Math.max(0, subtotalEmpreitadas - totalPagoEmpreitadas);

  const valorDesconto = Number(ordem?.ORD_VALOR_DESCONTO || 0);
  const somaBruta = subtotalServicos + subtotalProdutos;
  const percDesconto =
    ordem?.ORD_PORCENTAGEM_DESCONTO && ordem.ORD_PORCENTAGEM_DESCONTO > 0
      ? ordem.ORD_PORCENTAGEM_DESCONTO
      : somaBruta > 0 && valorDesconto > 0
      ? (valorDesconto / somaBruta) * 100
      : 0;

  const totalGeralOS =
    ordem?.ORD_VALOR && ordem.ORD_VALOR > 0
      ? Number(ordem.ORD_VALOR)
      : Math.max(0, somaBruta - valorDesconto);

  const saldoPagar = totalGeralOS - totalPago;
  const isFaturada = Number(ordem?.ORD_FAT || 0) > 0;

  // Separação de anexos
  const imagensAnexadas = anexos.filter((a) => a.isImage);
  const pdfsAnexados = anexos.filter((a) => a.isPdf);
  const textosAnexados = anexos.filter((a) => a.isText && Boolean(a.textContent));
  const documentosAnexados = anexos.filter((a) => !a.isImage);

  // Dados padronizados da Empresa
  const empNome = empresa?.EMP_RAZAO_SOCIAL || "EKIPE SERVIÇOS LTDA";
  const empFantasia = empresa?.EMP_FANTASIA || "EKIPE SERVIÇOS";
  const empCnpj = empresa?.EMP_CNPJ || "07.167.610/0001-23";
  const empIe = empresa?.EMP_INSCEST || "283342927";
  const empEndereco = `${empresa?.EMP_LOGRADOURO || "RUA PRESIDENTE DUTRA"}, ${
    empresa?.EMP_NUMERO || "1413"
  } - ${empresa?.EMP_BAIRRO || "CENTRO"}`;
  const empCidadeUf = `${empresa?.EMP_MUNICIPIO || "FÁTIMA DO SUL"} - ${
    empresa?.EMP_UF || "MS"
  }, CEP: ${empresa?.EMP_CEP || "79700-000"}`;
  const empFone = empresa?.EMP_FONE
    ? `(67) ${empresa.EMP_FONE}`
    : "(67) 3467-2074 / (67) 99618-6021";
  const empEmail = empresa?.EMP_EMAIL || "fatsul@ekipeservicos.com.br";

  const dataAbertura = ordem?.ORD_DATA ? converterDataFormato(ordem.ORD_DATA) : "--/--/----";
  const isDataConclusaoValida = (() => {
    if (!ordem?.ORD_DATAC) return false;
    const raw = String(ordem.ORD_DATAC).trim();
    if (!raw || raw.includes("1900") || raw.includes("1899")) return false;
    const d = parseDataCalendario(raw);
    return !isNaN(d.getTime()) && d.getFullYear() > 1900;
  })();
  const dataFaturamento = isDataConclusaoValida
    ? converterDataFormato(ordem!.ORD_DATAC)
    : isFaturada
    ? dataAbertura
    : "Em Aberto";

  const handleDownloadAnexo = async (item: ArquivoComUrl) => {
    if (!item.url) {
      toastMixin.fire({
        title: "Arquivo Local / Legado",
        text: `O arquivo "${getFileName(item.AO_CAMINHO)}" está armazenado na rede local (${item.AO_CAMINHO}).`,
        icon: "info",
      });
      return;
    }
    const originalName = getFileName(item.AO_CAMINHO);
    try {
      let blob: Blob;
      if (!item.AO_CAMINHO.startsWith("http")) {
        blob = await StorageService.getBlobAnexoOS(item.AO_CAMINHO);
      } else {
        const resp = await fetch(item.url);
        blob = await resp.blob();
      }
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(item.url, "_blank", "noopener,noreferrer");
    }
  };

  const handleBaixarTodosAnexos = async () => {
    const disponiveis = anexos.filter((a) => Boolean(a.url));
    if (disponiveis.length === 0) {
      toastMixin.fire({
        title: "Atenção",
        text: "Não há anexos em nuvem disponíveis para download direto.",
        icon: "info",
      });
      return;
    }
    for (const item of disponiveis) {
      await handleDownloadAnexo(item);
    }
  };

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold text-gray-800">
          Carregando relatório completo da OS #{codigoOrdem}...
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Buscando serviços, produtos, empreitadas, faturamento e anexos fotográficos.
        </p>
      </div>
    );
  }

  if (erro || !ordem) {
    return (
      <div className="p-8 bg-white rounded-xl text-center flex flex-col items-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-lg font-bold text-gray-800">Não foi possível gerar o PDF</h2>
        <p className="text-sm text-gray-600 mt-1 max-w-md">{erro || "Ordem não encontrada."}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 text-xs font-bold text-white bg-gray-800 rounded-lg hover:bg-gray-900 transition"
          >
            Fechar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de Ações Superior (Não visível na impressão) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-200 p-3.5 rounded-xl shadow-sm print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-brand/10 text-brand rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-gray-900">
                Visualização do PDF Completo • OS #{ordem.ORD_CODIGO}
              </span>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  isFaturada
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-amber-100 text-amber-800 border border-amber-300"
                }`}
              >
                {isFaturada ? `Faturado #${ordem.ORD_FAT}` : ordem.ORD_ESTADO || "ABERTO"}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Documento oficial contendo as 6 seções integradas, galeria fotográfica e assinaturas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {anexos.some((a) => Boolean(a.url)) && (
            <button
              type="button"
              onClick={handleBaixarTodosAnexos}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 active:scale-95 rounded-lg transition"
              title="Baixar arquivos originais anexados a esta OS"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Anexos ({anexos.filter((a) => Boolean(a.url)).length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand hover:bg-brand-hover active:scale-95 rounded-lg shadow-sm transition"
            title="Imprimir ou Salvar como PDF via navegador"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Salvar PDF</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              <X className="w-4 h-4" />
              <span>Fechar</span>
            </button>
          )}
        </div>
      </div>

      {/* CONTAINER DO DOCUMENTO PARA IMPRESSÃO (A4) */}
      <div
        ref={componentRef}
        className="w-full max-w-[210mm] mx-auto bg-white p-6 md:p-8 text-black border border-gray-300 shadow-lg rounded-sm print:p-0 print:m-0 print:border-none print:shadow-none print:w-full print:max-w-none"
        style={{
          fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          color: "#111827",
        }}
      >
        {/* ESTILOS DE IMPRESSÃO EMBUTIDOS PARA PRECISÃO MÁXIMA DE PAGINAÇÃO (A26) */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 10mm 10mm 12mm 10mm;
              }
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                background: #ffffff !important;
                color: #000000 !important;
              }
              .print-avoid-break {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
              .print-header-repeat {
                display: table-header-group;
              }
              .print-footer-fixed {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
              }
            }
          `
        }} />

        {/* ============================================================== */}
        {/* SEÇÃO 1: CABEÇALHO INSTITUCIONAL E IDENTIFICAÇÃO COMPLETA */}
        {/* ============================================================== */}
        <div className="border-b-2 border-gray-800 pb-3 mb-4 print-avoid-break">
          <div className="flex items-start justify-between gap-4">
            {/* Logotipo e Dados da Empresa */}
            <div className="flex items-start gap-3 flex-1">
              <div className="relative w-28 h-14 shrink-0">
                <Image
                  src={logo}
                  alt={empFantasia}
                  fill
                  sizes="120px"
                  style={{ objectFit: "contain" }}
                  priority
                />
              </div>
              <div className="text-[11px] leading-tight text-gray-700">
                <h1 className="text-sm font-black uppercase text-gray-900 tracking-tight">
                  {empNome}
                </h1>
                <p className="font-semibold text-gray-800">{empFantasia}</p>
                <p>
                  <strong>CNPJ:</strong> {empCnpj} • <strong>IE:</strong> {empIe}
                </p>
                <p>
                  {empEndereco} • {empCidadeUf}
                </p>
                <p>
                  <strong>Fone:</strong> {empFone} • <strong>E-mail:</strong> {empEmail}
                </p>
              </div>
            </div>

            {/* Quadro Resumo OS / Fatura */}
            <div className="w-56 border border-gray-800 rounded p-2 text-right shrink-0 bg-gray-50/50 print:bg-transparent">
              <div className="text-xs font-black text-gray-900 uppercase">
                ORDEM DE SERVIÇO
              </div>
              <div className="text-xl font-black text-brand print:text-black">
                #{ordem.ORD_CODIGO}
              </div>
              <div className="text-[10px] text-gray-600 mt-1 leading-snug">
                <div>
                  <strong>Status:</strong>{" "}
                  <span className="uppercase font-bold">{ordem.ORD_ESTADO || "ABERTO"}</span>
                </div>
                <div>
                  <strong>Fatura:</strong>{" "}
                  {isFaturada ? `#${ordem.ORD_FAT}` : "Não faturado"}
                </div>
                <div>
                  <strong>Data Abertura:</strong> {dataAbertura}
                </div>
                <div>
                  <strong>Data Conclusão:</strong> {dataFaturamento}
                </div>
              </div>
            </div>
          </div>

          {/* Dados do Cliente e Responsável Técnico */}
          <div className="mt-3 pt-2 border-t border-gray-800">
            <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-1.5">
              1. Identificação da Ordem de Serviço e do Cliente
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px] leading-snug">
            <div className="col-span-2">
              <span className="font-bold text-gray-900 uppercase block text-[10px]">
                Cliente / Contratante:
              </span>
              <p className="font-bold text-xs text-gray-900">{ordem.CLI_NOME}</p>
              <p className="text-gray-700">
                <strong>CPF/CNPJ:</strong> {ordem.CLI_CNPJ_CPF || "Não informado"}
              </p>
              <p className="text-gray-700">
                <strong>Endereço:</strong> {ordem.CLI_ENDERECO || ""},{" "}
                {ordem.CLI_NUMERO || "S/N"} - {ordem.CLI_BAIRRO || ""} (
                {ordem.CID_NOME || ""}/{ordem.CID_UF || ""})
              </p>
              <p className="text-gray-700">
                <strong>Telefone(s):</strong> {ordem.CLI_FONE || "Não informado"}{" "}
                {ordem.CLI_CELULAR ? `• Cel: ${ordem.CLI_CELULAR}` : ""}
                {ordem.CLI_EMAIL ? ` • Email: ${ordem.CLI_EMAIL}` : ""}
              </p>
            </div>

            <div className="border-l border-gray-300 pl-3">
              <span className="font-bold text-gray-900 uppercase block text-[10px]">
                Responsável Técnico / Emissor:
              </span>
              <p className="font-bold text-xs text-gray-900">
                {ordem.FUN_NOME || "Não informado"}
              </p>
              {funcionario?.FUN_EMAIL && (
                <p className="text-gray-700 text-[10px]">
                  <strong>Email:</strong> {funcionario.FUN_EMAIL}
                </p>
              )}
              {funcionario?.FUN_FONE && (
                <p className="text-gray-700 text-[10px]">
                  <strong>Fone:</strong> {funcionario.FUN_FONE}
                </p>
              )}
              {ordem.ORD_NFS && (
                <p className="text-gray-700 text-[10px] mt-1">
                  <strong>NF-e / NFS-e:</strong> {ordem.ORD_NFS}
                </p>
              )}
            </div>
          </div>

          {/* Solicitação Inicial / Problema Relatado */}
          {ordem.ORD_SOLICITACAO && (
            <div className="mt-2.5 p-2 bg-gray-50 border border-gray-200 rounded text-[11px] print:bg-transparent">
              <strong className="text-gray-900 uppercase text-[10px] block">
                Solicitação Inicial do Cliente / Escopo Declarado:
              </strong>
              <p className="text-gray-800 whitespace-pre-line mt-0.5">
                {ordem.ORD_SOLICITACAO}
              </p>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* SEÇÃO 2: SERVIÇOS EXECUTADOS E EMPREITADAS VINCULADAS */}
        {/* ============================================================== */}
        <div className="mb-4 print-avoid-break">
          <div className="flex items-center justify-between border-b border-gray-800 pb-1 mb-1.5">
            <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>2. Serviços Executados</span>
            </h2>
            <span className="text-[10px] font-bold text-gray-600">
              Subtotal: {formatCurrency(subtotalServicos)}
            </span>
          </div>

          {servicos.length === 0 ? (
            <p className="text-[11px] text-gray-500 italic py-1">
              Nenhum serviço avulso lançado diretamente nesta OS.
            </p>
          ) : (
            <table className="w-full text-[11px] border-collapse mb-2">
              <thead>
                <tr className="border-b border-gray-400 bg-gray-100 text-gray-800 text-left print:bg-gray-100">
                  <th className="py-1 px-1.5 font-bold w-10 text-center">Item</th>
                  <th className="py-1 px-1.5 font-bold">Descrição do Serviço</th>
                  <th className="py-1 px-1.5 font-bold w-14 text-center">UND</th>
                  <th className="py-1 px-1.5 font-bold w-16 text-right">Qtd</th>
                  <th className="py-1 px-1.5 font-bold w-24 text-right">Vlr. Unitário</th>
                  <th className="py-1 px-1.5 font-bold w-24 text-right">Vlr. Total</th>
                </tr>
              </thead>
              <tbody>
                {servicos.map((item, idx) => {
                  const qtd = Number(item.OS_QUANTIDADE) || 1;
                  const valor = Number(item.OS_VALOR) || 0;
                  const vlrUnit = qtd > 0 ? valor / qtd : valor;
                  return (
                    <tr
                      key={item.OS_CODIGO || idx}
                      className="border-b border-gray-200 hover:bg-gray-50 print-avoid-break"
                    >
                      <td className="py-1 px-1.5 text-center text-gray-500">{idx + 1}</td>
                      <td className="py-1 px-1.5 font-medium text-gray-900">{item.OS_NOME}</td>
                      <td className="py-1 px-1.5 text-center text-gray-600">
                        {item.OS_UNIDADE_MED || "UN"}
                      </td>
                      <td className="py-1 px-1.5 text-right font-medium">{qtd}</td>
                      <td className="py-1 px-1.5 text-right">{formatCurrency(vlrUnit)}</td>
                      <td className="py-1 px-1.5 text-right font-bold text-gray-900">
                        {formatCurrency(valor)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Empreitadas Vinculadas */}
          {empreitadas.length > 0 && (
            <div className="mt-3 pt-2 border-t border-dashed border-gray-300 print-avoid-break">
              <div className="flex items-center justify-between pb-1 mb-1.5">
                <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-wide">
                  Empreitadas e Serviços Terceirizados Vinculados ({empreitadas.length})
                </h3>
                <span className="text-[10px] font-bold text-gray-600">
                  Subtotal: {formatCurrency(subtotalEmpreitadas)}
                </span>
              </div>

              <div className="space-y-2">
                {empreitadas.map((emp, empIdx) => (
                  <div
                    key={emp.EMP_CODIGO || empIdx}
                    className="border border-gray-300 rounded p-2 text-[10px] bg-gray-50/40 print:bg-transparent print-avoid-break"
                  >
                    <div className="flex items-center justify-between font-bold text-gray-900 border-b border-gray-200 pb-1 mb-1">
                      <span>
                        Empreitada #{emp.EMP_CODIGO} • Prestador:{" "}
                        <span className="uppercase">{emp.FOR_NOME || "Não informado"}</span>
                      </span>
                      <span className="text-xs font-black">
                        {formatCurrency(emp.EMP_VALOR || 0)}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-gray-600 mb-1">
                      <div>
                        <strong>Coordenador:</strong> {emp.EMP_COORDENADOR || "--"}
                      </div>
                      <div>
                        <strong>Local:</strong> {emp.EMP_LOCAL_EXECUCAO_SERVICOS || "--"}
                      </div>
                      <div>
                        <strong>NF / Pedido:</strong> {emp.EMP_NFS || emp.EMP_PEDIDO || "--"}
                      </div>
                      <div>
                        <strong>Data Emissão:</strong>{" "}
                        {emp.EMP_DATA_EMISSAO ? converterDataFormato(emp.EMP_DATA_EMISSAO) : "--"}
                      </div>
                    </div>

                    {emp.servicos && emp.servicos.length > 0 && (
                      <table className="w-full text-[10px] border-collapse mt-1">
                        <thead>
                          <tr className="border-b border-gray-200 text-gray-700 text-left bg-gray-100">
                            <th className="py-0.5 px-1 font-bold">Serviço da Empreitada</th>
                            <th className="py-0.5 px-1 font-bold w-12 text-center">UND</th>
                            <th className="py-0.5 px-1 font-bold w-12 text-right">Qtd</th>
                            <th className="py-0.5 px-1 font-bold w-20 text-right">Vlr. Unit.</th>
                            <th className="py-0.5 px-1 font-bold w-20 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {emp.servicos.map((es, esIdx) => {
                            const qtd = Number(es.ES_QUANTIDADE) || 1;
                            const vlr = Number(es.ES_VALOR) || 0;
                            const vlrUnit = qtd > 0 ? vlr / qtd : vlr;
                            return (
                              <tr key={es.ES_CODIGO || esIdx} className="border-b border-gray-100">
                                <td className="py-0.5 px-1 text-gray-900">{es.DESCRICAO}</td>
                                <td className="py-0.5 px-1 text-center text-gray-600">
                                  {es.ES_UNIDADE || "UN"}
                                </td>
                                <td className="py-0.5 px-1 text-right">{qtd}</td>
                                <td className="py-0.5 px-1 text-right">{formatCurrency(vlrUnit)}</td>
                                <td className="py-0.5 px-1 text-right font-semibold">
                                  {formatCurrency(vlr)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* SEÇÃO 3: PRODUTOS E PEÇAS UTILIZADAS */}
        {/* ============================================================== */}
        <div className="mb-4 print-avoid-break">
          <div className="flex items-center justify-between border-b border-gray-800 pb-1 mb-1.5">
            <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>3. Produtos e Peças Utilizadas</span>
            </h2>
            <span className="text-[10px] font-bold text-gray-600">
              Subtotal: {formatCurrency(subtotalProdutos)}
            </span>
          </div>

          {produtos.length === 0 ? (
            <p className="text-[11px] text-gray-500 italic py-1">
              Nenhum produto ou peça aplicado nesta Ordem de Serviço.
            </p>
          ) : (
            <table className="w-full text-[11px] border-collapse mb-1">
              <thead>
                <tr className="border-b border-gray-400 bg-gray-100 text-gray-800 text-left print:bg-gray-100">
                  <th className="py-1 px-1.5 font-bold w-12 text-center">Cód.</th>
                  <th className="py-1 px-1.5 font-bold">Descrição do Produto / Peça</th>
                  <th className="py-1 px-1.5 font-bold w-16 text-center">Emb./UND</th>
                  <th className="py-1 px-1.5 font-bold w-16 text-right">Qtd</th>
                  <th className="py-1 px-1.5 font-bold w-24 text-right">Vlr. Unitário</th>
                  <th className="py-1 px-1.5 font-bold w-24 text-right">Vlr. Total</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((item, idx) => {
                  const qtd = Number(item.ORE_QUANTIDADE) || 1;
                  const valor = Number(item.ORE_VALOR) || 0;
                  const vlrUnit = qtd > 0 ? valor / qtd : valor;
                  return (
                    <tr
                      key={item.ORE_CODIGO || idx}
                      className="border-b border-gray-200 hover:bg-gray-50 print-avoid-break"
                    >
                      <td className="py-1 px-1.5 text-center text-gray-500 font-mono text-[10px]">
                        {item.ORE_PRO || "--"}
                      </td>
                      <td className="py-1 px-1.5 font-medium text-gray-900">{item.ORE_NOME}</td>
                      <td className="py-1 px-1.5 text-center text-gray-600">
                        {item.ORE_EMBALAGEM || "UN"}
                      </td>
                      <td className="py-1 px-1.5 text-right font-medium">{qtd}</td>
                      <td className="py-1 px-1.5 text-right">{formatCurrency(vlrUnit)}</td>
                      <td className="py-1 px-1.5 text-right font-bold text-gray-900">
                        {formatCurrency(valor)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ============================================================== */}
        {/* SEÇÃO 4: INFORMAÇÕES FINANCEIRAS E FATURAMENTO */}
        {/* ============================================================== */}
        <div className="mb-4 border border-gray-800 rounded p-2.5 bg-gray-50/50 print:bg-transparent print-avoid-break">
          <div className="border-b border-gray-800 pb-1 mb-2">
            <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">
              4. Informações Financeiras e Faturamento
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 text-[11px]">
            {/* Quadro de Totais e Descontos do Cliente */}
            <div className="space-y-1">
              <div className="flex justify-between py-0.5 border-b border-gray-200">
                <span className="text-gray-600">Subtotal de Serviços da OS:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(subtotalServicos)}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-gray-200">
                <span className="text-gray-600">Subtotal de Produtos da OS:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(subtotalProdutos)}</span>
              </div>
              {valorDesconto > 0 && (
                <div className="flex justify-between py-0.5 border-b border-gray-200 text-rose-700">
                  <span>Desconto Concedido {percDesconto > 0 ? `(${percDesconto.toFixed(1)}%)` : ""}:</span>
                  <span className="font-bold">- {formatCurrency(valorDesconto)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-t-2 border-gray-800 text-xs font-black">
                <span className="uppercase text-gray-900">Valor Total Geral da OS:</span>
                <span className="text-brand print:text-black">{formatCurrency(totalGeralOS)}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-gray-200 text-[10px]">
                <span className="text-gray-600">Total Pago (Recebimentos / Faturamento da OS):</span>
                <span className="font-bold text-emerald-800">{formatCurrency(totalPago)}</span>
              </div>
              <div className="flex justify-between py-0.5 text-[10px]">
                <span className="text-gray-600">Saldo a Pagar (Total da OS - Total Pago):</span>
                <span
                  className={`font-black ${
                    saldoPagar <= 0 && totalPago > 0
                      ? "text-emerald-700"
                      : "text-amber-800"
                  }`}
                >
                  {formatCurrency(saldoPagar)}
                </span>
              </div>

              {/* Bloco Separado: Controle de Empreitadas / Terceiros */}
              {subtotalEmpreitadas > 0 && (
                <div className="mt-2 pt-1.5 border-t border-dashed border-gray-300 bg-amber-50/70 p-2 rounded text-[10px] space-y-0.5">
                  <span className="font-bold text-amber-900 uppercase block tracking-wider text-[9px]">
                    Controle de Empreitadas (Custos com Terceiros):
                  </span>
                  <div className="flex justify-between text-gray-700">
                    <span>Total Contratado:</span>
                    <span className="font-semibold">{formatCurrency(subtotalEmpreitadas)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Pago aos Prestadores:</span>
                    <span className="font-semibold text-emerald-700">{formatCurrency(totalPagoEmpreitadas)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Saldo a Pagar aos Prestadores:</span>
                    <span className="font-bold text-amber-900">
                      {saldoEmpreitadas <= 0 ? "QUITADO" : formatCurrency(saldoEmpreitadas)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Condições de Pagamento e Faturas */}
            <div className="border-l border-gray-300 pl-4 flex flex-col justify-between">
              <div>
                <span className="font-bold text-gray-900 uppercase block text-[10px] mb-1">
                  Condições de Faturamento:
                </span>
                {isFaturada ? (
                  <div>
                    <p className="text-[10px] text-gray-700">
                      <strong>Fatura vinculada:</strong> #{ordem.ORD_FAT}
                    </p>
                    {recebimentos.length > 0 ? (
                      <table className="w-full text-[10px] border-collapse mt-1.5">
                        <thead>
                          <tr className="border-b border-gray-300 text-gray-700 text-left bg-gray-100">
                            <th className="py-0.5 px-1 font-bold">Duplicata</th>
                            <th className="py-0.5 px-1 font-bold">Vencimento</th>
                            <th className="py-0.5 px-1 font-bold">Forma</th>
                            <th className="py-0.5 px-1 font-bold text-right">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recebimentos.map((rec, rIdx) => (
                            <tr key={rec.REC_CODIGO || rIdx} className="border-b border-gray-100">
                              <td className="py-0.5 px-1 font-mono font-semibold">
                                {rec.REC_DUPLICATA || `${ordem.ORD_FAT}-${rIdx + 1}`}
                              </td>
                              <td className="py-0.5 px-1">
                                {rec.REC_VENCIMENTO ? converterDataFormato(rec.REC_VENCIMENTO) : "--"}
                              </td>
                              <td className="py-0.5 px-1 text-gray-800">{rec.REC_TIPO || "DINHEIRO"}</td>
                              <td className="py-0.5 px-1 text-right font-bold text-gray-900">
                                {formatCurrency(rec.REC_VALOR || 0)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-[10px] text-gray-500 italic mt-1">
                        Faturado à vista ou parcelas registradas no contas a receber.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[10px] print:bg-transparent print:border-gray-300">
                    <p className="font-bold">Orçamento não faturado</p>
                    <p className="mt-0.5 text-gray-600">
                      Validade da proposta: 10 dias corridos a partir da data de abertura. Forma de
                      pagamento a ser combinada na aprovação do serviço.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SEÇÃO 5: ARQUIVOS E FOTOGRAFIAS ANEXAS (A24) */}
        {/* ============================================================== */}
        <div className="mb-4 print-avoid-break">
          <div className="border-b border-gray-800 pb-1 mb-2">
            <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">
              5. Lista de Arquivos e Fotografias Anexas ({anexos.length})
            </h2>
          </div>

          {anexos.length === 0 ? (
            <p className="text-[11px] text-gray-500 italic py-1">
              Nenhum anexo fotográfico ou documento técnico anexado a esta OS.
            </p>
          ) : (
            <div className="space-y-3">
              {/* Galeria de Fotos */}
              {imagensAnexadas.length > 0 && (
                <div className="print-avoid-break">
                  <span className="text-[10px] font-bold text-gray-700 uppercase block mb-1.5">
                    Galeria Fotográfica da Execução ({imagensAnexadas.length})
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {imagensAnexadas.map((imgItem, idx) => (
                      <div
                        key={imgItem.AO_CODIGO || idx}
                        className="border border-gray-300 rounded p-2 bg-gray-50/50 print:bg-transparent print-avoid-break flex flex-col justify-between"
                      >
                        <div className="relative w-full h-64 bg-white rounded border border-gray-200 overflow-hidden flex items-center justify-center">
                          {imgItem.url ? (
                            /* Usamos img nativo para renderização 100% fiel no iframe do react-to-print */
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={imgItem.url}
                              alt={getFileName(imgItem.AO_CAMINHO)}
                              className="max-h-full max-w-full object-contain mx-auto"
                              loading="eager"
                            />
                          ) : (
                            <div className="text-center p-2 text-gray-400">
                              <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-40" />
                              <span className="text-[9px] block">
                                Imagem arquivada localmente / em nuvem
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="mt-1.5 text-[10px] leading-tight text-gray-700">
                          <p className="font-bold truncate" title={getFileName(imgItem.AO_CAMINHO)}>
                            {getFileName(imgItem.AO_CAMINHO)}
                          </p>
                          {imgItem.AO_OBS && (
                            <p className="text-gray-600 mt-0.5">
                              {imgItem.AO_OBS}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Visualização Integral de Documentos PDF Anexados */}
              {pdfsAnexados.length > 0 && (
                <div className="mt-3 pt-2 border-t border-dashed border-gray-300 space-y-4">
                  <span className="text-[10px] font-bold text-gray-700 uppercase block">
                    Conteúdo dos Documentos PDF Anexados ({pdfsAnexados.length})
                  </span>
                  {pdfsAnexados.map((pdfDoc, pIdx) => (
                    <div
                      key={pdfDoc.AO_CODIGO || pIdx}
                      className="border border-gray-300 rounded p-2.5 bg-gray-50/40 print:bg-transparent space-y-2"
                    >
                      <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
                        <div>
                          <p className="text-[11px] font-bold text-gray-900">
                            {getFileName(pdfDoc.AO_CAMINHO)}
                          </p>
                          {pdfDoc.AO_OBS && (
                            <p className="text-[10px] text-gray-600">{pdfDoc.AO_OBS}</p>
                          )}
                        </div>
                        <span className="text-[9px] font-mono uppercase px-2 py-0.5 bg-gray-200 text-gray-700 rounded">
                          PDF {pdfDoc.pdfPages && pdfDoc.pdfPages.length > 0 ? `• ${pdfDoc.pdfPages.length} pág(s)` : ""}
                        </span>
                      </div>

                      {pdfDoc.pdfPages && pdfDoc.pdfPages.length > 0 ? (
                        <div className="space-y-3">
                          {pdfDoc.pdfPages.map((pageDataUrl, pageIdx) => (
                            <div
                              key={pageIdx}
                              className="bg-white border border-gray-200 rounded p-1 print-avoid-break"
                            >
                              <div className="text-[9px] text-gray-500 text-right mb-1 font-mono">
                                {getFileName(pdfDoc.AO_CAMINHO)} — Página {pageIdx + 1} de {pdfDoc.pdfPages!.length}
                              </div>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={pageDataUrl}
                                alt={`${getFileName(pdfDoc.AO_CAMINHO)} - Página ${pageIdx + 1}`}
                                className="w-full h-auto max-h-[920px] object-contain mx-auto"
                                loading="eager"
                              />
                            </div>
                          ))}
                        </div>
                      ) : pdfDoc.url ? (
                        <div className="w-full h-[500px] border border-gray-200 rounded overflow-hidden print:hidden">
                          <iframe
                            src={pdfDoc.url}
                            title={getFileName(pdfDoc.AO_CAMINHO)}
                            className="w-full h-full"
                          />
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-500 italic">
                          Documento armazenado localmente ({pdfDoc.AO_CAMINHO}).
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Visualização de Arquivos de Texto / CSV Anexados */}
              {textosAnexados.length > 0 && (
                <div className="mt-3 pt-2 border-t border-dashed border-gray-300 space-y-2">
                  <span className="text-[10px] font-bold text-gray-700 uppercase block">
                    Conteúdo de Arquivos de Texto Anexados ({textosAnexados.length})
                  </span>
                  {textosAnexados.map((txtDoc, tIdx) => (
                    <div
                      key={txtDoc.AO_CODIGO || tIdx}
                      className="border border-gray-300 rounded p-2 bg-white print-avoid-break"
                    >
                      <p className="text-[10px] font-bold text-gray-900 border-b border-gray-200 pb-1 mb-1">
                        {getFileName(txtDoc.AO_CAMINHO)} {txtDoc.AO_OBS ? `— ${txtDoc.AO_OBS}` : ""}
                      </p>
                      <pre className="text-[9px] font-mono text-gray-800 whitespace-pre-wrap break-words max-h-96 overflow-y-auto print:max-h-none">
                        {txtDoc.textContent}
                      </pre>
                    </div>
                  ))}
                </div>
              )}

              {/* Relação de Documentos Técnicos e Fiscais */}
              {documentosAnexados.length > 0 && (
                <div className="mt-2 pt-2 border-t border-dashed border-gray-300 print-avoid-break">
                  <span className="text-[10px] font-bold text-gray-700 uppercase block mb-1">
                    Documentos Técnicos, Termos e Laudos Anexos ({documentosAnexados.length})
                  </span>
                  <table className="w-full text-[10px] border-collapse">
                    <thead>
                      <tr className="border-b border-gray-300 bg-gray-100 text-gray-700 text-left">
                        <th className="py-1 px-1.5 font-bold">Nome do Arquivo</th>
                        <th className="py-1 px-1.5 font-bold w-16 text-center">Tipo</th>
                        <th className="py-1 px-1.5 font-bold">Descrição / Observação</th>
                        <th className="py-1 px-1.5 font-bold w-28 text-right print:hidden">Acesso Original</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documentosAnexados.map((doc, dIdx) => (
                        <tr key={doc.AO_CODIGO || dIdx} className="border-b border-gray-100">
                          <td className="py-1 px-1.5 font-medium text-gray-900">
                            {doc.url ? (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:underline text-brand print:text-black font-semibold inline-flex items-center gap-1"
                              >
                                <span>{getFileName(doc.AO_CAMINHO)}</span>
                                <ExternalLink className="w-2.5 h-2.5 print:hidden" />
                              </a>
                            ) : (
                              getFileName(doc.AO_CAMINHO)
                            )}
                          </td>
                          <td className="py-1 px-1.5 text-center font-mono uppercase text-gray-600">
                            {doc.extensao || "DOC"}
                          </td>
                          <td className="py-1 px-1.5 text-gray-700">
                            {doc.AO_OBS || "--"}
                          </td>
                          <td className="py-1 px-1.5 text-right print:hidden">
                            {doc.url ? (
                              <button
                                type="button"
                                onClick={() => handleDownloadAnexo(doc)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition"
                              >
                                <Download className="w-2.5 h-2.5" />
                                <span>Baixar</span>
                              </button>
                            ) : (
                              <span className="text-[9px] text-gray-400">Rede Local</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* SEÇÃO 6: ENCERRAMENTO, TERMO DE ACEITE E ASSINATURAS */}
        {/* ============================================================== */}
        <div className="mt-4 pt-3 border-t-2 border-gray-800 print-avoid-break">
          <div className="border-b border-gray-800 pb-1 mb-2">
            <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">
              6. Encerramento, Observações e Assinaturas
            </h2>
          </div>
          {/* Observações Gerais e Administrativas */}
          {ordem.ORD_OBS && (
            <div className="mb-3 text-[10px] text-gray-800 bg-gray-50 p-2 rounded border border-gray-200 print:bg-transparent">
              <strong className="text-gray-900 uppercase block text-[10px] mb-0.5">
                Observações Gerais:
              </strong>
              <p className="whitespace-pre-line leading-relaxed">{ordem.ORD_OBS}</p>
            </div>
          )}

          {/* Termo Formal de Entrega e Aceite */}
          <div className="mb-4 text-[10px] text-gray-700 leading-relaxed bg-gray-50/70 p-2.5 rounded border border-gray-200 print:bg-transparent print:border-gray-300">
            <strong className="text-gray-900 uppercase block text-[10px] mb-1">
              Termo de Conclusão, Entrega e Aceite dos Serviços:
            </strong>
            <p>
              Declaramos que os serviços, produtos e peças especificados nesta Ordem de Serviço
              foram devidamente executados, conferidos e aceitos em conformidade com os padrões
              técnicos exigidos e acordados entre as partes, encontrando-se em perfeitas condições
              de utilização e funcionamento.
            </p>
          </div>

          {/* Data e Localidade */}
          <div className="text-right text-[11px] text-gray-800 mb-6 font-medium">
            {empresa?.EMP_MUNICIPIO || "Fátima do Sul"} - {empresa?.EMP_UF || "MS"},{" "}
            {new Date().toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
            .
          </div>

          {/* Bloco Duplo de Assinaturas (com quebra protegida) */}
          <div className="grid grid-cols-2 gap-8 pt-4 print-avoid-break">
            {/* Assinatura Empresa */}
            <div className="text-center">
              <div className="border-t border-gray-800 pt-1.5 mx-4">
                <p className="font-bold text-xs uppercase text-gray-900">{empNome}</p>
                <p className="text-[10px] text-gray-600 font-medium">
                  Responsável Técnico: {ordem.FUN_NOME || "EKIPE SERVIÇOS"}
                </p>
                <p className="text-[9px] text-gray-400">CNPJ: {empCnpj}</p>
              </div>
            </div>

            {/* Assinatura Cliente */}
            <div className="text-center">
              <div className="border-t border-gray-800 pt-1.5 mx-4">
                <p className="font-bold text-xs uppercase text-gray-900">{ordem.CLI_NOME}</p>
                <p className="text-[10px] text-gray-600 font-medium">Cliente / Aceite do Contratante</p>
                <p className="text-[9px] text-gray-400">
                  CPF/CNPJ: {ordem.CLI_CNPJ_CPF || "Não informado"}
                </p>
              </div>
            </div>
          </div>

          {/* Rodapé Institucional do Documento */}
          <div className="mt-6 pt-2 border-t border-gray-300 text-center text-[9px] text-gray-500 print:text-[8px]">
            <p>
              {empFantasia} • {empEndereco} • {empCidadeUf} • Fone: {empFone} • {empEmail}
            </p>
            <p className="mt-0.5">
              Documento emitido eletronicamente via Sistema EKIPE Serviços em{" "}
              {new Date().toLocaleString("pt-BR")}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
