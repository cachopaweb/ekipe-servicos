import { getFileName } from "@/app/functions/utils";
import * as ftp from "basic-ftp";
import fs from 'fs';
import { Readable } from "stream";
import arq from 'C:/Temp/logo.png'


export async function GET(request: Request) {

    const stream = await getFile(request.headers.get('path'));

    return Response.json(stream, {
        headers: { 'Content-Type': 'application/octet-stream' }
    })

    
}


function lerArquivo(path:string) {
    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(path);
      const readableStream = new Readable();
      
      fileStream.on('data', (chunk) => {
        readableStream.push(chunk);
      });
  
      fileStream.on('end', () => {
        readableStream.push(null);
        resolve(readableStream);
      });
  
      fileStream.on('error', (err) => {
        reject(`Erro ao ler o arquivo: ${err.message}`);
      });
    });
  }
  


async function getFile(path: any)
    {
        return new Promise( async (resolve, reject) => {
        const client = new ftp.Client();
        client.ftp.verbose = true;
        var aux = '';
        const localFile = 'C:/Temp/'+getFileName(path!);
        try {
            await client.access({
                host: "portalsoft.sytes.net",
                user: "portal_ftp",
                password: "portal3694",
                secure: false,    
            })
        fs.mkdir('C:/Temp', (e) => {
        });
           await client.downloadTo("/Temp/"+getFileName(path!), path!);
        }
    
        catch(err) {
            console.log(err)
        }
        const size = (await fs.openAsBlob(localFile)).size;

        const fileStream = fs.createReadStream(localFile);
        const readableStream = new Readable();
        fileStream.on('data', async (chunk) => {
            aux = aux + chunk;
            readableStream.push(chunk);
          });
        fileStream.on('end', () => {
            readableStream.push(null);
            console.log('Readable: '+readableStream);
            resolve(readableStream);
        });
    
        fileStream.on('error', (err) => {
            console.error(`Erro ao ler o arquivo: ${err.message}`);
        });
        console.log("aux: "+aux);
        const blob = await fs.openAsBlob(localFile);
        const buffer = Buffer.from(await blob.arrayBuffer());
        const stream = Readable.from(buffer); 
    });
    }