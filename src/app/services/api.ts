import axios from "axios";

const api = axios.create({ baseURL: 'https://servidor-ekipe-fboxwqyjfq-rj.a.run.app/v1' })
// const api = axios.create({  baseURL: 'https://servidor-ekipe-teste-fboxwqyjfq-rj.a.run.app/v1' })

export default api;
