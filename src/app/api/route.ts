import ftp from "basic-ftp";
import { NextRequest, NextResponse } from "next/server";

export async function GET(){
    // const client = new ftp.Client()
    // client.ftp.verbose = true;
    return NextResponse.json({message: 'enviado com sucesso'})
}