import React from 'react';
import { AlertCircle, RefreshCw, Cpu, Activity } from 'lucide-react';

export default function ProcessingStatus({ isLoading, error, onRetry }) {
  if (isLoading) {
    return (
      <div className="sci-card" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px',
        gap: '16px',
        background: 'rgba(13, 21, 39, 0.7)',
        border: '1px solid var(--border-active)'
      }}>
        <div style={{
          position: 'relative',
          width: '64px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px solid rgba(6, 182, 212, 0.2)',
            borderTopColor: 'var(--accent-cyan)',
            animation: 'spin 1s linear infinite'
          }}></div>
          <Activity size={28} color="var(--accent-cyan)" className="radar-scan" />
        </div>

        <div style={{ textAlign: 'center' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>
            Executing U-Net Semantic Inference
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Processing SAR imagery: 256×256 matrix normalization, TensorFlow inference, 5-class argmax postprocessing...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <AlertCircle size={22} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fca5a5', marginBottom: '4px' }}>
            Inference or Processing Failure
          </h4>
          <p style={{ fontSize: '0.82rem', color: '#fecaca', lineHeight: 1.4 }}>
            {error}
          </p>
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
            {onRetry && (
              <button
                onClick={onRetry}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                <RefreshCw size={12} />
                Retry Analysis
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
