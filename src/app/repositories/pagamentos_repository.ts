import { FormatDate } from "../functions/utils";
import PagamentosModel from "../models/pagamentos_model";
import api from "../services/api";

export default class PagamentosRepository{
    async inserePagamentos(pagamentos: PagamentosModel): Promise<boolean>{        
        try {
            const response = await api.post('/dataset', {
                'sql': `UPDATE OR INSERT INTO PAGAMENTOS (PAG_CODIGO, PAG_VALOR, PAG_VENCIMENTO, PAG_JUROS, PAG_ESTADO, PAG_DUPLICATA, PAG_FPG,
                        PAG_FAT2, PAG_DESCONTOS, PAG_CAI, PAG_TIPO, PAG_SITUACAO, PAG_OBS, PAG_CON, PAG_DATAC)
                        VALUES (${pagamentos.PAG_CODIGO}, ${pagamentos.PAG_VALOR}, '${FormatDate(pagamentos.PAG_VENCIMENTO)}', ${pagamentos.PAG_JUROS}, ${pagamentos.PAG_ESTADO}, 
                                '${pagamentos.PAG_DUPLICATA}', ${pagamentos.PAG_FPG}, ${pagamentos.PAG_FAT2}, ${pagamentos.PAG_DESCONTOS}, ${pagamentos.PAG_CAI}, 
                                '${pagamentos.PAG_TIPO}', ${pagamentos.PAG_SITUACAO}, '${pagamentos.PAG_OBS ?? ''}', ${pagamentos.PAG_CON}, '${FormatDate(pagamentos.PAG_DATAC)}')
                        MATCHING (PAG_CODIGO)`
            })
            return response.status === 200;
        } catch (e) {
            throw new Error('Erro ao inserir Pagamentos.'+String(e))
        }
    }

}