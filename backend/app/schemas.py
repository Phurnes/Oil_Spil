"""
Pydantic Schemas for API Requests, Responses, and Statistical Metrics.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., description="Application operational status ('ok', 'degraded', 'error')")
    model_loaded: bool = Field(..., description="Whether the TensorFlow/Keras model is loaded and ready")
    tensorflow_version: str = Field(..., description="TensorFlow runtime version")
    keras_version: str = Field(..., description="Keras runtime version")
    model_path: str = Field(..., description="Configured path to model weights")
    expected_input_shape: List[Optional[int]] = Field(..., description="Expected tensor input shape")
    num_classes: int = Field(..., description="Number of segmentation classes")


class ClassInfo(BaseModel):
    index: int
    name: str
    code: str
    color_rgb: List[int]
    color_hex: str
    is_background: bool
    description: str


class ModelInfoResponse(BaseModel):
    architecture: str
    framework: str
    input_shape: List[Optional[int]]
    output_shape: List[Optional[int]]
    num_classes: int
    classes: List[ClassInfo]
    preprocessing: Dict[str, Any]
    model_available: bool
    model_file_size_mb: Optional[float] = None
    total_parameters: Optional[int] = None
    trainable_parameters: Optional[int] = None


class ClassStatistic(BaseModel):
    index: int
    name: str
    color_hex: str
    color_rgb: List[int]
    is_background: bool
    pixel_count: int
    percentage: float
    mean_probability: float


class ProbabilityStatistics(BaseModel):
    mean: float
    median: float
    std: float
    min: float
    max: float


class ProbabilityHistogram(BaseModel):
    bin_edges: List[float]
    counts: List[int]
    frequencies: List[float]


class BoundingBox(BaseModel):
    x_min: int
    y_min: int
    x_max: int
    y_max: int
    width: int
    height: int


class ComponentDetail(BaseModel):
    component_id: int
    pixel_count: int
    percentage_of_class: float
    bounding_box: BoundingBox
    centroid_x: float
    centroid_y: float


class ClassComponentAnalysis(BaseModel):
    class_index: int
    class_name: str
    total_components_detected: int
    filtered_components_count: int
    min_component_size_threshold: int
    largest_component_pixels: int
    largest_component_percentage: float
    mean_component_size: float
    components: List[ComponentDetail]


class ImageMetadata(BaseModel):
    original_width: int
    original_height: int
    original_channels: int
    original_format: Optional[str] = None
    model_width: int
    model_height: int
    model_channels: int


class TimingDetails(BaseModel):
    image_decode_ms: float
    preprocessing_ms: float
    inference_ms: float
    postprocessing_ms: float
    visualization_ms: float
    total_backend_ms: float


class ClassMaskArtifact(BaseModel):
    class_index: int
    class_name: str
    color_hex: str
    mask_png_base64: str


class ClassProbabilityArtifact(BaseModel):
    class_index: int
    class_name: str
    color_hex: str
    heatmap_png_base64: str


class VisualArtifacts(BaseModel):
    original_image_png: str
    segmentation_mask_png: str
    overlay_png: str
    maximum_probability_heatmap_png: str
    low_confidence_mask_png: str
    discrete_class_id_mask_png: str
    class_masks: List[ClassMaskArtifact]
    class_probability_heatmaps: List[ClassProbabilityArtifact]


class QuantitativeAnalysis(BaseModel):
    total_predicted_pixels: int
    classes_present_count: int
    class_statistics: List[ClassStatistic]
    max_probability_statistics: ProbabilityStatistics
    max_probability_histogram: ProbabilityHistogram
    connected_components: List[ClassComponentAnalysis]
    low_confidence_threshold_used: float
    low_confidence_pixel_count: int
    low_confidence_percentage: float


class PredictionResponse(BaseModel):
    success: bool
    filename: str
    image_metadata: ImageMetadata
    model_metadata: Dict[str, Any]
    analysis: QuantitativeAnalysis
    timings: TimingDetails
    artifacts: VisualArtifacts
    scientific_disclaimer: str
