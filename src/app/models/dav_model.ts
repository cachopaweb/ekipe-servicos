export interface DAVModel {
  DAV_CODIGO: number;
  DAV_DATA: string;
  DAV_HORA: string;
  DAV_FUN: number;
  DAV_VALOR: number;
  DAV_CLI: number;
  DAV_FORMAS_PGM: string;
  DAV_VALIDADE: string;
  DAV_ESTADO: number;
  DAV_NOVO: number;
  DAV_FUNCAO: string;
  DAV_VENDA: number;
  DAV_CLIENTE: string;
  DAV_CPF_CNPJ: string;
  DAV_FATURA: number;
  DAV_VALOR_FISCAL?: any;
  DAV_NF?: any;
  DAV_VALOR_VENDA?: any;
}

export interface DAVProModel {
  DP_CODIGO: number;
  DP_DAV: number;
  DP_PRO: number;
  DP_QUANTIDADE: number;
  DP_VALOR: number;
  DP_VALORR: number;
  DP_VALORL: number;
  DP_VALORF: number;
  DP_LUCRO: number;
  DP_ALIQICMS: string;
  DP_NOME: string;
  DP_GTIN: string;
  DP_EMBALAGEM: string;
  DP_CANCELADO: string;
  DP_DATA: string;
  DP_NITEM: number;
  DP_ACRESCIMO: number;
  DP_DESCONTO: number;
  DP_SIT_TRIB: string;
}