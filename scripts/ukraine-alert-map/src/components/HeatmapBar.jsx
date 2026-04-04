import { probToColor } from '../utils/colors';

export default function HeatmapBar({ regions, orderedTimestamps, currentHour, onHourChange }) {
  const regionNames = Object.keys(regions);

  const avgProbs = orderedTimestamps.map(ts => {
    const vals = regionNames.map(r => regions[r][ts.key]?.probability ?? 0);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  });

  // Індекси для міток: 0, 4, 8, 12, 16, 20
  const labelIndices = [0, 4, 8, 12, 16, 20];
  const labels = labelIndices.map(i => orderedTimestamps[i]?.label || '');

  return (
    <div className="heatmap-bar">
      <div className="heatmap-label">Hourly avg intensity · click or drag to jump</div>
      <div className="hm-cells" style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: '2px' }}>
        {avgProbs.map((p, i) => (
          <div
            key={i}
            className={`hm-cell${i === currentHour ? ' active' : ''}`}
            style={{ background: probToColor(p), height: '24px', borderRadius: '3px', cursor: 'pointer' }}
            title={`${orderedTimestamps[i].label} · ${Math.round(p * 100)}%`}
            onClick={() => onHourChange(i)}
          />
        ))}
      </div>
      <div className="hm-times" style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', marginTop: '4px' }}>
        {avgProbs.map((_, i) => (
          <span key={i} style={{ fontSize: '9px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
            {labelIndices.includes(i) ? orderedTimestamps[i]?.label : ''}
          </span>
        ))}
      </div>
    </div>
  );
}