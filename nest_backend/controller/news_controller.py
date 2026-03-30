from datetime import datetime
from email.utils import parsedate_to_datetime
from typing import Dict, List
from urllib.parse import quote_plus
import os
import xml.etree.ElementTree as ET

import requests
from fastapi import APIRouter

news = APIRouter()

GNEWS_SEARCH_URL = "https://gnews.io/api/v4/search"
GOOGLE_NEWS_RSS_URL = "https://news.google.com/rss/search?q=agriculture+india&hl=en-IN&gl=IN&ceid=IN:en"


def _safe_iso_date(value: str) -> str:
    if not value:
        return ""

    try:
        # Handles RFC2822 dates from RSS.
        return parsedate_to_datetime(value).isoformat()
    except Exception:
        pass

    try:
        # Handles most ISO values from JSON APIs.
        return datetime.fromisoformat(value.replace("Z", "+00:00")).isoformat()
    except Exception:
        return value


def _fetch_from_gnews(limit: int) -> Dict:
    token = os.getenv("GNEWS_API_KEY")
    if not token:
        return {"items": [], "provider": "gnews", "error": "GNEWS_API_KEY missing"}

    params = {
        "q": "(agriculture OR farming OR crop OR mandi) AND India",
        "lang": "en",
        "country": "in",
        "max": max(1, min(limit, 10)),
        "sortby": "publishedAt",
        "token": token,
    }

    response = requests.get(GNEWS_SEARCH_URL, params=params, timeout=12)
    response.raise_for_status()
    payload = response.json()

    items: List[Dict] = []
    for article in payload.get("articles", []):
        items.append(
            {
                "title": article.get("title", "Untitled"),
                "url": article.get("url"),
                "published_at": _safe_iso_date(article.get("publishedAt", "")),
                "source": (article.get("source") or {}).get("name", "Unknown"),
            }
        )

    return {"items": items, "provider": "gnews", "error": None}


def _fetch_from_google_rss(limit: int) -> Dict:
    response = requests.get(GOOGLE_NEWS_RSS_URL, timeout=12)
    response.raise_for_status()

    root = ET.fromstring(response.text)
    channel = root.find("channel")
    raw_items = channel.findall("item") if channel is not None else []

    items: List[Dict] = []
    for rss_item in raw_items[: max(1, min(limit, 10))]:
        source_node = rss_item.find("source")
        items.append(
            {
                "title": (rss_item.findtext("title") or "Untitled").strip(),
                "url": (rss_item.findtext("link") or "").strip(),
                "published_at": _safe_iso_date((rss_item.findtext("pubDate") or "").strip()),
                "source": (source_node.text or "Google News").strip() if source_node is not None else "Google News",
            }
        )

    return {"items": items, "provider": "google-news-rss", "error": None}


@news.get("/news/latest")
def get_latest_agri_news(limit: int = 6):
    safe_limit = max(1, min(limit, 10))

    # Primary source: GNews real-time API.
    try:
        gnews_result = _fetch_from_gnews(safe_limit)
        if gnews_result["items"]:
            return {
                "provider": gnews_result["provider"],
                "items": gnews_result["items"],
                "count": len(gnews_result["items"]),
            }
    except Exception:
        pass

    # Fallback source: Google News RSS to keep feed always available.
    try:
        rss_result = _fetch_from_google_rss(safe_limit)
        return {
            "provider": rss_result["provider"],
            "items": rss_result["items"],
            "count": len(rss_result["items"]),
        }
    except Exception as exc:
        return {
            "error": "Unable to fetch latest agriculture news right now.",
            "message": str(exc),
            "provider": "none",
            "items": [],
            "count": 0,
        }
