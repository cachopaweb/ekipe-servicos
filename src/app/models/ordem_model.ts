export default interface OrdemModel {
  ORD_CODIGO: number;
  ORD_DATA: string;
  ORD_VALOR: number;
  ORD_FUN: number;
  ORD_CLI: number;
  CLI_NOME: string;
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
}