"""
SAR Image Preprocessing Service.
Faithfully reproduces the training-time preprocessing procedure from the original notebook:
1. Receives OpenCV BGR decoded image
2. Resizes to (256, 256)
3. Normalizes pixel values by dividing by 255.0
4. Formats as float32 tensor with batch dimension (1, 256, 256, 3)
"""

import cv2
import numpy as np
from typing import Tuple
from app.config import settings


def preprocess_image_for_model(
    bgr_image: np.ndarray
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Prepares an input OpenCV BGR image for U-Net model inference.
    
    Args:
        bgr_image: Numpy array of shape (H, W, 3) in BGR color order.
        
    Returns:
        Tuple of:
            - model_input_tensor: shape (1, 256, 256, 3), dtype float32, range [0.0, 1.0]
            - resized_bgr_image: shape (256, 256, 3), uint8, range [0, 255]
    """
    target_h = settings.IMG_HEIGHT
    target_w = settings.IMG_WIDTH
    
    # 1. Resize to model dimensions (256x256)
    # Using INTER_LINEAR for continuous SAR radar backscatter intensity
    resized_bgr = cv2.resize(bgr_image, (target_w, target_h), interpolation=cv2.INTER_LINEAR)
    
    # 2. Convert to float32 and normalize to [0, 1] by dividing by 255.0
    # Exactly matching the notebook: `image = image / 255.0`
    normalized = resized_bgr.astype(np.float32) / 255.0
    
    # 3. Add batch dimension: (1, 256, 256, 3)
    input_tensor = np.expand_dims(normalized, axis=0)
    
    return input_tensor, resized_bgr
