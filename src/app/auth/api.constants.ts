import { environment } from "../../environments/environments";
export const API_BASE_URL = environment.apiBaseUrl;

export const LOGIN_ENDPOINT = `${API_BASE_URL}/login`;
export const QBSTATUS_LOGIN_ENDPOINT = `${API_BASE_URL}/company/crm_status`;