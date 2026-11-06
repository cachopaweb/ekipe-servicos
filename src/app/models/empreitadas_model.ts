import CliForModel from "./cli_for_model";
import EmpreitadasServicosModel from "./empreitada_servicos_model";

export default interface EmpreitadasModel {
  EMP_CODIGO: number;
  EMP_FOR: number;
  EMP_ORD: number;
  FOR_NOME?: string;
  EMP_OBS?: string;
  EMP_LOCAL_EXECUCAO_SERVICOS?: string;
  LRC_FAT2?: number;
  EMP_FAT?: number;
  EMP_NFS?: string | number;
  EMP_LOJA?: string;
  EMP_PEDIDO?: string;
  EMP_VALOR?: number;
  EMP_DATA_EMISSAO?: string;
  EMP_FUN?: number;
  EMP_COORDENADOR?: string;
  VALOR_RECEBIDO?: number;
  ITENS?: EmpreitadasServicosModel[];
  FORNECEDOR?: CliForModel;
}
