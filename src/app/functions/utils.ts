import Swal from "sweetalert2";
import api from "../services/api";
import { Stream } from "stream";

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
            'sql': `SELECT GEN_ID('${generator}', 1) COD FROM 'RDB$DATABASE'`
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

function DataHoje(): string {
    const dataAtual = new Date();

    const dia = String(dataAtual.getDate()).padStart(2, '0');
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0'); 
    const ano = String(dataAtual.getFullYear());

    const dataFormatada = `${dia}/${mes}/${ano}`;

    return dataFormatada;
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

export { GeraCodigo, Status, streamToBlob, FormatDate, IncrementaGenerator, getFileName, toastMixin, formatCurrency, converterDataFormato, DataHoje };