import { FormatDate, GeraCodigo } from "../functions/utils";
import Empreitadas from "../home/empreitadas/page";
import EmpreitadasServicosModel from "../models/empreitada_servicos_model";
import EmpreitadasModel from "../models/empreitadas_model";
import api from "../services/api";

export default class EmpreitadasRepository{
    async buscaEmpreitadas(codigo: number): Promise<EmpreitadasModel[]>{
        const sql = `SELECT EMP_CODIGO, EMP_FOR, FOR_NOME, EMP_OBS, EMP_LOCAL_EXECUCAO_SERVICOS, LRC_FAT2, EMP_FAT
                 FROM EMPREITADAS JOIN FORNECEDORES ON EMP_FOR = FOR_CODIGO LEFT JOIN LANCAMENTO_REC_CUS ON ((LRC_TIPO = 'C') 
                 AND (FOR_CODIGO = LRC_CLI_FOR) AND (EMP_FAT = LRC_FAT2) AND (LRC_DATAC = '01/01/1900')) WHERE EMP_ORD = ${codigo} 
                 ORDER BY EMP_CODIGO`
        const obj = {
            'sql': sql
                     
        }
        try {
            const response = await api.post('/dataset', obj)
            let data = [];
            if(response.data instanceof Array){
                data = response.data;
            }else{
                data = [response.data]
            }
            return data as EmpreitadasModel[];
        } catch (e) {
            throw new Error('Erro ao buscar Empreitadas.'+String(e))
        }
    }


    async buscaEmpreitadaById(id: number): Promise<EmpreitadasModel>{

        const sql = `SELECT EMP_CODIGO, EMP_FOR, FOR_NOME, EMP_OBS, EMP_LOCAL_EXECUCAO_SERVICOS, LRC_FAT2 
                 FROM EMPREITADAS JOIN FORNECEDORES ON EMP_FOR = FOR_CODIGO LEFT JOIN LANCAMENTO_REC_CUS ON ((LRC_TIPO = 'C') 
                 AND (FOR_CODIGO = LRC_CLI_FOR) AND (EMP_FAT = LRC_FAT2) AND (LRC_DATAC = '01/01/1900')) WHERE EMP_CODIGO = ${id}`
        const obj = {
            'sql': sql
                     
        }
        try {
            const response = await api.post('/dataset', obj);

            return response.data as EmpreitadasModel;
        } catch (e) {
            throw new Error('Erro ao buscar Empreitada.'+String(e))
        }
    }

    async buscaServicosEmpreitadas(codigo: number): Promise<EmpreitadasServicosModel[]>{
        const sql = `SELECT ES_CODIGO, ES_EMP, CAST(ES_DESCRICAO AS VARCHAR(1000)) DESCRICAO, ES_VALOR, ES_PRAZO_CONCLUSAO, 
                ES_QUANTIDADE, ES_VALOR/ES_QUANTIDADE VLR_UNIT, ES_UNIDADE FROM EMPREITADAS_SERVICOS WHERE ES_EMP = ${codigo} 
                ORDER BY ES_CODIGO`;
        const obj = {
            'sql': sql  
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
        const sql =  `UPDATE OR INSERT INTO EMPREITADAS (EMP_CODIGO, EMP_ORD, EMP_FOR, EMP_FAT, EMP_OBS, EMP_LOCAL_EXECUCAO_SERVICOS, EMP_NFS)
        VALUES (${empreitada.EMP_CODIGO}, ${empreitada.EMP_ORD}, ${empreitada.EMP_FOR}, ${empreitada.EMP_FAT ?? 0}, '${empreitada.EMP_OBS ?? ''}', 
        '${empreitada.EMP_LOCAL_EXECUCAO_SERVICOS ?? ''}', '${empreitada.EMP_NFS ?? ''}')
        MATCHING (EMP_CODIGO)`;
        
        try {                     
            const response = await api.post('/dataset', {
                'sql': sql
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
                    item.ES_CODIGO = await GeraCodigo('EMPREITADAS_SERVICOS', 'ES_CODIGO');
                    const response = await api.post('/dataset', {
                        'sql': `UPDATE OR INSERT INTO EMPREITADAS_SERVICOS (ES_CODIGO, ES_EMP, ES_DESCRICAO, ES_VALOR, ES_PRAZO_CONCLUSAO, ES_QUANTIDADE, ES_UNIDADE)
                        VALUES (${item.ES_CODIGO}, ${item.ES_EMP}, '${item.DESCRICAO}', ${item.ES_VALOR}, '${item.ES_PRAZO_CONCLUSAO != null ? FormatDate(item.ES_PRAZO_CONCLUSAO) : null}', ${item.ES_QUANTIDADE}, '${item.ES_UNIDADE ?? ''}')
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