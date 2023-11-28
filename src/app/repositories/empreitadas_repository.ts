import { FormatDate } from "../functions/utils";
import EmpreitadasModel from "../models/empreitadas_model";
import api from "../services/api";

export default class EmpreitadasRepository{
    async buscaEmpreitadas(codigo: number): Promise<EmpreitadasModel>{
        const obj = {
            'sql': 
                `SELECT EMP_CODIGO, EMP_FOR, FOR_NOME, EMP_OBS, EMP_LOCAL_EXECUCAO_SERVICOS, LRC_FAT2 
                 FROM EMPREITADAS JOIN FORNECEDORES ON EMP_FOR = FOR_CODIGO LEFT JOIN LANCAMENTO_REC_CUS ON ((LRC_TIPO = 'C') 
                 AND (FOR_CODIGO = LRC_CLI_FOR) AND (EMP_FAT = LRC_FAT2) AND (LRC_DATAC = '01/01/1900')) WHERE EMP_ORD = ${codigo} 
                 ORDER BY EMP_CODIGO`        
        }
        try {
            const response = await api.post('/dataset', obj)
            return response.data as EmpreitadasModel;
        } catch (e) {
            throw new Error('Erro ao buscar Empreitadas.'+String(e))
        }
    }

    async buscaServicosEmpreitadas(codigo: number): Promise<EmpreitadasServicosModel[]>{
        const obj = {
            'sql': 
                `SELECT ES_CODIGO, ES_EMP, CAST(ES_DESCRICAO AS VARCHAR(1000)) DESCRICAO, ES_VALOR, ES_PRAZO_CONCLUSAO, 
                ES_QUANTIDADE, ES_VALOR/ES_QUANTIDADE VLR_UNIT, ES_UNIDADE FROM EMPREITADAS_SERVICOS WHERE ES_EMP = ${codigo} 
                ORDER BY ES_CODIGO`        
        }
        try {
            const response = await api.post('/dataset', obj)
            if (response.data instanceof Array){
                return response.data as EmpreitadasServicosModel[];
            }else{
                return [response.data] as EmpreitadasServicosModel[];
            }
        } catch (e) {
            throw new Error('Erro ao buscar Servicos Empreitadas.'+String(e))
        }
    }

    async insereEmpreitada(empreitada: EmpreitadasModel): Promise<boolean>{        
        try {
            const response = await api.post('/dataset', {
                'sql': `UPDATE OR INSERT INTO EMPREITADAS (EMP_CODIGO, EMP_ORD, EMP_FOR, EMP_FAT, EMP_OBS, EMP_LOCAL_EXECUCAO_SERVICOS, EMP_NFS)
                VALUES (${empreitada.EMP_CODIGO}, ${empreitada.EMP_ORD}, ${empreitada.EMP_FOR}, ${empreitada.LRC_FAT2}, ${empreitada.EMP_OBS ?? ''}, 
                ${empreitada.EMP_LOCAL_EXECUCAO_SERVICOS ?? ''}, ${empreitada.EMP_NFS ?? ''})
                MATCHING (EMP_CODIGO)`
            })
            return response.status === 200;
        } catch (e) {
            throw new Error('Erro ao inserir Empreitadas.'+String(e))
        }
    }

    async insereServicosEmpreitada(servicos: EmpreitadasServicosModel[]): Promise<boolean>{        
        try {
            let result = false;
            for (const servico in servicos) {
                if (Object.prototype.hasOwnProperty.call(servicos, servico)) {
                    const item = servicos[servico];
                    const response = await api.post('/dataset', {
                        'sql': `UPDATE OR INSERT INTO EMPREITADAS_SERVICOS (ES_CODIGO, ES_EMP, ES_DESCRICAO, ES_VALOR, ES_PRAZO_CONCLUSAO, ES_QUANTIDADE, ES_UNIDADE)
                        VALUES (${item.ES_CODIGO}, ${item.ES_EMP}, '${item.DESCRICAO}', ${item.ES_VALOR}, '${FormatDate(item.ES_PRAZO_CONCLUSAO ?? new Date())}, ${item.ES_QUANTIDADE}, '${item.ES_UNIDADE ?? ''}')
                        MATCHING (ES_CODIGO)`
                    })
                    result = response.status === 200; 
                }
            }           
            return result;
        } catch (e) {
            throw new Error('Erro ao inserir Empreitadas.'+String(e))
        }
    }
}