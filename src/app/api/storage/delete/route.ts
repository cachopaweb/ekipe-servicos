import { NextRequest, NextResponse } from "next/server";
import {
  FirebaseAdminConfigError,
  getAdminStorageBucket,
} from "@/app/services/firebase_admin";
import { validarCaminhoStorage, validarSessaoRequest } from "../_security";

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

    // 2. Valida e higieniza o caminho no Cloud Storage
    const pathCheck = validarCaminhoStorage(rawPath);
    if (!pathCheck.valid || !pathCheck.normalizedPath) {
      return NextResponse.json(
        { error: pathCheck.error, code: "INVALID_PATH" },
        { status: 400 }
      );
    }

    // 3. Remove o objeto físico com credenciais administrativas
    const bucket = getAdminStorageBucket();
    const file = bucket.file(pathCheck.normalizedPath);
    await file.delete({ ignoreNotFound: true });

    return NextResponse.json({
      deleted: true,
      storagePath: pathCheck.normalizedPath,
    });
  } catch (err: any) {
    if (err instanceof FirebaseAdminConfigError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 503 }
      );
    }

    console.error("Erro ao excluir arquivo do Cloud Storage:", err);
    return NextResponse.json(
      {
        error: err?.message || "Não foi possível excluir o arquivo na nuvem.",
        code: "STORAGE_DELETE_ERROR",
      },
      { status: 500 }
    );
  }
}
