import {
  dataHoraFormatadaDB,
  escapeSql,
  FormatDate,
  horaFormatadaDB,
  IncrementaGenerator,
} from "../functions/utils";
import recebimentosModel from "../models/recebimentos_model";
import api from "../services/api";
import CaixaRepository from "./caixa_repository";
import MovimentacoesRepository from "./movimentacoes_repository";
import RecPgmRepository from "./rec_pgm_repository";

export interface DarBaixaRecebimentoParams {
  recebimento: recebimentosModel;
  dataPagamento: string | Date;
  formaPgm: string;
  clienteNome: string;
  funCodigo?: number;
}

export default class RecebimentosRepository {
  async insererecebimentos(recebimentos: recebimentosModel): Promise<boolean> {
    try {
      const response = await api.post("/dataset", {
        sql: `UPDATE OR INSERT INTO RECEBIMENTOS (REC_CODIGO, REC_VALOR, REC_VENCIMENTO, REC_ESTADO, REC_DUPLICATA, 
                        REC_FPG, REC_FAT, REC_JUROS, REC_DESCONTOS, REC_CAI, REC_TIPO, REC_CON, REC_DATAR, REC_SITUACAO,
                        REC_DESCONTADO, REC_OBS)
                        VALUES (${recebimentos.REC_CODIGO}, ${recebimentos.REC_VALOR}, '${FormatDate(recebimentos.REC_VENCIMENTO)}', '${recebimentos.REC_ESTADO}', 
                                '${escapeSql(recebimentos.REC_DUPLICATA)}', ${recebimentos.REC_FPG}, ${recebimentos.REC_FAT}, ${recebimentos.REC_JUROS},
                                ${recebimentos.REC_DESCONTOS}, ${recebimentos.REC_CAI}, '${escapeSql(recebimentos.REC_TIPO)}', ${recebimentos.REC_CON}, 
                                '${FormatDate(recebimentos.REC_DATAR)}', ${recebimentos.REC_SITUACAO}, '${escapeSql(recebimentos.REC_DESCONTADO)}', '${escapeSql(recebimentos.REC_OBS ?? "")}')
                        MATCHING (REC_CODIGO)`,
      });
      return response.status === 200;
    } catch (e) {
      throw new Error("Erro ao inserir recebimentos." + String(e));
    }
  }

  async getRecebimentosByFatura(codFatura: number): Promise<recebimentosModel[]> {
    if (!codFatura || codFatura <= 0) return [];
    try {
      const response = await api.post("/dataset", {
        sql: `SELECT * FROM RECEBIMENTOS WHERE REC_FAT = ${codFatura} ORDER BY REC_DUPLICATA, REC_CODIGO`,
      });
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (
        response.data &&
        typeof response.data === "object" &&
        Object.keys(response.data).length > 0
      ) {
        return [response.data];
      }
      return [];
    } catch (e) {
      console.error("Erro ao buscar recebimentos da fatura:", e);
      return [];
    }
  }

  async darBaixaRecebimento(params: DarBaixaRecebimentoParams): Promise<boolean> {
    const { recebimento, dataPagamento, formaPgm, clienteNome, funCodigo = 1 } = params;
    if (!recebimento || !recebimento.REC_CODIGO) {
      throw new Error("Recebimento inválido para baixa.");
    }
    if (Number(recebimento.REC_ESTADO) === 3) {
      return true;
    }

    try {
      const dataFormatada = FormatDate(dataPagamento || new Date());
      const valorRecebido = Number(recebimento.REC_VALOR) || 0;
      const formaLimpa = (formaPgm || recebimento.REC_TIPO || "DINHEIRO").trim();

      const caixaRepo = new CaixaRepository();
      const caixa = await caixaRepo.getCodCaixa(1);
      const caiCodigo = caixa?.CAI_CODIGO || recebimento.REC_CAI || 1;

      // Busca PF_CODIGO separado (UnitDataset.Controller executa Open() se houver 'SELECT' no SQL)
      const pedFatRes = await api.post("/dataset", {
        sql: `SELECT FIRST 1 PF_CODIGO FROM PED_FAT WHERE PF_FAT = ${recebimento.REC_FAT}`,
      });
      const pfCodigo = Array.isArray(pedFatRes.data)
        ? Number(pedFatRes.data[0]?.PF_CODIGO || 0)
        : Number(pedFatRes.data?.PF_CODIGO || 0);

      const checkPgm = await api.post("/dataset", {
        sql: `SELECT FIRST 1 RP_CODIGO FROM REC_PGM WHERE RP_REC = ${recebimento.REC_CODIGO}`,
      });
      const hasExistingPgm =
        Array.isArray(checkPgm.data)
          ? checkPgm.data.length > 0 && Boolean(checkPgm.data[0]?.RP_CODIGO)
          : Boolean(checkPgm.data && typeof checkPgm.data === "object" && checkPgm.data.RP_CODIGO);

      // 1. Atualiza o título em RECEBIMENTOS para pago (REC_ESTADO = 3)
      await api.post("/dataset", {
        sql: `UPDATE RECEBIMENTOS
              SET REC_ESTADO = 3,
                  REC_SITUACAO = 0,
                  REC_DATAR = '${dataFormatada}',
                  REC_TIPO = '${escapeSql(formaLimpa)}'
              WHERE REC_CODIGO = ${recebimento.REC_CODIGO}`,
      });

      // 2. Atualiza a parcela correspondente em PF_PARCELA (sem subquery SELECT)
      if (pfCodigo > 0) {
        await api.post("/dataset", {
          sql: `UPDATE PF_PARCELA
                SET PP_ESTADO = 3,
                    PP_VALORPG = ${valorRecebido}
                WHERE PP_DUPLICATA = '${escapeSql(recebimento.REC_DUPLICATA)}'
                  AND PP_PF = ${pfCodigo}`,
        });
      }

      // 3. Registra entrada no Caixa (MOVIMENTACOES)
      const codMov = await IncrementaGenerator("GEN_MOV");
      const movRepo = new MovimentacoesRepository();
      await movRepo.insereMovimentacoes({
        MOV_CODIGO: codMov,
        MOV_CAI: caiCodigo,
        MOV_CON: 0,
        MOV_CREDITO: valorRecebido,
        MOV_DEBITO: 0,
        MOV_DATA: dataFormatada,
        MOV_DATAHORA: dataHoraFormatadaDB(),
        MOV_DESCRICAO: `OS - ${recebimento.REC_FAT} - ${clienteNome || ""}`,
        MOV_ESTADO: "A",
        MOV_NOME: "ORDEM",
        MOV_ORDENA: codMov,
        MOV_PLANO: "1.6",
        MOV_SALDOANT: caixa?.CAI_VALORD || 0,
        MOV_TIPO: 2,
        MOV_TROCO: 0,
        PDV: 1,
      });

      // 4. Atualiza REC_PGM existente (criado zerado no faturamento à prazo) ou cria um novo
      if (hasExistingPgm) {
        await api.post("/dataset", {
          sql: `UPDATE REC_PGM
                SET RP_DATAPGM = '${dataFormatada}',
                    RP_DINHEIRO = ${valorRecebido},
                    RP_CHEQUE = 0,
                    RP_HORA = '${horaFormatadaDB()}',
                    RP_FUN = ${funCodigo},
                    RP_CAI = ${caiCodigo},
                    RP_MOV = ${codMov},
                    RP_JUROS = ${Number(recebimento.REC_JUROS) || 0},
                    RP_DESCONTOS = ${Number(recebimento.REC_DESCONTOS) || 0}
                WHERE RP_REC = ${recebimento.REC_CODIGO}`,
        });
      } else {
        const codRecPgm = await IncrementaGenerator("GEN_RR");
        const recPgmRepo = new RecPgmRepository();
        await recPgmRepo.insereRecPgm({
          RP_CODIGO: codRecPgm,
          RP_DATAPGM: dataFormatada,
          RP_DINHEIRO: valorRecebido,
          RP_CHEQUE: 0,
          RP_REC: recebimento.REC_CODIGO,
          RP_CAI: caiCodigo,
          RP_DESCONTOS: Number(recebimento.REC_DESCONTOS) || 0,
          RP_FUN: funCodigo,
          RP_HORA: horaFormatadaDB(),
          RP_JUROS: Number(recebimento.REC_JUROS) || 0,
          RP_MOV: codMov,
        });
      }

      return true;
    } catch (e) {
      throw new Error("Erro ao dar baixa no recebimento: " + String(e));
    }
  }
}
