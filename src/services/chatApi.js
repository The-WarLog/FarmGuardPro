const CORE_API_BASE_URL = (import.meta.env.VITE_CORE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');
const CHAT_ENDPOINT = `${CORE_API_BASE_URL}/api/chat`;
const REQUEST_TIMEOUT_MS = 15000;

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
      throw new Error('Chat request timed out. Please check your backend connection.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const sanitizeReply = (rawReply) => {
  if (typeof rawReply !== 'string') {
    return '';
  }
  return rawReply
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<\/?think>/gi, '')
    .trim();
};

/**
 * Query the Sarvam AI-powered chatbot on the backend.
 * @param {string} message - User's question/message
 * @param {string} language - Optional response language (defaults to 'en')
 * @param {{latitude: number, longitude: number, accuracy_meters?: number} | null} location - Optional location context
 * @returns {Promise<{reply: string, provider: string, language: string}>}
 */
export const queryFreeChatbot = async (message, language = 'en', location = null) => {
  const normalizedMessage = typeof message === 'string' ? message.trim() : '';
  if (!normalizedMessage) {
    throw new Error('Message is required.');
  }

  const normalizedLocation =
    location &&
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude)
      ? {
          latitude: Number(location.latitude),
          longitude: Number(location.longitude),
          accuracy_meters: Number.isFinite(location.accuracy_meters)
            ? Number(location.accuracy_meters)
            : undefined,
        }
      : null;

  try {
    const response = await fetchWithTimeout(CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: normalizedMessage,
        language: language || 'en',
        ...(normalizedLocation ? { location: normalizedLocation } : {}),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error || `Chat API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = sanitizeReply(data?.response);

    if (!reply) {
      throw new Error('Empty response from chatbot service.');
    }

    return {
      reply,
      provider: data?.provider || 'sarvam-ai',
      language: data?.language || language,
    };
  } catch (error) {
    console.error('Chat API error:', error.message);
    throw error;
  }
};
