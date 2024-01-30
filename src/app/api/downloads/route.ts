import { getFileName } from "@/app/functions/utils";
import * as ftp from "basic-ftp";
import fs from 'fs';
import { Readable } from "stream";
import arq from 'C:/Temp/logo.png'
import { NextApiResponse, NextApiRequest } from "next";
import { IncomingHttpHeaders } from "http";


interface Header extends IncomingHttpHeaders {
  path:string
}

export async function GET(request: NextApiRequest, response:NextApiResponse) {



  const client = new ftp.Client();
  const nameFile = 'logo.png';
  client.ftp.verbose = true;
  const readableStream = new Readable();
  const localFile = 'C:/Temp/' + getFileName(nameFile);
  // const blob = await fs.openAsBlob(localFile);
  //console.log('Type: '+blob.type);
  try {
    await client.access({
      host: "portalsoft.sytes.net",
      user: "portal_ftp",
      password: "portal3694",
      secure: false,
    })
    fs.mkdir('C:/Temp', (e) => {
    });
    //await client.downloadTo("/Temp/" + getFileName(from!), from!);
  }


  catch (err) {
    console.log(err)
  }

    const filePath = localFile;
    const fileStream = fs.createReadStream(filePath);
    await fileStream.forEach(e => {
      readableStream.push(e);
    })
    fileStream.pipe(response);

    response.on('finish', () => {
      fileStream.close();
    });

  return response.json({readableStream,
    headers: { 'Content-Type': 'application/octet-stream',
    'Content-Disposition': 'attachment; filename=logo.png'}
  })


}


function lerArquivo(path: string) {
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



async function getFile({from}: IncomingHttpHeaders, response: NextApiResponse) {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  const readableStream = new Readable();
  const localFile = 'C:/Temp/' + getFileName(from!);
  // const blob = await fs.openAsBlob(localFile);
  //console.log('Type: '+blob.type);
  try {
    await client.access({
      host: "portalsoft.sytes.net",
      user: "portal_ftp",
      password: "portal3694",
      secure: false,
    })
    fs.mkdir('C:/Temp', (e) => {
    });
    //await client.downloadTo("/Temp/" + getFileName(from!), from!);
  }


  catch (err) {
    console.log(err)
  }

    const filePath = localFile;
    const fileStream = fs.createReadStream(filePath);
    await fileStream.forEach(e => {
      readableStream.push(e);
    })
    fileStream.pipe(response);

    response.on('finish', () => {
      fileStream.close();
    });
    return readableStream;
}


async function getFile_(path: any) {
  return new Promise(async (resolve, reject) => {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    var aux = '';
    const localFile = 'C:/Temp/' + getFileName(path!);
    try {
      await client.access({
        host: "portalsoft.sytes.net",
        user: "portal_ftp",
        password: "portal3694",
        secure: false,
      })
      fs.mkdir('C:/Temp', (e) => {
      });
      await client.downloadTo("/Temp/" + getFileName(path!), path!);
    }

    catch (err) {
      console.log(err)
    }
    const size = (await fs.openAsBlob(localFile)).size;

    const fileStream = fs.createReadStream(localFile);
    const readableStream = new Readable();
    fileStream.on('data', async (chunk) => {
      aux = aux + chunk;
      readableStream.push(chunk);
    });
    fileStream.on('finish', () => {
      readableStream.push(null);
      console.log('Readable: ' + readableStream);
      resolve(readableStream);
      return readableStream;
    });

    fileStream.on('error', (err) => {
      console.error(`Erro ao ler o arquivo: ${err.message}`);
    });
    console.log("aux: " + aux);
    const blob = await fs.openAsBlob(localFile);
    const buffer = Buffer.from(await blob.arrayBuffer());
    const stream = Readable.from(buffer);
  });
}