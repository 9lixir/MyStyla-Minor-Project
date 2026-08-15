from fastapi import APIRouter, HTTPException, Query
import httpx

from app.weather.service import fetch_current_weather


router = APIRouter(tags=["weather"])


@router.get("/current")
async def get_current_weather(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
):
    #Return current weather for the frontend before outfit rules are added
    try:
        return await fetch_current_weather(latitude, longitude)
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Weather provider returned {exc.response.status_code}",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Weather provider is unavailable") from exc
