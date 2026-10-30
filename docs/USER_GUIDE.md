# SAR Oil-Spill Research Platform: User Guide

Welcome to the **SAR Oil-Spill Detection, Segmentation & Research Analysis Platform**. This guide explains how to operate the research application, inspect segmentation maps, analyze continuous probability surfaces, explore connected component morphology, and export scientific artifacts.

---

## 1. Starting the Application

1. Double-click `run_project.bat` from the root directory or launch the backend and frontend in separate terminal windows.
2. In your browser, open:
   `http://127.0.0.1:5173/`
3. Look at the top navigation bar. Confirm that the status badge displays **`U-Net Ready`** with green indicator.

---

## 2. Uploading a SAR Image

You have two options for providing SAR imagery:

### Option A: Uploading Your Own SAR Image
1. Drag and drop any SAR image (`.png`, `.jpg`, `.jpeg`, `.tif`, `.tiff`, `.webp`, `.bmp`) into the dashed upload area.
2. Alternatively, click the upload box to open your system file browser.
3. Review the image preview, file dimensions, and file size in the metadata panel.

### Option B: Quick-Loading Benchmark SAR Imagery
Click any of the benchmark sample buttons located right above the upload box:
- **Benchmark SAR 1 (Coastal Slick)**
- **Benchmark SAR 3 (Open Ocean)**
- **Benchmark SAR 4 (Look-alike Feature)**
- **Benchmark SAR 5 (Vessel & Land)**

---

## 3. Configuring Analysis Parameters

Before running inference, you can adjust three research parameters:

1. **Confidence Flag Threshold (default: 60%)**:
   - Determines the cutoff for flagging low-certainty predictions in the uncertainty map.
2. **Overlay Blend Opacity (default: 50%)**:
   - Controls the alpha blending transparency between the raw SAR backscatter image and the color segmentation mask.
3. **Min Component Area (default: 10 px)**:
   - Sets the minimum contiguous pixel area required for an 8-connected morphological blob to appear in the component breakdown table, effectively filtering high-frequency SAR speckle noise.

---

## 4. Running Model Inference

Click **`Run Real U-Net Inference & Spatial Analysis`**.

The application will:
1. Stream the image to the FastAPI backend.
2. Normalize and format the tensor to `(1, 256, 256, 3)` using the verified BGR training convention.
3. Execute inference using your trained U-Net model (`unet_oilspill_model.keras`).
4. Generate the 5-class discrete argmax mask, probability heatmaps, and morphological metrics.
5. Render the results in less than 200 ms.

---

## 5. Inspecting Visual Segmentation Layers

Use the **Layer Selector** above the image viewer to toggle between 8 distinct visualization modes:

1. **Overlay (Image + Mask)**: Semi-transparent color-coded mask blended onto the grayscale SAR image.
2. **Color Mask**: Pure segmentation mask rendered using the verified five-class color palette:
   - **Class 0 (Sea Surface)**: Black / Dark Slate
   - **Class 1 (Oil Spill)**: Cyan (`#00FFFF`)
   - **Class 2 (Look-alike)**: Red (`#FF0000`)
   - **Class 3 (Ship)**: Brown (`#994C00`)
   - **Class 4 (Land)**: Green (`#009900`)
3. **Original SAR**: The unmasked radar backscatter image.
4. **Max Softmax Probability**: Continuous heatmap (Turbo colormap) showing the model's confidence distribution.
5. **Low-Confidence Flagged**: Highlighted orange/red regions where the maximum softmax probability falls below your selected threshold.
6. **8-Bit Class-ID (0..4)**: Raw integer mask suitable for geospatial GIS analysis (QGIS, ArcGIS).
7. **Isolated Class Mask**: Displays only the selected class with all other classes blacked out.
8. **Per-Class Probability**: Continuous Viridis heatmap showing the softmax activation for any individual class across all 65,536 pixels.

---

## 6. Analyzing Research Metrics

Use the left sidebar to navigate specialized analytical tabs:

### 1. Summary Metrics Cards
- **Oil Spill Slick Area**: Total pixels and percentage of frame assigned to Class 1.
- **Look-Alike False Targets**: Pixels classified as low-backscatter look-alikes (Class 2).
- **Mean Softmax Probability**: Average output confidence across the 256×256 grid.
- **Classes Detected**: Count of distinct semantic classes present.
- **Inference Latency**: Precise hardware execution time in milliseconds.

### 2. Class Distribution Tab
- High-contrast Recharts bar chart showing pixel volumes across all 5 classes.
- Detailed quantitative table with exact pixel counts, area percentages (summing to 100%), and spatial mean probabilities.

### 3. Softmax Confidence Tab
- Probability distribution histogram charting pixel frequencies across confidence bins.
- Statistical summary (Mean, Median, Standard Deviation, Minimum, Maximum).
- Low-certainty region quantifier.

### 4. Region Components Tab
- Detailed morphological analysis using 8-connectivity.
- Component ranking table listing every contiguous blob with its pixel area, class share (%), bounding box coordinates `[X, Y, W, H]`, and centroid `(X, Y)`.

---

## 7. Exporting Artifacts

Navigate to **Export Artifacts** in the sidebar to download:
- **Overlay Image (PNG)**: Publication-ready blended figure.
- **Color Segmentation Mask (PNG)**: Standard palette mask.
- **Probability Surface (PNG)**: High-resolution Turbo heatmap.
- **Discrete Class-ID Mask (PNG)**: 8-bit uncompressed raster with literal pixel values `0, 1, 2, 3, 4`.
- **Individual Class Binary Masks (PNG)**: Isolated class maps.
- **Full JSON Research Report**: Complete spatial metrics, model metadata, parameters, and timings.
- **Class Statistics (CSV)**: Tabular summary for spreadsheet and statistical software.

---

## 8. Troubleshooting

- **Backend Offline**: Ensure the FastAPI server is running on `http://127.0.0.1:8000`.
- **Model Degraded**: Verify that `backend/models/unet_oilspill_model.keras` exists.
- **CORS Errors**: Check that `CORS_ORIGINS` in `backend/.env` includes `http://localhost:5173` and `http://127.0.0.1:5173`.
