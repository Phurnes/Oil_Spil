import React, { useState } from 'react';
import { Eye, ZoomIn, ZoomOut, Maximize2, Layers } from 'lucide-react';

export default function ImageViewer({
  artifacts,
  activeView,
  onSelectView,
  selectedClassIndex,
  onSelectClassIndex,
  filename
}) {
  const [zoom, setZoom] = useState(1);

  if (!artifacts) {
    return (
      <div className="sci-card" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '380px',
        color: 'var(--text-subtle)',
        borderStyle: 'dashed'
      }}>
        <Eye size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
        <p style={{ fontSize: '0.92rem' }}>No prediction loaded yet.</p>
        <p style={{ fontSize: '0.78rem' }}>Upload or select a SAR image above and run analysis.</p>
      </div>
    );
  }

  // Determine current image src based on activeView
  let currentImageSrc = artifacts.overlay_png;
  let viewTitle = 'Semi-Transparent Overlay';

  if (activeView === 'original') {
    currentImageSrc = artifacts.original_image_png;
    viewTitle = 'Original SAR Radar Backscatter';
  } else if (activeView === 'mask') {
    currentImageSrc = artifacts.segmentation_mask_png;
    viewTitle = '5-Class Color Segmentation Mask';
  } else if (activeView === 'max_prob') {
    currentImageSrc = artifacts.maximum_probability_heatmap_png;
    viewTitle = 'Maximum Softmax Probability Surface (Turbo Colormap)';
  } else if (activeView === 'low_conf') {
    currentImageSrc = artifacts.low_confidence_mask_png;
    viewTitle = 'Flagged Low-Confidence Prediction Regions (< Cutoff)';
  } else if (activeView === 'discrete_id') {
    currentImageSrc = artifacts.discrete_class_id_mask_png;
    viewTitle = '8-Bit Discrete Class-ID Mask (Values 0..4)';
  } else if (activeView === 'class_mask') {
    const target = artifacts.class_masks.find((c) => c.class_index === selectedClassIndex);
    currentImageSrc = target?.mask_png_base64 || artifacts.segmentation_mask_png;
    viewTitle = `Isolated Binary Mask: ${target?.class_name || 'Class ' + selectedClassIndex}`;
  } else if (activeView === 'class_prob') {
    const target = artifacts.class_probability_heatmaps.find((c) => c.class_index === selectedClassIndex);
    currentImageSrc = target?.heatmap_png_base64 || artifacts.maximum_probability_heatmap_png;
    viewTitle = `Predicted Probability Heatmap: ${target?.class_name || 'Class ' + selectedClassIndex} (Viridis Colormap)`;
  }

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="sci-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top control bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color="var(--accent-cyan)" />
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>
              {viewTitle}
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
              Source: {filename} • Resolution: 256×256 px
            </span>
          </div>
        </div>

        {/* Zoom controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={handleZoomOut}
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', minWidth: '42px', textAlign: 'center' }}>
            {(zoom * 100).toFixed(0)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={handleResetZoom}
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            title="Fit / Reset Zoom"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* Main image canvas area */}
      <div style={{
        background: '#040711',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        minHeight: '380px',
        maxHeight: '520px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        <img
          src={currentImageSrc}
          alt={viewTitle}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
            maxWidth: '100%',
            maxHeight: '480px',
            imageRendering: activeView === 'discrete_id' ? 'pixelated' : 'auto',
            objectFit: 'contain',
            boxShadow: '0 4px 20px rgba(0,0,0,0.8)'
          }}
        />
      </div>

      {/* Verified Color Map Legend */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        padding: '10px 14px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        fontSize: '0.78rem'
      }}>
        <span style={{ fontWeight: 600, color: 'var(--text-subtle)' }}>
          COLOR PALETTE LEGEND:
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#000000', border: '1px solid #475569' }}></span>
            <span style={{ color: '#94a3b8' }}>Class 0: Sea Surface (Black)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#00ffff', boxShadow: '0 0 6px rgba(0,255,255,0.5)' }}></span>
            <span style={{ color: '#00ffff', fontWeight: 600 }}>Class 1: Oil Spill (Cyan)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ff3344', boxShadow: '0 0 6px rgba(255,51,68,0.5)' }}></span>
            <span style={{ color: '#f87171' }}>Class 2: Look-alike (Red)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#d97706' }}></span>
            <span style={{ color: '#fbbf24' }}>Class 3: Ship (Brown)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981' }}></span>
            <span style={{ color: '#34d399' }}>Class 4: Land (Green)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
