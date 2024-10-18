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

interface propsCadastroClientes{
  id?:number;
  setCadastrarCliente: Dispatch<SetStateAction<boolean>>;
  setListarCliente: Dispatch<SetStateAction<boolean>>;
};


export function Cadastro_clientes({id, setCadastrarCliente, setListarCliente}:propsCadastroClientes) {

  const [cliente, setCliente] = useState<ClienteModel>({CODIGO:0, NOME:'', ESTADO:'ATIVO'});
  const [ehCpf, setEhCpf] = useState(true);
  const [valorLimiteAux, setvalorLimiteAux] = useState('');
  const [dataNascimento, setDataNascimento ] = useState<string | null>(null);
  const [dataCadastro, setDataCadastro] = useState<string | null>(formatDateDB(DataHoje()));
  const [novoCliente, setNovoCliente] = useState(false);
  const inputRefCpf = useMask({ mask: '___.___.___-__', replacement: { _: /\d/ } });
  const inputRefCnpj = useMask({ mask: '__.___.___/____-__', replacement: { _: /\d/ } });
  const inputRefCep = useMask({ mask: '_____-___', replacement: { _: /\d/ } });
  const inputRefFone = useMask({ mask: '(__)_____-____', replacement: { _: /\d/ } });
  const inputRefCel = useMask({ mask: '(__)_____-____', replacement: { _: /\d/ } });
  const [queryCity, setQueryCity] = useState('');
  const [cidadeCliente, setCidadeCliente] = useState<CidadeModel | null>(null);
  const [loadingCity, setLoadingCity] = useState(false);
  const [optionsCity, setOptionsCity] = useState<Array<CidadeModel>>([]);



  useEffect(()=>{
    id==0 ?  inicializaNovoCliente(): inicializaCliente();
  }, [])

    
  

  useEffect(()=>{
    cliente.TIPO == TipoPessoa.FISICA ? setEhCpf(true) : setEhCpf(false);
  }, [cliente])



  useEffect(() => {
    const valor = maskRealToNumber(valorLimiteAux);
    setCliente({ ...cliente, LIMITE: valor ? valor : 0 })
}, [valorLimiteAux]);


function escolheCidade(cidade:CidadeModel){
  setQueryCity(cidade.DESCRICAO? cidade.DESCRICAO:'');
  setCliente({...cliente, CIDADE:cidade.DESCRICAO, CODCIDADE:cidade.CID_CODIGO})

  
}

  async function buscaCidades()
  {
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


  async function inicializaNovoCliente(){
    setDataCadastro(DataHoje());
    setNovoCliente(true);
    let cod = await GeraCodigo('CLIENTES', 'CLI_CODIGO');
    setCliente({...cliente, CODIGO:cod, TIPO: TipoPessoa.FISICA,
       FIDELIDADE:Fidelidade.NENHUMA, DATACADASTRO:formatDateDB(DataHoje())});
  }


  async function inicializaCliente(){
    var rep = new ClientRepository();
    var repCidade = new CidadeRepository();
    let cliAux = await rep.getClienteById(id??0);
    setDataCadastro(converteDoBancoParaString(cliAux.DATACADASTRO??''));
    var dataCadastroAux = new Date(cliAux.DATACADASTRO?cliAux.DATACADASTRO:'');
    dataCadastroAux.setDate(dataCadastroAux.getDate()+1)

    setCliente({...cliAux, DATACADASTRO: dataFormatadaHojeDotValueInput(dataCadastroAux)});
    console.log(cliAux);
    if(cliAux.CODCIDADE != null)
    {
      let cidadeAux = await repCidade.getCidadeDescricao(cliAux.CODCIDADE??0);
      setQueryCity(cidadeAux.DESCRICAO??'');
    }

    
  }

  const salvaCliente = async () =>{
    var rep = new ClientRepository();
    if(await rep.setCliente(cliente))
      {
        toastMixin.fire('Salvo', 'Salvo com Sucesso!', 'success')
        setCadastrarCliente(false);
        setListarCliente(false);
      }
      else
      {
        toastMixin.fire('Erro!', 'Erro ao salvar!', 'error')
      }
  }

  return (
    <div className="overflow-scroll">
    <div className="p-4 sm:w-[800px] sm:h-96">
      <div className="border rounded-md p-4 space-y-4">
        <h2 className="text-xl font-bold">Cadastro de Clientes</h2>        
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <h3 className="text-lg font-semibold">Dados Gerais</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código</Label>
                <Input id="codigo" disabled={true} value={cliente.CODIGO} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={cliente.TIPO}  onValueChange={(e) => setCliente({...cliente, TIPO:e})} >
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
                value={cliente.CPF_CNPJ}
                onChange={(e) => setCliente({...cliente, CPF_CNPJ:e.target.value.toUpperCase()})}
                />
                
              </div>
              <div className="space-y-2">
                <Label htmlFor="rg">RG</Label>
                <Input id="rg" value={cliente.RG} onChange={(e) => setCliente({...cliente, RG:e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome_fantasia">{ehCpf ? 'Nome' : 'Nome (Fantasia)' }</Label>
                <Input id="nome_fantasia" className="uppercase" value={cliente.NOME} onInput={(e)=> e.currentTarget.value = e.currentTarget.value.toUpperCase()} 
                 onChange={(e) => setCliente({...cliente, NOME:e.target.value})} />
              </div>
              <>
              {ehCpf ? 
              <></> :
              <div className="space-y-2">
              <Label htmlFor="razao_social">Razão Social</Label>
              <Input id="razao_social" className="uppercase" value={cliente.RAZAOSOCIAL} onInput={(e)=> e.currentTarget.value = e.currentTarget.value.toUpperCase()} 
              onChange={(e) => setCliente({...cliente, RAZAOSOCIAL:e.target.value})} />
            </div>
              }
              </>
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input id="endereco" value={cliente.ENDERECO} onInput={(e)=> e.currentTarget.value = e.currentTarget.value.toUpperCase()} 
                 onChange={(e) => setCliente({...cliente, ENDERECO:e.target.value.toUpperCase()})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input id="numero" value={cliente.NUMERO} type="number"
                 onChange={(e) => setCliente({...cliente, NUMERO:e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input className="uppercase" id="bairro" value={cliente.BAIRRO} onInput={(e)=> e.currentTarget.value = e.currentTarget.value.toUpperCase()} 
                 onChange={(e) => setCliente({...cliente, BAIRRO:e.target.value})} />
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
                value={cliente.CEP}
                onChange={(e) => setCliente({...cliente, CEP:e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fone">Fone</Label>
                <Input ref={inputRefFone}
                value={cliente.FONE}
                onChange={(e) => setCliente({...cliente, FONE:e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fidelidade">Fidelidade</Label>
                <Select value={cliente.FIDELIDADE}  onValueChange={(e) => setCliente({...cliente, FIDELIDADE:e as Fidelidade})}>
                  <SelectTrigger id="fidelidade">
                    <SelectValue placeholder={cliente.FIDELIDADE} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Fidelidade.NENHUMA}>Nenhuma</SelectItem>
                    <SelectItem value={Fidelidade.RUIM}>Ruim</SelectItem>
                    <SelectItem value={Fidelidade.REGULAR}>Regular</SelectItem>
                    <SelectItem value={Fidelidade.BOM}>Bom</SelectItem>
                    <SelectItem value={Fidelidade.OTIMO}>Otimo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inadimplencia">Inadimplência</Label>
                <Input id="inadiplencia" value={cliente.INADIPLENCIA} type="number"
                 onChange={(e) => setCliente({...cliente, INADIPLENCIA:parseInt(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desconto">Desconto</Label>
                <Input id="desconto" value={cliente.DESCONTO} type="number"
                 onChange={(e) => setCliente({...cliente, DESCONTO:parseInt(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="situacao">Situação</Label>
                <Select value={cliente.SITUACAO}  onValueChange={(e) => setCliente({...cliente, SITUACAO:e as Situacao})}>
                  <SelectTrigger id="situacao">
                    <SelectValue placeholder="Livre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Situacao.LIVRE}>Livre</SelectItem>
                    <SelectItem value={Situacao.OBSERVACAO}>Observação</SelectItem>
                    <SelectItem value={Situacao.BLOQUEADO}>Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="limite">Limite</Label>
                <Input id="edtValorProduto" value={valorLimiteAux?? ''} onChange={event => { mascaraMoedaEvent(event), setvalorLimiteAux(event.target.value) }} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400" type="text" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pai">Pai</Label>
                <Input id="pai" className="uppercase" value={cliente.PAI} onInput={(e)=> e.currentTarget.value = e.currentTarget.value.toUpperCase()} 
                 onChange={(e) => setCliente({...cliente, PAI:e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mae">Mãe</Label>
                <Input id="mae" className="uppercase" onInput={(e)=> e.currentTarget.value = e.currentTarget.value.toUpperCase()}  value={cliente.MAE}
                 onChange={(e) => setCliente({...cliente, MAE:e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conjuge">Cônjuge</Label>
                <Input id="conjuge" className="uppercase" onInput={(e)=> e.currentTarget.value = e.currentTarget.value.toUpperCase()} value={cliente.CONJUGE}
                 onChange={(e) => setCliente({...cliente, CONJUGE:e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ind_insc_estadual">Indicador da Insc. Estadual</Label>
                <Select value={cliente.INDICEIE} onValueChange={(e) => setCliente({...cliente, INDICEIE:e})}>
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
                <Input id="insc_estadual" value={cliente.INSCRICAOESTADUAL}
                 onChange={(e) => setCliente({...cliente, INSCRICAOESTADUAL:e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insc_municipal">Inscr. Munic.</Label>
                <Input id="insc_municipal" value={cliente.INSCRICAOMUNICIPAL}
                 onChange={(e) => setCliente({...cliente, INSCRICAOMUNICIPAL:e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="suframa">SUFRAMA</Label>
                <Input id="suframa" value={cliente.SUFRAMA}
                 onChange={(e) => setCliente({...cliente, SUFRAMA:e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select value={cliente.ESTADO}  onValueChange={(e) => setCliente({...cliente, ESTADO:e})}>
                  <SelectTrigger id="estado">
                    <SelectValue placeholder="ATIVO" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO">ATIVO</SelectItem>
                    <SelectItem value="INATIVO">INATIVO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_cadastro">Data Cadastro</Label>
                <Input disabled={true} id="data_cadastro" type="text" value={dataCadastro??''}/>
              </div>
            </div>
          </div>          
        </div>
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold">Dados Adicionais</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" value={cliente.EMAIL} onChange={(e) => setCliente({...cliente, EMAIL:e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="celular">Celular</Label>
              <Input ref={inputRefCel}
                value={cliente.CELULAR}
                onChange={(e) => setCliente({...cliente, CELULAR:e.target.value})}
                />
            </div>
            <div className="col-span-3 space-y-2">
              <Label htmlFor="observacao">Observação</Label>
              <Textarea id="observacao" value={cliente.OBS} onChange={(e) => 
              setCliente({...cliente, OBS: e.target.value})} />
            </div>
          </div>
        </div>
      </div>
      <div className="text-sm mt-4">
        <p>
        <div className="bg-white shadow-lg p-4">
            <div className="flex justify-around space-x-2">
            <Button variant="default" className="flex-1" onClick={salvaCliente} >
                {novoCliente?'Cadastrar':'Alterar'}
              </Button>
            </div>
          </div>
        </p>
      </div>
    </div>

    </div>
  )
}
