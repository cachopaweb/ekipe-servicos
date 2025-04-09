import CidadeModel from "../models/cidade_model";
import api from "../services/api";
import axios from "axios";

export default class CidadeRepository{
    async getCidade(codigo: number): Promise<CidadeModel>{
        try {
            const response = await api.post('/dataset', {
                'sql': `SELECT * FROM CIDADES WHERE CID_CODIGO = ${codigo}`
            })
            return response.data as CidadeModel;
        } catch (error) {
            throw new Error('Erro ao buscar codigo cidade.\n'+String(error)); 
        }
    }


    async getCidadeDescricao(codigo: number): Promise<CidadeModel>{
        try {
            const sql = `SELECT CID_CODIGO, CID_NOME||'-'||CID_UF DESCRICAO FROM CIDADES WHERE CID_CODIGO = ${codigo}`
            const response = await api.post('/dataset', {
                'sql': sql
            })
            return response.data as CidadeModel;
        } catch (error) {
            throw new Error('Erro ao buscar codigo cidade.\n'+String(error)); 
        }
    }

    async getLatitudeLongitude({endereco, bairro, cidadeEstado}: {endereco:string, bairro:string, cidadeEstado:string}): Promise<[number, number]>{
        cidadeEstado.replace('-', '/');
        try {
        const URLBUSCA = `https://geocode.maps.co/search?q={${endereco}, ${bairro}, ${cidadeEstado}}&api_key=67f408e5db683176830080wpt1a6c42`;
        const apiAux = axios.create({ baseURL: URLBUSCA })
        const response = await apiAux.get('');
        const dados = response.data[0];
            return [ Number(dados.lat), Number(dados.lon),];
        } catch (error) {
            throw new Error('Erro ao buscar latitude e longitude.\n'+String(error)); 
        }
    }


    async getBuscaCidades(cidade:string): Promise<CidadeModel[]>{
        try {
            const sql = `SELECT CID_CODIGO, CID_NOME||'-'||CID_UF DESCRICAO FROM CIDADES WHERE CID_NOME LIKE '${cidade.toUpperCase()}%' ORDER BY CID_NOME`;
            const response = await api.post('/dataset', {
                'sql': sql
            })
            let data = [];
            if (response.data instanceof Array){
                data = response.data;
            }else{
                data = [response.data];
            }
            return data as CidadeModel[];
        } catch (error) {
            throw new Error('Erro ao buscar codigo cidade.\n'+String(error)); 
        }
    }
}