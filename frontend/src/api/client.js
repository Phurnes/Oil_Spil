/**
 * Centralized API Client for SAR Oil-Spill Platform.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function fetchHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) {
    throw new Error(`Health check failed with status: ${response.status}`);
  }
  return await response.json();
}

export async function fetchModelInfo() {
  const response = await fetch(`${API_BASE_URL}/api/model-info`);
  if (!response.ok) {
    throw new Error(`Model info request failed with status: ${response.status}`);
  }
  return await response.json();
}

export async function predictSarImage(file, options = {}) {
  const formData = new FormData();
  formData.append('file', file);

  if (options.lowConfidenceThreshold !== undefined) {
    formData.append('low_confidence_threshold', options.lowConfidenceThreshold.toString());
  }
  if (options.overlayOpacity !== undefined) {
    formData.append('overlay_opacity', options.overlayOpacity.toString());
  }
  if (options.minComponentSize !== undefined) {
    formData.append('min_component_size', options.minComponentSize.toString());
  }

  const response = await fetch(`${API_BASE_URL}/api/predict`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = `Prediction failed with status: ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch {
      // Use fallback errorDetail
    }
    throw new Error(errorDetail);
  }

  return await response.json();
}
