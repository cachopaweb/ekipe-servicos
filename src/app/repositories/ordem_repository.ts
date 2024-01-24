import { FormatDate } from "../functions/utils";
import OrdEstModel from "../models/ord_est_model";
import OrdSerModel from "../models/ord_ser_model";
import OrdemModel from "../models/ordem_model";
import api from "../services/api";

export default class OrdemRepository {
    async insereordem(ordem: OrdemModel): Promise<boolean> {
        const sql = {
            'sql':
                `UPDATE OR INSERT INTO ORDENS (ORD_CODIGO, ORD_DATA, ORD_VALOR, ORD_HORA, ORD_FUN, ORD_CLI, ORD_DATAC, ORD_OBS, ORD_ESTADO,
                 ORD_DESCONTO_P, ORD_DESCONTO_S, ORD_DEVOLUCAO_P, ORD_USADO, ORD_SOLICITACAO, ORD_OBS_ADM, ORD_NFS, ORD_FAT)
                 VALUES (${ordem.ORD_CODIGO}, '${ordem.ORD_DATA}', ${ordem.ORD_VALOR}, '${new Date().toLocaleTimeString()}', 
                 ${ordem.ORD_FUN}, ${ordem.ORD_CLI}, '1900-01-01', '${ordem.ORD_OBS}', '${ordem.ORD_ESTADO}', ${ordem.ORD_DESCONTO_P}, 
                 ${ordem.ORD_DESCONTO_S}, '${ordem.ORD_DEVOLUCAO_P}', 0, '${ordem.ORD_SOLICITACAO}', '${ordem.ORD_OBS_ADM}', '${ordem.ORD_NFS}', ${ordem.ORD_FAT ?? 0})
                 MATCHING (ORD_CODIGO)`
        }
        try {
            const response = await api.post('/dataset', sql)
            return response.status === 200;
        } catch (e) {
            throw new Error('Erro ao inserir Ordem.' + String(e))
        }
    }

    async insereServicos(codOrdem: number, servico: OrdSerModel): Promise<boolean> {
        const obj = {
            'sql':
                `UPDATE OR INSERT INTO ORD_SER (OS_CODIGO, OS_ORD, OS_SER, OS_VALOR, OS_NOME, OS_TIPO, OS_VALORR, OS_UNIDADE_MED, OS_QUANTIDADE)
                 VALUES (${servico.OS_CODIGO}, ${codOrdem}, ${servico.OS_SER}, ${servico.OS_VALOR}, '${servico.OS_NOME}', '1', 
                 ${servico.OS_VALOR}, '${servico.OS_UNIDADE_MED}', ${servico.OS_QUANTIDADE})  MATCHING (OS_CODIGO)`
        }
        try {
            const response = await api.post('/dataset', obj)
            return response.status === 200;
        } catch (e) {
            throw new Error('Erro ao inserir Servicos ordem.' + String(e))
        }
    }
    async insereProdutos(codOrdem: number, produto: OrdEstModel): Promise<boolean> {
        const obj = {
            'sql':
                `UPDATE OR INSERT INTO ORD_EST (ORE_CODIGO, ORE_ORD, ORE_PRO, ORE_QUANTIDADE, ORE_VALOR, ORE_LUCRO, ORE_VALORR,
                 ORE_VALORL, ORE_VALORF, ORE_NOME, ORE_VALORC, ORE_VALORCM, ORE_ALIQICMS, ORE_EMBALAGEM)
                 VALUES (${produto.ORE_CODIGO}, ${codOrdem}, ${produto.ORE_PRO}, ${produto.ORE_QUANTIDADE}, ${produto.ORE_VALOR}, 0, ${produto.ORE_VALOR}, 0, 0,
                 '${produto.ORE_NOME}', 0, 0, 0, '${produto.ORE_EMBALAGEM}')
                 MATCHING (ORE_CODIGO)`
        }
        try {
            const response = await api.post('/dataset', obj)
            return response.status === 200;
        } catch (e) {
            throw new Error('Erro ao inserir Produtos ordem.' + String(e))
        }
    }

    async buscaOrdem(codigo: number): Promise<OrdemModel> {
        const obj = {
            'sql':
                `SELECT ORD_CODIGO, ORD_DATA, ORD_VALOR, ORD_FUN, CLI_CNPJ_CPF, ORD_CLI, CLI_NOME,
                CLI_FONE, CLI_BAIRRO, CLI_ENDERECO, CLI_NUMERO, ORD_OBS, ORD_ESTADO, CID_NOME, CID_UF,
                ORD_DESCONTO_P, ORD_DESCONTO_S, ORD_FAT, ORD_DEVOLUCAO_P, ORD_SOLICITACAO, ORD_OBS_ADM, ORD_NFS, FUN_NOME 
                FROM ORDENS JOIN CLIENTES ON ORD_CLI = CLI_CODIGO 
                JOIN FUNCIONARIOS ON FUN_CODIGO = ORD_FUN 
                JOIN CIDADES ON CID_CODIGO = CLI_CID
                WHERE ORD_CODIGO = ${codigo}`
        }
        try {
            const response = await api.post('/dataset', obj)
            return response.data as OrdemModel;
        } catch (e) {
            throw new Error('Erro ao buscar Ordem.' + String(e))
        }
    }

    async buscaProdutosOrdem(codigo: number): Promise<OrdEstModel[]> {
        const obj = {
            'sql':
                `SELECT ORE_CODIGO, ORE_ORD, ORE_PRO, ORE_QUANTIDADE, ORE_VALOR, ORE_LUCRO, ORE_VALORR, ORE_VALORL, 
                ORE_VALORF, ORE_NOME, ORE_VALORC, ORE_VALORCM, ORE_ALIQICMS, ORE_EMBALAGEM, PRO_DESCRICAO 
                FROM ORD_EST JOIN PRODUTOS ON ORE_PRO = PRO_CODIGO WHERE ORE_ORD = ${codigo} ORDER BY ORE_CODIGO`
        }
        try {
            const response = await api.post('/dataset', obj)
            let data = [];
            if ((JSON.stringify(response.data) !== '{}') && !Array.isArray(response.data)) {
                data.push(response.data);
            } else {
                data = response.data;
            }
            return data as OrdEstModel[];
        } catch (e) {
            throw new Error('Erro ao buscar Produtos da Ordem.' + String(e))
        }
    }

    async buscaServicosOrdem(codigo: number): Promise<OrdSerModel[]> {
        const obj = {
            'sql':
                `SELECT OS_CODIGO, OS_ORD, OS_SER, OS_VALOR, OS_NOME, OS_TIPO, 
                OS_VALORR, OS_UNIDADE_MED, OS_QUANTIDADE FROM ORD_SER 
                WHERE OS_ORD = ${codigo} ORDER BY OS_CODIGO`
        }
        try {
            const response = await api.post('/dataset', obj)
            let data = [];
            if ((JSON.stringify(response.data) !== '{}') && !Array.isArray(response.data)) {
                data.push(response.data);
            } else {
                data = response.data;
            }
            return data as OrdSerModel[];
        } catch (e) {
            throw new Error('Erro ao buscar Serviços da Ordem.' + String(e))
        }
    }

    async pesquisaOrdem(textoBusca: string, tipoBusca: string, porPeriodo: boolean, status: string, data1: Date, data2: Date): Promise<OrdemModel[]> {
        try {
            let SQL = `SELECT FIRST 10 ORD_CODIGO, ORD_DATA, ORD_VALOR, ORD_FUN, ORD_CLI, CLI_NOME, ORD_OBS, ORD_ESTADO, 
                       ORD_DESCONTO_P, ORD_DESCONTO_S, ORD_FAT, ORD_DEVOLUCAO_P, ORD_SOLICITACAO, ORD_OBS_ADM, ORD_NFS 
                       FROM ORDENS JOIN CLIENTES ON ORD_CLI = CLI_CODIGO WHERE [PERIODO][STATUS][BUSCA] 
                       ORDER BY [ORDEM]`;
            if (textoBusca != '') {
                switch (tipoBusca) {
                    case "Nome":
                        {
                            SQL = SQL.replace('[BUSCA]', ` AND CLI_NOME LIKE '%${textoBusca}%'`);
                            // SQL = SQL.replace('[ORDEM]', 'CLI_NOME, ORD_CODIGO DESC');
                            break;
                        }
                    case "Solicitacao": {
                        SQL = SQL.replace('[BUSCA]', ` AND ORD_SOLICITACAO LIKE '%${textoBusca}%'`);
                        // SQL = SQL.replace('[ORDEM]', 'ORD_SOLICITACAO, ORD_CODIGO DESC');
                        break;
                    };
                }
            }
            else
                SQL = SQL.replace('[BUSCA]', '');
            if (porPeriodo)
                SQL = SQL.replace('[PERIODO]', ` ${textoBusca != '' ? 'AND' : ''} ORD_DATA BETWEEN '${FormatDate(data1)}' AND '${FormatDate(data2)}'`)
            else
                SQL = SQL.replace('[PERIODO]', '');
            if (status != '')                
                SQL = SQL.replace('[STATUS]', ` ${porPeriodo ? 'AND' : ''} ORD_ESTADO = '${status}'`)
            else
                SQL = SQL.replace('[STATUS]', '');
            // Para o caso da string não ter sido substituída ainda
            SQL = SQL.replace('[ORDEM]', 'ORD_CODIGO DESC');
            const response = await api.post('/dataset', {'sql': SQL})
            let data = [];
            if (response.data instanceof Array){
                data = response.data;
            }else{
                data = [response.data];
            }
            return data as OrdemModel[];
        } catch (e) {
            throw new Error('Erro ao buscar Ordem' + String(e))
        }
    }
}