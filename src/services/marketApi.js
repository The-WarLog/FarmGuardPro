const CORE_API_BASE_URL = (import.meta.env.VITE_CORE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');
const REQUEST_TIMEOUT_MS = 45000;

const fetchWithTimeout = async (url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Market request timed out. Please check backend connectivity.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const toJson = async (response) => {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload?.detail || payload?.message || `Request failed (${response.status})`;
    throw new Error(detail);
  }
  return payload;
};

export const fetchMarketCommodities = async (query = '', limit = 20) => {
  const params = new URLSearchParams();
  if (query?.trim()) {
    params.set('query', query.trim());
  }
  params.set('limit', String(limit));

  const response = await fetchWithTimeout(`${CORE_API_BASE_URL}/api/market/commodities?${params.toString()}`);
  return toJson(response);
};

export const fetchMarketPrices = async ({ commodities = [], states = [] } = {}) => {
  const params = new URLSearchParams();

  if (Array.isArray(commodities) && commodities.length) {
    params.set('commodities', commodities.join(','));
  }

  if (Array.isArray(states) && states.length) {
    params.set('states', states.join(','));
  }

  const query = params.toString();
  const response = await fetchWithTimeout(
    `${CORE_API_BASE_URL}/api/market/prices${query ? `?${query}` : ''}`
  );
  return toJson(response);
};
