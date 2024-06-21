import { cn } from "@/lib/utils";
import { PropsWithChildren, useEffect, useRef, useState } from "react";


interface itemHeader {
    titulo: string;
    tamanho: number;
    class?: string;
}
interface itemRow {
    titulo: string;
    tamanho: number;
    class?: string;
}




export type TabelaGenericProps<T = unknown> = {
    itensHeader: Array<itemHeader>;
    itensRow?: Array<Array<itemRow>>;
    className?: string;
} & T

export default function Tabela({ itensHeader, itensRow, className }: TabelaGenericProps) {
    const refDivServicos = useRef<HTMLDivElement>(null);
    const [divWidth, setDivWidth] = useState<number>(0);

    useEffect(() => {
        setDivWidth(refDivServicos.current ? refDivServicos.current.offsetWidth : 0);
    }, [refDivServicos.current]);

    return(<></>)

   /* return (
        <div className={cn(['', className])}>
            {
                <table className="w-full flex sm:flex-col flex-nowrap sm:bg-white rounded-lg overflow-hidden sm:shadow-lg my-5">
                    <thead className="text-black w-full h-full">
                        {divWidth > 600 ? (
                            <tr className="bg-amber-400 flex flex-col flex-nowrap sm:flex-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0">
                                {itensHeader.map((item) =>
                                    <th className={'p-3 text-left sm:w-[' + item.tamanho + '%]'}>{item.titulo}</th>
                                )}
                            </tr>
                        )
                            :
                            itensRow ?
                                itensRow.map(item =>
                                    <tr key={Math.random()} className="bg-amber-400 flex flex-col flex-no wrap sm:flex-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0">
                                        {itensHeader.map((item) =>
                                            <th className="p-3 text-left h-12">{item.titulo}</th>
                                        )}
                                    </tr>
                                )

                                : <></>
                        }
                    </thead>
                    <tbody className="flex-1 sm:flex-none">
                        {itensRow ?
                            itensRow.map(itens => 
                                <tr key={Math.random()} className="flex flex-col flex-nowrap sm:flex-row sm:table-fixed mb-2 sm:mb-0">
                                    {itens.map(item =>
                                        <td className={'border-grey-light border hover:bg-gray-100 p-3 h-12 sm:h-auto sm:w-['+item.tamanho+'%]'}>{item.titulo}</td>
                                    )}
                                </tr>
                            ) 
                            : 
                            <></>}
                    </tbody>
                </table>
            }

        </div>
    );*/

}