"use client";

import { useEffect, useState, useMemo } from "react";
import { useAppData } from "@/app/contexts/app_context";
import {
  FormatDate,
  Status,
  toastMixin,
  IncrementaGenerator,
  converterDataPontoParaTraco,
} from "@/app/functions/utils";

// Modelos
import OrdemModel from "@/app/models/ordem_model";
import { ClienteModel } from "@/app/models/cliente_model";
import { FornecedorModel } from "@/app/models/fornecedor_model";
import { ProdutoModel } from "@/app/models/produto_model";
import OrdEstModel from "@/app/models/ord_est_model";
import OrdSerModel from "@/app/models/ord_ser_model";
import UnidadeMedidaModel from "@/app/models/unidade_med_model";

// Repositórios
import OrdemRepository from "@/app/repositories/ordem_repository";
import ProdutoRepository from "@/app/repositories/produto_repository";
import ClientRepository from "@/app/repositories/cliente_repository";
import FornecedorRepository from "@/app/repositories/fornecedor_repository";
import CidadeRepository from "@/app/repositories/cidade_repository";
import UnidadeMedidaRepository from "@/app/repositories/unidade_med_repository";

// Modais Externos e Pesquisas
import Pesquisa_cliente from "../../pesquisas/pesquisa_cliente";
import Pesquisa_produto from "../../pesquisas/pesquisa_produto";
import PesquisaFornecedor from "@/app/pesquisas/pesquisa_fornecedor";
import PesquisaOrdem from "@/app/pesquisas/pesquisa_os";
import Empreitadas from "../empreitadas/page";
import Faturamentos from "@/app/faturamentos/page";
import OperacaoOrdens from "@/app/faturamentos/implementations/operacao_ordens";
import PrintOrcamentos from "@/app/print/orcamento/page";
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

// Ícones Profissionais
import { Wrench, Package } from "lucide-react";

export default function Orcamentos() {
  const { setOrdemCtx, OrdemCtx } = useAppData();

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

  // Totais
  const totalProdutos = useMemo(() => {
    return listaProdutosInseridos.reduce((acc, curr) => acc + (curr.ORE_VALOR || 0), 0);
  }, [listaProdutosInseridos]);

  const totalServicos = useMemo(() => {
    return listaServicosInseridos.reduce((acc, curr) => acc + (curr.OS_VALOR || 0), 0);
  }, [listaServicosInseridos]);

  const totalItens = listaProdutosInseridos.length + listaServicosInseridos.length;

  // Carregamento Inicial
  useEffect(() => {
    carregaUnidadesMed();
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

  const carregaUnidadesMed = async () => {
    try {
      const repository = new UnidadeMedidaRepository();
      const unidades = await repository.getUnidadeMedidas();
      setListaUnidadesMed(unidades || []);
    } catch (error) {
      toastMixin.fire("Erro", String(error), "error");
    }
  };

  // Re-busca ordem quando faturada
  useEffect(() => {
    if (foiFaturado) {
      buscaOrdemServidor();
    }
  }, [foiFaturado]);

  // Sincroniza Cliente no Contexto
  useEffect(() => {
    if (clienteSelecionado?.CODIGO && OrdemCtx) {
      setOrdemCtx({ ...OrdemCtx, ORD_CLI: clienteSelecionado.CODIGO });
    }
  }, [clienteSelecionado, OrdemCtx]);

  // Debounce para busca de ordem quando o código é alterado
  useEffect(() => {
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

      const data = new Date(ord.ORD_DATA);
      data.setDate(data.getDate() + 1);
      setDataAbertura(data);

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

      // Busca Produtos e Serviços
      const produtos = await repository.buscaProdutosOrdem(codigoOrdem);
      setListaProdutosInseridos(produtos || []);

      const servicos = await repository.buscaServicosOrdem(codigoOrdem);
      setListaServicosInseridos(servicos || []);

      ord.itensOrdEst = produtos || [];
      ord.itensOrdSer = servicos || [];

      setOrdem(ord);
      setBuscouOrdem(true);

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
  const handleNovoOrcamento = () => {
    setCodigoOrdem(0);
    setOrdem(null);
    setBuscouOrdem(false);
    setDataAbertura(new Date());
    setStatusOrdem(Status[0].toUpperCase());
    setNfs("");
    setCodFatura(0);
    setSolicitacao("");
    setObs("");
    setObs_adm("");
    setClienteSelecionado({ CODIGO: 1, NOME: "CONSUMIDOR" });
    serParceiroSelecionado({ CODIGO: 0, NOME: "" });
    setListaServicosInseridos([]);
    setListaProdutosInseridos([]);
    setValorDesconto(0);
    setValorPorcentagemDesconto(0);
    toastMixin.fire({
      title: "Novo Orçamento",
      text: "Campos limpos para criação de uma nova ordem",
      icon: "info",
      timer: 1500,
    });
  };

  // Salvar Ordem no Banco
  const salvaOrdem = async () => {
    if (!statusOrdem) {
      toastMixin.fire("Atenção", "Informe o estado/status da ordem", "warning");
      return;
    }
    if (!solicitacao.trim()) {
      toastMixin.fire("Atenção", "A solicitação do cliente é obrigatória!", "warning");
      return;
    }
    if (listaProdutosInseridos.length === 0 && listaServicosInseridos.length === 0) {
      toastMixin.fire("Atenção", "Insira ao menos um produto ou serviço na ordem.", "warning");
      return;
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
        ORD_DATA: converterDataPontoParaTraco(FormatDate(dataAbertura)),
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
      };

      const repository = new OrdemRepository();
      await repository.insereordem(ord);

      // Salva Serviços
      if (listaServicosInseridos.length > 0) {
        for (const s of listaServicosInseridos) {
          if (s.OS_CODIGO === 0) {
            s.OS_CODIGO = await IncrementaGenerator("GEN_OS");
          }
          s.OS_ORD = codigo;
          await repository.insereServicos(codigo, s);
        }
      }

      // Salva Produtos
      if (listaProdutosInseridos.length > 0) {
        for (const p of listaProdutosInseridos) {
          if (p.ORE_CODIGO === 0) {
            p.ORE_CODIGO = await IncrementaGenerator("GEN_ORE");
          }
          p.ORE_ORD = codigo;
          await repository.insereProdutos(codigo, p);
        }
      }

      setCodigoOrdem(codigo);
      setOrdem(ord);
      setBuscouOrdem(true);

      toastMixin.fire({
        title: "Sucesso",
        text: `Ordem #${codigo} salva com sucesso!`,
        icon: "success",
        timer: 2000,
      });
    } catch (e) {
      toastMixin.fire({
        title: "Erro ao Salvar",
        text: String(e),
        icon: "error",
      });
    }
  };

  // Excluir Serviço
  const handleExcluirServico = (codigo: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Serviço",
      message: "Tem certeza de que deseja remover este serviço da ordem?",
      type: "danger",
      confirmText: "Sim, Excluir",
      onConfirm: async () => {
        try {
          const rep = new OrdemRepository();
          await rep.deleteServicoOrdemPorCodigo(codigo);
          setListaServicosInseridos((prev) => prev.filter((s) => s.OS_CODIGO !== codigo));
          toastMixin.fire({
            title: "Serviço Removido",
            icon: "success",
            timer: 1500,
          });
        } catch (err) {
          toastMixin.fire("Erro", "Não foi possível deletar o serviço: " + String(err), "error");
        } finally {
          setConfirmModal((c) => ({ ...c, isOpen: false }));
        }
      },
    });
  };

  // Excluir Produto
  const handleExcluirProduto = (codigo: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Produto",
      message: "Tem certeza de que deseja remover este produto da ordem?",
      type: "danger",
      confirmText: "Sim, Excluir",
      onConfirm: async () => {
        try {
          const rep = new ProdutoRepository();
          await rep.deleteProdutoOrdemPorCodigo(codigo);
          setListaProdutosInseridos((prev) => prev.filter((p) => p.ORE_CODIGO !== codigo));
          toastMixin.fire({
            title: "Produto Removido",
            icon: "success",
            timer: 1500,
          });
        } catch (err) {
          toastMixin.fire("Erro", "Não foi possível deletar o produto: " + String(err), "error");
        } finally {
          setConfirmModal((c) => ({ ...c, isOpen: false }));
        }
      },
    });
  };

  // Inserir Novo Serviço
  const handleAdicionarServico = async (novo: OrdSerModel) => {
    try {
      const codigo = await IncrementaGenerator("GEN_OS");
      setListaServicosInseridos((prev) => [
        ...prev,
        {
          ...novo,
          OS_CODIGO: codigo,
        },
      ]);
      toastMixin.fire({
        title: "Serviço Adicionado",
        icon: "success",
        timer: 1200,
      });
    } catch (err) {
      toastMixin.fire("Erro", String(err), "error");
    }
  };

  // Inserir Novo Produto
  const handleAdicionarProduto = async (novo: OrdEstModel) => {
    try {
      const codigo = await IncrementaGenerator("GEN_ORE");
      setListaProdutosInseridos((prev) => [
        ...prev,
        {
          ...novo,
          ORE_CODIGO: codigo,
        },
      ]);
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

  // Faturamento
  const handleFaturamento = async () => {
    await salvaOrdem();
    if (totalItens === 0) {
      toastMixin.fire("Atenção", "Insira ao menos um produto ou serviço para faturar!", "warning");
      return;
    }
    setShowFaturamento(true);
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-64px)] bg-stone-100 p-2 sm:p-4 pb-20 lg:pb-4 gap-3 font-sans">
      {/* 1. Header Superior com Status e Ações */}
      <HeaderOrcamento
        codigoOrdem={codigoOrdem}
        statusOrdem={statusOrdem}
        canSave={totalItens > 0}
        onOpenPesquisaOS={() => setShowModalPesquisaOS(true)}
        onNovoOrcamento={handleNovoOrcamento}
        onSalvar={salvaOrdem}
        onImprimir={handleImprimir}
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
            onClearParceiro={() => serParceiroSelecionado({ CODIGO: 0, NOME: "" })}
            dataAbertura={dataAbertura}
            setDataAbertura={setDataAbertura}
            statusOrdem={statusOrdem}
            setStatusOrdem={setStatusOrdem}
            listaStatus={listaStatusDisponiveis}
            nfs={nfs}
            setNfs={setNfs}
            codFatura={codFatura}
            nomeFuncionario={nomeFuncionario}
            solicitacao={solicitacao}
            setSolicitacao={setSolicitacao}
          />

          {/* Abas de Itens: Serviços vs Produtos (Sem sombras, tipografia maior) */}
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <button
                type="button"
                onClick={() => setAbaAtiva("SERVICOS")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold transition ${
                  abaAtiva === "SERVICOS"
                    ? "bg-amber-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>Serviços ({listaServicosInseridos.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setAbaAtiva("PRODUTOS")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold transition ${
                  abaAtiva === "PRODUTOS"
                    ? "bg-amber-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                <Package className="w-4 h-4" />
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
            setObs={setObs}
            obsAdm={obs_adm}
            setObsAdm={setObs_adm}
          />
        </div>

        {/* Coluna Lateral: Resumo Financeiro & Atalhos (30%) */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-3 min-w-0">
          <PainelTotais
            totalServicos={totalServicos}
            totalProdutos={totalProdutos}
            valorDesconto={valorDesconto}
            setValorDesconto={setValorDesconto}
            valorPorcentagemDesconto={valorPorcentagemDesconto}
            setValorPorcentagemDesconto={setValorPorcentagemDesconto}
            codigoOrdem={codigoOrdem}
            codFatura={codFatura}
            totalItens={totalItens}
            onFaturar={handleFaturamento}
            onAbrirEmpreitadas={() => setShowModalEmpreitadas(true)}
            onAbrirArquivos={() => setShowModalListaArquivos(true)}
            onImprimir={handleImprimir}
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
          setClienteSelecionado={setClienteSelecionado}
          showModal={showModalPesquisaCliente}
          setShowModal={setShowModalPesquisaCliente}
        />
      )}

      {/* Modal Pesquisa Fornecedor / Parceiro */}
      {showModalPesquisaFornecedor && (
        <PesquisaFornecedor
          fornecedorSelecionado={parceiroSelecionado}
          setFornecedorSelecionado={serParceiroSelecionado}
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
          setShowModal={setShowModalEmpreitadas}
          title="Empreitadas"
          showButtonExit={false}
          body={<Empreitadas ordemServico={ordem!} />}
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
    </div>
  );
}
