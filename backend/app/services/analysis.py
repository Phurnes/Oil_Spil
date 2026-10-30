"""
Quantitative Research Analysis Service.
Computes rigorous, reproducible statistical metrics from the model prediction:
- Class-wise pixel distribution and percentages
- Mean class probabilities across the full spatial domain
- Maximum softmax probability summary statistics (mean, median, std, min, max)
- Probability distribution histograms
- 8-connected component analysis (component counts, centroids, bounding boxes, size distributions)
- Low-confidence region quantification
"""

from typing import Dict, Any, List
import numpy as np
import cv2

from app.config import settings, CLASS_METADATA, BACKGROUND_CLASS_INDEX
from app.schemas import (
    QuantitativeAnalysis,
    ClassStatistic,
    ProbabilityStatistics,
    ProbabilityHistogram,
    ClassComponentAnalysis,
    ComponentDetail,
    BoundingBox
)


def perform_quantitative_analysis(
    discrete_mask: np.ndarray,
    max_probability_map: np.ndarray,
    per_class_probabilities: np.ndarray,
    low_confidence_threshold: float = 0.60,
    min_component_size: int = 10,
    num_histogram_bins: int = 10
) -> QuantitativeAnalysis:
    """
    Performs comprehensive numerical analysis on model predictions.
    
    Args:
        discrete_mask: (256, 256) array of predicted class indices (0..4)
        max_probability_map: (256, 256) array of maximum softmax probabilities
        per_class_probabilities: (256, 256, 5) array of per-class probabilities
        low_confidence_threshold: Cutoff for flagging low confidence
        min_component_size: Minimum pixel area to retain in component statistics
        num_histogram_bins: Number of bins for probability histogram
        
    Returns:
        Structured QuantitativeAnalysis schema instance.
    """
    total_pixels = discrete_mask.size
    class_stats: List[ClassStatistic] = []
    classes_present_count = 0

    # 1. Class-wise pixel counts, percentages, and mean probabilities
    for meta in CLASS_METADATA:
        idx = meta["index"]
        pixel_count = int(np.sum(discrete_mask == idx))
        if pixel_count > 0:
            classes_present_count += 1
            
        percentage = round((pixel_count / total_pixels) * 100.0, 4) if total_pixels > 0 else 0.0
        
        # Mean predicted probability of this class across the entire spatial domain
        mean_prob = float(np.mean(per_class_probabilities[:, :, idx]))
        
        class_stats.append(ClassStatistic(
            index=idx,
            name=meta["name"],
            color_hex=meta["color_hex"],
            color_rgb=meta["color_rgb"],
            is_background=meta["is_background"],
            pixel_count=pixel_count,
            percentage=percentage,
            mean_probability=round(mean_prob, 5)
        ))

    # 2. Maximum softmax probability summary statistics
    flat_max_probs = max_probability_map.flatten()
    prob_stats = ProbabilityStatistics(
        mean=round(float(np.mean(flat_max_probs)), 5),
        median=round(float(np.median(flat_max_probs)), 5),
        std=round(float(np.std(flat_max_probs)), 5),
        min=round(float(np.min(flat_max_probs)), 5),
        max=round(float(np.max(flat_max_probs)), 5)
    )

    # 3. Histogram of maximum softmax probabilities
    # Softmax probabilities range from 0.20 (random 5-class guess) to 1.00
    counts, bin_edges = np.histogram(flat_max_probs, bins=num_histogram_bins, range=(0.0, 1.0))
    frequencies = (counts / total_pixels).tolist()
    
    histogram = ProbabilityHistogram(
        bin_edges=[round(float(b), 3) for b in bin_edges],
        counts=[int(c) for c in counts],
        frequencies=[round(float(f), 5) for f in frequencies]
    )

    # 4. Connected-component analysis (using 8-connectivity)
    connected_components: List[ClassComponentAnalysis] = []
    
    for meta in CLASS_METADATA:
        idx = meta["index"]
        class_name = meta["name"]
        
        # Binary mask for the current class
        binary_mask = (discrete_mask == idx).astype(np.uint8)
        class_total_pixels = int(np.sum(binary_mask))
        
        if class_total_pixels == 0:
            # Handle empty class gracefully
            connected_components.append(ClassComponentAnalysis(
                class_index=idx,
                class_name=class_name,
                total_components_detected=0,
                filtered_components_count=0,
                min_component_size_threshold=min_component_size,
                largest_component_pixels=0,
                largest_component_percentage=0.0,
                mean_component_size=0.0,
                components=[]
            ))
            continue

        # Run 8-connected components with stats
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(
            binary_mask, connectivity=8
        )
        
        # Note: label 0 is background (where binary_mask == 0)
        # Components of interest are labels 1 to num_labels - 1
        raw_component_count = max(0, num_labels - 1)
        valid_components: List[ComponentDetail] = []
        sizes: List[int] = []

        for label_id in range(1, num_labels):
            area = int(stats[label_id, cv2.CC_STAT_AREA])
            sizes.append(area)
            
            # Filter tiny noisy components if threshold is set
            if area < min_component_size:
                continue

            x = int(stats[label_id, cv2.CC_STAT_LEFT])
            y = int(stats[label_id, cv2.CC_STAT_TOP])
            w = int(stats[label_id, cv2.CC_STAT_WIDTH])
            h = int(stats[label_id, cv2.CC_STAT_HEIGHT])
            cx, cy = float(centroids[label_id][0]), float(centroids[label_id][1])
            
            comp_pct = round((area / class_total_pixels) * 100.0, 3) if class_total_pixels > 0 else 0.0

            valid_components.append(ComponentDetail(
                component_id=label_id,
                pixel_count=area,
                percentage_of_class=comp_pct,
                bounding_box=BoundingBox(
                    x_min=x,
                    y_min=y,
                    x_max=x + w,
                    y_max=y + h,
                    width=w,
                    height=h
                ),
                centroid_x=round(cx, 2),
                centroid_y=round(cy, 2)
            ))

        # Sort valid components descending by size
        valid_components.sort(key=lambda c: c.pixel_count, reverse=True)
        
        largest_pixels = int(max(sizes)) if sizes else 0
        largest_pct = float(round((largest_pixels / class_total_pixels) * 100.0, 3)) if class_total_pixels > 0 else 0.0
        mean_size = float(round(float(np.mean(sizes)), 2)) if sizes else 0.0

        connected_components.append(ClassComponentAnalysis(
            class_index=int(idx),
            class_name=class_name,
            total_components_detected=int(raw_component_count),
            filtered_components_count=int(len(valid_components)),
            min_component_size_threshold=int(min_component_size),
            largest_component_pixels=int(largest_pixels),
            largest_component_percentage=float(largest_pct),
            mean_component_size=float(mean_size),
            components=valid_components
        ))

    # 5. Low-confidence statistics
    low_conf_pixels = int(np.sum(max_probability_map < low_confidence_threshold))
    low_conf_pct = float(round((low_conf_pixels / total_pixels) * 100.0, 3))

    return QuantitativeAnalysis(
        total_predicted_pixels=int(total_pixels),
        classes_present_count=int(classes_present_count),
        class_statistics=class_stats,
        max_probability_statistics=prob_stats,
        max_probability_histogram=histogram,
        connected_components=connected_components,
        low_confidence_threshold_used=float(low_confidence_threshold),
        low_confidence_pixel_count=int(low_conf_pixels),
        low_confidence_percentage=float(low_conf_pct)
    )
