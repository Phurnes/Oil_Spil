# SAR Oil-Spill Detection, Segmentation & Research Analysis Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![TensorFlow](https://img.shields.io/badge/ML-TensorFlow%202.x%20%2F%20Keras%203.x-FF6F00.svg?style=flat&logo=tensorflow)](https://tensorflow.org)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB.svg?style=flat&logo=react)](https://vite.dev)
[![Tests](https://img.shields.io/badge/Tests-16%20Passed-10B981.svg?style=flat)](https://pytest.org)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-3776AB.svg?style=flat&logo=python)](https://python.org)

An interactive, research-grade scientific web application for 5-class semantic segmentation, probability surface estimation, morphological component analysis, and geospatial export of Synthetic Aperture Radar (SAR) imagery. Built around a trained TensorFlow/Keras U-Net deep learning model (`unet_oilspill_model.keras`).

---

## Key Features

- **Trained U-Net Model Execution**: Performs live pixel-wise semantic segmentation using the verified `(256, 256, 3)` BGR normalized model pipeline.
- **5-Class Palette Visualization**:
  - Class 0: Sea Surface (Background) — Black
  - Class 1: Oil Spill (Confirmed slick) — Cyan (`#00FFFF`)
  - Class 2: Look-alike (Low backscatter oceanographic mimic) — Red (`#FF0000`)
  - Class 3: Ship (Vessel target) — Brown (`#994C00`)
  - Class 4: Land (Coastline / Terrain) — Green (`#009900`)
- **8 Visualization Layer Modes**:
  1. Semi-Transparent Overlay (with real-time alpha slider)
  2. Color-Coded Segmentation Mask
  3. Original Raw SAR Backscatter Image
  4. Maximum Softmax Probability Heatmap (Turbo colormap)
  5. Low-Confidence Uncertainty Mask (user-configurable threshold)
  6. 8-Bit Discrete Class-ID Mask (0..4 uncompressed for GIS software)
  7. Isolated Class Binary Masks
  8. Individual Class Probability Heatmaps (Viridis colormap)
- **Quantitative Spatial Analysis**:
  - Exact pixel counts and spatial frame percentages (strictly summing to 100%)
  - Mean class background activation probabilities across the 65,536-pixel domain
  - Maximum softmax probability statistics (Mean, Median, Standard Deviation, Min, Max)
  - Probability distribution histograms
- **8-Connected Morphological Component Analysis**:
  - Contiguous slick/blob clustering using 8-connectivity
  - Ranking table with pixel area, percentage of class, bounding boxes `[X, Y, W, H]`, and centroids `(X, Y)`
  - Noise-filtering threshold to discard high-frequency SAR speckle
- **Full Artifact Export**:
  - Publication-ready PNGs for all visual layers
  - Complete JSON Research Analysis Report with spatial metrics and monotonic execution timings
  - Tabular CSV summary of class distributions
- **Scientific Integrity Guardrails**:
  - Explicit distinction between model softmax outputs and empirical Bayesian calibration
  - Prohibition of unverified accuracy metrics on unlabeled images
  - Visible research disclaimers and area conversion caveats

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, Tailwind-inspired Vanilla CSS design system, Lucide React icons, Recharts |
| **Backend** | Python 3.11–3.13, FastAPI, Uvicorn, TensorFlow 2.x, Keras 3.x, NumPy, OpenCV, Pillow |
| **Testing** | Pytest, FastAPI TestClient, Starlette, HTTPX, Vite build verification |
| **Environment** | Windows 10/11 native batch launcher (`run_project.bat`) |

---

## Directory Structure

```text
oil_spill/
├── backend/
│   ├── main.py                     # FastAPI application entrypoint and lifespan
│   ├── requirements.txt            # Python dependencies
│   ├── .env.example                # Configuration template
│   ├── .env                        # Active environment configuration
│   ├── models/
│   │   └── unet_oilspill_model.keras # Trained U-Net model weights (1.94M params)
│   ├── app/
│   │   ├── config.py               # Centralized settings and verified color maps
│   │   ├── schemas.py              # Pydantic request/response models
│   │   ├── api/
│   │   │   └── routes.py           # REST endpoints (/health, /model-info, /predict)
│   │   ├── services/
│   │   │   ├── model_service.py    # Singleton model loader and thread-safe inference
│   │   │   ├── preprocessing.py    # BGR decoding, resizing, and normalization
│   │   │   ├── segmentation.py     # Argmax postprocessing and mask generation
│   │   │   ├── analysis.py         # Quantitative statistics and connected components
│   │   │   └── visualization.py   # Base64 artifact and colormap generation
│   │   └── utils/
│   │       └── validation.py       # File size, dimension, and format validation
│   └── tests/
│       ├── test_preprocessing.py   # Validation and tensor normalization tests
│       ├── test_segmentation.py    # Argmax, colormap, and nearest-neighbor tests
│       ├── test_analysis.py        # Quantitative statistics and component tests
│       └── test_api.py             # Integration tests for API endpoints
├── frontend/
│   ├── index.html                  # HTML entrypoint with metadata
│   ├── vite.config.js              # Vite dev server and proxy configuration
│   ├── package.json                # Frontend package dependencies
│   ├── public/
│   │   └── samples/                # Benchmark SAR sample images for 1-click loading
│   └── src/
│       ├── main.jsx                # React root mount
│       ├── App.jsx                 # Main application layout and state
│       ├── index.css               # Dark scientific UI styling and tokens
│       ├── api/
│       │   └── client.js           # Centralized API fetch client
│       ├── utils/
│       │   └── download.js         # PNG, JSON, and CSV export helpers
│       └── components/
│           ├── Header.jsx          # Top navigation and status indicators
│           ├── Sidebar.jsx         # Section navigation and class palette
│           ├── ImageUploader.jsx   # Drag-and-drop, sample picker, and sliders
│           ├── ImageViewer.jsx     # Main canvas, zoom, pan, and legend
│           ├── VisualizationPanel.jsx # Layer selector tabs
│           ├── MetricsPanel.jsx    # High-level summary metric cards
│           ├── ClassStatistics.jsx # Recharts bar chart and distribution table
│           ├── ConfidenceAnalysis.jsx # Softmax histogram and uncertainty stats
│           ├── ComponentAnalysis.jsx  # 8-connected morphology ranking table
│           ├── ExportPanel.jsx     # Download buttons and report summaries
│           ├── ProcessingStatus.jsx# Radar scan animation and error banners
│           └── ModelInfoModal.jsx  # Network architecture and layer specs
├── notebooks/
│   └── u-net.ipynb                 # Original training notebook reference
├── sample_images/                  # Extracted SAR benchmark sample images
├── docs/
│   ├── INSTALLATION.md             # Detailed installation guide
│   ├── USER_GUIDE.md               # User operation manual
│   ├── MODEL_DETAILS.md            # Architecture and tensor specifications
│   └── RESEARCH_METHODOLOGY.md     # Mathematical formulations and integrity standards
├── run_project.bat                 # One-click Windows startup batch script
└── README.md                       # Main project documentation
```

---

## Quick Start (Windows)

### 1. Launch with Batch Script
Double-click `run_project.bat` from the project root. It will:
1. Verify the Python virtual environment and dependencies.
2. Confirm the presence of the trained model artifact.
3. Start the FastAPI backend on `http://127.0.0.1:8000`.
4. Start the Vite React frontend on `http://127.0.0.1:5173`.

### 2. Manual Launch

**Terminal 1 (Backend):**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run dev
```

Navigate to: **`http://127.0.0.1:5173/`**

---

## API Endpoints

- `GET /api/health` — Reports operational status, model readiness, and TensorFlow runtime version.
- `GET /api/model-info` — Exposes verified network architecture, parameter counts, tensor shapes, and class metadata.
- `POST /api/predict` — Multipart upload endpoint running real U-Net inference, quantitative analysis, and artifact generation.
- `GET /docs` — Interactive OpenAPI / Swagger UI documentation.

---

## Automated Test Suite

Run the full backend test suite:
```powershell
cd backend
.\venv\Scripts\pytest.exe -v
```
All **16 tests** pass successfully, covering:
- Image validation, format checks, and decompression bomb prevention
- BGR normalization and batch tensor formatting
- Five-class argmax assignment and nearest-neighbor mask interpolation
- Quantitative area calculations, percentages, and mean probability metrics
- 8-connected morphological components and bounding boxes
- End-to-end API integration and real U-Net inference

Run frontend build verification:
```powershell
cd frontend
npm run build
```
Production bundle compiles cleanly with 0 errors.

---

## Research Disclaimer

All predictions, probability heatmaps, and spatial metrics generated by this platform are direct outputs of an experimental U-Net model trained on Synthetic Aperture Radar (SAR) imagery. They represent pixel-wise statistical likelihoods and do not constitute legal or ground-truth verification of petroleum spills. Pixel areas cannot be converted to physical hectares or square kilometers without georeferenced spatial calibration and satellite ground-range resolution metadata.
