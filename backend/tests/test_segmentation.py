"""
Unit tests for Segmentation Postprocessing.
"""

import pytest
import numpy as np

from app.services.segmentation import compute_segmentation_maps, resize_mask_nearest
from app.config import settings, COLOR_MAP_RGB


def test_segmentation_argmax_assignment():
    # Construct synthetic 5-class probability tensor (1, 256, 256, 5)
    # Give pixel (0, 0) class 1 high prob, pixel (0, 1) class 2 high prob
    probs = np.zeros((1, 256, 256, 5), dtype=np.float32)
    # Default everything to class 0
    probs[:, :, :, 0] = 0.90
    probs[:, :, :, 1] = 0.025
    probs[:, :, :, 2] = 0.025
    probs[:, :, :, 3] = 0.025
    probs[:, :, :, 4] = 0.025
    
    # Specific points
    probs[0, 10, 10] = [0.05, 0.80, 0.05, 0.05, 0.05]  # Class 1 (Oil Spill)
    probs[0, 20, 20] = [0.05, 0.05, 0.85, 0.02, 0.03]  # Class 2 (Look-alike)
    probs[0, 30, 30] = [0.05, 0.05, 0.05, 0.80, 0.05]  # Class 3 (Ship)
    probs[0, 40, 40] = [0.05, 0.05, 0.05, 0.05, 0.80]  # Class 4 (Land)

    maps = compute_segmentation_maps(probs, low_confidence_threshold=0.60)
    
    discrete_mask = maps["discrete_mask"]
    assert discrete_mask.shape == (256, 256)
    assert discrete_mask[0, 0] == 0
    assert discrete_mask[10, 10] == 1
    assert discrete_mask[20, 20] == 2
    assert discrete_mask[30, 30] == 3
    assert discrete_mask[40, 40] == 4

    # Verify colors
    color_mask = maps["color_mask_rgb"]
    assert np.array_equal(color_mask[10, 10], COLOR_MAP_RGB[1])  # Cyan
    assert np.array_equal(color_mask[20, 20], COLOR_MAP_RGB[2])  # Red
    assert np.array_equal(color_mask[30, 30], COLOR_MAP_RGB[3])  # Brown
    assert np.array_equal(color_mask[40, 40], COLOR_MAP_RGB[4])  # Green


def test_low_confidence_thresholding():
    probs = np.full((1, 256, 256, 5), 0.20, dtype=np.float32)  # Uniform uncertain
    maps = compute_segmentation_maps(probs, low_confidence_threshold=0.50)
    
    # Since all max probabilities are 0.20, which is < 0.50, all pixels should be flagged
    assert np.all(maps["low_confidence_mask"] == 255)


def test_nearest_neighbor_mask_resizing():
    # Discrete mask with IDs 1 and 2
    small_mask = np.array([[1, 2], [2, 1]], dtype=np.uint8)
    resized = resize_mask_nearest(small_mask, target_width=10, target_height=10)
    
    assert resized.shape == (10, 10)
    # Nearest neighbor must ONLY contain original discrete classes (1 and 2), no blurred intermediate floats
    unique_classes = set(np.unique(resized))
    assert unique_classes.issubset({1, 2})
