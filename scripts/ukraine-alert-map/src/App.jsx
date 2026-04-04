import { useState, useEffect, useRef, useCallback } from 'react';
import UkraineMap from './components/UkraineMap';
import RegionDrawer from './components/RegionDrawer';
import HeatmapBar from './components/HeatmapBar';
import InfoDrawer from './components/InfoDrawer';
import StatusPanel from './components/StatusPanel';
import { useForecast } from './hooks/useForecast';
import './App.css';

export default function App() {
  const { regions, orderedTimestamps, meta, loading, error } = useForecast();
  const [currentHour, setCurrentHour] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const timerRef = useRef(null);

  // Автоперегляд тільки коли дані завантажені
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
  const generatedAt = meta?.generated_at
    ? new Date(meta.generated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  // Стан завантаження
  if (loading) {
    return (
      <div className="app">
        <div className="header">
          <div className="title-block">
            <span className="title-text">Ukraine Alert Forecast</span>
            <span className="title-dot" />
            <span className="title-meta">Loading...</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <div className="badge-stat" style={{ padding: '20px' }}>Завантаження даних прогнозу...</div>
        </div>
      </div>
    );
  }

  // Помилка
  if (error) {
    return (
      <div className="app">
        <div className="header">
          <div className="title-block">
            <span className="title-text">Ukraine Alert Forecast</span>
            <span className="title-dot" />
            <span className="title-meta">Error</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#ff7070' }}>
          <div className="badge-alert" style={{ padding: '20px' }}>
            Помилка завантаження: {error}<br />
            Спробуйте оновити сторінку
          </div>
        </div>
      </div>
    );
  }

  // Якщо дані ще не готові (запасний варіант)
  if (!regions || !orderedTimestamps || orderedTimestamps.length === 0) {
    return null;
  }

  return (
    <div className="app">
      <div className="header">
        <div className="title-block">
          <span className="title-text">Ukraine Alert Forecast</span>
          <span className="title-dot" />
          <span className="title-meta">24h window (Kyiv local time)</span>
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
            ℹ️ Info
          </button>
          <div className="generated">Generated {generatedAt}</div>
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