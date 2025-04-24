import { environment } from "../../environments/environments";



export const API_BASE_URL = environment.apiBaseUrl;
export const API_KEY = environment.apiKey;

export const LOGIN_ENDPOINT = `${API_BASE_URL}/login`;