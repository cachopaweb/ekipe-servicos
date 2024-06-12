import { readFile } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import * as ftp from "basic-ftp";


const caminho = "/ekipe_servicos/uploads/";

type TypeFileData = {
    name: string,
    data: Readable
}

function getFileName(directoryPath:string) {
    // Split the directory path by the backslash separator
    const parts = directoryPath.split('/');

    // Return the last part of the array which is the file name
    return parts.pop();
  }

const downloadFile = async (name: string)=>{

    const client = new ftp.Client();
    client.ftp.verbose = false;
    await client.access({
        host: "portalsoft.sytes.net",
         user: "portal_ftp",
         password: "portal3694",
         secure: false, 
         port:21            
    })
    await client.ensureDir(caminho)
    await client.downloadTo(name, name);
}

export async function GET(request: Request): Promise<Response> {
    const nameFile = getFileName(request.headers.get('from') ?? '') ?? '';
    await downloadFile(nameFile);

    // process.cwd() is the root of the Next.js app 
    const buffer = await readFile(path.join(process.cwd(), nameFile));

    // set the headers to tell the browser to download the file
    const headers = new Headers();
    // remember to change the filename test.pdf to whatever you want the downloaded file called
    //headers.append("Content-Disposition", 'attachment; filename="test.pdf"');
    headers.append("Content-Type", "*");

    return new Response(buffer, {
      headers,
    });
  }
