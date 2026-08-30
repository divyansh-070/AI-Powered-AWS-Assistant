from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db
from app.routers import generate
from app.services.llm_service import check_llm_health

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown

app = FastAPI(
    title="AI-Powered AWS Deployment Assistant",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(generate.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"status": "running", "service": "AWS Deployment Assistant API"}

@app.get("/health")
async def health_check():
    llm_health = await check_llm_health()
    return {
        "status": "healthy",
        "llm_status": llm_health
    }
