import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldCheck, AlertCircle, Info, TrendingUp, Sliders } from 'lucide-react';

export default function ConfidenceAnalysis({ analysis }) {
  if (!analysis) return null;

  const stats = analysis.max_probability_statistics;
  const hist = analysis.max_probability_histogram;

  // Prepare histogram data for Recharts
  const histogramData = (hist?.counts || []).map((count, i) => {
    const start = hist.bin_edges[i];
    const end = hist.bin_edges[i + 1] !== undefined ? hist.bin_edges[i + 1] : 1.0;
    return {
      bin: `${(start * 100).toFixed(0)}-${(end * 100).toFixed(0)}%`,
      count: count,
      frequency: ((hist.frequencies?.[i] || 0) * 100).toFixed(1),
    };
  });

  return (
    <div className="sci-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 className="card-title" style={{ margin: 0 }}>
          <Sliders size={18} color="var(--accent-cyan)" />
          Softmax Probability & Model Uncertainty Analysis
        </h3>
        <span className="badge badge-info">
          Output Layer: Softmax
        </span>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '12px'
      }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>MEAN PROB</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
            {(stats.mean * 100).toFixed(1)}%
          </div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>MEDIAN PROB</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>
            {(stats.median * 100).toFixed(1)}%
          </div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>STANDARD DEV</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>
            {(stats.std * 100).toFixed(2)}%
          </div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>MINIMUM PROB</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#f87171' }}>
            {(stats.min * 100).toFixed(1)}%
          </div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>MAXIMUM PROB</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#34d399' }}>
            {(stats.max * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Histogram */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            MAXIMUM SOFTMAX PROBABILITY DISTRIBUTION (HISTOGRAM)
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
            Frequency across 65,536 predicted pixels
          </span>
        </div>
        <div style={{
          background: 'rgba(15, 23, 42, 0.5)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          height: '220px'
        }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <XAxis dataKey="bin" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div style={{
                        background: '#0d1527',
                        border: '1px solid var(--border-subtle)',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem'
                      }}>
                        <div>Probability Bin: <strong>{d.bin}</strong></div>
                        <div>Pixel Count: <strong>{d.count.toLocaleString()}</strong></div>
                        <div>Frequency: <strong>{d.frequency}%</strong></div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" fill="var(--accent-cyan)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Low Confidence Heuristic Summary */}
      <div style={{
        background: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: 'var(--radius-md)',
        padding: '14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <AlertCircle size={20} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.8rem', color: '#fef3c7' }}>
          <strong>Low-Certainty Region Quantification:</strong>{' '}
          {analysis.low_confidence_pixel_count.toLocaleString()} pixels ({analysis.low_confidence_percentage}%) have a maximum predicted probability below the{' '}
          <strong>{(analysis.low_confidence_threshold_used * 100).toFixed(0)}%</strong> threshold.
          <p style={{ marginTop: '4px', fontSize: '0.75rem', color: '#fde68a' }}>
            Flagged pixels typically correspond to boundary transitions, SAR speckle noise, or faint slick edges where the model exhibits higher entropy.
          </p>
        </div>
      </div>

      {/* Research Integrity note */}
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
          <strong>Research Note on Calibration:</strong> Softmax activations represent relative model class scores, not mathematically calibrated Bayesian probabilities of true ground-truth accuracy. Without post-hoc temperature scaling or empirical reliability diagrams, these metrics should be interpreted strictly as model output distributions.
        </span>
      </div>
    </div>
  );
}
