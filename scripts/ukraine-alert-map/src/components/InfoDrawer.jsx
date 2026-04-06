import { useLanguage } from '../context/LanguageContext';

export default function InfoDrawer({ isOpen, onClose, meta }) {
  const { t } = useLanguage();
  return (
    <>
      <div className={`drawer-overlay${isOpen ? ' open' : ''}`} onClick={onClose} />
      <div className={`drawer${isOpen ? ' open' : ''}`} style={{ width: '400px', maxWidth: '90vw' }}>
        <button className="drawer-close" onClick={onClose}>×</button>
        <div className="drawer-header">
          <div className="drawer-region-name">{t('aboutData')}</div>
          <div className="drawer-sub">{t('howToRead')}</div>
        </div>
        <div className="drawer-section">
          <div className="section-label">{t('dataSource')}</div>
          <div className="badge-stat" style={{ padding: '12px', background: '#111118', borderRadius: '8px' }}>
            Generated at: {meta?.generated_at ? new Date(meta.generated_at).toLocaleString() : '—'}<br />
            Regions: {meta?.n_regions || '—'} · Hours: {meta?.n_hours || '—'}<br />
            Global max score: {meta?.global_max_score?.toFixed(4) || '—'}
          </div>
        </div>
        <div className="drawer-section">
          <div className="section-label">{t('forecastFields')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="badge badge-stat"><span>score</span> raw model output</div>
            <div className="badge badge-stat"><span>probability</span> calibrated alert likelihood (0–1)</div>
            <div className="badge badge-stat"><span>binary</span> alert flag (true if probability ≥ 0.5)</div>
          </div>
        </div>
        <div className="drawer-section">
          <div className="section-label">{t('importantInfo')}</div>
          <div className="no-alert-text" style={{ color: 'var(--text-secondary)' }}>
            • Red pulsing waves = binary alert active for current hour<br />
            • Luhansk & Crimea always show 99%+ probability as regions under full occupation and with open-ended alerts<br />
            • Propability percentage is relative to daily global max score<br />
            • This is a purely learning/research project<br />
            • Sources used to predict alerts: Telegram, Reddit, ISW, OpenMeteo, alert history<br />
            • Alerts data provider: https://alerts.in.ua/
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
            <span>⚡ {t('developedBy')}</span>
            <span style={{ 
              background: 'linear-gradient(135deg, #e8d5a3, #c0a06b)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              fontWeight: 600,
              fontSize: '12px'
            }}>Gabella Enterprise</span>
            <span>{t('withSupportFrom')}</span>
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