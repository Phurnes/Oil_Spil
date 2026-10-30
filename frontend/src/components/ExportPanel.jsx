import React, { useState } from 'react';
import { Download, FileText, Image as ImageIcon, Database, Check } from 'lucide-react';
import { downloadDataUrl, downloadJson, downloadCsv } from '../utils/download';

export default function ExportPanel({ result }) {
  const [copied, setCopied] = useState(false);

  if (!result || !result.artifacts) {
    return (
      <div className="sci-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-subtle)' }}>
        No prediction results available for export. Run an analysis first.
      </div>
    );
  }

  const { artifacts, analysis, timings, image_metadata, filename, model_metadata } = result;

  const baseFilename = (filename || 'sar_prediction').replace(/\.[^/.]+$/, '');

  // 1. Download handlers
  const handleDownloadMask = () => {
    downloadDataUrl(artifacts.segmentation_mask_png, `${baseFilename}_color_mask.png`);
  };

  const handleDownloadOverlay = () => {
    downloadDataUrl(artifacts.overlay_png, `${baseFilename}_overlay.png`);
  };

  const handleDownloadMaxProb = () => {
    downloadDataUrl(artifacts.maximum_probability_heatmap_png, `${baseFilename}_max_prob_heatmap.png`);
  };

  const handleDownloadDiscreteId = () => {
    downloadDataUrl(artifacts.discrete_class_id_mask_png, `${baseFilename}_discrete_class_ids.png`);
  };

  const handleDownloadClassMask = (classIndex, className) => {
    const cMask = artifacts.class_masks?.find((c) => c.class_index === classIndex);
    if (cMask) {
      downloadDataUrl(cMask.mask_png_base64, `${baseFilename}_mask_class_${classIndex}_${className}.png`);
    }
  };

  const handleDownloadJsonReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      source_image: {
        filename: filename,
        original_dimensions: `${image_metadata.original_width}x${image_metadata.original_height}`,
        inference_dimensions: `${image_metadata.model_width}x${image_metadata.model_height}`,
        channels: image_metadata.original_channels,
      },
      model: {
        architecture: model_metadata?.architecture,
        framework: model_metadata?.framework,
        classes_count: model_metadata?.num_classes,
        input_shape: model_metadata?.input_shape,
        output_shape: model_metadata?.output_shape,
      },
      analysis: {
        total_pixels: analysis.total_predicted_pixels,
        classes_present: analysis.classes_present_count,
        class_statistics: analysis.class_statistics,
        maximum_probability_summary: analysis.max_probability_statistics,
        probability_histogram: analysis.max_probability_histogram,
        low_confidence_region: {
          threshold: analysis.low_confidence_threshold_used,
          pixel_count: analysis.low_confidence_pixel_count,
          percentage: analysis.low_confidence_percentage,
        },
        connected_components: analysis.connected_components,
      },
      timings_ms: timings,
      scientific_disclaimer: result.scientific_disclaimer,
    };
    downloadJson(reportData, `${baseFilename}_research_report.json`);
  };

  const handleDownloadCsv = () => {
    const headers = [
      'class_index',
      'class_name',
      'color_hex',
      'is_background',
      'pixel_count',
      'percentage_of_image',
      'mean_predicted_probability'
    ];
    const rows = (analysis.class_statistics || []).map((s) => [
      s.index,
      `"${s.name}"`,
      s.color_hex,
      s.is_background ? 1 : 0,
      s.pixel_count,
      s.percentage,
      s.mean_probability
    ]);
    downloadCsv(headers, rows, `${baseFilename}_class_statistics.csv`);
  };

  return (
    <div className="sci-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 className="card-title" style={{ margin: 0 }}>
          <Download size={18} color="var(--accent-cyan)" />
          Export Research Artifacts & Reports
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Download pixel-aligned visual masks, probability surfaces, CSV summary tables, and full JSON reports.
        </p>
      </div>

      {/* Visual Artifacts Downloads */}
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-subtle)', marginBottom: '10px' }}>
          IMAGE ARTIFACTS (PNG FORMAT)
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px'
        }}>
          <button onClick={handleDownloadOverlay} className="btn-secondary" style={{ padding: '12px' }}>
            <ImageIcon size={18} color="var(--accent-cyan)" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Overlay Image</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>SAR + Mask (PNG)</div>
            </div>
          </button>

          <button onClick={handleDownloadMask} className="btn-secondary" style={{ padding: '12px' }}>
            <ImageIcon size={18} color="var(--color-oil-spill)" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Color Segmentation</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>5-Class Palette Mask (PNG)</div>
            </div>
          </button>

          <button onClick={handleDownloadMaxProb} className="btn-secondary" style={{ padding: '12px' }}>
            <ImageIcon size={18} color="#f59e0b" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Probability Surface</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Max Softmax Heatmap (PNG)</div>
            </div>
          </button>

          <button onClick={handleDownloadDiscreteId} className="btn-secondary" style={{ padding: '12px' }}>
            <Database size={18} color="#10b981" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Discrete Class-ID Mask</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>8-Bit Uncompressed IDs 0..4 (PNG)</div>
            </div>
          </button>
        </div>
      </div>

      {/* Numerical and Report Downloads */}
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-subtle)', marginBottom: '10px' }}>
          DATA & RESEARCH REPORTS
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px'
        }}>
          <button onClick={handleDownloadJsonReport} className="btn-primary" style={{ padding: '12px' }}>
            <FileText size={18} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Full JSON Analysis Report</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>Complete spatial & timing metadata</div>
            </div>
          </button>

          <button onClick={handleDownloadCsv} className="btn-secondary" style={{ padding: '12px' }}>
            <Database size={18} color="var(--accent-emerald)" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Class Statistics CSV</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Pixel counts & area shares</div>
            </div>
          </button>
        </div>
      </div>

      {/* Individual Class Masks Section */}
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-subtle)', marginBottom: '10px' }}>
          ISOLATED CLASS MASKS
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {(analysis.class_statistics || []).map((stat) => (
            <button
              key={stat.index}
              onClick={() => handleDownloadClassMask(stat.index, stat.name)}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
            >
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: stat.color_hex,
                display: 'inline-block'
              }}></span>
              Class {stat.index}: {stat.name} PNG
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
