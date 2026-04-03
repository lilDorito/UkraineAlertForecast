export default function InfoDrawer({ isOpen, onClose, meta }) {
  return (
    <>
      <div className={`drawer-overlay${isOpen ? ' open' : ''}`} onClick={onClose} />
      <div className={`drawer${isOpen ? ' open' : ''}`} style={{ width: '400px', maxWidth: '90vw' }}>
        <button className="drawer-close" onClick={onClose}>×</button>
        <div className="drawer-header">
          <div className="drawer-region-name">About Forecast Data</div>
          <div className="drawer-sub">JSON fields explanation</div>
        </div>
        <div className="drawer-section">
          <div className="section-label">Data source</div>
          <div className="badge-stat" style={{ padding: '12px', background: '#111118', borderRadius: '8px' }}>
            Generated at: {meta?.generated_at ? new Date(meta.generated_at).toLocaleString() : '—'}<br />
            Base time: {meta?.base_time || '—'}<br />
            Regions: {meta?.n_regions || '—'} · Hours: {meta?.n_hours || '—'}<br />
            Global max score: {meta?.global_max_score?.toFixed(4) || '—'}
          </div>
        </div>
        <div className="drawer-section">
          <div className="section-label">Forecast fields per region/hour</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="badge badge-stat"><span>score</span> raw model output (0–0.48 max)</div>
            <div className="badge badge-stat"><span>probability</span> calibrated alert likelihood (0–1)</div>
            <div className="badge badge-stat"><span>binary</span> alert flag (true if probability ≥ threshold)</div>
          </div>
        </div>
        <div className="drawer-section">
          <div className="section-label">Visual hints</div>
          <div className="no-alert-text" style={{ color: 'var(--text-secondary)' }}>
            • Map colors follow probability (green→red)<br />
            • Red pulsing waves = alert active for current hour<br />
            • Click any region for detailed chart & clock<br />
            • Time shown in <strong>Kyiv local time</strong> (automatically adjusts for DST)<br />
            • Underlying data uses UTC hours, but display is converted to Europe/Kyiv timezone<br />
            • Luhansk & Crimea always show 99%+ probability and permanent waves
          </div>
        </div>
        <div className="drawer-section" style={{ marginTop: '8px', borderTop: '0.5px solid var(--border)', paddingTop: '16px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-dim)',
            letterSpacing: '0.02em'
          }}>
            <span>⚡ developed by</span>
            <span style={{ 
              background: 'linear-gradient(135deg, #e8d5a3, #c0a06b)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              fontWeight: 600,
              fontSize: '12px'
            }}>Gabella Enterprise</span>
            <span>with support from</span>
            <span style={{ 
              background: 'linear-gradient(135deg, #b8e1fc, #7fcdff)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              fontWeight: 600,
              fontStyle: 'italic'
            }}>Tea with a Bun</span>
          </div>
        </div>
      </div>
    </>
  );
}