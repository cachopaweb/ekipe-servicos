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

export function Cadastro_clientes() {
  return (
    <div className="p-4 sm:w-[800px]">
      <div className="border rounded-md p-4 space-y-4">
        <h2 className="text-xl font-bold">Cadastro de Clientes</h2>        
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <h3 className="text-lg font-semibold">Dados Gerais</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código</Label>
                <Input id="codigo" defaultValue="284" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select>
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Jurídica" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="juridica">Jurídica</SelectItem>
                    <SelectItem value="fisica">Física</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                <Input id="cpf_cnpj" defaultValue="26.408.161/0001-02" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rg">RG</Label>
                <Input id="rg" defaultValue="0000000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome_fantasia">Nome (Fantasia)</Label>
                <Input id="nome_fantasia" defaultValue="SICREDI ADM" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="razao_social">Razão Social</Label>
                <Input id="razao_social" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input id="endereco" defaultValue="WEIMAR GONCALVES TORRES" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input id="numero" defaultValue="2047" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input id="bairro" defaultValue="CENTRO" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" defaultValue="DOURADOS-MS" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input id="cep" defaultValue="79800-021" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fone">Fone</Label>
                <Input id="fone" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fidelidade">Fidelidade</Label>
                <Select>
                  <SelectTrigger id="fidelidade">
                    <SelectValue placeholder="Nenhuma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhuma">Nenhuma</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inadimplencia">Inadimplência</Label>
                <Input id="inadimplencia" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desconto">Desconto</Label>
                <Input id="desconto" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="situacao">Situação</Label>
                <Select>
                  <SelectTrigger id="situacao">
                    <SelectValue placeholder="Livre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="livre">Livre</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="bloqueado">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="limite">Limite</Label>
                <Input id="limite" defaultValue="R$ 0,00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_nasc">Data Nasc</Label>
                <Input id="data_nasc" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pai">Pai</Label>
                <Input id="pai" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mae">Mãe</Label>
                <Input id="mae" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conjuge">Cônjuge</Label>
                <Input id="conjuge" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insc_estadual">Indicador da Insc. Estadual</Label>
                <Select>
                  <SelectTrigger id="insc_estadual">
                    <SelectValue placeholder="9" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="7">7</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="9">9</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="insc_estadual_num">Inscr. Estadual</Label>
                <Input id="insc_estadual_num" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insc_municipal">Inscr. Munic.</Label>
                <Input id="insc_municipal" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="suframa">SUFRAMA</Label>
                <Input id="suframa" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select>
                  <SelectTrigger id="estado">
                    <SelectValue placeholder="ATIVO" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">ATIVO</SelectItem>
                    <SelectItem value="inativo">INATIVO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_cadastro">Data Cadastro</Label>
                <Input id="data_cadastro" type="date" defaultValue="2024-06-18" />
              </div>
            </div>
          </div>          
        </div>
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold">Dados Adicionais</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="celular">Celular</Label>
              <Input id="celular" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo_pgm">Tipo Pgm</Label>
              <Select>
                <SelectTrigger id="tipo_pgm">
                  <SelectValue placeholder="1 - Pedido" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Pedido</SelectItem>
                  <SelectItem value="2">2 - Consulta</SelectItem>
                  <SelectItem value="3">3 - Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cadastro">Cadastro</Label>
              <Input id="cadastro" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_ultima_compra">Data Última Compra</Label>
              <Input id="data_ultima_compra" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desconto_adicional">Desconto</Label>
              <Select>
                <SelectTrigger id="desconto_adicional">
                  <SelectValue placeholder="SIM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">SIM</SelectItem>
                  <SelectItem value="nao">NÃO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endereco_corresp">Endereço Corresp.</Label>
              <Input id="endereco_corresp" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bairro_corresp">Bairro Corresp.</Label>
              <Input id="bairro_corresp" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidade_corresp">Cidade Corresp.</Label>
              <Input id="cidade_corresp" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="limite_titulo">Limite Titulo</Label>
              <Input id="limite_titulo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo_entr">Tipo Entr.</Label>
              <Select>
                <SelectTrigger id="tipo_entr">
                  <SelectValue placeholder="1 - Retirado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Retirado</SelectItem>
                  <SelectItem value="2">2 - Entregue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vencimento">Vencimento</Label>
              <Input id="vencimento" type="date" defaultValue="1900-01-01" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validade_cartao">Validade do Cartão</Label>
              <Input id="validade_cartao" />
            </div>
            <div className="col-span-3 space-y-2">
              <Label htmlFor="observacao">Observação</Label>
              <Textarea id="observacao" />
            </div>
          </div>
        </div>
      </div>
      <div className="text-sm mt-4">
        <p>
        <div className="bg-white shadow-lg p-4">
            <div className="flex justify-around space-x-2">
              <Button variant="outline" className="flex-1">
                Inserir
              </Button>
              <Button variant="destructive" className="flex-1">
                Excluir
              </Button>
              <Button variant="default" className="flex-1">
                Confirmar
              </Button>
              <Button variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button variant="secondary" className="flex-1">
                Editar
              </Button>              
            </div>
          </div>
        </p>
      </div>
    </div>
  )
}
