import api from "../services/api";
import { UsuarioModel } from "../models/usuario_model";

export default class UsuarioRepository{
    async login(usuario: string, senha: string): Promise<boolean>{
        try {
            const response = await api.post('/login', {
                'login': usuario,
                'senha': senha,
            });            
            
            return response.status === 200;
        } catch (error) {
            throw new Error('Usuario ou senha incorretos.');
        }
    }

    async getUsers(): Promise<UsuarioModel[]>{
        try {
            const response = await api.post('/dataset', {
                'sql': "SELECT USU_CODIGO, USU_LOGIN, USU_FUN, FUN_NOME FROM USUARIOS, FUNCIONARIOS WHERE FUN_CODIGO = USU_FUN AND FUN_ESTADO <> 'INATIVO'"
            });
            const user = response.data as UsuarioModel[];
            return user;
        } catch (error) {
            throw new Error('Erro ao tentar logar');
        }
    }
}