import * as XLSX from "xlsx";
import { ItemRelatorioEmpreitada } from "../models/relatorio_model";

function formatarServicosExcel(item: ItemRelatorioEmpreitada): string {
  if (!item.ITENS || item.ITENS.length === 0) return "";
  if (item.ITENS.length === 1) {
    const s = item.ITENS[0];
    const qtd = s.ES_QUANTIDADE ? ` (${s.ES_QUANTIDADE} ${s.ES_UNIDADE || "UN"})` : "";
    return `${s.DESCRICAO || ""}${qtd}`.trim();
  }
  return item.ITENS.map((s, idx) => {
    const qtd = s.ES_QUANTIDADE ? ` (${s.ES_QUANTIDADE} ${s.ES_UNIDADE || "UN"})` : "";
    return `${idx + 1}. ${s.DESCRICAO || ""}${qtd}`;
  }).join("\n");
}

function formatarData(dataStr?: string): string {
  if (!dataStr) return "";
  if (dataStr.includes("/")) return dataStr;
  const parts = dataStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dataStr;
}

export function exportarRelatorioParaExcel(dados: ItemRelatorioEmpreitada[], nomeArquivo = "Relatorio_Empreitadas") {
  const linhas = dados.map((item) => ({
    "PROTOCOLO DE AGENDAMENTO": item.EMP_PROTOCOLO || "",
    "NOTA FISCAL": item.EMP_NFS || "",
    "LOJA": item.EMP_LOJA || "",
    "OM": item.ORD_OM || "",
    "PEDIDO DE COMPRAS": item.EMP_PEDIDO || "",
    "SERVIÇO": formatarServicosExcel(item),
    "VALOR DA NF (R$)": Number(item.EMP_VALOR || 0),
    "DATA EMISSÃO": formatarData(item.EMP_DATA_EMISSAO),
    "RECEBIDO (R$)": Number(item.VALOR_RECEBIDO || 0),
    "COORDENADOR": item.EMP_COORDENADOR || "",
    "CLIENTE": item.CLI_NOME || "",
    "OS Nº": item.EMP_ORD || "",
  }));

  const ws = XLSX.utils.json_to_sheet(linhas);

  // Largura estimada das colunas
  ws["!cols"] = [
    { wch: 25 }, // PROTOCOLO DE AGENDAMENTO
    { wch: 14 }, // NOTA FISCAL
    { wch: 10 }, // LOJA
    { wch: 14 }, // OM
    { wch: 20 }, // PEDIDO DE COMPRAS
    { wch: 45 }, // SERVIÇO
    { wch: 18 }, // VALOR DA NF
    { wch: 14 }, // DATA EMISSÃO
    { wch: 16 }, // RECEBIDO
    { wch: 20 }, // COORDENADOR
    { wch: 35 }, // CLIENTE
    { wch: 10 }, // OS Nº
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Atendimentos");

  XLSX.writeFile(wb, `${nomeArquivo}.xlsx`);
}

export function exportarRelatorioParaCSV(dados: ItemRelatorioEmpreitada[], nomeArquivo = "Relatorio_Empreitadas") {
  const cabecalhos = [
    "PROTOCOLO DE AGENDAMENTO",
    "NOTA FISCAL",
    "LOJA",
    "OM",
    "PEDIDO DE COMPRAS",
    "SERVIÇO",
    "VALOR DA NF",
    "DATA EMISSÃO",
    "RECEBIDO",
    "COORDENADOR",
    "CLIENTE",
    "OS Nº",
  ];

  const linhasCsv = dados.map((item) => {
    const servicos = formatarServicosExcel(item).replace(/"/g, '""');
    const valorNf = Number(item.EMP_VALOR || 0).toFixed(2).replace(".", ",");
    const valorRec = Number(item.VALOR_RECEBIDO || 0).toFixed(2).replace(".", ",");

    return [
      `"${item.EMP_PROTOCOLO || ""}"`,
      `"${item.EMP_NFS || ""}"`,
      `"${item.EMP_LOJA || ""}"`,
      `"${item.ORD_OM || ""}"`,
      `"${item.EMP_PEDIDO || ""}"`,
      `"${servicos}"`,
      `"${valorNf}"`,
      `"${formatarData(item.EMP_DATA_EMISSAO)}"`,
      `"${valorRec}"`,
      `"${item.EMP_COORDENADOR || ""}"`,
      `"${item.CLI_NOME || ""}"`,
      `"${item.EMP_ORD || ""}"`,
    ].join(";");
  });

  const conteudoCsv = "\uFEFF" + [cabecalhos.join(";"), ...linhasCsv].join("\r\n");
  const blob = new Blob([conteudoCsv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${nomeArquivo}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
