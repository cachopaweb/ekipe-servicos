import { initializeApp, getApps, getApp, cert, ServiceAccount } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

export class FirebaseAdminConfigError extends Error {
  code: string;
  constructor(message: string) {
    super(message);
    this.name = "FirebaseAdminConfigError";
    this.code = "MISSING_ADMIN_CREDENTIALS";
  }
}

function resolveBucketName(): string {
  const rawBucket =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIRE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIRE_GS ||
    "ekipe-servicos.firebasestorage.app";

  return rawBucket.replace(/^gs:\/\//i, "").trim();
}

function resolveServiceAccount(): ServiceAccount {
  // Opção 1: JSON completo da Service Account em variável única
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (rawJson && rawJson.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(rawJson);
      if (parsed.client_email && parsed.private_key) {
        return {
          projectId: parsed.project_id || process.env.FIREBASE_PROJECT_ID || "ekipe-servicos",
          clientEmail: parsed.client_email,
          privateKey: String(parsed.private_key).replace(/\\n/g, "\n"),
        };
      }
    } catch {
      throw new FirebaseAdminConfigError(
        "A variável FIREBASE_SERVICE_ACCOUNT_KEY contém um JSON inválido."
      );
    }
  }

  // Opção 2: Variáveis separadas no .env / .env.local
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIRE_PROJECT_ID ||
    "ekipe-servicos";
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || "").trim();
  const rawPrivateKey = (process.env.FIREBASE_PRIVATE_KEY || "").trim();

  // Remove aspas extras caso tenham sido incluídas e converte \n escapado em quebra de linha real
  const privateKey = rawPrivateKey
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n");

  const isPlaceholder =
    !clientEmail ||
    !privateKey ||
    clientEmail.includes("SEU_CLIENT_EMAIL") ||
    privateKey.includes("SUA_PRIVATE_KEY");

  if (isPlaceholder || !privateKey.includes("BEGIN PRIVATE KEY")) {
    throw new FirebaseAdminConfigError(
      "Credenciais de servidor do Firebase Admin não configuradas. Configure FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY no arquivo .env.local."
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  };
}

export function getAdminStorageBucket() {
  const bucketName = resolveBucketName();
  const serviceAccount = resolveServiceAccount();

  const adminApp =
    getApps().length === 0
      ? initializeApp({
          credential: cert(serviceAccount),
          storageBucket: bucketName,
        })
      : getApp();

  return getStorage(adminApp).bucket(bucketName);
}
