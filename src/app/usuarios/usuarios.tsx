'use client'
import { useEffect, useRef, useState } from "react";
import UsuarioRepository from "../repositories/usuario_repository";
import { UsuarioModel } from "../models/usuario_model";
import { UserRoundX, UserCheck } from 'lucide-react';

export default function Usuarios() {
    const [usuarios, setUsuarios] = useState<UsuarioModel[]>([]);
    const [divWidth, setDivWidth] = useState<number>(0);
    const refDiv = useRef<HTMLDivElement>(null);
    useEffect(() => {
        carregaUsuarios();

    }, [])

    useEffect(() => {
        setDivWidth(refDiv.current ? refDiv.current.offsetWidth : 0);
    }, [refDiv.current]);

    async function carregaUsuarios() {
        const repository = new UsuarioRepository();
        const usuarios: UsuarioModel[] = await repository.getAllUsersLessSuport();
        setUsuarios(usuarios);
    }

    function mudaEstadoUsuario(item: UsuarioModel) {
        const repository = new UsuarioRepository();
        repository.mudaEstadoUsuario(item);
        carregaUsuarios();
    }

    function desabilitarUsuario(item: UsuarioModel) {
        alert('Desabilitar usuário ' + item.FUN_NOME);
        mudaEstadoUsuario(item);

    }


    function habilitaUsuario(item: UsuarioModel) {
        alert('Habilitar usuário ' + item.FUN_NOME);
        mudaEstadoUsuario(item);
    }


    return (
        <div className="overflow-x-hidden h-[300px]" ref={refDiv}>
            <table className="w-full flex sm:flex-col flex-nowrap sm:bg-white rounded-lg overflow-hidden sm:shadow-lg my-5">
                <thead className="text-white w-full">
                    {divWidth > 100 ?


                        <tr className="bg-amber-400 flex flex-col sm:flex-row flex-nowrap rounded-l-lg w-full sm:rounded-none mb-2 sm:mb-0">
                            <th className="p-3 text-sm text-center sm:w-[50%]">Nome</th>
                            <th className="p-3 text-sm text-center sm:w-[50%]">Ação</th>
                        </tr> : usuarios.map((usuario) =>
                        (<tr key={usuario.USU_CODIGO} className="bg-amber-400 flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0">
                            <th className="p-3 text-left">Nome</th>
                            <th className="p-3 text-left">Ação</th>

                        </tr>))
                    }
                </thead>
                <tbody className="flex-1 sm:flex-none text-center">
                    {usuarios.map((usuario) => (
                        <tr key={usuario.USU_CODIGO} className="flex flex-col flex-nowrap sm:flex-row sm:table-fixed mb-2 sm:mb-0">
                            <td className="text-xs border-grey-light border hover:bg-gray-100 p-3 sm:w-[50%]" >{usuario.FUN_NOME}</td>
                            <td className="sm:px-4 sm:py-2 text-left border-grey-light border sm:w-[50%]">
                                <div className="items-center flex justify-center">
                                    {usuario.FUN_ESTADO === 'ATIVO' ?
                                        <span title="Desabilitar usuário">
                                            <UserRoundX onClick={() => desabilitarUsuario(usuario)} className="text-red-600 text-xl mr-1 hover:cursor-pointer" />
                                        </span>
                                        :
                                        <span title="Habilitar usuário">
                                            <UserCheck onClick={() => habilitaUsuario(usuario)} className="text-green-600 text-xl mr-1 hover:cursor-pointer" />
                                        </span>
                                    }

                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}