"""
SAR Oil-Spill Detection, Segmentation and Research Analysis Platform.
FastAPI Backend Application Entrypoint.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.services.model_service import model_service
from app.api.routes import router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("oil_spill_platform")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Loads the real U-Net model once on startup and performs model readiness checks.
    """
    logger.info("Initializing SAR Oil-Spill Platform Backend...")
    success = model_service.load_model()
    if success:
        logger.info("Trained U-Net model successfully initialized and ready for inference.")
    else:
        logger.warning(
            f"Model could not be loaded at startup: {model_service.load_error}. "
            "Backend will serve in degraded state."
        )
    yield
    logger.info("Shutting down SAR Oil-Spill Platform Backend...")


app = FastAPI(
    title="SAR Oil-Spill Detection & Segmentation Platform",
    description=(
        "Research web application for 5-class semantic segmentation and quantitative "
        "analysis of Synthetic Aperture Radar (SAR) imagery using an existing trained U-Net model."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# Configure Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(router)


@app.get("/")
def root():
    return {
        "platform": "SAR Oil-Spill Detection, Segmentation and Research Analysis Platform",
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_url": "/api/health",
        "model_info_url": "/api/model-info"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
