const CORE_API_BASE_URL = (import.meta.env.VITE_CORE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');

const TOKEN_KEY = 'farmguard_access_token';
const REQUEST_TIMEOUT_MS = 8000;

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
      throw new Error('Request timed out. Please check your backend connection.');
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

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

export const setStoredToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      return;
    }
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.warn('Storage is unavailable. Session will be in-memory only.', error);
  }
};

export const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.warn('Storage is unavailable while reading token.', error);
    return null;
  }
};

export const registerUser = async ({ name, email, password }) => {
  const response = await fetchWithTimeout(`${CORE_API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  return toJson(response);
};

export const loginUser = async ({ email, password }) => {
  const response = await fetchWithTimeout(`${CORE_API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return toJson(response);
};

export const getCurrentUser = async (token) => {
  const response = await fetchWithTimeout(`${CORE_API_BASE_URL}/api/auth/me`, {
    method: 'GET',
    headers: authHeaders(token),
  });
  return toJson(response);
};

export const saveAnalysisRecord = async (token, payload) => {
  const response = await fetchWithTimeout(`${CORE_API_BASE_URL}/api/analysis`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return toJson(response);
};

export const fetchMyAnalysisRecords = async (token) => {
  const response = await fetchWithTimeout(`${CORE_API_BASE_URL}/api/analysis`, {
    method: 'GET',
    headers: authHeaders(token),
  });
  return toJson(response);
};

export const fetchUserAnalyticsSummary = async () => {
  const response = await fetchWithTimeout(`${CORE_API_BASE_URL}/api/stats/user-analytics`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }, 10000);
  return toJson(response);
};

export const fetchMyAnalytics = async (token) => {
  const response = await fetchWithTimeout(`${CORE_API_BASE_URL}/api/stats/my-analytics`, {
    method: 'GET',
    headers: authHeaders(token),
  }, 10000);
  return toJson(response);
};
