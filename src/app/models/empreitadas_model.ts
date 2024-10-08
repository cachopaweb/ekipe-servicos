import CliForModel from "./cli_for_model";
import EmpreitadasServicosModel from "./empreitada_servicos_model";

export default interface EmpreitadasModel {
  EMP_CODIGO: number;
  EMP_FOR: number;
  EMP_ORD: Number;
  FOR_NOME: string;
  EMP_OBS?: string;
  EMP_LOCAL_EXECUCAO_SERVICOS?: string;
  LRC_FAT2?: number;
  EMP_FAT?: number;
  EMP_NFS?: number;
  EMP_VALOR: number;
  ITENS: EmpreitadasServicosModel[];
  FORNECEDOR?: CliForModel;
}