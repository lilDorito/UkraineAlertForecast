import { useState, useEffect, useRef, useCallback } from 'react';
import UkraineMap from './components/UkraineMap';
import RegionDrawer from './components/RegionDrawer';
import HeatmapBar from './components/HeatmapBar';
import InfoDrawer from './components/InfoDrawer';
import { useForecast } from './hooks/useForecast';
import './App.css';

export default function App() {
  const { regions, orderedTimestamps, meta } = useForecast();
  const [currentHour, setCurrentHour] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setCurrentHour(h => (h + 1) % 24);
      }, 550);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [playing]);

  const handleRegionClick = useCallback((name) => setSelectedRegion(name), []);
  const handleClose = useCallback(() => setSelectedRegion(null), []);

  const generatedAt = meta?.generated_at
    ? new Date(meta.generated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

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