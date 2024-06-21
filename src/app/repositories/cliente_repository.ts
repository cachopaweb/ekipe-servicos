import { FormatDate } from "../functions/utils";
import { ClienteModel } from "../models/cliente_model";
import api from "../services/api";

export default class ClientRepository{
    async getClientes(busca: string): Promise<ClienteModel[]>{
        try {
          let SQL = `SELECT FIRST 5 CLI_CODIGO AS CODIGO, CLI_NOME AS NOME, CLI_CNPJ_CPF AS CPF_CNPJ, CLI_RG AS RG, 
          CLI_FONE AS FONE, CLI_CELULAR AS CELULAR, CLI_ENDERECO AS ENDERECO, CLI_SITUACAO, CLI_PLANO, 
          CLI_NOTA FROM CLIENTES WHERE (CLI_NOME LIKE '%${busca.toUpperCase()}%')`
          console.log(SQL);
          const response = await api.post('/dataset', {
            'sql': SQL
          });
          let data = [];
          if (response.data instanceof Array){
              data = response.data;
          }else{
              data = [response.data];
          }
          return data;
        } catch (error) {
            throw new Error('erro ao buscar clientes');
        }
    }

    async setUltimaVendaCliente(data: string, codigo: number): Promise<boolean>{
        try {          
          const response = await api.post('/dataset', {
            'sql': `UPDATE CLIENTES SET CLI_DATAU = '${FormatDate(data)}' WHERE CLI_CODIGO = ${codigo}`
          });          
          return response.status === 200;
        } catch (error) {
            throw new Error('erro ao setar ultima venda cliente.\n'+String(error));
        }
    }
}