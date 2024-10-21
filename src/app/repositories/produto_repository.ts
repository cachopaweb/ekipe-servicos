import { ProdutoModel } from "../models/produto_model";
import api from "../services/api";

export default class ProdutoRepository{
    async getProdutos(busca: string): Promise<ProdutoModel[]>{
        try {
            const response = await api.post('/dataset', {
                'sql': `SELECT FIRST 5 PRO_CODIGO, PRO_DESCRICAO, PRO_QUANTIDADE, PRO_VALORV, PRO_VALORV_ATACADO, 
                        PRO_LOCAL, PRO_FABRICANTE, PRO_NOME, PRO_VALORCM, PRO_VALORC, PRO_CODBARRA, PRO_EMBALAGEM, 
                        PRO_NCM FROM PRODUTOS WHERE PRO_ESTADO = 'ATIVO' AND PRO_NOME LIKE '%${busca.toUpperCase()}%'`
            })
            const produtos = response.data as ProdutoModel[];            
            return produtos;
        } catch (error) {
           throw new Error('erro ao buscar produtos') 
        }
    }

    async getProdutoPorCodigo(codPro: number): Promise<ProdutoModel>{
        try {
            const response = await api.post('/dataset', {
                'sql': `SELECT PRO_CODIGO, PRO_DESCRICAO, PRO_QUANTIDADE, PRO_VALORV, PRO_VALORV_ATACADO, 
                        PRO_LOCAL, PRO_FABRICANTE, PRO_NOME, PRO_VALORCM, PRO_VALORC, PRO_CODBARRA, PRO_EMBALAGEM, 
                        PRO_VALORF, PRO_VALORL, PRO_NCM FROM PRODUTOS WHERE PRO_ESTADO = 'ATIVO' AND PRO_CODIGO = ${codPro}`
            })
            const produto = response.data as ProdutoModel;            
            return produto;
        } catch (error) {
           throw new Error('erro ao buscar produtos') 
        }
    }
    async deleteProdutoOrdemPorCodigo(codPro: number): Promise<boolean>{
        const sql = `DELETE FROM ORD_EST WHERE ORE_CODIGO = ${codPro}`;
        try {
            const response = await api.post('/dataset', {
                'sql': sql
            })
                      
            return response.status === 200;;
        } catch (error) {
           throw new Error('erro ao deletar produto') 
        }
    }
}