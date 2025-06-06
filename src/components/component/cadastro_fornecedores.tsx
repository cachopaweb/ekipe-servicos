/**
* This code was generated by v0 by Vercel.
* @see https://v0.dev/t/pioEt7dp1Om
* Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
*/
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dispatch, SetStateAction, useEffect, useState } from "react"
import { ClienteModel, Fidelidade, Situacao, TipoPessoa } from "@/app/models/cliente_model"
import { DataHoje, FormatDate, GeraCodigo, converteDoBancoParaString, dataFormatadaHojeDotValueInput, dataFormatadaValueInput, formatDateDB, mascaraMoedaEvent, maskRealToNumber, toastMixin } from "@/app/functions/utils"
import { InputMask, useMask } from '@react-input/mask';
import dayjs from 'dayjs'
import ClientRepository from "@/app/repositories/cliente_repository"
import Modal from "./modal"
import CidadeRepository from "@/app/repositories/cidade_repository"
import CidadeModel from "@/app/models/cidade_model"
import { FornecedorModel } from "@/app/models/fornecedor_model"
import FornecedorRepository from "@/app/repositories/fornecedor_repository"

interface propsCadastroFornecedores {
  id?: number;
  setCadastraFornecedor: Dispatch<SetStateAction<boolean>>;
  setListarFornecedor: Dispatch<SetStateAction<boolean>>;
};


export function Cadastro_fornecedores({ id, setCadastraFornecedor, setListarFornecedor }: propsCadastroFornecedores) {

  const [fornecedor, setFornecedor] = useState<FornecedorModel>({ CODIGO: 0, NOME: '' , ESTADO:'ATIVO'});
  const [ehCpf, setEhCpf] = useState(true);
  const [valorLimiteAux, setvalorLimiteAux] = useState('');
  const [dataCadastro, setDataCadastro] = useState<string | null>(formatDateDB(DataHoje()));
  const [novoFornecedor, setNovoFornecedor] = useState(false);
  const inputRefCpf = useMask({ mask: '___.___.___-__', replacement: { _: /\d/ } });
  const inputRefCnpj = useMask({ mask: '__.___.___/____-__', replacement: { _: /\d/ } });
  const inputRefCep = useMask({ mask: '_____-___', replacement: { _: /\d/ } });
  const inputRefFone = useMask({ mask: '(__)____-____', replacement: { _: /\d/ } });
  const inputRefCel = useMask({ mask: '(__)_____-____', replacement: { _: /\d/ } });
  const [queryCity, setQueryCity] = useState('');
  const [cidadeFornecedor, setCidadeFornecedor] = useState<CidadeModel | null>(null);
  const [loadingCity, setLoadingCity] = useState(false);
  const [optionsCity, setOptionsCity] = useState<Array<CidadeModel>>([]);



  useEffect(() => {
    id == 0 ? inicializaNovoFornecedor() : inicializaFornecedor();
  }, [])




  useEffect(() => {
    fornecedor.TIPO == TipoPessoa.FISICA ? setEhCpf(true) : setEhCpf(false);
  }, [fornecedor])




  function escolheCidade(cidade: CidadeModel) {
    setQueryCity(cidade.DESCRICAO ? cidade.DESCRICAO : '');
    setFornecedor({ ...fornecedor, CIDADE: cidade.DESCRICAO, CODCIDADE: cidade.CID_CODIGO })
  }

  async function buscaCidades() {
    if (queryCity.length >= 3) {
      setLoadingCity(true);

      const repo = new CidadeRepository();

      const options = await repo.getBuscaCidades(queryCity);
      setOptionsCity(options);
      setLoadingCity(false);
    }

  }


  useEffect(() => {
    buscaCidades();
  }, [queryCity]);


  async function inicializaNovoFornecedor() {
    setDataCadastro(DataHoje());
    setNovoFornecedor(true);
    let cod = await GeraCodigo('FORNECEDORES', 'FOR_CODIGO');
    setFornecedor({
      ...fornecedor, CODIGO: cod, TIPO: TipoPessoa.FISICA,
      DATACADASTRO: formatDateDB(DataHoje())
    });
  }


  async function inicializaFornecedor() {
    var rep = new FornecedorRepository();
    var repCidade = new CidadeRepository();
    let forAux = await rep.getFornecedorById(id ?? 0);
    setDataCadastro(converteDoBancoParaString(forAux.DATACADASTRO ?? ''));
    var dataCadastroAux = new Date(forAux.DATACADASTRO ? forAux.DATACADASTRO : '');
    dataCadastroAux.setDate(dataCadastroAux.getDate() + 1)

    setFornecedor({ ...forAux, DATACADASTRO: dataFormatadaHojeDotValueInput(dataCadastroAux) });
    if (forAux.CODCIDADE != null) {
      let cidadeAux = await repCidade.getCidadeDescricao(forAux.CODCIDADE ?? 0);
      setQueryCity(cidadeAux.DESCRICAO ?? '');
    }

  }

  const insereLatLongEndereco = async () => {
    const repo = new CidadeRepository();
    if(fornecedor.ENDERECO && fornecedor.BAIRRO && fornecedor.CIDADE && fornecedor.END_NUMERO)
    {
      const endereco = fornecedor.ENDERECO + ', ' + fornecedor.END_NUMERO;
      const latLong = await repo.getLatitudeLongitude({ endereco: fornecedor.ENDERECO ?? '', bairro: fornecedor.BAIRRO ?? '', cidadeEstado: fornecedor.CIDADE ?? '' });
      console.log('endereco:', endereco, 'bairro:', fornecedor.BAIRRO, 'cidade:', fornecedor.CIDADE, 'latLong:', latLong);
      setFornecedor({ ...fornecedor, LATITUDE: String(latLong[0]), LONGITUDE: String(latLong[1]) });
    }

  }


  const salvaFornecedor = async () => {
    var rep = new FornecedorRepository();
    if (await rep.setFornecedor(fornecedor)) {
      toastMixin.fire('Salvo', 'Salvo com Sucesso!', 'success')
      setCadastraFornecedor(false);
      setListarFornecedor(false);
    }
    else {
      toastMixin.fire('Erro!', 'Erro ao salvar!', 'error')
    }
  }

  return (
    <div className="overflow-scroll">
      <div className="p-4 sm:w-[800px] sm:h-96">
        <div className="border rounded-md p-4 space-y-4">
          <h2 className="text-xl font-bold">Cadastro de Fornecedores</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <h3 className="text-lg font-semibold">Dados Gerais</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código</Label>
                  <Input id="codigo" disabled={true} value={fornecedor.CODIGO} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select value={fornecedor.TIPO} onValueChange={(e) => setFornecedor({ ...fornecedor, TIPO: e })} >
                    <SelectTrigger id="tipo">
                      <SelectValue placeholder="Jurídica" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TipoPessoa.FISICA}>Física</SelectItem>
                      <SelectItem value={TipoPessoa.JURIDICA}>Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                  <Input ref={ehCpf ? inputRefCpf : inputRefCnpj}
                    placeholder={ehCpf ? 'Digite seu CPF' : 'Digite seu CNPJ'}
                    value={fornecedor.CPF_CNPJ}
                    onChange={(e) => setFornecedor({ ...fornecedor, CPF_CNPJ: e.target.value.toUpperCase() })}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="data_cadastro">Data Cadastro</Label>
                    <Input disabled={true} id="data_cadastro" type="text" value={dataCadastro ?? ''} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome_fantasia">{ehCpf ? 'Nome' : 'Nome (Fantasia)'}</Label>
                  <Input id="nome_fantasia" className="uppercase" value={fornecedor.NOME} onInput={(e) => e.currentTarget.value = e.currentTarget.value.toUpperCase()}
                    onChange={(e) => setFornecedor({ ...fornecedor, NOME: e.target.value })} />
                </div>
                <>
                  {ehCpf ?
                    <></> :
                    <div className="space-y-2">
                      <Label htmlFor="razao_social">Razão Social</Label>
                      <Input id="razao_social" className="uppercase" value={fornecedor.RAZAOSOCIAL} onInput={(e) => e.currentTarget.value = e.currentTarget.value.toUpperCase()}
                        onChange={(e) => setFornecedor({ ...fornecedor, RAZAOSOCIAL: e.target.value })} />
                    </div>
                  }
                </>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input id="endereco" value={fornecedor.ENDERECO} onInput={(e) => e.currentTarget.value = e.currentTarget.value.toUpperCase()}
                    onChange={(e) => setFornecedor({ ...fornecedor, ENDERECO: e.target.value.toUpperCase() })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Número</Label>
                  <Input id="endereco" type="number" value={fornecedor.END_NUMERO} onInput={(e) => e.currentTarget.value = e.currentTarget.value}
                    onChange={(e) => setFornecedor({ ...fornecedor, END_NUMERO: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input className="uppercase" id="bairro" value={fornecedor.BAIRRO} onInput={(e) => e.currentTarget.value = e.currentTarget.value.toUpperCase()}
                    onChange={(e) => setFornecedor({ ...fornecedor, BAIRRO: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <div>
                    <Input
                      type="text"
                      value={queryCity}
                      className="uppercase"
                      onChange={e => setQueryCity(e.target.value)}
                      placeholder="Search..."
                    />
                    {loadingCity && <div>Loading...</div>}
                    <ul>
                      {
                        optionsCity.map((option, index) => (
                          <li className="cursor-pointer" onClick={e => escolheCidade(option)} key={option.CID_CODIGO}>{option.DESCRICAO}</li>
                        ))}
                    </ul>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input ref={inputRefCep}
                    value={fornecedor.CEP}
                    onChange={(e) => setFornecedor({ ...fornecedor, CEP: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fone">Fone</Label>
                  <Input ref={inputRefFone}
                    value={fornecedor.FONE}
                    onChange={(e) => setFornecedor({ ...fornecedor, FONE: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="limite">EMAIL</Label>
                  <Input id="email" value={fornecedor.EMAIL} onChange={e => setFornecedor({ ...fornecedor, EMAIL: e.target.value.toUpperCase()})} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400" type="text" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ind_insc_estadual">Indicador da Insc. Estadual</Label>
                  <Select value={fornecedor.INDICEIE} onValueChange={(e) => setFornecedor({ ...fornecedor, INDICEIE: e })}>
                    <SelectTrigger id="ind_insc_estadual">
                      <SelectValue placeholder="9" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Contribuinte do ICMS</SelectItem>
                      <SelectItem value="2">2 - Contribuinte Isento de Inscrição no Cadastro de Contribuintes do ICMS</SelectItem>
                      <SelectItem value="9">9 - Não Contribuinte, pode ou não possuir IE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insc_estadual">Inscr. Estadual</Label>
                  <Input id="insc_estadual" value={fornecedor.INSCRICAOESTADUAL}
                    onChange={(e) => setFornecedor({ ...fornecedor, INSCRICAOESTADUAL: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insc_municipal">Inscr. Munic.</Label>
                  <Input id="insc_municipal" value={fornecedor.INSCRICAOMUNICIPAL}
                    onChange={(e) => setFornecedor({ ...fornecedor, INSCRICAOMUNICIPAL: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input id="latitude" value={fornecedor.LATITUDE}
                    onChange={(e) => setFornecedor({ ...fornecedor, LATITUDE: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input id="longitude" value={fornecedor.LONGITUDE}
                    onChange={(e) => setFornecedor({ ...fornecedor, LONGITUDE: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label> Certifique que os dados estão corretos</Label>
                  <Button onClick={insereLatLongEndereco}> Inserir LatLong pelo endereço </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold">Dados Adicionais</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="celular">Celular</Label>
                <Input ref={inputRefCel}
                  value={fornecedor.CELULAR}
                  onChange={(e) => setFornecedor({ ...fornecedor, CELULAR: e.target.value })}
                />
              </div>
              <div className="col-span-3 space-y-2">
                <Label htmlFor="observacao">Observação</Label>
                <Textarea id="observacao" value={fornecedor.OBS} onChange={(e) =>
                  setFornecedor({ ...fornecedor, OBS: e.target.value })} />
              </div>
            </div>
          </div>
        </div>
        <div className="text-sm mt-4">
          <p>
            <div className="bg-white shadow-lg p-4">
              <div className="flex justify-around space-x-2">
                <Button variant="default" className="flex-1" onClick={salvaFornecedor} >
                  {novoFornecedor ? 'Cadastrar' : 'Alterar'}
                </Button>
              </div>
            </div>
          </p>
        </div>
      </div>

    </div>
  )
}
