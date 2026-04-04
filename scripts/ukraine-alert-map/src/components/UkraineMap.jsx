import { useMemo } from 'react';
import { geoPath, geoMercator } from 'd3-geo';
import { UKRAINE_GEOJSON, REGION_NAME_MAP } from '../data/ukraineRegions';
import { probToColor } from '../utils/colors';

const W = 850, H = 560;
const SKIP_REGIONS = new Set(['Sevastopol']);

const CENTROID_OVERRIDE = {
  'Kyiv': { dx: -10, dy: 20 },
  'Odesa': { dx: 25, dy: 0 },
  'Rivne': { dx: 12, dy: 0 },
  'Ternopil': { dx: -7, dy: 0 },
  'Sumy': { dx: -7, dy: 15 },
  'Cherkasy': { dx: -7, dy: 10 },
};

function AlertWave({ cx, cy }) {
  return (
    <g style={{ pointerEvents: 'none' }}>
      <circle cx={cx} cy={cy} r={5} fill="none" stroke="#ff2200" strokeWidth="2"
        style={{ animation: 'wave1 1.8s ease-out infinite' }} />
      <circle cx={cx} cy={cy} r={5} fill="none" stroke="#ff6600" strokeWidth="1.5"
        style={{ animation: 'wave1 1.8s ease-out infinite 0.5s' }} />
      <circle cx={cx} cy={cy} r={5} fill="none" stroke="#ffaa00" strokeWidth="1"
        style={{ animation: 'wave1 1.8s ease-out infinite 1s' }} />
      <circle cx={cx} cy={cy} r="4" fill="#ff2200" opacity="1" />
      <circle cx={cx} cy={cy} r="2.5" fill="#ff8844" opacity="1" />
    </g>
  );
}

function buildLines(nameUa) {
  if (nameUa.includes('Автономна Республіка')) return ['Авт. Респ.', 'Крим'];
  if (nameUa === 'Київ' || nameUa === 'місто Київ') return ['Київ'];
  const base = nameUa.replace(' область', '');
  return [base, 'область'];
}

export default function UkraineMap({ regions, orderedTimestamps, currentHour, selectedRegion, onRegionClick }) {
  const currentTs = orderedTimestamps[currentHour];
  const pathGenerator = useMemo(() => {
    const projection = geoMercator().fitSize([W, H], UKRAINE_GEOJSON);
    return geoPath().projection(projection);
  }, []);

  const regionPaths = useMemo(() => {
    return UKRAINE_GEOJSON.features
      .filter(feature => !SKIP_REGIONS.has(feature.properties.NAME_EN))
      .map(feature => {
        const nameEn = feature.properties.NAME_EN;
        const name = REGION_NAME_MAP[nameEn];
        if (!name) return null;
        const path = pathGenerator(feature);
        const rawCentroid = pathGenerator.centroid(feature);
        const override = CENTROID_OVERRIDE[nameEn];
        const centroid = override ? [rawCentroid[0] + (override.dx || 0), rawCentroid[1] + (override.dy || 0)] : rawCentroid;
        return { name, nameEn, nameUa: feature.properties.NAME_1, path, centroid };
      }).filter(Boolean);
  }, [pathGenerator]);

  return (
    <div className="map-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        <style>{`
          @keyframes wave1 {
            0%   { r: 5;  opacity: 1; }
            100% { r: 32; opacity: 0; }
          }
        `}</style>
        {regionPaths.map(({ name, path, centroid, nameUa }) => {
          const regionData = regions[name];
          const p = regionData?.[currentTs?.key]?.probability ?? 0.05;
          const isSelected = selectedRegion === name;
          const hasAlertNow = regionData?.[currentTs?.key]?.binary === true;
          const lines = buildLines(nameUa);
          const lineH = 10;
          const totalH = lines.length * lineH;
          const startY = centroid[1] - totalH / 2 + lineH / 2;
          return (
            <g key={name}>
              <path
                d={path}
                fill={probToColor(p)}
                stroke={isSelected ? '#ffffff' : '#0d0d18'}
                strokeWidth={isSelected ? 2 : 0.8}
                style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                onClick={() => onRegionClick(name)}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              />
              {hasAlertNow && <AlertWave cx={centroid[0]} cy={centroid[1]} />}
              {lines.map((line, i) => (
                <text
                  key={i}
                  x={centroid[0]}
                  y={startY + i * lineH}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="9"
                  fontFamily="'DM Mono', monospace"
                  fill="rgba(255,255,255,0.65)"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {line}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
      <div className="legend">
        <span className="legend-label">0%</span>
        <div className="legend-bar" />
        <span className="legend-label">100%</span>
      </div>
    </div>
  );
}