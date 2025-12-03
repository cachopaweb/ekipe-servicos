import OrdEstModel from "./ord_est_model";
import OrdSerModel from "./ord_ser_model";

export default interface OrdemModel {
  ORD_CODIGO: number;
  ORD_DATA: string;
  ORD_VALOR: number;
  ORD_FUN: number;
  ORD_CLI: number;
  CLI_NOME: string;
  CLI_CNPJ_CPF: string;
  CLI_ENDERECO: string;
  CLI_NUMERO: string;
  CLI_BAIRRO: string;
  CLI_FONE: string;
  CID_NOME?: string;
  CID_UF?: string;
  ORD_OBS: string;
  ORD_ESTADO: string;
  ORD_DESCONTO_P: number;
  ORD_DESCONTO_S: number;
  ORD_FAT?: number;
  ORD_DEVOLUCAO_P: string;
  ORD_SOLICITACAO: string;
  ORD_OBS_ADM: string;
  ORD_NFS?: string;
  FUN_NOME?: string;
  itensOrdEst: OrdEstModel[];
  itensOrdSer: OrdSerModel[];
  ORD_FORNECEDOR?: number;
  PARCEIRO?: string;
  ORD_VALOR_DESCONTO?: number;
  ORD_PORCENTAGEM_DESCONTO?: number;
  ORD_TOTAL_SEM_DESCONTO?: number;
}