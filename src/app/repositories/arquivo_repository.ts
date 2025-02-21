import { IncrementaGenerator } from "../functions/utils";
import ArquivoModel from "../models/arquivo_model";
import api from "../services/api";

export default class ArquivoRepository{
    static async setArquivoRepository(arquivo:ArquivoModel): Promise<boolean>{
      arquivo.AO_CODIGO = await IncrementaGenerator('GEN_ARQUIVOS_OS');
        try {          
          const response = await api.post('/dataset', {
            'sql': `UPDATE OR INSERT INTO ARQUIVOS_OS (AO_CODIGO, AO_OS, AO_CAMINHO, AO_OBS) VALUES (${arquivo.AO_CODIGO}, ${arquivo.AO_OS}, '${arquivo.AO_CAMINHO}', '${arquivo.AO_OBS}') MATCHING (AO_CODIGO)`
          });          
          return response.status === 200;
        } catch (error) {
          throw new Error('Erro ao enviar:\n'+String(error));
            return false;
        }
    }

    static async getArquivoRepository(AO_OS:number): Promise<ArquivoModel[]>{
      const sql = `SELECT * FROM ARQUIVOS_OS WHERE AO_OS =  ${AO_OS} `
        try {          
          const response = await api.post('/dataset', {
            'sql': sql
          });          
          let data = [];
          if (response.data instanceof Array){
              data = response.data;
          }else{
              data = [response.data];
          }
          return data as ArquivoModel[];
        } catch (error) {
          throw new Error('Erro ao enviar:\n'+String(error));
            return [];
        }
    }
}