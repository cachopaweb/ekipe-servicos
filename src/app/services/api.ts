import axios from "axios";

const BaseURL = process.env.NEXT_PUBLIC_BASE_URL || "https://servidor-ekipe-teste-fboxwqyjfq-rj.a.run.app/v1";
const api = axios.create({ baseURL: BaseURL });

export default api;
