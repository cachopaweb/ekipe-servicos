import { FormatDate } from "../functions/utils";
import PagPgmModel from "../models/pag_pgm_model";
import api from "../services/api";

export default class PagPgmRepository{
    async inserePagPgm(pagPgm: PagPgmModel): Promise<boolean>{        
        try {
            let sql = {}
            if (pagPgm.PP_DINHEIRO > 0){
                sql = {
                    'sql': `UPDATE OR INSERT INTO PAG_PGM (PP_CODIGO, PP_DATAPGM, PP_DINHEIRO, PP_CHEQUE, PP_MOV, 
                            PP_PAG, PP_HORA, PP_FUN, PP_CAI, PP_JUROS, PP_DESCONTOS)
                            VALUES (${pagPgm.PP_CODIGO}, '${FormatDate(pagPgm.PP_DATAPGM!)}', ${pagPgm.PP_DINHEIRO}, ${pagPgm.PP_CHEQUE}, ${pagPgm.PP_MOV}, 
                                    ${pagPgm.PP_PAG}, '${new Date().toLocaleTimeString()}', ${pagPgm.PP_FUN}, ${pagPgm.PP_CAI}, ${pagPgm.PP_JUROS}, ${pagPgm.PP_DESCONTOS})
                            MATCHING (PP_CODIGO)`
                }
            }else{
                sql = {
                    'sql': `UPDATE OR INSERT INTO PAG_PGM (PP_CODIGO, PP_DINHEIRO, PP_CHEQUE, PP_PAG)
                            VALUES (${pagPgm.PP_CODIGO}, ${pagPgm.PP_DINHEIRO}, ${pagPgm.PP_CHEQUE}, ${pagPgm.PP_PAG})
                            MATCHING (PP_CODIGO)`
                }
            }
            const response = await api.post('/dataset', sql)
            return response.status === 200;
        } catch (e) {
            throw new Error('Erro ao inserir Pag Pgm.'+String(e))
        }
    }

}