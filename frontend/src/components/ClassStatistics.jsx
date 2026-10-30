import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart2, Info } from 'lucide-react';

export default function ClassStatistics({ classStatistics = [], totalPixels = 65536 }) {
  const chartData = classStatistics.map((stat) => ({
    name: stat.name,
    pixels: stat.pixel_count,
    percentage: stat.percentage,
    meanProb: (stat.mean_probability * 100).toFixed(1),
    color: stat.color_hex,
  }));

  return (
    <div className="sci-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 className="card-title" style={{ margin: 0 }}>
          <BarChart2 size={18} color="var(--accent-cyan)" />
          5-Class Spatial Distribution & Frequency Analysis
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
          Total Classified Domain: {totalPixels?.toLocaleString()} pixels (256×256)
        </span>
      </div>

      {/* Chart Section */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.5)',
        padding: '16px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        height: '240px'
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
            <XAxis
              dataKey="name"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              interval={0}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              unit=" px"
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div style={{
                      background: '#0d1527',
                      border: '1px solid var(--border-subtle)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      boxShadow: 'var(--shadow-md)'
                    }}>
                      <div style={{ fontWeight: 600, color: data.color }}>{data.name}</div>
                      <div>Pixels: <strong>{data.pixels.toLocaleString()}</strong></div>
                      <div>Percentage: <strong>{data.percentage}%</strong></div>
                      <div>Mean Probability: <strong>{data.meanProb}%</strong></div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="pixels" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color === '#000000' ? '#334155' : entry.color}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Numerical Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.82rem',
          textAlign: 'left'
        }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-subtle)' }}>
              <th style={{ padding: '8px 12px' }}>Class ID</th>
              <th style={{ padding: '8px 12px' }}>Class Name</th>
              <th style={{ padding: '8px 12px' }}>Palette Color</th>
              <th style={{ padding: '8px 12px' }}>Role</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Pixel Count</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Percentage (%)</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Mean Predicted Prob</th>
            </tr>
          </thead>
          <tbody>
            {classStatistics.map((stat) => (
              <tr
                key={stat.index}
                style={{
                  borderBottom: '1px solid rgba(30, 48, 80, 0.4)',
                  background: stat.index === 1 && stat.pixel_count > 0 ? 'rgba(6, 182, 212, 0.08)' : 'transparent'
                }}
              >
                <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)' }}>
                  {stat.index}
                </td>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#f8fafc' }}>
                  {stat.name}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '3px',
                      background: stat.color_hex,
                      border: stat.color_hex === '#000000' ? '1px solid #64748b' : 'none',
                      display: 'inline-block'
                    }}></span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {stat.color_hex}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  {stat.is_background ? (
                    <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>Background Water</span>
                  ) : (
                    <span style={{ color: stat.index === 1 ? 'var(--color-oil-spill)' : 'var(--accent-cyan)', fontSize: '0.75rem', fontWeight: stat.index === 1 ? 700 : 500 }}>
                      Spatial Target
                    </span>
                  )}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {stat.pixel_count.toLocaleString()}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {stat.percentage}%
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                  {(stat.mean_probability * 100).toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.75rem',
        color: 'var(--text-subtle)',
        background: 'rgba(15, 23, 42, 0.4)',
        padding: '8px 12px',
        borderRadius: 'var(--radius-sm)'
      }}>
        <Info size={14} />
        <span>
          Percentages are calculated as (Class Pixels / 65,536) × 100 and sum to 100%. Mean predicted probability represents the average continuous softmax output for each class across the whole spatial domain.
        </span>
      </div>
    </div>
  );
}
