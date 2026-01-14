import { IncrementaGenerator } from "../functions/utils";
import { VenEstModel } from "./ven_est_model";

export interface PedEstModel {
  PE_CODIGO: number,
  PE_VALOR: number,
  PE_QUANTIDADE: number,
  PE_PED: number,
  PE_PRO: number,
  PE_LUCRO?: number,
  PE_VALORR?: number,
  PE_VALORL?: number,
  PE_LIQUIDO?: number,
  PE_VALOR2?: number,
  PE_VALORCM?: number,
  PE_VALORM?: number,
  PE_GTIN?: string,
  PE_EMBALAGEM?: string,
  PE_VALORB?: number,
  PE_DESCONTO?: number,
  PE_VALORC?: number,
  PE_ALIQUOTA?: number,
  PE_NOME: string,
  PE_SEMENTE_TRATADA?: string,
}

const mapItemVendaParaItemPedido = async (item: VenEstModel, pedCod: number) => {
  const itemPed: PedEstModel = {
    PE_CODIGO: await IncrementaGenerator('GEN_PE'),
    PE_VALOR: item.VE_VALOR,
    PE_QUANTIDADE: item.VE_QUANTIDADE,
    PE_PED: pedCod,
    PE_PRO: item.VE_PRO,
    PE_LUCRO: item.VE_LUCRO,
    PE_VALORR: item.VE_VALORR,
    PE_VALORL: item.VE_VALORL,
    PE_LIQUIDO: item.VE_LIQUIDO,
    PE_VALOR2: item.VE_VALOR2,
    PE_VALORCM: item.VE_VALORCM,
    PE_VALORM: 0,
    PE_GTIN: item.VE_GTIN,
    PE_EMBALAGEM: item.VE_EMBALAGEM,
    PE_VALORB: item.VE_VALORB,
    PE_DESCONTO: item.VE_DESCONTO,
    PE_VALORC: item.VE_VALORC,
    PE_ALIQUOTA: item.VE_ALIQUOTA,
    PE_NOME: item.VE_NOME,
    PE_SEMENTE_TRATADA: item.VE_SEMENTE_TRATADA
  };

  return itemPed;
}

export default mapItemVendaParaItemPedido;