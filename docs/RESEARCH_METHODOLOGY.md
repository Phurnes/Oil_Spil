# Research Methodology & Analytical Principles

This document outlines the scientific methodology, mathematical formulations, and research integrity standards implemented in the SAR Oil-Spill Detection and Segmentation Platform.

---

## 1. Principles of SAR Oil-Spill Detection

Synthetic Aperture Radar (SAR) systems transmit coherent microwave pulses and record backscattered returns from the Earth's surface. 

In maritime environments:
- Clean sea water has a rough capillary wave texture under normal wind conditions (approx. 2–12 m/s), scattering significant radar energy back to the sensor (moderate-to-high backscatter).
- Mineral oil slicks dampen gravity-capillary short waves via viscoelastic Marangoni damping, creating a smooth sea surface that acts as a specular reflector. Most radar energy is reflected away from the satellite, manifesting as dark, low-backscatter patches.
- Natural oceanographic phenomena—such as biogenic organic films, algae blooms, grease ice, wind shadow zones in the lee of islands, and rain cells—also produce dark patches. In SAR research, these are termed **Look-alikes** (Class 2).
- Distinguishing genuine mineral petroleum spills (Class 1) from look-alikes (Class 2) and ships (Class 3) is the fundamental scientific challenge addressed by multi-class semantic segmentation.

---

## 2. Mathematical Formulations

### 2.1 Pixel-wise Class Assignment
Given an input SAR image tensor $\mathbf{X} \in \mathbb{R}^{256 \times 256 \times 3}$, the U-Net model outputs a probability tensor $\mathbf{P} \in [0, 1]^{256 \times 256 \times 5}$ where:
$$\sum_{k=0}^{4} P_{i,j,k} = 1 \quad \forall (i, j) \in \{1, \dots, 256\}^2$$

The discrete predicted class label $\hat{Y}_{i,j}$ for each pixel $(i, j)$ is obtained via the argmax operator:
$$\hat{Y}_{i,j} = \arg\max_{k \in \{0, \dots, 4\}} P_{i,j,k}$$

### 2.2 Class Spatial Percentage
For each class $k \in \{0, \dots, 4\}$, the spatial distribution percentage $S_k$ is computed over the total classified grid $N = 256 \times 256 = 65,536$:
$$S_k = \frac{\sum_{i=1}^{256} \sum_{j=1}^{256} \mathbb{I}(\hat{Y}_{i,j} = k)}{N} \times 100\%$$
Where $\mathbb{I}(\cdot)$ is the indicator function. The sum of all class percentages strictly satisfies:
$$\sum_{k=0}^{4} S_k = 100.0\%$$

### 2.3 Mean Predicted Probability
The mean predicted probability $\bar{P}_k$ for class $k$ across the whole spatial grid is:
$$\bar{P}_k = \frac{1}{N} \sum_{i=1}^{256} \sum_{j=1}^{256} P_{i,j,k}$$
This measures the background activation energy of the network for class $k$, distinct from the discrete pixel area percentage $S_k$.

### 2.4 Maximum Softmax Probability & Uncertainty
The maximum softmax probability $M_{i,j}$ at pixel $(i, j)$ is:
$$M_{i,j} = \max_{k \in \{0, \dots, 4\}} P_{i,j,k} \in [0.20, 1.00]$$

Summary statistics are computed across all pixels:
$$\mu_M = \frac{1}{N} \sum_{i,j} M_{i,j}, \quad \sigma_M = \sqrt{\frac{1}{N} \sum_{i,j} (M_{i,j} - \mu_M)^2}$$

Given a user-selected threshold $\tau \in [0.20, 0.95]$ (default $\tau = 0.60$), the low-confidence subset $\Omega_\tau$ is:
$$\Omega_\tau = \{(i, j) \mid M_{i,j} < \tau\}$$
The low-confidence area percentage is $|\Omega_\tau| / N \times 100\%$.

### 2.5 8-Connected Morphological Component Analysis
For any target class $k$ (e.g., Oil Spill $k=1$), a binary mask $\mathbf{B}^{(k)}$ is constructed:
$$B_{i,j}^{(k)} = \begin{cases} 1 & \text{if } \hat{Y}_{i,j} = k \\ 0 & \text{otherwise} \end{cases}$$

An 8-connected component labeling algorithm partitions the foreground pixels into disjoint connected clusters $\mathcal{C}_1, \mathcal{C}_2, \dots, \mathcal{C}_m$. For each component $\mathcal{C}_r$:
- **Pixel Area**: $A_r = |\mathcal{C}_r|$
- **Centroid**:
  $$\bar{x}_r = \frac{1}{A_r} \sum_{(x, y) \in \mathcal{C}_r} x, \quad \bar{y}_r = \frac{1}{A_r} \sum_{(x, y) \in \mathcal{C}_r} y$$
- **Bounding Box**: $[x_{\min}, y_{\min}, w, h]$ where $w = x_{\max} - x_{\min} + 1$, $h = y_{\max} - y_{\min} + 1$.
- **Noise Filtering**: Components with $A_r < A_{\min}$ (default 10 px) are filtered from the ranking table to remove isolated speckle artifacts.

---

## 3. Standards of Scientific Integrity

The platform adheres to eight non-negotiable scientific integrity rules:

1. **No Simulated Predictions**: Every displayed mask and probability surface is produced by live inference of the trained Keras U-Net model.
2. **No Fabricated Evaluation Metrics**: Evaluation metrics (e.g., mIoU, Dice coefficient, F1-Score) are not fabricated for single unlabeled uploaded images. True evaluation requires annotated ground-truth rasters.
3. **Probability vs. Calibration**: Softmax scores are designated as *model output probabilities*, avoiding claims of empirical Bayesian calibration unless verified through temperature scaling.
4. **Verified Class Labels**: Class names and palette colors are grounded directly in the training notebook (`u-net.ipynb`).
5. **No Unsupported Physical Area Claims**: Pixel counts are never converted to physical units (km² or hectares) without verifiable satellite ground-range resolution and georeferencing metadata.
6. **No Unsupported Generalization Claims**: The system reports operational performance strictly for SAR inputs within the distribution of the training dataset.
7. **Preservation of Raw Predictions**: Thresholding and component filtering are treated as exploratory analysis layers; the underlying raw model prediction tensor is never altered.
8. **Visible Disclaimers**: Research caveats and methodological boundaries are presented visibly across all panels and exports.
