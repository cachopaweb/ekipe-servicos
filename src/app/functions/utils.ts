import Swal from "sweetalert2";
import api from "../services/api";
import { Stream } from "stream";
import dayjs from 'dayjs'
import { ChangeEvent, FormEvent } from "react";

enum Status{ ABERTO, ENVIADO, APROVADO, FINALIZADO, CANCELADO}


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

function escapeSql(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return "";
  return String(str).replace(/'/g, "''");
}

function getFileName(path: string): string {
  if (!path) return "";
  const normalized = path.replace(/\\/g, '/');
  const segments = normalized.split('/');
  const rawName = segments[segments.length - 1] || "";
  // Se contiver prefixo gerado com timestamp_random_originalName, extrai o nome original amigável
  // Ex: "1730734800000_abc12_documento.pdf" -> "documento.pdf"
  const match = rawName.match(/^\d+_[a-z0-9]+_(.+)$/i);
  if (match && match[1]) {
    return match[1];
  }
  return rawName;
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



function converteDoBancoParaString(timestamp:string){

  const date = new Date(timestamp);
    
  // Obtém o dia, mês e ano
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Os meses são baseados em zero, por isso é necessário adicionar 1
  const year = date.getUTCFullYear();
  
  // Retorna a data formatada como "dd/mm/yyyy"
  return `${day}/${month}/${year}`;
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
    Pega uma data no formato dd.mm.yyyy e converte para yyyy-mm-dd

*/

function converterDataPontoParaTraco(data:string) {
  // Divide a string da data usando o ponto como separador
  const partes = data.split('.');

  // As partes serão: partes[0] = dia, partes[1] = mês, partes[2] = ano
  const dia = partes[0];
  const mes = partes[1];
  const ano = partes[2];

  // Retorna a data no formato "aaaa-mm-dd"
  return `${ano}-${mes}-${dia}`;
}

/*
  Retorna uma string com a data  no formato dd.mm.yyyy.
  Usado para os values dos Inputs tipo date.

*/ 
function dataFormatadaHojeDotValueInput(data: Date | string) {
    return FormatDate(data);
}


/*
  Retorna uma string com a data atual (hoje) com o formato yyyy-mm-dd.
  Usado para os values dos Inputs tipo date.

*/ 
/**
 * Converte qualquer formato de data recebido (YYYY-MM-DD, DD.MM.YYYY, DD/MM/YYYY, ISO ou Date)
 * em um objeto Date seguro no horário local, sem distorção por fuso UTC (zero timezone shift).
 */
function parseDataCalendario(data?: Date | string | null): Date {
  if (!data) return new Date();
  if (data instanceof Date) {
    return isNaN(data.getTime()) ? new Date() : data;
  }
  const str = String(data).trim();
  if (!str) return new Date();

  // Caso 1: YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss
  const matchIso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (matchIso) {
    const ano = parseInt(matchIso[1], 10);
    const mes = parseInt(matchIso[2], 10) - 1;
    const dia = parseInt(matchIso[3], 10);
    return new Date(ano, mes, dia, 0, 0, 0, 0);
  }

  // Caso 2: DD.MM.YYYY ou DD/MM/YYYY
  const matchBr = str.match(/^(\d{2})[./](\d{2})[./](\d{4})/);
  if (matchBr) {
    const dia = parseInt(matchBr[1], 10);
    const mes = parseInt(matchBr[2], 10) - 1;
    const ano = parseInt(matchBr[3], 10);
    return new Date(ano, mes, dia, 0, 0, 0, 0);
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Retorna a data no formato normalizado 'YYYY-MM-DD', ideal para <input type="date">
 * e para contratos de transporte limpos.
 */
function formatDataInput(data?: Date | string | null): string {
  if (!data) return '';
  if (data instanceof Date && isNaN(data.getTime())) return '';
  const d = parseDataCalendario(data);
  if (isNaN(d.getTime())) return '';
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function dataFormatadaValueInput(data: Date | string): string {
  return formatDataInput(data);
}

function FormatDate(data: Date | string | null | undefined): string {
  if (!data) return '';
  const d = parseDataCalendario(data);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = String(d.getFullYear());
  return `${dia}.${mes}.${ano}`;
}

/**
 * Retorna a hora estritamente no padrão 24 horas 'HH:mm:ss' (ex: "15:07:57"),
 * 100% imune a configurações regionais do navegador, OS ou formatos AM/PM.
 */
function horaFormatadaDB(data?: Date | string | null): string {
    if (typeof data === 'string' && data.trim()) {
        const str = data.trim();
        const match = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?/i);
        if (match) {
            let h = parseInt(match[1], 10);
            const m = match[2];
            const s = match[3] || '00';
            const meridiem = match[4]?.toUpperCase();
            if (meridiem === 'PM' && h < 12) h += 12;
            if (meridiem === 'AM' && h === 12) h = 0;
            return `${String(h).padStart(2, '0')}:${m}:${s}`;
        }
    }
    const d = data instanceof Date && !isNaN(data.getTime()) ? data : new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

/**
 * Retorna a data e hora completas para banco: 'DD.MM.YYYY HH:mm:ss'
 */
function dataHoraFormatadaDB(data?: Date | string | null): string {
    const d = data instanceof Date && !isNaN(data.getTime()) ? data : new Date();
    return `${FormatDate(d)} ${horaFormatadaDB(d)}`;
}

/* A Função abaixo pega um valor EM STRING "dd/mm/yyyy"
e transforma no formato 'dd.mm.yyyy' para enviar ao banco 
de dados
*/

 function formatDateDB(data: string) {
    return FormatDate(data);
}

function formatCurrency(value?:number)
{

    if((value == null) || (Number.isNaN(value)))
    {
        return '';
    }
    return (Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(value));
}

function converterDataFormato(data?: Date | string | null): string {
  if (!data) return '';
  const d = parseDataCalendario(data);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

  const mascaraMoeda = (num : Number) =>
  {
    const cents = Math.round((Number(num) || 0) * 100);
    const aux = Math.abs(cents).toString();
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
    if (!mask) return 0;
    let valorFormatado = String(mask).replace("R$", "").replaceAll(".","").trim();
    valorFormatado = valorFormatado.replace(",", ".");
    const parsed = parseFloat(valorFormatado);
    if (isNaN(parsed)) return 0;
    const retorno = parsed.toFixed(2);
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

const formatNumber = (value: string): string => {
  const floatVal = parseFloat(value.replace(/,/g, ''));
  if (isNaN(floatVal)) return value;
  const formattedValue = floatVal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return formattedValue;
};
const parseFloatFromString = (value: string): number => {
  return parseFloat(value.replace(/,/g, ''));
};

export { parseDataCalendario, formatDataInput, horaFormatadaDB, dataHoraFormatadaDB, GeraCodigo, converterDataPontoParaTraco, Status, streamToBlob, mascaraMoedaEvent, mascaraMoeda, FormatDate, IncrementaGenerator, getFileName, toastMixin, formatCurrency, 
  converterDataFormato, DataHoje, converteDoBancoParaString, maskRealToNumber, formatDateDB, dataFormatadaValueInput, dataFormatadaHojeDotValueInput, formatNumber, parseFloatFromString, escapeSql };
