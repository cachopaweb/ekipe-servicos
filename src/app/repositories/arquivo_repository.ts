import { GeraCodigo } from "../functions/utils";
import ArquivoModel from "../models/arquivo_model";
import api from "../services/api";

export default class ArquivoRepository{
    static async setArquivoRepository(arquivo:ArquivoModel): Promise<boolean>{
      arquivo.AO_CODIGO = await GeraCodigo("ARQUIVOS_OS", "AO_CODIGO");
        try {          
          const response = await api.post('/dataset', {
            'sql': `UPDATE OR INSERT INTO ARQUIVOS_OS (AO_CODIGO, AO_OS, AO_CAMINHO, AO_OBS) VALUES (${arquivo.AO_CODIGO}, ${arquivo.AO_OS}, ${arquivo.AO_CAMINHO}, ${arquivo.AO_OBS}) MATCHING (AO_CODIGO)`
          });          
          return response.status === 200;
        } catch (error) {
            throw new Error('erro ao setar ArquivoModel.\n'+String(error));
        }
    }
}