import { getFileName, toastMixin } from "@/app/functions/utils";
import ArquivoModel from "@/app/models/arquivo_model";
import ArquivoRepository from "@/app/repositories/arquivo_repository";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Modal from "./modal";
import Link from "next/link";
import axios from "axios";
import {app} from "../../app/services/firebase";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";


interface propsFiles{
    codigoOrdem:number;
    setShowModal: Dispatch<SetStateAction<boolean>>
    showmodal:boolean;
  };
  
  

export const ModalListarArquivos = ({codigoOrdem, setShowModal, showmodal}:propsFiles) => {

    const [isDownloadFile, setIsDownloadFile] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<Array<FileList>>([]);
    const [nomesArquivos, setNomesArquivos] = useState<string>('');
    const [temArquivo, setTemArquivo] = useState(false);
    const firebaseApp = app;
    const storage = getStorage(firebaseApp, "gs://jtibearl.appspot.com");




    useEffect(() => {
        haveFile();
        setSelectedFiles([]);
    }, [])

    useEffect(() => {
        let nomes: string = '';
        selectedFiles.forEach(function(file) {
            const fileAux = Array.from(file);
            fileAux.forEach(function(f) {
                nomes = nomes + ' \n ' +  f.name;
            });
           
        } )
        setNomesArquivos(nomes);

    }, [selectedFiles])

    async function haveFile(){
        const repArq = await ArquivoRepository.getArquivoRepository(codigoOrdem);
        var json = JSON.stringify(repArq);
        const flag = json == '[{}]';
        setTemArquivo(flag);
        
    }

    const ModalMostrarArquivos = () => {
        const [listaArquivos, setListaArquivos] = useState<ArquivoModel[]>([]);
        const [carregando, setCarregando] = useState(true);

        const buscaArquivos = async () => {
            const lista = await ArquivoRepository.getArquivoRepository(codigoOrdem);
            setListaArquivos(lista);
        }

        useEffect(() => {
            setCarregando(true);
            buscaArquivos();
            setCarregando(false);

        }, [])

        async function downloadFile(path: string) {
            const starsRef = ref(storage, getFileName(path));

            getDownloadURL(starsRef).then((url) => {
                const link = document.createElement('a');
                link.href = url;
                link.download = getFileName(path);
    
                // Append to html link element page
                document.body.appendChild(link);
    
                // Start download
                link.click();
                
              })
              .catch((error) => {
                console.log(error);
                // A full list of error codes is available at
                // https://firebase.google.com/docs/storage/web/handle-errors
                switch (error.code) {
                  case 'storage/object-not-found':
                    toastMixin.fire('Arquivo não encontrado', 'Atenção', 'warning');
                    // File doesn't exist
                    break;
                  case 'storage/unauthorized':
                    toastMixin.fire('O Usuario não tem permissão', 'Atenção', 'warning');
                    break;
                  case 'storage/canceled':
                    toastMixin.fire('O usuario cancelou o upload', 'Atenção', 'warning');
                    break;
                  case 'storage/unknown':
                    toastMixin.fire('Storage desconhecido', 'Atenção', 'warning');
                    break;
                }
              });
            /*setIsDownloadFile(true);
            const response = await fetch('/api/downloads', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'from': path,
                },
            });
            const blob = await response.blob();
            // Create blob link to download
            const url = window.URL.createObjectURL(
                blob as Blob
            );
            const link = document.createElement('a');
            link.href = url;
            link.download = getFileName(path);

            // Append to html link element page
            document.body.appendChild(link);

            // Start download
            link.click();*/
            setIsDownloadFile(false);
        }


        return (
            carregando ?
                <>
                    Carregando...
                </>
                :
                <Modal showModal={showMostrarArquivos} setShowModal={setShowMostrarArquivos}
                    title="Arquivos Enviados"
                    showButtonExit={false}
                    body={
                        <div>
                            <table className="w-full flex sm:flex-col flex-nowrap sm:bg-white rounded-lg overflow-hidden sm:shadow-lg my-5">
                                <thead className="text-white">
                                    {
                                        <tr className="bg-amber-400 flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0">
                                            <th className="p-3 text-left">Cód.</th>
                                            <th className="p-3 text-left w-full">Nome</th>
                                            <th className="p-3 text-left">Observação</th>
                                            <th className="p-3 text-left">Download</th>
                                        </tr>
                                    }
                                </thead>
                                <tbody className="flex-1 sm:flex-none">
                                    {listaArquivos.length > 0 ? listaArquivos.map((item) =>
                                        <tr key={item.AO_CODIGO} className="flex flex-col flex-nowrap sm:table-row mb-2 sm:mb-0">
                                            <td className="border-grey-light border hover:bg-gray-100 p-3">{item.AO_CODIGO}</td>
                                            <td className="border-grey-light border hover:bg-gray-100 p-3 sm:w-full">{getFileName(item.AO_CAMINHO)}</td>
                                            <td className="border-grey-light border hover:bg-gray-100 p-3">{item.AO_OBS}</td>
                                            <td className="border-grey-light border hover:bg-gray-100 p-1 sm:p-3 text-red-400 hover:text-red-600 hover:font-medium cursor-pointer">
                                                <button
                                                    className="p-1 text-sm px-2 mx-1 bg-black text-white rounded-md hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none"
                                                    type="button"
                                                    onClick={() => downloadFile(item.AO_CAMINHO)}
                                                >
                                                    <i className="fas fa-download text-white "></i>
                                                    <Link
                                                        href={''}
                                                        download="Example-PDF-document"
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                :
                                <p>Não tem arquivo para ser mostrado</p>
                                }
                                </tbody>
                            </table>
                        </div>
                    }
                />
        );

    }
    const [showMostrarArquivos, setShowMostrarArquivos] = useState(false);
    const [observacaoArquivos, setObservacaoArquivos] = useState('');

    const handleUpload = async () => {
        const repository = new ArquivoRepository();
        const apiUpload = axios.create({ baseURL: '/api' });
        var name: string = '';
        if (!selectedFiles) {
            toastMixin.fire('Nenhum arquivo selecionado!', 'Atenção', 'warning');
            return;
        }
        const files = selectedFiles;
        const formData = new FormData();

        for (const file of Array.from(files)) {
            var fileAux = Array.from(file)
            fileAux.forEach(function(f){
                var fire = ref(storage, f.name);
                uploadBytes(fire, f);
                name = f.name;
            })
        }
        const arq: ArquivoModel = {
            AO_CAMINHO: name,
            AO_CODIGO: 0,
            AO_OBS: observacaoArquivos,
            AO_OS: codigoOrdem,
        };
        console.log('aqui');
        const response = await ArquivoRepository.setArquivoRepository(arq);
        if (response) {
            setShowModal(false);
            toastMixin.fire('Enviado com Sucesso', 'Sucesso', 'success')
            
        }
    }

    const handleFileChange = (event: any) => {
        let files = selectedFiles;
        files.concat(Array.from(event.target.files));
        setSelectedFiles([...selectedFiles, event.target.files]);
    };
    return (

        <div>
            <Modal showModal={showmodal} setShowModal={setShowModal}
                title="Listar Arquivos"
                showButtonExit={false}
                body={
                    isDownloadFile ?
                        <div role="status" className="place-items-center w-full">
                            <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                            </svg>
                            <span className="sr-only">Loading...</span>
                        </div>
                        :
                        <div>
                            <div className="flex flex-col">
                                <div className="flex flex-col p-1">
                                    <label htmlFor="arquivos">Arquivos</label>
                                    <input type="file" id="arquivosid" onChange={e => handleFileChange(e)} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400  sm:w-96" />
                                    <textarea id="arquivoNames" value={nomesArquivos}  className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 h-36 sm:w-96" />
                                </div>
                                <div className="flex flex-col p-1">
                                    <label htmlFor="arquivos">Observação</label>

                                    <textarea id="arquivoObs" value={observacaoArquivos} onChange={e => setObservacaoArquivos(e.target.value.toUpperCase())} className="uppercase p-1 border rounded-md border-spacing-1 border-amber-400 h-36 sm:w-96" />
                                </div>
                            </div>
                            <div className=" grid itens-center justify-center gap-4 grid-cols-2	">
                                <button
                                    onClick={e => setShowMostrarArquivos(true)}
                                    disabled = {temArquivo}
                                    className="bg-black p-2 rounded-md text-white hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none">Mostrar Arquivos</button>
                                <button
                                    onClick={handleUpload}
                                    className="bg-black p-2 rounded-md text-white hover:bg-amber-500 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none">Salvar Arquivos</button>
                            </div>
                        </div>
                }
            />
            {showMostrarArquivos && <ModalMostrarArquivos />}
        </div>
    );
}