import { probToColor } from '../utils/colors';

export default function HeatmapBar({ regions, orderedTimestamps, currentHour, onHourChange }) {
  const regionNames = Object.keys(regions);

  const avgProbs = orderedTimestamps.map(ts => {
    const vals = regionNames.map(r => regions[r][ts.key]?.probability ?? 0);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  });

  const labelIndices = [0, 4, 8, 12, 16, 20]; // 06:00, 10:00, 14:00, 18:00, 22:00, 02:00 Kyiv time
  const labels = labelIndices.map(i => orderedTimestamps[i]?.label || '');

  return (
    <div className="heatmap-bar">
      <div className="heatmap-label">Hourly avg intensity · click or drag to jump</div>
      <div className="hm-cells">
        {avgProbs.map((p, i) => (
          <div
            key={i}
            className={`hm-cell${i === currentHour ? ' active' : ''}`}
            style={{ background: probToColor(p) }}
            title={`${orderedTimestamps[i].label} · ${Math.round(p * 100)}%`}
            onClick={() => onHourChange(i)}
          />
        ))}
      </div>
      <div className="hm-times">
        {labels.map((label, idx) => (
          <span key={idx}>{label}</span>
        ))}
      </div>
    </div>
  );
}