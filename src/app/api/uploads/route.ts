import ftp from "basic-ftp";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: Request): Promise<Response> {
    console.log("inicio");
    console.log(request);
    console.log("Fim");
    const formData = await request.formData();
  
    //console.log(formData.getAll('files'));

    console.log("inicio");
    console.log(formData);
    console.log("Fim");
   /* const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        await client.access({
            host: "myftpserver.com",
            user: "very",
            password: "password",
            secure: true
        })
        console.log(await client.list())
        await client.uploadFrom("README.md", "README_FTP.md")
        await client.downloadTo("README_COPY.md", "README_FTP.md")
    }
    catch(err) {
        console.log(err)
    }*/

    return Response.json({message: 'enviado com sucesso'});
  }