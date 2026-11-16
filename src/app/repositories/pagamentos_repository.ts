import { FormatDate, horaFormatadaDB, IncrementaGenerator } from "../functions/utils";
import PagamentosModel, {
  EstornarPagamentoParams,
  PagamentoEmpreitadaItem,
  RegistrarPagamentoParams,
} from "../models/pagamentos_model";
import api from "../services/api";

function escapeSql(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return "";
  return String(str).replace(/'/g, "''");
}

function getRows<T>(data: any): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && Object.keys(data).length > 0) return [data];
  return [];
}

export default class PagamentosRepository {
  async inserePagamentos(pagamentos: PagamentosModel): Promise<boolean> {
    try {
      const response = await api.post("/dataset", {
        sql: `UPDATE OR INSERT INTO PAGAMENTOS (PAG_CODIGO, PAG_VALOR, PAG_VENCIMENTO, PAG_JUROS, PAG_ESTADO, PAG_DUPLICATA, PAG_FPG,
                        PAG_FAT2, PAG_DESCONTOS, PAG_CAI, PAG_TIPO, PAG_SITUACAO, PAG_OBS, PAG_CON, PAG_DATAC)
                        VALUES (${pagamentos.PAG_CODIGO}, ${pagamentos.PAG_VALOR}, '${FormatDate(pagamentos.PAG_VENCIMENTO)}', ${pagamentos.PAG_JUROS}, ${pagamentos.PAG_ESTADO}, 
                                '${pagamentos.PAG_DUPLICATA}', ${pagamentos.PAG_FPG}, ${pagamentos.PAG_FAT2}, ${pagamentos.PAG_DESCONTOS}, ${pagamentos.PAG_CAI}, 
                                '${pagamentos.PAG_TIPO}', ${pagamentos.PAG_SITUACAO}, '${escapeSql(pagamentos.PAG_OBS ?? "")}', ${pagamentos.PAG_CON}, '${FormatDate(pagamentos.PAG_DATAC)}')
                        MATCHING (PAG_CODIGO)`,
      });
      return response.status === 200;
    } catch (e) {
      throw new Error("Erro ao inserir Pagamentos." + String(e));
    }
  }

  async buscaPagamentosEmpreitada(empFat: number): Promise<PagamentoEmpreitadaItem[]> {
    if (!empFat || empFat <= 0) return [];
    try {
      const sql = `
        SELECT 
          PAG.PAG_CODIGO,
          PAG.PAG_VALOR,
          PAG.PAG_VENCIMENTO,
          PAG.PAG_JUROS,
          PAG.PAG_ESTADO,
          PAG.PAG_DUPLICATA,
          PAG.PAG_FPG,
          PAG.PAG_FAT2,
          PAG.PAG_DESCONTOS,
          PAG.PAG_CAI,
          PAG.PAG_TIPO,
          PAG.PAG_SITUACAO,
          PAG.PAG_OBS,
          PGM.PP_CODIGO,
          PGM.PP_DATAPGM,
          PGM.PP_DINHEIRO,
          PGM.PP_HORA
        FROM PAGAMENTOS PAG
        LEFT JOIN PAG_PGM PGM ON PGM.PP_PAG = PAG.PAG_CODIGO
        WHERE PAG.PAG_FAT2 = ${empFat}
        ORDER BY PAG.PAG_CODIGO ASC
      `;
      const response = await api.post("/dataset", { sql });
      return getRows<PagamentoEmpreitadaItem>(response.data);
    } catch (e) {
      throw new Error("Erro ao buscar pagamentos da empreitada: " + String(e));
    }
  }

  async buscaTotalPagoOS(ordCodigo: number): Promise<number> {
    if (!ordCodigo || ordCodigo <= 0) return 0;
    try {
      const sql = `
        SELECT COALESCE(SUM(PAG.PAG_VALOR), 0) AS TOTAL_PAGO
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
      `;
      const response = await api.post("/dataset", { sql });
      const rows = getRows<any>(response.data);
      return Number(rows[0]?.TOTAL_PAGO || 0);
    } catch (e) {
      throw new Error("Erro ao buscar total pago da OS: " + String(e));
    }
  }

  async registrarPagamentoEmpreitada(
    params: RegistrarPagamentoParams
  ): Promise<{ codPag: number; codFat: number; success: boolean; isDuplicate: boolean }> {
    const valorCentavos = Math.round((params.valor || 0) * 100);
    if (valorCentavos <= 0) {
      throw new Error("O valor do pagamento deve ser maior que zero.");
    }
    const valorFixed = valorCentavos / 100;
    const dataFormatada = FormatDate(params.data || new Date());

    try {
      let currentFat = params.empFat;

      // Se a empreitada ainda não tiver vínculo financeiro (EMP_FAT), inicializa o faturamento
      if (!currentFat || currentFat <= 0) {
        currentFat = await IncrementaGenerator("GEN_FAT2");
        const empCheck = await api.post("/dataset", {
          sql: `SELECT EMP_VALOR, EMP_NFS FROM EMPREITADAS WHERE EMP_CODIGO = ${params.empCodigo}`,
        });
        const empRow = getRows<any>(empCheck.data)[0];
        const valorTotalEmp = Math.max(Number(empRow?.EMP_VALOR || 0), valorFixed);
        const obsLrc = empRow?.EMP_NFS
          ? `OS ${params.ordCodigo} / NF ${empRow.EMP_NFS}`
          : `OS ${params.ordCodigo}`;

        await api.post("/dataset", {
          sql: `UPDATE EMPREITADAS SET EMP_FAT = ${currentFat} WHERE EMP_CODIGO = ${params.empCodigo}`,
        });

        // Insere registro no faturamento2
        await api.post("/dataset", {
          sql: `INSERT INTO FATURAMENTO2 (FAT2_CODIGO, FAT2_VALOR, FAT2_TIPO, FAT2_TIPOPGM, FAT2_PARCELAS, FAT2_DATA, FAT2_COD_FDTF)
                VALUES (${currentFat}, ${valorTotalEmp}, 2, 2, 1, '${dataFormatada}', ${params.empFor || 1})`,
        });

        // Insere registro em LANCAMENTO_REC_CUS para visibilidade do financeiro
        const codLrc = await IncrementaGenerator("GEN_LRC");
        await api.post("/dataset", {
          sql: `INSERT INTO LANCAMENTO_REC_CUS (LRC_CODIGO, LRC_CLI_FOR, LRC_DATA, LRC_FAT, LRC_FAT2, LRC_FUN, LRC_HISTORICO, LRC_OBS, LRC_TIPO, LRC_VALOR, LRC_DATAC)
                VALUES (${codLrc}, ${params.empFor || 1}, '${dataFormatada}', 0, ${currentFat}, ${params.funCodigo || 1}, 'Empreitada da OS ${params.ordCodigo}', '${escapeSql(obsLrc)}', 'C', ${valorTotalEmp}, '1900-01-01')`,
        });
      }

      // Idempotência: verificar se operação com este idempotencyKey já foi registrada (A12)
      if (params.idempotencyKey) {
        const checkSql = `
          SELECT FIRST 1 PAG_CODIGO, PAG_VALOR, PAG_FAT2
          FROM PAGAMENTOS
          WHERE PAG_FAT2 = ${currentFat}
            AND PAG_OBS LIKE '%[IDEMP:${escapeSql(params.idempotencyKey)}]%'
        `;
        const checkRes = await api.post("/dataset", { sql: checkSql });
        const existing = getRows<any>(checkRes.data)[0];
        if (existing && existing.PAG_CODIGO) {
          return {
            codPag: existing.PAG_CODIGO,
            codFat: currentFat,
            success: true,
            isDuplicate: true,
          };
        }
      }

      // Gera código para o pagamento
      const codPag = await IncrementaGenerator("GEN_PAG");
      const duplicata = params.duplicata || `Baixa ${codPag}`;
      const obsTexto = params.idempotencyKey
        ? `[IDEMP:${params.idempotencyKey}] ${params.obs || ""}`.trim()
        : params.obs || "";

      // Insere na tabela PAGAMENTOS (PAG_ESTADO = 3 -> Quitado/Pago)
      await api.post("/dataset", {
        sql: `INSERT INTO PAGAMENTOS (
          PAG_CODIGO, PAG_VALOR, PAG_VENCIMENTO, PAG_ESTADO, PAG_DUPLICATA, PAG_TIPO,
          PAG_FAT2, PAG_OBS, PAG_CAI, PAG_FPG, PAG_CON, PAG_DATAC, PAG_SITUACAO, PAG_JUROS, PAG_DESCONTOS
        ) VALUES (
          ${codPag}, ${valorFixed}, '${dataFormatada}', 3, '${escapeSql(duplicata)}', '${escapeSql(params.formaPgm || "DINHEIRO")}',
          ${currentFat}, '${escapeSql(obsTexto)}', 2, 1, -1, '1900-01-01', 0, 0, 0
        )`,
      });

      // Insere na tabela PAG_PGM (evento de saída financeira)
      const codPP = await IncrementaGenerator("GEN_PP");
      await api.post("/dataset", {
        sql: `INSERT INTO PAG_PGM (
          PP_CODIGO, PP_DATAPGM, PP_DINHEIRO, PP_CHEQUE, PP_PAG, PP_HORA, PP_CAI, PP_FUN, PP_JUROS, PP_DESCONTOS
        ) VALUES (
          ${codPP}, '${dataFormatada}', ${valorFixed}, 0, ${codPag}, '${horaFormatadaDB()}', 2, ${params.funCodigo || 1}, 0, 0
        )`,
      });

      return {
        codPag,
        codFat: currentFat,
        success: true,
        isDuplicate: false,
      };
    } catch (e) {
      throw new Error("Erro ao registrar pagamento da empreitada: " + String(e));
    }
  }

  async estornarPagamentoEmpreitada(params: EstornarPagamentoParams): Promise<boolean> {
    try {
      const motivoFormatado = `[ESTORNADO em ${FormatDate(new Date())}: ${escapeSql(params.motivo)}]`;
      await api.post("/dataset", {
        sql: `UPDATE PAGAMENTOS 
              SET PAG_ESTADO = 1, 
                  PAG_SITUACAO = -1, 
                  PAG_OBS = COALESCE(PAG_OBS, '') || ' ${motivoFormatado}' 
              WHERE PAG_CODIGO = ${params.codPag}`,
      });

      await api.post("/dataset", {
        sql: `UPDATE PAG_PGM 
              SET PP_DINHEIRO = 0 
              WHERE PP_PAG = ${params.codPag}`,
      });

      return true;
    } catch (e) {
      throw new Error("Erro ao estornar pagamento: " + String(e));
    }
  }

  async darBaixaParcelaEmpreitada(params: {
    codPag: number;
    valor?: number;
    data?: string | Date;
    formaPgm?: string;
    funCodigo?: number;
  }): Promise<boolean> {
    try {
      const dataFormatada = FormatDate(params.data || new Date());
      await api.post("/dataset", {
        sql: `UPDATE PAGAMENTOS 
              SET PAG_ESTADO = 3, 
                  PAG_SITUACAO = 0 
              WHERE PAG_CODIGO = ${params.codPag}`,
      });

      const checkPgm = await api.post("/dataset", {
        sql: `SELECT FIRST 1 PP_CODIGO FROM PAG_PGM WHERE PP_PAG = ${params.codPag}`,
      });
      const pgmRows = getRows<any>(checkPgm.data);

      if (pgmRows.length > 0 && pgmRows[0].PP_CODIGO) {
        await api.post("/dataset", {
          sql: `UPDATE PAG_PGM 
                SET PP_DATAPGM = '${dataFormatada}', 
                    PP_DINHEIRO = ${params.valor || 0}, 
                    PP_HORA = '${horaFormatadaDB()}' 
                WHERE PP_PAG = ${params.codPag}`,
        });
      } else {
        const codPP = await IncrementaGenerator("GEN_PP");
        await api.post("/dataset", {
          sql: `INSERT INTO PAG_PGM (
            PP_CODIGO, PP_DATAPGM, PP_DINHEIRO, PP_CHEQUE, PP_PAG, PP_HORA, PP_CAI, PP_FUN, PP_JUROS, PP_DESCONTOS
          ) VALUES (
            ${codPP}, '${dataFormatada}', ${params.valor || 0}, 0, ${params.codPag}, '${horaFormatadaDB()}', 2, ${params.funCodigo || 1}, 0, 0
          )`,
        });
      }

      return true;
    } catch (e) {
      throw new Error("Erro ao dar baixa na parcela: " + String(e));
    }
  }
}
