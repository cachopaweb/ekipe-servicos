import api from "../services/api";

export default class TipoPgmRepository{
    async buscaTipoPgm(tipo: string): Promise<TipoPgmModel[]>{
        try {
            const response = await api.post('/dataset', {
                'sql': `SELECT * FROM TIPO_PGM WHERE TP_TIPO = '${tipo}' ORDER BY TP_CODIGO`
            })
            return response.data as TipoPgmModel[];
        } catch (error) {
            throw new Error('erro ao buscar tipo pgm\n'+String(error));
        }
    }
}