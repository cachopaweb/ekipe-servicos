import { FormatDate } from "../functions/utils";

import { FornecedorModel } from "../models/fornecedor_model";
import api from "../services/api";

export default class FornecedorRepository{


  async setFornecedor(fornecedor:FornecedorModel): Promise<boolean>{
    try {
      const sql = ` UPDATE OR INSERT INTO FORNECEDORES (FOR_CODIGO, FOR_NOME, FOR_ENDERECO, FOR_BAIRRO, FOR_CIDADE, FOR_CEP,
                                    FOR_FONE, FOR_CONTATO, FOR_EMAIL, FOR_DATAC, FOR_CELULAR,
                                    FOR_OBS, FOR_CNPJ_CPF, FOR_INSC_ESTADUAL, FOR_INSC_MUNICIPAL,
                                    FOR_END_NUMERO, FOR_TIPO, FOR_SUFRAMA, FOR_INDIC_IE,
                                    FOR_CID, FOR_RAZAO_SOCIAL, FOR_FANTASIA, FOR_ESTADO)
                              VALUES (${fornecedor.CODIGO}, '${fornecedor.NOME}', '${fornecedor.ENDERECO??''}', '${fornecedor.BAIRRO??''}', '${fornecedor.CIDADE??''}', '${fornecedor.CEP??''}',
                              '${fornecedor.FONE??''}', '${fornecedor.CONTATO??''}', '${fornecedor.EMAIL??''}', '${fornecedor.DATACADASTRO??''}', '${fornecedor.CELULAR??''}', 
                              '${fornecedor.OBS??''}', '${fornecedor.CPF_CNPJ??''}', '${fornecedor.INSCRICAOESTADUAL??''}', '${fornecedor.INSCRICAOMUNICIPAL??''}', ${fornecedor.END_NUMERO??''}, 
                              '${fornecedor.TIPO??''}', '${fornecedor.SUFRAMA??''}', '${fornecedor.INDICEIE??''}', '${fornecedor.CODCIDADE??''}', '${fornecedor.RAZAOSOCIAL??''}', '${fornecedor.NOME??''}', '${fornecedor.ESTADO??''}')
                              MATCHING (FOR_CODIGO)`;     
      const response = await api.post('/dataset', {
        'sql': sql
      });          
      return response.status === 200;
    } catch (error) {
        throw new Error('erro ao salvar fornecedor.\n'+String(error));
    }
}


    async getFornecedores(busca: string): Promise<FornecedorModel[]>{
        try {
          let sql = `SELECT FIRST 5 FOR_CODIGO AS CODIGO, FOR_NOME AS NOME, FOR_CNPJ_CPF AS CPF_CNPJ,
          FOR_FONE AS FONE, FOR_CELULAR AS CELULAR, FOR_ENDERECO AS ENDERECO, FOR_END_NUMERO AS END_NUMERO
          FROM FORNECEDORES WHERE (FOR_NOME LIKE '%${busca.toUpperCase()}%')`
          const response = await api.post('/dataset', {
            'sql': sql
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
        let sql = `SELECT FOR_CODIGO AS CODIGO, FOR_NOME AS NOME, FOR_RAZAO_SOCIAL AS RAZAOSOCIAL, FOR_TIPO AS TIPO, FOR_CNPJ_CPF AS CPF_CNPJ,
          FOR_FONE AS FONE, FOR_CELULAR AS CELULAR, FOR_ENDERECO AS ENDERECO, FOR_BAIRRO AS BAIRRO,
          FOR_CIDADE AS CIDADE, FOR_CID AS CODCIDADE, FOR_CEP AS CEP, FOR_END_NUMERO AS END_NUMERO, FOR_CONTATO AS CONTATO,
          FOR_INDIC_IE AS INDICEIE, FOR_INSC_ESTADUAL AS INSCRICAOESTADUAL, FOR_INSC_MUNICIPAL AS INSCRICAOMUNICIPAL, FOR_SUFRAMA AS SUFRAMA,
           FOR_DATAC AS DATACADASTRO, FOR_EMAIL AS EMAIL, FOR_OBS AS OBS FROM FORNECEDORES WHERE FOR_CODIGO = '${id}'`
        const response = await api.post('/dataset', {
          'sql': sql
        });
       let data = response.data;
        return data;
      } catch (error) {
          throw new Error('erro ao buscar fornecedor');
      }
  }


}