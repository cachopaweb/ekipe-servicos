import { FormatDate } from "../functions/utils";
import { ClienteModel } from "../models/cliente_model";
import api from "../services/api";

export default class ClientRepository{
    async getClientes(busca: string): Promise<ClienteModel[]>{
        try {
          let SQL = `SELECT FIRST 5 CLI_CODIGO AS CODIGO, CLI_NOME AS NOME, CLI_CNPJ_CPF AS CPF_CNPJ, CLI_RG AS RG, 
          CLI_FONE AS FONE, CLI_CELULAR AS CELULAR, CLI_ENDERECO AS ENDERECO, CLI_SITUACAO, CLI_PLANO, 
          CLI_NOTA FROM CLIENTES WHERE (CLI_NOME LIKE '%${busca.toUpperCase()}%')`
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

    async getClienteById(id: number): Promise<ClienteModel>{
      try {
        let SQL = `SELECT CLI_CODIGO AS CODIGO, CLI_NOME AS NOME, CLI_RAZAO_SOCIAL AS RAZAOSOCIAL, CLI_TIPO AS TIPO, CLI_CNPJ_CPF AS CPF_CNPJ,
          CLI_RG AS RG, CLI_FONE AS FONE, CLI_CELULAR AS CELULAR, CLI_ENDERECO AS ENDERECO, CLI_NUMERO AS NUMERO, CLI_BAIRRO AS BAIRRO,
          CLI_CIDADE AS CIDADE, CLI_CEP AS CEP, CLI_FIDELIDADE AS FIDELIDADE, CLI_INADIMPLENCIA AS INADIPLENCIA, CLI_DESCONTO AS DESCONTO,
          CLI_SITUACAO AS SITUACAO, CLI_LIMITE AS LIMITE, CLI_DATANASC AS DATANASCIMENTO, CLI_PAI AS PAI, CLI_MAE AS MAE, CLI_CONJUGE AS CONJUGE,
          CLI_INDIC_IE AS INDICEIE, CLI_INSC_ESTADUAL AS INSCRICAOESTADUAL, CLI_INSC_MUNICIPAL AS INSCRICAOMUNICIPAL, CLI_SUFRAMA AS SUFRAMA,
          CLI_ESTADO AS ESTADO, CLI_DATAC AS DATACADASTRO, CLI_EMAIL AS EMAIL, CLI_OBS AS OBS FROM CLIENTES WHERE CLI_CODIGO = '${id}'`
        const response = await api.post('/dataset', {
          'sql': SQL
        });
       let data = response.data;
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