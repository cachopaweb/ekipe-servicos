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

export interface PagamentoEmpreitadaItem {
  PAG_CODIGO: number;
  PAG_VALOR: number;
  PAG_VENCIMENTO: string;
  PAG_JUROS?: number;
  PAG_ESTADO: number;
  PAG_DUPLICATA: string;
  PAG_FPG?: number;
  PAG_FAT2: number;
  PAG_DESCONTOS?: number;
  PAG_CAI?: number;
  PAG_TIPO: string;
  PAG_SITUACAO: number;
  PAG_OBS?: string | null;
  PP_CODIGO?: number | null;
  PP_DATAPGM?: string | null;
  PP_DINHEIRO?: number | null;
  PP_HORA?: string | null;
}

export interface RegistrarPagamentoParams {
  empCodigo: number;
  ordCodigo: number;
  empFat?: number | null;
  empFor?: number;
  valor: number;
  data: string | Date;
  formaPgm: string;
  duplicata?: string;
  obs?: string;
  idempotencyKey?: string;
  funCodigo?: number;
}

export interface EstornarPagamentoParams {
  codPag: number;
  motivo: string;
  funCodigo?: number;
}
