import { VenEstModel } from "./ven_est_model";

export interface VendaModel {
  VEN_CODIGO: number,
  VEN_DATA: string,
  VEN_VALOR: number,
  VEN_HORA: string,
  VEN_FUN: number,
  VEN_NF: number,
  VEN_DIFERENCA: number,
  VEN_DATAC: string,
  VEN_FAT: number,
  VEN_DAV: number,
  VEN_CLI: number,
  VEN_DEVOLUCAO_P: string,
  VEN_VENDEDOR: number,
  itensVenEst: VenEstModel[]
}