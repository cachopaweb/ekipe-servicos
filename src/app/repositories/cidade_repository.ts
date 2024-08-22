import CidadeModel from "../models/cidade_model";
import api from "../services/api";

export default class CidadeRepository{
    async getCidade(codigo: number): Promise<CidadeModel>{
        try {
            const response = await api.post('/dataset', {
                'sql': `SELECT * FROM CIDADES WHERE CID_CODIGO = ${codigo}`
            })
            return response.data as CidadeModel;
        } catch (error) {
            throw new Error('Erro ao buscar codigo cidade.\n'+String(error)); 
        }
    }
}