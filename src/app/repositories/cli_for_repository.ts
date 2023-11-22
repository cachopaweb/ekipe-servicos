import CliForModel from "../models/cli_for_model";
import api from "../services/api";

export default class CliForRepository{
    async getListaCliFor(busca: string): Promise<CliForModel[]>{
        try {
          const response = await api.post('/dataset', {
            'sql': `SELECT FIRST 5 CF_CODIGO AS CODIGO, CF_NOME AS NOME, CF_CNPJ_CPF AS CPF_CNPJ, 
                    CF_FONE AS FONE, CF_CELULAR AS CELULAR, CF_ENDERECO AS ENDERECO, CF_INSC_ESTADUAL AS INSC_ESTADUAL, 
                    CF_RAZAO_SOCIAL AS RAZAO_SOCIAL FROM CLIENTES_FORNECEDORES WHERE (CF_NOME LIKE '%${busca.toUpperCase()}%')`
          });
          const clients = response.data as CliForModel[];
          return clients;
        } catch (error) {
            throw new Error('erro ao buscar CliFor');
        }
    }
}