export class StorageOperationError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = "StorageOperationError";
    this.code = code;
    this.status = status;
  }
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    try {
      const rawUser = localStorage.getItem("usuario_logado");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed?.USU_CODIGO) {
          headers["x-user-codigo"] = String(parsed.USU_CODIGO);
        }
        if (parsed?.USU_LOGIN) {
          headers["x-user-login"] = String(parsed.USU_LOGIN);
        }
      }
    } catch {
      // Ignora erro de parse do localStorage
    }
  }

  return headers;
}

export default class StorageService {
  /**
   * 1. Solicita uma Signed URL PUT temporária ao servidor Next.js
   * 2. Envia os bytes do arquivo diretamente do navegador para o Google Cloud Storage
   */
  static async uploadAnexoOS(
    codigoOrdem: number,
    file: File
  ): Promise<{ storagePath: string }> {
    // Passo 1: Pede URL pré-assinada ao backend Next.js
    const signResp = await fetch("/api/storage/upload-url", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        codigoOrdem,
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        fileSize: file.size,
      }),
    });

    const signData = await signResp.json().catch(() => ({}));

    if (!signResp.ok || !signData?.uploadUrl || !signData?.storagePath) {
      throw new StorageOperationError(
        signData?.error || "Não foi possível autorizar o envio do arquivo.",
        signData?.code || "SIGN_UPLOAD_FAILED",
        signResp.status
      );
    }

    // Passo 2: Envia o binário diretamente para a Signed URL do Google Cloud Storage
    let putResp: Response;
    try {
      putResp = await fetch(signData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": signData.contentType || file.type || "application/octet-stream",
        },
        body: file,
      });
    } catch (networkErr: any) {
      throw new StorageOperationError(
        "Falha de rede ou bloqueio de CORS ao enviar o arquivo para o Google Cloud Storage. Verifique a configuração de CORS do bucket.",
        "CORS_OR_NETWORK_ERROR"
      );
    }

    if (!putResp.ok) {
      const errorText = await putResp.text().catch(() => "");
      if (putResp.status === 402 || errorText.includes("Spark") || errorText.includes("billing")) {
        throw new StorageOperationError(
          "Plano Spark do Firebase: O Google Cloud exige ativação do plano Blaze para usar o Cloud Storage.",
          "BILLING_REQUIRED_402",
          402
        );
      }

      throw new StorageOperationError(
        `O armazenamento recusou o envio (HTTP ${putResp.status}).`,
        "PUT_UPLOAD_REJECTED",
        putResp.status
      );
    }

    return {
      storagePath: signData.storagePath,
    };
  }

  /**
   * Solicita uma Signed URL GET temporária (válida por 15 minutos) para visualizar ou baixar um anexo.
   */
  static async getUrlAnexoOS(
    storagePath: string,
    download = false
  ): Promise<{ url: string; fileName: string }> {
    const resp = await fetch("/api/storage/download-url", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        storagePath,
        download,
      }),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok || !data?.url) {
      throw new StorageOperationError(
        data?.error || "Não foi possível obter o link seguro do arquivo.",
        data?.code || "SIGN_DOWNLOAD_FAILED",
        resp.status
      );
    }

    return {
      url: data.url,
      fileName: data.fileName || storagePath.split("/").pop() || "anexo",
    };
  }

  /**
   * Obtém os bytes brutos (Blob) do anexo diretamente pelo proxy seguro do servidor Next.js (evita bloqueios de CORS).
   */
  static async getBlobAnexoOS(storagePath: string): Promise<Blob> {
    const resp = await fetch("/api/storage/content", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ storagePath }),
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      throw new StorageOperationError(
        data?.error || "Não foi possível obter os dados do arquivo.",
        data?.code || "CONTENT_FETCH_FAILED",
        resp.status
      );
    }

    return await resp.blob();
  }

  /**
   * Remove um objeto do Cloud Storage de maneira autenticada pelo servidor.
   */
  static async deleteAnexoOS(storagePath: string): Promise<void> {
    const resp = await fetch("/api/storage/delete", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ storagePath }),
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      throw new StorageOperationError(
        data?.error || "Falha ao remover objeto do Cloud Storage.",
        data?.code || "DELETE_FAILED",
        resp.status
      );
    }
  }
}
