from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Optional
import os

import requests
from fastapi import APIRouter, HTTPException, Query, status

market = APIRouter()

MANDI_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"
MANDI_API_BASE = f"https://api.data.gov.in/resource/{MANDI_RESOURCE_ID}"
DEFAULT_COMMODITIES = ["Rice", "Wheat", "Soyabean", "Potato", "Tomato"]
REQUEST_TIMEOUT_SECONDS = 10
MAX_ROWS_PER_CALL = 1000


def _parse_csv_param(raw_value: Optional[str]) -> List[str]:
    if not raw_value:
        return []
    return [item.strip() for item in raw_value.split(",") if item.strip()]


def _safe_float(value) -> Optional[float]:
    try:
        parsed = float(value)
        if parsed <= 0:
            return None
        return parsed
    except (TypeError, ValueError):
        return None


def _parse_price(record: Dict) -> Optional[float]:
    for field in ("modal_price", "max_price", "min_price"):
        parsed = _safe_float(record.get(field))
        if parsed is not None:
            return parsed
    return None


def _parse_date(record: Dict) -> datetime:
    raw = (record.get("arrival_date") or "").strip()
    if not raw:
        return datetime.min

    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(raw, fmt)
        except ValueError:
            continue

    return datetime.min


def _build_params(limit: int, commodity: Optional[str] = None, state: Optional[str] = None) -> Dict[str, str]:
    params = {
        "format": "json",
        "limit": str(max(1, min(limit, MAX_ROWS_PER_CALL))),
    }

    api_key = os.getenv("MANDI_API_KEY")
    if api_key:
        params["api-key"] = api_key

    if commodity:
        params["filters[commodity]"] = commodity
    if state:
        params["filters[state]"] = state

    return params


def _fetch_records(limit: int, commodity: Optional[str] = None, state: Optional[str] = None) -> List[Dict]:
    params = _build_params(limit=limit, commodity=commodity, state=state)

    try:
        response = requests.get(MANDI_API_BASE, params=params, timeout=REQUEST_TIMEOUT_SECONDS)
        response.raise_for_status()
        payload = response.json()
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Mandi API request failed: {exc}",
        ) from exc

    records = payload.get("records")
    if not isinstance(records, list):
        return []

    return records


@market.get("/market/commodities")
def search_commodities(
    query: str = "",
    limit: int = Query(default=20, ge=1, le=100),
):
    records = _fetch_records(limit=MAX_ROWS_PER_CALL)

    query_lower = query.strip().lower()
    seen = set()
    result = []

    for record in records:
        commodity = (record.get("commodity") or "").strip()
        if not commodity:
            continue

        if query_lower and query_lower not in commodity.lower():
            continue

        normalized = commodity.lower()
        if normalized in seen:
            continue

        seen.add(normalized)
        result.append(commodity)

    result.sort(key=lambda item: item.lower())
    return {
        "items": result[:limit],
        "count": min(len(result), limit),
    }


@market.get("/market/prices")
def get_market_prices(
    commodities: Optional[str] = None,
    states: Optional[str] = None,
    per_commodity_limit: int = Query(default=MAX_ROWS_PER_CALL, ge=100, le=MAX_ROWS_PER_CALL),
):
    selected_commodities = _parse_csv_param(commodities) or DEFAULT_COMMODITIES
    selected_states = _parse_csv_param(states)

    by_state: Dict[str, Dict[str, Dict]] = {}
    commodity_errors: Dict[str, str] = {}

    records_by_commodity: Dict[str, List[Dict]] = {}
    with ThreadPoolExecutor(max_workers=max(1, min(len(selected_commodities), 6))) as executor:
        futures = {
            executor.submit(_fetch_records, per_commodity_limit, commodity, None): commodity
            for commodity in selected_commodities
        }

        for future in as_completed(futures):
            commodity = futures[future]
            try:
                records_by_commodity[commodity] = future.result()
            except HTTPException as exc:
                commodity_errors[commodity] = str(exc.detail)
                records_by_commodity[commodity] = []

    for commodity in selected_commodities:
        records = records_by_commodity.get(commodity, [])

        for record in records:
            state_name = (record.get("state") or "").strip()
            if not state_name:
                continue

            if selected_states and state_name not in selected_states:
                continue

            price = _parse_price(record)
            if price is None:
                continue

            row_date = _parse_date(record)
            state_bucket = by_state.setdefault(state_name, {})
            current = state_bucket.get(commodity)

            if current is None or row_date >= current["date"]:
                state_bucket[commodity] = {
                    "price": price,
                    "date": row_date,
                }

    items = []
    for state_name in sorted(by_state.keys()):
        commodity_prices = {
            commodity: (
                round(by_state[state_name][commodity]["price"])
                if commodity in by_state[state_name]
                else None
            )
            for commodity in selected_commodities
        }
        latest_record_date = None
        if by_state[state_name]:
            latest_record_date = max(detail["date"] for detail in by_state[state_name].values())

        items.append(
            {
                "state": state_name,
                "prices": commodity_prices,
                "latest_arrival_date": latest_record_date.date().isoformat() if latest_record_date and latest_record_date != datetime.min else None,
            }
        )

    response_payload = {
        "source": "data.gov.in",
        "resource_id": MANDI_RESOURCE_ID,
        "commodities": selected_commodities,
        "states_filter": selected_states,
        "count": len(items),
        "updated_at": datetime.utcnow().isoformat() + "Z",
        "items": items,
    }

    if commodity_errors:
        response_payload["partial_failures"] = commodity_errors

    return response_payload
