export class ClienteModel {
  CODIGO: number;
  NOME: string;
  CPF_CNPJ?: string;
  RG?: string;
  FONE?: string;
  CELULAR?: string;
  ENDERECO?: string;
  NUMERO?: string;
  BAIRRO?: string;
  CIDADE?: string;
  constructor(codigo: number, nome: string){
    this.CODIGO = codigo;
    this.NOME = nome;
  }
}