import { NextRequest } from "next/server";

// Limite máximo por arquivo: 25 MB
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

// Mapeamento de extensões autorizadas para seus respectivos MIME types aceitos
export const EXTENSOES_E_MIMES: Record<string, string[]> = {
  jpg: ["image/jpeg", "image/jpg"],
  jpeg: ["image/jpeg", "image/jpg"],
  png: ["image/png"],
  webp: ["image/webp"],
  jfif: ["image/jpeg", "image/pjpeg", "application/octet-stream"],
  gif: ["image/gif"],
  bmp: ["image/bmp", "image/x-ms-bmp"],
  pdf: ["application/pdf"],
  doc: ["application/msword", "application/octet-stream"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",
  ],
  xls: [
    "application/vnd.ms-excel",
    "application/excel",
    "application/octet-stream",
  ],
  xlsx: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream",
  ],
  txt: ["text/plain", "application/octet-stream"],
  csv: ["text/csv", "text/plain", "application/vnd.ms-excel", "application/octet-stream"],
};

export interface AuthValidationResult {
  authorized: boolean;
  error?: string;
  userCodigo?: number;
  userLogin?: string;
}

/**
 * Valida se a requisição possui contexto de usuário autenticado no sistema.
 */
export function validarSessaoRequest(request: NextRequest): AuthValidationResult {
  const userCodigoHeader = request.headers.get("x-user-codigo");
  const userLoginHeader = request.headers.get("x-user-login")?.trim();

  const userCodigo = Number(userCodigoHeader);

  if (!userLoginHeader || !Number.isFinite(userCodigo) || userCodigo <= 0) {
    return {
      authorized: false,
      error: "Sessão de usuário não autenticada. Faça login novamente para gerenciar anexos.",
    };
  }

  return {
    authorized: true,
    userCodigo,
    userLogin: userLoginHeader,
  };
}

/**
 * Extrai a extensão em letras minúsculas de um nome de arquivo.
 */
export function extrairExtensao(fileName: string): string {
  const parts = fileName.trim().split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

/**
 * Higieniza o nome do arquivo removendo diretórios, caracteres de controle e símbolos inseguros.
 */
export function sanitizarNomeArquivo(fileName: string): string {
  const baseName = fileName.replace(/^.*[\\/]/, "").trim();
  const safe = baseName
    .replace(/[\x00-\x1f\x80-\x9f]/g, "")
    .replace(/[\\/:"*?<>|#%?]/g, "_")
    .replace(/\s+/g, "_");

  return safe.length > 0 ? safe.slice(0, 140) : "anexo";
}

/**
 * Valida se um caminho do Cloud Storage é seguro (sem Path Traversal) e pertence ao diretório de OS.
 */
export function validarCaminhoStorage(storagePath: string): {
  valid: boolean;
  error?: string;
  normalizedPath?: string;
} {
  if (!storagePath || typeof storagePath !== "string") {
    return { valid: false, error: "Caminho do arquivo não informado." };
  }

  const trimmed = storagePath.trim().replace(/^\/+/, "");

  // Bloqueia tentativas de Path Traversal ou caracteres inválidos
  if (
    trimmed.includes("..") ||
    trimmed.includes("\\") ||
    trimmed.includes("\0") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return { valid: false, error: "Caminho de armazenamento inválido ou inseguro." };
  }

  // Deve ser um caminho relativo válido de objeto no bucket (sem barras duplas ou caracteres de controle)
  if (trimmed.includes("//") || /[\x00-\x1f\x7f]/.test(trimmed)) {
    return {
      valid: false,
      error: "O caminho do arquivo contém caracteres de controle não permitidos.",
    };
  }

  return { valid: true, normalizedPath: trimmed };
}

/**
 * Resolve e valida o Content-Type de acordo com a extensão do arquivo.
 */
export function validarTipoArquivo(
  fileName: string,
  contentType?: string
): {
  valid: boolean;
  resolvedContentType?: string;
  error?: string;
} {
  const ext = extrairExtensao(fileName);
  const mimesPermitidos = EXTENSOES_E_MIMES[ext];

  if (!ext || !mimesPermitidos) {
    return {
      valid: false,
      error: `A extensão ".${ext || "desconhecida"}" não é permitida por motivos de segurança.`,
    };
  }

  const normalizedMime = (contentType || "").toLowerCase().trim();
  const defaultMime = mimesPermitidos[0];

  if (!normalizedMime) {
    return { valid: true, resolvedContentType: defaultMime };
  }

  if (!mimesPermitidos.includes(normalizedMime)) {
    return {
      valid: false,
      error: `O tipo de conteúdo "${normalizedMime}" não corresponde à extensão ".${ext}".`,
    };
  }

  return { valid: true, resolvedContentType: normalizedMime };
}
