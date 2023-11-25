export default interface PFParcelaModel {
  PP_CODIGO: number;
  PP_PF: number;
  PP_TP: number;
  PP_VALOR: number;
  PP_VENCIMENTO: Date;
  PP_JUROS: number;
  PP_DESCONTOS: number;
  PP_DUPLICATA: string;
  PP_VALORPG: number;
  PP_ESTADO: number;
  DescricaoTipoPgm?: string;
}