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


export class ClienteModel {
  CODIGO: number;
  NOME: string;
  RAZAOSOCIAL?: string;
  TIPO?: TipoPessoa | string;
  CPF_CNPJ?: string;
  RG?: string;
  FONE?: string;
  CELULAR?: string;
  ENDERECO?: string;
  NUMERO?: string;
  BAIRRO?: string;
  CODCIDADE?:number;
  CIDADE?: string;
  CEP?:string;
  FIDELIDADE?: Fidelidade;
  INADIPLENCIA?:number;
  DESCONTO?:number;
  SITUACAO?: Situacao;
  LIMITE?:number;
  DATANASCIMENTO?:string;
  PAI?:string;
  MAE?: string;
  CONJUGE?:string;
  INDICEIE?:string;
  INSCRICAOESTADUAL?:string;
  INSCRICAOMUNICIPAL?:string;
  SUFRAMA?: string;
  ESTADO?:string;
  DATACADASTRO?:string;
  EMAIL?:string;
  OBS?:string;
  LATITUDE?:string;
  LONGITUDE?:string;
  constructor(codigo: number, nome: string){
    this.CODIGO = codigo;
    this.NOME = nome;
  }
}