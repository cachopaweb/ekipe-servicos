import { dataFormatadaHojeDotValueInput } from "../functions/utils";
import { PedEstModel } from "../models/ped_est_model";
import { PedidoModel } from "../models/pedido_model";
import api from "../services/api";

export default class PedidoRepository {
  async inserePedido(pedido: PedidoModel): Promise<boolean> {
    const dataFormatada = dataFormatadaHojeDotValueInput(new Date(pedido.PED_DATA));
    const sql = {
      'sql':
        `UPDATE OR INSERT INTO PEDIDOS (PED_CODIGO, PED_DATA, PED_VALOR, PED_FUN,
                 PED_CLI, PED_TIPO)
                 VALUES (${pedido.PED_CODIGO}, '${dataFormatada}', ${pedido.PED_VALOR},
                 ${pedido.PED_FUN}, ${pedido.PED_CLI}, '${pedido.PED_TIPO}')
                 MATCHING (PED_CODIGO)`
    }
    try {
      const response = await api.post('/dataset', sql);
      return response.status === 200;
    } catch (e) {
      throw new Error('Erro ao inserir pedido.' + String(e))
    }
  }

  async insereProdutos(produto: PedEstModel): Promise<boolean> {
    const obj = {
      'sql':
        `UPDATE OR INSERT INTO PED_EST (PE_CODIGO, PE_QUANTIDADE, PE_PRO, PE_VALOR, 
          PE_NOME, PE_PED, PE_VALORM)
                   VALUES (${produto.PE_CODIGO}, ${produto.PE_QUANTIDADE}, ${produto.PE_PRO},
                   ${produto.PE_VALOR}, '${produto.PE_NOME}',
                   ${produto.PE_PED}, ${produto.PE_VALORM})                   
                   MATCHING (PE_CODIGO)`
    }
    try {
      const response = await api.post('/dataset', obj);
      return response.status === 200;
    } catch (e) {
      throw new Error('Erro ao inserir produtos do pedido.' + String(e))
    }
  }

  async getPedidoById(codigo: number): Promise<PedidoModel> {
    try {
      const response = await api.post('/dataset', {
        'sql': `SELECT * FROM PEDIDOS WHERE PED_CODIGO = ${codigo}`
      })
      const obj = response.data;
      return obj;
    } catch (eror) {
      throw new Error('Erro ao buscar pedido');
    }
  }

  async getPedidos(busca: string, tipo: 'codigo' | 'cliente'): Promise<PedidoModel[]> {
    try {
      let whereClause = "";

      // Se busca for vazia, traz as últimas 50
      if (!busca) {
        whereClause = "1=1";
      } else if (tipo === 'codigo') {
        // Previne erro de SQL se digitar texto no filtro de código
        const codigo = parseInt(busca) || 0;
        whereClause = `P.PED_CODIGO = ${codigo}`;
      } else {
        whereClause = `C.CLI_NOME LIKE '%${busca.toUpperCase()}%'`;
      }

      // JOIN com Clientes e Funcionários para pegar os nomes
      const SQL = `
                SELECT FIRST 50 
                    P.*, 
                    C.CLI_NOME, 
                    F.FUN_NOME 
                FROM PEDIDOS P
                LEFT JOIN CLIENTES C ON P.PED_CLI = C.CLI_CODIGO
                LEFT JOIN FUNCIONARIOS F ON P.PED_FUN = F.FUN_CODIGO
                WHERE ${whereClause}
                ORDER BY P.PED_CODIGO DESC
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
      console.error("Erro ao buscar lista de pedidos:", error);
      return [];
    }
  }

  // Busca os itens de uma venda específica para impressão
  async getItensPedido(codigoPedido: number): Promise<PedEstModel[]> {
    try {
      const SQL = `
                SELECT PE.* FROM PED_EST PE
                WHERE PE.PE_PED = ${codigoPedido}
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
      console.error("Erro ao buscar itens do pedido:", error);
      return [];
    }
  }

  async removePedidosEProdutos(codigoPedido: number) {
    try {
      const SQL_PED_EST = `
              DELETE FROM PED_EST
              WHERE PE_PED = ${codigoPedido}
            `;

      const SQL_PED = `
              DELETE FROM PEDIDOS
              WHERE PED_CODIGO = ${codigoPedido}
            `;

      await api.post('/dataset', { 'sql': SQL_PED_EST });
      await api.post('/dataset', { 'sql': SQL_PED });
      return 204;
    } catch (error) {
      console.error("Erro ao remover pedido e seus itens: ", error);
    }
  }
}