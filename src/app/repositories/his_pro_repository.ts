import { escapeSql, FormatDate } from "../functions/utils";
import HisProModel from "../models/his_pro_model";
import api from "../services/api";

function safeNumber(val: unknown, fallback = 0): number {
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
}

export default class HisProRepository {
    async insereHisPro(hp: HisProModel): Promise<boolean> {
        const origem = escapeSql((hp.HP_ORIGEM || "").substring(0, 30));
        const doc = escapeSql(hp.HP_DOC || "");
        const tipo = escapeSql(hp.HP_TIPO || "S");

        try {
            const response = await api.post('/dataset', {
                'sql': `UPDATE OR INSERT INTO HIS_PRO (HP_CODIGO, HP_DATA, HP_PRO, HP_ORIGEM, HP_DOC, HP_QUANTIDADE, HP_VALORC, HP_VALORV,
                        HP_VALORCM, HP_VALOROP, HP_VALORM, HP_TIPO, HP_TIPO2, HP_QUANTIDADEA)
                        VALUES (${safeNumber(hp.HP_CODIGO)}, '${FormatDate(hp.HP_DATA)}', ${safeNumber(hp.HP_PRO)}, '${origem}', '${doc}', ${safeNumber(hp.HP_QUANTIDADE)}, ${safeNumber(hp.HP_VALORC)}, 
                                ${safeNumber(hp.HP_VALORV)}, ${safeNumber(hp.HP_VALORCM)}, ${safeNumber(hp.HP_VALOROP)}, ${safeNumber(hp.HP_VALORM)}, '${tipo}', ${safeNumber(hp.HP_TIPO2)}, ${safeNumber(hp.HP_QUANTIDADEA)})
                        MATCHING (HP_CODIGO)`
            })
            return response.status === 200;
        } catch (error) {
            throw new Error('Erro ao inserir HisPro.\n' + String(error))
        }
    }
}