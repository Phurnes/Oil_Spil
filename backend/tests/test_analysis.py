"""
Unit tests for Quantitative Research Analysis.
"""

import pytest
import numpy as np

from app.services.analysis import perform_quantitative_analysis
from app.config import settings


def test_quantitative_analysis_metrics():
    # Create deterministic discrete mask (256, 256)
    discrete_mask = np.zeros((256, 256), dtype=np.uint8)
    # Put 100 pixels in Class 1 (Oil Spill) in a contiguous 10x10 block
    discrete_mask[10:20, 10:20] = 1
    # Put 200 pixels in Class 4 (Land) in a contiguous 10x20 block
    discrete_mask[50:60, 50:70] = 4
    
    # Synthetic probability maps
    max_prob_map = np.full((256, 256), 0.90, dtype=np.float32)
    max_prob_map[10:20, 10:20] = 0.85
    max_prob_map[50:60, 50:70] = 0.95
    
    per_class_probs = np.zeros((256, 256, 5), dtype=np.float32)
    per_class_probs[:, :, 0] = 0.80
    per_class_probs[10:20, 10:20, 1] = 0.85
    per_class_probs[50:60, 50:70, 4] = 0.95

    analysis = perform_quantitative_analysis(
        discrete_mask=discrete_mask,
        max_probability_map=max_prob_map,
        per_class_probabilities=per_class_probs,
        low_confidence_threshold=0.60,
        min_component_size=10
    )

    total_pixels = 256 * 256
    assert analysis.total_predicted_pixels == total_pixels
    
    # Check class statistics
    class_stats = {s.index: s for s in analysis.class_statistics}
    
    assert class_stats[1].pixel_count == 100
    assert class_stats[4].pixel_count == 200
    assert class_stats[0].pixel_count == total_pixels - 300
    assert class_stats[2].pixel_count == 0
    assert class_stats[3].pixel_count == 0

    # Verify percentages sum to ~100%
    total_pct = sum(s.percentage for s in analysis.class_statistics)
    assert np.isclose(total_pct, 100.0, atol=0.1)

    # Check connected components for Class 1 (Oil Spill)
    comp_analysis = {c.class_index: c for c in analysis.connected_components}
    c1 = comp_analysis[1]
    assert c1.total_components_detected == 1
    assert c1.largest_component_pixels == 100
    assert len(c1.components) == 1
    assert c1.components[0].bounding_box.width == 10
    assert c1.components[0].bounding_box.height == 10
    # Centroid should be around 14.5
    assert np.isclose(c1.components[0].centroid_x, 14.5, atol=1.0)
    assert np.isclose(c1.components[0].centroid_y, 14.5, atol=1.0)

    # Check empty class component handling (Class 2)
    c2 = comp_analysis[2]
    assert c2.total_components_detected == 0
    assert c2.largest_component_pixels == 0
    assert len(c2.components) == 0

    # Probability summary
    assert analysis.max_probability_statistics.min >= 0.0
    assert analysis.max_probability_statistics.max <= 1.0
    assert analysis.max_probability_statistics.mean > 0.0
