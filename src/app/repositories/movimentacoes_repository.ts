import MovimentacoesModel from "../models/movimentacoes_model";
import api from "../services/api";

function formatDate(date: Date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

export default class MovimentacoesRepository{
    async getMovimentacoes(data1: Date, data2: Date): Promise<MovimentacoesModel[]>{
        try {              
            const response = await api.post('/dataset', {
                'sql': `SELECT MOV_CODIGO, MOV_DESCRICAO, MOV_DATAHORA, MOV_CREDITO, MOV_DEBITO, MOV_SALDOANT FROM MOVIMENTACOES WHERE MOV_CON = 0 
                        AND MOV_DATA BETWEEN '${formatDate(data1)}' AND '${formatDate(data2)}' ORDER BY MOV_ORDENA`
            });
            return (response.data as MovimentacoesModel[])
        } catch (error) {
            throw new Error('Erro ao buscar movimentações.'+error)
        }
    }
}