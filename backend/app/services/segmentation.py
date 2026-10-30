"""
Segmentation Postprocessing Service.
Converts model probability distributions into discrete segmentation masks,
confidence maps, individual class masks, and color-coded representations.
"""

from typing import Tuple, Dict, List, Any
import numpy as np
import cv2

from app.config import settings, COLOR_MAP_RGB, CLASS_METADATA


def compute_segmentation_maps(
    prediction_probabilities: np.ndarray,
    low_confidence_threshold: float = 0.60
) -> Dict[str, Any]:
    """
    Processes model output tensor into segmentation masks and confidence surfaces.
    
    Args:
        prediction_probabilities: Array of shape (1, 256, 256, 5) or (256, 256, 5)
        low_confidence_threshold: Cutoff for flagging low-confidence predictions (default 0.60)
        
    Returns:
        Dict containing:
            - discrete_mask: (256, 256) uint8 class IDs (0..4)
            - max_probability_map: (256, 256) float32 maximum softmax confidence
            - color_mask_rgb: (256, 256, 3) uint8 RGB image
            - class_binary_masks: dict mapping class_idx -> (256, 256) uint8 binary mask (0 or 255)
            - per_class_probabilities: (256, 256, 5) float32 probabilities
            - low_confidence_mask: (256, 256) uint8 binary mask (255 where max_prob < threshold)
    """
    probs = prediction_probabilities[0] if len(prediction_probabilities.shape) == 4 else prediction_probabilities
    
    if probs.shape != (settings.IMG_HEIGHT, settings.IMG_WIDTH, settings.NUM_CLASSES):
        raise ValueError(
            f"Expected probability array shape ({settings.IMG_HEIGHT}, {settings.IMG_WIDTH}, {settings.NUM_CLASSES}), got {probs.shape}"
        )

    # 1. Pixel-wise discrete class assignment: argmax across classes (axis=-1)
    discrete_mask = np.argmax(probs, axis=-1).astype(np.uint8)
    
    # 2. Maximum softmax probability at each pixel
    max_probability_map = np.max(probs, axis=-1).astype(np.float32)
    
    # 3. Color-coded RGB segmentation mask
    color_mask_rgb = np.zeros((settings.IMG_HEIGHT, settings.IMG_WIDTH, 3), dtype=np.uint8)
    for class_idx, color in enumerate(COLOR_MAP_RGB):
        color_mask_rgb[discrete_mask == class_idx] = color

    # 4. Binary masks for each class
    class_binary_masks = {}
    for class_idx in range(settings.NUM_CLASSES):
        binary = np.zeros((settings.IMG_HEIGHT, settings.IMG_WIDTH), dtype=np.uint8)
        binary[discrete_mask == class_idx] = 255
        class_binary_masks[class_idx] = binary

    # 5. Low confidence regions
    low_confidence_mask = (max_probability_map < low_confidence_threshold).astype(np.uint8) * 255

    return {
        "discrete_mask": discrete_mask,
        "max_probability_map": max_probability_map,
        "color_mask_rgb": color_mask_rgb,
        "class_binary_masks": class_binary_masks,
        "per_class_probabilities": probs,
        "low_confidence_mask": low_confidence_mask
    }


def resize_mask_nearest(mask: np.ndarray, target_width: int, target_height: int) -> np.ndarray:
    """
    Resizes a discrete integer mask using nearest-neighbor interpolation
    to prevent invalid intermediate class indices.
    """
    return cv2.resize(mask, (target_width, target_height), interpolation=cv2.INTER_NEAREST)
