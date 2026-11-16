import { NextRequest, NextResponse } from "next/server";
import {
  FirebaseAdminConfigError,
  getAdminStorageBucket,
} from "@/app/services/firebase_admin";
import {
  sanitizarNomeArquivo,
  validarCaminhoStorage,
  validarSessaoRequest,
} from "../_security";

function extrairNomeOriginal(storagePath: string): string {
  const segments = storagePath.replace(/\\/g, "/").split("/");
  const rawName = segments[segments.length - 1] || "anexo";
  const match = rawName.match(/^\d+_[a-z0-9]+_(.+)$/i);
  const clean = match && match[1] ? match[1] : rawName;
  return sanitizarNomeArquivo(clean);
}

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
    const rawPath = String(body?.storagePath || "");
    const isDownload = Boolean(body?.download);

    // 2. Valida e higieniza o caminho no Cloud Storage
    const pathCheck = validarCaminhoStorage(rawPath);
    if (!pathCheck.valid || !pathCheck.normalizedPath) {
      return NextResponse.json(
        { error: pathCheck.error, code: "INVALID_PATH" },
        { status: 400 }
      );
    }

    const bucket = getAdminStorageBucket();
    const file = bucket.file(pathCheck.normalizedPath);

    // 3. Verifica se o objeto físico existe no bucket
    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json(
        {
          error: "O arquivo referenciado não foi localizado no armazenamento em nuvem.",
          code: "storage/object-not-found",
        },
        { status: 404 }
      );
    }

    // 4. Gera Signed URL V4 de leitura temporária (válida por 15 minutos)
    const expiresAt = Date.now() + 15 * 60 * 1000;
    const originalName = extrairNomeOriginal(pathCheck.normalizedPath);

    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: expiresAt,
      responseDisposition: isDownload
        ? `attachment; filename="${originalName}"`
        : `inline; filename="${originalName}"`,
    });

    return NextResponse.json({
      url,
      fileName: originalName,
      expiresAt,
    });
  } catch (err: any) {
    if (err instanceof FirebaseAdminConfigError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 503 }
      );
    }

    console.error("Erro ao gerar Signed URL de download:", err);
    return NextResponse.json(
      {
        error: err?.message || "Não foi possível gerar a URL segura de leitura.",
        code: "STORAGE_DOWNLOAD_ERROR",
      },
      { status: 500 }
    );
  }
}
