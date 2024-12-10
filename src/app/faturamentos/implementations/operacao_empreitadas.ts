import Swal, { SweetAlertResult } from "sweetalert2";
import OperacoesStrategy from "../contracts/operacoes_interfaces";
import EmpreitadasRepository from "@/app/repositories/empreitadas_repository";
import EmpreitadasModel from "@/app/models/empreitadas_model";
import PedFatModel from "@/app/models/ped_fat_model";
import PFParcelaModel from "@/app/models/pf_parcela_model";
import LancamentoReceitaCustoRepository from "@/app/repositories/lancamento_receita_custo_repository";
import { GeraCodigo, IncrementaGenerator } from "@/app/functions/utils";
import PedFatRepository from "@/app/repositories/ped_fat_repository";
import PfParcelaRepository from "@/app/repositories/pf_parcela_repository";
import Faturamento2Repository from "@/app/repositories/faturamento2_repository";
import PagamentosRepository from "@/app/repositories/pagamentos_repository";
import CaixaModel from "@/app/models/caixa_model";
import CaixaRepository from "@/app/repositories/caixa_repository";
import MovimentacoesRepository from "@/app/repositories/movimentacoes_repository";
import PagPgmRepository from "@/app/repositories/pag_pgm_repository";
import EmpreitadasServicosModel from "@/app/models/empreitada_servicos_model";

export default class OperacaoEmpreitadas implements OperacoesStrategy{
    codFatura = 0;
    codOperacao = 0;
    caixaModel: CaixaModel | undefined;
    nomeCliente: string = '';

    async getCodigoCaixa() {
        try {
            const repository = new CaixaRepository();
            this.caixaModel = await repository.getCodCaixa(1);
        } catch (error) {
            throw new Error(String(error));
        }
    }

    async getCodigoFatura() {
        try {
            this.codFatura = await IncrementaGenerator('GEN_FAT2');
        } catch (error) {
            throw new Error(String(error));
        }
    }

    constructor(){
        this.getCodigoFatura();
        this.getCodigoCaixa(); 
    }

    insereItens2(model?: Object | undefined): Promise<boolean> {
        return Promise.resolve(true);
    }    
    async insereOperacao(model: Object): Promise<boolean> {
        try {
            let result = false;
            const repositoryEmpreitadas = new EmpreitadasRepository();
            const repositoryLancamentoReceitaCusto = new LancamentoReceitaCustoRepository();
            const empreitada = model as EmpreitadasModel;
            if (empreitada.EMP_CODIGO === 0){
                empreitada.EMP_CODIGO = await GeraCodigo('EMPREITADAS', 'EMP_CODIGO');
                this.codOperacao = empreitada.EMP_CODIGO;
            } 
            empreitada.EMP_FAT = this.codFatura;
            await repositoryEmpreitadas.insereEmpreitada(empreitada);            
            ////                                
            const codLancamento = await IncrementaGenerator('GEN_LRC');
            result = await repositoryLancamentoReceitaCusto.insereLancamento({
                LRC_CODIGO: codLancamento,
                LRC_CLI_FOR: empreitada.EMP_FOR,
                LRC_DATA: new Date().toLocaleDateString(),
                LRC_FAT: 0,
                LRC_FAT2: this.codFatura,
                LRC_FUN: 1,
                LRC_HISTORICO: `Empreitada da OS ${empreitada.EMP_ORD}`,
                LRC_OBS: empreitada.EMP_NFS != undefined ? `OS ${empreitada.EMP_ORD} / NF ${empreitada.EMP_NFS}`: `OS ${empreitada.EMP_ORD}`,
                LRC_TIPO: 'C',
                LRC_VALOR: empreitada.EMP_VALOR,
                LRC_DATAC: '01/01/1900'
            });            
            return result;
        } catch (error) {
            throw new Error('Erro ao inserir empreitadas.\n'+String(error))            
        }
       
    }

    async insereItens(model: Object): Promise<boolean> {
        try {
            const servicosEmpreitada = model as EmpreitadasServicosModel[]; 
            const servicos = servicosEmpreitada.map(s=> {
                s.ES_EMP = s.ES_EMP = this.codOperacao;
                return s;
            });
            const repository = new EmpreitadasRepository();
            const response = await repository.insereServicosEmpreitada(servicos);
            return response;
        } catch (error) {
            throw new Error('Erro ao inserir itens.\n'+String(error))            
        }        
    }
  
    async inserePedFat(model: PedFatModel): Promise<boolean> {
      try {
            const repository = new PedFatRepository();
            await  repository.inserePedFat(model);
            ////
            const repositoryFaturamento = new Faturamento2Repository()
            const result = await repositoryFaturamento.insereFaturamento2({
                FAT2_CODIGO: this.codFatura,
                FAT2_COD_FDTF: model.PF_COD_CLI-1000000,
                FAT2_DATA: new Date().toLocaleDateString(),
                FAT2_DESCRICAO: model.PF_COD_PED,
                FAT2_JUROS: 0,
                FAT2_PARCELAS: model.PF_PARCELAS,
                FAT2_TIPO: 2,
                FAT2_TIPOPGM: 2,
                FAT2_VALOR: model.PF_VALOR,                
            });
            return result;         
        } catch (error) {
            throw new Error('Erro ao inserir PedFat.\n'+String(error))            
        }  
    }

    async inserePFParcelas(model: PFParcelaModel[]): Promise<boolean> {
        try {
            let result = false;
            const repository = new PfParcelaRepository();
            const repositoryPagamento = new PagamentosRepository();
            for (const pf_parcela_model in model) {
                if (Object.prototype.hasOwnProperty.call(model, pf_parcela_model)) {
                    const pp = model[pf_parcela_model];
                    await repository.inserepfParcela(pp);
                    ////
                    const codPagamento = await IncrementaGenerator('GEN_PAG');
                    //insere pagamentos
                    result = await repositoryPagamento.inserePagamentos({
                        PAG_CODIGO: codPagamento,
                        PAG_VALOR: pp.PP_VALOR,
                        PAG_VENCIMENTO: pp.PP_VENCIMENTO.toLocaleDateString(),
                        PAG_JUROS: pp.PP_JUROS,
                        PAG_DESCONTOS: pp.PP_DESCONTOS,
                        PAG_ESTADO: pp.PP_ESTADO,
                        PAG_DUPLICATA: pp.PP_DUPLICATA,
                        PAG_DATAC: '01/01/1900',
                        PAG_FAT2: this.codFatura,
                        PAG_SITUACAO: 0,
                        PAG_FPG: 0,
                        PAG_TIPO: pp.DescricaoTipoPgm!,
                        PAG_CON: pp.PP_TP,
                        PAG_CAI: this.caixaModel!.CAI_CODIGO,
                    });
                    //insere movimentacao caso for a vista
                    if (pp.PP_TP === -1){
                        const codMov = await IncrementaGenerator('GEN_MOV');
                        const repositoryMovimentacao = new MovimentacoesRepository();
                        result = await repositoryMovimentacao.insereMovimentacoes({
                            MOV_CODIGO: codMov,
                            MOV_CAI: this.caixaModel!.CAI_CODIGO,
                            MOV_CON: 0,
                            MOV_CREDITO: 0,
                            MOV_DEBITO: pp.PP_VALORPG,
                            MOV_DATA: new Date().toLocaleDateString(),
                            MOV_DATAHORA: (new Date().toLocaleDateString()) +' '+ (new Date().toLocaleTimeString()),                            
                            MOV_DESCRICAO: `OS - ${this.nomeCliente!}`,
                            MOV_ESTADO: 'A',
                            MOV_NOME: 'SERVIÇOS',
                            MOV_ORDENA: codMov,
                            MOV_PLANO: '2.2',
                            MOV_SALDOANT: this.caixaModel!.CAI_VALORD,
                            MOV_TIPO: 2,
                            MOV_TROCO: 0,
                            PDV: 1,
                        });
                        //insere pag_pgm
                        const codPagPgm = await IncrementaGenerator('GEN_PP');
                        const repositoryPagPgm = new PagPgmRepository();
                        result = await repositoryPagPgm.inserePagPgm({
                            PP_CODIGO: codPagPgm,
                            PP_DINHEIRO: pp.PP_VALORPG,
                            PP_DATAPGM: new Date().toLocaleDateString(),
                            PP_CHEQUE: 0,
                            PP_PAG: codPagamento,
                            PP_CAI: this.caixaModel!.CAI_CODIGO,
                            PP_DESCONTOS: 0,
                            PP_FUN: 1,
                            PP_HORA: new Date().toLocaleTimeString(),
                            PP_JUROS: 0,
                            PP_MOV: codMov
                        });
                    }else{
                        const codPagPgm = await IncrementaGenerator('GEN_PP');
                        const repositoryPagPgm = new PagPgmRepository();
                        result = await repositoryPagPgm.inserePagPgm({
                            PP_CODIGO: codPagPgm,
                            PP_DINHEIRO: 0,
                            PP_CHEQUE: 0,
                            PP_PAG: codPagamento,                            
                        }); 
                    }
                }
            }         
            return result;
        } catch (error) {
            throw new Error('Erro ao inserir PFParcelas.\n'+String(error))            
        }  
    }  
}