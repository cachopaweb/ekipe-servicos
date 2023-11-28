import { FormatDate } from "../functions/utils";
import PFParcelaModel from "../models/pf_parcela_model";
import api from "../services/api";

export default class PfParcelaRepository{
    async inserepfParcela(pfParcela: PFParcelaModel): Promise<boolean>{        
        try {            
            const response = await api.post('/dataset', {
                'sql': `UPDATE OR INSERT INTO PF_PARCELA (PP_CODIGO, PP_PF, PP_TP, PP_VALOR, PP_VENCIMENTO, 
                        PP_JUROS, PP_DESCONTOS, PP_DUPLICATA, PP_VALORPG, PP_ESTADO)
                        VALUES (${pfParcela.PP_CODIGO}, ${pfParcela.PP_PF}, ${pfParcela.PP_TP}, ${pfParcela.PP_VALOR}, '${FormatDate(pfParcela.PP_VENCIMENTO)}', 
                                ${pfParcela.PP_JUROS}, ${pfParcela.PP_DESCONTOS}, '${pfParcela.PP_DUPLICATA}', ${pfParcela.PP_VALORPG}, '${pfParcela.PP_ESTADO}')
                        MATCHING (PP_CODIGO)`
            })
            return response.status === 200;
        } catch (e) {
            throw new Error('Erro ao inserir PFParcela.'+String(e))
        }
    }

}