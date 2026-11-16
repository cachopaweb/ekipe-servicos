import { FormatDate, GeraCodigo } from "../functions/utils";
import EmpreitadasServicosModel from "../models/empreitada_servicos_model";
import EmpreitadasModel from "../models/empreitadas_model";
import api from "../services/api";

function escapeSql(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return "";
  return String(str).replace(/'/g, "''");
}

export default class EmpreitadasRepository {
  async buscaEmpreitadas(codigo: number): Promise<EmpreitadasModel[]> {
    const sql = `
      SELECT 
        EMP.EMP_CODIGO,
        EMP.EMP_ORD,
        EMP.EMP_FOR,
        FORN.FOR_NOME,
        EMP.EMP_OBS,
        EMP.EMP_LOCAL_EXECUCAO_SERVICOS,
        EMP.EMP_NFS,
        EMP.EMP_PROTOCOLO,
        EMP.EMP_LOJA,
        EMP.EMP_PEDIDO,
        EMP.EMP_VALOR,
        EMP.EMP_DATA_EMISSAO,
        EMP.EMP_FUN,
        EMP.EMP_COORDENADOR,
        EMP.EMP_FAT,
        (
          SELECT FIRST 1 LRC.LRC_FAT2
          FROM LANCAMENTO_REC_CUS LRC
          WHERE LRC.LRC_TIPO = 'C'
            AND LRC.LRC_CLI_FOR = EMP.EMP_FOR
            AND LRC.LRC_FAT2 = EMP.EMP_FAT
        ) AS LRC_FAT2,
        COALESCE((
          SELECT SUM(PAG.PAG_VALOR)
          FROM PAGAMENTOS PAG
          WHERE PAG.PAG_FAT2 = EMP.EMP_FAT
            AND PAG.PAG_ESTADO = 3
            AND (PAG.PAG_SITUACAO IS NULL OR PAG.PAG_SITUACAO <> -1)
        ), 0) AS VALOR_RECEBIDO
      FROM EMPREITADAS EMP
      LEFT JOIN FORNECEDORES FORN ON EMP.EMP_FOR = FORN.FOR_CODIGO
      WHERE EMP.EMP_ORD = ${codigo}
      ORDER BY EMP.EMP_CODIGO
    `;
    try {
      const response = await api.post("/dataset", { sql });
      let data: EmpreitadasModel[] = [];
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data && typeof response.data === "object" && Object.keys(response.data).length > 0) {
        data = [response.data];
      }
      return data;
    } catch (e) {
      throw new Error("Erro ao buscar Empreitadas: " + String(e));
    }
  }

  async buscaEmpreitadaById(id: number): Promise<EmpreitadasModel> {
    const sql = `
      SELECT 
        EMP.EMP_CODIGO,
        EMP.EMP_ORD,
        EMP.EMP_FOR,
        FORN.FOR_NOME,
        EMP.EMP_OBS,
        EMP.EMP_LOCAL_EXECUCAO_SERVICOS,
        EMP.EMP_NFS,
        EMP.EMP_PROTOCOLO,
        EMP.EMP_LOJA,
        EMP.EMP_PEDIDO,
        EMP.EMP_VALOR,
        EMP.EMP_DATA_EMISSAO,
        EMP.EMP_FUN,
        EMP.EMP_COORDENADOR,
        EMP.EMP_FAT,
        (
          SELECT FIRST 1 LRC.LRC_FAT2
          FROM LANCAMENTO_REC_CUS LRC
          WHERE LRC.LRC_TIPO = 'C'
            AND LRC.LRC_CLI_FOR = EMP.EMP_FOR
            AND LRC.LRC_FAT2 = EMP.EMP_FAT
        ) AS LRC_FAT2,
        COALESCE((
          SELECT SUM(PAG.PAG_VALOR)
          FROM PAGAMENTOS PAG
          WHERE PAG.PAG_FAT2 = EMP.EMP_FAT
            AND PAG.PAG_ESTADO = 3
            AND (PAG.PAG_SITUACAO IS NULL OR PAG.PAG_SITUACAO <> -1)
        ), 0) AS VALOR_RECEBIDO
      FROM EMPREITADAS EMP
      LEFT JOIN FORNECEDORES FORN ON EMP.EMP_FOR = FORN.FOR_CODIGO
      WHERE EMP.EMP_CODIGO = ${id}
    `;
    try {
      const response = await api.post("/dataset", { sql });
      const data = Array.isArray(response.data) ? response.data[0] : response.data;
      return data as EmpreitadasModel;
    } catch (e) {
      throw new Error("Erro ao buscar Empreitada: " + String(e));
    }
  }

  async buscaServicosEmpreitadas(codigo: number): Promise<EmpreitadasServicosModel[]> {
    const sql = `
      SELECT 
        ES_CODIGO, 
        ES_EMP, 
        CAST(ES_DESCRICAO AS VARCHAR(1000)) AS DESCRICAO, 
        ES_VALOR, 
        ES_PRAZO_CONCLUSAO, 
        ES_QUANTIDADE, 
        CASE 
          WHEN COALESCE(ES_QUANTIDADE, 0) > 0 THEN ES_VALOR / ES_QUANTIDADE 
          ELSE ES_VALOR 
        END AS VLR_UNIT, 
        ES_UNIDADE 
      FROM EMPREITADAS_SERVICOS 
      WHERE ES_EMP = ${codigo} 
      ORDER BY ES_CODIGO
    `;
    try {
      const response = await api.post("/dataset", { sql });
      if (Array.isArray(response.data)) {
        return response.data as EmpreitadasServicosModel[];
      } else if (response.data && typeof response.data === "object" && Object.keys(response.data).length > 0) {
        return [response.data] as EmpreitadasServicosModel[];
      }
      return [];
    } catch (e) {
      throw new Error("Erro ao buscar Servicos Empreitadas: " + String(e));
    }
  }

  async insereEmpreitada(empreitada: EmpreitadasModel): Promise<number> {
    try {
      const codigo =
        empreitada.EMP_CODIGO && empreitada.EMP_CODIGO > 0
          ? empreitada.EMP_CODIGO
          : await GeraCodigo("EMPREITADAS", "EMP_CODIGO");

      let valor = empreitada.EMP_VALOR;
      if (valor === undefined || valor === null) {
        valor = empreitada.ITENS?.reduce((acc, it) => acc + (it.ES_VALOR || 0), 0) || 0;
      }

      const dataEmissaoSql = empreitada.EMP_DATA_EMISSAO
        ? `'${FormatDate(empreitada.EMP_DATA_EMISSAO)}'`
        : "NULL";

      const sql = `
        UPDATE OR INSERT INTO EMPREITADAS (
          EMP_CODIGO,
          EMP_ORD,
          EMP_FOR,
          EMP_FAT,
          EMP_OBS,
          EMP_LOCAL_EXECUCAO_SERVICOS,
          EMP_NFS,
          EMP_PROTOCOLO,
          EMP_LOJA,
          EMP_PEDIDO,
          EMP_VALOR,
          EMP_DATA_EMISSAO,
          EMP_FUN,
          EMP_COORDENADOR
        ) VALUES (
          ${codigo},
          ${empreitada.EMP_ORD},
          ${empreitada.EMP_FOR || 0},
          ${empreitada.EMP_FAT && empreitada.EMP_FAT > 0 ? empreitada.EMP_FAT : "NULL"},
          '${escapeSql(empreitada.EMP_OBS)}',
          '${escapeSql(empreitada.EMP_LOCAL_EXECUCAO_SERVICOS)}',
          '${escapeSql(empreitada.EMP_NFS)}',
          '${escapeSql(empreitada.EMP_PROTOCOLO)}',
          '${escapeSql(empreitada.EMP_LOJA)}',
          '${escapeSql(empreitada.EMP_PEDIDO)}',
          ${Number(valor).toFixed(2)},
          ${dataEmissaoSql},
          ${empreitada.EMP_FUN && empreitada.EMP_FUN > 0 ? empreitada.EMP_FUN : "NULL"},
          '${escapeSql(empreitada.EMP_COORDENADOR)}'
        ) MATCHING (EMP_CODIGO)
      `;

      const response = await api.post("/dataset", { sql });
      if (response.status !== 200) {
        throw new Error("Falha ao salvar cabeçalho da empreitada.");
      }

      if (empreitada.EMP_FAT && empreitada.EMP_FAT > 0) {
        const obsLrc = empreitada.EMP_NFS
          ? `OS ${empreitada.EMP_ORD} / NF ${empreitada.EMP_NFS}`
          : `OS ${empreitada.EMP_ORD}`;
        await api
          .post("/dataset", {
            sql: `UPDATE FATURAMENTO2 SET FAT2_VALOR = ${Number(valor).toFixed(2)} WHERE FAT2_CODIGO = ${empreitada.EMP_FAT}`,
          })
          .catch(() => {});
        await api
          .post("/dataset", {
            sql: `UPDATE LANCAMENTO_REC_CUS SET LRC_VALOR = ${Number(valor).toFixed(2)}, LRC_OBS = '${escapeSql(obsLrc)}' WHERE LRC_FAT2 = ${empreitada.EMP_FAT}`,
          })
          .catch(() => {});
      }

      if (empreitada.ITENS && empreitada.ITENS.length > 0) {
        await this.insereServicosEmpreitada(empreitada.ITENS, codigo);
      }

      return codigo;
    } catch (e) {
      throw new Error("Erro ao inserir Empreitada: " + String(e));
    }
  }

  async insereServicosEmpreitada(servicos: EmpreitadasServicosModel[], empCodigo?: number): Promise<boolean> {
    try {
      let proximoCodigo = await GeraCodigo("EMPREITADAS_SERVICOS", "ES_CODIGO");
      for (const item of servicos) {
        const isNovo = !item.ES_CODIGO || item.ES_CODIGO <= 0 || item.isNovo;
        const codServico = isNovo ? proximoCodigo++ : item.ES_CODIGO;
        item.ES_CODIGO = codServico;
        delete item.isNovo;
        const empId = empCodigo || item.ES_EMP;
        const valor = item.ES_VALOR ?? 0;
        const qtd = item.ES_QUANTIDADE ?? 1;
        const dataPrazo = item.ES_PRAZO_CONCLUSAO
          ? `'${FormatDate(item.ES_PRAZO_CONCLUSAO)}'`
          : "NULL";
        const desc = escapeSql(item.DESCRICAO);
        const unidade = escapeSql(item.ES_UNIDADE || "UN");

        await api.post("/dataset", {
          sql: `
            UPDATE OR INSERT INTO EMPREITADAS_SERVICOS (
              ES_CODIGO,
              ES_EMP,
              ES_DESCRICAO,
              ES_VALOR,
              ES_PRAZO_CONCLUSAO,
              ES_QUANTIDADE,
              ES_UNIDADE
            ) VALUES (
              ${codServico},
              ${empId},
              '${desc}',
              ${Number(valor).toFixed(2)},
              ${dataPrazo},
              ${qtd},
              '${unidade}'
            ) MATCHING (ES_CODIGO)
          `,
        });
      }
      return true;
    } catch (e) {
      throw new Error("Erro ao inserir serviços da empreitada: " + String(e));
    }
  }

  async deleteServicoEmpreitada(codigo: number): Promise<boolean> {
    try {
      const response = await api.post("/dataset", {
        sql: `DELETE FROM EMPREITADAS_SERVICOS WHERE ES_CODIGO = ${codigo}`,
      });
      return response.status === 200;
    } catch (e) {
      throw new Error("Erro ao excluir serviço da empreitada: " + String(e));
    }
  }

  async deleteEmpreitada(codigo: number): Promise<boolean> {
    try {
      const check = await api.post("/dataset", {
        sql: `SELECT EMP_FAT FROM EMPREITADAS WHERE EMP_CODIGO = ${codigo}`,
      });
      const row = Array.isArray(check.data) ? check.data[0] : check.data;
      if (row && row.EMP_FAT && Number(row.EMP_FAT) > 0) {
        throw new Error("Não é possível excluir uma empreitada faturada.");
      }
      await api.post("/dataset", {
        sql: `DELETE FROM EMPREITADAS_SERVICOS WHERE ES_EMP = ${codigo}`,
      });
      const response = await api.post("/dataset", {
        sql: `DELETE FROM EMPREITADAS WHERE EMP_CODIGO = ${codigo}`,
      });
      return response.status === 200;
    } catch (e) {
      throw new Error("Erro ao excluir empreitada: " + String(e));
    }
  }
}
