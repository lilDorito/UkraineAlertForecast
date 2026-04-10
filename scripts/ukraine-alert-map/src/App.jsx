// src/App.jsx
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import UkraineMap from './components/UkraineMap';
import RegionDrawer from './components/RegionDrawer';
import HeatmapBar from './components/HeatmapBar';
import InfoDrawer from './components/InfoDrawer';
import StatusPanel from './components/StatusPanel';
import { useForecast } from './hooks/useForecast';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import './App.css';

function AppContent() {
  const { regions, orderedTimestamps, meta, loading, error } = useForecast();
  const { t, language, setLanguage } = useLanguage();
  const [currentHour, setCurrentHour] = useState(0);

  useEffect(() => {
    if (orderedTimestamps?.length) {
      const kyivHour = parseInt(
        new Intl.DateTimeFormat('en-US', {
          timeZone: 'Europe/Kyiv',
          hour: 'numeric',
          hour12: false
        }).format(new Date()),
        10
      );
      const idx = orderedTimestamps.findIndex(ts => ts.hour === kyivHour);
      setCurrentHour(idx !== -1 ? idx : 0);
    }
  }, [orderedTimestamps]);

  const [selectedRegion, setSelectedRegion] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (playing && orderedTimestamps) {
      timerRef.current = setInterval(() => {
        setCurrentHour(h => (h + 1) % 24);
      }, 2000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, orderedTimestamps]);

  const handleRegionClick = useCallback((name) => setSelectedRegion(name), []);
  const handleClose = useCallback(() => setSelectedRegion(null), []);
  const forecastDateRange = useMemo(() => {
    if (!orderedTimestamps?.length) return '—';
    const first = new Date(orderedTimestamps[0].key);
    const last = new Date(orderedTimestamps[orderedTimestamps.length - 1].key);
    const fmt = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'Europe/Kyiv' });
    const firstDate = fmt(first);
    const lastDate = fmt(last);
    if (firstDate === lastDate) return `${firstDate} · ${orderedTimestamps[0].label} – ${orderedTimestamps[orderedTimestamps.length - 1].label}`;
    return `${firstDate} ${orderedTimestamps[0].label} – ${lastDate} ${orderedTimestamps[orderedTimestamps.length - 1].label}`;
  }, [orderedTimestamps]);

  if (loading) {
    return (
      <div className="app">
        <div className="header">
          <div className="title-block">
            <span className="title-text">{t('appTitle')}</span>
            <span className="title-dot" />
            <span className="title-meta">{t('windowDesc')}</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <div className="badge-stat" style={{ padding: '20px' }}>{t('loading')}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="header">
          <div className="title-block">
            <span className="title-text">{t('appTitle')}</span>
            <span className="title-dot" />
            <span className="title-meta">{t('windowDesc')}</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#ff7070' }}>
          <div className="badge-alert" style={{ padding: '20px' }}>
            {t('error')}: {error}<br />
            {t('tryReload')}
          </div>
        </div>
      </div>
    );
  }

  if (!regions || !orderedTimestamps || orderedTimestamps.length === 0) {
    return null;
  }

  return (
    <div className="app">
      <div className="header">
        <div className="title-block">
          <span className="title-text">{t('appTitle')}</span>
          <span className="title-dot" />
          <span className="title-meta">{t('windowDesc')}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setInfoOpen(true)}
            style={{
              background: 'none',
              border: '0.5px solid var(--border-light)',
              borderRadius: '20px',
              padding: '4px 10px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            {t('info')}
          </button>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              border: '0.5px solid var(--border-light)',
              borderRadius: '20px',
              padding: '4px 10px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            <option value="en">EN</option>
            <option value="ua">UA</option>
          </select>
          <div className="generated">{t('generated')} {forecastDateRange}</div>
        </div>
      </div>

      <UkraineMap
        regions={regions}
        orderedTimestamps={orderedTimestamps}
        currentHour={currentHour}
        selectedRegion={selectedRegion}
        onRegionClick={handleRegionClick}
      />

      <HeatmapBar
        regions={regions}
        orderedTimestamps={orderedTimestamps}
        currentHour={currentHour}
        onHourChange={setCurrentHour}
      />

      <div className="play-row">
        <button className="play-btn" onClick={() => setPlaying(p => !p)}>
          {playing ? '⏸' : '▶'}
        </button>
        <span className="time-disp">{orderedTimestamps[currentHour]?.label}</span>
        <input
          type="range"
          className="tslider"
          min={0}
          max={23}
          value={currentHour}
          onChange={e => setCurrentHour(parseInt(e.target.value))}
        />
      </div>

      <StatusPanel />

      <RegionDrawer
        region={selectedRegion}
        regionData={selectedRegion ? regions[selectedRegion] : null}
        orderedTimestamps={orderedTimestamps}
        currentHour={currentHour}
        onClose={handleClose}
      />

      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} meta={meta} />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}