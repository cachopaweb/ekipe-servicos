import UnidadeMedidaModel from "../models/unidade_med_model";
import api from "../services/api";

export default class UnidadeMedidaRepository{
    async getUnidadeMedidas(): Promise<UnidadeMedidaModel[]>{
        try {
            const response = await api.post('/dataset', {
                'sql': `SELECT UM_DESCRICAO, UM_UNIDADE FROM UNIDADE_MED ORDER BY UM_UNIDADE`
            })
            const UnidadeMedidas = response.data as UnidadeMedidaModel[];            
            return UnidadeMedidas;
        } catch (error) {
           throw new Error('erro ao buscar UnidadeMedidas') 
        }
    }
}