import os
from urllib.parse import quote_plus

from fastapi import APIRouter
from pydantic import BaseModel
import httpx

translate = APIRouter()

LIBRETRANSLATE_APIS = [
    'https://libretranslate.com/translate',
    'https://libretranslate.de/translate',
]
LIBRETRANSLATE_API_KEY = os.getenv('LIBRETRANSLATE_API_KEY', '').strip()

class TranslateRequest(BaseModel):
    text: str
    targetLanguage: str
    sourceLanguage: str = 'en'


LANGUAGE_CODES = {
    'english': 'en',
    'hindi': 'hi',
    'bengali': 'bn',
    'telugu': 'te',
    'marathi': 'mr',
    'tamil': 'ta',
    'gujarati': 'gu',
    'urdu': 'ur',
    'kannada': 'kn',
    'odia': 'or',
    'punjabi': 'pa',
    'assamese': 'as',
    'malayalam': 'ml',
}


def resolve_language_code(language: str, default: str = 'en') -> str:
    if not language:
        return default
    value = language.strip().lower()
    if value in LANGUAGE_CODES:
        return LANGUAGE_CODES[value]
    if len(value) == 2 and value.isalpha():
        return value
    return default


async def try_libretranslate(client: httpx.AsyncClient, payload: dict, errors: list[str]) -> str | None:
    for api_url in LIBRETRANSLATE_APIS:
        try:
            response = await client.post(api_url, json=payload)
            if response.status_code != 200:
                errors.append(f"{api_url} -> HTTP {response.status_code}")
                continue

            data = response.json()
            translated = data.get('translatedText')
            if translated:
                return translated

            errors.append(f"{api_url} -> missing translatedText")
        except Exception as endpoint_error:
            errors.append(f"{api_url} -> {str(endpoint_error)}")

    return None


async def try_mymemory(client: httpx.AsyncClient, text: str, source_code: str, target_code: str, errors: list[str]) -> str | None:
    try:
        encoded_text = quote_plus(text)
        url = (
            "https://api.mymemory.translated.net/get"
            f"?q={encoded_text}&langpair={source_code}|{target_code}"
        )
        response = await client.get(url)
        if response.status_code != 200:
            errors.append(f"mymemory -> HTTP {response.status_code}")
            return None

        data = response.json()
        translated = data.get('responseData', {}).get('translatedText')
        if translated:
            return translated

        errors.append("mymemory -> missing translatedText")
        return None
    except Exception as endpoint_error:
        errors.append(f"mymemory -> {str(endpoint_error)}")
        return None


async def try_google_public(client: httpx.AsyncClient, text: str, source_code: str, target_code: str, errors: list[str]) -> str | None:
    try:
        encoded_text = quote_plus(text)
        url = (
            "https://translate.googleapis.com/translate_a/single"
            f"?client=gtx&sl={source_code}&tl={target_code}&dt=t&q={encoded_text}"
        )
        response = await client.get(url)
        if response.status_code != 200:
            errors.append(f"google-public -> HTTP {response.status_code}")
            return None

        data = response.json()
        if isinstance(data, list) and data and isinstance(data[0], list):
            chunks = [part[0] for part in data[0] if isinstance(part, list) and part]
            translated = ''.join(chunks).strip()
            if translated:
                return translated

        errors.append("google-public -> unexpected response format")
        return None
    except Exception as endpoint_error:
        errors.append(f"google-public -> {str(endpoint_error)}")
        return None

@translate.post("/translate/text")
async def translate_text(request: TranslateRequest):
    """Translate text through LibreTranslate (server-side to avoid CORS issues)"""
    
    target_code = resolve_language_code(request.targetLanguage, default='')
    source_code = resolve_language_code(request.sourceLanguage, default='en')
    
    if not target_code:
        return {"translatedText": request.text, "error": f"Unknown language: {request.targetLanguage}"}
    
    if target_code == 'en':
        return {"translatedText": request.text}
    
    payload = {
        'q': request.text,
        'source': source_code,
        'target': target_code,
        'format': 'text',
    }
    if LIBRETRANSLATE_API_KEY:
        payload['api_key'] = LIBRETRANSLATE_API_KEY

    errors = []

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            translated = await try_libretranslate(client, payload, errors)
            if translated:
                return {"translatedText": translated}

            translated = await try_mymemory(client, request.text, source_code, target_code, errors)
            if translated:
                return {"translatedText": translated}

            translated = await try_google_public(client, request.text, source_code, target_code, errors)
            if translated:
                return {"translatedText": translated}

        return {
            "translatedText": request.text,
            "error": "All translation providers failed: " + " | ".join(errors[:3])
        }

    except httpx.TimeoutException:
        return {"translatedText": request.text, "error": "Translation request timed out"}
    except Exception as e:
        return {"translatedText": request.text, "error": str(e)}
