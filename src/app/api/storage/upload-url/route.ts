import { NextRequest, NextResponse } from "next/server";
import {
  FirebaseAdminConfigError,
  getAdminStorageBucket,
} from "@/app/services/firebase_admin";
import {
  MAX_FILE_SIZE_BYTES,
  sanitizarNomeArquivo,
  validarSessaoRequest,
  validarTipoArquivo,
} from "../_security";

export async function POST(request: NextRequest) {
  try {
    // 1. Valida sessão autenticada do usuário
    const auth = validarSessaoRequest(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error, code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const codigoOrdem = Number(body?.codigoOrdem);
    const fileName = String(body?.fileName || "").trim();
    const contentType = String(body?.contentType || "").trim();
    const fileSize = Number(body?.fileSize || 0);

    // 2. Valida código da Ordem de Serviço
    if (!Number.isInteger(codigoOrdem) || codigoOrdem <= 0) {
      return NextResponse.json(
        {
          error: "Código da Ordem de Serviço inválido. Salve a OS antes de anexar arquivos.",
          code: "INVALID_OS",
        },
        { status: 400 }
      );
    }

    // 3. Valida tamanho do arquivo (0 < size <= 25 MB)
    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return NextResponse.json(
        { error: "O arquivo selecionado está vazio ou é inválido.", code: "EMPTY_FILE" },
        { status: 400 }
      );
    }

    if (fileSize > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: "O arquivo excede o tamanho máximo permitido de 25 MB.",
          code: "FILE_TOO_LARGE",
        },
        { status: 413 }
      );
    }

    // 4. Valida extensão e MIME type
    const tipoCheck = validarTipoArquivo(fileName, contentType);
    if (!tipoCheck.valid || !tipoCheck.resolvedContentType) {
      return NextResponse.json(
        { error: tipoCheck.error, code: "INVALID_FILE_TYPE" },
        { status: 415 }
      );
    }

    // 5. Gera caminho único e seguro no namespace da OS
    const safeName = sanitizarNomeArquivo(fileName);
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const storagePath = `os/${codigoOrdem}/${uniqueId}_${safeName}`;

    // 6. Emite Signed URL V4 de escrita com expiração de 10 minutos
    const bucket = getAdminStorageBucket();
    const file = bucket.file(storagePath);
    const expiresAt = Date.now() + 10 * 60 * 1000;

    const [uploadUrl] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: expiresAt,
      contentType: tipoCheck.resolvedContentType,
    });

    return NextResponse.json({
      uploadUrl,
      storagePath,
      contentType: tipoCheck.resolvedContentType,
      expiresAt,
    });
  } catch (err: any) {
    if (err instanceof FirebaseAdminConfigError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 503 }
      );
    }

    console.error("Erro ao gerar Signed URL de upload:", err);
    return NextResponse.json(
      {
        error: err?.message || "Não foi possível gerar a URL segura de upload.",
        code: "STORAGE_SIGN_ERROR",
      },
      { status: 500 }
    );
  }
}
