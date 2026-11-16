import { FormatDate, horaFormatadaDB } from "../functions/utils";
import OrdEstModel from "../models/ord_est_model";
import OrdSerModel from "../models/ord_ser_model";
import OrdemModel from "../models/ordem_model";
import api from "../services/api";

function parseListResponse<T>(data: any): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && Object.keys(data).length > 0) {
    return [data as T];
  }
  return [];
}

export default class OrdemRepository {
  async insereordem(ordem: OrdemModel): Promise<boolean> {
    const dataPrevisaoSql = ordem.ORD_PREVISAO_CONCLUSAO && ordem.ORD_PREVISAO_CONCLUSAO !== "1900-01-01"
      ? `'${FormatDate(ordem.ORD_PREVISAO_CONCLUSAO)}'`
      : "NULL";

    const sql = {
      sql: `UPDATE OR INSERT INTO ORDENS (ORD_CODIGO, ORD_DATA, ORD_VALOR, ORD_HORA, ORD_FUN, ORD_CLI, ORD_DATAC, ORD_OBS, ORD_ESTADO,
                 ORD_DESCONTO_P, ORD_DESCONTO_S, ORD_DEVOLUCAO_P, ORD_USADO, ORD_SOLICITACAO, ORD_OBS_ADM, ORD_NFS, ORD_FAT, ORD_FORNECEDOR, ORD_VALOR_DESCONTO, ORD_PORCENTAGEM_DESCONTO, ORD_TOTAL_SEM_DESCONTO,
                 ORD_OM, ORD_PEDIDO_COMPRA, ORD_PREVISAO_CONCLUSAO, ORD_JUSTIFICATIVA_ATRASO,
                 ORD_SOLICITANTE_ID, ORD_SOLICITANTE_NOME)
                 VALUES (${ordem.ORD_CODIGO}, '${FormatDate(ordem.ORD_DATA)}', ${ordem.ORD_VALOR}, '${
        ordem.ORD_HORA ? horaFormatadaDB(ordem.ORD_HORA) : horaFormatadaDB()
      }',
                 ${ordem.ORD_FUN}, ${ordem.ORD_CLI}, '${
        ordem.ORD_DATAC ? FormatDate(ordem.ORD_DATAC) : "1900-01-01"
      }', '${ordem.ORD_OBS.replace(/'/g, "''")}', '${ordem.ORD_ESTADO}', ${
        ordem.ORD_DESCONTO_P
      },
                 ${ordem.ORD_DESCONTO_S}, '${ordem.ORD_DEVOLUCAO_P.replace(
        /'/g,
        "''"
      )}', 0, '${ordem.ORD_SOLICITACAO.replace(/'/g, "''")}',
                 '${ordem.ORD_OBS_ADM.replace(/'/g, "''")}', '${ordem.ORD_NFS}', ${
        ordem.ORD_FAT ?? 0
      }, ${ordem.ORD_FORNECEDOR ?? 0}, ${ordem.ORD_VALOR_DESCONTO ?? 0}, ${
        ordem.ORD_PORCENTAGEM_DESCONTO ?? 0
      }, 
                 ${ordem.ORD_TOTAL_SEM_DESCONTO ?? 0},
                 '${(ordem.ORD_OM || "").replace(/'/g, "''")}',
                 '${(ordem.ORD_PEDIDO_COMPRA || "").replace(/'/g, "''")}',
                 ${dataPrevisaoSql},
                 '${(ordem.ORD_JUSTIFICATIVA_ATRASO || "").replace(/'/g, "''")}',
                 ${ordem.ORD_SOLICITANTE_ID && ordem.ORD_SOLICITANTE_ID > 0 ? ordem.ORD_SOLICITANTE_ID : "NULL"},
                 '${(ordem.ORD_SOLICITANTE_NOME || "").replace(/'/g, "''")}')
                 MATCHING (ORD_CODIGO)`,
    };
    try {
      const response = await api.post("/dataset", sql);
      return response.status === 200;
    } catch (e) {
      throw new Error("Erro ao inserir Ordem." + String(e));
    }
  }

  async insereServicos(codOrdem: number, servico: OrdSerModel): Promise<boolean> {
    const obj = {
      sql: `UPDATE OR INSERT INTO ORD_SER (OS_CODIGO, OS_ORD, OS_SER, OS_VALOR, OS_NOME, OS_TIPO, OS_VALORR, OS_UNIDADE_MED, OS_QUANTIDADE)
                 VALUES (${servico.OS_CODIGO}, ${codOrdem}, ${servico.OS_SER}, ${servico.OS_VALOR}, '${servico.OS_NOME.replace(
        /'/g,
        "''"
      )}', '1', 
                 ${servico.OS_VALOR}, '${servico.OS_UNIDADE_MED}', ${servico.OS_QUANTIDADE})  MATCHING (OS_CODIGO)`,
    };
    try {
      const response = await api.post("/dataset", obj);
      return response.status === 200;
    } catch (e) {
      throw new Error("Erro ao inserir Servicos ordem." + String(e));
    }
  }

  async insereProdutos(codOrdem: number, produto: OrdEstModel): Promise<boolean> {
    const obj = {
      sql: `UPDATE OR INSERT INTO ORD_EST (ORE_CODIGO, ORE_ORD, ORE_PRO, ORE_QUANTIDADE, ORE_VALOR, ORE_LUCRO, ORE_VALORR,
                 ORE_VALORL, ORE_VALORF, ORE_NOME, ORE_VALORC, ORE_VALORCM, ORE_ALIQICMS, ORE_EMBALAGEM)
                 VALUES (${produto.ORE_CODIGO}, ${codOrdem}, ${produto.ORE_PRO}, ${produto.ORE_QUANTIDADE}, ${produto.ORE_VALOR}, 0, ${produto.ORE_VALOR}, 0, 0,
                 '${produto.ORE_NOME.replace(/'/g, "''")}', 0, 0, 0, '${produto.ORE_EMBALAGEM}')
                 MATCHING (ORE_CODIGO)`,
    };
    try {
      const response = await api.post("/dataset", obj);
      return response.status === 200;
    } catch (e) {
      throw new Error("Erro ao inserir Produtos ordem." + String(e));
    }
  }

  async buscaOrdem(codigo: number): Promise<OrdemModel> {
    const sql = `SELECT ORD_CODIGO, ORD_DATA, ORD_HORA, ORD_DATAC, ORD_VALOR, ORD_FUN, CLI_CNPJ_CPF, ORD_CLI, CLI_NOME,
            CLI_FONE, CLI_CELULAR, CLI_EMAIL, CLI_BAIRRO, CLI_ENDERECO, CLI_NUMERO, ORD_OBS, ORD_ESTADO, CID_NOME, CID_UF,
            ORD_DESCONTO_P, ORD_DESCONTO_S, ORD_FAT, ORD_DEVOLUCAO_P, ORD_SOLICITACAO, ORD_OBS_ADM, 
            ORD_NFS, FUN_NOME, ORD_FORNECEDOR, ORD_VALOR_DESCONTO, ORD_PORCENTAGEM_DESCONTO, ORD_TOTAL_SEM_DESCONTO,
            ORD_OM, ORD_PEDIDO_COMPRA, ORD_PREVISAO_CONCLUSAO, ORD_JUSTIFICATIVA_ATRASO,
            ORD_SOLICITANTE_ID, ORD_SOLICITANTE_NOME
            FROM ORDENS JOIN CLIENTES ON ORD_CLI = CLI_CODIGO 
            LEFT JOIN FUNCIONARIOS ON FUN_CODIGO = ORD_FUN 
            LEFT JOIN CIDADES ON CID_CODIGO = CLI_CID
            WHERE ORD_CODIGO = ${codigo}`;
    const obj = {
      sql: sql,
    };
    try {
      const response = await api.post("/dataset", obj);
      const rows = parseListResponse<OrdemModel>(response.data);
      if (rows.length === 0) {
        throw new Error(`Ordem #${codigo} não encontrada.`);
      }
      return rows[0];
    } catch (e) {
      throw new Error("Erro ao buscar Ordem." + String(e));
    }
  }

  async buscaProdutosOrdem(codigo: number): Promise<OrdEstModel[]> {
    const sql = `SELECT ORE_CODIGO, ORE_ORD, ORE_PRO, ORE_QUANTIDADE, ORE_VALOR, ORE_LUCRO, ORE_VALORR, ORE_VALORL, 
        ORE_VALORF, ORE_NOME, ORE_VALORC, ORE_VALORCM, ORE_ALIQICMS, ORE_EMBALAGEM, PRO_DESCRICAO 
        FROM ORD_EST JOIN PRODUTOS ON ORE_PRO = PRO_CODIGO WHERE ORE_ORD = ${codigo} ORDER BY ORE_CODIGO`;

    const obj = {
      sql: sql,
    };
    try {
      const response = await api.post("/dataset", obj);
      return parseListResponse<OrdEstModel>(response.data);
    } catch (e) {
      throw new Error("Erro ao buscar Produtos da Ordem." + String(e));
    }
  }

  async buscaServicosOrdem(codigo: number): Promise<OrdSerModel[]> {
    const sql = `SELECT OS_CODIGO, OS_ORD, OS_SER, OS_VALOR, OS_NOME, OS_TIPO, 
            OS_VALORR, OS_UNIDADE_MED, OS_QUANTIDADE FROM ORD_SER 
            WHERE OS_ORD = ${codigo} ORDER BY OS_CODIGO`;

    const obj = {
      sql: sql,
    };
    try {
      const response = await api.post("/dataset", obj);
      return parseListResponse<OrdSerModel>(response.data);
    } catch (e) {
      throw new Error("Erro ao buscar Serviços da Ordem." + String(e));
    }
  }

  async pesquisaOrdem(
    textoBusca: string,
    tipoBusca: string,
    porPeriodo: boolean,
    status: string,
    data1: Date,
    data2: Date
  ): Promise<OrdemModel[]> {
    try {
      let SQL = `SELECT FIRST 50 ORD_CODIGO, ORD_DATA, ORD_VALOR, ORD_FUN, ORD_CLI, CLI_NOME, ORD_OBS, ORD_ESTADO, 
                   ORD_DESCONTO_P, ORD_DESCONTO_S, ORD_FAT, ORD_DEVOLUCAO_P, ORD_SOLICITACAO, ORD_OBS_ADM, ORD_NFS, FORN.FOR_NOME AS PARCEIRO,
                   ORD_OM, ORD_PEDIDO_COMPRA, ORD_PREVISAO_CONCLUSAO, ORD_JUSTIFICATIVA_ATRASO,
                   ORD_SOLICITANTE_ID, ORD_SOLICITANTE_NOME
                   FROM ORDENS JOIN CLIENTES ON ORD_CLI = CLI_CODIGO LEFT JOIN FORNECEDORES FORN ON ORD_FORNECEDOR = FORN.FOR_CODIGO  WHERE 1=1 [PERIODO][STATUS][BUSCA] 
                   ORDER BY [ORDEM]`;
      if (textoBusca != "") {
        switch (tipoBusca) {
          case "Nome": {
            SQL = SQL.replace("[BUSCA]", ` AND CLI_NOME LIKE '%${textoBusca}%'`);
            break;
          }
          case "Codigo": {
            SQL = SQL.replace("[BUSCA]", ` AND ORD_CODIGO LIKE '%${textoBusca}%'`);
            break;
          }
          case "Solicitacao": {
            SQL = SQL.replace(
              "[BUSCA]",
              ` AND ORD_SOLICITACAO LIKE '%${textoBusca}%'`
            );
            break;
          }
        }
      } else SQL = SQL.replace("[BUSCA]", "");
      if (porPeriodo)
        SQL = SQL.replace(
          "[PERIODO]",
          ` AND ORD_DATA BETWEEN '${FormatDate(data1)}' AND '${FormatDate(data2)}'`
        );
      else SQL = SQL.replace("[PERIODO]", "");
      if (status != "" && status != "TODOS")
        SQL = SQL.replace("[STATUS]", ` AND ORD_ESTADO = '${status}'`);
      else SQL = SQL.replace("[STATUS]", "");
      SQL = SQL.replace("[ORDEM]", "ORD_CODIGO DESC");
      console.log(SQL);
      const response = await api.post("/dataset", { sql: SQL });
      return parseListResponse<OrdemModel>(response.data);
    } catch (e) {
      throw new Error("Erro ao buscar Ordem" + String(e));
    }
  }

  async deleteServicoOrdemPorCodigo(codSer: number): Promise<boolean> {
    const sql = `DELETE FROM ORD_SER WHERE OS_CODIGO = ${codSer}`;
    try {
      const response = await api.post("/dataset", {
        sql: sql,
      });
      return response.status === 200;
    } catch (error) {
      throw new Error("erro ao deletar serviço");
    }
  }

  async buscaTotalPagoOS(ordCodigo: number): Promise<number> {
    if (!ordCodigo || ordCodigo <= 0) return 0;
    const sql = `
        SELECT COALESCE((
          SELECT SUM(REC.REC_VALOR)
          FROM RECEBIMENTOS REC
          WHERE (
              REC.REC_FAT IN (
                SELECT O.ORD_FAT
                FROM ORDENS O
                WHERE O.ORD_CODIGO = ${ordCodigo}
                  AND O.ORD_FAT IS NOT NULL
                  AND O.ORD_FAT > 0
              )
              OR REC.REC_FAT IN (
                SELECT PF.PF_FAT
                FROM PED_FAT PF
                WHERE PF.PF_COD_PED = ${ordCodigo}
                  AND PF.PF_TABELA = 'ORDENS'
              )
            )
            AND (REC.REC_SITUACAO IS NULL OR REC.REC_SITUACAO <> -1)
        ), 0) AS TOTAL_PAGO
        FROM RDB$DATABASE
    `;
    try {
      const response = await api.post("/dataset", { sql: sql });
      const rows = parseListResponse<any>(response.data);
      return Number(rows[0]?.TOTAL_PAGO || 0);
    } catch (e) {
      throw new Error("Erro ao buscar total pago da OS: " + String(e));
    }
  }

  async buscaTotalPagoEmpreitadasOS(ordCodigo: number): Promise<number> {
    if (!ordCodigo || ordCodigo <= 0) return 0;
    const sql = `
        SELECT COALESCE((
          SELECT SUM(PAG.PAG_VALOR)
          FROM PAGAMENTOS PAG
          WHERE PAG.PAG_ESTADO = 3
            AND (PAG.PAG_SITUACAO IS NULL OR PAG.PAG_SITUACAO <> -1)
            AND PAG.PAG_FAT2 IN (
              SELECT EMP.EMP_FAT
              FROM EMPREITADAS EMP
              WHERE EMP.EMP_ORD = ${ordCodigo}
                AND EMP.EMP_FAT IS NOT NULL
                AND EMP.EMP_FAT > 0
            )
        ), 0) AS TOTAL_PAGO_EMPREITADAS
        FROM RDB$DATABASE
    `;
    try {
      const response = await api.post("/dataset", { sql: sql });
      const rows = parseListResponse<any>(response.data);
      return Number(rows[0]?.TOTAL_PAGO_EMPREITADAS || 0);
    } catch (e) {
      throw new Error("Erro ao buscar total pago de empreitadas da OS: " + String(e));
    }
  }
}
