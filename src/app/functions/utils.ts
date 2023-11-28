import Swal from "sweetalert2";
import api from "../services/api";

enum Status{ABERTO, ENVIADO, APROVADO, FINALIZADO, CANCELADO}


export type keyBoardInputEvent = React.KeyboardEvent<HTMLInputElement>;
export type keyBoardSelectEvent = React.KeyboardEvent<HTMLSelectElement>;


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

function FormatDate(data: Date | string): string{
    if(data instanceof Date){
        let dataFmt = data.toLocaleDateString().split('/');
        return dataFmt[0]+'.'+dataFmt[1]+'.'+dataFmt[2];
    }else{
        let dataFmt = data.split('/');
        return dataFmt[0]+'.'+dataFmt[1]+'.'+dataFmt[2];
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

export { GeraCodigo, Status, FormatDate, IncrementaGenerator, toastMixin }