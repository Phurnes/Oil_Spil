"""
Application Configuration and Constants.
Provides centralized, validated configuration for model inference, class definitions,
color palettes, image validation, and API runtime settings.
"""

import os
import json
from pathlib import Path
from typing import List, Dict, Any, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Application runtime settings loaded from environment or defaults."""
    
    # Server settings
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    DEBUG: bool = False
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            v_strip = v.strip()
            if v_strip.startswith("[") and v_strip.endswith("]"):
                try:
                    return json.loads(v_strip)
                except Exception:
                    pass
            return [i.strip() for i in v_strip.split(",") if i.strip()]
        elif isinstance(v, list):
            return [str(item) for item in v]
        return ["*"]

    # Model parameters
    MODEL_PATH: str = str(BASE_DIR / "models" / "unet_oilspill_model.keras")
    IMG_HEIGHT: int = 256
    IMG_WIDTH: int = 256
    IMG_CHANNELS: int = 3
    NUM_CLASSES: int = 5
    
    # Safety and limits
    MAX_UPLOAD_SIZE_MB: int = 25
    MAX_IMAGE_DIMENSION: int = 4096
    DEFAULT_LOW_CONFIDENCE_THRESHOLD: float = 0.60
    DEFAULT_OVERLAY_OPACITY: float = 0.50
    DEFAULT_MIN_COMPONENT_SIZE: int = 10
    
    # Preprocessing convention
    # NOTE: Training notebook cv2.imread(..., cv2.IMREAD_COLOR) loads images in BGR format
    # without cvtColor to RGB. Model was trained with BGR normalized by 255.0.
    INPUT_CHANNEL_ORDER: str = "BGR"
    
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

# Verified RGB Color Map from original training notebook (Cell 5):
# [[0, 0, 0], [0, 255, 255], [255, 0, 0], [153, 76, 0], [0, 153, 0]]
COLOR_MAP_RGB: List[List[int]] = [
    [0, 0, 0],       # Class 0: Sea Surface / Background
    [0, 255, 255],   # Class 1: Oil Spill (Cyan)
    [255, 0, 0],     # Class 2: Look-alike (Red)
    [153, 76, 0],    # Class 3: Ship (Brown)
    [0, 153, 0],     # Class 4: Land (Green)
]

# Standard class metadata for 5-class SAR oil-spill segmentation
CLASS_METADATA: List[Dict[str, Any]] = [
    {
        "index": 0,
        "name": "Sea Surface",
        "code": "sea_surface",
        "color_rgb": [0, 0, 0],
        "color_hex": "#000000",
        "is_background": True,
        "description": "Background sea surface water body."
    },
    {
        "index": 1,
        "name": "Oil Spill",
        "code": "oil_spill",
        "color_rgb": [0, 255, 255],
        "color_hex": "#00FFFF",
        "is_background": False,
        "description": "Confirmed mineral or petroleum oil spill slick on SAR."
    },
    {
        "index": 2,
        "name": "Look-alike",
        "code": "look_alike",
        "color_rgb": [255, 0, 0],
        "color_hex": "#FF0000",
        "is_background": False,
        "description": "Low backscatter look-alike feature (e.g. biogenic slicks, calm seas, wind shadows)."
    },
    {
        "index": 3,
        "name": "Ship",
        "code": "ship",
        "color_rgb": [153, 76, 0],
        "color_hex": "#994C00",
        "is_background": False,
        "description": "Vessel / ship target characterized by high backscatter."
    },
    {
        "index": 4,
        "name": "Land",
        "code": "land",
        "color_rgb": [0, 153, 0],
        "color_hex": "#009900",
        "is_background": False,
        "description": "Coastal terrain, islands, or land masses."
    }
]

BACKGROUND_CLASS_INDEX: int = 0
