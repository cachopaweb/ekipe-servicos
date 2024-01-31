"use client"

type FormEvent = React.FormEvent<HTMLFormElement>

import { useEffect, useState } from "react"
import Image from 'next/image'
import { useRouter } from "next/navigation";

import { UsuarioModel } from "./models/usuario_model";
import logo from '../../assets/logo.png'
import UsuarioRepository from "./repositories/usuario_repository";
import { toastMixin } from "./functions/utils";
import { useAppData } from "./contexts/app_context";

export default function Login() {
  const [user, setUser] = useState('');
  const [passw, setPassw] = useState('');
  const [users, setUsers] = useState<UsuarioModel[]>([]);
  const router = useRouter();
  const {setUsuarioLogado} = useAppData();
  useEffect(() => {
    getUsers();
  }, [])

  const getUsers = async () => {
    const repository = new UsuarioRepository();
    try {
      const usuarios = await repository.getUsers();
      if (usuarios) {
        setUsers(usuarios);
        setUser(usuarios[0].USU_LOGIN)
      }
    } catch (error) {
      toastMixin.fire('Falha ao buscar usuários', String(error), 'error')
    }
  }

  const fazerLogin = async (event: FormEvent) => {
    event.preventDefault();
    const repository = new UsuarioRepository();
    try {
      if (user === '') {
        toastMixin.fire('Atenção', 'Usuário não escolhido', 'info')
        return;
      }
      const sucess: boolean = await repository.login(user, passw);
      if (sucess) {
        toastMixin.fire('Aguarde...', 'Logando no servidor', 'info')
        users.forEach(usuario =>{
          if(usuario.USU_LOGIN == user)
          {
            localStorage.setItem('usuario_logado', JSON.stringify(usuario));
            setUsuarioLogado(usuario);
          }
        })
        router.push('/home')
      } else {
        toastMixin.fire('Falha ao logar', 'usuário ou senha incorretos', 'error')
      }
    }
    catch (error) {
      toastMixin.fire('Falha ao logar', String(error), 'error')
    }
  }

  return (
    <main>
      <div className="flex h-screen w-full items-center justify-center bg-white bg-cover bg-no-repeat">
        <div className="rounded-xl bg-gradient-to-r from-amber-200 to-amber-500 bg-opacity-50 px-16 py-10 m-4 shadow-lg backdrop-blur-md max-sm:px-8">
          <div className="text-white">
            <div className="mb-8 flex flex-col items-center">
              <Image src={logo} height={50} alt="Logo" />
            </div>
            <form onSubmit={(e) => fazerLogin(e)}>
              <div className="mb-4 text-lg">
                <select className="rounded-3xl w-full border-2 border-black-400 bg-black-50 bg-opacity-50 px-6 py-2  text-center 
               placeholder-black-200 shadow-lg outline-none backdrop-blur-md text-black" value={user} onChange={(e) => setUser(e.target.value)} name="login">
                  {users.map((u) => <option key={u.USU_CODIGO} value={u.USU_LOGIN} className="w-96">{u.USU_LOGIN}</option>)}
                </select>
              </div>

              <div className="mb-4 text-lg">
                <input className="rounded-3xl border-2 border-black-400 bg-black-50 bg-opacity-50 px-6 py-2 text-center 
               placeholder-black-200 shadow-lg outline-none backdrop-blur-md text-black w-full"
                  onChange={(e) => setPassw(e.target.value)}
                  type="Password" name="name" placeholder="*********" />
              </div>
              <div className="mt-8 flex justify-center text-lg text-black">
                <button type="submit" className="rounded-3xl bg-amber-300 bg-opacity-50 px-10 py-2 text-indigo-800 shadow-xl backdrop-blur-md transition-colors duration-300 hover:bg-amber-500">Login</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
