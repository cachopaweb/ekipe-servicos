import PedFatModel from "@/app/models/ped_fat_model";
import PFParcelaModel from "@/app/models/pf_parcela_model";

export default interface OperacoesStrategy{
    insereOperacao(model: Object): Promise<boolean>,
    insereItens(model: Object): Promise<boolean>,
    insereItens2(model?: Object): Promise<boolean>,
    inserePedFat(model: PedFatModel): Promise<boolean>,
    inserePFParcelas(model: PFParcelaModel[]): Promise<boolean>,
}