from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from db.database import create_db_and_tables
from routes.analysis_route import router as analysis_router
from routes.auth_route import router as auth_router
from routes.weather_route import router as weather_router
from routes.user_route import router as user_router
from routes.chat_route import router as chat_router
from routes.news_route import router as news_router
from routes.market_route import router as market_router
from routes.stats_route import router as stats_router
from routes.translate_route import router as translate_router


app = FastAPI(
    title="EPICS",
    version="1.0.0",
    description="Central API entry point for middleware and routes",
)


@app.on_event("startup")
def on_startup() -> None:
    create_db_and_tables()

# Global middleware: CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_timer_middleware(request: Request, call_next):
    # Middleware example: attach processing time header
    import time

    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000
    response.headers["X-Process-Time-MS"] = f"{elapsed_ms:.2f}"
    return response


@app.get("/")
async def root():
    return {"message": "API is running"}


@app.get("/health")
async def health():
    return {"status": "ok"}


# All routes are mounted under /api
app.include_router(auth_router, prefix="/api")#used for user registration and login
app.include_router(weather_router, prefix="/api")#used for weather report fetching
app.include_router(user_router, prefix="/api")#basically profile_detials
app.include_router(analysis_router, prefix="/api")#user-specific analysis history
app.include_router(chat_router, prefix="/api")#AI chatbot powered by Sarvam AI
app.include_router(news_router, prefix="/api")#latest agriculture news feed
app.include_router(market_router, prefix="/api")#state-wise mandi prices
app.include_router(stats_router, prefix="/api")#public analytics/stats endpoints
app.include_router(translate_router, prefix="/api")#translation proxy endpoints

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "message": str(exc)},
    )
