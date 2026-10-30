@echo off
setlocal enabledelayedexpansion

title SAR Oil-Spill Platform Launcher
echo =====================================================================
echo  SAR Oil-Spill Detection, Segmentation ^& Research Analysis Platform
echo =====================================================================
echo.

set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

echo [*] Validating project directory: %PROJECT_ROOT%

:: Check 1: Virtual Environment
if not exist "%PROJECT_ROOT%backend\venv\Scripts\python.exe" (
    echo [ERROR] Python virtual environment not found at backend\venv!
    echo Please create the virtual environment and install dependencies:
    echo   cd backend
    echo   python -m venv venv
    echo   .\venv\Scripts\pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)
echo [OK] Python virtual environment verified.

:: Check 2: Model Artifact
if not exist "%PROJECT_ROOT%backend\models\unet_oilspill_model.keras" (
    echo [WARNING] Model weights not found at backend\models\unet_oilspill_model.keras!
    echo Backend will start in degraded mode until model artifact is placed.
) else (
    echo [OK] Trained U-Net model artifact verified (unet_oilspill_model.keras).
)

:: Check 3: Frontend Dependencies
if not exist "%PROJECT_ROOT%frontend\node_modules" (
    echo [ERROR] Frontend dependencies not found in frontend\node_modules!
    echo Please install dependencies:
    echo   cd frontend
    echo   npm install
    echo.
    pause
    exit /b 1
)
echo [OK] Frontend node_modules verified.

echo.
echo [*] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "SAR Platform - Backend (FastAPI)" cmd /k "cd /d %PROJECT_ROOT%backend && .\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000"

echo [*] Starting Vite React Frontend on http://127.0.0.1:5173 ...
start "SAR Platform - Frontend (Vite)" cmd /k "cd /d %PROJECT_ROOT%frontend && npm run dev"

echo.
echo =====================================================================
echo  Both services launched in dedicated terminal windows!
echo  - Backend API: http://127.0.0.1:8000 (Swagger docs at /docs)
echo  - Frontend UI: http://127.0.0.1:5173
echo =====================================================================
echo.
pause
