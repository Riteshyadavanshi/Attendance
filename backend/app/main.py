from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.exceptions import AppHTTPException

settings = get_settings()

app = FastAPI(
    title="HR Attendance API",
    description="AI-Powered Smart Attendance & Workforce Management",
    version="1.0.0",
)

origins = ["*"] if settings.cors_origins == "*" else settings.cors_origins.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppHTTPException)
async def app_exception_handler(_: Request, exc: AppHTTPException):
    return JSONResponse(status_code=exc.status_code, content=exc.detail)


@app.get("/health")
async def health():
    return {"status": "ok", "env": settings.app_env}


app.include_router(api_router, prefix="/api/v1")
