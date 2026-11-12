"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useAppData } from "@/app/contexts/app_context";
import {
  FormatDate,
  Status,
  toastMixin,
  IncrementaGenerator,
  converterDataPontoParaTraco,
  parseDataCalendario,
  formatDataInput,
} from "@/app/functions/utils";

// Modelos
import OrdemModel from "@/app/models/ordem_model";
import { ClienteModel } from "@/app/models/cliente_model";
import { FornecedorModel } from "@/app/models/fornecedor_model";
import { ProdutoModel } from "@/app/models/produto_model";
import OrdEstModel from "@/app/models/ord_est_model";
import OrdSerModel from "@/app/models/ord_ser_model";
import UnidadeMedidaModel from "@/app/models/unidade_med_model";
import { SolicitanteModel } from "@/app/models/solicitante_model";

// Repositórios
import OrdemRepository from "@/app/repositories/ordem_repository";
import ProdutoRepository from "@/app/repositories/produto_repository";
import ClientRepository from "@/app/repositories/cliente_repository";
import FornecedorRepository from "@/app/repositories/fornecedor_repository";
import CidadeRepository from "@/app/repositories/cidade_repository";
import UnidadeMedidaRepository from "@/app/repositories/unidade_med_repository";
import SolicitanteRepository from "@/app/repositories/solicitante_repository";

// Modais Externos e Pesquisas
import Pesquisa_cliente from "../../pesquisas/pesquisa_cliente";
import Pesquisa_produto from "../../pesquisas/pesquisa_produto";
import PesquisaFornecedor from "@/app/pesquisas/pesquisa_fornecedor";
import PesquisaOrdem from "@/app/pesquisas/pesquisa_os";
import Empreitadas from "../empreitadas/page";
import Faturamentos from "@/app/faturamentos/page";
import OperacaoOrdens from "@/app/faturamentos/implementations/operacao_ordens";
import PrintOrcamentos from "@/app/print/orcamento/page";
import PrintOSCompleta from "@/components/component/print_os_completa";
import { ModalListarArquivos } from "@/components/component/files";
import Modal from "@/components/component/modal";

// Subcomponentes Modulares da Página
import HeaderOrcamento from "./components/header_orcamento";
import FormIdentificacao from "./components/form_identificacao";
import TabServicos from "./components/tab_servicos";
import TabProdutos from "./components/tab_produtos";
import FormObservacoes from "./components/form_observacoes";
import PainelTotais from "./components/painel_totais";
import ModalItemServico from "./components/modal_item_servico";
import ModalItemProduto from "./components/modal_item_produto";
import ModalConfirmacao from "./components/modal_confirmacao";
import ModalCadastroSolicitante from "./components/modal_cadastro_solicitante";

// Ícones Profissionais
import { Wrench, Package, CheckCircle2, FileText, Printer } from "lucide-react";

export default function Orcamentos() {
    const { setOrdemCtx, OrdemCtx, setTemAlteracoesPendentes } = useAppData();

  // Filas de exclusão pendente (E02: persistem apenas ao salvar com sucesso)
  const [servicosParaExcluir, setServicosParaExcluir] = useState<number[]>([]);
  const [produtosParaExcluir, setProdutosParaExcluir] = useState<number[]>([]);

  // Controle booleano de alterações pendentes (Dirty State - R03)
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Controle de diálogo de saída sem salvar
  const [showDiscardModal, setShowDiscardModal] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Estados da Ordem
  const [ordem, setOrdem] = useState<OrdemModel | null>(null);
  const [codigoOrdem, setCodigoOrdem] = useState<number>(0);
  const [dataAbertura, setDataAbertura] = useState<Date>(new Date());
  const [statusOrdem, setStatusOrdem] = useState<string>(Status[0].toUpperCase());
  const [nfs, setNfs] = useState<string>("");
  const [codFatura, setCodFatura] = useState<number>(0);
  const [foiFaturado, setFoiFaturado] = useState<boolean>(false);
  const [buscouOrdem, setBuscouOrdem] = useState<boolean>(false);

  // Observações
  const [solicitacao, setSolicitacao] = useState<string>("");
  const [obs, setObs] = useState<string>("");
  const [obs_adm, setObs_adm] = useState<string>("");

  // Campos Operacionais de OS Aprovada (OM, Pedido, Previsão e Justificativa)
  const [om, setOm] = useState<string>("");
  const [pedidoCompra, setPedidoCompra] = useState<string>("");
  const [dataPrevisaoConclusao, setDataPrevisaoConclusao] = useState<string>("");
  const [justificativaAtraso, setJustificativaAtraso] = useState<string>("");

  // Solicitante (Coordenador que abre/aprova o chamado)
  const [solicitanteId, setSolicitanteId] = useState<number>(0);
  const [solicitanteNome, setSolicitanteNome] = useState<string>("");
  const [solicitantes, setSolicitantes] = useState<SolicitanteModel[]>([]);
  const [showModalNovoSolicitante, setShowModalNovoSolicitante] = useState<boolean>(false);

  // Entidades Vinculadas
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteModel>({
    CODIGO: 1,
    NOME: "CONSUMIDOR",
  });
  const [parceiroSelecionado, serParceiroSelecionado] = useState<FornecedorModel>({
    CODIGO: 0,
    NOME: "",
  });
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoModel>({
    PRO_CODIGO: 1,
    PRO_NOME: "GENERICO",
    PRO_VALORV: 0,
  });

  // Funcionário Logado
  const [nomeFuncionario, setNomeFuncionario] = useState<string>("");
  const [idFuncionario, setIdFuncionario] = useState<number>(0);

  // Itens da Ordem
  const [listaServicosInseridos, setListaServicosInseridos] = useState<OrdSerModel[]>([]);
  const [listaProdutosInseridos, setListaProdutosInseridos] = useState<OrdEstModel[]>([]);
  const [listaUnidadesMed, setListaUnidadesMed] = useState<UnidadeMedidaModel[]>([]);

  // Descontos
  const [valorDesconto, setValorDesconto] = useState<number>(0);
  const [valorPorcentagemDesconto, setValorPorcentagemDesconto] = useState<number>(0);

  // E06: Totais da OS, Total Pago e Saldo a Pagar (R04, A15–A16)
  const [totalPago, setTotalPago] = useState<number>(0);
  const [carregandoTotalPago, setCarregandoTotalPago] = useState<boolean>(false);
  const [erroTotalPago, setErroTotalPago] = useState<boolean>(false);

  // Controle de Abas
  const [abaAtiva, setAbaAtiva] = useState<"SERVICOS" | "PRODUTOS">("SERVICOS");

  // Modais de Edição de Itens
  const [servicoEdt, setServicoEdt] = useState<OrdSerModel | null>(null);
  const [showModalEdtServico, setShowModalEdtServico] = useState<boolean>(false);

  const [produtoEdt, setProdutoEdt] = useState<OrdEstModel | null>(null);
  const [showModalEdtProduto, setShowModalEdtProduto] = useState<boolean>(false);

  // Modais de Pesquisa e Extensões
  const [showModalPesquisaOS, setShowModalPesquisaOS] = useState<boolean>(false);
  const [showModalPesquisaCliente, setShowModalPesquisaCliente] = useState<boolean>(false);
  const [showModalPesquisaFornecedor, setShowModalPesquisaFornecedor] = useState<boolean>(false);
  const [showModalPesquisaProduto, setShowModalPesquisaProduto] = useState<boolean>(false);
  const [showModalimprimir, setShowModalImprimir] = useState<boolean>(false);
  const [showModalEmpreitadas, setShowModalEmpreitadas] = useState<boolean>(false);
  const [showModalListaArquivos, setShowModalListaArquivos] = useState<boolean>(false);
  const [showFaturamento, setShowFaturamento] = useState<boolean>(false);
  const [showModalPrintOSCompleta, setShowModalPrintOSCompleta] = useState<boolean>(false);
  const [showModalPosFaturamento, setShowModalPosFaturamento] = useState<boolean>(false);

  // Modal de Confirmação Unificado
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "danger" | "success" | "warning" | "info";
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: () => {},
  });

  // Lista de Status Disponíveis
  const listaStatusDisponiveis = useMemo(() => {
    const list = Object.values(Status).filter((v) => isNaN(Number(v)));
    return list.map((v) => v.toString().toUpperCase());
  }, []);

  const makeOrcamentoSnapshot = useCallback(
    (params: {
      cliCod: number;
      parcCod: number;
      dataStr: string;
      status: string;
      nfsVal: string;
      solic: string;
      obsVal: string;
      obsAdmVal: string;
      descVal: number;
      descPct: number;
      omVal?: string;
      pedVal?: string;
      prevVal?: string;
      justVal?: string;
      solicId?: number;
      servs: OrdSerModel[];
      prods: OrdEstModel[];
    }) =>
      JSON.stringify({
        cliCod: params.cliCod || 1,
        parcCod: params.parcCod || 0,
        dataStr: params.dataStr || "",
        status: (params.status || "").trim().toUpperCase(),
        nfsVal: (params.nfsVal || "").trim(),
        solic: (params.solic || "").trim(),
        obsVal: (params.obsVal || "").trim(),
        obsAdmVal: (params.obsAdmVal || "").trim(),
        descVal: Number(params.descVal || 0),
        descPct: Number(params.descPct || 0),
        omVal: (params.omVal || "").trim(),
        pedVal: (params.pedVal || "").trim(),
        prevVal: (params.prevVal || "").trim(),
        justVal: (params.justVal || "").trim(),
        solicId: Number(params.solicId || 0),
        servs: (params.servs || []).map((s) => ({
          cod: s.OS_CODIGO,
          nome: (s.OS_NOME || "").trim(),
          qtd: Number(s.OS_QUANTIDADE || 0),
          um: (s.OS_UNIDADE_MED || "").trim(),
          vlr: Number(s.OS_VALOR || 0),
        })),
        prods: (params.prods || []).map((p) => ({
          cod: p.ORE_CODIGO,
          pro: p.ORE_PRO,
          nome: (p.ORE_NOME || "").trim(),
          qtd: Number(p.ORE_QUANTIDADE || 0),
          um: (p.ORE_EMBALAGEM || "").trim(),
          vlr: Number(p.ORE_VALOR || 0),
        })),
      }),
    []
  );

  const savedSnapshotRef = useRef<string>("");
  const historyPushedRef = useRef<boolean>(false);

  // Inicializa o snapshot limpo na montagem
  useEffect(() => {
    if (!savedSnapshotRef.current) {
      savedSnapshotRef.current = makeOrcamentoSnapshot({
        cliCod: 1,
        parcCod: 0,
        dataStr: formatDataInput(dataAbertura),
        status: Status[0].toUpperCase(),
        nfsVal: "",
        solic: "",
        obsVal: "",
        obsAdmVal: "",
        descVal: 0,
        descPct: 0,
        omVal: "",
        pedVal: "",
        prevVal: "",
        justVal: "",
        solicId: 0,
        servs: [],
        prods: [],
      });
    }
  }, [makeOrcamentoSnapshot]);

  // Calcula automaticamente se existem alterações não salvas comparando com o snapshot salvo
  useEffect(() => {
    if (!savedSnapshotRef.current) return;
    const currentSnap = makeOrcamentoSnapshot({
      cliCod: clienteSelecionado.CODIGO,
      parcCod: parceiroSelecionado.CODIGO,
      dataStr: formatDataInput(dataAbertura),
      status: statusOrdem,
      nfsVal: nfs,
      solic: solicitacao,
      obsVal: obs,
      obsAdmVal: obs_adm,
      descVal: valorDesconto,
      descPct: valorPorcentagemDesconto,
      omVal: om,
      pedVal: pedidoCompra,
      prevVal: dataPrevisaoConclusao,
      justVal: justificativaAtraso,
      solicId: solicitanteId,
      servs: listaServicosInseridos,
      prods: listaProdutosInseridos,
    });
    setIsDirty(currentSnap !== savedSnapshotRef.current);
  }, [
    makeOrcamentoSnapshot,
    clienteSelecionado.CODIGO,
    parceiroSelecionado.CODIGO,
    dataAbertura,
    statusOrdem,
    nfs,
    solicitacao,
    obs,
    obs_adm,
    valorDesconto,
    valorPorcentagemDesconto,
    om,
    pedidoCompra,
    dataPrevisaoConclusao,
    justificativaAtraso,
    solicitanteId,
    listaServicosInseridos,
    listaProdutosInseridos,
  ]);

  // Notifica o Layout e componentes externos sobre a pendência
  useEffect(() => {
    setTemAlteracoesPendentes(isDirty);
    return () => setTemAlteracoesPendentes(false);
  }, [isDirty, setTemAlteracoesPendentes]);

  // Intercepta fechamento/recarregamento da aba (beforeunload nativo)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Intercepta botão Voltar/Avançar do navegador (popstate) sem duplicar entradas no histórico
  useEffect(() => {
    if (isDirty && !historyPushedRef.current) {
      window.history.pushState({ orcamentoDirtyGuard: true }, "", window.location.href);
      historyPushedRef.current = true;
    } else if (!isDirty) {
      historyPushedRef.current = false;
    }

    const handlePopState = () => {
      if (isDirty) {
        window.history.pushState({ orcamentoDirtyGuard: true }, "", window.location.href);
        historyPushedRef.current = true;
        setPendingAction(() => () => {
          historyPushedRef.current = false;
          window.history.back();
        });
        setShowDiscardModal(true);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isDirty]);

  // Executa uma ação protegida por verificação de alterações pendentes
  const executeWithDirtyCheck = (action: () => void) => {
    if (isDirty) {
      setPendingAction(() => action);
      setShowDiscardModal(true);
    } else {
      action();
    }
  };

  // Totais
  const totalProdutos = useMemo(() => {
    if (!Array.isArray(listaProdutosInseridos)) return 0;
    return listaProdutosInseridos.reduce((acc, curr) => acc + (curr.ORE_VALOR || 0), 0);
  }, [listaProdutosInseridos]);

  const totalServicos = useMemo(() => {
    if (!Array.isArray(listaServicosInseridos)) return 0;
    return listaServicosInseridos.reduce((acc, curr) => acc + (curr.OS_VALOR || 0), 0);
  }, [listaServicosInseridos]);

  const totalItens = (Array.isArray(listaProdutosInseridos) ? listaProdutosInseridos.length : 0) + (Array.isArray(listaServicosInseridos) ? listaServicosInseridos.length : 0);

  // Carregamento Inicial
  useEffect(() => {
    carregaUnidadesMed();
    carregaSolicitantes();
    try {
      const funcionario = JSON.parse(localStorage.getItem("usuario_logado") || "null");
      if (funcionario) {
        setNomeFuncionario(funcionario.FUN_NOME || "");
        setIdFuncionario(funcionario.USU_FUN || 0);
      }
    } catch {
      // Ignora erro de JSON
    }
  }, []);

  const carregaSolicitantes = useCallback(async () => {
    try {
      const repository = new SolicitanteRepository();
      const lista = await repository.getSolicitantes();
      setSolicitantes(lista || []);
    } catch (error) {
      console.error("Erro ao carregar solicitantes:", error);
    }
  }, []);

  const carregaUnidadesMed = async () => {
    try {
      const repository = new UnidadeMedidaRepository();
      const unidades = await repository.getUnidadeMedidas();
      setListaUnidadesMed(unidades || []);
    } catch (error) {
      toastMixin.fire("Erro", String(error), "error");
    }
  };

  // Re-busca ordem quando faturada e disponibiliza emissão de PDF Completo (D07 / A22)
  useEffect(() => {
    if (foiFaturado) {
      buscaOrdemServidor();
      setShowModalPosFaturamento(true);
    }
  }, [foiFaturado]);

  // Sincroniza Cliente no Contexto apenas quando o código realmente mudar
  useEffect(() => {
    if (clienteSelecionado?.CODIGO && OrdemCtx && OrdemCtx.ORD_CLI !== clienteSelecionado.CODIGO) {
      setOrdemCtx((prev) => (prev ? { ...prev, ORD_CLI: clienteSelecionado.CODIGO } : prev));
    }
  }, [clienteSelecionado?.CODIGO, OrdemCtx, setOrdemCtx]);

  const ordemServicoParaEmpreitadas = useMemo<OrdemModel>(() => {
    return {
      ...(ordem || {
        ORD_CODIGO: codigoOrdem,
        ORD_DATA: formatDataInput(dataAbertura),
        ORD_VALOR: totalProdutos + totalServicos - (valorDesconto ?? 0),
        ORD_CLI: clienteSelecionado.CODIGO,
        ORD_DESCONTO_P: 0,
        ORD_DESCONTO_S: 0,
        ORD_DEVOLUCAO_P: "N",
        ORD_ESTADO: statusOrdem,
        ORD_FUN: idFuncionario,
        ORD_NFS: nfs,
        ORD_OBS: obs,
        ORD_OBS_ADM: obs_adm,
        ORD_SOLICITACAO: solicitacao,
        CLI_NOME: clienteSelecionado.NOME,
        ORD_FAT: codFatura,
      }),
      itensOrdSer: listaServicosInseridos,
      itensOrdEst: listaProdutosInseridos,
    } as OrdemModel;
  }, [
    ordem,
    codigoOrdem,
    dataAbertura,
    totalProdutos,
    totalServicos,
    valorDesconto,
    clienteSelecionado.CODIGO,
    clienteSelecionado.NOME,
    statusOrdem,
    idFuncionario,
    nfs,
    obs,
    obs_adm,
    solicitacao,
    codFatura,
    listaServicosInseridos,
    listaProdutosInseridos,
  ]);

  // Carrega o total pago/faturado da OS (recebimentos do cliente vinculados à OS)
  const carregaTotalPagoOS = async (codigo: number) => {
    if (!codigo || codigo <= 0) {
      setTotalPago(0);
      setErroTotalPago(false);
      setCarregandoTotalPago(false);
      return;
    }
    setCarregandoTotalPago(true);
    setErroTotalPago(false);
    try {
      const rep = new OrdemRepository();
      const pago = await rep.buscaTotalPagoOS(codigo);
      setTotalPago(pago);
    } catch (err) {
      console.error("Erro ao carregar total pago da OS:", err);
      setErroTotalPago(true);
    } finally {
      setCarregandoTotalPago(false);
    }
  };

  // Debounce para busca de ordem quando o código é alterado
  useEffect(() => {
    if (codigoOrdem <= 0) {
      setTotalPago(0);
      setErroTotalPago(false);
      setCarregandoTotalPago(false);
    } else {
      // Limpa total pago imediatamente ao trocar de OS para não exibir resíduo da OS anterior
      setTotalPago(0);
      setErroTotalPago(false);
    }

    const timeout = setTimeout(() => {
      if (codigoOrdem > 0) {
        buscaOrdemServidor();
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [codigoOrdem]);

  // Buscar Ordem no Servidor
  const buscaOrdemServidor = async () => {
    try {
      if (codigoOrdem === 0) {
        serParceiroSelecionado({ CODIGO: 0, NOME: "" });
        return;
      }

      const fornecedorRepository = new FornecedorRepository();
      const cliRepository = new ClientRepository();
      const repository = new OrdemRepository();
      const ord = await repository.buscaOrdem(codigoOrdem);

      if (!ord) {
        toastMixin.fire("Atenção", "Ordem não encontrada!", "warning");
        return;
      }

      const parceiro = await fornecedorRepository.getFornecedorById(ord.ORD_FORNECEDOR ?? 0);
      serParceiroSelecionado(parceiro || { CODIGO: 0, NOME: "" });

      setDataAbertura(parseDataCalendario(ord.ORD_DATA));



      const cli = await cliRepository.getClienteById(ord.ORD_CLI);
      setClienteSelecionado(cli || { CODIGO: 1, NOME: "CONSUMIDOR" });

      setNfs(ord.ORD_NFS ?? "");
      setObs(ord.ORD_OBS ?? "");
      setObs_adm(ord.ORD_OBS_ADM ?? "");
      setSolicitacao(ord.ORD_SOLICITACAO ?? "");
      setStatusOrdem(ord.ORD_ESTADO || Status[0].toUpperCase());
      setCodFatura(ord.ORD_FAT ?? 0);
      setValorPorcentagemDesconto(ord.ORD_PORCENTAGEM_DESCONTO ?? 0);
      setValorDesconto(ord.ORD_VALOR_DESCONTO ?? 0);

      // Carrega campos operacionais de OS Aprovada
      setOm(ord.ORD_OM || "");
      setPedidoCompra(ord.ORD_PEDIDO_COMPRA || "");
      const previsaoFormatada = ord.ORD_PREVISAO_CONCLUSAO && ord.ORD_PREVISAO_CONCLUSAO !== "1900-01-01"
        ? formatDataInput(parseDataCalendario(ord.ORD_PREVISAO_CONCLUSAO))
        : "";
      setDataPrevisaoConclusao(previsaoFormatada);
      setJustificativaAtraso(ord.ORD_JUSTIFICATIVA_ATRASO || "");

      // Solicitante (Coordenador que abre/aprova o chamado)
      setSolicitanteId(ord.ORD_SOLICITANTE_ID ?? 0);
      setSolicitanteNome(ord.ORD_SOLICITANTE_NOME || "");

      // Busca Produtos e Serviços
      const produtos = await repository.buscaProdutosOrdem(codigoOrdem);
      setListaProdutosInseridos(Array.isArray(produtos) ? produtos : []);

      const servicos = await repository.buscaServicosOrdem(codigoOrdem);
      setListaServicosInseridos(Array.isArray(servicos) ? servicos : []);

      ord.itensOrdEst = Array.isArray(produtos) ? produtos : [];
      ord.itensOrdSer = Array.isArray(servicos) ? servicos : [];

      setOrdem(ord);
      setOrdemCtx(ord);
      setBuscouOrdem(true);

      // E06: Carrega total pago acumulado nas empreitadas da OS
      await carregaTotalPagoOS(codigoOrdem);

      // Ordem carregada do servidor: atualiza snapshot salvo e limpa filas de exclusão (R03)
      const dataParsed = parseDataCalendario(ord.ORD_DATA);
      const cliLoaded = cli || { CODIGO: 1, NOME: "CONSUMIDOR" };
      const parcLoaded = parceiro || { CODIGO: 0, NOME: "" };
      const prodsLoaded = Array.isArray(produtos) ? produtos : [];
      const servsLoaded = Array.isArray(servicos) ? servicos : [];

      savedSnapshotRef.current = makeOrcamentoSnapshot({
        cliCod: cliLoaded.CODIGO,
        parcCod: parcLoaded.CODIGO,
        dataStr: formatDataInput(dataParsed),
        status: ord.ORD_ESTADO || Status[0].toUpperCase(),
        nfsVal: ord.ORD_NFS ?? "",
        solic: ord.ORD_SOLICITACAO ?? "",
        obsVal: ord.ORD_OBS ?? "",
        obsAdmVal: ord.ORD_OBS_ADM ?? "",
        descVal: ord.ORD_VALOR_DESCONTO ?? 0,
        descPct: ord.ORD_PORCENTAGEM_DESCONTO ?? 0,
        omVal: ord.ORD_OM || "",
        pedVal: ord.ORD_PEDIDO_COMPRA || "",
        prevVal: previsaoFormatada,
        justVal: ord.ORD_JUSTIFICATIVA_ATRASO || "",
        solicId: ord.ORD_SOLICITANTE_ID ?? 0,
        servs: servsLoaded,
        prods: prodsLoaded,
      });
      setIsDirty(false);
      setServicosParaExcluir([]);
      setProdutosParaExcluir([]);

      toastMixin.fire({
        title: "Ordem encontrada",
        text: `Ordem #${codigoOrdem} carregada com sucesso`,
        icon: "success",
        timer: 1500,
      });
    } catch (error) {
      toastMixin.fire("Erro", String(error), "error");
    }
  };

  // Limpar formulário para Novo Orçamento
  const handleNovoOrcamento = (silent?: boolean) => {
    const novaData = new Date();
    const novoStatus = Status[0].toUpperCase();
    setCodigoOrdem(0);
    setOrdem(null);
    setBuscouOrdem(false);
    setTotalPago(0);
    setCarregandoTotalPago(false);
    setErroTotalPago(false);
    setDataAbertura(novaData);
    setStatusOrdem(novoStatus);
    setNfs("");
    setCodFatura(0);
    setSolicitacao("");
    setObs("");
    setObs_adm("");
    setOm("");
    setPedidoCompra("");
    setDataPrevisaoConclusao("");
    setJustificativaAtraso("");
    setSolicitanteId(0);
    setSolicitanteNome("");
    setClienteSelecionado({ CODIGO: 1, NOME: "CONSUMIDOR" });
    serParceiroSelecionado({ CODIGO: 0, NOME: "" });
    setListaServicosInseridos([]);
    setListaProdutosInseridos([]);
    setValorDesconto(0);
    setValorPorcentagemDesconto(0);
    savedSnapshotRef.current = makeOrcamentoSnapshot({
      cliCod: 1,
      parcCod: 0,
      dataStr: formatDataInput(novaData),
      status: novoStatus,
      nfsVal: "",
      solic: "",
      obsVal: "",
      obsAdmVal: "",
      descVal: 0,
      descPct: 0,
      omVal: "",
      pedVal: "",
      prevVal: "",
      justVal: "",
      solicId: 0,
      servs: [],
      prods: [],
    });
    setIsDirty(false);
    setServicosParaExcluir([]);
    setProdutosParaExcluir([]);
    if (!silent) {
      toastMixin.fire({
        title: "Novo Orçamento",
        text: "Campos limpos para criação de uma nova ordem",
        icon: "info",
        timer: 1500,
      });
    }
  };

  // Salvar Ordem no Banco
  const salvaOrdem = async (): Promise<boolean> => {
    if (!statusOrdem) {
      toastMixin.fire("Atenção", "Informe o estado/status da ordem", "warning");
      return false;
    }
    if (!dataAbertura || isNaN(dataAbertura.getTime())) {
      toastMixin.fire("Atenção", "Por favor, informe uma data de abertura válida.", "warning");
      return false;
    }
    if (!solicitacao.trim()) {
      toastMixin.fire("Atenção", "A solicitação do cliente é obrigatória!", "warning");
      return false;
    }
    if (listaProdutosInseridos.length === 0 && listaServicosInseridos.length === 0) {
      toastMixin.fire("Atenção", "Insira ao menos um produto ou serviço na ordem.", "warning");
      return false;
    }

    try {
      const cidadeRep = new CidadeRepository();
      const cidade = await cidadeRep.getCidade(clienteSelecionado.CODCIDADE ?? 0);

      let codigo = codigoOrdem;
      if (codigo === 0) {
        codigo = await IncrementaGenerator("GEN_ORD");
      }

      const ord: OrdemModel = {
        ORD_CODIGO: codigo,
        ORD_DATA: formatDataInput(dataAbertura),
        ORD_DATAC: ordem?.ORD_DATAC,
        ORD_HORA: ordem?.ORD_HORA,
        ORD_VALOR: totalProdutos + totalServicos - (valorDesconto ?? 0),
        ORD_CLI: clienteSelecionado.CODIGO,
        ORD_DESCONTO_P: 0,
        ORD_DESCONTO_S: 0,
        ORD_DEVOLUCAO_P: "N",
        ORD_ESTADO: statusOrdem,
        ORD_FUN: ordem?.ORD_FUN && ordem.ORD_FUN > 0 ? ordem.ORD_FUN : idFuncionario,
        FUN_NOME: ordem?.FUN_NOME || nomeFuncionario,
        ORD_NFS: nfs,
        ORD_OBS: obs,
        ORD_OBS_ADM: obs_adm,
        ORD_SOLICITACAO: solicitacao,
        CLI_NOME: clienteSelecionado.NOME,
        ORD_FAT: codFatura,
        CLI_CNPJ_CPF: clienteSelecionado.CPF_CNPJ || "",
        CLI_ENDERECO: clienteSelecionado.ENDERECO || "",
        CLI_NUMERO: clienteSelecionado.NUMERO || "",
        CLI_BAIRRO: clienteSelecionado.BAIRRO || "",
        CLI_FONE: clienteSelecionado.FONE || "",
        itensOrdEst: listaProdutosInseridos,
        itensOrdSer: listaServicosInseridos,
        CID_NOME: cidade?.CID_NOME || "",
        CID_UF: cidade?.CID_UF || "",
        ORD_FORNECEDOR: parceiroSelecionado.CODIGO || 0,
        ORD_VALOR_DESCONTO: valorDesconto ?? 0,
        ORD_PORCENTAGEM_DESCONTO: valorPorcentagemDesconto ?? 0,
        ORD_TOTAL_SEM_DESCONTO: totalProdutos + totalServicos,
        ORD_OM: om,
        ORD_PEDIDO_COMPRA: pedidoCompra,
        ORD_PREVISAO_CONCLUSAO: dataPrevisaoConclusao,
        ORD_JUSTIFICATIVA_ATRASO: justificativaAtraso,
        ORD_SOLICITANTE_ID: solicitanteId > 0 ? solicitanteId : undefined,
        ORD_SOLICITANTE_NOME: solicitanteNome || undefined,
      };

      const repository = new OrdemRepository();
      const prodRepository = new ProdutoRepository();
      await repository.insereordem(ord);

      // Executa exclusões pendentes de serviços e produtos no banco apenas ao salvar (R03)
      for (const codServ of servicosParaExcluir) {
        if (codServ > 0) {
          await repository.deleteServicoOrdemPorCodigo(codServ);
        }
      }
      for (const codProd of produtosParaExcluir) {
        if (codProd > 0) {
          await prodRepository.deleteProdutoOrdemPorCodigo(codProd);
        }
      }

      // Salva Serviços
      if (listaServicosInseridos.length > 0) {
        for (const s of listaServicosInseridos) {
          if (!s.OS_CODIGO || s.OS_CODIGO <= 0) {
            s.OS_CODIGO = await IncrementaGenerator("GEN_OS");
          }
          s.OS_ORD = codigo;
          await repository.insereServicos(codigo, s);
        }
      }

      // Salva Produtos
      if (listaProdutosInseridos.length > 0) {
        for (const p of listaProdutosInseridos) {
          if (!p.ORE_CODIGO || p.ORE_CODIGO <= 0) {
            p.ORE_CODIGO = await IncrementaGenerator("GEN_ORE");
          }
          p.ORE_ORD = codigo;
          await repository.insereProdutos(codigo, p);
        }
      }

      setCodigoOrdem(codigo);
      setOrdem(ord);
      setOrdemCtx(ord);
      setBuscouOrdem(true);

      // E06: Recarrega o total pago acumulado após salvar
      await carregaTotalPagoOS(codigo);

      // Sucesso ao salvar: atualiza snapshot salvo, zera o dirty state e limpa as filas de exclusão (R03)
      savedSnapshotRef.current = makeOrcamentoSnapshot({
        cliCod: clienteSelecionado.CODIGO,
        parcCod: parceiroSelecionado.CODIGO,
        dataStr: formatDataInput(dataAbertura),
        status: statusOrdem,
        nfsVal: nfs,
        solic: solicitacao,
        obsVal: obs,
        obsAdmVal: obs_adm,
        descVal: valorDesconto,
        descPct: valorPorcentagemDesconto,
        omVal: om,
        pedVal: pedidoCompra,
        prevVal: dataPrevisaoConclusao,
        justVal: justificativaAtraso,
        solicId: solicitanteId,
        servs: listaServicosInseridos,
        prods: listaProdutosInseridos,
      });
      setIsDirty(false);
      setServicosParaExcluir([]);
      setProdutosParaExcluir([]);

      toastMixin.fire({
        title: "Sucesso",
        text: `Ordem #${codigo} salva com sucesso!`,
        icon: "success",
        timer: 2000,
      });
      return true;
    } catch (e) {
      toastMixin.fire({
        title: "Erro ao Salvar",
        text: String(e),
        icon: "error",
      });
      return false;
    }
  };

  // Excluir Serviço (em memória até salvar - R03)
  const handleExcluirServico = (codigo: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Serviço",
      message: "Tem certeza de que deseja remover este serviço da ordem?",
      type: "danger",
      confirmText: "Sim, Excluir",
      onConfirm: () => {
        setListaServicosInseridos((prev) => prev.filter((s) => s.OS_CODIGO !== codigo));
        if (codigo > 0) {
          setServicosParaExcluir((prev) => (prev.includes(codigo) ? prev : [...prev, codigo]));
        }
        setIsDirty(true);
        toastMixin.fire({
          title: "Serviço Removido",
          text: "Clique em Salvar Orçamento para efetivar a alteração.",
          icon: "success",
          timer: 1500,
        });
        setConfirmModal((c) => ({ ...c, isOpen: false }));
      },
    });
  };

  // Excluir Produto (em memória até salvar - R03)
  const handleExcluirProduto = (codigo: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Produto",
      message: "Tem certeza de que deseja remover este produto da ordem?",
      type: "danger",
      confirmText: "Sim, Excluir",
      onConfirm: () => {
        setListaProdutosInseridos((prev) => prev.filter((p) => p.ORE_CODIGO !== codigo));
        if (codigo > 0) {
          setProdutosParaExcluir((prev) => (prev.includes(codigo) ? prev : [...prev, codigo]));
        }
        setIsDirty(true);
        toastMixin.fire({
          title: "Produto Removido",
          text: "Clique em Salvar Orçamento para efetivar a alteração.",
          icon: "success",
          timer: 1500,
        });
        setConfirmModal((c) => ({ ...c, isOpen: false }));
      },
    });
  };

  // Inserir Novo Serviço (ID definitivo gerado ao salvar)
  const handleAdicionarServico = async (novo: OrdSerModel) => {
    try {
      const tempCodigo = -Date.now() - Math.floor(Math.random() * 10000);
      setListaServicosInseridos((prev) => [
        ...prev,
        {
          ...novo,
          OS_CODIGO: tempCodigo,
        },
      ]);
      setIsDirty(true);
      toastMixin.fire({
        title: "Serviço Adicionado",
        icon: "success",
        timer: 1200,
      });
    } catch (err) {
      toastMixin.fire("Erro", String(err), "error");
    }
  };

  // Inserir Novo Produto (ID definitivo gerado ao salvar)
  const handleAdicionarProduto = async (novo: OrdEstModel) => {
    try {
      const tempCodigo = -Date.now() - Math.floor(Math.random() * 10000);
      setListaProdutosInseridos((prev) => [
        ...prev,
        {
          ...novo,
          ORE_CODIGO: tempCodigo,
        },
      ]);
      setIsDirty(true);
      toastMixin.fire({
        title: "Produto Adicionado",
        icon: "success",
        timer: 1200,
      });
    } catch (err) {
      toastMixin.fire("Erro", String(err), "error");
    }
  };

  // Salvar Edição de Serviço
  const handleSaveServicoEditado = (servicoAtualizado: OrdSerModel) => {
    setListaServicosInseridos((prev) => {
      const idx = prev.findIndex((s) => s.OS_CODIGO === servicoAtualizado.OS_CODIGO);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = servicoAtualizado;
        return copy;
      }
      return prev;
    });
    setIsDirty(true);
    setShowModalEdtServico(false);
    toastMixin.fire({
      title: "Serviço Atualizado",
      icon: "success",
      timer: 1200,
    });
  };

  // Salvar Edição de Produto
  const handleSaveProdutoEditado = (produtoAtualizado: OrdEstModel) => {
    setListaProdutosInseridos((prev) => {
      const idx = prev.findIndex((p) => p.ORE_CODIGO === produtoAtualizado.ORE_CODIGO);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = produtoAtualizado;
        return copy;
      }
      return prev;
    });
    setIsDirty(true);
    setShowModalEdtProduto(false);
    toastMixin.fire({
      title: "Produto Atualizado",
      icon: "success",
      timer: 1200,
    });
  };

  // Impressão
  const handleImprimir = () => {
    if (ordem != null) {
      setOrdemCtx(ordem);
      setShowModalImprimir(true);
    } else {
      toastMixin.fire("Atenção", "Salve ou busque a ordem antes de imprimir.", "warning");
    }
  };

  // Impressão Completa da OS (R06 / D07)
  const handleImprimirCompleto = () => {
    if (codigoOrdem > 0) {
      setShowModalPrintOSCompleta(true);
    } else {
      toastMixin.fire("Atenção", "Salve ou busque a ordem antes de gerar o relatório completo.", "warning");
    }
  };

  // Faturamento
  const handleFaturamento = async () => {
    if (totalItens === 0) {
      toastMixin.fire("Atenção", "Insira ao menos um produto ou serviço para faturar!", "warning");
      return;
    }
    const salvou = await salvaOrdem();
    if (!salvou) return;
    setShowFaturamento(true);
  };

  return (
    <div className="flex flex-col w-full min-h-full bg-white p-4 sm:p-6 pb-20 lg:pb-6 gap-4 font-sans text-ek-text">
      {/* 1. Header Superior com Status e Ações */}
      <HeaderOrcamento
        codigoOrdem={codigoOrdem}
        statusOrdem={statusOrdem}
        canSave={totalItens > 0}
        onOpenPesquisaOS={() => executeWithDirtyCheck(() => setShowModalPesquisaOS(true))}
        onNovoOrcamento={() => executeWithDirtyCheck(handleNovoOrcamento)}
        onSalvar={salvaOrdem}
        onImprimir={handleImprimir}
        onImprimirCompleto={handleImprimirCompleto}
      />

      {/* 2. Grid de Conteúdo: Coluna Principal (75%) e Lateral (25%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 items-start">
        {/* Coluna Principal (Itens, Identificação e Observações) */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-3 min-w-0">
          {/* Card de Identificação */}
          <FormIdentificacao
            cliente={clienteSelecionado}
            onOpenPesquisaCliente={() => setShowModalPesquisaCliente(true)}
            parceiro={parceiroSelecionado}
            onOpenPesquisaFornecedor={() => setShowModalPesquisaFornecedor(true)}
            onClearParceiro={() => {
              serParceiroSelecionado({ CODIGO: 0, NOME: "" });
              setIsDirty(true);
            }}
            dataAbertura={dataAbertura}
            setDataAbertura={(d) => {
              setDataAbertura(d);
              setIsDirty(true);
            }}
            statusOrdem={statusOrdem}
            setStatusOrdem={(s) => {
              setStatusOrdem(s);
              setIsDirty(true);
            }}
            listaStatus={listaStatusDisponiveis}
            nfs={nfs}
            setNfs={(n) => {
              setNfs(n);
              setIsDirty(true);
            }}
            codFatura={codFatura}
            nomeFuncionario={ordem?.FUN_NOME || nomeFuncionario}
            solicitacao={solicitacao}
            setSolicitacao={(s) => {
              setSolicitacao(s);
              setIsDirty(true);
            }}
            om={om}
            setOm={(v) => {
              setOm(v);
              setIsDirty(true);
            }}
            pedidoCompra={pedidoCompra}
            setPedidoCompra={(v) => {
              setPedidoCompra(v);
              setIsDirty(true);
            }}
            dataPrevisaoConclusao={dataPrevisaoConclusao}
            setDataPrevisaoConclusao={(v) => {
              setDataPrevisaoConclusao(v);
              setIsDirty(true);
            }}
            justificativaAtraso={justificativaAtraso}
            setJustificativaAtraso={(v) => {
              setJustificativaAtraso(v);
              setIsDirty(true);
            }}
            solicitanteId={solicitanteId}
            setSolicitanteId={(id) => {
              setSolicitanteId(id);
              setIsDirty(true);
            }}
            solicitanteNome={solicitanteNome}
            setSolicitanteNome={(nome) => {
              setSolicitanteNome(nome);
              setIsDirty(true);
            }}
            solicitantes={solicitantes}
            onOpenNovoSolicitante={() => setShowModalNovoSolicitante(true)}
          />

          {/* Abas de Itens: Serviços vs Produtos (Underline Framed Sheet) */}
          <div>
            <div className="flex items-center gap-6 border-b border-ek-rule mb-3">
              <button
                type="button"
                onClick={() => setAbaAtiva("SERVICOS")}
                className={`relative flex items-center gap-2 py-2.5 text-sm transition-colors border-b-2 -mb-px ${
                  abaAtiva === "SERVICOS"
                    ? "border-brand text-ek-text font-semibold"
                    : "border-transparent text-ek-muted font-medium hover:text-ek-text"
                }`}
              >
                <Wrench className={`w-4 h-4 ${abaAtiva === "SERVICOS" ? "text-brand" : "text-ek-faint"}`} />
                <span>Serviços ({listaServicosInseridos.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setAbaAtiva("PRODUTOS")}
                className={`relative flex items-center gap-2 py-2.5 text-sm transition-colors border-b-2 -mb-px ${
                  abaAtiva === "PRODUTOS"
                    ? "border-brand text-ek-text font-semibold"
                    : "border-transparent text-ek-muted font-medium hover:text-ek-text"
                }`}
              >
                <Package className={`w-4 h-4 ${abaAtiva === "PRODUTOS" ? "text-brand" : "text-ek-faint"}`} />
                <span>Produtos ({listaProdutosInseridos.length})</span>
              </button>
            </div>

            {/* Conteúdo da Aba Ativa */}
            {abaAtiva === "SERVICOS" ? (
              <TabServicos
                servicos={listaServicosInseridos}
                unidadesMedida={listaUnidadesMed}
                onAdicionarServico={handleAdicionarServico}
                onEditarServico={(s) => {
                  setServicoEdt(s);
                  setShowModalEdtServico(true);
                }}
                onExcluirServico={handleExcluirServico}
              />
            ) : (
              <TabProdutos
                produtos={listaProdutosInseridos}
                unidadesMedida={listaUnidadesMed}
                onAdicionarProduto={handleAdicionarProduto}
                onEditarProduto={(p) => {
                  setProdutoEdt(p);
                  setShowModalEdtProduto(true);
                }}
                onExcluirProduto={handleExcluirProduto}
                onOpenPesquisaProduto={() => setShowModalPesquisaProduto(true)}
                produtoSelecionado={produtoSelecionado}
                setProdutoSelecionado={setProdutoSelecionado}
              />
            )}
          </div>

          {/* Card de Termos e Observações */}
          <FormObservacoes
            obs={obs}
            setObs={(o) => {
              setObs(o);
              setIsDirty(true);
            }}
            obsAdm={obs_adm}
            setObsAdm={(a) => {
              setObs_adm(a);
              setIsDirty(true);
            }}
          />
        </div>

        {/* Coluna Lateral: Resumo Financeiro & Atalhos (30%) */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-3 min-w-0">
          <PainelTotais
            totalServicos={totalServicos}
            totalProdutos={totalProdutos}
            valorDesconto={valorDesconto}
            setValorDesconto={(v) => {
              setValorDesconto(v);
              setIsDirty(true);
            }}
            valorPorcentagemDesconto={valorPorcentagemDesconto}
            setValorPorcentagemDesconto={(p) => {
              setValorPorcentagemDesconto(p);
              setIsDirty(true);
            }}
            codigoOrdem={codigoOrdem}
            codFatura={codFatura}
            totalItens={totalItens}
            totalPago={totalPago}
            carregandoTotalPago={carregandoTotalPago}
            erroTotalPago={erroTotalPago}
            onRetryTotalPago={() => carregaTotalPagoOS(codigoOrdem)}
            isDirty={isDirty}
            onFaturar={handleFaturamento}
            onAbrirEmpreitadas={() => setShowModalEmpreitadas(true)}
            onAbrirArquivos={() => setShowModalListaArquivos(true)}
            onImprimir={handleImprimir}
            onImprimirCompleto={handleImprimirCompleto}
            onSalvar={salvaOrdem}
            canSave={totalItens > 0}
          />
        </div>
      </div>

      {/* --- MODAIS DE PESQUISA, FATURAMENTO, IMPRESSÃO E ARQUIVOS --- */}

      {/* Modal Pesquisa OS */}
      {showModalPesquisaOS && (
        <PesquisaOrdem
          OrdemSelecionado={codigoOrdem}
          setOrdemSelecionado={setCodigoOrdem}
          showModal={showModalPesquisaOS}
          setShowModal={setShowModalPesquisaOS}
          setBuscouOrdem={setBuscouOrdem}
        />
      )}

      {/* Modal Pesquisa Cliente */}
      {showModalPesquisaCliente && (
        <Pesquisa_cliente
          clienteSelecionado={clienteSelecionado}
          setClienteSelecionado={(cli) => {
            setClienteSelecionado(cli);
            setIsDirty(true);
          }}
          showModal={showModalPesquisaCliente}
          setShowModal={setShowModalPesquisaCliente}
        />
      )}

      {/* Modal Pesquisa Fornecedor / Parceiro */}
      {showModalPesquisaFornecedor && (
        <PesquisaFornecedor
          fornecedorSelecionado={parceiroSelecionado}
          setFornecedorSelecionado={(forn) => {
            serParceiroSelecionado(forn);
            setIsDirty(true);
          }}
          showModal={showModalPesquisaFornecedor}
          setShowModal={setShowModalPesquisaFornecedor}
        />
      )}

      {/* Modal Pesquisa Produto */}
      {showModalPesquisaProduto && (
        <Pesquisa_produto
          produtoSelecionado={produtoSelecionado}
          setProdutoSelecionado={setProdutoSelecionado}
          showModal={showModalPesquisaProduto}
          setShowModal={setShowModalPesquisaProduto}
        />
      )}

      {/* Modal Edição de Serviço */}
      {showModalEdtServico && servicoEdt && (
        <ModalItemServico
          isOpen={showModalEdtServico}
          onClose={() => setShowModalEdtServico(false)}
          servico={servicoEdt}
          unidadesMedida={listaUnidadesMed}
          onSave={handleSaveServicoEditado}
        />
      )}

      {/* Modal Edição de Produto */}
      {showModalEdtProduto && produtoEdt && (
        <ModalItemProduto
          isOpen={showModalEdtProduto}
          onClose={() => setShowModalEdtProduto(false)}
          produto={produtoEdt}
          unidadesMedida={listaUnidadesMed}
          onSave={handleSaveProdutoEditado}
        />
      )}

      {/* Modal de Confirmação Unificado */}
      <ModalConfirmacao
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((c) => ({ ...c, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
      />

      {/* Modal de Descarte de Alterações Pendentes (E02 / R03) */}
      <ModalConfirmacao
        isOpen={showDiscardModal}
        onClose={() => {
          setShowDiscardModal(false);
          setPendingAction(null);
        }}
        onConfirm={async () => {
          setShowDiscardModal(false);
          setIsDirty(false);
          setServicosParaExcluir([]);
          setProdutosParaExcluir([]);
          if (codigoOrdem > 0) {
            await buscaOrdemServidor();
          } else {
            handleNovoOrcamento(true);
          }
          const act = pendingAction;
          setPendingAction(null);
          if (act) act();
        }}
        title="Atenção!"
        message="Existem alterações que ainda não foram salvas. Se você sair desta tela, todas as alterações realizadas serão perdidas. Deseja realmente sair sem salvar?"
        type="warning"
        confirmText="Sair sem salvar"
        cancelText="Continuar editando"
      />

      {/* Modal de Impressão */}
      {showModalimprimir && (
        <Modal
          showModal={showModalimprimir}
          setShowModal={setShowModalImprimir}
          title={foiFaturado ? "Impressão de Ordem de Serviço" : "Impressão de Orçamento"}
          showButtonExit={false}
          body={<PrintOrcamentos />}
        />
      )}

      {/* Modal de Faturamento */}
      {showFaturamento && (
        <Modal
          title="Faturamento de Ordem de Serviço"
          showModal={showFaturamento}
          setShowModal={setShowFaturamento}
          showButtonExit={false}
          body={
            <Faturamentos
              tipoRecPag="R"
              Operacao={new OperacaoOrdens()}
              pedFat={{
                PF_CODIGO: 0,
                PF_COD_CLI: clienteSelecionado.CODIGO,
                PF_CAMPO_DATAC: "ORD_DATAC",
                PF_CAMPO_FAT: "ORD_FAT",
                PF_CAMPO_PED: "ORD_CODIGO",
                PF_CLIENTE: clienteSelecionado.NOME,
                PF_COD_PED: codigoOrdem,
                PF_DATA: FormatDate(new Date()),
                PF_DATAC: "01/01/1900",
                PF_DESCONTO: valorDesconto || 0,
                PF_FAT: 0,
                PF_FUN: idFuncionario || 1,
                PF_PARCELAS: 1,
                PF_TABELA: "ORDENS",
                PF_TIPO: 1,
                PF_VALOR: totalProdutos + totalServicos - (valorDesconto || 0),
                PF_VALORB: 0,
                PF_VALORPG: 0,
              }}
              model={ordem!}
              itens={listaProdutosInseridos}
              itens2={listaServicosInseridos}
              setShowModal={setShowFaturamento}
              setFaturado={setFoiFaturado}
              cliFor={clienteSelecionado}
              valorTotal={totalProdutos + totalServicos - (valorDesconto || 0)}
            />
          }
        />
      )}

      {/* Modal de Empreitadas */}
      {showModalEmpreitadas && (
        <Modal
          showModal={showModalEmpreitadas}
          setShowModal={(show) => {
            setShowModalEmpreitadas(show);
            if (!show && codigoOrdem > 0) {
              carregaTotalPagoOS(codigoOrdem);
            }
          }}
          title="Empreitadas"
          showButtonExit={false}
          body={
            <Empreitadas
              ordemServico={ordemServicoParaEmpreitadas}
              onUpdateTotalPago={() => {
                if (codigoOrdem > 0) carregaTotalPagoOS(codigoOrdem);
              }}
            />
          }
        />
      )}

      {/* Modal de Listar Arquivos / Anexos */}
      {showModalListaArquivos && (
        <ModalListarArquivos
          codigoOrdem={codigoOrdem}
          setShowModal={setShowModalListaArquivos}
          showmodal={showModalListaArquivos}
        />
      )}

      {/* Modal de Impressão Completa da OS (R06 / D07) */}
      {showModalPrintOSCompleta && (
        <Modal
          showModal={showModalPrintOSCompleta}
          setShowModal={setShowModalPrintOSCompleta}
          title={`Relatório Completo • Ordem de Serviço #${codigoOrdem}`}
          showButtonExit={false}
          body={
            <PrintOSCompleta
              codigoOrdem={codigoOrdem}
              onClose={() => setShowModalPrintOSCompleta(false)}
            />
          }
        />
      )}

      {/* Modal Pós-Faturamento com Ações de Emissão de Documento (D07 / A22) */}
      {showModalPosFaturamento && (
        <Modal
          showModal={showModalPosFaturamento}
          setShowModal={setShowModalPosFaturamento}
          title="Faturamento Concluído com Sucesso!"
          showButtonExit={false}
          body={
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-ek-text">
                Ordem de Serviço #{codigoOrdem} faturada com sucesso!
              </h3>
              <p className="text-xs text-ek-muted mt-1 max-w-sm">
                A fatura foi vinculada e os lançamentos financeiros foram criados. Deseja emitir o relatório completo agora?
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-5 w-full max-w-md">
                <button
                  type="button"
                  onClick={() => {
                    setShowModalPosFaturamento(false);
                    setShowModalPrintOSCompleta(true);
                  }}
                  className="ek-btn-primary w-full sm:flex-1 h-9 text-xs"
                >
                  <FileText className="w-4 h-4" />
                  <span>Gerar PDF Completo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowModalPosFaturamento(false);
                    if (ordem) {
                      setOrdemCtx(ordem);
                    }
                    setShowModalImprimir(true);
                  }}
                  className="ek-btn-secondary w-full sm:flex-1 h-9 text-xs"
                >
                  <Printer className="w-4 h-4 text-ek-muted" />
                  <span>Orçamento Resumido</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowModalPosFaturamento(false)}
                className="mt-3.5 text-xs text-ek-muted hover:text-ek-text underline font-medium transition-colors"
              >
                Concluir sem imprimir agora
              </button>
            </div>
          }
        />
      )}

      {/* Modal Cadastro Rápido de Solicitante */}
      <ModalCadastroSolicitante
        isOpen={showModalNovoSolicitante}
        onClose={() => setShowModalNovoSolicitante(false)}
        onSalvo={(novo) => {
          setSolicitantes((prev) => {
            const exists = prev.some((s) => s.SOL_CODIGO === novo.SOL_CODIGO);
            if (exists) {
              return prev.map((s) => (s.SOL_CODIGO === novo.SOL_CODIGO ? novo : s));
            }
            return [...prev, novo].sort((a, b) => a.SOL_NOME.localeCompare(b.SOL_NOME));
          });
          setSolicitanteId(novo.SOL_CODIGO);
          setSolicitanteNome(novo.SOL_NOME);
          setIsDirty(true);
        }}
      />
    </div>
  );
}
