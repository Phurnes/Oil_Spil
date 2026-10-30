import React from 'react';
import { 
  Compass, 
  Layers, 
  BarChart2, 
  Sliders, 
  Grid, 
  DownloadCloud, 
  Cpu
} from 'lucide-react';

export default function Sidebar({ activeTab, onSelectTab, hasResults }) {
  const tabs = [
    { id: 'workspace', label: 'Analysis Workspace', icon: Compass, requiresResults: false },
    { id: 'segmentation', label: 'Segmentation Maps', icon: Layers, requiresResults: true },
    { id: 'statistics', label: 'Class Distribution', icon: BarChart2, requiresResults: true },
    { id: 'confidence', label: 'Softmax Confidence', icon: Sliders, requiresResults: true },
    { id: 'components', label: 'Region Components', icon: Grid, requiresResults: true },
    { id: 'export', label: 'Export Artifacts', icon: DownloadCloud, requiresResults: true },
    { id: 'model_info', label: 'Model Architecture', icon: Cpu, requiresResults: false },
  ];

  return (
    <aside style={{
      width: '240px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 10px',
      gap: '6px'
    }}>
      <div style={{
        fontSize: '0.72rem',
        textTransform: 'uppercase',
        fontWeight: 700,
        color: 'var(--text-subtle)',
        padding: '6px 12px',
        letterSpacing: '0.08em'
      }}>
        Research Modules
      </div>

      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const isDisabled = tab.requiresResults && !hasResults;

        return (
          <button
            key={tab.id}
            onClick={() => !isDisabled && onSelectTab(tab.id)}
            disabled={isDisabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#ffffff' : isDisabled ? 'var(--text-subtle)' : 'var(--text-muted)',
              background: isActive
                ? 'linear-gradient(90deg, rgba(6, 182, 212, 0.2) 0%, rgba(6, 182, 212, 0.05) 100%)'
                : 'transparent',
              borderLeft: isActive ? '3px solid var(--color-oil-spill)' : '3px solid transparent',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              width: '100%',
              opacity: isDisabled ? 0.45 : 1,
              transition: 'all 0.15s ease'
            }}
          >
            <Icon size={18} color={isActive ? 'var(--color-oil-spill)' : 'currentColor'} />
            <span>{tab.label}</span>
          </button>
        );
      })}

      <div style={{ marginTop: 'auto', padding: '12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginBottom: '4px' }}>
          VERIFIED CLASSES (5)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#475569', border: '1px solid #94a3b8' }}></span>
            <span style={{ color: '#cbd5e1' }}>0: Sea Surface</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ffff' }}></span>
            <span style={{ color: '#00ffff', fontWeight: 600 }}>1: Oil Spill</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff3344' }}></span>
            <span style={{ color: '#f87171' }}>2: Look-alike</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d97706' }}></span>
            <span style={{ color: '#fbbf24' }}>3: Ship</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
            <span style={{ color: '#34d399' }}>4: Land</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
