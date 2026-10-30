import React from 'react';
import { X, Cpu, Layers, CheckCircle2, Shield, AlertTriangle } from 'lucide-react';

export default function ModelInfoModal({ isOpen, onClose, modelInfo }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 7, 18, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div className="sci-card" style={{
        maxWidth: '680px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        border: '1px solid var(--border-active)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu size={22} color="var(--accent-cyan)" />
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                Trained U-Net Model Specifications
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                SAR Oil-Spill Semantic Segmentation Network Details
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              borderRadius: '6px',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Specs Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>ARCHITECTURE</div>
            <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>
              {modelInfo?.architecture || 'U-Net (Encoder-Decoder)'}
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>TOTAL PARAMETERS</div>
            <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>
              {modelInfo?.total_parameters?.toLocaleString() || '1,941,173'}
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>INPUT SHAPE</div>
            <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#f8fafc', fontSize: '0.9rem' }}>
              (1, 256, 256, 3)
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>OUTPUT SHAPE & ACTIVATION</div>
            <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#f8fafc', fontSize: '0.9rem' }}>
              (1, 256, 256, 5) • Softmax
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>COLOR CONVENTION</div>
            <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>
              BGR (OpenCV cv2.IMREAD_COLOR)
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>NORMALIZATION</div>
            <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>
              Floating-point / 255.0 [0.0, 1.0]
            </div>
          </div>
        </div>

        {/* Classes Table */}
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-subtle)', marginBottom: '8px' }}>
            VERIFIED 5-CLASS METADATA & PALETTE
          </div>
          <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-subtle)' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left' }}>Index</th>
                <th style={{ padding: '6px 8px', textAlign: 'left' }}>Label</th>
                <th style={{ padding: '6px 8px', textAlign: 'left' }}>RGB</th>
                <th style={{ padding: '6px 8px', textAlign: 'left' }}>Hex</th>
                <th style={{ padding: '6px 8px', textAlign: 'left' }}>Semantic Category</th>
              </tr>
            </thead>
            <tbody>
              {(modelInfo?.classes || []).map((c) => (
                <tr key={c.index} style={{ borderBottom: '1px solid rgba(30, 48, 80, 0.4)' }}>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{c.index}</td>
                  <td style={{ padding: '8px', fontWeight: 600, color: '#f8fafc' }}>{c.name}</td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    [{c.color_rgb.join(', ')}]
                  </td>
                  <td style={{ padding: '8px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontFamily: 'var(--font-mono)',
                      color: c.color_hex === '#000000' ? '#94a3b8' : c.color_hex
                    }}>
                      <span style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '2px',
                        background: c.color_hex,
                        border: c.color_hex === '#000000' ? '1px solid #475569' : 'none'
                      }}></span>
                      {c.color_hex}
                    </span>
                  </td>
                  <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{c.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Scientific Limitations */}
        <div style={{
          background: 'rgba(30, 48, 80, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={15} color="#fbbf24" />
            Research Validity & Evaluation Guidelines
          </div>
          <p>
            • <strong>No Unverified Metrics:</strong> In accordance with scientific integrity guidelines, quantitative evaluation metrics such as IoU, mIoU, Dice coefficient, Precision, and Recall are not reported for unlabeled inference images because ground-truth masks are required.
          </p>
          <p>
            • <strong>Physical Area:</strong> Surface pixel counts must not be equated to physical square kilometers without satellite incidence angle, pixel spacing (e.g. 10m Sentinel-1 IW mode), and map projection calibration.
          </p>
        </div>

        <button onClick={onClose} className="btn-secondary" style={{ alignSelf: 'flex-end' }}>
          Close Specifications
        </button>
      </div>
    </div>
  );
}
