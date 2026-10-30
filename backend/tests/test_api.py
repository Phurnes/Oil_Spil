"""
Integration tests for FastAPI endpoints using TestClient.
"""

import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from main import app
from app.services.model_service import model_service


@pytest.fixture(scope="module")
def client():
    # Make sure model is loaded for integration tests
    model_service.load_model()
    with TestClient(app) as c:
        yield c


def create_test_image_bytes(width=256, height=256, color=(100, 100, 100)) -> bytes:
    img = Image.new("RGB", (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_root_endpoint(client):
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert "platform" in data
    assert data["docs_url"] == "/docs"


def test_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ("ok", "degraded")
    assert data["num_classes"] == 5
    assert "tensorflow_version" in data
    assert data["model_loaded"] is True


def test_model_info_endpoint(client):
    res = client.get("/api/model-info")
    assert res.status_code == 200
    data = res.json()
    assert data["architecture"] == "U-Net (5-class semantic segmentation)"
    assert data["num_classes"] == 5
    assert len(data["classes"]) == 5
    assert data["model_available"] is True


def test_predict_endpoint_valid_image(client):
    img_bytes = create_test_image_bytes(256, 256, color=(120, 120, 120))
    files = {"file": ("test_sar.png", img_bytes, "image/png")}
    data = {
        "low_confidence_threshold": "0.60",
        "overlay_opacity": "0.50",
        "min_component_size": "10"
    }
    
    res = client.post("/api/predict", files=files, data=data)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["filename"] == "test_sar.png"
    assert "image_metadata" in body
    assert "analysis" in body
    assert "timings" in body
    assert "artifacts" in body
    assert "scientific_disclaimer" in body
    
    # Check artifacts format
    artifacts = body["artifacts"]
    assert artifacts["segmentation_mask_png"].startswith("data:image/png;base64,")
    assert artifacts["overlay_png"].startswith("data:image/png;base64,")
    assert len(artifacts["class_masks"]) == 5
    assert len(artifacts["class_probability_heatmaps"]) == 5


def test_predict_endpoint_invalid_file(client):
    files = {"file": ("bad_file.txt", b"plain text, not an image", "text/plain")}
    res = client.post("/api/predict", files=files)
    assert res.status_code == 400
    assert "validation failed" in res.json()["detail"].lower()
