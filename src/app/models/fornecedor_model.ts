
export enum TipoPessoa {
    FISICA = 'Física',
    JURIDICA = 'Jurídica'
  }
  
  export enum Fidelidade {
    NENHUMA = 'Nenhuma',
    RUIM = 'Ruim',
    REGULAR = 'Regular',
    BOM = 'Bom',
    OTIMO = 'Otimo'
  }
  
  
  export enum Situacao {
    LIVRE = 'Livre',
    OBSERVACAO =  'Observação',
    BLOQUEADO = 'Bloqueado'
  }
  
export class FornecedorModel {
    CODIGO: number;
    NOME: string;
    ESTADO?:string;
    RAZAOSOCIAL?: string;
    TIPO?: TipoPessoa | string;
    CPF_CNPJ?: string;
    FONE?: string;
    CELULAR?: string;
    ENDERECO?: string;
    END_NUMERO?: number;
    CONTATO?: string;
    BAIRRO?: string;
    CODCIDADE?:number;
    CIDADE?: string;
    CEP?:string;
    INDICEIE?:string;
    INSCRICAOESTADUAL?:string;
    INSCRICAOMUNICIPAL?:string;
    SUFRAMA?: string;
    DATACADASTRO?:string;
    EMAIL?:string;
    OBS?:string;
    constructor(codigo: number, nome: string){
      this.CODIGO = codigo;
      this.NOME = nome;
    }
  }