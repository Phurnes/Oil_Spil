"""
Unit tests for Image Validation and Preprocessing.
"""

import io
import pytest
import numpy as np
import cv2
from PIL import Image

from app.utils.validation import validate_and_decode_upload, ImageValidationError
from app.services.preprocessing import preprocess_image_for_model
from app.config import settings


def create_dummy_png_bytes(width=100, height=100, color=(128, 128, 128), mode="RGB") -> bytes:
    """Helper to create valid in-memory image bytes."""
    img = Image.new(mode, (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_validate_and_decode_valid_rgb():
    raw_bytes = create_dummy_png_bytes(300, 200, color=(50, 100, 150), mode="RGB")
    bgr_img, meta = validate_and_decode_upload(raw_bytes, "test_sar.png")
    
    assert bgr_img is not None
    assert bgr_img.shape == (200, 300, 3)
    assert meta["original_width"] == 300
    assert meta["original_height"] == 200
    assert meta["original_channels"] == 3
    assert meta["filename"] == "test_sar.png"


def test_validate_and_decode_grayscale():
    raw_bytes = create_dummy_png_bytes(256, 256, color=100, mode="L")
    bgr_img, meta = validate_and_decode_upload(raw_bytes, "gray_sar.png")
    
    assert bgr_img is not None
    assert bgr_img.shape == (256, 256, 3)  # Converted to 3-channel BGR
    assert meta["original_channels"] == 1


def test_validate_and_decode_rgba():
    raw_bytes = create_dummy_png_bytes(128, 128, color=(10, 20, 30, 255), mode="RGBA")
    bgr_img, meta = validate_and_decode_upload(raw_bytes, "rgba_sar.png")
    
    assert bgr_img is not None
    assert bgr_img.shape == (128, 128, 3)  # Alpha safely removed


def test_reject_empty_bytes():
    with pytest.raises(ImageValidationError, match="empty"):
        validate_and_decode_upload(b"", "empty.png")


def test_reject_corrupted_file():
    corrupted = b"NOT_A_VALID_IMAGE_HEADER_12345"
    with pytest.raises(ImageValidationError):
        validate_and_decode_upload(corrupted, "corrupt.png")


def test_reject_too_small_dimensions():
    tiny = create_dummy_png_bytes(8, 8)
    with pytest.raises(ImageValidationError, match="too small"):
        validate_and_decode_upload(tiny, "tiny.png")


def test_preprocessing_pipeline_normalization_and_shape():
    dummy_bgr = np.full((512, 512, 3), 204, dtype=np.uint8)
    input_tensor, resized = preprocess_image_for_model(dummy_bgr)
    
    assert input_tensor.shape == (1, settings.IMG_HEIGHT, settings.IMG_WIDTH, settings.IMG_CHANNELS)
    assert resized.shape == (settings.IMG_HEIGHT, settings.IMG_WIDTH, settings.IMG_CHANNELS)
    assert input_tensor.dtype == np.float32
    # 204 / 255.0 = 0.8
    assert np.isclose(input_tensor[0, 0, 0, 0], 0.8, atol=1e-3)
    assert input_tensor.min() >= 0.0
    assert input_tensor.max() <= 1.0
