import { FormatDate } from "../functions/utils";
import recPgmModel from "../models/rec_pgm_model";
import api from "../services/api";

export default class RecPgmRepository{
    async insereRecPgm(recPgm: recPgmModel): Promise<boolean>{        
        try {
            let sql = {};
            if (recPgm.RP_DINHEIRO > 0){
               sql = {
                    'sql': `UPDATE OR INSERT INTO REC_PGM (RP_CODIGO, RP_DATAPGM, RP_DINHEIRO, RP_CHEQUE, RP_REC, RP_HORA, 
                            RP_FUN, RP_CAI, RP_MOV, RP_JUROS, RP_DESCONTOS)
                            VALUES (${recPgm.RP_CODIGO}, '${FormatDate(recPgm.RP_DATAPGM!)}', ${recPgm.RP_DINHEIRO}, ${recPgm.RP_CHEQUE}, 
                                    ${recPgm.RP_REC}, '${new Date().toLocaleTimeString()}', ${recPgm.RP_FUN}, ${recPgm.RP_CAI}, 
                                    ${recPgm.RP_MOV}, ${recPgm.RP_JUROS}, ${recPgm.RP_DESCONTOS})
                            MATCHING (RP_CODIGO)`
                }
            }else{
                sql = {
                    'sql': `UPDATE OR INSERT INTO REC_PGM (RP_CODIGO, RP_DINHEIRO, RP_CHEQUE, RP_REC)
                            VALUES (${recPgm.RP_CODIGO}, ${recPgm.RP_DINHEIRO}, ${recPgm.RP_CHEQUE}, ${recPgm.RP_REC})
                            MATCHING (RP_CODIGO)`
                } 
            }
            const response = await api.post('/dataset', sql)
            return response.status === 200;
        } catch (e) {
            throw new Error('Erro ao inserir Pag Pgm.'+String(e))
        }
    }

}