import PedFatModel from "../models/ped_fat_model";
import api from "../services/api";
import { FormatDate } from '@/app/functions/utils'

export default class PedFatRepository{
    async inserePedFat(pedFat: PedFatModel): Promise<boolean>{        

        const sql = `UPDATE OR INSERT INTO PED_FAT (PF_CODIGO, PF_DATA, PF_TABELA, PF_COD_PED, PF_CAMPO_FAT, PF_CAMPO_PED, PF_CLIENTE, PF_VALOR,
                            PF_VALORPG, PF_COD_CLI, PF_FUN, PF_PARCELAS, PF_FAT, PF_VALORB, PF_DESCONTO, PF_DATAC,
                            PF_CAMPO_DATAC, PF_TIPO)
                        VALUES (${pedFat.PF_CODIGO}, '${FormatDate(pedFat.PF_DATA)}', '${pedFat.PF_TABELA}', ${pedFat.PF_COD_PED}, '${pedFat.PF_CAMPO_FAT}', '${pedFat.PF_CAMPO_PED}', '${pedFat.PF_CLIENTE}', ${pedFat.PF_VALOR},
                                ${pedFat.PF_VALORPG}, ${pedFat.PF_COD_CLI}, ${pedFat.PF_FUN}, ${pedFat.PF_PARCELAS}, ${pedFat.PF_FAT}, ${pedFat.PF_VALORB}, ${pedFat.PF_DESCONTO}, '${FormatDate(new Date(pedFat.PF_DATAC))}', '${pedFat.PF_CAMPO_DATAC}',
                                '${pedFat.PF_TIPO}')
                        MATCHING (PF_CODIGO)`;

        try {
            const response = await api.post('/dataset', {
                'sql': sql
            })
            return response.status === 200;
        } catch (e) {
            throw new Error('Erro ao inserir Ped Fat.'+String(e))
        }
    }

}