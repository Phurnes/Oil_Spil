import React from 'react';
import { Activity, ShieldCheck, AlertCircle, Info, Database } from 'lucide-react';

export default function Header({ health, onOpenModelInfo }) {
  const isOnline = health?.model_loaded === true;
  const isDegraded = health?.status === 'degraded';

  return (
    <header style={{
      background: 'rgba(13, 21, 39, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '14px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
        }}>
          <Activity size={22} />
        </div>
        <div>
          <h1 style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            SAR Oil-Spill Platform
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '6px',
              background: 'rgba(6, 182, 212, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(6, 182, 212, 0.3)'
            }}>
              RESEARCH v1.0
            </span>
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Synthetic Aperture Radar 5-Class Semantic Segmentation & Quantitative Spatial Analysis
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isOnline ? (
            <span className="badge badge-online">
              <ShieldCheck size={14} />
              U-Net Ready (TF {health?.tensorflow_version || '2.21'})
            </span>
          ) : isDegraded ? (
            <span className="badge badge-warning">
              <AlertCircle size={14} />
              Model Degraded
            </span>
          ) : (
            <span className="badge badge-error">
              <AlertCircle size={14} />
              Backend Offline
            </span>
          )}
        </div>

        {/* Model info button */}
        <button
          onClick={onOpenModelInfo}
          className="btn-secondary"
          style={{ fontSize: '0.82rem', padding: '6px 12px' }}
          title="Inspect Model Architecture & Metadata"
        >
          <Database size={15} />
          Model Specs
        </button>
      </div>
    </header>
  );
}
