import { FormatDate } from "../functions/utils";
import { DAVModel, DAVProModel } from "../models/dav_model";
import api from "../services/api";

export default class DAVRepository{
    async insereDAV(dav: DAVModel): Promise<boolean>{
        try {            
            const response = await api.post('/dataset', {
                'sql': `UPDATE OR INSERT INTO DAV (DAV_CODIGO, DAV_DATA, DAV_HORA, DAV_FUN, DAV_VALOR, DAV_CLI, DAV_FORMAS_PGM, DAV_VALIDADE,
                        DAV_ESTADO, DAV_NOVO, DAV_FUNCAO, DAV_VENDA, DAV_CLIENTE, DAV_CPF_CNPJ, DAV_FATURA)
                        VALUES (${dav.DAV_CODIGO}, '${FormatDate(dav.DAV_DATA)}', '${dav.DAV_HORA}', ${dav.DAV_FUN}, ${dav.DAV_VALOR}, ${dav.DAV_CLI}, 
                                '${dav.DAV_FORMAS_PGM}', '${dav.DAV_VALIDADE}', ${dav.DAV_ESTADO}, ${dav.DAV_NOVO}, '${dav.DAV_FUNCAO}', ${dav.DAV_VENDA}, 
                                '${dav.DAV_CLIENTE}', '${dav.DAV_CPF_CNPJ}', ${dav.DAV_FATURA})
                        MATCHING (DAV_CODIGO)`
            })
            return response.status === 200;
        } catch (error) {
            throw new Error('Erro ao inserir DAV.\n'+String(error));
        }
    }

    async insereDAVPro(davPro: DAVProModel): Promise<boolean>{
        try {            
            const response = await api.post('/dataset', {
                'sql': `UPDATE OR INSERT INTO DAV_PRO (DP_CODIGO, DP_DAV, DP_PRO, DP_QUANTIDADE, DP_VALOR, DP_VALORR, DP_VALORL, DP_VALORF,
                        DP_LUCRO, DP_ALIQICMS, DP_NOME, DP_GTIN, DP_EMBALAGEM, DP_CANCELADO, DP_DATA, DP_NITEM,
                        DP_ACRESCIMO, DP_DESCONTO, DP_SIT_TRIB)
                        VALUES (${davPro.DP_CODIGO}, ${davPro.DP_DAV}, ${davPro.DP_PRO}, ${davPro.DP_QUANTIDADE}, ${davPro.DP_VALOR}, ${davPro.DP_VALORR}, 
                                ${davPro.DP_VALORL}, ${davPro.DP_VALORF}, ${davPro.DP_LUCRO}, '${davPro.DP_ALIQICMS}', '${davPro.DP_NOME}', '${davPro.DP_GTIN ?? ''}', 
                                '${davPro.DP_EMBALAGEM}', '${davPro.DP_CANCELADO}', '${FormatDate(davPro.DP_DATA)}', ${davPro.DP_NITEM}, ${davPro.DP_ACRESCIMO}, 
                                ${davPro.DP_DESCONTO}, '${davPro.DP_SIT_TRIB}')
                        MATCHING (DP_CODIGO)`
            })
            return response.status === 200;
        } catch (error) {
            throw new Error('Erro ao inserir DAVPro.\n'+String(error));
        }
    }
}