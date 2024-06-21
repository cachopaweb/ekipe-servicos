import ArquivoModel from "@/app/models/arquivo_model";
import ArquivoRepository from "@/app/repositories/arquivo_repository";
import * as ftp from "basic-ftp";
import { Readable } from "stream";


const caminho = "/ekipe_servicos/uploads/";
  
type TypeFileData = {
    name: string,
    data: Readable
}



const uploadFile = async (file: TypeFileData)=>{

    const client = new ftp.Client();
    client.ftp.verbose = false;
    await client.access({
        host: "portalsoft.sytes.net",
         user: "portal_ftp",
         password: "portal3694",
         secure: false,             
    })
    await client.uploadFrom(file.data, caminho+file.name);
}
export async function POST(request: Request): Promise<Response> {
    const formData = await request.formData();
    const filesData = formData.getAll('files');
    const arq = JSON.parse(formData.get('arquivo')!.toString());

    try {        
        const list = filesData.map(async item => {
            const file = item as File;
            const fileBlob = file as Blob;
            const buffer = Buffer.from(await fileBlob.arrayBuffer()); 
            const stream = Readable.from(buffer);            
            return {
                name: file.name,
                data: stream
             };            
        });     
        Promise.all(list).then((item)=> {
            item.forEach(async file=> {  
                arq.AO_CAMINHO = caminho+file.name;
                try{
                    await ArquivoRepository.setArquivoRepository(arq); 
                } catch (error) {
                    throw new Error('Erro ao enviar:\n'+String(error));
                    return;
                }
                uploadFile(file)
            });        
        });
        return Response.json({message: 'Arquivo(s) enviado(s) com sucesso'});
    }
    catch(err) {
        throw new Error(String(err));        
    }    
  }