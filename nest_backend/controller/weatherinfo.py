from fastapi.routing import APIRouter
from fastapi import HTTPException, status
import json
from fastapi.responses import Response
from fastapi.requests import HTTPConnection, Request
from typing import Optional,Annotated
from dotenv import load_dotenv
import os
import aiohttp
import httpx
load_dotenv()
'''need to make the weather api point'''
baseurl = "https://api.openweathermap.org/data/2.5/weather"
apikey = os.getenv("API_KEY")
weather=APIRouter()

#fetching the weather

async def fetchcurrent(url:str,city:str):
    if not apikey:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Weather API key is not configured on server"
        )
    urlapi=f"{url}?q={city}&appid={apikey}&units=metric"
    async with aiohttp.ClientSession() as session:
        async with session.get(urlapi) as response:
            if response.status !=200:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="Bad Reuqest Try Again")
            data=await response.json()
    return data

#getting the params from the url
@weather.get("/weather/{city}")
@weather.get("/weather")
async def getCurrentWeatherInfoCity(reuqest:Request,city:Optional[str]=None):
    query_city = city or reuqest.query_params.get("city") or "Sehore"
    try:
        weather_data=await fetchcurrent(baseurl,query_city.lower())
        main=weather_data.get("main",{})
        wind=weather_data.get("wind",{})
        sys_data=weather_data.get("sys",{})
        filtered_data={
            "temperature": main.get("temp"),
            "feels_like": main.get("feels_like"),
            "temp_min": main.get("temp_min"),
            "temp_max": main.get("temp_max"),
            "pressure": main.get("pressure"),
            "humidity": main.get("humidity"),
            "wind_speed": wind.get("speed"),
            "wind_direction": wind.get("deg"),
            "country": sys_data.get("country"),
            "sunrise": sys_data.get("sunrise"),
            "sunset": sys_data.get("sunset"),
            "city": weather_data.get("name"),

        }
        return filtered_data
    except HTTPException:
        raise

    
   

    
            

