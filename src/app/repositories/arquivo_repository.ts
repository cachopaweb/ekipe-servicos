import { IncrementaGenerator, escapeSql } from "../functions/utils";
import ArquivoModel from "../models/arquivo_model";
import api from "../services/api";

export default class ArquivoRepository {
  /**
   * Salva metadados do arquivo em ARQUIVOS_OS
   */
  static async setArquivoRepository(arquivo: ArquivoModel): Promise<boolean> {
    if (!arquivo.AO_CODIGO || arquivo.AO_CODIGO <= 0) {
      arquivo.AO_CODIGO = await IncrementaGenerator('GEN_ARQUIVOS_OS');
    }
    const caminhoEscaped = escapeSql(arquivo.AO_CAMINHO || '');
    const obsEscaped = escapeSql(arquivo.AO_OBS || '');

    try {
      const response = await api.post('/dataset', {
        sql: `UPDATE OR INSERT INTO ARQUIVOS_OS (AO_CODIGO, AO_OS, AO_CAMINHO, AO_OBS) 
              VALUES (${arquivo.AO_CODIGO}, ${arquivo.AO_OS}, '${caminhoEscaped}', '${obsEscaped}') 
              MATCHING (AO_CODIGO)`
      });
      return response.status === 200;
    } catch (error) {
      throw new Error('Erro ao salvar anexo no banco: ' + String(error));
    }
  }

  /**
   * Retorna todos os arquivos vinculados a uma ordem de serviço
   */
  static async getArquivoRepository(AO_OS: number): Promise<ArquivoModel[]> {
    if (!AO_OS || AO_OS <= 0) return [];
    const sql = `SELECT AO_CODIGO, AO_OS, AO_CAMINHO, AO_OBS FROM ARQUIVOS_OS WHERE AO_OS = ${AO_OS} ORDER BY AO_CODIGO DESC`;
    try {
      const response = await api.post('/dataset', { sql });
      if (!response.data) return [];
      const data = Array.isArray(response.data) ? response.data : [response.data];
      return data.filter((item: any) => item && item.AO_CODIGO) as ArquivoModel[];
    } catch (error) {
      console.error('Erro ao buscar arquivos da OS:', error);
      return [];
    }
  }

  /**
   * Remove o vínculo de um arquivo da tabela ARQUIVOS_OS
   */
  static async deleteArquivoRepository(codigo: number): Promise<boolean> {
    if (!codigo || codigo <= 0) return false;
    try {
      const response = await api.post('/dataset', {
        sql: `DELETE FROM ARQUIVOS_OS WHERE AO_CODIGO = ${codigo}`
      });
      return response.status === 200;
    } catch (error) {
      throw new Error('Erro ao excluir anexo: ' + String(error));
    }
  }
}
