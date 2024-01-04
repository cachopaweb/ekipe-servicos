import CliForModel from "../models/cli_for_model";
import api from "../services/api";

export default class CliForRepository{
    async getListaCliFor(busca: string): Promise<CliForModel[]>{
        try {
          const response = await api.post('/dataset', {
            'sql': `SELECT FIRST 5 CF_CODIGO AS CODIGO, CF_NOME AS NOME, CF_CNPJ_CPF AS CPF_CNPJ, 
            CF_FONE AS FONE, CF_CELULAR AS CELULAR, CF_ENDERECO AS ENDERECO, CF_BAIRRO AS BAIRRO, CF_INSC_ESTADUAL AS INSC_ESTADUAL,
            CID_NOME AS CIDADE, CID_UF AS UF,
            CF_RAZAO_SOCIAL AS RAZAO_SOCIAL FROM CLIENTES_FORNECEDORES
            JOIN CIDADES ON CID_CODIGO = CF_CID WHERE (CF_NOME LIKE '%${busca.toUpperCase()}%')`
          });
          const clients = response.data as CliForModel[];
          return clients;
        } catch (error) {
            throw new Error('erro ao buscar CliFor');
        }
    }
    async getCliFor(busca: number): Promise<CliForModel>{
        try {
          const response = await api.post('/dataset', {
            'sql': `SELECT CF_CODIGO AS CODIGO, CF_NOME AS NOME, CF_CNPJ_CPF AS CPF_CNPJ, 
            CF_FONE AS FONE, CF_CELULAR AS CELULAR, CF_ENDERECO AS ENDERECO, CF_BAIRRO AS BAIRRO, CF_INSC_ESTADUAL AS INSC_ESTADUAL,
            CID_NOME AS CIDADE, CID_UF AS UF,
            CF_RAZAO_SOCIAL AS RAZAO_SOCIAL FROM CLIENTES_FORNECEDORES
            JOIN CIDADES ON CID_CODIGO = CF_CID WHERE (CF_CODIGO = ${busca})`
          });
          const client = response.data as CliForModel;
          return client;
        } catch (error) {
            throw new Error('erro ao buscar CliFor');
        }
    }
}