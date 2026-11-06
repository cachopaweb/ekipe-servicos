"use client";

import { Dispatch, SetStateAction, useEffect, useState, useMemo, useRef } from "react";
import { getFileName, toastMixin, formatNumber } from "@/app/functions/utils";
import ArquivoModel from "@/app/models/arquivo_model";
import ArquivoRepository from "@/app/repositories/arquivo_repository";
import Modal from "./modal";
import StorageService from "@/app/services/storage_service";
import {
  Download,
  Loader2,
  Upload,
  FileText,
  Trash2,
  Eye,
  Image as ImageIcon,
  FileSpreadsheet,
  File,
  AlertTriangle,
  X,
  Plus,
  RefreshCw,
  FolderOpen,
} from "lucide-react";

interface PropsFiles {
  codigoOrdem: number;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  showmodal: boolean;
}

// Extensões autorizadas conforme D06 (Imagens e Documentos comerciais)
const EXTENSOES_PERMITIDAS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "jfif",
  "gif",
  "bmp",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "txt",
  "csv",
];

// Tamanho máximo permitido por arquivo: 25 MB
const MAX_TAMANHO_BYTES = 25 * 1024 * 1024;

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

function isImageExtension(ext: string): boolean {
  return ["jpg", "jpeg", "png", "webp", "jfif", "gif", "bmp"].includes(ext);
}

function isPdfExtension(ext: string): boolean {
  return ext === "pdf";
}

function isSpreadsheetExtension(ext: string): boolean {
  return ["xls", "xlsx", "csv"].includes(ext);
}

export const ModalListarArquivos = ({
  codigoOrdem,
  setShowModal,
  showmodal,
}: PropsFiles) => {
  // Aba ativa: "LISTA" (Arquivos da OS) ou "UPLOAD" (Adicionar novos)
  const [abaAtiva, setAbaAtiva] = useState<"LISTA" | "UPLOAD">("LISTA");

  // Lista de arquivos anexados e status de carregamento
  const [listaArquivos, setListaArquivos] = useState<ArquivoModel[]>([]);
  const [carregandoLista, setCarregandoLista] = useState<boolean>(true);

  // Seleção de novos arquivos para upload
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [observacaoArquivos, setObservacaoArquivos] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    fileName: string;
  } | null>(null);

  // Estado de download / visualização
  const [processandoAcaoId, setProcessandoAcaoId] = useState<number | null>(null);
  const [previewImagemUrl, setPreviewImagemUrl] = useState<{
    url: string;
    nome: string;
  } | null>(null);

  // Modal de confirmação de descarte de arquivos selecionados (A19 / R03)
  const [showConfirmDescarte, setShowConfirmDescarte] = useState<boolean>(false);

  // Modal de confirmação de exclusão de anexo
  const [anexoParaExcluir, setAnexoParaExcluir] = useState<ArquivoModel | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carrega lista ao abrir o modal
  useEffect(() => {
    if (showmodal && codigoOrdem > 0) {
      carregaArquivos();
      setSelectedFiles([]);
      setObservacaoArquivos("");
    }
  }, [showmodal, codigoOrdem]);

  const carregaArquivos = async () => {
    setCarregandoLista(true);
    try {
      const lista = await ArquivoRepository.getArquivoRepository(codigoOrdem);
      setListaArquivos(lista);
      // Se não há arquivos cadastrados, direciona o usuário diretamente para a aba de upload
      if (lista.length === 0) {
        setAbaAtiva("UPLOAD");
      } else {
        setAbaAtiva("LISTA");
      }
    } catch (err) {
      console.error("Erro ao carregar arquivos da OS:", err);
      toastMixin.fire("Erro", "Não foi possível carregar a lista de anexos.", "error");
    } finally {
      setCarregandoLista(false);
    }
  };

  // Trata seleção de arquivos com validação de formato e tamanho (D06 / A19)
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const novos = Array.from(event.target.files);
      const validados: File[] = [];

      for (const f of novos) {
        const ext = getFileExtension(f.name);
        if (!EXTENSOES_PERMITIDAS.includes(ext)) {
          toastMixin.fire({
            title: "Formato Não Permitido",
            text: `O arquivo "${f.name}" (${ext ? `.${ext}` : "sem extensão"}) não é suportado. Formatos válidos: Imagens (JPG, PNG, WEBP, etc.) e Documentos (PDF, DOC, DOCX, XLS, XLSX, TXT, CSV).`,
            icon: "warning",
          });
          continue;
        }

        if (f.size > MAX_TAMANHO_BYTES) {
          toastMixin.fire({
            title: "Tamanho Excedido",
            text: `O arquivo "${f.name}" tem ${formatBytes(f.size)}, ultrapassando o limite máximo de 25 MB.`,
            icon: "warning",
          });
          continue;
        }

        // Verifica duplicidade no mesmo lote
        if (selectedFiles.some((s) => s.name === f.name && s.size === f.size)) {
          toastMixin.fire({
            title: "Arquivo Repetido",
            text: `O arquivo "${f.name}" já foi selecionado nesta remessa.`,
            icon: "info",
          });
          continue;
        }

        validados.push(f);
      }

      if (validados.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validados]);
      }
    }

    if (event.target) {
      event.target.value = "";
    }
  };

  const handleRemoverArquivoSelecionado = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // E07 / R05 / A17–A19: Envio seguro via Signed URLs (Abordagem 1)
  const handleUpload = async () => {
    if (!codigoOrdem || codigoOrdem <= 0) {
      toastMixin.fire({
        title: "Atenção",
        text: "Por favor, salve a Ordem de Serviço antes de anexar arquivos.",
        icon: "warning",
      });
      return;
    }

    if (selectedFiles.length === 0) {
      toastMixin.fire({
        title: "Atenção",
        text: "Nenhum arquivo selecionado para envio.",
        icon: "warning",
      });
      return;
    }

    setIsUploading(true);
    const sucessos: string[] = [];
    const falhas: { name: string; error: string; code?: string }[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setUploadProgress({
        current: i + 1,
        total: selectedFiles.length,
        fileName: file.name,
      });

      try {
        // 1. Upload seguro via Signed URL temporária emitida pelo servidor Next.js
        const { storagePath } = await StorageService.uploadAnexoOS(codigoOrdem, file);

        // 2. Gravação de metadados individuais em ARQUIVOS_OS (com rollback no Storage se falhar no banco)
        const arq: ArquivoModel = {
          AO_CODIGO: 0,
          AO_OS: codigoOrdem,
          AO_CAMINHO: storagePath,
          AO_OBS: observacaoArquivos || "",
        };

        try {
          await ArquivoRepository.setArquivoRepository(arq);
        } catch (dbErr) {
          await StorageService.deleteAnexoOS(storagePath).catch(() => {});
          throw dbErr;
        }
        sucessos.push(file.name);
      } catch (err: any) {
        console.error(`Falha no upload do arquivo ${file.name}:`, err);
        const errMsg = String(err?.message || "");
        const errCode = String(err?.code || "");
        const is402 =
          errCode === "BILLING_REQUIRED_402" ||
          errMsg.includes("402") ||
          errMsg.includes("Spark");

        falhas.push({
          name: file.name,
          code: errCode,
          error: is402
            ? "Plano Spark do Firebase: O Google Cloud exige ativação do plano Blaze para usar o Cloud Storage."
            : errMsg || "Falha na gravação",
        });
      }
    }

    setIsUploading(false);
    setUploadProgress(null);

    if (falhas.length === 0) {
      toastMixin.fire({
        title: "Upload Concluído",
        text: `${sucessos.length} anexo(s) enviado(s) e vinculado(s) com sucesso à OS #${codigoOrdem}!`,
        icon: "success",
        timer: 2000,
      });
      setSelectedFiles([]);
      setObservacaoArquivos("");
      await carregaArquivos();
      setAbaAtiva("LISTA");
    } else if (sucessos.length > 0) {
      // Sucesso parcial (A19): mantém os que falharam para que o usuário possa tentar novamente
      setSelectedFiles((prev) =>
        prev.filter((f) => falhas.some((falha) => falha.name === f.name))
      );
      await carregaArquivos();
      toastMixin.fire({
        title: "Envio Parcial",
        text: `${sucessos.length} enviado(s) com sucesso. ${falhas.length} falharam: ${falhas
          .map((f) => f.name)
          .join(", ")}. Você pode tentar reenviar as falhas.`,
        icon: "warning",
      });
    } else {
      const isMissingAdmin = falhas.some((f) => f.code === "MISSING_ADMIN_CREDENTIALS");
      const isSparkPlan = falhas.some(
        (f) => f.error.includes("Spark") || f.error.includes("Blaze")
      );

      if (isMissingAdmin) {
        toastMixin.fire({
          title: "Credenciais do Servidor Pendentes",
          text: falhas[0]?.error || "Configure FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY no .env.local.",
          icon: "warning",
        });
      } else if (isSparkPlan) {
        toastMixin.fire({
          title: "Firebase Cloud Storage (Erro 402)",
          text: "O projeto no Firebase está no plano gratuito Spark. O Google Cloud exige a ativação do plano Blaze (Pay-as-you-go) no Firebase Console para habilitar o Cloud Storage.",
          icon: "error",
        });
      } else {
        toastMixin.fire({
          title: "Falha no Envio",
          text: falhas[0]?.error || `Nenhum arquivo pôde ser enviado: ${falhas.map((f) => f.name).join(", ")}`,
          icon: "error",
        });
      }
    }
  };

  // E07 / A20: Baixar arquivo com nome original preservado via Signed URL temporária
  const handleDownload = async (item: ArquivoModel) => {
    const isLegacyLocal =
      item.AO_CAMINHO.startsWith("\\\\") || /^[a-zA-Z]:\\/.test(item.AO_CAMINHO);

    if (isLegacyLocal) {
      toastMixin.fire({
        title: "Arquivo Legado de Rede",
        text: `Este arquivo está arquivado na rede interna (${item.AO_CAMINHO}) e não está disponível para download direto em nuvem.`,
        icon: "info",
      });
      return;
    }

    setProcessandoAcaoId(item.AO_CODIGO);
    try {
      const originalName = getFileName(item.AO_CAMINHO);
      const { url } = await StorageService.getUrlAnexoOS(item.AO_CAMINHO, true);

      // A Signed URL já possui Content-Disposition: attachment; filename="...",
      // mas tentamos primeiro via Blob para download silencioso e usamos o link assinado como fallback direto
      try {
        const resp = await fetch(url);
        const blob = await resp.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = originalName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      } catch {
        const a = document.createElement("a");
        a.href = url;
        a.download = originalName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err: any) {
      if (err?.code === "storage/object-not-found") {
        toastMixin.fire({
          title: "Objeto Não Encontrado",
          text: "O arquivo referenciado não foi localizado no armazenamento em nuvem.",
          icon: "warning",
        });
      } else {
        toastMixin.fire({
          title: "Erro no Download",
          text: err?.message || "Não foi possível baixar o arquivo.",
          icon: "error",
        });
      }
    } finally {
      setProcessandoAcaoId(null);
    }
  };

  // E07 / A20: Visualizar imagem ou abrir PDF diretamente via Signed URL temporária
  const handleVisualizar = async (item: ArquivoModel) => {
    const isLegacyLocal =
      item.AO_CAMINHO.startsWith("\\\\") || /^[a-zA-Z]:\\/.test(item.AO_CAMINHO);

    if (isLegacyLocal) {
      toastMixin.fire({
        title: "Arquivo Legado de Rede",
        text: `Arquivo arquivado na rede interna (${item.AO_CAMINHO}). Visualização online indisponível.`,
        icon: "info",
      });
      return;
    }

    setProcessandoAcaoId(item.AO_CODIGO);
    try {
      const originalName = getFileName(item.AO_CAMINHO);
      const ext = getFileExtension(originalName);

      const { url } = await StorageService.getUrlAnexoOS(item.AO_CAMINHO, false);

      if (isImageExtension(ext)) {
        setPreviewImagemUrl({ url, nome: originalName });
      } else if (isPdfExtension(ext)) {
        window.open(url, "_blank");
      } else {
        // Para outros documentos, faz o download diretamente
        handleDownload(item);
      }
    } catch (err: any) {
      if (err?.code === "storage/object-not-found") {
        toastMixin.fire({
          title: "Objeto Não Encontrado",
          text: "O anexo não foi encontrado no servidor de armazenamento em nuvem.",
          icon: "warning",
        });
      } else {
        toastMixin.fire({
          title: "Erro na Visualização",
          text: err?.message || "Não foi possível abrir o arquivo.",
          icon: "error",
        });
      }
    } finally {
      setProcessandoAcaoId(null);
    }
  };

  // Excluir anexo da OS
  const handleConfirmarExclusao = async () => {
    if (!anexoParaExcluir) return;
    setIsDeleting(true);

    try {
      // 1. Remove da tabela ARQUIVOS_OS
      await ArquivoRepository.deleteArquivoRepository(anexoParaExcluir.AO_CODIGO);

      // 2. Remove o objeto físico do Firebase Storage via API autenticada se for um caminho em nuvem
      const isLegacyLocal =
        anexoParaExcluir.AO_CAMINHO.startsWith("\\\\") ||
        /^[a-zA-Z]:\\/.test(anexoParaExcluir.AO_CAMINHO);

      if (!isLegacyLocal) {
        try {
          await StorageService.deleteAnexoOS(anexoParaExcluir.AO_CAMINHO);
        } catch (storageErr) {
          console.warn("Objeto não existia no storage ou já foi removido:", storageErr);
        }
      }

      toastMixin.fire({
        title: "Anexo Excluído",
        text: "O anexo foi removido com sucesso.",
        icon: "success",
        timer: 1500,
      });

      setAnexoParaExcluir(null);
      await carregaArquivos();
    } catch (err: any) {
      toastMixin.fire("Erro", "Falha ao remover o anexo: " + String(err), "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Proteção contra descarte de arquivos selecionados não salvos (A19 / R03)
  const handleTentarFecharModal = () => {
    if (selectedFiles.length > 0 || observacaoArquivos.trim().length > 0) {
      setShowConfirmDescarte(true);
    } else {
      setShowModal(false);
    }
  };

  const getIconeArquivo = (caminho: string) => {
    const originalName = getFileName(caminho);
    const ext = getFileExtension(originalName);

    if (isImageExtension(ext)) {
      return <ImageIcon className="w-4 h-4 text-emerald-600" />;
    }
    if (isPdfExtension(ext)) {
      return <FileText className="w-4 h-4 text-rose-600" />;
    }
    if (isSpreadsheetExtension(ext)) {
      return <FileSpreadsheet className="w-4 h-4 text-teal-600" />;
    }
    return <File className="w-4 h-4 text-brand" />;
  };

  return (
    <>
      <Modal
        showModal={showmodal}
        setShowModal={(val) => {
          const next = typeof val === "function" ? val(showmodal) : val;
          if (!next) {
            handleTentarFecharModal();
          } else {
            setShowModal(true);
          }
        }}
        title={`Arquivos e Anexos — Ordem de Serviço #${codigoOrdem || "..."}`}
        showButtonExit={false}
        body={
          <div className="font-sans flex flex-col gap-3 min-w-[320px] max-w-4xl w-full">
            {/* Cabeçalho com Abas: Lista de Anexos vs. Enviar Novos */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAbaAtiva("LISTA")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                    abaAtiva === "LISTA"
                      ? "bg-amber-500 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Anexos da OS ({listaArquivos.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAbaAtiva("UPLOAD")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                    abaAtiva === "UPLOAD"
                      ? "bg-amber-500 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Adicionar Anexos</span>
                  {selectedFiles.length > 0 && (
                    <span className="ml-1 bg-white text-amber-600 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                      {selectedFiles.length}
                    </span>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={carregaArquivos}
                disabled={carregandoLista}
                title="Atualizar lista"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-40"
              >
                <RefreshCw
                  className={`w-4 h-4 ${carregandoLista ? "animate-spin text-amber-500" : ""}`}
                />
              </button>
            </div>

            {/* CONTEÚDO DA ABA 1: LISTA DE ARQUIVOS */}
            {abaAtiva === "LISTA" && (
              <div className="flex flex-col gap-3">
                {carregandoLista ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-2">
                    <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
                    <span className="text-xs font-semibold">Carregando anexos...</span>
                  </div>
                ) : listaArquivos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <div className="p-3 bg-amber-50 text-amber-500 rounded-full mb-2">
                      <FolderOpen className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">Nenhum anexo encontrado</h3>
                    <p className="text-xs text-gray-500 max-w-sm mt-1 mb-4">
                      Esta ordem de serviço ainda não possui fotografias, orçamentos ou relatórios vinculados.
                    </p>
                    <button
                      type="button"
                      onClick={() => setAbaAtiva("UPLOAD")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Anexar Primeiro Arquivo</span>
                    </button>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm max-h-[440px] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-gray-50 text-gray-700 font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-gray-200">
                        <tr>
                          <th className="py-2.5 px-3 w-12 text-center">#</th>
                          <th className="py-2.5 px-3">Arquivo</th>
                          <th className="py-2.5 px-3">Observação</th>
                          <th className="py-2.5 px-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {listaArquivos.map((item) => {
                          const originalName = getFileName(item.AO_CAMINHO);
                          const isLegacyLocal =
                            item.AO_CAMINHO.startsWith("\\\\") ||
                            /^[a-zA-Z]:\\/.test(item.AO_CAMINHO);
                          const isBusy = processandoAcaoId === item.AO_CODIGO;
                          const ext = getFileExtension(originalName);
                          const podeVisualizar =
                            isImageExtension(ext) || isPdfExtension(ext);

                          return (
                            <tr
                              key={item.AO_CODIGO}
                              className="hover:bg-amber-50/30 transition-colors"
                            >
                              <td className="py-2.5 px-3 text-center text-gray-400 font-mono text-[11px]">
                                {item.AO_CODIGO}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-start gap-2">
                                  <div className="p-1.5 bg-gray-100 rounded-md shrink-0 mt-0.5">
                                    {getIconeArquivo(item.AO_CAMINHO)}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span
                                      className="font-bold text-gray-900 truncate max-w-xs md:max-w-md"
                                      title={originalName}
                                    >
                                      {originalName}
                                    </span>
                                    {isLegacyLocal && (
                                      <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded w-fit mt-0.5">
                                        Legado de Rede Local
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-gray-600 max-w-xs truncate">
                                {item.AO_OBS || (
                                  <span className="text-gray-400 italic">Sem observação</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="inline-flex items-center gap-1.5 justify-end">
                                  {/* Botão de Visualização */}
                                  {podeVisualizar && (
                                    <button
                                      type="button"
                                      onClick={() => handleVisualizar(item)}
                                      disabled={isBusy}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-brand bg-brand/10 hover:bg-brand/20 rounded-md transition disabled:opacity-40"
                                      title="Visualizar anexo"
                                    >
                                      {isBusy ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Eye className="w-3.5 h-3.5" />
                                      )}
                                      <span className="hidden sm:inline">Visualizar</span>
                                    </button>
                                  )}

                                  {/* Botão de Download */}
                                  <button
                                    type="button"
                                    onClick={() => handleDownload(item)}
                                    disabled={isBusy}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition disabled:opacity-40"
                                    title="Baixar arquivo original"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Baixar</span>
                                  </button>

                                  {/* Botão de Exclusão */}
                                  <button
                                    type="button"
                                    onClick={() => setAnexoParaExcluir(item)}
                                    disabled={isBusy}
                                    className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition disabled:opacity-40"
                                    title="Excluir anexo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleTentarFecharModal}
                    className="px-4 py-2 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}

            {/* CONTEÚDO DA ABA 2: ADICIONAR NOVOS ANEXOS */}
            {abaAtiva === "UPLOAD" && (
              <div className="flex flex-col gap-3">
                {/* Zona de Drop / Seleção de Arquivos */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-xl p-5 bg-amber-50/20 hover:bg-amber-50/40 transition-colors flex flex-col items-center justify-center cursor-pointer text-center gap-2"
                >
                  <div className="p-3 bg-white text-amber-500 rounded-full shadow-sm border border-amber-100">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-800">
                      Clique para selecionar ou arraste arquivos aqui
                    </span>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Suporta múltiplos arquivos • Imagens (JPG, PNG, WEBP), PDFs e Documentos (até 25 MB cada)
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.jfif,.gif,.bmp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* Lista de Arquivos Selecionados na Fila de Upload */}
                {selectedFiles.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700 px-0.5">
                      <span>Arquivos Selecionados ({selectedFiles.length})</span>
                      <button
                        type="button"
                        onClick={() => setSelectedFiles([])}
                        className="text-[11px] text-rose-600 hover:underline font-semibold"
                      >
                        Limpar Todos
                      </button>
                    </div>

                    <div className="border border-gray-200 rounded-lg bg-gray-50/60 p-2 max-h-36 overflow-y-auto flex flex-col gap-1.5">
                      {selectedFiles.map((f, idx) => (
                        <div
                          key={`${f.name}_${idx}`}
                          className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-md border border-gray-200 text-xs shadow-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {getIconeArquivo(f.name)}
                            <span className="font-medium text-gray-800 truncate max-w-sm">
                              {f.name}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              ({formatBytes(f.size)})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoverArquivoSelecionado(idx);
                            }}
                            className="p-1 text-gray-400 hover:text-rose-600 rounded transition"
                            title="Remover da seleção"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Campo de Observação Geral para os Anexos */}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="arquivoObs"
                    className="text-xs font-bold text-gray-700 uppercase tracking-wider"
                  >
                    Observação do(s) Anexo(s) (Opcional)
                  </label>
                  <textarea
                    id="arquivoObs"
                    value={observacaoArquivos}
                    onChange={(e) => setObservacaoArquivos(e.target.value.toUpperCase())}
                    placeholder="Ex: FOTOS DO LOCAL ANTES DA EXECUÇÃO, NOTA FISCAL DE COMPRA, LAUDO TÉCNICO..."
                    rows={2}
                    className="w-full text-xs uppercase bg-white border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-gray-800 resize-none font-sans"
                  />
                </div>

                {/* Progresso de Envio */}
                {isUploading && uploadProgress && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-amber-500 animate-spin shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-amber-900">
                        Enviando {uploadProgress.current} de {uploadProgress.total}...
                      </span>
                      <span className="text-[11px] text-amber-700 truncate">
                        {uploadProgress.fileName}
                      </span>
                    </div>
                  </div>
                )}

                {/* Rodapé de Ações */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleTentarFecharModal}
                    disabled={isUploading}
                    className="px-4 py-2 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition disabled:opacity-40"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={isUploading || selectedFiles.length === 0}
                    className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Salvar {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""} Anexo(s)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        }
      />

      {/* Modal de Confirmação de Descarte de Seleção Local (A19 / R03) */}
      {showConfirmDescarte && (
        <Modal
          showModal={showConfirmDescarte}
          setShowModal={setShowConfirmDescarte}
          title="Atenção!"
          showButtonExit={false}
          body={
            <div className="font-sans flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-600 rounded-full shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-bold text-gray-900">Descartar seleção de arquivos?</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Existem alterações que ainda não foram salvas. Se você sair desta tela, todas as alterações realizadas serão perdidas. Deseja realmente sair sem salvar?
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowConfirmDescarte(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition"
                >
                  Continuar editando
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmDescarte(false);
                    setSelectedFiles([]);
                    setObservacaoArquivos("");
                    setShowModal(false);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-sm"
                >
                  Sair sem salvar
                </button>
              </div>
            </div>
          }
        />
      )}

      {/* Modal de Confirmação de Exclusão de Anexo */}
      {anexoParaExcluir && (
        <Modal
          showModal={!!anexoParaExcluir}
          setShowModal={() => setAnexoParaExcluir(null)}
          title="Excluir Anexo"
          showButtonExit={false}
          body={
            <div className="font-sans flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-rose-100 text-rose-600 rounded-full shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-bold text-gray-900">Remover este arquivo da ordem?</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Tem certeza de que deseja excluir permanentemente o anexo{" "}
                    <strong>&quot;{getFileName(anexoParaExcluir.AO_CAMINHO)}&quot;</strong>?
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAnexoParaExcluir(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarExclusao}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-sm disabled:opacity-40"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>Sim, Excluir</span>
                </button>
              </div>
            </div>
          }
        />
      )}

      {/* Modal de Lightbox / Visualização de Imagem */}
      {previewImagemUrl && (
        <Modal
          showModal={!!previewImagemUrl}
          setShowModal={() => setPreviewImagemUrl(null)}
          title={previewImagemUrl.nome}
          showButtonExit={false}
          body={
            <div className="font-sans flex flex-col items-center gap-3 max-w-3xl">
              <div className="w-full max-h-[75vh] flex items-center justify-center bg-stone-900/5 rounded-xl overflow-hidden border border-gray-200 p-2">
                <img
                  src={previewImagemUrl.url}
                  alt={previewImagemUrl.nome}
                  className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-sm"
                />
              </div>
              <div className="flex items-center justify-between w-full pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500 truncate max-w-md">
                  {previewImagemUrl.nome}
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={previewImagemUrl.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 text-xs font-bold text-brand bg-brand/10 hover:bg-brand/20 rounded-lg transition"
                  >
                    Abrir em nova guia
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewImagemUrl(null)}
                    className="px-4 py-1.5 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          }
        />
      )}
    </>
  );
};
