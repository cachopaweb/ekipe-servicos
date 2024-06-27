import Swal from "sweetalert2";
import api from "../services/api";
import { Stream } from "stream";
import dayjs from 'dayjs'
import { ChangeEvent, FormEvent } from "react";

enum Status{ABERTO, ENVIADO, APROVADO, FINALIZADO, CANCELADO}


export type keyBoardInputEvent = React.KeyboardEvent<HTMLInputElement>;
export type keyBoardSelectEvent = React.KeyboardEvent<HTMLSelectElement>;
export type keyBoardDivEvent = React.KeyboardEventHandler<HTMLDivElement>;



async function GeraCodigo(tabela: string, campo: string): Promise<number>{
    try
    {
        const response = await api.post('/dataset', {
            'sql': `SELECT MAX(${campo}) FROM ${tabela}`
        })
        if (response.status === 200){
            return (response.data['MAX'] as number) + 1;
        }else{
            return 1;
        }
    }catch(e){
        throw new Error(`Erro ao gerar codigo tabela: ${tabela}, campo: ${campo}`);
    }
}

// Função para converter um Readable stream para Blob
function streamToBlob(stream:Stream) {
    return new Promise((resolve, reject) => {
      const chunks:any = [];
  
      // Evento de dados do stream
      stream.on('data', (chunk) => {
        chunks.push(chunk);
      });
  
      // Evento de conclusão do stream
      stream.on('end', () => {
        // Cria um Blob a partir dos chunks coletados
        const blob = new Blob(chunks, { type: 'application/octet-stream' });
        resolve(blob);
      });
  
      // Evento de erro do stream
      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

function getFileName(path:string): string{

    const partesDoCaminho = path.split('/');
    return partesDoCaminho[partesDoCaminho.length - 1];


}

async function IncrementaGenerator(generator: string): Promise<number>{
  try
  {
      const response = await api.post('/dataset', {
          'sql': `SELECT GEN_ID(${generator}, 1) COD FROM RDB$DATABASE`
      })
      if (response.status === 200){
          return (response.data['COD'] as number) + 1;
      }else{
          return 1;
      }
  }catch(e){
      throw new Error(`Erro ao gerar generator tabela, Generator: ${generator}`)
  }
}


/*
  Retorna uma string com a data atual (hoje) com o formato dd/mm/yyyy

*/ 
function DataHoje(): string {
    const dataAtual = new Date();

    const dia = String(dataAtual.getDate()).padStart(2, '0');
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0'); 
    const ano = String(dataAtual.getFullYear());

    const dataFormatada = `${dia}/${mes}/${ano}`;

    return dataFormatada;
}

/*
  Retorna uma string com a data atual (hoje) com o formato yyyy-mm-dd.
  Usado para os values dos Inputs tipo date.

*/ 
function dataFormatadaValueInput(data:Date)
{

  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0'); 
  const ano = String(data.getFullYear());

   return `${ano}-${mes}-${dia}`;

}

function FormatDate(data: Date | string): string{
    if(data instanceof Date){
        let dataFmt = data.toLocaleDateString().split('/');
        return dataFmt[0]+'.'+dataFmt[1]+'.'+dataFmt[2];
    }else{
        let dataFmt = data.split('/');
        return dataFmt[0]+'.'+dataFmt[1]+'.'+dataFmt[2];
    }
}

/* A Função abaixo pega um valor EM STRING do tipo date 
e transforma no formato 'dd.mm.yyyy' para enviar ao banco 
de dados
*/

 function formatDateDB(data:string)
 {
  var aux = dayjs(data);
  let mesAux = aux.month() + 1;
  let dia = aux.date().toString().length > 1 ? aux.date().toString() : '0'+aux.date().toString();
  let mes = mesAux.toString().length > 1 ? mesAux.toString() : '0'+mesAux.toString();
  let dataString = dia+'.'+mes+'.'+aux.year();

  return dataString;

 }

function formatCurrency(value?:number)
{

    if((value == null) || (Number.isNaN(value)))
    {
        return '';
    }
    return (Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(value));
}

function converterDataFormato(data: string|null): string {
    if(data == null)
    {
        return '';
    }
    else
    {
    // Divide a data em ano, mês e dia
    const [ano, mes, dia] = data.split('-');
  
    // Formata a nova data no formato DD/MM/AAAA
    const novaDataFormatada = `${dia}/${mes}/${ano}`;
  
    return novaDataFormatada;
    }
  }

  const mascaraMoeda = (num : Number) =>
  {
    num = Number(num) * 100;
    const aux = num.toString();
    const onlyDigits = aux
    .split("")
    .filter((s: string) => /\d/.test(s))
    .join("")
    .padStart(3, "0")
  const digitsFloat = onlyDigits.slice(0, -2) + "." + onlyDigits.slice(-2)
  return maskCurrency(digitsFloat)

  }

  const mascaraMoedaEvent = (event:ChangeEvent<HTMLInputElement>) => {
    const onlyDigits = event.target.value
      .split("")
      .filter((s: string) => /\d/.test(s))
      .join("")
      .padStart(3, "0")
    const digitsFloat = onlyDigits.slice(0, -2) + "." + onlyDigits.slice(-2)
    event.target.value = maskCurrency(digitsFloat)
  }
  
  const maskCurrency = (valor:any, locale = 'pt-BR', currency = 'BRL') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(valor)
  }
  
  function maskRealToNumber (mask:string)
  {
    let valorFormatado = mask.replace("R$", "").replaceAll(".","");
    valorFormatado = valorFormatado.replace(",", ".");
    const retorno = parseFloat(valorFormatado).toFixed(2);
    return parseFloat(retorno);
  }

var toastMixin = Swal.mixin({
    toast: true,
    icon: 'success',
    title: 'General Title',
    position: 'top-right',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

export { GeraCodigo, Status, streamToBlob, mascaraMoedaEvent, mascaraMoeda, FormatDate, IncrementaGenerator, getFileName, toastMixin, formatCurrency, 
  converterDataFormato, DataHoje, maskRealToNumber, formatDateDB, dataFormatadaValueInput };
