# Model Details & Architectural Specification

This document details the verified architecture, layer dimensions, parameter counts, preprocessing pipelines, and output interpretation for the trained U-Net model deployed in this platform.

---

## 1. Verified Model Specifications

All information in this specification has been verified by direct inspection of `backend/models/unet_oilspill_model.keras` and `notebooks/u-net.ipynb`:

| Characteristic | Specification |
| :--- | :--- |
| **Framework** | TensorFlow 2.x / Keras 3.x |
| **Model Architecture** | U-Net (Symmetric Encoder-Decoder with Skip Connections) |
| **Model Artifact** | `backend/models/unet_oilspill_model.keras` |
| **File Size** | 23.47 MB |
| **Total Parameters** | 1,941,173 |
| **Trainable Parameters** | 1,941,173 (100%) |
| **Input Tensor Shape** | `(None, 256, 256, 3)` |
| **Output Tensor Shape** | `(None, 256, 256, 5)` |
| **Output Activation** | Softmax |
| **Loss Function** | Categorical Crossentropy |
| **Optimizer** | Adam |
| **Task Type** | Five-class Pixel-wise Semantic Segmentation |

---

## 2. Network Architecture Breakdown

The model follows a standard 4-level U-Net topology:

### Contracting Path (Encoder)
- **Level 1**: Two `Conv2D(16, (3,3), relu, padding='same')`, `Dropout(0.1)`, followed by `MaxPooling2D((2,2))` → feature map `(128, 128, 16)`
- **Level 2**: Two `Conv2D(32, (3,3), relu, padding='same')`, `Dropout(0.1)`, followed by `MaxPooling2D((2,2))` → feature map `(64, 64, 32)`
- **Level 3**: Two `Conv2D(64, (3,3), relu, padding='same')`, `Dropout(0.2)`, followed by `MaxPooling2D((2,2))` → feature map `(32, 32, 64)`
- **Level 4**: Two `Conv2D(128, (3,3), relu, padding='same')`, `Dropout(0.2)`, followed by `MaxPooling2D((2,2))` → feature map `(16, 16, 128)`

### Bottleneck
- Level 5: Two `Conv2D(256, (3,3), relu, padding='same')`, `Dropout(0.3)` → feature map `(16, 16, 256)`

### Expansive Path (Decoder with Concatenation)
- **Level 4 Up**: `Conv2DTranspose(128, (2,2), strides=(2,2))` + `concatenate([Level 4 skip])` → two `Conv2D(128)`
- **Level 3 Up**: `Conv2DTranspose(64, (2,2), strides=(2,2))` + `concatenate([Level 3 skip])` → two `Conv2D(64)`
- **Level 2 Up**: `Conv2DTranspose(32, (2,2), strides=(2,2))` + `concatenate([Level 2 skip])` → two `Conv2D(32)`
- **Level 1 Up**: `Conv2DTranspose(16, (2,2), strides=(2,2))` + `concatenate([Level 1 skip])` → two `Conv2D(16)`

### Head
- `Conv2D(5, (1,1), activation='softmax')` producing per-pixel probability distributions across the 5 classes.

---

## 3. Preprocessing Convention & Channel Ordering

### Training Pipeline Verification (from `u-net.ipynb` Cell 7)
```python
image = cv2.imread(image_path, cv2.IMREAD_COLOR)
image = cv2.resize(image, (IMG_HEIGHT, IMG_WIDTH))
image = image / 255.0
```
- **Crucial Observation**: In the training notebook, `cv2.imread(..., cv2.IMREAD_COLOR)` was used without any `cv2.cvtColor(image, cv2.COLOR_BGR2RGB)` conversion. As a result, the trained network learned weights expecting **BGR channel ordering**.
- **Normalization**: Pixel values are divided by `255.0`, yielding floating-point intensities in `[0.0, 1.0]`. No ImageNet standardization or zero-mean subtraction was applied during training.
- **Inference Fidelity**: The backend strictly follows this training convention: decoding raw uploads into BGR format, resizing to (256, 256), scaling by 1/255.0, and packaging into a float32 tensor of shape `(1, 256, 256, 3)`.

---

## 4. Semantic Class Definitions & Color Palette

The training notebook (`u-net.ipynb` Cell 5 & Cell 17) defines the following 5 semantic categories and corresponding RGB color mapping:

```python
COLOR_MAP = [
    [0, 0, 0],       # Class 0: Sea Surface (Background)
    [0, 255, 255],   # Class 1: Oil Spill (Cyan)
    [255, 0, 0],     # Class 2: Look-alike (Red)
    [153, 76, 0],    # Class 3: Ship (Brown)
    [0, 153, 0],     # Class 4: Land (Green)
]
```

| Class ID | Semantic Label | RGB Color | Hex Color | Description |
| :---: | :--- | :---: | :---: | :--- |
| **0** | **Sea Surface** | `[0, 0, 0]` | `#000000` | Open seawater background body |
| **1** | **Oil Spill** | `[0, 255, 255]` | `#00FFFF` | Confirmed crude or refined mineral oil slick dampening capillary radar waves |
| **2** | **Look-alike** | `[255, 0, 0]` | `#FF0000` | Oceanographic low-backscatter look-alike (biogenic films, low-wind zones, internal waves) |
| **3** | **Ship** | `[153, 76, 0]` | `#994C00` | Vessel target with high radar corner reflection |
| **4** | **Land** | `[0, 153, 0]` | `#009900` | Terrestrial coastlines, islands, or port infrastructure |

---

## 5. Output Interpretation & Postprocessing

1. **Discrete Class Mask**:
   ```python
   discrete_mask = np.argmax(prediction[0], axis=-1)  # Shape (256, 256)
   ```
2. **Maximum Softmax Probability Surface**:
   ```python
   max_prob_map = np.max(prediction[0], axis=-1)  # Values in [0.20, 1.00]
   ```
3. **Resizing Strategy**:
   When scaling discrete masks back to original image dimensions, **nearest-neighbor interpolation (`cv2.INTER_NEAREST`)** is strictly enforced to prevent floating-point interpolation artifacts that would synthesize invalid class IDs.

---

## 6. Known Limitations

1. **Synthetic Resolution**: The model requires inputs resized to 256 × 256. Resizing high-resolution satellite swaths without tiling may blend fine vessel signatures or narrow oil slicks.
2. **Sensor Diversity**: The model was trained on Sentinel-1 SAR dataset imagery. Performance on other SAR platforms (e.g., TerraSAR-X, RADARSAT, ALOS-2 PALSAR) with different polarizations (e.g., HH vs VV) or radar frequencies (X-band, L-band) may vary.
3. **Absence of Ground Truth on Inference**: Metrics like IoU, Dice coefficient, and Accuracy require labeled ground-truth masks and are only applicable during formal validation benchmarking.
