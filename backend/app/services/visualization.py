"""
Visualization Artifact Generation Service.
Generates research-grade image artifacts for visual inspection and export:
- Original SAR image
- Color-coded segmentation mask
- Semi-transparent overlay with configurable opacity
- Maximum softmax probability heatmap (using scientific colormaps)
- Low-confidence region visualization
- Discrete class-ID 8-bit PNG mask (values 0..4)
- Individual class binary masks
- Per-class probability heatmaps
"""

import io
import base64
from typing import Dict, Any, List
import numpy as np
import cv2
from PIL import Image

from app.config import settings, CLASS_METADATA, COLOR_MAP_RGB
from app.schemas import VisualArtifacts, ClassMaskArtifact, ClassProbabilityArtifact


def encode_image_to_base64_png(image_array: np.ndarray, is_bgr: bool = False) -> str:
    """Encodes a uint8 numpy array (RGB, BGR, or Grayscale) to a base64 PNG data URL."""
    if is_bgr:
        rgb_array = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)
    else:
        rgb_array = image_array

    pil_img = Image.fromarray(rgb_array)
    buffer = io.BytesIO()
    pil_img.save(buffer, format="PNG", optimize=True)
    b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64_str}"


def encode_raw_grayscale_mask_to_base64(mask_2d: np.ndarray) -> str:
    """Encodes an 8-bit discrete mask (values 0..4) to a pure uncompressed PNG data URL."""
    pil_img = Image.fromarray(mask_2d.astype(np.uint8), mode="L")
    buffer = io.BytesIO()
    pil_img.save(buffer, format="PNG")
    b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64_str}"


def generate_visualization_artifacts(
    original_bgr: np.ndarray,
    resized_bgr: np.ndarray,
    discrete_mask: np.ndarray,
    color_mask_rgb: np.ndarray,
    max_probability_map: np.ndarray,
    per_class_probabilities: np.ndarray,
    low_confidence_mask: np.ndarray,
    overlay_opacity: float = 0.50
) -> VisualArtifacts:
    """
    Generates all downloadable and viewable visual artifacts.
    """
    # 1. Original SAR image (convert BGR to RGB for web display)
    original_rgb = cv2.cvtColor(resized_bgr, cv2.COLOR_BGR2RGB)
    original_png_b64 = encode_image_to_base64_png(original_rgb)

    # 2. Color-coded segmentation mask
    color_mask_png_b64 = encode_image_to_base64_png(color_mask_rgb)

    # 3. Semi-transparent overlay: blend original image with color mask
    # cv2.addWeighted: original * (1 - alpha) + color_mask * alpha
    alpha = float(np.clip(overlay_opacity, 0.0, 1.0))
    overlay_rgb = cv2.addWeighted(original_rgb, 1.0 - alpha, color_mask_rgb, alpha, 0)
    overlay_png_b64 = encode_image_to_base64_png(overlay_rgb)

    # 4. Maximum softmax probability heatmap
    # Convert [0.0, 1.0] to uint8 [0, 255] and apply Turbo/Viridis colormap
    prob_scaled = (np.clip(max_probability_map, 0.0, 1.0) * 255).astype(np.uint8)
    # COLORMAP_TURBO provides high perceptual dynamic range for scientific confidence
    max_prob_bgr = cv2.applyColorMap(prob_scaled, cv2.COLORMAP_TURBO)
    max_prob_rgb = cv2.cvtColor(max_prob_bgr, cv2.COLOR_BGR2RGB)
    max_prob_png_b64 = encode_image_to_base64_png(max_prob_rgb)

    # 5. Low-confidence mask: highlight flagged regions in amber/red over grayscale original
    # Convert original to grayscale then BGR
    gray_bg = cv2.cvtColor(cv2.cvtColor(resized_bgr, cv2.COLOR_BGR2GRAY), cv2.COLOR_GRAY2RGB)
    low_conf_vis = gray_bg.copy()
    # Paint low-confidence pixels bright orange-red [255, 69, 0]
    low_conf_bool = low_confidence_mask > 0
    low_conf_vis[low_conf_bool] = (
        (low_conf_vis[low_conf_bool].astype(float) * 0.3) + (np.array([255, 69, 0]) * 0.7)
    ).astype(np.uint8)
    low_conf_png_b64 = encode_image_to_base64_png(low_conf_vis)

    # 6. Discrete 8-bit Class-ID mask (pure literal IDs 0, 1, 2, 3, 4)
    discrete_mask_b64 = encode_raw_grayscale_mask_to_base64(discrete_mask)

    # 7. Individual class masks
    class_masks_artifacts: List[ClassMaskArtifact] = []
    for meta in CLASS_METADATA:
        idx = meta["index"]
        # Isolated class mask on black background
        isolated_vis = np.zeros_like(color_mask_rgb)
        isolated_vis[discrete_mask == idx] = meta["color_rgb"]
        class_masks_artifacts.append(ClassMaskArtifact(
            class_index=idx,
            class_name=meta["name"],
            color_hex=meta["color_hex"],
            mask_png_base64=encode_image_to_base64_png(isolated_vis)
        ))

    # 8. Individual class probability heatmaps
    class_prob_artifacts: List[ClassProbabilityArtifact] = []
    for meta in CLASS_METADATA:
        idx = meta["index"]
        c_prob = per_class_probabilities[:, :, idx]
        c_prob_scaled = (np.clip(c_prob, 0.0, 1.0) * 255).astype(np.uint8)
        c_prob_bgr = cv2.applyColorMap(c_prob_scaled, cv2.COLORMAP_VIRIDIS)
        c_prob_rgb = cv2.cvtColor(c_prob_bgr, cv2.COLOR_BGR2RGB)
        class_prob_artifacts.append(ClassProbabilityArtifact(
            class_index=idx,
            class_name=meta["name"],
            color_hex=meta["color_hex"],
            heatmap_png_base64=encode_image_to_base64_png(c_prob_rgb)
        ))

    return VisualArtifacts(
        original_image_png=original_png_b64,
        segmentation_mask_png=color_mask_png_b64,
        overlay_png=overlay_png_b64,
        maximum_probability_heatmap_png=max_prob_png_b64,
        low_confidence_mask_png=low_conf_png_b64,
        discrete_class_id_mask_png=discrete_mask_b64,
        class_masks=class_masks_artifacts,
        class_probability_heatmaps=class_prob_artifacts
    )
