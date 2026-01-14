import { PedEstModel } from "./ped_est_model";

export interface PedidoModel {
  PED_CODIGO: number,
  PED_DATA: string,
  PED_VALOR: number,
  PED_FUN: number,
  PED_TIPO: string,
  PED_CLI: number,
  itensPedEst: PedEstModel[]
}