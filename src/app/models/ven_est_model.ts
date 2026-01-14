import { PedEstModel } from "./ped_est_model";

export interface VenEstModel {
  VE_CODIGO: number,
  VE_VALOR: number,
  VE_QUANTIDADE: number,
  VE_VEN: number,
  VE_PRO: number,
  VE_LUCRO?: number,
  VE_VALORR?: number,
  VE_VALORL?: number,
  VE_VALORF?: number,
  VE_DIFERENCA?: number,
  VE_LIQUIDO?: number,
  VE_VALOR2?: number,
  VE_VALORCM?: number,
  VE_GTIN?: string,
  VE_EMBALAGEM?: string,
  VE_VALORB?: number,
  VE_DESCONTO?: number,
  VE_VALORC?: number,
  VE_ALIQUOTA?: number,
  VE_NOME: string,
  VE_SEMENTE_TRATADA?: string,
  VE_ESTADO?: string
}

const mapItemPedidoParaItemVenda = (item: PedEstModel, pedCod: number) => {
  const itemVen: VenEstModel = {
    VE_CODIGO: item.PE_CODIGO,
    VE_VALOR: item.PE_VALOR,
    VE_QUANTIDADE: item.PE_QUANTIDADE,
    VE_VEN: pedCod,
    VE_PRO: item.PE_PRO,
    VE_LUCRO: item.PE_LUCRO,
    VE_VALORR: item.PE_VALORR,
    VE_VALORL: item.PE_VALORL,
    VE_LIQUIDO: item.PE_LIQUIDO,
    VE_VALOR2: item.PE_VALOR2,
    VE_VALORCM: item.PE_VALORCM,
    VE_GTIN: item.PE_GTIN,
    VE_EMBALAGEM: item.PE_EMBALAGEM,
    VE_VALORB: item.PE_VALORB,
    VE_DESCONTO: item.PE_DESCONTO,
    VE_VALORC: item.PE_VALORC,
    VE_ALIQUOTA: item.PE_ALIQUOTA,
    VE_NOME: item.PE_NOME,
    VE_SEMENTE_TRATADA: item.PE_SEMENTE_TRATADA
  };

  return itemVen;
}

export default mapItemPedidoParaItemVenda;