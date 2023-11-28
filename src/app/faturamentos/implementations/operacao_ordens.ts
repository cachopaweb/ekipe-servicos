import PedFatModel from "@/app/models/ped_fat_model";
import OperacoesStrategy from "../contracts/operacoes_interfaces";
import PFParcelaModel from "@/app/models/pf_parcela_model";
import PedFatRepository from "@/app/repositories/ped_fat_repository";
import PfParcelaRepository from "@/app/repositories/pf_parcela_repository";
import OrdemModel from "@/app/models/ordem_model";
import OrdemRepository from "@/app/repositories/ordem_repository";
import CaixaModel from "@/app/models/caixa_model";
import CaixaRepository from "@/app/repositories/caixa_repository";
import { GeraCodigo } from "@/app/functions/utils";
import DAVRepository from "@/app/repositories/dav_repository";
import OrdEstModel from "@/app/models/ord_est_model";
import HisProRepository from "@/app/repositories/his_pro_repository";
import ProdutoRepository from "@/app/repositories/produto_repository";
import OrdSerModel from "@/app/models/ord_ser_model";
import ClientRepository from "@/app/repositories/cliente_repository";
import FaturamentosRepository from "@/app/repositories/faturamentos_repository";
import RecebimentosRepository from "@/app/repositories/recebimentos_repository";
import MovimentacoesRepository from "@/app/repositories/movimentacoes_repository";
import RecPgmRepository from "@/app/repositories/rec_pgm_repository";

export default class OperacaoOrdens implements OperacoesStrategy {
    codFatura = 0;
    codPedFat = 0;
    caixaModel: CaixaModel | undefined;
    nomeCliente: string = '';
    codDAV: number = 0;

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
            this.codFatura = await GeraCodigo('FATURAMENTOS', 'FAT_CODIGO');            
        } catch (error) {
            throw new Error(String(error));
        }
    }

    constructor(){
        this.getCodigoFatura();
        this.getCodigoCaixa(); 
    }
    
    async insereOperacao(model: Object): Promise<boolean> {
        try {
            let result = false;
            const ordem = model as OrdemModel;
            const repository = new OrdemRepository();
            ordem.ORD_FAT = this.codFatura;
            ordem.ORD_ESTADO = 'FINALIZADO';
            this.nomeCliente = ordem.CLI_NOME;
            result = await repository.insereordem(ordem);
            if (ordem.itensOrdEst.length > 0){
                const repositoryDAV = new DAVRepository();
                this.codDAV = await GeraCodigo('DAV', 'DAV_CODIGO');
                repositoryDAV.insereDAV({
                    DAV_CODIGO: this.codDAV,
                    DAV_CLI: ordem.ORD_CLI,
                    DAV_CLIENTE: ordem.CLI_NOME,
                    DAV_CPF_CNPJ: ordem.CLI_CPF_CNPJ,
                    DAV_DATA: new Date().toLocaleDateString(),
                    DAV_ESTADO: 2,
                    DAV_FATURA: this.codFatura,
                    DAV_FORMAS_PGM: 'DINHEIRO',
                    DAV_FUN: 1,
                    DAV_FUNCAO: 'ORÇAMENTO',
                    DAV_HORA: new Date().toLocaleTimeString(),
                    DAV_NOVO: 1,
                    DAV_VALIDADE: '10 DIAS',
                    DAV_VALOR: ordem.ORD_VALOR,
                    DAV_VENDA: 0,
                });
            }
            return result;
        } catch (error) {
            throw new Error('Erro ao inserir ordem.\n' + String(error))
        }

    }

    async insereItens(model: Object): Promise<boolean> {
        try {
            let result = false;
            const listaOrdEst = model as OrdEstModel[];
            let i = 0;
            for (const ore in listaOrdEst) {
                if (Object.prototype.hasOwnProperty.call(listaOrdEst, ore)) {
                    const ordEst = listaOrdEst[ore];
                    const repository = new OrdemRepository();
                    result = await repository.insereProdutos(ordEst.ORE_ORD, ordEst);                    
                    //insere historico
                    const produtoRepository = new ProdutoRepository();
                    const produto = await produtoRepository.getProdutoPorCodigo(ordEst.ORE_PRO);
                    const hisProRepository = new HisProRepository();
                    hisProRepository.insereHisPro({
                        HP_CODIGO: await GeraCodigo('HIS_PRO', 'HP_CODIGO'),
                        HP_DATA: new Date().toLocaleDateString(),
                        HP_DOC: ordEst.ORE_ORD.toString(),
                        HP_ORIGEM: `OS - ${this.nomeCliente}`,
                        HP_PRO: ordEst.ORE_PRO,
                        HP_QUANTIDADE: ordEst.ORE_QUANTIDADE,
                        HP_QUANTIDADEA: produto.PRO_QUANTIDADE!,
                        HP_TIPO: 'S',
                        HP_TIPO2: 7,
                        HP_VALORC: produto.PRO_VALORC! * ordEst.ORE_QUANTIDADE,
                        HP_VALORCM: produto.PRO_VALORCM! * ordEst.ORE_QUANTIDADE,
                        HP_VALORM: produto.PRO_VALORF! * ordEst.ORE_QUANTIDADE,
                        HP_VALOROP: produto.PRO_VALORL! * ordEst.ORE_QUANTIDADE,
                        HP_VALORV: produto.PRO_VALORV!,
                    });
                    //insere DAVPro
                    const repositoryDAV = new DAVRepository();
                    repositoryDAV.insereDAVPro({
                        DP_CODIGO: await GeraCodigo('DAV_PRO', 'DP_CODIGO'),
                        DP_DATA: new Date().toLocaleDateString(),
                        DP_ACRESCIMO: 0,
                        DP_ALIQICMS: ordEst.ORE_ALIQICMS!,
                        DP_CANCELADO: 'N',
                        DP_DAV: this.codDAV,
                        DP_DESCONTO: 0,
                        DP_EMBALAGEM: ordEst.ORE_EMBALAGEM,
                        DP_GTIN: '',
                        DP_LUCRO: 0,
                        DP_NITEM: i++,
                        DP_NOME: ordEst.ORE_NOME,
                        DP_PRO: ordEst.ORE_PRO,
                        DP_QUANTIDADE: ordEst.ORE_QUANTIDADE,
                        DP_SIT_TRIB: '',
                        DP_VALOR: ordEst.ORE_VALOR,
                        DP_VALORF: ordEst.ORE_VALORF!,
                        DP_VALORL: ordEst.ORE_VALORL!,
                        DP_VALORR: ordEst.ORE_VALORR!,
                    });
                }
            }
            return result;
        } catch (error) {
            throw new Error('Erro ao inserir itens.\n' + String(error))
        }
    }

    async insereItens2(model?: Object | undefined): Promise<boolean> {
        try {
            let result = false;
            const listOrdSer = model as OrdSerModel[];
            for (const os in listOrdSer) {
                if (Object.prototype.hasOwnProperty.call(listOrdSer, os)) {
                    const ordSer = listOrdSer[os];                    
                    const repository = new OrdemRepository();
                    result = await repository.insereServicos(ordSer.OS_ORD, ordSer);
                }
            }
            return result;
        } catch (error) {
            throw new Error('Erro ao inserir itens.\n' + String(error))
        }
    }

    async inserePedFat(model: PedFatModel): Promise<boolean> {
        try {
            this.codPedFat = await GeraCodigo('PED_FAT', 'PF_CODIGO');
            const repository = new PedFatRepository();
            model.PF_CODIGO = this.codPedFat;
            model.PF_FAT = this.codFatura;                        
            const result = repository.inserePedFat(model);
            //ultima venda cli
            const clienteRepository = new ClientRepository();
            clienteRepository.setUltimaVendaCliente(new Date().toLocaleDateString(), model.PF_COD_CLI);
            //faturamento
            const faturamentosRepository = new FaturamentosRepository();            
            faturamentosRepository.insereFaturamentos({
                FAT_CODIGO: this.codFatura,
                FAT_CLI: model.PF_COD_CLI,
                FAT_DATA: new Date().toLocaleDateString(),
                FAT_DESCRICAO: model.PF_COD_PED,
                FAT_JUROS: 0,
                FAT_PARCELAS: model.PF_PARCELAS,
                FAT_TIPO: 3,
                FAT_TIPOPGM: 2,
                FAT_VALOR: model.PF_VALOR,
            });
            return result;
        } catch (error) {
            throw new Error('Erro ao inserir PedFat.\n' + String(error))
        }
    }

    async inserePFParcelas(model: PFParcelaModel[]): Promise<boolean> {
        try {
            let result = false;
            const repository = new PfParcelaRepository();
            for (const pf_parcela_model in model) {
                if (Object.prototype.hasOwnProperty.call(model, pf_parcela_model)) {
                    const pp = model[pf_parcela_model];
                    pp.PP_PF = this.codPedFat;
                    result = await repository.inserepfParcela(pp);
                    //insere recebimento
                    const codRecebimento = await GeraCodigo('RECEBIMENTOS', 'REC_CODIGO');
                    const recebimentosRepository = new RecebimentosRepository()
                    recebimentosRepository.insererecebimentos({
                        REC_CODIGO: codRecebimento,
                        REC_CAI: this.caixaModel!.CAI_CODIGO,
                        REC_CON: 0,
                        REC_DATAR: new Date().toLocaleDateString(),
                        REC_DESCONTADO: 'N',
                        REC_DESCONTOS: pp.PP_DESCONTOS,
                        REC_DUPLICATA: pp.PP_DUPLICATA,
                        REC_ESTADO: pp.PP_ESTADO, 
                        REC_FAT: this.codFatura,
                        REC_FPG: 0,
                        REC_JUROS: pp.PP_JUROS,
                        REC_SITUACAO: 0,
                        REC_TIPO: pp.DescricaoTipoPgm!,
                        REC_VALOR: pp.PP_VALOR,
                        REC_VENCIMENTO: new Date().toLocaleDateString(),                        
                    });
                    //se for a vista insere movimentacao
                    if (pp.PP_TP === 0){
                        const codMov = await GeraCodigo('MOVIMENTACOES', 'MOV_CODIGO');
                        const repositoryMovimentacao = new MovimentacoesRepository();
                        result = await repositoryMovimentacao.insereMovimentacoes({
                            MOV_CODIGO: codMov,
                            MOV_CAI: this.caixaModel!.CAI_CODIGO,
                            MOV_CON: 0,
                            MOV_CREDITO: pp.PP_VALORPG,
                            MOV_DEBITO: 0,
                            MOV_DATA: new Date().toLocaleDateString(),
                            MOV_DATAHORA: (new Date().toLocaleDateString()) +' '+ (new Date().toLocaleTimeString()),
                            MOV_DESCRICAO: `OS - ${this.codFatura} - ${this.nomeCliente!}`,
                            MOV_ESTADO: 'A',
                            MOV_NOME: 'ORDEM',
                            MOV_ORDENA: codMov,
                            MOV_PLANO: '1.6',
                            MOV_SALDOANT: this.caixaModel!.CAI_VALORD,
                            MOV_TIPO: 2,
                            MOV_TROCO: 0,
                            PDV: 1,
                        });
                        //insere pag_pgm
                        const codRecPgm = await GeraCodigo('REC_PGM', 'RP_CODIGO');
                        const repositoryRecPgm = new RecPgmRepository();
                        result = await repositoryRecPgm.insereRecPgm({
                            RP_CODIGO: codRecPgm,
                            RP_DINHEIRO: pp.PP_VALORPG,
                            RP_DATAPGM: new Date().toLocaleDateString(),
                            RP_CHEQUE: 0,
                            RP_REC: codRecebimento,
                            RP_CAI: this.caixaModel!.CAI_CODIGO,
                            RP_DESCONTOS: 0,
                            RP_FUN: 1,
                            RP_HORA: new Date().toLocaleTimeString(),
                            RP_JUROS: 0,
                            RP_MOV: codMov
                        });
                    }else{
                        const codRecPgm = await GeraCodigo('REC_PGM', 'RP_CODIGO');
                        const repositoryRecPgm = new RecPgmRepository();
                        result = await repositoryRecPgm.insereRecPgm({
                            RP_CODIGO: codRecPgm,
                            RP_DINHEIRO: 0,
                            RP_CHEQUE: 0,
                            RP_REC: codRecebimento,
                        });
                    }
                }
            }
            return result;
        } catch (error) {
            throw new Error('Erro ao inserir PFParcela.\n' + String(error))
        }
    }
}