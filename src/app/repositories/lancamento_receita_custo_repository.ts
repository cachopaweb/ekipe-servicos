import { FormatDate } from "../functions/utils";
import api from "../services/api";

export default class LancamentoReceitaCustoRepository{
    async insereLancamento(lancamento: LancamentoRecCusModel): Promise<boolean>{        
        try {
            console.log(`UPDATE OR INSERT INTO LANCAMENTO_REC_CUS (LRC_CODIGO, LRC_DATA, LRC_VALOR, LRC_HISTORICO, LRC_OBS, LRC_DATAC, 
                LRC_FAT2, LRC_FAT, LRC_TIPO, LRC_CLI_FOR, LRC_FUN)
                VALUES (${lancamento.LRC_CODIGO}, '${FormatDate(lancamento.LRC_DATA)}', ${lancamento.LRC_VALOR}, '${lancamento.LRC_HISTORICO}', 
                        '${lancamento.LRC_OBS ?? ''}', '${lancamento.LRC_DATAC ? FormatDate(lancamento.LRC_DATAC) : ''}', ${lancamento.LRC_FAT2}, ${lancamento.LRC_FAT}, 
                        ${lancamento.LRC_TIPO}, ${lancamento.LRC_CLI_FOR-1000000}, ${lancamento.LRC_FUN})
                MATCHING (LRC_CODIGO)`)
            const response = await api.post('/dataset', {
                'sql': `UPDATE OR INSERT INTO LANCAMENTO_REC_CUS (LRC_CODIGO, LRC_DATA, LRC_VALOR, LRC_HISTORICO, LRC_OBS, LRC_DATAC, 
                        LRC_FAT2, LRC_FAT, LRC_TIPO, LRC_CLI_FOR, LRC_FUN)
                        VALUES (${lancamento.LRC_CODIGO}, '${FormatDate(lancamento.LRC_DATA)}', ${lancamento.LRC_VALOR}, '${lancamento.LRC_HISTORICO}', 
                                '${lancamento.LRC_OBS ?? ''}', '${lancamento.LRC_DATAC ? FormatDate(lancamento.LRC_DATAC) : ''}', ${lancamento.LRC_FAT2}, ${lancamento.LRC_FAT}, 
                                '${lancamento.LRC_TIPO}', ${lancamento.LRC_CLI_FOR-1000000}, ${lancamento.LRC_FUN})
                        MATCHING (LRC_CODIGO)`
            })
            return response.status === 200;
        } catch (e) {
            throw new Error('Erro ao inserir Lancamento Receita Custo.'+String(e))
        }
    }

}