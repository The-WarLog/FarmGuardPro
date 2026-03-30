// API Configuration
const DEFAULT_AZURE_BASE_URL = 'http://0.0.0.0:5443';
const PROXY_PREFIX = '/azure-api';


const trimTrailingSlash = (value) => value.replace(/\/+$/, '');
const joinUrl = (base, path) => `${trimTrailingSlash(base)}/${path.replace(/^\/+/, '')}`;

const azureBaseUrl = trimTrailingSlash(import.meta.env.VITE_AZURE_API_BASE_URL || DEFAULT_AZURE_BASE_URL);
const useProxyInDev = import.meta.env.DEV && import.meta.env.VITE_USE_AZURE_PROXY !== 'false';

export const BACKEND_API_BASE_URL = useProxyInDev ? PROXY_PREFIX : azureBaseUrl;
export const PREDICT_ENDPOINT = joinUrl(BACKEND_API_BASE_URL, 'predict');
export const PREDICT_ENDPOINT_V1 = joinUrl(BACKEND_API_BASE_URL, 'api/v1/predict');
export const WEATHER_ENDPOINT = joinUrl(BACKEND_API_BASE_URL, 'api/v1/weather/current-weather');
