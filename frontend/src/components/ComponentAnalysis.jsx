import React, { useState } from 'react';
import { Grid, Eye, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function ComponentAnalysis({ connectedComponents = [], minComponentSize = 10 }) {
  // Default to Class 1 (Oil Spill) if available, else first class
  const [selectedClassIndex, setSelectedClassIndex] = useState(1);

  const activeAnalysis =
    connectedComponents.find((c) => c.class_index === selectedClassIndex) ||
    connectedComponents[0];

  return (
    <div className="sci-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <h3 className="card-title" style={{ margin: 0 }}>
          <Grid size={18} color="var(--accent-cyan)" />
          8-Connected Morphological Component Analysis
        </h3>

        {/* Class selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target Class:</span>
          <select
            value={selectedClassIndex}
            onChange={(e) => setSelectedClassIndex(parseInt(e.target.value))}
            style={{
              background: 'var(--bg-primary)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-subtle)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              fontWeight: 600,
              outline: 'none'
            }}
          >
            {connectedComponents.map((c) => (
              <option key={c.class_index} value={c.class_index}>
                Class {c.class_index}: {c.class_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {activeAnalysis && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px'
        }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>TOTAL DETECTED</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>
              {activeAnalysis.total_components_detected}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Raw connected components</div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>RETAINED (≥ {activeAnalysis.min_component_size_threshold}px)</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
              {activeAnalysis.filtered_components_count}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Excludes speckle noise</div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>LARGEST SLICK/BLOB</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#34d399' }}>
              {activeAnalysis.largest_component_pixels.toLocaleString()} px
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
              {activeAnalysis.largest_component_percentage}% of class pixels
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>MEAN COMPONENT AREA</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>
              {activeAnalysis.mean_component_size} px
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Average contiguous cluster</div>
          </div>
        </div>
      )}

      {/* Components table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            COMPONENT MORPHOLOGY BREAKDOWN (TOP CLUSTERS)
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
            8-connectivity adjacency
          </span>
        </div>

        {activeAnalysis?.components?.length > 0 ? (
          <div style={{ overflowX: 'auto', maxHeight: '300px' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.8rem',
              textAlign: 'left'
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-subtle)' }}>
                  <th style={{ padding: '8px 12px' }}>Rank / ID</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Pixel Area</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>% of Class</th>
                  <th style={{ padding: '8px 12px' }}>Bounding Box (X, Y, W, H)</th>
                  <th style={{ padding: '8px 12px' }}>Centroid (X, Y)</th>
                </tr>
              </thead>
              <tbody>
                {activeAnalysis.components.map((c, i) => (
                  <tr
                    key={c.component_id}
                    style={{
                      borderBottom: '1px solid rgba(30, 48, 80, 0.4)',
                      background: i === 0 ? 'rgba(6, 182, 212, 0.05)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)' }}>
                      #{i + 1} <span style={{ color: 'var(--text-subtle)', fontSize: '0.7rem' }}>(id: {c.component_id})</span>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {c.pixel_count.toLocaleString()} px
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                      {c.percentage_of_class}%
                    </td>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      [{c.bounding_box.x_min}, {c.bounding_box.y_min}, {c.bounding_box.width}×{c.bounding_box.height}]
                    </td>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      ({c.centroid_x}, {c.centroid_y})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-subtle)',
            fontSize: '0.82rem'
          }}>
            No connected components detected for {activeAnalysis?.class_name} matching threshold (≥ {activeAnalysis?.min_component_size_threshold} px).
          </div>
        )}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.73rem',
        color: 'var(--text-subtle)',
        background: 'rgba(15, 23, 42, 0.4)',
        padding: '8px 12px',
        borderRadius: 'var(--radius-sm)'
      }}>
        <Info size={14} />
        <span>
          <strong>Connectivity Convention:</strong> 8-connectivity groups horizontally, vertically, and diagonally adjacent pixels into coherent spatial regions. Area is measured strictly in pixels; physical area requires georeferenced spatial calibration and satellite ground-range projection metadata.
        </span>
      </div>
    </div>
  );
}
