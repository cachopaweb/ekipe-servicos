export default interface PagamentosModel {
  PAG_CODIGO: number;
  PAG_VALOR: number;
  PAG_VENCIMENTO: string;
  PAG_JUROS: number;
  PAG_ESTADO: number;
  PAG_DUPLICATA: string;
  PAG_FPG: number;
  PAG_FAT2: number;
  PAG_DESCONTOS: number;
  PAG_CAI: number;
  PAG_TIPO: string;
  PAG_SITUACAO: number;
  PAG_OBS?: string;
  PAG_CON: number;
  PAG_DATAC: string;
}