import axios from "axios";

const BaseURL = process.env.NEXT_PUBLIC_BASE_URL;
const api = axios.create({ baseURL: BaseURL })
// const api = axios.create({  baseURL: 'https://servidor-ekipe-teste-fboxwqyjfq-rj.a.run.app/v1' })
export default api;
