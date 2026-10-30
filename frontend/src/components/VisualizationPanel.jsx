import React from 'react';
import { Eye, Layers, Compass, Sliders, ShieldAlert, Binary, Droplets } from 'lucide-react';

export default function VisualizationPanel({
  activeView,
  onSelectView,
  selectedClassIndex,
  onSelectClassIndex,
  classes = []
}) {
  const views = [
    { id: 'overlay', label: 'Overlay (Image + Mask)', icon: Layers },
    { id: 'mask', label: 'Color Mask', icon: Eye },
    { id: 'original', label: 'Original SAR', icon: Compass },
    { id: 'max_prob', label: 'Max Softmax Probability', icon: Sliders },
    { id: 'low_conf', label: 'Low-Confidence Flagged', icon: ShieldAlert },
    { id: 'discrete_id', label: '8-Bit Class-ID (0..4)', icon: Binary },
    { id: 'class_mask', label: 'Isolated Class Mask', icon: Droplets },
    { id: 'class_prob', label: 'Per-Class Probability', icon: Sliders },
  ];

  return (
    <div className="sci-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-subtle)' }}>
          SELECT VISUALIZATION LAYER:
        </span>

        {/* If viewing class mask or per-class prob, show class selector */}
        {(activeView === 'class_mask' || activeView === 'class_prob') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Target Class:</span>
            <select
              value={selectedClassIndex}
              onChange={(e) => onSelectClassIndex(parseInt(e.target.value))}
              style={{
                background: 'var(--bg-primary)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-subtle)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                outline: 'none'
              }}
            >
              {classes.map((c) => (
                <option key={c.index} value={c.index}>
                  Class {c.index}: {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '8px'
      }}>
        {views.map((v) => {
          const Icon = v.icon;
          const isSelected = activeView === v.id;
          return (
            <button
              key={v.id}
              onClick={() => onSelectView(v.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                fontWeight: isSelected ? 600 : 500,
                background: isSelected
                  ? 'rgba(6, 182, 212, 0.2)'
                  : 'rgba(15, 23, 42, 0.6)',
                color: isSelected ? 'var(--color-oil-spill)' : 'var(--text-muted)',
                border: `1px solid ${isSelected ? 'var(--border-active)' : 'var(--border-subtle)'}`,
                boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
                transition: 'all 0.15s ease',
                textAlign: 'left'
              }}
            >
              <Icon size={15} color={isSelected ? 'var(--color-oil-spill)' : 'currentColor'} />
              <span>{v.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
