import api from "../services/api";
import { ItemRelatorioEmpreitada, FiltroRelatorioParams } from "../models/relatorio_model";
import EmpreitadasServicosModel from "../models/empreitada_servicos_model";

export default class RelatorioRepository {
  async getRelatorioEmpreitadas(filtros: FiltroRelatorioParams): Promise<ItemRelatorioEmpreitada[]> {
    const whereClauses: string[] = [];

    if (filtros.dataInicio && filtros.dataFim) {
      whereClauses.push(
        `(EMP.EMP_DATA_EMISSAO BETWEEN '${filtros.dataInicio}' AND '${filtros.dataFim}' OR (EMP.EMP_DATA_EMISSAO IS NULL AND ORD.ORD_DATA BETWEEN '${filtros.dataInicio}' AND '${filtros.dataFim}'))`
      );
    } else if (filtros.dataInicio) {
      whereClauses.push(
        `(EMP.EMP_DATA_EMISSAO >= '${filtros.dataInicio}' OR (EMP.EMP_DATA_EMISSAO IS NULL AND ORD.ORD_DATA >= '${filtros.dataInicio}'))`
      );
    } else if (filtros.dataFim) {
      whereClauses.push(
        `(EMP.EMP_DATA_EMISSAO <= '${filtros.dataFim}' OR (EMP.EMP_DATA_EMISSAO IS NULL AND ORD.ORD_DATA <= '${filtros.dataFim}'))`
      );
    }

    if (filtros.clienteId && filtros.clienteId > 0) {
      whereClauses.push(`ORD.ORD_CLI = ${filtros.clienteId}`);
    }

    if (filtros.coordenador && filtros.coordenador.trim()) {
      const coordEscaped = filtros.coordenador.replace(/'/g, "''").trim().toUpperCase();
      whereClauses.push(`UPPER(TRIM(EMP.EMP_COORDENADOR)) = '${coordEscaped}'`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const sql = `
      SELECT 
        EMP.EMP_CODIGO,
        EMP.EMP_ORD,
        EMP.EMP_PROTOCOLO,
        EMP.EMP_NFS,
        EMP.EMP_LOJA,
        EMP.EMP_PEDIDO,
        COALESCE(EMP.EMP_VALOR, 0) AS EMP_VALOR,
        EMP.EMP_DATA_EMISSAO,
        EMP.EMP_COORDENADOR,
        ORD.ORD_OM,
        ORD.ORD_CLI,
        CLI.CLI_NOME,
        COALESCE((
          SELECT SUM(PAG.PAG_VALOR)
          FROM PAGAMENTOS PAG
          WHERE PAG.PAG_FAT2 = EMP.EMP_FAT
            AND PAG.PAG_ESTADO = 3
            AND (PAG.PAG_SITUACAO IS NULL OR PAG.PAG_SITUACAO <> -1)
        ), 0) AS VALOR_RECEBIDO
      FROM EMPREITADAS EMP
      JOIN ORDENS ORD ON EMP.EMP_ORD = ORD.ORD_CODIGO
      LEFT JOIN CLIENTES CLI ON ORD.ORD_CLI = CLI.CLI_CODIGO
      ${whereSql}
      ORDER BY EMP.EMP_DATA_EMISSAO DESC, EMP.EMP_CODIGO DESC
    `;

    try {
      const response = await api.post("/dataset", { sql });
      let lista: ItemRelatorioEmpreitada[] = [];

      if (Array.isArray(response.data)) {
        lista = response.data;
      } else if (response.data && typeof response.data === "object" && Object.keys(response.data).length > 0) {
        lista = [response.data];
      }

      if (lista.length === 0) return [];

      // Busca os serviços vinculados para cada empreitada em lote
      const codigos = lista.map((item) => item.EMP_CODIGO).filter(Boolean);
      if (codigos.length > 0) {
        const codigosIn = codigos.join(",");
        const sqlServicos = `
          SELECT 
            ES_CODIGO, 
            ES_EMP, 
            CAST(ES_DESCRICAO AS VARCHAR(1000)) AS DESCRICAO, 
            ES_VALOR, 
            ES_QUANTIDADE, 
            ES_UNIDADE 
          FROM EMPREITADAS_SERVICOS 
          WHERE ES_EMP IN (${codigosIn}) 
          ORDER BY ES_CODIGO
        `;

        try {
          const resServicos = await api.post("/dataset", { sql: sqlServicos });
          let todosServicos: EmpreitadasServicosModel[] = [];
          if (Array.isArray(resServicos.data)) {
            todosServicos = resServicos.data;
          } else if (resServicos.data && typeof resServicos.data === "object" && Object.keys(resServicos.data).length > 0) {
            todosServicos = [resServicos.data];
          }

          const mapServicos = new Map<number, EmpreitadasServicosModel[]>();
          for (const s of todosServicos) {
            const list = mapServicos.get(s.ES_EMP) || [];
            list.push(s);
            mapServicos.set(s.ES_EMP, list);
          }

          for (const item of lista) {
            item.ITENS = mapServicos.get(item.EMP_CODIGO) || [];
          }
        } catch (eServ) {
          console.error("Erro ao carregar serviços das empreitadas:", eServ);
        }
      }

      return lista;
    } catch (error) {
      throw new Error("Erro ao buscar dados do relatório: " + String(error));
    }
  }

  async getClientesParaRelatorio(): Promise<{ CODIGO: number; NOME: string }[]> {
    const sql = `
      SELECT DISTINCT CLI.CLI_CODIGO AS CODIGO, CLI.CLI_NOME AS NOME
      FROM CLIENTES CLI
      JOIN ORDENS ORD ON ORD.ORD_CLI = CLI.CLI_CODIGO
      JOIN EMPREITADAS EMP ON EMP.EMP_ORD = ORD.ORD_CODIGO
      WHERE CLI.CLI_NOME IS NOT NULL
      ORDER BY CLI.CLI_NOME
    `;
    try {
      const response = await api.post("/dataset", { sql });
      if (Array.isArray(response.data)) return response.data;
      if (response.data && typeof response.data === "object" && Object.keys(response.data).length > 0) {
        return [response.data];
      }
      return [];
    } catch {
      return [];
    }
  }

  async getCoordenadoresParaRelatorio(): Promise<string[]> {
    const sql = `
      SELECT DISTINCT TRIM(UPPER(EMP_COORDENADOR)) AS COORD
      FROM EMPREITADAS
      WHERE EMP_COORDENADOR IS NOT NULL AND TRIM(EMP_COORDENADOR) <> ''
      ORDER BY 1
    `;
    try {
      const response = await api.post("/dataset", { sql });
      let lista: any[] = [];
      if (Array.isArray(response.data)) lista = response.data;
      else if (response.data && typeof response.data === "object" && Object.keys(response.data).length > 0) {
        lista = [response.data];
      }
      return lista.map((x) => String(x.COORD || "").trim()).filter(Boolean);
    } catch {
      return [];
    }
  }
}
