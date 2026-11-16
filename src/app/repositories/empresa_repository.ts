import api from "../services/api";
import EmpresaModel from "../models/empresa_model";

export default class EmpresaRepository {
  async getDadosEmpresa(): Promise<EmpresaModel | null> {
    try {
      const response = await api.post("/dataset", {
        sql: "SELECT FIRST 1 * FROM EMPRESA",
      });
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data[0];
      }
      if (
        response.data &&
        typeof response.data === "object" &&
        Object.keys(response.data).length > 0
      ) {
        return response.data as EmpresaModel;
      }
      return null;
    } catch (err) {
      console.error("Erro ao carregar dados da empresa:", err);
      return null;
    }
  }
}
