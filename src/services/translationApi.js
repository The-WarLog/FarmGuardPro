// Translation service using backend proxy to LibreTranslate
const CORE_API_BASE_URL = (import.meta.env.VITE_CORE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');
const BACKEND_TRANSLATE_API = `${CORE_API_BASE_URL}/api/translate/text`;
const REQUEST_TIMEOUT_MS = 10000;
const translationCache = new Map();
const inFlightRequests = new Map();

const LANGUAGE_CODES = {
  english: 'en',
  hindi: 'hi',
  bengali: 'bn',
  telugu: 'te',
  marathi: 'mr',
  tamil: 'ta',
  gujarati: 'gu',
  urdu: 'ur',
  kannada: 'kn',
  odia: 'or',
  punjabi: 'pa',
  assamese: 'as',
  malayalam: 'ml',
};

export const translateText = async (text, targetLanguage) => {
  if (!text || targetLanguage === 'english') {
    return text;
  }

  const cacheKey = `${targetLanguage}::${text}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const targetCode = LANGUAGE_CODES[targetLanguage];
  if (!targetCode) {
    console.warn(`Unknown language: ${targetLanguage}`);
    return text;
  }

  const requestPromise = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(BACKEND_TRANSLATE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          targetLanguage: targetLanguage,
          sourceLanguage: 'english',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();
      if (data?.error) {
        console.warn('Translation backend warning:', data.error);
      }
      const translated = data.translatedText || text;
      translationCache.set(cacheKey, translated);
      return translated;
    } catch (error) {
      console.error('Translation error:', error.message);
      return text;
    } finally {
      inFlightRequests.delete(cacheKey);
      clearTimeout(timeoutId);
    }
  })();

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
};

export const translateObject = async (obj, targetLanguage) => {
  if (targetLanguage === 'english' || !obj) {
    return obj;
  }

  const translated = { ...obj };
  const keys = Object.keys(obj);
  
  try {
    for (const key of keys) {
      if (typeof obj[key] === 'string' && obj[key].length > 0) {
        console.log(`  Translating "${key.substring(0, 30)}..."`);
        translated[key] = await translateText(obj[key], targetLanguage);
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        translated[key] = await translateObject(obj[key], targetLanguage);
      } else if (Array.isArray(obj[key])) {
        translated[key] = await Promise.all(
          obj[key].map(item => {
            if (typeof item === 'string') {
              return translateText(item, targetLanguage);
            }
            return Promise.resolve(item);
          })
        );
      }
    }
  } catch (error) {
    console.error('Batch translation error:', error);
  }

  return translated;
};

export const translateArray = async (arr, targetLanguage) => {
  if (targetLanguage === 'english' || !Array.isArray(arr)) {
    return arr;
  }

  try {
    return await Promise.all(
      arr.map(item =>
        typeof item === 'string' ? translateText(item, targetLanguage) : item
      )
    );
  } catch (error) {
    console.error('Array translation error:', error);
    return arr;
  }
};
