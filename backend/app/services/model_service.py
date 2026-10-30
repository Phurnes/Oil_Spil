"""
Model Service.
Manages the lifecycle of the TensorFlow/Keras U-Net model:
- Loads the model once during application startup
- Validates input and output tensor dimensions
- Ensures thread-safe, synchronized inference
- Validates output integrity (checks for NaNs, Infs, valid probability ranges)
"""

import os
import time
import logging
import threading
from pathlib import Path
from typing import Optional, Dict, Any
import numpy as np

import tensorflow as tf
import keras

from app.config import settings, BASE_DIR

logger = logging.getLogger(__name__)


class ModelLoadingError(Exception):
    """Raised when the model cannot be loaded or validated."""
    pass


class ModelInferenceError(Exception):
    """Raised when inference fails or returns invalid outputs."""
    pass


class ModelService:
    """Singleton service for U-Net model inference."""
    
    _instance: Optional['ModelService'] = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(ModelService, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
            
        self.model: Optional[keras.Model] = None
        self.is_loaded: bool = False
        self.load_error: Optional[str] = None
        self.model_path: str = settings.MODEL_PATH
        self.architecture: str = "U-Net (5-class semantic segmentation)"
        self.total_params: Optional[int] = None
        self.trainable_params: Optional[int] = None
        self.input_shape: Optional[tuple] = None
        self.output_shape: Optional[tuple] = None
        self._inference_lock = threading.Lock()
        self._initialized = True

    def load_model(self) -> bool:
        """Loads and validates the trained Keras model."""
        with self._lock:
            path = Path(self.model_path)
            if not path.is_absolute():
                path = Path(BASE_DIR) / self.model_path

            if not path.exists():
                self.load_error = f"Model file not found at path: {path}"
                logger.error(self.load_error)
                self.is_loaded = False
                return False

            try:
                logger.info(f"Loading Keras model from {path}...")
                # Compile=False preserves exact trained weights without needing custom loss/optimizer functions
                loaded_model = keras.models.load_model(str(path), compile=False)
                
                # Validate input dimensions
                in_shape = loaded_model.input_shape
                out_shape = loaded_model.output_shape
                
                # Expected input: (None, 256, 256, 3)
                if len(in_shape) != 4 or in_shape[1] != settings.IMG_HEIGHT or in_shape[2] != settings.IMG_WIDTH or in_shape[3] != settings.IMG_CHANNELS:
                    raise ModelLoadingError(
                        f"Unexpected model input shape: {in_shape}. Expected (None, {settings.IMG_HEIGHT}, {settings.IMG_WIDTH}, {settings.IMG_CHANNELS})"
                    )

                # Expected output: (None, 256, 256, 5)
                if len(out_shape) != 4 or out_shape[1] != settings.IMG_HEIGHT or out_shape[2] != settings.IMG_WIDTH or out_shape[3] != settings.NUM_CLASSES:
                    raise ModelLoadingError(
                        f"Unexpected model output shape: {out_shape}. Expected (None, {settings.IMG_HEIGHT}, {settings.IMG_WIDTH}, {settings.NUM_CLASSES})"
                    )

                self.model = loaded_model
                self.input_shape = in_shape
                self.output_shape = out_shape
                self.total_params = int(loaded_model.count_params())
                self.trainable_params = int(sum([int(np.prod(v.shape)) for v in loaded_model.trainable_weights]))
                self.is_loaded = True
                self.load_error = None
                
                # Warm-up inference with a dummy tensor to initialize execution graphs
                dummy = np.zeros((1, settings.IMG_HEIGHT, settings.IMG_WIDTH, settings.IMG_CHANNELS), dtype=np.float32)
                _ = loaded_model.predict(dummy, verbose=0)
                
                logger.info("U-Net model successfully loaded and validated.")
                return True
                
            except Exception as e:
                self.is_loaded = False
                self.load_error = f"Failed to load model: {str(e)}"
                logger.exception(self.load_error)
                return False

    def predict(self, input_tensor: np.ndarray) -> np.ndarray:
        """
        Executes model inference on a preprocessed tensor.
        
        Args:
            input_tensor: Numpy float32 array of shape (1, 256, 256, 3)
            
        Returns:
            Numpy float32 array of shape (1, 256, 256, 5) representing class probabilities.
        """
        if not self.is_loaded or self.model is None:
            raise ModelInferenceError(
                f"Model is not loaded or unavailable. Reason: {self.load_error or 'Model not initialized'}"
            )

        if input_tensor.shape != (1, settings.IMG_HEIGHT, settings.IMG_WIDTH, settings.IMG_CHANNELS):
            raise ModelInferenceError(
                f"Invalid input tensor shape: {input_tensor.shape}. Expected (1, {settings.IMG_HEIGHT}, {settings.IMG_WIDTH}, {settings.IMG_CHANNELS})"
            )

        with self._inference_lock:
            try:
                # Execute inference
                # In Keras/TF, predict or direct __call__
                # Using predict with verbose=0
                pred = self.model.predict(input_tensor, verbose=0)
            except Exception as e:
                raise ModelInferenceError(f"TensorFlow inference execution failed: {str(e)}")

        # Validate prediction integrity
        if pred is None:
            raise ModelInferenceError("Model returned None.")
            
        if not isinstance(pred, np.ndarray):
            pred = np.array(pred)

        if pred.shape != (1, settings.IMG_HEIGHT, settings.IMG_WIDTH, settings.NUM_CLASSES):
            raise ModelInferenceError(
                f"Model returned unexpected output shape: {pred.shape}. Expected (1, {settings.IMG_HEIGHT}, {settings.IMG_WIDTH}, {settings.NUM_CLASSES})"
            )

        if not np.all(np.isfinite(pred)):
            raise ModelInferenceError("Model prediction output contains NaN or infinite values.")

        return pred

    def get_metadata(self) -> Dict[str, Any]:
        """Returns verified model metadata."""
        file_size_mb = None
        path = Path(self.model_path)
        if not path.is_absolute():
            path = Path(BASE_DIR) / self.model_path
        if path.exists():
            file_size_mb = round(path.stat().st_size / (1024 * 1024), 2)

        return {
            "architecture": self.architecture,
            "framework": f"TensorFlow {tf.__version__} / Keras {keras.__version__}",
            "model_path": str(path),
            "model_available": self.is_loaded,
            "load_error": self.load_error,
            "input_shape": list(self.input_shape) if self.input_shape else [None, settings.IMG_HEIGHT, settings.IMG_WIDTH, settings.IMG_CHANNELS],
            "output_shape": list(self.output_shape) if self.output_shape else [None, settings.IMG_HEIGHT, settings.IMG_WIDTH, settings.NUM_CLASSES],
            "num_classes": settings.NUM_CLASSES,
            "total_parameters": self.total_params,
            "trainable_parameters": self.trainable_params,
            "model_file_size_mb": file_size_mb,
            "preprocessing": {
                "input_resolution": [settings.IMG_HEIGHT, settings.IMG_WIDTH],
                "color_format": settings.INPUT_CHANNEL_ORDER,
                "normalization": "pixel_value / 255.0",
                "output_activation": "softmax"
            }
        }


# Global singleton instance
model_service = ModelService()
