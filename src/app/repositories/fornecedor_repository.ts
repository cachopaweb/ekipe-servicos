import { FormatDate } from "../functions/utils";

import { FornecedorModel } from "../models/fornecedor_model";
import api from "../services/api";

export default class FornecedorRepository{
    async getFornecedores(busca: string): Promise<FornecedorModel[]>{
        try {
          let SQL = `SELECT FIRST 5 FOR_CODIGO AS CODIGO, FOR_NOME AS NOME, FOR_CNPJ_CPF AS CPF_CNPJ,
          FOR_FONE AS FONE, FOR_CELULAR AS CELULAR, FOR_ENDERECO AS ENDERECO
          FROM FORNECEDORES WHERE (FOR_NOME LIKE '%${busca.toUpperCase()}%')`
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
            throw new Error('erro ao buscar Fornecedores');
        }
    }

    async getFornecedorById(id: number): Promise<FornecedorModel>{
      try {
        let SQL = `SELECT FOR_CODIGO AS CODIGO, FOR_NOME AS NOME, FOR_RAZAO_SOCIAL AS RAZAOSOCIAL, FOR_TIPO AS TIPO, FOR_CNPJ_CPF AS CPF_CNPJ,
          FOR_FONE AS FONE, FOR_CELULAR AS CELULAR, FOR_ENDERECO AS ENDERECO, FOR_BAIRRO AS BAIRRO,
          FOR_CIDADE AS CIDADE, FOR_CID AS CODCIDADE, FOR_CEP AS CEP,
          FOR_INDIC_IE AS INDICEIE, FOR_INSC_ESTADUAL AS INSCRICAOESTADUAL, FOR_INSC_MUNICIPAL AS INSCRICAOMUNICIPAL, FOR_SUFRAMA AS SUFRAMA,
           FOR_DATAC AS DATACADASTRO, FOR_EMAIL AS EMAIL, FOR_OBS AS OBS FROM FORNECEDORES WHERE FOR_CODIGO = '${id}'`
        const response = await api.post('/dataset', {
          'sql': SQL
        });
       let data = response.data;
        return data;
      } catch (error) {
          throw new Error('erro ao buscar fornecedor');
      }
  }


}