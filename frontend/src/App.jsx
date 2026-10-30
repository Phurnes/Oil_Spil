import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ImageUploader from './components/ImageUploader';
import ImageViewer from './components/ImageViewer';
import VisualizationPanel from './components/VisualizationPanel';
import MetricsPanel from './components/MetricsPanel';
import ClassStatistics from './components/ClassStatistics';
import ConfidenceAnalysis from './components/ConfidenceAnalysis';
import ComponentAnalysis from './components/ComponentAnalysis';
import ExportPanel from './components/ExportPanel';
import ProcessingStatus from './components/ProcessingStatus';
import ModelInfoModal from './components/ModelInfoModal';

import { fetchHealth, fetchModelInfo, predictSarImage } from './api/client';
import { ShieldAlert, AlertTriangle, Info } from 'lucide-react';

export default function App() {
  const [health, setHealth] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('workspace');
  const [activeView, setActiveView] = useState('overlay');
  const [selectedClassIndex, setSelectedClassIndex] = useState(1);
  const [isModelInfoOpen, setIsModelInfoOpen] = useState(false);

  const [settings, setSettings] = useState({
    lowConfidenceThreshold: 0.60,
    overlayOpacity: 0.50,
    minComponentSize: 10,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);

  // Load health and model specifications on mount
  useEffect(() => {
    async function initPlatform() {
      try {
        const healthData = await fetchHealth();
        setHealth(healthData);
      } catch (err) {
        console.warn('Initial health check notice:', err);
      }

      try {
        const infoData = await fetchModelInfo();
        setModelInfo(infoData);
      } catch (err) {
        console.warn('Model info notice:', err);
      }
    }
    initPlatform();
  }, []);

  const handleUpdateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleAnalyze = async (file) => {
    setIsLoading(true);
    setError(null);
    setCurrentFile(file);

    try {
      const data = await predictSarImage(file, {
        lowConfidenceThreshold: settings.lowConfidenceThreshold,
        overlayOpacity: settings.overlayOpacity,
        minComponentSize: settings.minComponentSize,
      });

      setResult(data);
      // Stay on workspace or go to segmentation if user wants
    } catch (err) {
      setError(err.message || 'An error occurred during inference.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setCurrentFile(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Top Application Header */}
      <Header
        health={health}
        onOpenModelInfo={() => setIsModelInfoOpen(true)}
      />

      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 70px)' }}>
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          hasResults={!!result}
        />

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
          {/* Status or Error Notifications */}
          <ProcessingStatus
            isLoading={isLoading}
            error={error}
            onRetry={() => currentFile && handleAnalyze(currentFile)}
          />

          {/* TAB 1: WORKSPACE */}
          {activeTab === 'workspace' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Top row: Image Uploader & Viewer side-by-side or stacked */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: result ? 'minmax(340px, 420px) 1fr' : '1fr',
                gap: '24px',
                alignItems: 'start'
              }}>
                <ImageUploader
                  onAnalyze={handleAnalyze}
                  isLoading={isLoading}
                  modelReady={health?.model_loaded ?? true}
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  onReset={handleReset}
                  hasResults={!!result}
                />

                {result && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <VisualizationPanel
                      activeView={activeView}
                      onSelectView={setActiveView}
                      selectedClassIndex={selectedClassIndex}
                      onSelectClassIndex={setSelectedClassIndex}
                      classes={modelInfo?.classes || []}
                    />

                    <ImageViewer
                      artifacts={result.artifacts}
                      activeView={activeView}
                      onSelectView={setActiveView}
                      selectedClassIndex={selectedClassIndex}
                      onSelectClassIndex={setSelectedClassIndex}
                      filename={result.filename}
                    />
                  </div>
                )}
              </div>

              {/* Numerical Metrics Summary if results available */}
              {result && (
                <>
                  <MetricsPanel
                    analysis={result.analysis}
                    timings={result.timings}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
                    <ClassStatistics
                      classStatistics={result.analysis.class_statistics}
                      totalPixels={result.analysis.total_predicted_pixels}
                    />
                    <ConfidenceAnalysis
                      analysis={result.analysis}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: SEGMENTATION MAPS */}
          {activeTab === 'segmentation' && result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <VisualizationPanel
                activeView={activeView}
                onSelectView={setActiveView}
                selectedClassIndex={selectedClassIndex}
                onSelectClassIndex={setSelectedClassIndex}
                classes={modelInfo?.classes || []}
              />

              <ImageViewer
                artifacts={result.artifacts}
                activeView={activeView}
                onSelectView={setActiveView}
                selectedClassIndex={selectedClassIndex}
                onSelectClassIndex={setSelectedClassIndex}
                filename={result.filename}
              />
            </div>
          )}

          {/* TAB 3: CLASS DISTRIBUTION */}
          {activeTab === 'statistics' && result && (
            <ClassStatistics
              classStatistics={result.analysis.class_statistics}
              totalPixels={result.analysis.total_predicted_pixels}
            />
          )}

          {/* TAB 4: CONFIDENCE ANALYSIS */}
          {activeTab === 'confidence' && result && (
            <ConfidenceAnalysis
              analysis={result.analysis}
            />
          )}

          {/* TAB 5: REGION COMPONENTS */}
          {activeTab === 'components' && result && (
            <ComponentAnalysis
              connectedComponents={result.analysis.connected_components}
              minComponentSize={settings.minComponentSize}
            />
          )}

          {/* TAB 6: EXPORT */}
          {activeTab === 'export' && result && (
            <ExportPanel result={result} />
          )}

          {/* TAB 7: MODEL INFO */}
          {activeTab === 'model_info' && (
            <div className="sci-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 className="card-title">
                Model Architecture & Verified Research Specifications
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px'
              }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>FRAMEWORK & MODEL</div>
                  <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '1rem', marginTop: '4px' }}>
                    TensorFlow / Keras 3.x
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>U-Net Semantic Segmentation</div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>PARAMETERS</div>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontSize: '1.25rem', marginTop: '4px' }}>
                    {modelInfo?.total_parameters?.toLocaleString() || '1,941,173'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trainable weights: 100%</div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>SPATIAL RESOLUTION</div>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#f8fafc', fontSize: '1.25rem', marginTop: '4px' }}>
                    256 × 256 px
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Input: (1, 256, 256, 3) BGR</div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>OUTPUT ACTIVATION</div>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#34d399', fontSize: '1.25rem', marginTop: '4px' }}>
                    Softmax (5 classes)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Output: (1, 256, 256, 5)</div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f8fafc', marginBottom: '10px' }}>
                  Verified 5-Class Categorization & RGB Palette:
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  {(modelInfo?.classes || []).map((c) => (
                    <div key={c.index} style={{
                      background: 'rgba(15, 23, 42, 0.5)',
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '3px',
                          background: c.color_hex,
                          border: c.color_hex === '#000000' ? '1px solid #64748b' : 'none'
                        }}></span>
                        <strong style={{ color: '#f8fafc', fontSize: '0.85rem' }}>
                          Class {c.index}: {c.name}
                        </strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        RGB: [{c.color_rgb.join(', ')}] • Hex: {c.color_hex}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                        {c.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Mandatory Research Disclaimer Footer */}
          <footer style={{
            marginTop: 'auto',
            padding: '16px',
            background: 'rgba(15, 23, 42, 0.5)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.75rem',
            color: 'var(--text-subtle)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <ShieldAlert size={18} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#cbd5e1' }}>Research & Scientific Integrity Disclaimer:</strong>{' '}
              All segmentation masks, probability heatmaps, and spatial metrics generated by this platform are direct outputs of an experimental U-Net deep learning model trained on Synthetic Aperture Radar (SAR) imagery. Model outputs represent pixel-wise statistical likelihoods and do not constitute legal or ground-truth verification of petroleum spills. Pixel areas cannot be converted to physical hectares or square kilometers without georeferenced spatial calibration and satellite ground-range resolution metadata.
            </div>
          </footer>
        </main>
      </div>

      {/* Model Specs Modal */}
      <ModelInfoModal
        isOpen={isModelInfoOpen}
        onClose={() => setIsModelInfoOpen(false)}
        modelInfo={modelInfo}
      />
    </div>
  );
}
