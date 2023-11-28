import MovimentacoesModel from "../models/movimentacoes_model";
import api from "../services/api";
import { FormatDate } from '@/app/functions/utils'

export default class MovimentacoesRepository{
    async getMovimentacoes(data1: Date, data2: Date): Promise<MovimentacoesModel[]>{
        try {              
            const response = await api.post('/dataset', {
                'sql': `SELECT MOV_CODIGO, MOV_DESCRICAO, MOV_DATAHORA, MOV_CREDITO, MOV_DEBITO, MOV_SALDOANT FROM MOVIMENTACOES WHERE MOV_CON = 0 
                        AND MOV_DATA BETWEEN '${FormatDate(data1)}' AND '${FormatDate(data2)}' ORDER BY MOV_ORDENA`
            });
            return (response.data as MovimentacoesModel[])
        } catch (error) {
            throw new Error('Erro ao buscar movimentações.'+error)
        }
    }

    async insereMovimentacoes(movimentacao: MovimentacoesModel): Promise<boolean>{        
        try {            
            const response = await api.post('/dataset', {
                'sql': `EXECUTE PROCEDURE INSERE_MOVIMENTACAO(${movimentacao.MOV_CODIGO}, ${movimentacao.MOV_CREDITO}, ${movimentacao.MOV_DEBITO}, 
                       '${movimentacao.MOV_DESCRICAO}', '${movimentacao.MOV_TIPO}', '${FormatDate(movimentacao.MOV_DATA)}', ${movimentacao.MOV_CON}, 
                       '${FormatDate(movimentacao.MOV_DATAHORA)}', '${movimentacao.MOV_PLANO}',  '${movimentacao.MOV_NOME}', ${movimentacao.MOV_CAI}, 
                        ${movimentacao.MOV_TROCO}, '${movimentacao.PDV}')`
            })
            return response.status === 200;
        } catch (e) {
            throw new Error('Erro ao inserir movimentacoes.'+String(e))
        }
    }
}