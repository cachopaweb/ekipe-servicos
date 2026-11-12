import api from "../services/api";
import { FuncionarioModel, PerfilUsuarioTipo, UsuarioModel } from "../models/usuario_model";

export const PERMISSAO_WEB_ADMIN = 'WEB_ADMIN';

function normalizeDatasetArray<T>(data: unknown): T[] {
    if (Array.isArray(data)) {
        return data as T[];
    }
    if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        return [data as T];
    }
    return [];
}

/**
 * Determina se o usuário possui perfil de administrador.
 * Usa o perfil carregado da tabela PERMISSOES quando disponível, mantendo
 * compatibilidade com sessões legadas via USU_FUN (1 ou 2).
 */
export function isUsuarioAdmin(usuario?: UsuarioModel | null): boolean {
    if (!usuario) return false;
    if (usuario.PERFIL) {
        return usuario.PERFIL === 'ADMIN';
    }
    return Number(usuario.USU_FUN) === 1 || Number(usuario.USU_FUN) === 2;
}

export default class UsuarioRepository {
    private async getWebAdminUserIds(throwOnError = false): Promise<Set<number>> {
        try {
            const response = await api.post('/dataset', {
                sql: `SELECT PER_USU FROM PERMISSOES WHERE PER_PERMISSAO = '${PERMISSAO_WEB_ADMIN}'`
            });
            const rows = normalizeDatasetArray<{ PER_USU: number }>(response.data);
            return new Set(
                rows
                    .map((row) => Number(row.PER_USU))
                    .filter((id) => !Number.isNaN(id) && id > 0)
            );
        } catch (error) {
            if (throwOnError) {
                throw error;
            }
            return new Set();
        }
    }

    private resolverPerfis(usuarios: UsuarioModel[], adminUserIds: Set<number>): UsuarioModel[] {
        const hasConfiguredAdmins = adminUserIds.size > 0;
        return usuarios.map((usuario) => {
            const usuFun = Number(usuario.USU_FUN);
            const usuCodigo = Number(usuario.USU_CODIGO);
            const isAdmin = usuFun === 1
                ? true
                : hasConfiguredAdmins
                    ? adminUserIds.has(usuCodigo)
                    : (usuFun === 1 || usuFun === 2);

            return {
                ...usuario,
                PERFIL: isAdmin ? 'ADMIN' : 'OPERADOR',
            };
        });
    }

    private async inserirPermissaoWebAdmin(usuCodigo: number): Promise<void> {
        const checkResp = await api.post('/dataset', {
            sql: `SELECT PER_CODIGO FROM PERMISSOES WHERE PER_USU = ${usuCodigo} AND PER_PERMISSAO = '${PERMISSAO_WEB_ADMIN}'`
        });
        const existentes = normalizeDatasetArray<{ PER_CODIGO: number }>(checkResp.data);
        if (existentes.length > 0) return;

        const maxResp = await api.post('/dataset', {
            sql: "SELECT COALESCE(MAX(PER_CODIGO), 0) + 1 AS NOVO_COD FROM PERMISSOES"
        });
        const maxRow = Array.isArray(maxResp.data) ? maxResp.data[0] : maxResp.data;
        const novoCodigo = parseInt(String(maxRow?.NOVO_COD || 1), 10);

        await api.post('/dataset', {
            sql: `INSERT INTO PERMISSOES (PER_CODIGO, PER_PERMISSAO, PER_USU) VALUES (${novoCodigo}, '${PERMISSAO_WEB_ADMIN}', ${usuCodigo})`
        });
    }

    private async inicializarAdminsLegadosSeNecessario(adminUserIds: Set<number>, usuarioLogado?: UsuarioModel | null): Promise<void> {
        if (adminUserIds.size > 0) return;

        const respLegados = await api.post('/dataset', {
            sql: "SELECT USU_CODIGO FROM USUARIOS WHERE USU_FUN IN (1, 2)"
        });
        const legados = normalizeDatasetArray<{ USU_CODIGO: number }>(respLegados.data);
        const codigosParaSemear = new Set<number>(
            legados.map((item) => Number(item.USU_CODIGO)).filter((id) => !Number.isNaN(id) && id > 0)
        );

        if (usuarioLogado?.USU_CODIGO) {
            codigosParaSemear.add(Number(usuarioLogado.USU_CODIGO));
        }

        for (const codigo of Array.from(codigosParaSemear)) {
            await this.inserirPermissaoWebAdmin(codigo);
        }
    }
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
            const [response, adminUserIds] = await Promise.all([
                api.post('/dataset', {
                    'sql': "SELECT USU_CODIGO, USU_LOGIN, USU_FUN, FUN_NOME, FUN_ESTADO FROM USUARIOS, FUNCIONARIOS WHERE FUN_CODIGO = USU_FUN AND USU_FUN <> 1"
                }),
                this.getWebAdminUserIds(false),
            ]);
            const users = normalizeDatasetArray<UsuarioModel>(response.data);
            return this.resolverPerfis(users, adminUserIds);
        } catch (error) {
            throw new Error('Erro ao carregar usuários');
        }
    }


    async getAllUsers(): Promise<UsuarioModel[]> {
        try {
            const [response, adminUserIds] = await Promise.all([
                api.post('/dataset', {
                    'sql': "SELECT USU_CODIGO, USU_LOGIN, USU_FUN, FUN_NOME, FUN_ESTADO FROM USUARIOS, FUNCIONARIOS WHERE FUN_CODIGO = USU_FUN"
                }),
                this.getWebAdminUserIds(false),
            ]);
            const users = normalizeDatasetArray<UsuarioModel>(response.data);
            return this.resolverPerfis(users, adminUserIds);
        } catch (error) {
            throw new Error('Erro ao carregar usuários');
        }
    }

    async getUsers(): Promise<UsuarioModel[]> {
        try {
            const [response, adminUserIds] = await Promise.all([
                api.post('/dataset', {
                    'sql': "SELECT USU_CODIGO, USU_LOGIN, USU_FUN, FUN_NOME, FUN_ESTADO FROM USUARIOS, FUNCIONARIOS WHERE FUN_CODIGO = USU_FUN AND FUN_ESTADO <> 'INATIVO'"
                }),
                this.getWebAdminUserIds(false),
            ]);
            const users = normalizeDatasetArray<UsuarioModel>(response.data);
            return this.resolverPerfis(users, adminUserIds);
        } catch (error) {
            throw new Error('Erro ao tentar logar');
        }
    }

    async getUsuarioComPerfil(usuCodigo: number): Promise<UsuarioModel | null> {
        try {
            const [response, adminUserIds] = await Promise.all([
                api.post('/dataset', {
                    'sql': `SELECT USU_CODIGO, USU_LOGIN, USU_FUN, FUN_NOME, FUN_ESTADO FROM USUARIOS, FUNCIONARIOS WHERE FUN_CODIGO = USU_FUN AND USU_CODIGO = ${Number(usuCodigo)}`
                }),
                this.getWebAdminUserIds(false),
            ]);
            const users = normalizeDatasetArray<UsuarioModel>(response.data);
            if (users.length === 0) return null;
            return this.resolverPerfis(users, adminUserIds)[0];
        } catch {
            return null;
        }
    }

    async alterarPerfilUsuario(
        usuarioAlvo: UsuarioModel,
        novoPerfil: PerfilUsuarioTipo,
        usuarioLogado?: UsuarioModel | null
    ): Promise<void> {
        const targetId = Number(usuarioAlvo.USU_CODIGO);
        if (!targetId || Number.isNaN(targetId)) {
            throw new Error('Usuário inválido.');
        }

        if (usuarioLogado && Number(usuarioLogado.USU_CODIGO) === targetId && novoPerfil !== 'ADMIN') {
            throw new Error('Você não pode rebaixar o seu próprio perfil.');
        }

        const adminUserIds = await this.getWebAdminUserIds(true);
        await this.inicializarAdminsLegadosSeNecessario(adminUserIds, usuarioLogado);

        if (novoPerfil === 'ADMIN') {
            await this.inserirPermissaoWebAdmin(targetId);
            return;
        }

        const usuariosVisiveis = await this.getAllUsersLessSuport();
        const outrosAdminsAtivos = usuariosVisiveis.filter(
            (u) => Number(u.USU_CODIGO) !== targetId && u.PERFIL === 'ADMIN' && u.FUN_ESTADO === 'ATIVO'
        );
        if (outrosAdminsAtivos.length === 0) {
            throw new Error('O sistema precisa manter pelo menos um administrador ativo.');
        }

        await api.post('/dataset', {
            sql: `DELETE FROM PERMISSOES WHERE PER_USU = ${targetId} AND PER_PERMISSAO = '${PERMISSAO_WEB_ADMIN}'`
        });
    }
}