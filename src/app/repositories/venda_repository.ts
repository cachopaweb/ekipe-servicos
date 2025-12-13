import { converterDataPontoParaTraco, dataFormatadaHojeDotValueInput } from "../functions/utils";
import { VenEstModel } from "../models/ven_est_model";
import { VendaModel } from "../models/venda_model";
import api from "../services/api";

export interface VendaComNomes extends VendaModel {
  CLI_NOME: string;
  FUN_NOME: string;
}

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

  async getVendas(busca: string, tipo: 'codigo' | 'cliente'): Promise<VendaComNomes[]> {
    try {
      let whereClause = "";

      // Se busca for vazia, traz as últimas 50
      if (!busca) {
        whereClause = "1=1";
      } else if (tipo === 'codigo') {
        // Previne erro de SQL se digitar texto no filtro de código
        const codigo = parseInt(busca) || 0;
        whereClause = `V.VEN_CODIGO = ${codigo}`;
      } else {
        whereClause = `C.CLI_NOME LIKE '%${busca.toUpperCase()}%'`;
      }

      // JOIN com Clientes e Funcionários para pegar os nomes
      const SQL = `
                SELECT FIRST 50 
                    V.*, 
                    C.CLI_NOME, 
                    F.FUN_NOME 
                FROM VENDAS V
                LEFT JOIN CLIENTES C ON V.VEN_CLI = C.CLI_CODIGO
                LEFT JOIN FUNCIONARIOS F ON V.VEN_FUN = F.FUN_CODIGO
                WHERE ${whereClause}
                ORDER BY V.VEN_CODIGO DESC
            `;

      const response = await api.post('/dataset', { 'sql': SQL });

      let data = [];
      if (response.data instanceof Array) {
        data = response.data;
      } else if (response.data) {
        data = [response.data];
      }
      return data;
    } catch (error) {
      console.error("Erro ao buscar lista de vendas:", error);
      return [];
    }
  }

  // Busca os itens de uma venda específica para impressão
  async getItensVenda(codigoVenda: number): Promise<VenEstModel[]> {
    try {
      const SQL = `
                SELECT VE.* FROM VEN_EST VE
                WHERE VE.VE_VEN = ${codigoVenda}
            `;
      const response = await api.post('/dataset', { 'sql': SQL });

      let data = [];
      if (response.data instanceof Array) {
        data = response.data;
      } else if (response.data) {
        data = [response.data];
      }
      return data;
    } catch (error) {
      console.error("Erro ao buscar itens da venda:", error);
      return [];
    }
  }
}