import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import * as path from 'path';
import * as ftp from "basic-ftp";
import { getFileName } from "@/app/functions/utils";

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.method !== 'GET') {
    return response.status(405).end();
  }
  const client = new ftp.Client();
  const { headers } = request;
  const { from } = headers;



  client.ftp.verbose = true;
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
    fs.mkdir('Temp', (e) => {
    });
    await client.downloadTo("/Temp/" + getFileName(from!), from!);
  }  catch (err) {
    console.log(err)
  }



  response.setHeader('Content-Disposition', `attachment; filename=${getFileName(from!)}`);
  response.setHeader('Content-Type', 'application/octet-stream');

  const filePath = path.join('/Temp/', getFileName(from!));
  const fileStream = fs.createReadStream(filePath);

  fileStream.pipe(response);

  response.on('finish', () => {
    fileStream.close();
  });
}