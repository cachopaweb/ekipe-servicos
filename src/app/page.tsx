"use client"

type FormEvent = React.FormEvent<HTMLFormElement>

import { useEffect, useState } from "react"
import Image from 'next/image'
import { useRouter } from "next/navigation";
import logo from '../../assets/logo.png'
import UsuarioRepository from "./repositories/usuario_repository";
import { toastMixin } from "./functions/utils";
import { useAppData } from "./contexts/app_context";

export default function Login() {
  const [user, setUser] = useState('');
  const [passw, setPassw] = useState('');
  const [rememberUser, setRememberUser] = useState(false);
  const router = useRouter();
  const { setUsuarioLogado } = useAppData();
  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('usuario_salvo');
    if (usuarioSalvo) {
      setUser(usuarioSalvo);
      setRememberUser(true);
    }
  }, [])
  // getUsers nao era mais necessario
  
  const fazerLogin = async (event: FormEvent) => {
    event.preventDefault();
    const repository = new UsuarioRepository();
    try {
      if (user === '') {
        toastMixin.fire('Atenção', 'Usuário não informado', 'info')
        return;
      }
      const success = await repository.login(user, passw);
      if (success) {
        toastMixin.fire('Aguarde...', 'Logando no servidor', 'info')
        const users = await repository.getUsers(); // busca os usuários para manter em cache
        const usuarioEncontrado = users.find(u => u.USU_LOGIN === user);
      if (usuarioEncontrado) { 
        localStorage.setItem('usuario_logado', JSON.stringify(usuarioEncontrado));
        setUsuarioLogado(usuarioEncontrado);
      }

        if (rememberUser) { // salva o usuário no localStorage se a opção "Lembrar usuário" estiver marcada
          localStorage.setItem('usuario_salvo', user);
        } else {
          localStorage.removeItem('usuario_salvo');
        }
          router.push('/home');
              
      }else {
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
                <input className="rounded-3xl w-full border-2 border-black-400 bg-black-50 bg-opacity-50 px-6 py-2  text-center 
                  placeholder-black-200 shadow-lg outline-none backdrop-blur-md text-black" value={user} onChange={(e) => setUser(e.target.value)} type="text" name="login"
                  placeholder="Usuário">
                </input>
              </div>
              <div className="mb-4 flex items-center" >
                <input type="checkbox" checked={rememberUser} onChange={(e) => setRememberUser(e.target.checked)} className="mr-2" id="rememberUser" />
                <label htmlFor="rememberUser" className="text-black">Lembrar usuário</label>
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
