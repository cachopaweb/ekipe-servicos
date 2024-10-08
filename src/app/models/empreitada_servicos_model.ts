export default interface EmpreitadasServicosModel {
  ES_CODIGO: number;
  ES_EMP: number;
  DESCRICAO: string;
  ES_VALOR?: number;
  ES_PRAZO_CONCLUSAO?: string;
  ES_QUANTIDADE?: number;
  VLR_UNIT?: number;
  ES_UNIDADE?: string;
  ITENS?: EmpreitadasServicosModel[];
}