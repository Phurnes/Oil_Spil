# Installation & Setup Guide

This guide provides step-by-step instructions for installing and running the **SAR Oil-Spill Detection, Segmentation & Research Analysis Platform** locally on Windows.

---

## 1. Prerequisites

Ensure you have the following installed on your system:

- **Python**: Version 3.10, 3.11, 3.12, or 3.13 (64-bit)
- **Node.js**: Version 18+ (tested with v24.5.0) and `npm` (tested with v11.5.1)
- **Trained Model Artifact**: `unet_oilspill_model.keras` (located in `backend/models/`)

---

## 2. Directory Structure Verification

Ensure your project root contains:
```text
oil_spill/
├── backend/
│   ├── models/
│   │   └── unet_oilspill_model.keras
│   └── requirements.txt
├── frontend/
│   ├── package.json
│   └── vite.config.js
└── run_project.bat
```

---

## 3. Backend Setup

### Step 3.1: Navigate to the Backend Directory
```powershell
cd D:\oil_spill\backend
```

### Step 3.2: Create and Activate Virtual Environment
```powershell
# Create venv
python -m venv venv

# Activate venv on Windows PowerShell
.\venv\Scripts\Activate.ps1

# (If using CMD)
# .\venv\Scripts\activate.bat
```

### Step 3.3: Install Backend Dependencies
```powershell
pip install -r requirements.txt
```

### Step 3.4: Configure Environment Variables
Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```
Default `.env` settings:
```ini
HOST=127.0.0.1
PORT=8000
DEBUG=False
CORS_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]
MODEL_PATH=models/unet_oilspill_model.keras
IMG_HEIGHT=256
IMG_WIDTH=256
IMG_CHANNELS=3
NUM_CLASSES=5
MAX_UPLOAD_SIZE_MB=25
MAX_IMAGE_DIMENSION=4096
DEFAULT_LOW_CONFIDENCE_THRESHOLD=0.60
DEFAULT_OVERLAY_OPACITY=0.50
DEFAULT_MIN_COMPONENT_SIZE=10
```

---

## 4. Frontend Setup

### Step 4.1: Navigate to the Frontend Directory
```powershell
cd D:\oil_spill\frontend
```

### Step 4.2: Install NPM Dependencies
```powershell
npm install
```

### Step 4.3: Configure Frontend Environment
Ensure `frontend/.env` contains:
```ini
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## 5. Running the Application

### Option A: Using the Windows Batch Script (Recommended)
From the project root:
```cmd
run_project.bat
```
This opens two independent command prompt windows:
1. **Backend Server**: `http://127.0.0.1:8000` (FastAPI + Uvicorn)
2. **Frontend UI**: `http://127.0.0.1:5173` (Vite React)

### Option B: Starting Services Manually

**Terminal 1 (Backend):**
```powershell
cd D:\oil_spill\backend
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

**Terminal 2 (Frontend):**
```powershell
cd D:\oil_spill\frontend
npm run dev
```

Open your browser and navigate to:
**`http://127.0.0.1:5173/`**

---

## 6. Running Automated Tests

To execute the test suite (16 tests covering preprocessing, model inference, segmentation, and analysis):
```powershell
cd D:\oil_spill\backend
.\venv\Scripts\pytest.exe -v
```

To validate the frontend production build:
```powershell
cd D:\oil_spill\frontend
npm run build
```
