import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import * as path from 'path';

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.method !== 'GET') {
    return response.status(405).end();
  }

  const { headers } = request;
  const { from } = headers;
  console.log(from);

  response.setHeader('Content-Disposition', `attachment; filename=${from}`);
  response.setHeader('Content-Type', 'image/png');

  const filePath = path.join(process.cwd(), 'assets', from!);
  const fileStream = fs.createReadStream(filePath);

  fileStream.pipe(response);

  response.on('finish', () => {
    fileStream.close();
  });
}