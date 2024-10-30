import { FormatDate } from "../functions/utils";
import Faturamento2Model from "../models/faturamento2_model";
import api from "../services/api";

export default class Faturamento2Repository{
    async insereFaturamento2(faturamento2: Faturamento2Model): Promise<boolean>{   
        const sql =  `UPDATE OR INSERT INTO FATURAMENTO2 (FAT2_CODIGO, FAT2_TIPO, FAT2_VALOR, FAT2_DESCRICAO, FAT2_TIPOPGM, FAT2_PARCELAS,
        FAT2_JUROS, FAT2_DATA, FAT2_COD_FDTF)
        VALUES (${faturamento2.FAT2_CODIGO}, ${faturamento2.FAT2_TIPO}, ${faturamento2.FAT2_VALOR}, 
                '${faturamento2.FAT2_DESCRICAO}', ${faturamento2.FAT2_TIPOPGM}, ${faturamento2.FAT2_PARCELAS}, 
                ${faturamento2.FAT2_JUROS}, '${FormatDate(faturamento2.FAT2_DATA)}', ${faturamento2.FAT2_COD_FDTF})
        MATCHING (FAT2_CODIGO)`; 
        try {
            const response = await api.post('/dataset', {
                'sql':sql
            })
            return response.status === 200;
        } catch (e) {
            throw new Error('Erro ao inserir Faturamento2.'+String(e))
        }
    }

}