import { escapeSql, FormatDate } from "../functions/utils";

import { EstadoFornecedor, FornecedorModel } from "../models/fornecedor_model";
import api from "../services/api";

const CAMPOS_LISTAGEM_FORNECEDOR = `FOR_CODIGO AS CODIGO, FOR_NOME AS NOME, FOR_CNPJ_CPF AS CPF_CNPJ,
  FOR_FONE AS FONE, FOR_CELULAR AS CELULAR, FOR_ENDERECO AS ENDERECO, FOR_END_NUMERO AS END_NUMERO, FOR_ESTADO AS ESTADO`;

export default class FornecedorRepository {
  private async executarConsultaLista(sql: string, mensagemErro: string): Promise<FornecedorModel[]> {
    try {
      const response = await api.post("/dataset", { sql });
      const raw = response.data;
      const lista = Array.isArray(raw) ? raw : raw ? [raw] : [];
      return lista.filter(
        (item): item is FornecedorModel =>
          Boolean(
            item &&
              typeof item === "object" &&
              "CODIGO" in item &&
              item.CODIGO !== undefined &&
              item.CODIGO !== null
          )
      );
    } catch {
      throw new Error(mensagemErro);
    }
  }

  async setFornecedor(fornecedor: FornecedorModel): Promise<boolean> {
    try {
      const sql = `UPDATE OR INSERT INTO FORNECEDORES (FOR_CODIGO, FOR_NOME, FOR_ENDERECO, FOR_BAIRRO, FOR_CIDADE, FOR_CEP,
                                    FOR_FONE, FOR_CONTATO, FOR_EMAIL, FOR_DATAC, FOR_CELULAR,
                                    FOR_OBS, FOR_CNPJ_CPF, FOR_INSC_ESTADUAL, FOR_INSC_MUNICIPAL,
                                    FOR_END_NUMERO, FOR_TIPO, FOR_SUFRAMA, FOR_INDIC_IE,
                                    FOR_CID, FOR_RAZAO_SOCIAL, FOR_FANTASIA, FOR_ESTADO, FOR_LATITUDE, FOR_LONGITUDE)
                              VALUES (${fornecedor.CODIGO}, '${fornecedor.NOME}', '${fornecedor.ENDERECO ?? ""}', '${fornecedor.BAIRRO ?? ""}', '${fornecedor.CIDADE ?? ""}', '${fornecedor.CEP ?? ""}',
                              '${fornecedor.FONE ?? ""}', '${fornecedor.CONTATO ?? ""}', '${fornecedor.EMAIL ?? ""}', '${fornecedor.DATACADASTRO ?? ""}', '${fornecedor.CELULAR ?? ""}', 
                              '${fornecedor.OBS ?? ""}', '${fornecedor.CPF_CNPJ ?? ""}', '${fornecedor.INSCRICAOESTADUAL ?? ""}', '${fornecedor.INSCRICAOMUNICIPAL ?? ""}', ${fornecedor.END_NUMERO ?? 0}, 
                              '${fornecedor.TIPO ?? ""}', '${fornecedor.SUFRAMA ?? ""}', '${fornecedor.INDICEIE ?? ""}', '${fornecedor.CODCIDADE ?? ""}', '${fornecedor.RAZAOSOCIAL ?? ""}', '${fornecedor.NOME ?? ""}', 
                              '${fornecedor.ESTADO ?? "ATIVO"}', '${fornecedor.LATITUDE ?? ""}', '${fornecedor.LONGITUDE ?? ""}')
                              MATCHING (FOR_CODIGO)`;
      const response = await api.post("/dataset", {
        sql,
      });
      return response.status === 200;
    } catch (error) {
      throw new Error("erro ao salvar fornecedor.\n" + String(error));
    }
  }

  async setEstadoFornecedor(codigo: number, novoEstado: EstadoFornecedor): Promise<boolean> {
    try {
      const sql = `UPDATE FORNECEDORES SET FOR_ESTADO = '${novoEstado}' WHERE FOR_CODIGO = ${codigo}`;
      const response = await api.post("/dataset", { sql });
      return response.status === 200;
    } catch (error) {
      throw new Error("erro ao alterar status do fornecedor.\n" + String(error));
    }
  }

  async getAllFornecedores(): Promise<FornecedorModel[]> {
    const sql = `SELECT ${CAMPOS_LISTAGEM_FORNECEDOR}, FOR_RAZAO_SOCIAL AS RAZAOSOCIAL, FOR_LATITUDE AS LATITUDE, FOR_LONGITUDE AS LONGITUDE FROM FORNECEDORES WHERE UPPER(TRIM(COALESCE(FOR_ESTADO, ''))) <> 'INATIVO'`;
    return this.executarConsultaLista(sql, "erro ao buscar Fornecedores");
  }

  async getFornecedoresPorObs(busca: string): Promise<FornecedorModel[]> {
    const sql = `SELECT ${CAMPOS_LISTAGEM_FORNECEDOR} FROM FORNECEDORES WHERE (FOR_OBS LIKE '%${escapeSql(busca.toUpperCase())}%')`;
    return this.executarConsultaLista(sql, "erro ao buscar Fornecedores");
  }

  async getFornecedoresPorCidade(busca: number): Promise<FornecedorModel[]> {
    const sql = `SELECT ${CAMPOS_LISTAGEM_FORNECEDOR} FROM FORNECEDORES WHERE (FOR_CID = '${busca}')`;
    return this.executarConsultaLista(sql, "erro ao buscar Fornecedores");
  }

  async getFornecedoresPorNomeFantasia(busca: string): Promise<FornecedorModel[]> {
    const sql = `SELECT ${CAMPOS_LISTAGEM_FORNECEDOR} FROM FORNECEDORES WHERE (FOR_FANTASIA LIKE '%${escapeSql(busca.toUpperCase())}%')`;
    return this.executarConsultaLista(sql, "erro ao buscar Fornecedores");
  }

  async getFornecedoresPorNome(busca: string): Promise<FornecedorModel[]> {
    const sql = `SELECT ${CAMPOS_LISTAGEM_FORNECEDOR} FROM FORNECEDORES WHERE (FOR_NOME LIKE '%${escapeSql(busca.toUpperCase())}%')`;
    return this.executarConsultaLista(sql, "erro ao buscar Fornecedores");
  }

  async getFornecedorById(id: number): Promise<FornecedorModel> {
    try {
      const sql = `SELECT FOR_CODIGO AS CODIGO, FOR_NOME AS NOME, FOR_RAZAO_SOCIAL AS RAZAOSOCIAL, FOR_TIPO AS TIPO, FOR_CNPJ_CPF AS CPF_CNPJ,
          FOR_FONE AS FONE, FOR_CELULAR AS CELULAR, FOR_ENDERECO AS ENDERECO, FOR_BAIRRO AS BAIRRO,
          FOR_CIDADE AS CIDADE, FOR_CID AS CODCIDADE, FOR_CEP AS CEP, FOR_END_NUMERO AS END_NUMERO, FOR_CONTATO AS CONTATO,
          FOR_INDIC_IE AS INDICEIE, FOR_INSC_ESTADUAL AS INSCRICAOESTADUAL, FOR_INSC_MUNICIPAL AS INSCRICAOMUNICIPAL, FOR_SUFRAMA AS SUFRAMA, FOR_LATITUDE AS LATITUDE, FOR_LONGITUDE AS LONGITUDE,
           FOR_ESTADO AS ESTADO, FOR_DATAC AS DATACADASTRO, FOR_EMAIL AS EMAIL, FOR_OBS AS OBS FROM FORNECEDORES WHERE FOR_CODIGO = '${id}'`;
      const response = await api.post("/dataset", {
        sql,
      });
      return response.data;
    } catch {
      throw new Error("erro ao buscar fornecedor");
    }
  }
}