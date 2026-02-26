import api from "../services/api";
import { FuncionarioModel, UsuarioModel } from "../models/usuario_model";

export default class UsuarioRepository {
    async login(login: string, senha: string): Promise<UsuarioModel | null> {
        try {
            const response = await api.post('/login', { login, senha }, {
                headers: { 'Content-Type': 'application/json' },
                validateStatus: function (status) {
                    return status <500;
                }
            });

            if (response.status === 200) {
                return response.data as UsuarioModel; // servidor retorna o usuário autenticado
            } // adicionei tratamento de erros mais específico para status 401 e 500, para dar feedback mais claro ao usuário
            else if (response.status === 401) {
                throw new Error('Credenciais inválidas.');
            }
            else if (response.status === 500) {
                throw new Error('Erro interno do servidor.');
            }
            else {
                throw new Error('Erro desconhecido.');
            }
        } catch (error: any) {
            throw new Error(error.message || 'Não foi possivel conectar ao servidor.');
    }   
        } 
    
   

    async mudaEstadoUsuario(usuario: UsuarioModel): Promise<boolean> {

        var estado: string = ''

        if (usuario.FUN_ESTADO === 'ATIVO') {
            estado = 'INATIVO'
        }
        else {
            estado = 'ATIVO'
        }

        try {
            const response = await api.post('/dataset', {
                'sql': `UPDATE funcionarios SET FUN_ESTADO = '${estado}' WHERE FUN_CODIGO = ${usuario.USU_FUN};`
            });
            return response.status === 200;
        } catch (error) {
            throw new Error('Erro ao alterar o estado do usuário');
        }

    }

    async getFuncionario(id: number): Promise<FuncionarioModel> {
        try {
            const response = await api.post('/dataset', {
                'sql': `SELECT FUN_CODIGO, FUN_NOME, FUN_EMAIL, FUN_FONE FROM FUNCIONARIOS WHERE FUN_CODIGO = ${id} AND FUN_ESTADO <> 'INATIVO'`
            });
            const user = response.data as FuncionarioModel;
            return user;
        } catch (error) {
            throw new Error('Erro ao tentar logar');
        }

    }
    async getAllUsersLessSuport(): Promise<UsuarioModel[]> {
        try {
            const response = await api.post('/dataset', {
                'sql': "SELECT USU_CODIGO, USU_LOGIN, USU_FUN, FUN_NOME, FUN_ESTADO FROM USUARIOS, FUNCIONARIOS WHERE FUN_CODIGO = USU_FUN AND USU_FUN <> 1"
            });
            const user = response.data as UsuarioModel[];
            return user;
        } catch (error) {
            throw new Error('Erro ao tentar logar');
        }
    }


    async getAllUsers(): Promise<UsuarioModel[]> {
        try {
            const response = await api.post('/dataset', {
                'sql': "SELECT USU_CODIGO, USU_LOGIN, USU_FUN, FUN_NOME, FUN_ESTADO FROM USUARIOS, FUNCIONARIOS WHERE FUN_CODIGO = USU_FUN"
            });
            const user = response.data as UsuarioModel[];
            return user;
        } catch (error) {
            throw new Error('Erro ao tentar logar');
        }
    }

    async getUsers(): Promise<UsuarioModel[]> {
        try {
            const response = await api.post('/dataset', {
                'sql': "SELECT USU_CODIGO, USU_LOGIN, USU_FUN, FUN_NOME, FUN_ESTADO FROM USUARIOS, FUNCIONARIOS WHERE FUN_CODIGO = USU_FUN AND FUN_ESTADO <> 'INATIVO'"
            });
            const user = response.data as UsuarioModel[];
            return user;
        } catch (error) {
            throw new Error('Erro ao tentar logar');
        }
    }
}