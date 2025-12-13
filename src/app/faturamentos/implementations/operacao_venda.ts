import PedFatModel from "@/app/models/ped_fat_model";
import PFParcelaModel from "@/app/models/pf_parcela_model";
import OperacoesStrategy from "../contracts/operacoes_interfaces";
import { VendaModel } from "@/app/models/venda_model";
import VendaRepository from "@/app/repositories/venda_repository";
import CaixaModel from "@/app/models/caixa_model";
import CaixaRepository from "@/app/repositories/caixa_repository";
import { IncrementaGenerator } from "@/app/functions/utils";
import ClientRepository from "@/app/repositories/cliente_repository";
import { ClienteModel } from "@/app/models/cliente_model";
import DAVRepository from "@/app/repositories/dav_repository";
import { VenEstModel } from "@/app/models/ven_est_model";
import ProdutoRepository from "@/app/repositories/produto_repository";
import HisProRepository from "@/app/repositories/his_pro_repository";
import PedFatRepository from "@/app/repositories/ped_fat_repository";
import FaturamentosRepository from "@/app/repositories/faturamentos_repository";
import PfParcelaRepository from "@/app/repositories/pf_parcela_repository";
import RecebimentosRepository from "@/app/repositories/recebimentos_repository";
import MovimentacoesRepository from "@/app/repositories/movimentacoes_repository";
import RecPgmRepository from "@/app/repositories/rec_pgm_repository";

export default class OperacaoVenda implements OperacoesStrategy {
  codFatura = 0;
  codPedFat = 0;
  caixaModel: CaixaModel | undefined;
  clienteModel: ClienteModel | undefined;
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
      this.codFatura = await IncrementaGenerator('GEN_FAT');
    } catch (error) {
      throw new Error(String(error));
    }
  }

  constructor() {
    this.getCodigoFatura();
    this.getCodigoCaixa();
  }

  async insereOperacao(model: Object): Promise<boolean> {
    try {
      let result = false;
      const venda = model as VendaModel;
      const vendaRepository = new VendaRepository();
      venda.VEN_FAT = this.codFatura;

      const clienteRepository = new ClientRepository();
      this.clienteModel = await clienteRepository.getClienteById(venda.VEN_CLI);

      result = await vendaRepository.insereVenda(venda);

      if (venda.itensVenEst.length > 0) {
        const repositoryDAV = new DAVRepository();
        this.codDAV = await IncrementaGenerator('GEN_DAV');
        repositoryDAV.insereDAV({
          DAV_CODIGO: this.codDAV,
          DAV_CLI: venda.VEN_CLI,
          DAV_CLIENTE: this.clienteModel.NOME,
          DAV_CPF_CNPJ: this.clienteModel?.CPF_CNPJ ?? '',
          DAV_DATA: new Date().toLocaleDateString(),
          DAV_ESTADO: 2,
          DAV_FATURA: this.codFatura,
          DAV_FORMAS_PGM: 'DINHEIRO',
          DAV_FUN: 1,
          DAV_FUNCAO: 'VENDA',
          DAV_HORA: new Date().toLocaleTimeString(),
          DAV_NOVO: 1,
          DAV_VALIDADE: '10 DIAS',
          DAV_VALOR: venda.VEN_VALOR,
          DAV_VENDA: 0,
        });
      }
      return result;
    } catch (error) {
      throw new Error('Erro ao inserir venda.\n' + String(error))
    }
  }

  async insereItens(model: Object): Promise<boolean> {
    try {
      let result = false;
      const listaVenEst = model as VenEstModel[];
      let i = 0;

      for (const ve in listaVenEst) {
        if (Object.prototype.hasOwnProperty.call(listaVenEst, ve)) {
          const venEst = listaVenEst[ve];
          const vendaRepository = new VendaRepository();

          result = await vendaRepository.insereProdutos(venEst);
          //insere historico
          const produtoRepository = new ProdutoRepository();
          const produto = await produtoRepository.getProdutoPorCodigo(venEst.VE_PRO);
          const hisProRepository = new HisProRepository();
          hisProRepository.insereHisPro({
            HP_CODIGO: await IncrementaGenerator('GEN_HP'),
            HP_DATA: new Date().toLocaleDateString(),
            HP_DOC: venEst.VE_VEN.toString(),
            HP_ORIGEM: `OS - ${this.clienteModel?.NOME}`,
            HP_PRO: venEst.VE_PRO,
            HP_QUANTIDADE: venEst.VE_QUANTIDADE,
            HP_QUANTIDADEA: produto.PRO_QUANTIDADE!,
            HP_TIPO: 'S',
            HP_TIPO2: 7,
            HP_VALORC: produto.PRO_VALORC! * venEst.VE_QUANTIDADE,
            HP_VALORCM: produto.PRO_VALORCM! * venEst.VE_QUANTIDADE,
            HP_VALORM: produto.PRO_VALORF! * venEst.VE_QUANTIDADE,
            HP_VALOROP: produto.PRO_VALORL! * venEst.VE_QUANTIDADE,
            HP_VALORV: produto.PRO_VALORV!,
          });
          //insere DAVPro
          const repositoryDAV = new DAVRepository();
          repositoryDAV.insereDAVPro({
            DP_CODIGO: await IncrementaGenerator('GEN_DP'),
            DP_DATA: new Date().toLocaleDateString(),
            DP_ACRESCIMO: 0,
            DP_ALIQICMS: '0',
            DP_CANCELADO: 'N',
            DP_DAV: this.codDAV,
            DP_DESCONTO: 0,
            DP_EMBALAGEM: venEst.VE_EMBALAGEM ?? 'NENHUMA',
            DP_GTIN: '',
            DP_LUCRO: 0,
            DP_NITEM: i++,
            DP_NOME: venEst.VE_NOME,
            DP_PRO: venEst.VE_PRO,
            DP_QUANTIDADE: venEst.VE_QUANTIDADE,
            DP_SIT_TRIB: '',
            DP_VALOR: venEst.VE_VALOR,
            DP_VALORF: venEst.VE_VALORF! ?? 0,
            DP_VALORL: venEst.VE_VALORL! ?? 0,
            DP_VALORR: venEst.VE_VALORR! ?? 0,
          });
        }
      }
      return result;
    } catch (error) {
      throw new Error('Erro ao inserir itens.\n' + String(error))
    }
  }

  insereItens2(model?: Object): Promise<boolean> {
    return Promise.resolve(true);
  }

  async inserePedFat(model: PedFatModel): Promise<boolean> {
    try {
      this.codPedFat = await IncrementaGenerator('GEN_PF');
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
          const codRecebimento = await IncrementaGenerator('GEN_REC');
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
          if (pp.PP_TP === 0) {
            const codMov = await IncrementaGenerator('GEN_MOV');
            const repositoryMovimentacao = new MovimentacoesRepository();
            result = await repositoryMovimentacao.insereMovimentacoes({
              MOV_CODIGO: codMov,
              MOV_CAI: this.caixaModel!.CAI_CODIGO,
              MOV_CON: 0,
              MOV_CREDITO: pp.PP_VALORPG,
              MOV_DEBITO: 0,
              MOV_DATA: new Date().toLocaleDateString(),
              MOV_DATAHORA: (new Date().toLocaleDateString()) + ' ' + (new Date().toLocaleTimeString()),
              MOV_DESCRICAO: `VD - ${this.codFatura} - ${this.clienteModel?.NOME}`,
              MOV_ESTADO: 'A',
              MOV_NOME: 'VENDA',
              MOV_ORDENA: codMov,
              MOV_PLANO: '1.1',
              MOV_SALDOANT: this.caixaModel!.CAI_VALORD,
              MOV_TIPO: 2,
              MOV_TROCO: 0,
              PDV: 1,
            });
            //insere pag_pgm

            const codRecPgm = await IncrementaGenerator('GEN_RR');
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
          } else {
            const codRecPgm = await IncrementaGenerator('GEN_RR');
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