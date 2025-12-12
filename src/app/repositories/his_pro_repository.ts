import { FormatDate } from "../functions/utils";
import HisProModel from "../models/his_pro_model"
import api from "../services/api"

export default class HisProRepository {
    async insereHisPro(hp: HisProModel): Promise<boolean> {
        if (hp.HP_ORIGEM.length > 30) {
            hp.HP_ORIGEM = hp.HP_ORIGEM.substring(0, 30);
        }

        try {
            const response = await api.post('/dataset', {
                'sql': `UPDATE OR INSERT INTO HIS_PRO (HP_CODIGO, HP_DATA, HP_PRO, HP_ORIGEM, HP_DOC, HP_QUANTIDADE, HP_VALORC, HP_VALORV,
                        HP_VALORCM, HP_VALOROP, HP_VALORM, HP_TIPO, HP_TIPO2, HP_QUANTIDADEA)
                        VALUES (${hp.HP_CODIGO}, '${FormatDate(hp.HP_DATA)}', ${hp.HP_PRO}, '${hp.HP_ORIGEM}', '${hp.HP_DOC}', ${hp.HP_QUANTIDADE}, ${hp.HP_VALORC}, 
                                ${hp.HP_VALORV}, ${hp.HP_VALORCM}, ${hp.HP_VALOROP}, ${hp.HP_VALORM}, '${hp.HP_TIPO}', ${hp.HP_TIPO2}, ${hp.HP_QUANTIDADEA})
                        MATCHING (HP_CODIGO)`
            })
            return response.status === 200;
        } catch (error) {
            throw new Error('Erro ao inserir HisPro.\n' + String(error))
        }
    }
}