import api from "../services/api";
import { SolicitanteModel } from "../models/solicitante_model";

export default class SolicitanteRepository {
  async getSolicitantes(): Promise<SolicitanteModel[]> {
    try {
      const sql = `
        SELECT SOL_CODIGO, SOL_NOME, SOL_TELEFONE, SOL_REGIAO, SOL_ATIVO
        FROM SOLICITANTES
        WHERE SOL_ATIVO = 'S'
        ORDER BY SOL_NOME ASC
      `;
      const response = await api.post("/dataset", { sql });
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && response.data.SOL_CODIGO) {
        return [response.data];
      }
      return [];
    } catch (error) {
      console.error("Erro ao buscar solicitantes:", error);
      return [];
    }
  }

  async salvaSolicitante(model: Partial<SolicitanteModel>): Promise<SolicitanteModel> {
    try {
      let codigo = model.SOL_CODIGO || 0;
      if (!codigo || codigo <= 0) {
        const resMax = await api.post("/dataset", {
          sql: "SELECT COALESCE(MAX(SOL_CODIGO), 0) + 1 AS NOVO_COD FROM SOLICITANTES",
        });
        const maxVal = Array.isArray(resMax.data)
          ? resMax.data[0]?.NOVO_COD
          : resMax.data?.NOVO_COD;
        codigo = parseInt(String(maxVal || 1), 10);
      }

      const nomeLimpo = (model.SOL_NOME || "").trim().toUpperCase().replace(/'/g, "''");
      const foneLimpo = (model.SOL_TELEFONE || "").trim().replace(/'/g, "''");
      const regiaoLimpo = (model.SOL_REGIAO || "").trim().toUpperCase().replace(/'/g, "''");

      const sql = `
        UPDATE OR INSERT INTO SOLICITANTES (
          SOL_CODIGO,
          SOL_NOME,
          SOL_TELEFONE,
          SOL_REGIAO,
          SOL_ATIVO
        ) VALUES (
          ${codigo},
          '${nomeLimpo}',
          '${foneLimpo}',
          '${regiaoLimpo}',
          'S'
        ) MATCHING (SOL_CODIGO)
      `;

      await api.post("/dataset", { sql });

      return {
        SOL_CODIGO: codigo,
        SOL_NOME: (model.SOL_NOME || "").trim().toUpperCase(),
        SOL_TELEFONE: model.SOL_TELEFONE || "",
        SOL_REGIAO: (model.SOL_REGIAO || "").trim().toUpperCase(),
        SOL_ATIVO: "S",
      };
    } catch (error) {
      console.error("Erro ao salvar solicitante:", error);
      throw new Error("Não foi possível salvar o solicitante.");
    }
  }
}
