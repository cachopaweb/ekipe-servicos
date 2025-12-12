import { converterDataPontoParaTraco, dataFormatadaHojeDotValueInput } from "../functions/utils";
import { VenEstModel } from "../models/ven_est_model";
import { VendaModel } from "../models/venda_model";
import api from "../services/api";

export default class VendaRepository {
  async insereVenda(venda: VendaModel): Promise<boolean> {
    const dataFormatada = dataFormatadaHojeDotValueInput(new Date());

    const sql = {
      'sql':
        `UPDATE OR INSERT INTO VENDAS (VEN_CODIGO, VEN_DATA, VEN_VALOR, VEN_HORA, VEN_FUN, VEN_NF, VEN_DIFERENCA, VEN_DATAC,
                 VEN_FAT, VEN_DAV, VEN_CLI, VEN_DEVOLUCAO_P, VEN_VENDEDOR)
                 VALUES (${venda.VEN_CODIGO}, '${dataFormatada}', ${venda.VEN_VALOR}, '${new Date().toLocaleTimeString()}',
                 ${venda.VEN_FUN}, ${venda.VEN_NF}, ${venda.VEN_DIFERENCA}, '1900-01-01', ${venda.VEN_FAT ?? 0}, 
                 ${venda.VEN_DAV}, ${venda.VEN_CLI},
                 '${venda.VEN_DEVOLUCAO_P.replace(/'/g, "''")}', ${venda.VEN_VENDEDOR})
                 MATCHING (VEN_CODIGO)`
    }
    try {
      const response = await api.post('/dataset', sql)
      return response.status === 200;
    } catch (e) {
      throw new Error('Erro ao inserir venda.' + String(e))
    }
  }

  async insereProdutos(produto: VenEstModel): Promise<boolean> {
    const obj = {
      'sql':
        `UPDATE OR INSERT INTO VEN_EST (VE_CODIGO, VE_VALOR, VE_QUANTIDADE, VE_VEN, VE_PRO, VE_NOME)
                   VALUES (${produto.VE_CODIGO}, ${produto.VE_VALOR}, ${produto.VE_QUANTIDADE}, ${produto.VE_VEN}, 
                   ${produto.VE_PRO}, '${produto.VE_NOME}')                   
                   MATCHING (VE_CODIGO)`
    }
    try {
      const response = await api.post('/dataset', obj)
      return response.status === 200;
    } catch (e) {
      throw new Error('Erro ao inserir Produtos ordem.' + String(e))
    }
  }

  async getUltimaVenda(): Promise<number> {
    try {
      const response = await api.post('/dataset', {
        'sql': `SELECT FIRST 1 VEN_CODIGO FROM VENDAS ORDER BY VEN_CODIGO DESC;`
      })
      const obj = response.data;
      const codVenda = obj.VEN_CODIGO;
      return codVenda as number;
    } catch (error) {
      throw new Error('Erro ao buscar vendas')
    }
  }

  async getVendaById(codigo: number): Promise<VendaModel> {
    try {
      const response = await api.post('/dataset', {
        'sql': `SELECT * FROM VENDAS WHERE VEN_CODIGO = ${codigo}`
      })
      const obj = response.data;
      return obj;
    } catch (eror) {
      throw new Error('Erro ao buscar venda');
    }
  }
}