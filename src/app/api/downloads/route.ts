import { getFileName } from "@/app/functions/utils";
import * as ftp from "basic-ftp";
import fs from 'fs';
import { Readable } from "stream";
import arq from 'C:/Temp/logo.png'


export async function GET(request: Request){

    const path = request.headers.get('path');
    const client = new ftp.Client();
    client.ftp.verbose = true;
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
    const blob = await fs.openAsBlob(localFile);
    const buffer = Buffer.from(await blob.arrayBuffer());
    const stream = Readable.from(buffer); 

    console.log(fs.existsSync(localFile));

    //var bin = (await fs.openAsBlob(localFile)).stream();
    
    //'Content-Type': 'application/octet-stream'
    

    return Response.json(arq,{
        headers : {'Content-Type': 'application/octet-stream'}
})
}