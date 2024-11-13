import { FormatDate } from "../functions/utils";
import FaturamentosModel from "../models/faturamentos_model";
import api from "../services/api";

export default class FaturamentosRepository{
    async insereFaturamentos(faturamentos: FaturamentosModel): Promise<boolean>{
        
        const sql = `UPDATE OR INSERT INTO FATURAMENTOS (FAT_CODIGO, FAT_CLI, FAT_VALOR, FAT_PARCELAS, FAT_JUROS, FAT_TIPOPGM, FAT_TIPO,
                        FAT_DESCRICAO, FAT_DATA)
                        VALUES (${faturamentos.FAT_CODIGO}, ${faturamentos.FAT_CLI}, ${faturamentos.FAT_VALOR}, 
                                ${faturamentos.FAT_PARCELAS}, ${faturamentos.FAT_JUROS}, ${faturamentos.FAT_TIPOPGM}, 
                                ${faturamentos.FAT_TIPO}, ${faturamentos.FAT_DESCRICAO}, '${FormatDate(faturamentos.FAT_DATA)}')
                        MATCHING (FAT_CODIGO)`;
        console.log('faturamento');
        console.log(sql);
        
        try {
            const response = await api.post('/dataset', {
                'sql': sql
            })
            return response.status === 200;
        } catch (e) {
            throw new Error('Erro ao inserir Faturamentos.'+String(e))
        }
    }

}