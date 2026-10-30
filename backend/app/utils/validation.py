"""
Image Validation Utilities.
Provides robust checks for file size, MIME format, image integrity, dimensions,
and memory safety to prevent decompression bomb vulnerabilities and corrupt uploads.
"""

import io
from typing import Tuple, Dict, Any
from PIL import Image
import numpy as np
import cv2

from app.config import settings

# Enforce reasonable limit to prevent decompression bombs (e.g. 50 megapixels)
Image.MAX_IMAGE_PIXELS = 50_000_000

SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".webp"}


class ImageValidationError(Exception):
    """Raised when an uploaded file fails validation."""
    pass


def validate_and_decode_upload(file_bytes: bytes, filename: str) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Validates uploaded raw bytes and decodes them into an OpenCV BGR image array.
    
    Args:
        file_bytes: Raw bytes from the uploaded file.
        filename: Original file name.
        
    Returns:
        Tuple of (decoded_bgr_array, image_metadata_dict)
        
    Raises:
        ImageValidationError if the file is invalid, corrupt, or exceeds limits.
    """
    if not file_bytes or len(file_bytes) == 0:
        raise ImageValidationError("Uploaded file is empty (0 bytes).")

    # 1. Size check
    file_size_mb = len(file_bytes) / (1024 * 1024)
    if file_size_mb > settings.MAX_UPLOAD_SIZE_MB:
        raise ImageValidationError(
            f"File size ({file_size_mb:.2f} MB) exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB} MB."
        )

    # 2. PIL integrity check & format validation
    try:
        pil_img = Image.open(io.BytesIO(file_bytes))
        pil_img.verify()  # Verifies file integrity without full decoding
        img_format = pil_img.format
    except Exception as e:
        raise ImageValidationError(f"Invalid or corrupted image format: {str(e)}")

    # 3. Decode image with PIL to check dimensions
    try:
        pil_img = Image.open(io.BytesIO(file_bytes))
        width, height = pil_img.size
    except Exception as e:
        raise ImageValidationError(f"Failed to read image dimensions: {str(e)}")

    if width < 16 or height < 16:
        raise ImageValidationError(
            f"Image dimensions ({width}x{height}) are too small for SAR segmentation. Minimum 16x16 required."
        )

    if width > settings.MAX_IMAGE_DIMENSION or height > settings.MAX_IMAGE_DIMENSION:
        raise ImageValidationError(
            f"Image dimensions ({width}x{height}) exceed maximum allowed dimension ({settings.MAX_IMAGE_DIMENSION}px)."
        )

    # 4. Decode into numpy array with OpenCV
    # Using np.frombuffer and cv2.imdecode
    np_buffer = np.frombuffer(file_bytes, np.uint8)
    # cv2.IMREAD_UNCHANGED to inspect raw channels first
    raw_img = cv2.imdecode(np_buffer, cv2.IMREAD_UNCHANGED)
    
    if raw_img is None:
        raise ImageValidationError("OpenCV failed to decode the image file.")

    original_channels = 1 if len(raw_img.shape) == 2 else raw_img.shape[2]

    # Convert to standard 3-channel BGR as expected by the OpenCV pipeline
    if len(raw_img.shape) == 2:
        # Grayscale -> BGR
        bgr_image = cv2.cvtColor(raw_img, cv2.COLOR_GRAY2BGR)
    elif raw_img.shape[2] == 4:
        # BGRA -> BGR (drop alpha channel safely)
        bgr_image = cv2.cvtColor(raw_img, cv2.COLOR_BGRA2BGR)
    elif raw_img.shape[2] == 3:
        bgr_image = raw_img
    else:
        raise ImageValidationError(f"Unsupported number of image channels: {raw_img.shape[2]}")

    metadata = {
        "filename": filename,
        "original_width": width,
        "original_height": height,
        "original_channels": original_channels,
        "original_format": img_format,
        "file_size_bytes": len(file_bytes),
        "file_size_mb": round(file_size_mb, 3)
    }

    return bgr_image, metadata
