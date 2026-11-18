import { escapeSql, FormatDate, horaFormatadaDB } from "../functions/utils";
import { DAVModel, DAVProModel } from "../models/dav_model";
import api from "../services/api";

function safeNumber(val: unknown, fallback = 0): number {
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
}

export default class DAVRepository {
    async insereDAV(dav: DAVModel): Promise<boolean> {
        try {
            const response = await api.post('/dataset', {
                'sql': `UPDATE OR INSERT INTO DAV (DAV_CODIGO, DAV_DATA, DAV_HORA, DAV_FUN, DAV_VALOR, DAV_CLI, DAV_FORMAS_PGM, DAV_VALIDADE,
                        DAV_ESTADO, DAV_NOVO, DAV_FUNCAO, DAV_VENDA, DAV_CLIENTE, DAV_CPF_CNPJ, DAV_FATURA)
                        VALUES (${safeNumber(dav.DAV_CODIGO)}, '${FormatDate(dav.DAV_DATA)}', '${horaFormatadaDB(dav.DAV_HORA)}', ${safeNumber(dav.DAV_FUN)}, ${safeNumber(dav.DAV_VALOR)}, ${safeNumber(dav.DAV_CLI)}, 
                                '${escapeSql(dav.DAV_FORMAS_PGM)}', '${escapeSql(dav.DAV_VALIDADE)}', ${safeNumber(dav.DAV_ESTADO)}, ${safeNumber(dav.DAV_NOVO)}, '${escapeSql(dav.DAV_FUNCAO)}', ${safeNumber(dav.DAV_VENDA)}, 
                                '${escapeSql(dav.DAV_CLIENTE)}', '${escapeSql(dav.DAV_CPF_CNPJ)}', ${safeNumber(dav.DAV_FATURA)})
                        MATCHING (DAV_CODIGO)`
            })
            return response.status === 200;
        } catch (error) {
            throw new Error('Erro ao inserir DAV.\n' + String(error));
        }
    }

    async insereDAVPro(davPro: DAVProModel): Promise<boolean> {
        try {
            const response = await api.post('/dataset', {
                'sql': `UPDATE OR INSERT INTO DAV_PRO (DP_CODIGO, DP_DAV, DP_PRO, DP_QUANTIDADE, DP_VALOR, DP_VALORR, DP_VALORL, DP_VALORF,
                        DP_LUCRO, DP_ALIQICMS, DP_NOME, DP_GTIN, DP_EMBALAGEM, DP_CANCELADO, DP_DATA, DP_NITEM,
                        DP_ACRESCIMO, DP_DESCONTO, DP_SIT_TRIB)
                        VALUES (${safeNumber(davPro.DP_CODIGO)}, ${safeNumber(davPro.DP_DAV)}, ${safeNumber(davPro.DP_PRO)}, ${safeNumber(davPro.DP_QUANTIDADE)}, ${safeNumber(davPro.DP_VALOR)}, ${safeNumber(davPro.DP_VALORR)}, 
                                ${safeNumber(davPro.DP_VALORL)}, ${safeNumber(davPro.DP_VALORF)}, ${safeNumber(davPro.DP_LUCRO)}, '${escapeSql(davPro.DP_ALIQICMS ?? '0')}', '${escapeSql(davPro.DP_NOME)}', '${escapeSql(davPro.DP_GTIN ?? '')}', 
                                '${escapeSql(davPro.DP_EMBALAGEM)}', '${escapeSql(davPro.DP_CANCELADO)}', '${FormatDate(davPro.DP_DATA)}', ${safeNumber(davPro.DP_NITEM)}, ${safeNumber(davPro.DP_ACRESCIMO)}, 
                                ${safeNumber(davPro.DP_DESCONTO)}, '${escapeSql(davPro.DP_SIT_TRIB ?? '')}')
                        MATCHING (DP_CODIGO)`
            })
            return response.status === 200;
        } catch (error) {
            throw new Error('Erro ao inserir DAVPro.\n' + String(error));
        }
    }
}