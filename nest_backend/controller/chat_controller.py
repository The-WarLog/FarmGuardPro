from fastapi import APIRouter
from pydantic import BaseModel
import requests
import os
import re
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

chat = APIRouter()

# Request schema
class LocationContext(BaseModel):
    latitude: float
    longitude: float
    accuracy_meters: Optional[float] = None


class ChatRequest(BaseModel):
    message: str
    language: str = "en"  # Default to English, AI auto-detects user language
    location: Optional[LocationContext] = None


def _sanitize_ai_reply(reply: str) -> str:
    # Remove any reasoning/thinking blocks if model emits them.
    cleaned = re.sub(r"<think>.*?</think>", "", reply, flags=re.IGNORECASE | re.DOTALL)
    cleaned = re.sub(r"</?think>", "", cleaned, flags=re.IGNORECASE)
    return cleaned.strip()


def _location_context_text(location: Optional[LocationContext]) -> str:
    if not location:
        return ""

    accuracy_text = (
        f", accuracy about {round(location.accuracy_meters)} meters"
        if location.accuracy_meters is not None
        else ""
    )
    return (
        "User shared approximate location context: "
        f"latitude {location.latitude:.5f}, longitude {location.longitude:.5f}{accuracy_text}. "
        "Use it only when location-specific guidance is relevant."
    )


@chat.post("")
def chat_with_bot(req: ChatRequest):
    """
    AI-powered agriculture chatbot using Sarvam AI.
    Responds to farmer queries in Hindi or English.
    """
    
    SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
    if not SARVAM_API_KEY:
        return {"error": "SARVAM_API_KEY is not configured. Please set it in environment variables."}
    
    url = "https://api.sarvam.ai/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {SARVAM_API_KEY}",
        "Content-Type": "application/json"
    }

    location_context = _location_context_text(req.location)

    # 👇 Simple prompt for farmer chatbot
    payload = {
        "model": "sarvam-m",
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a helpful agriculture assistant. Detect the language of the user's input and respond ONLY in that same language. "
                    "If user writes in English, reply ONLY in English. If user writes in Hindi, reply ONLY in Hindi. Do not mix languages. "
                    "Do not output chain-of-thought, internal reasoning, analysis, <think> tags, or meta commentary. "
                    "Return answer-only content. Prefer concise bullet points when listing symptoms, causes, steps, or recommendations. "
                    "For crop recommendation queries, use this style: '- **Crop**: short reason with season and suitability.' "
                    "Give 10-20 bullets or lines max, each practical and location-aware when location context exists. "
                    "End with one short caution line about soil testing/local weather or local agri office consultation. "
                    f"{location_context}"
                )
            },
            {
                "role": "user",
                "content": req.message
            }
        ]
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

        # Extract reply
        reply = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        reply = _sanitize_ai_reply(reply)
        
        if not reply:
            return {"error": "Empty response from AI service"}

        return {
            "response": reply,
            "provider": "sarvam-ai",
            "language": req.language,
            "location_used": bool(req.location),
        }

    except requests.exceptions.RequestException as e:
        return {"error": f"API request failed: {str(e)}"}
    except (KeyError, IndexError) as e:
        return {"error": f"Invalid response format: {str(e)}"}
    except Exception as e:
        return {"error": str(e)}