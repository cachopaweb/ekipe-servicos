import EmpreitadasServicosModel from "./empreitada_servicos_model";

export interface ItemRelatorioEmpreitada {
  EMP_CODIGO: number;
  EMP_ORD: number;
  EMP_PROTOCOLO?: string;
  EMP_NFS?: string;
  EMP_LOJA?: string;
  EMP_PEDIDO?: string;
  EMP_VALOR: number;
  EMP_DATA_EMISSAO?: string;
  EMP_COORDENADOR?: string;
  ORD_OM?: string;
  ORD_CLI?: number;
  CLI_NOME?: string;
  VALOR_RECEBIDO: number;
  ITENS?: EmpreitadasServicosModel[];
}

export interface FiltroRelatorioParams {
  dataInicio?: string;
  dataFim?: string;
  clienteId?: number;
  coordenador?: string;
}
