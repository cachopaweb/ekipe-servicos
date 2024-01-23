import * as ftp from "basic-ftp";
import { Readable } from "stream";

export const config = {
    api: {
      bodyParser: false,
    },
};
  
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
    await client.uploadFrom(file.data, "/ekipe_servicos/uploads/"+file.name);
}

export async function POST(request: Request): Promise<Response> {
    const formData = await request.formData();
    const filesData = formData.getAll('files');       
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
                uploadFile(file)
            });        
        });
        return Response.json({message: 'Arquivo(s) enviado(s) com sucesso'});
    }
    catch(err) {
        throw new Error(String(err));        
    }    
  }