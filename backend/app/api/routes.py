"""
FastAPI Route Handlers.
Exposes REST endpoints for system health, model metadata, and SAR oil-spill prediction.
"""

import time
import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
import tensorflow as tf
import keras

from app.config import settings, CLASS_METADATA
from app.schemas import (
    HealthResponse,
    ModelInfoResponse,
    PredictionResponse,
    TimingDetails,
    ImageMetadata,
    ClassInfo
)
from app.utils.validation import validate_and_decode_upload, ImageValidationError
from app.services.preprocessing import preprocess_image_for_model
from app.services.model_service import model_service, ModelInferenceError
from app.services.segmentation import compute_segmentation_maps
from app.services.analysis import perform_quantitative_analysis
from app.services.visualization import generate_visualization_artifacts

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["SAR Oil Spill Analysis"])


@router.get("/health", response_model=HealthResponse)
def get_health():
    """
    Returns application and model readiness status.
    Explicitly distinguishes between the web service being running and the U-Net model being loaded.
    """
    is_ready = model_service.is_loaded
    app_status = "ok" if is_ready else "degraded"
    
    return HealthResponse(
        status=app_status,
        model_loaded=is_ready,
        tensorflow_version=tf.__version__,
        keras_version=keras.__version__,
        model_path=str(settings.MODEL_PATH),
        expected_input_shape=[None, settings.IMG_HEIGHT, settings.IMG_WIDTH, settings.IMG_CHANNELS],
        num_classes=settings.NUM_CLASSES
    )


@router.get("/model-info", response_model=ModelInfoResponse)
def get_model_info():
    """
    Returns verified U-Net architecture specifications, preprocessing conventions,
    and class metadata. Does not invent unverified training benchmark statistics.
    """
    meta = model_service.get_metadata()
    
    classes_info = [
        ClassInfo(
            index=c["index"],
            name=c["name"],
            code=c["code"],
            color_rgb=c["color_rgb"],
            color_hex=c["color_hex"],
            is_background=c["is_background"],
            description=c["description"]
        )
        for c in CLASS_METADATA
    ]
    
    return ModelInfoResponse(
        architecture=meta["architecture"],
        framework=meta["framework"],
        input_shape=meta["input_shape"],
        output_shape=meta["output_shape"],
        num_classes=meta["num_classes"],
        classes=classes_info,
        preprocessing=meta["preprocessing"],
        model_available=meta["model_available"],
        model_file_size_mb=meta["model_file_size_mb"],
        total_parameters=meta["total_parameters"],
        trainable_parameters=meta["trainable_parameters"]
    )


@router.post("/predict", response_model=PredictionResponse)
async def predict_sar_image(
    file: UploadFile = File(..., description="SAR image file (PNG, JPEG, TIFF)"),
    low_confidence_threshold: float = Form(
        default=settings.DEFAULT_LOW_CONFIDENCE_THRESHOLD,
        description="Cutoff probability for flagging uncertain predictions (0.0 to 1.0)"
    ),
    overlay_opacity: float = Form(
        default=settings.DEFAULT_OVERLAY_OPACITY,
        description="Alpha blend opacity for segmentation overlay (0.0 to 1.0)"
    ),
    min_component_size: int = Form(
        default=settings.DEFAULT_MIN_COMPONENT_SIZE,
        description="Minimum connected-component size in pixels to include in region analysis"
    )
):
    """
    Runs full inference and research analysis on an uploaded SAR radar image.
    Executes actual U-Net model prediction, postprocessing, quantitative metrics,
    and visual artifact generation.
    """
    t_total_start = time.perf_counter()
    
    # 0. Check model availability
    if not model_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"U-Net model is not loaded or available: {model_service.load_error or 'Check server startup logs.'}"
        )

    # 1. Read & decode uploaded image with validation
    t_decode_start = time.perf_counter()
    try:
        file_bytes = await file.read()
        bgr_image, img_meta = validate_and_decode_upload(file_bytes, file.filename or "unknown.png")
    except ImageValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image validation failed: {str(e)}"
        )
    except Exception as e:
        logger.exception("Unexpected error during file upload reading")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process uploaded file: {str(e)}"
        )
    t_decode_end = time.perf_counter()

    # 2. Preprocess image
    t_prep_start = time.perf_counter()
    try:
        input_tensor, resized_bgr = preprocess_image_for_model(bgr_image)
    except Exception as e:
        logger.exception("Preprocessing error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Preprocessing failed: {str(e)}"
        )
    t_prep_end = time.perf_counter()

    # 3. Model inference
    t_infer_start = time.perf_counter()
    try:
        predictions = model_service.predict(input_tensor)
    except ModelInferenceError as e:
        logger.exception("Inference error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model inference failed: {str(e)}"
        )
    except Exception as e:
        logger.exception("Unexpected inference error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference execution failed: {str(e)}"
        )
    t_infer_end = time.perf_counter()

    # 4. Postprocessing and segmentation map generation
    t_post_start = time.perf_counter()
    try:
        maps = compute_segmentation_maps(
            prediction_probabilities=predictions,
            low_confidence_threshold=low_confidence_threshold
        )
        
        # Quantitative numerical research analysis
        analysis_results = perform_quantitative_analysis(
            discrete_mask=maps["discrete_mask"],
            max_probability_map=maps["max_probability_map"],
            per_class_probabilities=maps["per_class_probabilities"],
            low_confidence_threshold=low_confidence_threshold,
            min_component_size=min_component_size
        )
    except Exception as e:
        logger.exception("Postprocessing/Analysis error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis postprocessing failed: {str(e)}"
        )
    t_post_end = time.perf_counter()

    # 5. Visualization artifacts generation
    t_vis_start = time.perf_counter()
    try:
        visual_artifacts = generate_visualization_artifacts(
            original_bgr=bgr_image,
            resized_bgr=resized_bgr,
            discrete_mask=maps["discrete_mask"],
            color_mask_rgb=maps["color_mask_rgb"],
            max_probability_map=maps["max_probability_map"],
            per_class_probabilities=maps["per_class_probabilities"],
            low_confidence_mask=maps["low_confidence_mask"],
            overlay_opacity=overlay_opacity
        )
    except Exception as e:
        logger.exception("Visualization generation error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Visualization generation failed: {str(e)}"
        )
    t_vis_end = time.perf_counter()
    t_total_end = time.perf_counter()

    # Precise timings in milliseconds
    timings = TimingDetails(
        image_decode_ms=round((t_decode_end - t_decode_start) * 1000.0, 2),
        preprocessing_ms=round((t_prep_end - t_prep_start) * 1000.0, 2),
        inference_ms=round((t_infer_end - t_infer_start) * 1000.0, 2),
        postprocessing_ms=round((t_post_end - t_post_start) * 1000.0, 2),
        visualization_ms=round((t_vis_end - t_vis_start) * 1000.0, 2),
        total_backend_ms=round((t_total_end - t_total_start) * 1000.0, 2)
    )

    image_meta_schema = ImageMetadata(
        original_width=img_meta["original_width"],
        original_height=img_meta["original_height"],
        original_channels=img_meta["original_channels"],
        original_format=img_meta["original_format"],
        model_width=settings.IMG_WIDTH,
        model_height=settings.IMG_HEIGHT,
        model_channels=settings.IMG_CHANNELS
    )

    disclaimer = (
        "RESEARCH DISCLAIMER: Segmentation masks and probabilities produced by this application are "
        "direct outputs of an experimental U-Net model trained on synthetic aperture radar (SAR) imagery. "
        "Model outputs represent statistical likelihoods and do not constitute operational, environmental, "
        "or legal ground-truth. Physical surface area cannot be inferred from pixel counts without georeferenced spatial calibration."
    )

    return PredictionResponse(
        success=True,
        filename=img_meta["filename"],
        image_metadata=image_meta_schema,
        model_metadata=model_service.get_metadata(),
        analysis=analysis_results,
        timings=timings,
        artifacts=visual_artifacts,
        scientific_disclaimer=disclaimer
    )
