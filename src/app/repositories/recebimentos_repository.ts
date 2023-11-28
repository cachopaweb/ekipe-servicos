import { FormatDate } from "../functions/utils";
import recebimentosModel from "../models/recebimentos_model";
import api from "../services/api";

export default class RecebimentosRepository{
    async insererecebimentos(recebimentos: recebimentosModel): Promise<boolean>{        
        try {
            const response = await api.post('/dataset', {
                'sql': `UPDATE OR INSERT INTO RECEBIMENTOS (REC_CODIGO, REC_VALOR, REC_VENCIMENTO, REC_ESTADO, REC_DUPLICATA, 
                        REC_FPG, REC_FAT, REC_JUROS, REC_DESCONTOS, REC_CAI, REC_TIPO, REC_CON, REC_DATAR, REC_SITUACAO,
                        REC_DESCONTADO, REC_OBS)
                        VALUES (${recebimentos.REC_CODIGO}, ${recebimentos.REC_VALOR}, '${FormatDate(recebimentos.REC_VENCIMENTO)}', '${recebimentos.REC_ESTADO}', 
                                '${recebimentos.REC_DUPLICATA}', ${recebimentos.REC_FPG}, ${recebimentos.REC_FAT}, ${recebimentos.REC_JUROS},
                                ${recebimentos.REC_DESCONTOS}, ${recebimentos.REC_CAI}, '${recebimentos.REC_TIPO}', ${recebimentos.REC_CON}, 
                                '${FormatDate(recebimentos.REC_DATAR)}', ${recebimentos.REC_SITUACAO}, '${recebimentos.REC_DESCONTADO}', '${recebimentos.REC_OBS ?? ''}')
                        MATCHING (REC_CODIGO)`
            })
            return response.status === 200;
        } catch (e) {
            throw new Error('Erro ao inserir recebimentos.'+String(e))
        }
    }

}