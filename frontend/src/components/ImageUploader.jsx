import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Sliders, RefreshCw, Play, FileCheck, AlertTriangle } from 'lucide-react';

const SAMPLES = [
  { name: 'Benchmark SAR 1 (Coastal Slick)', path: '/samples/sample_sar_1.png' },
  { name: 'Benchmark SAR 3 (Open Ocean)', path: '/samples/sample_sar_3.png' },
  { name: 'Benchmark SAR 4 (Look-alike Feature)', path: '/samples/sample_sar_4.png' },
  { name: 'Benchmark SAR 5 (Vessel & Land)', path: '/samples/sample_sar_5.png' },
];

export default function ImageUploader({
  onAnalyze,
  isLoading,
  modelReady,
  settings,
  onUpdateSettings,
  onReset,
  hasResults
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [fileMeta, setFileMeta] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    setErrorMsg(null);

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/tiff', 'image/webp', 'image/bmp'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(png|jpe?g|tiff?|webp|bmp)$/i)) {
      setErrorMsg('Unsupported format. Please upload PNG, JPEG, TIFF, BMP, or WebP.');
      return;
    }

    // Size limit check (25 MB)
    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('File exceeds 25 MB upload limit.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Read image dimensions via browser Image object
    const img = new Image();
    img.onload = () => {
      setFileMeta({
        name: file.name,
        sizeKb: (file.size / 1024).toFixed(1),
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.src = objectUrl;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const loadSample = async (sample) => {
    try {
      setErrorMsg(null);
      const res = await fetch(sample.path);
      const blob = await res.blob();
      const file = new File([blob], sample.name.replace(/[^a-zA-Z0-9_-]/g, '_') + '.png', {
        type: 'image/png',
      });
      handleFile(file);
    } catch (err) {
      setErrorMsg(`Failed to load sample: ${err.message}`);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileMeta(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onReset();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    onAnalyze(selectedFile);
  };

  return (
    <div className="sci-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 className="card-title" style={{ margin: 0 }}>
          <Upload size={18} color="var(--accent-cyan)" />
          SAR Image Input & Configuration
        </h2>
        {selectedFile && (
          <button
            type="button"
            onClick={handleClear}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '4px 10px' }}
          >
            <RefreshCw size={13} />
            Reset Image
          </button>
        )}
      </div>

      {/* Preset benchmark samples */}
      <div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
          QUICK LOAD BENCHMARK SAR SAMPLES:
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
          {SAMPLES.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadSample(sample)}
              disabled={isLoading}
              style={{
                fontSize: '0.75rem',
                background: 'rgba(30, 48, 80, 0.6)',
                color: '#cbd5e1',
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-cyan)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
            >
              <ImageIcon size={12} color="var(--accent-cyan)" />
              {sample.name}
            </button>
          ))}
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        style={{
          border: `2px dashed ${dragActive ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '24px 16px',
          background: dragActive ? 'rgba(6, 182, 212, 0.08)' : 'rgba(13, 21, 39, 0.5)',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.tif,.tiff,.webp,.bmp"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
        />
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: 'rgba(14, 165, 233, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-cyan)'
        }}>
          <Upload size={20} />
        </div>
        <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc' }}>
          Drag & Drop SAR Radar Imagery
        </p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Supports PNG, JPEG, TIFF (RGB or Single-band grayscale) • Max 25MB
        </p>
      </div>

      {errorMsg && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-sm)',
          color: '#fca5a5',
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={16} />
          {errorMsg}
        </div>
      )}

      {/* Selected file preview and metadata */}
      {selectedFile && previewUrl && (
        <div style={{
          display: 'flex',
          gap: '16px',
          background: 'rgba(15, 23, 42, 0.7)',
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          alignItems: 'center'
        }}>
          <img
            src={previewUrl}
            alt="Uploaded SAR Preview"
            style={{
              width: '80px',
              height: '80px',
              objectFit: 'cover',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              background: '#000'
            }}
          />
          <div style={{ flex: 1, fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileCheck size={14} color="var(--accent-emerald)" />
              {fileMeta?.name}
            </div>
            <div style={{ color: 'var(--text-muted)' }}>
              Dimensions: <strong style={{ color: '#e2e8f0' }}>{fileMeta?.width} × {fileMeta?.height} px</strong> (will be resized to 256×256 for U-Net)
            </div>
            <div style={{ color: 'var(--text-muted)' }}>
              File Size: <strong style={{ color: '#e2e8f0' }}>{fileMeta?.sizeKb} KB</strong>
            </div>
          </div>
        </div>
      )}

      {/* Inference Parameters */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.5)',
        padding: '14px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sliders size={13} />
          ANALYSIS THRESHOLDS & VIEW SETTINGS
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {/* Low confidence cutoff */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Confidence Flag Threshold:</span>
              <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {(settings.lowConfidenceThreshold * 100).toFixed(0)}%
              </strong>
            </div>
            <input
              type="range"
              min="0.20"
              max="0.95"
              step="0.05"
              value={settings.lowConfidenceThreshold}
              onChange={(e) => onUpdateSettings({ lowConfidenceThreshold: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
            />
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
              Softmax probability cutoff for low-certainty regions
            </div>
          </div>

          {/* Overlay Opacity */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Overlay Blend Opacity:</span>
              <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {(settings.overlayOpacity * 100).toFixed(0)}%
              </strong>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.90"
              step="0.05"
              value={settings.overlayOpacity}
              onChange={(e) => onUpdateSettings({ overlayOpacity: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
            />
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
              Alpha transparency for SAR segmentation mask overlay
            </div>
          </div>

          {/* Min Component Size */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Min Component Area:</span>
              <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {settings.minComponentSize} px
              </strong>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={settings.minComponentSize}
              onChange={(e) => onUpdateSettings({ minComponentSize: parseInt(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
            />
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
              Filters speckle noise in 8-connected component tables
            </div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selectedFile || isLoading || !modelReady}
        className="btn-primary"
        style={{
          width: '100%',
          justifyContent: 'center',
          padding: '12px 24px',
          fontSize: '0.95rem'
        }}
      >
        {isLoading ? (
          <>
            <RefreshCw size={18} className="radar-scan" />
            Executing U-Net Semantic Segmentation...
          </>
        ) : (
          <>
            <Play size={18} />
            Run Real U-Net Inference & Spatial Analysis
          </>
        )}
      </button>
    </div>
  );
}
