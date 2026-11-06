import { NextRequest, NextResponse } from "next/server";
import {
  FirebaseAdminConfigError,
  getAdminStorageBucket,
} from "@/app/services/firebase_admin";
import {
  EXTENSOES_E_MIMES,
  extrairExtensao,
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
    const auth = validarSessaoRequest(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error, code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const rawPath = String(body?.storagePath || "");

    const pathCheck = validarCaminhoStorage(rawPath);
    if (!pathCheck.valid || !pathCheck.normalizedPath) {
      return NextResponse.json(
        { error: pathCheck.error, code: "INVALID_PATH" },
        { status: 400 }
      );
    }

    const bucket = getAdminStorageBucket();
    const file = bucket.file(pathCheck.normalizedPath);

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

    const [buffer] = await file.download();
    const originalName = extrairNomeOriginal(pathCheck.normalizedPath);
    const ext = extrairExtensao(originalName);
    const contentType = EXTENSOES_E_MIMES[ext]?.[0] || "application/octet-stream";

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${originalName}"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err: any) {
    if (err instanceof FirebaseAdminConfigError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 503 }
      );
    }

    console.error("Erro ao baixar conteúdo do anexo:", err);
    return NextResponse.json(
      {
        error: err?.message || "Não foi possível ler o conteúdo do anexo.",
        code: "STORAGE_CONTENT_ERROR",
      },
      { status: 500 }
    );
  }
}
