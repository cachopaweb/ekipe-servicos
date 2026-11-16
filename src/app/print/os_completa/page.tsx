"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PrintOSCompleta from "@/components/component/print_os_completa";
import { ArrowLeft } from "lucide-react";

function PrintOSCompletaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idStr = searchParams?.get("id");
  const codigoOrdem = idStr ? parseInt(idStr, 10) : 0;

  if (!codigoOrdem || isNaN(codigoOrdem)) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl shadow max-w-md text-center">
          <h1 className="text-lg font-bold text-gray-800">Parâmetro Inválido</h1>
          <p className="text-xs text-gray-500 mt-2">
            Nenhum código de Ordem de Serviço foi informado na URL. Exemplo:{" "}
            <code>/print/os_completa?id=7238</code>
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 text-xs font-bold text-white bg-brand rounded-lg hover:bg-brand-hover transition"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 p-4 md:p-8 print:p-0 print:bg-white">
      <div className="max-w-[210mm] mx-auto mb-4 print:hidden">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para Orçamentos</span>
        </button>
      </div>
      <PrintOSCompleta codigoOrdem={codigoOrdem} onClose={() => router.back()} />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-xs text-gray-500">
          Carregando documento...
        </div>
      }
    >
      <PrintOSCompletaContent />
    </Suspense>
  );
}
