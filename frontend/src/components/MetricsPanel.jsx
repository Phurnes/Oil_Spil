import React from 'react';
import { Target, Layers, Cpu, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function MetricsPanel({ analysis, timings }) {
  if (!analysis) return null;

  const oilSpillStat = analysis.class_statistics?.find((s) => s.index === 1);
  const lookAlikeStat = analysis.class_statistics?.find((s) => s.index === 2);
  const totalPixels = analysis.total_predicted_pixels || 65536;

  const cards = [
    {
      title: 'Oil Spill Slick Area',
      value: `${oilSpillStat?.pixel_count?.toLocaleString() || 0} px`,
      subvalue: `${oilSpillStat?.percentage || 0}% of SAR frame`,
      icon: Target,
      color: 'var(--color-oil-spill)',
      alert: (oilSpillStat?.pixel_count || 0) > 0,
      note: 'Predicted slick pixels (Class 1)'
    },
    {
      title: 'Look-Alike False Targets',
      value: `${lookAlikeStat?.pixel_count?.toLocaleString() || 0} px`,
      subvalue: `${lookAlikeStat?.percentage || 0}% of SAR frame`,
      icon: AlertTriangle,
      color: 'var(--color-look-alike)',
      alert: false,
      note: 'Low-backscatter look-alikes (Class 2)'
    },
    {
      title: 'Mean Softmax Probability',
      value: `${(analysis.max_probability_statistics?.mean * 100).toFixed(1)}%`,
      subvalue: `Median: ${(analysis.max_probability_statistics?.median * 100).toFixed(1)}% • Std: ${(analysis.max_probability_statistics?.std * 100).toFixed(1)}%`,
      icon: ShieldCheck,
      color: 'var(--accent-cyan)',
      alert: false,
      note: 'Model output probability surface'
    },
    {
      title: 'Classes Detected',
      value: `${analysis.classes_present_count} / 5`,
      subvalue: `${totalPixels.toLocaleString()} total classified pixels`,
      icon: Layers,
      color: 'var(--accent-emerald)',
      alert: false,
      note: '256 × 256 pixel spatial grid'
    },
    {
      title: 'U-Net Inference Time',
      value: `${timings?.inference_ms || 0} ms`,
      subvalue: `Total backend: ${timings?.total_backend_ms || 0} ms`,
      icon: Clock,
      color: 'var(--accent-indigo)',
      alert: false,
      note: 'Keras model execution latency'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
      gap: '14px'
    }}>
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className="sci-card"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {card.title}
              </span>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: `rgba(6, 182, 212, 0.1)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: card.color
              }}>
                <Icon size={16} />
              </div>
            </div>

            <div>
              <div style={{
                fontSize: '1.45rem',
                fontWeight: 700,
                color: card.alert ? 'var(--color-oil-spill)' : '#f8fafc',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '-0.02em'
              }}>
                {card.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                {card.subvalue}
              </div>
            </div>

            <div style={{
              fontSize: '0.68rem',
              color: 'var(--text-subtle)',
              borderTop: '1px solid var(--border-subtle)',
              marginTop: '12px',
              paddingTop: '8px'
            }}>
              {card.note}
            </div>
          </div>
        );
      })}
    </div>
  );
}
