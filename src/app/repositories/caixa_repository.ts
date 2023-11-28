import CaixaModel from "../models/caixa_model";
import api from "../services/api";

export default class CaixaRepository{
    async getCodCaixa(PDV: number): Promise<CaixaModel>{
        try {
            const response = await api.post('/dataset', {
                'sql': `SELECT * FROM CAIXA WHERE CAI_CODIGO = (SELECT MAX(CAI_CODIGO) FROM CAIXA WHERE CAI_PDV = ${PDV})`
            })
            return response.data as CaixaModel;
        } catch (error) {
            throw new Error('Erro ao buscar codigo caixa.\n'+String(error)); 
        }
    }
}