import * as ftp from "basic-ftp";

type TypeFileData = {
    name: string
}

export async function POST(request: Request): Promise<Response> {
    const formData = await request.formData();
  
    const filesData = formData.getAll('files'); 
    console.log(filesData);
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        await client.access({
            host: "portalsoft.sytes.net",
            user: "portal_ftp",
            password: "portal3694",
            secure: false
        })
        // filesData.map(item => {
        //     const file = item as TypeFileData;
        //     const stremFile = item;
        //     await client.uploadFrom(file, "ekipe-servicos-uploads/"+file.name);
        // });        
        // await client.downloadTo("README_COPY.md", "README_FTP.md")
    }
    catch(err) {
        console.log(err)
    }
    return Response.json({message: 'enviado com sucesso'});
  }